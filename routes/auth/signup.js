import express from "express"
import userProfile from "../../schema/userSchema.js"
const router  = express.Router()
import bcrypt from 'bcrypt'
import Log from "../../logs/log.js"

function signupSanityCheck (req,res) {
    const {name,email,password} = req.body
    if (!name){
        res.status(400).json({message:"Name is required"}) 
        return false   
    }
    if (!email){
        res.status(400).json({message:"Email is required"}) 
        return false  
    }
    if (!password){
        res.status(400).json({message:"Password is required"}) 
        return false 
    }
    if (password.length < 8){
        res.status(400).json({message:"Password must be at least 8 characters"}) 
        return false 
    }
    return true   
}


router.post('/signup',async(req,res)=>{
    try {
        if (!signupSanityCheck(req,res)){
            return
        }
        const {name,email,password} = req.body
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)
        const user = new userProfile({name,email,password:hashedPassword})
        const savedUser = await user.save()
        Log.logAccount(`user ${savedUser.name} with id ${savedUser._id} created successfully}`, savedUser)
        return res.status(201).json({message:"User created successfully",user:{_id:savedUser._id,name:savedUser.name,email:savedUser.email}})
    } 
    catch (error) {
        console.error("Error during sign up",error)
        Log.logAuthError("Error during sign up",error)
        if (error.code === 11000){
            return res.status(409).json({message:"email already exists"})
        }
        else{
            return res.status(500).json({message:error.message})
        }
    }
    
})

export default router