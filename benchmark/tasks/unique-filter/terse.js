function unique(a,k){if(!Array.isArray(a))return [];var s=new Set;return a.filter(function(v){var x=k?k(v):v;return s.has(x)?false:(s.add(x),true)})}
module.exports={unique};
