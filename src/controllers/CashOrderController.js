// In the mobile app of the admin, the admin fetches pending orders every 5 seconds
// If there is a pending cash order, the admin confirms the order in the app
class CashOrderController {
  static async CashOrderCustomer(req, res) {
    // adds a cash order to the database with paid - no
    try {
      const { orderId, amount, customerName } = req.body;

      return res.status(200).json({
        message: "Cash order received successfully",
        orderDetails: {
          orderId,
          amount,
          customerName,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }
  static FetchPendingOrdersAdmin(req, res) {
    // Admin fetches cash orders that are pending and once confirmed they are recorded into the db as paid and complete
    return this.CashOrderCustomer(req, res);
  }
}

export default CashOrderController;