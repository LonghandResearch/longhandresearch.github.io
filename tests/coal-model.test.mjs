import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const ctx={};
runInNewContext(readFileSync(new URL('../assets/js/coal/model.js',import.meta.url),'utf8'),ctx);
const M=ctx.CoalModel;
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
test('scenario converts million tonnes to USD billion and reconciles the bridge',()=>{
 const r=M.calculate(M.baseline);
 close(r.revenue,6);close(r.revenueCharge,.6);close(r.operatingCost,4.3);close(r.contribution,1.1);
 close(r.breakEven,43/.9);close(r.margin,1.1/6*100);
 close(r.revenue-r.revenueCharge-r.operatingCost,r.contribution);
});
test('price at break-even gives zero contribution at different volumes',()=>{
 const p=M.calculate(M.baseline).breakEven;
 for(const volume of [20,100,160])close(M.calculate({...M.baseline,volume,price:p}).contribution,0);
});
test('losses, zero output and non-zero charge remain explicit',()=>{
 assert.ok(M.calculate({...M.baseline,price:30}).contribution<0);
 const r=M.calculate({...M.baseline,volume:0});close(r.contribution,0);assert.equal(r.margin,null);
 assert.throws(()=>M.calculate({...M.baseline,charge:100}));
 assert.throws(()=>M.calculate({...M.baseline,volume:NaN}));
});
test('source comparisons use matching periods and denominators',()=>{
 close(M.change(495,517),-4.255319148936166);
 close(M.change(1062,1074),-1.11731843575419);
 close(M.change(147.1,135.2),8.801775147928993);
 assert.throws(()=>M.change(1,0));
});
