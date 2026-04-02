import { Router } from "express";
import * as systemController from "../controllers/systemController.js";

const router = Router();

router.get("/health", systemController.getHealth);

export default router;
