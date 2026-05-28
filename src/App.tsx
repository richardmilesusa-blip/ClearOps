import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { DndWatchPage } from '@/features/dnd/DndWatchPage';
import { FinancialsPage } from '@/features/financials/FinancialsPage';
import { AllJobsPage } from '@/features/jobs/AllJobsPage';
import { VesselsPage } from '@/features/placeholders/VesselsPage';
import { HaulagePage } from '@/features/placeholders/HaulagePage';
import { VendorsPage } from '@/features/placeholders/VendorsPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jobs" element={<AllJobsPage />} />
            <Route path="/dnd" element={<DndWatchPage />} />
            <Route path="/financials" element={<FinancialsPage />} />
            <Route path="/vessels" element={<VesselsPage />} />
            <Route path="/haulage" element={<HaulagePage />} />
            <Route path="/vendors" element={<VendorsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

