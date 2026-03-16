'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { Site } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const LiveRiskChart = dynamic(() => import('@/components/live-risk-chart'), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full" />,
});

interface RiskDashboardTabProps {
  sites: Site[];
}

export default function RiskDashboardTab({ sites }: RiskDashboardTabProps) {

  const currentRiskData = useMemo(() => {
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

  return (
    <Card>
      <CardHeader>
          <CardTitle>Live Site Status Overview</CardTitle>
          <CardDescription>Current distribution of site statuses across all sites.</CardDescription>
      </CardHeader>
      <CardContent>
          <LiveRiskChart data={currentRiskData} />
      </CardContent>
    </Card>
  );
}
