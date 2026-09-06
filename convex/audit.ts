import { queryGeneric, mutationGeneric } from "convex/server";
import { v } from "convex/values";

/**
 * Fonctions de journalisation d'audit et tickets de support SaaS
 */

// Liste les logs d'audit (optionnellement filtrés par tenant)
export const listAuditLogs = queryGeneric({
  args: { tenantId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.tenantId) {
      return await ctx.db
        .query("saas_audit_logs")
        .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
        .order("desc")
        .take(100);
    }
    return await ctx.db.query("saas_audit_logs").order("desc").take(100);
  },
});

// Enregistre une entrée d'audit
export const logActivity = mutationGeneric({
  args: {
    tenantId: v.optional(v.string()),
    action: v.string(),
    details: v.string(),
    ipAddress: v.string(),
    userEmail: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("saas_audit_logs", {
      tenantId: args.tenantId,
      action: args.action,
      details: args.details,
      ipAddress: args.ipAddress,
      userEmail: args.userEmail,
      timestamp: new Date().toISOString(),
    });
  },
});

// Liste les tickets de support
export const listTickets = queryGeneric({
  args: { tenantId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.tenantId) {
      return await ctx.db
        .query("saas_tickets")
        .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
        .collect();
    }
    return await ctx.db.query("saas_tickets").collect();
  },
});

// Crée ou met à jour un ticket
export const upsertTicket = mutationGeneric({
  args: {
    ticketId: v.string(),
    tenantId: v.string(),
    clientName: v.string(),
    category: v.string(),
    title: v.string(),
    description: v.string(),
    priority: v.string(),
    status: v.string(),
    date: v.string(),
    chat: v.array(
      v.object({
        sender: v.string(),
        msg: v.string(),
        timestamp: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("saas_tickets")
      .filter((q) => q.eq(q.field("ticketId"), args.ticketId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("saas_tickets", args);
    }
  },
});

// Liste les factures d'abonnements SaaS de la plateforme
export const listInvoices = queryGeneric({
  args: { tenantId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.tenantId) {
      return await ctx.db
        .query("saas_invoices")
        .filter((q) => q.eq(q.field("tenantId"), args.tenantId))
        .collect();
    }
    return await ctx.db.query("saas_invoices").collect();
  },
});

// Crée ou met à jour une facture SaaS
export const upsertInvoice = mutationGeneric({
  args: {
    invoiceId: v.string(),
    clientName: v.string(),
    tenantId: v.optional(v.string()),
    plan: v.string(),
    amount: v.number(),
    date: v.string(),
    method: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("saas_invoices")
      .filter((q) => q.eq(q.field("invoiceId"), args.invoiceId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("saas_invoices", args);
    }
  },
});
