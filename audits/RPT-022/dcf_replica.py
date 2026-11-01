# Independent replica of TSM_Valuation_Model.xlsx (revision 03). Written separately from model_v2.py.
import math
BASE=dict(wacc=.105,g=.03,tax=.18,tm=.50,roic=.20,wc=.14,payout=.30,
  gr=[.24,.20,.16,.12],om=[.57,.555,.545,.54],da=[.16,.17,.18,.185],cx=[.32,.30,.28,.27],
  cx26=62.0,fade_mode='growth',oct_div=363.05/2/31.88)
def run(p=None,**kw):
    q=dict(BASE); q.update(p or {}); q.update(kw)
    W,g,t=q['wacc'],q['g'],q['tax']
    rev25=122.472007572; wc25=(8.99342715+9.19508138-2.69142198)
    rev=[122.819+53.3]; ebit=[72.518+53.3*.575]
    for i in range(4): rev.append(rev[-1]*(1+q['gr'][i])); ebit.append(rev[-1]*q['om'][i])
    nop=[e*(1-t) for e in ebit]
    da=[18.403+7.2]+[rev[i+1]*q['da'][i] for i in range(4)]
    cx=[q['cx26']]+[rev[i+1]*q['cx'][i] for i in range(4)]
    wc=[r*q['wc'] for r in rev]; dwc=[wc[0]-wc25]+[wc[i]-wc[i-1] for i in range(1,5)]
    reinv=[cx[i]-da[i]+dwc[i] for i in range(5)]
    roic=[None]+[(nop[i]-nop[i-1])/reinv[i] for i in range(1,5)]
    fcff=[nop[i]-reinv[i] for i in range(5)]
    g30,m30,r30=q['gr'][3],q['om'][3],roic[4]
    for k in range(1,6):
        gg=g30*(1-k/5)+g*k/5; mm=m30*(1-k/5)+q['tm']*k/5; rr=r30*(1-k/5)+q['roic']*k/5
        rev.append(rev[-1]*(1+gg)); n=rev[-1]*mm*(1-t)
        if q['fade_mode']=='model': ri=(n-nop[-1])/rr   # revision 02 rule
        else: ri=n*gg/rr   # revision 03 rule: reinvestment = NOPAT x growth / RONIC
        nop.append(n); reinv.append(ri); fcff.append(n-ri)
    q4n=53.3*.575*(1-t); q4cx=q['cx26']-40.637; q4dwc=wc[0]-(15.168+13.418-3.847)
    q4f=q4n+7.2-q4cx-q4dwc
    T=fcff[-0] if False else None
    tn=nop[-1]*(1+g); tf=tn-tn*g/q['roic']
    # current
    pv=q4f*2/3/(1+W)**(1/12)
    pv+=sum(fcff[i]/(1+W)**(i-1+2/3) for i in range(1,10))
    tv=tf/(W-g)/(1+W)**(8+2/3); ev=pv+tv
    br=126.003-1031.58/31.88-1.422+q4f/3-q['oct_div']; sh=25.932/5
    cur=(ev+br)/sh
    # target
    pvt=fcff[1]*2/12/(1+W)**(1/12)+sum(fcff[i]/(1+W)**(i-2+2/3) for i in range(2,10))
    tvt=tf/(W-g)/(1+W)**(7+2/3)
    br12=br+q4f*2/3+fcff[1]*10/12-(q4n*2/3+nop[1]*10/12)*q['payout']
    tgt=(pvt+tvt+br12)/sh
    return dict(cur=cur,tgt=tgt,ev=ev,tv=tv,tf=tf,fcff=fcff,rev=rev,nop=nop,reinv=reinv,q4f=q4f,br12=br12)
if __name__=='__main__':
    b=run(); print('base cur %.4f tgt %.4f ev %.3f tv %.3f tf %.3f q4f %.4f'%(b['cur'],b['tgt'],b['ev'],b['tv'],b['tf'],b['q4f']))
    print('FCFF',[round(x,1) for x in b['fcff']])
    print('WACC/g grid (12M):')
    for W in [.09,.10,.105,.11,.12]:
        print(W,[round(run(wacc=W,g=g)['tgt']) for g in [.02,.025,.03,.035,.04]])
    add=lambda L,d:[x+d for x in L]
    print('growth +3/-3', round(run(gr=add(BASE['gr'],.03))['tgt']), round(run(gr=add(BASE['gr'],-.03))['tgt']))
    print('margin +3/-3', round(run(om=add(BASE['om'],.03))['tgt']), round(run(om=add(BASE['om'],-.03))['tgt']))
    print('capex -2/+2', round(run(cx=add(BASE['cx'],-.02))['tgt']), round(run(cx=add(BASE['cx'],.02))['tgt']))
    print('ROIC 25/15', round(run(roic=.25)['tgt']), round(run(roic=.15)['tgt']))
    # reverse DCF: uniform growth shift
    for which in ['cur','tgt']:
        lo,hi=0,.2
        for _ in range(60):
            m=(lo+hi)/2; v=run(gr=add(BASE['gr'],m))[which]
            lo,hi=(m,hi) if v<406.13 else (lo,m)
        print('reverse DCF shift to match price using',which,round(m*100,2),'pp')
    old=run(fade_mode='model',oct_div=0); old['br']=0
    print('Revision 02 rules (dNOPAT fade, 30 Sep bridge, no Oct items):')
    o=run(fade_mode='model'); print('  dNOPAT fade with rev03 bridge: cur %.2f tgt %.2f'%(o['cur'],o['tgt']))
