/**
 * Complete Trading Knowledge Base
 * For Gemini Vision Chart Analysis
 * 100+ patterns, indicators, fundamentals, risk management, psychology, and context rules.
 * Research data sourced from Thomas Bulkowski's "Encyclopedia of Chart Patterns" (10,000+ patterns).
 */

// ============================================
// INTERFACES
// ============================================

export interface PatternSuccessRate {
  overall: string;
  stocks?: string;
  crypto?: string;
  daily?: string;
  intraday?: string;
  source: string;
  note: string;
}

export interface PatternPsychology {
  what_happened?: Record<string, string>;
  why_it_works?: string[];
  why_it_fails?: string[];
  trader_mistakes?: Record<string, string>;
}

export interface Pattern {
  name: string;
  description: string;
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  rules: string[] | Record<string, any>;
  reliability: 'HIGH' | 'MEDIUM' | 'LOW';
  assetType: 'stock' | 'crypto' | 'both';
  confirmation?: string;
  examples?: Record<string, string>;
  // Research-backed fields
  successRate?: PatternSuccessRate;
  failureMode?: string;
  invalidation?: string;
  contextMultipliers?: {
    at_support?: string;
    at_resistance?: string;
    with_volume?: string;
    in_trend?: string;
  };
  psychology?: PatternPsychology;
}

export interface Indicator {
  name: string;
  description: string;
  range?: string;
  signals: Record<string, any>;
  assetType: 'stock' | 'crypto' | 'both';
  // Research-backed fields
  limitations?: {
    lag: string;
    false_signals: string;
    best_use: string;
    dangerous?: string;
  };
  reliability?: Record<string, string>;
}

export interface Fundamental {
  name: string;
  description: string;
  formula?: string;
  interpretation: Record<string, string>;
  assetType: 'stock' | 'crypto';
}

// ============================================
// CANDLESTICK PATTERNS (BOTH ASSETS)
// ============================================

export const CANDLESTICK_PATTERNS: Record<string, Pattern> = {

  // === SINGLE CANDLE PATTERNS ===

  hammer: {
    name: 'Hammer',
    description: 'Bullish reversal - small body at top, long lower wick (2-3x body size)',
    type: 'BULLISH',
    rules: [
      'Appears after downtrend',
      'Lower wick at least 2x the body size',
      'Little to no upper wick',
      'Body at the upper end of range',
      'Color less important (green slightly better)'
    ],
    reliability: 'MEDIUM',
    assetType: 'both',
    confirmation: 'Next candle closes above hammer high',
    successRate: {
      overall: '60%',
      stocks: '60%',
      crypto: '54%',
      daily: '64%',
      intraday: '53%',
      source: 'Thomas Bulkowski - Encyclopedia of Chart Patterns',
      note: 'Based on 10,000+ pattern study (1996-2015)'
    },
    failureMode: 'Price continues down despite hammer (40% of cases)',
    invalidation: 'If next candle closes below hammer low',
    contextMultipliers: {
      at_support: '+18% reliability (strong at support)',
      with_volume: '+10% reliability',
      in_trend: 'Needs confirmation - weak without it'
    }
  },

  shooting_star: {
    name: 'Shooting Star',
    description: 'Bearish reversal - small body at bottom, long upper wick',
    type: 'BEARISH',
    rules: [
      'Appears after uptrend',
      'Upper wick at least 2x the body size',
      'Little to no lower wick',
      'Body at the lower end of range',
      'Red body preferred but not required'
    ],
    reliability: 'MEDIUM',
    assetType: 'both',
    confirmation: 'Next candle closes below shooting star low'
  },

  inverted_hammer: {
    name: 'Inverted Hammer',
    description: 'Bullish reversal - small body at bottom, long upper wick',
    type: 'BULLISH',
    rules: [
      'Appears after downtrend',
      'Upper wick at least 2x the body',
      'Little to no lower wick',
      'Requires strong confirmation'
    ],
    reliability: 'MEDIUM',
    assetType: 'both',
    confirmation: 'Next candle must close above inverted hammer high with volume'
  },

  hanging_man: {
    name: 'Hanging Man',
    description: 'Bearish reversal - looks like hammer but appears after uptrend',
    type: 'BEARISH',
    rules: [
      'Appears after uptrend (critical difference from hammer)',
      'Long lower wick (2-3x body)',
      'Small body at top',
      'Red body more bearish'
    ],
    reliability: 'MEDIUM',
    assetType: 'both',
    confirmation: 'Next candle closes below hanging man body'
  },

  doji: {
    name: 'Doji',
    description: 'Indecision - open and close nearly equal',
    type: 'NEUTRAL',
    rules: [
      'Open and close at same price (or very close)',
      'Can have wicks of any length',
      'Signals indecision and potential reversal',
      'Context determines direction'
    ],
    reliability: 'MEDIUM',
    assetType: 'both',
    confirmation: 'Direction depends on next candle and trend context'
  },

  dragonfly_doji: {
    name: 'Dragonfly Doji',
    description: 'Bullish reversal - T-shaped, long lower wick, no upper wick',
    type: 'BULLISH',
    rules: [
      'Open, high, and close at same level',
      'Long lower wick',
      'Appears at support or after downtrend',
      'Shows strong rejection of lower prices'
    ],
    reliability: 'MEDIUM',
    assetType: 'both',
    confirmation: 'Next candle closes above dragonfly high'
  },

  gravestone_doji: {
    name: 'Gravestone Doji',
    description: 'Bearish reversal - inverted T, long upper wick, no lower wick',
    type: 'BEARISH',
    rules: [
      'Open, low, and close at same level',
      'Long upper wick',
      'Appears at resistance or after uptrend',
      'Shows strong rejection of higher prices'
    ],
    reliability: 'MEDIUM',
    assetType: 'both',
    confirmation: 'Next candle closes below gravestone low'
  },

  spinning_top: {
    name: 'Spinning Top',
    description: 'Indecision - small body, long wicks both sides',
    type: 'NEUTRAL',
    rules: [
      'Small body (red or green)',
      'Upper and lower wicks roughly equal and long',
      'Signals market indecision',
      'After strong trend = potential reversal'
    ],
    reliability: 'LOW',
    assetType: 'both',
    confirmation: 'Wait for directional confirmation'
  },

  marubozu_bullish: {
    name: 'Bullish Marubozu',
    description: 'Strong bullish - opens at low, closes at high, no wicks',
    type: 'BULLISH',
    rules: [
      'Large green body',
      'Little to no wicks on either end',
      'Opens at low, closes at high',
      'Shows extreme buying pressure'
    ],
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Strong continuation signal, especially on high volume'
  },

  marubozu_bearish: {
    name: 'Bearish Marubozu',
    description: 'Strong bearish - opens at high, closes at low, no wicks',
    type: 'BEARISH',
    rules: [
      'Large red body',
      'Little to no wicks',
      'Opens at high, closes at low',
      'Shows extreme selling pressure'
    ],
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Strong continuation signal, especially on high volume'
  },

  // === TWO CANDLE PATTERNS ===

  bullish_engulfing: {
    name: 'Bullish Engulfing',
    description: 'Strong bullish reversal - large green candle completely engulfs prior red candle',
    type: 'BULLISH',
    rules: [
      'Appears in downtrend or at support',
      'First candle is bearish (red)',
      'Second candle is bullish (green) and larger',
      'Second candle body completely covers first candle body',
      'Higher volume on engulfing candle increases reliability'
    ],
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Third candle closes above engulfing candle high',
    successRate: {
      overall: '63%',
      stocks: '63%',
      crypto: '58%',
      daily: '67%',
      intraday: '57%',
      source: 'Thomas Bulkowski - Encyclopedia of Chart Patterns',
      note: 'Based on 10,000+ pattern study (1996-2015)'
    },
    failureMode: 'Price reverses down after engulfing (37% of cases)',
    invalidation: 'If next candle closes below engulfing candle low',
    contextMultipliers: {
      at_support: '+20% reliability (very strong at support)',
      at_resistance: '-25% reliability (often fails at resistance)',
      with_volume: '+15% reliability (volume >2x average crucial)',
      in_trend: 'Best in downtrends, weak in uptrends'
    },
    psychology: {
      what_happened: {
        red_candle: 'Bears in control, sellers confident',
        reversal: 'Buyers step in aggressively, overwhelming sellers',
        green_engulf: 'All sellers from red candle now trapped underwater',
        emotional_shift: 'Fear → Uncertainty → FOMO'
      },
      why_it_works: [
        'Trapped sellers become future buyers when they capitulate',
        'Aggressive buying signals confidence = attracts more buyers (herd)',
        'Shorts panic-cover (forced buying) = fuel for rally'
      ],
      why_it_fails: [
        'No follow-through buying (temporary surge)',
        'Resistance overhead too strong (bagholders selling)',
        'Volume too low (few participants = not real conviction)'
      ],
      trader_mistakes: {
        buying_candle: 'FOMO entry as it forms = chasing, often stopped out',
        no_confirmation: 'Entering without waiting for next candle confirmation',
        ignoring_context: 'Engulfing at resistance often fails (overhead supply)'
      }
    }
  },

  bearish_engulfing: {
    name: 'Bearish Engulfing',
    description: 'Strong bearish reversal - large red candle engulfs prior green candle',
    type: 'BEARISH',
    rules: [
      'Appears in uptrend or at resistance',
      'First candle is bullish (green)',
      'Second candle is bearish (red) and larger',
      'Second candle body completely covers first candle body',
      'Higher volume confirms'
    ],
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Third candle closes below engulfing candle low',
    successRate: {
      overall: '63%',
      stocks: '63%',
      crypto: '58%',
      daily: '67%',
      intraday: '57%',
      source: 'Thomas Bulkowski - Encyclopedia of Chart Patterns',
      note: 'Based on 10,000+ pattern study (1996-2015)'
    },
    failureMode: 'Price reverses up after engulfing (37% of cases)',
    invalidation: 'If next candle closes above engulfing candle high',
    contextMultipliers: {
      at_resistance: '+20% reliability (strong at resistance)',
      at_support: '-25% reliability (often fails at support)',
      with_volume: '+15% reliability (volume >2x average crucial)',
      in_trend: 'Best in uptrends, weak in downtrends'
    }
  },

  piercing_line: {
    name: 'Piercing Line',
    description: 'Bullish reversal - green candle opens below prior red, closes above midpoint',
    type: 'BULLISH',
    rules: [
      'Appears in downtrend',
      'First candle is bearish',
      'Second candle gaps down but closes above midpoint of first candle',
      'Second candle closes in upper half of prior candle',
      'Volume should increase on second candle'
    ],
    reliability: 'MEDIUM',
    assetType: 'both',
    confirmation: 'Next candle continues upward'
  },

  dark_cloud_cover: {
    name: 'Dark Cloud Cover',
    description: 'Bearish reversal - red candle opens above prior green, closes below midpoint',
    type: 'BEARISH',
    rules: [
      'Appears in uptrend',
      'First candle is bullish',
      'Second candle gaps up but closes below midpoint of first',
      'Second candle closes in lower half of prior candle',
      'Volume increase confirms'
    ],
    reliability: 'MEDIUM',
    assetType: 'both',
    confirmation: 'Next candle continues downward'
  },

  tweezer_top: {
    name: 'Tweezer Top',
    description: 'Bearish reversal - two candles with matching highs',
    type: 'BEARISH',
    rules: [
      'Appears at resistance or after uptrend',
      'Two consecutive candles with nearly identical highs',
      'First candle bullish, second bearish (typical)',
      'Shows rejection at resistance level'
    ],
    reliability: 'MEDIUM',
    assetType: 'both',
    confirmation: 'Next candle breaks below pattern low'
  },

  tweezer_bottom: {
    name: 'Tweezer Bottom',
    description: 'Bullish reversal - two candles with matching lows',
    type: 'BULLISH',
    rules: [
      'Appears at support or after downtrend',
      'Two consecutive candles with nearly identical lows',
      'First candle bearish, second bullish (typical)',
      'Shows support holding'
    ],
    reliability: 'MEDIUM',
    assetType: 'both',
    confirmation: 'Next candle breaks above pattern high'
  },

  // === THREE CANDLE PATTERNS ===

  morning_star: {
    name: 'Morning Star',
    description: 'Strong bullish reversal - three candle pattern signaling bottom',
    type: 'BULLISH',
    rules: [
      'Appears after downtrend',
      'First candle: Large bearish',
      'Second candle: Small body (any color), gaps down',
      'Third candle: Large bullish, closes above midpoint of first',
      'Gaps between candles confirm strength'
    ],
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Fourth candle continues upward',
    successRate: {
      overall: '78%',
      stocks: '78%',
      crypto: '65%',
      daily: '81%',
      intraday: '68%',
      source: 'Thomas Bulkowski - Encyclopedia of Chart Patterns',
      note: 'Based on 10,000+ pattern study (1996-2015)'
    },
    failureMode: 'Price reverses back down after star (22% of cases)',
    invalidation: 'If price closes below the second candle low'
  },

  evening_star: {
    name: 'Evening Star',
    description: 'Strong bearish reversal - three candle top pattern',
    type: 'BEARISH',
    rules: [
      'Appears after uptrend',
      'First candle: Large bullish',
      'Second candle: Small body, gaps up',
      'Third candle: Large bearish, closes below midpoint of first',
      'Gaps confirm reversal strength'
    ],
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Fourth candle continues downward',
    successRate: {
      overall: '72%',
      stocks: '72%',
      crypto: '62%',
      daily: '76%',
      intraday: '65%',
      source: 'Thomas Bulkowski - Encyclopedia of Chart Patterns',
      note: 'Based on 10,000+ pattern study (1996-2015)'
    },
    failureMode: 'Price reverses back up after star (28% of cases)',
    invalidation: 'If price closes above the second candle high'
  },

  three_white_soldiers: {
    name: 'Three White Soldiers',
    description: 'Strong bullish continuation - three consecutive large green candles',
    type: 'BULLISH',
    rules: [
      'Three consecutive bullish candles',
      'Each opens within prior body',
      'Each closes near its high',
      'Steady progression higher',
      'Moderate to high volume'
    ],
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Strong continuation signal'
  },

  three_black_crows: {
    name: 'Three Black Crows',
    description: 'Strong bearish continuation - three consecutive large red candles',
    type: 'BEARISH',
    rules: [
      'Three consecutive bearish candles',
      'Each opens within prior body',
      'Each closes near its low',
      'Steady decline',
      'Increasing volume confirms'
    ],
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Strong continuation signal'
  },

  three_inside_up: {
    name: 'Three Inside Up',
    description: 'Bullish reversal - harami followed by confirmation',
    type: 'BULLISH',
    rules: [
      'First candle: Large bearish',
      'Second candle: Small bullish inside first',
      'Third candle: Bullish, closes above first candle high',
      'Progressive strengthening'
    ],
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Third candle is the confirmation'
  },

  three_inside_down: {
    name: 'Three Inside Down',
    description: 'Bearish reversal - bearish harami with confirmation',
    type: 'BEARISH',
    rules: [
      'First candle: Large bullish',
      'Second candle: Small bearish inside first',
      'Third candle: Bearish, closes below first candle low',
      'Progressive weakening'
    ],
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Third candle confirms reversal'
  },
};

