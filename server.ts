import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { z } from "zod";
import jobsRouter from "./server/routes/jobs";
import dashboardRouter from "./server/routes/dashboard";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  // Add required database/backend variables here as requested
  // DB_HOST: z.string().min(1),
  // DB_USER: z.string().min(1),
  // DB_PASSWORD: z.string().min(1),
});

// Validate env vars
const envParsed = envSchema.safeParse(process.env);
if (!envParsed.success) {
  console.error("❌ Invalid environment variables:", envParsed.error.format());
  process.exit(1);
}

// Ensure the validated env config is passed into app context if needed
export const env = envParsed.data;

async function startServer() {
  const app = express();
  const PORT = env.PORT;

  // Middleware
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/jobs", jobsRouter);
  app.use("/api/dashboard", dashboardRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
