/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { spawn } from "child_process";
import http from "http";

dotenv.config();

const app = express();
const PORT = 3000;

// Spawn Python FastAPI Backend on Port 8000
console.log("🚀 Spawning Python FastAPI Backend on port 8000...");
const pythonProcess = spawn("python3", ["-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"], {
  stdio: "inherit",
  shell: true
});

pythonProcess.on("error", (err) => {
  console.warn("⚠️ Warning: Failed to spawn Python process. Fallback mocks will be active in frontend.", err);
});

// A robust, streaming, zero-dependency proxy middleware for /api/* requests
app.use("/api", (req, res) => {
  const targetUrl = `http://127.0.0.1:8000/api${req.url}`;
  
  const options = {
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(targetUrl, options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err: any) => {
    console.error("⚠️ FastAPI Proxy connection error:", err.message);
    res.status(502).json({
      error: "FastAPI gateway is initializing.",
      details: "Please wait 5-10 seconds for the Python backend container service to boot.",
    });
  });

  // Stream request body (e.g. multipart upload data) straight to the backend
  req.pipe(proxyReq, { end: true });
});

// Serve static assets in production, and handle Vite middleware in development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
      console.log("Production assets served from /dist");
    } else {
      console.warn("WARNING: /dist directory not found. Please run 'npm run build' before launching the server in production.");
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express Full-Stack Server listening on http://localhost:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Vite/Express initialization failed:", err);
});
