import express from "express";
import MpesaController from "../controllers/MPesaController.js";
import ordersRoutes from "./orders.js";
import restockingRoutes from "./restocking.js";
import productsRoutes from "./products.js";
import branchesRoutes from "./branches.js";
import customersRoutes from "./customers.js";

const router = express.Router();

// M-Pesa payment routes
router.post("/mpesapush", MpesaController.MpesaMainPush);

// Products routes
router.use("/products", productsRoutes);

// Branches routes
router.use("/branches", branchesRoutes);

// Customers routes
router.use("/customers", customersRoutes);

// Orders routes
router.use("/orders", ordersRoutes);

// Restocking routes
router.use("/restocking", restockingRoutes);

export default router;
