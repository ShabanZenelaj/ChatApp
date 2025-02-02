import {NextFunction, Request, Response} from 'express';

const errorHandler = async (error: any, req: Request, res: Response, next: NextFunction): Promise<any> => {
    const status = error.status || 500;
    const log = { message: error.message, status: status, stack: error.stack };

    console.error({ message: error.message, status: status, stack: error.stack });
    return res.status(status).json(process.env.NODE_ENV === "development" ? log : { error: error.message });
};

export default errorHandler;