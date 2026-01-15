import STKpush from "../utils/STKpush.js"
import GetAccessToken from "../utils/GetAccessToken.js"; 
import RedisClient from "../services/redis.js";


class MpesaController {
  static async MpesaMainPush(req, res) {
    const PhoneNumber = req.body.phoneNumber;

    let AccessToken = await RedisClient.get("AccessToken");
    console.log(`AccessToken From Redis is: ${AccessToken}`);
    if (!AccessToken) {
      console.log(`Getting new AccessToken`)
      AccessToken = await GetAccessToken();
    }
    console.log(`Using passey: ${process.env.PASSKEY}`)
    STKpush(process.env.PASSKEY, PhoneNumber, 4224044, AccessToken)
  }
}

export default MpesaController
