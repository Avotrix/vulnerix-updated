import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SplunkAdvisory {
  lastModified: string;
  cve_id: string;
  Description: string;
  cpe_value: string;
  tech_stack_vendor: string;
  tech_stack_product: string;
  tech_stack_version: string;
  versionStartIncluding?: string;
  versionStartExcluding?: string;
  versionEndIncluding?: string;
  versionEndExcluding?: string;
  match_status: string;
  cvss_score: number;
  Severity: string;
  attack_vector: string;
  Vulnerability_Status: string;
  civn_id?: string;
  civn_title?: string;
  civn_severity?: string;
  civn_risk_assessment?: string;
  civn_software_affected?: string;
  civn_url?: string;
  Reference_URL: string;
  organization: string;
  email_to: string;
}

interface SplunkSearchResponse {
  results?: SplunkAdvisory[];
  messages?: Array<{ type: string; text: string }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client to verify user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userEmail = user.email;
    console.log(`[Splunk] Fetching advisories for user: ${userEmail}`);

    // Get Splunk configuration
    const splunkHecUrl = Deno.env.get("SPLUNK_HEC_URL");
    const splunkToken = Deno.env.get("SPLUNK_TOKEN");
    const splunkSavedSearch = Deno.env.get("SPLUNK_SAVED_SEARCH");

    if (!splunkHecUrl || !splunkToken || !splunkSavedSearch) {
      console.error("[Splunk] Missing configuration");
      return new Response(
        JSON.stringify({ error: "Splunk configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Construct Splunk search API URL
    // For saved searches, typically: /servicesNS/<owner>/search/saved/searches/<name>/dispatch
    // Or for direct results: /services/search/jobs/export
    const searchUrl = `${splunkHecUrl}/services/saved/searches/${encodeURIComponent(splunkSavedSearch)}/dispatch`;
    
    console.log(`[Splunk] Dispatching saved search: ${splunkSavedSearch}`);

    // Dispatch the saved search
    const dispatchResponse = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${splunkToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "output_mode": "json",
        // Filter by user's email if the search supports it
        "args.email_filter": userEmail || "",
      }),
    });

    if (!dispatchResponse.ok) {
      const errorText = await dispatchResponse.text();
      console.error(`[Splunk] Dispatch failed: ${dispatchResponse.status}`, errorText);
      
      // Fallback: Try direct search endpoint
      return await fetchDirectSearch(splunkHecUrl, splunkToken, splunkSavedSearch, userEmail || "", corsHeaders);
    }

    const dispatchData = await dispatchResponse.json();
    const jobSid = dispatchData.sid;
    
    if (!jobSid) {
      console.error("[Splunk] No job SID returned");
      return await fetchDirectSearch(splunkHecUrl, splunkToken, splunkSavedSearch, userEmail || "", corsHeaders);
    }

    console.log(`[Splunk] Job dispatched with SID: ${jobSid}`);

    // Poll for job completion
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max wait
    let isComplete = false;

    while (!isComplete && attempts < maxAttempts) {
      const statusResponse = await fetch(
        `${splunkHecUrl}/services/search/jobs/${jobSid}?output_mode=json`,
        {
          headers: {
            "Authorization": `Bearer ${splunkToken}`,
          },
        }
      );

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        const dispatchState = statusData.entry?.[0]?.content?.dispatchState;
        isComplete = dispatchState === "DONE" || dispatchState === "FINALIZED";
        
        if (!isComplete) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
      } else {
        break;
      }
    }

    // Fetch results
    const resultsResponse = await fetch(
      `${splunkHecUrl}/services/search/jobs/${jobSid}/results?output_mode=json&count=0`,
      {
        headers: {
          "Authorization": `Bearer ${splunkToken}`,
        },
      }
    );

    if (!resultsResponse.ok) {
      const errorText = await resultsResponse.text();
      console.error(`[Splunk] Results fetch failed: ${resultsResponse.status}`, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch Splunk results", advisories: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resultsData: SplunkSearchResponse = await resultsResponse.json();
    const advisories = resultsData.results || [];

    // Filter advisories for user's organization/email if not already filtered by Splunk
    const userAdvisories = advisories.filter(a => 
      !a.email_to || a.email_to === userEmail
    );

    console.log(`[Splunk] Returning ${userAdvisories.length} advisories for user`);

    return new Response(
      JSON.stringify({
        success: true,
        advisories: userAdvisories,
        count: userAdvisories.length,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Splunk] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error",
        advisories: []
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Fallback: Direct search results fetch
async function fetchDirectSearch(
  splunkUrl: string, 
  token: string, 
  searchName: string,
  userEmail: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    console.log("[Splunk] Attempting direct search results fetch");
    
    // Try fetching saved search results directly
    const directUrl = `${splunkUrl}/servicesNS/nobody/search/saved/searches/${encodeURIComponent(searchName)}/history?output_mode=json`;
    
    const historyResponse = await fetch(directUrl, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!historyResponse.ok) {
      // Return empty results gracefully
      return new Response(
        JSON.stringify({
          success: true,
          advisories: [],
          count: 0,
          message: "No Splunk data available",
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const historyData = await historyResponse.json();
    const latestJob = historyData.entry?.[0];
    
    if (!latestJob) {
      return new Response(
        JSON.stringify({
          success: true,
          advisories: [],
          count: 0,
          message: "No recent search results",
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch results from the latest job
    const resultsUrl = `${latestJob.links?.results}?output_mode=json&count=0`;
    const resultsResponse = await fetch(resultsUrl, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (resultsResponse.ok) {
      const resultsData: SplunkSearchResponse = await resultsResponse.json();
      const advisories = (resultsData.results || []).filter(a => 
        !a.email_to || a.email_to === userEmail
      );

      return new Response(
        JSON.stringify({
          success: true,
          advisories,
          count: advisories.length,
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        advisories: [],
        count: 0,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Splunk] Direct search error:", error);
    return new Response(
      JSON.stringify({
        success: true,
        advisories: [],
        count: 0,
        error: "Splunk connection issue",
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
