// Type definitions for Vulnerix - No mock data

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
  organization?: string;
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

// Sample template data for downloads only
export const sampleTemplateData = [
  { "Sr No.": 1, "Vendor Name": "Apache", "Product Name": "Log4j", "Product Version": "2.14.1", "Email ID": "security@example.com" },
  { "Sr No.": 2, "Vendor Name": "Oracle", "Product Name": "MySQL", "Product Version": "8.0.28", "Email ID": "admin@example.com" },
];

// Helper to map DB result to Advisory format
export const mapTechStackResultToAdvisory = (result: any): Advisory => ({
  lastModified: result.created_at || new Date().toISOString(),
  cve_id: result.cve_match || '',
  Description: `Vulnerability found in ${result.product_name} version ${result.version}`,
  cpe_value: `cpe:2.3:a:${result.vendor.toLowerCase()}:${result.product_name.toLowerCase()}:${result.version}:*:*:*:*:*:*:*`,
  tech_stack_vendor: result.vendor,
  tech_stack_product: result.product_name,
  tech_stack_version: result.version || '',
  match_status: result.cve_match ? 'Vulnerable' : 'Unknown',
  cvss_score: getSeverityScore(result.severity_cve),
  Severity: (result.severity_cve as 'Critical' | 'High' | 'Medium' | 'Low') || 'Low',
  attack_vector: 'Network',
  Vulnerability_Status: 'Active',
  cvin_id: result.cert_in || '',
  cvin_severity: result.severity_cert_in || '',
  Reference_URL: result.cve_match ? `https://nvd.nist.gov/vuln/detail/${result.cve_match}` : '',
  organization: result.org_name,
  email_to: result.email_id
});

const getSeverityScore = (severity: string | null): number => {
  switch (severity) {
    case 'Critical': return 9.5;
    case 'High': return 7.5;
    case 'Medium': return 5.5;
    case 'Low': return 3.0;
    default: return 0;
  }
};

// Helper to map DB tech_stack to TechStack format
export const mapDbTechStack = (row: any, index: number): TechStack => ({
  id: row.id,
  srNo: index + 1,
  organization: row.org_name,
  vendorName: row.vendor,
  productName: row.product_name,
  productVersion: row.version || '',
  emailId: row.email_id,
  uploadedAt: row.created_at || new Date().toISOString()
});
