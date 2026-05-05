import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { OpportunitySignalField } from '@/components/landing/OpportunitySignalField';
import { Terminal, Shield, Zap, ChevronRight, Activity, AlertCircle, CheckCircle2, Clock, FileText } from 'lucide-react';

const LandingPage = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen bg-[#050608] text-[#F4F7FA] font-sans antialiased selection:bg-[#00F5D4]/30">
      <OpportunitySignalField />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-4 border-b border-[#1F2933] bg-[#050608]/80 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <span className="text-xl font-bold tracking-tight text-[#F4F7FA]">JATA</span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono tracking-wider bg-[#101720] text-[#00F5D4] border border-[#1F2933]">
            LOCAL-FIRST BETA
          </span>
        </div>
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-[#9AA4B2]">
          <a href="#product" className="hover:text-[#F4F7FA] transition-colors">Product</a>
          <a href="#workflow" className="hover:text-[#F4F7FA] transition-colors">Workflow</a>
          <Link to="/privacy" className="hover:text-[#F4F7FA] transition-colors">Privacy</Link>
        </div>
        <div>
          <Link
            to="/signin"
            className="text-sm font-medium text-[#F4F7FA] hover:text-[#00F5D4] transition-colors"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-32 flex flex-col lg:flex-row items-center gap-16">
          
          {/* Copy Side */}
          <div className="flex-1 text-left">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center space-x-2 text-[#00F5D4] font-mono text-sm tracking-widest mb-6">
                <Terminal className="w-4 h-4" />
                <span>PERSONAL OPPORTUNITY OS</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6 text-[#F4F7FA]">
                Run your job search like an operating system.
              </h1>
              <p className="text-lg md:text-xl text-[#9AA4B2] mb-10 max-w-xl leading-relaxed">
                Capture roles, score fit, generate application packs, track follow-ups, and focus your energy where the odds are highest.
              </p>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#F4F7FA] text-[#050608] font-semibold rounded hover:bg-white transition-colors duration-200"
                >
                  Open Console
                </Link>
                <a
                  href="#workflow"
                  className="inline-flex items-center justify-center px-6 py-3 bg-transparent border border-[#1F2933] text-[#F4F7FA] font-medium rounded hover:bg-[#101720] transition-colors duration-200 group"
                >
                  View Workflow
                  <ChevronRight className="w-4 h-4 ml-2 text-[#9AA4B2] group-hover:text-[#F4F7FA] transition-colors" />
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-[#9AA4B2] font-mono">
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#7CFF8A]" />
                  Local-first
                </span>
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#00F5D4]" />
                  Built for execution
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#7AA2FF]" />
                  No credit card
                </span>
              </div>
            </motion.div>
          </div>

          {/* Console Preview Side */}
          <motion.div 
            className="flex-1 w-full max-w-lg lg:max-w-none"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="bg-[#0B0F14] border border-[#1F2933] rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm">
              <div className="flex items-center px-4 py-3 border-b border-[#1F2933] bg-[#101720]">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF6B6B]/20 border border-[#FF6B6B]/50" />
                  <div className="w-3 h-3 rounded-full bg-[#FFD166]/20 border border-[#FFD166]/50" />
                  <div className="w-3 h-3 rounded-full bg-[#7CFF8A]/20 border border-[#7CFF8A]/50" />
                </div>
                <div className="mx-auto font-mono text-xs text-[#9AA4B2]">jata-console ~ session</div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Console Modules */}
                  <div className="bg-[#101720] border border-[#1F2933] rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#9AA4B2] text-xs font-mono">Today's Queue</span>
                      <Activity className="w-4 h-4 text-[#00F5D4]" />
                    </div>
                    <div className="text-2xl font-semibold text-[#F4F7FA]">12</div>
                  </div>
                  <div className="bg-[#101720] border border-[#1F2933] rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#9AA4B2] text-xs font-mono">A-band opportunities</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#7CFF8A]/10 text-[#7CFF8A]">HIGH FIT</span>
                    </div>
                    <div className="text-2xl font-semibold text-[#F4F7FA]">4</div>
                  </div>
                  <div className="bg-[#101720] border border-[#1F2933] rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#9AA4B2] text-xs font-mono">Packs ready for review</span>
                      <FileText className="w-4 h-4 text-[#7AA2FF]" />
                    </div>
                    <div className="text-2xl font-semibold text-[#F4F7FA]">3</div>
                  </div>
                  <div className="bg-[#101720] border border-[#1F2933] rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#9AA4B2] text-xs font-mono">Follow-ups due</span>
                      <Clock className="w-4 h-4 text-[#FFD166]" />
                    </div>
                    <div className="text-2xl font-semibold text-[#F4F7FA]">2</div>
                  </div>
                </div>

                <div className="mt-4 bg-[#101720] border border-[#1F2933] rounded p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-[#FF6B6B] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-[#F4F7FA] mb-1">Risk flags</div>
                    <div className="text-xs text-[#9AA4B2] font-mono">1 application missing cover letter.</div>
                  </div>
                </div>

                <div className="mt-4 border-t border-[#1F2933] pt-4">
                  <div className="text-xs text-[#9AA4B2] font-mono mb-2">Next best action</div>
                  <div className="flex items-center justify-between bg-[#00F5D4]/10 border border-[#00F5D4]/20 rounded px-3 py-2">
                    <span className="text-sm text-[#00F5D4]">Review Senior Staff Engineer pack</span>
                    <ChevronRight className="w-4 h-4 text-[#00F5D4]" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Workflow Strip */}
      <section id="workflow" className="relative z-10 border-t border-[#1F2933] bg-[#0B0F14]">
        <div className="max-w-7xl mx-auto px-6 py-12 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[800px] gap-4 font-mono text-sm">
            {['Capture', 'Score', 'Generate', 'Apply', 'Follow up', 'Learn'].map((step, i, arr) => (
              <div key={step} className="flex items-center gap-4 flex-1">
                <div className="flex flex-col">
                  <span className="text-[#9AA4B2] text-xs mb-1">Step 0{i + 1}</span>
                  <span className="text-[#F4F7FA] font-medium">{step}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex-1 h-px bg-gradient-to-r from-[#1F2933] to-transparent ml-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="relative z-10 border-t border-[#1F2933] bg-[#050608]">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-[#9AA4B2]">
            &copy; {new Date().getFullYear()} JATA. All rights reserved.
          </div>
          <div className="flex items-center space-x-6 text-sm text-[#9AA4B2]">
            <Link to="/privacy" className="hover:text-[#F4F7FA] transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-[#F4F7FA] transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
