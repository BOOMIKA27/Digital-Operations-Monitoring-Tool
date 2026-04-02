import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import apiRoutes from "./routes/index.js";
import { errorHandler } from "./middleware/error.js";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = process.env.PORT || 3000;

  // Middleware
  app.use(express.json());

  // API routes
  app.use("/api", apiRoutes);

  // Socket.io
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    let cpu = 45;
    let ram = 60;
    let network = 250;

    const interval = setInterval(() => {
      const spike = Math.random() > 0.9 ? 20 : 0;

      cpu = Math.max(0, Math.min(100, cpu + (Math.random() - 0.5) * 10 + spike));
      ram = Math.max(0, Math.min(100, ram + (Math.random() - 0.5) * 5 + spike / 4));
      network = Math.max(0, Math.min(1000, network + (Math.random() - 0.5) * 100 + spike * 10));

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

  // Error handler
  app.use(errorHandler);

  // 🔥 FRONTEND HANDLING
  if (process.env.NODE_ENV !== "production") {
    // Development (Vite)
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.join(process.cwd(), "frontend"),
    });

    app.use(vite.middlewares);

  } else {
  const distPath = path.join(process.cwd(), "frontend/dist");

  app.use(express.static(distPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
