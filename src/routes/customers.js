import express from 'express';
import Customer from '../models/Customer.js';

const router = express.Router();

// Create customer (signup)
router.post('/signup', async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const customer = new Customer({ name, username, email, password });
    await customer.save();

    res.status(201).json({ message: 'Customer created', customer: { _id: customer._id, name, email, username } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all customers
router.get('/all', async (req, res) => {
  try {
    const customers = await Customer.find().select('-password');
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select('-password');
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update customer
router.patch('/:id', async (req, res) => {
  try {
    const { name, username, email } = req.body;
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, username, email },
      { new: true }
    ).select('-password');
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.status(200).json({ message: 'Customer updated', customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.status(200).json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
