import express from "express";
import MpesaController from "../controllers/MPesaController.js";
import MPesaCallcackController from "../controllers/MPesaCallbackController.js";
import CashOrderController from "../controllers/CashOrderController.js";
import { getSalesSummary } from "../controllers/GetReport.js";
import { getSodaDetails } from "../controllers/GetReportDrink.js";
import { handleRestock } from "../controllers/Restock.js";
const router = express.Router();

router.post("/mpesapush", MpesaController.MpesaMainPush);
router.post("/mpesa-express-callback", MPesaCallcackController.MpesaCallback);
router.get(
  "/order-status/:checkoutRequestID",
  MPesaCallcackController.OrderStatus,
);
router.post("/cashorder", CashOrderController.CashOrderCustomer);
router.post("/restock", handleRestock);
router.get("/sales-summary", getSalesSummary);
router.get("/soda-info", getSodaDetails);

export default router;
