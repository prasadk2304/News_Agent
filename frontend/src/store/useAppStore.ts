import { create } from 'zustand';

interface AppState {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchNewsType: string;
  setSearchNewsType: (type: string) => void;
  useFirecrawl: boolean;
  setUseFirecrawl: (val: boolean) => void;
  searchResults: any[];
  setSearchResults: (results: any[]) => void;
  searchStats: any;
  setSearchStats: (stats: any) => void;

  reportQuery: string;
  setReportQuery: (query: string) => void;
  reportNewsType: string;
  setReportNewsType: (type: string) => void;
  activeReport: any;
  setActiveReport: (report: any) => void;

  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  searchNewsType: 'technology',
  setSearchNewsType: (type) => set({ searchNewsType: type }),
  useFirecrawl: false,
  setUseFirecrawl: (val) => set({ useFirecrawl: val }),
  searchResults: [],
  setSearchResults: (results) => set({ searchResults: results }),
  searchStats: null,
  setSearchStats: (stats) => set({ searchStats: stats }),

  reportQuery: '',
  setReportQuery: (query) => set({ reportQuery: query }),
  reportNewsType: 'technology',
  setReportNewsType: (type) => set({ reportNewsType: type }),
  activeReport: null,
  setActiveReport: (report) => set({ activeReport: report }),

  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));
