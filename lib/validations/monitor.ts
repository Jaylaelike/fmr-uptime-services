import { z } from "zod";

export const createMonitorSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  url: z.string()
    .url("Please enter a valid URL")
    .min(1, "URL is required"),
  interval: z.number()
    .int()
    .min(30, "Interval must be at least 30 seconds")
    .max(86400, "Interval must be less than 24 hours")
    .default(60),
  timeout: z.number()
    .int()
    .min(5, "Timeout must be at least 5 seconds")
    .max(30, "Timeout must be less than 30 seconds")
    .default(30),
  webhook: z.object({
    url: z.string().url("Please enter a valid webhook URL"),
    message: z.object({
      up: z.record(z.any()).optional(),
      down: z.record(z.any()).optional(),
      message: z.string().optional()
    }).optional(),
  }).optional(),
});