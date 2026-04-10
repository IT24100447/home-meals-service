import mongoose, { Schema } from "mongoose";

const UserSchema = new mongoose.Schema({

    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type:String,
        required: true
    },

    email:{
        type: String,
        required: true,
        unique: true
    },
    
    password:{
        type: String,
        required: true
    },

    phoneNumber:{
        type: Number,
        required: true
    },

    profileImage:{
        type: String,

    },

    address: {
        type: String,
        required: true
    },

    role:{
        type: String,
        enum: ["student", "seller"],
        required: true
    },

    description: {
        type: String
    },

    totalReviews: {
        type: Number,
        default: 0
    }
},{
    timestamps: true
}
);

export default mongoose.model("User", UserSchema);