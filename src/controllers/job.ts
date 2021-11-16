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
        try {
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
        } catch (error) {
            log.error('job', error.message);
            let { FormidableError } = formidable.errors;
            if (error instanceof FormidableError) {
                res.status(error.httpCode).json({
                    error: error.message,
                    code: error.code
                });
            } else if (error instanceof mongoose.Error.ValidationError) {
                res.status(422).json(error);
            } else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
            }
        }
    }
}

export default new JobController()