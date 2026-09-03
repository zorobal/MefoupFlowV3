import { queryGeneric, mutationGeneric } from "convex/server";
import { v } from "convex/values";

/**
 * Fonctions de gestion des Tenants SaaS (Convex Backend)
 */

// Liste tous les tenants
export const listTenants = queryGeneric({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("saas_tenants").collect();
  },
});

// Récupère un tenant par son ID
export const getTenant = queryGeneric({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("saas_tenants")
      .withIndex("by_tenant_id", (q) => q.eq("tenantId", args.tenantId))
      .first();
  },
});

// Enregistre ou met à jour un tenant
export const upsertTenant = mutationGeneric({
  args: {
    tenantId: v.string(),
    raisonSociale: v.string(),
    domaine: v.string(),
    subdomain: v.string(),
    statut: v.string(),
    planAbonnement: v.string(),
    dateCreation: v.string(),
    dateExpiration: v.string(),
    pays: v.string(),
    region: v.string(),
    devise: v.string(),
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    contactNom: v.string(),
    contactEmail: v.string(),
    contactTel: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("saas_tenants")
      .withIndex("by_tenant_id", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("saas_tenants", args);
    }
  },
});

// Supprime un tenant (Convex gère cela simplement sans contraintes bloquantes SQL)
export const deleteTenant = mutationGeneric({
  args: { tenantId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("saas_tenants")
      .withIndex("by_tenant_id", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // Supprime également les enregistrements ERP associés
    const records = await ctx.db
      .query("erp_records")
      .withIndex("by_tenant_and_collection", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    for (const r of records) {
      await ctx.db.delete(r._id);
    }

    return { success: true };
  },
});
