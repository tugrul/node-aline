
var util = require('util'),
Transform = require('stream').Transform;

util.inherits(Alines, Transform);

function Aline(options) {
    if (!(this instanceof Aline))
     return new Aline(options);

    Transform.call(this, options);
    this._tail = Buffer.alloc(0);
    this._separator = (options && options.separator) || '\n';
}

Aline.prototype._transform = function (chunk, encoding, callback) {

    var index = chunk.lastIndexOf(this._separator);

    if (index === chunk.length) {
        this._tail = Buffer.alloc(0);
        return callback(null, chunk);
    }

    var head = Buffer.concat([this._tail, chunk.slice(0, index)]);
    this._tail = Buffer.from(chunk.slice(index + 1));

    callback(null, head);
};

Aline.prototype._flush = function(callback) {
    callback(null, this._tail);
};

module.exports = Aline;
