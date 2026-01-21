# API Testing Guide - Distributed Drinks Store

## Prerequisites

Before testing, ensure these services are running:

1. **MongoDB** - For database
   ```bash
   mongodb
   ```

2. **Redis** - For caching & payment state
   ```bash
   redis-server
   ```

3. **Node.js Server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

4. **Environment Variables** - Create `.env` file:
   ```
   PORT=5000
   PASSKEY=your_mpesa_passkey
   CONSUMER_KEY=your_mpesa_consumer_key
   CONSUMER_SECRET=your_mpesa_consumer_secret
   ```

---

## Testing Order (Follow This Sequence)

### 1. Create Sample Data (Database Setup)

#### Create a Customer
```bash
curl -X POST http://localhost:5000/customer \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepass123",
    "phoneNumber": "254712345678"
  }'
```

**Note:** You'll need to create a Customer endpoint in CustomerController. For now, use MongoDB directly or test with existing customer IDs.

#### Create Branches
```bash
curl -X POST http://localhost:5000/branch \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Downtown Branch",
    "location": "Nairobi CBD",
    "isHeadquarter": true
  }'
```

#### Create Products
```bash
curl -X POST http://localhost:5000/product \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Coca Cola 500ml",
    "price": 100,
    "description": "Cold carbonated drink",
    "category": "Soft Drinks"
  }'
```

---

### 2. Test Restocking API

#### Add Stock (Restock drinks)
```bash
curl -X POST http://localhost:5000/restock \
  -H "Content-Type: application/json" \
  -d '{
    "branchId": "BRANCH_ID_HERE",
    "productId": "PRODUCT_ID_HERE",
    "quantity": 50
  }'
```

**Expected Response:**
```json
{
  "message": "Stock updated successfully",
  "branchId": "...",
  "productId": "...",
  "totalQuantity": 50,
  "addedQuantity": 50
}
```

#### Check Branch Stock
```bash
curl http://localhost:5000/branch/BRANCH_ID_HERE/stock
```

#### Check Specific Product Stock
```bash
curl http://localhost:5000/branch/BRANCH_ID_HERE/product/PRODUCT_ID_HERE/stock
```

#### Get Low Stock Items
```bash
curl http://localhost:5000/branch/BRANCH_ID_HERE/low-stock
```

---

### 3. Test Order API

#### Create an Order (for M-Pesa payment)
```bash
curl -X POST http://localhost:5000/order \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUSTOMER_ID_HERE",
    "branchId": "BRANCH_ID_HERE",
    "paymentMethod": "mpesa",
    "items": [
      {
        "productId": "PRODUCT_ID_HERE",
        "productName": "Coca Cola 500ml",
        "quantity": 2,
        "price": 100,
        "subtotal": 200
      }
    ]
  }'
```

**Save the `orderId` from response for next steps.**

**Expected Response:**
```json
{
  "message": "Order created successfully",
  "orderId": "64a5f2b1c3d4e5f6g7h8i9j0",
  "totalAmount": 200,
  "paymentStatus": "pending"
}
```

#### Get Order Details
```bash
curl http://localhost:5000/order/ORDER_ID_HERE
```

#### Get Customer's Orders
```bash
curl http://localhost:5000/customer/CUSTOMER_ID_HERE/orders
```

---

### 4. Test M-Pesa Payment Flow

#### Step 1: Initiate STK Push (trigger payment prompt)
```bash
curl -X POST http://localhost:5000/mpesapush \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "254712345678",
    "orderId": "ORDER_ID_FROM_STEP_3"
  }'
```

**Expected Response:**
```json
{
  "status": "Success. Request accepted for processing.",
  "CheckoutRequestID": "ws_co_123456789",
  "orderId": "64a5f2b1c3d4e5f6g7h8i9j0",
  "message": "STK push sent to customer's phone"
}
```

**Save the `CheckoutRequestID` for testing callback.**

#### Step 2: Simulate M-Pesa Callback (test payment completion)
```bash
curl -X POST http://localhost:5000/mpesa-express-simulate-callback \
  -H "Content-Type: application/json" \
  -d '{
    "Body": {
      "stkCallback": {
        "CheckoutRequestID": "ws_co_123456789",
        "ResultCode": 0,
        "ResultDesc": "The user has successfully entered their M-Pesa PIN.",
        "CallbackMetadata": {
          "Item": [
            {
              "Name": "Amount",
              "Value": 200
            },
            {
              "Name": "MpesaReceiptNumber",
              "Value": "LXX2NTXB6Y"
            },
            {
              "Name": "PhoneNumber",
              "Value": 254712345678
            }
          ]
        }
      }
    }
  }'
```

**Expected Response:**
```json
{
  "ResultCode": 0,
  "ResultDesc": "Success"
}
```

