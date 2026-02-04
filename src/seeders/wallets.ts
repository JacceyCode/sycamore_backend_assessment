import { Currency } from "../types/enum";
import { WalletCreationAttributes } from "../types/interface";

export const wallets: WalletCreationAttributes[] = [
  {
    balance: 1000000.0,
    currency: Currency.NGN,
    name: "WALLET_1",
  },
  {
    balance: 1000000.0,
    currency: Currency.NGN,
    name: "WALLET_2",
  },
  {
    balance: 1000.0,
    currency: Currency.USD,
    name: "WALLET_3",
  },
  {
    balance: 1000.0,
    currency: Currency.USD,
    name: "WALLET_4",
  },
];
