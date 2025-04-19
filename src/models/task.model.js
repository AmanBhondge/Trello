import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    columnId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "column",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    assigne: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    tags: [
        {
            type: String
        }
    ],
    dueDate: {
        type: Date
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "comment"
        }
    ],
    attachments: [
        {
            type: String
        }
    ]

});

const Task = mongoose.model("Task", taskSchema);

export default Task;