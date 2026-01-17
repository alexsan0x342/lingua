"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Copy, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Calendar,
  Users,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface RedemptionCode {
  id: string;
  code: string;
  type: 'COURSE';
  value: number;
  courseId?: string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  course?: {
    title: string;
  };
  redemptions: Array<{
    id: string;
    redeemedAt: string;
    user: {
      name: string;
      email: string;
    };
  }>;
}

export default function CodeManagement() {
  const [codes, setCodes] = useState<RedemptionCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<RedemptionCode | null>(null);
  const [courses, setCourses] = useState<Array<{ id: string; title: string; price: number }>>([]);

  const [newCode, setNewCode] = useState({
    code: '',
    type: 'COURSE' as 'COURSE',
    value: 0,
    courseId: '',
    maxUses: 1,
    expiresAt: undefined as Date | undefined
  });

  const [bulkCode, setBulkCode] = useState({
    count: 1,
    type: 'COURSE' as 'COURSE',
    value: 0,
    courseId: '',
    maxUses: 1,
    expiresAt: undefined as Date | undefined
  });

  useEffect(() => {
    fetchCodes();
    fetchCourses();
    
    // Refresh codes every 30 seconds to show updated usage counts
    const interval = setInterval(() => {
      fetchCodes();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log('Courses state updated:', courses);
  }, [courses]);

  useEffect(() => {
    console.log('NewCode state updated:', newCode);
  }, [newCode]);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/codes');
      if (response.ok) {
        const data = await response.json();
        setCodes(data.codes);
      }
    } catch (error) {
      console.error('Failed to fetch codes:', error);
      toast.error('Failed to fetch codes');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      console.log('Fetching courses...');
      const response = await fetch('/api/admin/courses', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Courses response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Courses data received:', data);
        setCourses(data || []);
      } else {
        console.error('Failed to fetch courses, status:', response.status);
        const errorData = await response.json();
        console.error('Error data:', errorData);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const createCode = async () => {
    try {
      const response = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCode),
      });

      if (response.ok) {
        toast.success('Code created successfully');
        setIsCreateDialogOpen(false);
        setNewCode({
          code: '',
          type: 'COURSE',
          value: 0,
          courseId: '',
          maxUses: 1,
          expiresAt: undefined
        });
        fetchCodes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create code');
      }
    } catch (error) {
      console.error('Failed to create code:', error);
      toast.error('Failed to create code');
    }
  };

  const updateCode = async (id: string, updates: Partial<RedemptionCode>) => {
    try {
      const response = await fetch('/api/admin/codes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (response.ok) {
        toast.success('Code updated successfully');
        setIsEditDialogOpen(false);
        setEditingCode(null);
        fetchCodes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update code');
      }
    } catch (error) {
      console.error('Failed to update code:', error);
      toast.error('Failed to update code');
    }
  };

  const deleteCode = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/codes?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Code deleted successfully');
        fetchCodes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete code');
      }
    } catch (error) {
      console.error('Failed to delete code:', error);
      toast.error('Failed to delete code');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success('Code copied to clipboard');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          toast.success('Code copied to clipboard');
        } catch (err) {
          toast.error('Failed to copy code');
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      toast.error('Failed to copy code');
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode({ ...newCode, code: result });
  };

  const createBulkCodes = async () => {
    try {
      const response = await fetch('/api/admin/codes/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bulkCode),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Successfully created ${data.count} codes`);
        setIsBulkDialogOpen(false);
        setBulkCode({
          count: 1,
          type: 'COURSE',
          value: 0,
          courseId: '',
          maxUses: 1,
          expiresAt: undefined
        });
        fetchCodes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create bulk codes');
      }
    } catch (error) {
      console.error('Failed to create bulk codes:', error);
      toast.error('Failed to create bulk codes');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading codes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold">Redemption Codes</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage course access codes for showcase mode
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={fetchCodes}
            className="flex items-center gap-2 flex-1 sm:flex-initial"
            size="sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 sm:flex-initial" size="sm">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Create Code</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Redemption Code</DialogTitle>
                <DialogDescription>
                  Create a new course access code for showcase mode.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="code" className="text-right">
                    Code
                  </Label>
                  <div className="col-span-3 flex gap-2">
                    <Input
                      id="code"
                      value={newCode.code}
                      onChange={(e) => setNewCode({ ...newCode, code: e.target.value })}
                      placeholder="Enter code"
                    />
                    <Button onClick={generateRandomCode} variant="outline" size="sm">
                      Generate
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <Select value={newCode.type} onValueChange={(value: any) => setNewCode({ ...newCode, type: value })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COURSE">Course Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="value" className="text-right">
                    Value
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    value={newCode.value}
                    onChange={(e) => setNewCode({ ...newCode, value: parseInt(e.target.value) || 0 })}
                    placeholder="Enter value"
                    readOnly={newCode.type === 'COURSE' && !!newCode.courseId}
                  />
                </div>
                {newCode.type === 'COURSE' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="course" className="text-right">
                      Course
                    </Label>
                    <Select value={newCode.courseId} onValueChange={(value) => {
                      console.log('Selected course ID:', value);
                      console.log('All courses:', courses);
                      const selectedCourse = courses.find(course => course.id === value);
                      console.log('Found course:', selectedCourse);
                      console.log('Course price:', selectedCourse?.price);
                      
                      let coursePrice = 0;
                      if (selectedCourse) {
                        // Price is stored in dollars, use it directly
                        coursePrice = selectedCourse.price;
                      }
                      console.log('Final course price:', coursePrice);
                      setNewCode({ ...newCode, courseId: value, value: coursePrice });
                    }}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.length === 0 ? (
                          <SelectItem value="" disabled>No courses available</SelectItem>
                        ) : (
                          courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title} - {course.price} LYD
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="maxUses" className="text-right">
                    Max Uses
                  </Label>
                  <Input
                    id="maxUses"
                    type="number"
                    value={newCode.maxUses}
                    onChange={(e) => setNewCode({ ...newCode, maxUses: parseInt(e.target.value) || 1 })}
                    placeholder="1"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="expiresAt" className="text-right">
                    Expires
                  </Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={newCode.expiresAt ? newCode.expiresAt.toISOString().slice(0, 16) : ''}
                    onChange={(e) => setNewCode({ ...newCode, expiresAt: e.target.value ? new Date(e.target.value) : undefined })}
                    placeholder="Select expiry date (optional)"
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createCode}>Create Code</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Bulk Generate
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Bulk Generate Codes</DialogTitle>
                <DialogDescription>
                  Generate multiple redemption codes at once with the same settings.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bulk-count" className="text-right">
                    Count
                  </Label>
                  <Input
                    id="bulk-count"
                    type="number"
                    value={bulkCode.count}
                    onChange={(e) => setBulkCode({ ...bulkCode, count: parseInt(e.target.value) || 1 })}
                    placeholder="Number of codes"
                    min="1"
                    max="100"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bulk-type" className="text-right">
                    Type
                  </Label>
                  <Select value={bulkCode.type} onValueChange={(value: any) => setBulkCode({ ...bulkCode, type: value })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COURSE">Course Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bulk-value" className="text-right">
                    Value
                  </Label>
                  <Input
                    id="bulk-value"
                    type="number"
                    value={bulkCode.value}
                    onChange={(e) => setBulkCode({ ...bulkCode, value: parseInt(e.target.value) || 0 })}
                    placeholder="Enter value"
                    readOnly={bulkCode.type === 'COURSE' && !!bulkCode.courseId}
                  />
                </div>
                {bulkCode.type === 'COURSE' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="bulk-course" className="text-right">
                      Course
                    </Label>
                    <Select value={bulkCode.courseId} onValueChange={(value) => {
                      const selectedCourse = courses.find(course => course.id === value);
                      console.log('Bulk selected course:', selectedCourse);
                      const coursePrice = selectedCourse ? selectedCourse.price : 0;
                      console.log('Bulk calculated course price:', coursePrice);
                      setBulkCode({ ...bulkCode, courseId: value, value: coursePrice });
                    }}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.length === 0 ? (
                          <SelectItem value="" disabled>No courses available</SelectItem>
                        ) : (
                          courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title} - {course.price} LYD
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bulk-maxUses" className="text-right">
                    Max Uses
                  </Label>
                  <Input
                    id="bulk-maxUses"
                    type="number"
                    value={bulkCode.maxUses}
                    onChange={(e) => setBulkCode({ ...bulkCode, maxUses: parseInt(e.target.value) || 1 })}
                    placeholder="1"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bulk-expiresAt" className="text-right">
                    Expires
                  </Label>
                  <Input
                    id="bulk-expiresAt"
                    type="datetime-local"
                    value={bulkCode.expiresAt ? bulkCode.expiresAt.toISOString().slice(0, 16) : ''}
                    onChange={(e) => setBulkCode({ ...bulkCode, expiresAt: e.target.value ? new Date(e.target.value) : undefined })}
                    placeholder="Select expiry date (optional)"
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createBulkCodes}>Generate {bulkCode.count} Codes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Codes</CardTitle>
          <CardDescription>
            Manage and monitor all redemption codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {code.code}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(code.code)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      COURSE
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {code.course?.title}
                  </TableCell>
                  <TableCell>
                    {code.usedCount} / {code.maxUses}
                  </TableCell>
                  <TableCell>
                    <Badge variant={code.isActive ? 'default' : 'destructive'}>
                      {code.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {code.expiresAt ? format(new Date(code.expiresAt), 'MMM dd, yyyy') : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingCode(code);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateCode(code.id, { isActive: !code.isActive })}
                      >
                        {code.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                      <ConfirmationDialog
                        title="Delete Code"
                        description="Are you sure you want to delete this redemption code? This action cannot be undone."
                        confirmText="Delete"
                        cancelText="Cancel"
                        variant="destructive"
                        onConfirm={() => deleteCode(code.id)}
                      >
                        <Button size="sm" variant="ghost">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </ConfirmationDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Code</DialogTitle>
            <DialogDescription>
              Update the code settings.
            </DialogDescription>
          </DialogHeader>
          {editingCode && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-maxUses" className="text-right">
                  Max Uses
                </Label>
                <Input
                  id="edit-maxUses"
                  type="number"
                  value={editingCode.maxUses}
                  onChange={(e) => setEditingCode({ ...editingCode, maxUses: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-expiresAt" className="text-right">
                  Expires
                </Label>
                <Input
                  id="edit-expiresAt"
                  type="datetime-local"
                  value={editingCode.expiresAt ? new Date(editingCode.expiresAt).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditingCode({ ...editingCode, expiresAt: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => editingCode && updateCode(editingCode.id, editingCode)}>
              Update Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
