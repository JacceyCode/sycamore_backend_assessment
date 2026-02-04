import { Transaction } from "sequelize";
import db from "../models";
import { TransactionStatus } from "../types/enum";
import {
  ITransferTransaction,
  LedgerAttributes,
  LedgerCreationAttributes,
  WalletAttributes,
} from "../types/interface";

export class WalletService {
  public async getWalletByName(
    walletName: string,
  ): Promise<WalletAttributes | null> {
    return await db.Wallets.findOne({ where: { name: walletName } });
  }

  public async processFundsTransfer({
    debitWalletId,
    creditWalletId,
    amount,
    transactionId,
  }: ITransferTransaction): Promise<boolean> {
    // Start transaction to ensure atomicity of the transfer operation
    await db.sequelize!.transaction(async (t: Transaction) => {
      // Retrieve wallets with row-level locks to prevent race conditions
      const [debitWallet, creditWallet] = await Promise.all([
        db.Wallets.findByPk(debitWalletId, {
          lock: t.LOCK.UPDATE, // Lock the row for update to prevent race conditions
          transaction: t, // Ensure this query is part of the transaction
        }),

        db.Wallets.findByPk(creditWalletId, {
          lock: t.LOCK.UPDATE, // Lock the row for update to prevent race conditions
          transaction: t, // Ensure this query is part of the transaction
        }),
      ]);

      // Verify sender has sufficient funds
      if (debitWallet!.balance < amount) {
        const error = new Error("Insufficient funds");
        error.name = "InsufficientFundsError";
        throw error;
      }

      // Debit wallet
      await debitWallet.decrement("balance", { by: amount, transaction: t }); // Ensure atomic decrement

      // Credit wallet
      await creditWallet.increment("balance", { by: amount, transaction: t }); // Ensure atomic increment

      // Update ledger status to success here
      await this.updateTransactionStatus(
        transactionId,
        TransactionStatus.SUCCESSFUL,
      );
    });

    return true;
  }

  public async createTransactionEntry({
    debitWalletId,
    creditWalletId,
    amount,
    idempotencyKey,
    comment,
  }: LedgerCreationAttributes): Promise<LedgerAttributes> {
    const transaction = await db.Ledgers.create({
      debitWalletId,
      creditWalletId,
      amount,
      status: TransactionStatus.PENDING,
      idempotencyKey,
      comment,
    });

    return transaction;
  }

  public async updateTransactionStatus(
    ledgerId: string,
    status: TransactionStatus,
  ): Promise<LedgerAttributes> {
    const updatedLedger = await db.Ledgers.update(
      { status },
      { where: { id: ledgerId }, returning: true, plain: true },
    );

    return updatedLedger[1];
  }

  public async checkForDuplicateTransactionByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<LedgerAttributes | null> {
    return await db.Ledgers.findOne({ where: { idempotencyKey } });
  }
}
