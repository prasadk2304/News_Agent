import { useEffect, useState } from 'react';
import { getArticles } from '../api';
import ArticleCard from '../components/ArticleCard';
import { Loader2, Filter } from 'lucide-react';

export default function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [category, setCategory] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [daysBack, setDaysBack] = useState(7);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setLoading(true);
    getArticles({ limit: 50, category, sentiment, days_back: daysBack, query: debouncedQuery })
      .then(res => setArticles(res.data.articles))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, sentiment, daysBack, debouncedQuery]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      <div className="w-full lg:w-72 glass-panel p-6 rounded-2xl h-fit sticky top-0 shrink-0 border-white/60 dark:border-white/10 shadow-lg">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <Filter size={20} className="text-blue-500" /> Filters
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Search Query</label>
            <input 
              type="text" 
              placeholder="e.g. OpenAI"
              className="w-full glass-input rounded-xl p-3 text-sm font-medium text-slate-800 dark:text-white"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Category</label>
            <select 
              className="w-full glass-input rounded-xl p-3 text-sm font-medium text-slate-800 dark:text-white dark:bg-slate-900 cursor-pointer"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="technology">Technology</option>
              <option value="business">Business</option>
              <option value="science">Science</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Sentiment</label>
            <select 
              className="w-full glass-input rounded-xl p-3 text-sm font-medium text-slate-800 dark:text-white dark:bg-slate-900 cursor-pointer"
              value={sentiment}
              onChange={e => setSentiment(e.target.value)}
            >
              <option value="">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Timeframe</label>
            <select 
              className="w-full glass-input rounded-xl p-3 text-sm font-medium text-slate-800 dark:text-white dark:bg-slate-900 cursor-pointer"
              value={daysBack}
              onChange={e => setDaysBack(Number(e.target.value))}
            >
              <option value={1}>Last 24 Hours</option>
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={3650}>All Time</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="flex-1 space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-2 tracking-tight transition-colors">Article Library</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors">Browse and filter all scraped intelligence.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="animate-spin text-blue-500" size={48} />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {articles.map((article: any, i: number) => (
              <ArticleCard key={article.id || i} article={article} />
            ))}
            {articles.length === 0 && (
              <div className="col-span-full glass-panel p-16 text-center rounded-2xl border-white/60 dark:border-white/10 border-dashed border-2 bg-transparent shadow-none">
                <p className="text-2xl text-slate-600 dark:text-slate-400 font-bold">No articles found.</p>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Try adjusting your sidebar filters or scraping new data.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
