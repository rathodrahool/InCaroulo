import { HttpException, HttpStatus } from '@nestjs/common';

import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

const uploadDirectory = join(process.env.DATA_DIR, 'public', 'temp');

export const fileStorageConfig = {
    // limits of image size
    limits: {
        fileSize: 200000, //maximum size 2mb
    },
    // check file extension
    fileFilter: (req: any, file: any, cb: any) => {
        if (file.mimetype.match(/\/(csv|png|jpg|jpeg)$/)) {
            cb(null, true);
        } else {
            cb(new HttpException(`Unsupported file type ${extname(file.originalname)}`, HttpStatus.BAD_REQUEST), false);
        }
    },

    storage: diskStorage({
        // define path for store image
        destination: (req: any, file: any, cb: any) => {
            switch (file.fieldname) {
                case 'file': {
                    if (!existsSync(`${uploadDirectory}`)) {
                        mkdirSync(`${uploadDirectory}`, {
                            recursive: true,
                        });
                    }
                    cb(null, `${uploadDirectory}`);
                    break;
                }
            }
        },

        // rename original file
        filename: (req: any, file: any, cb: any) => {
            const name = `${randomUUID()}${extname(file.originalname)}`;
            cb(null, name);
        },
    }),
};
