import mongoose from "mongoose";
import Batch from '../models/batch';
import Job from '../models/job';
import { Status } from '../common/consts';

interface CreateBatchFile {
    title: string,
    iFile: string,
    oFile: string,
}

interface CreateBatchInput {
    userId: string,
    params: string,
    files: CreateBatchFile[]
}

class JobService {
    private jobDefaultFieldsToSelect: string[];

    constructor() {
        this.jobDefaultFieldsToSelect = [
            '_id',
            'status',
            'title',
            'iFile',
            'oFile',
            'batch',
            'createdAt',
            'startedAt',
            'finishedAt',
        ]
    }
    /**
     * Selects a job
     * 
     * @param {string} id The resource id
     * @returns {Promise<any>}
     */
    async select(id: string): Promise<any> {
        return await Job
            .findById(id)
            .populate({
                path: 'batch',
                select: [
                    '_id',
                    'status',
                    'params',
                    'createdAt',
                    'updatedAt',
                ]
            })
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
                select: this.jobDefaultFieldsToSelect
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
     * @param {Object.<string>} userId Owner id
     * @param {Object.<string>} params Batch parameters for all linked jobs
     * @param {Object.<CreateBatchFile>} files List of files received from user
     * @returns {Promise<any>}
     */
    async createBatch({
        userId,
        params,
        files,
    }: CreateBatchInput): Promise<any> {
        let newBatchId = new mongoose.Types.ObjectId();

        let jobs = await Job.insertMany(
            Object.values(files).map(i => {
                return {
                    batch: newBatchId,
                    status: Status.WAITING,
                    title: i.title,
                    iFile: i.iFile,
                    oFile: i.oFile,
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
            select: this.jobDefaultFieldsToSelect
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