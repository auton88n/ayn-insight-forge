/**
 * Advanced Trading Knowledge Base
 * 9 educational modules for deep trading intelligence.
 * Used by analyze-trading-chart for reference and by trading-coach (via condensed summary).
 */

// ─── MODULE 1: SCAM DETECTION ───

export const SCAM_DETECTION_RULES = `
SCAM COIN DETECTION - CHECK BEFORE ANY ANALYSIS:

1. LIQUIDITY RED FLAGS
   - Liquidity < $50,000 = EXTREME DANGER
   - Liquidity < $500,000 = HIGH RISK
   - Liquidity locked < 6 months = DANGER
   - No liquidity lock = EXIT IMMEDIATELY

2. CONTRACT RED FLAGS
   - Mint function enabled = can print unlimited coins = SCAM
   - Blacklist function = can ban your wallet = SCAM
   - Honeypot = can buy but CANNOT sell = SCAM
   - Buy/sell tax > 10% = likely scam
   - Unverified contract = RED FLAG
   - Proxy contract = can change code = DANGER

3. TOKENOMICS RED FLAGS
   - Top 10 wallets hold > 50% of supply = DANGER
   - Dev/team wallet > 10% with no vesting = DANGER
   - No vesting schedule for team tokens = RED FLAG
   - Whitepaper with no technical detail = copy-paste scam

4. SOCIAL RED FLAGS
   - Fake followers (engagement rate < 1%)
   - "100x guaranteed" or "can't lose" language
   - Anonymous team with zero track record
   - Website created < 30 days ago

5. CHART RED FLAGS (Manipulation)
   - Perfectly vertical pump with zero retracement = wash trading
   - Volume spikes but price unmoved = fake volume
   - Price only goes up with no sells = honeypot
   - Sudden -90% drop after pump = rug pull

6. VERIFICATION CHECKLIST
   □ Contract verified on explorer?
   □ Liquidity locked 6+ months?
   □ Top 10 holders < 30% supply?
   □ No mint/blacklist functions?
   □ Buy AND sell working?
   □ Team tokens vested?
   □ Organic community?

VERDICT: 0-2 flags = Proceed | 3-4 = HIGH RISK reduce 75% | 5+ = DO NOT TRADE
`;

// ─── MODULE 2: SMART MONEY CONCEPTS ───

export const SMART_MONEY_CONCEPTS = `
SMART MONEY CONCEPTS (SMC) - HOW INSTITUTIONS TRADE:

1. ORDER BLOCKS
   Last candle before a strong impulsive move = institutional order zone.
   Bullish OB: Last bearish candle before strong up move → BUY ZONE on retest
   Bearish OB: Last bullish candle before strong down move → SELL ZONE on retest
   Stop loss goes beyond the order block.

2. FAIR VALUE GAPS (FVG)
   Three-candle imbalance where middle candle leaves a gap.
   Price is magnetically attracted to fill FVGs.
   FVG + Order Block in same area = VERY HIGH PROBABILITY setup.
   In uptrend: buy at bullish FVG. In downtrend: sell at bearish FVG.

3. LIQUIDITY POOLS
   Areas where retail stop losses cluster (below obvious support, above resistance, round numbers).
   Stop Hunt Pattern: Price breaks support → triggers stops → smart money fills → price reverses.
   Rule: Don't place stops at obvious levels. Wait for the stop hunt, then enter.

4. BREAK OF STRUCTURE (BOS)
   Bullish BOS: Price breaks above last Lower High = trend change to bullish.
   Bearish BOS: Price breaks below last Higher Low = trend change to bearish.
   Wait for CANDLE CLOSE confirmation, not just wick.

5. CHANGE OF CHARACTER (CHOCH)
   Early signal before BOS. In downtrend: new Lower Low but then Higher High = possible bottom.
   In uptrend: new Higher High but then Lower Low = possible top.

6. PREMIUM/DISCOUNT ZONES
   Above 50% of range = Premium (expensive) → only SELL
   Below 50% of range = Discount (cheap) → only BUY

7. INDUCEMENT
   Fake breakout to trap traders. Wait for retest, check volume, look for OB/FVG confirmation.
`;

