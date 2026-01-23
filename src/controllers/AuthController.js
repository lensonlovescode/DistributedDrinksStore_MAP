import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

class AuthController {
  /**
   * ============================
   * REGISTER (ADMIN / CUSTOMER)
   * ============================
   */
  static async register(req, res) {
    try {
      let { name, username, email, password, role } = req.body;

      if (!name || !email || !password || !username) { // Added username to required fields
        return res.status(400).json({
          message: "Name, username, email and password are required",
        });
      }

      email = email.toLowerCase();

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          message: "User already exists with that email", // More specific message
        });
      }
      
      const existingUsername = await User.findOne({ username }); // Check for existing username
      if (existingUsername) {
        return res.status(409).json({
          message: "User already exists with that username",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({
        name,
        username,
        email,
        password: hashedPassword,
        role: role || "customer",
      });

      await user.save();

      return res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Error during registration:", error); // Added logging
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }

  /**
   * ============================
   * LOGIN (ADMIN / CUSTOMER)
   * ============================
   */
  static async login(req, res) {
    try {
      let { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: "Email and password are required",
        });
      }

      if (!process.env.JWT_SECRET) {
        return res.status(500).json({
          message: "JWT configuration missing",
        });
      }

      email = email.toLowerCase();

      const user = await User.findOne({ email }).select('+password'); // Select password explicitly
      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
      );

      return res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Error during login:", error); // Added logging
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }
}

export default AuthController;
