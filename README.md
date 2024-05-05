# node-aline

Align last bytes to newline boundary of stream chunks

![](https://tugrul.github.io/node-aline/assets/img/node-aline.gif)

## Install

### NPM

```
npm install aline
```

### Yarn

```
yarn add aline
```

## Sample Node.js Stream Transform
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

## Sample Web TransformStream
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