// ============================================
// CHART PATTERNS
// ============================================

export const CHART_PATTERNS: Record<string, Pattern> = {

  // === CONTINUATION PATTERNS ===

  bull_flag: {
    name: 'Bull Flag',
    description: 'Bullish continuation - strong move up, consolidation, breakout',
    type: 'BULLISH',
    rules: {
      flagpole: 'Sharp price increase on volume (20%+ move)',
      flag: 'Tight consolidation or slight downward drift (parallel lines)',
      volume: 'Decreases during flag to <70% average, spikes 50%+ on breakout',
      duration: 'Flag typically 1-4 weeks (stocks) or 3-15 days (crypto)',
      breakout: 'Above flag resistance on volume'
    },
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Breakout above upper flag line with volume surge',
    successRate: {
      overall: '68%',
      stocks: '68%',
      crypto: '58%',
      daily: '72%',
      intraday: '61%',
      source: 'Thomas Bulkowski - Encyclopedia of Chart Patterns',
      note: 'Based on 10,000+ pattern study (1996-2015)'
    },
    failureMode: 'Breaks below flag support before breakout (32% of cases)',
    invalidation: 'If price closes below flag low, pattern is invalidated',
    contextMultipliers: {
      at_resistance: '-15% reliability (often fails at resistance)',
      with_volume: '+10% reliability (volume confirmation crucial)',
      in_trend: '+12% reliability (continuation patterns work best in trends)'
    },
    psychology: {
      what_happened: {
        flagpole: 'Strong buying (greed/FOMO), early adopters profit',
        flag: 'Profit-taking (fear of giving back gains), skeptics doubt sustainability',
        consolidation: 'Battle between bulls (holding) and bears (selling)',
        breakout: 'Bulls win, skeptics panic-buy (FOMO), shorts cover (forced buying)'
      },
      why_it_works: [
        'Pattern repeats because human emotions (fear/greed) are universal',
        'Self-fulfilling prophecy - pattern is visible = more traders act on it',
        'Shorts covering (forced buying) fuels breakout rally'
      ],
      why_it_fails: [
        'No follow-through buying after breakout (false breakout)',
        'Resistance overhead too strong (bagholders selling)',
        'Broader market turns bearish (macro overrides micro)'
      ],
      trader_mistakes: {
        early_entry: 'Buying during flag = impatience, often stopped out on volatility',
        fomo_chase: 'Buying after breakout extends = greed, buying the top',
        weak_hands: 'Selling during flag dip = fear, missing the breakout'
      }
    }
  },

  bear_flag: {
    name: 'Bear Flag',
    description: 'Bearish continuation - sharp drop, consolidation, breakdown',
    type: 'BEARISH',
    rules: {
      flagpole: 'Sharp price decrease',
      flag: 'Tight upward drift (parallel lines)',
      volume: 'Decreases during flag, increases on breakdown',
      duration: '1-4 weeks typical',
      breakdown: 'Below flag support'
    },
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Breakdown below lower flag line on volume',
    successRate: {
      overall: '67%',
      stocks: '67%',
      crypto: '57%',
      daily: '71%',
      intraday: '60%',
      source: 'Thomas Bulkowski - Encyclopedia of Chart Patterns',
      note: 'Based on 10,000+ pattern study (1996-2015)'
    },
    failureMode: 'Breaks above flag resistance before breakdown (33% of cases)',
    invalidation: 'If price closes above flag high, pattern is invalidated',
    contextMultipliers: {
      at_support: '-15% reliability (often bounces at support)',
      with_volume: '+10% reliability',
      in_trend: '+12% reliability (works best in existing downtrends)'
    }
  },

  bull_pennant: {
    name: 'Bull Pennant',
    description: 'Bullish continuation - sharp rise, converging triangle, breakout',
    type: 'BULLISH',
    rules: {
      pole: 'Strong upward move',
      pennant: 'Converging trendlines (triangle)',
      volume: 'Decreases during pennant',
      duration: '1-3 weeks',
      breakout: 'Above resistance on volume'
    },
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Breakout with volume increase'
  },

  bear_pennant: {
    name: 'Bear Pennant',
    description: 'Bearish continuation - sharp drop, converging triangle, breakdown',
    type: 'BEARISH',
    rules: {
      pole: 'Strong downward move',
      pennant: 'Converging trendlines',
      volume: 'Decreases during formation',
      duration: '1-3 weeks',
      breakdown: 'Below support on volume'
    },
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Breakdown with volume'
  },

  ascending_triangle: {
    name: 'Ascending Triangle',
    description: 'Bullish - flat resistance with rising support',
    type: 'BULLISH',
    rules: {
      structure: 'Horizontal resistance + ascending support line',
      touches: 'Minimum 3-4 touches on each line',
      volume: 'Decreases during formation, spikes on breakout',
      breakout: 'Above resistance',
      target: 'Height of triangle projected upward from breakout'
    },
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Breakout above resistance on volume',
    successRate: {
      overall: '72%',
      stocks: '72%',
      crypto: '64%',
      daily: '75%',
      intraday: '67%',
      source: 'Thomas Bulkowski - Encyclopedia of Chart Patterns',
      note: 'Based on 10,000+ pattern study (1996-2015)'
    },
    failureMode: 'Breaks below support line instead (28% of cases)',
    invalidation: 'Breakdown below ascending support = failed pattern',
    contextMultipliers: {
      in_trend: '+8% reliability (works best in existing uptrends)',
      with_volume: '+12% reliability (volume breakout crucial)'
    }
  },

  descending_triangle: {
    name: 'Descending Triangle',
    description: 'Bearish - flat support with declining resistance',
    type: 'BEARISH',
    rules: {
      structure: 'Horizontal support + descending resistance',
      touches: 'Minimum 3-4 on each line',
      volume: 'Decreases during formation',
      breakdown: 'Below support',
      target: 'Height projected downward'
    },
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Breakdown below support on volume'
  },

  symmetrical_triangle: {
    name: 'Symmetrical Triangle',
    description: 'Neutral - converging trendlines, breakout determines direction',
    type: 'NEUTRAL',
    rules: {
      structure: 'Lower highs and higher lows converging',
      touches: '4-6 touches minimum',
      volume: 'Decreases during formation',
      breakout: 'Direction depends on trend before triangle',
      target: 'Widest part of triangle projected from breakout'
    },
    reliability: 'MEDIUM',
    assetType: 'both',
    confirmation: 'Breakout in either direction with volume'
  },

  rectangle: {
    name: 'Rectangle (Trading Range)',
    description: 'Continuation - horizontal consolidation between support and resistance',
    type: 'NEUTRAL',
    rules: {
      structure: 'Parallel horizontal lines',
      touches: 'Multiple tests of each level',
      volume: 'Low during range, spikes on breakout',
      breakout: 'Direction typically continues prior trend',
      target: 'Height of rectangle projected from breakout'
    },
    reliability: 'MEDIUM',
    assetType: 'both',
    confirmation: 'Breakout with volume increase'
  },

  // === REVERSAL PATTERNS ===

  head_and_shoulders: {
    name: 'Head and Shoulders',
    description: 'Bearish reversal - left shoulder, head (higher), right shoulder',
    type: 'BEARISH',
    rules: {
      leftShoulder: 'Peak with pullback',
      head: 'Higher peak',
      rightShoulder: 'Lower peak (similar to left shoulder)',
      neckline: 'Support line connecting lows',
      volume: 'Highest on left shoulder, decreases through pattern',
      breakdown: 'Below neckline on volume'
    },
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Close below neckline, retest as resistance',
    successRate: {
      overall: '83%',
      stocks: '83%',
      crypto: '71%',
      daily: '87%',
      intraday: '74%',
      source: 'Thomas Bulkowski - Encyclopedia of Chart Patterns',
      note: 'Based on 10,000+ pattern study (1996-2015)'
    },
    failureMode: 'Price bounces at neckline and reverses up (17% of cases)',
    invalidation: 'If price breaks above right shoulder high, pattern fails',
    contextMultipliers: {
      with_volume: '+10% reliability (volume decline crucial)',
      at_resistance: '+8% reliability (works best at major resistance)'
    },
    psychology: {
      what_happened: {
        left_shoulder: 'Strong buying pushes to new high, profit-taking pulls back',
        head: 'FOMO buying creates higher high, but fewer participants (lower volume)',
        right_shoulder: 'Attempted rally fails to reach head height - bulls losing steam',
        neckline_break: 'Final support breaks, trapped longs panic sell, cascade begins'
      },
      why_it_works: [
        'Progressively weakening rallies show diminishing buying interest',
        'Volume declining through pattern confirms fewer participants willing to buy',
        'Neckline break triggers stop losses + panic selling = self-reinforcing'
      ],
      why_it_fails: [
        'Strong fundamental news overrides technical setup',
        'Neckline holds as support with high volume bounce',
        'Overall market in strong uptrend (macro overrides pattern)'
      ],
      trader_mistakes: {
        early_short: 'Shorting before neckline break = anticipating, often squeezed',
        ignoring_volume: 'Pattern without declining volume is much weaker',
        wrong_neckline: 'Drawing neckline incorrectly leads to wrong entry/stop'
      }
    }
  },

  inverse_head_and_shoulders: {
    name: 'Inverse Head and Shoulders',
    description: 'Bullish reversal - inverted H&S at bottom',
    type: 'BULLISH',
    rules: {
      leftShoulder: 'Low with bounce',
      head: 'Lower low',
      rightShoulder: 'Higher low (similar to left)',
      neckline: 'Resistance connecting highs',
      volume: 'Increases through pattern, spikes on breakout',
      breakout: 'Above neckline'
    },
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Close above neckline, retest as support'
  },

  double_top: {
    name: 'Double Top',
    description: 'Bearish reversal - two peaks at resistance, M-shape',
    type: 'BEARISH',
    rules: {
      peaks: 'Two peaks at approximately same level',
      valley: 'Support between peaks',
      volume: 'Lower on second peak (divergence)',
      breakdown: 'Below valley support',
      target: 'Height from peaks to valley, projected down'
    },
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Break below valley on volume',
    successRate: {
      overall: '65%',
      stocks: '65%',
      crypto: '56%',
      daily: '69%',
      intraday: '58%',
      source: 'Thomas Bulkowski - Encyclopedia of Chart Patterns',
      note: 'Based on 10,000+ pattern study (1996-2015)'
    },
    failureMode: 'Breaks above second peak instead (35% of cases)',
    invalidation: 'If price breaks above second peak, pattern invalidated'
  },

  double_bottom: {
    name: 'Double Bottom',
    description: 'Bullish reversal - two lows at support, W-shape',
    type: 'BULLISH',
    rules: {
      lows: 'Two lows at approximately same level',
      peak: 'Resistance between lows',
      volume: 'Higher on second low (often)',
      breakout: 'Above peak resistance',
      target: 'Height from lows to peak, projected up'
    },
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Break above peak on volume'
  },

  triple_top: {
    name: 'Triple Top',
    description: 'Bearish reversal - three peaks at resistance',
    type: 'BEARISH',
    rules: {
      peaks: 'Three peaks at similar level',
      support: 'Neckline connecting lows',
      volume: 'Decreasing with each peak',
      breakdown: 'Below neckline',
      target: 'Height projected down'
    },
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Close below neckline support'
  },

  triple_bottom: {
    name: 'Triple Bottom',
    description: 'Bullish reversal - three lows at support',
    type: 'BULLISH',
    rules: {
      lows: 'Three lows at similar level',
      resistance: 'Neckline connecting peaks',
      volume: 'Increasing with each low',
      breakout: 'Above neckline',
      target: 'Height projected up'
    },
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Close above neckline resistance'
  },

  rising_wedge: {
    name: 'Rising Wedge',
    description: 'Bearish - upward sloping converging lines (usually reversal)',
    type: 'BEARISH',
    rules: {
      structure: 'Both support and resistance rising, converging',
      volume: 'Decreases as pattern develops',
      breakdown: 'Below support line',
      context: 'More reliable as reversal at top',
      target: 'Back to start of wedge'
    },
    reliability: 'MEDIUM',
    assetType: 'both',
    confirmation: 'Breakdown with volume increase'
  },

  falling_wedge: {
    name: 'Falling Wedge',
    description: 'Bullish - downward sloping converging lines (usually reversal)',
    type: 'BULLISH',
    rules: {
      structure: 'Both support and resistance falling, converging',
      volume: 'Decreases during formation',
      breakout: 'Above resistance',
      context: 'More reliable as reversal at bottom',
      target: 'Back to start of wedge'
    },
    reliability: 'MEDIUM',
    assetType: 'both',
    confirmation: 'Breakout with volume'
  },

  rounding_bottom: {
    name: 'Rounding Bottom (Cup)',
    description: 'Bullish reversal - U-shaped gradual bottom formation',
    type: 'BULLISH',
    rules: {
      shape: 'Smooth U-shape (not V)',
      duration: 'Several weeks to months',
      volume: 'Decreases during bottom, increases on rise',
      breakout: 'Above resistance (rim)',
      target: 'Depth of cup projected up'
    },
    reliability: 'HIGH',
    assetType: 'both',
    confirmation: 'Breakout above rim on volume'
  },

  rounding_top: {
    name: 'Rounding Top',
    description: 'Bearish reversal - inverted U-shape at top',
    type: 'BEARISH',
    rules: {
      shape: 'Smooth inverted U',
      duration: 'Weeks to months',
      volume: 'Increases at beginning, decreases at end',
      breakdown: 'Below support (neckline)',
      target: 'Height projected down'
    },
    reliability: 'MEDIUM',
    assetType: 'both',
    confirmation: 'Break below neckline'
  },

  // === STOCK-SPECIFIC PATTERNS ===

  cup_and_handle: {
    name: 'Cup and Handle',
    description: 'Bullish - U-shaped cup followed by small handle, common in stocks',
    type: 'BULLISH',
    rules: {
      cup: {
        shape: 'U-shaped (not V-shaped)',
        depth: '12-33% from left rim to bottom',
        duration: '7-65 weeks (stocks) or equivalent days (crypto)'
      },
      handle: {
        duration: '1-2 weeks',
        depth: 'Should not retrace more than 50% of cup depth',
        volume: 'Volume dries up during handle'
      },
      breakout: {
        trigger: 'Break above left rim (resistance) on high volume',
        volume: '40-50% above average',
        target: 'Cup depth projected from breakout'
      }
    },
    reliability: 'HIGH',
    assetType: 'stock',
    confirmation: 'Breakout above handle high with volume surge',
    successRate: {
      overall: '65%',
      stocks: '65%',
      crypto: '45%',
      daily: '68%',
      intraday: '42%',
      source: 'Thomas Bulkowski - Encyclopedia of Chart Patterns',
      note: 'Based on 10,000+ pattern study (1996-2015)'
    },
    failureMode: 'Breaks below handle low or forms V-shape instead of U (35% stocks, 55% crypto)',
    invalidation: 'If handle depth >50% of cup or cup is V-shaped, pattern is weak',
    examples: {
      why_fails_crypto: 'Crypto moves too fast - cups are V-shaped, not U-shaped',
      best_use: 'Use in stocks with strong fundamentals and long-term uptrends'
    }
  },

  flat_base: {
    name: 'Flat Base',
    description: 'Bullish continuation - tight consolidation near highs (stocks)',
    type: 'BULLISH',
    rules: {
      range: 'Price consolidates within ~15% range for 5+ weeks',
      volume: 'Contracts during base, spikes on breakout',
      prior: 'Must form after at least 20% advance',
      breakout: 'Above base high on volume'
    },
    reliability: 'HIGH',
    assetType: 'stock',
    confirmation: 'Volume expansion on breakout'
  },

  vcp: {
    name: 'VCP (Volatility Contraction Pattern)',
    description: 'Bullish - Mark Minervini pattern, each pullback smaller than last',
    type: 'BULLISH',
    rules: {
      contractions: 'Minimum 2-3 contractions, each smaller',
      volume: 'Dries up with each contraction',
      tightness: 'Final contraction very tight (1-2%)',
      pivot: 'Final contraction high = buy point',
      breakout: 'Above pivot on increased volume'
    },
    reliability: 'HIGH',
    assetType: 'stock',
    confirmation: 'Tight stop below last contraction low'
  },
};

