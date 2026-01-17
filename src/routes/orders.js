import express from 'express';
import Order from '../models/Order.js';
import BranchStock from '../models/BranchStock.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';

const router = express.Router();

// Create a new order
router.post('/create', async (req, res) => {
  try {
    const { customerId, branchId, items } = req.body;

    // Validate required fields
    if (!customerId || !branchId || !items || items.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: customerId, branchId, items'
      });
    }

    // Validate customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check stock availability for all items
    for (const item of items) {
      const stock = await BranchStock.findOne({
        branchId,
        productId: item.productId
      });

      if (!stock || stock.quantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for product ${item.productId}. Available: ${stock?.quantity || 0}`
        });
      }
    }

    // Calculate total amount
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.productId} not found` });
      }

      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      processedItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        subtotal
      });
    }

    // Create order
    const order = new Order({
      customerId,
      branchId,
      items: processedItems,
      totalAmount,
      paymentStatus: 'pending',
      paymentMethod: req.body.paymentMethod || 'pending'
    });

    await order.save();

    // Reduce stock for each item
    for (const item of processedItems) {
      await BranchStock.updateOne(
        { branchId, productId: item.productId },
        { $inc: { quantity: -item.quantity } }
      );
    }

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders
router.get('/all', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customerId', 'name email')
      .populate('branchId', 'name location')
      .populate('items.productId', 'name price');

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get orders by customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const orders = await Order.find({ customerId })
      .populate('branchId', 'name location')
      .populate('items.productId', 'name price');

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get orders by branch
router.get('/branch/:branchId', async (req, res) => {
  try {
    const { branchId } = req.params;

    const orders = await Order.find({ branchId })
      .populate('customerId', 'name email')
      .populate('items.productId', 'name price');

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single order
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('customerId', 'name email')
      .populate('branchId', 'name location')
      .populate('items.productId', 'name price');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order payment status
router.patch('/:orderId/payment-status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus, paymentMethod } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({ error: 'paymentStatus is required' });
    }

    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentStatus,
        paymentMethod: paymentMethod || existingOrder.paymentMethod
      },
      { new: true }
    );

    res.status(200).json({
      message: 'Order payment status updated',
      order
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel order and restore stock
router.delete('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Restore stock
    for (const item of order.items) {
      await BranchStock.updateOne(
        { branchId: order.branchId, productId: item.productId },
        { $inc: { quantity: item.quantity } }
      );
    }

    await Order.findByIdAndDelete(orderId);

    res.status(200).json({ message: 'Order cancelled and stock restored' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
