'use client';

import { useMemo } from 'react';
import type { Site, SiteHistoryEntry } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Archive } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts"
import { format, parseISO } from 'date-fns';

interface RiskDashboardTabProps {
  sites: Site[];
  history: SiteHistoryEntry[];
  onRecordDay: () => void;
}

const chartConfig = {
  green: {
    label: "Green",
    color: "hsl(var(--chart-2))",
  },
  amber: {
    label: "Amber",
    color: "hsl(var(--chart-4))",
  },
  red: {
    label: "Red",
    color: "hsl(var(--chart-1))",
  },
} as const;

export default function RiskDashboardTab({ sites, history, onRecordDay }: RiskDashboardTabProps) {

  const chartData = useMemo(() => {
    // sort history by date
    const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return sortedHistory.map(entry => {
      const green = entry.sites.filter(s => s.status === 'Client happy').length;
      const amber = entry.sites.filter(s => s.status === 'Operations request' || s.status === 'Under control').length;
      const red = entry.sites.filter(s => s.status === 'Client concerns' || s.status.includes('action')).length;
      
      return {
        date: format(parseISO(entry.date), "dd MMM"),
        green,
        amber,
        red,
      };
    });
  }, [history]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <CardTitle>Site Risk Analysis</CardTitle>
                <CardDescription>Daily trend of site risk categories. Click below to save today's data.</CardDescription>
            </div>
            <Button onClick={onRecordDay} variant="outline" size="sm">
                <Archive className="mr-2 h-4 w-4" />
                Record Today's Status
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis allowDecimals={false} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="green" fill="var(--color-green)" radius={4} />
              <Bar dataKey="amber" fill="var(--color-amber)" radius={4} />
              <Bar dataKey="red" fill="var(--color-red)" radius={4} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center text-muted-foreground">
            <p>No historical data to display.</p>
            <p className="text-sm">Record today's status to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
