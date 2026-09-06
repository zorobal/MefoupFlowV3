import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "server-db.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface ServerStore {
  saasClients: any[];
  databases: Record<string, any>;
  saasLogs: any[];
  saasPlanConfigs: Record<string, any>;
  lastUpdated: string;
}

// Helper to read database
function readDb(): ServerStore {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("[SERVER] Error reading server-db.json:", err);
  }
  return {
    saasClients: [],
    databases: {},
    saasLogs: [],
    saasPlanConfigs: {},
    lastUpdated: new Date().toISOString(),
  };
}

// Helper to write database
function writeDb(data: Partial<ServerStore>): ServerStore {
  try {
    const current = readDb();
    const updated: ServerStore = {
      saasClients: data.saasClients !== undefined ? data.saasClients : current.saasClients,
      databases: data.databases !== undefined ? data.databases : current.databases,
      saasLogs: data.saasLogs !== undefined ? data.saasLogs : current.saasLogs,
      saasPlanConfigs: data.saasPlanConfigs !== undefined ? data.saasPlanConfigs : current.saasPlanConfigs,
      lastUpdated: new Date().toISOString(),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(updated, null, 2), "utf-8");
    return updated;
  } catch (err) {
    console.error("[SERVER] Error writing to server-db.json:", err);
    throw err;
  }
}

async function startServer() {
  const app = express();

  // Middleware for body parsing with large payload support (for full ERP database partitions)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // CORS headers if needed
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // 1. Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      storage: "server-fs",
      dataDir: DATA_DIR,
    });
  });

  // 2. Full State Synchronization (for initializing any new computer/browser)
  app.get("/api/sync/state", (_req, res) => {
    try {
      const db = readDb();
      res.json({
        success: true,
        data: db,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Save/Push complete state
  app.post("/api/sync/state", (req, res) => {
    try {
      const { saasClients, databases, saasLogs, saasPlanConfigs } = req.body;
      const current = readDb();

      // Merge clients (keep existing if not sent, or upsert)
      let mergedClients = current.saasClients;
      if (Array.isArray(saasClients)) {
        const clientMap = new Map();
        current.saasClients.forEach((c) => clientMap.set(c.id, c));
        saasClients.forEach((c) => clientMap.set(c.id, c));
        mergedClients = Array.from(clientMap.values());
      }

      // Merge databases
      const mergedDbs = { ...current.databases, ...(databases || {}) };

      // Merge logs
      let mergedLogs = current.saasLogs;
      if (Array.isArray(saasLogs)) {
        const logMap = new Map();
        current.saasLogs.forEach((l) => logMap.set(l.id, l));
        saasLogs.forEach((l) => logMap.set(l.id, l));
        mergedLogs = Array.from(logMap.values());
      }

      const mergedPlanConfigs = { ...current.saasPlanConfigs, ...(saasPlanConfigs || {}) };

      const saved = writeDb({
        saasClients: mergedClients,
        databases: mergedDbs,
        saasLogs: mergedLogs,
        saasPlanConfigs: mergedPlanConfigs,
      });

      res.json({ success: true, lastUpdated: saved.lastUpdated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Create or Update a single SaaS Client & its initial database partition
  app.post("/api/sync/client", (req, res) => {
    try {
      const { client, database, log } = req.body;
      if (!client || !client.id) {
        return res.status(400).json({ success: false, error: "Identifiant client requis." });
      }

      const current = readDb();
      const clientIndex = current.saasClients.findIndex((c) => c.id === client.id);
      const updatedClients = [...current.saasClients];
      if (clientIndex >= 0) {
        updatedClients[clientIndex] = { ...updatedClients[clientIndex], ...client };
      } else {
        updatedClients.push(client);
      }

      const updatedDatabases = { ...current.databases };
      if (database) {
        updatedDatabases[client.id] = database;
      }

      const updatedLogs = [...current.saasLogs];
      if (log) {
        updatedLogs.unshift(log);
      }

      const saved = writeDb({
        saasClients: updatedClients,
        databases: updatedDatabases,
        saasLogs: updatedLogs,
      });

      res.json({
        success: true,
        message: "Compte client synchronisé sur le serveur central.",
        client,
        lastUpdated: saved.lastUpdated,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Delete a SaaS Client
  app.delete("/api/sync/client/:id", (req, res) => {
    try {
      const clientId = req.params.id;
      const current = readDb();
      const updatedClients = current.saasClients.filter((c) => c.id !== clientId);
      const updatedDatabases = { ...current.databases };
      delete updatedDatabases[clientId];

      writeDb({
        saasClients: updatedClients,
        databases: updatedDatabases,
      });

      res.json({ success: true, message: "Client supprimé du serveur." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Update single Tenant Database partition
  app.post("/api/sync/database/:tenantId", (req, res) => {
    try {
      const tenantId = req.params.tenantId;
      const database = req.body.database;
      if (!tenantId || !database) {
        return res.status(400).json({ success: false, error: "TenantId et base de données requis." });
      }

      const current = readDb();
      const updatedDatabases = {
        ...current.databases,
        [tenantId]: database,
      };

      writeDb({ databases: updatedDatabases });
      res.json({ success: true, message: `Partition de données [${tenantId}] mise à jour.` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. Direct Centralized Auth Verification
  // Allows computer 2 to directly authenticate against the server's central database
  app.post("/api/auth/verify", (req, res) => {
    try {
      const { email, password } = req.body;
      const emailClean = (email || "").trim().toLowerCase();
      const passClean = (password || "").trim();

      if (!emailClean || !passClean) {
        return res.status(400).json({ found: false, message: "Identifiants incomplets." });
      }

      // Check Provider
      if (emailClean === "provider@mefoup.com" && passClean === "mefoup2026") {
        return res.json({
          found: true,
          type: "provider",
          user: {
            id: "usr-provider",
            nom: "Éditeur Mefoup",
            email: "provider@mefoup.com",
            roleId: "role-superadmin",
            statut: "Actif",
          },
        });
      }

      const db = readDb();

      // Check specific tenant users in each database
      for (const client of db.saasClients) {
        const tenantDb = db.databases[client.id];
        if (tenantDb && Array.isArray(tenantDb.utilisateurs)) {
          const userMatch = tenantDb.utilisateurs.find(
            (u: any) =>
              (u.email || "").toLowerCase() === emailClean &&
              u.password === passClean &&
              u.statut === "Actif"
          );
          if (userMatch) {
            return res.json({
              found: true,
              type: "tenant-user",
              user: userMatch,
              tenant: client,
            });
          }
        }
      }

      // Check client superadmin directly
      const matchedClient = db.saasClients.find(
        (c: any) =>
          (c.superAdminLogin || "").toLowerCase() === emailClean &&
          c.superAdminPassword === passClean
      );

      if (matchedClient) {
        return res.json({
          found: true,
          type: "client-admin",
          tenant: matchedClient,
          user: {
            id: "usr-admin-virtuel",
            nom: `${matchedClient.responsablePrenom} ${matchedClient.responsableNom}`,
            email: matchedClient.superAdminLogin || "",
            roleId: "role-superadmin",
            statut: "Actif",
            mustChangePassword: matchedClient.mustChangePassword,
          },
        });
      }

      res.json({ found: false, message: "Aucun compte correspondant trouvé sur le serveur." });
    } catch (err: any) {
      res.status(500).json({ found: false, error: err.message });
    }
  });

  // Vite middleware setup (development) vs Static files (production)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] MEFOUP-FLOW Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[SERVER] Startup fatal error:", err);
  process.exit(1);
});
