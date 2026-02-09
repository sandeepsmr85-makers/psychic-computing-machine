import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="bg-zinc-900 p-4 rounded-full">
          <AlertTriangle className="h-12 w-12 text-yellow-500" />
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tighter">404 Page Not Found</h1>
        <p className="text-zinc-400 max-w-sm">
          The requested resource could not be found. It might have been moved or deleted.
        </p>
        <Link href="/" className="mt-4 text-emerald-500 hover:text-emerald-400 font-medium hover:underline">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
