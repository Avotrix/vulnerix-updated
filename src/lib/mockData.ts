// Mock data for Vulnerix

export interface Advisory {
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
  Severity: 'Critical' | 'High' | 'Medium' | 'Low';
  attack_vector: string;
  Vulnerability_Status: string;
  cvin_id?: string;
  cvin_title?: string;
  cvin_severity?: string;
  cvin_risk_assessment?: string;
  cvin_software_affected?: string;
  cvin_url?: string;
  Reference_URL: string;
  organization: string;
  email_to: string;
}

export interface TechStack {
  id: string;
  srNo: number;
  vendorName: string;
  productName: string;
  productVersion: string;
  emailId: string;
  uploadedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  organization: string;
  createdAt: string;
  isNewUser: boolean;
}

export const mockAdvisories: Advisory[] = [
  {
    lastModified: "2024-12-20T10:30:00Z",
    cve_id: "CVE-2024-1234",
    Description: "A critical remote code execution vulnerability in Apache Log4j allows attackers to execute arbitrary code on affected systems through crafted log messages.",
    cpe_value: "cpe:2.3:a:apache:log4j:2.14.1:*:*:*:*:*:*:*",
    tech_stack_vendor: "Apache",
    tech_stack_product: "Log4j",
    tech_stack_version: "2.14.1",
    versionStartIncluding: "2.0",
    versionEndExcluding: "2.17.0",
    match_status: "Vulnerable",
    cvss_score: 10.0,
    Severity: "Critical",
    attack_vector: "Network",
    Vulnerability_Status: "Active",
    cvin_id: "CVIN-2024-001",
    cvin_title: "Log4Shell Vulnerability",
    cvin_severity: "Critical",
    cvin_risk_assessment: "High risk - immediate patching required",
    cvin_software_affected: "Apache Log4j 2.0 - 2.16.0",
    cvin_url: "https://nvd.nist.gov/vuln/detail/CVE-2024-1234",
    Reference_URL: "https://logging.apache.org/log4j/2.x/security.html",
    organization: "Acme Corp",
    email_to: "security@acme.com"
  },
  {
    lastModified: "2024-12-19T14:20:00Z",
    cve_id: "CVE-2024-5678",
    Description: "SQL injection vulnerability in MySQL Connector/J allows remote attackers to execute arbitrary SQL commands via crafted connection strings.",
    cpe_value: "cpe:2.3:a:oracle:mysql_connector_j:8.0.28:*:*:*:*:*:*:*",
    tech_stack_vendor: "Oracle",
    tech_stack_product: "MySQL Connector/J",
    tech_stack_version: "8.0.28",
    versionEndIncluding: "8.0.30",
    match_status: "Vulnerable",
    cvss_score: 8.1,
    Severity: "High",
    attack_vector: "Network",
    Vulnerability_Status: "Active",
    cvin_id: "",
    Reference_URL: "https://www.oracle.com/security-alerts/",
    organization: "TechStart Inc",
    email_to: "admin@techstart.io"
  },
  {
    lastModified: "2024-12-18T09:15:00Z",
    cve_id: "CVE-2024-9012",
    Description: "Cross-site scripting (XSS) vulnerability in React allows attackers to inject malicious scripts through unsanitized user input in dangerouslySetInnerHTML.",
    cpe_value: "cpe:2.3:a:facebook:react:17.0.2:*:*:*:*:*:*:*",
    tech_stack_vendor: "Facebook",
    tech_stack_product: "React",
    tech_stack_version: "17.0.2",
    versionStartIncluding: "16.0.0",
    versionEndExcluding: "18.0.0",
    match_status: "Potentially Vulnerable",
    cvss_score: 6.1,
    Severity: "Medium",
    attack_vector: "Network",
    Vulnerability_Status: "Mitigated",
    cvin_id: "CVIN-2024-042",
    cvin_title: "React XSS via dangerouslySetInnerHTML",
    cvin_severity: "Medium",
    cvin_risk_assessment: "Moderate risk - code review recommended",
    cvin_software_affected: "React 16.x - 17.x",
    cvin_url: "https://reactjs.org/docs/security.html",
    Reference_URL: "https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml",
    organization: "DevOps Solutions",
    email_to: "dev@devops.com"
  },
  {
    lastModified: "2024-12-17T16:45:00Z",
    cve_id: "CVE-2024-3456",
    Description: "Information disclosure vulnerability in Nginx allows remote attackers to obtain sensitive information via specially crafted HTTP requests.",
    cpe_value: "cpe:2.3:a:nginx:nginx:1.21.0:*:*:*:*:*:*:*",
    tech_stack_vendor: "Nginx",
    tech_stack_product: "Nginx",
    tech_stack_version: "1.21.0",
    versionEndExcluding: "1.23.0",
    match_status: "Vulnerable",
    cvss_score: 5.3,
    Severity: "Medium",
    attack_vector: "Network",
    Vulnerability_Status: "Active",
    Reference_URL: "https://nginx.org/en/security_advisories.html",
    organization: "CloudHost Ltd",
    email_to: "ops@cloudhost.net"
  },
  {
    lastModified: "2024-12-16T11:30:00Z",
    cve_id: "CVE-2024-7890",
    Description: "Denial of service vulnerability in Node.js HTTP/2 implementation allows attackers to cause resource exhaustion through rapid stream creation.",
    cpe_value: "cpe:2.3:a:nodejs:node.js:18.0.0:*:*:*:*:*:*:*",
    tech_stack_vendor: "Node.js",
    tech_stack_product: "Node.js",
    tech_stack_version: "18.0.0",
    versionStartIncluding: "16.0.0",
    versionEndIncluding: "18.12.0",
    match_status: "Vulnerable",
    cvss_score: 7.5,
    Severity: "High",
    attack_vector: "Network",
    Vulnerability_Status: "Active",
    cvin_id: "CVIN-2024-078",
    cvin_title: "Node.js HTTP/2 DoS",
    cvin_severity: "High",
    cvin_risk_assessment: "High risk - update recommended",
    cvin_software_affected: "Node.js 16.x - 18.12.x",
    cvin_url: "https://nodejs.org/en/blog/vulnerability/",
    Reference_URL: "https://nodejs.org/en/blog/vulnerability/",
    organization: "API Solutions",
    email_to: "team@apisolutions.com"
  },
  {
    lastModified: "2024-12-15T08:00:00Z",
    cve_id: "CVE-2024-2345",
    Description: "Buffer overflow vulnerability in OpenSSL allows remote attackers to execute arbitrary code via malformed TLS handshake messages.",
    cpe_value: "cpe:2.3:a:openssl:openssl:3.0.7:*:*:*:*:*:*:*",
    tech_stack_vendor: "OpenSSL",
    tech_stack_product: "OpenSSL",
    tech_stack_version: "3.0.7",
    versionStartExcluding: "3.0.0",
    versionEndExcluding: "3.0.8",
    match_status: "Vulnerable",
    cvss_score: 9.8,
    Severity: "Critical",
    attack_vector: "Network",
    Vulnerability_Status: "Active",
    cvin_id: "CVIN-2024-012",
    cvin_title: "OpenSSL Buffer Overflow",
    cvin_severity: "Critical",
    cvin_risk_assessment: "Critical risk - immediate action required",
    cvin_software_affected: "OpenSSL 3.0.x < 3.0.8",
    cvin_url: "https://www.openssl.org/news/vulnerabilities.html",
    Reference_URL: "https://www.openssl.org/news/vulnerabilities.html",
    organization: "SecureNet",
    email_to: "alert@securenet.io"
  },
  {
    lastModified: "2024-12-14T13:20:00Z",
    cve_id: "CVE-2024-4567",
    Description: "Authentication bypass vulnerability in PostgreSQL allows attackers to gain unauthorized access through crafted connection parameters.",
    cpe_value: "cpe:2.3:a:postgresql:postgresql:14.5:*:*:*:*:*:*:*",
    tech_stack_vendor: "PostgreSQL",
    tech_stack_product: "PostgreSQL",
    tech_stack_version: "14.5",
    versionEndExcluding: "14.6",
    match_status: "Vulnerable",
    cvss_score: 8.6,
    Severity: "High",
    attack_vector: "Network",
    Vulnerability_Status: "Active",
    Reference_URL: "https://www.postgresql.org/support/security/",
    organization: "DataCore",
    email_to: "dba@datacore.com"
  },
  {
    lastModified: "2024-12-13T10:10:00Z",
    cve_id: "CVE-2024-6789",
    Description: "Path traversal vulnerability in Express.js static file middleware allows attackers to read arbitrary files from the server.",
    cpe_value: "cpe:2.3:a:expressjs:express:4.17.1:*:*:*:*:*:*:*",
    tech_stack_vendor: "Express.js",
    tech_stack_product: "Express",
    tech_stack_version: "4.17.1",
    match_status: "Potentially Vulnerable",
    cvss_score: 3.7,
    Severity: "Low",
    attack_vector: "Network",
    Vulnerability_Status: "Mitigated",
    cvin_id: "CVIN-2024-099",
    cvin_title: "Express Path Traversal",
    cvin_severity: "Low",
    cvin_risk_assessment: "Low risk - configuration review",
    cvin_software_affected: "Express 4.x",
    cvin_url: "https://expressjs.com/en/advanced/security-updates.html",
    Reference_URL: "https://expressjs.com/en/advanced/security-updates.html",
    organization: "WebApp Co",
    email_to: "dev@webapp.co"
  },
  {
    lastModified: "2024-12-12T15:45:00Z",
    cve_id: "CVE-2024-8901",
    Description: "Privilege escalation vulnerability in Docker Engine allows container escape and host system access.",
    cpe_value: "cpe:2.3:a:docker:docker:20.10.17:*:*:*:*:*:*:*",
    tech_stack_vendor: "Docker",
    tech_stack_product: "Docker Engine",
    tech_stack_version: "20.10.17",
    versionStartIncluding: "20.10.0",
    versionEndExcluding: "20.10.21",
    match_status: "Vulnerable",
    cvss_score: 9.0,
    Severity: "Critical",
    attack_vector: "Local",
    Vulnerability_Status: "Active",
    cvin_id: "CVIN-2024-055",
    cvin_title: "Docker Container Escape",
    cvin_severity: "Critical",
    cvin_risk_assessment: "Critical risk - upgrade immediately",
    cvin_software_affected: "Docker 20.10.0 - 20.10.20",
    cvin_url: "https://docs.docker.com/engine/release-notes/",
    Reference_URL: "https://docs.docker.com/engine/release-notes/",
    organization: "ContainerOps",
    email_to: "devops@containerops.io"
  },
  {
    lastModified: "2024-12-11T09:30:00Z",
    cve_id: "CVE-2024-0123",
    Description: "Memory corruption vulnerability in Redis allows remote code execution through specially crafted commands.",
    cpe_value: "cpe:2.3:a:redis:redis:7.0.5:*:*:*:*:*:*:*",
    tech_stack_vendor: "Redis",
    tech_stack_product: "Redis",
    tech_stack_version: "7.0.5",
    versionEndExcluding: "7.0.8",
    match_status: "Vulnerable",
    cvss_score: 8.8,
    Severity: "High",
    attack_vector: "Network",
    Vulnerability_Status: "Active",
    Reference_URL: "https://redis.io/docs/security/",
    organization: "CacheFirst",
    email_to: "ops@cachefirst.com"
  },
  {
    lastModified: "2024-12-10T14:00:00Z",
    cve_id: "CVE-2024-1111",
    Description: "CSRF vulnerability in Spring Security allows attackers to perform unauthorized actions on behalf of authenticated users.",
    cpe_value: "cpe:2.3:a:vmware:spring_security:5.7.0:*:*:*:*:*:*:*",
    tech_stack_vendor: "VMware",
    tech_stack_product: "Spring Security",
    tech_stack_version: "5.7.0",
    versionEndIncluding: "5.7.3",
    match_status: "Vulnerable",
    cvss_score: 4.3,
    Severity: "Medium",
    attack_vector: "Network",
    Vulnerability_Status: "Active",
    cvin_id: "CVIN-2024-033",
    cvin_title: "Spring Security CSRF Bypass",
    cvin_severity: "Medium",
    cvin_risk_assessment: "Medium risk - update when possible",
    cvin_software_affected: "Spring Security 5.7.x",
    cvin_url: "https://spring.io/security/",
    Reference_URL: "https://spring.io/security/",
    organization: "JavaEnterprise",
    email_to: "java@enterprise.com"
  },
  {
    lastModified: "2024-12-09T11:20:00Z",
    cve_id: "CVE-2024-2222",
    Description: "XML External Entity (XXE) vulnerability in Apache Xerces allows attackers to read local files and perform SSRF attacks.",
    cpe_value: "cpe:2.3:a:apache:xerces:2.12.1:*:*:*:*:*:*:*",
    tech_stack_vendor: "Apache",
    tech_stack_product: "Xerces",
    tech_stack_version: "2.12.1",
    match_status: "Vulnerable",
    cvss_score: 7.2,
    Severity: "High",
    attack_vector: "Network",
    Vulnerability_Status: "Active",
    Reference_URL: "https://xerces.apache.org/",
    organization: "XMLParsers Inc",
    email_to: "dev@xmlparsers.com"
  }
];

