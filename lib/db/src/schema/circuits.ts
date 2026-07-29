import { pgTable, serial, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const circuitsTable = pgTable("circuits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  data: jsonb("data").notNull().default({}),
  shareCode: text("share_code").unique(),
  isPublic: boolean("is_public").notNull().default(false),
  tags: text("tags"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCircuitSchema = createInsertSchema(circuitsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCircuit = z.infer<typeof insertCircuitSchema>;
export type Circuit = typeof circuitsTable.$inferSelect;
