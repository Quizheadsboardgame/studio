'use client';

import { useState } from 'react';
import type { Task, Site } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface TasksTabProps {
  tasks: Task[];
  sites: Site[];
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  onUpdateTask: (taskId: string, task: Partial<Omit<Task, 'id'>>) => void;
  onRemoveTask: (taskId: string) => void;
}

export default function TasksTab({ tasks, sites, onAddTask, onUpdateTask, onRemoveTask }: TasksTabProps) {
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('Unassigned');
  const [newTaskSite, setNewTaskSite] = useState<string>('');

  const handleAddTask = () => {
    if (!newTaskDesc.trim()) return;
    onAddTask({
      description: newTaskDesc,
      dueDate: newTaskDueDate || null,
      assignee: newTaskAssignee,
      site: newTaskSite || undefined,
    });
    setNewTaskDesc('');
    setNewTaskDueDate('');
    setNewTaskAssignee('Unassigned');
    setNewTaskSite('');
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    if (a.dueDate && b.dueDate) return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>To-Do List</CardTitle>
        <CardDescription>Manage general tasks for the team.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-2 p-4 border rounded-lg items-end">
          <div className="flex-grow space-y-2">
            <Label htmlFor="new-task-desc">New Task</Label>
            <Input
              id="new-task-desc"
              placeholder="Task description..."
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
            />
          </div>
          <div className="w-full md:w-auto space-y-2">
            <Label htmlFor="new-task-site">Site (Optional)</Label>
            <Select value={newTaskSite} onValueChange={setNewTaskSite}>
              <SelectTrigger id="new-task-site" className="w-full md:w-[200px]">
                <SelectValue placeholder="Select a site" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {sites.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-auto space-y-2">
            <Label htmlFor="new-task-due-date">Due Date</Label>
             <Input
                id="new-task-due-date"
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="w-full"
            />
          </div>
          <div className="w-full md:w-auto space-y-2">
            <Label htmlFor="new-task-assignee">Assignee</Label>
            <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
              <SelectTrigger id="new-task-assignee" className="w-full md:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="Unassigned">Unassigned</SelectItem>
                  <SelectItem value="Owen Newton">Owen Newton</SelectItem>
                  <SelectItem value="Nick Miller">Nick Miller</SelectItem>
                  <SelectItem value="Mircalla Bond (Carla)">Mircalla Bond (Carla)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleAddTask} className="w-full md:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Done</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="w-[50px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTasks.length > 0 ? sortedTasks.map((task) => (
                <TableRow key={task.id} className={cn(task.completed && 'bg-muted/50')}>
                  <TableCell className="p-2 text-center">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={(checked) => onUpdateTask(task.id, { completed: !!checked })}
                      className="h-5 w-5"
                    />
                  </TableCell>
                  <TableCell className={cn("font-medium", task.completed && 'line-through text-muted-foreground')}>
                    {task.description}
                  </TableCell>
                  <TableCell className={cn(task.completed && 'text-muted-foreground')}>
                    {task.site || 'N/A'}
                  </TableCell>
                  <TableCell className={cn(task.completed && 'text-muted-foreground')}>
                    {task.assignee || 'Unassigned'}
                  </TableCell>
                  <TableCell className={cn(task.completed && 'text-muted-foreground')}>
                    {task.dueDate ? format(parseISO(task.dueDate), 'PPP') : 'No due date'}
                  </TableCell>
                  <TableCell className="text-right p-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Task?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this task? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onRemoveTask(task.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No tasks yet. Add one to get started!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
