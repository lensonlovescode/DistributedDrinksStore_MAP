async function STKpush(passkey, phonenumber, BusinessShortCode, AccessToken) {
  
  const Timestamp = Date().toISOString().replace('/[^0-9]/g', '').slice(0, 14);
  const payload = {
    "Password": Buffer.from(`${BusinessShortCode}${passkey}+${Timestamp}`, 'utf8').toString('base64'),
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
  };

  fetch("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AccessToken}`
    },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
}

export default STKpush;