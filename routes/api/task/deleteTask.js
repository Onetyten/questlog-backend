
import task from "../../../schema/taskSchema.js"
import express from "express"
import Log from "../../../logs/log.js"
const router = express.Router()

router.delete("/delete/:_id", async (req, res) => {
    try{
        const {_id} = req.params
        if (!_id) {
            await Log.LogInfo("ERROR","routes/api/task/deleteTask.js",`an id is required to delete a task`)
            return res.status(400).json({message:"an id is required to delete a task"})
           
        }
        async function getsubTasks(task_id,user_id)
        {   
            const children =  await task.find({parent_id:task_id,user_id:user_id})
            let descendant = [...children]

            for (const child of children)
            {
                const childDescendant = await getsubTasks(child._id,user_id)
                descendant = descendant.concat(childDescendant)
            }

            return descendant            
        }
        const deletedTask = await task.findByIdAndDelete(_id)
        if (!deletedTask) {
            await Log.LogInfo("ERROR","routes/api/task/deleteTask.js",`task not found`)
            return res.status(404).json("task not found")
        }

        const subTasks = await getsubTasks(_id,deletedTask.user_id)
        for (const subTask of subTasks)
        {
            await task.findByIdAndDelete(subTask._id)
            await Log.LogInfo("INFO","routes/api/task/deleteTask.js",`user ${subTask.user_id} deleted subtask ${subTask._id} \n ${subTask.title} successfully`)
            console.log(`user ${subTask.user_id} deleted subtask ${subTask._id} \n ${subTask.title} successfully`)
        }

        await Log.LogInfo("INFO","routes/api/task/deleteTask.js",`user ${deletedTask.user_id} deleted task ${deletedTask._id} \n ${deletedTask.title} successfully`)
        return res.status(200).json({message:`user ${deletedTask.user_id} deleted a new task successfully`,data:deletedTask})
    }
    catch(error)
    {
        console.error(error)
        res.status(500).json("error deleting task")
        await Log.LogInfo("ERROR","routes/api/task/deleteTask.js",`error deleting task: ${error.message}`)
        return
    }
    
})


export default router