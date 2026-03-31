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
        type: String
    },

    // role:{
    //     type: String,
    //     enum: ["user"],
    //     default: "user"
    // },
},{
    timestamps: true
}
);

export default mongoose.model("User", UserSchema);