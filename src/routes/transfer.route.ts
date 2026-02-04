import { Router } from "express";
import {
  verifyIdempotencyKey,
  verifyTransferData,
} from "../middlewares/verificationMiddleware";
import { walletTransfer } from "../controllers/transfer.controller";

const router: Router = Router();

// POST /transfer
router.post("/", verifyIdempotencyKey, verifyTransferData, walletTransfer);

export default router;
