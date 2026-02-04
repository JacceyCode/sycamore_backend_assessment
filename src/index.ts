import dotenv from "dotenv";
import app from "./app";
import db from "./models/index";
import { wallets } from "./seeders/wallets";

dotenv.config(); // loads .env file contents into process.env
const PORT = process.env.PORT || 3000;

// Seed initial wallets if they don't exist
const createWallets = () => {
  wallets.forEach(async (wallet) => {
    const existingWallet = await db.Wallets.findOne({
      where: { name: wallet.name },
    });

    if (!existingWallet) {
      await db.Wallets.create(wallet);
    }
  });
};
createWallets();

// Sync database and start server
db.sequelize
  .sync()
  .then(() => {
    console.log("Database connected successfully 🚀.");

    // Run server after database connection is established
    app.listen(PORT, () => {
      console.log(`Server 🌐 is running on port ${PORT}`);
    });
  })
  .catch((err: Error) => {
    console.error("Unable to connect to the database:", err);
  });
