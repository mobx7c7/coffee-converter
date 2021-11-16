import formidable from 'formidable';
import fs from 'fs';

export async function receiveFiles(req): Promise<any> {
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
                    fields: fields,
                    files: files
                });
            }
        });
    });
}