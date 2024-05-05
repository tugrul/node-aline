
import { Readable, Transform } from 'node:stream';

import { Aline, AlineWeb, concat, lastIndexOf } from '.'

describe('concat two Uint8Array', () => {
    test('regular two array', () => {
        const left = new Uint8Array([1, 2, 3]);
        const right = new Uint8Array([4, 5, 6]);
    
        const combined = Array.from(concat(left, right));
    
        expect(combined).toEqual([1, 2, 3, 4, 5, 6]);
    });
    
    test('left array is empty', () => {
        const left = new Uint8Array();
        const right = new Uint8Array([4, 5, 6]);
    
        const combined = Array.from(concat(left, right));
    
        expect(combined).toEqual([4, 5, 6]);
    });
    
    test('right array is empty', () => {
        const left = new Uint8Array([1, 2, 3]);
        const right = new Uint8Array();
    
        const combined = Array.from(concat(left, right));
    
        expect(combined).toEqual([1, 2, 3]);
    });
});



describe('lastIndexOf Uint8Array in Uint8Array', () => {
    test('regular two array', () => {
        const left = new Uint8Array([1, 2, 3, 4, 5, 6]);
    
        expect(lastIndexOf(left, new Uint8Array([1]))).toBe(0);

        expect(lastIndexOf(left, new Uint8Array([1, 2, 3]))).toBe(0);

        expect(lastIndexOf(left, new Uint8Array([6]))).toBe(5);

        expect(lastIndexOf(left, new Uint8Array([6, 7, 8]))).toBe(-1);

        expect(lastIndexOf(left, new Uint8Array([3, 4, 5]))).toBe(2);

        expect(lastIndexOf(left, new Uint8Array([3, 4, 5, 6]))).toBe(2);

        expect(lastIndexOf(left, new Uint8Array([3, 4, 5, 7]))).toBe(-1);

        expect(lastIndexOf(left, new Uint8Array([3, 4]))).toBe(2);

        expect(lastIndexOf(left, new Uint8Array([3]))).toBe(2);

        expect(lastIndexOf(left, new Uint8Array([3, 5]))).toBe(-1);

        expect(lastIndexOf(left, new Uint8Array([7]))).toBe(-1);

        expect(lastIndexOf(left, new Uint8Array([4, 5, 6, 7]))).toBe(-1);
    });
    
    test('empty array', () => {
        const fill = new Uint8Array([1, 2, 3]);
        const empty = new Uint8Array();

        expect(lastIndexOf(fill, empty)).toBe(-1);

        expect(lastIndexOf(empty, fill)).toBe(-1);

        expect(lastIndexOf(empty, empty)).toBe(-1);
    });
});


function combineData<T extends Transform>(stream: T) {
    return new Promise((resolve, reject) => {

        const chunks: Array<string> = [];

        stream.on('data', data => chunks.push(data.toString()));
        stream.on('end', () => resolve(chunks));
        stream.on('error', err => reject(err));
    });
}

type FixtureItem = [string, () => AsyncGenerator<string, void, unknown>, Array<string>];

const fixture: Array<FixtureItem> = [
    ['should align single new lines to chunks', 
        async function* () {
            yield 'foo\nba';
            yield 'ar\nbaz';
        },
        ['foo\n', 'baar\n', 'baz']],
    ['should align multiple new lines to chunks',
        async function* () {
            yield 'foo\nbar\nbam\nra';
            yield 'am\nbaz';
        },
        [ 'foo\nbar\nbam\n', 'raam\n', 'baz' ]],
    ['should align single chunk',
        async function* () {
            yield 'foo\nbar\nbam\nram';
        },
        [ 'foo\nbar\nbam\n', 'ram' ]],
    ['should return empty array',
        async function* () {
            yield '';
        },
        []],
    ['should return array with single word',
        async function* () {
            yield 'foo';
        },
        ['foo']],
    ['should align new line on last char', 
        async function* () {
            yield 'foo\n';
        },
        ['foo\n']],
    ['should align new line on first char',
        async function* () {
            yield '\nfoo';
        },
        ['\n', 'foo']],
    ['should align new line on first and last char',
        async function* () {
            yield '\nfoo\n';
        },
        ['\nfoo\n']]
];

describe('node transform', () => {
    fixture.forEach(([name, generate, target]) => test(name, async() => {
        expect(await combineData(Readable.from(generate()).pipe(new Aline()))).toEqual(target)
    }));
});


function readableStreamFrom<T>(iterable: AsyncIterable<T>) {
    return new ReadableStream<T>({
        async start(controller): Promise<void> {
            for await (const chunk of iterable) {
                controller.enqueue(chunk);
            }

            controller.close();
        }
    });
}

async function arrayFromAsync<T>(readable: ReadableStream<T>): Promise<Array<T>> {
    const chunks: Array<T> = [];

    const reader = readable.getReader();

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        chunks.push(value);
    }

    reader.releaseLock();

    return chunks;
}

describe('web transform stream', () => {

    fixture.forEach(([name, generate, target]) => test(name, async() => {
        expect(await arrayFromAsync(readableStreamFrom(generate())
        .pipeThrough(new TextEncoderStream())
        .pipeThrough(new TransformStream(new AlineWeb()))
        .pipeThrough(new TextDecoderStream()))).toEqual(target);
    }));
});

