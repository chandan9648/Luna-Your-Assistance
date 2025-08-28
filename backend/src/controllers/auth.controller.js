const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


async function registerUser(req, res) {

    const { fullName: { firstName, lastName }, email, password } = req.body;

    const isUserAlreadyExists = await userModel.findOne({ email })

    if (isUserAlreadyExists) {
        res.status(400).json({ message: "User already exists" });
    }


    const hashPassword = await bcrypt.hash(password, 10);


    const user = await userModel.create({
        fullName: {
            firstName, lastName
        },
        email,
        password: hashPassword
    })

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

    // Keep cookie for compatibility (optional for local dev), also return token in body for Authorization header usage
    try {
        res.cookie("token", token);
    } catch (_) {
        // ignore cookie set errors in local non-https dev
    }

    res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
            email: user.email,
            _id: user._id,
            fullName: user.fullName
        }
    })
}

async function loginUser(req, res) {

    const { email, password } = req.body;

    const user = await userModel.findOne({
        email
    })

    if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);


    if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    // Keep cookie for compatibility (optional for local dev), also return token in body for Authorization header usage
    try {
        res.cookie("token", token);
    } catch (_) {
        // ignore cookie set errors in local non-https dev
    }

    res.status(200).json({
        message: "user logged in successfully",
        token,
        user: {
            email: user.email,
            _id: user._id,
            fullName: user.fullName
        }
    })

}


module.exports = {
    registerUser,
    loginUser
}