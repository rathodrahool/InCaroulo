import { HttpStatus } from '@nestjs/common';

import { SUCCESS } from '@shared/constants/messages';

import { Response } from 'express';
import { List } from '@shared/interfaces/interfaces';
import { ResponseBody } from '@shared/constants/types';

const successCreate = <T>(res: Response, message: string, data?: T) => {
    const responseBody: ResponseBody<T> = {
        status: 1,
        message: message ? message : SUCCESS.RECORD_FETCHED('Record'),
    };

    if (data !== undefined) {
        responseBody.data = data;
    }

    res.status(HttpStatus.CREATED).json(responseBody);
};

const successResponse = <T>(res: Response, message: string, data?: T) => {
    const responseBody: ResponseBody<T> = {
        status: 1,
        message: message ? message : SUCCESS.RECORD_FETCHED('Record'),
    };

    if (data !== undefined) {
        responseBody.data = data;
    }
    res.status(HttpStatus.OK).json(responseBody);
};

const successResponseWithPagination = <T>(res: Response, message: string, payload: List<T>) => {
    res.status(HttpStatus.OK).json({
        status: 1,
        message: message ? message : SUCCESS.RECORD_FETCHED('Record'),
        total: payload.total,
        limit: payload.limit,
        offset: payload.offset,
        data: payload.data,
    });
};
const response = {
    successCreate,
    successResponse,
    successResponseWithPagination,
};

export default response;
