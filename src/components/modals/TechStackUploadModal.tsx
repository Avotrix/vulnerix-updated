import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Upload, Download, FileSpreadsheet, AlertCircle, 
  CheckCircle, Trash2, Eye, Search, ExternalLink, HelpCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { sampleTemplateData } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useTechStacks } from "@/hooks/useSupabaseData";
import { useCVEEngine } from "@/hooks/useCVEEngine";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TechStackUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  vendor: string;
  product: string;
  version: string;
  email_to?: string;
}

// New expected headers matching Sample_Tech_Stack.xlsx format
const EXPECTED_HEADERS = ["email_to", "organization", "product", "vendor", "version"];
// Also support legacy format
const LEGACY_HEADERS = ["Sr No.", "Vendor Name", "Product Name", "Product Version", "Email ID"];

const TechStackUploadModal = ({ isOpen, onClose }: TechStackUploadModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { addMultipleTechStacks } = useTechStacks();
  const { triggerEngineBackground } = useCVEEngine();
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Get organization from user metadata
  const userOrganization = user?.user_metadata?.organization || 'Default Organization';
  const userEmail = user?.email || '';

  // Filter parsed data based on search query (vendor and product name)
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return parsedData;
    const query = searchQuery.toLowerCase();
    return parsedData.filter(
      (row) =>
        row.vendor?.toLowerCase().includes(query) ||
        row.product?.toLowerCase().includes(query)
    );
  }, [parsedData, searchQuery]);

  const validateHeaders = (headers: string[]): 'new' | 'legacy' | null => {
    const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
    
    // Check for new format (from Sample_Tech_Stack.xlsx)
    const newFormatMatch = ['vendor', 'product', 'version'].every(expected => 
      normalizedHeaders.some(h => h === expected)
    );
    if (newFormatMatch) return 'new';
    
    // Check for legacy format
    const legacyMatch = ['vendor name', 'product name', 'product version'].every(expected => 
      normalizedHeaders.some(h => h === expected)
    );
    if (legacyMatch) return 'legacy';
    
    return null;
  };

  const normalizeRow = (row: any, format: 'new' | 'legacy'): ParsedRow => {
    if (format === 'new') {
      return {
        vendor: row.vendor || '',
        product: row.product || '',
        version: row.version || '',
        email_to: row.email_to || ''
      };
    }
    // Legacy format
    return {
      vendor: row["Vendor Name"] || '',
      product: row["Product Name"] || '',
      version: row["Product Version"] || '',
      email_to: row["Email ID"] || ''
    };
  };

  // Parse comma-separated emails and return array, fallback to user email if empty
  const parseEmails = (emailString: string | undefined): string[] => {
    if (!emailString || emailString.trim() === '') {
      return [userEmail];
    }
    
    const emails = emailString
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0 && e.includes('@'));
    
    return emails.length > 0 ? emails : [userEmail];
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setFile(selectedFile);

    const extension = selectedFile.name.split('.').pop()?.toLowerCase();

    try {
      if (extension === 'csv') {
        // Parse CSV
        const text = await selectedFile.text();
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const headers = results.meta.fields || [];
            const format = validateHeaders(headers);
            if (!format) {
              setError("Invalid file format. Required columns: vendor, product, version (and optionally email_to)");
              setParsedData([]);
              return;
            }
            const normalized = (results.data as any[]).map(row => normalizeRow(row, format));
            setParsedData(normalized);
          },
          error: () => {
            setError("Failed to parse CSV file");
          }
        });
      } else if (extension === 'xlsx' || extension === 'xls') {
        // Parse Excel
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];
        
        if (jsonData.length > 0) {
          const headers = Object.keys(jsonData[0]);
          const format = validateHeaders(headers);
          if (!format) {
            setError("Invalid file format. Required columns: vendor, product, version (and optionally email_to)");
            setParsedData([]);
            return;
          }
          const normalized = jsonData.map(row => normalizeRow(row, format));
          setParsedData(normalized);
        }
      } else {
        setError("Unsupported file format. Please upload CSV or Excel file.");
      }
    } catch (err) {
      setError("Failed to read file");
    }
  };

  const handleDownloadTemplate = () => {
    // New template format
    const newTemplateData = [
      { email_to: "security@example.com, admin@example.com", organization: "Your Organization", product: "FortiOS", vendor: "Fortinet", version: "7.6.4" },
      { email_to: "", organization: "Your Organization", product: "Acrobat", vendor: "Adobe", version: "3.1" },
    ];
    
    const ws = XLSX.utils.json_to_sheet(newTemplateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "tech_stack_template.xlsx");
    
    toast({
      title: "Template downloaded",
      description: "Fill in your tech stack data and upload.",
    });
  };

  const handleSubmit = async () => {
    if (parsedData.length === 0) {
      setError("No data to upload");
      return;
    }

    if (!user?.email) {
      setError("You must be logged in to upload");
      return;
    }

    setIsUploading(true);

    try {
      // Map parsed data to database format, expanding comma-separated emails
      const stacksToInsert: Array<{
        vendor: string;
        product_name: string;
        version: string;
        org_name: string;
        email_id: string;
      }> = [];

      parsedData.forEach((row) => {
        const emails = parseEmails(row.email_to);
        
        // Create one entry per email
        emails.forEach(email => {
          stacksToInsert.push({
            vendor: row.vendor,
            product_name: row.product,
            version: row.version,
            org_name: userOrganization,
            email_id: email
          });
        });
      });

      await addMultipleTechStacks(stacksToInsert);

      // Trigger CVE engine in background after upload
      triggerEngineBackground();

      toast({
        title: "Upload successful",
        description: `${stacksToInsert.length} entries added to tech stack. CVE scanning started.`,
      });

      handleClose();
    } catch (err: any) {
      setError(err.message || "Failed to upload data");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setError(null);
    setSearchQuery("");
    onClose();
  };

  const handleRemoveRow = (index: number) => {
    setParsedData(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Upload className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-display font-semibold text-foreground">Upload Tech Stack</h2>
                <p className="text-sm text-muted-foreground">Import your technology inventory</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* NVD CPE Directory Instruction */}
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
              <p className="text-sm text-foreground">
                <strong>Before filling your sheet:</strong> Please find the correct Vendor and Product from the official NVD CPE directory and enter the exact values.
              </p>
              <a 
                href="https://nvd.nist.gov/products/cpe/search" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-accent hover:underline mt-2"
              >
                Open NVD CPE Search <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* CPE Structure Help */}
            <TooltipProvider>
              <div className="flex items-start gap-2 p-4 rounded-xl bg-muted/50 border border-border">
                <HelpCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">CPE Structure Reference:</p>
                  <code className="block text-xs bg-background p-2 rounded border border-border mb-2 break-all">
                    cpe:2.3:type:vendor:product:version:update:edition:lang:sw_edition:target_sw:target_hw:other
                  </code>
                  <p className="text-xs">
                    <strong>Example:</strong>{' '}
                    <code className="bg-background px-1 py-0.5 rounded">cpe:2.3:a:google:chrome:9.0.597.7:*:*:*:*:*:*:*</code>
                  </p>
                </div>
              </div>
            </TooltipProvider>

            {/* Download Template */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm text-foreground">Need the template?</p>
                  <p className="text-xs text-muted-foreground">Download our sample Excel template with correct columns</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>

            {/* Upload Area */}
            <div 
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                file ? 'border-accent bg-accent/5' : 'border-border hover:border-muted-foreground'
              }`}
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="h-6 w-6 text-accent" />
                  <span className="font-medium text-foreground">{file.name}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setParsedData([]);
                    }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium mb-1 text-foreground">Drop your file here or click to browse</p>
                  <p className="text-sm text-muted-foreground">Supports CSV and Excel files</p>
                </>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Preview */}
            {parsedData.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      Preview ({filteredData.length} of {parsedData.length} rows)
                    </span>
                  </div>
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search vendor or product..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 bg-background border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
                
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-foreground">#</th>
                          <th className="px-4 py-3 text-left font-medium text-foreground">Vendor</th>
                          <th className="px-4 py-3 text-left font-medium text-foreground">Product</th>
                          <th className="px-4 py-3 text-left font-medium text-foreground">Version</th>
                          <th className="px-4 py-3 text-left font-medium text-foreground">Email(s)</th>
                          <th className="px-4 py-3 text-left font-medium text-foreground"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredData.slice(0, 5).map((row, i) => (
                          <tr key={i} className="hover:bg-muted/30">
                            <td className="px-4 py-3 text-foreground">{i + 1}</td>
                            <td className="px-4 py-3 text-foreground">{row.vendor}</td>
                            <td className="px-4 py-3 text-foreground">{row.product}</td>
                            <td className="px-4 py-3 font-mono text-xs text-foreground">{row.version}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              {row.email_to || <span className="italic">Using: {userEmail}</span>}
                            </td>
                            <td className="px-4 py-3">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => handleRemoveRow(parsedData.indexOf(row))}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {filteredData.length === 0 && searchQuery && (
                          <tr>
                            <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                              No results found for "{searchQuery}"
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {filteredData.length > 5 && (
                    <div className="px-4 py-2 bg-muted/30 text-center text-xs text-muted-foreground">
                      And {filteredData.length - 5} more rows...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              variant="accent" 
              onClick={handleSubmit}
              disabled={parsedData.length === 0 || isUploading}
            >
              {isUploading ? 'Uploading...' : `Upload ${parsedData.length} Products`}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TechStackUploadModal;
