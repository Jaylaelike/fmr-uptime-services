import { Status } from "@prisma/client";

export interface Monitor {
  id: string;
  name: string;
  url: string;
  interval: number;
  timeout: number;
  isActive: boolean;
  lastCheck?: Date;
  status: Status;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  events: MonitorEvent[];
  webhook?: Webhook;
}

export interface MonitorEvent {
  id: string;
  status: Status;
  monitorId: string;
  createdAt: Date;
}

export interface Webhook {
  id: string;
  url: string;
  monitorId: string;
  message?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMonitorInput {
  name: string;
  url: string;
  interval?: number;
  timeout?: number;
  webhook?: {
    url: string;
    message?: Record<string, any>;
  };
}