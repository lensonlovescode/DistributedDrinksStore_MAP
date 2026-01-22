# Migration Guide: MongoDB to Firebase Firestore

This guide outlines the steps needed to migrate from MongoDB/Mongoose to Firebase Firestore.

## Overview

Your application currently uses:
- **MongoDB** with **Mongoose** ODM
- **7 Mongoose Models**: Product, Customer, Admin, Order, Branch, BranchStock, Payment
- **Mongoose operations**: find, findOne, findById, findByIdAndUpdate, populate, save
- **ObjectId references** between collections

## Migration Steps

### 1. Install Firebase Dependencies

```bash
npm install firebase-admin
```

Remove MongoDB dependencies (optional, after migration is complete):
```bash
npm uninstall mongoose mongodb
```

### 2. Set Up Firebase Project

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Generate a service account key:
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file securely
4. Add the service account key path to your `.env`:
   ```
   FIREBASE_SERVICE_ACCOUNT_KEY=/path/to/serviceAccountKey.json
   ```

### 3. Replace Database Connection (`src/services/db.js`)

**Current MongoDB implementation:**
```javascript
import mongoose from 'mongoose';

class DBClient {
  async connect() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/distributed_drinks_store';
    await mongoose.connect(mongoUri);
  }
}
```

**New Firebase implementation:**
```javascript
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

class DBClient {
  constructor() {
    this.connected = false;
  }

  async connect() {
    try {
      if (this.connected) return;

      // Initialize Firebase Admin if not already initialized
      if (!admin.apps.length) {
        const serviceAccount = JSON.parse(
          readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'utf8')
        );

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      }

      this.db = admin.firestore();
      this.connected = true;
      console.log('✅ Firebase Connected');
    } catch (error) {
      console.error('❌ Firebase Connection Error:', error.message);
      throw error;
    }
  }

  async disconnect() {
    // Firebase Admin SDK doesn't require explicit disconnection
    // But you can mark as disconnected
    this.connected = false;
    console.log('✅ Firebase Disconnected');
  }

  isConnected() {
    return this.connected;
  }

  getDB() {
    return this.db;
  }
}

export default new DBClient();
```

### 4. Convert Mongoose Models to Firestore Collections

Firestore doesn't use schemas like Mongoose. You'll need to:

#### Option A: Create Firestore Helper Functions

Create `src/services/firestore.js`:
```javascript
import dbClient from './db.js';

class FirestoreService {
  // Generic CRUD operations
  async create(collection, data) {
    const db = dbClient.getDB();
    const docRef = await db.collection(collection).add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { id: docRef.id, ...data };
  }

  async findById(collection, id) {
    const db = dbClient.getDB();
    const doc = await db.collection(collection).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  async findOne(collection, query) {
    const db = dbClient.getDB();
    let queryRef = db.collection(collection);
    
    Object.keys(query).forEach(key => {
      queryRef = queryRef.where(key, '==', query[key]);
    });
    
    const snapshot = await queryRef.limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  async find(collection, query = {}) {
    const db = dbClient.getDB();
    let queryRef = db.collection(collection);
    
    Object.keys(query).forEach(key => {
      queryRef = queryRef.where(key, '==', query[key]);
    });
    
    const snapshot = await queryRef.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async update(collection, id, data) {
    const db = dbClient.getDB();
    await db.collection(collection).doc(id).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return this.findById(collection, id);
  }

  async delete(collection, id) {
    const db = dbClient.getDB();
    await db.collection(collection).doc(id).delete();
  }
}

export default new FirestoreService();
```

#### Option B: Create Model Classes (Recommended)

Create model classes that wrap Firestore operations, similar to Mongoose models:

**Example: `src/models/Product.js`**
```javascript
import firestoreService from '../services/firestore.js';

class Product {
  constructor(data) {
    this.name = data.name;
    this.price = data.price;
    this.description = data.description;
    this.category = data.category;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static async create(data) {
    return await firestoreService.create('products', data);
  }

  static async findById(id) {
    return await firestoreService.findById('products', id);
  }

  static async findOne(query) {
    return await firestoreService.findOne('products', query);
  }

  static async find(query = {}) {
    return await firestoreService.find('products', query);
  }

  static async findByIdAndUpdate(id, data) {
    return await firestoreService.update('products', id, data);
  }

  async save() {
    if (this.id) {
      return await firestoreService.update('products', this.id, this);
    } else {
      const result = await firestoreService.create('products', this);
      this.id = result.id;
      return result;
    }
  }
}

export default Product;
```

### 5. Handle References (Replace `.populate()`)

Mongoose's `.populate()` doesn't exist in Firestore. You have two options:

#### Option A: Manual Population
```javascript
// Instead of:
const order = await Order.findById(orderId)
  .populate("customerId", "name email phoneNumber")
  .populate("branchId", "name location");

// Do:
const order = await Order.findById(orderId);
const customer = await Customer.findById(order.customerId);
const branch = await Branch.findById(order.branchId);
order.customer = { name: customer.name, email: customer.email, phoneNumber: customer.phoneNumber };
order.branch = { name: branch.name, location: branch.location };
```

