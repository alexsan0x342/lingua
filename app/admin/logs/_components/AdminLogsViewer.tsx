"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { RefreshCw, Search, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AdminLog {
  id: string;
  adminId: string;
  adminEmail: string;
  adminName: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  admin: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface LogsResponse {
  logs: AdminLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function AdminLogsViewer() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      
      if (actionFilter) {
        params.append('action', actionFilter);
      }

      const response = await fetch(`/api/admin/logs?${params}`);
      
      if (response.status === 403) {
        setError("Access denied. Only the super admin can view logs.");
        return;
      }
      
      if (!response.ok) {
        throw new Error("Failed to fetch logs");
      }

      const data: LogsResponse = await response.json();
      setLogs(data.logs);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.adminEmail.toLowerCase().includes(query) ||
      log.adminName?.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      log.resourceType?.toLowerCase().includes(query)
    );
  });

  const getActionColor = (action: string): string => {
    if (action.startsWith('CREATE')) return 'default';
    if (action.startsWith('UPDATE')) return 'secondary';
    if (action.startsWith('DELETE')) return 'destructive';
    return 'outline';
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Admin Activity Logs</CardTitle>
              <CardDescription>
                Track all admin actions in the system
              </CardDescription>
            </div>
            <Button
              onClick={fetchLogs}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by admin, action, or resource..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Actions</SelectItem>
                <SelectItem value="CREATE_COURSE">Create Course</SelectItem>
                <SelectItem value="UPDATE_COURSE">Update Course</SelectItem>
                <SelectItem value="DELETE_COURSE">Delete Course</SelectItem>
                <SelectItem value="CREATE_CODE">Create Code</SelectItem>
                <SelectItem value="DELETE_CODE">Delete Code</SelectItem>
                <SelectItem value="BAN_USER">Ban User</SelectItem>
                <SelectItem value="UNBAN_USER">Unban User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logs Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.adminName || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{log.adminEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionColor(log.action) as any}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.resourceType && (
                          <div>
                            <div className="text-sm font-medium">{log.resourceType}</div>
                            {log.resourceId && (
                              <div className="text-xs text-muted-foreground font-mono">
                                {log.resourceId.substring(0, 8)}...
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ipAddress || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Details</DialogTitle>
            <DialogDescription>
              Complete information about this admin action
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Timestamp</div>
                  <div className="font-mono text-sm">
                    {format(new Date(selectedLog.createdAt), 'PPpp')}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Admin</div>
                  <div>{selectedLog.adminName}</div>
                  <div className="text-sm text-muted-foreground">{selectedLog.adminEmail}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Action</div>
                  <Badge variant={getActionColor(selectedLog.action) as any}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Resource</div>
                  <div>{selectedLog.resourceType || '-'}</div>
                  {selectedLog.resourceId && (
                    <div className="text-xs font-mono text-muted-foreground">
                      {selectedLog.resourceId}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">IP Address</div>
                  <div className="font-mono text-sm">{selectedLog.ipAddress || '-'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">User Agent</div>
                  <div className="text-sm truncate">{selectedLog.userAgent || '-'}</div>
                </div>
              </div>
              
              {selectedLog.details && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Additional Details</div>
                  <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
