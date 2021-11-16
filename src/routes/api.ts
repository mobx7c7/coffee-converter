import { Application, Router } from 'express'
import * as ApiModifiers from '../middlewares/api/modifiers'
import * as ApiErrorHandlers from '../middlewares/api/error'
import * as ApiErrorResponse from '../middlewares/api/responses'
import * as Session from '../middlewares/session'
import JobController from '../controllers/job'

function createApis() {
    return {
        v1: (() => {
            let router = Router()
            router.route('/test')
                .get((_, res) => res.send({ response: 'This is an api endpoint test' }))
            router.use('/jobs', (() => {
                let router = Router()
                router.route('/')
                    .put(JobController.store)
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