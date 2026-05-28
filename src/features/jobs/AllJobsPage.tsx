import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { JobDetailPanel } from './components/JobDetailPanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Eye, PackageSearch, Search, SlidersHorizontal, Activity, Anchor } from 'lucide-react';
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

export function AllJobsPage() {
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [search, setSearch] = useState("");

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      return res.json();
    }
  });

  const filteredJobs = jobs.filter((job: any) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      job.reference?.toLowerCase().includes(term) ||
      job.client?.toLowerCase().includes(term) ||
      job.containerNumber?.toLowerCase().includes(term) ||
      job.vesselName?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row items-baseline justify-between mb-2">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">All Jobs Database</h1>
        <p className="text-xs text-slate-500 mt-1 md:mt-0">Comprehensive record of all active and historical clearing operations.</p>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="py-4 px-5 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center w-full md:w-auto relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              type="text" 
              placeholder="Search reference, client, container..." 
              className="pl-9 bg-slate-50/50 border-slate-200 h-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <Button variant="outline" size="sm" className="h-9 gap-2 text-slate-600 bg-white border-slate-200">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden md:inline">Filters</span>
            </Button>
          </div>
        </CardHeader>
        
        {jobsLoading ? (
          <div className="p-5 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <PackageSearch className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-medium text-slate-900">No jobs found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">No clearing jobs match your current search constraints.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-b border-slate-100 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-10 px-5">Reference</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-10 px-5">Client / Goods</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-10 px-5">Container</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-10 px-5">Vessel</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-10 px-5">Stage</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider h-10 px-5">DND</TableHead>
                    <TableHead className="h-10 px-5 w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job: any) => {
                    const stageInfo = STAGES[job.stage] || { label: job.stage, color: "bg-slate-100 text-slate-800" };
                    const dndDays = job.financials?.dndDays || 0;

                    return (
                      <TableRow 
                        key={job.id} 
                        className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors group"
                        onClick={() => setSelectedJob(job)}
                      >
                        <TableCell className="font-mono text-xs text-slate-700 font-medium px-5 py-3">
                          {job.reference}
                        </TableCell>
                        <TableCell className="px-5 py-3">
                          <p className="font-medium text-slate-800 text-sm">{job.client}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {job.goodsDescription}
                            {job.transireRequired && <span className="ml-1 font-medium text-slate-600">· FTZ</span>}
                          </p>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-500 px-5 py-3">
                          {job.containerNumber}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 px-5 py-3">
                          {job.vesselName}
                        </TableCell>
                        <TableCell className="px-5 py-3">
                          <Badge className={cn("border-none", stageInfo.color)} variant="outline">
                            {stageInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-3">
                          {dndDays > 0 ? (
                            <span className="text-xs font-semibold text-red-600 flex items-center gap-1">
                              <AlertTriangle size={12} /> Day {dndDays}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-3 text-right">
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
            
            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-slate-100 pb-20 md:pb-0">
              {filteredJobs.map((job: any) => {
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
                    <div className="flex items-center justify-between mt-3 text-[10px] text-slate-500 mt-2 border-t border-slate-50 pt-2">
                       <span className="font-mono">{job.containerNumber}</span>
                       <span className="flex items-center gap-1"><Anchor className="h-3 w-3" /> {job.vesselName}</span>
                    </div>
                    {dndDays > 0 && (
                      <div className="mt-2 text-[10px] font-semibold text-red-600 flex items-center gap-1">
                        <AlertTriangle size={10} /> DND Day {dndDays}
                      </div>
                    )}
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
