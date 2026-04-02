import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import apiRoutes from "./routes/index.js";
import { errorHandler } from "./middleware/error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API routes
  app.use("/api", apiRoutes);

  // Socket.io for real-time system updates (simulating node activity)
  io.on("connection", (socket) => {
    console.log("Client connected to monitoring stream:", socket.id);
    
    // Simulate real-time metrics updates
    let cpu = 45;
    let ram = 60;
    let network = 250;

    const interval = setInterval(() => {
      // Smooth random walk with occasional spikes
      const spike = Math.random() > 0.9 ? 20 : 0;
      cpu = Math.max(0, Math.min(100, cpu + (Math.random() - 0.5) * 10 + spike));
      ram = Math.max(0, Math.min(100, ram + (Math.random() - 0.5) * 5 + (spike / 4)));
      network = Math.max(0, Math.min(1000, network + (Math.random() - 0.5) * 100 + (spike * 10)));

      socket.emit("metrics_update", {
        cpu,
        ram,
        network,
        timestamp: new Date().toISOString()
      });
    }, 2000);

    socket.on("disconnect", () => {
      clearInterval(interval);
      console.log("Client disconnected");
    });
  });

  // Error Handler
  app.use(errorHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.join(process.cwd(), 'frontend'),
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
