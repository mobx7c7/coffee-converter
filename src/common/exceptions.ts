import { getReasonPhrase, StatusCodes } from "http-status-codes";

export class HTTPError extends Error {
    public statusCode: number
    public errors: any

    constructor(errors, statusCode: StatusCodes) {
        super(errors || getReasonPhrase(statusCode))
        this.statusCode = statusCode
        this.errors = errors
    }
}

export class NotImplementedError extends HTTPError {
    constructor(message = null) {
        super(message, StatusCodes.NOT_IMPLEMENTED)
    }
}

export class NotFoundError extends HTTPError {
    constructor(message = null) {
        super(message, StatusCodes.NOT_FOUND)
    }
}

export class InputValidationError extends Error { }