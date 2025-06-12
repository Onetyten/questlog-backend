import express from "express"
import task from "../../../schema/taskSchema.js"
import Log from "../../../logs/log.js"

const router = express.Router()

router.get("/fetch", async (req, res) => {
    try {
        const sortBy = req.query.sortBy || "createdAt"
        const order = req.query.order === "desc"? - 1 : 1

        if (req.query.priority){
            filter.priority = req.query.priority
        }
        if (req.query.status){
            filter.status = req.query.status
        }
        if (req.query.today === "true") {
            const start = new Date();
            start.setHours(0, 0, 0, 0); // start of today

            const end = new Date();
            end.setHours(23, 59, 59, 999); // end of today

            filter.dueDate = { $gte: start, $lt: end };
        }


        if (req.query.tomorrow === "true") {
            const start = new Date();
            start.setDate(start.getDate() + 1);
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setDate(end.getDate() + 1);
            end.setHours(23, 59, 59, 999);
            filter.dueDate = { $gte: start, $lt: end };
        }

        if (req.query.week === "true") {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setDate(end.getDate() + 7);
            end.setHours(23, 59, 59, 999);
            filter.dueDate = { $gte: start, $lt: end };
        }
        const user_id = req.user.id
        const filter = {user_id}



        const tasks = await task.find(filter).sort({[sortBy]:order})
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