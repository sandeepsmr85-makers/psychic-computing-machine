import { useTeachAction } from "@/hooks/use-actions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BookOpen, Loader2, Code, Globe, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const teachSchema = z.object({
  name: z.string().min(2, "Name required"),
  url: z.string().url("Valid URL required"),
  instruction: z.string().min(5, "Detailed instruction required"),
  type: z.enum(["act", "extract"]),
  schema: z.string().optional(),
});

type TeachFormData = z.infer<typeof teachSchema>;

export default function TeachMode() {
  const { mutate, isPending } = useTeachAction();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<TeachFormData>({
    resolver: zodResolver(teachSchema),
    defaultValues: { type: "act" }
  });

  const type = watch("type");

  const onSubmit = (data: TeachFormData) => {
    mutate(data, {
      onSuccess: () => {
        toast({
          title: "Action Taught Successfully",
          description: `The system has learned how to "${data.name}" on ${new URL(data.url).hostname}`,
        });
        setLocation("/actions");
      },
      onError: (err) => {
        toast({
          title: "Teaching Failed",
          description: err.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white">Teach Mode</h1>
        <p className="text-zinc-400 mt-2">
          Manually define a robust action for the system to cache and reuse.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-8 rounded-2xl border border-zinc-800"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 flex items-center">
                <Tag className="w-3 h-3 mr-2" /> Action Name
              </label>
              <input
                {...register("name")}
                placeholder="e.g. login_github"
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 flex items-center">
                <Globe className="w-3 h-3 mr-2" /> Website URL
              </label>
              <input
                {...register("url")}
                placeholder="https://..."
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {errors.url && <p className="text-red-400 text-xs">{errors.url.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Detailed Instruction</label>
            <textarea
              {...register("instruction")}
              rows={3}
              placeholder="Describe exactly what needs to happen..."
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
            {errors.instruction && <p className="text-red-400 text-xs">{errors.instruction.message}</p>}
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium text-zinc-300">Action Type</label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`cursor-pointer rounded-xl border p-4 transition-all ${
                type === 'act' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
              }`}>
                <input type="radio" value="act" {...register("type")} className="hidden" />
                <div className="font-semibold text-white mb-1">Action</div>
                <div className="text-xs text-zinc-400">Click, type, navigate, or interact</div>
              </label>
              
              <label className={`cursor-pointer rounded-xl border p-4 transition-all ${
                type === 'extract' ? 'bg-purple-500/10 border-purple-500/50' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
              }`}>
                <input type="radio" value="extract" {...register("type")} className="hidden" />
                <div className="font-semibold text-white mb-1">Extraction</div>
                <div className="text-xs text-zinc-400">Scrape structured data from page</div>
              </label>
            </div>
          </div>

          {type === 'extract' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-zinc-300 flex items-center">
                <Code className="w-3 h-3 mr-2" /> JSON Schema (Optional)
              </label>
              <textarea
                {...register("schema")}
                rows={4}
                placeholder="{ 'type': 'object', 'properties': { ... } }"
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-3 font-mono text-sm text-zinc-300 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookOpen className="w-4 h-4 mr-2" />}
            Save to Knowledge Base
          </button>
        </form>
      </motion.div>
    </div>
  );
}
