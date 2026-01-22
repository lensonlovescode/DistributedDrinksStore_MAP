import express from "express";
import MpesaController from "../controllers/MPesaController.js";
import MPesaCallcackController from "../controllers/MPesaCallbackController.js";
import CashOrderController from "../controllers/CashOrderController.js";
const router = express.Router();

router.post("/mpesapush", MpesaController.MpesaMainPush);
router.post("/mpesa-express-callback", MPesaCallcackController.MpesaCallback);
router.get("/order-status/:checkoutRequestID", MPesaCallcackController.OrderStatus);
router.post("/cashorder", CashOrderController.CashOrderCustomer);

export default router;
