function semverCompare(a,b){var x=a.split(".").map(Number),y=b.split(".").map(Number);return x[0]!=y[0]?Math.sign(x[0]-y[0]):x[1]!=y[1]?Math.sign(x[1]-y[1]):Math.sign(x[2]-y[2])}
module.exports={semverCompare};
