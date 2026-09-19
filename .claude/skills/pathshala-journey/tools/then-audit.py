#!/usr/bin/env python3
"""Measure every <Then> in the journeys against the one-screen budget (SKILL.md §3.1).

Run from the repo root:
    python3 .claude/skills/pathshala-journey/tools/then-audit.py            # every journey
    python3 .claude/skills/pathshala-journey/tools/then-audit.py <file.mdx> # one journey

Per step it prints paragraphs / words / figures / tables in the <Then> (text inside a
<SideQuest> doesn't count, it lives in a sheet). OVER marks a <Then> past the budget:
more than ~100 words beside a figure (~110 with none), 3+ figures, or a <Table>. Older
journeys without <Then> are measured on the paragraphs after the step's last widget.
"""
import glob
import re
import sys

files = sys.argv[1:] or sorted(glob.glob("src/content/articles/math_for_ai/*.mdx"))
for f in files:
    s = open(f).read()
    if "<Journey" not in s:
        continue
    steps = re.findall(r"<Step>(.*?)</Step>", s, re.S)
    rows = []
    for i, st in enumerate(steps, 1):
        m = re.search(r"<Then>(.*?)</Then>", st, re.S)
        if m:
            body = m.group(1)
        else:  # pre-<Then> journeys: the words after the last widget
            blocks = [b.strip() for b in re.split(r"\n\s*\n", st) if b.strip()]
            last = max((j for j, b in enumerate(blocks) if re.match(r"<[A-Z]", b) and " story" not in b), default=-1)
            body = "\n\n".join(blocks[last + 1:]) if last >= 0 else ""
        body = re.sub(r"<SideQuest.*?</SideQuest>", "", body, flags=re.S)
        blocks = [b.strip() for b in re.split(r"\n\s*\n", body) if b.strip()]
        paras = [b for b in blocks if not b.startswith(("<", "$$", "</"))]
        figs = [b for b in blocks if re.match(r"<[A-Z]\w*\s*/>", b)]
        tables = body.count("<Table")
        words = sum(len(p.split()) for p in paras)
        if not blocks:
            continue
        over = words > (100 if figs else 110) or len(figs) >= 3 or tables
        rows.append(f"  step {i:>2}: {len(paras)}p {words:>3}w {len(figs)}fig {tables}table{'  OVER' if over else ''}")
    print(f"{f}  ({len(steps)} steps)")
    print("\n".join(rows))
