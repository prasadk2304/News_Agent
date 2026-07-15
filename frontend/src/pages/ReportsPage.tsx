import { useState, useEffect } from 'react';
import { generateReport, getReports, getReportById } from '../api';
import { Loader2, FileText, Download, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { 
    reportQuery, setReportQuery,
    reportNewsType, setReportNewsType,
    activeReport, setActiveReport
  } = useAppStore();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = () => {
    getReports().then(res => setReports(res.data)).catch(console.error);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportQuery) return;
    
    setLoading(true);
    
    const generatePromise = generateReport({ query: reportQuery, news_type: reportNewsType, days_back: 7 }).then(res => {
      setActiveReport(res.data);
      fetchReports();
      return res;
    });

    toast.promise(generatePromise, {
      loading: 'Synthesizing intelligence report...',
      success: 'Report generated successfully!',
      error: 'Failed. Need at least 3 matching articles.'
    }).finally(() => setLoading(false));
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8 print:space-y-0">
      <div className="print:hidden">
        <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-2 tracking-tight transition-colors">Intelligence Reports</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors">Generate synthesized markdown reports from your database.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
        <div className="lg:col-span-1 space-y-6 print:hidden">
          <div className="glass-panel p-6 rounded-2xl shadow-lg border-white/60">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
              <Sparkles className="text-purple-500" size={20} /> New Report
            </h3>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1.5">Topic / Query</label>
                <input 
                  type="text" 
                  value={reportQuery}
                  onChange={e => setReportQuery(e.target.value)}
                  className="w-full glass-input rounded-xl p-3 text-slate-800 dark:text-white outline-none font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1.5">News Type</label>
                <select 
                  value={reportNewsType}
                  onChange={e => setReportNewsType(e.target.value)}
                  className="w-full glass-input rounded-xl p-3 text-slate-800 dark:text-white dark:bg-slate-900 outline-none font-medium cursor-pointer"
                >
                  <option value="technology">Technology</option>
                  <option value="business">Business</option>
                  <option value="science">Science</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white p-3.5 rounded-xl font-bold shadow-lg shadow-purple-500/30 transition-all hover:-translate-y-0.5 flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
                Generate AI Synthesis
              </button>
            </form>
          </div>

          <div className="glass-panel p-6 rounded-2xl shadow-lg border-white/60">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="text-blue-500" size={20} /> Past Reports
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {reports.map((r, i) => (
                <button 
                  key={i}
                  onClick={() => {
                    setActiveReport(r);
                    if (!r.content_markdown) {
                      getReportById(r.id).then(res => setActiveReport(res.data)).catch(console.error);
                    }
                  }}
                  className={`w-full text-left p-3.5 rounded-xl flex flex-col transition-all duration-200 ${
                    activeReport?.id === r.id 
                      ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 shadow-sm scale-[1.02]' 
                      : 'bg-white/40 dark:bg-slate-800/40 hover:bg-white/80 dark:hover:bg-slate-800/80 border border-transparent hover:shadow-sm'
                  }`}
                >
                  <span className="font-bold text-slate-800 dark:text-white truncate">{r.title}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(r.generated_at).toLocaleDateString()} • {r.articles_count} articles</span>
                </button>
              ))}
              {reports.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic">No reports generated yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 print:col-span-1 print:w-full">
          {activeReport ? (
            <div className="glass-panel rounded-3xl flex flex-col h-full min-h-[600px] shadow-2xl border-white/80 dark:border-white/10 overflow-hidden print:shadow-none print:border-none">
              <div className="p-5 border-b border-slate-200/50 flex justify-between items-center bg-white/40 dark:bg-slate-800/40 backdrop-blur-md print:hidden">
                <h3 className="font-extrabold text-slate-800 dark:text-white text-xl truncate pr-4">{activeReport.title}</h3>
                <button 
                  onClick={handleExportPDF}
                  className="text-blue-600 dark:text-blue-400 hover:text-white py-1.5 px-3 hover:bg-blue-600 rounded-lg transition-colors font-bold text-sm flex items-center gap-2 shadow-sm bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-900"
                >
                  <Download size={16} /> Export PDF
                </button>
              </div>
              <div className="p-8 overflow-auto flex-1 prose prose-slate dark:prose-invert max-w-none bg-white/20 dark:bg-slate-900/20 print:bg-white print:text-black print:p-0">
                <h1 className="hidden print:block text-4xl font-black mb-8">{activeReport.title}</h1>
                <pre className="whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300 print:text-black leading-relaxed text-lg">
                  {activeReport.content_markdown}
                </pre>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-3xl h-full min-h-[600px] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-300/50 dark:border-slate-700/50">
              <FileText size={48} className="text-slate-400 dark:text-slate-600 mb-4 animate-bounce" />
              <p className="text-xl font-bold text-slate-600 dark:text-slate-400">Select or generate a report to view.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
