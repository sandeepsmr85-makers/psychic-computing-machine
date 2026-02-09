import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";

import Dashboard from "@/pages/Dashboard";
import NewRun from "@/pages/NewRun";
import RunDetails from "@/pages/RunDetails";
import KnowledgeBase from "@/pages/KnowledgeBase";
import TeachMode from "@/pages/TeachMode";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/runs" component={Dashboard} />
        <Route path="/runs/new" component={NewRun} />
        <Route path="/runs/:id" component={RunDetails} />
        <Route path="/actions" component={KnowledgeBase} />
        <Route path="/teach" component={TeachMode} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
