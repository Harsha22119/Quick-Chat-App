import mongoose from "mongoose";

export const connectDB = async () => {
    console.log("In connectDB");
    try {
        console.log("In try block of connectDB");
        mongoose.connection.on('connected', () => {
        console.log('Database Connected');
        });

        await mongoose.connect(`${process.env.MONGODB_URI}/chat-app`);
    } catch (error) {
        console.log("In catch block of connectDB");
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }   
};