'use client';

import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import type { Site, Cleaner, ActionPlan, ActionPlanTask } from '@/lib/data';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

interface ActionPlanTabProps {
  sites: Site[];
  cleaners: Cleaner[];
  actionPlans: ActionPlan[];
  onUpdateActionPlan: (plan: ActionPlan) => void;
}

function ActionPlanDetails({ item, plan: initialPlan, onUpdateActionPlan }: { item: {id: string, name: string, type: 'site' | 'cleaner'}, plan: ActionPlan | undefined, onUpdateActionPlan: (plan: ActionPlan) => void}) {
  // Ensure the plan always has an ID, using the item's ID if no plan exists yet.
  const plan = useMemo(() => initialPlan || { id: item.id, targetName: item.name, targetType: item.type, tasks: [], notes: '' }, [initialPlan, item]);
  
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>();

  const handleUpdate = (updatedPlan: Partial<Omit<ActionPlan, 'id'>>) => {
    onUpdateActionPlan({ ...plan, ...updatedPlan });
  };

  const handleAddTask = () => {
    if (!newTaskDesc || !newTaskDueDate) return;
    const newTask: ActionPlanTask = {
      id: `task-${Date.now()}`,
      description: newTaskDesc,
      dueDate: format(newTaskDueDate, 'yyyy-MM-dd'),
      completed: false,
    };
    handleUpdate({ tasks: [...plan.tasks, newTask] });
    setNewTaskDesc('');
    setNewTaskDueDate(undefined);
  };

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = plan.tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    handleUpdate({ tasks: updatedTasks });
  };
  
  const handleNotesChange = (notes: string) => {
      handleUpdate({ notes });
  }

  return (
    <div className="space-y-4 pl-4 border-l-2">
      <div>
        <h4 className="font-semibold mb-2">Tasks</h4>
        <div className="space-y-2">
          {plan.tasks.length > 0 ? plan.tasks.map(task => (
            <div key={task.id} className="flex items-center gap-2">
              <Checkbox
                id={`task-${task.id}`}
                checked={task.completed}
                onCheckedChange={() => handleToggleTask(task.id)}
              />
              <Label htmlFor={`task-${task.id}`} className={`flex-grow ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                {task.description} - <span className="text-xs text-muted-foreground">Due: {format(parseISO(task.dueDate), 'PPP')}</span>
              </Label>
            </div>
          )) : <p className="text-sm text-muted-foreground">No tasks added yet.</p>}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-semibold">Add New Task</h4>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Task description"
            value={newTaskDesc}
            onChange={e => setNewTaskDesc(e.target.value)}
            className="flex-grow"
          />
          <DatePicker
            date={newTaskDueDate}
            onDateChange={setNewTaskDueDate}
            modal={true}
            placeholder="Select due date"
            className="w-full sm:w-[200px]"
          />
          <Button onClick={handleAddTask} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Notes</h4>
        <Textarea
          placeholder="Add general notes for the action plan..."
          value={plan.notes || ''}
          onChange={e => handleNotesChange(e.target.value)}
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
}

export default function ActionPlanTab({ sites, cleaners, actionPlans, onUpdateActionPlan }: ActionPlanTabProps) {
  const sortedSites = useMemo(() => sites ? [...sites].sort((a, b) => a.name.localeCompare(b.name)) : [], [sites]);
  const sortedCleaners = useMemo(() => cleaners ? [...cleaners].sort((a, b) => a.name.localeCompare(b.name)) : [], [cleaners]);

  const actionItems = useMemo(() => {
    const siteItems = sortedSites
      .filter(s => s.status === 'Site under action plan' || s.status === 'Site requires action plan')
      .map(s => ({ id: s.id, name: s.name, type: 'site' as const }));

    const cleanerItems = sortedCleaners
      .filter(c => c.rating === 'Under action plan' || c.rating === 'Needs retraining')
      .map(c => ({ id: c.id, name: c.name, type: 'cleaner' as const }));

    return [...siteItems, ...cleanerItems].sort((a, b) => a.name.localeCompare(b.name));
  }, [sortedSites, sortedCleaners]);

  if (actionItems.length === 0) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground p-6 min-h-[200px] flex items-center justify-center">
        <p className="text-muted-foreground">No sites or cleaners currently require an action plan.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Action Plan Management</CardTitle>
        <p className="text-sm text-muted-foreground">Sites and cleaners that require an action plan.</p>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full space-y-2">
          {actionItems.map(item => (
            <AccordionItem key={item.id} value={item.id} className="border rounded-md px-4">
              <AccordionTrigger className="hover:no-underline">
                  <div className="flex justify-between items-center w-full pr-2">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-sm text-muted-foreground capitalize bg-muted px-2 py-1 rounded-md">{item.type}</span>
                  </div>
              </AccordionTrigger>
              <AccordionContent>
                <ActionPlanDetails
                  item={item}
                  plan={actionPlans.find(p => p.id === item.id)}
                  onUpdateActionPlan={onUpdateActionPlan}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
