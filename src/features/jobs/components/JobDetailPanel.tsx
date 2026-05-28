import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  Check,
  Upload,
  FileText,
  Download,
  Banknote,
  X,
  Save,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STAGES = [
  { id: 'PRE_ARRIVAL', label: 'PRE_ARRIVAL' },
  { id: 'BL_RECEIVED', label: 'BL_RECEIVED' },
  { id: 'TELEX_RELEASED', label: 'TELEX_RELEASED' },
  { id: 'DO_PROCESSING', label: 'DO_PROCESSING' },
  { id: 'IN_TRANSIT', label: 'IN_TRANSIT' },
  { id: 'FTZ_EXAMINATION', label: 'FTZ_EXAMINATION' },
  { id: 'DUTY_PAYMENT', label: 'DUTY_PAYMENT' },
  { id: 'ESCORT_DELIVERY', label: 'ESCORT_DELIVERY' },
  { id: 'COMPLETED', label: 'COMPLETED' },
];

export function JobDetailPanel({
  jobId,
  open,
  onOpenChange,
}: {
  jobId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFinancialsForm, setShowFinancialsForm] = useState(false);
  const [financialsFormData, setFinancialsFormData] = useState({
    containerDeposit: '',
    dndCharges: '',
    customsDuty: '',
  });

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) throw new Error('Failed to fetch job details');
      return res.json();
    },
    enabled: !!jobId && open,
  });

  // Keep internal form state synced roughly with fetched job if not showing
  React.useEffect(() => {
    if (showFinancialsForm && job?.financials) {
      setFinancialsFormData({
        containerDeposit: job.financials.containerDeposit?.toString() || '0',
        dndCharges: job.financials.dndCharges?.toString() || '0',
        customsDuty: job.financials.customsDuty?.toString() || '0',
      });
    }
  }, [showFinancialsForm, job]);

  const advanceStageMutation = useMutation({
    mutationFn: async (nextStage: string) => {
      if (!jobId) throw new Error('No job ID');
      const res = await fetch(`/api/jobs/${jobId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: nextStage }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update stage');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['job', jobId], data);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success(`Stage advanced to ${data.stage}`);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (fileUrl: string) => {
      if (!jobId) throw new Error('No job ID');
      const res = await fetch(`/api/jobs/${jobId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'OTHER', fileUrl }),
      });
      if (!res.ok) throw new Error('Failed to upload document');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      toast.success('Document uploaded successfully');
    },
    onError: (error: any) => toast.error(error.message),
  });

  const logFinancialsMutation = useMutation({
    mutationFn: async (values: any) => {
      if (!jobId) throw new Error('No job ID');
      // Convert empty strings to 0 for the API
      const payload = {
        containerDeposit: Number(values.containerDeposit) || 0,
        dndCharges: Number(values.dndCharges) || 0,
        customsDuty: Number(values.customsDuty) || 0,
      };
      
      const res = await fetch(`/api/jobs/${jobId}/financials`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update financials');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      setShowFinancialsForm(false);
      toast.success('Financials updated successfully');
    },
    onError: (error: any) => toast.error(error.message),
  });

  if (!open) return null;

  const currentStageIndex = STAGES.findIndex((s) => s.id === job?.stage);
  const nextStage = STAGES[currentStageIndex + 1];

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '₦0';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(val);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Simulate upload and get fake URL
    const fileUrl = `https://storage.example.com/${file.name.replace(/\s+/g, '-')}`;
    
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    uploadDocumentMutation.mutate(fileUrl);
  };

  const handleFinancialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logFinancialsMutation.mutate(financialsFormData);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col bg-white border-l border-slate-200">
        {isLoading || !job ? (
          <div className="p-6 text-sm text-slate-500">Loading details...</div>
        ) : (
          <>
            <SheetHeader className="p-6 border-b border-slate-100 shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline" className="mb-2 bg-slate-50 text-slate-600 border-slate-200">
                    {job.stage}
                  </Badge>
                  <SheetTitle className="text-xl font-mono text-slate-900 tracking-tight">
                    {job.reference}
                  </SheetTitle>
                  <p className="text-sm font-medium text-slate-700 mt-1">{job.client}</p>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span>{job.goodsDescription}</span>
                <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded">{job.containerNumber}</span>
              </p>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
              {/* DND Alert */}
              {job.financials?.dndDays > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-red-800">DND Alert triggered</h4>
                    <p className="text-xs text-red-600 mt-1">
                      Container is accruing demurrage. {job.financials.dndDays} days currently logged. Escalate recovery.
                    </p>
                  </div>
                </div>
              )}

              {/* Progress Tracker */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Workflow Progress</h3>
                <div className="space-y-0 text-sm">
                  {STAGES.map((stage, idx) => {
                    const isCompleted = idx < currentStageIndex;
                    const isCurrent = idx === currentStageIndex;
                    const isFuture = idx > currentStageIndex;

                    return (
                      <div key={stage.id} className={cn("flex relative", !isFuture && "pb-6")}>
                        {idx !== STAGES.length - 1 && (
                          <div className={cn("absolute left-[11px] top-6 bottom-0 w-px", isCompleted ? "bg-emerald-500" : "bg-slate-200")} />
                        )}
                        <div className={cn("relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border", 
                          isCompleted ? "border-emerald-500 bg-emerald-500 text-white" : 
                          isCurrent ? "border-emerald-500 bg-white" : "border-slate-300 bg-white"
                        )}>
                          {isCompleted ? <Check className="h-3.5 w-3.5" /> : 
                           isCurrent ? <div className="h-2 w-2 rounded-full bg-emerald-500" /> :
                           <span className="text-[10px] text-slate-500">{idx + 1}</span>}
                        </div>
                        <div className={cn("ml-3 w-full rounded-md px-3 py-1.5 -mt-1 flex items-center justify-between",
                          isCurrent ? "bg-emerald-50 text-emerald-900 border border-emerald-100" :
                          isCompleted ? "text-slate-700" : "text-slate-400"
                        )}>
                          <span className={isCurrent ? "font-medium" : "font-normal"}>{stage.id.replace(/_/g, ' ')}</span>
                          {isCurrent && <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 h-5 px-1.5 text-[10px] uppercase">Current</Badge>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator className="bg-slate-100" />

              {/* Financials Summary */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Financials Snapshot</h3>
                  {!showFinancialsForm && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowFinancialsForm(true)}
                      className="h-6 text-xs text-slate-500 p-0 hover:bg-transparent hover:text-emerald-600"
                    >
                      <Banknote className="w-3.5 h-3.5 mr-1" /> Log financials
                    </Button>
                  )}
                </div>

                {showFinancialsForm ? (
                  <form onSubmit={handleFinancialsSubmit} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="space-y-3 mb-4">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Container Deposit (₦)</label>
                        <Input 
                          type="number"
                          className="h-8 max-w-[200px]"
                          value={financialsFormData.containerDeposit}
                          onChange={(e) => setFinancialsFormData(prev => ({...prev, containerDeposit: e.target.value}))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">DND Charges (₦)</label>
                        <Input 
                          type="number"
                          className="h-8 max-w-[200px]"
                          value={financialsFormData.dndCharges}
                          onChange={(e) => setFinancialsFormData(prev => ({...prev, dndCharges: e.target.value}))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Customs Duty (₦)</label>
                        <Input 
                          type="number"
                          className="h-8 max-w-[200px]"
                          value={financialsFormData.customsDuty}
                          onChange={(e) => setFinancialsFormData(prev => ({...prev, customsDuty: e.target.value}))}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                       <Button type="button" variant="outline" size="sm" onClick={() => setShowFinancialsForm(false)} className="h-7 text-xs">
                         <X className="w-3.5 h-3.5 mr-1" /> Cancel
                       </Button>
                       <Button type="submit" size="sm" disabled={logFinancialsMutation.isPending} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700">
                         <Save className="w-3.5 h-3.5 mr-1" /> {logFinancialsMutation.isPending ? 'Saving' : 'Save'}
                       </Button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Container Deposit</p>
                      <p className="font-medium text-slate-900">{formatCurrency(job.financials?.containerDeposit)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">DND Charges</p>
                      <p className="font-medium text-slate-900">{formatCurrency(job.financials?.dndCharges)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Customs Duty</p>
                      <p className="font-medium text-slate-900">{formatCurrency(job.financials?.customsDuty)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Total Logged Costs</p>
                      <p className="font-semibold text-emerald-700">
                        {formatCurrency(
                          (job.financials?.containerDeposit || 0) +
                          (job.financials?.dndCharges || 0) +
                          (job.financials?.customsDuty || 0) +
                          (job.financials?.transporterFee || 0) +
                          (job.financials?.escortFee || 0) +
                          (job.financials?.driverInconvenienceFee || 0) +
                          (job.financials?.miscFees || 0)
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="bg-slate-100" />

              {/* Documents */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Documents</h3>
                  <div>
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()}
                      className="h-6 text-xs text-slate-500 p-0 hover:bg-transparent hover:text-indigo-600"
                      disabled={uploadDocumentMutation.isPending}
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" /> 
                      {uploadDocumentMutation.isPending ? 'Uploading...' : 'Upload document'}
                    </Button>
                  </div>
                </div>
                {job.documents && job.documents.length > 0 ? (
                  <div className="space-y-2">
                    {job.documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 rounded border border-slate-100 bg-slate-50">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-xs font-medium text-slate-700">{doc.type}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-slate-800">
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No documents uploaded yet.</p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 shrink-0 bg-slate-50">
              {nextStage ? (
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  onClick={() => advanceStageMutation.mutate(nextStage.id)}
                  disabled={advanceStageMutation.isPending}
                >
                  Advance to: {nextStage.label.replace(/_/g, ' ')}
                </Button>
              ) : (
                <Button variant="outline" className="w-full text-slate-500" disabled>
                  Job Completed
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
