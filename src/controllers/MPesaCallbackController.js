class MpesaCallbackController {
  static async MpesaCallback(req, res) {
    try {
      const callbackData = req.body;
      const result_code = callbackData.Body.stkCallback.ResultCode;

      if (result_code !== 0) {
        const error_message = callbackData.Body.stkCallback.ResultDesc;
        console.log(`Payment failed: ${error_message}`);
      	// (order) redis utility store: ie the transaction failed in the form CheckoutRequestID = { ResultCode: result_code, ResultDesc: error_message }
        // (order) database utility store: remove the transaction with the CheckoutRequestID or mark it as failed
        return res.json({ ResultCode: result_code, ResultDesc: error_message });
      }

      const body = callbackData.Body.stkCallback.CallbackMetadata;
      const amount = body.Item.find(obj => obj.Name === 'Amount').Value;
      const mpesaCode = body.Item.find(obj => obj.Name === 'MpesaReceiptNumber').Value;
      const phone = body.Item.find(obj => obj.Name === 'PhoneNumber').Value;

      console.log(`Transaction Successful: ${amount}, ${mpesaCode}, ${phone}`);
      // (order) redis utility store: ie successful transaction CheckoutRequestID = { ResultCode: result_code, ResultDesc: "success" }
      // (order) database utility store: mark the orderid matching the CheckoutRequestID as paid - yes and complete
      return res.json({ ResultCode: 0, ResultDesc: "Success" });


    } catch (error) {
      console.error(`Callback processing error: ${error}`);
      return res.status(500).json({ ResultCode: 1, ResultDesc: "Processing failed" });
    }
  }
  static async OrderStatus(req, res) {
    // (Order) Checks the status of the payment
    // (Order) redis utility fetch: get the transaction status using the CheckoutRequestID (only if the transaction succeeds, use ResultDesc)
  }
}

export default MpesaCallbackController;
