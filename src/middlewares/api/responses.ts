import { Response, RequestHandler } from 'express'
import { getReasonPhrase, StatusCodes } from 'http-status-codes'

function MakeResponse(res: Response, statusCode: StatusCodes): Response {
    return res.status(statusCode).send({
        message: getReasonPhrase(statusCode)
    })
}

/**
 * Returns a default response for HTTP code 404 (Not Found)
 */
export const NotFound: RequestHandler = (req, res, next) => {
    MakeResponse(res, StatusCodes.NOT_FOUND)
}
/**
 * Returns a default response for HTTP code 405 (Method Not Allowed)
 */
export const MethodNotAllowed: RequestHandler = (req, res, next) => {
    MakeResponse(res, StatusCodes.METHOD_NOT_ALLOWED)
}