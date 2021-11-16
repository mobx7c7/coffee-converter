import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import JobService from '../services/job';
import JobTransformer from '../transformers/job';
import BatchTransformer from '../transformers/batch';
import * as Form from '../helpers/form';
import path from 'path';
import log from '../log';
import fs from 'fs';
import { Status } from '../common/consts';

class JobController {
    /**
     * Retrieves a list of the resource
     * 
     * @param {Request} req 
     * @param {Response} res 
     * @returns {Promise<void>}
     */
    async index(req: Request, res: Response): Promise<void> {
        let batches = await JobService.selectAll({
            filters: {
                userId: req.session.id
            }
        });
        res.json(batches.map(BatchTransformer));
    }
    /**
     * Retrieves a specified resource.
     * 
     * @param {Request} req 
     * @param {Response} res 
     * @returns {Promise<void>}
     */
    async show(req: Request, res: Response): Promise<void> {
        let {
            id
        }: {
            id?: string
        } = req.params

        let job = await JobService.select(id);

        if (job) {
            res.send(JobTransformer(job))
        } else {
            res.sendStatus(StatusCodes.NOT_FOUND);
        }
    }
    /**
     * Creates a new resource.
     * 
     * @param {Request} req 
     * @param {Response} res 
     * @param {NextFunction} next 
     * @returns {Promise<void>}
     */
    async store(req: Request, res: Response): Promise<void> {
        let {
            params
        }: {
            params?: string
        } = req.query

        let userId = req.session.id;
        let form = await Form.receiveFiles(req);
        let batch = await JobService.createBatch({
            files: Object.values(form.files).map(f => {
                return {
                    title: f.originalFilename,
                    iFile: path.basename(f.filepath),
                }
            }),
            params: params,
            userId: userId,
        });

        let app = req.app;
        let uploadDir = app.get('dirs').upload;
        let outputDir = app.get('dirs').output;
        let transcoder = app.get('transcoder');

        await fs.promises.mkdir(outputDir, { recursive: true });

        batch.jobs.map(async (job) => {
            await transcoder.add({
                jobId: job._id,
                iFile: path.join(uploadDir, job.iFile),
                oFile: path.join(outputDir, job.iFile),
                params: batch.params,
            });
        })

        res.status(StatusCodes.CREATED).json(BatchTransformer(batch));
    }
}

export default new JobController()