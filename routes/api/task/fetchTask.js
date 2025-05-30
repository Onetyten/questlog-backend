import express from "express"
import task from "../../../schema/taskSchema.js"
import Log from "../../../logs/log.js"

const router = express.Router()

router.get("/fetch/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params
        if (!user_id){
            await Log.LogInfo("ERROR","routes/api/task/fetchTask.js",`user_id is required to get tasks`)
            return res.status(400).json({message:"user_id is required to get tasks"})     
        }
        const tasks = await task.find({user_id})
        if (!tasks){
            await Log.LogInfo("WARN","routes/api/task/fetchTask.js",`No tasks found`)
            return res.status(404).json({message:"No tasks found"})
        }
        res.status(200).json({message:"Tasks fetched successfully", tasks:tasks})
    }
    catch (error) {
        console.error(error)
        res.status(500).json({message:"Internal server error"})
        await Log.LogInfo("ERROR","routes/api/task/fetchTask.js",`Error fetching tasks: ${error.message}`)
    }


})

export default router