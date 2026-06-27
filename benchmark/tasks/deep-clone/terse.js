function deepClone(v){return v instanceof Date?new Date(v):Array.isArray(v)?v.map(deepClone):v&&typeof v=="object"?Object.fromEntries(Object.entries(v).map(function(k){return [k[0],deepClone(k[1])]})):v}
module.exports={deepClone};
