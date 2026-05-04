import Order from '../models/order.model.js';
import Alert from '../models/alert.model.js';
import Meal from '../models/meal.model.js';

const createOrder = async (orderData, userId, file) => {
    const {
        sellerId,
        items,
        totalPayment,
        deliveryAddress,
        contactNumber,
        paymentMethod,
        specialInstructions
    } = orderData;

    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    const receiptImage = file ? file.path : undefined;

    const order = await Order.create({
        userId,
        sellerId,
        items: parsedItems,
        totalPayment,
        deliveryAddress,
        contactNumber,
        paymentMethod,
        receiptImage,
        paymentConfirmed: paymentMethod === 'cash',
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
        .populate('sellerId', 'businessName firstName lastName profileImage phoneNumber')
        .populate('items.mealId', 'mealName image price')
        .sort({ createdAt: -1 });
};

const updateOrderStatus = async (orderId, status, cancelReason = null) => {
    const order = await Order.findById(orderId).populate('items.mealId');
    if (!order) throw new Error("Order not found");

    if (status === 'payment_confirmed') {
        order.paymentConfirmed = true;
    } else {
        order.orderStatus = status;
    }
    if (cancelReason) order.cancelReason = cancelReason;

    // Financial Calculation Logic
    if (status === 'preparing') {
        order.platformFee = 0;
        order.sellerEarnings = order.totalPayment;
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
    } else if (status === 'ready') {
        const mealName = order.items?.[0]?.mealId?.mealName || "your meal";
        message = `Your order for ${mealName} is ready for pickup!`;
    } else if (status === 'payment_confirmed') {
        message = `Your payment has been confirmed and the seller can now accept your order.`;
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

const cancelOrderByStudent = async (orderId, userId, cancelReason) => {
    const order = await Order.findById(orderId);
    if (!order) throw new Error("Order not found");
    if (order.userId.toString() !== userId.toString())
        throw new Error("Not authorized to cancel this order");
    if (order.orderStatus !== "pending")
        throw new Error("Order can only be cancelled while it is still pending");

    order.orderStatus = "cancelled";
    order.cancelReason = cancelReason || "Cancelled by customer";
    order.platformFee = 0;
    order.sellerEarnings = 0;
    await order.save();

    // Notify the seller
    await Alert.create({
        userId: order.sellerId,
        title: "Order Cancelled",
        message: `A customer cancelled their order. Reason: ${order.cancelReason}`,
        type: "order",
        relatedId: order._id,
        relatedModel: 'Order'
    });

    return order;
};

export default { createOrder, getOrdersForUser, updateOrderStatus, cancelOrderByStudent };
