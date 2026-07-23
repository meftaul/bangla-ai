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
    - Instructions - Guardrails
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

Slide 07:

  AI Agent Design Patterns

  Sub-Slide 01:
    Reflection Pattern: The AI reviews its own work to spot mistakes and iterate until it produces the final response.

  Sub-Slide 02:
    Tool Use Pattern: Tools allow LLMs to gather more information by:
      ● Querying a vector database
      ● Executing Python scripts
      ● Invoking APIs, etc.
      This is helpful since the LLM is not solely reliant on its internal knowledge.

  Sub-Slide 03:
    ReAct Pattern: ReAct combines the above two patterns:
      ● The Agent reflects on the generated outputs.
      ● It interacts with the world using tools.
      A ReAct agent operates in a loop of Thought → Action → Observation, repeating
      until it reaches a solution or a final answer. This is analogous to how humans
      solve problems:

  Sub-Slide 04:
    Planning Pattern: Instead of solving a task in one go, the AI creates a roadmap by:
      ● Subdividing tasks
      ● Outlining objectives
      This strategic thinking solves tasks more effectively.

  Sub-Slide 05:
    Multi-Agent Pattern: 
      ● There are several agents, each with a specific role and task.
      ● Each agent can also access tools.
      All agents work together to deliver the final outcome, while delegating tasks to
      other agents if needed.

---

Slide 08:

  Challenges & Risks:

    An agent's accuracy is a distribution, not a guarantee.
    - **Confabulated tool results:** the model _says_ "I checked the account and found no issues" — without having actually called the tool.
    - **Wrong-argument calls:** it calls the right tool with a plausible-but-wrong account number.
    - **Misread results:** the tool returns correct data; the model summarizes it incorrectly.

---

Slide 09:

  Human-in-the-Loop: 

    For every _action_ your agent can take (not the agent as a whole — each action), choose a level:

    | Level                          | Pattern                                            | Example in banking                                      |
    | ------------------------------ | -------------------------------------------------- | ------------------------------------------------------- |
    | **1. Human does, AI assists**  | AI drafts/suggests; human performs the action      | Agent drafts the credit memo; analyst edits and submits |
    | **2. AI does, human approves** | Action queued until a human clicks approve         | Reversal above BDT 50,000 waits for supervisor sign-off |
    | **3. AI does, human monitors** | Action executes; humans watch dashboards & samples | Auto-answering balance/statement queries                |
    | **4. AI does, human audits**   | Fully autonomous; periodic review only             | Categorizing transactions for spending insights         |

---

Slide 10:

  **Best Approach is to eliminate the need for AI agents**

  Checklist:
    - Gate 1 — Does it need intelligence at all?
      - Can you write the rules?
      If the task is fully specifiable — fee calculation, standing-order execution, limit checks — **write code.** Code is cheaper, faster, deterministic, and auditable by reading it.
      
    - Gate 2 — Does it need agency, or just a model call?
      - Is the path through the task variable?
      If every instance follows the same steps ("extract these 6 fields from this document type"), you want a **workflow with an LLM step** not an agent.
      
    - Gate 3 — Is the value real?
      - Volume × cost-per-instance × current pain. Ten cases a month that a specialist enjoys handling? Leave it alone. Four thousand cases a month that burn out your ops team? That's an agent candiate.
    
    - Gate 4 — Can you afford the failure modes?
      - What's the worst plausible action, and is it survivable?
      
    - Gate 5 — Can you evaluate it?
      - Do you have (or can you build) a set of real cases with known-correct outcomes?
      If you can't measure success, you can't ship responsibly. No evals, No agent.
      
    - Gate 6 — Can you supervise it?
      -  Do you have the human capacity for the review levels the risk demands.

  ---

  Slide 11: 

    Future of AI Agents: My Perspective

    **Agents become boring.** The hype cycle ends the way it always does: the technology disappears into infrastructure. "AI agent" will sound like "cloud-native" does today — once thrilling, now just how software is built.

    **Standardization wins.** Protocols like MCP (for connecting agents to tools/data) are doing for agents what HTTP did for the web. Expect your core banking vendors to ship official agent connectors, the way they ship APIs today.

    Open Questions: I don't know answers. Time will tell. 
     - When both fraudsters and fraud-fighters wield agents, does the equilibrium favor attack or defense?
     - If agents handle all junior-analyst work, where do senior analysts come from?

----

Slide 12: 

  How can I prepare for the future of AI agents?

  Sub Slide 01:
    1. Strong Fundamentals
    2. Strong Fundamentals
    3. Strong Fundamentals

  Sub Slide 02:
    1. Treat AI as assistant. If your assistant dictes you, you, become replaceable.

  Sub Slide 03:
    1. We do not compete with F1 cars. 
    2. Use AI as productivity booster.

  Sub Slide 04:
    1. Use latest AI models.
    2. Latest Coding agents
    3. Automate mundane tasks.

---

Slide 13:   
  
  Thank you for your attention.
