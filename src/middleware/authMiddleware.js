import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const authMiddleware = async(requestAnimationFrame,response,next) => {
    let token;

    //Check if the token exists in the Authorization header
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){

        try{
            token = req.headers.authorization.split(' ')[1]; 
            const decoded = jwt.verify(token, process.env.JWT_KEY);
            req.user = await User.findById(decoded.id).select('-password') //Find the user by ID and exclude the password field
            next(); 
        } catch(err){
            console.log("Authorization Failed! ",err);
            res.status(401).json({
                sucess: false,
                message: "Not Authorized! Invalid Token"
            })
        }
    }

    if(!token){
        res.status(401).json({
            sucess: false,
            message: "Not Authorized! No Token"
        })
    }
}

export default authMiddleware;