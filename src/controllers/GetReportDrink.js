import Order from "../models/Order.js";

export const getSodaDetails = async (req, res) => {
  const { location, brand } = req.query;

  if (!location || !brand) {
    return res
      .status(400)
      .json({ message: "Missing location or brand parameters" });
  }

  try {
    const salesMetrics = await Order.aggregate([
      {
        $match: {
          branch: location,
          drink: brand,
          paid: "Yes",
        },
      },
      {
        $group: {
          _id: null,
          totalSold: { $sum: "$quantity" },
          totalRevenue: { $sum: "$total" },
        },
      },
    ]);

    const sold = salesMetrics[0]?.totalSold || 0;
    const revenue = salesMetrics[0]?.totalRevenue || 0;

    res.status(200).json({
      brand,
      location,
      metrics: {
        sold: sold,
        revenueGenerated: revenue,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
