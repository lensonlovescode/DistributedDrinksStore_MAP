import Order from '../models/Order.js';
import RedisClient from '../services/redis.js';

class MpesaCallbackController {
  static async MpesaCallback(req, res) {
    try {
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

      // Store the Transactio/payment in mongodb


      console.log(`Transaction Successful: ${amount}, ${mpesaCode}, ${phone}`);
      await RedisClient.set(
        checkoutRequestID,
        JSON.stringify({ ResultCode: result_code, ResultDesc: "Success" }),
        300
      );

      const order = await Order.findOneAndUpdate(
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

      return res.json({ ResultCode: 0, ResultDesc: "Success" });


    } catch (error) {
      console.error(`Callback processing error: ${error}`);
      return res.status(500).json({ ResultCode: 1, ResultDesc: "Processing failed" });
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

      const order = await Order.findOne({ checkoutRequestID: checkoutRequestID });
      if (!order) {
        return res.status(404).json({ message: 'Order not found.' });
      }

      await RedisClient.del(checkoutRequestID);

      return res.status(200).json({
        status: 'success',
        order: {
          orderID: order._id,
          drink: order.drink,
          quantity: order.quantity,
          total: order.total,
          branch: order.branch,
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
