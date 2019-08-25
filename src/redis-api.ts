
import { InitOptions, TypeCreationRule, RedisData, KeyInfo, RedisTypes, IRedisClient, InferConfig } from './types';
import redis, { RedisClient } from 'redis';
import { promisifyAll } from 'bluebird';
import { zsetToNumberKeyedMap } from './utils';
import { KEY_DIVIDER } from './constants';

promisifyAll(redis.RedisClient.prototype);
promisifyAll(redis.Multi.prototype);

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = process.env.REDIS_PORT || '6379';

const defaultInitOptions: InitOptions = {
    host: REDIS_HOST,
    port: parseInt(REDIS_PORT),
    isKeyPattern: k => k.indexOf(KEY_DIVIDER) > -1,
    inferBy: {
        scanPatterns: ['*']
    },
    auth_pass: process.env.REDIS_PASS,
    db: 0
}

const addClientEvents = (client: IRedisClient) => {
    client.on('connect', () => {
        console.log('Client connected')
    });
}

const keyToGetFunctionMap = (client: IRedisClient): {
    [key in RedisTypes]: (...args: any) => Promise<any>
} => {
    return {
        HASH: k => client.hgetallAsync(k),
        LIST: key => client.lrangeAsync(key, 0, -1),
        ZSET: key => client.zrangeAsync(key, 0, -1),
        SET: k => client.smembersAsync(k),
        STRING: k => client.getAsync(k)
    }
}

type DataModifyer = { [key in RedisTypes]: (keyInfo: KeyInfo, obj: any) => any };

const typeToAddDataFnMap = (data: () => RedisData): DataModifyer => ({
    HASH: ({ key }, obj) => data().Hashes.push({
        key,
        hash: new Map(Object.entries(obj))
    }),
    SET: ({ key }, obj) => data().Sets.push({
        key,
        set: new Set(obj)
    }),
    LIST: ({ key }, obj) => data().Lists.push({
        key,
        members: obj
    }),
    STRING: ({ key }, obj) => data().Keys.set(key, obj),
    ZSET: ({ key }, obj) => data().ZSets.push({
        key,
        set: new Map(zsetToNumberKeyedMap(obj))
    })
});

const initEmptyData = (): RedisData => ({
    Hashes: [],
    Keys: new Map(),
    Lists: [],
    Sets: [],
    ZSets: []
})

export class RedisAPI {
    client: IRedisClient
    data: RedisData = initEmptyData();
    dataModifyer: DataModifyer;
    inferConfig: InferConfig;
    isKeyPattern: (k: string) => boolean

    constructor(opts?: InitOptions) {
        const _opts = {
            ...defaultInitOptions,
            ...opts
        }

        if (_opts.client) {
            this.client = _opts.client;
        } else {
            // @ts-ignore
            this.client = redis.createClient(_opts) as RedisClient;
        }

        addClientEvents(this.client);
        this.dataModifyer = typeToAddDataFnMap(() => this.data);
        this.inferConfig = _opts.inferBy;
    }

    generalizePattern(key: string) {
        if (key.indexOf('{') > -1) {
            // user-defined keys will have {variable} placeholders
            return key.replace(/\{.+?\}/g, '*')
        } else {
            // const tokens = key.split(KEY_DIVIDER);
            throw new Error(`Inferring name and variable tokens from a key name is currently not supported, please pass a foo:{x}:bar formatter for ${key}`)
        }
    }

    async collectKeysInfo(overrideInference?: InferConfig) {

        let idx = '0';
        let allKeys: KeyInfo[];
        let allKeysSet = new Set<KeyInfo>();
        let inferConfig = { ...this.inferConfig };

        if (overrideInference) {
            inferConfig = {
                ...inferConfig,
                ...overrideInference
            }
        }

        const patternCache = new Map<string, number>();
        const scanPatterns = this.inferConfig.scanPatterns;

        if (scanPatterns) {
            const scan = (idx, pattern) => this.client.scanAsync(idx, 'MATCH', pattern);

            for (let pi = 0; pi < scanPatterns.length; pi++) {
                const pattern = scanPatterns[pi];
                let keys = [];

                while ([idx, keys] = await scan(idx, pattern)) {
                    keys.forEach(k => {
                        // for pattern keys which have val
                        if (this.isKeyPattern(k)) {
                            if (!patternCache.has(this.generalizePattern(k))) {
                                allKeysSet.add({
                                    key: k
                                })
                            }
                        } else {
                            allKeysSet.add({
                                key: k
                            })
                        }
                    })

                    if (idx === '0') {
                        break;
                    }
                }
            }
        }

        if (this.inferConfig.keys) {
            this.inferConfig.keys.forEach(k => (allKeysSet.add({
                key: k
            })))
        }

        allKeys = Array.from(allKeysSet);
        allKeysSet = undefined;

        for (let i = 0; i < allKeys.length; i++) {
            const k = allKeys[i];
            const type = await this.client.typeAsync(k.key).then(x => x.toUpperCase());

            if (!RedisTypes[type]) {
                console.warn(`Unsupported type: ${type} will be ignored`)
            }

            if (type) {
                k.type = type;
            } else {
                throw new Error(`No type found for key ${k.key}`)
            }
        }

        return allKeys;
    }

    addData(keyInfo: KeyInfo, data) {
        this.dataModifyer[keyInfo.type](keyInfo, data);
    }

    async getDataFromKeys(keysInfo: KeyInfo[]) {
        const getFnMap = keyToGetFunctionMap(this.client);

        for (let i = 0; i < keysInfo.length; i++) {
            const ki = keysInfo[i];

            const getFn = getFnMap[ki.type];
            const data = await getFn(ki.key);
            this.addData(ki, data);
        }
    }

    async obtainInferenceFromAllData() {
        const keysInfo = await this.collectKeysInfo({
            scanPatterns: defaultInitOptions.inferBy.scanPatterns
        });

        await this.getDataFromKeys(keysInfo)
    }

    async loadInferenceData() {
        const keysInfo = await this.collectKeysInfo();
        await this.getDataFromKeys(keysInfo);
    }
}