import { Truck, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function HaulagePage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row items-baseline justify-between mb-2">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Haulage & Dispatch</h1>
        <p className="text-xs text-slate-500 mt-1 md:mt-0">Manage trucks, escorts, and container deliveries.</p>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="py-4 px-5 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center w-full md:w-auto relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              type="text" 
              placeholder="Search truck plates or destination..." 
              className="pl-9 bg-slate-50/50 border-slate-200 h-9 text-sm"
              disabled
            />
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <Button size="sm" className="h-9 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <span>+ Dispatch Truck</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
             <Truck className="h-6 w-6 text-slate-400" />
          </div>
          <h2 className="text-sm font-semibold text-slate-800">No active dispatches</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mb-4">
            You don't have any haulage jobs currently in transit or scheduled.
          </p>
          <Button variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 placeholder:text-slate-400">
            View Transporter Database
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
