'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FolderUp, Upload } from 'lucide-react';

export default function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center h-[70vh] text-center p-4"
    >
      <div className="bg-primary/10 p-6 rounded-full mb-6">
        <FolderUp className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">名刺がまだありません</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        Google Driveにアップロードするか、直接ここにアップロードして名刺の自動処理を開始しましょう
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          名刺をアップロード
        </Button>
        <Button variant="outline">
          Google Drive設定を確認
        </Button>
      </div>
    </motion.div>
  );
}