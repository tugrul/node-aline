
const assert = require('assert');
const {Readable} = require('stream');
const Aline = require('../index.js');

function combineData(stream) {
    return new Promise((resolve, reject) => {

        const chunks = [];

        stream.on('data', data => chunks.push(data.toString()));
        stream.on('end', () => resolve(chunks));
        stream.on('error', err => reject(err));
    });
}

[
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
].forEach(([name, generate, target]) => it(name, async() => assert.deepStrictEqual(target, await combineData(Readable.from(generate()).pipe(new Aline())))));

