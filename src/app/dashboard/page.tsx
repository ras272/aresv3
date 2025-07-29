'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardCharts } from '@/components/charts/DashboardCharts';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DashboardCharts />
        </div>
      </div>
    </DashboardLayout>
  );
}