import { ClientOpts, RedisClient } from "redis";

export type ID = number | string;
export type StringMap = Map<string, string>;
export type SortedSet = Map<number, string>;

export interface IRedisClient extends RedisClient {
    scanAsync: (...args: any) => Promise<any>;
    typeAsync: (...args: any) => Promise<any>;
    lrangeAsync: (...args: any) => Promise<any>;
    smembersAsync: (...args: any) => Promise<any>;
    hgetallAsync: (...args: any) => Promise<any>;
    zrangeAsync: (...args: any) => Promise<any>;
    getAsync: (...args: any) => Promise<any>;
}

export interface InitOptions extends ClientOpts {
    client?: IRedisClient;
}

export interface ConversionInfo<TParsed = any, TModel = any> {
    name: string,
    id?: ID,
    childTypes?: { [k in string]: (p: TParsed, m: TModel) => boolean }
}

export interface TypeCreationRule<TParsed = any, TModel = any> {
    match: RegExp | string,
    matchTypes?: RedisTypes | RedisTypes[],
    converterInfo: (key: string, parsed?: TParsed) => ConversionInfo<TParsed, TModel>
}

interface RedisEntry {
    key: string;
}

export interface Hash extends RedisEntry {
    hash: StringMap;
}

export interface RedisSet extends RedisEntry {
    set: Set<string>;
}

export interface RedisSet extends RedisEntry {
    set: Set<string>;
}

export interface ZSet extends RedisEntry {
    set: SortedSet;
}

export interface List extends RedisEntry {
    members: string[];
}

export enum RedisTypes {
    STRING = 'STRING',
    LIST = 'LIST',
    SET = 'SET',
    ZSET = 'ZSET',
    HASH = 'HASH'
}

export interface KeyInfo {
    key?: string;
    type?: RedisTypes
}

export class RedisData {
    Keys: StringMap;
    Sets: RedisSet[];
    Hashes: Hash[];
    Lists: List[];
    ZSets: ZSet[];
}