export const mockTechStacks: TechStack[] = [
  {
    id: "1",
    srNo: 1,
    vendorName: "Apache",
    productName: "Log4j",
    productVersion: "2.14.1",
    emailId: "security@acme.com",
    uploadedAt: "2024-12-01T10:00:00Z"
  },
  {
    id: "2",
    srNo: 2,
    vendorName: "Oracle",
    productName: "MySQL Connector/J",
    productVersion: "8.0.28",
    emailId: "admin@techstart.io",
    uploadedAt: "2024-12-01T10:00:00Z"
  },
  {
    id: "3",
    srNo: 3,
    vendorName: "Facebook",
    productName: "React",
    productVersion: "17.0.2",
    emailId: "dev@devops.com",
    uploadedAt: "2024-12-02T14:30:00Z"
  },
  {
    id: "4",
    srNo: 4,
    vendorName: "Nginx",
    productName: "Nginx",
    productVersion: "1.21.0",
    emailId: "ops@cloudhost.net",
    uploadedAt: "2024-12-03T09:15:00Z"
  },
  {
    id: "5",
    srNo: 5,
    vendorName: "Node.js",
    productName: "Node.js",
    productVersion: "18.0.0",
    emailId: "team@apisolutions.com",
    uploadedAt: "2024-12-04T16:45:00Z"
  }
];

export const sampleTemplateData = [
  { "Sr No.": 1, "Vendor Name": "Apache", "Product Name": "Log4j", "Product Version": "2.14.1", "Email ID": "security@example.com" },
  { "Sr No.": 2, "Vendor Name": "Oracle", "Product Name": "MySQL", "Product Version": "8.0.28", "Email ID": "admin@example.com" },
];
