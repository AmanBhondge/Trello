import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    columnId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Column",
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
        ref: "User",
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
            ref: "Comment"
        }
    ],
    attachments: [
        {
            type: String
        }
    ],
    position: {
        type: Number,
        required: true
    }

},
    {
        timestamps: true
    }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;