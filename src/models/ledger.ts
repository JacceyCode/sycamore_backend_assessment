"use strict";

import { DataTypes, Model, Sequelize } from "sequelize";
import { TransactionStatus } from "../types/enum";
import { LedgerAttributes, LedgerCreationAttributes } from "../types/interface";

module.exports = (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  class Ledger
    extends Model<LedgerAttributes, LedgerCreationAttributes>
    implements LedgerAttributes
  {
    id!: string;
    debitWalletId!: string;
    creditWalletId!: string;
    amount!: number;
    status!: TransactionStatus;
    idempotencyKey!: string;
    comment?: string;
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models: Record<string, any>) {
      // define association here

      Ledger.belongsTo(models.Wallets, {
        foreignKey: "debitWalletId",
        as: "DebitWallet",
      });

      Ledger.belongsTo(models.Wallets, {
        foreignKey: "creditWalletId",
        as: "CreditWallet",
      });
    }
  }
  Ledger.init(
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      debitWalletId: {
        type: dataTypes.UUID,
        allowNull: false,
      },
      creditWalletId: {
        type: dataTypes.UUID,
        allowNull: false,
      },
      amount: {
        type: dataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 1.0,
        },
      },
      status: {
        type: dataTypes.ENUM(...Object.values(TransactionStatus)),
        allowNull: false,
        defaultValue: TransactionStatus.PENDING,
      },
      idempotencyKey: {
        type: dataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      comment: {
        type: dataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Ledgers",
    },
  );
  return Ledger;
};
