import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Upload, Download, FileSpreadsheet, AlertCircle, 
  CheckCircle, Trash2, Eye, Search 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { sampleTemplateData } from "@/lib/mockData";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface TechStackUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  "Sr No.": number;
  "Vendor Name": string;
  "Product Name": string;
  "Product Version": string;
  "Email ID": string;
  "Organization"?: string;
}

const EXPECTED_HEADERS = ["Sr No.", "Vendor Name", "Product Name", "Product Version", "Email ID"];

// Security constants
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_ROW_COUNT = 10000;
const MAX_FIELD_LENGTH = {
  vendor: 200,
  product: 200,
  version: 50,
  email: 255,
  organization: 200,
};

// Sanitize field to prevent CSV injection and limit length
const sanitizeField = (value: unknown, maxLength: number): string => {
  if (value === null || value === undefined) return '';
  
  let str = String(value).trim();
  
  // Escape CSV/Excel formula injection (values starting with =, +, -, @, tab, carriage return)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  
  // Remove null bytes and control characters (except newlines for multi-line text)
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Truncate to max length
  if (str.length > maxLength) {
    str = str.substring(0, maxLength);
  }
  
  return str;
};

// Validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= MAX_FIELD_LENGTH.email;
};

const TechStackUploadModal = ({ isOpen, onClose }: TechStackUploadModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [organizationName, setOrganizationName] = useState("");

  // Filter parsed data based on search query (vendor and product name)
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return parsedData;
    const query = searchQuery.toLowerCase();
    return parsedData.filter(
      (row) =>
        row["Vendor Name"]?.toLowerCase().includes(query) ||
        row["Product Name"]?.toLowerCase().includes(query)
    );
  }, [parsedData, searchQuery]);

  const validateHeaders = (headers: string[]): boolean => {
    const normalizedHeaders = headers.map(h => h.trim());
    return EXPECTED_HEADERS.every(expected => 
      normalizedHeaders.some(h => h.toLowerCase() === expected.toLowerCase())
    );
  };

  // Sanitize and validate parsed rows
  const sanitizeAndValidateRows = (rows: ParsedRow[]): { valid: ParsedRow[]; errors: string[] } => {
    const errors: string[] = [];
    const valid: ParsedRow[] = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;
      
      // Sanitize all fields
      const sanitizedRow: ParsedRow = {
        "Sr No.": typeof row["Sr No."] === 'number' ? row["Sr No."] : i + 1,
        "Vendor Name": sanitizeField(row["Vendor Name"], MAX_FIELD_LENGTH.vendor),
        "Product Name": sanitizeField(row["Product Name"], MAX_FIELD_LENGTH.product),
        "Product Version": sanitizeField(row["Product Version"], MAX_FIELD_LENGTH.version),
        "Email ID": sanitizeField(row["Email ID"], MAX_FIELD_LENGTH.email),
      };
      
      // Validate required fields
      if (!sanitizedRow["Vendor Name"]) {
        errors.push(`Row ${rowNum}: Missing vendor name`);
        continue;
      }
      if (!sanitizedRow["Product Name"]) {
        errors.push(`Row ${rowNum}: Missing product name`);
        continue;
      }
      
      // Validate email format if provided
      if (sanitizedRow["Email ID"] && !isValidEmail(sanitizedRow["Email ID"])) {
        errors.push(`Row ${rowNum}: Invalid email format`);
        continue;
      }
      
      valid.push(sanitizedRow);
    }
    
    return { valid, errors };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setError(`File too large. Maximum file size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`);
      setParsedData([]);
      return;
    }

    setFile(selectedFile);

    const extension = selectedFile.name.split('.').pop()?.toLowerCase();

    try {
      let rawData: ParsedRow[] = [];
      
      if (extension === 'csv') {
        // Parse CSV
        const text = await selectedFile.text();
        const result = await new Promise<{ data: ParsedRow[]; headers: string[] }>((resolve, reject) => {
          Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              resolve({ 
                data: results.data as ParsedRow[], 
                headers: results.meta.fields || [] 
              });
            },
            error: () => reject(new Error("Failed to parse CSV file"))
          });
        });
        
        if (!validateHeaders(result.headers)) {
          setError("Invalid file format. Headers must match: Sr No., Vendor Name, Product Name, Product Version, Email ID");
          setParsedData([]);
          return;
        }
        rawData = result.data;
      } else if (extension === 'xlsx' || extension === 'xls') {
        // Parse Excel
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as ParsedRow[];
        
        if (jsonData.length > 0) {
          const headers = Object.keys(jsonData[0]);
          if (!validateHeaders(headers)) {
            setError("Invalid file format. Headers must match: Sr No., Vendor Name, Product Name, Product Version, Email ID");
            setParsedData([]);
            return;
          }
        }
        rawData = jsonData;
      } else {
        setError("Unsupported file format. Please upload CSV or Excel file.");
        return;
      }

      // Validate row count
      if (rawData.length > MAX_ROW_COUNT) {
        setError(`Too many rows. Maximum ${MAX_ROW_COUNT.toLocaleString()} rows allowed. File has ${rawData.length.toLocaleString()} rows.`);
        setParsedData([]);
        return;
      }

      if (rawData.length === 0) {
        setError("File contains no data rows");
        setParsedData([]);
        return;
      }

      // Sanitize and validate all rows
      const { valid, errors: validationErrors } = sanitizeAndValidateRows(rawData);
      
      if (validationErrors.length > 0) {
        // Show first few errors
        const errorPreview = validationErrors.slice(0, 3).join('; ');
        const moreErrors = validationErrors.length > 3 ? ` (and ${validationErrors.length - 3} more issues)` : '';
        toast({
          title: "Some rows skipped",
          description: `${errorPreview}${moreErrors}`,
          variant: "destructive"
        });
      }

      setParsedData(valid);
    } catch (err) {
      setError("Failed to read file");
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(sampleTemplateData);
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

    // Validate organization name with length limit
    const sanitizedOrgName = sanitizeField(organizationName, MAX_FIELD_LENGTH.organization);
    if (!sanitizedOrgName) {
      setError("Please enter an organization name");
      return;
    }

    if (!user?.email) {
      setError("You must be logged in to upload");
      return;
    }

    // Final row count check before upload
    if (parsedData.length > MAX_ROW_COUNT) {
      setError(`Too many rows. Maximum ${MAX_ROW_COUNT.toLocaleString()} rows allowed.`);
      return;
    }

    setIsUploading(true);

    try {
      // Prepare sanitized data for database insertion
      const techStackItems = parsedData.map((row) => ({
        org_name: sanitizedOrgName,
        vendor: row["Vendor Name"] || '',
        product_name: row["Product Name"] || '',
        version: row["Product Version"] || null,
        email_id: row["Email ID"] || user.email
      }));

      // Insert into tech_stack table in batches to prevent timeout
      const BATCH_SIZE = 500;
      for (let i = 0; i < techStackItems.length; i += BATCH_SIZE) {
        const batch = techStackItems.slice(i, i + BATCH_SIZE);
        const { error: insertError } = await supabase
          .from('tech_stack')
          .insert(batch);

        if (insertError) {
          // Show generic error to user, detailed error logged server-side
          setError(`Failed to upload batch ${Math.floor(i / BATCH_SIZE) + 1}. Please try again.`);
          return;
        }
      }

      toast({
        title: "Upload successful",
        description: `${parsedData.length} products added to your tech stack.`,
      });

      handleClose();
    } catch (err) {
      // Error logged server-side, no client-side logging
      setError("Failed to upload data. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setError(null);
    setSearchQuery("");
    setOrganizationName("");
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
                <h2 className="text-xl font-display font-semibold text-navy">Upload Tech Stack</h2>
                <p className="text-sm text-muted-foreground">Import your technology inventory</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Organization Name Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Organization Name *</label>
              <Input
                placeholder="Enter your organization name"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="bg-background"
              />
            </div>

            {/* Download Template */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Need the template?</p>
                  <p className="text-xs text-muted-foreground">Download our sample CSV/Excel template</p>
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
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="h-6 w-6 text-accent" />
                  <span className="font-medium">{file.name}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setParsedData([]);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium mb-1">Drop your file here or click to browse</p>
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
                          <th className="px-4 py-3 text-left font-medium text-foreground">Sr No.</th>
                          <th className="px-4 py-3 text-left font-medium text-foreground">Vendor</th>
                          <th className="px-4 py-3 text-left font-medium text-foreground">Product</th>
                          <th className="px-4 py-3 text-left font-medium text-foreground">Version</th>
                          <th className="px-4 py-3 text-left font-medium text-foreground">Email</th>
                          <th className="px-4 py-3 text-left font-medium text-foreground"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredData.slice(0, 5).map((row, i) => (
                          <tr key={i} className="hover:bg-muted/30">
                            <td className="px-4 py-3 text-foreground">{row["Sr No."]}</td>
                            <td className="px-4 py-3 text-foreground">{row["Vendor Name"]}</td>
                            <td className="px-4 py-3 text-foreground">{row["Product Name"]}</td>
                            <td className="px-4 py-3 font-mono text-xs text-foreground">{row["Product Version"]}</td>
                            <td className="px-4 py-3 text-muted-foreground">{row["Email ID"]}</td>
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
              disabled={parsedData.length === 0 || isUploading || !organizationName.trim()}
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