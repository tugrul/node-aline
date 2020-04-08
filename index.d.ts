
import {Transform} from 'stream';

interface AlineOptions {
    separator: string
}

export default class Aline extends Transform {
    constructor(opts?: AlineOptions);
}

