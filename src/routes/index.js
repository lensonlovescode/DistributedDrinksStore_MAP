import express from "express";
import MpesaController from "../controllers/MPesaController.js";
import MPesaCallbackController from "../controllers/MPesaCallbackController.js";
import CashOrderController from "../controllers/CashOrderController.js";
import OrderController from "../controllers/OrderController.js";
import RestockingController from "../controllers/RestockingController.js";

const router = express.Router();

// ===== M-PESA PAYMENT ROUTES =====
// Initiate STK push for M-Pesa payment (called AFTER order is created)
router.post("/mpesapush", MpesaController.MpesaMainPush);

// M-Pesa callback endpoint (called by Safaricom after customer enters PIN)
router.post("/mpesa-express-simulate-callback", MPesaCallbackController.MpesaCallback);

// Check payment status using CheckoutRequestID
router.get("/order-status/:checkoutRequestID", MPesaCallbackController.OrderStatus);

// ===== ORDER MANAGEMENT ROUTES =====
// Create a new order (called before payment)
router.post("/order", OrderController.CreateOrder);

// Get order by ID
router.get("/order/:orderId", OrderController.GetOrder);

// Get all orders for a customer
router.get("/customer/:customerId/orders", OrderController.GetCustomerOrders);

// Get pending orders for a branch (admin only)
router.get("/branch/:branchId/pending-orders", OrderController.GetPendingOrdersForBranch);

// Update order status (after payment confirmation)
router.put("/order/:orderId/status", OrderController.UpdateOrderStatus);

// ===== CASH ORDER ROUTES =====
// Create a cash order
router.post("/cashorder", CashOrderController.CashOrder);

// Fetch pending cash orders for admin (polls every 5 seconds)
router.get("/branch/:branchId/cash-orders/pending", CashOrderController.FetchPendingOrdersAdmin);

// Admin confirms a cash order
router.put("/cashorder/:orderId/confirm", CashOrderController.ConfirmCashOrder);

// Admin rejects a cash order
router.put("/cashorder/:orderId/reject", CashOrderController.RejectCashOrder);

// ===== RESTOCKING ROUTES =====
// Add/restock drinks at a branch
router.post("/restock", RestockingController.AddStock);

// Get all stock for a branch
router.get("/branch/:branchId/stock", RestockingController.GetBranchStock);

// Get stock for a specific product at a branch
router.get("/branch/:branchId/product/:productId/stock", RestockingController.GetProductStock);

// Get low stock items at a branch
router.get("/branch/:branchId/low-stock", RestockingController.GetLowStockItems);

// Reduce stock (damage, loss, etc)
router.post("/stock/reduce", RestockingController.ReduceStock);

export default router;