// ─── MODULE 3: FUNDING RATES & DERIVATIVES ───

export const FUNDING_RATES_KNOWLEDGE = `
FUNDING RATES AND DERIVATIVES:

1. FUNDING RATES (Perpetual futures)
   Positive (>+0.05%/8h): Longs paying shorts = overleveraged long = DANGER for longs
   Negative (<-0.05%/8h): Shorts paying longs = overleveraged short = squeeze opportunity
   Extreme positive (>+0.1%): SELL signal, correction likely
   Extreme negative (<-0.1%): BUY signal, short squeeze likely

2. OPEN INTEREST (OI)
   OI rising + price rising = Healthy trend (new money)
   OI rising + price falling = Strong downtrend (shorts piling in)
   OI falling + price rising = Short squeeze (weak)
   OI falling + price falling = Panic liquidations (potential bottom)

3. LIQUIDATION LEVELS
   Market makers push price to liquidation clusters.
   After major liquidation event = potential reversal point.

4. LONG/SHORT RATIO
   >70% long = Contrarian SELL | <30% long = Contrarian BUY
   Combined: High longs + high positive funding = VERY BEARISH

RULES: Never open leveraged longs when funding >+0.05% and longs >70%.
Best longs: negative funding, <40% long, OI declining.
`;

// ─── MODULE 4: TOKEN UNLOCKS ───

export const TOKEN_UNLOCK_KNOWLEDGE = `
TOKEN UNLOCK SCHEDULES:

IMPACT ON PRICE:
   <1% of supply: Minor | 1-5%: Notable | >5%: MAJOR dump risk | >10%: AVOID

HOW TO TRADE:
   Before (1-2 weeks): Take profits or wait
   During: Don't catch falling knife, wait for exhaustion
   After (1-3 days): If stabilizes at support = potential entry

GOOD VESTING: Long (3-4yr), small monthly (<2%), cliff 12+mo
BAD VESTING: Short (6-12mo), large cliff unlock, team sells at launch

RULES:
   Never enter 2 weeks before major unlock
   Always check schedule before swing trades
   Major unlock upcoming = reduce position 50%
`;

// ─── MODULE 5: WYCKOFF METHOD ───

export const WYCKOFF_METHOD = `
WYCKOFF METHOD - INSTITUTIONAL ACCUMULATION/DISTRIBUTION:

ACCUMULATION (Bottom):
   Phase A: Selling Climax (SC) stops downtrend, Automatic Rally (AR)
   Phase B: Range between SC and AR, institutions accumulate quietly
   Phase C: SPRING - breaks below support (shakeout), best buy zone
   Phase D: Last Point of Support (LPS), Sign of Strength (SOS)
   Phase E: Breakout and uptrend begins
   BUY in Phase C (spring) or Phase D (LPS), NOT Phase E (too late)

DISTRIBUTION (Top):
   Phase A: Buying Climax (BC), Automatic Reaction (AR)
   Phase B: Range, institutions selling to retail
   Phase C: UTAD - breaks above resistance (bull trap), best sell zone
   Phase D: Last Point of Supply (LPSY), Signs of Weakness (SOW)
   Phase E: Breakdown and downtrend
   SELL in Phase C (UTAD) or Phase D (LPSY)

VOLUME RULES:
   Price up + Volume up = Healthy | Price up + Volume down = Weak rally
   Price down + Volume up = Distribution | Price down + Volume down = Normal pullback
   Stopping volume: High volume + small price change = absorption = reversal signal

IDENTIFICATION:
   Accumulation: Long base, multiple support tests, spring below support, volume declining
   Distribution: Long top, multiple resistance tests, upthrust above resistance
`;

// ─── MODULE 6: ADVANCED RISK MANAGEMENT ───

