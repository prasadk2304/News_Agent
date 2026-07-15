import { Link } from 'react-router-dom';
import { Sparkles, Globe, Zap, ArrowRight, Brain, Activity, Database, Code, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden selection:bg-blue-200">
      {/* Decorative floating blobs (Global to the page) */}
      <div className="fixed top-20 left-20 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float pointer-events-none z-0"></div>
      <div className="fixed bottom-20 right-20 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float-delayed pointer-events-none z-0"></div>

      {/* SECTION 1: HERO */}
      <section className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10 overflow-hidden">
        {/* Giant Calligraphy Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[65%] text-[12rem] md:text-[22rem] font-['Dancing_Script'] text-blue-600/[0.03] whitespace-nowrap z-0 select-none pointer-events-none -rotate-6 mix-blend-multiply">
          Intelligence
        </div>
        
        <div className="max-w-5xl w-full flex flex-col items-center text-center relative z-10">
          <div className="text-4xl md:text-5xl font-['Dancing_Script'] text-pink-500 mb-2 -rotate-3 drop-shadow-sm">
            the ultimate
          </div>
          <h1 className="text-7xl md:text-[9rem] font-['Playfair_Display'] font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-800 via-blue-900 to-purple-900 mb-8 tracking-tighter leading-[0.9] drop-shadow-xl">
            News <span className="italic font-light text-blue-600/90">Tracker</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600/90 mb-14 max-w-3xl font-light leading-relaxed tracking-wide">
            Harness the power of AI to scour the web, analyze sentiment, extract key entities, and generate beautiful synthesized intelligence reports in seconds.
          </p>
          
          <Link 
            to="/dashboard" 
            className="group relative inline-flex items-center justify-center px-10 py-5 font-extrabold text-white text-lg transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105"
          >
            Enter Dashboard
            <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform" size={24} />
          </Link>
        </div>
      </section>

      {/* SECTION 2: CORE FEATURES */}
      <section className="min-h-screen flex items-center justify-center p-6 relative z-10">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-extrabold text-slate-800 dark:text-white mb-4 tracking-tight">Everything you need.</h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">An entire intelligence agency, right in your browser.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-10 rounded-3xl flex flex-col items-center text-center transition-transform hover:-translate-y-2 border-white/60 shadow-lg">
              <div className="w-20 h-20 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 shadow-inner">
                <Globe size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Deep Web Search</h3>
              <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                We use Exa and Firecrawl to perform neural semantic searches across the entire web. It doesn't just match keywords; it understands the meaning of your query.
              </p>
            </div>
            
            <div className="glass-panel p-10 rounded-3xl flex flex-col items-center text-center transition-transform hover:-translate-y-2 border-white/60 shadow-lg">
              <div className="w-20 h-20 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6 shadow-inner">
                <Brain size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Live NLP Pipeline</h3>
              <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                As soon as articles are downloaded, they are run through SpaCy and VADER. We instantly extract Named Entities (People, Orgs) and compute exact sentiment scores.
              </p>
            </div>
            
            <div className="glass-panel p-10 rounded-3xl flex flex-col items-center text-center transition-transform hover:-translate-y-2 border-white/60 shadow-lg">
              <div className="w-20 h-20 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mb-6 shadow-inner">
                <Database size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Persistent Library</h3>
              <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                All your scraped data is stored safely in a relational database. You can instantly query past searches without wasting API credits or waiting for new downloads.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: INTELLIGENCE REPORTS */}
      <section className="min-h-screen flex items-center justify-center p-6 relative z-10">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 glass-panel p-8 rounded-3xl border-white/60 shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-500">
            <div className="bg-slate-800 rounded-xl p-6 text-slate-300 font-mono text-sm leading-relaxed shadow-inner overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-8 bg-slate-900 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="mt-6">
                <span className="text-purple-400"># Generated Intelligence Report</span><br/><br/>
                <span className="text-blue-400">## Executive Summary</span><br/>
                The recent trends indicate a massive shift in technology adoption. Companies are moving towards...<br/><br/>
                <span className="text-blue-400">## Key Entities</span><br/>
                - <span className="text-green-400">OpenAI</span> (Organization)<br/>
                - <span className="text-green-400">Sam Altman</span> (Person)<br/>
              </div>
            </div>
          </div>
          
          <div className="order-1 md:order-2">
            <h2 className="text-5xl font-extrabold text-slate-800 dark:text-white mb-6 tracking-tight">AI Synthesis</h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-8">
              Don't just read the news. Synthesize it. Our system aggregates dozens of articles and automatically writes comprehensive Markdown reports using extractive summarization.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-lg font-bold text-slate-700 dark:text-slate-200">
                <CheckCircle className="text-green-500" size={24} /> Executive Summaries
              </li>
              <li className="flex items-center gap-3 text-lg font-bold text-slate-700 dark:text-slate-200">
                <CheckCircle className="text-green-500" size={24} /> Sentiment Trends Analysis
              </li>
              <li className="flex items-center gap-3 text-lg font-bold text-slate-700 dark:text-slate-200">
                <CheckCircle className="text-green-500" size={24} /> Ready to Export
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="glass-panel border-t border-white/60 py-8 text-center relative z-10 mt-20">
        <p className="text-slate-500 font-medium flex items-center justify-center gap-2">
          <Code size={18} /> Built with FastAPI, React, and TailwindCSS
        </p>
      </footer>
    </div>
  );
}
