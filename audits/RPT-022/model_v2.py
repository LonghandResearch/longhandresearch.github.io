from pathlib import Path
import json, csv, math
import openpyxl
import numpy as np

ROOT=Path(__file__).parent
wb=openpyxl.load_workbook(r'C:\Users\user\Downloads\TSMC.xlsx',data_only=True)
def vals(sheet,row,scale=1e6):
    return [float(wb[sheet].cell(row,c).value)/scale for c in range(6,12)]
hist={k:vals(s,r,scale) for k,s,r,scale in [
 ('revenue','Financial Summary',33,1e6),('gross_profit','Financial Summary',34,1e6),
 ('ebit','Financial Summary',35,1e6),('ebitda','Financial Summary',36,1e6),
 ('net_income','Income Statement',210,1e6),('cash_st','Financial Summary',40,1e6),
 ('debt','Financial Summary',42,1e6),('ocf','Cash Flow',68,1e6),
 ('capex','Cash Flow',79,1e6),('fcf','Cash Flow',162,1e6),
 ('da','Financial Summary',46,1e6),('dividends','Cash Flow',93,1e6),
 ('shares','Financial Summary',52,1e6),('ar','Balance Sheet',38,1e6),
 ('inventory','Balance Sheet',47,1e6),('ap','Balance Sheet',181,1e6),
 ('roic','Financial Summary',63,100)]}
hist['years']=list(range(2020,2026))
hist['core_wc']=[a+i-p for a,i,p in zip(hist['ar'],hist['inventory'],hist['ap'])]
hist['ads_eps']=[n/(s/5) for n,s in zip(hist['net_income'],hist['shares'])]
assert all(abs(o-c-f)<1e-6 for o,c,f in zip(hist['ocf'],hist['capex'],hist['fcf']))
ADS=25.932/5
PRICE=406.13
NETCASH=126.003-1031.58/31.88
BRIDGE_SEP=NETCASH-1.422
# Revision 03 inputs.
# 2026 capex: midpoint of the reiterated US$60-64bn budget (Q3 2026 earnings call, 15 Oct 2026).
CAPEX_2026=(60+64)/2
# Q1 2026 dividend of NT$7.00, ex-date 16 Sep, paid 8 Oct 2026 (2Q26 management report p.6).
# It is half of the NT$363.05bn dividends payable at 30 Sep, translated at NT$31.88.
OCT_DIVIDEND=363.05/2/31.88

def model(growth_shift=0,margin_shift=0,wacc=.105,terminal_g=.03,terminal_roic=.20,capex_shift=0,capex_2026=None,fade='growth'):
    capex_2026=CAPEX_2026 if capex_2026 is None else capex_2026
    rev=122.819+53.3
    q4op=53.3*.575
    op=72.518+q4op
    wc=rev*.14
    da=18.403+7.2
    cx=capex_2026
    q4fcff=q4op*.82+7.2-(cx-40.637)-(wc-(15.168+13.418-3.847))
    rows=[dict(year=2026,revenue=rev,growth=rev/hist['revenue'][-1]-1,gm=(82.031+53.3*.66)/rev,
        margin=op/rev,ebit=op,nopat=op*.82,da=da,capex=cx,wc=wc,dwc=wc-hist['core_wc'][-1],
        fcff=op*.82+da-cx-(wc-hist['core_wc'][-1]),ni=64.330+q4op*.82+.8)]
    for y,g,m,d,c,gm in zip(range(2027,2031),[.24,.20,.16,.12],[.57,.555,.545,.54],[.16,.17,.18,.185],[.32,.30,.28,.27],[.655,.64,.63,.625]):
        prev=rows[-1]; rev=prev['revenue']*(1+g+growth_shift); op=rev*(m+margin_shift)
        wc=rev*.14; dwc=wc-prev['wc']; da=rev*d; capex=rev*(c+capex_shift)
        rows.append(dict(year=y,revenue=rev,growth=g+growth_shift,gm=gm+margin_shift,margin=m+margin_shift,ebit=op,nopat=op*.82,
            da=da,capex=capex,wc=wc,dwc=dwc,fcff=op*.82+da-capex-dwc,ni=op*.82+2.46))
    # Fade net reinvestment / incremental NOPAT from explicit-year result to terminal ROIC.
    last=rows[-1]; start_roic=(last['nopat']-rows[-2]['nopat'])/(last['capex']-last['da']+last['dwc'])
    for i,y in enumerate(range(2031,2036),1):
        prev=rows[-1]; g=(.12+growth_shift)*(1-i/5)+terminal_g*i/5
        m=(.54+margin_shift)*(1-i/5)+.50*i/5
        rev=prev['revenue']*(1+g); nopat=rev*m*.82
        roic=start_roic*(1-i/5)+terminal_roic*i/5
        # Revision 03: reinvestment follows revenue growth, so margin fade no longer suppresses it.
        reinv=nopat*g/roic if fade=='growth' else (nopat-prev['nopat'])/roic
        rows.append(dict(year=y,revenue=rev,growth=g,margin=m,ebit=rev*m,nopat=nopat,reinvestment=reinv,fcff=nopat-reinv,incremental_roic=roic))
    terminal_cf=rows[-1]['nopat']*(1+terminal_g)*(1-terminal_g/terminal_roic)
    tv=terminal_cf/(wacc-terminal_g)
    # Valuation date 30 Oct 2026. Mid-year operating flows, 2-month stub for 2026.
    pv_stub=q4fcff*(2/3)/(1+wacc)**(1/12)
    pv_exp=sum(r['fcff']/(1+wacc)**(r['year']-2026-1/3) for r in rows[1:])
    pv_tv=tv/(1+wacc)**(8+2/3)
    ev=pv_stub+pv_exp+pv_tv
    # 30 Oct bridge: 30 Sep bridge plus October operating FCFF less the dividend paid in October.
    oct_fcff=q4fcff/3;BRIDGE=BRIDGE_SEP+oct_fcff-OCT_DIVIDEND
    spot=(ev+BRIDGE)/ADS
    dividends=(q4op*.82*(2/3)+rows[1]['nopat']*(10/12))*.30
    interim_fcff=q4fcff*(2/3)+rows[1]['fcff']*(10/12)
    target_bridge=BRIDGE+interim_fcff-dividends
    target_stub=rows[1]['fcff']*(2/12)/(1+wacc)**(1/12)
    target_exp=sum(r['fcff']/(1+wacc)**(r['year']-2027-1/3) for r in rows[2:])
    target_tv=tv/(1+wacc)**(7+2/3)
    target=(target_stub+target_exp+target_tv+target_bridge)/ADS
    return dict(rows=rows,spot=spot,target=target,ev=ev,pv_stub=pv_stub,pv_exp=pv_exp,pv_tv=pv_tv,tv=tv,terminal_cf=terminal_cf,q4fcff=q4fcff,
      pv_terminal_target=target_tv,terminal_anchor=8+2/3,bridge=BRIDGE,bridge_sep=BRIDGE_SEP,oct_fcff=oct_fcff,oct_dividend=OCT_DIVIDEND,target_bridge=target_bridge,dividend_ads=dividends/ADS,interim_fcff=interim_fcff,start_roic=start_roic,wacc=wacc,g=terminal_g)

