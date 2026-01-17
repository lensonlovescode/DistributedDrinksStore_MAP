import express from "express";
import { registerUser } from "../controllers/authController.js";

const router = express.Router();

// Register (Customer or Admin)
router.post("/register", registerUser);

export default router;
