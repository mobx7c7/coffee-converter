import { Application, Router } from 'express'
import * as ApiModifiers from '../middlewares/api/modifiers'
import * as ApiErrorHandlers from '../middlewares/api/error'
import * as ApiErrorResponse from '../middlewares/api/responses'
import * as Session from '../middlewares/session'
import JobController from '../controllers/job'
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import log from '../log';
import fs from 'fs';

function createApis() {
    return {
        v1: (() => {
            let router = Router();
            router.use('/test', (() => {
                let router = Router();
                router.route('/')
                    .get((_, res) => res.send({ response: 'This is an api endpoint test' }))
                    .all(ApiErrorResponse.MethodNotAllowed);
                router.route('/transcode')
                    .get(async (req, res) => {
                        let transcoder = req.app.get('transcoder');
                        let jobs = await transcoder.getJobs();
                        res.status(StatusCodes.OK).json(jobs);
                    })
                    .post(async (req, res) => {
                        let transcoder = req.app.get('transcoder');
                        await transcoder.process();
                        res.sendStatus(StatusCodes.OK);
                    })
                    .put(async (req, res) => {
                        let transcoder = req.app.get('transcoder');
                        await transcoder.add({ video: 'http://example.com/video1.mov' });
                        res.sendStatus(StatusCodes.OK);
                    })
                    .all(ApiErrorResponse.MethodNotAllowed);
                return router;
            })())
            router.use('/app', (() => {
                router.route('/data')
                    .delete(async (req, res) => {
                        let app = req.app;
                        let transcoder = app.get('transcoder');
                        let storageDir = app.get('dirs').storage;

                        log.info('app', 'Clear transcoder queue');
                        await transcoder.clear();

                        log.info('app', 'Clear database');
                        await mongoose.connection.db.dropDatabase();

                        log.info('app', 'Clear work folder');
                        await fs.promises.rmdir(storageDir, { recursive: true });

                        res.sendStatus(StatusCodes.OK);
                    })
                    .all(ApiErrorResponse.MethodNotAllowed);
                return router;
            })())
            router.use('/jobs', (() => {
                let router = Router()
                router.route('/')
                    .get(JobController.index)
                    .put(JobController.store)
                    .all(ApiErrorResponse.MethodNotAllowed);
                router.route('/:id')
                    .get(JobController.show)
                    .delete(JobController.abort)
                    .all(ApiErrorResponse.MethodNotAllowed);
                router.route('/:id/download')
                    .get(JobController.download)
                    .all(ApiErrorResponse.MethodNotAllowed);
                return router;
            })())
            return router;
        })()
    }
}

export default function create(app: Application) {
    let apis = createApis()
    let api = Router()

    api.use(Session.Verify);

    api.use(ApiModifiers.AddEndpointInfo);
    api.use(ApiModifiers.AddResponseHelpers);

    api.use('/', Object.entries(apis).reduce((r, a) => r.use(`/${a[0]}`, a[1]), Router()))
    api.use('*', ApiErrorResponse.NotFound)

    api.use(ApiErrorHandlers.CatchDuplicateKey);
    api.use(ApiErrorHandlers.CatchValidation);
    api.use(ApiErrorHandlers.CatchForm);
    api.use(ApiErrorHandlers.Default);

    app.set('apis', apis);
    app.use('/api', api);
}