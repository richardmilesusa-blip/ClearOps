import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  Briefcase, 
  AlertTriangle, 
  FileText, 
  Ship, 
  Truck, 
  Users, 
  Building2, 
  Settings,
  Box
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const location = useLocation();

  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('Failed to fetch dashboard stats');
      return res.json();
    }
  });

  const activeJobsCount = dashboardStats?.stats?.activeJobs || 0;
  const dndJobsCount = dashboardStats?.stats?.dndWatch || 0;

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { id: "jobs", icon: Briefcase, label: "All jobs", path: "/jobs", count: activeJobsCount },
    { id: "dnd", icon: AlertTriangle, label: "DND watch", path: "/dnd", count: dndJobsCount, warn: true },
    { id: "documents", icon: FileText, label: "Documents", path: "/documents" },
  ];

  const operationsItems = [
    { id: "vessels", icon: Ship, label: "Vessels & ETAs", path: "/vessels" },
    { id: "haulage", icon: Truck, label: "Haulage", path: "/haulage" },
    { id: "vendors", icon: Users, label: "Vendors", path: "/vendors" },
    { id: "financials", icon: Building2, label: "Financials", path: "/financials" },
  ];

  return (
    <>
      <aside className="hidden md:flex w-[224px] bg-white border-r border-slate-200 flex-col flex-shrink-0 h-full">
        <div className="px-4 py-4 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Box size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-800 tracking-tight">
              ClearOps <span className="text-emerald-600 font-normal">NG</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 py-2">
            Workspace
          </p>
          
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={cn(
                  "inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50",
                  "w-full justify-start px-2.5 py-2 h-auto font-normal rounded-lg text-sm transition-colors",
                  isActive 
                    ? "bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-50 hover:text-emerald-700" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <div className="flex items-center w-full">
                  <item.icon size={15} className="mr-2.5 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.count !== undefined && (
                    <Badge 
                      variant="outline"
                      className={cn(
                        "ml-auto px-1.5 py-0.5 rounded-full text-xs font-semibold border-0",
                        item.warn && item.count > 0 
                          ? "bg-amber-100 text-amber-700" 
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {item.count}
                    </Badge>
                  )}
                </div>
              </Link>
            )
          })}

          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 py-2 mt-3">
            Operations
          </p>
          {operationsItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={cn(
                  "inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 flex w-full justify-start",
                  "px-2.5 py-2 h-auto font-normal rounded-lg text-sm transition-colors",
                  isActive 
                    ? "bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-50 hover:text-emerald-700" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <div className="flex items-center w-full">
                  <item.icon size={15} className="mr-2.5 shrink-0" />
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-3 border-t border-slate-100">
          <Link 
            to="/settings"
            className={cn(
              "inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              "w-full justify-start px-2.5 py-2 h-auto font-normal rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800",
              location.pathname === "/settings" && "bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-50 hover:text-emerald-700"
            )}
          >
            <div className="flex items-center w-full">
              <Settings size={15} className="mr-2.5 shrink-0" />
              Settings
            </div>
          </Link>
        </div>
      </aside>

      {/* Mobile Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 flex items-center justify-around pb-safe">
        {[navItems[0], navItems[1], navItems[2], operationsItems[3]].map(item => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-2 min-w-[64px]",
                isActive ? "text-emerald-600" : "text-slate-500"
              )}
            >
              <item.icon size={20} className={cn("mb-1", isActive ? "stroke-emerald-600" : "stroke-slate-500")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
