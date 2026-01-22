import express from "express";
import MpesaController from "../controllers/MPesaController.js";
import MPesaCallcackController from "../controllers/MPesaCallbackController.js";
import CashOrderController from "../controllers/CashOrderController.js";
import Serve from "../controllers/GetReport.js";
const router = express.Router();

router.post("/mpesapush", MpesaController.MpesaMainPush);
router.post("/mpesa-express-callback", MPesaCallcackController.MpesaCallback);
router.get(
  "/order-status/:checkoutRequestID",
  MPesaCallcackController.OrderStatus
);
router.post("/cashorder", CashOrderController.CashOrderCustomer);
router.get("/transactions", Serve);

//restock API
const restockController = require('../controllers/restock.controller');
const { verifyAdmin } = require('../middleware/auth.middleware');

// Stock management routes
router.get('/stock/all', verifyAdmin, restockController.getAllStock);
router.get('/stock/branch/:branchId', verifyAdmin, restockController.getBranchStock);

// Restock routes
router.post('/restock', verifyAdmin, restockController.restockBranch);
router.get('/restock/history', verifyAdmin, restockController.getRestockHistory);

// Reference data routes
router.get('/drinks', restockController.getAllDrinks);
router.get('/branches', restockController.getAllBranches);

export default router;
