import orderService from '../services/orderService.js';

const placeOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const order = await orderService.createOrder(req.body, userId);
        res.status(201).json({ success: true, order, message: "Order placed successfully" });
    } catch (err) {
        console.error(err);
        console.error("Place Order Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const orders = await orderService.getOrdersForUser(userId, role);
        res.status(200).json({ success: true, orders });
    } catch (err) {
        console.error(err);
        console.error("Get My Orders Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, cancelReason } = req.body;
        const order = await orderService.updateOrderStatus(id, status, cancelReason);
        res.status(200).json({ success: true, order, message: `Order ${status}` });
    } catch (err) {
        console.error("Update Status Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

export default { placeOrder, getMyOrders, updateStatus };
