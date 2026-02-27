
export type AlineOptions = {
    /** Separator to align chunks on. Defaults to `'\n'`. */
    separator?: string;
    /** If true, emit one complete line per chunk instead of separator-aligned buffers. Defaults to `false`. */
    readline?: boolean;
};

export const DEFAULT_SEPARATOR = '\n';

/**
 * Concatenates two Uint8Arrays. Returns the non-empty input when one side is
 * empty to avoid an unnecessary allocation.
 */
export function concat(left: Uint8Array, right: Uint8Array): Uint8Array {
    if (left.length === 0) return right;
    if (right.length === 0) return left;
    const out = new Uint8Array(left.length + right.length);
    out.set(left);
    out.set(right, left.length);
    return out;
}

/**
 * Returns the index of the *last* occurrence of `search` within `data`,
 * or -1 if not found.
 */
export function lastIndexOf(data: Uint8Array, search: Uint8Array): number {
    if (search.length === 0 || data.length < search.length) return -1;

    outer: for (let i = data.length - search.length; i >= 0; i--) {
        for (let j = 0; j < search.length; j++) {
            if (data[i + j] !== search[j]) continue outer;
        }
        return i;
    }
    return -1;
}

/**
 * Returns the index of the *first* occurrence of `search` within `data`
 * starting at `from`, or -1 if not found.
 */
export function firstIndexOf(data: Uint8Array, search: Uint8Array, from = 0): number {
    outer: for (let i = from; i <= data.length - search.length; i++) {
        for (let j = 0; j < search.length; j++) {
            if (data[i + j] !== search[j]) continue outer;
        }
        return i;
    }
    return -1;
}

/**
 * Splits `data` on `separator`, keeping the separator at the end of each
 * segment. The last segment is only included when non-empty (i.e. a partial
 * line with no trailing separator).
 */
export function splitLines(data: Uint8Array, separator: Uint8Array): Uint8Array[] {
    const lines: Uint8Array[] = [];
    let start = 0;

    while (start < data.length) {
        const idx = firstIndexOf(data, separator, start);
        if (idx === -1) {
            lines.push(data.slice(start));
            break;
        }
        lines.push(data.slice(start, idx + separator.length));
        start = idx + separator.length;
    }

    return lines;
}
