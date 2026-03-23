# Remizov's Method & Second-Order ODE Theory Applied to Cryptocurrency Trading

> Research report. March 2026.
> Mathematical foundation for Nomos trading strategies based on Remizov's Chernoff approximation method and second-order ODE theory.

---

## Table of Contents

1. [Remizov's Method — Mathematical Foundation](#1-remizovs-method--mathematical-foundation)
2. [Price as a Second-Order Dynamical System](#2-price-as-a-second-order-dynamical-system)
3. [Trading Strategy Ideas — Full Catalog](#3-trading-strategy-ideas--full-catalog)
4. [Implementation — Core Python Functions](#4-implementation--core-python-functions)
5. [Freqtrade Strategy Specifications](#5-freqtrade-strategy-specifications)
6. [Sources](#6-sources)

---

## 1. Remizov's Method — Mathematical Foundation

### 1.1 The Problem (190 Years Unsolved)

The general second-order linear ODE with variable coefficients:

```
a(x)y''(x) + b(x)y'(x) + c(x)y(x) = g(x)
```

where `a(x) > 0` and `a, b, c, g` are functions (not constants), has been considered analytically unsolvable since Joseph Liouville proved in 1834 that solutions cannot be expressed through coefficients using elementary functions and standard operations (addition, subtraction, multiplication, division, root extraction).

When coefficients are constants, the discriminant method works (quadratic characteristic equation). When they vary, classical methods (Frobenius series, WKB approximation, reduction of order) either have limited applicability or produce divergent series.

### 1.2 Remizov's Breakthrough (2023-2025)

Ivan D. Remizov (HSE University, Nizhny Novgorod; Institute for Information Transmission Problems, Russian Academy of Sciences) solved this by expanding the allowed operations to include **"taking the limit of a sequence"** — specifically, the limit of iterated operator compositions known as **Chernoff approximations**.

**Key papers:**
- arXiv:2301.06765 (2023, v4 revised 2025) — the foundational method
- Vladikavkaz Mathematical Journal, 2025, Vol. 27, Issue 4, pp. 124-135 — the ODE-focused publication
- Israel Journal of Mathematics (2024), with O. Galkin — convergence rate estimates

### 1.3 The Mathematical Framework

#### Operator Formulation

Rewrite the ODE in operator form. Define the differential operator:

```
(Hf)(x) = a(x)f''(x) + b(x)f'(x) + c(x)f(x)
```

The ODE `a(x)y'' + b(x)y' + (c(x) - lambda)y = -g(x)` becomes `(lambda*I - H)y = g`, so the solution is:

```
y = R_lambda * g = (lambda*I - H)^{-1} * g
```

where `R_lambda` is the **resolvent** of operator `H`. The entire problem reduces to computing the resolvent.

#### Chernoff's Theorem (1968)

A **Chernoff function** for operator `H` is a mapping `S: [0, +inf) -> L(F)` satisfying:
- `S(0) = I` (identity operator)
- `||S(t)|| <= exp(w*t)` for some constant `w >= 0`
- `S'(0)f` exists on a dense subspace and its closure equals the generator `H`

**Chernoff's Product Formula:**

```
lim_{n->inf} sup_{t in [0,T]} ||S(t/n)^n * f - exp(t*H) * f|| = 0
```

Meaning: the n-fold composition `S(t/n)^n` converges to the semigroup `exp(t*H)` as `n -> infinity`.

#### Remizov's Resolvent Formula (Theorem 3)

```
R_lambda * f = lim_{n->inf} integral_0^inf exp(-lambda*t) * S(t/n)^n * f dt
```

This connects the resolvent (and hence the ODE solution) to iterable Chernoff approximations.

#### The Shift-Operator Chernoff Function (Theorem 6)

This is the key practical formula. Define:

```
(S(t)f)(x) = (1/4)*f(x + 2*sqrt(a(x)*t))
            + (1/4)*f(x - 2*sqrt(a(x)*t))
            + (1/2)*f(x + 2*b(x)*t)
            + t*c(x)*f(x)
```

**Interpretation of each term:**
- **Terms 1-2** (symmetric shifts by `2*sqrt(a*t)`): approximate **diffusion** — the second derivative term `a(x)f''`
- **Term 3** (asymmetric shift by `2*b*t`): approximate **drift** — the first derivative term `b(x)f'`
- **Term 4** (multiplication by `t*c(x)`): approximate **potential/source** — the zero-order term `c(x)f`

#### The Feynman Formula (Theorem 5)

The complete solution can be written as a Feynman path integral:

```
f(x_0) = lim_{n->inf} integral_0^inf exp(-lambda*t) *
    [integral...integral_n  exp( (t/n) * sum_{j=1}^{n} (c(x_{j-1}) - b(x_{j-1})^2 / (4*a(x_{j-1}))) )
     * exp( sum_{j=1}^{n} b(x_{j-1})*(x_j - x_{j-1}) / (2*a(x_{j-1})) )
     * (sqrt(n) / sqrt(4*pi*t))^n * (prod_{j=0}^{n-1} a(x_j))^{-1/2}
     * exp( -n/(4t) * sum_{j=0}^{n-1} (x_j - x_{j+1})^2 / a(x_j) )
     * g(x_n) dx_1 ... dx_n] dt
```

This is the first time an ODE solution has been represented as a Feynman formula.

#### Convergence Rate

```
||S(t/n)^n * g - exp(t*H_bar) * g|| <= (t^2 * exp(||c||*t) / n) * (C_0*||g|| + C_1*||g'|| + C_2*||g''|| + C_3*||g'''|| + C_4*||g^(4)||)
```

Error is `O(1/n)` — each iteration improves accuracy linearly. With the Galkin-Remizov result (2024), if the Chernoff function matches the semigroup's Taylor polynomial to order `k`, convergence improves to `O(1/n^k)`.

### 1.4 What Makes Remizov's Method Different

| Method | Limitation | Remizov's Advantage |
|--------|-----------|-------------------|
| Frobenius (power series) | Converges only near regular singular points; radius limited | Works globally on R |
| WKB approximation | Asymptotic only; breaks down at turning points | Exact in the limit; uniform convergence |
| Reduction of order | Requires knowing one solution already | No prior knowledge needed |
| Peano-Baker series | Converges but formulas are complex (matrix exponentials) | Simpler operators; explicit coefficient dependence |
| Variation of parameters | Requires fundamental solution set | Solution expressed directly via coefficients |
| Numerical (Runge-Kutta) | Grid-dependent; no analytical insight | Semi-analytical; reveals structure |

**Key insight for trading:** Remizov's shift operator formula decomposes the solution into **diffusion + drift + potential** — exactly the components of price dynamics. The Chernoff iteration `S(t/n)^n` can be thought of as discretizing continuous market dynamics into n steps, then improving resolution as n grows.

---

## 2. Price as a Second-Order Dynamical System

### 2.1 The Model

Let `P(t)` be the price of a cryptocurrency. Define:
- `y(t) = log(P(t))` — log-price (standard in quantitative finance)
- `y'(t) = (1/P) * dP/dt` — **momentum** (rate of return)
- `y''(t)` — **acceleration** (rate of change of momentum)

The damped harmonic oscillator model for price:

```
y''(t) + gamma(t)*y'(t) + omega^2(t)*y(t) = F(t)
```

Mapping to the standard form `a*y'' + b*y' + c*y = g`:
- `a(t) = 1` (or `a(t) = m(t)` for "market mass" / inertia)
- `b(t) = gamma(t)` — **damping coefficient** (mean reversion strength)
- `c(t) = omega^2(t)` — **natural frequency squared** (cycle tendency)
- `g(t) = F(t)` — **external forcing** (news shocks, whale activity, funding rates)

### 2.2 Physical Interpretation of Coefficients

| ODE Coefficient | Market Meaning | Observable Proxy |
|----------------|---------------|-----------------|
| `gamma(t)` (damping) | Mean reversion strength; how fast price returns to equilibrium | Inverse of ATR; volatility decay rate; autocorrelation of returns |
| `omega^2(t)` (frequency) | Natural oscillation frequency; cycle length | Dominant FFT frequency of rolling window; Hilbert transform |
| `F(t)` (forcing) | External shocks | Volume spikes; funding rate changes; liquidation cascades |
| `m(t)` (mass/inertia) | Market depth / resistance to movement | Order book depth; ADX; inverse of volatility |

### 2.3 Regime Classification via Discriminant

For the characteristic equation `r^2 + gamma*r + omega^2 = 0`:

```
D = gamma^2 - 4*omega^2
```

| Discriminant | Regime | Market Behavior | Trading Implication |
|-------------|--------|----------------|-------------------|
| D > 0 (overdamped) | Two real negative roots | Price decays monotonically to equilibrium; strong trend with no oscillation | **Trend following**: ride the decay direction |
| D = 0 (critical) | Repeated real root | Fastest non-oscillatory decay; transition point | **Alert**: regime change imminent |
| D < 0 (underdamped) | Complex conjugate roots | Price oscillates around equilibrium with decaying amplitude | **Mean reversion**: buy dips, sell rallies within the oscillation |
| gamma < 0 (negative damping) | Roots with positive real part | Unstable: oscillations grow in amplitude | **Breakout imminent**: energy is building |

### 2.4 Connection to Remizov's Method

Remizov's shift-operator formula decomposes the evolution into:

1. **Diffusion terms** `(1/4)*f(x +/- 2*sqrt(a*t))`: In financial context, these represent the **volatility-driven spread** of the probability distribution. The parameter `a(t)` maps directly to `sigma^2(t)/2` — half the variance.

2. **Drift term** `(1/2)*f(x + 2*b*t)`: This is the **directional bias** — momentum. The coefficient `b(t)` encodes trend direction and strength.

3. **Potential term** `t*c(x)*f(x)`: This is the **amplification/decay factor**. When `c < 0`, the signal decays (mean reversion). When `c > 0`, the signal amplifies (momentum/instability).

The Chernoff iteration `S(t/n)^n` is computationally equivalent to a **multi-step market simulation** where at each step, the price can:
- Spread symmetrically (volatility)
- Shift directionally (momentum)
- Amplify or decay (regime tendency)

This is directly implementable as a numerical scheme for price prediction.

### 2.5 The Remizov Trading Insight

The Feynman formula for the ODE solution sums over all possible "paths" the price could take, weighted by the coefficients `a, b, c`. This is structurally identical to a **path integral over price trajectories** — a natural framework for option pricing (Black-Scholes is a special case with constant coefficients).

With Remizov's variable-coefficient formula, we can:
1. **Estimate `a(t), b(t), c(t)` from historical data** (rolling window regression)
2. **Compute `S(t/n)^n`** to approximate the future price distribution
3. **Extract trading signals** from the properties of the approximation (stability, resonance, regime)

---

## 3. Trading Strategy Ideas — Full Catalog

### 3a. ODE-Based Regime Detector (DISCRIMINANT METHOD)

**Mathematical formulation:**

Fit the second-order ODE `y'' + p*y' + q*y = 0` to rolling price windows using least-squares regression. For each window:

1. Compute `y'(t)` = finite difference of log-price
2. Compute `y''(t)` = finite difference of `y'(t)`
3. Solve the regression `y'' = -p*y' - q*y` for `(p, q)` via least squares
4. Compute discriminant `D = p^2 - 4*q`

**Signal generation:**
- `D >> 0` (strongly overdamped): TREND regime → trend-follow (buy in uptrend, sell in downtrend)
- `D << 0` (strongly underdamped): OSCILLATION regime → mean-revert
- `|D| < threshold` (near-critical): TRANSITION → reduce position / wait
- `p < 0` (negative damping): UNSTABLE → breakout imminent, prepare for large move

**Market data feeds:**
- Input: close prices (log-transformed), rolling window of 20-60 bars
- Coefficients: `p` from regression of `y''` on `y'` and `y`; `q` from same
- Output: regime label + confidence (R^2 of regression)

### 3b. Resonance Detector (FREQUENCY MATCHING)

**Mathematical formulation:**

From the ODE coefficients, the natural frequency is `omega_0 = sqrt(q)` (when `q > 0`). Compare this with actual price frequencies from FFT:

1. Compute FFT of rolling price window → power spectrum
2. Find dominant frequency `f_dominant`
3. Compute natural frequency from ODE: `f_natural = omega_0 / (2*pi) = sqrt(q) / (2*pi)`
4. Resonance ratio: `R = f_dominant / f_natural`

**Signal generation:**
- `R ~ 1.0` (resonance): External forcing matches natural frequency → **amplification** → trend acceleration. Strong trend-follow signal.
- `R >> 1` or `R << 1`: Frequencies don't match → energy dissipates → choppy/ranging market.
- `R` transitioning toward 1.0: Resonance building → early warning of trend strengthening.

### 3c. Variable Coefficient Tracker (REGIME SHIFT DETECTION)

**Mathematical formulation:**

Estimate `p(t)` and `q(t)` on overlapping rolling windows. Track their time series:

1. For each window ending at time `t`, fit `(p_t, q_t)` via regression
2. Compute rate of change: `dp/dt`, `dq/dt` (finite differences of coefficient series)
3. Detect sudden changes using z-score: `z_p = |dp/dt| / std(dp/dt)`, `z_q = |dq/dt| / std(dq/dt)`

**Signal generation:**
- `z_p > 2` or `z_q > 2`: Regime shift detected. The "physics" of the market is changing.
  - If `q` jumps positive: oscillation regime beginning (start mean-reversion)
  - If `q` drops toward zero: oscillation ending, trend beginning
  - If `p` jumps negative: damping reversed, instability growing (breakout)
  - If `p` jumps positive: damping increased, volatility compression (range-bound)

### 3d. Green's Function / Impulse Response Predictor

**Mathematical formulation:**

The Green's function `G(t, s)` for the ODE satisfies:

```
G''(t,s) + p(t)*G'(t,s) + q(t)*G(t,s) = delta(t - s)
```

Once estimated, the response to any forcing `F(t)` is:

```
y(t) = integral_0^t G(t, s) * F(s) ds
```

**Implementation approach:**

1. Estimate the system's impulse response empirically: apply a unit shock (volume spike, large candle) and measure the subsequent price path.
2. Alternatively, compute `G` numerically from the fitted ODE using Remizov's Chernoff approximation.
3. Convolve `G` with current "forcing" (volume, funding rate, etc.) to predict near-future price.

**Signal generation:**
- If predicted response is positive and growing → BUY
- If predicted response is negative and growing → SELL
- If predicted response is decaying → HOLD (shock is being absorbed)

### 3e. Stability Analysis (LYAPUNOV EXPONENTS)

**Mathematical formulation:**

Convert the second-order ODE to a first-order system:

```
dx/dt = y
dy/dt = -p(t)*y - q(t)*x + F(t)
```

The Jacobian is:

```
J = [[0, 1], [-q(t), -p(t)]]
```

Eigenvalues of `J` at each time `t`:

```
lambda_{1,2} = (-p +/- sqrt(p^2 - 4q)) / 2
```

The **maximal Lyapunov exponent** is the time-averaged real part of the dominant eigenvalue:

```
Lambda = (1/T) * integral_0^T max(Re(lambda_1(t)), Re(lambda_2(t))) dt
```

**Signal generation:**
- `Lambda > 0` (positive Lyapunov exponent): System is **unstable** / chaotic → breakout/crash imminent. High-conviction signal.
- `Lambda < 0`: System is **stable** → mean-reverting. Trade oscillations.
- `Lambda ~ 0`: System at **edge of chaos** → transition zone. Reduce exposure.
- Tracking `Lambda` over time: rising `Lambda` = building instability; falling `Lambda` = stabilizing.

### 3f. Phase Portrait Analysis

**Mathematical formulation:**

Plot the trajectory in the `(y, y')` phase plane — i.e., `(log-price, momentum)`:

1. Compute the phase portrait: `(y(t), y'(t))` for a rolling window
2. Classify the topology using the eigenvalue analysis from 3e:

| Re(lambda) | Im(lambda) | Phase Portrait | Market Behavior |
|-----------|-----------|---------------|----------------|
| Both negative, real | 0 | Stable node | Strong mean reversion, no oscillation |
| Negative, complex | Non-zero | Stable spiral | Oscillating with decay → mean reversion |
| One positive, one negative | 0 | Saddle point | Unstable equilibrium → breakout in one direction |
| Positive, complex | Non-zero | Unstable spiral | Growing oscillations → volatility expansion |
| Zero real | Non-zero | Center (limit cycle) | Perfect oscillation → range-bound |

**Signal generation:**
- Stable spiral → MEAN REVERT (buy low momentum at support, sell high momentum at resistance)
- Saddle point → BREAKOUT (enter in the direction of the unstable eigenvector)
- Unstable spiral → MOMENTUM (ride the growing oscillation, trail stop aggressively)
- Stable node → FADE (contrarian trades toward the node)

### 3g. Chernoff Iteration Price Predictor (REMIZOV-NATIVE)

**Mathematical formulation:**

This is the most direct application of Remizov's method. Using the fitted coefficients `a(t), b(t), c(t)`:

1. Construct the shift-operator Chernoff function:
   ```
   (S(dt)f)(x) = (1/4)*f(x + 2*sqrt(a(x)*dt)) + (1/4)*f(x - 2*sqrt(a(x)*dt))
                + (1/2)*f(x + 2*b(x)*dt) + dt*c(x)*f(x)
   ```

2. Apply `n` iterations of `S(dt/n)` to the current price distribution (initialized as a delta function at current log-price):
   ```
   f_predicted = S(dt/n)^n * f_initial
   ```

3. The resulting distribution `f_predicted` gives the probability density of future log-price at time `t + dt`.

**Signal generation:**
- If mean of `f_predicted` > current price + threshold → BUY
- If mean of `f_predicted` < current price - threshold → SELL
- Width of `f_predicted` → confidence (narrow = high confidence, wide = uncertain)
- Skewness of `f_predicted` → directional bias strength

### 3h. Energy Analysis (Hamiltonian Approach)

**Mathematical formulation:**

Define the "energy" of the price system:

```
E(t) = (1/2)*(y')^2 + (1/2)*q(t)*y^2
```

where the first term is "kinetic energy" (momentum squared) and the second is "potential energy" (displacement from equilibrium scaled by stiffness).

Rate of energy change:

```
dE/dt = -p(t)*(y')^2 + F(t)*y' + (1/2)*(dq/dt)*y^2
```

**Signal generation:**
- `dE/dt > 0` and rising: Energy being injected → trend strengthening → BUY/SELL (follow direction)
- `dE/dt < 0` and falling: Energy dissipating → trend exhaustion → prepare for reversal
- Energy at local minimum: System at rest → about to receive new impulse → watch for breakout
- Sudden energy spike: Shock event → wait for direction to clarify, then follow

### 3i. Damping Ratio Tracker

**Mathematical formulation:**

The damping ratio is:

```
zeta(t) = p(t) / (2 * sqrt(q(t)))   [when q(t) > 0]
```

| zeta | Regime | Trading mode |
|------|--------|-------------|
| zeta > 1 | Overdamped | Trend following |
| zeta = 1 | Critically damped | Transition alert |
| 0 < zeta < 1 | Underdamped | Mean reversion with oscillation |
| zeta < 0 | Anti-damped | Explosive breakout |

Track `zeta(t)` as a time series. Its crossings of 0 and 1 are regime change signals.

---

## 3j. CRITICAL EMPIRICAL FINDING: Fit ODE on RETURNS, Not Log-Price

Testing on 1000 candles of BTC/USDT and ETH/USDT 4h data revealed:

**Log-price ODE fitting FAILS:**
- `y'' + p*y' + q*y = 0` on log-price gives R^2 ~ 0 (model doesn't fit)
- Log-price on short windows is nearly linear → `y'' ~ 0` → noise
- All coefficients are O(1e-5), far below any useful threshold
- Discriminant D ~ 0 → no regime classification possible

**Returns ODE fitting WORKS:**
- `r'' + p*r' + q*r = 0` on log-returns gives R^2 ~ 0.55–0.90
- Returns oscillate around zero → ODE captures the oscillation structure
- Coefficients p ~ O(0.1), q ~ O(2.0) — meaningful magnitudes
- D is ALWAYS negative (always underdamped / oscillatory) on crypto 4h

**Regime signal is NOT in the sign of D, but in:**
1. **Damping coefficient p**: p > 0 = returns converging (trend stabilizing), p < 0 = returns diverging (instability)
2. **Trend slope**: linear regression slope of log-price over the same window
3. **R^2 of ODE fit**: higher = more predictable regime
4. **Rate of change of p**: dp/dt spikes = regime transition

**Oscillation characteristics on crypto 4h:**
- Natural frequency omega = sqrt(q) ~ 1.38
- Period ~ 4.5 candles (18 hours)
- Damping ratio zeta = p / (2*sqrt(q)) centered at 0, range [-0.09, +0.09]
- D ranges from -4.4 to -11.7 (always negative)

---

## 4. Implementation — Core Python Functions

### 4.1 ODE Coefficient Estimator

```python
import numpy as np
from numpy.linalg import lstsq

def estimate_ode_coefficients(log_prices: np.ndarray, dt: float = 1.0) -> dict:
    """
    Fit y'' + p*y' + q*y = 0 to log-price series via least-squares.

    Parameters:
        log_prices: array of log(price), length >= 4
        dt: time step between observations (default 1.0 for candle-normalized)

    Returns:
        dict with keys: p, q, discriminant, regime, r_squared,
                        damping_ratio, natural_freq, eigenvalues
    """
    n = len(log_prices)
    if n < 4:
        return {"p": 0.0, "q": 0.0, "discriminant": 0.0, "regime": "insufficient_data",
                "r_squared": 0.0, "damping_ratio": 0.0, "natural_freq": 0.0,
                "eigenvalues": (0.0, 0.0)}

    # Finite differences for derivatives
    y = log_prices[1:-1]           # y(t)
    y_prime = (log_prices[2:] - log_prices[:-2]) / (2 * dt)  # central difference
    y_double_prime = (log_prices[2:] - 2 * log_prices[1:-1] + log_prices[:-2]) / (dt ** 2)

    # Truncate to matching length
    min_len = min(len(y), len(y_prime), len(y_double_prime))
    y = y[:min_len]
    y_prime = y_prime[:min_len]
    y_double_prime = y_double_prime[:min_len]

    # Regression: y'' = -p * y' - q * y  =>  y'' = A @ [p, q]^T where A = [-y', -y]
    A = np.column_stack([-y_prime, -y])
    b = y_double_prime

    # Least squares fit
    result, residuals, rank, sv = lstsq(A, b, rcond=None)
    p_est, q_est = result[0], result[1]

    # R-squared
    ss_res = np.sum((y_double_prime - A @ result) ** 2)
    ss_tot = np.sum((y_double_prime - np.mean(y_double_prime)) ** 2)
    r_squared = 1.0 - ss_res / max(ss_tot, 1e-12)

    # Discriminant and regime classification
    D = p_est ** 2 - 4 * q_est

    if q_est <= 0:
        regime = "unstable"
    elif p_est < -0.01:
        regime = "anti_damped"
    elif D > 0.1:
        regime = "overdamped"
    elif D < -0.1:
        regime = "underdamped"
    else:
        regime = "critical"

    # Damping ratio
    damping_ratio = p_est / (2 * np.sqrt(max(q_est, 1e-12))) if q_est > 0 else float("inf")

    # Natural frequency
    natural_freq = np.sqrt(max(q_est, 0.0))

    # Eigenvalues
    disc_sqrt = np.sqrt(abs(D))
    if D >= 0:
        eig1 = (-p_est + disc_sqrt) / 2
        eig2 = (-p_est - disc_sqrt) / 2
    else:
        eig1 = complex(-p_est / 2, disc_sqrt / 2)
        eig2 = complex(-p_est / 2, -disc_sqrt / 2)

    return {
        "p": p_est,
        "q": q_est,
        "discriminant": D,
        "regime": regime,
        "r_squared": r_squared,
        "damping_ratio": damping_ratio,
        "natural_freq": natural_freq,
        "eigenvalues": (eig1, eig2),
    }
```

### 4.2 Rolling Regime Detector

```python
def compute_rolling_regime(close_prices: np.ndarray, window: int = 30) -> dict:
    """
    Compute ODE regime classification on rolling windows.

    Returns dict of arrays: p_series, q_series, discriminant_series,
    regime_series, damping_ratio_series, r_squared_series
    """
    n = len(close_prices)
    log_prices = np.log(close_prices)

    p_series = np.full(n, np.nan)
    q_series = np.full(n, np.nan)
    disc_series = np.full(n, np.nan)
    regime_series = np.full(n, "", dtype=object)
    damping_series = np.full(n, np.nan)
    r2_series = np.full(n, np.nan)
    lyapunov_series = np.full(n, np.nan)

    for i in range(window, n):
        segment = log_prices[i - window : i]
        result = estimate_ode_coefficients(segment)

        p_series[i] = result["p"]
        q_series[i] = result["q"]
        disc_series[i] = result["discriminant"]
        regime_series[i] = result["regime"]
        damping_series[i] = result["damping_ratio"]
        r2_series[i] = result["r_squared"]

        # Lyapunov exponent: max real part of eigenvalues
        eigs = result["eigenvalues"]
        lyapunov_series[i] = max(
            np.real(eigs[0]) if isinstance(eigs[0], complex) else eigs[0],
            np.real(eigs[1]) if isinstance(eigs[1], complex) else eigs[1],
        )

    return {
        "p": p_series,
        "q": q_series,
        "discriminant": disc_series,
        "regime": regime_series,
        "damping_ratio": damping_series,
        "r_squared": r2_series,
        "lyapunov": lyapunov_series,
    }
```

### 4.3 Phase Portrait Classifier

```python
def classify_phase_portrait(p: float, q: float) -> dict:
    """
    Classify the phase portrait topology from ODE coefficients.

    Returns dict: topology, stability, oscillatory, trading_mode, confidence
    """
    D = p ** 2 - 4 * q

    if q <= 0:
        # One eigenvalue positive, one negative (if q < 0) or zero (if q = 0)
        return {
            "topology": "saddle",
            "stability": "unstable",
            "oscillatory": False,
            "trading_mode": "breakout",
            "confidence": min(abs(q) * 10, 1.0),
        }

    real_part = -p / 2

    if D > 0:
        # Two distinct real eigenvalues
        if real_part < 0:
            return {
                "topology": "stable_node",
                "stability": "stable",
                "oscillatory": False,
                "trading_mode": "fade_to_equilibrium",
                "confidence": min(abs(real_part), 1.0),
            }
        elif real_part > 0:
            return {
                "topology": "unstable_node",
                "stability": "unstable",
                "oscillatory": False,
                "trading_mode": "momentum_follow",
                "confidence": min(abs(real_part), 1.0),
            }
        else:
            return {
                "topology": "degenerate",
                "stability": "marginal",
                "oscillatory": False,
                "trading_mode": "wait",
                "confidence": 0.0,
            }

    elif D < 0:
        # Complex conjugate eigenvalues
        if real_part < 0:
            return {
                "topology": "stable_spiral",
                "stability": "stable",
                "oscillatory": True,
                "trading_mode": "mean_revert",
                "confidence": min(abs(real_part) * np.sqrt(abs(D)), 1.0),
            }
        elif real_part > 0:
            return {
                "topology": "unstable_spiral",
                "stability": "unstable",
                "oscillatory": True,
                "trading_mode": "ride_oscillation",
                "confidence": min(abs(real_part) * np.sqrt(abs(D)), 1.0),
            }
        else:
            return {
                "topology": "center",
                "stability": "marginal",
                "oscillatory": True,
                "trading_mode": "range_trade",
                "confidence": 0.5,
            }

    else:
        # D == 0: critically damped
        return {
            "topology": "degenerate_node",
            "stability": "stable" if real_part < 0 else "unstable",
            "oscillatory": False,
            "trading_mode": "transition_alert",
            "confidence": 0.3,
        }
```

### 4.4 Chernoff Iteration Predictor (Remizov-Native)

```python
def chernoff_price_predictor(
    log_prices: np.ndarray,
    a_coeff: float,
    b_coeff: float,
    c_coeff: float,
    dt: float = 1.0,
    n_steps: int = 10,
    n_grid: int = 200,
    grid_width: float = 0.1,
) -> dict:
    """
    Apply Remizov's shift-operator Chernoff function to predict future price distribution.

    S(t)f(x) = (1/4)*f(x + 2*sqrt(a*t)) + (1/4)*f(x - 2*sqrt(a*t))
             + (1/2)*f(x + 2*b*t) + t*c*f(x)

    Parameters:
        log_prices: historical log-prices (last value = current)
        a_coeff: diffusion coefficient (proportional to variance)
        b_coeff: drift coefficient (momentum)
        c_coeff: potential coefficient (mean reversion / amplification)
        dt: total prediction horizon
        n_steps: number of Chernoff iterations (higher = more accurate)
        n_grid: number of grid points for discretization
        grid_width: half-width of grid around current price

    Returns:
        dict: predicted_mean, predicted_std, predicted_skew, signal, grid, density
    """
    current_price = log_prices[-1]

    # Create spatial grid centered on current price
    x_grid = np.linspace(current_price - grid_width, current_price + grid_width, n_grid)
    dx = x_grid[1] - x_grid[0]

    # Initialize distribution as approximate delta at current price
    f = np.exp(-((x_grid - current_price) ** 2) / (2 * (dx * 2) ** 2))
    f = f / (np.sum(f) * dx)  # normalize

    step_dt = dt / n_steps

    for _ in range(n_steps):
        f_new = np.zeros_like(f)

        # Diffusion shift: +/- 2*sqrt(a * step_dt)
        diffusion_shift = 2 * np.sqrt(max(abs(a_coeff) * step_dt, 1e-12))
        shift_pixels_diff = diffusion_shift / dx

        # Drift shift: 2*b*step_dt
        drift_shift = 2 * b_coeff * step_dt
        shift_pixels_drift = drift_shift / dx

        # Apply shifts via interpolation
        from scipy.ndimage import shift as ndshift

        f_plus = ndshift(f, -shift_pixels_diff, mode="constant", cval=0.0)
        f_minus = ndshift(f, shift_pixels_diff, mode="constant", cval=0.0)
        f_drift = ndshift(f, -shift_pixels_drift, mode="constant", cval=0.0)

        # Chernoff formula
        f_new = 0.25 * f_plus + 0.25 * f_minus + 0.5 * f_drift + step_dt * c_coeff * f

        # Re-normalize (preserve positivity and unit integral)
        f_new = np.maximum(f_new, 0.0)
        total = np.sum(f_new) * dx
        if total > 1e-12:
            f_new = f_new / total

        f = f_new

    # Extract statistics
    predicted_mean = np.sum(x_grid * f * dx)
    predicted_var = np.sum((x_grid - predicted_mean) ** 2 * f * dx)
    predicted_std = np.sqrt(max(predicted_var, 0.0))

    # Skewness
    if predicted_std > 1e-12:
        predicted_skew = np.sum(((x_grid - predicted_mean) / predicted_std) ** 3 * f * dx)
    else:
        predicted_skew = 0.0

    # Signal: compare predicted mean to current price
    price_change = predicted_mean - current_price
    threshold = predicted_std * 0.5  # require half-sigma move

    if price_change > threshold:
        signal = 1   # BUY
    elif price_change < -threshold:
        signal = -1  # SELL
    else:
        signal = 0   # HOLD

    return {
        "predicted_mean": predicted_mean,
        "predicted_std": predicted_std,
        "predicted_skew": predicted_skew,
        "signal": signal,
        "price_change_log": price_change,
        "grid": x_grid,
        "density": f,
    }
```

### 4.5 Energy and Damping Ratio Tracker

```python
def compute_energy_and_damping(
    log_prices: np.ndarray, p_series: np.ndarray, q_series: np.ndarray, dt: float = 1.0
) -> dict:
    """
    Compute system energy E(t) = 0.5*(y')^2 + 0.5*q*y^2
    and damping ratio zeta(t) = p / (2*sqrt(q)).

    Returns dict: energy, d_energy, damping_ratio, kinetic, potential
    """
    n = len(log_prices)

    # Momentum (first derivative)
    y_prime = np.full(n, np.nan)
    y_prime[1:-1] = (log_prices[2:] - log_prices[:-2]) / (2 * dt)

    # Displacement from local mean (use as y for energy calc)
    y_detrended = log_prices - np.convolve(log_prices, np.ones(20) / 20, mode="same")

    kinetic = 0.5 * y_prime ** 2
    potential = np.where(q_series > 0, 0.5 * q_series * y_detrended ** 2, 0.0)
    energy = kinetic + potential

    # Rate of energy change
    d_energy = np.full(n, np.nan)
    d_energy[1:-1] = (energy[2:] - energy[:-2]) / (2 * dt)

    # Damping ratio
    damping_ratio = np.where(
        q_series > 0,
        p_series / (2 * np.sqrt(np.maximum(q_series, 1e-12))),
        np.nan,
    )

    return {
        "energy": energy,
        "d_energy": d_energy,
        "damping_ratio": damping_ratio,
        "kinetic": kinetic,
        "potential": potential,
    }
```

### 4.6 Resonance Detector

```python
def detect_resonance(
    log_prices: np.ndarray, q_series: np.ndarray, window: int = 64
) -> dict:
    """
    Compare natural ODE frequency with dominant FFT frequency.

    Returns dict: natural_freq, dominant_freq, resonance_ratio, resonance_building
    """
    n = len(log_prices)

    natural_freq = np.full(n, np.nan)
    dominant_freq = np.full(n, np.nan)
    resonance_ratio = np.full(n, np.nan)

    for i in range(window, n):
        segment = log_prices[i - window : i]

        # Detrend
        segment_detrended = segment - np.linspace(segment[0], segment[-1], window)

        # FFT
        spectrum = np.abs(np.fft.rfft(segment_detrended))
        freqs = np.fft.rfftfreq(window)

        # Ignore DC component (index 0)
        if len(spectrum) > 1:
            peak_idx = np.argmax(spectrum[1:]) + 1
            dominant_freq[i] = freqs[peak_idx]

        # Natural frequency from ODE
        q_val = q_series[i]
        if not np.isnan(q_val) and q_val > 0:
            natural_freq[i] = np.sqrt(q_val) / (2 * np.pi)

            if dominant_freq[i] > 0 and natural_freq[i] > 0:
                resonance_ratio[i] = dominant_freq[i] / natural_freq[i]

    # Resonance building detection: ratio approaching 1.0
    resonance_building = np.full(n, False)
    for i in range(5, n):
        if not np.isnan(resonance_ratio[i]) and not np.isnan(resonance_ratio[i - 5]):
            prev_distance = abs(resonance_ratio[i - 5] - 1.0)
            curr_distance = abs(resonance_ratio[i] - 1.0)
            resonance_building[i] = curr_distance < prev_distance and curr_distance < 0.3

    return {
        "natural_freq": natural_freq,
        "dominant_freq": dominant_freq,
        "resonance_ratio": resonance_ratio,
        "resonance_building": resonance_building,
    }
```

### 4.7 Regime Shift Detector (Coefficient Change Rate)

```python
def detect_regime_shifts(
    p_series: np.ndarray, q_series: np.ndarray, lookback: int = 20, z_threshold: float = 2.0
) -> dict:
    """
    Detect sudden changes in ODE coefficients as regime shift signals.

    Returns dict: dp_dt, dq_dt, z_p, z_q, shift_detected, shift_type
    """
    n = len(p_series)

    dp_dt = np.full(n, np.nan)
    dq_dt = np.full(n, np.nan)
    z_p = np.full(n, np.nan)
    z_q = np.full(n, np.nan)
    shift_detected = np.full(n, False)
    shift_type = np.full(n, "", dtype=object)

    for i in range(1, n):
        if not np.isnan(p_series[i]) and not np.isnan(p_series[i - 1]):
            dp_dt[i] = p_series[i] - p_series[i - 1]
        if not np.isnan(q_series[i]) and not np.isnan(q_series[i - 1]):
            dq_dt[i] = q_series[i] - q_series[i - 1]

    for i in range(lookback, n):
        dp_window = dp_dt[i - lookback : i]
        dq_window = dq_dt[i - lookback : i]

        dp_valid = dp_window[~np.isnan(dp_window)]
        dq_valid = dq_window[~np.isnan(dq_window)]

        if len(dp_valid) > 2 and np.std(dp_valid) > 1e-12:
            z_p[i] = abs(dp_dt[i]) / np.std(dp_valid)
        if len(dq_valid) > 2 and np.std(dq_valid) > 1e-12:
            z_q[i] = abs(dq_dt[i]) / np.std(dq_valid)

        is_shift = False
        s_type = ""

        if not np.isnan(z_p[i]) and z_p[i] > z_threshold:
            is_shift = True
            if dp_dt[i] < 0:
                s_type = "damping_decreased"  # toward instability
            else:
                s_type = "damping_increased"  # toward stability

        if not np.isnan(z_q[i]) and z_q[i] > z_threshold:
            is_shift = True
            if dq_dt[i] > 0:
                s_type = s_type + "+oscillation_starting" if s_type else "oscillation_starting"
            else:
                s_type = s_type + "+oscillation_ending" if s_type else "oscillation_ending"

        shift_detected[i] = is_shift
        shift_type[i] = s_type if s_type else "none"

    return {
        "dp_dt": dp_dt,
        "dq_dt": dq_dt,
        "z_p": z_p,
        "z_q": z_q,
        "shift_detected": shift_detected,
        "shift_type": shift_type,
    }
```

---

## 5. Freqtrade Strategy Specifications

### Strategy 1: NomosRemizovTrend

**Core idea:** Fit second-order ODE to rolling price windows. Use discriminant for regime classification. Trade trends when overdamped, skip when underdamped/transition.

**Indicators:**
- ODE coefficients `p(t)`, `q(t)` on 30-bar rolling window
- Discriminant `D(t) = p^2 - 4q`
- Damping ratio `zeta(t)`
- Lyapunov exponent (max real part of eigenvalues)
- Regime shift z-scores
- EMA200 as structural trend filter
- ATR for volatility-adjusted thresholds

**Entry (long):**
- Regime is "overdamped" (`D > 0.05`) — price is trending, not oscillating
- Lyapunov exponent direction aligns with long (eigenvalue suggests price movement up)
- Momentum (`y'`) is positive (price accelerating upward)
- Regression R^2 > 0.3 (the ODE model fits reasonably)
- Price above EMA200 (structural uptrend)

**Exit:**
- Regime shifts to underdamped or critical (start oscillating = trend weakening)
- Lyapunov exponent flips sign
- Damping ratio crosses below 0 (anti-damping = potential reversal)
- Trailing stop on ATR

### Strategy 2: NomosRemizovOscillator

**Core idea:** When the ODE indicates underdamped regime (oscillating), trade the oscillation. Phase portrait analysis for entry timing.

**Indicators:**
- ODE coefficients on 30-bar window
- Phase portrait classification
- Energy `E(t)` and `dE/dt`
- Natural frequency from ODE
- RSI (supplementary oscillator)
- Bollinger Bands for oscillation boundaries

**Entry (long):**
- Regime is "underdamped" (`D < -0.05`) — oscillatory behavior
- Phase portrait is "stable spiral" — decaying oscillation (mean reversion)
- Price at lower Bollinger band (oscillation trough)
- Energy (`dE/dt`) at or near local minimum (reversal point)
- RSI < 35 (supplementary confirmation)

**Exit:**
- Price reaches upper Bollinger band (oscillation peak)
- Energy reaches local maximum (momentum peak)
- Phase portrait topology changes
- RSI > 70

---

## 6. Sources

### Remizov's Papers
- [arXiv:2301.06765 — Chernoff approximations as a method for finding the resolvent of a linear operator and solving a linear ODE with variable coefficients](https://arxiv.org/abs/2301.06765)
- [Vladikavkaz Mathematical Journal 2025, Vol. 27, Issue 4, pp. 124-135](https://www.vmj.ru/articles/2025_4_10.pdf)
- [Galkin & Remizov — Upper and lower estimates for rate of convergence in the Chernoff product formula (Israel J. Math, 2024)](https://link.springer.com/article/10.1007/s11856-024-2678-x)
- [HSE University press release — Remizov solves 190-year-old equation](https://www.hse.ru/en/en/news/1129400632.html)

### Harmonic Oscillator Models in Finance
- [Forecast model for financial time series: An approach based on harmonic oscillators (Physica A, 2020)](https://www.sciencedirect.com/science/article/abs/pii/S0378437120301321)
- [Shocks in financial markets, price expectation, and damped harmonic oscillators (arXiv:1103.1992)](https://arxiv.org/abs/1103.1992)
- [Second order stochastic differential models for financial markets (arXiv:1707.05419)](https://arxiv.org/abs/1707.05419)

### Lyapunov Exponents in Crypto
- [Lyapunov Market Instability (LMI) — TradingView Indicator](https://www.tradingview.com/script/aLcDQIVq-Lyapunov-Market-Instability-LMI/)
- [Lyapunov Exponents as Indicators of the Stock Market Crashes](https://ceur-ws.org/Vol-2732/20200455.pdf)
- [Solving the chaos model-data paradox in the cryptocurrency market (Comm. Nonlinear Sci., 2021)](https://www.sciencedirect.com/science/article/abs/pii/S1007570421002136)

### Freqtrade
- [Freqtrade Strategy Quickstart](https://www.freqtrade.io/en/stable/strategy-101/)
- [Freqtrade Strategy Customization](https://www.freqtrade.io/en/stable/strategy-customization/)
- [Freqtrade Sample Strategy (GitHub)](https://github.com/freqtrade/freqtrade/blob/develop/freqtrade/templates/sample_strategy.py)

### General ODE Theory
- [Damped Harmonic Oscillator — derivation and solutions](https://beltoforion.de/en/harmonic_oscillator/)
- [Second-Order ODE classification and damping regimes (R CRAN doremi)](https://cran.r-project.org/web/packages/doremi/vignettes/second-order.html)
