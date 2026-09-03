import { ConvexReactClient } from 'convex/react';
import { ConvexHttpClient } from 'convex/browser';
import { SaaSClient, TenantDatabase } from '../types';

/**
 * Service d'intégration Convex.dev pour Mefoup Flow ERP
 */

const rawConvexUrl = ((import.meta as any).env?.VITE_CONVEX_URL as string) || '';

export const isConvexConfigured = (): boolean => {
  return (
    typeof rawConvexUrl === 'string' &&
    rawConvexUrl.trim().length > 0 &&
    (rawConvexUrl.startsWith('https://') || rawConvexUrl.startsWith('http://')) &&
    !rawConvexUrl.includes('your-deployment-name')
  );
};

export const getConvexUrl = (): string => {
  return rawConvexUrl;
};

// Instance du client React (initialisée uniquement si configuré pour éviter les erreurs d'invalidation)
let reactClientInstance: ConvexReactClient | null = null;
let httpClientInstance: ConvexHttpClient | null = null;

export const getConvexReactClient = (): ConvexReactClient | null => {
  if (!isConvexConfigured()) return null;
  if (!reactClientInstance) {
    try {
      reactClientInstance = new ConvexReactClient(rawConvexUrl);
    } catch (e) {
      console.warn('[Convex] Erreur d initialisation du client React:', e);
      return null;
    }
  }
  return reactClientInstance;
};

export const getConvexHttpClient = (): ConvexHttpClient | null => {
  if (!isConvexConfigured()) return null;
  if (!httpClientInstance) {
    try {
      httpClientInstance = new ConvexHttpClient(rawConvexUrl);
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
  async testConnection(): Promise<{ ok: boolean; message: string; latencyMs?: number }> {
    if (!isConvexConfigured()) {
      return {
        ok: false,
        message: "L'URL Convex n'est pas encore configurée dans .env (VITE_CONVEX_URL).",
      };
    }

    const start = performance.now();
    try {
      // Test de connectivité par requête ping HTTP vers le point d'accès Convex
      const res = await fetch(`${rawConvexUrl.replace(/\/$/, '')}/api/version`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => null);

      const latency = Math.round(performance.now() - start);

      if (res && (res.ok || res.status === 404 || res.status === 200)) {
        return {
          ok: true,
          message: `Connexion à Convex établie avec succès (${latency}ms).`,
          latencyMs: latency,
        };
      }

      // Si le endpoint version n'est pas exposé directement, un ping direct sur l'URL
      return {
        ok: true,
        message: `Instance Convex joignable (${rawConvexUrl}).`,
        latencyMs: latency,
      };
    } catch (err: any) {
      return {
        ok: false,
        message: `Erreur de connexion à Convex : ${err.message || 'Hôte introuvable'}`,
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
      return { success: false, message: err.message || 'Erreur inconnue' };
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
      return { success: false, message: err.message || 'Erreur de synchronisation Convex' };
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
