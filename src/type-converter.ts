import { TypeCreationRule, RedisData, RedisTypes, ConversionInfo } from "./types";
import { KEY_DIVIDER } from "./constants";

const defaultTypeInferenceRule: TypeCreationRule = {
    match: /.+/,
    converterInfo: key => {
        const arr = key.split(KEY_DIVIDER);
        if (arr.length === 1) {
            return {
                name: arr[0]
            }
        } else if (arr.length === 2) {
            const [name, id] = arr;
            return {
                name, id
            }
        } else {
            return { name: key };
        }
    }
}

interface TypeCoverterOpts {
    rules?: TypeCreationRule[],
    addDefaultRuleToRules?: boolean
}

const defaultRules = [defaultTypeInferenceRule];

export class TypeCoverter {
    rules: TypeCreationRule[] = defaultRules;

    constructor({ rules, addDefaultRuleToRules = true }: TypeCoverterOpts) {
        if (rules) {
            this.rules = rules;
            if (addDefaultRuleToRules) {
                this.rules.push(defaultTypeInferenceRule)
            }
        }
    }

    matchStringPattern(key: string, pattern: string) {
        const matchResult = {};

        const patternTokens = pattern.split(KEY_DIVIDER);
        const keyTokens = key.split(KEY_DIVIDER);

        for (let i = 0; i < patternTokens.length; i++) {
            const t = patternTokens[i];
            if (t.startsWith('{') && t.endsWith('}')) {
                const name = t.slice(1, -1);
                matchResult[name] = keyTokens[i];
            } else {
                if (t !== keyTokens[i]) {
                    return false;
                }
            }
        }

        return matchResult;
    }

    matchesRule(key, rule: RegExp | string) {
        return rule instanceof RegExp ?
            rule.test(key) :
            this.matchStringPattern(key, rule as string)
    }

    getRulesResult(key, type: RedisTypes) {
        let result: ConversionInfo;

        for (let i = 0; i < this.rules.length; i++) {
            const r = this.rules[i];

            if (r.matchTypes) {
                if (typeof r.matchTypes === 'string') {
                    if (r.matchTypes !== type) {
                        continue;
                    }
                }
                else if (r.matchTypes.indexOf(type) < 0) {
                    continue;
                }
            }

            const match = this.matchesRule(key, r.match);

            if (match) {
                result = typeof match === "boolean" ? r.converterInfo(key) : r.converterInfo(key, match)
                // don't match more rules
                break;
            }
        }

        return result;
    }

    convertFromRedisData(data: RedisData) {
        const model = {};

        // add all string keys
        data.Keys.forEach((v, k) => {
            model[k] = v;
        });

        // read all hashes and sets for objects and relations
        let conversions = [];

        data.Hashes.forEach((hash) => {
            const convInfo = this.getRulesResult(hash.key, RedisTypes.HASH);
            if (convInfo) {
                conversions.push(convInfo);
            }
        })

        data.Sets.forEach((set) => {
            const convInfo = this.getRulesResult(set.key, RedisTypes.SET);
            if (convInfo) {
                conversions.push(convInfo);
            }
        })

        console.log(conversions);
    }
}