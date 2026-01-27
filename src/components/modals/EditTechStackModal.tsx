import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TechStack } from "@/lib/mockData";

interface EditTechStackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    vendorName: string;
    productName: string;
    productVersion: string;
  }) => void;
  techStack: TechStack | null;
}

const STANDARD_VENDORS = [
  "Adobe",
  "Amazon Web Services",
  "Apache",
  "Apple",
  "Atlassian",
  "Cisco",
  "Docker",
  "Elastic",
  "Google",
  "HashiCorp",
  "IBM",
  "Jenkins",
  "JetBrains",
  "Kubernetes",
  "Linux",
  "Microsoft",
  "MongoDB",
  "MySQL",
  "Nginx",
  "Node.js",
  "Oracle",
  "PostgreSQL",
  "Python",
  "Red Hat",
  "Salesforce",
  "SAP",
  "Slack",
  "Splunk",
  "Ubuntu",
  "VMware",
];

const EditTechStackModal = ({ isOpen, onClose, onSubmit, techStack }: EditTechStackModalProps) => {
  const [formData, setFormData] = useState({
    vendorName: '',
    productName: '',
    productVersion: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCustomVendor, setIsCustomVendor] = useState(false);

  // Pre-fill form when techStack changes
  useEffect(() => {
    if (techStack) {
      const vendorExists = STANDARD_VENDORS.includes(techStack.vendorName);
      setIsCustomVendor(!vendorExists);
      setFormData({
        vendorName: techStack.vendorName,
        productName: techStack.productName,
        productVersion: techStack.productVersion
      });
    }
  }, [techStack]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Vendor validation
    if (!formData.vendorName.trim()) {
      newErrors.vendorName = 'Vendor name is required';
    } else if (!isCustomVendor && !STANDARD_VENDORS.includes(formData.vendorName)) {
      newErrors.vendorName = 'Please select a valid vendor or add a custom one';
    } else if (formData.vendorName.length < 2) {
      newErrors.vendorName = 'Vendor name must be at least 2 characters';
    }
    
    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required';
    } else if (formData.productName.length < 2) {
      newErrors.productName = 'Product name must be at least 2 characters';
    }
    
    // Version format validation
    if (!formData.productVersion.trim()) {
      newErrors.productVersion = 'Version is required';
    } else {
      const versionRegex = /^[vV]?[\d]+([._-][\d\w]+)*$/;
      if (!versionRegex.test(formData.productVersion.trim())) {
        newErrors.productVersion = 'Invalid version format (e.g., 1.0.0, v2.1, 2024.1)';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      vendorName: '',
      productName: '',
      productVersion: ''
    });
    setErrors({});
    setIsCustomVendor(false);
    onClose();
  };

  const handleVendorSelect = (value: string) => {
    if (value === '__custom__') {
      setIsCustomVendor(true);
      setFormData(prev => ({ ...prev, vendorName: '' }));
    } else {
      setIsCustomVendor(false);
      setFormData(prev => ({ ...prev, vendorName: value }));
    }
  };

  if (!isOpen || !techStack) return null;

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
          className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Save className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-display font-semibold text-foreground">Edit Tech Stack</h2>
                <p className="text-sm text-muted-foreground">Update product information</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Organization - Read-only display */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Organization</Label>
              <div className="px-3 py-2 bg-muted/50 rounded-md text-sm text-muted-foreground">
                {techStack.organization || 'N/A'}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorName">Vendor Name</Label>
              {!isCustomVendor ? (
                <Select
                  value={STANDARD_VENDORS.includes(formData.vendorName) ? formData.vendorName : undefined}
                  onValueChange={handleVendorSelect}
                >
                  <SelectTrigger className={errors.vendorName ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select a vendor" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 bg-card">
                    {STANDARD_VENDORS.map((vendor) => (
                      <SelectItem key={vendor} value={vendor}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {vendor}
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">
                      <div className="flex items-center gap-2 text-accent">
                        <Plus className="h-4 w-4" />
                        Add Custom Vendor
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-2">
                  <Input
                    id="vendorName"
                    placeholder="Enter custom vendor name"
                    value={formData.vendorName}
                    onChange={(e) => setFormData(prev => ({ ...prev, vendorName: e.target.value }))}
                    className={errors.vendorName ? 'border-destructive' : ''}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCustomVendor(false);
                      setFormData(prev => ({ ...prev, vendorName: '' }));
                    }}
                    className="text-xs text-muted-foreground"
                  >
                    ← Back to vendor list
                  </Button>
                </div>
              )}
              {errors.vendorName && <p className="text-xs text-destructive">{errors.vendorName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                placeholder="e.g., Log4j, SQL Server"
                value={formData.productName}
                onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                className={errors.productName ? 'border-destructive' : ''}
              />
              {errors.productName && <p className="text-xs text-destructive">{errors.productName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="productVersion">Version</Label>
              <Input
                id="productVersion"
                placeholder="e.g., 2.14.1"
                value={formData.productVersion}
                onChange={(e) => setFormData(prev => ({ ...prev, productVersion: e.target.value }))}
                className={errors.productVersion ? 'border-destructive' : ''}
              />
              {errors.productVersion && <p className="text-xs text-destructive">{errors.productVersion}</p>}
            </div>

            {/* Email - Read-only display */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Email ID</Label>
              <div className="px-3 py-2 bg-muted/50 rounded-md text-sm text-muted-foreground">
                {techStack.emailId}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="accent" onClick={handleSubmit}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditTechStackModal;
