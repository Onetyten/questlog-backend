import task from "../../../schema/taskSchema.js"
import express from "express"
import Log from "../../../logs/log.js"
const router = express.Router()

router.post("/add", async (req, res) => {
    const {parent_id,title,priority} = req.body
    const user_id = req.user.id
    try{
        if (!TaskCheck(req,res)){
            return
        }
        const newTask = new task({
            user_id,
            parent_id,
            title,
            priority,
            dueDate
        })
        await newTask.save()
        await Log.LogInfo("INFO","routes/api/task/addTask.js",`user ${newTask.user_id} created a new task with id ${newTask._id} \n and title ${newTask.title} successfully`)
        return res.status(201).json({message:`user ${newTask.user_id} created a new task successfully`,data:newTask.toObject(),success:true})
    }
    catch(error)
    {
        console.error(error)
        await Log.LogInfo("ERROR","routes/api/task/addTask.js",`error adding task : ${error.message}`)
        return res.status(500).send({message:"Server Error",error:error.message,success:false})  
    }
    
})

function TaskCheck(req,res){
    const {title} = req.body
    if (!title){
        res.status(400).json({message:"the task is empty",success:false})
        return false
    }
    return true
}

export default router