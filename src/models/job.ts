import { Document, Schema, model } from "mongoose";
import { Status } from '../common/consts';

interface IJob extends Document {
    batch?: string,
    status?: string,
    title?: string,
    iFile?: string,
    oFile?: string,
    startedAt?: Date,
    finishedAt?: Date,
    createdAt?: Date,
    deletedAt?: Date,
}

const JobSchema = new Schema({
    status: {
        type: String,
        default: Status.DEFAULT,
    },
    title: {
        type: String,
        required: true,
    },
    iFile: {
        type: String,
        required: true,
    },
    oFile: {
        type: String,
        default: ''
    },
    startedAt: {
        type: Date,
        default: ''
    },
    finishedAt: {
        type: Date,
        default: ''
    },
    batch: {
        type: Schema.Types.ObjectId,
        ref: 'Batch',
    },
}, {
    timestamps: true
})

export default model<IJob>('Job', JobSchema,)
