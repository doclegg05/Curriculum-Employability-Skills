"""Generate money-management-lesson-map.html: a Gantt of the draft lesson (diagram-design, SPOKES skin).

Edit ZONES when a segment changes status or time, then run:
    python3 lesson-Money-Management/build_lesson_map.py
Fonts are self-hosted from fonts/ (SPOKES-STANDARD TYP-05), so the diagram-design self-check
flags the two @font-face url() lines; everything else passes it.
"""
import sys
from pathlib import Path
from xml.sax.saxutils import escape

OUT = sys.argv[1] if len(sys.argv) > 1 else str(Path(__file__).resolve().parent / "money-management-lesson-map.html")
INK, MUTED, ACCENT, PAPER, PAGE = "#00133f", "#60636b", "#007baf", "#ffffff", "#edf3f7"
RULE = "rgba(0,19,63,0.12)"
X0, PX = 272, 8          # timeline origin, pixels per minute
SLUG = "money-management-lesson-map"

ZONES = [  # (label, [(name, sub, start, end, status)])
    ("WARM-UP · INTRODUCTION", [("Warm-up · intro animation", "5 MIN", 0, 5, "ready"),
                                ("Introduction · Meet Jess", "OBJECTIVES · RUBRIC · 5 MIN", 5, 10, "ready")]),
    ("PRESENTATION · KNOW AND PLAN", [("Part 1 · Know Your Money", "OBJ 1 · 12 MIN", 10, 22, "build"),
                                      ("Part 2 · Save First", "OBJ 2 · 12 MIN", 22, 34, "focal")]),
    ("PRESENTATION · KEEP MORE OF IT", [("Part 4 · Money Leaks", "OBJ 3 · 12 MIN", 34, 46, "ready"),
                                        ("Part 6 · Lower Your Bills", "OBJ 3 · 12 MIN", 46, 58, "ready"),
                                        ("Part 3 & 5 · Shop Smarter", "OBJ 4 · 12 MIN", 58, 70, "build")]),
    ("PRACTICE · SPEND AND PROTECT", [("Part 8 · Better Buying", "OBJ 5 · 12 MIN", 70, 82, "build"),
                                      ("Part 7 · Protect Your Money", "OBJ 5 · 12 MIN", 82, 94, "ready"),
                                      ("Knowledge check", "5 MIN", 94, 99, "build")]),
    ("EVALUATION", [("Part 9 · Scenario + exit ticket", "OBJ 6 · 17 MIN", 99, 116, "build")]),
    ("APPLICATION", [("Application · one next step", "OBJ 7 · 5 MIN", 116, 121, "ready")]),
]

SANS = "'Outfit', 'Segoe UI', system-ui, sans-serif"
svg = []
add = svg.append
y = 72
zones_out, rows_out = [], []
for label, rows in ZONES:
    h = 16 + 40 * len(rows)
    zones_out.append(f'<rect x="12" y="{y}" width="1256" height="{h}" rx="6" fill="rgba(0,19,63,0.025)" stroke="{RULE}" stroke-width="0.8"/>')
    zones_out.append(f'<text x="20" y="{y + 12}" fill="{MUTED}" font-size="8" font-weight="600" font-family="{SANS}" letter-spacing="0.14em">{escape(label)}</text>')
    for i, row in enumerate(rows):
        rows_out.append((y + 16 + 40 * i, row))
    y += h + 12
bottom = y - 12
legend_y = bottom + 20
height = legend_y + 60

ticks = []
for m in range(0, 121, 15):
    x = X0 + PX * m
    ticks.append(f'<line x1="{x}" y1="64" x2="{x}" y2="{bottom}" stroke="rgba(0,19,63,0.06)" stroke-width="0.6"/>')
    lab = f"{m} MIN" if m == 120 else str(m)
    ticks.append(f'<text x="{x}" y="52" fill="{MUTED}" font-size="9" font-weight="600" font-family="{SANS}" text-anchor="middle">{lab}</text>')

bars = []
for ry, (name, sub, s, e, status) in rows_out:
    bx, bw = X0 + PX * s, PX * (e - s)
    name_fill = ACCENT if status == "focal" else INK
    bars.append(f'<text x="20" y="{ry + 18}" fill="{name_fill}" font-size="11" font-weight="600" font-family="{SANS}">{escape(name)}</text>')
    bars.append(f'<text x="20" y="{ry + 30}" fill="{MUTED}" font-size="8" font-weight="500" font-family="{SANS}" letter-spacing="0.08em">{escape(sub)}</text>')
    bars.append(f'<rect x="{bx}" y="{ry + 8}" width="{bw}" height="24" rx="4" fill="{PAPER}"/>')
    if status == "focal":
        bars.append(f'<rect x="{bx}" y="{ry + 8}" width="{bw}" height="24" rx="4" fill="rgba(0,123,175,0.14)" stroke="{ACCENT}" stroke-width="1.2"/>')
    elif status == "ready":
        bars.append(f'<rect x="{bx}" y="{ry + 8}" width="{bw}" height="24" rx="4" fill="rgba(96,99,107,0.16)" stroke="{MUTED}" stroke-width="1"/>')
    else:
        bars.append(f'<rect x="{bx}" y="{ry + 8}" width="{bw}" height="24" rx="4" fill="{PAPER}" stroke="{MUTED}" stroke-width="1" stroke-dasharray="5,4"/>')

