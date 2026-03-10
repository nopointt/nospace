#!/usr/bin/env python3
"""
Harkly Financial Dashboard API (stdlib only, no dependencies)
Simple HTTP server serving model.py calculations to dashboard.html
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os
import sys

# Add current directory to path for model import
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import model

# ============================================================
# DEFAULT STATE (synced with dashboard.html)
# ============================================================

DEFAULT_STATE = {
    # Prices
    "pS": 50, "pP": 250, "pE": 500,

    # Credits (updated 2026)
    "freeMonthly": 262,   # monthly quota (no daily cap)
    "crS": 1750, "crP": 8750, "crE": 34000, "wlGift": 25000,

    # COGS
    "rawCogs": 0.0085, "buffer": 1.50, "cons": 0.85, "wlCons": 0.60,
    "mixR": 0.70, "mixP": 0.20, "cogsR": 0.01, "cogsP": 0.005, "cogsQ": 0.005,
    "infraFlat": None,  # None = tier-based; 0 = $0 flat; N = $N flat

    # Churn
    "cF": 0.20, "cS": 0.05, "cP": 0.03, "cE": 0.01,

    # WL pricing
    "wlFloor": 0.020, "wlDisc": 0.25,
    "wlBase": 150000, "wlPro": 500000, "wlScale": 2000000,
    "wlBaseP": 2250, "wlProP": 7500, "wlScaleP": 30000,

    # Team
    "aiCost": 1000, "aiMo": 3,
    "draw": 2000, "drMo": 5,
    "artRate": 0.20,

    # Growth multiplier
    "cm": 1.0,

    # WL events — only confirmed partners
    "wlEvt": [
        {"mo": 3, "t": "base", "qty": 1},   # ProxyMarket (confirmed)
    ],
}


# ============================================================
# REQUEST HANDLER
# ============================================================

class DashboardHandler(SimpleHTTPRequestHandler):
    
    def do_GET(self):
        if self.path == '/api/state':
            self.send_json(DEFAULT_STATE)
        elif self.path == '/api/model-info':
            self.send_json({
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
        else:
            super().do_GET()
    
    def do_POST(self):
        if self.path == '/api/simulate':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            state = json.loads(post_data.decode('utf-8')) if post_data else {}

            # Merge with defaults
            params = {**DEFAULT_STATE, **state}
            cm = params.get("cm", 1.0)
            
            # Convert dashboard state to model params
            model_params = {
                'price_start': params.get('pS', 50),
                'price_pro': params.get('pP', 250),
                'price_ent': params.get('pE', 500),
                'credits_free_monthly': params.get('freeMonthly', 262),
                'credits_start': params.get('crS', 1750),
                'credits_pro': params.get('crP', 8750),
                'credits_ent': params.get('crE', 34000),
                'raw_cogs_per_credit': params.get('rawCogs', 0.0085),
                'cogs_buffer': params.get('buffer', 1.50),
                'credit_consumption': params.get('cons', 0.85),
                'wl_consumption': params.get('wlCons', 0.60),
                # Layer COGS (override raw_cogs_per_credit if provided)
                'mix_reality': params.get('mixR', 0.70),
                'mix_prediction': params.get('mixP', 0.20),
                'cogs_reality': params.get('cogsR', 0.01),
                'cogs_prediction': params.get('cogsP', 0.005),
                'cogs_perception': params.get('cogsQ', 0.005),
                'churn_free': params.get('cF', 0.20),
                'churn_start': params.get('cS', 0.05),
                'churn_pro': params.get('cP', 0.03),
                'churn_ent': params.get('cE', 0.01),
                'ai_costs': params.get('aiCost', 1000),
                'owner_draw': params.get('draw', 2000),
                'artem_rate': params.get('artRate', 0.20),
                'infra_flat': params.get('infraFlat', None),  # None = use tier-based
                'wl_base_credits': params.get('wlBase', 150000),
                'wl_pro_credits': params.get('wlPro', 500000),
                'wl_scale_credits': params.get('wlScale', 2000000),
                'wl_base_price': params.get('wlBaseP', 2250),
                'wl_pro_price': params.get('wlProP', 7500),
                'wl_scale_price': params.get('wlScaleP', 30000),
            }
            
            # Build wl_events by month from wlEvt
            wl_by_month = {}
            for ev in params.get('wlEvt', []):
                mo = ev.get('mo')
                t = ev.get('t', 'none')
                qty = int(ev.get('qty', 0))
                if t != 'none' and qty > 0:
                    wl_by_month.setdefault(mo, []).extend([t] * qty)
            
            # Build monthly_users for all months
            use_manual = params.get('useManualSales', False)
            monthly_users = []
            for m in range(1, 13):
                ms = params.get('manualSales', {}).get(str(m), {})
                monthly_users.append({
                    'free':       int(ms.get('fi', 0)) if use_manual else None,
                    'start':      int(ms.get('si', 0)) if use_manual else None,
                    'pro':        int(ms.get('pi', 0)) if use_manual else None,
                    'ent':        int(ms.get('ei', 0)) if use_manual else None,
                    'wl_events':  wl_by_month.get(m, []),
                })
            
            model_params['monthly_users'] = monthly_users

            # Run simulations with params
            base_rows = model.simulate(conv_mult=cm, params=model_params)
            bear_rows = model.simulate(conv_mult=cm * 0.8, params=model_params)
            bull_rows = model.simulate(conv_mult=cm * 1.2, params=model_params)
            
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
                        "cvD": r["cogs_var"],
                        "cfx": r["cogs_fixed"],
                        "tc": r["total_cogs"],
                        "gp": r["gp"],
                        "gm": r["gm_pct"],
                        "art": r["artem"],
                        "drw": r["owner_draw"],
                        "net": r["net"],
                        "crT": r["cr_issued"],
                        "crD": r["cr_issued"] - r["cr_breakage"],
                        "crW": r["wl_count"] * 25000,
                    }
                    for r in rows
                ]
            
            self.send_json({
                "base": format_rows(base_rows),
                "bear": format_rows(bear_rows),
                "bull": format_rows(bull_rows)
            })
        else:
            self.send_error(404)
    
    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        print(f"[API] {args[0]}")


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    port = 5000
    server = HTTPServer(('localhost', port), DashboardHandler)
    
    print("=" * 50)
    print("Harkly Dashboard API Server")
    print("=" * 50)
    print(f"Server running on http://localhost:{port}")
    print("")
    print("Endpoints:")
    print("  GET  /api/state     - Get default state")
    print("  POST /api/simulate  - Run simulation")
    print("  GET  /api/model-info - Get model constants")
    print("")
    print("Open dashboard_api.html in your browser")
    print("=" * 50)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()
