import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import JobService from '../services/job';
import JobTransformer from '../transformers/job';
import BatchTransformer from '../transformers/batch';
import * as Form from '../helpers/form';
import path from 'path';
import { logFixedPrefix } from '../log';
import fs from 'fs';
import { Status } from '../common/consts';
import Media, { CategoryType, TranscoderOpts } from '../common/media'

const log = logFixedPrefix('job_controller');

function validateReceivedForm(form: Form.ReceivedForm) {
    let { files, fields } = form;

    if (Object.keys(files).length == 0) {
        throw Error('No file was received');
    }

    if (!fields.json) {
        throw Error('No json was received');
    }

    // TODO: Validate files by probing/decoding them
}

function validateOutputOpts(outputOpts: TranscoderOpts) {
    let { format, stream } = outputOpts;

    let mfi = Media.Capability.Format(format);

    if (!mfi) {
        throw Error(`Invalid format: ${format}`);
    }

    let vcodec = stream.video?.codec;
    let acodec = stream.audio?.codec;

    if (vcodec && (format === CategoryType.VIDEO)) {
        let found = mfi.codecs.video.find(e => e === vcodec);
        if (!found) {
            throw Error(`Invalid video codec: ${vcodec}`);
        }
    }

    if (acodec && (format === CategoryType.VIDEO || format === CategoryType.AUDIO)) {
        let found = mfi.codecs.audio.find(e => e === acodec);
        if (!found) {
            throw Error(`Invalid audio codec: ${acodec}`);
        }
    }
}

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
     * Retrieves a output file of the resource
     * 
     * @param {Request} req 
     * @param {Response} res 
     * @returns {Promise<void>}
     */
    async download(req: Request, res: Response): Promise<void> {
        let {
            id
        }: {
            id?: string
        } = req.params

        try {
            let job = await JobService.select(id);

            if (job && job.status == Status.SUCCEDED) {
                let params = JSON.parse(job.batch.params);
                let mfi = Media.Capability.Format(params.format)
                let app = res.app;
                let outputDir = app.get('dirs').output;
                let outputFile = path.join(outputDir, job.oFile);
                let filename = `${path.parse(job.title).name}.${mfi.extension ?? params.format}`;
                res.download(outputFile, filename);
            } else {
                res.sendStatus(StatusCodes.NOT_FOUND);
            }
        } catch (err) {
            log.error('download', err.message);
            res.sendStatus(StatusCodes.BAD_REQUEST);
        }
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
        let userId = req.session.id;
        let app = req.app;
        let uploadDir = app.get('dirs').upload;
        let outputDir = app.get('dirs').output;
        let transcoder = app.get('transcoder');
        let form: Form.ReceivedForm;
        let outputOpts = {};

        try {
            try {
                form = await Form.receiveFiles(req);
            } catch (error) {
                log.error(error);
                throw Error("An error occured while parsing form data");
            }

            validateReceivedForm(form);

            let { files, fields } = form;
            let outputOptsJson = fields['json'] as string;

            try {
                outputOpts = JSON.parse(outputOptsJson) as TranscoderOpts;
            } catch (error) {
                log.error(error);
                throw Error('Invalid json data');
            }

            validateOutputOpts(outputOpts);

            // Create batch and jobs for each file
            let batch = await JobService.createBatch({
                userId: userId,
                params: outputOptsJson,
                files: Object.values(files).map(file => {
                    return {
                        title: file['originalFilename'],
                        iFile: file['newFilename'],
                        oFile: file['newFilename'],
                        //mimeType: file['mimetype'],
                    }
                }),
            });

            // Try making a output folder if not exist
            await fs.promises.mkdir(outputDir, { recursive: true });

            // Create transcode tasks to each job
            batch.jobs.map(async (job) => {
                await transcoder.add({
                    jobId: job._id,
                    iFile: path.join(uploadDir, job.iFile),
                    oFile: path.join(outputDir, job.oFile),
                    outputOpts: outputOpts
                });
            })

            res.status(StatusCodes.CREATED).json(BatchTransformer(batch));
        } catch (error) {
            //TODO: fallback operation
            log.error(error.message)
            res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
        }
    }
}

export default new JobController()