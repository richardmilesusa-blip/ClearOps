import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLocation } from 'react-router-dom';
import { NewJobModal } from '@/features/jobs/components/NewJobModal';

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/jobs": "All Jobs",
  "/dnd": "DND Watch",
  "/documents": "Documents",
  "/vessels": "Vessels & ETAs",
  "/haulage": "Haulage",
  "/vendors": "Vendors",
  "/financials": "Financials",
  "/settings": "Settings",
};

export function TopBar() {
  const location = useLocation();
  const title = routeTitles[location.pathname] || "Dashboard";

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0 sticky top-0 z-10 w-full">
      <h1 className="text-sm font-semibold text-slate-800 capitalize">{title}</h1>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input 
            placeholder="Search jobs..." 
            className="pl-8 w-52 h-8 text-xs bg-white border-slate-200 focus-visible:ring-emerald-500" 
          />
        </div>
        <NewJobModal />
      </div>
    </header>
  );
}
