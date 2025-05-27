import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
        lastLogin: {
            type: Date,
            default: Date.now,
        },
        
    }
)
const userProfile = new mongoose.model('userProfile', userSchema)
export default userProfile;