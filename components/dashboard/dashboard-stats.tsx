'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, AlertCircle, CreditCard } from 'lucide-react';
import { Stats } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStatsProps {
  stats: Stats;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  // Mock data for the chart
  const chartData = [
    { name: 'Jan', count: 4 },
    { name: 'Feb', count: 7 },
    { name: 'Mar', count: 5 },
    { name: 'Apr', count: 3 },
    { name: 'May', count: 8 },
    { name: 'Jun', count: 12 },
    { name: 'Jul', count: 8 },
    { name: 'Aug', count: 9 },
    { name: 'Sep', count: 6 },
    { name: 'Oct', count: 13 },
    { name: 'Nov', count: 7 },
    { name: 'Dec', count: 9 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">分析</h1>
        <p className="text-muted-foreground">名刺処理の状況と統計</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Business Cards</CardDescription>
              <CardTitle className="text-3xl">{stats.totalCards}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-muted-foreground">
                <CreditCard className="mr-2 h-4 w-4" />
                <span className="text-sm">All time</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Processed Cards</CardDescription>
              <CardTitle className="text-3xl">{stats.processedCards}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-green-500">
                <CheckCircle className="mr-2 h-4 w-4" />
                <span className="text-sm">Successfully processed</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Processing Cards</CardDescription>
              <CardTitle className="text-3xl">{stats.pendingCards}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-yellow-500">
                <Clock className="mr-2 h-4 w-4" />
                <span className="text-sm">In processing queue</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Failed Cards</CardDescription>
              <CardTitle className="text-3xl">{stats.failedCards}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-red-500">
                <AlertCircle className="mr-2 h-4 w-4" />
                <span className="text-sm">Requires attention</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card className="col-span-4">
          <CardHeader className="p-4 md:p-6">
            <CardTitle>処理済み名刺数</CardTitle>
            <CardDescription>月別の名刺処理数</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))' 
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    name="Cards Processed" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}