#### Step 3: Check Payment Status
```bash
curl http://localhost:5000/order-status/ws_co_123456789
```

**Expected Response:**
```json
{
  "status": "completed",
  "message": "Payment successful",
  "orderId": "64a5f2b1c3d4e5f6g7h8i9j0",
  "mpesaReceiptNumber": "LXX2NTXB6Y",
  "amount": 200,
  "orderDetails": { ... }
}
```

---

### 5. Test Cash Order Flow

#### Create Cash Order
```bash
curl -X POST http://localhost:5000/cashorder \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUSTOMER_ID_HERE",
    "branchId": "BRANCH_ID_HERE",
    "items": [
      {
        "productId": "PRODUCT_ID_HERE",
        "productName": "Coca Cola 500ml",
        "quantity": 1,
        "price": 100,
        "subtotal": 100
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "message": "Cash order created successfully. Awaiting admin confirmation.",
  "orderId": "64a5f2b2d3e4f5g6h7i8j9k1",
  "totalAmount": 100,
  "paymentStatus": "pending",
  "paymentMethod": "cash"
}
```

#### Admin: Fetch Pending Cash Orders (polls every 5 sec)
```bash
curl http://localhost:5000/branch/BRANCH_ID_HERE/cash-orders/pending
```

**Expected Response:**
```json
{
  "branchId": "...",
  "pendingCount": 1,
  "orders": [ ... ]
}
```

#### Admin: Confirm Cash Order (record payment)
```bash
curl -X PUT http://localhost:5000/cashorder/ORDER_ID_HERE/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "amountReceived": 100
  }'
```

**Expected Response:**
```json
{
  "message": "Cash order confirmed and completed",
  "orderId": "64a5f2b2d3e4f5g6h7i8j9k1",
  "amount": 100,
  "amountReceived": 100,
  "paymentStatus": "completed",
  "paymentId": "..."
}
```

#### Admin: Reject Cash Order
```bash
curl -X PUT http://localhost:5000/cashorder/ORDER_ID_HERE/reject \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Customer does not have ID"
  }'
```

---

## Testing Tools

### Option 1: Using cURL (Terminal)
All examples above use cURL. Save them in a `.sh` file and run.

### Option 2: Using Postman
1. Download Postman: https://www.postman.com/downloads/
2. Create a new collection
3. Import the cURL commands as requests
4. Use variables for IDs (e.g., `{{customerId}}`, `{{branchId}}`)

### Option 3: Using Thunder Client (VS Code)
1. Install "Thunder Client" extension in VS Code
2. Create requests in the extension directly

### Option 4: Using Insomnia
1. Download Insomnia: https://insomnia.rest/
2. Import/create requests similar to Postman

---

## Key Testing Scenarios

### Scenario 1: Successful M-Pesa Purchase
1. ✅ Create Customer (via MongoDB)
2. ✅ Create Branch (via MongoDB)
3. ✅ Create Product (via MongoDB)
4. ✅ Add Stock (Restock API)
5. ✅ Create Order (Order API)
6. ✅ STK Push (M-Pesa API)
7. ✅ Simulate Payment Callback
8. ✅ Check Status
9. ✅ Verify stock was reduced

### Scenario 2: Cash Payment
1. ✅ Create Order with `paymentMethod: "cash"`
2. ✅ Admin fetches pending orders
3. ✅ Admin confirms payment
4. ✅ Verify order marked completed

### Scenario 3: Low Stock Alert
1. ✅ Add product with quantity = 5
2. ✅ Set `reorderLevel: 10`
3. ✅ Call `/branch/:branchId/low-stock`
4. ✅ Verify product appears in low stock

---

## Debugging Tips

### Check Redis
```bash
# Connect to Redis
redis-cli

# Check all keys
KEYS *

# Get specific checkout request
GET checkout:ws_co_123456789

# Delete a key
DEL checkout:ws_co_123456789
```

### Check MongoDB
```bash
# Connect to MongoDB
mongosh

# Use database
use distributed_drinks_store

# List collections
show collections

# View orders
db.orders.find().pretty()

# View payments
db.payments.find().pretty()
```

### Server Logs
Watch the terminal where you ran `npm start` for error messages and debug logs.

---

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Redis Client Error` | Redis not running | Start Redis: `redis-server` |
| `Cannot connect to MongoDB` | MongoDB not running | Start MongoDB: `mongod` |
| `Invalid product quantity` | Stock check failed | Restock product first |
| `Order not found` | Wrong orderId | Use correct ID from create response |
| `Insufficient stock` | Not enough items | Increase stock via restock API |

---

## Next Steps

After basic testing works:
1. Create Customer/Product/Branch endpoints
2. Add authentication (JWT tokens)
3. Add input validation middleware
4. Test with real M-Pesa credentials
5. Load testing with multiple concurrent orders
