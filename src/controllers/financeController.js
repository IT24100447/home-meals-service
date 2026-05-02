import Payment from '../models/payment.model.js';
import Order from '../models/order.model.js';
import Expense from '../models/expense.model.js';

const financeController = {
    // 1. Student uploads the slip
    uploadBankSlip: async (req, res) => {
        try {
            const { orderId, studentId, sellerId, amount } = req.body;
            const bankSlipUrl = req.file?.path;

            if (!bankSlipUrl) {
                return res.status(400).json({ message: "Bank slip image is required" });
            }

            const payment = new Payment({
                orderId,
                studentId,
                sellerId,
                amount,
                paymentMethod: 'bank_transfer',
                bankSlipUrl,
                status: 'pending'
            });

            await payment.save();
            
            // Mark the order payment status as 'pending' verification
            await Order.findByIdAndUpdate(orderId, { paymentStatus: 'pending' });

            res.status(201).json({ message: "Bank slip uploaded successfully", payment });
        } catch (err) {
            res.status(500).json({ message: "Error uploading bank slip", error: err.message });
        }
    },

    // 2. Seller sees their payments (Filter by sellerId)
    getSellerPayments: async (req, res) => {
        try {
            const { sellerId } = req.params;
            const payments = await Payment.find({ sellerId })
                .populate('studentId', 'firstName lastName email')
                .populate('orderId')
                .sort({ createdAt: -1 });
            res.status(200).json(payments);
        } catch (err) {
            res.status(500).json({ message: "Error fetching payments", error: err.message });
        }
    },

    // 3. Seller verifies the payment
    verifyPayment: async (req, res) => {
        try {
            const { paymentId } = req.params;
            const { status } = req.body; // 'verified' or 'rejected'

            if (!['verified', 'rejected'].includes(status)) {
                return res.status(400).json({ message: "Invalid status. Use 'verified' or 'rejected'." });
            }

            const payment = await Payment.findByIdAndUpdate(paymentId, { 
                status, 
                verifiedAt: status === 'verified' ? new Date() : null 
            }, { new: true });

            // If verified, update the main order to 'paid'
            if (status === 'verified') {
                await Order.findByIdAndUpdate(payment.orderId, { 
                    paymentStatus: 'paid',
                    orderStatus: 'confirmed' 
                });
            } else {
                await Order.findByIdAndUpdate(payment.orderId, { 
                    paymentStatus: 'failed'
                });
            }

            res.status(200).json({ message: `Payment ${status} successfully`, payment });
        } catch (err) {
            res.status(500).json({ message: "Error verifying payment", error: err.message });
        }
    },

    // 4. Seller adds an expense (materials, bills, etc.)
    addExpense: async (req, res) => {
        try {
            const { sellerId, category, amount, description } = req.body;
            const billImageUrl = req.file?.path; // Uploaded via Cloudinary middleware

            const expense = new Expense({
                sellerId,
                category,
                amount,
                description,
                billImageUrl
            });

            await expense.save();
            res.status(201).json({ message: "Expense added successfully", expense });
        } catch (err) {
            res.status(500).json({ message: "Error adding expense", error: err.message });
        }
    },

    // 5. Seller gets their expenses
    getExpenses: async (req, res) => {
        try {
            const { sellerId } = req.params;
            const { month, year } = req.query;

            const query = { sellerId };
            if (month && year) {
                const startDate = new Date(year, month - 1, 1);
                const endDate = new Date(year, month, 0, 23, 59, 59);
                query.date = { $gte: startDate, $lte: endDate };
            }

            const expenses = await Expense.find(query).sort({ date: -1 });
            res.status(200).json(expenses);
        } catch (err) {
            res.status(500).json({ message: "Error fetching expenses", error: err.message });
        }
    },

    // 6. Monthly Financial Report Data (Now includes expenses)
    getFinancialReport: async (req, res) => {
        try {
            const { sellerId } = req.params;
            const { month, year } = req.query;

            if (!month || !year) {
                return res.status(400).json({ message: "Month and Year are required query parameters." });
            }

            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            // Fetch orders for the seller
            const orders = await Order.find({
                sellerId,
                orderStatus: { $ne: 'cancelled' },
                platformFee: { $gt: 0 },
                createdAt: { $gte: startDate, $lte: endDate }
            }).populate('userId', 'firstName lastName email');

            // Fetch expenses for the seller
            const expenses = await Expense.find({
                sellerId,
                date: { $gte: startDate, $lte: endDate }
            });

            const totalRevenue = orders.reduce((sum, order) => sum + order.totalPayment, 0);
            const totalCommission = orders.reduce((sum, order) => sum + order.platformFee, 0);
            const grossProfit = orders.reduce((sum, order) => sum + order.sellerEarnings, 0);
            const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
            const netProfit = grossProfit - totalExpenses;

            // Map orders to the 'transaction' format the frontend expects
            const transactions = orders.map(order => ({
                _id: order._id,
                orderId: { _id: order._id },
                studentId: order.userId,
                amount: order.totalPayment,
                verifiedAt: order.createdAt,
                status: 'verified'
            }));

            res.status(200).json({
                sellerId,
                period: `${month}/${year}`,
                stats: {
                    orderCount: orders.length,
                    totalRevenue,
                    totalCommission,
                    grossProfit,
                    totalExpenses,
                    netProfit
                },
                transactions,
                expenses // Include expenses in the report
            });
        } catch (err) {
            res.status(500).json({ message: "Error generating report", error: err.message });
        }
    }
};

export default financeController;
