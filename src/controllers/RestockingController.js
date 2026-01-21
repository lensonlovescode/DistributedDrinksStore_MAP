import BranchStock from "../models/BranchStock.js";
import asyncHandler from "express-async-handler";

class RestockingController {
  // Add stock (restock a drink at a branch)
  static AddStock = asyncHandler(async (req, res) => {
    const { branchId, productId, quantity } = req.body;

    if (!branchId || !productId || quantity === undefined) {
      return res.status(400).json({
        message: "Missing required fields: branchId, productId, quantity"
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than 0"
      });
    }

    let stock = await BranchStock.findOne({ branchId, productId });

    if (stock) {
      // Update existing stock
      stock.quantity += quantity;
      await stock.save();
    } else {
      // Create new stock entry
      stock = new BranchStock({
        branchId,
        productId,
        quantity
      });
      await stock.save();
    }

    res.status(200).json({
      message: "Stock updated successfully",
      branchId,
      productId,
      totalQuantity: stock.quantity,
      addedQuantity: quantity
    });
  });

  // Get stock for a branch
  static GetBranchStock = asyncHandler(async (req, res) => {
    const { branchId } = req.params;

    const stock = await BranchStock.find({ branchId })
      .populate("productId", "name price category")
      .populate("branchId", "name location");

    if (stock.length === 0) {
      return res.status(404).json({
        message: "No stock found for this branch"
      });
    }

    res.status(200).json(stock);
  });

  // Get stock for a specific product at a branch
  static GetProductStock = asyncHandler(async (req, res) => {
    const { branchId, productId } = req.params;

    const stock = await BranchStock.findOne({ branchId, productId })
      .populate("productId", "name price category")
      .populate("branchId", "name location");

    if (!stock) {
      return res.status(404).json({
        message: "Stock not found for this product at this branch"
      });
    }

    res.status(200).json(stock);
  });

  // Get low stock items (below reorder level)
  static GetLowStockItems = asyncHandler(async (req, res) => {
    const { branchId } = req.params;

    const lowStockItems = await BranchStock.find({
      branchId,
      $expr: { $lte: ["$quantity", "$reorderLevel"] }
    })
      .populate("productId", "name price category")
      .populate("branchId", "name location");

    res.status(200).json({
      branchId,
      lowStockCount: lowStockItems.length,
      items: lowStockItems
    });
  });

  // Reduce stock (manual adjustment, e.g., damage, loss)
  static ReduceStock = asyncHandler(async (req, res) => {
    const { branchId, productId, quantity, reason } = req.body;

    if (!branchId || !productId || quantity === undefined) {
      return res.status(400).json({
        message: "Missing required fields: branchId, productId, quantity"
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than 0"
      });
    }

    const stock = await BranchStock.findOne({ branchId, productId });

    if (!stock || stock.quantity < quantity) {
      return res.status(400).json({
        message: "Insufficient stock",
        available: stock?.quantity || 0,
        requested: quantity
      });
    }

    stock.quantity -= quantity;
    await stock.save();

    res.status(200).json({
      message: "Stock reduced successfully",
      reason: reason || "Manual adjustment",
      branchId,
      productId,
      reducedQuantity: quantity,
      remainingQuantity: stock.quantity
    });
  });
}

export default RestockingController;
