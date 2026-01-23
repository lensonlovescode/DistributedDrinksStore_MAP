import express from "express";
import MpesaController from "../controllers/MPesaController.js";
import MPesaCallcackController from "../controllers/MPesaCallbackController.js";
import CashOrderController from "../controllers/CashOrderController.js";
import { getSalesSummary } from "../controllers/GetReport.js";
import RestockController from "../controllers/RestockController.js";
import { getSodaDetails } from "../controllers/GetReportDrink.js";
const router = express.Router();

router.post("/mpesapush", MpesaController.MpesaMainPush);
router.post("/mpesa-express-callback", MPesaCallcackController.MpesaCallback);
router.get(
  "/order-status/:checkoutRequestID",
  MPesaCallcackController.OrderStatus,
);
router.post("/cashorder", CashOrderController.CashOrderCustomer);
router.get("/restock", RestockController.restockItem);
router.get("/sales-summary", getSalesSummary);
router.get("/soda-info", getSodaDetails);

export default router;
