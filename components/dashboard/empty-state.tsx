'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FolderUp, Upload, ImageOff } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  iconName?: keyof typeof import('lucide-react');
  actionButton?: React.ReactNode;
}

export default function EmptyState({ title, description, iconName, actionButton }: EmptyStateProps) {
  const IconComponent = iconName ? require('lucide-react')[iconName] as LucideIcon : ImageOff;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center h-[70vh] text-center p-4"
    >
      <div className="bg-primary/10 p-6 rounded-full mb-6">
        <IconComponent className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      {actionButton && <div className="mt-6">{actionButton}</div>}
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