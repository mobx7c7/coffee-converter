import { Request } from 'express';
import formidable, { Fields, File, Files } from 'formidable';
import IncomingForm from 'formidable/Formidable';
import fs from 'fs';

export interface ReceivedForm {
    form: IncomingForm,
    files: Files,
    fields: Fields,
}

export async function receiveFiles(req: Request): Promise<ReceivedForm> {
    let uploadDir = req.app.get('dirs').upload;

    const form = formidable({
        multiples: true,
        maxFields: 1000,
        minFileSize: 1,
        maxFileSize: 1024 ** 4, // 1GB
        maxFieldsSize: 1024 ** 4, // 1GB
        uploadDir: uploadDir,
    });

    await fs.promises.mkdir(uploadDir, { recursive: true });

    return new Promise((resolve, reject) => {
        form.parse(req, (error, fields, files) => {
            if (error) {
                reject(error);
            } else {
                resolve({
                    form: form,
                    files: files,
                    fields: fields,
                });
            }
        });
    });
}