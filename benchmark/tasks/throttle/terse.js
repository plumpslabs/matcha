function throttle(f,w){if(typeof f!="function")return function(){};var l=0,t,a;return function(){var n=Date.now(),r=w-(n-l);if(r<=0){clearTimeout(t);t=null;l=n;f.apply(this,arguments)}else{a=arguments;if(!t)t=setTimeout(function(){t=null;l=Date.now();a&&(f.apply(this,a),a=null)},r)}}}
module.exports={throttle};