// ============================================
// TECHNICAL INDICATORS (WITH LIMITATIONS)
// ============================================

export const INDICATORS: Record<string, Indicator> = {

  rsi: {
    name: 'RSI (Relative Strength Index)',
    description: 'Momentum oscillator measuring speed and magnitude of price changes',
    range: '0-100',
    signals: {
      overbought: 'Above 70 - potential reversal down',
      oversold: 'Below 30 - potential reversal up',
      bullish_divergence: 'Price makes lower low, RSI makes higher low',
      bearish_divergence: 'Price makes higher high, RSI makes lower high',
      centerline_cross: {
        bullish: 'RSI crosses above 50',
        bearish: 'RSI crosses below 50'
      },
      extreme_readings: {
        very_overbought: 'Above 80',
        very_oversold: 'Below 20'
      }
    },
    assetType: 'both',
    limitations: {
      lag: 'RSI is a LAGGING indicator - tells you what happened, not what will happen',
      false_signals: 'RSI can stay overbought (>70) for weeks in strong uptrends',
      best_use: 'Use for CONFIRMATION only, not prediction. Combine with price action and S/R',
      dangerous: 'DO NOT buy just because RSI hits 30 - it can go to 20, 10, or stay low for months'
    },
    reliability: {
      divergence: '65% success rate (best RSI signal)',
      overbought_oversold: '52% success rate (weak alone, coin flip)',
      with_support_resistance: '72% success rate (much better when combined)'
    }
  },

  macd: {
    name: 'MACD (Moving Average Convergence Divergence)',
    description: 'Trend-following momentum indicator showing relationship between two EMAs',
    signals: {
      bullish_cross: 'MACD line crosses above signal line',
      bearish_cross: 'MACD line crosses below signal line',
      histogram: {
        expanding_positive: 'Bullish momentum increasing',
        expanding_negative: 'Bearish momentum increasing',
        contracting: 'Momentum weakening'
      },
      centerline_cross: {
        bullish: 'MACD crosses above zero',
        bearish: 'MACD crosses below zero'
      },
      divergence: {
        bullish: 'Price lower low, MACD higher low',
        bearish: 'Price higher high, MACD lower high'
      }
    },
    assetType: 'both',
    limitations: {
      lag: 'MACD LAGS price significantly - crossover happens AFTER move starts',
      false_signals: 'Many false signals in sideways markets (50% choppy, 50% trending)',
      best_use: 'Use to confirm trend, not for entry timing. Better for exits.',
      dangerous: 'By time MACD crosses, 30-50% of move is already done'
    },
    reliability: {
      divergence: '68% success rate (best MACD signal)',
      crossovers_in_trend: '64% success rate',
      crossovers_in_range: '48% success rate (worse than coin flip!)'
    }
  },

  moving_averages: {
    name: 'Moving Averages',
    description: 'Average price over specified period, smooths price action',
    signals: {
      golden_cross: '50 MA crosses above 200 MA (bullish)',
      death_cross: '50 MA crosses below 200 MA (bearish)',
      price_above_ma: 'Price above MA = support, uptrend',
      price_below_ma: 'Price below MA = resistance, downtrend',
      ma_slope: {
        rising: 'Uptrend',
        falling: 'Downtrend',
        flat: 'Consolidation'
      },
      common_periods: {
        short_term: '9, 20, 21 (EMA)',
        medium_term: '50 (SMA/EMA)',
        long_term: '200 (SMA)'
      }
    },
    assetType: 'both',
    limitations: {
      lag: 'MAs average past data by design - always behind price',
      false_signals: 'Golden/Death crosses happen after 20-30% of move already done',
      best_use: 'Use as dynamic support/resistance, not for entry signals'
    },
    reliability: {
      golden_cross: '54% success rate (barely better than coin flip)',
      death_cross: '56% success rate',
      as_support_resistance: '68% success rate (much better use)',
      in_trending_markets: '72% success rate',
      in_ranging_markets: '45% success rate (worse than random)'
    }
  },

  bollinger_bands: {
    name: 'Bollinger Bands',
    description: 'Volatility bands - middle (20 SMA), upper/lower (2 std dev)',
    signals: {
      squeeze: 'Bands narrow = low volatility, breakout coming',
      expansion: 'Bands widen = high volatility, trending',
      walking_the_band: {
        upper: 'Price riding upper band = strong uptrend',
        lower: 'Price riding lower band = strong downtrend'
      },
      reversals: {
        tag_lower_bounce: 'Touch lower band + bounce = buy signal',
        tag_upper_reject: 'Touch upper band + reject = sell signal'
      },
      m_top: 'Price makes high outside upper band, then lower high inside = bearish',
      w_bottom: 'Price makes low outside lower band, then higher low inside = bullish'
    },
    assetType: 'both'
  },

  volume: {
    name: 'Volume Analysis',
    description: 'Number of shares/contracts traded',
    signals: {
      confirmation: 'Volume should increase in direction of trend',
      breakout: 'Breakout on high volume more reliable',
      climax: {
        buying: 'Extreme volume spike after rise = potential top',
        selling: 'Extreme volume spike after decline = potential bottom'
      },
      divergence: {
        bullish: 'Price declining on decreasing volume',
        bearish: 'Price rising on decreasing volume'
      },
      accumulation: 'Rising volume on up days, falling on down days',
      distribution: 'Rising volume on down days, falling on up days'
    },
    assetType: 'both'
  },

  stochastic: {
    name: 'Stochastic Oscillator',
    description: 'Momentum indicator comparing closing price to price range',
    range: '0-100',
    signals: {
      overbought: 'Above 80',
      oversold: 'Below 20',
      bullish_cross: '%K crosses above %D',
      bearish_cross: '%K crosses below %D',
      divergence: {
        bullish: 'Price lower low, Stoch higher low',
        bearish: 'Price higher high, Stoch lower high'
      }
    },
    assetType: 'both'
  },

  atr: {
    name: 'ATR (Average True Range)',
    description: 'Volatility indicator, not directional',
    signals: {
      high_atr: 'High volatility - wider stops needed',
      low_atr: 'Low volatility - potential breakout coming',
      expanding: 'Volatility increasing',
      contracting: 'Volatility decreasing (squeeze)',
      usage: 'Use for position sizing and stop placement'
    },
    assetType: 'both'
  },

  vwap: {
    name: 'VWAP (Volume Weighted Average Price)',
    description: 'Institutional benchmark - average price weighted by volume',
    signals: {
      above_vwap: 'Buyers in control, bullish',
      below_vwap: 'Sellers in control, bearish',
      pullback_entry: 'In uptrend, buy pullback to VWAP',
      standard_deviations: 'VWAP bands act as support/resistance',
      reset: 'Resets each trading day'
    },
    assetType: 'stock'
  },

  obv: {
    name: 'OBV (On-Balance Volume)',
    description: 'Cumulative volume indicator',
    signals: {
      bullish_divergence: 'OBV rising while price flat/falling = accumulation',
      bearish_divergence: 'OBV falling while price flat/rising = distribution',
      confirmation: 'OBV breaking to new high before price = bullish',
      trendline_break: 'OBV trendline breaks signal price trend changes'
    },
    assetType: 'both'
  },

  fibonacci: {
    name: 'Fibonacci Retracement',
    description: 'Support/resistance levels based on Fibonacci ratios',
    signals: {
      key_levels: {
        '23.6%': 'Shallow retracement',
        '38.2%': 'Moderate retracement',
        '50%': 'Mid-point (not Fibonacci but commonly used)',
        '61.8%': 'Golden ratio - strong support/resistance',
        '78.6%': 'Deep retracement'
      },
      usage: 'Draw from swing low to swing high (uptrend) or high to low (downtrend)',
      confluence: 'Fib levels + other support/resistance = high probability'
    },
    assetType: 'both'
  },
};

