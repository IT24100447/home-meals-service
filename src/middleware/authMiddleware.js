import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const authMiddleware = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_KEY);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ success: false, message: "User not found" });
            }
            return next();
        } catch (err) {
            console.log("Authorization Failed! ", err);
            return res.status(401).json({
                success: false,
                message: "Not Authorized! Invalid Token"
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not Authorized! No Token"
        });
    }
}

export default authMiddleware;