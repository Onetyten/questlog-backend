import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
const app = express();
import cors from 'cors';
import mongoConnect from './config/mongoConnect.js';
import signupRoute from './routes/auth/signup.js'
import signinRoute from './routes/auth/signin.js'
const PORT = process.env.PORT || 3100;



// make my backend accessible to all domains
app.use(
    cors(
        {origin : "http://localhost:3000" },
    )
)
app.use(express.json())
app.use(express.urlencoded({extended : true}))

// send a response that the server works to test on postman
// app.get('/', (req, res)=>{
//     res.send("app is running successfully").status(200)
// })

// auth routes
app.use('/auth', signupRoute);
app.use('/auth', signinRoute);


async function startServer() {
    try {
        console.log("Attempting to connect to te questlog database")
        await mongoConnect()
        console.log("Connected to the questlog database")

        app.listen(PORT,(error)=>{
            if (!error){
                console.log("questlog is running on port",PORT)
            }
            else{
                console.log("questlog has encountered an error")
            }

        } )

        
    } catch (error) {
        console.error("Failed to connect to the server",error)
        process.exit(1)
    }
    
}

startServer()