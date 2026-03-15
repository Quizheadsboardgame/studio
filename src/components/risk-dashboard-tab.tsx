'use client';

import { useMemo } from 'react';
import type { Site } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { PieChart, Pie, Cell } from "recharts"


interface RiskDashboardTabProps {
  sites: Site[];
}

const currentRiskChartConfig = {
    Red: { label: "Red", color: "hsl(var(--chart-1))" },
    Amber: { label: "Amber", color: "hsl(var(--chart-4))" },
    Green: { label: "Green", color: "hsl(var(--chart-2))" },
    "N/A": { label: "N/A", color: "hsl(var(--muted))" },
} as const;


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
          {currentRiskData.length > 0 ? (
              <ChartContainer config={currentRiskChartConfig} className="min-h-[400px] w-full flex justify-center items-center">
                  <PieChart>
                      <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                          data={currentRiskData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          labelLine={false}
                          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                              const RADIAN = Math.PI / 180;
                              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);

                              return (
                                  <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                      {`${(percent * 100).toFixed(0)}%`}
                                  </text>
                              );
                          }}
                      >
                          {currentRiskData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                      </Pie>
                        <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
              </ChartContainer>
          ) : (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center text-muted-foreground">
                  <p>No site data available to display.</p>
              </div>
          )}
      </CardContent>
    </Card>
  );
}
