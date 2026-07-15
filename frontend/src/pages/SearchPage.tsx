import { useState } from 'react';
import { searchNews } from '../api';
import { Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ArticleCard from '../components/ArticleCard';
import { useAppStore } from '../store/useAppStore';

export default function SearchPage() {
  const { 
    searchQuery, setSearchQuery, 
    searchNewsType, setSearchNewsType,
    useFirecrawl, setUseFirecrawl,
    searchResults, setSearchResults,
    searchStats, setSearchStats
  } = useAppStore();
  
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setLoading(true);
    
    const searchPromise = searchNews({
      query: searchQuery,
      news_type: searchNewsType,
      num_results: 10,
      use_firecrawl: useFirecrawl
    }).then(res => {
      setSearchResults(res.data.articles);
      setSearchStats({
        found: res.data.articles_found,
        new: res.data.articles_new,
        time: res.data.duration_seconds
      });
      return res;
    });

    toast.promise(searchPromise, {
      loading: 'Scouring the web...',
      success: (res) => `Found ${res.data.articles_found} articles (${res.data.articles_new} new)!`,
      error: 'Search failed. Please try again.'
    }).finally(() => setLoading(false));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-2 tracking-tight transition-colors">Search & Discover</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors">Query the web for the latest news, articles, and analysis.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-white/60 shadow-lg">
        <form onSubmit={handleSearch} className="space-y-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500" size={20} />
              <input 
                type="text" 
                placeholder="Topic, company, or event..." 
                className="w-full glass-input rounded-xl py-3 pl-12 pr-4 text-slate-800 dark:text-white outline-none font-medium"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              value={searchNewsType} 
              onChange={e => setSearchNewsType(e.target.value)}
              className="glass-input rounded-xl px-4 py-3 text-slate-800 dark:text-white dark:bg-slate-900 outline-none font-medium cursor-pointer"
            >
              <option value="technology">Technology</option>
              <option value="business">Business</option>
              <option value="science">Science</option>
              <option value="breaking">Breaking News</option>
              <option value="analysis">Deep Analysis</option>
            </select>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg text-white px-8 py-3 rounded-xl font-bold transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              Search
            </button>
          </div>
          
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium cursor-pointer w-max">
            <input 
              type="checkbox" 
              checked={useFirecrawl} 
              onChange={e => setUseFirecrawl(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            Use Deep Scraping Fallback (Firecrawl)
          </label>
        </form>
      </div>

      {searchStats && (
        <div className="inline-block glass-panel px-5 py-3 rounded-xl text-sm text-blue-700 dark:text-blue-300 font-bold border border-blue-200/50 dark:border-blue-800/50 shadow-sm animate-pulse">
          Found {searchStats.found} articles ({searchStats.new} new to database) in {searchStats.time}s
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {searchResults.map((article: any, i: number) => (
          <ArticleCard key={article.id || i} article={article} />
        ))}
      </div>
    </div>
  );
}
