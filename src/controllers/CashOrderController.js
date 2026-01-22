import Order from '../models/Order.js';

class CashOrderController {
  static async CashOrderCustomer(req, res) {
    // adds a cash order to the database with paid - no
    try {
      const { drink, quantity, total, branch } = req.body;

      if (!drink || !quantity || !total || !branch) {
        return res.status(400).json({ message: "Missing required fields: drink, quantity, total, branch" });
      }

      const order = new Order({
        drink,
        quantity,
        total,
        branch,
        paid: 'No',
        payment: {
          method: 'Cash'
        }
      });

      await order.save();

      return res.status(201).json({
        status: "success",
        order: {
          orderID: order._id,
          drink: order.drink,
          quantity: order.quantity,
          total: order.total,
          branch: order.branch,
          paid: order.paid,
        },
        transaction: {
          method: order.payment.method,
        }
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }
}

export default CashOrderController;
