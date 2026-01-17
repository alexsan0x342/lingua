"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, Search, Settings, Plus, X, Crown, GraduationCap, UserCog, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { UserRole } from "@/lib/rbac";
import { hasDynamicPermission } from "@/lib/dynamic-rbac";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: 'STUDENT' | 'MANAGER' | 'ADMIN';
  banned: boolean;
  banReason?: string;
  banExpires?: string;
  totalPoints: number;
  createdAt: string;
  _count: {
    courses: number;
    enrollment: number;
    assignmentSubmissions: number;
  };
  enrollment: Array<{
    Course: {
      id: string;
      title: string;
      slug: string;
      price: number;
    };
  }>;
  courses?: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
  }>;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  status: string;
  price: number;
}

export default function UsersPage() {
  const { session, loading } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [showBanForm, setShowBanForm] = useState(false);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Check permissions
  useEffect(() => {
    if (!loading && session) {
      const userRole = session.user.role as UserRole | null;
      if (!hasDynamicPermission(userRole, 'users_view')) {
        toast.error("You don't have permission to manage users");
        router.push("/admin");
        return;
      }
    }
  }, [session, loading, router]);

  useEffect(() => {
    if (!loading && session) {
      fetchUsers();
      fetchCourses();
    }
  }, [page, searchTerm, roleFilter, session, loading]);

  // Don't render anything until we've checked permissions
  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!session) {
    return <div className="flex items-center justify-center h-64">Please log in</div>;
  }

  const userRole = session.user.role as UserRole | null;
  if (!hasDynamicPermission(userRole, 'users_view')) {
    return <div className="flex items-center justify-center h-64">Access denied</div>;
  }

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter !== 'ALL' && { role: roleFilter })
      });
      
      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Error fetching users");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (response.ok) {
        const user = await response.json();
        setSelectedUser(user);
      } else {
        toast.error("Failed to fetch user details");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Error fetching user details");
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });

      if (response.ok) {
        toast.success("User role updated successfully");
        fetchUsers();
        if (selectedUser?.id === userId) {
          fetchUserDetails(userId);
        }
      } else {
        toast.error("Failed to update user role");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Error updating user role");
    }
  };

  const banUser = async (userId: string, banned: boolean, banReason?: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banned, banReason })
      });

      if (response.ok) {
        toast.success(banned ? "User banned successfully" : "User unbanned successfully");
        fetchUsers();
        if (selectedUser?.id === userId) {
          fetchUserDetails(userId);
        }
        // Reset form state
        setBanReason("");
        setShowBanForm(false);
      } else {
        toast.error(`Failed to ${banned ? 'ban' : 'unban'} user`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Error ${banned ? 'banning' : 'unbanning'} user`);
    }
  };

  const handleBanSubmit = () => {
    if (!banReason.trim()) {
      toast.error("Please enter a ban reason");
      return;
    }
    banUser(selectedUser!.id, true, banReason);
  };

  const handleUserDialogClose = () => {
    setIsUserDialogOpen(false);
    setSelectedUser(null);
    setBanReason("");
    setShowBanForm(false);
  };

  const enrollUser = async (userId: string, courseId: string, action: 'enroll' | 'unenroll') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, action })
      });

      if (response.ok) {
        toast.success(`User ${action}ed successfully`);
        fetchUsers();
        if (selectedUser?.id === userId) {
          fetchUserDetails(userId);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Error ${action}ing user`);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Crown className="h-4 w-4" />;
      case 'MANAGER': return <UserCog className="h-4 w-4" />;
      default: return <UserIcon className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and course enrollments
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="max-w-sm"
              />
            </div>
            <Select value={roleFilter} onValueChange={(value) => {
              setRoleFilter(value);
              setPage(1);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="STUDENT">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({pagination.total})
          </CardTitle>
          <CardDescription>
            Showing {users.length} of {pagination.total} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getRoleColor(user.role)} flex items-center gap-1 w-fit`}>
                          {getRoleIcon(user.role)}
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.banned ? "destructive" : "default"}>
                          {user.banned ? "Banned" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user._count.courses}</TableCell>
                      <TableCell>{user._count.enrollment}</TableCell>
                      <TableCell>{user.totalPoints}</TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            fetchUserDetails(user.id);
                            setIsUserDialogOpen(true);
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.pages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.pages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={handleUserDialogClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Manage User: {selectedUser?.name}
            </DialogTitle>
            <DialogDescription>
              Update user role, ban status, and manage course enrollments.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <Label>Total Points</Label>
                  <p className="text-sm">{selectedUser.totalPoints}</p>
                </div>
              </div>

              {/* Role Management */}
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value) => updateUserRole(selectedUser.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ban Management */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Ban Management</Label>
                  {selectedUser.banned ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => banUser(selectedUser.id, false)}
                    >
                      Unban User
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowBanForm(!showBanForm)}
                    >
                      {showBanForm ? "Cancel" : "Ban User"}
                    </Button>
                  )}
                </div>
                
                {selectedUser.banned && selectedUser.banReason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm font-medium text-red-800">Currently Banned</p>
                    <p className="text-sm text-red-600">Reason: {selectedUser.banReason}</p>
                  </div>
                )}

                {showBanForm && !selectedUser.banned && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md space-y-3">
                    <div>
                      <Label htmlFor="banReason" className="text-sm font-medium">
                        Ban Reason *
                      </Label>
                      <Textarea
                        id="banReason"
                        placeholder="Enter the reason for banning this user..."
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBanSubmit}
                        disabled={!banReason.trim()}
                      >
                        Confirm Ban
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowBanForm(false);
                          setBanReason("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Course Enrollments */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Course Enrollments</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEnrollDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Course
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {selectedUser.enrollment.map((enrollment) => (
                    <div key={enrollment.Course.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{enrollment.Course.title}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {enrollment.Course.price} LYD
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => enrollUser(selectedUser.id, enrollment.Course.id, 'unenroll')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {selectedUser.enrollment.length === 0 && (
                    <p className="text-sm text-muted-foreground">No course enrollments</p>
                  )}
                </div>
              </div>

              {/* Created Courses (for Managers/Admins) */}
              {selectedUser.courses && selectedUser.courses.length > 0 && (
                <div className="space-y-2">
                  <Label>Created Courses</Label>
                  <div className="space-y-1">
                    {selectedUser.courses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-medium">{course.title}</span>
                        <Badge variant="outline">{course.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Course Enrollment Dialog */}
      <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll User in Course</DialogTitle>
            <DialogDescription>
              Select a course to enroll {selectedUser?.name} in.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {courses.filter(course => 
              !selectedUser?.enrollment.some(e => e.Course.id === course.id)
            ).map((course) => (
              <div key={course.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <span className="font-medium">{course.title}</span>
                  <span className="text-sm text-muted-foreground ml-2">{course.price} LYD</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    if (selectedUser) {
                      enrollUser(selectedUser.id, course.id, 'enroll');
                      setIsEnrollDialogOpen(false);
                    }
                  }}
                >
                  Enroll
                </Button>
              </div>
            ))}
            {courses.filter(course => 
              !selectedUser?.enrollment.some(e => e.Course.id === course.id)
            ).length === 0 && (
              <p className="text-sm text-muted-foreground">All available courses already enrolled</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
