import express from "express";
import { getTasksByColumn, createTask, updateTask } from "../controllers/task.controller.js";
import { getTasksByColumnValidation, createTaskValidation, updateTaskValidation } from "../validators/task.validator.js";
import validate from "../middlewares/validate.middleware.js";
import authorize from "../middlewares/authorize.middleware.js";

const taskRouter = express.Router();

taskRouter.get("/column/:columnId", authorize, getTasksByColumnValidation, validate, getTasksByColumn);

taskRouter.post("/", authorize, createTaskValidation, validate, createTask);

taskRouter.put("/:taskId", authorize, updateTaskValidation, validate, updateTask);

export default taskRouter;