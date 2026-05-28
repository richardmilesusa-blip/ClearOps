import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  client: z.string().min(1, "Client name is required"),
  consignee: z.string().min(1, "Consignee is required"),
  notifyParty: z.string().min(1, "Notify party is required"),
  tin: z.string().min(1, "TIN is required"),
  formMNumber: z.string().min(1, "Form M Number is required"),
  baNumber: z.string().min(1, "BA Number is required"),
  rcNumber: z.string().min(1, "RC Number is required"),
  containerNumber: z.string().min(1, "Container number is required"),
  vesselName: z.string().optional(),
  goodsDescription: z.string().min(1, "Goods description is required"),
  transitLocation: z.string().min(1, "Transit location is required"),
  transireRequired: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function NewJobModal({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client: "",
      consignee: "",
      notifyParty: "",
      tin: "",
      formMNumber: "",
      baNumber: "",
      rcNumber: "",
      containerNumber: "",
      vesselName: "",
      goodsDescription: "Fabric Materials",
      transitLocation: "Kano FTZ",
      transireRequired: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create job");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success(`Job ${data.reference} created. Agents have been notified.`);
      reset();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function onSubmit(values: FormValues) {
    mutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        children ? <>{children}</> : (
          <Button className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" variant="default">
            <Plus className="h-4 w-4 mr-1" /> New job
          </Button>
        )
      } />
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-white">
          <DialogTitle className="text-base font-semibold text-slate-800">Open new job</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-0.5">
            Confirm shipping instructions & assign reference
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col max-h-[80vh]">
          <div className="px-6 py-5 space-y-5 overflow-y-auto">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Shipping instructions
              </p>
              <div className="grid grid-cols-2 gap-3">
                
                <Controller name="client" control={control} render={({ field }) => (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Client name</label>
                    <Input placeholder="Client name" className="h-9 text-sm" {...field} />
                    {errors.client && <p className="text-[10px] text-red-500">{errors.client.message}</p>}
                  </div>
                )} />

                <Controller name="consignee" control={control} render={({ field }) => (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Consignee</label>
                    <Input placeholder="Consignee" className="h-9 text-sm" {...field} />
                    {errors.consignee && <p className="text-[10px] text-red-500">{errors.consignee.message}</p>}
                  </div>
                )} />

                <Controller name="notifyParty" control={control} render={({ field }) => (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Notify party</label>
                    <Input placeholder="Notify party" className="h-9 text-sm" {...field} />
                    {errors.notifyParty && <p className="text-[10px] text-red-500">{errors.notifyParty.message}</p>}
                  </div>
                )} />

                <Controller name="tin" control={control} render={({ field }) => (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">TIN</label>
                    <Input placeholder="TIN" className="h-9 text-sm" {...field} />
                    {errors.tin && <p className="text-[10px] text-red-500">{errors.tin.message}</p>}
                  </div>
                )} />

                <Controller name="formMNumber" control={control} render={({ field }) => (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Form M number</label>
                    <Input placeholder="Form M number" className="h-9 text-sm" {...field} />
                    {errors.formMNumber && <p className="text-[10px] text-red-500">{errors.formMNumber.message}</p>}
                  </div>
                )} />

                <Controller name="baNumber" control={control} render={({ field }) => (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">BA number</label>
                    <Input placeholder="BA number" className="h-9 text-sm" {...field} />
                    {errors.baNumber && <p className="text-[10px] text-red-500">{errors.baNumber.message}</p>}
                  </div>
                )} />

                <Controller name="rcNumber" control={control} render={({ field }) => (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">RC number</label>
                    <Input placeholder="RC number" className="h-9 text-sm" {...field} />
                    {errors.rcNumber && <p className="text-[10px] text-red-500">{errors.rcNumber.message}</p>}
                  </div>
                )} />

                <Controller name="containerNumber" control={control} render={({ field }) => (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Container number</label>
                    <Input placeholder="Container number" className="h-9 text-sm uppercase font-mono" {...field} />
                    {errors.containerNumber && <p className="text-[10px] text-red-500">{errors.containerNumber.message}</p>}
                  </div>
                )} />

                <Controller name="vesselName" control={control} render={({ field }) => (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Vessel name</label>
                    <Input placeholder="Vessel name" className="h-9 text-sm uppercase" {...field} />
                    {errors.vesselName && <p className="text-[10px] text-red-500">{errors.vesselName.message}</p>}
                  </div>
                )} />

                <Controller name="goodsDescription" control={control} render={({ field }) => (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Goods description</label>
                    <Input placeholder="Goods description" className="h-9 text-sm" {...field} />
                    {errors.goodsDescription && <p className="text-[10px] text-red-500">{errors.goodsDescription.message}</p>}
                  </div>
                )} />

                <Controller name="transitLocation" control={control} render={({ field }) => (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Transit location</label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kano FTZ">Kano FTZ</SelectItem>
                        <SelectItem value="Lagos Warehouse">Lagos Warehouse</SelectItem>
                        <SelectItem value="Abuja">Abuja</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.transitLocation && <p className="text-[10px] text-red-500">{errors.transitLocation.message}</p>}
                  </div>
                )} />

              </div>
            </div>

            <Separator className="bg-slate-100" />

            <Controller name="transireRequired" control={control} render={({ field }) => (
              <div className="flex flex-row items-center space-x-3 rounded-md border border-slate-100 p-4 shadow-sm bg-slate-50">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
                <label className="text-sm font-medium text-slate-800 cursor-pointer" onClick={() => field.onChange(!field.value)}>
                  Prepare Transire documents (FTZ goods)
                </label>
              </div>
            )} />
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2 mt-auto">
            <Button type="button" variant="outline" className="h-9 text-sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="h-9 text-sm bg-emerald-600 hover:bg-emerald-700 text-white" disabled={mutation.isPending}>
              <Plus className="h-4 w-4 mr-1" />
              {mutation.isPending ? "Creating..." : "Create job & notify agents"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
