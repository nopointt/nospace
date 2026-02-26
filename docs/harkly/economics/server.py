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
            
            # Run simulations
            base_rows = model.simulate(conv_mult=cm)
            bear_rows = model.simulate(conv_mult=cm * 0.8)
            bull_rows = model.simulate(conv_mult=cm * 1.2)
            
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
