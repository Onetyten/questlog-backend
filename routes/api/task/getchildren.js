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
            await Log.LogInfo("ERROR","routes/api/task/getchildren.js",`user_id is required to get tasks`)
            return res.status(400).json({message:"user_id is required to get tasks"})     
        }
        const tasks = await GetDescendants(user_id,parent_id)
        if (!tasks || tasks.length === 0){
            await Log.LogInfo("WARN","routes/api/task/getchildren.js",`No tasks found for user_id ${user_id} and parent_id ${parent_id}`)
            return res.status(404).json({message:"No tasks found"})
        }
        return res.status(200).json({message:"Tasks fetched successfully", tasks:tasks})
    }
    catch (error) {
        console.error(error)
        await Log.LogInfo("ERROR","routes/api/task/getchildren.js",`Error fetching tasks: ${error.message}`)
        return res.status(500).json({message:"Internal server error"})
        
    }


})

export default router