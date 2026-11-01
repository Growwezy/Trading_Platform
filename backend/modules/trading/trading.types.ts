import { z } from "zod";

export const placeOrderSchema = z.object({
  symbolCode: z.string().min(1),
  side: z.enum(["buy", "sell"]),
  lots: z.number().positive(),
  leverage: z.number().positive(),
  stopLoss: z.number().positive().optional(),
  takeProfit: z.number().positive().optional(),
});

export const modifySlTpSchema = z.object({
  stopLoss: z.number().positive().nullable().optional(),
  takeProfit: z.number().positive().nullable().optional(),
});
