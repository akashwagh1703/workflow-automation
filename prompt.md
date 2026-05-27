# WHATSAPP WORKFLOW AUTOMATION SAAS — MASTER BUILD PROMPT

You are a senior SaaS architect, Next.js engineer, Supabase expert, and scalable backend systems engineer.

Your task is to build a COMPLETE production-ready MVP for a:

# WhatsApp Workflow Automation SaaS

The platform should allow businesses to:
- connect WhatsApp Cloud API
- create automation workflows
- receive WhatsApp messages
- send automatic replies
- manage conversations
- manage contacts
- automate customer interactions

IMPORTANT:
This is a MINIMUM but POWERFUL SaaS MVP.

Do NOT overengineer.
Do NOT add unnecessary enterprise complexity.
Do NOT build advanced AI systems now.
Do NOT build complex billing systems now.
Do NOT build drag-drop builders now.

Focus ONLY on:
- scalable architecture
- workflow automation
- clean code
- production-ready foundation

---

# TECH STACK

Framework:
- Next.js App Router
- TypeScript

Database:
- Supabase PostgreSQL

Authentication:
- Static admin login only

WhatsApp Provider:
- Meta WhatsApp Cloud API

Styling:
- Tailwind CSS + Shadcn UI

State Management:
- Zustand or minimal clean state

Validation:
- Zod

Forms:
- React Hook Form

Realtime:
- Supabase Realtime (optional if needed)

---

# MAIN PRODUCT FLOW

Business Owner
      ↓
Login
      ↓
Add WhatsApp Credentials
      ↓
Configure Webhook
      ↓
Create Workflow
      ↓
Customer Sends Message
      ↓
Webhook Receives Message
      ↓
Router Detects Flow
      ↓
Session Continues
      ↓
Workflow Executes
      ↓
Auto Reply Sent
      ↓
Conversation Stored

---

# PROJECT GOAL

Build a CLEAN, MODULAR, SCALABLE, WORKFLOW-BASED WHATSAPP AUTOMATION SYSTEM.

The architecture MUST be:
- maintainable
- reusable
- modular
- future-ready
- queue-ready
- AI-ready later
- scalable

---

# IMPORTANT RULES

VERY IMPORTANT:

- NO hardcoded reply logic
- NO deeply nested if/else
- NO messy architecture
- NO duplicated code
- NO tightly coupled modules
- NO overengineering
- NO fake/demo-only implementations

Everything must be:
- properly structured
- production workable
- modular
- reusable

---

# AUTHENTICATION REQUIREMENTS

Use SIMPLE STATIC LOGIN.

NO signup system.
NO billing.
NO multi-user management.

Use environment credentials:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=123456

Requirements:

login page
protected dashboard routes
cookie/JWT session
middleware route protection
logout functionality
MODULES TO BUILD

Build ONLY these modules.

MODULE 1 — Authentication

Purpose:
Protect dashboard access.

Features:

static login
middleware protection
session handling
logout

Pages:

/login
protected dashboard
MODULE 2 — Dashboard Layout

Create clean SaaS dashboard UI.

Sections:

sidebar
topbar
content layout

Sidebar menus:

Dashboard
WhatsApp
Workflows
Inbox
Contacts
Settings

IMPORTANT:
Keep UI minimal but modern.

MODULE 3 — WhatsApp Integration

MOST IMPORTANT MODULE.

Purpose:
Connect Meta WhatsApp Cloud API.

Features:

save credentials
update credentials
test API connection
webhook verification
webhook status
connection status

Fields:

access token
phone number ID
business account ID
verify token

Pages:

/dashboard/whatsapp

Database Table:

whatsapp_accounts
MODULE 4 — Webhook System

Purpose:
Receive WhatsApp messages.

API Route:

/api/webhook

Features:

GET verification
POST incoming messages
payload validation
message parsing
store raw payload
trigger router

IMPORTANT:
Webhook must be production-ready.

MODULE 5 — Message Router

Purpose:
Control all incoming messages.

Responsibilities:

detect active session
continue active flow
detect triggers
start workflows
fallback handling

IMPORTANT:
Router must NOT contain business logic.

The router ONLY routes messages.

MODULE 6 — Session Engine

Purpose:
Track customer conversation state.

Features:

current flow
current step
collected data
flow progress
timeout support

Database Table:

sessions

IMPORTANT:
Sessions must persist in database.

MODULE 7 — Workflow Engine

THIS IS THE CORE PRODUCT.

