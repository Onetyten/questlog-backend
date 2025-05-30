import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
const app = express();
import cors from 'cors';
import mongoConnect from './config/mongoConnect.js';
import signupRoute from './routes/auth/signup.js'
import signinRoute from './routes/auth/signin.js'
import taskRoute from './routes/api/task/addTask.js'
import Log from './logs/log.js';
const PORT = process.env.PORT || 3100;



// make my backend accessible to all domains
app.use(
    cors(
        {origin : "http://localhost:3000" },
    )
)
app.use(express.json())
app.use(express.urlencoded({extended : true}))


// auth routes
app.use('/auth', signupRoute);
app.use('/auth', signinRoute);
app.use('/api/task',taskRoute)


async function startServer() {
    try {
        console.log("Attempting to connect to the questlog database")
        await mongoConnect()
        console.log("Connected to the questlog database")
        await Log.LogInfo("\nConnected to the questlog database")

        app.listen(PORT, async (error)=>{
            if (!error){
                console.log("questlog is running on port",PORT)
                await Log.LogInfo(`started server on port ${PORT}`)
            }
            else{
                console.log("questlog has encountered an error")
                Log.LogError(error,"questlog has encountered an error")
            }

        } )

        
    }
    catch (error) {
        console.error("Failed to connect to the server",error)
        Log.LogError(error,"questlog has encountered an error")
        process.exit(1)
    }
    
}


startServer()