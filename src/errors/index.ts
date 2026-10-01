export class AppError extends Error {
    constructor (message: string, public statusCode: number) {
        super(message);
        this.name = this.constructor.name;
    }
} 

/** 400 Bad Request */
export class BadRequestError extends AppError {
    constructor(message: string) { super(message, 400) }
}

/** 401 Unauthorized */
export class UnauthorizedError extends AppError {
    constructor(message: string) { super(message, 401) }
}

/** 409 Conflict */
export class ConflictError extends AppError {
    constructor(message: string) { super(message, 409) }
}