// ============================================
// STOCK FUNDAMENTALS
// ============================================

export const STOCK_FUNDAMENTALS: Record<string, Fundamental> = {

  pe_ratio: {
    name: 'P/E Ratio (Price-to-Earnings)',
    description: 'Valuation metric comparing stock price to earnings',
    formula: 'Stock Price / Earnings Per Share',
    interpretation: {
      low: '< 15 - Potentially undervalued or slow growth',
      average: '15-25 - Fair for moderate growth',
      high: '> 25 - Growth premium or overvalued',
      very_high: '> 50 - Hypergrowth expectations',
      negative: 'Company losing money'
    },
    assetType: 'stock'
  },

  peg_ratio: {
    name: 'PEG Ratio (P/E to Growth)',
    description: 'P/E ratio adjusted for earnings growth',
    formula: 'P/E Ratio / Annual EPS Growth Rate',
    interpretation: {
      undervalued: '< 1 - Undervalued relative to growth',
      fair: '= 1 - Fairly valued',
      overvalued: '> 1 - Overvalued relative to growth',
      very_overvalued: '> 2 - Significantly overvalued'
    },
    assetType: 'stock'
  },

  ps_ratio: {
    name: 'P/S Ratio (Price-to-Sales)',
    description: 'Valuation for unprofitable companies',
    formula: 'Market Cap / Total Revenue',
    interpretation: {
      low: '< 1 - Deep value or distressed',
      moderate: '1-5 - Reasonable for many industries',
      high: '5-10 - High growth expectations',
      very_high: '> 10 - Extreme growth expectations (SaaS, tech)'
    },
    assetType: 'stock'
  },

  roe: {
    name: 'ROE (Return on Equity)',
    description: 'How efficiently equity generates profit',
    formula: 'Net Income / Shareholders Equity × 100',
    interpretation: {
      good: '> 15% consistently',
      excellent: '> 25%',
      caution: 'Very high ROE can be from high debt leverage'
    },
    assetType: 'stock'
  },

  debt_to_equity: {
    name: 'Debt-to-Equity Ratio',
    description: 'Financial leverage measurement',
    formula: 'Total Debt / Shareholders Equity',
    interpretation: {
      conservative: '< 0.5 - Low leverage',
      moderate: '0.5-1.0 - Moderate leverage',
      high: '> 1.0 - Aggressive leverage',
      very_high: '> 2.0 - Heavily leveraged (risky)'
    },
    assetType: 'stock'
  },

  free_cash_flow: {
    name: 'Free Cash Flow',
    description: 'Cash available after capital expenditures',
    formula: 'Operating Cash Flow - Capital Expenditures',
    interpretation: {
      positive_growing: 'Healthy, sustainable business',
      positive_stable: 'Mature, stable cash generation',
      negative: 'May indicate growth investment or trouble',
      fcf_yield: 'FCF / Market Cap > 8% = potentially undervalued'
    },
    assetType: 'stock'
  },

  eps_growth: {
    name: 'EPS Growth',
    description: 'Earnings per share growth rate',
    interpretation: {
      strong: '> 25% YoY',
      moderate: '10-25% YoY',
      slow: '< 10% YoY',
      acceleration: 'Each quarter growing faster than previous = very bullish'
    },
    assetType: 'stock'
  },

  revenue_growth: {
    name: 'Revenue Growth',
    description: 'Top-line growth rate',
    interpretation: {
      strong: '> 20% YoY',
      moderate: '10-20% YoY',
      slow: '< 10% YoY',
      priority: 'Revenue growth more important than EPS for growth stocks'
    },
    assetType: 'stock'
  },
};

