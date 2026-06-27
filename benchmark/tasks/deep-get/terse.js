function deepGet(o,p){return p?p.split(".").reduce(function(c,k){return(c||{})[k]},o):o}
module.exports={deepGet};
