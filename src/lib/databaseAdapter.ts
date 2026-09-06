import { SaaSClient, TenantDatabase } from '../types';
import { isSupabaseConfigured, SupabaseSyncService } from './supabase';
import { isConvexConfigured, ConvexSyncService } from './convex';
import { ServerSyncService } from './serverSync';

/**
 * ARCHITECTURE EN COUCHE D'ABSTRACTION (DATABASE REPOSITORY / ADAPTER PATTERN)
 * 
 * Cette couche permet de changer de base de données (Convex, Supabase, PostgreSQL direct, 
 * SQLite local, Firebase, PocketBase) SANS CASSER ni modifier le code des composants React.
 * 
 * Tout module de l'ERP interagit uniquement avec cette interface unifiée.
 */

export type BackendProviderType = 'local' | 'supabase' | 'convex' | 'offline_sqlite';

export interface DatabaseSyncResult {
  success: boolean;
  message: string;
  provider: BackendProviderType;
  details?: any;
}

export interface DatabaseBackendAdapter {
  id: BackendProviderType;
  name: string;
  description: string;
  isConfigured: () => boolean;
  testConnection: () => Promise<{ ok: boolean; message: string; latencyMs?: number }>;
  syncTenantDatabase: (tenantId: string, db: TenantDatabase, operator?: string) => Promise<DatabaseSyncResult>;
  saveTenant: (tenant: SaaSClient) => Promise<{ success: boolean; message: string }>;
  logAudit: (log: { action: string; details: string; email?: string; tenantId?: string }) => Promise<void>;
}

