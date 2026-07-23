# Agentic AI
Understand the Future of Intelligent Systems & Career Guideline

---
Slide 01:

The need for AI Agent:

  Sub-slide-01:
  
    Senario 01:
    Problem: Fund transfer precedure, transfer balance from one account to another
    Solution: Deterministic steps, solid, well tested applications

  Sub-slide-02:
  
    Senario 02:
    Problem: Classify customer emails / complaints into categories initiate appropriate actions

    Solution: Traditional programming unable to extract relevant information. LLM with relevant tools and knowledge to extract and classify information. And Agentic capabilities can perform actions and inform relevant stakeholders.

---

Slide 02:

Based on the senario 2, we have two main points. 
  - Extract relevant information from customer emails / complaints - Can be done by calling LLM with relevant tools and knowledge.
  - To perform actions and inform relevant stakeholders - We need AI Agents

  Sub-slide-01:
    - A chatbot just talks. Its output is words. Even a very smart LLM-powered chatbot is fundamentally a text-in, text-out system.
    - Useful! But nothing in the world changed. It retrieved and rephrased information.

  Sub-slide-02:
    - An agent acts. Its output includes side effects on real systems.

  Sub-slide-03:
    - A chatbot is a librarian. An agent is an intern with system access.

---

Slide 03:

Chatbot to Agent:

```
FAQ bot → RAG chatbot → Chatbot with read-only tools → Agent with write access → Autonomous multi-step agent
 (talks)    (talks with     (looks things up)             (changes things)         (plans & changes things)
             knowledge)
```

---

Slide 04:

Why Agents are important at this time?

1. **LLMs got good at reasoning and tool use.** Modern models can read a task, decide "I need to look up the account first," call an API, read the result, and decide what to do next. That loop — _think, act, observe, repeat_ — is the beating heart of every agent.
2. **The glue got standardized.** Function calling, structured outputs, and protocols like MCP (Model Context Protocol) mean connecting a model to your core banking API is now days of work, not months.
3. **The economics flipped.** Model costs dropped fast enough that "have an AI attempt this and a human verify it" became cheaper than "have a human do all of it" for many workflows.

---

Slide 05:

Anatomy of an AI Agent
  - LLM (the brain) - Reasoning engine, you can think of a CPU inside a computer
  - Instructions (System Prompt / Policy)
    - Role
    - Boundary
    - Process hints
    - Tone and compliance
  - Tools (The hand)
    - The agent is only as capable as its tools.
    - The agent is only as safe as its tools.
  - Memory 
    - Short-term memory (current context)
    - Long-term memory (knowledge base / External storage)
  - Agent Loop
    - Think, Act, Observe, Repeat

---

Slide 06:

See how agent works?

Let's trace one real request end-to-end, because abstractions hide the interesting parts.

**Scenario:** A customer messages the bank's app:

> _"Hey, I think my card got charged for a subscription I cancelled last month. Netflix or something. Can you check?"_

Step-by-step

**Turn 1 — Understand & plan.** The model reads the message plus its instructions. Nothing here is a valid API query yet — "Netflix or something," "last month" — it's all fuzzy. The model plans: _find the customer's recent card transactions, filter for streaming merchants._

**Turn 2 — Act.** It calls:

```json
{
  "tool": "get_transactions",
  "args": { "account_id": "8842-XX", "days": 45, "category": "subscription" }
}
```

**Turn 3 — Observe.** The tool returns three charges: Netflix (BDT 1,100, 12 days ago), Spotify, and a gym membership.

**Turn 4 — Reason with new information.** A rules-based system would be stuck: the customer said "cancelled," but the bank's system shows an active recurring charge. The model recognizes the classic pattern — _cancellations often take one billing cycle to reflect_ — and also knows (from instructions) it can't just assume. So it acts again:

**Turn 5 — Act again.** Calls `check_recurring_status("NETFLIX")` → returns "cancellation received, effective next cycle; current charge is final billing."

**Turn 6 — Respond.**

> _"I found the Netflix charge of BDT 1,100 from 12 days ago. Good news: your cancellation went through — this was the final billing for your last active month, and no further charges will occur. If you believe even this final charge is incorrect, I can raise a formal dispute — want me to?"_

---
