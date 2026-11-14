"""
TerraAnalog - Multi-Functional HTTP Server & REST API Gateway
Pure Python standard library implementation with zero external runtime dependencies.
Serves both the /api/v1 REST endpoints and the responsive frontend web application.
"""
import http.server
import socketserver
import json
import os
import sys
import urllib.parse
from typing import Dict, Any

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.config import config
from app.seed_data import populate_database
from app.api import api_controller

FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

class TerraAnalogHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler for TerraAnalog REST API and static frontend assets"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def _send_json_response(self, status_code: int, data: Any):
        response_bytes = json.dumps(data, indent=2, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_bytes)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(response_bytes)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query_params = urllib.parse.parse_qs(parsed.query)

        # 1. API ROUTES (/api/v1/...)
        if path.startswith("/api/v1/"):
            subpath = path[len("/api/v1"):]

            if subpath == "/health":
                self._send_json_response(200, api_controller.get_health())
                return

            elif subpath == "/sources":
                self._send_json_response(200, api_controller.get_sources())
                return

            elif subpath == "/datasets":
                body = query_params.get("body", [None])[0]
                self._send_json_response(200, api_controller.get_datasets(body=body))
                return

            elif subpath == "/regions":
                region_type = query_params.get("region_type", [None])[0]
                self._send_json_response(200, api_controller.get_candidate_regions(region_type=region_type))
                return

            elif subpath.startswith("/regions/") and not subpath.endswith("/environment") and not subpath.endswith("/scene"):
                reg_id = subpath.split("/")[2]
                reg = api_controller.get_candidate_region_by_id(reg_id)
                if reg:
                    self._send_json_response(200, reg)
                else:
                    self._send_json_response(404, {"error": "Candidate region not found"})
                return

            elif subpath.startswith("/regions/") and subpath.endswith("/environment"):
                reg_id = subpath.split("/")[2]
                self._send_json_response(200, api_controller.assess_environment(reg_id))
                return

            elif subpath == "/targets":
                body = query_params.get("body", [None])[0]
                self._send_json_response(200, api_controller.get_target_profiles(body=body))
                return

            elif subpath.startswith("/targets/"):
                tgt_id = subpath.split("/")[2]
                tgt = api_controller.get_target_profile_by_id(tgt_id)
                if tgt:
                    self._send_json_response(200, tgt)
                else:
                    self._send_json_response(404, {"error": "Target profile not found"})
                return

            elif subpath == "/environment/events":
                region_id = query_params.get("region_id", [None])[0]
                self._send_json_response(200, api_controller.get_environment_events(region_id=region_id))
                return

            elif subpath.startswith("/ar/regions/") and subpath.endswith("/scene"):
                reg_id = subpath.split("/")[3]
                self._send_json_response(200, api_controller.get_ar_scene(reg_id))
                return

            elif subpath.startswith("/exports/regions/"):
                reg_id = subpath.split("/")[3]
                self._send_json_response(200, api_controller.export_region_summary(reg_id))
                return

            else:
                self._send_json_response(404, {"error": f"Endpoint '{subpath}' not found"})
                return

        # 2. STATIC ASSETS ROUTING
        # Default index.html
        if path == "/" or path == "":
            self.path = "/index.html"
            return super().do_GET()

        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(content_length) if content_length > 0 else b"{}"
        try:
            body_json = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except Exception:
            body_json = {}

        if path == "/api/v1/similarity/runs":
            target_id = body_json.get("target_id", "tgt_mars_jezero")
            params = body_json.get("parameters", {})
            res = api_controller.run_similarity(target_id, params)
            self._send_json_response(200, res)
            return

        elif path == "/api/v1/reverse-search":
            query = body_json.get("query", "")
            filters = body_json.get("filters", {})
            res = api_controller.reverse_search(query, filters)
            self._send_json_response(200, res)
            return

        elif path == "/api/v1/environment/events":
            res = api_controller.log_environment_event(body_json)
            self._send_json_response(201, res)
            return

        elif path == "/api/v1/simulation/runs":
            reg_id = body_json.get("region_id", "reg_pinacate")
            scenario_type = body_json.get("scenario_type", "ROVER_MOBILITY")
            params = body_json.get("parameters", {})
            res = api_controller.run_simulation(reg_id, scenario_type, params)
            self._send_json_response(200, res)
            return

        else:
            self._send_json_response(404, {"error": f"POST endpoint '{path}' not found"})

def run_server(port: int = 8000):
    populate_database()
    print(f"==================================================")
    print(f"TerraAnalog Server running on http://127.0.0.1:{port}")
    print(f"Open http://127.0.0.1:{port}/ in your web browser")
    print(f"==================================================")
    with socketserver.TCPServer(("", port), TerraAnalogHTTPRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down TerraAnalog server...")

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port)
