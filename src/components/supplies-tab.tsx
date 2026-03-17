'use client';

import { useState } from 'react';
import type { Supply } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SuppliesTabProps {
  supplies: Supply[];
  onAdd: (entry: Omit<Supply, 'id'>) => void;
  onUpdate: (id: string, entry: Partial<Omit<Supply, 'id'>>) => void;
  onRemove: (id: string) => void;
}

function SupplyDialog({ onSave, supply, children }: { onSave: (entry: Omit<Supply, 'id'>) => void; supply?: Supply; children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState(supply?.name || '');
    const [quantity, setQuantity] = useState(supply?.quantity?.toString() || '0');
    const [unit, setUnit] = useState(supply?.unit || '');
    const [reorderLevel, setReorderLevel] = useState(supply?.reorderLevel?.toString() || '0');
    const { toast } = useToast();

    const handleSave = () => {
        const numQuantity = parseInt(quantity, 10);
        const numReorderLevel = parseInt(reorderLevel, 10);

        if (!name || !unit || isNaN(numQuantity) || isNaN(numReorderLevel)) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields correctly.' });
            return;
        }

        onSave({ name, unit, quantity: numQuantity, reorderLevel: numReorderLevel });
        setIsOpen(false);
        toast({ title: 'Supply Saved', description: `Supply '${name}' has been saved.` });
    };

    const handleOpenChange = (open: boolean) => {
        if (open) {
            setName(supply?.name || '');
            setQuantity(supply?.quantity?.toString() || '0');
            setUnit(supply?.unit || '');
            setReorderLevel(supply?.reorderLevel?.toString() || '0');
        }
        setIsOpen(open);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{supply ? 'Edit' : 'Add'} Supply</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="quantity" className="text-right">Quantity</Label>
                        <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="unit" className="text-right">Unit</Label>
                        <Input id="unit" value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g. bottles, rolls" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="reorder" className="text-right">Re-order Level</Label>
                        <Input id="reorder" type="number" value={reorderLevel} onChange={e => setReorderLevel(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function SuppliesTab({ supplies, onAdd, onUpdate, onRemove }: SuppliesTabProps) {
    const { toast } = useToast();

    const handleQuantityChange = (id: string, currentQuantity: number, change: number) => {
        const newQuantity = Math.max(0, currentQuantity + change);
        onUpdate(id, { quantity: newQuantity });
    }

  return (
    <div className="space-y-4">
        <div className="flex justify-end">
            <SupplyDialog onSave={onAdd}>
                 <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Supply</Button>
            </SupplyDialog>
        </div>
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Supply Item</TableHead>
                        <TableHead className="w-[200px]">Current Quantity</TableHead>
                        <TableHead className="w-[150px]">Re-order Level</TableHead>
                        <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {supplies.length > 0 ? (
                        supplies.map((supply) => (
                            <TableRow key={supply.id} className={cn({ 'bg-destructive/10 hover:bg-destructive/20': supply.quantity <= supply.reorderLevel })}>
                                <TableCell className="font-medium">{supply.name}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(supply.id, supply.quantity, -1)}>-</Button>
                                        <span className="font-bold text-center w-12">{supply.quantity}</span>
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(supply.id, supply.quantity, 1)}>+</Button>
                                        <span className="text-muted-foreground">{supply.unit}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{supply.reorderLevel}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <SupplyDialog onSave={(updatedSupply) => onUpdate(supply.id, updatedSupply)} supply={supply}>
                                            <Button variant="ghost" size="icon"><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                                        </SupplyDialog>

                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                             <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Delete Supply?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                This will permanently delete '{supply.name}'. This action cannot be undone.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => onRemove(supply.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>

                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                No supplies found. Click "Add Supply" to create one.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}

    