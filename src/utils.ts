//@ts-ignore
export const zsetToNumberKeyedMap = obj => new Map<number, string>(Object.entries(obj).map(([k, v]) => [parseInt(k), v]));