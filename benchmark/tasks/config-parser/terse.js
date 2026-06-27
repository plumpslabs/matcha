function parseConfig(s){if(typeof s!="string")return {};var r={};s.split("\n").forEach(function(l){l=l.trim();if(l&&!l.startsWith("#")&&!l.startsWith(";")){var i=l.indexOf("=");if(i>-1){r[l.slice(0,i).trim()]=l.slice(i+1).trim()}}});return r}
module.exports={parseConfig};
