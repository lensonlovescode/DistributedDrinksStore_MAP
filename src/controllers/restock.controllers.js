const restockService = require('../services/restock.service');

const restockController = {
  // Get stock levels for all branches
  getAllStock: async (req, res) => {
    try {
      const stockData = await restockService.getAllStock();
      res.status(200).json({
        success: true,
        data: stockData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching stock data',
        error: error.message
      });
    }
  },

  // Get stock levels for specific branch
  getBranchStock: async (req, res) => {
    try {
      const { branchId } = req.params;
      const branchStock = await restockService.getBranchStock(branchId);
      
      if (!branchStock) {
        return res.status(404).json({
          success: false,
          message: 'Branch not found'
        });
      }

      res.status(200).json({
        success: true,
        data: branchStock
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching branch stock',
        error: error.message
      });
    }
  },

  // Restock a branch
  restockBranch: async (req, res) => {
    try {
      const { branchId, items } = req.body;
      const adminId = req.user.userId;

      // Validate request
      if (!branchId || !items || !Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request. Required: branchId and items array'
        });
      }

      // Validate items
      for (const item of items) {
        if (!item.drinkId || !item.quantity || item.quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid item structure. Each item needs drinkId and positive quantity'
          });
        }
      }

      const result = await restockService.restockBranch(branchId, items, adminId);

      res.status(200).json({
        success: true,
        message: 'Branch restocked successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error processing restock',
        error: error.message
      });
    }
  },

  // Get restocking history
  getRestockHistory: async (req, res) => {
    try {
      const { branchId, startDate, endDate } = req.query;
      const filters = { branchId, startDate, endDate };
      
      const history = await restockService.getRestockHistory(filters);

      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching restock history',
        error: error.message
      });
    }
  },

  // Get all drinks
  getAllDrinks: async (req, res) => {
    try {
      const drinks = await restockService.getAllDrinks();
      res.status(200).json({
        success: true,
        data: drinks
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching drinks',
        error: error.message
      });
    }
  },

  // Get all branches
  getAllBranches: async (req, res) => {
    try {
      const branches = await restockService.getAllBranches();
      res.status(200).json({
        success: true,
        data: branches
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching branches',
        error: error.message
      });
    }
  }
};

module.exports = restockController;