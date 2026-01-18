import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Customer from "../models/Customer.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * ============================
 * CUSTOMER SIGNUP (PUBLIC)
 * ============================
 */
router.post("/signup", async (req, res) => {
  try {
    let { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    email = email.toLowerCase();

    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = new Customer({
      name,
      username,
      email,
      password: hashedPassword,
    });

    await customer.save();

    res.status(201).json({
      message: "Customer created successfully",
      customer: {
        id: customer._id,
        name: customer.name,
        username: customer.username,
        email: customer.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ============================
 * CUSTOMER LOGIN (PUBLIC)
 * ============================
 */
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT configuration missing" });
    }

    email = email.toLowerCase();

    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: customer._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        username: customer.username,
        email: customer.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ============================
 * GET LOGGED-IN CUSTOMER
 * ============================
 */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const customer = await Customer.findById(req.user.id).select("-password");
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ============================
 * UPDATE LOGGED-IN CUSTOMER
 * ============================
 */
router.patch("/me", authMiddleware, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, username, email } = req.body;

    if (!name && !username && !email) {
      return res.status(400).json({ error: "No data provided for update" });
    }

    const updates = {};
    if (name) updates.name = name;
    if (username) updates.username = username;
    if (email) updates.email = email.toLowerCase();

    const customer = await Customer.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true }
    ).select("-password");

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.status(200).json({
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ============================
 * DELETE LOGGED-IN CUSTOMER
 * ============================
 */
router.delete("/me", authMiddleware, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const customer = await Customer.findByIdAndDelete(req.user.id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
