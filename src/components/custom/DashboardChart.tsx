'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface DashboardChartProps {
  surveyCount: number;
  ongoingCount: number;
  completedCount: number;
}

export function DashboardChart({ surveyCount, ongoingCount, completedCount }: DashboardChartProps) {
  const total = surveyCount + ongoingCount + completedCount;
  
  // Tính toán tỷ lệ
  const completedRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const ongoingRate = total > 0 ? Math.round((ongoingCount / total) * 100) : 0;
  const surveyRate = total > 0 ? Math.round((surveyCount / total) * 100) : 0;

  // Cấu hình SVG Circle cho Donut Chart
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completedRate / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* Donut Chart: Tỷ lệ dự án hoàn thành */}
      <Card className="border border-border/40 bg-card rounded-3xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold tracking-tight">Tỷ lệ hoàn thành dự án</CardTitle>
          <CardDescription className="text-xs">Đo lường năng suất bàn giao dự án</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-8 py-6">
          {/* SVG Donut */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-muted fill-transparent"
                strokeWidth="10"
              />
              {/* Foreground circle (completed progress) */}
              <motion.circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-primary fill-transparent"
                strokeWidth="10"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-foreground">{completedRate}%</span>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase">Đã bàn giao</span>
            </div>
          </div>

          {/* Chú thích thông tin */}
          <div className="space-y-3.5 w-full sm:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-lg bg-primary" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold">Đã hoàn thành</span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {completedCount} dự án ({completedRate}%)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-lg bg-blue-500" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold">Đang thực hiện</span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {ongoingCount} dự án ({ongoingRate}%)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-lg bg-amber-500" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold">Khảo sát mới</span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {surveyCount} dự án ({surveyRate}%)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart: Phân bố dự án theo trạng thái */}
      <Card className="border border-border/40 bg-card rounded-3xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold tracking-tight">Số lượng dự án chi tiết</CardTitle>
          <CardDescription className="text-xs">So sánh trực quan các trạng thái công việc</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col justify-end h-[160px] pb-6 pt-4 px-6">
          <div className="flex items-end justify-around h-full gap-6 select-none">
            {/* Cột Khảo sát */}
            <div className="flex flex-col items-center flex-1 h-full justify-end">
              <div className="text-xs font-bold text-amber-500 mb-1.5">{surveyCount}</div>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: total > 0 ? `${(surveyCount / total) * 100}%` : '4%' }}
                transition={{ duration: 0.8 }}
                className="w-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-t-xl transition-colors duration-300"
                style={{ minHeight: '6px' }}
              />
              <span className="text-[11px] font-semibold text-muted-foreground mt-2 truncate w-full text-center">Khảo sát</span>
            </div>

            {/* Cột Đang thực hiện */}
            <div className="flex flex-col items-center flex-1 h-full justify-end">
              <div className="text-xs font-bold text-blue-500 mb-1.5">{ongoingCount}</div>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: total > 0 ? `${(ongoingCount / total) * 100}%` : '4%' }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-t-xl transition-colors duration-300"
                style={{ minHeight: '6px' }}
              />
              <span className="text-[11px] font-semibold text-muted-foreground mt-2 truncate w-full text-center">Đang làm</span>
            </div>

            {/* Cột Đã hoàn thành */}
            <div className="flex flex-col items-center flex-1 h-full justify-end">
              <div className="text-xs font-bold text-primary mb-1.5">{completedCount}</div>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: total > 0 ? `${(completedCount / total) * 100}%` : '4%' }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-full bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-t-xl transition-colors duration-300"
                style={{ minHeight: '6px' }}
              />
              <span className="text-[11px] font-semibold text-muted-foreground mt-2 truncate w-full text-center">Hoàn thành</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
