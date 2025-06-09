import express from "express"
const router = express.Router()
import userProfile from "../../schema/userSchema.js"
import Log from "../../logs/log.js"
import jwt from "jsonwebtoken"




router.post('/refreshAccesstoken',async (req,res)=>{
    const {refreshToken}= req.body
      if (!refreshToken) {
            return res.status(400).json({
            success: false,
            message: "Refresh token is required",
            });
        }

    try {
        const user = await userProfile.findOne({ "refreshTokens.token":refreshToken})
        if (!user){
            Log.LogInfo("ERROR", "refreshToken.js", `User not find while verifying refresh token`)
            return res.status(404).json({message:"user not found",success:false})
        }

        const matchedToken  = user.refreshTokens.find( t =>t.token === refreshToken )
        if (!matchedToken){
            Log.LogInfo("ERROR", "refreshToken.js", `invalid refresh token from ${user._id}`)
            return res.status(401).json({message:"invalid refresh token",success:false})
        }

        if (new Date(matchedToken.expiresAt) < new Date()){
            Log.LogInfo("ERROR", "refreshToken.js", `${user.name}s with id ${user._id} refresh token  has expired`)
            user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken)
            await user.save()
            return res.status(401).json({message:"refresh token expired",success:false, error: "TokenExpiredError", code: "TOKEN_EXPIRED"})
        }

        const payload  = {
            user:{
                id:user._id
            }
        }

        const newAccessToken  = jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:'4h'})
        await Log.logSignIn(`User ${user.name} with id ${user._id} refreshed access token`);
        res.status(200).json({user: {id: user._id,name: user.name,email: user.email,token:newAccessToken} ,message:"New token assigned",success:true})

    }
    catch (error) {
        res.status(500).json({message:error.message,success:false})
        
    }
})

export default router