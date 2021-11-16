import { ErrorRequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'
import { MongoServerError } from 'mongodb'
import { formidable } from 'formidable'
import mongoose from 'mongoose'

export const CatchDuplicateKey: ErrorRequestHandler = (err, req, res, next) => {
    if (err instanceof MongoServerError && err.code === 11000) { // DuplicateKey
        let errors = Object.entries(err['keyValue']).map(e => {
            return {
                field: e[0],
                message: `The ${e[0]} \`${e[1]}\` cannot be used`
            }
        })
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).error(errors, {
            message: 'An duplication error was ocurred'
        })
    } else {
        next(err)
    }
}

export const CatchValidation: ErrorRequestHandler = (err, req, res, next) => {
    if (err instanceof mongoose.Error.ValidationError) {
        let errors = Object.values(err['errors']).map(e => {
            return {
                field: e['path'],
                //kind: e['kind'],
                message: e['message'],
            }
        })
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).error(errors, {
            message: 'An validation error was ocurred'
        })
    } else {
        next(err)
    }
}

export const CatchForm: ErrorRequestHandler = (err, req, res, next) => {
    let { FormidableError } = formidable.errors;
    if (err instanceof FormidableError) {
        //res.status(err.statusCode).json({ text: err.message })
        res.status(err.httpCode).error({
            message: err.message,
            code: err.code
        });
    } else {
        next(err)
    }
}

export const Default: ErrorRequestHandler = (err, req, res, next) => {
    if (err instanceof HTTPError) {
        res.status(err.statusCode).error({ text: err.message })
    } else {
        next(err)
    }
}