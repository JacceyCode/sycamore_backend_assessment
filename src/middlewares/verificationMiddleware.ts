import { NextFunction, Request, Response } from "express";
import { TransferRequest } from "../types/interface";

export function verifyIdempotencyKey(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const idempotencyKey = req.headers["Idempotency-Key"];

  // Validate presence and type of Idempotency-Key header
  if (!idempotencyKey) {
    const error = new Error("Idempotency-Key header is required.");
    error.name = "ValidationError";

    return next(error);
  }

  if (typeof idempotencyKey !== "string") {
    const error = new Error("Idempotency-Key must be a string.");
    error.name = "ValidationError";
    return next(error);
  }

  // Verify format (simple UUID v4 regex for example)
  const uuidV4Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidV4Regex.test(idempotencyKey)) {
    const error = new Error("Idempotency-Key must be a valid UUID v4.");
    error.name = "ValidationError";
    return next(error);
  }

  next();
}

export function verifyTransferData(
  req: Request<{}, {}, TransferRequest>,
  _res: Response,
  next: NextFunction,
) {
  const { fromAccount, toAccount, amount } = req.body;

  if (!fromAccount || !toAccount || !amount || amount < 1) {
    const error = new Error(
      "Missing required transfer data: 'fromAccount', 'toAccount', and 'amount' (Minimum 1).",
    );
    error.name = "ValidationError";

    return next(error);
  }

  next();
}
