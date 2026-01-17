"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Globe,
  Smartphone,
  MapPin,
  Users,
  Eye,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface DeviceTracking {
  id: string;
  deviceId: string;
  deviceName: string | null;
  ipAddress: string;
  userAgent: string;
  country: string | null;
  city: string | null;
  region: string | null;
  isp: string | null;
  isActive: boolean;
  lastSeen: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface CodeRedemption {
  id: string;
  deviceId: string;
  ipAddress: string;
  country: string | null;
  city: string | null;
  region: string | null;
  redeemedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  code: {
    id: string;
    code: string;
    type: string;
    course: {
      title: string;
    } | null;
  };
}

interface Analytics {
  totalDevices: number;
  activeDevices: number;
  totalRedemptions: number;
  uniqueCountries: number;
  countryStats: {
    country: string;
    count: number;
  }[];
}

export function DeviceTrackingClient() {
  const [deviceTracking, setDeviceTracking] = useState<DeviceTracking[]>([]);
  const [codeRedemptions, setCodeRedemptions] = useState<CodeRedemption[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeviceTracking();
  }, []);

  const fetchDeviceTracking = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/device-tracking");
      if (response.ok) {
        const data = await response.json();
        setDeviceTracking(data.deviceTracking || []);
        setCodeRedemptions(data.codeRedemptions || []);
        setAnalytics(data.analytics || null);
      } else {
        toast.error("Failed to fetch device tracking data");
      }
    } catch (error) {
      console.error("Failed to fetch device tracking:", error);
      toast.error("Failed to fetch device tracking data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading device tracking data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Device Tracking & Monitoring</h1>
        <p className="text-muted-foreground">
          Monitor user devices and code redemption patterns
        </p>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Devices
              </CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalDevices}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Devices
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.activeDevices}
              </div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Code Redemptions
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.totalRedemptions}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices">Device Tracking</TabsTrigger>
          <TabsTrigger value="redemptions">Code Redemptions</TabsTrigger>
        </TabsList>

        {/* Device Tracking Tab */}
        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tracked Devices</CardTitle>
              <CardDescription>
                Monitor user devices and their last activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(deviceTracking) &&
                      deviceTracking.map((device) => (
                        <TableRow key={device.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{device.user.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {device.user.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {device.deviceName || "Unknown Device"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-mono">
                            {device.ipAddress}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(
                              new Date(device.lastSeen),
                              "MMM dd, yyyy HH:mm",
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                device.isActive ? "default" : "secondary"
                              }
                            >
                              {device.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Code Redemptions Tab */}
        <TabsContent value="redemptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Code Redemptions</CardTitle>
              <CardDescription>
                Track where and when codes are redeemed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Redeemed At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(codeRedemptions) &&
                      codeRedemptions.map((redemption) => (
                        <TableRow key={redemption.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {redemption.user.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {redemption.user.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {redemption.code.code}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {redemption.code.course?.title || "N/A"}
                          </TableCell>
                          <TableCell className="text-sm font-mono">
                            {redemption.ipAddress}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(
                              new Date(redemption.redeemedAt),
                              "MMM dd, yyyy HH:mm",
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
