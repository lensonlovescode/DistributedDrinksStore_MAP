import { addStock } from '../utils/StockManager.js';

class RestockController {
  static async restockItem(req, res) {
    const { branch, drink, quantity } = req.body;

    if (!branch || !drink || !quantity) {
      return res.status(400).json({ message: "Missing required fields: branch, drink, quantity" });
    }

    if (typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive number." });
    }

    try {
      const updatedStock = await addStock(branch, drink, quantity);
      return res.status(200).json({
        message: "Stock updated successfully",
        branch: branch,
        drink: drink,
        newQuantity: updatedStock.quantity
      });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
}

export default RestockController;
