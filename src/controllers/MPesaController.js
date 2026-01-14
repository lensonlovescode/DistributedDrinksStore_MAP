import STKpush from "../utils/STKpush.js"
import GetAccessToken from "../utils/GetAccessToken.js"; 
import RedisClient from "../services/redis.js";


class MpesaController {
  static async MpesaMainPush(req, res) {
    const PhoneNumber = req.body.phoneNumber;

    let AccessToken = await RedisClient.get("AcessToken");
    if (AccessToken == null) {
      AccessToken = await GetAccessToken();
    }
    STKpush(process.env.PASSKEY, PhoneNumber, 4224044, AccessToken)
  }
}

export default MpesaController
