import Stock from '../models/Stock.js';
import Product from '../models/Product.js';
import Branch from '../models/Branch.js';

const reduceStock = async (branchName, productName, quantity) => {
  const branch = await Branch.findOne({ name: branchName });
  if (!branch) {
    throw new Error(`Branch not found: ${branchName}`);
  }

  const product = await Product.findOne({ name: productName });
  if (!product) {
    throw new Error(`Product not found: ${productName}`);
  }

  const stock = await Stock.findOne({ branch: branch._id, product: product._id });

  if (!stock) {
    throw new Error(`Stock not found for ${productName} at ${branchName}`);
  }

  if (stock.quantity < quantity) {
    throw new Error(`Not enough stock for ${productName} at ${branchName}. Available: ${stock.quantity}, Required: ${quantity}`);
  }

  stock.quantity -= quantity;
  await stock.save();

  return stock;
};

const addStock = async (branchName, productName, quantity) => {
  const branch = await Branch.findOne({ name: branchName });
  if (!branch) {
    throw new Error(`Branch not found: ${branchName}`);
  }

  const product = await Product.findOne({ name: productName });
  if (!product) {
    throw new Error(`Product not found: ${productName}`);
  }

  const stock = await Stock.findOne({ branch: branch._id, product: product._id });

  if (!stock) {
    // If stock doesn't exist, we could create it, but for a simple restock let's assume it should exist.
    throw new Error(`Stock entry not found for ${productName} at ${branchName}. Please create it first.`);
  }

  stock.quantity += quantity;
  await stock.save();

  return stock;
};

export { reduceStock, addStock };
