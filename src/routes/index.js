import express from "express";
import MpesaController from "../controllers/MPesaController.js";
const router = express.Router();

router.post("/mpesapush", MpesaController.MpesaMainPush)

export default router
