import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const patientCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  dob: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  bloodType: z.string().optional().or(z.literal('')),
  allergies: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
});

export const appointmentCreateSchema = z.object({
  providerId: z.string().min(1),
  patientId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD.'),
  startMin: z.number().int().min(0).max(1439),
  reason: z.string().optional(),
});

export const appointmentStatusSchema = z.object({
  status: z.enum(['BOOKED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
});

export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>;
