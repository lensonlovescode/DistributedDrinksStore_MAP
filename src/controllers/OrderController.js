import Order from "../models/Order.js";
import BranchStock from "../models/BranchStock.js";
import asyncHandler from "express-async-handler";

class OrderController {
  // Create a new order (used before M-Pesa STK push)
  static CreateOrder = asyncHandler(async (req, res) => {
    const { customerId, branchId, items, paymentMethod } = req.body;

    // Validate required fields
    if (!customerId || !branchId || !items || items.length === 0 || !paymentMethod) {
      return res.status(400).json({ 
        message: "Missing required fields: customerId, branchId, items, paymentMethod" 
      });
    }

    // Validate stock availability
    for (const item of items) {
      const stock = await BranchStock.findOne({
        branchId,
        productId: item.productId
      });

      if (!stock || stock.quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product ${item.productId}`,
          available: stock?.quantity || 0,
          requested: item.quantity
        });
      }
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    // Create order
    const order = new Order({
      customerId,
      branchId,
      items,
      totalAmount,
      paymentMethod,
      paymentStatus: "pending"
    });

    await order.save();

    res.status(201).json({
      message: "Order created successfully",
      orderId: order._id,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus
    });
  });

  // Get order by ID
  static GetOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("customerId", "name email phoneNumber")
      .populate("branchId", "name location")
      .populate("items.productId", "name price");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  });

  // Get all orders for a customer
  static GetCustomerOrders = asyncHandler(async (req, res) => {
    const { customerId } = req.params;

    const orders = await Order.find({ customerId })
      .populate("branchId", "name location")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  });

  // Get all pending orders for a branch (for admin)
  static GetPendingOrdersForBranch = asyncHandler(async (req, res) => {
    const { branchId } = req.params;

    const orders = await Order.find({
      branchId,
      paymentStatus: "pending"
    })
      .populate("customerId", "name email phoneNumber")
      .populate("items.productId", "name price")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  });

  // Update order status (called after payment confirmation)
  static UpdateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    if (!["pending", "completed", "failed"].includes(paymentStatus)) {
      return res.status(400).json({ 
        message: "Invalid paymentStatus. Must be: pending, completed, or failed" 
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { paymentStatus },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // If order is completed, reduce stock
    if (paymentStatus === "completed") {
      for (const item of order.items) {
        await BranchStock.findOneAndUpdate(
          { branchId: order.branchId, productId: item.productId },
          { $inc: { quantity: -item.quantity } },
          { new: true }
        );
      }
    }

    res.status(200).json({
      message: "Order status updated successfully",
      order
    });
  });
}

export default OrderController;
