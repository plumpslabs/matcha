function deepMerge(t,s){var r={},keys=new Set([...Object.keys(t||{}),...Object.keys(s||{})]);keys.forEach(function(k){var tv=t?.[k],sv=s?.[k];r[k]=Array.isArray(tv)&&Array.isArray(sv)?[...tv,...sv]:tv&&typeof tv=="object"&&sv&&typeof sv=="object"&&!Array.isArray(tv)&&!Array.isArray(sv)?deepMerge(tv,sv):sv!==undefined?sv:tv});return r}
module.exports={deepMerge};
