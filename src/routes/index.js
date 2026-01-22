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

export default router;
