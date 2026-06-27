function memoize(f){if(typeof f!="function")return function(){};var c={};return function(a){return a in c?c[a]:c[a]=f(a)}}
module.exports={memoize};