export const ADVANCED_RISK_MANAGEMENT = `
PROFESSIONAL RISK MANAGEMENT:

MATH OF LOSS:
   -10% → need +11% | -20% → +25% | -30% → +43% | -50% → +100% | -75% → +300%
   LESSON: Avoid large losses at ALL costs.

POSITION SIZING:
   1% Rule: Never risk >1% per trade ($10K account = $100 max loss)
   2% Rule: Maximum for most traders
   Formula: Position = (Account × Risk%) / (Entry - Stop)

PORTFOLIO HEAT: Never >5-10% total risk across all open trades.

CORRELATION: In crypto, all alts drop with BTC. 5 alt longs ≠ diversification.

DRAWDOWN RULES:
   -5% in day = Stop today | -10% in week = 3-day break
   -20% in month = 2-week break | -30% total = Stop, paper trade

KELLY CRITERION: Optimal size = (WinRate × Odds - LossRate) / Odds. Use HALF Kelly.

STOP LOSS: NEVER move stop further from entry. Ever.

LEVERAGE RULES:
   0-3mo: 0x | 3-12mo: max 2x | 1-3yr: max 5x | Pros use 1-3x
`;

// ─── MODULE 7: MARKET CYCLES ───

export const MARKET_CYCLES_ADVANCED = `
MARKET CYCLES:

BITCOIN HALVING CYCLE (4 years):
   Year 0 (Halving): Accumulation | Year 1: Bull begins
   Year 2: Parabolic peak | Year 3: Bear (-70-85%) | Year 4: Recovery
   Each cycle = smaller % gains as market matures.

CYCLE PSYCHOLOGY:
   Accumulation: Low volume, boring, media says "crypto dead" → BUY
   Early Bull: Cautious optimism → BUILD position
   Mid Bull: Excitement, FOMO starts → HOLD, trail stops
   Late Bull: Mania, taxi drivers buying, memes exploding → TAKE PROFITS
   Early Bear: Denial, "just a dip" → SELL remaining
   Mid Bear: Panic, anger → CASH
   Late Bear: Capitulation, no one cares → START DCA

ALTSEASON: BTC dominance <40%, BTC at new ATH, rotation: BTC → ETH → large caps → mid → small → memes.
If memes exploding = PEAK MANIA = sell.

MACRO FACTORS:
   Fed rate cuts = BULLISH | Rate hikes = BEARISH
   DXY rising = BEARISH crypto | DXY falling = BULLISH
   High CPI = Fed hawkish = BEARISH | Low CPI = BULLISH

PEAK INDICATORS: F&G >80, Google Trends ATH, mainstream media bullish, celebrities launching tokens.
BOTTOM INDICATORS: F&G <20, media shutdown, bankruptcies, BTC -70-85% from ATH.
`;

// ─── MODULE 8: SESSION & NEWS TRADING ───

export const SESSION_AND_NEWS_KNOWLEDGE = `
TRADING SESSIONS:

ASIAN (00:00-08:00 UTC): Low volume, range trading, avoid breakouts
LONDON (08:00-16:00 UTC): Volume picks up, often reverses Asian session
NEW YORK (13:00-21:00 UTC): Highest volume (London/NY overlap 13:00-16:00)
AFTER HOURS (21:00-00:00 UTC): Lower liquidity

CRITICAL NEWS EVENTS:
   CPI (monthly): Higher = BEARISH, Lower = BULLISH. 2-5% crypto swing.
   FOMC (8x/year): Rate cut = BULLISH. 3-8% swing. Day 2 ~18:00 UTC.
   NFP (1st Friday): Strong jobs = BEARISH (Fed keeps rates high)

CRYPTO EVENTS:
   Halving = accumulate 6-12mo before
   Exchange listing (Binance) = +50-200%, then sell the news
   ETF approval = very bullish | SEC lawsuits = short-term bearish

NEWS TRADING RULES:
   Before: Reduce positions 50%, widen stops
   During: Don't trade first 5 minutes
   After: Trade the retest, not the spike
   Buy rumor sell news. Bad news in bull = buy dip. Good news in bear = sell rally.

WEEKEND: Lower liquidity, large moves often reversed Monday. Avoid big positions Friday.
`;

// ─── MODULE 9: MULTI-TIMEFRAME ANALYSIS ───

