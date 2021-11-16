import { Document, model, Schema } from "mongoose";
import { Status } from '../common/consts';

interface IBatch extends Document {
    _id?: string,
    status?: string,
    params?: string,
    userId?: string,
    jobs?: any,
    startedAt?: Date,
    finishedAt?: Date,
    createdAt?: Date,
    deletedAt?: Date,
}

const BatchSchema = new Schema({
    _id: {
        type: Schema.Types.ObjectId
    },
    status: {
        type: String,
        default: Status.DEFAULT,
    },
    params: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    startedAt: {
        type: Date,
        default: ''
    },
    finishedAt: {
        type: Date,
        default: ''
    },
    jobs: [{ type: Schema.Types.ObjectId, ref: 'Job' }]

}, {
    timestamps: true
})

export default model<IBatch>('Batch', BatchSchema);
