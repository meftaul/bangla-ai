title: using coding agents effectively. 
subtitle: let's start with claude code. 

1.
Web vs CLI? 

Strengths of CLI: 
  It sees your whole project.
  No more copy-pasting code into a chat window.
  It does the work, not just talks.
  Installs things, runs the app, runs the tests.
  It checks its own work.
  Writes code → tests it → sees mistakes → fixes them.
  Changes are easy to review.
  You see exactly what changed, line by line.
  It can run on autopilot.
  On a schedule or inside other tools — a browser tab can’t.

Strengths of Web:  
  Web chat is still great for ideas, learning, and quick questions.
  The terminal agent wins the moment the work is inside your own project.


  *The point is “right tool for the job” — not “web chat is useless.”*

Quiz: 
  Determine which tool is better for which situation.

2.
The Mind Shift:

  Your value shifts from fast typing to clear instructions.
  It's like leading a small team.
  Check the result carefully — like reviewing a new team member’s work.

3.
It can infer your intent but can't read your mind.

  *The more precise your instructions, the fewer corrections you’ll need.*

4.
Write Good Prompts / Instructions]

  Before you hit enter, check that your prompt names all three:
  T · C · D — every good prompt names the…
    Task — what, concretely, do you want done?
    Context — the constraints, files, examples, or background only you know.
    Done-signal — what does a good result look like? How would you check it?
  
  
  The same request, vague and sharp, in each of your three arenas: (sharp version : split into task, context, and done-signal, keep in fragments)
  Vague · coding“add tests for foo.py”
  Sharp · coding“write a test for foo.py covering the edge case where the user is logged out. avoid mocks. run the tests after.”
  Vague · writing“make this email better”
  Sharp · writing“tighten this email to a busy client to under 120 words, warm but direct, ending with one clear ask: a call next week.”

5.
Understand the context window :

(create a context window visualizer) - simulate a context window by showing the model's current context and how it interacts with the user

Default Instruction + claude code + skills

6.
CLAUDE.md / AGENTS.md

What to put in? 
rules that need  to follow in each conversation
keep it ruthlessly concise
review it periodically
skip obvious things that model can infer easily without mistaking.

7.
SKILL.md

understand skill in the context window, simulate loading skill from disk and effects in the context window

8.
Let's build our first SKILL.md

(simulate the building of a skill that turns a vague request into a well-structured T.C.D SKILL.md)

show the audience how to create a SKILL.md, left side the instructions and right side teminal show the output look like.
instruction create directory structure, create file, yml frontmatter parameters, body

Usage: 
run the skill and show the output

9.
Managing the session:

  /clear between unrelated tasks
  Course-correct early; don't let a wrong turn compound.
  Two-correction rule: if two nudges don't fix it, reset and re-frame.

10.
Adding external context:

  Files — @ In Claude Code, type @src/auth.ts and Claude reads the actual file, not your description of it.
  Images — paste or drag Drop in a screenshot of the bug, the design, the broken layout. A picture carries what a sentence can’t.
  URLs — give the link Point at the real docs or API page instead of recalling it from memory. (Allowlist frequent domains with /permissions.)
  Raw data — pipe it in cat error.log | claude sends the file’s contents straight in—no copy-paste, no truncation.

11.
Let's create a workflow using skill:

adding new-endpoint -> controller > command > Command Handler, Service, Repository
finding bugs -> interview skill for clarifications, find the exact location of the bug -> create plan
