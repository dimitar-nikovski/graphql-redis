import loader from './env-reader';
import path from 'path';
loader(path.join(__dirname, '../'));
import { RedisAPI } from './redis-api';
import { TypeCreationRule, RedisTypes } from './types';
import { TypeCoverter } from './type-converter';

const sampleRule: TypeCreationRule<{ id: number }> = {
    match: `team:{id}:members`,
    matchTypes: RedisTypes.SET,
    converterInfo: (k, p) => {
        return {
            id: p.id,
            name: `TeamMembers`,
            childTypes: {
                User: (p, m) => m.Users.id === p.id
            }
        }
    }
}

async function run() {
    const redis = new RedisAPI();
    await redis.loadInferenceData();

    const converter = new TypeCoverter({
        rules: [sampleRule]
    });

    converter.convertFromRedisData(redis.data);
}

run();