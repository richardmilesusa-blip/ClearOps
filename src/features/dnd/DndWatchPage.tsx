import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Anchor, 
  Clock, 
  TrendingUp,
  Inbox
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock chart data for last 6 months
const mockChartData = [
  { month: 'Jan', cost: 1200000 },
  { month: 'Feb', cost: 850000 },
  { month: 'Mar', cost: 2100000 },
  { month: 'Apr', cost: 1600000 },
  { month: 'May', cost: 950000 },
  { month: 'Jun', cost: 3200000 },
];

const SHIPPING_LINES = ['Maersk', 'MSC', 'Grimaldi', 'CMA CGM', 'Hapag-Lloyd'];
const DAILY_CHARGE = 65000;

export function DndWatchPage() {
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['dnd-jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs/dnd-watch');
      if (!res.ok) throw new Error('Failed to fetch DND jobs');
      return res.json();
    }
  });

  const resolveMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch(`/api/jobs/${jobId}/financials`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dndDays: 0 }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to resolve DND');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dnd-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('DND resolved. Days reset to 0.', {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const enrichJobs = useMemo(() => {
    return jobs.map((job: any, index: number) => {
      const line = SHIPPING_LINES[job.vesselName?.length % SHIPPING_LINES.length || index % SHIPPING_LINES.length];
      const dndDays = job.financials?.dndDays || 0;
      const dailyCharge = DAILY_CHARGE;
      const totalAccrued = dndDays * dailyCharge;
      
      let urgencyColor = 'bg-amber-100 text-amber-800';
      let dotColor = 'bg-amber-500';
      if (dndDays >= 3 && dndDays <= 4) {
        urgencyColor = 'bg-orange-100 text-orange-800';
        dotColor = 'bg-orange-500';
      } else if (dndDays >= 5) {
        urgencyColor = 'bg-red-100 text-red-800';
        dotColor = 'bg-red-600 animate-pulse';
      }

      return {
        ...job,
        shippingLine: line,
        dailyCharge,
        totalAccrued,
        urgencyColor,
        dotColor,
        dndDays
      };
    });
  }, [jobs]);

  const totalDailyCost = enrichJobs.reduce((sum: number, j: any) => sum + j.dailyCharge, 0);
  const containerCount = enrichJobs.length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">DND Watch</h1>
      </div>

      {/* 1. Summary Banner */}
      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-lg" />
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-red-900 font-semibold text-sm">
                {containerCount} {containerCount === 1 ? 'container' : 'containers'} currently accruing demurrage at APM Terminal Apapa
              </h2>
              <p className="text-red-700 text-xs mt-1">Escalation protocol recommended for aging boxes.</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-red-700 text-xs font-medium uppercase tracking-wider mb-1">Estimated Daily Cost</p>
            <p className="text-2xl font-bold text-red-700 font-mono tracking-tight">{formatCurrency(totalDailyCost)}</p>
          </div>
        </div>
      )}

      {/* 2. Priority Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="py-4 px-5 border-b border-slate-100 bg-white">
          <CardTitle className="text-sm font-semibold text-slate-800">At-Risk Containers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-slate-600 py-3 uppercase tracking-wider pl-5">Job Ref</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 py-3 uppercase tracking-wider">Client & Container</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 py-3 uppercase tracking-wider">Shipping Line</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 py-3 uppercase tracking-wider text-center">DND Days</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 py-3 uppercase tracking-wider text-right">Daily Charge</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 py-3 uppercase tracking-wider text-right">Total Accrued</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 py-3 uppercase tracking-wider text-center">Stage Blocked</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 py-3 uppercase tracking-wider text-right pr-5">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-4">
                      <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : enrichJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-900">All Clear</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm">No containers are currently accruing demurrage or detention charges.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  enrichJobs.map((job: any) => (
                    <TableRow key={job.id} className="hover:bg-slate-50/50">
                      <TableCell className="pl-5 py-3">
                        <span className="font-mono text-sm font-medium text-slate-900">{job.reference}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="text-sm font-medium text-slate-900">{job.client}</p>
                        <p className="text-xs font-mono text-slate-500">{job.containerNumber}</p>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center text-sm text-slate-700">
                          <Anchor className="h-3.5 w-3.5 mr-2 text-slate-400" />
                          {job.shippingLine}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${job.urgencyColor}`}>
                          <div className={`h-1.5 w-1.5 rounded-full mr-1.5 ${job.dotColor}`} />
                          {job.dndDays} {job.dndDays === 1 ? 'day' : 'days'}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <span className="text-sm text-slate-700 font-mono">{formatCurrency(job.dailyCharge)}</span>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <span className="text-sm font-bold text-slate-900 font-mono">{formatCurrency(job.totalAccrued)}</span>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <Badge variant="outline" className="text-[10px] uppercase text-slate-600 bg-slate-50 border-slate-200">
                          {job.stage.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right pr-5">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => resolveMutation.mutate(job.id)}
                          disabled={resolveMutation.isPending}
                          className="h-7 text-xs border-slate-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Resolve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
        {/* 3. Free Days Tracker */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="py-4 px-5 border-b border-slate-100 bg-white">
            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-slate-500" /> Free Days Tracker
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-4">
              {[
                { line: 'Maersk', allowed: 21, used: 15, route: 'Far East' },
                { line: 'MSC', allowed: 14, used: 13, route: 'Europe' },
                { line: 'CMA CGM', allowed: 14, used: 8, route: 'Middle East' },
              ].map((trk) => {
                const remaining = trk.allowed - trk.used;
                const percent = (trk.used / trk.allowed) * 100;
                let bgPercent = 'bg-emerald-500';
                if (percent >= 80) bgPercent = 'bg-orange-500';
                if (percent >= 90) bgPercent = 'bg-red-500';

                return (
                  <div key={trk.line} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{trk.line}</p>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">{trk.route}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${percent >= 90 ? 'text-red-700' : 'text-slate-900'}`}>
                          {remaining} days left
                        </p>
                        <p className="text-[10px] text-slate-500">of {trk.allowed} allowed</p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${bgPercent}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 4. Costs Bar Chart */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="py-4 px-5 border-b border-slate-100 bg-white">
            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-slate-500" /> Monthly DND Accruals (H1 2026)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), 'Costs']}
                  />
                  <Bar 
                    dataKey="cost" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
