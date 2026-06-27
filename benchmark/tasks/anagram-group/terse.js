function anagramGroups(s){if(!Array.isArray(s))return [];var m={};s.forEach(function(x){var k=[...x].sort().join("");(m[k]=m[k]||[]).push(x)});return Object.values(m)}
module.exports={anagramGroups};
