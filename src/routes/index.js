import express from "express";
import MpesaController from "../controllers/MPesaController.js";
import MPesaCallcackController from "../controllers/MPesaCallbackController.js";
import CashOrderController from "../controllers/CashOrderController.js";
const router = express.Router();

router.post("/mpesapush", MpesaController.MpesaMainPush);
router.post("/mpesa-express-simulate-callback", MPesaCallcackController.MpesaCallback);
router.post("/cashorder", CashOrderController.CashOrder);
router.post("/order-status", MpesaCallbackController.OrderStatusi);

export default router;
