import express from "express"
const router = express.Router()
import userProfile from "../../schema/userSchema.js"
import Log from "../../logs/log.js"
import jwt from "jsonwebtoken"




router.post('/refreshAccesstoken',async (req,res)=>{
    const {refreshToken}= req.body
    try {
        const user = await userProfile.findOne({ "refreshTokens.token":refreshToken})
        if (!user){
            Log.LogInfo("ERROR", "refreshToken.js", `User not find while verifying refresh token`)
            return res.status(404).json({message:"user not found"})
        }

        const matchedToken  = user.refreshTokens.find( t =>t.token === refreshToken )
        if (!matchedToken){
            Log.LogInfo("ERROR", "refreshToken.js", `invalid refresh token from ${user._id}`)
            return res.status(401).json({message:"invalid refresh token"})
        }

        if (new Date(matchedToken.expiresAt) < new Date()){
            Log.LogInfo("ERROR", "refreshToken.js", `${user.name}s with id ${user._id} refresh token  has expired`)
            user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken)
            await user.save()
            return res.status(401).json({message:"refresh token expired", error: "TokenExpiredError", code: "TOKEN_EXPIRED"})
        }

        const payload  = {
            user:{
                id:user._id
            }
        }

        const newAccessToken  = jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:'4h'})
        res.json({id:user._id,token:newAccessToken})

    }
    catch (error) {
        res.status(500).json({message:error.message})
        
    }
})

export default router