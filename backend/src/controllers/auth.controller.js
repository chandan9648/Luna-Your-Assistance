const  userModel = require("../models/user.model");
const bycrpt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// REGISTER
async function registerUser(req, res){
    const { fullName:{firstName, lastName}, email, password } = req.body

    const isUserAlreadyexist = await userModel.findOne({email});
    
    if(isUserAlreadyexist){
        res.staus(400).json({message: "user already exist"});
    }
 

    const hashpassword = await bycrpt.hash(password, 10);
  
    const user = await userModel.create({
        fullName:{
            firstName, lastName
        },
        email,
        password: hashpassword
    })

    const token = jwt.sign({user: user._id}, process.env.JWT_SECRET);

    res.cookie("token", token);
    
    res.status(201).json({
        message: "User register successfully",
        user:{
            email: user.email,
            _id: user._id,
            fullName: {
                firstName: user.fullName,
                lastName: user.lastName
            }
        }
    })
}

// LOGIN
async function loginUser(req, res) {
    const {email, password} = req.body;

   const user = await userModel.findOne({email})

   if(!user){
    return res.status.json({ message: "invalid email or password!"});
    }

    const isPasswordValid = await bycrpt.compare(password, user.password);
    
    if(!isPasswordValid){
         return res.status.json({ message: "invalid email or password!"});
    }

    const token = jwt.sign({id: user._id, }, process.env.JWT_SECRET);

    res.cookie("token", token);

    res.status(201).json({
        message: "user logged in successfully",
        user: {
            email: user._id,
            _id: user._id,
             fullName: {
                firstName: user.fullName,
                lastName: user.lastName
            }
        }
    })
}

module.exports = {
    registerUser,
    loginUser
}