legend = [
    f'<line x1="20" y1="{legend_y}" x2="1260" y2="{legend_y}" stroke="{RULE}" stroke-width="0.8"/>',
    f'<text x="20" y="{legend_y + 16}" fill="{MUTED}" font-size="8" font-weight="600" font-family="{SANS}" letter-spacing="0.18em">LEGEND</text>',
]
items = [("focal", "Part 2 · built, reference segment"), ("ready", "Materials ready"),
         ("build", "Team to build or finish"), ("zone", "WIPPEA stage")]
lx = 20
for kind, text in items:
    sy = legend_y + 28
    if kind == "focal":
        sw = f'<rect x="{lx}" y="{sy}" width="20" height="12" rx="3" fill="rgba(0,123,175,0.14)" stroke="{ACCENT}" stroke-width="1"/>'
    elif kind == "ready":
        sw = f'<rect x="{lx}" y="{sy}" width="20" height="12" rx="3" fill="rgba(96,99,107,0.16)" stroke="{MUTED}" stroke-width="1"/>'
    elif kind == "build":
        sw = f'<rect x="{lx}" y="{sy}" width="20" height="12" rx="3" fill="{PAPER}" stroke="{MUTED}" stroke-width="1" stroke-dasharray="4,3"/>'
    else:
        sw = f'<rect x="{lx}" y="{sy}" width="20" height="12" rx="3" fill="rgba(0,19,63,0.025)" stroke="{RULE}" stroke-width="0.8"/>'
    legend.append(sw)
    legend.append(f'<text x="{lx + 28}" y="{sy + 10}" fill="{MUTED}" font-size="9" font-family="{SANS}">{escape(text)}</text>')
    lx += {"focal": 220, "ready": 140, "build": 180, "zone": 120}[kind]

svg_markup = f'''<svg viewBox="0 0 1280 {height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="{SLUG}-title {SLUG}-desc">
      <title id="{SLUG}-title">Money Management lesson, minute by minute</title>
      <desc id="{SLUG}-desc">The draft two-hour Money Management lesson in WIPPEA order: twelve timed parts from the warm-up to the application step, with Part 2 highlighted and the parts that teams still need to build shown dashed.</desc>
      <rect width="100%" height="100%" fill="{PAPER}"/>
      {''.join(zones_out)}
      {''.join(ticks)}
      <line x1="{X0}" y1="60" x2="{X0 + PX * 121}" y2="60" stroke="rgba(0,19,63,0.20)" stroke-width="0.8"/>
      <line x1="{X0}" y1="36" x2="{X0}" y2="{bottom}" stroke="rgba(0,19,63,0.20)" stroke-width="0.8"/>
      {''.join(bars)}
      {''.join(legend)}
    </svg>'''

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Money Management Lesson Map</title>
  <style>
    @font-face {{ font-family: "DM Serif Display"; src: url("../fonts/dm-serif-display-latin.woff2") format("woff2"); font-weight: 400; font-display: swap; }}
    @font-face {{ font-family: "Outfit"; src: url("../fonts/outfit-latin.woff2") format("woff2"); font-weight: 100 900; font-display: swap; }}
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    :root {{ --page: {PAGE}; --ink: {INK}; --muted: {MUTED}; --accent: {ACCENT}; }}
    body {{ font-family: "Outfit", "Segoe UI", system-ui, sans-serif; background: var(--page); color: var(--ink); padding: 2.5rem 16px; }}
    .frame {{ max-width: 1280px; margin: 0 auto; }}
    .eyebrow {{ font-size: 0.72rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); margin-bottom: 0.5rem; }}
    h1 {{ font-family: "DM Serif Display", Georgia, serif; font-weight: 400; font-size: clamp(1.6rem, 2.4vw + 0.8rem, 2.2rem); line-height: 1.15; margin-bottom: 1.25rem; color: #004071; }}
    .scroll {{ overflow-x: auto; border: 1px solid rgba(0,19,63,0.12); border-radius: 6px; background: #fff; }}
    svg {{ display: block; width: 100%; min-width: 1280px; }}
    .notes {{ display: grid; grid-template-columns: 1.1fr 1fr 0.9fr; gap: 12px; margin-top: 16px; }}
    .notes div {{ background: #fff; border: 1px solid rgba(0,19,63,0.12); border-radius: 6px; padding: 14px 16px; font-size: 0.95rem; line-height: 1.5; }}
    .notes b {{ display: block; font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }}
    @media (max-width: 760px) {{ .notes {{ grid-template-columns: 1fr; }} }}
  </style>
</head>
<body>
  <div class="frame">
    <p class="eyebrow">SPOKES · Money Management · Draft for team review, November 9, 2026</p>
    <h1>The Money Management lesson, minute by minute</h1>
    <div class="scroll">
    {svg_markup}
    </div>
    <div class="notes">
      <div><b>Every segment</b>About 12 minutes: a 1-minute Jess moment, 3 to 4 minutes to teach one idea, a 6-minute core activity, and 1 minute to add a line to My Money Plan.</div>
      <div><b>Third hour</b>Up to 60 more minutes of extensions, such as the full Cushion Challenge, Lower Your Bills Sheets 3 to 8, the fraud quizzes and the Spent game.</div>
      <div><b>Source</b>Handouts/Money_Management_Lesson_Plan.docx and lesson-structure.md. The chapter map is still a proposal.</div>
    </div>
  </div>
</body>
</html>
'''
with open(OUT, "w", encoding="utf-8") as fh:
    fh.write(html)
print("wrote", OUT, "height", height)
