import task from "../../../schema/taskSchema.js";
import express from "express";
import Log from "../../../logs/log.js";
import mongoConnect from "../../../config/mongoConnect.js";
const router = express.Router();

async function getsubTasks(task_id, user_id) {
  const children = await task.find({ parent_id: task_id, user_id: user_id });
  let descendant = [...children];

  for (const child of children) {
    const childDescendant = await getsubTasks(child._id, user_id);
    descendant = descendant.concat(childDescendant);
  }

  return descendant;
}

router.delete("/delete/:_id", async (req, res) => {
  await mongoConnect()
  try {
    const { _id } = req.params;
    const user_id = req.user.id;

    if (!_id) {
      await Log.LogInfo(
        "ERROR",
        "routes/api/task/deleteTask.js",
        `An id is required to delete a task`
      );
      return res
        .status(400)
        .json({ message: "An id is required to delete a task", success: false });
    }

    const deletedTask = await task.findByIdAndDelete(_id);

    if (!deletedTask) {
      await Log.LogInfo(
        "ERROR",
        "routes/api/task/deleteTask.js",
        `Task not found`
      );
      return res.status(404).json({ message: "Task not found", success: false });
    }

    if (deletedTask.user_id.toString() !== user_id) {
      await Log.LogInfo(
        "ERROR",
        "routes/api/task/deleteTask.js",
        `User ${user_id} is not authorized to delete task ${deletedTask._id}`
      );
      return res.status(403).json({
        message: "Forbidden: You do not have permission to delete this task.",
        success: false,
      });
    }

    const subTasks = await getsubTasks(_id, user_id);
    for (const subTask of subTasks) {
      await task.findByIdAndDelete(subTask._id);
      await Log.LogInfo( "INFO", "routes/api/task/deleteTask.js", `User ${subTask.user_id} deleted subtask ${subTask._id} \n ${subTask.title} successfully` );
      console.log( `User ${subTask.user_id} deleted subtask ${subTask._id} \n ${subTask.title} successfully`);
    }

    await Log.LogInfo( "INFO", "routes/api/task/deleteTask.js", `User ${user_id} deleted task ${deletedTask._id} \n ${deletedTask.title} successfully`);
    return res.status(200).json({ message: `User ${user_id} deleted a task successfully`, data: deletedTask, success: true,});

  }
  catch (error) {
    console.error(error);
    await Log.LogInfo(
      "ERROR",
      "routes/api/task/deleteTask.js",
      `Error deleting task: ${error.message}`
    );
    return res.status(500).json({
      message: "Error deleting task",
      error: error.message,
      success: false,
    });
  }
});

export default router;
