import Order from '../models/order.model.js';
import Alert from '../models/alert.model.js';
import Meal from '../models/meal.model.js';

const createOrder = async (orderData, userId) => {
    const { sellerId, items, totalPayment, deliveryAddress, contactNumber, paymentMethod, specialInstructions } = orderData;

    const order = await Order.create({
        userId,
        sellerId,
        items,
        totalPayment,
        deliveryAddress,
        contactNumber,
        paymentMethod,
        specialInstructions,
        orderStatus: 'pending'
    });

    // Create alert for seller
    await Alert.create({
        userId: sellerId,
        title: "New Order Received!",
        message: `You have received a new order for RS.${totalPayment}. Check it out now!`,
        type: "order",
        relatedId: order._id,
        relatedModel: 'Order'
    });

    return order;
};

const getOrdersForUser = async (userId, role) => {
    const query = role === 'seller' ? { sellerId: userId } : { userId: userId };
    return await Order.find(query)
        .populate('userId', 'firstName lastName profileImage phoneNumber')
        .populate('sellerId', 'businessName firstName lastName profileImage')
        .populate('items.mealId', 'mealName image price')
        .sort({ createdAt: -1 });
};

const updateOrderStatus = async (orderId, status, cancelReason = null) => {
    const order = await Order.findById(orderId).populate('items.mealId');
    if (!order) throw new Error("Order not found");

    order.orderStatus = status;
    if (cancelReason) order.cancelReason = cancelReason;

    // Financial Calculation Logic
    if (status === 'preparing') {
        const commissionRate = 0.10; // 10% Platform Fee
        order.platformFee = order.totalPayment * commissionRate;
        order.sellerEarnings = order.totalPayment - order.platformFee;
    } else if (status === 'cancelled') {
        // Reset financial data if order is cancelled
        order.platformFee = 0;
        order.sellerEarnings = 0;
    }
    
    await order.save();

    // Create alert for student
    let message = `Your order status has been updated to ${status}.`;
    if (status === 'cancelled') {
        message = `Your order was cancelled. Reason: ${cancelReason}`;
    } else if (status === 'confirmed') {
        const mealName = order.items?.[0]?.mealId?.mealName || "your meal";
        message = `Great news! Your order for ${mealName} has been accepted by the seller!`;
    }

    await Alert.create({
        userId: order.userId,
        title: `Order ${status.toUpperCase()}`,
        message,
        type: "order",
        relatedId: order._id,
        relatedModel: 'Order'
    });

    return order;
};

export default { createOrder, getOrdersForUser, updateOrderStatus };
