'use client';

import { useMemo, useState } from 'react';
import type { Site, SiteHistoryEntry, SiteStatus } from '@/lib/data';
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
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, LineChart, Line } from "recharts"
import { format, parseISO, isWithinInterval } from 'date-fns';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface RiskDashboardTabProps {
  sites: Site[];
  history: SiteHistoryEntry[];
  onRecordDay: () => void;
}

const chartConfig = {
  green: { label: "Green", color: "hsl(var(--chart-2))" },
  amber: { label: "Amber", color: "hsl(var(--chart-4))" },
  red: { label: "Red", color: "hsl(var(--chart-1))" },
} as const;

const statusToScore = (status: SiteStatus): number => {
  switch (status) {
    case 'Client happy': return 3;
    case 'Operations request': return 2;
    case 'Under control': return 2;
    case 'Client concerns': return 1;
    case 'Site under action plan': return 1;
    case 'Site requires action plan': return 1;
    default: return 0;
  }
};

const scoreToLabel = (score: number): string => {
  switch (score) {
    case 3: return 'Happy';
    case 2: return 'Monitor';
    case 1: return 'Action';
    default: return 'N/A';
  }
};


export default function RiskDashboardTab({ sites, history, onRecordDay }: RiskDashboardTabProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [siteDateRange, setSiteDateRange] = useState<DateRange | undefined>();

  const overallChartData = useMemo(() => {
    const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const filteredHistory = dateRange?.from ? sortedHistory.filter(entry => 
      isWithinInterval(parseISO(entry.date), { start: dateRange.from!, end: dateRange.to || new Date() })
    ) : sortedHistory;

    return filteredHistory.map(entry => {
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
  }, [history, dateRange]);


  const individualSiteData = useMemo(() => {
    if (!selectedSiteId) return [];

    const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const filteredHistory = siteDateRange?.from ? sortedHistory.filter(entry => 
      isWithinInterval(parseISO(entry.date), { start: siteDateRange.from!, end: siteDateRange.to || new Date() })
    ) : sortedHistory;

    return filteredHistory.map(entry => {
      const site = entry.sites.find(s => s.id === selectedSiteId);
      return {
        date: format(parseISO(entry.date), "dd MMM yy"),
        score: site ? statusToScore(site.status) : 0,
        status: site?.status || 'N/A'
      };
    }).filter(d => d.score > 0);
  }, [history, selectedSiteId, siteDateRange]);

  const selectedSiteName = sites.find(s => s.id === selectedSiteId)?.name || 'a Site';


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                  <CardTitle>Overall Site Risk Trend</CardTitle>
                  <CardDescription>Daily trend of site risk categories. Pick a date range to filter.</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                <Button onClick={onRecordDay} variant="outline" size="sm">
                    <Archive className="mr-2 h-4 w-4" />
                    Record Today's Status
                </Button>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          {overallChartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <BarChart accessibilityLayer data={overallChartData}>
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
                <Bar dataKey="green" fill="var(--color-green)" radius={4} stackId="a" />
                <Bar dataKey="amber" fill="var(--color-amber)" radius={4} stackId="a" />
                <Bar dataKey="red" fill="var(--color-red)" radius={4} stackId="a" />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center text-muted-foreground">
              <p>No historical data to display for the selected range.</p>
              <p className="text-sm">Record today's status to get started or adjust the date filter.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Individual Site Performance</CardTitle>
            <CardDescription>Select a site and a date range to see its performance trend over time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(site => (
                    <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DateRangePicker date={siteDateRange} onDateChange={setSiteDateRange} />
            </div>
            {selectedSiteId && (
              individualSiteData.length > 0 ? (
                <ChartContainer config={{score: {label: 'Performance'}}} className="min-h-[300px] w-full">
                  <LineChart
                    accessibilityLayer
                    data={individualSiteData}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis 
                      domain={[0, 4]} 
                      ticks={[1, 2, 3]} 
                      tickFormatter={scoreToLabel} 
                      allowDecimals={false}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          formatter={(value, name, props) => (
                            <div className="flex flex-col">
                              <span className="font-bold">{props.payload.status}</span>
                            </div>
                          )}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{
                        r: 4,
                        fill: 'hsl(var(--primary))',
                      }}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center text-muted-foreground">
                  <p>No historical data for {selectedSiteName} in this period.</p>
                </div>
              )
            )}
        </CardContent>
      </Card>
    </div>
  );
}
