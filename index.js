
const {Transform} = require('stream');

class Aline extends Transform {
    constructor(options) {
        super();

        this._tail = Buffer.alloc(0);
        this._separator = (options && options.separator) || '\n';
    }
    
    _transform(chunk, encoding, callback) {
        const index = chunk.lastIndexOf(this._separator);
        
        if (index === chunk.length - 1 || index === -1) {
            callback(null, Buffer.concat([this._tail, chunk]));
            this._tail = Buffer.alloc(0);
            return;
        }

        const head = Buffer.concat([this._tail, chunk.slice(0, index + 1)]);
        this._tail = Buffer.from(chunk.slice(index + 1));

        callback(null, head);
    }
    
    _flush(callback) {
        callback(null, this._tail);
    }
}


module.exports = Aline;