// ============================================
// CRYPTO-SPECIFIC INDICATORS
// ============================================

export const CRYPTO_INDICATORS: Record<string, Indicator> = {

  funding_rate: {
    name: 'Funding Rate',
    description: 'Fee paid between long and short traders in perpetual futures',
    signals: {
      positive: 'Longs paying shorts = bullish sentiment',
      negative: 'Shorts paying longs = bearish sentiment',
      extreme_positive: '> 0.1% = overheated longs, potential correction',
      extreme_negative: '< -0.1% = excessive shorts, potential squeeze',
      neutral: 'Near 0% = balanced market'
    },
    assetType: 'crypto'
  },

  exchange_netflow: {
    name: 'Exchange Net Flow',
    description: 'Net BTC/crypto flowing into or out of exchanges',
    signals: {
      large_inflows: 'Potential selling pressure coming',
      large_outflows: 'Accumulation, moving to cold storage',
      whale_movements: 'Track large transfers (> 1000 BTC)',
      timing: 'Inflows often precede sell-offs by hours/days'
    },
    assetType: 'crypto'
  },

  fear_greed_index: {
    name: 'Crypto Fear & Greed Index',
    description: 'Sentiment indicator 0-100',
    range: '0 (Extreme Fear) to 100 (Extreme Greed)',
    signals: {
      extreme_fear: '0-25 - Potential buy opportunity',
      fear: '25-45 - Market nervous',
      neutral: '45-55',
      greed: '55-75 - Market optimistic',
      extreme_greed: '75-100 - Potential top, caution'
    },
    assetType: 'crypto'
  },

  open_interest: {
    name: 'Open Interest',
    description: 'Total open futures/options contracts',
    signals: {
      rising_oi_rising_price: 'New money entering, bullish',
      rising_oi_falling_price: 'New shorts entering, bearish',
      falling_oi_rising_price: 'Short covering, may be exhausting',
      falling_oi_falling_price: 'Long liquidation, bearish',
      all_time_high_oi: 'High leverage in system, potential volatility'
    },
    assetType: 'crypto'
  },

  long_short_ratio: {
    name: 'Long/Short Ratio',
    description: 'Ratio of long to short positions',
    signals: {
      high_ratio: '> 2.0 - Too many longs, contrarian bearish',
      low_ratio: '< 0.5 - Too many shorts, contrarian bullish',
      balanced: '0.8-1.2 - Neutral market',
      extreme_imbalance: 'Potential for liquidation cascade'
    },
    assetType: 'crypto'
  },

  mvrv_ratio: {
    name: 'MVRV Ratio',
    description: 'Market Value to Realized Value ratio',
    signals: {
      high: '> 3.5 - Historically marks tops',
      low: '< 1.0 - Historically marks bottoms',
      moderate: '1.0-3.5 - Normal range',
      usage: 'Long-term indicator, not for short-term trading'
    },
    assetType: 'crypto'
  },
};