#### Option B: Denormalization (Store related data in documents)
```javascript
// Store customer name/email directly in Order document
const order = {
  customerId: "customer123",
  customerName: "John Doe",
  customerEmail: "john@example.com",
  branchId: "branch456",
  branchName: "Downtown Branch",
  // ... other fields
};
```

### 6. Update Controllers

You'll need to update all controllers. Here's an example transformation:

**Before (MongoDB):**
```javascript
const order = await Order.findById(orderId)
  .populate("customerId", "name email phoneNumber");
await order.save();
```

**After (Firebase):**
```javascript
const order = await Order.findById(orderId);
const customer = await Customer.findById(order.customerId);
order.customer = { name: customer.name, email: customer.email, phoneNumber: customer.phoneNumber };
await order.save();
```

### 7. Handle Transactions

Firestore supports transactions but syntax is different:

**Before (MongoDB):**
```javascript
await BranchStock.findOneAndUpdate(
  { branchId: order.branchId, productId: item.productId },
  { $inc: { quantity: -item.quantity } }
);
```

**After (Firebase):**
```javascript
const db = dbClient.getDB();
const stockRef = db.collection('branchStocks')
  .where('branchId', '==', order.branchId)
  .where('productId', '==', item.productId);

await db.runTransaction(async (transaction) => {
  const snapshot = await transaction.get(stockRef);
  const stockDoc = snapshot.docs[0];
  const newQuantity = stockDoc.data().quantity - item.quantity;
  transaction.update(stockDoc.ref, { quantity: newQuantity });
});
```

### 8. Update Query Patterns

| Mongoose | Firestore |
|----------|-----------|
| `Model.find({ field: value })` | `db.collection('model').where('field', '==', value).get()` |
| `Model.findOne({ field: value })` | `db.collection('model').where('field', '==', value).limit(1).get()` |
| `Model.findById(id)` | `db.collection('model').doc(id).get()` |
| `Model.findByIdAndUpdate(id, data)` | `db.collection('model').doc(id).update(data)` |
| `Model.findOneAndUpdate(query, data)` | Use transaction or query + update |
| `new Model(data).save()` | `db.collection('model').add(data)` |
| `Model.populate()` | Manual fetch or denormalization |

### 9. Collection Names Mapping

| Mongoose Model | Firestore Collection |
|----------------|---------------------|
| Product | `products` |
| Customer | `customers` |
| Admin | `admins` |
| Order | `orders` |
| Branch | `branches` |
| BranchStock | `branchStocks` |
| Payment | `payments` |

### 10. Update Environment Variables

Replace in `.env`:
```bash
# Remove:
MONGODB_URI=mongodb://localhost:27017/distributed_drinks_store

# Add:
FIREBASE_SERVICE_ACCOUNT_KEY=./path/to/serviceAccountKey.json
```

### 11. Update Server Initialization

**Before:**
```javascript
dbClient.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
  });
});
```

**After:**
```javascript
await dbClient.connect();
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
```

## Key Differences to Consider

### 1. **No Native Joins**
- Firestore doesn't support joins
- Use manual population or denormalize data

### 2. **Query Limitations**
- Firestore queries are more limited than MongoDB
- Complex queries may require multiple reads or data restructuring
- Indexes must be created for compound queries

### 3. **Data Types**
- Firestore uses different data types
- Dates: Use `admin.firestore.Timestamp` or `FieldValue.serverTimestamp()`
- ObjectIds: Use Firestore document IDs (strings)

### 4. **Transactions**
- Firestore transactions are different syntax
- All reads must happen before writes in a transaction

### 5. **Real-time Updates**
- Firestore supports real-time listeners (bonus feature!)
- Can use `.onSnapshot()` for live updates

## Migration Checklist

- [ ] Install Firebase Admin SDK
- [ ] Set up Firebase project and service account
- [ ] Replace `src/services/db.js` with Firebase connection
- [ ] Create Firestore service helper or model classes
- [ ] Convert all 7 Mongoose models to Firestore collections
- [ ] Update all controllers to use Firestore queries
- [ ] Replace `.populate()` calls with manual population or denormalization
- [ ] Update transaction logic
- [ ] Update environment variables
- [ ] Test all endpoints
- [ ] Migrate existing data (if needed)
- [ ] Update documentation

## Data Migration

If you have existing MongoDB data, you'll need to write a migration script:

```javascript
import mongoose from 'mongoose';
import admin from 'firebase-admin';

// Connect to both databases
await mongoose.connect(MONGODB_URI);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Migrate each collection
const products = await mongoose.model('Product').find({});
for (const product of products) {
  await db.collection('products').doc(product._id.toString()).set({
    name: product.name,
    price: product.price,
    // ... other fields
  });
}
```

## Testing

After migration:
1. Test all CRUD operations
2. Test relationships/references
3. Test transactions
4. Test query performance
5. Verify data integrity

## Additional Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [Firestore Queries](https://firebase.google.com/docs/firestore/query-data/queries)
