import mongoose from "mongoose";
import Batch from '../models/batch';
import Job from '../models/job'
import { Status } from '../common/consts';

class JobService {
    /**
    * Creates a job batch
    * 
    * @returns {Promise<any>}
    */
    async createBatch({
        files = {},
        params = '',
        userId = ''
    }: {
        files?: any,
        params?: string,
        userId?: string
    } = {}): Promise<any> {
        let newBatchId = new mongoose.Types.ObjectId();

        let jobs = await Job.insertMany(
            Object.values(files).map(i => {
                return {
                    batch: newBatchId,
                    status: Status.WAITING,
                    title: i.title,
                    iFile: i.iFile,
                }
            })
        );

        let batch = await Batch.create({
            _id: newBatchId,
            status: Status.WAITING,
            params: params,
            userId: userId,
            jobs: jobs.map(j => j._id),
        });

        await batch.populate({
            path: 'jobs',
            select: [
                '_id',
                'status',
                'title',
                'oFile',
                'startedAt',
                'finishedAt',
                'createdAt',
            ]
        })

        return {
            id: batch._id,
            status: batch.status,
            params: batch.params,
            userId: batch.userId,
            jobs: batch.jobs.map(j => {
                return {
                    id: j._id,
                    status: j.status,
                    title: j.title,
                    downloadUrl: j.oFile,
                    createdAt: j.createdAt || undefined,
                    startedAt: j.startedAt,
                    finishedAt: j.finishedAt || undefined,
                }
            }),
            createdAt: batch.createdAt,
            updatedAt: batch.updatedAt
        }
    }
}

export default new JobService()