import jwt from "jsonwebtoken"
import Log from "../log.js"


const Authorization = async(req,res,next)=>{
    const authHeader = req.headers.authorization

    if (!authHeader){
        await Log.LogInfo("WARN","logs/auth/authorization.js",`Authorization header not found,request to ${req.originalUrl} is not authorized`)
        return res.status(401).json("Authorization header not found, User is not authorized")
    }

    if (!authHeader.startsWith("Bearer ")){
        await Log.LogInfo("WARN","logs/auth/authorization.js",`Authorization format to ${req.originalUrl} is not valid`)
        return res.status(401).json("Authorization format is invalid")
    }
    const token = authHeader.split(" ")[1]
    try {
            const decoded = jwt.verify(token,process.env.JWT_SECRET)
            req.user = decoded.user
            await Log.LogInfo("INFO", "middleware/authorization.js", `User ${req.user.id} authenticated for request to ${req.originalUrl}`);
            next()
        }
    catch(error)
    {
        await Log.LogInfo("ERROR", "logs/auth/authorization.js", `Error during authorization for ${req.originalUrl}: ${error.message}`);
        return res.json(401).json({message:`Error during authorization: ${error.message}`,error:error.name})
    }
    

}

export default Authorization



