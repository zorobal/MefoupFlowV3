import { queryGeneric, mutationGeneric } from "convex/server";
import { v } from "convex/values";

/**
 * Fonctions de persistance et synchronisation ERP pour chaque Tenant
 */

// Liste les enregistrements d'une collection pour un tenant (ex: 'animaux', 'factures')
export const getCollectionRecords = queryGeneric({
  args: {
    tenantId: v.string(),
    collectionName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("erp_records")
      .withIndex("by_tenant_and_collection", (q) =>
        q.eq("tenantId", args.tenantId)
      )
      .filter((q) => q.eq(q.field("collectionName"), args.collectionName))
      .collect();
  },
});

// Enregistre ou met à jour un document ERP individuel
export const saveRecord = mutationGeneric({
  args: {
    tenantId: v.string(),
    collectionName: v.string(),
    recordId: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("erp_records")
      .withIndex("by_tenant_and_record", (q) =>
        q.eq("tenantId", args.tenantId)
      )
      .filter((q) => q.eq(q.field("recordId"), args.recordId))
      .first();

    const updatedAt = new Date().toISOString();

    if (existing) {
      await ctx.db.patch(existing._id, {
        collectionName: args.collectionName,
        data: args.data,
        updatedAt,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("erp_records", {
        tenantId: args.tenantId,
        collectionName: args.collectionName,
        recordId: args.recordId,
        data: args.data,
        updatedAt,
      });
    }
  },
});

// Synchronise un snapshot complet d'une base de données de Tenant
export const syncFullTenantDatabase = mutationGeneric({
  args: {
    tenantId: v.string(),
    databaseJson: v.string(),
    backupName: v.string(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const sizeBytes = new Blob([args.databaseJson]).size;
    const createdAt = new Date().toISOString();

    // Insérer un snapshot de sauvegarde
    const backupId = await ctx.db.insert("tenant_backups", {
      tenantId: args.tenantId,
      backupName: args.backupName,
      databaseJson: args.databaseJson,
      createdAt,
      createdBy: args.createdBy,
      sizeBytes,
    });

    return { success: true, backupId, sizeBytes };
  },
});

// Récupère la dernière sauvegarde complète d'un tenant
export const getLatestBackup = queryGeneric({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tenant_backups")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .order("desc")
      .first();
  },
});
