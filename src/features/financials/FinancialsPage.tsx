import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  ChevronDown, 
  ChevronRight, 
  Banknote, 
  TrendingUp, 
  PieChart,
  Percent,
  Edit
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount || 0);
};

// Mock chart data for last 6 months
const mockMonthlyData = [
  { month: 'Jan', revenue: 4500000, costs: 2100000 },
  { month: 'Feb', revenue: 5200000, costs: 2800000 },
  { month: 'Mar', revenue: 4800000, costs: 3100000 },
  { month: 'Apr', revenue: 6100000, costs: 2900000 },
  { month: 'May', revenue: 5900000, costs: 3500000 },
  { month: 'Jun', revenue: 7200000, costs: 4100000 },
];

export function FinancialsPage() {
  const queryClient = useQueryClient();
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['financials-jobs'],
    queryFn: async () => {
      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      return res.json();
    }
  });

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const financialsData = useMemo(() => {
    let totalRevenue = 0;
    let totalCosts = 0;

    const processedJobs = jobs.map((job: any) => {
      const f = job.financials || {};
      
      // Calculate costs
      const costs = (f.customsDuty || 0) + 
                    (f.dndCharges || 0) + 
                    (f.containerDeposit || 0) + 
                    (f.transporterFee || 0) + 
                    (f.escortFee || 0) + 
                    (f.driverInconvenienceFee || 0) + 
                    (f.miscFees || 0);
      
      // Revenue (mocked as 1.5x of costs if not explicitly set, or just sum it if there's a field)
      // Usually revenue is invoiced amount per job. Let's assume there's an `invoicedAmount` field
      const revenue = f.invoicedAmount || (costs > 0 ? costs * 1.35 : 0); // Mock 35% margin on costs if missing
      
      const profit = revenue - costs;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      totalRevenue += revenue;
      totalCosts += costs;

      let marginColor = 'text-slate-500';
      let marginBg = 'bg-slate-100';
      if (revenue > 0) {
        if (margin >= 30) { marginColor = 'text-emerald-700'; marginBg = 'bg-emerald-100'; }
        else if (margin >= 15) { marginColor = 'text-amber-700'; marginBg = 'bg-amber-100'; }
        else { marginColor = 'text-red-700'; marginBg = 'bg-red-100'; }
      }

      return {
        ...job,
        calcCosts: costs,
        calcRevenue: revenue,
        calcProfit: profit,
        calcMargin: margin,
        marginColor,
        marginBg
      };
    });

    const totalProfit = totalRevenue - totalCosts;
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      processedJobs,
      totalRevenue,
      totalCosts,
      totalProfit,
      avgMargin
    };
  }, [jobs]);

  const selectedJob = useMemo(() => {
    return financialsData.processedJobs.find((j: any) => j.id === selectedJobId);
  }, [selectedJobId, financialsData.processedJobs]);

  const [formData, setFormData] = useState<any>({});

  React.useEffect(() => {
    if (selectedJob) {
      const f = selectedJob.financials || {};
      setFormData({
        invoicedAmount: f.invoicedAmount?.toString() || '',
        customsDuty: f.customsDuty?.toString() || '',
        dndCharges: f.dndCharges?.toString() || '',
        containerDeposit: f.containerDeposit?.toString() || '',
        transporterFee: f.transporterFee?.toString() || '',
        escortFee: f.escortFee?.toString() || '',
        driverInconvenienceFee: f.driverInconvenienceFee?.toString() || '',
        miscFees: f.miscFees?.toString() || ''
      });
    }
  }, [selectedJob]);

  const logFinancialsMutation = useMutation({
    mutationFn: async (values: any) => {
      if (!selectedJobId) throw new Error('No job ID');
      const payload = {
        invoicedAmount: Number(values.invoicedAmount) || 0,
        customsDuty: Number(values.customsDuty) || 0,
        dndCharges: Number(values.dndCharges) || 0,
        containerDeposit: Number(values.containerDeposit) || 0,
        transporterFee: Number(values.transporterFee) || 0,
        escortFee: Number(values.escortFee) || 0,
        driverInconvenienceFee: Number(values.driverInconvenienceFee) || 0,
        miscFees: Number(values.miscFees) || 0
      };
      
      const res = await fetch(`/api/jobs/${selectedJobId}/financials`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update financials');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financials-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Financials updated successfully');
      setSelectedJobId(null);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const handleFinancialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logFinancialsMutation.mutate(formData);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financials</h1>
      </div>

      {/* 1. Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center space-x-4">
            <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Total Revenue</p>
              <p className="text-xl font-bold text-slate-900 font-mono tracking-tight">{formatCurrency(financialsData.totalRevenue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center space-x-4">
            <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <Banknote className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Total Costs</p>
              <p className="text-xl font-bold text-slate-900 font-mono tracking-tight">{formatCurrency(financialsData.totalCosts)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center space-x-4">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <PieChart className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Gross Profit</p>
              <p className="text-xl font-bold text-slate-900 font-mono tracking-tight">{formatCurrency(financialsData.totalProfit)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center space-x-4">
            <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
              <Percent className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Avg Margin</p>
              <p className="text-xl font-bold text-slate-900 font-mono tracking-tight">{financialsData.avgMargin.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 align-top">
        {/* Table taking 2/3 space */}
        <Card className="border-slate-200 shadow-sm lg:col-span-2">
          <CardHeader className="py-4 px-5 border-b border-slate-100 bg-white">
            <CardTitle className="text-sm font-semibold text-slate-800">Job P&L Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 py-3 uppercase tracking-wider pl-1">Job Ref / Client</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 py-3 uppercase tracking-wider text-right">Revenue</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 py-3 uppercase tracking-wider text-right">Costs</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 py-3 uppercase tracking-wider text-right">Gross Profit</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 py-3 uppercase tracking-wider text-center">Margin</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 py-3 uppercase tracking-wider text-right pr-5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-sm text-slate-500">
                      Loading data...
                    </TableCell>
                  </TableRow>
                ) : financialsData.processedJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-sm text-slate-500">
                      No jobs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  financialsData.processedJobs.map((job: any) => (
                    <React.Fragment key={job.id}>
                      <TableRow className={`hover:bg-slate-50/50 ${expandedRows[job.id] ? 'bg-slate-50' : ''}`}>
                        <TableCell className="w-8 pl-3">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 hover:bg-slate-200" 
                            onClick={() => toggleRow(job.id)}
                          >
                            {expandedRows[job.id] ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                          </Button>
                        </TableCell>
                        <TableCell className="py-3 pl-1 shrink-0">
                          <span className="font-mono text-sm font-medium text-slate-900 block">{job.reference}</span>
                          <span className="text-xs text-slate-500 truncate block max-w-[120px]">{job.client}</span>
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <span className="text-sm text-slate-700 font-mono">{formatCurrency(job.calcRevenue)}</span>
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <span className="text-sm text-slate-700 font-mono">{formatCurrency(job.calcCosts)}</span>
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <span className="text-sm font-bold text-slate-900 font-mono">{formatCurrency(job.calcProfit)}</span>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          {job.calcRevenue > 0 ? (
                            <Badge variant="outline" className={`text-xs border-transparent ${job.marginBg} ${job.marginColor}`}>
                              {job.calcMargin.toFixed(1)}%
                            </Badge>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-right pr-5">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedJobId(job.id)}
                            className="h-7 text-xs border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <Edit className="h-3 w-3 mr-1" /> Log
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedRows[job.id] && (
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b-0 border-t-0">
                          <TableCell colSpan={7} className="px-10 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-slate-100 shadow-sm text-xs font-mono">
                              <div><span className="text-slate-500 font-sans block mb-1">Customs Duty</span>{formatCurrency(job.financials?.customsDuty || 0)}</div>
                              <div><span className="text-slate-500 font-sans block mb-1">DND Charges</span>{formatCurrency(job.financials?.dndCharges || 0)}</div>
                              <div><span className="text-slate-500 font-sans block mb-1">Container Deposit</span>{formatCurrency(job.financials?.containerDeposit || 0)}</div>
                              <div><span className="text-slate-500 font-sans block mb-1">Transporter Fee</span>{formatCurrency(job.financials?.transporterFee || 0)}</div>
                              <div><span className="text-slate-500 font-sans block mb-1">Escort Fee</span>{formatCurrency(job.financials?.escortFee || 0)}</div>
                              <div><span className="text-slate-500 font-sans block mb-1">Inconvenience Fee</span>{formatCurrency(job.financials?.driverInconvenienceFee || 0)}</div>
                              <div><span className="text-slate-500 font-sans block mb-1">Misc Fees</span>{formatCurrency(job.financials?.miscFees || 0)}</div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Chart taking 1/3 space on large, 1/1 on small */}
        <Card className="border-slate-200 shadow-sm lg:col-span-1 h-fit">
          <CardHeader className="py-4 px-5 border-b border-slate-100 bg-white">
            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center">
              Monthly P&L (H1 2026)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockMonthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                    tickFormatter={(value) => `₦${(value / 1000000).toFixed(0)}M`}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), undefined]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[2, 2, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="costs" name="Costs" fill="#ef4444" radius={[2, 2, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={!!selectedJobId} onOpenChange={(open) => !open && setSelectedJobId(null)}>
        <SheetContent className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col bg-white border-l border-slate-200">
          {selectedJob && (
            <form onSubmit={handleFinancialsSubmit} className="flex flex-col h-full">
              <SheetHeader className="p-6 border-b border-slate-100 shrink-0 bg-slate-50/50">
                <SheetTitle className="text-xl font-semibold text-slate-800">
                  Log Financials
                </SheetTitle>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline" className="font-mono text-slate-600 bg-white">
                    {selectedJob.reference}
                  </Badge>
                  <span className="text-sm font-medium text-slate-700">{selectedJob.client}</span>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Revenue / Invoiced</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">Total Invoiced Amount (₦)</label>
                      <Input 
                        type="number" 
                        value={formData.invoicedAmount} 
                        onChange={(e) => setFormData(prev => ({...prev, invoicedAmount: e.target.value}))}
                        className="bg-emerald-50/30 border-emerald-100 focus-visible:ring-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Costs Log</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">Customs Duty (₦)</label>
                      <Input type="number" value={formData.customsDuty} onChange={(e) => setFormData(prev => ({...prev, customsDuty: e.target.value}))} className="font-mono" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">DND Charges (₦)</label>
                      <Input type="number" value={formData.dndCharges} onChange={(e) => setFormData(prev => ({...prev, dndCharges: e.target.value}))} className="font-mono" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">Container Deposit (₦)</label>
                      <Input type="number" value={formData.containerDeposit} onChange={(e) => setFormData(prev => ({...prev, containerDeposit: e.target.value}))} className="font-mono" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">Transporter Fee (₦)</label>
                      <Input type="number" value={formData.transporterFee} onChange={(e) => setFormData(prev => ({...prev, transporterFee: e.target.value}))} className="font-mono" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">Escort Fee (₦)</label>
                      <Input type="number" value={formData.escortFee} onChange={(e) => setFormData(prev => ({...prev, escortFee: e.target.value}))} className="font-mono" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">Driver Inconvenience Fee (₦)</label>
                      <Input type="number" value={formData.driverInconvenienceFee} onChange={(e) => setFormData(prev => ({...prev, driverInconvenienceFee: e.target.value}))} className="font-mono" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1.5 block">Miscellaneous Fees (₦)</label>
                      <Input type="number" value={formData.miscFees} onChange={(e) => setFormData(prev => ({...prev, miscFees: e.target.value}))} className="font-mono" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50 shrink-0">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setSelectedJobId(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={logFinancialsMutation.isPending}>
                  {logFinancialsMutation.isPending ? 'Saving...' : 'Save Financials'}
                </Button>
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
