import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { URL, URLSearchParams } from 'url';

declare global {
    namespace Express {
        interface Request {
            endpointUrl?: any
        }
        interface Response {
            success?: ApiSuccessResponse
            error?: ApiErrorResponse,
            page?: ApiPageResponse
        }
    }
}

interface ApiResponseOptions {
    message?: string
}

interface ApiErrorResponse {
    (data: any, opts?: ApiResponseOptions): any
}

interface ApiSuccessResponse {
    (data: any, opts?: ApiResponseOptions): any
}

interface ApiPageResponse {
    ({ items, offset, length, count }: { items?: any[], offset?: number, length?: number, count?: number }): any
}

export const AddEndpointInfo: RequestHandler = (req, res, next) => {
    req.endpointUrl = `${req.protocol}://${req.headers.host}${req.originalUrl.split('?')[0]}`
    next()
}

export const AddResponseHelpers: RequestHandler = (req, res, next) => {
    res.success = (data, opts = {}) => {
        return res.send({
            status: 'success',
            message: opts.message ?? 'The request has succeded.',
            response: data ?? null
        })
    }
    res.error = (data, opts = {}) => {
        return res.send({
            status: 'error',
            message: opts.message ?? 'The request has failed.',
            errors: data ?? null
        })
    }
    res.page = ({
        items = [],
        offset = 0,
        length = 0,
        count = Infinity,
    }) => {
        let endpointUrl = req.endpointUrl
        let countLeft = count - length - offset
        return res.success({
            items: items,
            offset: offset,
            length: length,
            last: (() => {
                if (offset > 0) {
                    let offset2 = Math.max(offset - length, 0)
                    let url = new URL(endpointUrl)
                    url.searchParams.append("offset", offset2.toString())
                    url.searchParams.append("length", length.toString())
                    return url
                }
                return null
            })(),
            next: (() => {
                if (countLeft > 0) {
                    let offset2 = Math.min(offset + length, count - 1)
                    let url = new URL(endpointUrl)
                    url.searchParams.append("offset", offset2.toString())
                    url.searchParams.append("length", length.toString())
                    return url
                }
                return null
            })()
        })
    }
    next()
}