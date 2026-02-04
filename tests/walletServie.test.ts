import { WalletService } from "../src/services/walletService";
import db from "../src/models";
import { Currency, TransactionStatus } from "../src/types/enum";

jest.mock("../src/models");

describe("WalletService", () => {
  let walletService: WalletService;
  let mockTransaction: any;

  beforeEach(() => {
    walletService = new WalletService();
    mockTransaction = {
      LOCK: {
        UPDATE: "UPDATE",
      },
    };
    jest.clearAllMocks();
  });

  describe("getWalletByName method", () => {
    test("should return wallet when found by name", async () => {
      const mockWallet = {
        id: "wallet-1",
        name: "TestWallet",
        balance: 1000,
        currency: Currency.USD,
      };

      (db.Wallets.findOne as jest.Mock).mockResolvedValue(mockWallet);

      const result = await walletService.getWalletByName("TestWallet");

      expect(result).toEqual(mockWallet);
      expect(db.Wallets.findOne).toHaveBeenCalledWith({
        where: { name: "TestWallet" },
      });
    });

    test("should return null when wallet not found", async () => {
      (db.Wallets.findOne as jest.Mock).mockResolvedValue(null);

      const result = await walletService.getWalletByName("NonExistentWallet");

      expect(result).toBeNull();
    });
  });

  describe("processFundsTransfer method", () => {
    const transferData = {
      debitWalletId: "wallet-1",
      creditWalletId: "wallet-2",
      amount: 500,
      transactionId: "txn-1",
    };

    test("should successfully transfer funds between wallets", async () => {
      const debitWallet = {
        id: "wallet-1",
        balance: 1000,
        currency: Currency.USD,
        decrement: jest.fn().mockResolvedValue(true),
      };

      const creditWallet = {
        id: "wallet-2",
        balance: 500,
        currency: Currency.USD,
        increment: jest.fn().mockResolvedValue(true),
      };

      (db.sequelize!.transaction as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(mockTransaction);
        },
      );

      (db.Wallets.findByPk as jest.Mock)
        .mockResolvedValueOnce(debitWallet)
        .mockResolvedValueOnce(creditWallet);

      walletService.updateTransactionStatus = jest
        .fn()
        .mockResolvedValue({ status: TransactionStatus.SUCCESSFUL });

      const result = await walletService.processFundsTransfer(transferData);

      expect(result).toBe(true);
      expect(debitWallet.decrement).toHaveBeenCalledWith("balance", {
        by: 500,
        transaction: mockTransaction,
      });
      expect(creditWallet.increment).toHaveBeenCalledWith("balance", {
        by: 500,
        transaction: mockTransaction,
      });
      expect(walletService.updateTransactionStatus).toHaveBeenCalledWith(
        "txn-1",
        TransactionStatus.SUCCESSFUL,
      );
    });

    test("should throw InsufficientFundsError when debit wallet has insufficient balance", async () => {
      const debitWallet = {
        id: "wallet-1",
        balance: 100, // Less than transfer amount
      };

      const creditWallet = {
        id: "wallet-2",
        balance: 500,
      };

      (db.sequelize!.transaction as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(mockTransaction);
        },
      );

      (db.Wallets.findByPk as jest.Mock)
        .mockResolvedValueOnce(debitWallet)
        .mockResolvedValueOnce(creditWallet);

      await expect(
        walletService.processFundsTransfer(transferData),
      ).rejects.toMatchObject({
        name: "InsufficientFundsError",
      });
    });

    test("should use row-level locks to prevent race conditions", async () => {
      const debitWallet = {
        id: "wallet-1",
        balance: 1000,
        decrement: jest.fn().mockResolvedValue(true),
      };

      const creditWallet = {
        id: "wallet-2",
        balance: 500,
        increment: jest.fn().mockResolvedValue(true),
      };

      (db.sequelize!.transaction as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(mockTransaction);
        },
      );

      (db.Wallets.findByPk as jest.Mock)
        .mockResolvedValueOnce(debitWallet)
        .mockResolvedValueOnce(creditWallet);

      walletService.updateTransactionStatus = jest
        .fn()
        .mockResolvedValue({ status: TransactionStatus.SUCCESSFUL });

      await walletService.processFundsTransfer(transferData);

      expect(db.Wallets.findByPk).toHaveBeenCalledWith("wallet-1", {
        lock: "UPDATE",
        transaction: mockTransaction,
      });

      expect(db.Wallets.findByPk).toHaveBeenCalledWith("wallet-2", {
        lock: "UPDATE",
        transaction: mockTransaction,
      });
    });

    test("should handle transaction rollback on error", async () => {
      const debitWallet = {
        id: "wallet-1",
        balance: 1000,
        decrement: jest.fn().mockRejectedValue(new Error("DB Error")),
      };

      const creditWallet = {
        id: "wallet-2",
        balance: 500,
      };

      (db.sequelize!.transaction as jest.Mock).mockImplementation(
        async (callback) => {
          return await callback(mockTransaction);
        },
      );

      (db.Wallets.findByPk as jest.Mock)
        .mockResolvedValueOnce(debitWallet)
        .mockResolvedValueOnce(creditWallet);

      await expect(
        walletService.processFundsTransfer(transferData),
      ).rejects.toThrow("DB Error");
    });
  });

  describe("createTransactionEntry", () => {
    test("should create ledger entry with PENDING status", async () => {
      const ledgerData = {
        debitWalletId: "wallet-1",
        creditWalletId: "wallet-2",
        amount: 500,
        idempotencyKey: "idem-key-1",
        comment: "Test transfer",
      };

      const mockLedger = {
        id: "ledger-1",
        ...ledgerData,
        status: TransactionStatus.PENDING,
      };

      (db.Ledgers.create as jest.Mock).mockResolvedValue(mockLedger);

      const result = await walletService.createTransactionEntry(ledgerData);

      expect(result).toEqual(mockLedger);
      expect(db.Ledgers.create).toHaveBeenCalledWith({
        debitWalletId: "wallet-1",
        creditWalletId: "wallet-2",
        amount: 500,
        status: TransactionStatus.PENDING,
        idempotencyKey: "idem-key-1",
        comment: "Test transfer",
      });
    });

    test("should create ledger entry without optional comment", async () => {
      const ledgerData = {
        debitWalletId: "wallet-1",
        creditWalletId: "wallet-2",
        amount: 500,
        idempotencyKey: "idem-key-1",
        comment: undefined,
      };

      const mockLedger = {
        id: "ledger-1",
        debitWalletId: "wallet-1",
        creditWalletId: "wallet-2",
        amount: 500,
        status: TransactionStatus.PENDING,
        idempotencyKey: "idem-key-1",
        comment: undefined,
      };

      (db.Ledgers.create as jest.Mock).mockResolvedValue(mockLedger);

      const result = await walletService.createTransactionEntry(ledgerData);

      expect(result.status).toBe(TransactionStatus.PENDING);
    });
  });

  describe("updateTransactionStatus", () => {
    test("should update transaction status to SUCCESSFUL", async () => {
      const mockUpdatedLedger = {
        id: "ledger-1",
        status: TransactionStatus.SUCCESSFUL,
      };

      (db.Ledgers.update as jest.Mock).mockResolvedValue([
        1,
        mockUpdatedLedger,
      ]);

      const result = await walletService.updateTransactionStatus(
        "ledger-1",
        TransactionStatus.SUCCESSFUL,
      );

      expect(result).toEqual(mockUpdatedLedger);
      expect(db.Ledgers.update).toHaveBeenCalledWith(
        { status: TransactionStatus.SUCCESSFUL },
        {
          where: { id: "ledger-1" },
          returning: true,
          plain: true,
        },
      );
    });

    test("should update transaction status to FAILED", async () => {
      const mockUpdatedLedger = {
        id: "ledger-1",
        status: TransactionStatus.FAILED,
      };

      (db.Ledgers.update as jest.Mock).mockResolvedValue([
        1,
        mockUpdatedLedger,
      ]);

      const result = await walletService.updateTransactionStatus(
        "ledger-1",
        TransactionStatus.FAILED,
      );

      expect(result.status).toBe(TransactionStatus.FAILED);
    });
  });

  describe("checkForDuplicateTransactionByIdempotencyKey", () => {
    test("should return existing transaction with matching idempotency key", async () => {
      const mockLedger = {
        id: "ledger-1",
        idempotencyKey: "idem-key-1",
        status: TransactionStatus.SUCCESSFUL,
      };

      (db.Ledgers.findOne as jest.Mock).mockResolvedValue(mockLedger);

      const result =
        await walletService.checkForDuplicateTransactionByIdempotencyKey(
          "idem-key-1",
        );

      expect(result).toEqual(mockLedger);
      expect(db.Ledgers.findOne).toHaveBeenCalledWith({
        where: { idempotencyKey: "idem-key-1" },
      });
    });

    test("should return null when no transaction with idempotency key exists", async () => {
      (db.Ledgers.findOne as jest.Mock).mockResolvedValue(null);

      const result =
        await walletService.checkForDuplicateTransactionByIdempotencyKey(
          "non-existent-key",
        );

      expect(result).toBeNull();
    });
  });
});
