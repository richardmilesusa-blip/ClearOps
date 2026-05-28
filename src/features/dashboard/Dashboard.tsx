import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { JobDetailPanel } from '../jobs/components/JobDetailPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Eye, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const STAGES: Record<string, { label: string; color: string }> = {
  PRE_ARRIVAL: { label: "Pre-arrival docs", color: "bg-blue-100 hover:bg-blue-100 text-blue-800" },
  BL_RECEIVED: { label: "B/L received", color: "bg-blue-100 hover:bg-blue-100 text-blue-800" },
  TELEX_RELEASED: { label: "Telex released", color: "bg-purple-100 hover:bg-purple-100 text-purple-800" },
  DO_PROCESSING: { label: "DO processing", color: "bg-amber-100 hover:bg-amber-100 text-amber-800" },
  IN_TRANSIT: { label: "In transit → Kano", color: "bg-emerald-100 hover:bg-emerald-100 text-emerald-800" },
  FTZ_EXAMINATION: { label: "FTZ examination", color: "bg-purple-100 hover:bg-purple-100 text-purple-800" },
  DUTY_PAYMENT: { label: "Awaiting duty payment", color: "bg-red-100 hover:bg-red-100 text-red-800" },
  ESCORT_DELIVERY: { label: "Escort to warehouse", color: "bg-emerald-100 hover:bg-emerald-100 text-emerald-800" },
  COMPLETED: { label: "Completed", color: "bg-slate-100 hover:bg-slate-100 text-slate-700" },
};

export function Dashboard() {
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      return res.json();
    }
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    }
  });

  const dndJobs = jobs.filter((j: any) => j.financials?.dndDays > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-[10px] md:text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Active Jobs</p>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl md:text-3xl font-semibold text-slate-800">{stats?.activeJobs || 0}</p>}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-[10px] md:text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">In Transit</p>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl md:text-3xl font-semibold text-emerald-700">{stats?.inTransit || 0}</p>}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-[10px] md:text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">DND Accruing</p>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <p className={cn("text-2xl md:text-3xl font-semibold", (stats?.dndAccruing || 0) > 0 ? "text-amber-700" : "text-slate-800")}>
                {stats?.dndAccruing || 0}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-[10px] md:text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Awaiting Duty</p>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <p className={cn("text-2xl md:text-3xl font-semibold", (stats?.awaitingDuty || 0) > 0 ? "text-red-700" : "text-slate-800")}>
                {stats?.awaitingDuty || 0}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {dndJobs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 md:px-5 py-3 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs md:text-sm font-semibold text-amber-800">
              {dndJobs.length} container{dndJobs.length > 1 ? "s" : ""} accruing demurrage
            </p>
            <p className="text-[10px] md:text-xs text-amber-700 mt-0.5">
              {dndJobs.map((j: any) => `${j.reference} (Day ${j.financials?.dndDays})`).join(" · ")} — take action to avoid further charges.
            </p>
          </div>
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-800">Active jobs</CardTitle>
          <span className="text-xs text-slate-400">{jobs.length} records</span>
        </CardHeader>
        
        {jobsLoading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Activity className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-900">No active jobs</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">When new clearing jobs are created, they will appear here to be tracked.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-slate-400 uppercase tracking-wider h-10 px-4">Reference</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-400 uppercase tracking-wider h-10 px-4">Client / Goods</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-400 uppercase tracking-wider h-10 px-4">Container</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-400 uppercase tracking-wider h-10 px-4">Vessel</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-400 uppercase tracking-wider h-10 px-4">Stage</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-400 uppercase tracking-wider h-10 px-4">DND</TableHead>
                    <TableHead className="h-10 px-4 w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job: any) => {
                    const stageInfo = STAGES[job.stage] || { label: job.stage, color: "bg-slate-100 text-slate-800" };
                    const dndDays = job.financials?.dndDays || 0;

                    return (
                      <TableRow 
                        key={job.id} 
                        className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors group"
                        onClick={() => setSelectedJob(job)}
                      >
                        <TableCell className="font-mono text-xs text-slate-500 font-semibold px-4 py-3">
                          {job.reference}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <p className="font-medium text-slate-800 text-sm">{job.client}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {job.goodsDescription}
                            {job.transireRequired && <span className="ml-1 text-slate-500">· FTZ</span>}
                          </p>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-500 px-4 py-3">
                          {job.containerNumber}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 px-4 py-3">
                          {job.vesselName}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge className={cn("border-none", stageInfo.color)} variant="outline">
                            {stageInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {dndDays > 0 ? (
                            <span className="text-xs font-semibold text-red-600 flex items-center gap-1">
                              <AlertTriangle size={12} /> Day {dndDays}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity h-8 px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJob(job);
                            }}
                          >
                            <Eye size={14} className="mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {/* Mobile List View */}
            <div className="md:hidden divide-y divide-slate-100">
              {jobs.map((job: any) => {
                const stageInfo = STAGES[job.stage] || { label: job.stage, color: "bg-slate-100 text-slate-800" };
                const dndDays = job.financials?.dndDays || 0;

                return (
                  <div 
                    key={job.id} 
                    className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">{job.reference}</div>
                      <Badge className={cn("border-none text-[10px] px-1.5 py-0 h-4", stageInfo.color)} variant="outline">
                        {stageInfo.label}
                      </Badge>
                    </div>
                    <p className="font-medium text-slate-800 text-sm">{job.client}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{job.goodsDescription}</p>
                    <div className="flex items-center justify-between mt-3 text-[10px] text-slate-500 mt-2">
                       <span className="font-mono">{job.containerNumber}</span>
                       {dndDays > 0 && (
                         <span className="font-semibold text-red-600 flex items-center gap-1">
                           <AlertTriangle size={10} /> DND Day {dndDays}
                         </span>
                       )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>
      
      {/* Job Detail Sheet */}
      <JobDetailPanel 
        jobId={selectedJob?.id} 
        open={!!selectedJob} 
        onOpenChange={(open) => !open && setSelectedJob(null)} 
      />
    </div>
  );
}
