
import {
    AlineOptions,
    DEFAULT_SEPARATOR,
    concat,
    lastIndexOf,
    splitLines,
} from './core.js';

export { AlineOptions, concat, lastIndexOf } from './core.js';

/**
 * A runtime-agnostic `TransformStream` that aligns chunks to separator
 * boundaries.
 *
 * By default, every emitted chunk ends at a `'\n'` boundary so downstream
 * consumers never receive a line split across two chunks.
 *
 * With `readline: true`, each emitted chunk contains exactly one line
 * (separator included), making per-line processing trivial.
 *
 * Built on the Web Streams API — works in browsers, Node.js (≥ 18), Deno,
 * and Bun with no polyfills required. For the legacy Node.js `Transform`-based
 * version use the default `aline` entry point instead.
 *
 * @example
 * // Align to newline boundaries
 * readable.pipeThrough(new Aline());
 *
 * @example
 * // Readline mode — one line per chunk
 * readable.pipeThrough(new Aline({ readline: true }));
 *
 * @example
 * // Custom separator
 * readable.pipeThrough(new Aline({ separator: '\r\n' }));
 */
export class Aline extends TransformStream<Uint8Array, Uint8Array> {
    constructor(options?: AlineOptions) {
        const encoder = new TextEncoder();
        const separator = encoder.encode(options?.separator ?? DEFAULT_SEPARATOR);
        const readline = options?.readline ?? false;

        let tail = new Uint8Array(0);

        super({
            transform(chunk, controller) {
                const data = concat(tail, chunk);
                const index = lastIndexOf(data, separator);

                if (index === -1) {
                    tail = data;
                    return;
                }

                const boundary = index + separator.length;
                const head = data.slice(0, boundary);
                tail = data.slice(boundary);

                if (readline) {
                    for (const line of splitLines(head, separator)) {
                        controller.enqueue(line);
                    }
                } else {
                    controller.enqueue(head);
                }
            },

            flush(controller) {
                if (tail.length > 0) {
                    controller.enqueue(tail);
                    tail = new Uint8Array(0);
                }
            },
        });
    }
}
