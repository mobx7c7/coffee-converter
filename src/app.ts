import cors from 'cors'
import cookieParser from 'cookie-parser';
import express from 'express'
import 'express-async-errors'
import log from './log'
import config from 'config'

class App {
    public express: express.Application

    private signalEvent(name, handler) {
        process.on(name, () => {
            log.warn('app', `${name} received`)
            handler()
        });
    }

    constructor() {
        this.express = express();
        this.configs();
        this.middlewares();
        this.database();
        this.routes();
        this.signalEvent('SIGINT', () => {
            process.exit(0)
        });
    }

    private configs(): void {
        this.express.set('port', config.get('server.port') || process.env.PORT);
        this.express.set('config', config);
        this.express.set('json spaces', 2);
    }

    private middlewares(): void {
        this.express.use(cookieParser());
        this.express.use(express.json());
        this.express.use(express.urlencoded({ extended: true }));
        this.express.use(cors());
    }

    private database(): void { }

    private routes(): void { }
}

export default new App().express