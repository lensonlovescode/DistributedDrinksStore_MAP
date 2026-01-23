import Order from '../models/Order.js';
import RedisClient from '../services/redis.js';
import { reduceStock } from '../utils/StockManager.js';
import Product from '../models/Product.js'; // Needed if we need to manually fetch product/branch later
import Branch from '../models/Branch.js'; // Needed if we need to manually fetch product/branch later

class MpesaCallbackController {
  static async MpesaCallback(req, res) {
    const callbackData = req.body;
    const result_code = callbackData.Body.stkCallback.ResultCode;
    const checkoutRequestID = callbackData.Body.stkCallback.CheckoutRequestID;

    if (result_code !== 0) {
      const error_message = callbackData.Body.stkCallback.ResultDesc;
      console.log(`Payment failed: ${error_message}`);
      await RedisClient.set(
        checkoutRequestID,
        JSON.stringify({ ResultCode: result_code, ResultDesc: error_message, }),
        300
      );
      return res.json({ ResultCode: result_code, ResultDesc: error_message });
    }

    const body = callbackData.Body.stkCallback.CallbackMetadata;
    const amount = body.Item.find(obj => obj.Name === 'Amount').Value;
    const mpesaCode = body.Item.find(obj => obj.Name === 'MpesaReceiptNumber').Value;
    const phone = body.Item.find(obj => obj.Name === 'PhoneNumber').Value;
    const transactionDate = body.Item.find(obj => obj.Name === 'TransactionDate').Value;

    try {
      // Find the order and populate drink and branch to get names for reduceStock
      const orderToProcess = await Order.findOne({ checkoutRequestID: checkoutRequestID })
                                          .populate('drink')
                                          .populate('branch');

      if (!orderToProcess) {
        console.error(`Order not found for checkoutRequestID: ${checkoutRequestID}`);
        await RedisClient.set(checkoutRequestID, JSON.stringify({ ResultCode: 1, ResultDesc: "Order not found" }), 300);
        return res.status(404).json({ ResultCode: 1, ResultDesc: "Order not found for callback." });
      }

      // Reduce stock after successful payment
      await reduceStock(orderToProcess.branch.name, orderToProcess.drink.name, orderToProcess.quantity);

      // Update the order as paid
      const updatedOrder = await Order.findOneAndUpdate(
        { checkoutRequestID: checkoutRequestID },
        { 
          paid: 'Yes',
          'payment.amount': amount,
          'payment.mpesaCode': mpesaCode,
          'payment.phone': phone,
          'payment.transactionDate': transactionDate
        },
        { new: true }
      );

      console.log(`Transaction Successful and Stock Reduced: ${amount}, ${mpesaCode}, ${phone}`);
      await RedisClient.set(
        checkoutRequestID,
        JSON.stringify({ ResultCode: result_code, ResultDesc: "Success", stockReduced: true }),
        300
      );

      return res.json({ ResultCode: 0, ResultDesc: "Success" });

    } catch (error) {
      console.error(`Callback processing error (stock or order update): ${error}`);
      // If stock reduction fails or order update fails, payment might have gone through but our system didn't process it fully.
      // Mark as internal error for now.
      await RedisClient.set(
        checkoutRequestID,
        JSON.stringify({ ResultCode: 1, ResultDesc: `Processing failed: ${error.message}` }),
        300
      );
      return res.status(500).json({ ResultCode: 1, ResultDesc: `Processing failed: ${error.message}` });
    }
  }
  static async OrderStatus(req, res) {
    const { checkoutRequestID } = req.params;
    try {
      const status = await RedisClient.get(checkoutRequestID);
      if (!status) {
        return res.status(404).json({ message: 'Order status not found or expired.' });
      }

      const statusData = JSON.parse(status);
      if (statusData.ResultCode !== 0) {
        return res.status(200).json({ status: 'failed', description: statusData.ResultDesc });
      }

      const order = await Order.findOne({ checkoutRequestID: checkoutRequestID }).populate('drink').populate('branch');
      if (!order) {
        return res.status(404).json({ message: 'Order not found.' });
      }

      await RedisClient.del(checkoutRequestID);

      return res.status(200).json({
        status: 'success',
        order: {
          orderID: order._id,
          drink: order.drink.name,
          quantity: order.quantity,
          total: order.total,
          branch: order.branch.name,
          paid: order.paid,
        },
        transaction: {
          amount: order.payment.amount,
          mpesaCode: order.payment.mpesaCode,
          transactionDate: order.payment.transactionDate,
          phone: order.payment.phone,
        }
      });
    } catch (error) {
      console.error(`Order status error: ${error}`);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }
}

export default MpesaCallbackController;
