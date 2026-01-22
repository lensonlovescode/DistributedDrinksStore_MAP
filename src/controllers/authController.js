import Customer from "../models/Customer.js";
import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, username, phoneNumber } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    // Determine which model to use based on role
    const isAdmin = role === "admin" || role === "superadmin";
    const UserModel = isAdmin ? Admin : Customer;

    // Check if user exists in the appropriate collection
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: "User already exists"
      });
    }

    // Admin requires username, Customer also has username field
    if (!username) {
      return res.status(400).json({
        message: "Username is required"
      });
    }

    // Check if username already exists
    const existingUsername = await UserModel.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({
        message: "Username already exists"
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user based on role
    if (isAdmin) {
      const admin = new Admin({
        name,
        username,
        email,
        password: hashedPassword,
        role: role || "admin"
      });
      await admin.save();
    } else {
      const customer = new Customer({
        name,
        username,
        email,
        password: hashedPassword,
        phoneNumber: phoneNumber || undefined
      });
      await customer.save();
    }

    res.status(201).json({
      message: "User registered successfully"
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};