// 1. Adaptateur LocalStorage / Hors-ligne (Fonctionne toujours, sans serveur)
export const LocalStorageAdapter: DatabaseBackendAdapter = {
  id: 'local',
  name: 'Stockage Local (Navigateur / Cache)',
  description: 'Persistance instantanée dans le navigateur (localStorage & exports JSON hors-ligne).',
  isConfigured: () => true,
  async testConnection() {
    return { ok: true, message: 'Stockage local opérationnel.', latencyMs: 0 };
  },
  async syncTenantDatabase(tenantId, db) {
    try {
      const allDbs = JSON.parse(localStorage.getItem('tenantDatabases') || '{}');
      allDbs[tenantId] = db;
      localStorage.setItem('tenantDatabases', JSON.stringify(allDbs));
      return {
        success: true,
        message: 'Données sauvegardées en cache local (hors-ligne).',
        provider: 'local',
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Erreur locale', provider: 'local' };
    }
  },
  async saveTenant(tenant) {
    try {
      const saved = JSON.parse(localStorage.getItem('saas_clients') || '[]');
      const idx = saved.findIndex((c: any) => c.id === tenant.id);
      if (idx >= 0) saved[idx] = tenant;
      else saved.push(tenant);
      localStorage.setItem('saas_clients', JSON.stringify(saved));
      return { success: true, message: 'Tenant enregistré localement.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Erreur locale' };
    }
  },
  async logAudit(log) {
    try {
      const logs = JSON.parse(localStorage.getItem('saas_audit_logs') || '[]');
      logs.unshift({
        id: `aud-${Date.now()}`,
        dateHeure: new Date().toISOString().replace('T', ' ').substring(0, 16),
        operateur: log.email || 'Admin',
        role: 'Utilisateur',
        action: log.action,
        description: log.details,
      });
      localStorage.setItem('saas_audit_logs', JSON.stringify(logs.slice(0, 200)));
    } catch {}
  },
};

// 2. Adaptateur Supabase (PostgreSQL relationnel cloud)
export const SupabaseAdapter: DatabaseBackendAdapter = {
  id: 'supabase',
  name: 'Supabase (PostgreSQL Cloud)',
  description: 'Base de données SQL relationnelle avec Row Level Security et syntaxe SQL.',
  isConfigured: isSupabaseConfigured,
  async testConnection() {
    return await SupabaseSyncService.testConnection();
  },
  async syncTenantDatabase(tenantId, db, operator) {
    try {
      const res = await SupabaseSyncService.syncFullTenantDatabase(tenantId, db, 'Sauvegarde Cloud Supabase', operator);
      return {
        success: res.success,
        message: res.message,
        provider: 'supabase',
        details: res,
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Erreur Supabase', provider: 'supabase' };
    }
  },
  async saveTenant(tenant) {
    return await SupabaseSyncService.upsertTenant(tenant);
  },
  async logAudit(log) {
    await SupabaseSyncService.logSaaSActivity({
      action: log.action,
      details: log.details,
      email: log.email,
      tenant_id: log.tenantId,
    });
  },
};

// 3. Adaptateur Convex.dev (TypeScript réactif temps réel cloud)
export const ConvexAdapter: DatabaseBackendAdapter = {
  id: 'convex',
  name: 'Convex.dev (TypeScript Réactif & Temps Réel)',
  description: 'Base de données cloud 100% typée TypeScript, réactive et sans contrainte SQL bloquante.',
  isConfigured: isConvexConfigured,
  async testConnection() {
    return await ConvexSyncService.testConnection();
  },
  async syncTenantDatabase(tenantId, db, operator) {
    try {
      const res = await ConvexSyncService.syncTenantDatabase(tenantId, db, 'Sauvegarde Cloud Convex', operator);
      return {
        success: res.success,
        message: res.message,
        provider: 'convex',
        details: res,
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'Erreur Convex', provider: 'convex' };
    }
  },
  async saveTenant(tenant) {
    return await ConvexSyncService.saveTenant(tenant);
  },
  async logAudit(log) {
    await ConvexSyncService.logActivity({
      action: log.action,
      details: log.details,
      email: log.email,
      tenantId: log.tenantId,
    });
  },
};

/**
 * GESTIONNAIRE CENTRALISÉ DE SYNCHRONISATION
 */
const BACKEND_STORAGE_KEY = 'mefoup_active_backend_provider';

export const getPreferredBackend = (): BackendProviderType => {
  const saved = localStorage.getItem(BACKEND_STORAGE_KEY) as BackendProviderType;
  if (saved && ['local', 'supabase', 'convex'].includes(saved)) {
    return saved;
  }
  // Auto-détection de la meilleure cible disponible
  if (isConvexConfigured()) return 'convex';
  if (isSupabaseConfigured()) return 'supabase';
  return 'local';
};

export const setPreferredBackend = (provider: BackendProviderType): void => {
  localStorage.setItem(BACKEND_STORAGE_KEY, provider);
};

export const getBackendAdapter = (provider?: BackendProviderType): DatabaseBackendAdapter => {
  const target = provider || getPreferredBackend();
  switch (target) {
    case 'convex':
      return ConvexAdapter;
    case 'supabase':
      return SupabaseAdapter;
    case 'local':
    default:
      return LocalStorageAdapter;
  }
};

/**
 * Service de persistance unifié
 * Appelé de façon transparente par l'application
 */
export const DataAdapterService = {
  async syncTenantDatabase(tenantId: string, db: TenantDatabase, operator?: string): Promise<DatabaseSyncResult> {
    // 1. Sauvegarde systématique dans le cache local (sécurité hors-ligne)
    await LocalStorageAdapter.syncTenantDatabase(tenantId, db, operator);

    // 2. Synchronisation automatique sur le serveur central multi-postes
    ServerSyncService.saveTenantDatabase(tenantId, db).catch(() => {});

    // 3. Synchronisation sur le backend distant externe actif (Supabase, Convex...)
    const activeProvider = getPreferredBackend();
    if (activeProvider !== 'local') {
      const remoteAdapter = getBackendAdapter(activeProvider);
      if (remoteAdapter.isConfigured()) {
        return await remoteAdapter.syncTenantDatabase(tenantId, db, operator);
      }
    }

    return {
      success: true,
      message: 'Données enregistrées en stockage central et local.',
      provider: 'local',
    };
  },

  async logAudit(action: string, details: string, email?: string, tenantId?: string) {
    // Log local
    LocalStorageAdapter.logAudit({ action, details, email, tenantId });

    // Log distant si configuré
    const activeProvider = getPreferredBackend();
    if (activeProvider !== 'local') {
      const adapter = getBackendAdapter(activeProvider);
      if (adapter.isConfigured()) {
        adapter.logAudit({ action, details, email, tenantId }).catch(() => {});
      }
    }
  },
};
