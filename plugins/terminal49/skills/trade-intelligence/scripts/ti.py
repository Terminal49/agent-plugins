#!/usr/bin/env python3
"""Call Terminal49's trade intelligence API and print the JSON response.

Usage:
  ti.py meta
  ti.py companies/search '{"name": "home depot", "limit": 10}'
  ti.py trends '{"filters": {"hs4": "9403"}, "group_by": ["origin_country"], "interval": "quarter"}'

Endpoints: meta, companies/search, companies/profile, commodities/search, importers/top, trends, breakdown.

Auth: a Terminal49 API key from T49_API_KEY, or the first line of ~/.t49_api_key. The key is never printed.
T49_API_BASE overrides the host (default https://api.terminal49.com).
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ENDPOINTS = {
    "meta": "GET",
    "companies/search": "POST",
    "companies/profile": "POST",
    "commodities/search": "POST",
    "importers/top": "POST",
    "trends": "POST",
    "breakdown": "POST",
}


def api_key():
    key = os.environ.get("T49_API_KEY", "").strip()
    if not key:
        path = Path.home() / ".t49_api_key"
        if path.exists():
            key = path.read_text().strip().splitlines()[0].strip() if path.read_text().strip() else ""
    if not key:
        sys.exit("No API key: set T49_API_KEY or put the key in ~/.t49_api_key (chmod 600).")
    return key.removeprefix("Token ").strip()


def main(argv):
    if len(argv) < 2 or argv[1] in ("-h", "--help") or argv[1].strip("/") not in ENDPOINTS:
        sys.exit(__doc__)
    endpoint = argv[1].strip("/")
    method = ENDPOINTS[endpoint]
    body = None
    if method == "POST":
        try:
            body = json.dumps(json.loads(argv[2] if len(argv) > 2 else "{}")).encode()
        except json.JSONDecodeError as e:
            sys.exit(f"Request body is not valid JSON: {e}")
    base = os.environ.get("T49_API_BASE", "https://api.terminal49.com").rstrip("/")
    req = urllib.request.Request(
        f"{base}/v2/trade_intel/{endpoint}",
        data=body,
        method=method,
        headers={"Authorization": f"Token {api_key()}", "Content-Type": "application/json", "Accept": "application/json"},
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                print(json.dumps(json.load(resp), indent=1, ensure_ascii=False))
                return 0
        except urllib.error.HTTPError as e:
            text = e.read().decode(errors="replace")
            if e.code == 429 and attempt < 2:
                time.sleep(20)
                continue
            if e.code in (502, 504) and attempt < 1:
                time.sleep(2)
                continue
            hint = {
                401: "The API key was rejected (wrong, revoked, or from another environment).",
                403: "Trade intelligence is not enabled for this account; contact Terminal49 (support@terminal49.com) to turn it on.",
                429: "Rate limit (about 120 requests a minute); wait a minute and retry.",
                502: "The trade data service is unavailable right now; try again shortly.",
                504: "The request timed out; retry once.",
            }.get(e.code, "")
            print(f"HTTP {e.code}. {hint}\n{text}", file=sys.stderr)
            return 1
        except urllib.error.URLError as e:
            print(f"Could not reach {base}: {e.reason}", file=sys.stderr)
            return 1
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
