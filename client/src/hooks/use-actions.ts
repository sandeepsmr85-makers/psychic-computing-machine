import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import type { TeachActionRequest } from "@shared/schema";

// Types
type Action = z.infer<typeof api.actions.list.responses[200]>[number];

export function useActions() {
  return useQuery({
    queryKey: [api.actions.list.path],
    queryFn: async () => {
      const res = await fetch(api.actions.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch actions");
      return api.actions.list.responses[200].parse(await res.json());
    },
  });
}

export function useDeleteAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.actions.delete.path, { id });
      const res = await fetch(url, { 
        method: api.actions.delete.method,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to delete action");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.actions.list.path] });
    },
  });
}

// Hook for manual "Teach" mode - handles missing API gracefully as requested
export function useTeachAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TeachActionRequest) => {
      // Assuming a POST endpoint exists or will exist for teaching
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        // Fallback or specific error handling
        throw new Error("Teaching action failed - API might be unavailable");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.actions.list.path] });
    },
  });
}
