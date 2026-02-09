import { useCreateRun } from "@/hooks/use-runs";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Play, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const formSchema = z.object({
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  instruction: z.string().min(3, "Instruction is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function NewRun() {
  const [, setLocation] = useLocation();
  const { mutate, isPending } = useCreateRun();
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: FormData) => {
    mutate({
      url: data.url || undefined,
      instruction: data.instruction
    }, {
      onSuccess: (run) => {
        setLocation(`/runs/${run.id}`);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2 mb-8"
      >
        <h1 className="text-3xl font-bold text-white">New Automation</h1>
        <p className="text-zinc-400">
          Describe what you want the AI to do. It will figure out the steps.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-8 rounded-2xl relative overflow-hidden"
      >
        {/* Decorative gradient blur */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Target URL (Optional)</label>
            <input
              {...register("url")}
              placeholder="https://example.com"
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
            {errors.url && <p className="text-red-400 text-xs">{errors.url.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center justify-between">
              Instruction
              <span className="text-xs text-zinc-500 flex items-center">
                <Sparkles className="w-3 h-3 mr-1 text-purple-400" /> Natural Language
              </span>
            </label>
            <textarea
              {...register("instruction")}
              rows={4}
              placeholder="e.g., Search for 'gaming laptops' and sort by price low to high"
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none"
            />
            {errors.instruction && <p className="text-red-400 text-xs">{errors.instruction.message}</p>}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-4 rounded-xl shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Initializing Agent...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Run Automation
                </>
              )}
            </button>
            <p className="text-center text-xs text-zinc-500 mt-4">
              Estimated cost: ~10 credits per run. Cached actions are free.
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
