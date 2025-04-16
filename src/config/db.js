import mongoose from "mongoose";

import { MONGODB_URI } from "../config/config.js";
if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

const connectToDatabase = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            
        });
        console.log(`Connected to database`);
    } catch (error) {
        console.error('Error connecting to database', error);
        process.exit(1);
    }
}

export default connectToDatabase;