import moment from "moment";
import redisClient from "../services/redis.js";


async function STKpush(passkey, phonenumber, BusinessShortCode, AccessToken) {
  const Timestamp = moment().format("YYYYMMDDHHmmss");
  const payload = JSON.stringify({
    "Password": `${new Buffer.from(`${BusinessShortCode}${passkey}${Timestamp}`, 'utf8').toString('base64')}`,
    "BusinessShortCode": BusinessShortCode,
    "Timestamp": Timestamp,
    "Amount": "1",
    "PartyA": phonenumber,
    "PartyB": "174379",
    "TransactionType": "CustomerPayBillOnline",
    "PhoneNumber": phonenumber,
    "TransactionDesc": "Test",
    "AccountReference": "Test",
    "CallBackURL": "https://lensonmutugi.tech/mpesa-express-simulate-callback/"
  });

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
    console.log(`Error is here: ${data}`)
    console.log(data)
  })
  .catch((error) => {
    console.log(`Got an Error from STK Push: ${error}`);
    console.error
  });
}

export default STKpush;
