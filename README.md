
# aline

A line-boundary-aligning stream library for TypeScript. Ships two entry points so you can use whichever streaming API fits your environment.

| Import | Stream API | Runtimes |
|--------|-----------|----------|
| `aline` | Node.js `Transform` | Node.js |
| `aline/web` | Web Streams `TransformStream` | Browsers, Node.js ≥ 18, Deno, Bun |

When data arrives from a network socket, file, or any other streaming source, chunks are split at arbitrary byte positions with no respect for newlines. `Aline` buffers across chunk boundaries and re-emits data so that every chunk you receive either ends with a newline (boundary mode) or contains exactly one complete line (readline mode) — making downstream parsing trivial.

```
Input chunks:    [ "foo\nba" ]  [ "ar\nbaz" ]
                       ↓ Aline ↓
Output chunks:   [ "foo\n" ]  [ "baar\n" ]  [ "baz" ]
```

![](https://tugrul.github.io/node-aline/assets/img/node-aline.gif)

---

## Features

- **Two entry points** — Node.js `Transform` for existing Node pipelines; Web Streams `TransformStream` for browsers, Deno, and Bun.
- **Shared options** — identical `AlineOptions` type (`separator`, `readline`) across both entry points.
- **Two operating modes** — boundary alignment (default) or one-line-per-chunk readline mode.
- **Custom separators** — any string, including multi-byte sequences like `\r\n`.
- **Zero dependencies** — no runtime dependencies.
- **Fully typed** — written in TypeScript and ships its own types.

---

## Requirements

| Entry point | Runtime | Minimum version |
|-------------|---------|-----------------|
| `aline` | Node.js | 14.0.0 |
| `aline/web` | Node.js | 18.0.0 |
| `aline/web` | Deno | 1.0 |
| `aline/web` | Bun | 1.0 |
| `aline/web` | Browser | Any modern browser with Web Streams support |

---

## Installation

```bash
npm install aline
```

```bash
yarn add aline
```

```bash
deno add npm:aline
```

---

## Quick start

### Node.js (legacy entry point)

```typescript
import { Aline } from 'aline';
import { createReadStream } from 'node:fs';

const stream = createReadStream('data.ndjson').pipe(new Aline());

stream.on('data', (chunk: Buffer) => {
    // chunk always ends with '\n' (or is the final partial line)
    console.log(chunk.toString());
});
```

### Web Streams (modern entry point)

```typescript
import { Aline } from 'aline/web';

const response = await fetch('https://example.com/stream');

const reader = response.body!
    .pipeThrough(new Aline())
    .pipeThrough(new TextDecoderStream())
    .getReader();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    // value always ends with '\n' (or is the final partial line)
    console.log(value);
}
```

---

## Entry points

### `aline` — Node.js Transform

```typescript
import { Aline } from 'aline';
```

`Aline` extends Node.js `Transform`. It integrates directly into existing `.pipe()` chains and accepts all standard `TransformOptions` alongside the `AlineOptions` described below. Use this when you are on Node.js and want to stay with the Node Streams API.

### `aline/web` — Web TransformStream

```typescript
import { Aline } from 'aline/web';
```

`Aline` extends the platform `TransformStream<Uint8Array, Uint8Array>`. Use this when you need to run in a browser, Deno, Bun, or Node.js ≥ 18 via the Web Streams API. The class is used directly with `.pipeThrough()` — no wrapper needed.

> **Migrating from the old `AlineWeb` class?** The `aline/web` entry point is a drop-in replacement. Replace `new TransformStream(new AlineWeb(...))` with `new Aline(...)` and remove the wrapper.

Both entry points export the same `AlineOptions` type and the `concat` / `lastIndexOf` utility functions, so library code that only uses those can import from either path.

---

## Modes

### Boundary mode (default)

Every emitted chunk ends at a separator boundary. The buffer accumulates bytes until a separator is found, then emits everything up to and including that separator in one chunk. Bytes after the last separator are held until the next separator arrives or the stream closes.

Best choice when you want chunks that may contain multiple lines but need the guarantee that no single line is ever split across two chunks.

```
Input:   [ "foo\nbar\nbam\nra" ]   [ "am\nbaz" ]
Output:  [ "foo\nbar\nbam\n" ]     [ "raam\n" ]   [ "baz" ]
```

### Readline mode

With `readline: true`, each emitted chunk is exactly one line. Every chunk except possibly the last ends with the separator.

Best choice when you want to process a stream one line at a time without writing your own split logic.

```
Input:   [ "foo\nbar\n" ]   [ "baz" ]
Output:  [ "foo\n" ]  [ "bar\n" ]  [ "baz" ]
```

---

## API

### `new Aline(options?)`

Creates a new stream that aligns chunks to separator boundaries.

For the Node.js entry point, `options` also accepts any [`TransformOptions`](https://nodejs.org/api/stream.html#new-streamtransformoptions) (e.g. `highWaterMark`, `encoding`) alongside the `AlineOptions` below.

#### `AlineOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `separator` | `string` | `'\n'` | The separator string to align on. Any string is valid, including multi-byte sequences like `'\r\n'`. |
| `readline` | `boolean` | `false` | When `true`, emit exactly one line per chunk rather than separator-aligned multi-line buffers. |

#### Flush behaviour

When the source stream closes, any bytes remaining in the internal buffer are emitted as a final chunk regardless of whether they end with a separator. This represents a partial (unterminated) final line.

---

### `concat(left: Uint8Array, right: Uint8Array): Uint8Array`

Concatenates two `Uint8Array` instances. Returns the non-empty input unchanged when one side is empty, avoiding an allocation. Exported from both `aline` and `aline/web`.

```typescript
import { concat } from 'aline/web';

const a = new TextEncoder().encode('hello ');
const b = new TextEncoder().encode('world');
const ab = concat(a, b); // Uint8Array for "hello world"
```

---

### `lastIndexOf(data: Uint8Array, search: Uint8Array): number`

Returns the index of the **last** occurrence of the byte sequence `search` within `data`, or `-1` if not found. Both an empty `data` and an empty `search` return `-1`. Exported from both `aline` and `aline/web`.

```typescript
import { lastIndexOf } from 'aline/web';

const enc = new TextEncoder();
lastIndexOf(enc.encode('foo\nbar\nbaz'), enc.encode('\n')); // → 7
lastIndexOf(enc.encode('foobar'),       enc.encode('\n')); // → -1
```

---

## Examples

### Fetch newline-delimited JSON (NDJSON)

```typescript
import { Aline } from 'aline/web';

const response = await fetch('/api/events');

const reader = response.body!
    .pipeThrough(new Aline({ readline: true }))
    .pipeThrough(new TextDecoderStream())
    .getReader();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const event = JSON.parse(value.trim());
    console.log(event);
}
```

### Server-sent events (SSE)

```typescript
import { Aline } from 'aline/web';

const response = await fetch('/api/sse');

const reader = response.body!
    .pipeThrough(new Aline({ readline: true }))
    .pipeThrough(new TextDecoderStream())
    .getReader();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value.startsWith('data: ')) {
        const payload = value.slice(6).trim();
        console.log(JSON.parse(payload));
    }
}
```

### CRLF-delimited protocol (HTTP raw, SMTP, …)

```typescript
import { Aline } from 'aline/web';

const reader = tcpStream
    .pipeThrough(new Aline({ separator: '\r\n', readline: true }))
    .pipeThrough(new TextDecoderStream())
    .getReader();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    console.log(value); // each value ends with '\r\n'
}
```

### Custom delimiter (pipe-separated values)

```typescript
import { Aline } from 'aline/web';

const reader = dataStream
    .pipeThrough(new Aline({ separator: '|', readline: true }))
    .pipeThrough(new TextDecoderStream())
    .getReader();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    console.log(value.replace(/\|$/, '')); // strip trailing delimiter
}
```

### Node.js — reading a file line by line

```typescript
import { Aline } from 'aline';
import { createReadStream } from 'node:fs';

const stream = createReadStream('data.ndjson').pipe(new Aline({ readline: true }));

for await (const chunk of stream) {
    console.log(JSON.parse((chunk as Buffer).toString().trim()));
}
```

### Node.js — using the Web Streams entry point with a file stream

Node.js 17+ exposes `.toWeb()` on Node Readable streams to bridge to the Web Streams API.

```typescript
import { Aline } from 'aline/web';
import { createReadStream } from 'node:fs';

const reader = createReadStream('data.ndjson')
    .toWeb()
    .pipeThrough(new Aline({ readline: true }))
    .pipeThrough(new TextDecoderStream())
    .getReader();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    console.log(JSON.parse(value.trim()));
}
```

### Async iteration helper

```typescript
import { Aline } from 'aline/web';

async function* lines(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
    const reader = stream
        .pipeThrough(new Aline({ readline: true }))
        .pipeThrough(new TextDecoderStream())
        .getReader();
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) return;
            yield value;
        }
    } finally {
        reader.releaseLock();
    }
}

for await (const line of lines(response.body!)) {
    console.log(line);
}
```

---

## Behaviour reference

The table below summarises how `Aline` handles various input patterns. Both entry points produce identical output. All examples use the default `'\n'` separator.

| Input chunks | Mode | Output chunks |
|---|---|---|
| `["foo\nba", "ar\nbaz"]` | boundary | `["foo\n", "baar\n", "baz"]` |
| `["foo\nbar\nbam\nra", "am\nbaz"]` | boundary | `["foo\nbar\nbam\n", "raam\n", "baz"]` |
| `["foo\nbar\nbam\nram"]` | boundary | `["foo\nbar\nbam\n", "ram"]` |
| `["foo\n"]` | boundary | `["foo\n"]` |
| `["\nfoo"]` | boundary | `["\n", "foo"]` |
| `["\nfoo\n"]` | boundary | `["\nfoo\n"]` |
| `["foo"]` | boundary | `["foo"]` |
| `[""]` | boundary | `[]` |
| `["foo\nbar\nbaz"]` | readline | `["foo\n", "bar\n", "baz"]` |
| `["fo", "o\nbar\nbaz"]` | readline | `["foo\n", "bar\n", "baz"]` |
| `["foo\nbar"]` | readline | `["foo\n", "bar"]` |
| `["foo"]` | readline | `["foo"]` |
| `[""]` | readline | `[]` |

---

## File structure

```
core.ts          Shared utilities (AlineOptions, concat, lastIndexOf, splitLines)
index.ts         Node.js Transform implementation  →  import { Aline } from 'aline'
web.ts           Web TransformStream implementation →  import { Aline } from 'aline/web'
core.test.ts     Tests for shared utilities
index.test.ts    Tests for the Node.js implementation
web.test.ts      Tests for the Web Streams implementation
```

The `package.json` `exports` field maps the entry points:

```json
{
    "exports": {
        ".": "./dist/index.js",
        "./web": "./dist/web.js"
    }
}
```

---

## How it works

`Aline` maintains an internal byte buffer (`tail`) between calls to `_transform` / `transform`.

On each incoming chunk the chunk is appended to the tail, then `lastIndexOf` scans backwards from the end to find the rightmost occurrence of the separator sequence. Using `lastIndexOf` rather than `indexOf` means a chunk containing many lines produces a single downstream write in boundary mode, which is more efficient than scanning forward and writing each line individually.

If no separator is found, the entire combined buffer is stored as the new tail and nothing is emitted. If a separator is found, the bytes up to and including it form the `head`, which is emitted (split into individual lines in readline mode), and the remaining bytes become the new tail.

When the source stream closes, `_flush` / `flush` emits whatever remains in the tail as a final chunk — representing a partial unterminated line.

Both entry points share the same `core.ts` utilities (`concat`, `lastIndexOf`, `splitLines`) so the logic is only written once and the two classes are thin wrappers around it.

---

## Development

```bash
# Install dependencies
npm install

# Run all tests (requires Node.js ≥ 18 for web.test.ts)
npm test

# Run only Node.js tests (works on Node.js ≥ 14)
npx jest index.test.ts core.test.ts

# Type-check
npx tsc --noEmit

# Build
npm run build
```

---

## License

MIT
