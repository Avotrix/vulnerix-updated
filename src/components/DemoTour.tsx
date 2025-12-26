import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, ShieldAlert, Database, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DemoStep {
  title: string;
  description: string;
  icon: React.ElementType;
  highlight: string;
}

const demoSteps: DemoStep[] = [
  {
    title: "Dashboard Overview",
    description: "Get a quick snapshot of your security posture. View total products, critical vulnerabilities, and recent advisories at a glance.",
    icon: BarChart3,
    highlight: "dashboard"
  },
  {
    title: "Tech Stack Management",
    description: "Upload and manage your technology inventory. Import via CSV/Excel or add entries manually. Track vendors, products, and versions.",
    icon: Database,
    highlight: "tech-stack"
  },
  {
    title: "Security Advisories",
    description: "Browse and filter vulnerability advisories. Get detailed CVE information, severity scores, and remediation guidance for your stack.",
    icon: ShieldAlert,
    highlight: "advisories"
  }
];

interface DemoTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const DemoTour = ({ isOpen, onClose }: DemoTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  const step = demoSteps[currentStep];
  const Icon = step.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
        onClick={handleSkip}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="relative bg-navy-gradient p-6">
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Icon className="h-7 w-7 text-accent" />
                </div>
                <div>
                  <p className="text-accent text-sm font-medium">
                    Step {currentStep + 1} of {demoSteps.length}
                  </p>
                  <h3 className="text-xl font-display font-bold text-primary-foreground">
                    {step.title}
                  </h3>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-muted-foreground leading-relaxed mb-6">
                {step.description}
              </p>

              {/* Demo Visual */}
              <div className="bg-muted/50 rounded-xl p-4 border border-border mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-2 w-2 rounded-full bg-severity-critical" />
                  <div className="h-2 w-2 rounded-full bg-severity-high" />
                  <div className="h-2 w-2 rounded-full bg-severity-medium" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-3/4 bg-foreground/10 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-foreground/10 rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-foreground/10 rounded animate-pulse" />
                </div>
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-2 mb-6">
                {demoSteps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentStep 
                        ? 'w-6 bg-accent' 
                        : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                >
                  Skip Tour
                </Button>

                <Button
                  variant="navy"
                  size="sm"
                  onClick={handleNext}
                  className="gap-1"
                >
                  {currentStep === demoSteps.length - 1 ? 'Finish' : 'Next'}
                  {currentStep < demoSteps.length - 1 && <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DemoTour;
