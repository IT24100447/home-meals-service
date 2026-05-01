import Payment from '../models/payment.model.js';
import Order from '../models/order.model.js';

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

    // 4. Monthly Financial Report Data
    getFinancialReport: async (req, res) => {
        try {
            const { sellerId } = req.params;
            const { month, year } = req.query; // e.g., month=5, year=2024

            if (!month || !year) {
                return res.status(400).json({ message: "Month and Year are required query parameters." });
            }

            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            const payments = await Payment.find({
                sellerId,
                status: 'verified',
                verifiedAt: { $gte: startDate, $lte: endDate }
            });

            const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
            const commissionRate = 0.10; // 10% Platform Fee
            const totalCommission = totalRevenue * commissionRate;
            const netProfit = totalRevenue - totalCommission;

            res.status(200).json({
                sellerId,
                period: `${month}/${year}`,
                stats: {
                    orderCount: payments.length,
                    totalRevenue,
                    totalCommission,
                    netProfit
                },
                transactions: payments
            });
        } catch (err) {
            res.status(500).json({ message: "Error generating report", error: err.message });
        }
    }
};

export default financeController;
