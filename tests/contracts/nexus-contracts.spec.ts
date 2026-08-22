import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Define the contract for standard carrier webhooks
const CarrierWebhookSchema = z.object({
  tracking_code: z.string().min(5),
  status: z.enum(['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'RETURNED', 'OCCURRENCE']),
  timestamp: z.string().datetime(),
  carrier_id: z.string().uuid(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Define the contract for freight calculation responses
const FreightCalculationSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().nonnegative(),
  currency: z.string().length(3),
  delivery_range: z.object({
    min: z.number().int().nonnegative(),
    max: z.number().int().nonnegative(),
  }),
  company: z.object({
    id: z.number().int(),
    name: z.string(),
    picture: z.string().url(),
  }),
});

describe('Nexus Contract Verification Suite', () => {
  describe('Carrier Webhook Contract', () => {
    it('should validate a perfect payload', () => {
      const validPayload = {
        tracking_code: 'BR123456789',
        status: 'IN_TRANSIT',
        timestamp: new Date().toISOString(),
        carrier_id: crypto.randomUUID(),
        metadata: {
          location: 'São Paulo',
          hub: 'HUB-SOUTH-01'
        }
      };
      
      const result = CarrierWebhookSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should reject payload with invalid status', () => {
      const invalidPayload = {
        tracking_code: 'BR123456789',
        status: 'FLYING_TO_MARS', // Invalid status
        timestamp: new Date().toISOString(),
        carrier_id: crypto.randomUUID(),
      };
      
      const result = CarrierWebhookSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('status');
      }
    });

    it('should reject payload with malformed UUID', () => {
      const invalidPayload = {
        tracking_code: 'BR123456789',
        status: 'DELIVERED',
        timestamp: new Date().toISOString(),
        carrier_id: 'not-a-uuid',
      };
      
      const result = CarrierWebhookSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('Freight Calculation Response Contract', () => {
    it('should validate a standard calculation response', () => {
      const validResponse = {
        id: '123',
        name: 'Sedex Premium',
        price: 45.50,
        currency: 'BRL',
        delivery_range: { min: 1, max: 3 },
        company: {
          id: 1,
          name: 'Correios',
          picture: 'https://example.com/logo.png'
        }
      };
      
      const result = FreightCalculationSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should reject negative prices', () => {
      const invalidResponse = {
        id: '123',
        name: 'Freebie',
        price: -10, // Invalid
        currency: 'BRL',
        delivery_range: { min: 1, max: 3 },
        company: { id: 1, name: 'Test', picture: 'https://test.com/img.png' }
      };
      
      const result = FreightCalculationSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });
});
