# API Documentation

This document provides details on the API endpoints for the Distributed Drinks Store.

---

## Endpoints

### 1. M-Pesa STK Push

Initiates an M-Pesa STK push to the user's phone for payment.

- **URL:** `/mpesapush`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "phone": "2547XXXXXXXX",
    "drink": "Coca-Cola",
    "quantity": 2,
    "total": 100,
    "branch": "Nairobi"
  }
  ```
- **Success Response:**
  - **Code:** `200 OK`
  ```json
  {
    "status": "Success. Request accepted for processing",
    "CheckoutRequestID": "ws_CO_XXXXXXXXXXXXXX"
  }
  ```
- **Error Response:**
  - **Code:** `400 Bad Request`
  ```json
  {
    "message": "Missing required fields: phone, drink, quantity, total, branch"
  }
  ```
  - **Code:** `500 Internal Server Error`
  ```json
  {
    "erorr": "some_error",
    "message": "some_message"
  }
  ```

---

### 2. M-Pesa Callback

This is a callback endpoint that M-Pesa calls after the user has completed the payment. It should not be called directly by the client.

- **URL:** `/mpesa-express-callback`
- **Method:** `POST`
- **Request Body (from M-Pesa):**
  - Contains M-Pesa transaction details.
- **Success Response:**
  - **Code:** `200 OK`
  ```json
  {
    "ResultCode": 0,
    "ResultDesc": "Success"
  }
  ```
- **Error Response:**
  - **Code:** `200 OK` (but with a non-zero ResultCode)
  ```json
  {
    "ResultCode": 1,
    "ResultDesc": "The balance is insufficient for the transaction"
  }
  ```
  - **Code:** `500 Internal Server Error`
  ```json
  {
    "ResultCode": 1,
    "ResultDesc": "Processing failed"
  }
  ```
---

### 3. Order Status

Retrieves the status of an order using the `CheckoutRequestID` from the M-Pesa STK push.

- **URL:** `/order-status/:checkoutRequestID`
- **Method:** `GET`
- **URL Parameters:**
  - `checkoutRequestID` (string, required): The CheckoutRequestID from the M-Pesa STK push.
- **Success Response:**
  - **Code:** `200 OK`
  ```json
  {
    "status": "success",
    "order": {
      "orderID": "60d... (mongodb_id)",
      "drink": "Coca-Cola",
      "quantity": 2,
      "total": 100,
      "branch": "Nairobi",
      "paid": "Yes"
    },
    "transaction": {
      "amount": 100,
      "mpesaCode": "QWERTYUIOP",
      "transactionDate": "2022-01-01T12:00:00Z",
      "phone": "2547XXXXXXXX"
    }
  }
  ```
- **Error Response:**
  - **Code:** `404 Not Found`
  ```json
  {
    "message": "Order status not found or expired."
  }
  ```
  - **Code:** `200 OK` (if payment failed)
  ```json
  {
    "status": "failed",
    "description": "The balance is insufficient for the transaction"
  }
  ```
  - **Code:** `500 Internal Server Error`
  ```json
  {
    "message": "Internal server error."
  }
  ```

---

### 4. Cash Order

Creates a new cash order.

- **URL:** `/cashorder`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "drink": "Coca-Cola",
    "quantity": 2,
    "total": 100,
    "branch": "Nairobi"
  }
  ```
- **Success Response:**
  - **Code:** `201 Created`
  ```json
  {
    "status": "success",
    "order": {
      "orderID": "60d... (mongodb_id)",
      "drink": "Coca-Cola",
      "quantity": 2,
      "total": 100,
      "branch": "Nairobi",
      "paid": "No"
    },
    "transaction": {
      "method": "Cash"
    }
  }
  ```
- **Error Response:**
  - **Code:** `400 Bad Request`
  ```json
  {
    "message": "Missing required fields: drink, quantity, total, branch"
  }
  ```
  - **Code:** `500 Internal Server Error`
  ```json
  {
    "message": "Internal Server Error",
    "error": "some_error_message"
  }
  ```
