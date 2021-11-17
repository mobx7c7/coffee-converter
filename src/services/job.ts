import mongoose from "mongoose";
import Batch from '../models/batch';
import Job from '../models/job';
import { Status } from '../common/consts';

class JobService {
    /**
     * Selects a job
     * 
     * @param {string} id The resource id
     * @returns {Promise<any>}
     */
    async select(id: string): Promise<any> {
        return await Job.findById(id);
    }
    /**
     * Selects all jobs
     * 
     * @param {Object.<any>} filters Query parameters
     * @param {Object.<number>} offset Result position
     * @param {Object.<number>} length Amount of resources per result
     * @returns {Promise<any>}
     */
    async selectAll({
        filters = null,
        offset = 0,
        length = 10
    }: {
        filters?: any,
        offset?: number,
        length?: number
    } = {}): Promise<any> {
        let query

        if (filters) {
            let fields = ['userId']
            query = fields.reduce((q, f) => {
                if (f in filters) {
                    q[f] = { $eq: filters[f] }
                }
                return q
            }, {})
        }

        return await Batch
            .find(query)
            .populate({
                path: 'jobs',
                select: [
                    '_id',
                    'status',
                    'title',
                    'iFile',
                    'oFile',
                    'createdAt',
                    'startedAt',
                    'finishedAt',
                ]
            })
            .select(['jobs'])
            .skip(offset)
            .limit(length)
            .sort({ createdAt: 'asc' })
            .lean(true)
            .select([
                '_id',
                'status',
                'params',
                'createdAt',
                'jobs',
            ]);
    }
    /**
     * Creates a batch
     * 
     * @param {Object.<any>} files List of files received from user
     * @param {Object.<number>} params Batch parameters for all jobs
     * @param {Object.<number>} userId Owner id
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

        return await batch.populate({
            path: 'jobs',
            select: [
                '_id',
                'status',
                'title',
                'iFile',
                'oFile',
                'createdAt',
                'startedAt',
                'finishedAt',
            ]
        });
    }
    /**
     * Updates a job
     * 
     * @param {string} id The resource id
     * @param {any} input The data to be updated
     * @returns {Promise<any>}
     */
    async updateOne({
        id = '',
        input = null,
    }: {
        id?: string,
        input?: any
    } = {}): Promise<any> {
        return await Job.updateOne({ _id: id }, input);
    }
    /**
     * Updates a job status
     * 
     * @param {string} id The resource id
     * @param {string} status The job status
     * @returns {Promise<any>}
     */
    async updateStatus(id: string, status: string): Promise<any> {
        return await this.updateOne({
            id: id,
            input: { status: status }
        })
    }
}

export default new JobService()