import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        enum: ['materials', 'packaging', 'transport', 'utilities', 'other'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    billImageUrl: {
        type: String // Cloudinary URL
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
