import { ConversionInfo } from "./types";
import { GraphQLSchema, GraphQLObjectType, buildSchema } from 'graphql';

const Query = fields => new GraphQLObjectType({
    name: 'Query',
    fields
});


const inferFieldTypes = (fiels) => {
    const result = {};

    Object.entries(fiels).forEach(([k, v]) => {

    })
}

interface SchemaBuilderConfig {
    schema: GraphQLSchema | string;
}

export class RedisSchemaBuilder {
    schema: GraphQLSchema;

    constructor(builderConfig: SchemaBuilderConfig) {
        this.schema = builderConfig.schema as GraphQLSchema || buildSchema(builderConfig.schema as string);
    }

    buildSchemaFromDTOs(convDTOs: ConversionInfo[]) {
        const fieldMap = {};

        convDTOs.forEach(dto => {
            const fieldMap = {};

            if (dto.fields) {
                Object.assign(fieldMap, inferFieldTypes(dto.fields));
            }

            const field = new GraphQLObjectType({
                name: dto.name,
                fields: fieldMap
            })
        })
    }
}
