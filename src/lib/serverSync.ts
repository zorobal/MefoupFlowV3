import { SaaSClient, TenantDatabase, SaaSLog } from '../types';

export interface ServerSyncState {
  saasClients: SaaSClient[];
  databases: Record<string, TenantDatabase>;
  saasLogs: SaaSLog[];
  saasPlanConfigs: Record<string, any>;
  lastUpdated?: string;
}

export interface ServerAuthResult {
  found: boolean;
  type?: 'provider' | 'tenant-user' | 'client-admin';
  user?: any;
  tenant?: SaaSClient;
  message?: string;
}

/**
 * Service de communication avec le serveur centralisé Mefoup-Flow (Express Backend).
 * Permet la synchronisation en temps réel entre plusieurs postes ou ordinateurs.
 */
export const ServerSyncService = {
  /**
   * Vérifie si le serveur central répond
   */
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) return false;
      const data = await res.json();
      return data.status === 'ok';
    } catch {
      return false;
    }
  },

  /**
   * Récupère l'état complet du serveur (clients, bases isolées, logs, plans)
   */
  async fetchServerState(): Promise<ServerSyncState | null> {
    try {
      const res = await fetch('/api/sync/state');
      if (!res.ok) return null;
      const json = await res.json();
      if (json.success && json.data) {
        return json.data as ServerSyncState;
      }
      return null;
    } catch (err) {
      console.warn('[SERVER-SYNC] Impossible de récupérer l\'état distant:', err);
      return null;
    }
  },

  /**
   * Sauvegarde un compte client sur le serveur central avec sa base initiale
   */
  async saveClient(client: SaaSClient, database?: TenantDatabase, log?: SaaSLog): Promise<boolean> {
    try {
      const res = await fetch('/api/sync/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client, database, log }),
      });
      const json = await res.json();
      return !!json.success;
    } catch (err) {
      console.warn('[SERVER-SYNC] Erreur sauvegarde client:', err);
      return false;
    }
  },

  /**
   * Supprime un client sur le serveur central
   */
  async deleteClient(clientId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/sync/client/${clientId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      return !!json.success;
    } catch (err) {
      console.warn('[SERVER-SYNC] Erreur suppression client distant:', err);
      return false;
    }
  },

  /**
   * Sauvegarde la partition de base de données d'un tenant sur le serveur
   */
  async saveTenantDatabase(tenantId: string, database: TenantDatabase): Promise<boolean> {
    try {
      const res = await fetch(`/api/sync/database/${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database }),
      });
      const json = await res.json();
      return !!json.success;
    } catch (err) {
      console.warn('[SERVER-SYNC] Erreur sauvegarde base tenant:', err);
      return false;
    }
  },

  /**
   * Pousse l'ensemble de l'état local vers le serveur
   */
  async pushFullState(state: Partial<ServerSyncState>): Promise<boolean> {
    try {
      const res = await fetch('/api/sync/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      const json = await res.json();
      return !!json.success;
    } catch (err) {
      console.warn('[SERVER-SYNC] Erreur push global:', err);
      return false;
    }
  },

  /**
   * Vérifie directement des identifiants auprès du serveur central
   * Permet à un ordinateur 2 de se connecter immédiatement après la création d'un client sur l'ordinateur 1
   */
  async verifyCredentials(email: string, password: string): Promise<ServerAuthResult> {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      return json as ServerAuthResult;
    } catch (err) {
      console.warn('[SERVER-SYNC] Erreur vérification credentials serveur:', err);
      return { found: false, message: 'Erreur réseau avec le serveur central.' };
    }
  },
};
