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

// Legacy mapper removed - all advisories now come from Splunk via useSplunkAdvisories hook

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
