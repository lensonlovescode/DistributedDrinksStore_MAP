import express from "express";
import MpesaController from "../controllers/MPesaController.js";
import ordersRoutes from "./orders.js";
import restockingRoutes from "./restocking.js";
import productsRoutes from "./products.js";
import branchesRoutes from "./branches.js";
import customersRoutes from "./customers.js";

const router = express.Router();

<<<<<<< HEAD
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
=======
router.post("/mpesapush", MpesaController.MpesaMainPush);

router.post("/mpesa-express-simulate-callback", async (req, res) => {
  try {
    const callbackData = req.body;
    
    const result_code = callbackData.Body.stkCallback.ResultCode;
    
    if (result_code !== 0) {
      const error_message = callbackData.Body.stkCallback.ResultDesc;
      console.log(`Payment failed: ${error_message}`);
      return res.json({ ResultCode: result_code, ResultDesc: error_message });
    }
    
    const body = callbackData.Body.stkCallback.CallbackMetadata;
    const amount = body.Item.find(obj => obj.Name === 'Amount').Value;
    const mpesaCode = body.Item.find(obj => obj.Name === 'MpesaReceiptNumber').Value;
    const phone = body.Item.find(obj => obj.Name === 'PhoneNumber').Value;
    
    console.log(`Transaction Successful: ${amount}, ${mpesaCode}, ${phone}`);

    
    return res.json({ ResultCode: 0, ResultDesc: "Success" });
    
  } catch (error) {
    console.error(`Callback processing error: ${error}`);
    return res.status(500).json({ ResultCode: 1, ResultDesc: "Processing failed" });
  }
});

export default router;
>>>>>>> 89c17c5758349cd4e60dc1eb5d2c3bfb7892dc0c
