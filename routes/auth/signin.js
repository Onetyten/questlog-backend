import dotenv from "dotenv"
dotenv.config()
import express from "express"
import userProfile from "../../schema/userSchema.js"
import crypto from "crypto"
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
            return res.status(404).json({message:"user not found, please sign up to create a Questlog account",success:false})
        }
        const match = await bcrypt.compare(password,user.password)
        if (!match){
            return res.status(400).json({message:"incorrect password",success:false})
        }


        user.lastLogin = Date.now()
        const payload ={
            user:{
                id:user._id
            }
        }
        const token = jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:'4h'})

        const refreshToken = crypto.randomBytes(40).toString('hex')
        const expiresAt = new Date(Date.now() + 6 * 4 * 7 * 24 * 60 * 60 * 1000)

        user.refreshTokens.push({token:refreshToken,expiresAt:expiresAt})

        await user.save()

        await Log.logSignIn(`user ${user.name} with id ${user._id} has logged in`)
        return res.status(200).json({message:"login successful",success:true,token:token , refreshToken:user.refreshTokens[user.refreshTokens.length-1], user:{id:user._id,name:user.name,email:user.email,lastLogin:user.lastLogin}})


    }
    
    catch (error) {
        res.status(500).json({message:error.message,success:false})
         await Log.LogInfo("ERROR", "signin.js", `Error during sign in : ${error.message}`)
    }

}
)


function signinSanity(req,res) {
    const {email,password} = req.body
    if(!email){
        return false
    }
    if(!password){
        return false
    }
    return true
}

export default router