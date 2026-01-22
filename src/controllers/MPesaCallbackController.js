import RedisClient from "../services/redis.js";
import Order from "../models/Order.js";
import Payment from "../models/transactions.js";
import asyncHandler from "express-async-handler";

class MpesaCallbackController {
  // Handles M-Pesa callback after customer enters PIN
  static MpesaCallback = asyncHandler(async (req, res) => {
    try {
      const callbackData = req.body;
      const result_code = callbackData.Body.stkCallback.ResultCode;
      const checkoutRequestID = callbackData.Body.stkCallback.CheckoutRequestID;

      // Payment failed
      if (result_code !== 0) {
        const error_message = callbackData.Body.stkCallback.ResultDesc;
        console.log(`Payment failed: ${error_message}`);

        // Store failed transaction in Redis
        await RedisClient.set(
          `checkout:${checkoutRequestID}:failed`,
          JSON.stringify({ ResultCode: result_code, ResultDesc: error_message, timestamp: Date.now() }),
          3600
        );

        // Get order details from Redis to mark as failed
        const checkoutData = await RedisClient.get(`checkout:${checkoutRequestID}`);
        if (checkoutData) {
          const { orderId } = JSON.parse(checkoutData);
          await Order.findByIdAndUpdate(orderId, { paymentStatus: "failed" });
          await RedisClient.del(`checkout:${checkoutRequestID}`);
        }

        return res.json({ ResultCode: result_code, ResultDesc: error_message });
      }

      // Payment successful
      const body = callbackData.Body.stkCallback.CallbackMetadata;
      const amount = body.Item.find(obj => obj.Name === 'Amount').Value;
      const mpesaCode = body.Item.find(obj => obj.Name === 'MpesaReceiptNumber').Value;
      const phone = body.Item.find(obj => obj.Name === 'PhoneNumber').Value;

      console.log(`Transaction Successful: ${amount}, ${mpesaCode}, ${phone}`);

      // Get order details from Redis
      const checkoutData = await RedisClient.get(`checkout:${checkoutRequestID}`);
      if (!checkoutData) {
        console.error(`No checkout data found for ${checkoutRequestID}`);
        return res.json({ ResultCode: 1, ResultDesc: "Order not found" });
      }

      const { orderId } = JSON.parse(checkoutData);

      // Update order status to completed
      const order = await Order.findByIdAndUpdate(
        orderId,
        { paymentStatus: "completed" },
        { new: true }
      );

      // Create payment record
      const payment = new Payment({
        orderId,
        mpesaReceiptNumber: mpesaCode,
        phoneNumber: phone,
        amount,
        status: "completed",
        paymentMethod: "mpesa"
      });
      await payment.save();

      // Store successful transaction in Redis
      await RedisClient.set(
        `checkout:${checkoutRequestID}:success`,
        JSON.stringify({ orderId, mpesaCode, amount, phone, timestamp: Date.now() }),
        86400 // Keep for 24 hours
      );

      // Clean up the initial checkout entry
      await RedisClient.del(`checkout:${checkoutRequestID}`);

      console.log(`Order ${orderId} marked as completed. Payment recorded.`);
      return res.json({ ResultCode: 0, ResultDesc: "Success" });

    } catch (error) {
      console.error(`Callback processing error: ${error}`);
      return res.status(500).json({ ResultCode: 1, ResultDesc: "Processing failed" });
    }
  });

  // Check payment status using CheckoutRequestID
  static OrderStatus = asyncHandler(async (req, res) => {
    const { checkoutRequestID } = req.params;

    if (!checkoutRequestID) {
      return res.status(400).json({ message: "checkoutRequestID is required" });
    }

    try {
      // Check for successful transaction
      let transactionData = await RedisClient.get(`checkout:${checkoutRequestID}:success`);
      if (transactionData) {
        const data = JSON.parse(transactionData);
        const order = await Order.findById(data.orderId);
        return res.status(200).json({
          status: "completed",
          message: "Payment successful",
          orderId: data.orderId,
          mpesaReceiptNumber: data.mpesaCode,
          amount: data.amount,
          orderDetails: order
        });
      }

      // Check for failed transaction
      transactionData = await RedisClient.get(`checkout:${checkoutRequestID}:failed`);
      if (transactionData) {
        const data = JSON.parse(transactionData);
        return res.status(200).json({
          status: "failed",
          message: "Payment failed",
          resultCode: data.ResultCode,
          resultDesc: data.ResultDesc
        });
      }

      // Check if still pending
      transactionData = await RedisClient.get(`checkout:${checkoutRequestID}`);
      if (transactionData) {
        return res.status(200).json({
          status: "pending",
          message: "Payment pending. Awaiting customer action."
        });
      }

      // Not found in Redis, try database by searching for order with this checkoutRequestID
      // Note: checkoutRequestID is stored in Redis, not in payment records
      // If we need to search by mpesaReceiptNumber, we'd need a different identifier
      // For now, return not found since checkoutRequestID is not stored in payment records

      return res.status(404).json({
        message: "Transaction not found"
      });

    } catch (error) {
      console.error(`Error checking order status: ${error}`);
      return res.status(500).json({ message: "Error checking status", error: error.message });
    }
  });
}

export default MpesaCallbackController;
