
import { Transform } from 'node:stream';
import type { TransformCallback, TransformOptions } from 'node:stream';

import {
    AlineOptions,
    DEFAULT_SEPARATOR,
    concat,
    lastIndexOf,
    splitLines,
} from './core.js';

export { AlineOptions, concat, lastIndexOf } from './core.js';

/**
 * A Node.js `Transform` stream that aligns chunks to separator boundaries.
 *
 * By default, every emitted chunk ends at a `'\n'` boundary so downstream
 * consumers never receive a line split across two chunks.
 *
 * With `readline: true`, each emitted chunk contains exactly one line
 * (separator included), making per-line processing trivial.
 *
 * This implementation targets Node.js and uses the `node:stream` Transform
 * API. For a runtime-agnostic version that works in browsers, Deno, and Bun
 * use the `aline/web` entry point instead.
 *
 * @example
 * // Pipe a readable through Aline
 * fs.createReadStream('data.ndjson').pipe(new Aline());
 *
 * @example
 * // Readline mode
 * fs.createReadStream('data.ndjson').pipe(new Aline({ readline: true }));
 *
 * @example
 * // Custom separator
 * source.pipe(new Aline({ separator: '\r\n' }));
 */
export class Aline extends Transform {
    private _tail: Buffer;
    private _separator: Buffer;
    private _readline: boolean;

    constructor(options?: TransformOptions & AlineOptions) {
        // Strip our custom keys before passing the rest to Transform
        const { separator, readline, ...streamOptions } = options ?? {};
        super(streamOptions);

        this._separator = Buffer.from(separator ?? DEFAULT_SEPARATOR);
        this._readline = readline ?? false;
        this._tail = Buffer.alloc(0);
    }

    _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
        const data = concat(this._tail, chunk) as Buffer;
        const index = lastIndexOf(data, this._separator);

        if (index === -1) {
            this._tail = data;
            callback();
            return;
        }

        const boundary = index + this._separator.length;
        const head = data.slice(0, boundary) as Buffer;
        this._tail = Buffer.from(data.slice(boundary));

        if (this._readline) {
            for (const line of splitLines(head, this._separator)) {
                this.push(line);
            }
        } else {
            this.push(head);
        }

        callback();
    }

    _flush(callback: TransformCallback): void {
        if (this._tail.length > 0) {
            this.push(this._tail);
            this._tail = Buffer.alloc(0);
        }
        callback();
    }
}
