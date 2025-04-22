import express from "express";
import { createColumn, updateColumnTitle, getColumnsWithTasksAndComments, moveColumn } from "../controllers/column.controller.js";
import { createColumnValidation, updateColumnValidation } from "../validators/column.validator.js";
import authorize from "../middlewares/authorize.middleware.js";
import validate from "../middlewares/validate.middleware.js";

const columnRouter = express.Router();

columnRouter.post("/", authorize, createColumnValidation, validate, createColumn);

columnRouter.patch("/:columnId", authorize, updateColumnValidation, validate, updateColumnTitle);

columnRouter.get('/get-all/:boardId', getColumnsWithTasksAndComments);

columnRouter.patch('/columns/move', authorize, moveColumn);

export default columnRouter;
