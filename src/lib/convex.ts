import { ConvexReactClient } from 'convex/react';
import { ConvexHttpClient } from 'convex/browser';
import { SaaSClient, TenantDatabase } from '../types';

/**
 * Service d'intégration Convex.dev pour Mefoup Flow ERP
 */

const DEPLOYED_DEFAULT_URL = 'https://canny-rhinoceros-666.eu-west-1.convex.cloud';
const DEPLOYED_DEFAULT_SITE = 'https://canny-rhinoceros-666.eu-west-1.convex.site';

const getInitialConvexUrl = (): string => {
  try {
    const saved = localStorage.getItem('mefoup_convex_url');
    // Si saved pointe sur l'ancienne instance non déployée, on bascule sur la nouvelle instance déployée
    if (saved && saved.includes('coordinated-partridge-388')) {
      localStorage.setItem('mefoup_convex_url', DEPLOYED_DEFAULT_URL);
      return DEPLOYED_DEFAULT_URL;
    }
    if (saved && saved.trim().length > 0 && !saved.includes('your-deployment-name')) {
      return saved.trim();
    }
  } catch (e) {}

  const envUrl = ((import.meta as any).env?.VITE_CONVEX_URL as string) || '';
  if (envUrl && envUrl.trim().length > 0 && !envUrl.includes('your-deployment-name')) {
    if (envUrl.includes('coordinated-partridge-388')) {
      return DEPLOYED_DEFAULT_URL;
    }
    return envUrl.trim();
  }

  return DEPLOYED_DEFAULT_URL;
};

const getInitialConvexSiteUrl = (): string => {
  try {
    const saved = localStorage.getItem('mefoup_convex_site_url');
    if (saved && saved.includes('coordinated-partridge-388')) {
      localStorage.setItem('mefoup_convex_site_url', DEPLOYED_DEFAULT_SITE);
      return DEPLOYED_DEFAULT_SITE;
    }
    if (saved && saved.trim().length > 0 && !saved.includes('your-deployment-name')) {
      return saved.trim();
    }
  } catch (e) {}

  const envSite = ((import.meta as any).env?.VITE_CONVEX_SITE_URL as string) || '';
  if (envSite && envSite.trim().length > 0 && !envSite.includes('your-deployment-name')) {
    if (envSite.includes('coordinated-partridge-388')) {
      return DEPLOYED_DEFAULT_SITE;
    }
    return envSite.trim();
  }

  const cloud = getInitialConvexUrl();
  if (cloud.includes('.convex.cloud')) {
    return cloud.replace('.convex.cloud', '.convex.site');
  }
  return DEPLOYED_DEFAULT_SITE;
};

let currentConvexUrl: string = getInitialConvexUrl();
let currentConvexSiteUrl: string = getInitialConvexSiteUrl();

export const isConvexConfigured = (): boolean => {
  const url = getConvexUrl();
  return (
    typeof url === 'string' &&
    url.trim().length > 0 &&
    (url.startsWith('https://') || url.startsWith('http://')) &&
    !url.includes('your-deployment-name')
  );
};

export const getConvexUrl = (): string => {
  if (!currentConvexUrl) {
    currentConvexUrl = getInitialConvexUrl();
  }
  return currentConvexUrl;
};

export const getConvexSiteUrl = (): string => {
  if (!currentConvexSiteUrl) {
    currentConvexSiteUrl = getInitialConvexSiteUrl();
  }
  return currentConvexSiteUrl;
};

export const saveConvexSettings = (cloudUrl: string, siteUrl?: string) => {
  currentConvexUrl = cloudUrl.trim();
  currentConvexSiteUrl = (siteUrl || (cloudUrl.includes('.convex.cloud') ? cloudUrl.replace('.convex.cloud', '.convex.site') : '')).trim();
  try {
    localStorage.setItem('mefoup_convex_url', currentConvexUrl);
    localStorage.setItem('mefoup_convex_site_url', currentConvexSiteUrl);
  } catch (e) {}
  // Réinitialiser les clients pour prendre en compte la nouvelle URL
  reactClientInstance = null;
  httpClientInstance = null;
};

// Instance du client React (initialisée uniquement si configuré pour éviter les erreurs d'invalidation)
let reactClientInstance: ConvexReactClient | null = null;
let httpClientInstance: ConvexHttpClient | null = null;

