import STKpush from "../utils/STKpush.js"
import GetAccessToken from "../utils/GetAccessToken.js"; 
import RedisClient from "../services/redis.js";
import Order from "../models/Order.js";
import Product from '../models/Product.js';
import Branch from '../models/Branch.js';

class MpesaController {
  static async MpesaMainPush(req, res) {
    const { phone, drink, quantity, total, branch } = req.body;

    if (!phone || !drink || !quantity || !total || !branch) {
      return res.status(400).json({ message: "Missing required fields: phone, drink, quantity, total, branch" });
    }

    try {
      let AccessToken = await RedisClient.get("AccessToken");
      console.log(`AccessToken From Redis is: ${AccessToken}`);
      if (!AccessToken) {
        console.log(`Getting new AccessToken`)
        AccessToken = await GetAccessToken();
      }
      const data = await STKpush(process.env.PASSKEY, Number(phone), 174379, AccessToken, total);
      
      if (data.error) {
        res.status(500).json({ "erorr": data.error, "message": data.message })
      } else {
        const productDoc = await Product.findOne({ name: drink });
        const branchDoc = await Branch.findOne({ name: branch });

        const orderDetails = {
          drink: productDoc._id,
          quantity,
          total,
          branch: branchDoc._id,
          paid: "No", // Marked as No initially
          checkoutRequestID: data.CheckoutRequestID,
          payment: {
            method: 'M-Pesa'
          }
        };
        const order = new Order(orderDetails);
        await order.save();
        res.status(200).json({ "status": data.CustomerMessage, "CheckoutRequestID": data.CheckoutRequestID })
      }
    } catch (error) {
      // Catch any errors from AccessToken or STKpush
      console.error(`Error in MpesaMainPush: ${error}`);
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }
}

export default MpesaController
