"""
Fetch Striver's A2Z DSA Sheet from its official public page on takeuforward.org
and write a compact, ordered JSON file used by the DSA SHEET page.

Only problem titles, ordering, section structure, difficulty and links are kept.
No problem statements or article content are copied — every row links back to
takeUforward for the actual content.

Usage:  python scripts/fetch_a2z_sheet.py
Output: src/data/a2z-sheet.json (+ src/data/a2z-meta.json)
"""

import datetime
import json
import pathlib
import re
import urllib.request

SOURCE_URL = "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2"
BASE = "https://takeuforward.org"
DATA_DIR = pathlib.Path(__file__).resolve().parent.parent / "src" / "data"
OUT = DATA_DIR / "a2z-sheet.json"
META_OUT = DATA_DIR / "a2z-meta.json"  # tiny file the landing page can import eagerly

# takeUforward's own UI maps these internal levels to Easy / Medium / Hard.
DIFFICULTY = {"basic": "Easy", "core": "Medium", "pro": "Hard"}


def fetch_html(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Rapid_Reference sheet sync)"})
    with urllib.request.urlopen(req, timeout=60) as res:
        return res.read().decode("utf-8", errors="replace")


def extract_payload(html: str) -> dict:
    """The page is a Next.js RSC stream; the sheet lives in one of its JSON lines."""
    chunks = re.findall(r'self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)', html)
    payload = "".join(json.loads('"' + c + '"') for c in chunks)
    idx = payload.find('"sheet_syllabus"')
    if idx < 0:
        raise SystemExit("Could not find sheet_syllabus in page payload — the page format may have changed.")
    start = payload.rfind("\n", 0, idx) + 1
    end = payload.find("\n", idx)
    line_id, body = payload[start:end].split(":", 1)
    return line_id, json.loads(body)


def main() -> None:
    html = fetch_html(SOURCE_URL)
    line_id, obj = extract_payload(html)
    syllabus = obj["sheet"]["sheet_syllabus"]
    fields, rows = syllabus["fields"], syllabus["rows"]
    ref = re.compile(r"^\$" + re.escape(line_id) + r":(.*)$")

    def resolve(v):
        if isinstance(v, str):
            m = ref.match(v)
            if m:
                cur = obj
                for part in m.group(1).split(":"):
                    cur = cur[int(part)] if isinstance(cur, list) else cur[part]
                return resolve(cur)
            return v
        if isinstance(v, list):
            return [resolve(x) for x in v]
        if isinstance(v, dict):
            return {k: resolve(x) for k, x in v.items()}
        return v

    decoded = []
    for r in rows:
        schema = fields[r[0]]
        decoded.append({k: resolve(v) for k, v in zip(schema, r[1:])})

    def link(path):
        if not path or not isinstance(path, str):
            return None
        return path if path.startswith("http") else BASE + path

    def tag_names(tags):
        if not isinstance(tags, list):
            return []
        return [t["name"].strip() for t in tags if isinstance(t, dict) and t.get("name")]

    counter = 0
    sections = []
    for root in syllabus["roots"]:
        sec = decoded[root]
        groups = []
        for child in sec["children"]:
            grp = decoded[child]
            if grp["type"] != "category":
                continue
            items = []
            for leaf in grp["children"]:
                it = decoded[leaf]
                if it["type"] != "item":
                    continue  # skip platform contests
                counter += 1
                red = it.get("redirectTo") or {}
                kind = "lesson" if it.get("layoutType") == "learning" else "practice"
                route = "learning" if kind == "lesson" else "practice"
                item = {
                    "id": it["id"],
                    "n": counter,
                    "title": it["label"].strip(),
                    "kind": kind,
                    "difficulty": DIFFICULTY.get(it.get("difficulty")),
                    "url": f"{BASE}/{route}/dsa/{red.get('itemSlug', it['slug'])}"
                           f"?category={red.get('category', grp['slug'])}&source=strivers-a2z-dsa-sheet",
                }
                if it.get("yt_video"):
                    item["video"] = it["yt_video"]
                if link(it.get("free_blog_link")):
                    item["article"] = link(it.get("free_blog_link"))
                if it.get("leetcode_link"):
                    item["leetcode"] = it["leetcode_link"]
                tags = tag_names(it.get("topic_tags")) + tag_names(it.get("pattern_tags"))
                if tags:
                    item["tags"] = sorted(set(tags))
                items.append(item)
            groups.append({"id": f"{sec['slug']}--{grp['slug']}", "title": grp["label"].strip(), "items": items})
        sections.append({"id": sec["slug"], "title": sec["label"].strip(), "groups": groups})

    all_items = [i for s in sections for g in s["groups"] for i in g["items"]]
    data = {
        "meta": {
            "name": "Striver's A2Z DSA Sheet",
            "author": "Striver (Raj Vikramaditya) — takeUforward",
            "source": SOURCE_URL,
            "fetchedAt": datetime.date.today().isoformat(),
            "total": len(all_items),
            "practice": sum(1 for i in all_items if i["kind"] == "practice"),
            "lessons": sum(1 for i in all_items if i["kind"] == "lesson"),
        },
        "sections": sections,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    meta = dict(data["meta"], sections=len(sections))
    META_OUT.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} — {data['meta']['total']} items "
          f"({data['meta']['practice']} practice, {data['meta']['lessons']} lessons) in {len(sections)} sections")


if __name__ == "__main__":
    main()
