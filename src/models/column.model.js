import mongoose from "mongoose";

const columnSchema = new mongoose.Schema(
    {
        boardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Board",
            required: true
        },
        title: {
            type: String,
            required: true
        },
        position: {
            type: Number,
            required: true
        },
        taskId: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Task"
            }
        ]
    }
);

const Column = mongoose.model("Column", columnSchema);

export default Column;