/* Dated PBAI updates: price changes and capacity-stage calculations. */
(function (root) {
  'use strict';
  function priceChange(start, end) {
    if (!Number.isFinite(start) || start <= 0 || !Number.isFinite(end) || end <= 0) {
      throw new Error('Price observations must be positive finite numbers.');
    }
    return (end / start - 1) * 100;
  }
  function plannedCapacity(market) {
    const { pipelineMW, constructionMW } = market;
    if (!Number.isFinite(pipelineMW) || !Number.isFinite(constructionMW) ||
        constructionMW < 0 || pipelineMW < constructionMW) {
      throw new Error('Construction must fit within the development pipeline.');
    }
    return pipelineMW - constructionMW;
  }
  const api = { priceChange, plannedCapacity };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PBAIUpdateMath = api;
})(typeof window !== 'undefined' ? window : globalThis);