Purpose:
Allow businesses to automate WhatsApp conversations.

IMPORTANT:
The workflow system MUST be dynamic.

NO hardcoded reply logic.

BAD:

if(message === "hi"){
   sendReply("Welcome")
}

GOOD:

{
  "trigger": "hi",
  "flow": "welcome_flow"
}
WORKFLOW FEATURES

Support:

trigger keywords
message steps
buttons
list messages
input collection
conditions
API calls
fallback replies
end flow
FLOW STRUCTURE

Example:

{
  "id": "welcome_flow",
  "trigger": "hi",
  "steps": [
    {
      "id": "step_1",
      "type": "message",
      "text": "Welcome to our business"
    },
    {
      "id": "step_2",
      "type": "buttons",
      "buttons": [
        "Support",
        "Pricing",
        "Order"
      ]
    }
  ]
}
MODULE 8 — Flow Executor

Purpose:
Execute workflow steps dynamically.

Create centralized executor:

executeStep(step, userMessage)

Supported step types:

message
buttons
list
input
condition
api
end

IMPORTANT:
Execution must be dynamic and reusable.

MODULE 9 — Conversations Inbox

Purpose:
Businesses can see customer chats.

Features:

conversation list
real-time messages
manual replies
customer history
conversation search

Pages:

/dashboard/inbox

Database Tables:

conversations
messages
MODULE 10 — Contacts

Purpose:
Store customer information.

Features:

customer profiles
phone number
tags
notes
workflow history

Pages:

/dashboard/contacts

Database Table:

contacts
MODULE 11 — Dashboard Stats

Keep simple.

Show:

total messages
active conversations
workflows count
contacts count
DATABASE REQUIREMENTS

Create optimized Supabase schema.

Required Tables:

whatsapp_accounts

Store API credentials.

contacts

Store customers.

Fields:

id
phone
name
tags
created_at
conversations

Conversation groups.

messages

Store all incoming/outgoing messages.

Fields:

direction
type
message
status
timestamps
flows

Workflow definitions.

flow_steps

Workflow step definitions.

sessions

Track active flow state.

Fields:

current_flow
current_step
session_data
status
last_interaction_at
REQUIRED FOLDER STRUCTURE
src/
 ├── app/
 │    ├── login/
 │    ├── dashboard/
 │    │     ├── whatsapp/
 │    │     ├── workflows/
 │    │     ├── inbox/
 │    │     ├── contacts/
 │    │     └── settings/
 │    │
 │    └── api/
 │          └── webhook/
 │
 ├── modules/
 │    ├── auth/
 │    ├── whatsapp/
 │    ├── workflows/
 │    ├── router/
 │    ├── sessions/
 │    ├── inbox/
 │    └── contacts/
 │
 ├── services/
 │    ├── flow-engine/
 │    ├── flow-executor/
 │    ├── whatsapp-service/
 │    ├── session-service/
 │    ├── router-service/
 │    └── database-service/
 │
 ├── components/
 ├── lib/
 ├── middleware/
 ├── config/
 ├── types/
 └── utils/
CLEAN CODE REQUIREMENTS

VERY IMPORTANT:

use TypeScript properly
use reusable services
use centralized validation
use centralized error handling
remove duplicate logic
use modular architecture
use async/await correctly
use environment variables properly
create scalable abstractions
UI REQUIREMENTS

Design should be:

modern
minimal
clean
responsive
SaaS-style

Use:

Tailwind
Shadcn UI

Dashboard should feel:

premium
simple
fast
FUTURE-READY ARCHITECTURE

Prepare architecture for future:

AI integration
queues
broadcasts
drag-drop builder
multi-tenant SaaS
team management

DO NOT fully implement them now.

ONLY make architecture ready.

IMPLEMENTATION STRATEGY

Build project PHASE-BY-PHASE.

Phase 1:

project setup
auth
dashboard
WhatsApp integration

Phase 2:

webhook
message storage
router
sessions

Phase 3:

workflow engine
flow executor
auto replies

Phase 4:

inbox
contacts
dashboard stats

After each phase:

verify functionality
verify webhook
verify sessions
verify workflows
verify database integrity

DO NOT leave broken code.

FINAL GOAL

The final system MUST be:

production workable
scalable
modular
workflow-driven
maintainable
reusable
automation-focused

The final product should behave like a REAL WhatsApp automation SaaS MVP.

FOCUS ONLY ON:
BUILDING A CLEAN WORKABLE WHATSAPP WORKFLOW AUTOMATION PLATFORM.