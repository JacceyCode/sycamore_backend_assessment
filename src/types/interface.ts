import { Currency, TransactionStatus } from "./enum";

export interface WalletAttributes {
  id: string;
  balance: number;
  currency: Currency;
  name: string;
}

export interface WalletCreationAttributes extends Omit<
  WalletAttributes,
  "id"
> {}

export interface LedgerAttributes {
  id: string;
  debitWalletId: string;
  creditWalletId: string;
  amount: number;
  status: TransactionStatus;
  idempotencyKey: string;
  comment?: string;
}

export interface LedgerCreationAttributes extends Omit<
  LedgerAttributes,
  "id" | "status"
> {}

export interface TransferRequest {
  fromAccount: string;
  toAccount: string;
  amount: number;
  comment?: string;
}

export interface ITransferTransaction {
  debitWalletId: string;
  creditWalletId: string;
  amount: number;
  transactionId: string;
}
