import { ShieldCheck, Bot, BarChart } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="bg-gray-50 text-gray-800">
      {/* Hero Section */}
      <section className="text-center py-20 px-4 bg-white">
        <h1 className="text-5xl font-bold mb-4">Stop Playing the Job Application Lottery</h1>
        <p className="text-xl mb-8">Jata helps you tailor your resume to each job, track your applications, and get hired faster.</p>
        <button className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition duration-300">Get Started for Free</button>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">The Modern Job Search is Broken</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="text-2xl font-semibold mb-4">Resume Black Holes</h3>
              <p>You spend hours tailoring your resume, only to hear nothing back. It feels like your applications disappear into a void.</p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4">Disorganized Tracking</h3>
              <p>Spreadsheets, notes, and email folders everywhere. It's impossible to keep track of which resume you sent to which company.</p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4">Lack of Feedback</h3>
              <p>You don't know why you're getting rejected. There's no data to help you improve your strategy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Showcase Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Your AI-Powered Advantage</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-100 p-8 rounded-lg shadow-md text-center">
              <ShieldCheck className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-4">Smart Tracking</h3>
              <p>Manage all your applications in one place. Know the status of every application, from sent to hired.</p>
            </div>
            <div className="bg-gray-100 p-8 rounded-lg shadow-md text-center">
              <Bot className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-4">AI Optimization</h3>
              <p>Our AI analyzes job descriptions and helps you tailor your resume to beat the ATS and impress recruiters.</p>
            </div>
            <div className="bg-gray-100 p-8 rounded-lg shadow-md text-center">
              <BarChart className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-4">Insightful Analytics</h3>
              <p>Understand your job search performance. Get insights into which resumes and strategies are working.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
