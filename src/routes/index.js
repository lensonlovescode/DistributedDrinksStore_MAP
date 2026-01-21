import express from "express";
import MpesaController from "../controllers/MPesaController.js";
import MPesaCallcackController from "../controllers/MPesaCallbackController.js";
import CashOrderController from "../controllers/CashOrderController.js";
import OrderController from "../controllers/OrderController.js";
import RestockingController from "../controllers/RestockingController.js";
import Branch from "../models/Branch.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";

const router = express.Router();

// ===== M-PESA PAYMENT ROUTES =====
// Initiate STK push for M-Pesa payment (called AFTER order is created)
router.post("/mpesapush", MpesaController.MpesaMainPush);

// M-Pesa callback endpoint (called by Safaricom after customer enters PIN)
router.post("/mpesa-express-simulate-callback", MPesaCallcackController.MpesaCallback);

// Check payment status using CheckoutRequestID
router.get("/order-status/:checkoutRequestID", MPesaCallcackController.OrderStatus);

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

// ===== BRANCH MANAGEMENT ROUTES =====
// Create branch
router.post("/branch/create", async (req, res) => {
  try {
    const { name, location, isHeadquarter } = req.body;

    if (!name || !location) {
      return res.status(400).json({ error: "Name and location are required" });
    }

    const branch = new Branch({ name, location, isHeadquarter: isHeadquarter || false });
    await branch.save();

    res.status(201).json({ message: "Branch created", branch });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all branches
router.get("/branches", async (req, res) => {
  try {
    const branches = await Branch.find();
    res.status(200).json(branches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get branch by ID
router.get("/branch/:id", async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ error: "Branch not found" });
    res.status(200).json(branch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update branch
router.patch("/branch/:id", async (req, res) => {
  try {
    const { name, location, isHeadquarter } = req.body;
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { name, location, isHeadquarter },
      { new: true }
    );
    if (!branch) return res.status(404).json({ error: "Branch not found" });
    res.status(200).json({ message: "Branch updated", branch });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete branch
router.delete("/branch/:id", async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) return res.status(404).json({ error: "Branch not found" });
    res.status(200).json({ message: "Branch deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== PRODUCT MANAGEMENT ROUTES =====
// Create product
router.post("/product/create", async (req, res) => {
  try {
    const { name, price, description, category } = req.body;

    if (!name || !price || price <= 0) {
      return res.status(400).json({ error: "Invalid name or price" });
    }

    const product = new Product({ name, price, description, category });
    await product.save();

    res.status(201).json({ message: "Product created", product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all products
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get product by ID
router.get("/product/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product
router.patch("/product/:id", async (req, res) => {
  try {
    const { name, price, description, category } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, description, category },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.status(200).json({ message: "Product updated", product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
router.delete("/product/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CUSTOMER MANAGEMENT ROUTES =====
// Create customer
router.post("/customer/create", async (req, res) => {
  try {
    const { name, username, email, password, phoneNumber } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const customer = new Customer({ name, username, email, password, phoneNumber });
    await customer.save();

    res.status(201).json({ message: "Customer created", customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all customers
router.get("/customers", async (req, res) => {
  try {
    const customers = await Customer.find().select("-password");
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customer by ID
router.get("/customer/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select("-password");
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update customer
router.patch("/customer/:id", async (req, res) => {
  try {
    const { name, username, email, phoneNumber } = req.body;
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, username, email, phoneNumber },
      { new: true }
    ).select("-password");
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.status(200).json({ message: "Customer updated", customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete customer
router.delete("/customer/:id", async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.status(200).json({ message: "Customer deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
