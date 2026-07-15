import { ExternalLink, Tag } from 'lucide-react';
import ReadingDrawer from './ReadingDrawer';
import { useState } from 'react';

export default function ArticleCard({ article }: { article: any }) {
  const isPositive = article.sentiment_label === 'positive';
  const isNegative = article.sentiment_label === 'negative';
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  return (
    <>
      <div 
        onClick={() => setDrawerOpen(true)}
        className="glass flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer dark:hover:border-blue-500/50"
      >
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-900/30 px-3 py-1 rounded-full shadow-sm border border-blue-200 dark:border-blue-800">
              {article.category || 'News'}
            </span>
            <span className={`text-xs px-3 py-1 rounded-full capitalize font-bold shadow-sm border ${
              isPositive ? 'text-green-700 dark:text-green-400 bg-green-100/80 dark:bg-green-900/30 border-green-200 dark:border-green-800' : 
              isNegative ? 'text-red-700 dark:text-red-400 bg-red-100/80 dark:bg-red-900/30 border-red-200 dark:border-red-800' : 
              'text-slate-600 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
            }`}>
              {article.sentiment_label || 'neutral'}
            </span>
          </div>
          
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-2 line-clamp-2 leading-tight" title={article.title}>
            {article.title}
          </h3>
          
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 line-clamp-3 flex-1 leading-relaxed">
            {article.summary || 'No summary available.'}
          </p>
          
          <div className="flex flex-wrap gap-2 mt-auto">
            {article.keywords?.slice(0, 3).map((kw: string, idx: number) => (
              <span key={idx} className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg">
                <Tag size={10} /> {kw}
              </span>
            ))}
          </div>
        </div>
        
        <div className="bg-slate-50/60 dark:bg-slate-900/60 backdrop-blur-md p-4 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-between items-center text-sm">
          <span className="text-slate-500 dark:text-slate-400 font-semibold truncate pr-4">
            {article.source || 'Unknown Source'}
          </span>
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-blue-600 dark:text-blue-400 font-bold hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 shrink-0 group"
          >
            Original <ExternalLink size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </a>
        </div>
      </div>

      {drawerOpen && (
        <ReadingDrawer article={article} onClose={() => setDrawerOpen(false)} />
      )}
    </>
  );
}
