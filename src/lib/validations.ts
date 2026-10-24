import { z } from "zod";
import {
  ticketPriorities,
  ticketStatuses,
  userRoles,
  availabilityStatuses,
} from "@/db/schema";

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
});

export const registerClientSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  password: z.string().min(10).max(200),
  phone: z.string().max(30).optional(),
  province: z.string().max(60).optional(),
  acceptTerms: z.literal(true),
  acceptPrivacy: z.literal(true),
});

export const createTicketSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  category: z.string().min(2).max(100),
  priority: z.enum(ticketPriorities).default("medium"),
  intake: z.unknown().optional(),
});

export const chatFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  sessionId: z.string().optional(),
});

export const assignTicketSchema = z.object({
  assistantId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(ticketStatuses),
});

export const updateTicketPrioritySchema = z.object({
  priority: z.enum(ticketPriorities),
});

export const chatMessageSchema = z.object({
  messageBody: z.string().min(1).max(4000).trim(),
});

export const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  password: z.string().min(10).max(200),
  role: z.enum(["client", "assistant"]),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  accountStatus: z.enum(["active", "deactivated", "pending"]).optional(),
  availabilityStatus: z.enum(availabilityStatuses).optional(),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(10).max(200),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  phone: z.string().max(30).optional(),
  province: z.string().max(60).optional(),
  preferredLanguage: z.string().max(20).optional(),
});

export { userRoles };
