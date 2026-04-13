import mongoose from "mongoose";

const SellerSchema = new mongoose.Schema({

    firstName: {
        type: String,
        required: true
    },

    lastName: {
        type: String,
        required: true
    },

    profileImage: {
        type: String,
        required: true
    },

    email:{
        type:String,
        required: true
    },

    phoneNumber: {
        type: Number,
        required: true
    },

    address: {
        type: String,
        required: true
    },

    description: {
        type: String
    },

    totalReviews: {
        type: String
    }

},{
    timestamps: true
}
);

export default mongoose.model("Seller", SellerSchema);