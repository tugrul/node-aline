# node-aline

Align last bytes to newline boundary of stream chunks

## Install

```
npm install aline
```

## Sample
```javascript
var request = require('request');
var Aline = require('aline');

var url = 'https://data.cityofnewyork.us/api/views/25th-nujf/rows.csv'
var stream = request.get(url).pipe(new Aline());

stream.on('data', function(chunk) {
    console.log(chunk.toString());
});
```
