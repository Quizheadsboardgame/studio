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
    Green: { label: "Green: Positive / No Concerns", color: "hsl(var(--chart-2))" },
    "Gold Star": { label: "Gold Star Site", color: "hsl(var(--gold-star))" },
} as const;

const cleanerRiskChartConfig = {
    Red: { label: "Red: Performance Issues", color: "hsl(var(--chart-1))" },
    Amber: { label: "Amber: Monitor", color: "hsl(var(--chart-4))" },
    Green: { label: "Green: Positive / No Concerns", color: "hsl(var(--chart-2))" },
    "Gold Star": { label: "Gold Star Cleaner", color: "hsl(var(--gold-star))" },
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
    let gold = 0;

    sites.forEach(site => {
        const status = site.status;
        if (status === 'Gold Star Site') {
            gold++;
        } else if (status === 'Client happy' || status === 'No Concerns') {
            green++;
        } else if (status === 'Client concerns') {
            amber++;
        } else if (status === 'Site under action plan' || status === 'Site requires action plan') {
            red++;
        }
    });

    return [
        { name: 'Red', value: red, fill: 'hsl(var(--chart-1))' },
        { name: 'Amber', value: amber, fill: 'hsl(var(--chart-4))' },
        { name: 'Green', value: green, fill: 'hsl(var(--chart-2))' },
        { name: 'Gold Star', value: gold, fill: 'hsl(var(--gold-star))' },
    ].filter(item => item.value > 0);
  }, [sites]);
  
  const cleanerRiskData = useMemo(() => {
    if (!cleaners) return [];
    
    let green = 0;
    let amber = 0;
    let red = 0;
    let gold = 0;

    cleaners.forEach(cleaner => {
        if (cleaner.rating === 'Gold Star Cleaner') {
            gold++;
        } else if (cleaner.rating === 'Site satisfied' || cleaner.rating === 'No Concerns') {
            green++;
        } else if (cleaner.rating === 'Slight improvement needed') {
            amber++;
        } else if (cleaner.rating.includes('action') || cleaner.rating === 'Needs retraining' || cleaner.rating === 'Operational concerns') {
            red++;
        }
    });
    
     return [
        { name: 'Red', value: red, fill: 'hsl(var(--chart-1))' },
        { name: 'Amber', value: amber, fill: 'hsl(var(--chart-4))' },
        { name: 'Green', value: green, fill: 'hsl(var(--chart-2))' },
        { name: 'Gold Star', value: gold, fill: 'hsl(var(--gold-star))' },
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
