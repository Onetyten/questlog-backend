import express from "express"
import task from "../../../schema/taskSchema.js"
import Log from "../../../logs/log.js"

const router = express.Router()

router.patch("/edit/:_id", async (req, res) => {
    const { title,parent_id,status,priority,dueDate } = req.body
    const _id = req.params._id
    
    try {
        if (!_id)
        {
            await Log.LogInfo("ERROR","routes/api/task/patchTask.js","Attempt to edit a task without an id, Task ID is required to edit tasks.")
            return res.status(400).json({message:"Task ID is required to edit tasks."})
        }

        const updatedTask = await task.findById(_id)
        if (!updatedTask){
            await Log.LogInfo("WARN","routes/api/task/patchTask.js","Task not found during edit operation")
            return res.status(404).json({message:"Task not found"})
        }

        if (title != undefined && String(title).trim().length>0){
            console.log(`title updated from ${updatedTask.title} to ${title}`)
            await Log.LogInfo("INFO","routes/api/task/patchTask.js",`title updated from: \n ${updatedTask.title} to \n ${title}`)
            updatedTask.title = title
        }
        if (parent_id != undefined && parent_id.length>0){
            
            async function GetDescendants(task_id,user_id) {
                const children  = await task.find({parent_id:task_id,user_id:user_id})
                let descendants = [...children]
            
                for (const child of children){
                    const childDescendant = await GetDescendants(task_id,child._id)
                    descendants = descendants.concat(childDescendant)
                }
                return descendants
            }

            const descendants = await GetDescendants(_id,updatedTask.user_id)

            if (parent_id == null || parent_id == "" || String(parent_id).trim().length==0){

                console.log(`parent_id updated from ${updatedTask.parent_id} to null`)
                await Log.LogInfo("INFO","routes/api/task/patchTask.js",`parent_id updated from ${updatedTask.parent_id} to null`)
                updatedTask.parent_id = null
            }

            else if (parent_id == _id){
                console.error("You can't parent this task to itself")
                await Log.LogInfo("ERROR","routes/api/task/patchTask.js",`You can't parent this task to itself`)
                return res.status(400).json({message:"You can't parent this task to itself"})
            }

            else if (descendants.includes(parent_id).toString()){
                console.error("You can't parent this task to its child")
                await Log.LogInfo("ERROR","routes/api/task/patchTask.js",`You can't parent this task to its child`)
                return res.status(400).json({message:"You can parent this task to its child"})
            }

            else{
                console.log(`parent_id updated from ${updatedTask.parent_id} to ${parent_id}`)
                await Log.LogInfo("INFO","routes/api/task/patchTask.js",`parent_id updated from ${updatedTask.parent_id} to ${parent_id}`)
                updatedTask.parent_id = parent_id
            }

                
        }


        if (status != undefined && status.length>0){
            console.log(`status updated from ${updatedTask.status} to ${status}`)
            Log.LogInfo("INFO","routes/api/task/patchTask.js",`status updated from ${updatedTask.status} to ${status}`)
            updatedTask.status = status
        }
        if (priority != undefined && priority.length>0){
            console.log(`priority updated from ${updatedTask.priority} to ${priority}`)
            await Log.LogInfo("INFO","routes/api/task/patchTask.js",`priority updated from ${updatedTask.priority} to ${priority}`)
            updatedTask.priority = priority
        }
        if (dueDate != undefined){
            console.log(`dueDate updated from ${updatedTask.dueDate} to ${dueDate}`)
            await Log.LogInfo("INFO","routes/api/task/patchTask.js",`dueDate updated from ${updatedTask.dueDate} to ${dueDate}`)
            updatedTask.dueDate = dueDate
        }

        await updatedTask.save()
        return res.status(200).json({message:"Task updated successfully",updatedTask:updatedTask})
        
    }
    catch (error) {
        console.error("Error updating tasks",error)
        await Log.LogInfo("ERROR","routes/api/task/patchTask.js",`Error updating tasks: ${error.message}`)
        return res.status(500).json({message:"Error updating tasks"})
        
    }
    

})

export default router