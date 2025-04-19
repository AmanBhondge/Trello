import express from "express";
import { createColumn, updateColumn } from "../controllers/column.controller.js";
import { createColumnValidation, updateColumnValidation } from "../validators/column.validator.js";
import authorize from "../middlewares/authorize.middleware.js";
import validate from "../middlewares/validate.middleware.js";

const columnRouter = express.Router();

columnRouter.post("/", authorize, createColumnValidation, validate, createColumn);

columnRouter.patch("/:columnId", authorize, updateColumnValidation, validate, updateColumn);

export default columnRouter;
