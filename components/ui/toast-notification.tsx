'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export type NotificationType = 'success' | 'error' | 'info';

interface ToastNotificationProps {
  message: string;
  type: NotificationType;
  isOpen: boolean;
  onClose: () => void;
  duration?: number; // 自動で閉じるまでの時間 (ミリ秒)
}

export function ToastNotification({
  message,
  type,
  isOpen,
  onClose,
  duration = 5000, // デフォルト5秒
}: ToastNotificationProps) {
  useEffect(() => {
    if (isOpen && duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-500" />;
      default:
        return null;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-green-500';
      case 'error':
        return 'border-red-500';
      case 'info':
        return 'border-blue-500';
      default:
        return 'border-gray-300';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.5 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="fixed bottom-5 right-5 z-[100] w-full max-w-sm p-4 bg-card border-l-4 shadow-lg rounded-md"
          style={{ borderLeftColor: type === 'success' ? 'var(--green-500)' : type === 'error' ? 'var(--red-500)' : 'var(--blue-500)' }} // Tailwindのクラス名が直接適用できない場合があるためstyleで
        >
          <div className="flex items-start">
            <div className="shrink-0">{getIcon()}</div>
            <div className="ml-3 flex-1 pt-0.5">
              <p className="text-sm font-medium text-foreground">{message}</p>
            </div>
            <div className="ml-4 flex shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="-mr-1 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <span className="sr-only">閉じる</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
