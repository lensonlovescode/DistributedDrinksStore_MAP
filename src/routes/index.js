import express from "express";
import MpesaController from "../controllers/MPesaController.js";
const router = express.Router();

router.get("/mpesapush", MpesaController.MpesaMainPush)

export default router
