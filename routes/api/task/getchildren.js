import express from "express"
import task from "../../../schema/taskSchema.js"
import Log from "../../../logs/log.js"

const router = express.Router()

async function GetDescendants(user_id,parent_id) {
    const children  = await task.find({parent_id:parent_id,user_id:user_id})
    let descendants = [...children]

    for (const child of children){
        const childDescendant = await GetDescendants(user_id,child._id)
        descendants = descendants.concat(childDescendant)
    }
    return descendants
}

router.get("/fetchchildren/:parent_id/:user_id", async (req, res) => {
    try {
        const { user_id,parent_id} = req.params
        if (!user_id){
            Log.LogError("user_id is required to get tasks")
            return res.status(400).json({message:"user_id is required to get tasks"})     
        }
        const tasks = await GetDescendants(user_id,parent_id)
        if (!tasks || tasks.length === 0){
            Log.LogError("No tasks found")
            return res.status(404).json({message:"No tasks found"})
        }
        return res.status(200).json({message:"Tasks fetched successfully", tasks:tasks})
    }
    catch (error) {
        console.error(error)
        Log.LogError("Error fetching tasks")
        return res.status(500).json({message:"Internal server error"})
        
    }


})

export default router