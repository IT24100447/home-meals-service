import userService from '../services/userService.js';

//Register a User
const registerUser = async (req, res) => {

    try {
        const newUser = await userService.createUser(req.body, req.file);

        res.status(201).json(
            {
                success: true,
                newUser,
                message: "User Registration Sucessful"
            });
    } catch (err) {
        console.error("Error Registering User: ", err);
        res.status(500).json(
            { message: err.message, success: false });
    }
}

//Find User by Email
const findUserByEmail = async (req, res) => {

    try {
        const user = await userService.findUserByEmail(req.body);

        res.status(200).json({
            success: true,
            message: "Found User"
        })
    } catch (err) {
        res.status(404).json(
            { message: err.message, success: false });
    }
}


//User Login
const userLogin = async (req, res) => {

    try {
        const { user, token } = await userService.loginUser(req.body);

        res.status(200).json({
            success: true,
            message: "User Login Successful",
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                businessName: user.businessName,
                city: user.city,
                profileImage: user.profileImage
            },
            token: token
        });
    } catch (err) {
        console.log("User Login Failed");
        res.status(500).json({
            success: false,
            Error: err.message
        });
    };
}

const getSellers = async (req, res) => {
    try {
        const { city } = req.query;
        const sellers = await userService.getAllSellers(city);
        res.status(200).json({
            success: true,
            sellers
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getSellerProfile = async (req, res) => {
    try {
        const seller = await userService.getSellerById(req.params.id);
        if (!seller) {
            return res.status(404).json({ success: false, message: "Seller not found" });
        }
        res.status(200).json({
            success: true,
            seller
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await userService.getSellerById(req.user.id); // Reusing getSellerById as it fetch user by ID
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({
            success: true,
            user
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const updatedUser = await userService.updateUserProfile(req.user.id, req.body, req.file);
        res.status(200).json({
            success: true,
            user: updatedUser,
            message: "Profile updated successfully"
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const toggleWishlist = async (req, res) => {
    try {
        const wishlist = await userService.toggleWishlist(req.user.id, req.params.mealId);
        res.status(200).json({
            success: true,
            wishlist,
            message: "Wishlist updated"
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getWishlist = async (req, res) => {
    try {
        const wishlist = await userService.getWishlist(req.user.id);
        res.status(200).json({
            success: true,
            wishlist
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export default { registerUser, findUserByEmail, userLogin, getSellers, getSellerProfile, getProfile, updateProfile, toggleWishlist, getWishlist };