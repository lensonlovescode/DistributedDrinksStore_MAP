import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Branch from '../models/Branch.js';
import Stock from '../models/Stock.js';
import DBClient from '../services/db.js'; // Import DBClient

const products = [
  { name: 'Coke', description: 'Classic Coca-Cola', price: 50 },
  { name: 'Fanta', description: 'Fruity Fanta', price: 50 },
  { name: 'Sprite', description: 'Refreshing Sprite', price: 50 }
];

const branches = [
  { name: 'Nairobi(HQ)', isHQ: true },
  { name: 'Mombasa' },
  { name: 'Eldoret' },
  { name: 'Kisumu' },
  { name: 'Nakuru' }
];

const seedDatabase = async () => {
  try {
    await DBClient.connect(); // Connect to the database

    console.log('Clearing existing data...');
    await Product.deleteMany({});
    await Branch.deleteMany({});
    await Stock.deleteMany({});
    console.log('Existing data cleared.');

    console.log('Seeding products...');
    const createdProducts = await Product.insertMany(products);
    console.log('Products seeded.');

    console.log('Seeding branches...');
    const createdBranches = await Branch.insertMany(branches);
    console.log('Branches seeded.');

    console.log('Seeding initial stock...');
    const stock = [];
    for (const branch of createdBranches) {
      for (const product of createdProducts) {
        stock.push({
          branch: branch._id,
          product: product._id,
          quantity: 100 // Initial stock of 100 for every product in every branch
        });
      }
    }
    await Stock.insertMany(stock);
    console.log('Initial stock seeded.');

    console.log('Database has been successfully seeded!');
    await DBClient.disconnect(); // Disconnect from the database
  } catch (error) {
    console.error('Error seeding database:', error);
    await DBClient.disconnect(); // Ensure disconnection even on error
  }
};

seedDatabase();
