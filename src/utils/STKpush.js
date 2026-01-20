import moment from "moment";
import redisClient from "../services/redis.js";


async function STKpush(passkey, phonenumber, BusinessShortCode, AccessToken) {

  const Timestamp = moment().format("YYYYMMDDHHmmss");
  const payload = {
    "BusinessShortCode": BusinessShortCode,
    "Password": `${new Buffer.from(`${BusinessShortCode}${passkey}${Timestamp}`, 'utf8').toString('base64')}`,
    "Timestamp": Timestamp,
    "TransactionType": "CustomerPayBillOnline",
    "Amount": 1,
    "PartyA": phonenumber,
    "PartyB": BusinessShortCode,
    "PhoneNumber": phonenumber,
    "CallBackURL": "https://lensonmutugi.tech/mpesa-express-simulate-callback/",
    "AccountReference": "Test",
    "TransactionDesc": "Test"
  };

  return fetch("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await redisClient.get("AccessToken")}`
    },
    body: JSON.stringify(payload)
  })
  .then((response) => response.json())
  .then((data) => {
    if (data.errorMessage) {
      return ({ "error": "Internal Error Server", "Message": errorMessage })
    } else {
      console.log(data);
      return (data) 
    }
  })
  .catch((error) => {
    console.log(`Unable to perform STK Push: ${error}`);
    return { error: error.message };
  });
}

export default STKpush;
