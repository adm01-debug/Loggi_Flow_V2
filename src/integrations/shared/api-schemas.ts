import { z } from 'zod';

/**
 * Shared schemas for external API integrations to ensure runtime type safety.
 * Part of Audit Dimension 18: Type Safety.
 */

export const LalamoveOrderSchema = z.object({
  id: z.string(),
  status: z.string(),
  price: z.object({
    amount: z.string(),
    currency: z.string()
  }).optional(),
  driverId: z.string().nullable().optional(),
});

export const RodonavesTrackingSchema = z.object({
  numero: z.string(),
  status: z.string(),
  data: z.string().optional(),
  descricao: z.string().optional(),
});

export const BitrixDealSchema = z.object({
  ID: z.string(),
  TITLE: z.string(),
  STAGE_ID: z.string(),
  OPPORTUNITY: z.string().optional(),
  CURRENCY_ID: z.string().optional(),
});

export type LalamoveOrder = z.infer<typeof LalamoveOrderSchema>;
export type RodonavesTracking = z.infer<typeof RodonavesTrackingSchema>;
export type BitrixDeal = z.infer<typeof BitrixDealSchema>;
