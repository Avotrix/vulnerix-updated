import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Upload, Download, FileSpreadsheet, AlertCircle, 
  CheckCircle, Trash2, Eye, Search 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { sampleTemplateData } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useUserSettings, useTechStacks } from "@/hooks/useSupabaseData";
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
}

const EXPECTED_HEADERS = ["Sr No.", "Vendor Name", "Product Name", "Product Version", "Email ID"];

const TechStackUploadModal = ({ isOpen, onClose }: TechStackUploadModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { settings } = useUserSettings();
  const { addMultipleTechStacks } = useTechStacks();
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
            if (!validateHeaders(headers)) {
              setError("Invalid file format. Headers must match: Sr No., Vendor Name, Product Name, Product Version, Email ID");
              setParsedData([]);
              return;
            }
            setParsedData(results.data as ParsedRow[]);
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
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as ParsedRow[];
        
        if (jsonData.length > 0) {
          const headers = Object.keys(jsonData[0]);
          if (!validateHeaders(headers)) {
            setError("Invalid file format. Headers must match: Sr No., Vendor Name, Product Name, Product Version, Email ID");
            setParsedData([]);
            return;
          }
        }
        
        setParsedData(jsonData);
      } else {
        setError("Unsupported file format. Please upload CSV or Excel file.");
      }
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

    if (!user?.email) {
      setError("You must be logged in to upload");
      return;
    }

    setIsUploading(true);

    try {
      // Map parsed data to database format
      const stacksToInsert = parsedData.map((row) => ({
        vendor: row["Vendor Name"],
        product_name: row["Product Name"],
        version: row["Product Version"],
        org_name: settings?.org_name || 'Default Organization',
        email_id: user.email!
      }));

      await addMultipleTechStacks(stacksToInsert);

      toast({
        title: "Upload successful",
        description: `${parsedData.length} products added to tech stack.`,
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
