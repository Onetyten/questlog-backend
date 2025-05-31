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

        refreshTokens: [{
            token: { type: String, required: true }, 
            expiresAt: { type: Date, required: true },
            createdAt: { type: Date, default: Date.now },
            device: { type: String, default: 'web' }
        }],

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


userSchema.pre('save', function(next) {
    if (this.isModified()) { 
        this.updatedAt = Date.now();
    }
    next();
});

const userProfile = new mongoose.model('userProfile', userSchema)
export default userProfile;