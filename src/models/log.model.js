import mongoose from "mongoose";

const logSchema = new mongoose.Schema({

    boardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true
    },
},
    {
        timestamps: true
    }
);

const Log = mongoose.model("Log", logSchema);

export default Log;