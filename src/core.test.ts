
import { concat, lastIndexOf } from './core.js';

// ---------------------------------------------------------------------------
// concat
// ---------------------------------------------------------------------------

describe('concat', () => {
    test('combines two non-empty arrays', () => {
        expect(Array.from(concat(
            new Uint8Array([1, 2, 3]),
            new Uint8Array([4, 5, 6]),
        ))).toEqual([1, 2, 3, 4, 5, 6]);
    });

    test('returns right unchanged when left is empty', () => {
        const right = new Uint8Array([4, 5, 6]);
        expect(concat(new Uint8Array(0), right)).toBe(right);
    });

    test('returns left unchanged when right is empty', () => {
        const left = new Uint8Array([1, 2, 3]);
        expect(concat(left, new Uint8Array(0))).toBe(left);
    });

    test('returns empty-length result when both are empty', () => {
        expect(concat(new Uint8Array(0), new Uint8Array(0)).length).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// lastIndexOf
// ---------------------------------------------------------------------------

describe('lastIndexOf', () => {
    const data = new Uint8Array([1, 2, 3, 4, 5, 6]);

    test('finds single byte at start',             () => expect(lastIndexOf(data, new Uint8Array([1]))).toBe(0));
    test('finds multi-byte sequence at start',     () => expect(lastIndexOf(data, new Uint8Array([1, 2, 3]))).toBe(0));
    test('finds single byte at end',               () => expect(lastIndexOf(data, new Uint8Array([6]))).toBe(5));
    test('finds sequence in middle',               () => expect(lastIndexOf(data, new Uint8Array([3, 4, 5]))).toBe(2));
    test('finds sequence ending at last byte',     () => expect(lastIndexOf(data, new Uint8Array([3, 4, 5, 6]))).toBe(2));
    test('finds two-byte sequence',                () => expect(lastIndexOf(data, new Uint8Array([3, 4]))).toBe(2));
    test('finds single middle byte',               () => expect(lastIndexOf(data, new Uint8Array([3]))).toBe(2));

    test('returns -1 when sequence extends beyond data',   () => expect(lastIndexOf(data, new Uint8Array([6, 7, 8]))).toBe(-1));
    test('returns -1 when bytes are non-consecutive',      () => expect(lastIndexOf(data, new Uint8Array([3, 5]))).toBe(-1));
    test('returns -1 when byte is absent',                 () => expect(lastIndexOf(data, new Uint8Array([7]))).toBe(-1));
    test('returns -1 when sequence partially overruns',    () => expect(lastIndexOf(data, new Uint8Array([4, 5, 6, 7]))).toBe(-1));
    test('returns -1 when last byte does not match',       () => expect(lastIndexOf(data, new Uint8Array([3, 4, 5, 7]))).toBe(-1));

    test('returns -1 for empty search',     () => expect(lastIndexOf(new Uint8Array([1, 2]), new Uint8Array(0))).toBe(-1));
    test('returns -1 for empty data',       () => expect(lastIndexOf(new Uint8Array(0), new Uint8Array([1]))).toBe(-1));
    test('returns -1 when both are empty',  () => expect(lastIndexOf(new Uint8Array(0), new Uint8Array(0))).toBe(-1));

    test('returns last index when pattern repeats', () => {
        const repeated = new Uint8Array([1, 2, 1, 2, 1]);
        expect(lastIndexOf(repeated, new Uint8Array([1, 2]))).toBe(2);
    });
});
