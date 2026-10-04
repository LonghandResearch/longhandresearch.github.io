/* Pure unit-explicit calculations, tested against the Python scenario exports. */
(function (root) {
  'use strict';
  function calculate(input) {
    const keys = ['capacity', 'utilization', 'pue', 'wue', 'electricityTariff', 'waterTariff', 'hours', 'nationalTwh'];
    if (keys.some(k => typeof input[k] !== 'number' || !Number.isFinite(input[k]))) throw new Error('Enter a number in every input.');
    const i = input;
    if (i.capacity < 0 || i.capacity > 5000) throw new Error('IT capacity must be between 0 and 5,000 MW.');
    if (i.utilization < 0 || i.utilization > 1 || i.pue < 1 || i.pue > 2.5 || i.wue < 0 || i.wue > 3) throw new Error('Check the load factor, PUE and WUE ranges.');
    if (i.electricityTariff < 0 || i.waterTariff < 0 || i.hours <= 0 || i.nationalTwh <= 0) throw new Error('Tariffs cannot be negative. Annual hours and national demand must be positive.');
    const itKwh = i.capacity * 1000 * i.utilization * i.hours;
    const facilityKwh = itKwh * i.pue;
    const waterM3 = itKwh * i.wue / 1000;
    return {itKwh, facilityKwh, overheadKwh: facilityKwh - itKwh,
      facilityTwh: facilityKwh / 1e9, electricityCost: facilityKwh * i.electricityTariff,
      waterM3, waterDaily: waterM3 / 365, waterCost: waterM3 * i.waterTariff,
      nationalShare: facilityKwh / 1e9 / i.nationalTwh * 100,
      averageLoadMw: facilityKwh / i.hours / 1000,
      fullLoadMw: i.capacity * i.pue};
  }
  const api = { calculate };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.IDN_MODEL = api;
})(typeof window !== 'undefined' ? window : globalThis);
