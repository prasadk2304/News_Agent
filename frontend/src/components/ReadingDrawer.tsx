import { X, ExternalLink, Globe, User, Tag, Sparkles } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function ReadingDrawer({ article, onClose }: { article: any, onClose: () => void }) {
  const [highlightedContent, setHighlightedContent] = useState('');
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!article) return;
    drawerRef.current?.scrollTo(0, 0);
    
    let content = article.content || 'No content available.';
    
    try {
      const entities = article.entities_json ? JSON.parse(article.entities_json) : {};
      
      const highlight = (list: string[], colorClass: string) => {
        list?.forEach(word => {
          if (!word || word.length < 3) return;
          const safeWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b(${safeWord})\\b`, 'gi');
          content = content.replace(regex, `<span class="${colorClass}">$1</span>`);
        });
      };
      
      highlight(entities.persons || [], 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 px-1 rounded font-medium border border-green-200 dark:border-green-800');
      highlight(entities.orgs || [], 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-1 rounded font-medium border border-blue-200 dark:border-blue-800');
      highlight(entities.places || [], 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 px-1 rounded font-medium border border-purple-200 dark:border-purple-800');
      
    } catch (e) {
      console.error(e);
    }
    
    setHighlightedContent(content);
  }, [article]);

  if (!article) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/80 dark:bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      <div ref={drawerRef} className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-black rounded-3xl shadow-2xl overflow-y-auto no-scrollbar border border-slate-200 dark:border-white/20 flex flex-col animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-black/95 backdrop-blur-md p-6 sm:p-8 border-b border-slate-200 dark:border-white/10 flex justify-between items-start gap-4 rounded-t-3xl">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                {article.category || 'News'}
              </span>
              <span className={`text-xs px-3 py-1 rounded-full capitalize font-bold border ${
                article.sentiment_label === 'positive' ? 'text-green-700 dark:text-green-400 bg-green-100/80 dark:bg-green-900/30 border-green-200 dark:border-green-800' : 
                article.sentiment_label === 'negative' ? 'text-red-700 dark:text-red-400 bg-red-100/80 dark:bg-red-900/30 border-red-200 dark:border-red-800' : 
                'text-slate-600 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
              }`}>
                {article.sentiment_label || 'neutral'}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {article.title}
            </h2>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500 dark:text-slate-400">
              {article.source && <span className="flex items-center gap-1 font-semibold"><Globe size={14} /> {article.source}</span>}
              {article.author && <span className="flex items-center gap-1"><User size={14} /> {article.author}</span>}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 sm:p-8 flex-1">
          {article.summary && (
            <div className="mb-8 p-5 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-white/15">
              <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Sparkles size={14} className="text-blue-500" /> AI Summary
              </h4>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {article.summary}
              </p>
            </div>
          )}

          <div className="prose prose-lg dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-loose">
            <div dangerouslySetInnerHTML={{ __html: highlightedContent.replace(/\n/g, '<br/>') }} />
          </div>
          
          <div className="mt-12 flex flex-wrap gap-2 pt-6 border-t border-slate-200 dark:border-white/10">
            {article.keywords?.map((kw: string, idx: number) => (
              <span key={idx} className="flex items-center gap-1 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border dark:border-white/10">
                <Tag size={12} /> {kw}
              </span>
            ))}
          </div>
        </div>

        <div className="p-6 sm:p-8 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-white/10 flex justify-between items-center rounded-b-3xl">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Scraped via {article.fetch_source}</span>
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Read Original <ExternalLink size={18} />
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}
