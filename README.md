# Streaming Quadratic Funding - A QF Round Every Second, Forever

Streaming quadratic funding (SQF) supercharges quadratic funding (QF), the public goods funding mechanism popularized by Gitcoin [via Vitalik Buterin, Zoe Hitzig, & Glen Weyl](https://arxiv.org/pdf/1809.06421.pdf), with programmable money streams. Rather than discrete matching rounds (i.e. quarterly), SQF dynamically and continuously allocates funds to grantees based on the quadratic matching formula.

## **Problem**

In its current form, quadratic funding is run in periodic matching rounds. This sacrifices capital efficiency, slows the velocity of public goods funding impact, can lead to high round-to-round variance for grantees, and relies heavily on manual operations. SQF can address these issues by effectively running a _quadratic matching round every second._

## **Target Users**

- **Ecosystems/protocols/dApps** want to effectively and democratically allocate funds to public goods grantees in a way that maximizes positive impact.
- **Grantees** want to earn support and rewards for pursuing their projects. They want to focus on building/doing rather than administrative overhead.
- **Contributors/Funders** want to support builders and projects that they value. They want these grantees to be successful, so they/society can accrue the benefits of the funded projects.

## **Description**

Quadratic funding is a crowdfunding mechanism that allocates a pool of matching funds to grantees _proportional to the square of the sum of the square roots of their contributions received_. The number of contributors matters more than the size of contributions—which helps distribute power widely.

Streaming quadratic funding transforms this public goods funding mechanism that web3 has grown to know and love into a real-time force.

Instead of allocating a matching _pool_ based on qualified contributions at the end of a given period, SQF dynamically allocates _streams_ of matching funds based on qualified contribution streams.

This streaming implementation exhibits the same positive democratic qualities as the periodic implementation but also amplifies the potential impact through:

- Better capital efficiency (potentially a net zero treasury)
- High velocity of funding
- More consistency for grantees
- Streamlined administration (potentially permissionless)
- Long-term contributor-grantee relationships

## **Solution**

Superfluid's [General Distribution Agreement](https://docs.superfluid.finance/superfluid/protocol-overview/in-depth-overview/super-agreements/streaming-distributions-coming-soon) provides the technical foundation to implement SQF. Even though this functionality is only on testnets and is subject to modifications, the basic implementation approach shouldn't change and is outlined here.

![Simple GDA Diagram](https://github.com/Geo-Web-Project/streaming-quadratic-funding/assets/15019279/3674015c-fb26-42f2-9a99-5e64cb62de5c)

**SQF+GDA Equations**
```math
flowrate_x = (units_x \div totalUnits) \times totalMatchingAvailable
```
```math
units_x = (\sum_{i=1}^{n} \sqrt{contribution_i})^2
```

Operations when a contribution stream is added/updated:
```math
totalMatchingAvailable = unchanged
```
```math
units_{x_i} = (\sqrt{units_{x_t-1}} + \sqrt{contribution_{i_t}} - \sqrt{contribution_{i_t-1}})^2
```
```math
totalUnits_t = totalUnits_{t-1} + units_{x_t} - units_{x_t-1}
```

## **Sybil Resistance & Future Implementation Considerations**

Sybil resistance is an ongoing arms race that all online voting systems must grapple with. We aren't attempting to solve the Sybil problem with SQF, but the implications of streaming versus discrete matching must be evaluated. Related attacks on QF that undermine its effectiveness, including bribery and collusion, also apply to the streaming implementation.

Our initial SQF implementation should attempt to be on par or better with basic periodic Sybil resistance designs. Best-in-class anti-bribery ([MACI](https://clr.fund/#/about/maci)) and collusion mechanisms ([pairwise coordination subsidies](https://ethresear.ch/t/pairwise-coordination-subsidies-a-new-quadratic-funding-design/5553)) require math that's too advanced for current on-chain streaming but should continue to be monitored.

Certain temporary trust assumptions in administrators or grantees may be appropriate to allow SQF to mature with experience and usage.

### Closed Loops

The capital efficiency of streaming has a potential downside. It could potentially be used to create (massive) closed-loop contributions.

The attack would entail a malicious contributor/grantee combo working together to create a net zero cash flow for the contributor resulting in an overstated SQF matching stream for the grantee.

![Streaming Quadratic Funding](https://github.com/Geo-Web-Project/streaming-quadratic-funding/assets/15019279/61072719-225d-4c44-b50a-3862d74847ab)

This attack requires at least one Sybil account because a direct return stream from malicious grantee to contributor would net the "inbound" contribution stream to zero in the Superfluid protocol.

This attack has diminishing returns as the square root transformation in the QF algorithm devalues "whales" but is effective enough that it must be addressed in other ways.

The Superfluid protocol requires at least a 4-hour stream buffer on Optimism. The most simple closed-loop flow would require at least 12 hours of capital at the inflated stream value to be locked for as long as the streams stay open.

This means that this attack isn't free; at some point, the diminishing returns of the overstated SQF matching will be less than the cost of capital locked up. Increasing the required buffer for contribution streams is a blunt instrument that could be used to combat this attack (it trades off capital efficiency for good actors as well).

Luckily these closed loops must also be on-chain to be fully realized. Any leak or break in the on-chain loop means that the attacker will be forced to allocate additional capital to the scheme and/or incur additional transaction costs. These "open-loop" attempts start to resemble attacks you might see in a periodic system rather than unique to streaming.

![SQF - Manual Transactions](https://github.com/Geo-Web-Project/streaming-quadratic-funding/assets/15019279/70c4144e-8136-42a8-977a-8c88ce85609b)

On-chain traceability of loops gives us opportunities to combat the attacks. Additional Sybil hops to obscure/fragment closed loops can make detection harder, but also require locking more capital. The use of streams by grantees will be encouraged, but the ratio (in/out), timing, and growth of streams used by grantees can be monitored for signs of foul play.

Exploring the design space of challenging or slashing stakes/deposits of malicious grantees can help make the risk-adjusted cost of inflating an inbound contribution stream economically unviable.

### Split Contribution Streams & Maximum Matching

Another strategy to combat closed-loop streams could be to introduce mandatory "leakage" to any attempted loop. To qualify for matching, contribution streams could be mandated to be split between the grantee and the matching pool (or a different public goods fund like RPGF) at a predefined percentage. This could be paired with a maximum per grantee match.

Take for example a 5% split mandate: an initial 1 ETH/year contribution stream would result in .95 ETH in year one directed to the grantee and .05 added to the _total_ matching flow.

By year two in a closed-loop attack without additional capital inflows, the loop's total flow would need to be lowered to .95 ETH/year (resulting in .9025 ETH/year to the grantee and .0475/year ETH to the treasury). The actor(s) could add external capital to the system (which would be seen as an "honest" action benefiting the matching pool) or fill the leakage with funds from their inflated match stream. This is where a maximum match per grantee could complement the split and again make it uneconomical to inflate contributions beyond an honest contribution.

This scheme could also be applied as an optional scaling factor for the contributor's trust score along with other Sybil resistance credentials a la [Gitcoin Passport](https://passport.gitcoin.co/).

### Payout Timing

Periodic matching pools and continuous matching streams display different reward functions for malicious actors.

Periodic matching pools are proverbial honeypots. Their discrete payout is typically an all-or-nothing proposition. Making it through a periodic round review means the reward is realized fully.

Streaming rewards will be smaller in the short-term, but also immediate. This may incentivize a different type of arms race where low-cost, high-volume strategies that don't last long under scrutiny are the preferred attack vectors.

Challenge periods, locking funds, or other clawback-like mechanisms could be appropriate but may sacrifice some capital efficiency, velocity, or other core value props of SQF. There is no perfect system. Some level of shrinkage is acceptable in pursuit of the larger goal.

### Quadratic Voting

One of the most powerful qualities of quadratic funding is its ability to support open-ended participation (plus bonus points for attracting funds beyond the matching pool).

The open nature of QF combined with streaming's capital efficiency is at the root of most of the unique challenges outlined so far. Utilizing a quadratic voting (QV) scheme to allocate streaming funds offers an alternate path.

With QV, the supply of votes could be open-ended but not recyclable. Onchain votes can still be represented by and streamed as tokens while additional mechanisms could prevent them from entering closed loops. Grantees might be required to burn incoming token votes to receive their funding match or restrictions on transferability could be instituted.

Using votes instead of tradable tokens to allocate matching funds could also change the contributor population and mindset. The use of Sybil resistance/trust scores might not lead to uniform voting power, but would further distribute the power structure. "Whales" wouldn't exist. Those without capital to budget for QF would still participate fully. Allocating votes versus allocating tradable tokens might produce a different lens by which voters/contributors make decisions.

## **References**

[_A Flexible Design for Funding Public Goods_](https://arxiv.org/pdf/1809.06421.pdf)

[_Superfluid General Distribution Agreement Discussion_](https://github.com/superfluid-finance/protocol-monorepo/discussions/1284)

[_Superfluid_](https://docs.superfluid.finance/superfluid/protocol-overview/in-depth-overview/super-agreements/streaming-distributions-coming-soon)[_G_](https://docs.superfluid.finance/superfluid/protocol-overview/in-depth-overview/super-agreements/streaming-distributions-coming-soon)[_DA_](https://docs.superfluid.finance/superfluid/protocol-overview/in-depth-overview/super-agreements/streaming-distributions-coming-soon)

[_Superfluid OP Goerli Addresses_](https://console.superfluid.finance/optimism-goerli/protocol)
