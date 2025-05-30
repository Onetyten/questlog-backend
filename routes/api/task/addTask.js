import task from "../../../schema/taskSchema.js"
import express from "express"
import Log from "../../../logs/log.js"
const router = express.Router()

router.post("/add", async (req, res) => {
    const {user_id,parent_id,title,priority} = req.body
    try{
        if (!TaskCheck(req,res)){
            return
        }
        const newTask = new task({
            user_id,
            parent_id,
            title,
        })
        await newTask.save()
        Log.LogInfo(`user ${newTask.user_id} created a new task successfully`)
        return res.status(201).json({message:`user ${newTask.user_id} created a new task successfully`,data:newTask})
    }
    catch(error)
    {
        console.error(error)
        res.status(500).send("Server Error")
        Log.LogError(error,"error adding task")
        return
    }
    
})

function TaskCheck(req,res){
    const {user_id,title} = req.body
    if (!user_id){
        res.status(400).json("user_id is required, task has no assigned user")
        return false
    }
    if (!title){
        res.status(400).json("the task is empty")
        return false
    }
    return true
}

export default router