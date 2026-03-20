'use client';

import { useState, useMemo } from 'react';
import type { Leave } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MonthlyLeaveCalendarProps {
  leave: Leave[];
}

export default function MonthlyLeaveCalendar({ leave }: MonthlyLeaveCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const holidaysByDay = useMemo(() => {
    const holidays: { [key: string]: { name: string; type: 'holiday' | 'sick' }[] } = {};
    leave.forEach(l => {
        const dateKey = l.date;
        if (!holidays[dateKey]) {
            holidays[dateKey] = [];
        }
        holidays[dateKey].push({ name: l.cleanerName, type: l.type });
    });
    return holidays;
  }, [leave]);

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start, end });
  
  const firstDayOfMonth = getDay(start);
  const paddingDays = Array.from({ length: firstDayOfMonth });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div>
                <CardTitle>Monthly Leave Calendar</CardTitle>
                <CardDescription>A monthly overview of all holiday and sickness absences.</CardDescription>
            </div>
            <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium text-center w-36">{format(currentMonth, 'MMMM yyyy')}</span>
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 border-t border-l rounded-lg overflow-hidden">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold p-2 border-b border-r bg-muted/50 text-muted-foreground text-sm">
              {day}
            </div>
          ))}
          {paddingDays.map((_, index) => (
            <div key={`padding-${index}`} className="border-r border-b bg-muted/20"></div>
          ))}
          {daysInMonth.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayAbsences = holidaysByDay[dateKey] || [];
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toString()}
                className={cn(
                    "relative min-h-[120px] p-2 border-r border-b flex flex-col",
                    isToday ? "bg-blue-50 dark:bg-blue-900/20" : ""
                )}
              >
                <time dateTime={dateKey} className={cn("font-semibold", {
                    'text-blue-600 dark:text-blue-400': isToday,
                    'text-muted-foreground': day.getMonth() !== currentMonth.getMonth()
                })}>
                    {format(day, 'd')}
                </time>
                {dayAbsences.length > 0 && (
                    <ScrollArea className="flex-grow mt-1 pr-3">
                        <div className="space-y-1">
                        {dayAbsences.map((absence, i) => (
                            <Badge key={i} variant={absence.type === 'holiday' ? 'secondary' : 'destructive'} className="w-full justify-start text-left whitespace-normal h-auto text-xs py-1">
                                {absence.name}
                            </Badge>
                        ))}
                        </div>
                    </ScrollArea>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
