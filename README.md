# node-aline

**Align stream chunks to newline boundaries for seamless processing of structured data streams like JSONLines or CSV.**

![](https://tugrul.github.io/node-aline/assets/img/node-aline.gif)

## Overview

`node-aline` is a lightweight library for handling fragmented stream data. It ensures that chunks align at specified separator boundaries, making it ideal for processing newline-delimited formats such as JSONLines, CSV, or logs. This simplifies handling incomplete data in streams, especially in high-performance or real-time applications.

---

## Installation

Install using your preferred package manager:

### NPM
```bash
npm install aline
```

### Yarn
```bash
yarn add aline
```

---

## Features
- **Stream Alignment**: Guarantees that each chunk aligns to a separator boundary (e.g., `'\n'`).
- **JSONLines & CSV Compatible**: Handles structured stream data efficiently.
- **Node.js & Web Support**: Works seamlessly in both Node.js and browser environments.

---

## Usage Examples

### Node.js Stream Transform
Handle fragmented data in Node.js streams:

```javascript
const {Aline} = require('aline');
const {Readable} = require('stream');

async function* generate() {
    yield 'foo\nba';
    yield 'ar\nbaz';
}

const stream = Readable.from(generate()).pipe(new Aline());

stream.on('data', function(chunk) {
    console.log(chunk.toString());
});
```
---

### Web TransformStream
Process streamed data in the browser:

```javascript
const {AlineWeb} = require('aline');

async function main() {
    const response = await fetch('https://example.com/big.jsonl');

    if (!response.body) {
        return;
    }

    const readable = response.body
        .pipeThrough(new TransformStream(new AlineWeb()))
        .pipeThrough(new TextDecoderStream());

    for await (const batch of readable) {
        const jsonLines = batch.split(/\n/g).map(line => JSON.parse(line));
    }
}
```

---

## When to Use `node-aline`

- **JSONLines Streams**: Align JSON objects split across chunks for seamless parsing.
- **CSV Streams**: Handle incomplete rows in streaming CSV data.
- **Log Processing**: Split logs into individual entries by newline.
- **Real-Time Data Feeds**: Parse and process data on-the-fly from APIs or WebSocket streams.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## Contributions
Contributions are welcome! Feel free to open issues or submit pull requests to improve the project.