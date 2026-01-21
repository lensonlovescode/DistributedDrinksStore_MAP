import STKpush from "../utils/STKpush.js"
import GetAccessToken from "../utils/GetAccessToken.js"; 
import RedisClient from "../services/redis.js";
import Order from "../models/Order.js";
import asyncHandler from "express-async-handler";

class MpesaController {
  // Initiate STK Push to M-Pesa (triggers payment prompt on customer's phone)
  // This is called AFTER an order has been created via the Order API
  static MpesaMainPush = asyncHandler(async (req, res) => {
    const { phone, orderId } = req.body;

    if (!phone || !orderId) {
      return res.status(400).json({
        message: "Missing required fields: phone, orderId"
      });
    }

    // Verify order exists and is pending
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus !== "pending") {
      return res.status(400).json({
        message: "Order payment has already been processed",
        currentStatus: order.paymentStatus
      });
    }

    let AccessToken = await RedisClient.get("AccessToken");
    console.log(`AccessToken From Redis is: ${AccessToken}`);
    if (!AccessToken) {
      console.log(`Getting new AccessToken`);
      AccessToken = await GetAccessToken();
    }

    const data = await STKpush(process.env.PASSKEY, Number(phone), order.totalAmount, AccessToken);
    
    if (data.error) {
      return res.status(500).json({
        error: data.error,
        message: data.message,
        orderId: orderId
      });
    }

    // Store CheckoutRequestID in Redis with order details for callback matching
    await RedisClient.set(
      `checkout:${data.CheckoutRequestID}`,
      JSON.stringify({ orderId, phone, amount: order.totalAmount, timestamp: Date.now() }),
      3600 // Expire after 1 hour
    );

    res.status(200).json({
      status: data.CustomerMessage,
      CheckoutRequestID: data.CheckoutRequestID,
      orderId: orderId,
      message: "STK push sent to customer's phone"
    });
  });
}

export default MpesaController
