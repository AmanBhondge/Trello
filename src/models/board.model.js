import mongoose from "mongoose";

const boardSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    visibility: {
        type: String,
        required: true,
        enum: ['workspace', 'private'],
    },
    columns: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Column",
        },
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    activityLog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Log",
    },
    chatRoomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChatRoom",
    }
},
    {
        timestamps: true
    }
);

const Board = mongoose.model("Board", boardSchema);

export default Board