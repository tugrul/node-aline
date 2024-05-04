

import { Transform } from 'stream';
import type { TransformCallback, TransformOptions } from 'stream';

type AlineOptions = TransformOptions & {separator: string};

export default class Aline extends Transform {

    _tail: Buffer;
    _separator: string;

    constructor(options?: AlineOptions) {
        super();

        this._tail = Buffer.alloc(0);
        this._separator = (options && options.separator) || '\n';
    }
    
    _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback) {
        const index = chunk.lastIndexOf(this._separator);

        if (index === -1) {
            this._tail = Buffer.concat([this._tail, chunk]);
            callback();
            return;
        }

        if (index === chunk.length - 1) {
            const tail = this._tail;
            this._tail = Buffer.alloc(0);
            callback(null, Buffer.concat([tail, chunk]));
            return;
        }

        const head = Buffer.concat([this._tail, chunk.slice(0, index + 1)]);
        this._tail = Buffer.from(chunk.slice(index + 1));

        callback(null, head);
    }
    
    _flush(callback: TransformCallback) {
        callback(null, this._tail);
    }
}
