import { z } from "zod";

const phonePattern = /^[\d\s()+-]+$/;

// --- Sub-schemas (match DB JSONB structure) ---

export const contactPersonalSchema = z.object({
  nickname: z.string().max(50).optional().or(z.literal("")),
  gender: z.enum(["Male", "Female", "Other", ""]).optional(),
  dob: z.string().optional().or(z.literal("")),
  alt_phone: z
    .string()
    .regex(phonePattern, "Invalid phone number format")
    .optional()
    .or(z.literal("")),
});

export const contactAddressSchema = z.object({
  street: z.string().max(255).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(100).optional().or(z.literal("")),
  zip: z.string().max(20).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
});

export const contactProfessionalSchema = z.object({
  role: z.string().max(100).optional().or(z.literal("")),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  linkedin: z.string().max(255).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

// --- Main schema ---

export const contactSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .regex(phonePattern, "Invalid phone number format"),
  company: z.string().max(255).optional().or(z.literal("")),
  is_favorite: z.boolean().optional(),
  personal: contactPersonalSchema.optional().default({}),
  address: contactAddressSchema.optional().default({}),
  professional: contactProfessionalSchema.optional().default({}),
});

// Schema for edit mode — all fields optional except id
export const contactUpdateSchema = contactSchema.partial().omit({});
