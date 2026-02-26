#!/usr/bin/env python3
"""
Harkly Financial Dashboard API
Flask backend serving model.py calculations to dashboard.html
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import model

app = Flask(__name__)
CORS(app)  # Enable CORS for local development

# ============================================================
# DEFAULT STATE (synced with dashboard.html)
# ============================================================

DEFAULT_STATE = {
    # Prices
    "pS": 50, "pP": 250, "pE": 500,
    
    # Credits
    "freeDaily": 25, "freeDays": 15,
    "crS": 250, "crP": 5000, "crE": 25000, "wlGift": 25000,
    
    # COGS
    "rawCogs": 0.0085, "buffer": 1.50, "cons": 0.85,
    
    # Churn
    "cF": 0.20, "cS": 0.05, "cP": 0.03, "cE": 0.01,
    
    # WL pricing
    "wlFloor": 0.020, "wlDisc": 0.25,
    "wlBase": 150000, "wlPro": 500000, "wlScale": 2000000,
    
    # Team
    "aiCost": 1000, "aiMo": 3,
    "draw": 2000, "drMo": 5,
    "artRate": 0.20,
    
    # Growth multiplier
    "cm": 1.0,
    
    # WL events
    "wlEvt": [
        {"mo": 3, "t": "base", "qty": 1},
        {"mo": 6, "t": "pro", "qty": 1},
        {"mo": 9, "t": "base", "qty": 1},
        {"mo": 12, "t": "scale", "qty": 1}
    ],
    
    # Manual sales (disabled by default)
    "useManualSales": False,
    "manualSales": {
        "3": {"si": 0, "pi": 0, "ei": 0},
        "4": {"si": 0, "pi": 0, "ei": 0},
        "5": {"si": 0, "pi": 0, "ei": 0},
        "6": {"si": 0, "pi": 0, "ei": 0},
        "7": {"si": 0, "pi": 0, "ei": 0},
        "8": {"si": 0, "pi": 0, "ei": 0},
        "9": {"si": 0, "pi": 0, "ei": 0},
        "10": {"si": 0, "pi": 0, "ei": 0},
        "11": {"si": 0, "pi": 0, "ei": 0},
        "12": {"si": 0, "pi": 0, "ei": 0}
    }
}


# ============================================================
# API ENDPOINTS
# ============================================================

@app.route('/api/state', methods=['GET'])
def get_state():
    """Get default state"""
    return jsonify(DEFAULT_STATE)


@app.route('/api/simulate', methods=['POST'])
def simulate():
    """
    Run simulation with provided state
    Expects JSON with state parameters
    Returns base, bear, bull scenarios
    """
    state = request.get_json() or {}
    
    # Merge with defaults
    params = {**DEFAULT_STATE, **state}
    
    # Convert wlEvt from list to dict format for model.py
    # model.py uses GROWTH[m][4] for WL tiers
    # We need to map wlEvt to WL_DATA format
    
    # Run simulations
    base_rows = model.simulate(conv_mult=params.get("cm", 1.0))
    bear_rows = model.simulate(conv_mult=params.get("cm", 1.0) * 0.8)
    bull_rows = model.simulate(conv_mult=params.get("cm", 1.0) * 1.2)
    
    # Format for dashboard
    def format_rows(rows):
        return [
            {
                "m": r["month"],
                "mn": r["name"],
                "fi": r["free"],
                "si": r["start"],
                "pi": r["pro"],
                "ei": r["ent"],
                "wn": r["wl_count"],
                "du": r["direct_users"],
                "paying": r["paying"],
                "rs": r["rev_start"],
                "rp": r["rev_pro"],
                "re": r["rev_ent"],
                "rw": r["rev_wl"],
                "rev": r["revenue"],
                "cvD": r["cogs_var"],  # Approximate
                "cfx": r["cogs_fixed"],
                "tc": r["total_cogs"],
                "gp": r["gp"],
                "gm": r["gm_pct"],
                "art": r["artem"],
                "drw": r["owner_draw"],
                "net": r["net"],
                "crT": r["cr_issued"],
                "crD": r["cr_issued"] - r["cr_breakage"],  # Approximate
                "crW": r["wl_count"] * 25000,  # Approximate
            }
            for r in rows
        ]
    
    return jsonify({
        "base": format_rows(base_rows),
        "bear": format_rows(bear_rows),
        "bull": format_rows(bull_rows)
    })


@app.route('/api/model-info', methods=['GET'])
def model_info():
    """Get model constants and metadata"""
    return jsonify({
        "MONTH_NAMES": model.MONTH_NAMES,
        "LAUNCH_MONTH": model.LAUNCH_MONTH,
        "CREDITS_FREE_DAILY": model.CREDITS_FREE_DAILY,
        "FREE_ACTIVE_DAYS": model.FREE_ACTIVE_DAYS,
        "CREDITS_START": model.CREDITS_START,
        "CREDITS_PRO": model.CREDITS_PRO,
        "CREDITS_ENT": model.CREDITS_ENT,
        "CREDITS_WL_GIFT": model.CREDITS_WL_GIFT,
        "PRICE_START": model.PRICE_START,
        "PRICE_PRO": model.PRICE_PRO,
        "PRICE_ENT": model.PRICE_ENT,
        "RAW_COGS_PER_CREDIT": model.RAW_COGS_PER_CREDIT,
        "COGS_BUFFER": model.COGS_BUFFER,
        "EFF_COGS_PER_CREDIT": model.EFF_COGS_PER_CREDIT,
        "CREDIT_CONSUMPTION": model.CREDIT_CONSUMPTION,
        "CHURN": model.CHURN,
        "ARTEM_RATE": model.ARTEM_RATE,
        "WL_FLOOR": model.WL_FLOOR,
        "WL_PARTNER_DISC": model.WL_PARTNER_DISC,
        "WL_BASE_CREDITS": model.WL_BASE_CREDITS,
        "WL_PRO_CREDITS": model.WL_PRO_CREDITS,
        "WL_SCALE_CREDITS": model.WL_SCALE_CREDITS,
    })


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    print("Starting Harkly Dashboard API...")
    print("Server running on http://localhost:5000")
    print("Endpoints:")
    print("  GET  /api/state     - Get default state")
    print("  POST /api/simulate  - Run simulation")
    print("  GET  /api/model-info - Get model constants")
    app.run(debug=True, port=5000)
