import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Schéma de données pour Mefoup Flow ERP sur Convex.dev
 * Gère le multi-tenant, les enregistrements métier et l'audit sans contrainte rigide SQL.
 */
export default defineSchema({
  // Table des Tenants SaaS (Entreprises agricoles clientes)
  saas_tenants: defineTable({
    tenantId: v.string(),
    raisonSociale: v.string(),
    domaine: v.string(),
    subdomain: v.string(),
    statut: v.string(), // 'Actif' | 'Essai' | 'Suspendu' | 'Expire'
    planAbonnement: v.string(), // 'Starter' | 'Professional' | 'Cooperative' | 'Enterprise'
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
  })
    .index("by_tenant_id", ["tenantId"])
    .index("by_subdomain", ["subdomain"]),

  // Table des Données ERP par Tenant (exploitations, parcelles, élevage, compta, stocks, etc.)
  erp_records: defineTable({
    tenantId: v.string(),
    collectionName: v.string(), // ex: 'exploitations', 'animaux', 'factures', 'stocks'
    recordId: v.string(),
    data: v.any(),
    updatedAt: v.string(),
  })
    .index("by_tenant_and_collection", ["tenantId", "collectionName"])
    .index("by_tenant_and_record", ["tenantId", "recordId"]),

  // Sauvegardes complètes (Snapshots de base de données tenant)
  tenant_backups: defineTable({
    tenantId: v.string(),
    backupName: v.string(),
    databaseJson: v.string(), // JSON sérialisé de la TenantDatabase
    createdAt: v.string(),
    createdBy: v.string(),
    sizeBytes: v.number(),
  }).index("by_tenant", ["tenantId"]),

  // Tickets de support SaaS
  saas_tickets: defineTable({
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
  }).index("by_tenant", ["tenantId"]),

  // Factures SaaS plateforme
  saas_invoices: defineTable({
    invoiceId: v.string(),
    clientName: v.string(),
    tenantId: v.optional(v.string()),
    plan: v.string(),
    amount: v.number(),
    date: v.string(),
    method: v.string(),
    status: v.string(),
  }),

  // Logs d'audit & sécurité
  saas_audit_logs: defineTable({
    tenantId: v.optional(v.string()),
    action: v.string(),
    details: v.string(),
    ipAddress: v.string(),
    userEmail: v.string(),
    timestamp: v.string(),
  }).index("by_tenant", ["tenantId"]),
});
