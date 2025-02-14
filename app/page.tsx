"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, Plus, Globe, Clock, Wifi, WifiOff, Trash2, Edit, History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Monitor } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useMonitorWebSocket } from '@/hooks/useMonitorWebSocket';

export default function Home() {
  const { data: session } = useSession();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEventLogOpen, setIsEventLogOpen] = useState(false);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useMonitorWebSocket((updatedMonitor) => {
    setMonitors((prevMonitors) =>
      prevMonitors.map((monitor) =>
        monitor.id === updatedMonitor.id
          ? { ...monitor, ...updatedMonitor }
          : monitor
      )
    );
  });

  useEffect(() => {
    if (session) {
      fetchMonitors();
      // Start polling for updates
      const interval = setInterval(fetchMonitors, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchMonitors = async () => {
    try {
      const response = await fetch("/api/monitors");
      const data = await response.json();
      setMonitors(data);
    } catch (error) {
      console.error("Failed to fetch monitors:", error);
      toast.error("Failed to fetch monitors");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const response = await fetch("/api/monitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          interval: parseInt(data.interval || "60"),
          timeout: parseInt(data.timeout || "30"),
          webhook: data.webhook?.url ? {
            url: data.webhook.url,
            message: {
              up: JSON.parse(data.webhook.message?.up || '{"message": "Online"}'),
              down: JSON.parse(data.webhook.message?.down || '{"message": "Offline"}')
            }
          } : undefined
        }),
      });

      if (response.ok) {
        toast.success("Monitor created successfully");
        reset();
        setIsDialogOpen(false);
        fetchMonitors();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create monitor");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const onEdit = async (data: any) => {
    if (!selectedMonitor) return;

    try {
      const response = await fetch(`/api/monitors/${selectedMonitor.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          interval: parseInt(data.interval || "60"),
          timeout: parseInt(data.timeout || "30"),
          webhook: data.webhook?.url ? {
            url: data.webhook.url,
            message: {
              up: JSON.parse(data.webhook.message?.up || '{"message": "Online"}'),
              down: JSON.parse(data.webhook.message?.down || '{"message": "Offline"}')
            }
          } : undefined
        }),
      });

      if (response.ok) {
        toast.success("Monitor updated successfully");
        setIsEditDialogOpen(false);
        fetchMonitors();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update monitor");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const onDelete = async () => {
    if (!selectedMonitor) return;

    try {
      const response = await fetch(`/api/monitors/${selectedMonitor.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Monitor deleted successfully");
        setIsDeleteDialogOpen(false);
        fetchMonitors();
      } else {
        toast.error("Failed to delete monitor");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleEditClick = (monitor: Monitor) => {
    setSelectedMonitor(monitor);
    setValue("name", monitor.name);
    setValue("url", monitor.url);
    setValue("interval", monitor.interval);
    setValue("timeout", monitor.timeout);
    if (monitor.webhook) {
      setValue("webhook.url", monitor.webhook.url);
      const message = monitor.webhook.message as any;
      setValue("webhook.message.up", JSON.stringify(message.up || { message: "Online" }));
      setValue("webhook.message.down", JSON.stringify(message.down || { message: "Offline" }));
    }
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (monitor: Monitor) => {
    setSelectedMonitor(monitor);
    setIsDeleteDialogOpen(true);
  };

  const handleEventLogClick = (monitor: Monitor) => {
    setSelectedMonitor(monitor);
    setIsEventLogOpen(true);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Website Monitoring Made Simple
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Monitor your websites' uptime, get instant notifications, and never miss a downtime again.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="gap-2">
                  Get Started
                  <Globe className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Real-time Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Monitor your websites 24/7 with customizable check intervals
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    Instant Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Get notified immediately when your websites go down
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-purple-500" />
                    Webhook Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Connect with your favorite tools through webhooks
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Monitoring Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Monitor and manage your website uptime
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Monitor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Monitor</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    required
                    placeholder="My Website"
                  />
                </div>
                <div>
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    {...register("url")}
                    required
                    type="url"
                    placeholder="https://example.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="interval">Check Interval (seconds)</Label>
                    <Input
                      id="interval"
                      {...register("interval")}
                      type="number"
                      defaultValue={60}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeout">Timeout (seconds)</Label>
                    <Input
                      id="timeout"
                      {...register("timeout")}
                      type="number"
                      defaultValue={30}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="webhook">Webhook Configuration (optional)</Label>
                  <div className="space-y-4 mt-2">
                    <div>
                      <Label htmlFor="webhook-url">Webhook URL</Label>
                      <Input 
                        id="webhook-url" 
                        {...register("webhook.url")} 
                        type="url"
                        placeholder="https://your-webhook-url.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="webhook-down">DOWN Event Message (JSON)</Label>
                      <Input
                        id="webhook-down"
                        {...register("webhook.message.down")}
                        placeholder='{"message": "Offline"}'
                      />
                    </div>
                    <div>
                      <Label htmlFor="webhook-up">UP Event Message (JSON)</Label>
                      <Input
                        id="webhook-up"
                        {...register("webhook.message.up")}
                        placeholder='{"message": "Online"}'
                      />
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full">Create Monitor</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] bg-gray-100 dark:bg-gray-800 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : monitors.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <Activity className="h-12 w-12 text-gray-400" />
              <h2 className="text-2xl font-semibold">No monitors yet</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Add your first monitor to start tracking website uptime
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {monitors.map((monitor) => (
              <Card key={monitor.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{monitor.name}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEventLogClick(monitor)}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(monitor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(monitor)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                      {monitor.status === "UP" ? (
                        <Wifi className="h-5 w-5 text-green-500" />
                      ) : (
                        <WifiOff className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </CardTitle>
                  <p className="text-sm text-gray-500 truncate">{monitor.url}</p>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={monitor.events.map((event) => ({
                          time: new Date(event.createdAt).toLocaleTimeString(),
                          status: event.status === "UP" ? 1 : 0,
                        }))}
                        margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 12 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis domain={[0, 1]} hide />
                        <Tooltip
                          contentStyle={{
                            background: "rgba(255, 255, 255, 0.9)",
                            border: "none",
                            borderRadius: "4px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          }}
                          formatter={(value: number) => [value === 1 ? "Up" : "Down"]}
                        />
                        <Line
                          type="stepAfter"
                          dataKey="status"
                          stroke="#8884d8"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last checked</span>
                      <span className="font-medium">
                        {monitor.lastCheck
                          ? new Date(monitor.lastCheck).toLocaleString()
                          : "Never"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Check interval</span>
                      <span className="font-medium">{monitor.interval}s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status</span>
                      <span
                        className={`font-medium ${
                          monitor.status === "UP"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {monitor.status}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Monitor Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Monitor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onEdit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...register("name")}
                  required
                  placeholder="My Website"
                />
              </div>
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  {...register("url")}
                  required
                  type="url"
                  placeholder="https://example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="interval">Check Interval (seconds)</Label>
                  <Input
                    id="interval"
                    {...register("interval")}
                    type="number"
                    defaultValue={60}
                  />
                </div>
                <div>
                  <Label htmlFor="timeout">Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    {...register("timeout")}
                    type="number"
                    defaultValue={30}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="webhook">Webhook Configuration (optional)</Label>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input 
                      id="webhook-url" 
                      {...register("webhook.url")} 
                      type="url"
                      placeholder="https://your-webhook-url.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhook-down">DOWN Event Message (JSON)</Label>
                    <Input
                      id="webhook-down"
                      {...register("webhook.message.down")}
                      placeholder='{"message": "Offline"}'
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhook-up">UP Event Message (JSON)</Label>
                    <Input
                      id="webhook-up"
                      {...register("webhook.message.up")}
                      placeholder='{"message": "Online"}'
                    />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full">Update Monitor</Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the monitor
                and all its associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-red-500 hover:bg-red-600">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Event Log Sheet */}
        <Sheet open={isEventLogOpen} onOpenChange={setIsEventLogOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Event Log</SheetTitle>
              <SheetDescription>
                Recent events for {selectedMonitor?.name}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              {selectedMonitor?.events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between py-2 border-b"
                >
                  <div className="flex items-center gap-2">
                    {event.status === "UP" ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-500" />
                    )}
                    <span className={event.status === "UP" ? "text-green-500" : "text-red-500"}>
                      {event.status}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}