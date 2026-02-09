import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

// Types derived from schema via API definition
type Run = z.infer<typeof api.runs.get.responses[200]>;
type CreateRunInput = z.infer<typeof api.runs.create.input>;

export function useRuns() {
  return useQuery({
    queryKey: [api.runs.list.path],
    queryFn: async () => {
      const res = await fetch(api.runs.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch runs");
      return api.runs.list.responses[200].parse(await res.json());
    },
  });
}

export function useRun(id: number, pollingEnabled: boolean = false) {
  return useQuery({
    queryKey: [api.runs.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.runs.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch run");
      return api.runs.get.responses[200].parse(await res.json());
    },
    refetchInterval: pollingEnabled ? 2000 : false, // Poll every 2s if running
  });
}

export function useCreateRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRunInput) => {
      const res = await fetch(api.runs.create.path, {
        method: api.runs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create run");
      return api.runs.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.runs.list.path] });
    },
  });
}
