import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Package, Search, Edit2, Trash2, Save, X, Mail, Plus, Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTechStacks, updateTechStack, deleteTechStack, addTechStack } from "@/lib/storage";
import { TechStack as TechStackType } from "@/lib/mockData";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TechStackUploadModal from "@/components/modals/TechStackUploadModal";
import ManualTechStackModal from "@/components/modals/ManualTechStackModal";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const TechStack = () => {
  const { toast } = useToast();
  const [techStacks, setTechStacks] = useState<TechStackType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<TechStackType>>({});
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  useEffect(() => {
    loadTechStacks();
  }, []);

  const loadTechStacks = () => {
    setTechStacks(getTechStacks());
  };

  const filteredStacks = techStacks.filter(stack => 
    stack.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stack.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stack.productVersion.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (stack.organization?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleEdit = (stack: TechStackType) => {
    setEditingId(stack.id);
    setEditData({
      vendorName: stack.vendorName,
      productName: stack.productName,
      productVersion: stack.productVersion,
      emailId: stack.emailId
    });
  };

  const handleSave = (id: string) => {
    updateTechStack(id, editData);
    loadTechStacks();
    setEditingId(null);
    setEditData({});
    
    toast({
      title: "Updated successfully",
      description: "The product information has been updated.",
    });
  };

  const handleDelete = (id: string) => {
    deleteTechStack(id);
    loadTechStacks();
    
    toast({
      title: "Deleted",
      description: "The product has been removed from tech stack.",
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleManualAdd = (data: { organization: string; vendorName: string; productName: string; productVersion: string; emailId: string }) => {
    addTechStack({
      organization: data.organization,
      vendorName: data.vendorName,
      productName: data.productName,
      productVersion: data.productVersion,
      emailId: data.emailId,
      srNo: techStacks.length + 1
    });
    loadTechStacks();
    toast({
      title: "Product added",
      description: "The product has been added to your tech stack.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-navy">Tech Stack</h1>
            <p className="text-muted-foreground">
              {techStacks.length} products in your tech stack
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setIsManualModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Manually
            </Button>
            <Button variant="accent" onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by organization, vendor, product, or version..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Email ID
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStacks.map((stack) => (
                  <tr key={stack.id} className="hover:bg-muted/30 transition-colors">
                    {/* Organization - Not editable */}
                    <td className="px-6 py-4">
                      <span className="font-medium text-navy">{stack.organization || '-'}</span>
                    </td>
                    
                    {/* Vendor - Editable */}
                    <td className="px-6 py-4">
                      {editingId === stack.id ? (
                        <Input
                          value={editData.vendorName || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, vendorName: e.target.value }))}
                          className="h-8"
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                            <Package className="h-4 w-4 text-accent" />
                          </div>
                          <span className="font-medium">{stack.vendorName}</span>
                        </div>
                      )}
                    </td>
                    
                    {/* Product Name */}
                    <td className="px-6 py-4">
                      {editingId === stack.id ? (
                        <Input
                          value={editData.productName || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, productName: e.target.value }))}
                          className="h-8"
                        />
                      ) : (
                        <span>{stack.productName}</span>
                      )}
                    </td>
                    
                    {/* Version */}
                    <td className="px-6 py-4">
                      {editingId === stack.id ? (
                        <Input
                          value={editData.productVersion || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, productVersion: e.target.value }))}
                          className="h-8 font-mono"
                        />
                      ) : (
                        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          {stack.productVersion}
                        </span>
                      )}
                    </td>
                    
                    {/* Email */}
                    <td className="px-6 py-4">
                      {editingId === stack.id ? (
                        <Input
                          type="email"
                          value={editData.emailId || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, emailId: e.target.value }))}
                          className="h-8"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {stack.emailId}
                        </div>
                      )}
                    </td>
                    
                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      {editingId === stack.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="accent"
                            size="sm"
                            onClick={() => handleSave(stack.id)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(stack)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete product?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove {stack.productName} from your tech stack. 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(stack.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStacks.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try a different search term' : 'Upload your tech stack to get started'}
              </p>
              {!searchQuery && (
                <div className="flex items-center justify-center gap-3">
                  <Button variant="outline" onClick={() => setIsManualModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Manually
                  </Button>
                  <Button variant="accent" onClick={() => setIsUploadModalOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      <TechStackUploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => {
          setIsUploadModalOpen(false);
          loadTechStacks();
        }} 
      />

      <ManualTechStackModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSubmit={handleManualAdd}
      />
    </DashboardLayout>
  );
};

export default TechStack;
