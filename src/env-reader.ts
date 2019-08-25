const NODE_ENV = process.env.NODE_ENV;
import path from 'path';
import fs from 'fs';

const OS_LINE_DIVIDER = process.env.OS.startsWith('Windows') ? '\r\n' : '\n';

const dotenvFiles = [
    '.env',
    NODE_ENV !== 'test' && `.env.local`,
    // Don't include `.env.local` for `test` environment
    // since normally you expect tests to produce the same
    // results for everyone
    `.env.${NODE_ENV}`,
    `.env.${NODE_ENV}.local`,
].filter(Boolean);

const loadEnv = (filesPath) => {

    dotenvFiles.forEach((f, i) => {
        const file = path.join(filesPath, f);

        if (fs.existsSync(file)) {
            console.log(`${i === 0 ? 'Using .env file at' : 'Overriding with'}: ${file}`);

            fs.readFileSync(file, 'utf8').split(OS_LINE_DIVIDER).map(l => {
                // skip empty lines and # comments
                if (l.length && !(l[0] === '#')) {
                    const [k, v] = l.split('=');
                    process.env[k] = v;
                }
            })
        }
    });
}

export default loadEnv;
