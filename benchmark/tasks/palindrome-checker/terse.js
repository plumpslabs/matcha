function isPalindrome(s){return typeof s=="string"?(s=s.toLowerCase().replace(/[^a-z0-9]/g,""))===[...s].reverse().join(""):false}
module.exports={isPalindrome};
