import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Toaster } from '@/components/ui/sonner';

export function AppLayout() {
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative border-l border-transparent">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 relative pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
