'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext: string;
  colorClass: string; // Tailwind color class for bg / text / borders
  index: number;
}

export function StatCard({ title, value, icon: Icon, subtext, colorClass, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="w-full"
    >
      <Card className="border border-border/40 bg-card rounded-3xl shadow-sm hover:shadow-md hover:border-border transition-all duration-300 overflow-hidden relative">
        {/* Glow effect on hover */}
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full ${colorClass.split(' ')[0]}/5 blur-3xl -mr-6 -mt-6`} />

        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground tracking-tight">{title}</p>
            <h3 className="text-2xl font-black text-foreground tracking-tight leading-none">
              {value}
            </h3>
            <p className="text-xs text-muted-foreground font-medium">{subtext}</p>
          </div>

          <div className={`p-4 rounded-2xl flex items-center justify-center shadow-sm ${colorClass}`}>
            <Icon className="h-6 w-6 stroke-[2.2]" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
