'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { Site, Cleaner } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const LiveRiskChart = dynamic(() => import('@/components/live-risk-chart'), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full" />,
});

const siteRiskChartConfig = {
    Red: { label: "Red: Action Required", color: "hsl(var(--chart-1))" },
    Amber: { label: "Amber: Monitor", color: "hsl(var(--chart-4))" },
    Green: { label: "Green: Positive", color: "hsl(var(--chart-2))" },
    "N/A": { label: "N/A", color: "hsl(var(--muted))" },
} as const;

const cleanerRiskChartConfig = {
    Red: { label: "Red: Performance Issues", color: "hsl(var(--chart-1))" },
    Amber: { label: "Amber: Monitor", color: "hsl(var(--chart-4))" },
    Green: { label: "Green: Positive", color: "hsl(var(--chart-2))" },
    "No Concerns": { label: "No Concerns", color: "hsl(var(--muted))" },
} as const;


interface RiskDashboardTabProps {
  sites: Site[];
  cleaners: Cleaner[];
}

export default function RiskDashboardTab({ sites, cleaners }: RiskDashboardTabProps) {

  const siteRiskData = useMemo(() => {
    if (!sites) return [];
    
    let green = 0;
    let amber = 0;
    let red = 0;
    let unassigned = 0;

    sites.forEach(site => {
        if (site.status === 'Client happy') {
            green++;
        } else if (site.status === 'Operations request' || site.status === 'Under control') {
            amber++;
        } else if (site.status === 'Client concerns' || site.status.includes('action')) {
            red++;
        } else {
            unassigned++;
        }
    });

    return [
        { name: 'Red', value: red, fill: 'hsl(var(--chart-1))' },
        { name: 'Amber', value: amber, fill: 'hsl(var(--chart-4))' },
        { name: 'Green', value: green, fill: 'hsl(var(--chart-2))' },
        { name: 'N/A', value: unassigned, fill: 'hsl(var(--muted))' },
    ].filter(item => item.value > 0);
  }, [sites]);
  
  const cleanerRiskData = useMemo(() => {
    if (!cleaners) return [];
    
    let green = 0;
    let amber = 0;
    let red = 0;
    let unassigned = 0;

    cleaners.forEach(cleaner => {
        if (cleaner.rating === 'Gold Star Cleaner' || cleaner.rating === 'Site satisfied') {
            green++;
        } else if (cleaner.rating === 'Slight improvement needed') {
            amber++;
        } else if (cleaner.rating.includes('action') || cleaner.rating === 'Needs retraining' || cleaner.rating === 'Operational concerns') {
            red++;
        } else {
            unassigned++;
        }
    });
    
     return [
        { name: 'Red', value: red, fill: 'hsl(var(--chart-1))' },
        { name: 'Amber', value: amber, fill: 'hsl(var(--chart-4))' },
        { name: 'Green', value: green, fill: 'hsl(var(--chart-2))' },
        { name: 'No Concerns', value: unassigned, fill: 'hsl(var(--muted))' },
    ].filter(item => item.value > 0);
  }, [cleaners]);


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
              <CardTitle>Live Site Status</CardTitle>
              <CardDescription>Current distribution of site statuses.</CardDescription>
          </CardHeader>
          <CardContent>
              <LiveRiskChart data={siteRiskData} chartConfig={siteRiskChartConfig} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
              <CardTitle>Live Cleaner Performance</CardTitle>
              <CardDescription>Current distribution of cleaner performance ratings.</CardDescription>
          </CardHeader>
          <CardContent>
              <LiveRiskChart data={cleanerRiskData} chartConfig={cleanerRiskChartConfig} />
          </CardContent>
        </Card>
    </div>
  );
}