export const MULTI_TIMEFRAME_KNOWLEDGE = `
MULTI-TIMEFRAME ANALYSIS:

GOLDEN RULE: Always trade in direction of higher timeframe. Higher TF = law.

HIERARCHY:
   Monthly → macro direction (check weekly)
   Weekly → swing direction (check start of week)
   Daily → trade direction (main analysis)
   4H → entry confirmation
   1H → precise entry
   15M → scalp entry only

TOP-DOWN PROCESS:
   1. Monthly: What's the macro trend? Bullish = only look for buys
   2. Weekly: Where in weekly structure? At resistance = careful
   3. Daily: What patterns forming? FVGs? Trend?
   4. 4H: Where is entry zone? OBs, FVGs, S/R
   5. 1H: What's the exact entry signal? Confirmation candle?

BEST SETUP (all align):
   Monthly up, Weekly at support, Daily bullish pattern, 4H order block, 1H confirmation
   = VERY HIGH PROBABILITY

AVOID: When timeframes conflict. 15m buy signal vs Daily downtrend = TRAP.

STYLE MAPPING:
   Day trader: Daily → 4H → 1H
   Swing trader: Weekly → Daily → 4H
   Scalper: 4H → 1H → 15M
   Position trader: Monthly → Weekly → Daily

MISTAKES: Trading against higher TF, switching TF after entry, using too many TFs (max 3).
`;

// ─── CONDENSED SUMMARY FOR TRADING COACH PROMPT ───

export function getAdvancedKnowledgeSummary(): string {
  return `
ADVANCED TRADING KNOWLEDGE (Key Decision Rules):

SCAM DETECTION:
- Volume <$100K = liquidity risk. Price >50% in 24h = manipulation risk.
- Suspicious tickers (MOON, SAFE, ELON) = red flag. Check contract verification.
- 0-2 flags = proceed, 3-4 = reduce 75%, 5+ = don't trade.

SMART MONEY CONCEPTS:
- Order Blocks: Last candle before impulsive move = institutional zone. Trade retests.
- Fair Value Gaps: 3-candle imbalance. Price returns to fill. FVG + OB = highest probability.
- Liquidity Pools: Below obvious support = stop hunt zone. Wait for sweep then enter.
- BOS confirms trend change. CHOCH is early warning. Wait for candle close.
- Only BUY in discount (<50% of range), only SELL in premium (>50%).

FUNDING RATES (Crypto):
- Positive >0.05% = overleveraged long = danger for longs. Negative = squeeze opportunity.
- Extreme positive >0.1% = SELL signal. Extreme negative = BUY signal.
- High longs + high funding = VERY BEARISH. Low longs + negative funding = VERY BULLISH.
- Never leverage long when funding positive and longs >70%.

TOKEN UNLOCKS:
- >5% supply unlock = MAJOR dump risk. >10% = AVOID entirely.
- Never enter 2 weeks before major unlock. Post-unlock stability = safer entry.

WYCKOFF:
- Accumulation: Long base → spring below support (shakeout) = BEST BUY.
- Distribution: Long top → upthrust above resistance (bull trap) = BEST SELL.
- Volume confirms: up+volume up = healthy. Up+volume down = weak rally.

RISK MANAGEMENT:
- Max 1-2% risk per trade. Portfolio heat max 10%. Never move stop further away.
- Drawdown rules: -5% day stop, -10% week break, -20% month break.
- Leverage: beginners 0x, experienced max 5x, pros use 1-3x.

MARKET CYCLES:
- Halving cycle: accumulation → bull → peak → bear (4 years).
- Altseason: BTC dominance <40%, rotation BTC→ETH→large→mid→small→memes. Memes = peak.
- Fed cuts = bullish. DXY falling = bullish. High CPI = bearish.

SESSIONS:
- Asian: low volume, ranges. London: volume up. NY: highest (13-21 UTC). Weekend: low liquidity.
- Before major news: reduce 50%. During: don't trade first 5min. After: trade retest.

MULTI-TIMEFRAME:
- Always trade WITH higher timeframe direction. 15m signal vs Daily downtrend = TRAP.
- Best: all timeframes align. Use max 3 timeframes.
`;
}
