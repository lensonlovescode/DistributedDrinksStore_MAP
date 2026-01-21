import Order from "../models/Order.js";
import Payment from "../models/transactions.js";
import asyncHandler from "express-async-handler";

class CashOrderController {
  // Create a cash order (customer pays at branch/point of sale)
  static CashOrder = asyncHandler(async (req, res) => {
    const { customerId, branchId, items } = req.body;

    if (!customerId || !branchId || !items || items.length === 0) {
      return res.status(400).json({
        message: "Missing required fields: customerId, branchId, items"
      });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    // Create order with cash payment method
    const order = new Order({
      customerId,
      branchId,
      items,
      totalAmount,
      paymentMethod: "cash",
      paymentStatus: "pending" // Pending admin confirmation
    });

    await order.save();

    res.status(201).json({
      message: "Cash order created successfully. Awaiting admin confirmation.",
      orderId: order._id,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      paymentMethod: "cash"
    });
  });

  // Fetch pending cash orders for admin (polls every 5 seconds in mobile app)
  static FetchPendingOrdersAdmin = asyncHandler(async (req, res) => {
    const { branchId } = req.params;

    if (!branchId) {
      return res.status(400).json({ message: "branchId is required" });
    }

    const pendingOrders = await Order.find({
      branchId,
      paymentMethod: "cash",
      paymentStatus: "pending"
    })
      .populate("customerId", "name email phoneNumber")
      .populate("items.productId", "name price")
      .sort({ createdAt: 1 }); // Oldest first

    res.status(200).json({
      branchId,
      pendingCount: pendingOrders.length,
      orders: pendingOrders
    });
  });

  // Admin confirms a cash order (marks as completed and paid)
  static ConfirmCashOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { amountReceived } = req.body;

    if (!orderId || amountReceived === undefined) {
      return res.status(400).json({
        message: "Missing required fields: orderId, amountReceived"
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentMethod !== "cash") {
      return res.status(400).json({
        message: "This order is not a cash order",
        paymentMethod: order.paymentMethod
      });
    }

    // Update order status to completed
    order.paymentStatus = "completed";
    await order.save();

    // Create payment record for cash transaction
    const payment = new Payment({
      orderId,
      phoneNumber: "cash-payment", // Placeholder for cash transactions
      amount: amountReceived,
      status: "completed",
      paymentMethod: "cash",
      transactionDate: new Date()
    });
    await payment.save();

    res.status(200).json({
      message: "Cash order confirmed and completed",
      orderId: order._id,
      amount: order.totalAmount,
      amountReceived,
      paymentStatus: order.paymentStatus,
      paymentId: payment._id
    });
  });

  // Admin rejects a cash order
  static RejectCashOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findByIdAndUpdate(
      orderId,
      { paymentStatus: "failed" },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Cash order rejected",
      orderId: order._id,
      reason: reason || "No reason provided",
      paymentStatus: order.paymentStatus
    });
  });
}

export default CashOrderController;