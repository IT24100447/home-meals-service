import User from '../models/user.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


//Register a New User
const createUser = async (userData, file) => {

    const imageUrl = file ? file.path : 'https://res.cloudinary.com/ddo8xtk2a/image/upload/v1775966212/default-avatar-icon-of-social-media-user-vector_hrmo8x.jpg'; //Default image if no file is uploaded
    const { firstName, lastName, email, password, phoneNumber, address, city, role, description, businessName } = userData;

    const existingUser = await User.findOne({ email }); //Check if user already exists

    if (existingUser) {
        throw new Error("User already exists");
    }

    const hashedPwd = await bcrypt.hash(password, 10); //Hashing the password

    const user = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPwd,
        phoneNumber,
        address,
        city,
        role,
        description,
        businessName,
        profileImage: imageUrl
    });

    console.log("User successfully saved to database:", user._id);
    return user;
}


//Find a User by email
const findUserByEmail = async (inputemail) => {

    const user = await User.findOne({ email: inputemail });

    if (user) {
        console.log("User Found!", user);
        return user;
    } else {
        console.log("User not found!");
        throw new Error("User not Found!");
    }

};

//Check User Login
const loginUser = async (userInput) => {

    const { email, password } = userInput;

    const user = await User.findOne({ email: email });

    if (!user) {
        console.log("Cannot find user");
        throw new Error(`No user with ${email} Exists`);
    }

    //Check if the passwords matches
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        console.log("Password does not match");
        throw new Error("Invalid email or password");
    }

    //Generate JWT Token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_KEY, {
        expiresIn: "30d"
    });

    console.log("Login successful");
    return { user, token };

}

const getAllSellers = async (city) => {
    const query = { role: 'seller' };
    if (city) {
        query.city = { $regex: new RegExp(`^${city.trim()}$`, 'i') };
    }
    return await User.find(query).select('-password');
};

export default { createUser, findUserByEmail, loginUser, getAllSellers };