import { cn } from "@/lib/utils";

const TechStackFlowDiagram = () => {
  return (
    <section className="w-full flex justify-center py-24 mt-24 mb-24">
      <div className="max-w-6xl w-full relative px-4 md:px-6">
        {/* Diagram Container */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 relative p-6 md:p-10">
          
          {/* Left Column - Input Sources */}
          <div className="flex flex-col gap-6 md:gap-8 z-10">
            <DiagramNode>NVD CVE Feed</DiagramNode>
            <DiagramNode>CERT-In Advisories</DiagramNode>
          </div>

          {/* Center Column - Engine */}
          <div className="flex flex-col gap-8 z-10">
            <EngineNode>
              Relevance Engine
              <span className="block text-xs text-muted-foreground font-normal mt-2">
                Asset & Version Matching
              </span>
            </EngineNode>
          </div>

          {/* Right Column - Outputs */}
          <div className="flex flex-col gap-6 md:gap-8 z-10">
            <DiagramNode>Final Vulnerability Alerts</DiagramNode>
            <DiagramNode>Interactive Dashboards</DiagramNode>
          </div>

          {/* SVG Connection Lines - Hidden on mobile */}
          <svg 
            className="hidden md:block absolute inset-0 w-full h-full z-0 pointer-events-none"
            viewBox="0 0 800 400" 
            preserveAspectRatio="none"
          >
            {/* Left to Center connections */}
            <path 
              className="fill-none stroke-primary stroke-2 opacity-60 animate-flow"
              strokeDasharray="10, 10"
              d="M 230 120 C 300 120, 300 200, 370 200" 
            />
            <path 
              className="fill-none stroke-primary stroke-2 opacity-60 animate-flow"
              strokeDasharray="10, 10"
              d="M 230 280 C 300 280, 300 200, 370 200" 
            />
            
            {/* Center to Right connections */}
            <path 
              className="fill-none stroke-primary stroke-2 opacity-60 animate-flow"
              strokeDasharray="10, 10"
              d="M 580 200 C 650 200, 650 120, 720 120" 
            />
            <path 
              className="fill-none stroke-primary stroke-2 opacity-60 animate-flow"
              strokeDasharray="10, 10"
              d="M 580 200 C 650 200, 650 280, 720 280" 
            />
          </svg>
        </div>
      </div>
    </section>
  );
};

interface DiagramNodeProps {
  children: React.ReactNode;
  className?: string;
}

const DiagramNode = ({ children, className }: DiagramNodeProps) => {
  return (
    <div 
      className={cn(
        "bg-card border-2 border-primary rounded-xl px-6 py-4 md:px-8 md:py-5",
        "text-center font-semibold text-foreground",
        "shadow-[0_0_15px_hsl(var(--primary)/0.3)]",
        "min-w-[160px] md:min-w-[180px]",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-[0_0_25px_hsl(var(--primary)/0.6)]",
        className
      )}
    >
      {children}
    </div>
  );
};

interface EngineNodeProps {
  children: React.ReactNode;
}

const EngineNode = ({ children }: EngineNodeProps) => {
  return (
    <div 
      className={cn(
        "bg-card border-2 border-accent rounded-xl px-8 py-6 md:px-10 md:py-8",
        "text-center font-semibold text-foreground text-lg md:text-xl",
        "shadow-[0_0_20px_hsl(var(--accent)/0.4)]",
        "min-w-[180px] md:min-w-[220px]",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1",
        "animate-engine-pulse"
      )}
    >
      {children}
    </div>
  );
};

export default TechStackFlowDiagram;
