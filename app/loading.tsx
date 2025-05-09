import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-100 backdrop-blur-sm">
      <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
      <p className="mt-4 text-lg font-semibold text-blue-600">
        読み込み中...
      </p>
    </div>
  );
}