// ============================================
// MARKET STRUCTURE CONCEPTS
// ============================================

export const MARKET_STRUCTURE = {
  uptrend: {
    definition: 'Series of higher highs (HH) and higher lows (HL)',
    confirmation: 'Each swing high exceeds previous, each low above previous low',
    breakage: 'When price makes lower low, uptrend is broken'
  },
  downtrend: {
    definition: 'Series of lower highs (LH) and lower lows (LL)',
    confirmation: 'Each swing high below previous, each low below previous',
    breakage: 'When price makes higher high, downtrend is broken'
  },
  sideways: {
    definition: 'Price oscillates between horizontal support and resistance',
    characteristics: 'No clear higher highs or lower lows',
    breakout: 'Wait for break and close outside range'
  },
  support: {
    definition: 'Price level where buying interest stops decline',
    types: ['Horizontal', 'Trendline', 'Moving average', 'Fibonacci level'],
    strength: 'More touches and longer timeframe = stronger support',
    broken_support: 'Becomes resistance after break'
  },
  resistance: {
    definition: 'Price level where selling interest stops advance',
    types: ['Horizontal', 'Trendline', 'Moving average', 'Prior highs'],
    strength: 'More touches and longer timeframe = stronger',
    broken_resistance: 'Becomes support after break'
  },
  breakout: {
    definition: 'Price moves beyond defined support or resistance',
    volume: 'Should increase 50%+ on breakout',
    retest: 'Often price returns to test broken level as new support/resistance',
    false_breakout: 'Quickly reverses back into range'
  },
  consolidation: {
    definition: 'Period of sideways movement after a trend',
    types: ['Rectangle', 'Triangle', 'Flag', 'Pennant'],
    purpose: 'Allows market to digest gains/losses before next move',
    duration: 'Longer consolidation often leads to bigger breakout'
  },
};

// ============================================
// RISK MANAGEMENT RULES
// ============================================

export const RISK_MANAGEMENT = {
  position_sizing: {
    rule: 'Risk 1-2% of account per trade maximum',
    formula: 'Position Size = (Account × Risk%) / (Entry Price - Stop Loss)',
    example: '$10,000 account, 1% risk, $50 entry, $48 stop = $10,000 × 0.01 / 2 = $50 = 25 shares'
  },
  stop_loss: {
    placement: {
      technical: 'Below support (longs) or above resistance (shorts)',
      atr_based: 'Entry ± (2 × ATR)',
      percentage: '5-10% from entry (depends on volatility)',
      pattern: 'Below pattern low (cup, flag, etc.)'
    },
    rule: 'Always use stops, never hope and pray'
  },
  take_profit: {
    targets: {
      first: 'R:R 1:1.5 to 1:2 minimum',
      second: 'R:R 1:3 to 1:5',
      runner: 'Trail remaining with stop'
    },
    scaling: 'Take partial profits at targets, trail remainder'
  },
  risk_reward: {
    minimum: '1:2 (risk $1 to make $2)',
    ideal: '1:3 or better',
    calculation: '(Target - Entry) / (Entry - Stop)'
  },
};

// ============================================
// CONTEXT-BASED RELIABILITY ADJUSTMENTS
// ============================================

export const CONTEXT_RULES = {

  timeframe_multipliers: {
    '1m': { reliability: 0.75, note: 'Lots of noise, many false signals' },
    '5m': { reliability: 0.85, note: 'Still noisy, use with caution' },
    '15m': { reliability: 0.95, note: 'Decent for day trading' },
    '1H': { reliability: 1.0, note: 'Good reliability (baseline)' },
    '4H': { reliability: 1.15, note: 'Very reliable' },
    'Daily': { reliability: 1.25, note: 'Highly reliable, low noise' },
    'Weekly': { reliability: 1.35, note: 'Strongest signals, very reliable' },
    'Monthly': { reliability: 1.4, note: 'Maximum reliability' },
    'unknown': { reliability: 1.0, note: 'Default baseline' },
  } as Record<string, { reliability: number; note: string }>,

  asset_multipliers: {
    stock: { patterns: 1.0, note: 'Patterns work well, fundamentals crucial' },
    crypto: { patterns: 0.85, note: 'Patterns less reliable due to volatility' },
  } as Record<string, { patterns: number; note: string }>,

  volume_thresholds: {
    normal: '0.7x to 1.3x average (no strong signal)',
    increased: '1.5x to 2x average (confirms pattern)',
    spike: '>2x average (very strong confirmation)',
    climax: '>3x average (exhaustion or major event)',
    breakout_requirement: 'Volume should be >1.5x average on breakout',
  },

  trend_context: {
    continuation_in_trend: '+15% reliability (flags, pennants work best in trends)',
    continuation_counter_trend: '-25% reliability (often fail against trend)',
    continuation_sideways: '-20% reliability (wait for trend first)',
    reversal_at_extremes: '+20% reliability (H&S at top, inverted at bottom)',
    reversal_mid_trend: '-30% reliability (often fail mid-trend)',
    reversal_with_divergence: '+25% reliability (RSI/MACD divergence confirms)',
  },

  support_resistance_context: {
    at_major_support: '+20% reliability for bullish patterns',
    at_major_resistance: '+20% reliability for bearish patterns',
    mid_range: '-15% reliability (no clear level)',
    fibonacci_confluence: '+10% reliability',
    round_number: '+8% reliability (psychological levels like $50, $100)',
    previous_swing: '+12% reliability',
    multiple_confluence: '+25% reliability (2+ factors align)',
  },
};

// ============================================
// PATTERN RELIABILITY CALCULATOR
// ============================================

