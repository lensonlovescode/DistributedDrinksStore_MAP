import express from 'express';
import BranchStock from '../models/BranchStock.js';
import Product from '../models/Product.js';
import Branch from '../models/Branch.js';

const router = express.Router();

// Add stock to a branch (restock)
router.post('/add', async (req, res) => {
  try {
    const { branchId, productId, quantity } = req.body;

    // Validate inputs
    if (!branchId || !productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        error: 'Missing or invalid required fields: branchId, productId, quantity (must be > 0)'
      });
    }

    // Validate branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Find or create stock record
    let stock = await BranchStock.findOne({ branchId, productId });

    if (stock) {
      // Update existing stock
      stock.quantity += quantity;
      stock.updatedAt = new Date();
      await stock.save();
    } else {
      // Create new stock record
      stock = new BranchStock({
        branchId,
        productId,
        quantity
      });
      await stock.save();
    }

    res.status(201).json({
      message: 'Stock added successfully',
      stock
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stock for a branch
router.get('/branch/:branchId', async (req, res) => {
  try {
    const { branchId } = req.params;

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    const stock = await BranchStock.find({ branchId })
      .populate('productId', 'name price')
      .populate('branchId', 'name location');

    res.status(200).json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stock for a specific product across all branches
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const stock = await BranchStock.find({ productId })
      .populate('branchId', 'name location');

    res.status(200).json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stock for a specific branch and product
router.get('/:branchId/:productId', async (req, res) => {
  try {
    const { branchId, productId } = req.params;

    const stock = await BranchStock.findOne({ branchId, productId })
      .populate('productId', 'name price')
      .populate('branchId', 'name location');

    if (!stock) {
      return res.status(404).json({ error: 'Stock record not found' });
    }

    res.status(200).json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update stock quantity (manual adjustment)
router.patch('/:branchId/:productId', async (req, res) => {
  try {
    const { branchId, productId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        error: 'Invalid quantity. Must be >= 0'
      });
    }

    const stock = await BranchStock.findOneAndUpdate(
      { branchId, productId },
      { quantity, updatedAt: new Date() },
      { new: true }
    )
      .populate('productId', 'name price')
      .populate('branchId', 'name location');

    if (!stock) {
      return res.status(404).json({ error: 'Stock record not found' });
    }

    res.status(200).json({
      message: 'Stock updated successfully',
      stock
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get low stock items (below threshold)
router.get('/low-stock/:threshold', async (req, res) => {
  try {
    const { threshold } = req.params;

    const lowStockItems = await BranchStock.find({ quantity: { $lt: parseInt(threshold) } })
      .populate('productId', 'name price')
      .populate('branchId', 'name location');

    res.status(200).json({
      threshold: parseInt(threshold),
      count: lowStockItems.length,
      items: lowStockItems
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all branch stock (inventory overview)
router.get('/all/overview', async (req, res) => {
  try {
    const stock = await BranchStock.find()
      .populate('productId', 'name price')
      .populate('branchId', 'name location');

    const overview = {
      totalRecords: stock.length,
      branches: {}
    };

    stock.forEach(item => {
      const branchName = item.branchId.name;
      if (!overview.branches[branchName]) {
        overview.branches[branchName] = [];
      }
      overview.branches[branchName].push({
        product: item.productId.name,
        price: item.productId.price,
        quantity: item.quantity,
        lastUpdated: item.updatedAt
      });
    });

    res.status(200).json(overview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete stock record
router.delete('/:branchId/:productId', async (req, res) => {
  try {
    const { branchId, productId } = req.params;

    const stock = await BranchStock.findOneAndDelete({ branchId, productId });

    if (!stock) {
      return res.status(404).json({ error: 'Stock record not found' });
    }

    res.status(200).json({ message: 'Stock record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
