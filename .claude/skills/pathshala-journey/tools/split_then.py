"""Split an overlong <Then> into a follow-up task, or fold an aside into a <SideQuest>,
without retyping a word of the author's text (SKILL.md §3.1). A split adds a step:
only split when the journey stays at 11 steps or fewer.

Use from the repo root as a module:

    PYTHONPATH=.claude/skills/pathshala-journey/tools python3 - <<'EOF'
    from split_then import split, side
    f = "03e_crow_king.mdx"
    split(f, "What if the stall were to the west,",   # first words of the block that starts the 2nd half
          "Now let's move the stall the other way.",  # setup line of the new step
          "If the stall is west, the card is (−3, 4). How far does Samin walk in all?",
          ["7", "1", "5"], 0,                         # options, index of the right one
          "How many squares is walking 3 squares west?",  # hint, after a wrong pick
          "3 west is still 3 squares walked: 3 + 4 = 7.")  # praise = pass note
    side(f, "This isn't just a fair game.", "<PandaGibbon />", "Panda or gibbon? Fooling a model")
    EOF

split() closes the <Then> and <Step> just before `at`, and opens a new <Step> with the
setup line, a self-closing <Check>, and a <Then> that carries on with `at` and
everything after it. Put the right answer anywhere but always A: pass `ans` for where it
sits in `opts`. side() wraps from `start` to the end of the block holding `end` in a
<SideQuest title=…>, and adds SideQuest to the journey import. Strings may not contain
ASCII double quotes (use “ ”). Both assert the anchor text is unique.
"""
import re

D = "src/content/articles/math_for_ai/"


def _clean(x):
    assert '"' not in x, f"ASCII double quote in: {x}"
    return x


def split(f, at, setup, q, opts, ans, hint, praise, heading=None):
    p = D + f
    s = open(p).read()
    assert s.count(at) == 1, (f, at[:40], s.count(at))
    i = s.index(at)
    assert s.rfind("<Then>", 0, i) > s.rfind("</Then>", 0, i), f"{at[:40]} is not inside a <Then>"
    o = "\n".join(f'    "{_clean(x)}",' for x in opts)
    head = f"## {heading}\n\n" if heading else ""
    block = (
        f"</Then>\n\n</Step>\n\n<Step>\n\n{head}{setup}\n\n<Check\n  question=\"{_clean(q)}\"\n"
        f"  options={{[\n{o}\n  ]}}\n  answer={{{ans}}}\n  hint=\"{_clean(hint)}\"\n"
        f"  praise=\"{_clean(praise)}\"\n/>\n\n<Then>\n\n"
    )
    open(p, "w").write(s[:i] + block + s[i:])


def side(f, start, end, title):
    p = D + f
    s = open(p).read()
    assert s.count(start) == 1, (f, start[:40], s.count(start))
    i = s.index(start)
    j = s.index(end, i) + len(end)
    k = s.find("\n\n", j)
    k = len(s) if k < 0 else k
    s = s[:i] + f'<SideQuest title="{_clean(title)}">\n\n' + s[i:k] + "\n\n</SideQuest>" + s[k:]
    s = re.sub(
        r'import \{([^}]*)\} from "@/components/journey/journey";',
        lambda m: m.group(0) if "SideQuest" in m.group(1)
        else "import {" + m.group(1).rstrip() + ', SideQuest } from "@/components/journey/journey";',
        s,
        count=1,
    )
    open(p, "w").write(s)
