export class AppError extends Error {
    constructor(
        message: string,
        public statusCode: number
    ) {
        super(message);
        this.name = this.constructor.name;
    }
}

/** 400 Bad Request */
export class ValidationError extends AppError {
    constructor(
        message: string,
        public details?: Array<{ field: string; message: string }>
    ) {
        super(message, 400);
    }
}

/** 401 Unauthorized */
export class UnauthorizedError extends AppError {
    constructor(message: string) {
        super(message, 401);
    }
}

/** 403 Forbidden */
export class ForbiddenError extends AppError {
    constructor(message: string) {
        super(message, 403);
    }
}

/** 404 Not found */
export class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404);
    }
}

/** 409 Conflict */
export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409);
    }
}
/** 429 Too Many Requests */
export class TooManyRequestsError extends AppError {
    constructor(message: string) {
        super(message, 429);
    }
}

/** 502 Bad Gateway */
export class DeliveryError extends AppError {
    constructor(message: string) {
        super(message, 502);
    }
}
