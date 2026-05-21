export const PRESET_STRATEGIES = {
  moving_average_crossover: {
    label: 'Moving Average Crossover',
    description: 'Buy when short MA crosses above long MA',
    defaultConfig: {
      type: 'moving_average_crossover',
      parameters: { short_window: 20, long_window: 50 },
    },
  },
  momentum: {
    label: 'Momentum',
    description: 'Buy when rate of change exceeds threshold',
    defaultConfig: {
      type: 'momentum',
      parameters: { lookback: 20, threshold: 0.02 },
    },
  },
  mean_reversion: {
    label: 'Mean Reversion',
    description: 'Buy dips below Bollinger Band lower band',
    defaultConfig: {
      type: 'mean_reversion',
      parameters: { window: 20, num_std: 2.0 },
    },
  },
  rsi: {
    label: 'RSI',
    description: 'Buy oversold, sell overbought via RSI',
    defaultConfig: {
      type: 'rsi',
      parameters: { period: 14, oversold: 30, overbought: 70 },
    },
  },
  macd: {
    label: 'MACD',
    description: 'Buy on MACD signal line crossover',
    defaultConfig: {
      type: 'macd',
      parameters: { fast: 12, slow: 26, signal: 9 },
    },
  },
  breakout: {
    label: 'Breakout',
    description: 'Buy new N-bar highs, sell new N-bar lows',
    defaultConfig: {
      type: 'breakout',
      parameters: { lookback: 52 },
    },
  },
  bollinger_bands: {
    label: 'Bollinger Band Squeeze',
    description: 'Buy breakout after low-volatility squeeze',
    defaultConfig: {
      type: 'bollinger_bands',
      parameters: { window: 20, num_std: 2.0, squeeze_factor: 0.02 },
    },
  },
  dual_momentum: {
    label: 'Dual Momentum',
    description: 'Absolute + relative momentum combined',
    defaultConfig: {
      type: 'dual_momentum',
      parameters: { lookback: 20, avg_lookback: 5 },
    },
  },
  trend_following: {
    label: 'Trend Following',
    description: 'Buy when EMA slope is rising',
    defaultConfig: {
      type: 'trend_following',
      parameters: { period: 50 },
    },
  },
  volume_weighted_mean_reversion: {
    label: 'Volume-Weighted Mean Reversion',
    description: 'Buy when price deviates below VWAP',
    defaultConfig: {
      type: 'volume_weighted_mean_reversion',
      parameters: { window: 20, threshold: 0.02 },
    },
  },
} as const

export type PresetStrategyKey = keyof typeof PRESET_STRATEGIES
