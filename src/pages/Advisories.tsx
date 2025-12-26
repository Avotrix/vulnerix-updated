import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Search, Filter, ExternalLink, ChevronLeft, ChevronRight,
  AlertCircle, Info, Shield, Mail, MailCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getAdvisories, addToEmailQueue, getEmailQueue } from "@/lib/storage";
import { Advisory } from "@/lib/mockData";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";

const ITEMS_PER_PAGE = 5;

const Advisories = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [emailStatuses, setEmailStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    setAdvisories(getAdvisories());
    updateEmailStatuses();
    
    // Check for CVE search param from notification click
    const cveParam = searchParams.get('cve');
    if (cveParam) {
      setSearchQuery(cveParam);
      // Clear the search param after setting the filter
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const updateEmailStatuses = () => {
    const queue = getEmailQueue();
    const statuses: Record<string, string> = {};
    queue.forEach(item => {
      statuses[item.advisoryId] = item.status;
    });
    setEmailStatuses(statuses);
  };

  // Get unique vendors
  const vendors = useMemo(() => {
    const uniqueVendors = [...new Set(advisories.map(a => a.tech_stack_vendor))];
    return uniqueVendors.sort();
  }, [advisories]);

  // Filter advisories
  const filteredAdvisories = useMemo(() => {
    return advisories.filter(advisory => {
      const matchesSearch = searchQuery === "" || 
        advisory.cve_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        advisory.Description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        advisory.tech_stack_product.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSeverity = severityFilter === "all" || advisory.Severity === severityFilter;
      const matchesVendor = vendorFilter === "all" || advisory.tech_stack_vendor === vendorFilter;
      
      return matchesSearch && matchesSeverity && matchesVendor;
    });
  }, [advisories, searchQuery, severityFilter, vendorFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAdvisories.length / ITEMS_PER_PAGE);
  const paginatedAdvisories = filteredAdvisories.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSendEmail = (advisory: Advisory) => {
    addToEmailQueue(advisory.cve_id, advisory.email_to);
    setEmailStatuses(prev => ({ ...prev, [advisory.cve_id]: 'queued' }));
    
    toast({
      title: "Email queued",
      description: `Notification will be sent to the responsible team.`,
    });

    // Update status after simulated send
    setTimeout(() => {
      setEmailStatuses(prev => ({ ...prev, [advisory.cve_id]: 'sent' }));
    }, 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderVersionRange = (advisory: Advisory) => {
    const parts = [];
    if (advisory.versionStartIncluding) parts.push(`>= ${advisory.versionStartIncluding}`);
    if (advisory.versionStartExcluding) parts.push(`> ${advisory.versionStartExcluding}`);
    if (advisory.versionEndIncluding) parts.push(`<= ${advisory.versionEndIncluding}`);
    if (advisory.versionEndExcluding) parts.push(`< ${advisory.versionEndExcluding}`);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-navy">Advisories</h1>
            <p className="text-muted-foreground">
              {filteredAdvisories.length} vulnerabilities found
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by CVE, description, or product..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          
          <div className="flex gap-3">
            <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-36">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={vendorFilter} onValueChange={(v) => { setVendorFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {vendors.map(vendor => (
                  <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advisory Cards */}
        <div className="space-y-4">
          {paginatedAdvisories.map((advisory, index) => (
            <motion.div
              key={advisory.cve_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Card Header */}
              <div className={`h-1 ${
                advisory.Severity === 'Critical' ? 'bg-severity-critical' :
                advisory.Severity === 'High' ? 'bg-severity-high' :
                advisory.Severity === 'Medium' ? 'bg-severity-medium' :
                'bg-severity-low'
              }`} />
              
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Left Section */}
                  <div className="flex-1 space-y-4">
                    {/* Title Row */}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-lg font-bold text-navy">
                        {advisory.cve_id}
                      </span>
                      <SeverityBadge severity={advisory.Severity} />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-xs font-medium">
                              <Info className="h-3 w-3" />
                              CVSS {advisory.cvss_score}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              CVSS (Common Vulnerability Scoring System) score ranges from 0-10. 
                              Higher scores indicate more severe vulnerabilities.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(advisory.lastModified)}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {advisory.Description}
                    </p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                      <div>
                        <span className="text-xs text-muted-foreground block mb-1">Vendor / Product</span>
                        <span className="text-sm font-medium">
                          {advisory.tech_stack_vendor} / {advisory.tech_stack_product}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block mb-1">Version</span>
                        <span className="text-sm font-mono">{advisory.tech_stack_version}</span>
                      </div>
                      {renderVersionRange(advisory) && (
                        <div>
                          <span className="text-xs text-muted-foreground block mb-1">Affected Versions</span>
                          <span className="text-sm font-mono">{renderVersionRange(advisory)}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-muted-foreground block mb-1">Attack Vector</span>
                        <span className="text-sm">{advisory.attack_vector}</span>
                      </div>
                    </div>

                    {/* CVIN Info */}
                    {advisory.cvin_id && advisory.cvin_id.trim() !== '' && (
                      <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-accent" />
                          <span className="font-medium text-sm">{advisory.cvin_id}</span>
                          {advisory.cvin_title && (
                            <span className="text-sm text-muted-foreground">- {advisory.cvin_title}</span>
                          )}
                        </div>
                        {advisory.cvin_risk_assessment && (
                          <p className="text-sm text-muted-foreground">{advisory.cvin_risk_assessment}</p>
                        )}
                      </div>
                    )}

                    {/* Show dash if cvin_id is blank */}
                    {(!advisory.cvin_id || advisory.cvin_id.trim() === '') && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">CVIN ID:</span> -
                      </div>
                    )}
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex flex-col gap-2 lg:w-40">
                    <a 
                      href={advisory.Reference_URL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Reference
                      </Button>
                    </a>
                    
                    {advisory.Severity === 'Critical' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant={emailStatuses[advisory.cve_id] ? "secondary" : "accent"}
                              size="sm"
                              className="w-full"
                              onClick={() => handleSendEmail(advisory)}
                              disabled={!!emailStatuses[advisory.cve_id]}
                            >
                              {emailStatuses[advisory.cve_id] === 'sent' ? (
                                <>
                                  <MailCheck className="h-4 w-4 mr-2" />
                                  Sent
                                </>
                              ) : emailStatuses[advisory.cve_id] === 'queued' ? (
                                <>
                                  <Mail className="h-4 w-4 mr-2 animate-pulse" />
                                  Queued
                                </>
                              ) : (
                                <>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Notify
                                </>
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Send email notification to the responsible team</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {paginatedAdvisories.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No advisories found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredAdvisories.length)} of{' '}
              {filteredAdvisories.length} advisories
            </p>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "ghost"}
                      size="sm"
                      className="w-9"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Advisories;
