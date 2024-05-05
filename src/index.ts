

import { Transform } from 'node:stream';
import type { TransformCallback, TransformOptions } from 'node:stream';

type AlineOptions = {separator: string};

export class Aline extends Transform {

    _tail: Buffer;
    _separator: string;

    constructor(options?: TransformOptions & AlineOptions) {
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


/**
 * Concatenates two Uint8Array instances into a single Uint8Array.
 * @param left - The first Uint8Array to concatenate.
 * @param right - The second Uint8Array to concatenate.
 * @returns A new Uint8Array containing the concatenated elements of the input arrays.
 * If one of the input arrays is empty, the function returns the other array unchanged.
 * If both input arrays are empty, an empty Uint8Array is returned.
 */
export function concat(left: Uint8Array, right: Uint8Array): Uint8Array {
    if (left.length === 0) {
        return right;
    }

    if (right.length === 0) {
        return left;
    }

    const merged = new Uint8Array(left.length + right.length);
    merged.set(left);
    merged.set(right, left.length);
    return merged;
}

/**
 * Finds the last occurrence of an exact sequence of bytes (data) within another sequence of bytes (right).
 * @param data - The sequence of bytes to search within.
 * @param right - The exact sequence of bytes to search for.
 * @returns The index of the last occurrence of the specified exact sequence of bytes within the given sequence, or -1 if not found.
 */
export function lastIndexOf(data: Uint8Array, search: Uint8Array): number {

    if (search.length === 0 || data.length === 0) {
        return -1;
    }

    const index = data.lastIndexOf(search[0]);

    if (index > -1) {
        if (data.length - index < search.length) {
            return -1;
        }

        for (let i = 0; i < search.length; i++) {
            if (data[index + i] !== search[i]) {
                return -1;
            }
        }
    }

    return index;
}


export class AlineWeb implements Transformer<Uint8Array, Uint8Array> {

    _tail: Uint8Array;
    _seperator: Uint8Array;

    constructor(options?: AlineOptions) {
        const encoder = new TextEncoder();

        this._seperator = encoder.encode((options && options.separator) || '\n');
        this._tail = new Uint8Array();
    }

    start() {
        this._tail = new Uint8Array();
    }

    transform(chunk: Uint8Array, controller: TransformStreamDefaultController<Uint8Array>): void {

        if (!chunk) {
            return;
        }

        const index = lastIndexOf(chunk, this._seperator);

        if (index === -1) {
            this._tail = concat(this._tail, chunk);
            return;
        }

        if (index === chunk.length - 1) {
            const tail = this._tail;
            this._tail = new Uint8Array();
            const data = concat(tail, chunk);
            data.length > 0 && controller.enqueue(data);
            return;
        }

        const head = concat(this._tail, chunk.slice(0, index + 1));
        this._tail = chunk.slice(index + 1);

        head.length > 0 && controller.enqueue(head);
    }

    flush(controller: TransformStreamDefaultController<Uint8Array>): void {
        this._tail.length > 0 && controller.enqueue(this._tail);
    }
}



