/* Pure arithmetic. Missing values remain unavailable rather than becoming zero. */
(function (root) {
  'use strict';
  const change = (current, previous) => Number.isFinite(current) && Number.isFinite(previous) && previous > 0 ? (current / previous - 1) * 100 : null;
  const unitValue = observation => Number.isFinite(observation?.fob_usd) && Number.isFinite(observation?.net_product_weight_kg) && observation.net_product_weight_kg > 0 ? observation.fob_usd / (observation.net_product_weight_kg / 1000) : null;
  function tradeComparison(product) {
    const a = product?.observations?.find(r => r.year === 2024);
    const b = product?.observations?.find(r => r.year === 2025);
    return {weight:change(b?.net_product_weight_kg,a?.net_product_weight_kg),value:change(b?.fob_usd,a?.fob_usd),unit:change(unitValue(b),unitValue(a))};
  }
  function annualPrices(monthly) {
    const groups = new Map();
    for (const row of monthly) {
      if (!/^\d{4}-\d{2}$/.test(row.period) || !Number.isFinite(row.usd_per_metric_tonne)) throw new Error('Invalid monthly observation.');
      const year = Number(row.period.slice(0,4));
      const values = groups.get(year) || [];
      values.push(row.usd_per_metric_tonne); groups.set(year,values);
    }
    return [...groups].sort((a,b)=>a[0]-b[0]).map(([year,values])=>({year,months:values.length,mean:values.reduce((a,b)=>a+b,0)/values.length}));
  }
  function destinationShareLabel(value,total) {
    if(!Number.isFinite(value)||value<0||!Number.isFinite(total)||total<=0)return 'Unavailable';
    if(value===0)return '0.00% reported';
    const share=value/total*100;
    if(share<.000001)return '<0.000001%';
    return share.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:share<.01?6:2})+'%';
  }
  root.NickelModel = Object.freeze({change,unitValue,tradeComparison,annualPrices,destinationShareLabel});
})(globalThis);
