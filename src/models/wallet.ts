"use strict";
import { DataTypes, Model, Sequelize } from "sequelize";
import { Currency } from "../types/enum";
import { WalletAttributes, WalletCreationAttributes } from "../types/interface";

module.exports = (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  class Wallet
    extends Model<WalletAttributes, WalletCreationAttributes>
    implements WalletAttributes
  {
    id!: string;
    balance!: number;
    currency!: Currency;
    name!: string;
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models: Record<string, any>) {
      // define association here
      Wallet.hasMany(models.Ledgers, {
        foreignKey: "debitWalletId",
        as: "DebitTransactions",
      });

      Wallet.hasMany(models.Ledgers, {
        foreignKey: "creditWalletId",
        as: "CreditTransactions",
      });
    }
  }

  Wallet.init(
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      balance: {
        type: dataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        validate: {
          min: 0.0,
        },
      },
      currency: {
        type: dataTypes.ENUM(...Object.values(Currency)),
        allowNull: false,
        defaultValue: Currency.NGN,
      },
      name: {
        type: dataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: "Wallets",
    },
  );

  return Wallet;
};
