function pipe(...f){f.forEach(function(x){if(typeof x!="function")throw Error("All arguments must be functions")});return function(v){return f.reduce(function(a,x){return x(a)},v)}}
module.exports={pipe};
