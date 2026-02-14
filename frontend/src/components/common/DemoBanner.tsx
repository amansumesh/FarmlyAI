import { Info } from 'lucide-react';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export function DemoBanner() {
  if (!DEMO_MODE) return null;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2">
      <div className="flex items-center justify-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
        <Info className="w-4 h-4" />
        <span className="font-medium">Demo Mode</span>
        <span className="text-yellow-700 dark:text-yellow-400">
          - Authentication bypassed, database features disabled
        </span>
      </div>
    </div>
  );
}
