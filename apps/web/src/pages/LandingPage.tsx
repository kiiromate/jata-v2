import { useEffect } from 'react';
import { ShieldCheck, Bot, BarChart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
  useEffect(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.problem-section',
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none none',
      },
    });

    tl.from('.problem-section h2', {
      opacity: 0,
      y: 20,
      duration: 0.5,
    });

    gsap.from('.solution-showcase-section > div > div > div', {
      opacity: 0,
      y: 20,
      duration: 0.5,
      stagger: 0.2,
      scrollTrigger: {
        trigger: '.solution-showcase-section',
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none none',
      },
    });
  }, []);

  return (
    <div className="bg-background text-foreground font-sans">
      {/* Hero Section */}
      <header className="py-32 px-4 hero-section">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-tight mb-4">
            Stop Playing the Job Application Lottery
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Jata helps you tailor your resume to each job, track your applications, and get hired faster.
          </p>
          <Link
            to="/login"
            className="inline-block bg-primary text-primary-foreground font-bold text-lg py-4 px-10 rounded-full hover:bg-primary/90 transition-transform transform hover:scale-105 duration-300"
          >
            Get Started for Free
          </Link>
        </div>
      </header>

      {/* Problem Section */}
      <section className="py-20 px-4 bg-muted problem-section">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold tracking-tighter leading-tight">
            The Modern Job Search is Broken
          </h2>
        </div>
      </section>

      {/* Solution Showcase Section */}
      <section className="py-20 px-4 solution-showcase-section">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-left">
              <p className="font-mono text-sm uppercase text-muted-foreground mb-2">Smart Tracking</p>
              <ShieldCheck className="w-10 h-10 text-foreground mb-4" />
              <p className="text-lg">
                Manage all your applications in one place. Know the status of every application, from sent to hired.
              </p>
            </div>
            <div className="text-left">
              <p className="font-mono text-sm uppercase text-muted-foreground mb-2">AI Optimization</p>
              <Bot className="w-10 h-10 text-foreground mb-4" />
              <p className="text-lg">
                Our AI analyzes job descriptions and helps you tailor your resume to beat the ATS and impress recruiters.
              </p>
            </div>
            <div className="text-left">
              <p className="font-mono text-sm uppercase text-muted-foreground mb-2">Insightful Analytics</p>
              <BarChart className="w-10 h-10 text-foreground mb-4" />
              <p className="text-lg">
                Understand your job search performance. Get insights into which resumes and strategies are working.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
