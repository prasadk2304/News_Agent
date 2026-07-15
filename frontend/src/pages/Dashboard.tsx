import { useEffect, useState } from 'react';
import { getStats, getArticles } from '../api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Activity, BookOpen, Layers, Download, X } from 'lucide-react';
import ArticleCard from '../components/ArticleCard';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [drillDownFilter, setDrillDownFilter] = useState<{type: string, value: string} | null>(null);
  const [drillDownArticles, setDrillDownArticles] = useState<any[]>([]);

  useEffect(() => {
    getStats().then(res => setStats(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!drillDownFilter) return;
    const params: any = { limit: 6 };
    if (drillDownFilter.type === 'sentiment') params.sentiment = drillDownFilter.value.toLowerCase();
    if (drillDownFilter.type === 'category') params.category = drillDownFilter.value;
    
    getArticles(params).then(res => setDrillDownArticles(res.data.articles)).catch(console.error);
  }, [drillDownFilter]);

  if (!stats) return <div className="text-slate-500 font-medium">Loading dashboard analytics...</div>;

  const categoryData = Object.entries(stats.by_category).map(([name, value]) => ({ name, value }));
  const sentimentData = [
    { name: 'Positive', value: stats.sentiment_distribution.positive || 0, color: '#10b981' },
    { name: 'Negative', value: stats.sentiment_distribution.negative || 0, color: '#ef4444' },
    { name: 'Neutral', value: stats.sentiment_distribution.neutral || 0, color: '#94a3b8' }
  ];

  const handleExportCSV = () => {
    const csv = `Metric,Value\nTotal Articles,${stats.total_articles}\nAvg Sentiment,${stats.avg_sentiment}\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard_stats.csv';
    a.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-2 tracking-tight transition-colors">Analytics Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors">Real-time overview of your intelligence database.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold shadow-md hover:scale-105 transition-all"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border-white/60 dark:border-white/10 shadow-lg flex items-center gap-5 transition-transform hover:-translate-y-1">
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-4 rounded-xl text-white shadow-md">
            <BookOpen size={28} />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider">Total Articles</p>
            <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{stats.total_articles}</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border-white/60 dark:border-white/10 shadow-lg flex items-center gap-5 transition-transform hover:-translate-y-1">
          <div className="bg-gradient-to-br from-green-400 to-green-600 p-4 rounded-xl text-white shadow-md">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider">Avg Sentiment</p>
            <p className="text-3xl font-extrabold text-slate-800 dark:text-white capitalize">{stats.avg_sentiment}</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border-white/60 dark:border-white/10 shadow-lg flex items-center gap-5 transition-transform hover:-translate-y-1">
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-4 rounded-xl text-white shadow-md">
            <Layers size={28} />
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider">Active Categories</p>
            <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{categoryData.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border-white/60 dark:border-white/10 shadow-lg">
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-6">Articles by Category</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 italic">Click a slice to drill down</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  onClick={(data) => setDrillDownFilter({ type: 'category', value: data.name })}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {categoryData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', border: 'none', borderRadius: '12px', color: '#000' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-white/60 dark:border-white/10 shadow-lg">
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-6">Sentiment Distribution</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 italic">Click a bar to drill down</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sentimentData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', border: 'none', borderRadius: '12px', color: '#000' }}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={60} 
                  onClick={(data) => setDrillDownFilter({ type: 'sentiment', value: data.name })}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {drillDownFilter && (
        <div className="glass-panel p-8 rounded-2xl border-white/60 dark:border-white/10 shadow-2xl animate-in slide-in-from-bottom-8 bg-blue-50/50 dark:bg-blue-900/10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Drill Down Results</h3>
              <p className="text-slate-500 font-medium mt-1 text-sm">
                Showing top articles for <span className="font-bold capitalize">{drillDownFilter.type}: {drillDownFilter.value}</span>
              </p>
            </div>
            <button 
              onClick={() => setDrillDownFilter(null)}
              className="p-2 rounded-full hover:bg-white dark:hover:bg-slate-800 transition-colors text-slate-500"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {drillDownArticles.map((article: any, i: number) => (
              <ArticleCard key={article.id || i} article={article} />
            ))}
            {drillDownArticles.length === 0 && (
              <p className="text-slate-500 italic">No articles found matching this filter.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
