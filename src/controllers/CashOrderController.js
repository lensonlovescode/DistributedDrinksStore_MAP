import Order from '../models/Order.js';
import { reduceStock } from '../utils/StockManager.js';
import Product from '../models/Product.js';
import Branch from '../models/Branch.js';

class CashOrderController {
  static async CashOrderCustomer(req, res) {
    const { drink, quantity, total, branch } = req.body;

    if (!drink || !quantity || !total || !branch) {
      return res.status(400).json({ message: "Missing required fields: drink, quantity, total, branch" });
    }

    try {
      await reduceStock(branch, drink, quantity);

      const productDoc = await Product.findOne({ name: drink });
      const branchDoc = await Branch.findOne({ name: branch });

      const order = new Order({
        drink: productDoc._id,
        quantity,
        total,
        branch: branchDoc._id,
        paid: 'Yes',
        payment: {
          method: 'Cash'
        }
      });

      await order.save();
      
      const populatedOrder = await Order.findById(order._id).populate('drink').populate('branch');

      return res.status(201).json({
        status: "success",
        order: {
          orderID: populatedOrder._id,
          drink: populatedOrder.drink.name,
          quantity: populatedOrder.quantity,
          total: populatedOrder.total,
          branch: populatedOrder.branch.name,
          paid: populatedOrder.paid,
        },
        transaction: {
          method: populatedOrder.payment.method,
        }
      });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
}

export default CashOrderController;

