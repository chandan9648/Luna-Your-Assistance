const mongoose = require("mongoose");

async function connectDB() {
    try{
         await mongoose.connect(process.env.MONGO_URI);
         console.log("connected to MongoDB")
    }catch(err){
        console.error("Error connecting to mongoDB", err);
    }

}

module.exports = connectDB;