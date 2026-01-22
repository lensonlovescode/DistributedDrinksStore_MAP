import Order from "../models/Order";

class Serve {
  static async getQuantities(req, res) {
    try {
      const report = await Order.aggregate([
        {
          $group: {
            _id: "$branch",
            totalQuantity: { $sum: "$quantity" },
            totalAmount: { $sum: "$total" },
          },
        },
        {
          $project: {
            _id: 0,
            branch: "$_id",
            quantity: "$totalQuantity",
            total: "$totalAmount",
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error fetching report",
        error: error.message,
      });
    }
  }
}

export default Serve;