base=model(); bear=model(-.06,-.05,.12,.025,.16,.03); bull=model(.06,.03,.095,.035,.24,-.02)
def solve(key):
    lo,hi=-.10,.20
    for _ in range(80):
        mid=(lo+hi)/2
        if model(growth_shift=mid)[key]<PRICE:lo=mid
        else:hi=mid
    return (lo+hi)/2
reverse=solve('spot');reverse_target=solve('target')
# Independent terminal check: 800 discrete annual cash flows, no closed-form tail.
tv_sum=sum(base['terminal_cf']*(1+base['g'])**k/(1+base['wacc'])**(9+2/3+k) for k in range(800))
grid={f'{w}|{g}':model(wacc=w,terminal_g=g)['target'] for w in [.09,.10,.105,.11,.12] for g in [.02,.025,.03,.035,.04]}
tests=[('Growth 2027 to 2030, up or down 3 points',model(growth_shift=.03)['target'],model(growth_shift=-.03)['target']),
 ('EBIT margin 2027 to 2030, up or down 3 points',model(margin_shift=.03)['target'],model(margin_shift=-.03)['target']),
 ('Capex to revenue, down or up 2 points',model(capex_shift=-.02)['target'],model(capex_shift=.02)['target']),
 ('Terminal ROIC of 25% or 15%',model(terminal_roic=.25)['target'],model(terminal_roic=.15)['target'])]
old_fade=model(fade='nopat')
out=dict(history=hist,base=base,bear=bear,bull=bull,price=PRICE,ads=ADS,netcash=NETCASH,reverse_growth_shift=reverse,
  reverse_growth_shift_target=reverse_target,terminal_800=tv_sum,grid=grid,tests=tests,
  capex_2026=CAPEX_2026,oct_dividend=OCT_DIVIDEND,fade_old_method=dict(spot=old_fade['spot'],target=old_fade['target']))
(ROOT/'model_v2.json').write_text(json.dumps(out,indent=2),encoding='utf8')
with (ROOT/'forecast_audit_v2.csv').open('w',newline='') as f:
    fields=['year','revenue','growth','margin','ebit','nopat','da','capex','dwc','reinvestment','fcff','ni']
    writer=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore');writer.writeheader();writer.writerows(base['rows'])
print(json.dumps({k:round(base[k],3) for k in ['spot','target','dividend_ads','ev','pv_tv','q4fcff','start_roic','target_bridge','bridge','oct_fcff']},indent=2))
print('bear',bear['target'],'bull',bull['target'],'reverse spot',reverse,'reverse target',reverse_target,'800-sum vs closed form',tv_sum-base['pv_tv'])
print('forecast',[(r['year'],round(r['revenue'],2),round(r['fcff'],2)) for r in base['rows']])
