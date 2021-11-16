import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import 'express-async-errors';
import path from 'path';
import config from 'config';
import mongoose from 'mongoose';
import log from './log';
import createApiRouter from './routes/api';
import createWebRouter from './routes/web';

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
            mongoose.connection.close(() => {
            process.exit(0)
        });
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

    private database(): void {
        const DB_HOST = config.get('database.host');
        const DB_PORT = config.get('database.port');
        const DB_NAME = config.get('database.name');
        const DB_USER = config.get('database.user');
        const DB_PASS = config.get('database.pass');

        const uri = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`

        mongoose.connect(uri, {
            connectTimeoutMS: 5000,
            authSource: 'admin', // <--- Fixes 'Authentication failed' 
            user: DB_USER,
            pass: DB_PASS,
        })

        mongoose.connection
            .on('connecting', () => {
                log.warn('database', 'Connecting')
            })
            .on('connected', () => {
                log.info('database', 'Connected')
            })
            .on('disconnected', () => { // Event invokes together with 'close' event.
                log.warn('database', 'Connection lost')
            })
            .on('reconnected', () => {
                log.info('database', 'Connection restored')
            })
            .on('close', () => {
                log.warn('database', 'Connection closed')
            })
            .on('error', (err) => {
                log.error('database', `Error connecting to the database: ${err.message}`)
            });
    }

    private routes(): void {
        createApiRouter(this.express)
        createWebRouter(this.express, {
            rundir: path.join(__dirname, '..')
        })
    }
}

export default new App().express