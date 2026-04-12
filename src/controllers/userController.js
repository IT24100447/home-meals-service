import userService from '../services/userService.js';

//Register a User
const registerUser = async (req,res) => {

    try{
        const newUser = await userService.createUser(req.body, req.file);

        res.status(201).json(
            {sucesss: true, 
            newUser,
            message: "User Registration Sucessful"});
    }catch(err){
        console.error("Error Registering User: ", err);
        res.status(500).json(
            {message: err.message, sucesss: false});
    }
}

//Find User by Email
const findUserByEmail = async(req,res) => {

    try{
        const user = await userService.findUserByEmail(req.body);

        res.status(200).json({
            sucesss: true,
            message: "Found User"
        })
    }catch(err){
        res.status(404).json(
            {message: err.message, sucesss: false});
    }
}


//User Login
const userLogin = async(req,res) => {

    try{
        const user = await userService.loginUser(req.body);
        
        res.status(200).json({
            sucesss: true,
            message: "User Login Successful",
            role: user.role,
            token: user.token
        })
    }catch(err){
        console.log("User Login Failed");
        res.status(500).json({
            sucesss: false,
            Error: err.message
        });
    };
}

export default { registerUser, findUserByEmail, userLogin };