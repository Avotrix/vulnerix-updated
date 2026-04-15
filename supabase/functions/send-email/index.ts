import { corsHeaders } from '@supabase/supabase-js/cors'

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, html }: EmailRequest = await req.json();

    // Validate input
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const smtpHost = Deno.env.get('SMTP_HOST');
    const smtpPort = Deno.env.get('SMTP_PORT') || '587';
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');
    const smtpFrom = Deno.env.get('SMTP_FROM_EMAIL');

    if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
      console.error('Missing SMTP configuration environment variables');
      return new Response(
        JSON.stringify({ error: 'SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the email MIME message
    const boundary = `----=_Part_${crypto.randomUUID()}`;
    const emailMessage = [
      `From: Vulnerix <${smtpFrom}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      ``,
      subject,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      html,
      ``,
      `--${boundary}--`,
    ].join('\r\n');

    // Convert to base64 for SMTP DATA command
    const encoder = new TextEncoder();

    // Connect via TCP to SMTP server
    const port = parseInt(smtpPort);
    const useTLS = port === 465;

    let conn: Deno.TcpConn | Deno.TlsConn;

    if (useTLS) {
      // Direct TLS (port 465)
      conn = await Deno.connectTls({ hostname: smtpHost, port });
    } else {
      // Plain connection first, then STARTTLS (port 587/25)
      conn = await Deno.connect({ hostname: smtpHost, port });
    }

    const reader = conn.readable.getReader();
    const writer = conn.writable.getWriter();

    // Helper to read SMTP response
    async function readResponse(): Promise<string> {
      const { value } = await reader.read();
      if (!value) throw new Error('Connection closed unexpectedly');
      return new TextDecoder().decode(value);
    }

    // Helper to send SMTP command
    async function sendCommand(cmd: string): Promise<string> {
      await writer.write(encoder.encode(cmd + '\r\n'));
      return await readResponse();
    }

    // Read server greeting
    const greeting = await readResponse();
    console.log('SMTP Greeting:', greeting);

    // EHLO
    let ehloResp = await sendCommand(`EHLO vulnerix.local`);
    console.log('EHLO:', ehloResp);

    // STARTTLS for port 587
    if (!useTLS && ehloResp.includes('STARTTLS')) {
      await sendCommand('STARTTLS');
      
      // Upgrade connection to TLS
      reader.releaseLock();
      writer.releaseLock();
      
      conn = await Deno.startTls(conn as Deno.TcpConn, { hostname: smtpHost });
      
      const tlsReader = conn.readable.getReader();
      const tlsWriter = conn.writable.getWriter();
      
      // Reassign helpers for TLS connection
      const readTlsResponse = async (): Promise<string> => {
        const { value } = await tlsReader.read();
        if (!value) throw new Error('TLS connection closed');
        return new TextDecoder().decode(value);
      };
      
      const sendTlsCommand = async (cmd: string): Promise<string> => {
        await tlsWriter.write(encoder.encode(cmd + '\r\n'));
        return await readTlsResponse();
      };

      // Re-EHLO after STARTTLS
      ehloResp = await sendTlsCommand('EHLO vulnerix.local');

      // AUTH LOGIN
      let authResp = await sendTlsCommand('AUTH LOGIN');
      console.log('AUTH:', authResp);
      
      authResp = await sendTlsCommand(btoa(smtpUser));
      authResp = await sendTlsCommand(btoa(smtpPass));

      if (!authResp.startsWith('235')) {
        throw new Error(`SMTP Auth failed: ${authResp}`);
      }

      // MAIL FROM
      await sendTlsCommand(`MAIL FROM:<${smtpFrom}>`);
      // RCPT TO
      await sendTlsCommand(`RCPT TO:<${to}>`);
      // DATA
      await sendTlsCommand('DATA');
      // Send email body (end with \r\n.\r\n)
      const dataResp = await sendTlsCommand(emailMessage + '\r\n.');

      if (!dataResp.startsWith('250')) {
        throw new Error(`Failed to send email: ${dataResp}`);
      }

      await sendTlsCommand('QUIT');
      tlsReader.releaseLock();
      tlsWriter.releaseLock();
    } else {
      // Direct TLS path (port 465) - already in TLS
      // AUTH LOGIN
      let authResp = await sendCommand('AUTH LOGIN');
      authResp = await sendCommand(btoa(smtpUser));
      authResp = await sendCommand(btoa(smtpPass));

      if (!authResp.startsWith('235')) {
        throw new Error(`SMTP Auth failed: ${authResp}`);
      }

      await sendCommand(`MAIL FROM:<${smtpFrom}>`);
      await sendCommand(`RCPT TO:<${to}>`);
      await sendCommand('DATA');
      const dataResp = await sendCommand(emailMessage + '\r\n.');

      if (!dataResp.startsWith('250')) {
        throw new Error(`Failed to send email: ${dataResp}`);
      }

      await sendCommand('QUIT');
      reader.releaseLock();
      writer.releaseLock();
    }

    conn.close();

    console.log(`Email sent successfully to ${to}`);
    return new Response(
      JSON.stringify({ success: true, message: `Email sent to ${to}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Email send error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
