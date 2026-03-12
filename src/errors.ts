export class AppError extends Error {
    constructor(
        public statusCode: number,
        message: string,
    ) {
        super(message);
    }
}

export class ConflictError extends AppError {
    constructor(message = "Resource already exists") {
        super(409, message);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Invalid credentials") {
        super(401, message);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Forbidden") {
        super(403, message);
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
        super(404, message);
    }
}

export class InternalServerError extends AppError {
    constructor(message = "Internal server error") {
        super(500, message);
    }
}
