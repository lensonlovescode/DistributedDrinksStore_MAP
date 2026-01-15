import moment from "moment";
import redisClient from "../services/redis.js";


async function STKpush(passkey, phonenumber, BusinessShortCode, AccessToken) {
  const Timestamp = moment().format("YYYYMMDDHHmmss");
  console.log(`Using Timestamp: ${Timestamp} as type ${typeof(Timestamp)}`)
  console.log(`Using BusinessShortCode: ${BusinessShortCode} as type ${typeof(BusinessShortCode)}`)
  console.log(`Using Phone Number: ${phonenumber} as type ${typeof(phonenumber)}`)
  console.log
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

  fetch("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
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
      return ({ "error": errorMessage })
    } else {
      // Continue from here
    }
  })
  .catch((error) => {
    console.log(`Got an Error from STK Push: ${error}`);
    console.error
  });
}

export default STKpush;
