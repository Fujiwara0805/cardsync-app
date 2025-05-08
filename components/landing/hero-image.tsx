'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function HeroImage() {
  return (
    <div className="relative w-full aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[80%] h-[80%] bg-background rounded-lg shadow-lg overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-14 bg-muted flex items-center px-4 border-b">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-destructive"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="ml-4 flex-1 h-8 bg-background rounded-md"></div>
          </div>
          <div className="pt-16 p-4 grid grid-cols-3 gap-4 h-full">
            <div className="col-span-1 bg-muted rounded-md p-4 space-y-2">
              <div className="h-6 w-3/4 bg-muted-foreground/20 rounded"></div>
              <div className="h-6 w-1/2 bg-muted-foreground/20 rounded"></div>
              <div className="h-6 w-2/3 bg-muted-foreground/20 rounded"></div>
              <div className="h-6 w-3/4 bg-muted-foreground/20 rounded"></div>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <motion.div 
                initial={{ opacity: 0.5, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  repeat: Infinity, 
                  repeatType: 'reverse', 
                  duration: 2 
                }}
                className="bg-card rounded-md shadow-sm overflow-hidden"
              >
                <div className="h-24 bg-primary/20"></div>
                <div className="p-3 space-y-2">
                  <div className="h-4 w-3/4 bg-foreground/20 rounded"></div>
                  <div className="h-4 w-1/2 bg-foreground/20 rounded"></div>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0.5, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  repeat: Infinity, 
                  repeatType: 'reverse', 
                  duration: 2,
                  delay: 0.3
                }}
                className="bg-card rounded-md shadow-sm overflow-hidden"
              >
                <div className="h-24 bg-secondary/20"></div>
                <div className="p-3 space-y-2">
                  <div className="h-4 w-3/4 bg-foreground/20 rounded"></div>
                  <div className="h-4 w-1/2 bg-foreground/20 rounded"></div>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0.5, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  repeat: Infinity, 
                  repeatType: 'reverse', 
                  duration: 2,
                  delay: 0.6
                }}
                className="bg-card rounded-md shadow-sm overflow-hidden"
              >
                <div className="h-24 bg-chart-1/20"></div>
                <div className="p-3 space-y-2">
                  <div className="h-4 w-3/4 bg-foreground/20 rounded"></div>
                  <div className="h-4 w-1/2 bg-foreground/20 rounded"></div>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0.5, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  repeat: Infinity, 
                  repeatType: 'reverse', 
                  duration: 2,
                  delay: 0.9
                }}
                className="bg-card rounded-md shadow-sm overflow-hidden"
              >
                <div className="h-24 bg-chart-2/20"></div>
                <div className="p-3 space-y-2">
                  <div className="h-4 w-3/4 bg-foreground/20 rounded"></div>
                  <div className="h-4 w-1/2 bg-foreground/20 rounded"></div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}