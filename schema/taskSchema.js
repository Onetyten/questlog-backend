import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userProfile",
        required: true,
    },
    parent_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "task",
        default: null,

    },
    title: {
        type: String,
        required: true,
    },
    status:{
        type: String ,
        enum: ["pending","completed","ongoing","archived"],
        default: "pending",
    },
    priority:{
        type:String,
        enum:["low","medium","high"],
        default:"low",
    },
    dueDate:{
        type:Date,
        default:null,
    },
    dateCreated:{
        type:Date,
        default:Date.now,
    },
    


})

const task = new mongoose.model("task",taskSchema);
export default task;