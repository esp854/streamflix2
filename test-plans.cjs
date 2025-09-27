const { plans } = require('./server/plans.ts');

console.log('Plans object:', plans);
console.log('Plans keys:', Object.keys(plans));
console.log('Free plan:', plans.free);
console.log('Basic plan:', plans.basic);