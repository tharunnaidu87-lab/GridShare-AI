# GridShare AI demonstration guide

GridShare AI explores how rural households can coordinate surplus renewable energy, preserve battery reserves and support essential services. This implementation is a local software simulation of the paper's coordination layer.

## Five-minute walkthrough

1. **Explain the problem (30 seconds).** “A village can have energy surplus and energy shortage at the same time. Our system gives each building an agent to coordinate exchanges.” Show the ten buildings: six homes, clinic, drinking-water pump, tailoring and dairy units.
2. **Run a normal hour (45 seconds).** Click Normal day and Run 1 hour. Click a selling home and a buying building. Explain energy bought/sold and credits. Open the energy balance panel: the residual should be approximately zero.
3. **Reduce supply (45 seconds).** Select Cloud cover and run an hour. Then Emergency and run another. Clinic and drinking-water demand increases in emergency mode. Point out critical coverage and unmet demand; do not claim the system creates energy or guarantees full supply.
4. **Protect the battery (30 seconds).** Select a solar home. Keep the proposed export at 100 kWh and click Check export. The request is rejected. This validator is a dry run, so it cannot alter balances.
5. **Demonstrate offline accounting (60 seconds).** Reset the experiment, choose Solar surplus, toggle Internet offline and run one hour. Open Trading ledger. Show pending settlement, then Reconnect & sync pending. Sync a second time to show that no duplicate charge occurs. Local credits are provisional accounting entries; only status changes on sync.
6. **Show evidence (45 seconds).** Open Impact comparison. Explain that the no-sharing baseline receives identical generation and demand traces and starts with identical resources. Open AI forecasting and show training/test rows and measured synthetic test error.
7. **Close (15 seconds).** “We have implemented the software coordination and evaluation prototype. The next stage is validation with real measurements and integration with certified microgrid controllers.”

## Common questions

**Is this just a dashboard?**
No. The dashboard calls an executable simulation engine. Each step changes battery energy, trading balances, shortages and the ledger. The engine checks energy conservation, credit conservation and battery reserves.

**Where is the AI?**
The forecasting page trains a four-feature regression model locally on 180 synthetic days (4,320 hourly records) and evaluates on 60 held-out days (1,440 records). The allocator currently uses deterministic rules and constraints. The forecast does not yet drive trading; that is explicitly marked future work.

**How do the agents choose a partner?**
Each building first meets its own load from solar and usable battery. Buyers are processed by criticality tier. Within a tier, small allocation rounds favour lower essential-demand coverage and accumulated unmet demand. Among feasible sellers, the nearest on the illustrative map is chosen. The common scheduler runs the agents inside one browser; it is not a distributed A2A implementation.

**How is fairness measured?**
Jain's index is calculated over the six homes' essential-demand coverage fractions for the latest hour. This is a normalized adaptation of the paper's received-energy metric, so differing home sizes are not treated as identical requirements. Also show absolute essential coverage: equal deprivation can otherwise look fair. Zero coverage for all gives index 0.

**Do poor households get energy for free?**
No. Trading is restricted by the buyer's available credits. Within that budget, essential demand receives priority. Grants, subsidies, credit limits or a free lifeline quota would require an additional explicit community policy.

**Does the blockchain work offline?**
No. This prototype records trades in a local browser ledger and simulates deferred settlement. There is no deployed blockchain. In the proposed architecture, on-chain settlement would occur after connectivity returns.

**Can it power a house?**
This build simulates energy transfer. Actual transfer would require compatible microgrid wiring, smart meters, protected switching and a certified electrical controller. Software decisions alone cannot transfer electricity.

**Why is the tariff fixed?**
A fixed 2 credits/kWh isolates allocation behaviour for this demo. Dynamic price negotiation and real payment rails are future work.

## Model assumptions

- One timestep is one hour; generation and demand are expressed as kWh within the step.
- Ten fixed nodes; default household IDs H1–H6, clinic CL, drinking-water pump WP, tailoring TU and dairy chiller DC.
- Homes classify 60% of their demand as essential (tier 2) and 40% optional (tier 4). Clinic and drinking-water loads are tier 1; productive enterprises are tier 3.
- Own demand is served first. Priority ordering applies to traded surplus, not forced confiscation of another household's own energy.
- Battery reserve cannot be sold or used for local demand. Efficiency is 95% for charging and 95% for discharging (90.25% round trip).
- Remaining solar charges batteries after trading. Surplus beyond battery capacity is curtailed.
- All starting battery energy is assumed renewable. No grid import exists in this experiment.
- Building connections allow 8 kWh of combined imports/exports per hourly step. Shared bus throughput is adjustable and counts each trade once.
- Map distances are illustrative coordinates for partner selection, not physical kilometres or a power-flow model. Distribution losses, voltage and line impedance are not modelled.
- Synthetic cloud cover and demand controls are scenario assumptions, not live weather observations.
- All existing local trades count toward balances even when their settlement is pending. Reconnection marks them settled without retransferring energy or credits.
- Baseline batteries evolve independently. Comparisons are cumulative across the current experiment. Critical coverage and fairness are clearly labelled latest-hour values.

## Relation to the research paper

Implemented: energy balance, reserve constraints, autonomous per-node rules, essential-priority allocation, local credits, local persistence, synthetic solar ML, reproducible baseline experiments, and CSV evidence.

Simulated: smart meters, electrical execution, connectivity, settlement and agent communication.

Planned: real forecast datasets, demand forecasting, forecast-driven scheduling, price negotiation, smart contracts, distributed edge agents, mesh/LoRa communication, authentication, livelihood scheduling and physical microgrid integration.

The reference paper is a proposal with no measured results. Do not present this demo's synthetic outcomes as field-trial results. Its literature-review citation numbering also needs review before publication: several named studies in the survey do not match the corresponding numbered bibliography entries.
