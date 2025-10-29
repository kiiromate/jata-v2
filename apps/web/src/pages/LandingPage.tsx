import { useRef, ElementType, useEffect } from 'react';
import { FileText, Repeat, LineChart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

const features = [
  {
    title: 'Application Tracking',
    description: 'Track every application from submission to response. View status, dates, and details in a single organized dashboard.',
    icon: FileText,
    color: 'bg-blue-50',
    textColor: 'text-blue-900',
  },
  {
    title: 'Resume Tailoring',
    description: 'Match your resume to job requirements. Identify missing keywords and optimize content for applicant tracking systems.',
    icon: Repeat,
    color: 'bg-green-50',
    textColor: 'text-green-900',
  },
  {
    title: 'Search Analytics',
    description: 'View response rates by industry, source, and job type. Use data to focus on opportunities that match your profile.',
    icon: LineChart,
    color: 'bg-orange-50',
    textColor: 'text-orange-900',
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
      className={`p-8 rounded-lg ${feature.color} ${feature.textColor}`}
    >
      <feature.icon className="w-10 h-10 mb-6 opacity-80" strokeWidth={1.5} />
      <h3 className="text-lg font-semibold mb-3 tracking-tight">{feature.title}</h3>
      <p className="text-base leading-relaxed opacity-90">{feature.description}</p>
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
    <div className="bg-background text-foreground font-sans antialiased">
      {/* Hero Section */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="py-32 px-4 hero-section"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6"
          >
            Track Applications.
            <br />
            Tailor Resumes.
            <br />
            Find Patterns.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            A job application tracker that helps you organize your search,
            optimize your materials, and understand what works.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link
              to="/signup"
              className="inline-block bg-gray-900 text-white font-medium text-base py-3 px-8 rounded-md hover:bg-gray-800 transition-colors duration-200"
            >
              Start Tracking
            </Link>
          </motion.div>
        </div>
      </motion.header>

      {/* Problem Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12">
            Common job search challenges
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              className="p-6 bg-white rounded-lg border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold mb-2">No responses</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Applications submitted without knowing if your materials matched the requirements or reached the right person.
              </p>
            </motion.div>
            <motion.div
              className="p-6 bg-white rounded-lg border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3 className="text-lg font-semibold mb-2">Lost details</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Scattered notes across spreadsheets, emails, and documents make it difficult to remember which version you sent to each company.
              </p>
            </motion.div>
            <motion.div
              className="p-6 bg-white rounded-lg border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <h3 className="text-lg font-semibold mb-2">No feedback loop</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Without data on which applications led to interviews, it's hard to know what to change or where to focus next.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Solution Showcase Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            Start organizing your search today
          </h2>
          <p className="text-lg text-gray-300 mb-8 leading-relaxed">
            Free account. No credit card required.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-white text-gray-900 font-medium text-base py-3 px-8 rounded-md hover:bg-gray-100 transition-colors duration-200"
          >
            Create Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
