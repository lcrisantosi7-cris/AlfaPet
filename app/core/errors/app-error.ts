import { data } from "react-router";

/** Error de aplicación con código HTTP. `toResponse()` se lanza desde loaders/actions. */
export class AppError extends Error {
    readonly status: number;
    readonly headers?: HeadersInit;

    constructor(message: string, status = 500, headers?: HeadersInit) {
        super(message);
        this.name = new.target.name;
        this.status = status;
        this.headers = headers;
    }

    toResponse() {
        return data(this.message, { status: this.status, headers: this.headers });
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "No tienes permiso para ver esta sección", headers?: HeadersInit) {
        super(message, 403, headers);
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Recurso no encontrado", headers?: HeadersInit) {
        super(message, 404, headers);
    }
}

export class InvalidOriginError extends AppError {
    constructor() {
        super("Origen no permitido", 403);
    }
}
export class BadRequestError extends AppError {
    constructor(message = "Datos no válidos", headers?: HeadersInit) {
        super(message, 400, headers);
    }
}

export class ConflictError extends AppError {
    constructor(message: string, headers?: HeadersInit) {
        super(message, 409, headers);
    }
}