/* Transparent illustrative producer economics, not an Indonesian company model. */
(function (root) {
  'use strict';
  const baseline = Object.freeze({volume:100,price:60,cost:35,logistics:8,charge:10});
  function calculate(input) {
    const {volume,price,cost,logistics,charge} = input;
    if (![volume,price,cost,logistics,charge].every(Number.isFinite) || volume < 0 || price < 0 || cost < 0 || logistics < 0 || charge < 0 || charge >= 100) throw new Error('Invalid scenario inputs.');
    const revenue = volume * price / 1000;
    const revenueCharge = revenue * charge / 100;
    const operatingCost = volume * (cost + logistics) / 1000;
    const contribution = revenue - revenueCharge - operatingCost;
    return {revenue,revenueCharge,operatingCost,contribution,breakEven:(cost+logistics)/(1-charge/100),margin:revenue>0?contribution/revenue*100:null};
  }
  function change(current, previous) {
    if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) throw new Error('Invalid comparison.');
    return (current/previous-1)*100;
  }
  root.CoalModel = Object.freeze({baseline,calculate,change});
})(globalThis);
