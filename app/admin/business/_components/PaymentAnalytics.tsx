"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, RefreshCw, CreditCard, Trophy } from "lucide-react";
import { format } from "date-fns";
import { Bar, BarChart, CartesianGrid, XAxis, Area, AreaChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface PaymentData {
  period: number;
  totalPayments: number;
  totalRevenue: number;
  averageOrderValue: number;
  recentPayments: Array<{
    id: string;
    amount: number;
    currency: string;
    createdAt: string;
    type?: 'enrollment' | 'redemption';
    User: {
      name: string;
      email: string;
    };
    Course: {
      title: string;
    };
    country?: string | null;
    city?: string | null;
    region?: string | null;
  }>;
  paymentsByDay: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
  topCourses: Array<{
    title: string;
    courseId: string;
    sales: number;
    revenue: number;
  }>;
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
  count: {
    label: "Payments",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function PaymentAnalytics() {
  const [analytics, setAnalytics] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/payment-analytics?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        console.error('Failed to fetch payment analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatChartData = () => {
    if (!analytics?.paymentsByDay) {
      return [];
    }

    // Create a map of existing data
    const dataMap = new Map(
      analytics.paymentsByDay.map((day: any) => [
        format(new Date(day.date), 'yyyy-MM-dd'),
        day
      ])
    );

    // Generate all dates in the period
    const periodDays = parseInt(period);
    const allDates = [];
    const today = new Date();
    
    for (let i = periodDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const existingData = dataMap.get(dateStr);
      
      allDates.push({
        date: format(date, 'MMM dd'),
        revenue: existingData ? Number(existingData.revenue) / 100 : 0,
        count: existingData ? Number(existingData.count) : 0,
      });
    }
    
    return allDates;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <RefreshCw className="w-4 h-4 animate-spin" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-6 bg-muted rounded w-1/2 mt-2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="text-center py-6">
          <p className="text-muted-foreground">Failed to load payment analytics</p>
          <Button onClick={fetchAnalytics} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const chartData = formatChartData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-4">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={fetchAnalytics} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
        <Card className="@container/card" data-slot="card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {formatCurrency(analytics.totalRevenue)}
              </CardTitle>
            </div>
            <DollarSign className="size-6 text-muted-foreground" />
          </CardHeader>
          <div className="px-6 pb-4">
            <p className="text-sm text-muted-foreground">
              Last {analytics.period} days
            </p>
          </div>
        </Card>

        <Card className="@container/card" data-slot="card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardDescription>Total Payments</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {analytics.totalPayments}
              </CardTitle>
            </div>
            <CreditCard className="size-6 text-muted-foreground" />
          </CardHeader>
          <div className="px-6 pb-4">
            <p className="text-sm text-muted-foreground">
              Successful payments
            </p>
          </div>
        </Card>

        <Card className="@container/card" data-slot="card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardDescription>Top Course Sales</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {analytics.topCourses[0]?.sales || 0}
              </CardTitle>
            </div>
            <Trophy className="size-6 text-muted-foreground" />
          </CardHeader>
          <div className="px-6 pb-4">
            <p className="text-sm text-muted-foreground truncate">
              {analytics.topCourses[0]?.title || "No sales yet"}
            </p>
          </div>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card className="@container/card">
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>
              Daily revenue for the last {analytics.period} days
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[300px] w-full"
            >
              <AreaChart
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={"preserveStartEnd"}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="w-[180px]"
                      labelFormatter={(value) => value}
                      formatter={(value, name) => {
                        if (name === 'revenue') {
                          return [Number(value).toFixed(2) + ' LYD', 'Revenue'];
                        }
                        return [value, 'Payments'];
                      }}
                    />
                  }
                />
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="revenue"
                  type="monotone"
                  fill="url(#fillRevenue)"
                  fillOpacity={0.4}
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {chartData.length > 0 && (
        <Card className="@container/card">
          <CardHeader>
            <CardTitle>Payment Volume</CardTitle>
            <CardDescription>
              Number of payments per day
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <BarChart
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={"preserveStartEnd"}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="w-[150px]"
                      labelFormatter={(value) => value}
                    />
                  }
                />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Top Selling Courses</CardTitle>
          <CardDescription>Best performing courses by sales</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.topCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No sales data available
                  </TableCell>
                </TableRow>
              ) : (
                analytics.topCourses.slice(0, 10).map((course, index) => (
                  <TableRow key={course.courseId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Badge variant={index < 3 ? "default" : "outline"} className="shrink-0">
                          #{index + 1}
                        </Badge>
                        <span className="font-medium">{course.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{course.sales}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(Number(course.revenue))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Latest transactions on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.recentPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No recent payments
                  </TableCell>
                </TableRow>
              ) : (
                analytics.recentPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.User.name}</div>
                        <div className="text-sm text-muted-foreground">{payment.User.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{payment.Course.title}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {payment.country ? (
                          <>
                            <div className="font-medium">{payment.country}</div>
                            {payment.city && (
                              <div className="text-xs text-muted-foreground">
                                {payment.city}{payment.region ? `, ${payment.region}` : ''}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(payment.amount, payment.currency)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
