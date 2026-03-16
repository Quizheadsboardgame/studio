'use client';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { PieChart, Pie, Cell } from "recharts"

const currentRiskChartConfig = {
    Red: { label: "Red", color: "hsl(var(--chart-1))" },
    Amber: { label: "Amber", color: "hsl(var(--chart-4))" },
    Green: { label: "Green", color: "hsl(var(--chart-2))" },
    "N/A": { label: "N/A", color: "hsl(var(--muted))" },
} as const;

interface LiveRiskChartProps {
    data: {
        name: string;
        value: number;
        fill: string;
    }[];
}

export default function LiveRiskChart({ data }: LiveRiskChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center text-muted-foreground">
                <p>No site data available to display.</p>
            </div>
        );
    }

    return (
        <ChartContainer config={currentRiskChartConfig} className="min-h-[400px] w-full flex justify-center items-center">
            <PieChart>
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
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
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
        </ChartContainer>
    );
}
