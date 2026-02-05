import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ShieldAlert, ShieldCheck, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import DemoTour from "@/components/DemoTour";
import TechStackFlowDiagram from "@/components/landing/TechStackFlowDiagram";
import vulnerixLogo from "@/assets/vulnerix-logo.png";

// Import client logos
import maxAerospaceLogo from "@/assets/clients/max-aerospace-logo.png";
import glttLogo from "@/assets/clients/gltt-logo.png";
import auxinLogo from "@/assets/clients/auxin-logo.png";
import aagargLogo from "@/assets/clients/aagarg-logo.png";
import samarthWealthLogo from "@/assets/clients/samarth-wealth-logo.png";

// Client data with logo imports (no hyperlinks as per requirement)
const clientData = [
  { name: "Max Aerospace", logo: maxAerospaceLogo },
  { name: "GLTT Travel", logo: glttLogo },
  { name: "Auxin Shipping", logo: auxinLogo },
  { name: "A A Garg & Co", logo: aagargLogo },
  { name: "Samarth Wealth", logo: samarthWealthLogo },
];

const LandingPage = () => {
  const [showDemo, setShowDemo] = useState(false);
  const testimonials = [{
    name: "Sarah Chen",
    role: "CISO, Max Aerospace",
    content: "Vulnerix transformed our vulnerability management. We now identify and remediate threats 3x faster.",
    avatar: "SC"
  }, {
    name: "Michael Rodriguez",
    role: "Security Director, Auxin Shipping",
    content: "The automated advisory system has saved us countless hours. Critical vulnerabilities no longer slip through.",
    avatar: "MR"
  }, {
    name: "Emily Thompson",
    role: "VP Engineering, FynDNA",
    content: "Best vulnerability intelligence platform we've used. The integration with our stack was seamless.",
    avatar: "ET"
  }];
  const features = [{
    icon: ShieldAlert,
    title: "Real-time Threat Detection",
    description: "Instant alerts for vulnerabilities affecting your tech stack with CVSS scoring and severity analysis."
  }, {
    icon: ShieldCheck,
    title: "Automated Advisory Mapping",
    description: "Automatically correlate CVEs with your inventory and receive actionable remediation guidance."
  }, {
    icon: Shield,
    title: "Smart Email Notifications",
    description: "Critical advisory alerts sent directly to responsible teams based on your tech stack configuration."
  }];
  return <>
      <DemoTour isOpen={showDemo} onClose={() => setShowDemo(false)} />
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <motion.div initial={{
            opacity: 0,
            x: -20
          }} animate={{
            opacity: 1,
            x: 0
          }} className="flex items-center gap-2">
            <img src={vulnerixLogo} alt="Vulnerix Logo" className="h-10 w-10" />
            <span className="text-2xl font-display font-bold text-foreground">Vulnerix</span>
          </motion.div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#clients" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Clients</a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth?mode=register">
              <Button variant="accent" size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient opacity-5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.2
            }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
                <Shield className="h-4 w-4" />
                Enterprise Vulnerability Intelligence
              </span>
            </motion.div>

            <motion.h1 initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.3
}} className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-foreground leading-tight mb-6">
              Protect Your Business<br />
              <span className="text-gradient text-[#d43702]">Before It's Too Late.</span>
            </motion.h1>

            <motion.p initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.4
            }} className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">Real-time vulnerability monitoring and advisory intelligence for your entire technology stack. Stay ahead of threats with automated alerts and actionable insights.</motion.p>

            <motion.div initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} transition={{
              delay: 0.5
            }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth?mode=register">
                <Button variant="hero" size="xl">
                  Sign Up
                </Button>
              </Link>
              <Button variant="hero-outline" size="xl" onClick={() => setShowDemo(true)}>
                Request Demo
              </Button>
            </motion.div>
          </div>

          {/* Tech Stack Flow Diagram - Between CTA and Stats */}
          <TechStackFlowDiagram />

          {/* Hero Visual */}
          <motion.div initial={{
            opacity: 0,
            y: 40
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.6
          }} className="mt-20 relative">
            <div className="relative mx-auto max-w-5xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-navy/5 to-accent/5" />
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-muted/50 rounded-xl p-4 border border-border">
                    <div className="text-xs text-muted-foreground mb-1">Total Products</div>
                    <div className="text-2xl font-bold text-foreground">247</div>
                  </div>
                  <div className="bg-severity-critical/10 rounded-xl p-4 border border-severity-critical/30">
                    <div className="text-xs text-muted-foreground mb-1">Critical</div>
                    <div className="text-2xl font-bold text-severity-critical">12</div>
                  </div>
                  <div className="bg-severity-high/10 rounded-xl p-4 border border-severity-high/30">
                    <div className="text-xs text-muted-foreground mb-1">High</div>
                    <div className="text-2xl font-bold text-severity-high">34</div>
                  </div>
                  <div className="bg-severity-medium/10 rounded-xl p-4 border border-severity-medium/30">
                    <div className="text-xs text-muted-foreground mb-1">Medium</div>
                    <div className="text-2xl font-bold text-severity-medium">56</div>
                  </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  {[1, 2, 3].map((_, i) => <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border">
                      <div className="h-8 w-8 rounded-full bg-severity-critical/20 flex items-center justify-center">
                        <ShieldAlert className="h-4 w-4 text-severity-critical" />
                      </div>
                      <div className="flex-1">
                        <div className="h-3 w-48 bg-foreground/10 rounded animate-pulse" />
                      </div>
                      <div className="h-6 w-16 bg-severity-critical/20 rounded-full" />
                    </div>)}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Clients Section */}
      <section id="clients" className="py-16 border-y border-border bg-muted/30">
        <div className="container mx-auto px-6">
          <motion.p initial={{
            opacity: 0
          }} whileInView={{
            opacity: 1
          }} viewport={{
            once: true
          }} className="text-center text-sm font-medium text-foreground mb-8">
            TRUSTED BY OUR CLIENTS
          </motion.p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {clientData.map((client, i) => (
              <motion.div
                key={client.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-center p-4 rounded-xl bg-white border border-border min-w-[140px] h-[80px]"
                title={client.name}
              >
                <img 
                  src={client.logo} 
                  alt={`${client.name} logo`}
                  className="max-h-12 max-w-[120px] object-contain"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-6">
          <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-foreground mb-4">
              Core Engine Secrets
            </h2>
            <p className="text-lg text-muted-foreground">
              Powered by advanced threat intelligence and automated vulnerability correlation
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => <motion.div key={feature.title} initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: i * 0.1
            }} className="group relative bg-card rounded-2xl border border-border p-8 hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <div className="relative">
                  <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-accent/10 text-accent mb-6">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-navy-gradient">
        <div className="container mx-auto px-6">
          <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-4">
              Trusted by Security Leaders
            </h2>
            <p className="text-lg text-white/80">
              See what our customers say about Vulnerix
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => <motion.div key={testimonial.name} initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: i * 0.1
            }} className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
                <p className="text-white leading-relaxed mb-6">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-white/70">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <motion.div initial={{
            opacity: 0,
            scale: 0.95
          }} whileInView={{
            opacity: 1,
            scale: 1
          }} viewport={{
            once: true
          }} className="relative max-w-4xl mx-auto text-center bg-card rounded-3xl border border-border p-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-navy/5" />
            <div className="relative">
              <h2 className="text-4xl font-display font-bold text-foreground mb-4">
                Ready to Secure Your Stack?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Start monitoring vulnerabilities in minutes. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/auth">
                  <Button variant="hero" size="xl">
                    Sign In
                  </Button>
                </Link>
                <Button variant="navy-outline" size="xl" onClick={() => setShowDemo(true)}>
                  Request Demo
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <img src={vulnerixLogo} alt="Vulnerix Logo" className="h-8 w-8" />
              <span className="text-xl font-display font-bold text-foreground">Vulnerix</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Vulnerix. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
          
          {/* Admin Login Link - Bottom of Home Page Only */}
          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <Link 
              to="/admin" 
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
    </>;
};
export default LandingPage;