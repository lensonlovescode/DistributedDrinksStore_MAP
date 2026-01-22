import mongoose from 'mongoose';
import DBClient from '../services/db.js';
import Product from '../models/Product.js';
import Branch from '../models/Branch.js';
import Stock from '../models/Stock.js';

const checkStock = async (productName, branchName) => {
  try {
    await DBClient.connect();

    const product = await Product.findOne({ name: productName });
    if (!product) {
      console.log(`Product "${productName}" not found.`);
      return;
    }

    const branch = await Branch.findOne({ name: branchName });
    if (!branch) {
      console.log(`Branch "${branchName}" not found.`);
      return;
    }

    const stock = await Stock.findOne({ product: product._id, branch: branch._id });

    if (stock) {
      console.log(`Initial Stock for "${productName}" at "${branchName}": ${stock.quantity}`);
      return stock.quantity;
    } else {
      console.log(`Stock entry for "${productName}" at "${branchName}" not found.`);
      return 0;
    }
  } catch (error) {
    console.error('Error checking stock:', error);
  } finally {
    await DBClient.disconnect();
  }
};

checkStock("Coca-Cola", "Nairobi");
