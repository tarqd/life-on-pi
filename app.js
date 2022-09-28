import { readFileSync } from 'fs';
import { variation } from './ld.js';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));


const packageJSON = JSON.parse(readFileSync(__dirname + './package.json', 'utf8'));

export default {
    package: packageJSON,
}

export function createContext(attributes) {
    return {
        'key': 'gameoflife',
        name: 'Game of Life',
        anonymous: true, 
        custom: {
         "app-version": packageJSON.version,
         "app-name": packageJSON.name,   
        }
    }
}

export function conf(key, fallback) {
    return variation(`config-${key}`, createContext(), fallback)
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
