import Order from "../models/Order.js";

export const getSalesSummary = async (req, res) => {
  const locations = ["Nairobi(HQ)", "Kisumu", "Eldoret", "Mombasa", "Nakuru"];

  try {
    const report = await Order.aggregate([
      {
        $match: { paid: "Yes" },
      },
      {
        $facet: {
          totalSales: [
            { $group: { _id: "$drink", totalSold: { $sum: "$quantity" } } },
          ],
          byBranch: [
            {
              $group: {
                _id: { branch: "$branch", drink: "$drink" },
                totalSold: { $sum: "$quantity" },
              },
            },
          ],
        },
      },
    ]);

    const salesData = {
      All: report[0].totalSales.map((item) => ({
        brand: item._id,
        totalSold: item.totalSold,
      })),
    };

    locations.forEach((loc) => {
      salesData[loc] = report[0].byBranch
        .filter((item) => item._id.branch === loc)
        .map((item) => ({ brand: item._id.drink, totalSold: item.totalSold }));
    });

    res.status(200).json({
      locations,
      salesData,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching sales summary", error: error.message });
  }
};
