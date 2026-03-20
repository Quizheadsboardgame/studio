
'use client';

import { useState, useMemo } from 'react';
import type { Site, Consumable, MonthlySupplyOrder } from '@/lib/data';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, type Firestore } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';

interface ConsumableDialogProps {
  siteId: string;
  consumable?: Consumable;
  onAdd: (siteId: string, data: Omit<Consumable, 'id'>) => void;
  onEdit: (siteId: string, consumableId: string, data: Partial<Omit<Consumable, 'id'>>) => void;
  children: React.ReactNode;
}

function ConsumableDialog({ siteId, consumable, onAdd, onEdit, children }: ConsumableDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState(consumable?.name || '');
    const [orderingCode, setOrderingCode] = useState(consumable?.orderingCode || '');
    const { toast } = useToast();
    
    const handleSave = () => {
        if (!name || !orderingCode) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a name and ordering code.' });
            return;
        }
        if (consumable) {
            onEdit(siteId, consumable.id, { name, orderingCode });
        } else {
            onAdd(siteId, { name, orderingCode });
        }
        setIsOpen(false);
    }
    
    const handleOpenChange = (open: boolean) => {
        if (open) {
            setName(consumable?.name || '');
            setOrderingCode(consumable?.orderingCode || '');
        }
        setIsOpen(open);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{consumable ? 'Edit' : 'Add'} Consumable</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-3">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="code">Order Code</Label>
                        <Input id="code" value={orderingCode} onChange={e => setOrderingCode(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


interface SuppliesTabProps {
  sites: Site[];
  supplyOrders: MonthlySupplyOrder[];
  firestore: Firestore | null;
  activeProfileId: string;
  onSetOrder: (siteId: string, consumableId: string, date: Date, quantity: number) => void;
  onAddConsumable: (siteId: string, data: Omit<Consumable, 'id'>) => void;
  onEditConsumable: (siteId: string, consumableId: string, data: Partial<Omit<Consumable, 'id'>>) => void;
  onRemoveConsumable: (siteId: string, consumableId: string) => void;
}

export default function SuppliesTab({ sites, supplyOrders, firestore, activeProfileId, onSetOrder, onAddConsumable, onEditConsumable, onRemoveConsumable }: SuppliesTabProps) {
    const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>();
    const [currentDate, setCurrentDate] = useState(new Date());

    const consumablesCollection = useMemoFirebase(() => (firestore && selectedSiteId && activeProfileId) ? collection(firestore, 'userProfiles', activeProfileId, 'sites', selectedSiteId, 'consumables') : null, [firestore, selectedSiteId, activeProfileId]);
    const { data: consumables, isLoading: consumablesLoading } = useCollection<Consumable>(consumablesCollection);
    
    const ordersForMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        return supplyOrders.filter(order => order.siteId === selectedSiteId && order.year === year && order.month === month);
    }, [supplyOrders, selectedSiteId, currentDate]);

    const handleQuantityChange = (consumableId: string, quantityStr: string) => {
        if (!selectedSiteId) return;
        const quantity = parseInt(quantityStr, 10);
        onSetOrder(selectedSiteId, consumableId, currentDate, isNaN(quantity) ? 0 : quantity);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Supply Orders</CardTitle>
                <CardDescription>Track monthly consumable orders for each site.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                    <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                        <SelectTrigger className="w-full sm:w-[300px]">
                            <SelectValue placeholder="Select a site to view supplies" />
                        </SelectTrigger>
                        <SelectContent>
                            {sites.map(site => <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-medium text-center w-32">{format(currentDate, 'MMMM yyyy')}</span>
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {!selectedSiteId ? (
                    <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">Please select a site to manage consumables.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <ConsumableDialog siteId={selectedSiteId} onAdd={onAddConsumable} onEdit={onEditConsumable}>
                                <Button><PlusCircle className="mr-2 h-4 w-4"/> Add Consumable</Button>
                            </ConsumableDialog>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Consumable</TableHead>
                                        <TableHead className="hidden sm:table-cell">Ordering Code</TableHead>
                                        <TableHead className="w-[150px]">Quantity Ordered</TableHead>
                                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {consumablesLoading && (
                                        <>
                                            <TableRow><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                                            <TableRow><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                                        </>
                                    )}
                                    {!consumablesLoading && consumables && consumables.length > 0 ? (
                                        consumables.map(consumable => {
                                            const order = ordersForMonth.find(o => o.consumableId === consumable.id);
                                            return (
                                                <TableRow key={consumable.id}>
                                                    <TableCell className="font-medium">{consumable.name}</TableCell>
                                                    <TableCell className="hidden sm:table-cell">{consumable.orderingCode}</TableCell>
                                                    <TableCell>
                                                        <Input 
                                                            type="number" 
                                                            value={order?.quantity || ''}
                                                            onChange={e => handleQuantityChange(consumable.id, e.target.value)}
                                                            placeholder="0"
                                                            className="w-24"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end items-center">
                                                            <ConsumableDialog siteId={selectedSiteId} consumable={consumable} onAdd={onAddConsumable} onEdit={onEditConsumable}>
                                                                <Button variant="ghost" size="icon"><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                                                            </ConsumableDialog>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Delete {consumable.name}?</AlertDialogTitle>
                                                                        <AlertDialogDescription>This will permanently delete this consumable for this site. This action cannot be undone.</AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => onRemoveConsumable(selectedSiteId, consumable.id)}>Delete</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    ) : (
                                        !consumablesLoading && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                                    No consumables added for this site yet.
                                                </TableCell>
                                            </TableRow>
                                        )
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
