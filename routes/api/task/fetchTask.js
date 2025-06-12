import express from "express";
import task from "../../../schema/taskSchema.js";
import Log from "../../../logs/log.js";

const router = express.Router();

router.get("/fetch", async (req, res) => {
  try {
    const sortBy = req.query.sortBy || "createdAt";
    const order = req.query.order === "desc" ? -1 : 1;
    const user_id = req.user.id;
    const filter = { user_id };

    if (req.query.priority) {
      filter.priority = req.query.priority;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.today === "true") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
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

    // Custom sort logic for "priority" or "status"
    if (sortBy === "priority") {
      const priorityOrder = {
        high: 1,
        medium: 2,
        low: 3,
      };

      const tasks = await task.aggregate([
        { $match: filter },
        {
          $addFields: {
            sortOrder: {
              $switch: {
                branches: [
                  { case: { $eq: ["$priority", "high"] }, then: 1 },
                  { case: { $eq: ["$priority", "medium"] }, then: 2 },
                  { case: { $eq: ["$priority", "low"] }, then: 3 },
                ],
                default: 4,
              },
            },
          },
        },
        { $sort: { sortOrder: order } },
      ]);

      return res
        .status(200)
        .json({ message: "Tasks fetched with custom priority sort", tasks, success: true });
    }

    if (sortBy === "status") {
      const tasks = await task.aggregate([
        { $match: filter },
        {
          $addFields: {
            sortOrder: {
              $switch: {
                branches: [
                  { case: { $eq: ["$status", "pending"] }, then: 1 },
                  { case: { $eq: ["$status", "ongoing"] }, then: 2 },
                  { case: { $eq: ["$status", "completed"] }, then: 3 },
                  { case: { $eq: ["$status", "archived"] }, then: 4 },
                ],
                default: 5,
              },
            },
          },
        },
        { $sort: { sortOrder: order } },
      ]);

      return res
        .status(200)
        .json({ message: "Tasks fetched with custom status sort", tasks, success: true });
    }

    // Default sort
    const tasks = await task.find(filter).sort({ [sortBy]: order });

    if (!tasks || tasks.length === 0) {
      await Log.LogInfo("INFO", "routes/api/task/fetchTask.js", `No tasks found for user ${user_id}`);
      return res.status(404).json({ message: "No tasks found", success: false });
    }

    res.status(200).json({ message: "Tasks fetched successfully", tasks, success: true });
  } catch (error) {
    console.error(error);
    await Log.LogInfo("ERROR", "routes/api/task/fetchTask.js", `Error fetching tasks: ${error.message}`);
    res.status(500).json({ message: "Internal server error", success: false });
  }
});

export default router;
