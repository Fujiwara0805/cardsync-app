import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-100 z-50">
      <Loader2 className="h-12 w-12 text-blue-700 animate-spin mb-4" />
      <span className="text-blue-700 text-lg font-bold">読み込み中...</span>
    </div>
  );
}
