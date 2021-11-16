import crypto from 'crypto';
import * as uuid from 'uuid';

export function makeUUID(): string {
    return uuid.v4();
}

export function validateUUID(val): boolean {
    return uuid.validate(val);
}

export function randomChars(length): string {
    const allowedChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for (var i = 0; i < length; i++) {
        result += allowedChars.charAt(Math.floor(Math.random() * allowedChars.length));
    }
    return result;
}

export function hashPassword(pass): string {
    return pass ? crypto.createHash('md5').update(pass).digest('hex') : ''
}
