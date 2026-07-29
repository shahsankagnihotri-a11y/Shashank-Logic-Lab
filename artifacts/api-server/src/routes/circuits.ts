import { Router, type IRouter } from "express";
import { eq, desc, count, sql } from "drizzle-orm";
import { db, circuitsTable } from "@workspace/db";
import {
  CreateCircuitBody,
  UpdateCircuitBody,
  GetCircuitParams,
  GetCircuitResponse,
  UpdateCircuitParams,
  UpdateCircuitResponse,
  DeleteCircuitParams,
  ListCircuitsResponse,
  ShareCircuitParams,
  GetSharedCircuitParams,
  GetSharedCircuitResponse,
  GetCircuitStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function generateShareCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 10; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// GET /circuits
router.get("/circuits", async (req, res): Promise<void> => {
  const circuits = await db
    .select()
    .from(circuitsTable)
    .orderBy(desc(circuitsTable.updatedAt));
  res.json(ListCircuitsResponse.parse(circuits));
});

// POST /circuits
router.post("/circuits", async (req, res): Promise<void> => {
  const parsed = CreateCircuitBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid circuit body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [circuit] = await db
    .insert(circuitsTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      data: parsed.data.data as Record<string, unknown>,
      tags: parsed.data.tags ?? null,
      isPublic: parsed.data.isPublic ?? false,
    })
    .returning();

  res.status(201).json(GetCircuitResponse.parse(circuit));
});

// GET /circuits/stats  (must be before /circuits/:id)
router.get("/circuits/stats", async (req, res): Promise<void> => {
  const [totalRow] = await db.select({ value: count() }).from(circuitsTable);
  const [publicRow] = await db
    .select({ value: count() })
    .from(circuitsTable)
    .where(eq(circuitsTable.isPublic, true));

  const recentlyEdited = await db
    .select()
    .from(circuitsTable)
    .orderBy(desc(circuitsTable.updatedAt))
    .limit(5);

  res.json(
    GetCircuitStatsResponse.parse({
      total: totalRow?.value ?? 0,
      publicCount: publicRow?.value ?? 0,
      recentlyEdited,
    }),
  );
});

// GET /circuits/shared/:shareCode  (must be before /circuits/:id)
router.get("/circuits/shared/:shareCode", async (req, res): Promise<void> => {
  const params = GetSharedCircuitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [circuit] = await db
    .select()
    .from(circuitsTable)
    .where(eq(circuitsTable.shareCode, params.data.shareCode));

  if (!circuit) {
    res.status(404).json({ error: "Shared circuit not found" });
    return;
  }

  res.json(GetSharedCircuitResponse.parse(circuit));
});

// GET /circuits/:id
router.get("/circuits/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid circuit id" });
    return;
  }

  const [circuit] = await db
    .select()
    .from(circuitsTable)
    .where(eq(circuitsTable.id, id));

  if (!circuit) {
    res.status(404).json({ error: "Circuit not found" });
    return;
  }

  res.json(GetCircuitResponse.parse(circuit));
});

// PATCH /circuits/:id
router.patch("/circuits/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid circuit id" });
    return;
  }

  const parsed = UpdateCircuitBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid update body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof circuitsTable.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.data !== undefined) updateData.data = parsed.data.data as Record<string, unknown>;
  if (parsed.data.tags !== undefined) updateData.tags = parsed.data.tags;
  if (parsed.data.isPublic !== undefined) updateData.isPublic = parsed.data.isPublic;

  const [circuit] = await db
    .update(circuitsTable)
    .set(updateData)
    .where(eq(circuitsTable.id, id))
    .returning();

  if (!circuit) {
    res.status(404).json({ error: "Circuit not found" });
    return;
  }

  res.json(UpdateCircuitResponse.parse(circuit));
});

// DELETE /circuits/:id
router.delete("/circuits/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid circuit id" });
    return;
  }

  const [circuit] = await db
    .delete(circuitsTable)
    .where(eq(circuitsTable.id, id))
    .returning();

  if (!circuit) {
    res.status(404).json({ error: "Circuit not found" });
    return;
  }

  res.sendStatus(204);
});

// POST /circuits/:id/share
router.post("/circuits/:id/share", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid circuit id" });
    return;
  }

  const shareCode = generateShareCode();

  const [circuit] = await db
    .update(circuitsTable)
    .set({ shareCode, isPublic: true, updatedAt: new Date() })
    .where(eq(circuitsTable.id, id))
    .returning();

  if (!circuit) {
    res.status(404).json({ error: "Circuit not found" });
    return;
  }

  const shareUrl = `${req.protocol}://${req.get("host")}/shared/${shareCode}`;
  res.json({ shareCode, shareUrl });
});

export default router;
