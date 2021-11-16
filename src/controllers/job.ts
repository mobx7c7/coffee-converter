import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { formidable } from 'formidable'
import JobService from '../services/job';
import * as Form from '../helpers/form';
import log from '../log';
import path from 'path';
import mongoose from "mongoose";

class JobController {
    /**
     * Creates a new resource.
     * 
     * @param {Request} req 
     * @param {Response} res 
     * @param {NextFunction} next 
     * @returns {Promise<void>}
     */
    async store(req: Request, res: Response): Promise<void> {
            let form = await Form.receiveFiles(req);
            let batch = await JobService.createBatch({
                files: Object.values(form.files).map(f => {
                    return {
                        title: f.originalFilename,
                        iFile: path.basename(f.filepath),
                    }
                }),
                params: req.body.params,
                userId: '',
            });
            res.status(StatusCodes.CREATED).json(batch);
    }
}

export default new JobController()