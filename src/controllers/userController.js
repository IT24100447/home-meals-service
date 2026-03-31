import userService from '../services/userService.js';

//Register a User
const registerUser = async (req,res) => {

    try{
        const newUser = await userService.createUser(req.body);
        res.status(201).json(
            {sucesss: true, 
            newUser,
            message: "User Registration Sucessful"});
    }catch(err){
        console.log("Error Registering User. ",err);
        res.status(500).json(
            {message: err.message, sucesss: false});
    }
}

//Find User by Email
const findUserByEmail = async(req,res) => {

    try{
        const user = await userService.findUserByEmail(req.body);
        res.status(201).json({
            sucesss: true,
            user,
            message: "Found User"
        })
    }catch(err){
        res.status(500).json(
            {message: err.message, sucesss: false});
    }
}


//User Login
const userLogin = async(req,res) => {

    try{
        const user = await userService.loginUser(req.body);
        res.status(201).json({
            sucesss: true,
            message: "User Login Successful"
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