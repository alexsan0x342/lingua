"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { 
  Plus, 
  DollarSign, 
  TrendingUp,
  Calendar,
  CreditCard,
  Server,
  Mail,
  FileText,
  Wrench,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Cost {
  id: string;
  category: string;
  description: string;
  amount: number;
  type: 'MONTHLY' | 'ONE_TIME' | 'ANNUAL';
  date: string;
  monthlyImpact: number;
  createdAt: string;
  updatedAt: string;
}

interface CostTotals {
  monthly: number;
  oneTime: number;
}

export default function CostManagement() {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [totals, setTotals] = useState<CostTotals>({ monthly: 0, oneTime: 0 });
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<Cost | null>(null);

  const [newCost, setNewCost] = useState({
    category: '',
    description: '',
    amount: 0,
    type: 'MONTHLY' as 'MONTHLY' | 'ONE_TIME' | 'ANNUAL',
    date: undefined as Date | undefined
  });

  const costCategories = [
    { value: 'Infrastructure', label: 'Infrastructure', icon: Server },
    { value: 'Payment Processing', label: 'Payment Processing', icon: CreditCard },
    { value: 'Video Services', label: 'Video Services', icon: TrendingUp },
    { value: 'Communication', label: 'Communication', icon: Mail },
    { value: 'File Storage', label: 'File Storage', icon: FileText },
    { value: 'Development', label: 'Development', icon: Wrench },
    { value: 'Marketing', label: 'Marketing', icon: TrendingUp },
    { value: 'Security', label: 'Security', icon: Eye },
    { value: 'Other', label: 'Other', icon: DollarSign }
  ];

  useEffect(() => {
    fetchCosts();
  }, []);

  const fetchCosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/costs');
      if (response.ok) {
        const data = await response.json();
        setCosts(data.costs || []);
        setTotals(data.totals || { monthly: 0, oneTime: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch costs:', error);
      toast.error('Failed to fetch costs');
    } finally {
      setLoading(false);
    }
  };

  const addCost = async () => {
    try {
      const response = await fetch('/api/admin/costs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: newCost.category,
          description: newCost.description,
          amount: newCost.amount,
          type: newCost.type,
          date: newCost.date?.toISOString()
        }),
      });

      if (response.ok) {
        toast.success('Cost added successfully');
        setIsCreateDialogOpen(false);
        setNewCost({
          category: '',
          description: '',
          amount: 0,
          type: 'MONTHLY',
          date: undefined
        });
        fetchCosts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add cost');
      }
    } catch (error) {
      console.error('Failed to add cost:', error);
      toast.error('Failed to add cost');
    }
  };

  const updateCost = async () => {
    if (!editingCost) return;

    try {
      const response = await fetch('/api/admin/costs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingCost.id,
          category: editingCost.category,
          description: editingCost.description,
          amount: editingCost.amount / 100, // Convert from cents to dollars
          type: editingCost.type,
          date: editingCost.date
        }),
      });

      if (response.ok) {
        toast.success('Cost updated successfully');
        setIsEditDialogOpen(false);
        setEditingCost(null);
        fetchCosts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update cost');
      }
    } catch (error) {
      console.error('Failed to update cost:', error);
      toast.error('Failed to update cost');
    }
  };

  const deleteCost = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/costs?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Cost deleted successfully');
        fetchCosts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete cost');
      }
    } catch (error) {
      console.error('Failed to delete cost:', error);
      toast.error('Failed to delete cost');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = costCategories.find(cat => cat.value === category);
    return categoryData?.icon || DollarSign;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'MONTHLY': return 'Monthly';
      case 'ANNUAL': return 'Annual';
      case 'ONE_TIME': return 'One-time';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading costs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cost Management</h1>
          <p className="text-muted-foreground">
            Track and manage your business expenses with detailed breakdowns
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Cost
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Cost</DialogTitle>
              <DialogDescription>
                Add a new cost entry to track your business expenses.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select value={newCost.category} onValueChange={(value) => setNewCost({ ...newCost, category: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {costCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center gap-2">
                          <category.icon className="w-4 h-4" />
                          {category.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  value={newCost.description}
                  onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                  placeholder="Enter description"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={newCost.amount}
                  onChange={(e) => setNewCost({ ...newCost, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select value={newCost.type} onValueChange={(value: any) => setNewCost({ ...newCost, type: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="ANNUAL">Annual</SelectItem>
                    <SelectItem value="ONE_TIME">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={newCost.date ? newCost.date.toISOString().split('T')[0] : ''}
                  onChange={(e) => setNewCost({ ...newCost, date: e.target.value ? new Date(e.target.value) : undefined })}
                  placeholder="Select date (optional)"
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={addCost}>Add Cost</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Monthly Impact</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.monthly)}
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly recurring costs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total One-time Costs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.oneTime)}
            </div>
            <p className="text-xs text-muted-foreground">
              One-time expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(costs.map(cost => cost.category)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Active cost categories
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
          <CardDescription>
            Detailed view of all tracked costs by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Monthly Impact</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costs.map((cost) => {
                const IconComponent = getCategoryIcon(cost.category);
                return (
                  <TableRow key={cost.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        {cost.category}
                      </div>
                    </TableCell>
                    <TableCell>{cost.description}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(cost.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        cost.type === 'MONTHLY' ? 'default' : 
                        cost.type === 'ANNUAL' ? 'secondary' : 'outline'
                      }>
                        {getTypeLabel(cost.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(cost.monthlyImpact)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(cost.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingCost(cost);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <ConfirmationDialog
                          title="Delete Cost"
                          description="Are you sure you want to delete this cost entry? This action cannot be undone."
                          confirmText="Delete"
                          cancelText="Cancel"
                          variant="destructive"
                          onConfirm={() => deleteCost(cost.id)}
                        >
                          <Button size="sm" variant="ghost">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </ConfirmationDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Cost</DialogTitle>
            <DialogDescription>
              Update the cost entry details.
            </DialogDescription>
          </DialogHeader>
          {editingCost && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-category" className="text-right">
                  Category
                </Label>
                <Select 
                  value={editingCost.category} 
                  onValueChange={(value) => setEditingCost({ ...editingCost, category: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {costCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center gap-2">
                          <category.icon className="w-4 h-4" />
                          {category.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Description
                </Label>
                <Input
                  id="edit-description"
                  value={editingCost.description}
                  onChange={(e) => setEditingCost({ ...editingCost, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  value={editingCost.amount / 100}
                  onChange={(e) => setEditingCost({ ...editingCost, amount: Math.round((parseFloat(e.target.value) || 0) * 100) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-type" className="text-right">
                  Type
                </Label>
                <Select 
                  value={editingCost.type} 
                  onValueChange={(value: any) => setEditingCost({ ...editingCost, type: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="ANNUAL">Annual</SelectItem>
                    <SelectItem value="ONE_TIME">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={updateCost}>Update Cost</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}