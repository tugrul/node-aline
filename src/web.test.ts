
import { Aline } from './web.js';

// ---------------------------------------------------------------------------
// Helper — pipe an async string iterable through AlineWeb, return strings
// ---------------------------------------------------------------------------

async function pipe(
    iterable: AsyncIterable<string>,
    options?: ConstructorParameters<typeof Aline>[0],
): Promise<string[]> {
    const readable = new ReadableStream<string>({
        async start(controller) {
            for await (const chunk of iterable) {
                controller.enqueue(chunk);
            }
            controller.close();
        },
    });

    const chunks: string[] = [];
    const reader = readable
        .pipeThrough(new TextEncoderStream())
        .pipeThrough(new Aline(options))
        .pipeThrough(new TextDecoderStream())
        .getReader();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }
    reader.releaseLock();
    return chunks;
}

async function* gen(...items: string[]): AsyncGenerator<string> {
    for (const item of items) yield item;
}

// ---------------------------------------------------------------------------
// Boundary mode
// ---------------------------------------------------------------------------

describe('Aline/web (boundary mode)', () => {
    test('aligns split across two chunks', async () => {
        expect(await pipe(gen('foo\nba', 'ar\nbaz')))
            .toEqual(['foo\n', 'baar\n', 'baz']);
    });

    test('aligns multiple newlines in first chunk', async () => {
        expect(await pipe(gen('foo\nbar\nbam\nra', 'am\nbaz')))
            .toEqual(['foo\nbar\nbam\n', 'raam\n', 'baz']);
    });

    test('aligns single chunk with multiple newlines', async () => {
        expect(await pipe(gen('foo\nbar\nbam\nram')))
            .toEqual(['foo\nbar\nbam\n', 'ram']);
    });

    test('newline at end of chunk', async () => {
        expect(await pipe(gen('foo\n'))).toEqual(['foo\n']);
    });

    test('newline at start of chunk', async () => {
        expect(await pipe(gen('\nfoo'))).toEqual(['\n', 'foo']);
    });

    test('newline at both ends', async () => {
        expect(await pipe(gen('\nfoo\n'))).toEqual(['\nfoo\n']);
    });

    test('single word with no newline', async () => {
        expect(await pipe(gen('foo'))).toEqual(['foo']);
    });

    test('empty string yields nothing', async () => {
        expect(await pipe(gen(''))).toEqual([]);
    });

    test('multiple chunks with no newlines buffers until flush', async () => {
        expect(await pipe(gen('foo', 'bar', 'baz'))).toEqual(['foobarbaz']);
    });

    test('custom separator', async () => {
        expect(await pipe(gen('foo|ba', 'ar|baz'), { separator: '|' }))
            .toEqual(['foo|', 'baar|', 'baz']);
    });

    test('multi-byte CRLF separator', async () => {
        expect(await pipe(gen('foo\r\nba', 'ar\r\nbaz'), { separator: '\r\n' }))
            .toEqual(['foo\r\n', 'baar\r\n', 'baz']);
    });
});

// ---------------------------------------------------------------------------
// Readline mode
// ---------------------------------------------------------------------------

describe('Aline/web (readline mode)', () => {
    test('emits each line separately', async () => {
        expect(await pipe(gen('foo\nbar\nbaz'), { readline: true }))
            .toEqual(['foo\n', 'bar\n', 'baz']);
    });

    test('handles split mid-line across chunks', async () => {
        expect(await pipe(gen('fo', 'o\nbar\nbaz'), { readline: true }))
            .toEqual(['foo\n', 'bar\n', 'baz']);
    });

    test('trailing partial line emitted on flush', async () => {
        expect(await pipe(gen('foo\nbar'), { readline: true }))
            .toEqual(['foo\n', 'bar']);
    });

    test('single line with newline', async () => {
        expect(await pipe(gen('hello\n'), { readline: true }))
            .toEqual(['hello\n']);
    });

    test('single word no newline', async () => {
        expect(await pipe(gen('hello'), { readline: true }))
            .toEqual(['hello']);
    });

    test('empty string yields nothing', async () => {
        expect(await pipe(gen(''), { readline: true })).toEqual([]);
    });

    test('many lines in one chunk', async () => {
        expect(await pipe(gen('a\nb\nc\nd'), { readline: true }))
            .toEqual(['a\n', 'b\n', 'c\n', 'd']);
    });

    test('custom separator in readline mode', async () => {
        expect(await pipe(gen('foo|bar|baz'), { readline: true, separator: '|' }))
            .toEqual(['foo|', 'bar|', 'baz']);
    });
});

// ---------------------------------------------------------------------------
// Web-specific: is a real TransformStream
// ---------------------------------------------------------------------------

describe('Aline/web (web streams compliance)', () => {
    test('is an instance of TransformStream', () => {
        expect(new Aline()).toBeInstanceOf(TransformStream);
    });

    test('exposes readable and writable properties', () => {
        const aline = new Aline();
        expect(aline.readable).toBeInstanceOf(ReadableStream);
        expect(aline.writable).toBeInstanceOf(WritableStream);
    });

    test('can be used directly with pipeThrough without wrapping', async () => {
        // Ensure Aline itself (not new TransformStream(new Aline())) works
        const enc = new TextEncoder();
        const dec = new TextDecoder();

        const readable = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(enc.encode('hello\nworld'));
                controller.close();
            },
        });

        const chunks: string[] = [];
        const reader = readable.pipeThrough(new Aline({ readline: true })).getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(dec.decode(value));
        }
        reader.releaseLock();

        expect(chunks).toEqual(['hello\n', 'world']);
    });
});