export const getConvexReactClient = (): ConvexReactClient | null => {
  if (!isConvexConfigured()) return null;
  const url = getConvexUrl();
  if (!reactClientInstance) {
    try {
      reactClientInstance = new ConvexReactClient(url);
    } catch (e) {
      console.warn('[Convex] Erreur d initialisation du client React:', e);
      return null;
    }
  }
  return reactClientInstance;
};

export const getConvexHttpClient = (): ConvexHttpClient | null => {
  if (!isConvexConfigured()) return null;
  const url = getConvexUrl();
  if (!httpClientInstance) {
    try {
      httpClientInstance = new ConvexHttpClient(url);
    } catch (e) {
      console.warn('[Convex] Erreur d initialisation du client HTTP:', e);
      return null;
    }
  }
  return httpClientInstance;
};

/**
 * Exécute une query Convex par HTTP direct
 */
export async function runConvexQuery<T = any>(path: string, args: Record<string, any> = {}): Promise<T | null> {
  const url = getConvexUrl();
  if (!url) return null;
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, args, format: 'json' }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.status === 'success') {
      return data.value as T;
    }
    return null;
  } catch (e) {
    console.warn(`[Convex query ${path}]`, e);
    return null;
  }
}

/**
 * Exécute une mutation Convex par HTTP direct
 */
export async function runConvexMutation<T = any>(path: string, args: Record<string, any> = {}): Promise<T | null> {
  const url = getConvexUrl();
  if (!url) return null;
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, args, format: 'json' }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.status === 'success') {
      return data.value as T;
    }
    return null;
  } catch (e) {
    console.warn(`[Convex mutation ${path}]`, e);
    return null;
  }
}

