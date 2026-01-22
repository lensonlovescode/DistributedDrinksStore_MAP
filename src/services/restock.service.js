const Stock = require('../models/stock.model');
const Drink = require('../models/drink.model');
const Branch = require('../models/branch.model');
const RestockTransaction = require('../models/restockTransaction.model');
const mongoose = require('mongoose');

const restockService = {
  // Get all stock across all branches
  getAllStock: async () => {
    const branches = await Branch.find();
    const stockData = [];

    for (const branch of branches) {
      const stocks = await Stock.find({ branchId: branch._id })
        .populate('drinkId', 'name price');
      
      const drinks = stocks.map(stock => ({
        drinkId: stock.drinkId._id,
        drinkType: stock.drinkId.name,
        currentStock: stock.quantity
      }));

      stockData.push({
        branchId: branch._id,
        branchName: branch.name,
        location: branch.location,
        drinks: drinks
      });
    }

    return { branches: stockData };
  },

  // Get stock for specific branch
  getBranchStock: async (branchId) => {
    const branch = await Branch.findById(branchId);
    if (!branch) return null;

    const stocks = await Stock.find({ branchId: branchId })
      .populate('drinkId', 'name price');
    
    const drinks = stocks.map(stock => ({
      drinkId: stock.drinkId._id,
      drinkType: stock.drinkId.name,
      currentStock: stock.quantity
    }));

    return {
      branchId: branch._id,
      branchName: branch.name,
      location: branch.location,
      drinks: drinks
    };
  },

  // Restock a branch
  restockBranch: async (branchId, items, adminId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Verify branch exists
      const branch = await Branch.findById(branchId).session(session);
      if (!branch) {
        throw new Error('Branch not found');
      }

      // Get HQ branch (Nairobi)
      const hqBranch = await Branch.findOne({ location: 'Nairobi' }).session(session);
      
      if (!hqBranch) {
        throw new Error('HQ branch not found');
      }

      // Check if restocking to HQ (not allowed)
      if (branchId === hqBranch._id.toString()) {
        throw new Error('Cannot restock HQ from itself');
      }

      // Verify HQ has sufficient stock and process restock
      for (const item of items) {
        // Check HQ stock
        const hqStock = await Stock.findOne({
          branchId: hqBranch._id,
          drinkId: item.drinkId
        }).session(session);

        if (!hqStock || hqStock.quantity < item.quantity) {
          const drink = await Drink.findById(item.drinkId);
          throw new Error(`Insufficient stock at HQ for ${drink.name}`);
        }

        // Deduct from HQ
        hqStock.quantity -= item.quantity;
        await hqStock.save({ session });

        // Add to target branch
        const branchStock = await Stock.findOne({
          branchId: branchId,
          drinkId: item.drinkId
        }).session(session);

        if (branchStock) {
          branchStock.quantity += item.quantity;
          await branchStock.save({ session });
        } else {
          // Create stock entry if it doesn't exist
          await Stock.create([{
            branchId: branchId,
            drinkId: item.drinkId,
            quantity: item.quantity
          }], { session });
        }
      }

      // Create transaction record
      const transaction = await RestockTransaction.create([{
        branchId: branchId,
        items: items,
        restockedBy: adminId,
        timestamp: new Date()
      }], { session });

      await session.commitTransaction();
      
      return {
        transactionId: transaction[0]._id,
        branchId: branchId,
        items: items,
        restockedBy: adminId,
        timestamp: transaction[0].timestamp
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  // Get restock history with optional filters
  getRestockHistory: async (filters) => {
    const query = {};

    if (filters.branchId) {
      query.branchId = filters.branchId;
    }

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        query.timestamp.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.timestamp.$lte = new Date(filters.endDate);
      }
    }

    const history = await RestockTransaction.find(query)
      .populate('branchId', 'name location')
      .populate('restockedBy', 'username email')
      .sort({ timestamp: -1 });

    return history.map(record => ({
      transactionId: record._id,
      branchId: record.branchId._id,
      branchName: record.branchId.name,
      location: record.branchId.location,
      items: record.items,
      restockedBy: record.restockedBy?.username || 'Unknown',
      timestamp: record.timestamp
    }));
  },

  // Get all drinks
  getAllDrinks: async () => {
    const drinks = await Drink.find();
    return drinks.map(drink => ({
      drinkId: drink._id,
      drinkType: drink.name,
      price: drink.price
    }));
  },

  // Get all branches
  getAllBranches: async () => {
    const branches = await Branch.find();
    return branches.map(branch => ({
      branchId: branch._id,
      branchName: branch.name,
      location: branch.location
    }));
  }
};

module.exports = restockService;
