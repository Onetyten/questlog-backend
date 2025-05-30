import dotenv from "dotenv"
dotenv.config()
import express from "express"
import userProfile from "../../schema/userSchema.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import Log from "../../logs/log.js"

const app = express()
const router = express.Router()

app.use(express.json())



router.post('/signin',async(req,res)=>{
    try {
        if (!signinSanity(req,res)) return
        const {email,password} = req.body
        const user = await userProfile.findOne({email:email})
        if (!user){
            return res.status(404).json({message:"user not found, please sign up to create a Questlog account"})
        }
        const match = await bcrypt.compare(password,user.password)
        if (!match){
            return res.status(400).json({message:"incorrect password"})
        }

        user.lastLogin = Date.now()
        await user.save()

        const payload ={
            user:{
                id:user._id
            }
        }
        const token = jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:'1d'})
        Log.logSignIn(`user ${user.name} with id ${user._id} has logged in`)
        return res.status(200).json({message:"login successful",token:token , user:{id:user._id,name:user.name,email:user.email,lastLogin:user.lastLogin}})


    }
    
    catch (error) {
        res.status(500).json({message:error.message})
        Log.logAuthError("Error during sign in",error)
    }

}
)


function signinSanity(req,res) {
    const {email,password} = req.body
    if(!email){
        res.status(409).json({message:"email is required"})
        return false
    }
    if(!password){
        res.status(409).json({message:"password is required"})
        return false
    }
    return true
}

export default router