import { Application, Router } from 'express'
import path from 'path'

export default function create(app: Application, { rundir = '.' }) {
    let router = Router()

    router.route('/')
        .get((req, res) => res.sendFile(path.resolve(rundir, 'public', 'index.html')))
    router.route('/test')
        .get((req, res) => res.send('This is a test.'))

    app.use('/', router)
}