import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['bank_transfer', 'cod'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'rejected', 'cash_received'],
        default: 'pending'
    },
    bankSlipUrl: {
        type: String, // Cloudinary URL
        required: function() { return this.paymentMethod === 'bank_transfer'; }
    },
    verifiedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
