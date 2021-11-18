import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { URL, URLSearchParams } from 'url';
import * as Crypto from '../helpers/crypto';
import jwt from 'jsonwebtoken';
import log from '../log';

const LABEL = 'session';
const FIELD_TOKEN = 'session_token';

declare global {
    namespace Express {
        interface Request {
            session?: any
        }
    }
}

export const Verify: RequestHandler = async (req, res, next) => {
    let app = res.app;
    let secret = app.get('secret');
    let tokenOptions = {};//{expiresIn: app.get('jwt.expiresIn') || '300s' };
    let sessionToken = req.cookies[FIELD_TOKEN];
    let session = {}

    try {
        if (!sessionToken) {
            log.verbose(LABEL, 'Creating session');
            session = {
                id: Crypto.makeUUID()
            }
        } else {
            log.verbose(LABEL, 'Decoding session');
            let decodedToken = await jwt.verify(sessionToken, secret);
            session = decodedToken[LABEL];
        }
        sessionToken = await jwt.sign({ session: session }, secret, tokenOptions);
        req.session = session;
        res.cookie(FIELD_TOKEN, sessionToken);
        log.verbose(LABEL, JSON.stringify(session));
        log.verbose(LABEL, sessionToken);
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            log.error(LABEL, 'Token invalid');
        } else if (error instanceof jwt.TokenExpiredError) {
            log.error(LABEL, 'Token expired');
        } else {
            log.error(LABEL, error.message);
        }
        res.status(StatusCodes.BAD_REQUEST).end();
    }
}