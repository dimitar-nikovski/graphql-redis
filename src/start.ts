import loader from './env-reader';
import path from 'path';
loader(path.join(__dirname, '../'));
import { RedisAPI } from './redis-api';
import { TypeCreationRule, RedisTypes } from './types';
import { TypeCoverter } from './type-converter';
import { RedisSchemaBuilder } from './schema-builder';

const sampleRule: TypeCreationRule<{ id: number }> = {
    match: `team:{id}:members`,
    matchTypes: RedisTypes.SET,
    converterInfo: (k, p) => {
        return {
            id: p.id,
            name: `TeamMembers`,
            fields: {
                teamId: p.id
            },
            childTypes: {
                User: (p, m) => m.Users.id === p.id
            }
        }
    }
}

async function run() {
    const redis = new RedisAPI({
        inferBy: {
            keyPatterns: ['user:{x}', `team:{x}:members`, `team:{x}`]
        }
    });
    await redis.loadInferenceData();

    const converter = new TypeCoverter({
        rules: [sampleRule]
    });

    const conversions = converter.getConversionDTOsFromRedisData(redis.data);
    RedisSchemaBuilder.buildSchemaFromDTOs(conversions);
}

run();