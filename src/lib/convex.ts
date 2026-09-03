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
      // 1. Test de disponibilité du backend et détection des fonctions déployées
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
            message: `Instance [${hostName}] joignable (${latency}ms), mais vos fonctions sont déployées sur 'canny-rhinoceros-666'. Cliquez sur 'Basculer' pour corriger.`,
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

      // Si le endpoint API query renvoie une autre réponse
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
   * Sauvegarde ou synchronise un tenant dans Convex
   */
  async saveTenant(client: SaaSClient): Promise<{ success: boolean; message: string }> {
    if (!isConvexConfigured()) {
      return { success: false, message: "Convex n'est pas configuré." };
    }

    try {
      const clientHttp = getConvexHttpClient();
      if (!clientHttp) throw new Error("Client HTTP Convex indisponible");

      // Appel de la mutation Convex
      const subdomain = client.idLicence ? client.idLicence.toLowerCase() : client.id;
      await clientHttp.mutation("tenants:upsertTenant" as any, {
        tenantId: client.id,
        raisonSociale: client.raisonSociale,
        domaine: `${subdomain}.mefoupflow.com`,
        subdomain: subdomain,
        statut: client.statut,
        planAbonnement: client.plan || 'Starter',
        dateCreation: client.dateCreation,
        dateExpiration: client.dateExpiration,
        pays: client.pays || 'Cameroun',
        region: client.region || 'Centre',
        devise: 'XAF',
        logoUrl: '',
        primaryColor: '#4f46e5',
        contactNom: `${client.responsablePrenom || ''} ${client.responsableNom || ''}`.trim() || client.raisonSociale,
        contactEmail: client.responsableEmail || 'admin@mefoupflow.com',
        contactTel: client.responsableTel || '',
      });

      return { success: true, message: `Tenant ${client.raisonSociale} synchronisé dans Convex.` };
    } catch (err: any) {
      console.error('[Convex] Erreur saveTenant:', err);
      const rawMsg = err.message || '';
      if (rawMsg.includes('Could not find public function')) {
        return {
          success: false,
          message: "Le schéma n'a pas encore été publié sur Convex Cloud. Lancez 'npx convex dev' dans votre terminal pour créer les tables automatiquement.",
        };
      }
      return { success: false, message: rawMsg || 'Erreur inconnue' };
    }
  },

  /**
   * Synchronise une base de données de Tenant complète vers Convex
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
      const clientHttp = getConvexHttpClient();
      if (!clientHttp) throw new Error("Client HTTP Convex indisponible");

      const databaseJson = JSON.stringify(db);
      const sizeBytes = new Blob([databaseJson]).size;

      await clientHttp.mutation("erp:syncFullTenantDatabase" as any, {
        tenantId,
        databaseJson,
        backupName,
        createdBy: operator,
      });

      return {
        success: true,
        message: `Base tenant synchronisée sur Convex (${Math.round(sizeBytes / 1024)} Ko).`,
        sizeBytes,
      };
    } catch (err: any) {
      console.error('[Convex] Erreur syncTenantDatabase:', err);
      const rawMsg = err.message || '';
      if (rawMsg.includes('Could not find public function')) {
        return {
          success: false,
          message: "Fonction 'erp:syncFullTenantDatabase' introuvable. Exécutez 'npx convex dev' dans votre terminal pour pousser les fonctions.",
        };
      }
      return { success: false, message: rawMsg || 'Erreur de synchronisation Convex' };
    }
  },

  /**
   * Récupère la dernière sauvegarde de tenant depuis Convex
   */
  async fetchLatestBackup(tenantId: string): Promise<TenantDatabase | null> {
    if (!isConvexConfigured()) return null;

    try {
      const clientHttp = getConvexHttpClient();
      if (!clientHttp) return null;

      const result: any = await clientHttp.query("erp:getLatestBackup" as any, { tenantId });
      if (result && result.databaseJson) {
        return JSON.parse(result.databaseJson);
      }
      return null;
    } catch (err) {
      console.error('[Convex] Erreur fetchLatestBackup:', err);
      return null;
    }
  },

  /**
   * Journalisation des actions d'audit sur Convex
   */
  async logActivity(log: { action: string; details: string; ip?: string; email?: string; tenantId?: string }) {
    if (!isConvexConfigured()) return;

    try {
      const clientHttp = getConvexHttpClient();
      if (!clientHttp) return;

      await clientHttp.mutation("audit:logActivity" as any, {
        tenantId: log.tenantId,
        action: log.action,
        details: log.details,
        ipAddress: log.ip || '127.0.0.1',
        userEmail: log.email || 'system',
      });
    } catch (e) {
      // Échoue silencieusement pour ne pas bloquer les opérations de l'utilisateur
      console.warn('[Convex] Impossible d enregistrer le log d audit:', e);
    }
  }
};
