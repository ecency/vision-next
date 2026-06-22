#!/usr/bin/env python3
"""Build a compact cities dataset for the geo-tag offline typeahead.

Source: GeoNames cities15000 (cities with population > 15000, ~26k places).
Output: a compact JSON consumed by the publish geo-tag picker for instant,
offline, no-API fuzzy search. Diacritics are kept in the display name and
stripped client-side at search time.
"""
import csv
import io
import json
import os
import sys
import urllib.request
import zipfile

BASE = "https://download.geonames.org/export/dump"
# Output is repo-relative so the dataset can be regenerated from a fresh clone:
#   python3 scripts/build-cities-dataset.py
OUT = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..",
    "apps",
    "web",
    "public",
    "geo",
    "cities.min.json",
)


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "ecency-geo-build/1.0"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def main() -> int:
    print("Downloading countryInfo.txt ...")
    country_names = {}
    for line in fetch(f"{BASE}/countryInfo.txt").decode("utf-8").splitlines():
        if line.startswith("#") or not line.strip():
            continue
        cols = line.split("\t")
        if len(cols) > 4:
            country_names[cols[0]] = cols[4]  # ISO -> country name

    print("Downloading admin1CodesASCII.txt ...")
    admin1 = {}
    for line in fetch(f"{BASE}/admin1CodesASCII.txt").decode("utf-8").splitlines():
        if not line.strip():
            continue
        cols = line.split("\t")
        if len(cols) >= 2:
            admin1[cols[0]] = cols[1]  # "LT.56" -> "Kaunas County"

    print("Downloading cities15000.zip ...")
    zbytes = fetch(f"{BASE}/cities15000.zip")
    with zipfile.ZipFile(io.BytesIO(zbytes)) as zf:
        raw = zf.read("cities15000.txt").decode("utf-8")

    rows = []
    used_cc = set()
    reader = csv.reader(io.StringIO(raw), delimiter="\t")
    for c in reader:
        # geoname schema columns
        name = c[1]
        lat = round(float(c[4]), 4)
        lng = round(float(c[5]), 4)
        cc = c[8]
        admin1_code = c[10]
        pop = int(c[14] or 0)
        region = admin1.get(f"{cc}.{admin1_code}", "")
        used_cc.add(cc)
        # compact tuple: [name, region, cc, lat, lng] + pop (sort key, stripped below)
        rows.append([name, region, cc, lat, lng, pop])

    # rank by population desc so the most relevant matches surface first;
    # the array order then *is* the popularity rank, so pop is dropped from output.
    rows.sort(key=lambda r: -r[5])
    for r in rows:
        r.pop()  # drop pop -> [name, region, cc, lat, lng]

    countries = {cc: country_names.get(cc, cc) for cc in sorted(used_cc)}

    payload = {
        "v": 1,
        "source": "GeoNames cities15000 (CC BY 4.0)",
        "fields": ["name", "region", "cc", "lat", "lng"],
        "countries": countries,
        "cities": rows,
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))

    size = os.path.getsize(OUT)
    print(f"Wrote {len(rows)} cities -> {OUT} ({size/1024:.0f} KiB raw)")
    print("Sample:", json.dumps(rows[0], ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
