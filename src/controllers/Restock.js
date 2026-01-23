import Stock from "../models/Stock.js";

export const handleRestock = async (req, res) => {
  const { location, brand, quantity } = req.query;

  const amount = parseInt(quantity);
  if (!location || !brand || isNaN(amount)) {
    return res.status(400).json({
      message:
        "Invalid parameters. Please provide location, brand, and a numeric quantity.",
    });
  }

  try {
    const updatedStock = await Stock.findOneAndUpdate(
      { branch: location, drink: brand },
      { $inc: { quantity: amount } },
      { new: true, upsert: true },
    );

    res.status(200).json({
      message: "Stock updated successfully",
      data: {
        location: updatedStock.branch,
        brand: updatedStock.drink,
        newTotal: updatedStock.quantity,
      },
    });
  } catch (error) {
    console.log(`${error}`)
    res.status(500).json({ message: "Error updating stock", error: error.message });
  }
};
