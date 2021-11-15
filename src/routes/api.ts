import { Application, Router } from 'express'
import * as ApiErrorResponse from '../middlewares/api/responses'

function createApis() {
    return {
        v1: (() => {
            let router = Router()
            router.route('/test')
                .get((_, res) => res.send({ response: 'This is an api endpoint test' }))
            return router
        })()
    }
}

export default function create(app: Application) {
    let apis = createApis()
    let api = Router()

    api.use('/', Object.entries(apis).reduce((r, a) => r.use(`/${a[0]}`, a[1]), Router()))
    api.use('*', ApiErrorResponse.NotFound)

    app.set('apis', apis);
    app.use('/api', api);
}