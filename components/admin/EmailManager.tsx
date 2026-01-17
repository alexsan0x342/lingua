"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Send, Users, User, Eye, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function EmailManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    content: "",
    recipientType: "all",
    specificUserId: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/send-email');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Emails sent successfully! Sent: ${result.sent}, Failed: ${result.failed}`);
        setFormData({
          subject: "",
          content: "",
          recipientType: "all",
          specificUserId: "",
        });
      } else {
        toast.error(result.error || "Failed to send emails");
      }
    } catch (error) {
      console.error("Error sending emails:", error);
      toast.error("An error occurred while sending emails");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-primary">{users.length}</p>
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ready to Send</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formData.recipientType === "all" ? users.length : formData.specificUserId ? 1 : 0}
                </p>
              </div>
              <div className="p-2 rounded-full bg-blue-500/10">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email Status</p>
                <p className="text-lg font-semibold text-green-600">
                  {formData.subject && formData.content ? "Ready" : "Incomplete"}
                </p>
              </div>
              <div className="p-2 rounded-full bg-green-500/10">
                <Sparkles className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Composer and Preview side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Email Composer - Takes 3/5 of the width */}
        <Card className="lg:col-span-3 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              Compose Email
            </CardTitle>
            <CardDescription className="mt-1">
              Create and send emails to your users
            </CardDescription>
          </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-semibold">Email Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Enter email subject"
                className="h-10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-semibold">Email Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your email content here (HTML supported)"
                rows={6}
                className="text-sm resize-none"
                required
              />
              <p className="text-xs text-muted-foreground">HTML formatting is supported. Use &lt;p&gt;, &lt;strong&gt;, &lt;a&gt;, etc.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientType" className="text-sm font-semibold">Recipients</Label>
              <Select 
                value={formData.recipientType} 
                onValueChange={(value) => setFormData({ ...formData, recipientType: value, specificUserId: "" })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2 py-1">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="font-medium">All Users ({users.length})</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="specific">
                    <div className="flex items-center gap-2 py-1">
                      <User className="w-4 h-4 text-primary" />
                      <span className="font-medium">Specific User</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.recipientType === "specific" && (
              <div className="space-y-2">
                <Label htmlFor="specificUser" className="text-sm font-semibold">Select User</Label>
                <Select 
                  value={formData.specificUserId} 
                  onValueChange={(value) => setFormData({ ...formData, specificUserId: value })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.recipientType === "all" && (
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>This email will be sent to <strong>{users.length}</strong> registered users</span>
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full h-10 font-semibold"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email{formData.recipientType === "all" ? "s" : ""}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Preview Panel - Takes 2/5 of the width */}
      <Card className="lg:col-span-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Eye className="w-5 h-5 text-primary" />
            Email Preview
          </CardTitle>
          <CardDescription>
            Preview how your email will appear
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {/* Email Header Preview */}
            <div className="border rounded-lg p-3 bg-muted/30">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-semibold">To:</span>
                  {formData.recipientType === "all" ? (
                    <Badge variant="secondary" className="gap-1">
                      <Users className="w-3 h-3" />
                      All Users ({users.length})
                    </Badge>
                  ) : formData.specificUserId ? (
                    <Badge variant="secondary" className="gap-1">
                      <User className="w-3 h-3" />
                      {users.find(u => u.id === formData.specificUserId)?.name || "Selected User"}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground italic">No recipients selected</span>
                  )}
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-muted-foreground">Subject:</span>
                  <p className="mt-1 text-foreground font-medium">
                    {formData.subject || <span className="italic text-muted-foreground">No subject</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Email Content Preview */}
            <div className="border rounded-lg p-3 bg-background min-h-[200px]">
              <p className="text-sm font-semibold text-muted-foreground mb-2">Content:</p>
              {formData.content ? (
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: formData.content }}
                />
              ) : (
                <p className="text-muted-foreground italic text-sm">
                  Email content will appear here...
                </p>
              )}
            </div>

            {/* Quick Tips */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">💡 Tips:</p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-0.5 list-disc list-inside">
                <li>Use HTML for formatting</li>
                <li>Test with a single user first</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