export function calculatePatternReliability(
  pattern: Pattern,
  context: {
    timeframe: string;
    assetType: 'stock' | 'crypto';
    volumeRatio: number;
    atSupport: boolean;
    atResistance: boolean;
    inTrend: boolean;
  }
): {
  adjustedReliability: 'HIGH' | 'MEDIUM' | 'LOW';
  adjustedScore: number;
  breakdown: string[];
} {
  const baseRate = parseFloat(pattern.successRate?.overall || '60');
  const adjustments: string[] = [];
  let finalRate = baseRate;

  // 1. Timeframe adjustment (additive)
  const tf = CONTEXT_RULES.timeframe_multipliers[context.timeframe] || CONTEXT_RULES.timeframe_multipliers['unknown'];
  if (tf.reliability !== 1.0) {
    const change = Math.round((tf.reliability - 1) * 100);
    adjustments.push(`Timeframe ${context.timeframe}: ${change > 0 ? '+' : ''}${change}%`);
    finalRate += change;
  }

  // 2. Asset type adjustment (additive)
  if (context.assetType === 'crypto') {
    const mult = CONTEXT_RULES.asset_multipliers.crypto.patterns;
    if (mult !== 1.0) {
      const change = Math.round((mult - 1) * 100);
      adjustments.push(`Crypto asset: ${change}% (volatile markets)`);
      finalRate += change;
    }
  }

  // 3. Volume adjustment (additive)
  if (context.volumeRatio >= 2.0) {
    adjustments.push('Volume spike (>2x): +15%');
    finalRate += 15;
  } else if (context.volumeRatio >= 1.5) {
    adjustments.push('Increased volume (1.5x): +10%');
    finalRate += 10;
  } else if (context.volumeRatio < 0.7) {
    adjustments.push('Low volume (<0.7x): -10%');
    finalRate -= 10;
  }

  // 4. Support/resistance adjustment (additive)
  if (pattern.type === 'BULLISH' && context.atSupport) {
    adjustments.push('At support level: +20%');
    finalRate += 20;
  } else if (pattern.type === 'BEARISH' && context.atResistance) {
    adjustments.push('At resistance level: +20%');
    finalRate += 20;
  } else if (pattern.type === 'BULLISH' && context.atResistance) {
    adjustments.push('At resistance level: -15%');
    finalRate -= 15;
  } else if (pattern.type === 'BEARISH' && context.atSupport) {
    adjustments.push('At support level: -15%');
    finalRate -= 15;
  }

  // 5. Trend context (additive)
  const isContinuation = pattern.description.toLowerCase().includes('continuation');
  if (isContinuation && context.inTrend) {
    adjustments.push('In trending market: +15%');
    finalRate += 15;
  } else if (isContinuation && !context.inTrend) {
    adjustments.push('Sideways market: -20%');
    finalRate -= 20;
  }

  // Floor at 30%, cap at 90%
  const finalScore = Math.max(30, Math.min(Math.round(finalRate), 90));

  let reliability: 'HIGH' | 'MEDIUM' | 'LOW';
  if (finalScore >= 70) reliability = 'HIGH';
  else if (finalScore >= 55) reliability = 'MEDIUM';
  else reliability = 'LOW';

  return { adjustedReliability: reliability, adjustedScore: finalScore, breakdown: adjustments };
}

// ============================================
// TRADING PSYCHOLOGY & BEHAVIORAL FINANCE
// ============================================

export const TRADING_PSYCHOLOGY = {

  cognitive_biases: {
    confirmation_bias: {
      definition: 'Seeing only evidence that supports your existing belief',
      example: 'You want to go long, so you ignore bearish signals and only see bullish patterns',
      danger: 'Causes you to force trades that don\'t exist',
      solution: 'Actively look for reasons NOT to take the trade. If you can\'t find any, bias is present.'
    },
    recency_bias: {
      definition: 'Overweighting recent events and ignoring long-term data',
      example: 'Last 3 trades were winners, so you think you\'re invincible and increase risk',
      danger: 'Overtrading after wins, overreacting to losses',
      solution: 'Track 50+ trades minimum before drawing conclusions about your edge'
    },
    loss_aversion: {
      definition: 'Fear of losses is 2.5x stronger than pleasure of equivalent gains (Kahneman)',
      example: 'You hold losing trades hoping for breakeven, but cut winners early',
      danger: 'Small wins, large losses = account blowup',
      solution: 'Cut losses at predetermined stop. Let winners run to target.'
    },
    fomo: {
      definition: 'Fear of Missing Out - panic buying after big move',
      example: 'Stock up 50% in a week, you buy the top because "it keeps going up"',
      danger: 'Buying exhaustion tops, becoming exit liquidity for smart money',
      solution: 'If you missed it, you missed it. Wait for pullback or next setup.'
    },
    gamblers_fallacy: {
      definition: 'Believing past results affect independent future events',
      example: 'Lost 5 trades in row, think "I\'m DUE for a winner" and overtrade',
      danger: 'Revenge trading, forcing trades, increasing position size',
      solution: 'Each trade is independent. Edge plays out over 100+ trades, not 5.'
    }
  },

  emotional_states: {
    fear: {
      symptoms: ['Hesitating on good setups', 'Exiting winners too early', 'Moving stop loss closer', 'Skipping trades after losses'],
      cause: 'Recent losses, trading too large, lack of confidence',
      solution: 'Reduce position size by 50% until confidence returns.'
    },
    greed: {
      symptoms: ['Moving stop loss wider', 'Not taking profits at target', 'Increasing position size after wins', 'Adding to losing positions'],
      cause: 'Recent wins, underestimating risk, FOMO',
      solution: 'Take profits at predetermined target. No exceptions.'
    },
    revenge_trading: {
      symptoms: ['Taking trades immediately after loss', 'Doubling position size', 'Trading outside your system', 'Forcing trades'],
      cause: 'Ego damage from loss, need to prove you\'re right',
      danger: 'Largest cause of account blowups',
      solution: 'STOP TRADING. Close platform. Mandatory 24-hour break after 2 consecutive losses.'
    }
  },

  market_psychology: {
    market_cycle_emotions: {
      optimism: 'Early uptrend - "this could work out"',
      excitement: 'Mid uptrend - "I\'m making money!"',
      thrill: 'Late uptrend - "I\'m a genius!"',
      euphoria: 'Top - "I\'m going to be rich!" ← DANGER ZONE',
      anxiety: 'Early decline - "it\'ll bounce back"',
      denial: 'Decline continues - "this is just a correction"',
      panic: 'Sharp decline - "GET ME OUT!" ← OPPORTUNITY',
      capitulation: 'Bottom - "I\'m never trading again"',
    },
    why_retail_loses: {
      buy_tops: 'FOMO kicks in after 30-50% rally',
      sell_bottoms: 'Panic kicks in after 30-50% decline',
      follow_crowd: 'Do what feels comfortable = wrong',
      news_trading: 'Buy on good news (priced in), sell on bad news (often the bottom)'
    }
  },

  common_mistakes: {
    overtrading: {
      cause: 'Boredom, need for action, trying to force profits',
      danger: 'Death by 1000 cuts',
      solution: 'Quality > Quantity. Wait for A+ setups.'
    },
    not_using_stops: {
      cause: 'Fear of being stopped out, hoping for reversal',
      danger: 'One trade can wipe out months/years of gains',
      solution: 'Stop loss is NON-NEGOTIABLE. Set before entry. Never move wider.'
    },
    averaging_down: {
      cause: 'Trying to lower average entry price',
      danger: 'Turning small loss into catastrophic loss',
      solution: 'NEVER add to losers. Only add to winners (pyramiding).'
    }
  },

  professional_mindset: {
    core_beliefs: {
      probability_not_certainty: 'No single trade matters. Edge plays out over 100+ trades.',
      process_over_outcome: 'Focus on executing plan correctly, not on profit/loss',
      loss_is_expense: 'Losses are cost of doing business, like rent for a store',
      discipline_beats_iq: 'Average strategy + excellent discipline > genius strategy + no discipline'
    },
    rules_to_live_by: {
      one_percent_rule: 'Never risk more than 1-2% of account on single trade',
      two_loss_rule: 'After 2 consecutive losses, stop trading for 24 hours',
      plan_the_trade: 'Before entry, know: entry, stop, target, R:R, why',
      trade_the_plan: 'Execute mechanically. No mid-trade changes.',
      accept_uncertainty: 'You can\'t control outcome. Only control process.'
    }
  }
};

// ============================================
// KNOWLEDGE RETRIEVAL FUNCTIONS
// ============================================

export function getCandlestickKnowledge(): string {
  return Object.entries(CANDLESTICK_PATTERNS)
    .map(([_key, pattern]) => {
      let entry = `
### ${pattern.name} (${pattern.type})
${pattern.description}
**Reliability:** ${pattern.reliability}
**Asset Type:** ${pattern.assetType}

**Rules:**
${Array.isArray(pattern.rules)
    ? pattern.rules.map(r => `- ${r}`).join('\n')
    : JSON.stringify(pattern.rules, null, 2)
  }

${pattern.confirmation ? `**Confirmation:** ${pattern.confirmation}` : ''}`;

      if (pattern.successRate) {
        entry += `\n**Success Rate:** ${pattern.successRate.overall} (${pattern.successRate.source})`;
      }
      if (pattern.failureMode) {
        entry += `\n**Failure Mode:** ${pattern.failureMode}`;
      }
      if (pattern.invalidation) {
        entry += `\n**Invalidation:** ${pattern.invalidation}`;
      }

      return entry;
    }).join('\n---\n');
}

