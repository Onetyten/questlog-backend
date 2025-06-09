import express from "express"
import task from "../../../schema/taskSchema.js"
import Log from "../../../logs/log.js"

const router = express.Router()

router.get("/fetch", async (req, res) => {
    try {
        const user_id = req.user.id
        const tasks = await task.find({user_id})
        if (!tasks || tasks.length === 0){
            await Log.LogInfo("INFO","routes/api/task/fetchTask.js",`No tasks found for user ${user_id}`)
            return res.status(404).json({message:"No tasks found",success:false})
        }
        res.status(200).json({message:"Tasks fetched successfully", tasks:tasks,success:true})
    }
    catch (error) {
        console.error(error)
        res.status(500).json({message:"Internal server error",success:false})
        await Log.LogInfo("ERROR","routes/api/task/fetchTask.js",`Error fetching tasks: ${error.message}`)
    }


})

export default router