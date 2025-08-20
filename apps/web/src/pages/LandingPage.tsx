import { useRef, ElementType, useEffect } from 'react';
import { ShieldCheck, Bot, BarChart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

const features = [
  {
    title: 'Smart Tracking',
    description: 'Manage all your applications in one place. Know the status of every application, from sent to hired.',
    icon: ShieldCheck,
    color: 'bg-blue-200',
    textColor: 'text-blue-800',
  },
  {
    title: 'AI Optimization',
    description: 'Our AI analyzes job descriptions and helps you tailor your resume to beat the ATS and impress recruiters.',
    icon: Bot,
    color: 'bg-green-200',
    textColor: 'text-green-800',
  },
  {
    title: 'Insightful Analytics',
    description: 'Understand your job search performance. Get insights into which resumes and strategies are working.',
    icon: BarChart,
    color: 'bg-orange-200',
    textColor: 'text-orange-800',
  },
];

const FeatureCard = ({ feature, index }: { feature: { title: string; description: string; icon: ElementType; color: string; textColor: string; }; index: number; }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.2 }}
      className={`p-8 rounded-2xl ${feature.color} ${feature.textColor}`}
    >
      <p className="font-mono text-sm uppercase mb-4 font-semibold opacity-80">{feature.title}</p>
      <feature.icon className="w-12 h-12 mb-6" />
      <p className="text-xl leading-snug">{feature.description}</p>
    </motion.div>
  );
};

const LandingPage = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  return (
    <div className="bg-background text-foreground font-sans">
      {/* Hero Section */}
      <motion.header initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="py-32 px-4 hero-section">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-6xl md:text-8xl font-bold tracking-tighter leading-tight mb-4">
            Stop Playing the Job Application Lottery
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="text-xl md:text-2xl text-muted-foreground mb-8">
            Jata helps you tailor your resume to each job, track your applications, and get hired faster.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}>
          <Link
            to="/signup"
            className="inline-block bg-gray-800 text-white font-bold text-lg py-4 px-10 rounded-full hover:bg-gray-700 transition-all duration-300 transform hover:scale-105"
          >
            Get Started For Free
          </Link>
        </motion.div>
        </div>
      </motion.header>

      {/* Problem Section */}
      <section className="py-20 px-4 bg-muted">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter leading-tight mb-12">
            The Modern Job Search is Broken
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              className="p-6 bg-background rounded-lg shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-xl font-semibold mb-2">Resume Black Holes</h3>
              <p className="text-foreground/80">
                You spend hours tailoring your resume, only to hear nothing back. It feels like your applications disappear into a void.
              </p>
            </motion.div>
            <motion.div
              className="p-6 bg-background rounded-lg shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3 className="text-xl font-semibold mb-2">Disorganized Tracking</h3>
              <p className="text-foreground/80">
                Spreadsheets, notes, and email folders everywhere. It's impossible to keep track of which resume you sent to which company.
              </p>
            </motion.div>
            <motion.div
              className="p-6 bg-background rounded-lg shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <h3 className="text-xl font-semibold mb-2">Lack of Feedback</h3>
              <p className="text-foreground/80">
                You don't know why you're getting rejected. There's no data to help you improve your strategy.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Solution Showcase Section */}
      <section className="py-20 px-4 bg-pink-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
