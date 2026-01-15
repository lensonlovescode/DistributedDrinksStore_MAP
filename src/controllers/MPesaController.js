import STKpush from "../utils/STKpush.js"
import GetAccessToken from "../utils/GetAccessToken.js"; 
import RedisClient from "../services/redis.js";


class MpesaController {
  static async MpesaMainPush(req, res) {
    const PhoneNumber = req.body.phone;

    let AccessToken = await RedisClient.get("AccessToken");
    console.log(`AccessToken From Redis is: ${AccessToken}`);
    if (!AccessToken) {
      console.log(`Getting new AccessToken`)
      AccessToken = await GetAccessToken();
    }
    STKpush(process.env.PASSKEY, Number(PhoneNumber), 174379, AccessToken)
  }
}

export default MpesaController
