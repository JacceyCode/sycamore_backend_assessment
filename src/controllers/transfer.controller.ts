import { NextFunction, Request, Response } from "express";
import { LedgerAttributes, TransferRequest } from "../types/interface";
import { WalletService } from "../services/walletService";
import { TransactionStatus } from "../types/enum";

export const walletTransfer = async (
  req: Request<{}, {}, TransferRequest>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const walletService = new WalletService();
  let newTransaction: LedgerAttributes | null = null;

  try {
    const { fromAccount, toAccount, amount, comment } =
      req.body as TransferRequest;
    const idempotencyKey = req.headers["Idempotency-Key"] as string;

    // Check ledger for existing transaction with the same idempotency key
    const existingTransaction =
      await walletService.checkForDuplicateTransactionByIdempotencyKey(
        idempotencyKey,
      );

    if (existingTransaction) {
      // If transaction exists, return the existing transaction details
      res.status(201).json({
        status: existingTransaction.status,
        message: `Transfer ${existingTransaction.status.toLocaleLowerCase()}.`,
      });
      return;
    }

    // Verify wallets exist
    const [debitWallet, creditWallet] = await Promise.all([
      walletService.getWalletByName(fromAccount),
      walletService.getWalletByName(toAccount),
    ]);

    if (!debitWallet) {
      const error = new Error(`Source wallet '${fromAccount}' does not exist.`);
      error.name = "ValidationError";
      throw error;
    }
    if (!creditWallet) {
      const error = new Error(
        `Destination wallet '${toAccount}' does not exist.`,
      );
      error.name = "ValidationError";
      throw error;
    }

    //create ledger(transfer) entry here
    newTransaction = await walletService.createTransactionEntry({
      debitWalletId: debitWallet.id,
      creditWalletId: creditWallet.id,
      amount,
      idempotencyKey,
      ...(comment && { comment }),
    });

    // Perform transfer using database transaction
    await walletService.processFundsTransfer({
      debitWalletId: debitWallet.id,
      creditWalletId: creditWallet.id,
      amount,
      transactionId: newTransaction.id,
    });

    res.status(201).json({
      status: "success",
      message: `Transfer of amount ${amount} from ${fromAccount} to ${toAccount} initiated successfully.`,
    });
  } catch (error) {
    // Update ledger status to failed here
    if (newTransaction) {
      await walletService.updateTransactionStatus(
        newTransaction.id,
        TransactionStatus.FAILED,
      );
    }

    // if any error occurs, pass it to the error handling middleware
    next(error);
  }
};
