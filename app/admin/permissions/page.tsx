"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { 
  DEFAULT_PERMISSIONS, 
  DEFAULT_ROLE_PERMISSIONS, 
  getDynamicRolePermissions, 
  saveDynamicRolePermissions,
  hasDynamicPermission,
  getCustomPermissions,
  saveCustomPermissions,
  getCustomQuickActions,
  saveCustomQuickActions,
  type DynamicRolePermissions,
  type DynamicPermission,
  type QuickAction
} from "@/lib/dynamic-rbac";
import { UserRole } from "@/lib/rbac";
import { Shield, Users, BookOpen, Video, BarChart3, Settings, Save, Plus, Trash2 } from "lucide-react";

export default function PermissionsPage() {
  const { session, loading } = useSession();
  const [rolePermissions, setRolePermissions] = useState<DynamicRolePermissions[]>(DEFAULT_ROLE_PERMISSIONS);
  const [customPermissions, setCustomPermissions] = useState<DynamicPermission[]>([]);
  const [customActions, setCustomActions] = useState<QuickAction[]>([]);
  const [activeRole, setActiveRole] = useState<UserRole>('STUDENT');
  const [isSaving, setIsSaving] = useState(false);

  // New permission form
  const [newPermission, setNewPermission] = useState({
    id: '',
    resource: '',
    action: '',
    description: ''
  });

  // New quick action form
  const [newAction, setNewAction] = useState({
    id: '',
    title: '',
    description: '',
    href: '',
    icon: 'Settings',
    variant: 'default' as const,
    requiredPermission: ''
  });

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = () => {
    const stored = getDynamicRolePermissions();
    const customPerms = getCustomPermissions();
    const customActs = getCustomQuickActions();
    
    setRolePermissions(stored);
    setCustomPermissions(customPerms);
    setCustomActions(customActs);
  };

  const getDefaultQuickActions = (): QuickAction[] => [
    { id: 'manage_users', title: 'Manage Users', description: 'User management', href: '/admin/users', icon: 'Users', variant: 'default', requiredPermission: 'users_view' },
    { id: 'manage_courses', title: 'Manage Courses', description: 'Course management', href: '/admin/courses', icon: 'BookOpen', variant: 'default', requiredPermission: 'courses_view' },
    { id: 'view_analytics', title: 'View Analytics', description: 'System analytics', href: '/admin/analytics', icon: 'BarChart3', variant: 'default', requiredPermission: 'analytics_view_all' },
    { id: 'live_lessons', title: 'Live Lessons', description: 'Manage live lessons', href: '/admin/live-lessons', icon: 'Video', variant: 'default', requiredPermission: 'live_lessons_view' },
    { id: 'permissions', title: 'Permissions', description: 'Manage permissions', href: '/admin/permissions', icon: 'Shield', variant: 'default', requiredPermission: 'admin_panel' }
  ];

  // Check permissions
  if (!loading && session) {
    const userRole = session.user.role as UserRole | null;
    if (!hasDynamicPermission(userRole, 'admin_panel')) {
      return (
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to manage permissions.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Please log in</div>
      </div>
    );
  }

  const allPermissions = [...DEFAULT_PERMISSIONS, ...customPermissions];
  const allActions = [...getDefaultQuickActions(), ...customActions];

  const handlePermissionToggle = (role: UserRole, permissionId: string, checked: boolean) => {
    setRolePermissions(prev => prev.map(rp => {
      if (rp.role === role) {
        const newPermissions = checked 
          ? [...rp.permissions, permissionId]
          : rp.permissions.filter(p => p !== permissionId);
        return { ...rp, permissions: newPermissions };
      }
      return rp;
    }));
  };

  const handleDashboardConfigChange = (role: UserRole, key: string, value: any) => {
    setRolePermissions(prev => prev.map(rp => {
      if (rp.role === role) {
        return {
          ...rp,
          dashboardConfig: {
            ...rp.dashboardConfig,
            [key]: value
          }
        };
      }
      return rp;
    }));
  };

  const handleQuickActionToggle = (role: UserRole, actionId: string, checked: boolean) => {
    setRolePermissions(prev => prev.map(rp => {
      if (rp.role === role) {
        const newActions = checked 
          ? [...rp.dashboardConfig.allowedQuickActions, actionId]
          : rp.dashboardConfig.allowedQuickActions.filter(a => a !== actionId);
        return {
          ...rp,
          dashboardConfig: {
            ...rp.dashboardConfig,
            allowedQuickActions: newActions
          }
        };
      }
      return rp;
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      saveDynamicRolePermissions(rolePermissions);
      saveCustomPermissions(customPermissions);
      saveCustomQuickActions(customActions);
      toast.success("Permissions saved successfully!");
    } catch (error) {
      toast.error("Failed to save permissions");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const addCustomPermission = () => {
    if (!newPermission.id || !newPermission.resource || !newPermission.action) {
      toast.error("Please fill in all required fields");
      return;
    }

    const permission: DynamicPermission = {
      id: newPermission.id,
      resource: newPermission.resource,
      action: newPermission.action,
      description: newPermission.description || `${newPermission.action} ${newPermission.resource}`
    };

    setCustomPermissions(prev => [...prev, permission]);
    setNewPermission({ id: '', resource: '', action: '', description: '' });
    toast.success("Custom permission added!");
  };

  const removeCustomPermission = (permissionId: string) => {
    setCustomPermissions(prev => prev.filter(p => p.id !== permissionId));
    // Remove from all role permissions
    setRolePermissions(prev => prev.map(rp => ({
      ...rp,
      permissions: rp.permissions.filter(p => p !== permissionId)
    })));
    toast.success("Custom permission removed!");
  };

  const addCustomAction = () => {
    if (!newAction.id || !newAction.title || !newAction.href) {
      toast.error("Please fill in all required fields");
      return;
    }

    const action: QuickAction = {
      id: newAction.id,
      title: newAction.title,
      description: newAction.description,
      href: newAction.href,
      icon: newAction.icon,
      variant: newAction.variant,
      requiredPermission: newAction.requiredPermission || undefined
    };

    setCustomActions(prev => [...prev, action]);
    setNewAction({
      id: '',
      title: '',
      description: '',
      href: '',
      icon: 'Settings',
      variant: 'default',
      requiredPermission: ''
    });
    toast.success("Custom quick action added!");
  };

  const removeCustomAction = (actionId: string) => {
    setCustomActions(prev => prev.filter(a => a.id !== actionId));
    // Remove from all role quick actions
    setRolePermissions(prev => prev.map(rp => ({
      ...rp,
      dashboardConfig: {
        ...rp.dashboardConfig,
        allowedQuickActions: rp.dashboardConfig.allowedQuickActions.filter(a => a !== actionId)
      }
    })));
    toast.success("Custom quick action removed!");
  };

  const getCurrentRoleConfig = () => {
    return rolePermissions.find(rp => rp.role === activeRole);
  };

  const roleConfig = getCurrentRoleConfig();

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return <Shield className="h-4 w-4" />;
      case 'MANAGER': return <Settings className="h-4 w-4" />;
      case 'STUDENT': return <Users className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'MANAGER': return 'bg-purple-100 text-purple-800';
      case 'STUDENT': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Permissions Management</h1>
          <p className="text-muted-foreground mt-2">
            Configure role-based permissions and dashboard layouts
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs value={activeRole} onValueChange={(value) => setActiveRole(value as UserRole)}>
        <TabsList className="grid w-full grid-cols-4">
          {(['STUDENT', 'TEACHER', 'MANAGER', 'ADMIN'] as UserRole[]).map((role) => (
            <TabsTrigger key={role} value={role} className="flex items-center gap-2">
              {getRoleIcon(role)}
              {role}
            </TabsTrigger>
          ))}
        </TabsList>

        {(['STUDENT', 'TEACHER', 'MANAGER', 'ADMIN'] as UserRole[]).map((role) => (
          <TabsContent key={role} value={role} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getRoleIcon(role)}
                  {role} Role Configuration
                </CardTitle>
                <CardDescription>
                  Configure permissions and dashboard layout for {role.toLowerCase()} users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Permissions Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Permissions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allPermissions.map((permission) => (
                      <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <Label htmlFor={`${role}-${permission.id}`} className="text-sm font-medium">
                            {permission.id}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            {permission.description}
                          </p>
                          <div className="flex gap-1 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {permission.resource}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {permission.action}
                            </Badge>
                          </div>
                        </div>
                        <Switch
                          id={`${role}-${permission.id}`}
                          checked={roleConfig?.permissions.includes(permission.id) || false}
                          onCheckedChange={(checked) => handlePermissionToggle(role, permission.id, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Dashboard Configuration */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Dashboard Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`${role}-showUsers`}>Show Users Section</Label>
                        <Switch
                          id={`${role}-showUsers`}
                          checked={roleConfig?.dashboardConfig.showUsers || false}
                          onCheckedChange={(checked) => handleDashboardConfigChange(role, 'showUsers', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`${role}-showCourses`}>Show Courses Section</Label>
                        <Switch
                          id={`${role}-showCourses`}
                          checked={roleConfig?.dashboardConfig.showCourses || false}
                          onCheckedChange={(checked) => handleDashboardConfigChange(role, 'showCourses', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`${role}-showAnalytics`}>Show Analytics Section</Label>
                        <Switch
                          id={`${role}-showAnalytics`}
                          checked={roleConfig?.dashboardConfig.showAnalytics || false}
                          onCheckedChange={(checked) => handleDashboardConfigChange(role, 'showAnalytics', checked)}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`${role}-showLiveLessons`}>Show Live Lessons Section</Label>
                        <Switch
                          id={`${role}-showLiveLessons`}
                          checked={roleConfig?.dashboardConfig.showLiveLessons || false}
                          onCheckedChange={(checked) => handleDashboardConfigChange(role, 'showLiveLessons', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`${role}-showFileCleanup`}>Show File Cleanup Section</Label>
                        <Switch
                          id={`${role}-showFileCleanup`}
                          checked={roleConfig?.dashboardConfig.showFileCleanup || false}
                          onCheckedChange={(checked) => handleDashboardConfigChange(role, 'showFileCleanup', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`${role}-showRecentCourses`}>Show Recent Courses</Label>
                        <Switch
                          id={`${role}-showRecentCourses`}
                          checked={roleConfig?.dashboardConfig.showRecentCourses || false}
                          onCheckedChange={(checked) => handleDashboardConfigChange(role, 'showRecentCourses', checked)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Label htmlFor={`${role}-welcomeMessage`}>Custom Welcome Message</Label>
                    <Textarea
                      id={`${role}-welcomeMessage`}
                      value={roleConfig?.dashboardConfig.customWelcomeMessage || ''}
                      onChange={(e) => handleDashboardConfigChange(role, 'customWelcomeMessage', e.target.value)}
                      placeholder="Enter a custom welcome message for this role..."
                      className="mt-2"
                    />
                  </div>
                </div>

                <Separator />

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allActions.map((action) => (
                      <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <Label htmlFor={`${role}-action-${action.id}`} className="text-sm font-medium">
                            {action.title}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            {action.description}
                          </p>
                          {action.requiredPermission && (
                            <Badge variant="outline" className="text-xs mt-2">
                              Requires: {action.requiredPermission}
                            </Badge>
                          )}
                        </div>
                        <Switch
                          id={`${role}-action-${action.id}`}
                          checked={roleConfig?.dashboardConfig.allowedQuickActions.includes(action.id) || false}
                          onCheckedChange={(checked) => handleQuickActionToggle(role, action.id, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Custom Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Permissions</CardTitle>
          <CardDescription>Create and manage custom permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Permission ID"
              value={newPermission.id}
              onChange={(e) => setNewPermission(prev => ({ ...prev, id: e.target.value }))}
            />
            <Input
              placeholder="Resource"
              value={newPermission.resource}
              onChange={(e) => setNewPermission(prev => ({ ...prev, resource: e.target.value }))}
            />
            <Input
              placeholder="Action"
              value={newPermission.action}
              onChange={(e) => setNewPermission(prev => ({ ...prev, action: e.target.value }))}
            />
            <Button onClick={addCustomPermission}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
          <Input
            placeholder="Description"
            value={newPermission.description}
            onChange={(e) => setNewPermission(prev => ({ ...prev, description: e.target.value }))}
          />
          
          {customPermissions.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Custom Permissions</h4>
              {customPermissions.map((permission) => (
                <div key={permission.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <span className="font-medium">{permission.id}</span>
                    <span className="text-muted-foreground ml-2">{permission.description}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCustomPermission(permission.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Quick Actions</CardTitle>
          <CardDescription>Create and manage custom dashboard quick actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Action ID"
              value={newAction.id}
              onChange={(e) => setNewAction(prev => ({ ...prev, id: e.target.value }))}
            />
            <Input
              placeholder="Title"
              value={newAction.title}
              onChange={(e) => setNewAction(prev => ({ ...prev, title: e.target.value }))}
            />
            <Input
              placeholder="URL/Href"
              value={newAction.href}
              onChange={(e) => setNewAction(prev => ({ ...prev, href: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Description"
              value={newAction.description}
              onChange={(e) => setNewAction(prev => ({ ...prev, description: e.target.value }))}
            />
            <Input
              placeholder="Required Permission (optional)"
              value={newAction.requiredPermission}
              onChange={(e) => setNewAction(prev => ({ ...prev, requiredPermission: e.target.value }))}
            />
          </div>
          <Button onClick={addCustomAction}>
            <Plus className="h-4 w-4 mr-2" />
            Add Quick Action
          </Button>
          
          {customActions.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Custom Quick Actions</h4>
              {customActions.map((action) => (
                <div key={action.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <span className="font-medium">{action.title}</span>
                    <span className="text-muted-foreground ml-2">{action.description}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCustomAction(action.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
