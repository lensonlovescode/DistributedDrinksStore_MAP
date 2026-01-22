import express from "express";
import MpesaController from "../controllers/MPesaController.js";
import MPesaCallcackController from "../controllers/MPesaCallbackController.js";
import CashOrderController from "../controllers/CashOrderController.js";
import RestockController from "../controllers/RestockController.js"; // Import RestockController
import AuthController from "../controllers/AuthController.js"; // Import AuthController
const router = express.Router();

router.post("/mpesapush", MpesaController.MpesaMainPush);
router.post("/mpesa-express-callback", MPesaCallcackController.MpesaCallback);
router.get("/order-status/:checkoutRequestID", MPesaCallcackController.OrderStatus);
router.post("/cashorder", CashOrderController.CashOrderCustomer);
router.post("/restock", RestockController.restockItem); // New restock route
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);

export default router;
