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

## Sample
```javascript
const Aline = require('aline');
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
