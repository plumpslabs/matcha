function chunk(a,s){if(!Array.isArray(a)||s<1)return [];for(var r=[],i=0;i<a.length;i+=s)r.push(a.slice(i,i+s));return r}
module.exports={chunk};