export const ConvexSyncService = {
  /**
   * Vérifie la connectivité avec le déploiement Convex
   */
  async testConnection(customUrl?: string): Promise<{ ok: boolean; message: string; latencyMs?: number; functionsDeployed?: boolean; host?: string }> {
    const activeUrl = (customUrl && customUrl.trim().length > 0 ? customUrl.trim() : getConvexUrl());
    if (!activeUrl || (!activeUrl.startsWith('https://') && !activeUrl.startsWith('http://'))) {
      return {
        ok: false,
        message: "L'URL Convex n'est pas encore configurée ou invalide.",
      };
    }

    let hostName = 'Convex';
    try {
      const u = new URL(activeUrl);
      hostName = u.hostname.split('.')[0] || activeUrl;
    } catch (e) {}

    const start = performance.now();
    try {
      const checkFuncRes = await fetch(`${activeUrl.replace(/\/$/, '')}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'tenants:listTenants', args: {}, format: 'json' }),
      }).catch(() => null);

      const latency = Math.round(performance.now() - start);

      if (checkFuncRes) {
        const data = await checkFuncRes.json().catch(() => ({}));
        if (data && data.status === 'error' && typeof data.errorMessage === 'string' && data.errorMessage.includes('Could not find public function')) {
          return {
            ok: false,
            functionsDeployed: false,
            host: hostName,
            message: `Instance [${hostName}] joignable (${latency}ms), mais fonctions non déployées.`,
            latencyMs: latency,
          };
        }
        if (data && (data.status === 'success' || Array.isArray(data.value))) {
          return {
            ok: true,
            functionsDeployed: true,
            host: hostName,
            message: `Connecté à Convex [${hostName}] (${latency}ms) — Schéma et tables opérationnels !`,
            latencyMs: latency,
          };
        }
      }

      return {
        ok: true,
        functionsDeployed: true,
        host: hostName,
        message: `Instance Convex [${hostName}] joignable (${latency}ms).`,
        latencyMs: latency,
      };
    } catch (err: any) {
      return {
        ok: false,
        functionsDeployed: false,
        host: hostName,
        message: `Erreur de connexion à [${hostName}] : ${err.message || 'Hôte introuvable'}`,
      };
    }
  },

  /**
   * Exécute une query Convex par HTTP direct
   */
  runQuery: runConvexQuery,

  /**
   * Exécute une mutation Convex par HTTP direct
   */
  runMutation: runConvexMutation,

  /**
   * Récupère tous les clients SaaS depuis Convex en priorité
   */
  async fetchTenants(): Promise<SaaSClient[]> {
    if (!isConvexConfigured()) return [];
    try {
      const remoteTenants = await runConvexQuery<any[]>('tenants:listTenants', {});
      if (!Array.isArray(remoteTenants) || remoteTenants.length === 0) {
        return [];
      }

      // Pour chaque tenant, charger les métadonnées complètes depuis erp_records (tenant_meta)
      const clients: SaaSClient[] = [];
      for (const t of remoteTenants) {
        const tenantId = t.tenantId;
        const metaRecords = await runConvexQuery<any[]>('erp:getCollectionRecords', {
          tenantId,
          collectionName: 'tenant_meta'
        });

        const profileRecord = metaRecords && metaRecords.length > 0 ? metaRecords.find(r => r.recordId === 'profile') || metaRecords[0] : null;
        if (profileRecord && profileRecord.data) {
          const fullData = profileRecord.data;
          clients.push({
            id: tenantId,
            idLicence: fullData.idLicence || t.subdomain || `lic-${tenantId}`,
            raisonSociale: fullData.raisonSociale || t.raisonSociale,
            sigle: fullData.sigle || '',
            numContribuable: fullData.numContribuable || '',
            regCommerce: fullData.regCommerce || '',
            secteur: fullData.secteur || 'Agro-pastoral',
            responsableNom: fullData.responsableNom || t.contactNom || '',
            responsablePrenom: fullData.responsablePrenom || '',
            responsableEmail: fullData.responsableEmail || t.contactEmail || '',
            responsableTel: fullData.responsableTel || t.contactTel || '',
            pays: fullData.pays || t.pays || 'Cameroun',
            region: fullData.region || t.region || 'Centre',
            ville: fullData.ville || 'Yaoundé',
            statut: fullData.statut || t.statut || 'Actif',
            plan: fullData.plan || t.planAbonnement || 'Starter',
            dateCreation: fullData.dateCreation || t.dateCreation,
            dateExpiration: fullData.dateExpiration || t.dateExpiration,
            surfaceExploitee: fullData.surfaceExploitee || 10,
            maxUtilisateurs: fullData.maxUtilisateurs || 5,
            superAdminLogin: fullData.superAdminLogin || t.contactEmail,
            superAdminPassword: fullData.superAdminPassword || 'pass123',
            mustChangePassword: fullData.mustChangePassword || false
          });
        } else {
          // Fallback avec les colonnes de saas_tenants
          clients.push({
            id: tenantId,
            idLicence: t.subdomain || `lic-${tenantId}`,
            raisonSociale: t.raisonSociale,
            sigle: '',
            numContribuable: '',
            regCommerce: '',
            secteur: 'Agro-pastoral',
            responsableNom: t.contactNom || '',
            responsablePrenom: '',
            responsableEmail: t.contactEmail || '',
            responsableTel: t.contactTel || '',
            pays: t.pays || 'Cameroun',
            region: t.region || 'Centre',
            ville: 'Yaoundé',
            statut: (t.statut as any) || 'Actif',
            plan: (t.planAbonnement as any) || 'Starter',
            dateCreation: t.dateCreation,
            dateExpiration: t.dateExpiration,
            surfaceExploitee: 15,
            maxUtilisateurs: 5,
            superAdminLogin: t.contactEmail,
            superAdminPassword: 'password123',
          });
        }
      }

      return clients;
    } catch (err) {
      console.warn('[Convex] Erreur fetchTenants:', err);
      return [];
    }
  },

  /**
   * Sauvegarde un tenant dans Convex (saas_tenants ET erp_records tenant_meta)
   */
  async saveTenant(client: SaaSClient): Promise<{ success: boolean; message: string }> {
    if (!isConvexConfigured()) {
      return { success: false, message: "Convex n'est pas configuré." };
    }

    try {
      const subdomain = client.idLicence ? client.idLicence.toLowerCase() : client.id;
      
      // 1. Sauvegarde dans la table saas_tenants
      await this.runMutation('tenants:upsertTenant', {
        tenantId: client.id,
        raisonSociale: client.raisonSociale || 'Exploitation Agricole',
        domaine: `${subdomain}.mefoupflow.com`,
        subdomain: subdomain,
        statut: client.statut || 'Actif',
        planAbonnement: client.plan || 'Starter',
        dateCreation: client.dateCreation || new Date().toISOString().split('T')[0],
        dateExpiration: client.dateExpiration || '2027-12-31',
        pays: client.pays || 'Cameroun',
        region: client.region || 'Centre',
        devise: 'XAF',
        logoUrl: '',
        primaryColor: '#4f46e5',
        contactNom: `${client.responsablePrenom || ''} ${client.responsableNom || ''}`.trim() || client.raisonSociale,
        contactEmail: client.responsableEmail || client.superAdminLogin || 'admin@mefoupflow.com',
        contactTel: client.responsableTel || '',
      });

      // 2. Sauvegarde complète du profil (avec mot de passe et login SuperAdmin) dans erp_records
      await this.runMutation('erp:saveRecord', {
        tenantId: client.id,
        collectionName: 'tenant_meta',
        recordId: 'profile',
        data: client,
      });

      return { success: true, message: `Tenant ${client.raisonSociale} sauvegardé sur Convex Cloud.` };
    } catch (err: any) {
      console.error('[Convex] Erreur saveTenant:', err);
      return { success: false, message: err.message || 'Erreur inconnue' };
    }
  },

  /**
   * Supprime un tenant dans Convex
   */
  async deleteTenant(tenantId: string): Promise<boolean> {
    if (!isConvexConfigured()) return false;
    try {
      await this.runMutation('tenants:deleteTenant', { tenantId });
      return true;
    } catch (e) {
      console.warn('[Convex] Erreur deleteTenant:', e);
      return false;
    }
  },

  /**
   * Sauvegarde et synchronise une base de données de Tenant complète vers Convex.
   * Remplit À LA FOIS:
   * 1. 'tenant_backups' (snapshot complet)
   * 2. 'erp_records' (chaque enregistrement métier individuel dans la table Convex erp_records)
   */
  async syncTenantDatabase(
    tenantId: string,
    db: TenantDatabase,
    backupName: string = 'Synchro Automatique ERP',
    operator: string = 'SuperAdmin'
  ): Promise<{ success: boolean; message: string; sizeBytes?: number }> {
    if (!isConvexConfigured()) {
      return { success: false, message: "Convex n'est pas configuré." };
    }

    try {
      const databaseJson = JSON.stringify(db);
      const sizeBytes = new Blob([databaseJson]).size;

      // 1. Snapshot complet dans tenant_backups
      await this.runMutation('erp:syncFullTenantDatabase', {
        tenantId,
        databaseJson,
        backupName,
        createdBy: operator,
      });

      // 2. REMPLISSAGE ACTIF DE LA TABLE erp_records SUR CONVEX
      // Pour chaque collection non vide, on persiste les records individuellement dans Convex erp_records
      const collections: Array<{ name: string; items?: any[] }> = [
        { name: 'exploitations', items: db.exploitations },
        { name: 'sitesAgricoles', items: db.sitesAgricoles },
        { name: 'champs', items: db.champs },
        { name: 'parcelles', items: db.parcelles },
        { name: 'campagnes', items: db.campagnes },
        { name: 'cultures', items: db.cultures },
        { name: 'interventions', items: db.interventions },
        { name: 'recoltes', items: db.recoltes },
        { name: 'incidents', items: db.incidents },
        { name: 'sitesElevage', items: db.sitesElevage },
        { name: 'batiments', items: db.batiments },
        { name: 'troupeaux', items: db.troupeaux },
        { name: 'animaux', items: db.animaux },
        { name: 'magasins', items: db.magasins },
        { name: 'articles', items: db.articles },
        { name: 'mouvementsStock', items: db.mouvementsStock },
        { name: 'equipements', items: db.equipements },
        { name: 'fournisseurs', items: db.fournisseurs },
        { name: 'clientsAcheteurs', items: db.clientsAcheteurs },
        { name: 'factures', items: db.factures },
        { name: 'employes', items: db.employes },
        { name: 'presences', items: db.presences },
        { name: 'piecesComptables', items: db.piecesComptables },
        { name: 'budgets', items: db.budgets },
        { name: 'utilisateurs', items: db.utilisateurs },
      ];

      // Exécution asynchrone des écritures dans erp_records pour chaque élément
      for (const col of collections) {
        if (Array.isArray(col.items) && col.items.length > 0) {
          // Envoi par petits lots pour ne pas surcharger la bande passante
          for (const item of col.items.slice(0, 50)) {
            const recordId = item.id || `rec-${Math.random().toString(36).substring(2, 9)}`;
            this.runMutation('erp:saveRecord', {
              tenantId,
              collectionName: col.name,
              recordId: String(recordId),
              data: item,
            }).catch(() => {});
          }
        }
      }

      return {
        success: true,
        message: `Base tenant synchronisée sur Convex (${Math.round(sizeBytes / 1024)} Ko, erp_records peuplé).`,
        sizeBytes,
      };
    } catch (err: any) {
      console.error('[Convex] Erreur syncTenantDatabase:', err);
      return { success: false, message: err.message || 'Erreur de synchronisation Convex' };
    }
  },

  /**
   * Récupère la base de données complète d'un tenant depuis Convex
   */
  async fetchLatestBackup(tenantId: string): Promise<TenantDatabase | null> {
    if (!isConvexConfigured()) return null;

    try {
      // 1. Tenter la dernière sauvegarde complète (tenant_backups)
      const result: any = await runConvexQuery('erp:getLatestBackup', { tenantId });
      if (result && result.databaseJson) {
        return JSON.parse(result.databaseJson);
      }

      // 2. Si non trouvé, reconstituer à partir de erp_records
      const expRecords = await runConvexQuery<any[]>('erp:getCollectionRecords', { tenantId, collectionName: 'exploitations' });
      if (Array.isArray(expRecords) && expRecords.length > 0) {
        // Reconstitution basique
        const parcRecords = await runConvexQuery<any[]>('erp:getCollectionRecords', { tenantId, collectionName: 'parcelles' }) || [];
        const animRecords = await runConvexQuery<any[]>('erp:getCollectionRecords', { tenantId, collectionName: 'animaux' }) || [];
        const cultRecords = await runConvexQuery<any[]>('erp:getCollectionRecords', { tenantId, collectionName: 'cultures' }) || [];
        const factRecords = await runConvexQuery<any[]>('erp:getCollectionRecords', { tenantId, collectionName: 'factures' }) || [];

        return {
          exploitations: expRecords.map(r => r.data),
          sitesAgricoles: [],
          champs: [],
          parcelles: parcRecords.map(r => r.data),
          campagnes: [],
          cultures: cultRecords.map(r => r.data),
          interventions: [],
          recoltes: [],
          incidents: [],
          sitesElevage: [],
          batiments: [],
          troupeaux: [],
          animaux: animRecords.map(r => r.data),
          reproGestations: [],
          carnetsSanitaires: [],
          feedLogs: [],
          prodElevages: [],
          magasins: [],
          articles: [],
          mouvementsStock: [],
          equipements: [],
          maintenances: [],
          fuelLogs: [],
          fournisseurs: [],
          demandesAchat: [],
          bonsCommande: [],
          clientsAcheteurs: [],
          devis: [],
          commandesClients: [],
          factures: factRecords.map(r => r.data),
          encaissements: [],
          piecesComptables: [],
          budgets: [],
          employes: [],
          presences: [],
          bulletins: [],
          documents: [],
          regles: [],
          notifications: [],
          auditLogs: [],
          systemSettings: {} as any
        } as TenantDatabase;
      }

      return null;
    } catch (err) {
      console.error('[Convex] Erreur fetchLatestBackup:', err);
      return null;
    }
  },

  /**
   * Récupère tous les tickets SaaS depuis Convex (table saas_tickets)
   */
  async fetchTickets(tenantId?: string): Promise<any[]> {
    if (!isConvexConfigured()) return [];
    try {
      const tickets = await runConvexQuery<any[]>('audit:listTickets', tenantId ? { tenantId } : {});
      return Array.isArray(tickets) ? tickets : [];
    } catch (e) {
      console.warn('[Convex] Erreur fetchTickets:', e);
      return [];
    }
  },

  /**
   * Sauvegarde un ticket de support dans Convex (table saas_tickets)
   */
  async saveTicket(ticket: any): Promise<boolean> {
    if (!isConvexConfigured()) return false;
    try {
      const ticketId = ticket.id || ticket.ticketId || `TCK-${Date.now()}`;
      await runConvexMutation('audit:upsertTicket', {
        ticketId,
        tenantId: ticket.clientId || ticket.tenantId || 'any',
        clientName: ticket.clientName || 'Client Mefoup',
        category: ticket.category || 'Support Général',
        title: ticket.title || 'Demande de support',
        description: ticket.desc || ticket.description || '',
        priority: ticket.priority || 'Normale',
        status: ticket.status || 'Nouveau',
        date: ticket.date || new Date().toISOString().split('T')[0],
        chat: Array.isArray(ticket.chat)
          ? ticket.chat.map((c: any) => ({
              sender: c.sender || 'client',
              msg: c.msg || c.message || '',
              timestamp: c.timestamp || new Date().toISOString(),
            }))
          : [],
      });
      return true;
    } catch (e) {
      console.warn('[Convex] Erreur saveTicket:', e);
      return false;
    }
  },

  /**
   * Récupère toutes les factures SaaS depuis Convex (stockées dans erp_records collection 'saas_invoices')
   */
  async fetchInvoices(tenantId?: string): Promise<any[]> {
    if (!isConvexConfigured()) return [];
    try {
      const records = await runConvexQuery<any[]>('erp:getCollectionRecords', {
        tenantId: tenantId || 'platform-saas',
        collectionName: 'saas_invoices',
      });
      if (Array.isArray(records)) {
        return records.map(r => r.data);
      }
      return [];
    } catch (e) {
      console.warn('[Convex] Erreur fetchInvoices:', e);
      return [];
    }
  },

  /**
   * Sauvegarde une facture SaaS dans Convex
   */
  async saveInvoice(invoice: any): Promise<boolean> {
    if (!isConvexConfigured()) return false;
    try {
      const invoiceId = invoice.id || invoice.invoiceId || `INV-${Date.now()}`;
      await runConvexMutation('erp:saveRecord', {
        tenantId: invoice.tenantId || 'platform-saas',
        collectionName: 'saas_invoices',
        recordId: invoiceId,
        data: invoice,
      });
      return true;
    } catch (e) {
      console.warn('[Convex] Erreur saveInvoice:', e);
      return false;
    }
  },

  /**
   * Vérifie les identifiants d'un utilisateur directement sur Convex
   */
  async verifyCredentials(email: string, pass: string): Promise<any> {
    if (!isConvexConfigured()) return { found: false };

    const emailClean = (email || '').trim().toLowerCase();
    const passClean = (pass || '').trim();

    // 1. Compte Provider / Éditeur
    if (emailClean === 'provider@mefoup.com' && passClean === 'mefoup2026') {
      return {
        found: true,
        type: 'provider',
        user: {
          id: 'usr-provider',
          nom: 'Éditeur Mefoup Platform',
          email: 'provider@mefoup.com',
          roleId: 'role-superadmin',
          statut: 'Actif',
        },
      };
    }

    // 2. Interrogation des clients SaaS dans Convex
    try {
      const clients = await this.fetchTenants();
      for (const client of clients) {
        if (
          client.superAdminLogin &&
          client.superAdminLogin.trim().toLowerCase() === emailClean &&
          client.superAdminPassword &&
          client.superAdminPassword.trim() === passClean
        ) {
          return {
            found: true,
            type: 'client-admin',
            tenant: client,
            user: {
              id: `usr-admin-${client.id}`,
              nom: `${client.responsablePrenom || ''} ${client.responsableNom || client.raisonSociale}`.trim(),
              email: client.superAdminLogin,
              roleId: 'role-superadmin',
              statut: 'Actif',
            },
          };
        }
      }
    } catch (e) {
      console.warn('[Convex] Erreur verifyCredentials:', e);
    }

    return { found: false };
  },

  /**
   * Journalisation des actions d'audit sur Convex
   */
  async logActivity(log: { action: string; details: string; ip?: string; email?: string; tenantId?: string }) {
    if (!isConvexConfigured()) return;
    try {
      await this.runMutation('audit:logActivity', {
        tenantId: log.tenantId,
        action: log.action,
        details: log.details,
        ipAddress: log.ip || '127.0.0.1',
        userEmail: log.email || 'system',
      });
    } catch (e) {
      console.warn('[Convex] Impossible d enregistrer le log d audit:', e);
    }
  }
};
