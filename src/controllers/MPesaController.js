import STKpush from "../utils/STKpush.js"
import GetAccessToken from "../utils/GetAccessToken.js"; 
import RedisClient from "../services/redis.js";

class MpesaController {
  static async MpesaMainPush(req, res) {
    const PhoneNumber = req.body.phone;
    // (Order) Generate Order Number with uuid4 and all the order details add parameter paid - yes or no
    // (Order) database utility - Store the order

    let AccessToken = await RedisClient.get("AccessToken");
    console.log(`AccessToken From Redis is: ${AccessToken}`);
    if (!AccessToken) {
      console.log(`Getting new AccessToken`)
      AccessToken = await GetAccessToken();
    }
    const data = await STKpush(process.env.PASSKEY, Number(PhoneNumber), 174379, AccessToken);
    if (data.error) {
      res.status(500).json({ "erorr": data.error, "message": data.message, "OrderNumber": OrderNumber })
    } else {
      // (order) add order to database here with all details and paid - no but and with checkoutRequestID
      res.status(200).json({ "status": data.CustomerMessage, "CheckoutRequestID": data.CheckoutRequestID, "OrderNumber": OrderNumber })
    }
  }
}

export default MpesaController
