function retry(f,n=3,d=1e3){return typeof f!="function"?Promise.reject(Error("fn must be a function")):f().catch(function(e){return n<=1?Promise.reject(e):new Promise(function(r){setTimeout(r,d)}).then(function(){return retry(f,n-1,d)})})}
module.exports={retry};
