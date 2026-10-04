"""Thirteen publication-ready charts generated only from processed CSVs."""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter
import pandas as pd
from config import read_dataset, CHARTS

COLORS = ['#234e70', '#378477', '#bf7847', '#7b6994', '#788490']
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 10, 'axes.spines.top': False,
                     'axes.spines.right': False, 'axes.titleweight': 'bold', 'figure.dpi': 150,
                     'axes.prop_cycle': plt.cycler(color=COLORS), 'svg.hashsalt': 'indonesia-ai-research'})

def finish(fig, ax, filename, title, ylabel, note='Source: processed datasets. S = modeled scenario; see sources.csv.'):
    if title: ax.set_title(title, loc='left', fontsize=13, pad=16)
    ax.set_ylabel(ylabel)
    ax.grid(axis='y', color='#e6e9ec', linewidth=.7)
    ax.set_axisbelow(True)
    fig.text(.10, .025, note, fontsize=8, color='#59636d')
    fig.tight_layout(rect=(0, .065, 1, 1))
    CHARTS.mkdir(parents=True, exist_ok=True)
    fig.savefig(CHARTS / f'{filename}.png', bbox_inches='tight')
    svg_path = CHARTS / f'{filename}.svg'
    fig.savefig(svg_path, bbox_inches='tight', metadata={'Date': None})
    svg_path.write_text('\n'.join(line.rstrip() for line in svg_path.read_text(encoding='utf-8').splitlines()) + '\n', encoding='utf-8')
    plt.close(fig)

def generate_charts():
    p = read_dataset('datacenter_projects')
    mask = p['capacity_basis'].str.lower().isin(['it', 'it_mw', 'it load']) & p.include_in_inventory.astype(str).str.lower().eq('true')
    q = p[mask].copy()
    caps = ['operational_mw', 'under_construction_mw', 'committed_mw', 'planned_mw', 'potential_mw']
    totals = q[caps].apply(pd.to_numeric).sum(min_count=1)
    fig, ax = plt.subplots(figsize=(9, 5))
    ax.bar(['Operational', 'Construction', 'Committed', 'Planned', 'Potential'], totals, color=COLORS)
    finish(fig, ax, '01_capacity_by_status', 'Documented Indonesia capacity by status', 'Disclosed IT capacity (MW)',
           'Partial inventory; IT basis only. Missing capacity is excluded, never treated as measured zero.')
    loc = q.groupby('location')[caps].sum(min_count=1).fillna(0)
    loc = loc.loc[loc.sum(axis=1).sort_values(ascending=False).index]
    fig, ax = plt.subplots(figsize=(10, 6))
    loc.rename(columns=dict(zip(caps, ['Operational','Construction','Committed','Planned','Potential']))).plot.bar(ax=ax, color=COLORS, stacked=True)
    ax.tick_params(axis='x', rotation=30)
    ax.legend(frameon=False, fontsize=8)
    finish(fig, ax, '02_projects_by_location', 'Documented IT capacity by location', 'IT capacity (MW)', 'Partial inventory; no ambiguous connection or facility MW included.')
    e = read_dataset('indonesia_electricity').sort_values('year')
    fig, ax = plt.subplots(figsize=(9, 5))
    for col, label in [('electricity_consumption_twh','National consumption'), ('pln_sales_twh','PLN sales')]:
        ax.plot(e.year, e[col], marker='o', label=label)
    ax.set_xticks(e.year); ax.legend(frameon=False)
    finish(fig, ax, '03_electricity_trend', 'Indonesia electricity consumption and PLN sales', 'TWh/year', 'Actual reported series; scope and coverage breaks documented in indonesia_electricity.csv.')
    s = read_dataset('capacity_scenarios')
    for n, col, scale, title, ylabel in [
        ('04_facility_electricity','facility_electricity_gwh',1,'Facility electricity by IT capacity','GWh/year'),
        ('05_electricity_cost','electricity_cost_rp',1e12,'Electricity energy charge by IT capacity','Rp trillion/year'),
        ('06_water_consumption','water_million_liters_per_year',1,'Modeled on-site water consumption','Million liters/year'),
        ('07_water_cost','water_cost_rp',1e9,'Modeled water cost by IT capacity','Rp billion/year')]:
        fig, ax = plt.subplots(figsize=(9, 5))
        for case, g in s.groupby('case', sort=False): ax.plot(g.it_capacity_mw, g[col] / scale, marker='o', label=case.title())
        ax.set_xlabel('IT capacity (MW)'); ax.legend(frameon=False)
        finish(fig, ax, n, title, ylabel)
    sens = read_dataset('sensitivity')
    for n, driver, col, scale, title, xlabel, ylabel in [
        ('08_pue_sensitivity','pue','facility_electricity_gwh',1,'PUE sensitivity at 1 GW IT','PUE','Facility GWh/year'),
        ('09_wue_sensitivity','wue_l_per_kwh','water_million_liters_per_year',1,'WUE sensitivity at 1 GW IT','WUE (L/IT kWh)','Million liters/year'),
        ('10_utilization_sensitivity','utilization','facility_electricity_gwh',1,'Utilization sensitivity at 1 GW IT','Utilization fraction','Facility GWh/year')]:
        g = sens[sens.driver.eq(driver)]
        fig, ax = plt.subplots(figsize=(9, 5)); ax.plot(g.driver_value, g[col] / scale, marker='o')
        ax.set_xlabel(xlabel)
        finish(fig, ax, n, title, ylabel, 'Scenario S: one driver varies; other drivers held at the base assumptions.')
    one = read_dataset('additional_1gw')
    fig, axes = plt.subplots(1, 2, figsize=(10, 5))
    axes[0].bar(one['case'], one.facility_electricity_twh, color=COLORS[:3]); axes[0].set_title('Electricity', loc='left')
    axes[1].bar(one['case'], one.water_million_liters_per_year, color=COLORS[:3]); axes[1].set_title('Water', loc='left'); axes[1].set_ylabel('Million liters/year')
    fig.suptitle('Additional 1 GW IT: resource scenario comparison', x=.1, ha='left', fontweight='bold')
    finish(fig, axes[0], '11_scenario_comparison', None, 'TWh/year')
    ni = read_dataset('national_impact')
    fig, ax = plt.subplots(figsize=(9, 5))
    for case, g in ni.groupby('case', sort=False): ax.plot(g.it_capacity_mw, g.share_national_consumption_pct, marker='o', label=case.title())
    ax.set_xlabel('IT capacity (MW)'); ax.legend(frameon=False)
    yr = int(ni.national_denominator_year.iloc[0])
    finish(fig, ax, '12_national_share', f'Data-center demand relative to {yr} national consumption', '% of reported annual consumption', 'Annual energy comparison; does not test local grid capacity or peak-load adequacy.')
    fig, ax = plt.subplots(figsize=(9, 5))
    ax.bar(one['case'], one.electricity_cost_rp / 1e12, label='Electricity', color=COLORS[0])
    ax.bar(one['case'], one.water_cost_rp / 1e12, bottom=one.electricity_cost_rp / 1e12, label='Water', color=COLORS[1])
    ax.legend(frameon=False)
    finish(fig, ax, '13_resource_cost_comparison', 'Additional 1 GW IT: electricity and water costs', 'Rp trillion/year', 'I-4 energy-charge assumption; Jakarta industrial marginal water tariff is an explicit local scenario proxy.')
    print('Generated 13 charts in PNG and SVG from processed datasets.')

if __name__ == '__main__': generate_charts()