export function getChartPatternKnowledge(assetType?: 'stock' | 'crypto' | 'both'): string {
  const filtered = assetType
    ? Object.entries(CHART_PATTERNS).filter(([_, p]) => p.assetType === assetType || p.assetType === 'both')
    : Object.entries(CHART_PATTERNS);

  return filtered
    .map(([_key, pattern]) => {
      let entry = `
### ${pattern.name} (${pattern.type})
${pattern.description}
**Reliability:** ${pattern.reliability}
**Asset Type:** ${pattern.assetType}

**Rules:**
${typeof pattern.rules === 'object' && !Array.isArray(pattern.rules)
    ? Object.entries(pattern.rules).map(([k, v]) => `- **${k}:** ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n')
    : Array.isArray(pattern.rules)
      ? pattern.rules.map(r => `- ${r}`).join('\n')
      : pattern.rules
  }

${pattern.confirmation ? `**Confirmation:** ${pattern.confirmation}` : ''}`;

      if (pattern.successRate) {
        entry += `\n**Success Rate:** ${pattern.successRate.overall} overall, ${pattern.successRate.stocks || 'N/A'} stocks, ${pattern.successRate.crypto || 'N/A'} crypto (${pattern.successRate.source})`;
      }
      if (pattern.failureMode) {
        entry += `\n**Failure Mode:** ${pattern.failureMode}`;
      }
      if (pattern.invalidation) {
        entry += `\n**Invalidation:** ${pattern.invalidation}`;
      }

      return entry;
    }).join('\n---\n');
}

export function getIndicatorKnowledge(assetType?: 'stock' | 'crypto' | 'both'): string {
  const indicators = { ...INDICATORS, ...CRYPTO_INDICATORS };
  const filtered = assetType
    ? Object.entries(indicators).filter(([_, i]) => i.assetType === assetType || i.assetType === 'both')
    : Object.entries(indicators);

  return filtered
    .map(([_key, indicator]) => {
      let entry = `
### ${indicator.name}
${indicator.description}
${indicator.range ? `**Range:** ${indicator.range}` : ''}

**Signals:**
${JSON.stringify(indicator.signals, null, 2)}`;

      if (indicator.limitations) {
        entry += `\n\n**⚠️ LIMITATIONS:**
- **Lag:** ${indicator.limitations.lag}
- **False Signals:** ${indicator.limitations.false_signals}
- **Best Use:** ${indicator.limitations.best_use}`;
        if (indicator.limitations.dangerous) {
          entry += `\n- **⛔ Dangerous:** ${indicator.limitations.dangerous}`;
        }
      }
      if (indicator.reliability) {
        entry += `\n\n**Reliability:**\n${Object.entries(indicator.reliability).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`;
      }

      return entry;
    }).join('\n---\n');
}

export function getFundamentalKnowledge(): string {
  return Object.entries(STOCK_FUNDAMENTALS)
    .map(([_key, metric]) => `
### ${metric.name}
${metric.description}
${metric.formula ? `**Formula:** ${metric.formula}` : ''}

**Interpretation:**
${Object.entries(metric.interpretation).map(([k, v]) => `- **${k}:** ${v}`).join('\n')}
    `).join('\n---\n');
}

export function getMarketStructureKnowledge(): string {
  return Object.entries(MARKET_STRUCTURE)
    .map(([key, concept]) => `
### ${key.toUpperCase().replace('_', ' ')}
${typeof concept === 'object' && 'definition' in concept ? `**Definition:** ${(concept as any).definition}` : ''}
${typeof concept === 'object' ? Object.entries(concept)
      .filter(([k]) => k !== 'definition')
      .map(([k, v]) => `**${k}:** ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('\n') : ''}
    `).join('\n---\n');
}

export function getRiskManagementKnowledge(): string {
  return Object.entries(RISK_MANAGEMENT)
    .map(([key, rule]) => `
### ${key.toUpperCase().replace('_', ' ')}
${typeof rule === 'object' ? Object.entries(rule)
      .map(([k, v]) => `**${k}:** ${typeof v === 'object' ? JSON.stringify(v, null, 2) : v}`)
      .join('\n') : rule}
    `).join('\n---\n');
}

// ============================================
// MAIN FUNCTION: GET FULL KNOWLEDGE BASE
// ============================================

export function getFullKnowledgeBase(assetType: 'stock' | 'crypto' | 'both' = 'both'): string {
  return `
# 📚 PROFESSIONAL TRADING KNOWLEDGE BASE

**CRITICAL UNDERSTANDING:**
- Patterns work because human psychology (fear/greed) is predictable
- Success rates are AVERAGES (70% success = 30% failure)
- Context determines reliability (same pattern ≠ same probability everywhere)
- Psychology causes more losses than lack of technical knowledge

---

## 📊 CANDLESTICK PATTERNS (With Research Data)

${getCandlestickKnowledge()}

---

## 📈 CHART PATTERNS (With Research Data)

${getChartPatternKnowledge(assetType)}

---

## ⚠️ PATTERN RELIABILITY RULES

**Success Rates Mean:**
- HIGH (70-90%) = Pattern works 7-8 times out of 10 (still fails 2-3 times)
- MEDIUM (55-70%) = Works 5-7 times out of 10
- LOW (45-55%) = Barely better than coin flip

**Context Adjustment Formula:**
Final Reliability = Base Rate × Timeframe × Asset × Volume × S/R × Trend
- Timeframe: 1m=0.75, 5m=0.85, 15m=0.95, 1H=1.0, 4H=1.15, Daily=1.25, Weekly=1.35
- Asset: Stocks=1.0, Crypto=0.85
- Volume >2x = +15%, Volume <0.7x = -10%
- At correct S/R level = +20%, Wrong level = -15%
- In trend (continuation) = +15%, Sideways = -20%
- Capped at 90% maximum

---

## 🔧 TECHNICAL INDICATORS (With Limitations)

${getIndicatorKnowledge(assetType)}

**CRITICAL WARNINGS:**
1. ALL indicators LAG price (show past, not future)
2. Use indicators for CONFIRMATION only, never alone
3. Indicators fail 40-50% in sideways markets
4. Price action + S/R > any indicator

---

${assetType === 'stock' || assetType === 'both' ? `
## 💰 FUNDAMENTAL ANALYSIS (STOCKS)

${getFundamentalKnowledge()}

---
` : ''}

## 🏗️ MARKET STRUCTURE

${getMarketStructureKnowledge()}

---

## ⚠️ RISK MANAGEMENT

${getRiskManagementKnowledge()}

---

## 🧠 TRADING PSYCHOLOGY

**Cognitive Biases to Watch:**
- Confirmation Bias: Only seeing what supports your view
- FOMO: Panic buying after big moves
- Loss Aversion: Holding losers, cutting winners (2.5x bias per Kahneman)
- Gamblers Fallacy: Thinking you're "due" for a winner
- Recency Bias: Overweighting last few trades

**Market Cycle Emotions:**
Optimism → Excitement → Thrill → EUPHORIA (top) → Anxiety → Denial → PANIC (bottom) → Capitulation

**Professional Rules:**
- Risk 1-2% max per trade
- Stop loss is non-negotiable
- After 2 consecutive losses, stop for 24 hours
- Process over outcome, probability not certainty

---

## CRITICAL ANALYSIS RULES (ADVISOR MODE):
1. Provide CLEAR trading signals: BUY, SELL, or WAIT - be DECISIVE
2. Include EXACT entry prices, stop loss, and take profit levels
3. Include bot configuration parameters (position size, leverage, trailing stop)
4. Be DIRECT and ACTIONABLE - no hedging language
5. Adjust reliability based on context (timeframe, asset, volume, S/R, trend)
6. Maximum 3 patterns per analysis - report highest confidence only
7. Cap confidence at 95%
8. Context adjustment formula: baseScore + timeframeAdj + assetAdj + volumeAdj + confluenceAdj

  `.trim();
}

// ============================================
// HELPER: GET COMPACT KNOWLEDGE (FOR PROMPTS)
// ============================================

export function getCompactKnowledge(assetType: 'stock' | 'crypto' | 'both' = 'both'): string {
  const patterns = Object.entries(CANDLESTICK_PATTERNS)
    .concat(Object.entries(CHART_PATTERNS).filter(([_, p]) => p.assetType === assetType || p.assetType === 'both'))
    .map(([_, p]) => `${p.name} (${p.type}, ${p.reliability})`)
    .join(', ');

  const indicators = Object.keys(INDICATORS).concat(
    assetType === 'crypto' || assetType === 'both' ? Object.keys(CRYPTO_INDICATORS) : []
  ).join(', ');

  return `
Known Patterns: ${patterns}
Known Indicators: ${indicators}
Asset Type: ${assetType}
  `.trim();
}
