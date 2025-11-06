# Roadmap — King’s Canvas

This roadmap outlines the planned development epochs for the **King’s Canvas** application.  
Each epoch represents a small, functional milestone — progressing the platform from concept to full MVP release.  

Detailed implementation plans for each epoch will live under:  
`/docs/ROADMAP/EPOCHS/epoch-####-<slug>/`

---

## 🧭 Overview

**Product Vision:**  
King’s Canvas enables King’s College London students to design their life journey — mapping long-term intentions, breaking them into achievable steps, and connecting them to real opportunities at King’s.  

Development proceeds through modular, testable epochs that incrementally build towards an MVP release.

---

## 📅 Planned MVP Epochs

---

### 🧱 **Epoch 0001 — Canvas Columns & Layout**
**Goal:** Establish the static structure and visual layout of the Canvas interface.  
**Focus Areas:**
- Implement 4-column layout: **Do Now / Do Later / Before I Graduate / After I Graduate**  
- Apply King’s brand palette, typography, and accessibility standards  
- Create placeholder cards for future Intentions and Steps  
- Ensure responsive layout (desktop-only)  
**Deliverables:**
- Branded, accessible Canvas layout (React + Tailwind)  
- Static demo for internal review  
**Exit Criteria:**
- Approved visual layout and styling  
- Accessibility checks passed (WCAG AA+)  

---

### 🧩 **Epoch 0002 — Intentions, Steps & Swim Lanes**
**Goal:** Add interactivity and logic to the Canvas interface.  
**Focus Areas:**
- Introduce **Intentions as rows (swim lanes)** that horizontally span the Canvas  
- Allow creation, editing, and deletion of **Intentions** and **Steps**  
- Enable drag-and-drop of Steps between columns  
- Maintain relationships between Intentions and their associated Steps  
- Local persistence via temporary JSON or local storage  
**Deliverables:**
- Functional front-end prototype  
- Working swim lane rendering and step association  
**Exit Criteria:**
- Intentions generate and maintain swim lanes of Steps  
- CRUD operations and drag-and-drop logic working locally  

---

### 🔐 **Epoch 0003 — Google Login Integration (NextAuth)**
**Goal:** Enable user authentication and secure sessions using built-in repo components.  
**Focus Areas:**
- Activate **Google Login via NextAuth** (pre-integrated in the repository)  
- Configure secure session management  
- Associate user sessions with distinct Canvas data contexts  
**Deliverables:**
- Authenticated login and logout flow  
- User session awareness across the app  
**Exit Criteria:**
- Users can sign in with Google  
- Each user’s Canvas context is isolated and secure  

---

### 🗄️ **Epoch 0004 — MongoDB Data Model & API Layer**
**Goal:** Implement a database-backed persistence layer.  
**Focus Areas:**
- Define MongoDB schema and models (students, intentions, steps, opportunities)  
- Build CRUD API endpoints for all entities  
- Implement authenticated data persistence  
- Create initial migration and seeding scripts  
**Deliverables:**
- Live CRUD operations connected to MongoDB  
- Working backend API routes  
**Exit Criteria:**
- Data persists between authenticated sessions  
- MongoDB integration stable in both dev and staging  

---

### 🧠 **Epoch 0005 — LangGraph AI Step Suggestions**
**Goal:** Enable AI-assisted Step generation using LangGraph workflows already stubbed in the repository.  
**Focus Areas:**
- Configure existing **LangGraph** workflow definitions for use with OpenAI or local LLM endpoints  
- Implement workflow to suggest **Steps** based on Intentions’ titles, tags, and context  
- Render AI-generated Steps in the UI for manual acceptance or rejection  
- Capture feedback for iterative learning  
**Deliverables:**
- Operational LangGraph workflow for Step generation  
- Front-end component for reviewing and applying AI suggestions  
**Exit Criteria:**
- Users can request and apply AI-suggested Steps  
- Suggestions logged with accept/reject state  

---

### 🔍 **Epoch 0006 — RAG-Based Opportunity Relevance**
**Goal:** Build a retrieval-augmented generation (RAG) layer for matching opportunities to Steps.  
**Focus Areas:**
- Index opportunities dataset (mock or real King’s Edge data) into a searchable vector store  
- Use embedding similarity to identify relevant opportunities  
- Integrate results with LangGraph workflows for contextual explanation (“why this?”)  
- Store and display ranked matches in the UI  
**Deliverables:**
- RAG service pipeline (indexing + retrieval)  
- Ranking and scoring output integrated into Opportunity Drawer  
**Exit Criteria:**
- Opportunities ranked meaningfully per Step  
- Matches traceable and explainable through RAG context  

---

### 🔁 **Epoch 0007 — Triggered Opportunity Matching**
**Goal:** Automate event-driven matching that runs immediately after Step creation.  
**Focus Areas:**
- Trigger RAG-based matching whenever a Step is created or updated  
- Update Step badge count in real time  
- Store results in user’s opportunity collection  
**Deliverables:**
- Real-time matching trigger and badge update logic  
- Event-driven architecture (e.g., hooks or web workers)  
**Exit Criteria:**
- Steps display accurate badge counts post-creation  
- Matcher executes asynchronously without UI delay  

---

### ⏰ **Epoch 0008 — Scheduled Refresh & Opportunity Drawer UI**
**Goal:** Extend matching functionality with scheduled updates and an interactive interface.  
**Focus Areas:**
- Scheduled nightly refresh job for re-indexing opportunities  
- Build **Opportunity Drawer UI** with add / dismiss / snooze actions  
- Display AI “why this?” metadata using RAG context  
**Deliverables:**
- Background job scheduler  
- Drawer component integrated with Step cards  
**Exit Criteria:**
- Scheduled refresh operational  
- Opportunity Drawer functional with real data  

---

### 💬 **Epoch 0009 — Chat UI & Framework**
**Goal:** Implement the interface for conversational guidance.  
**Focus Areas:**
- Create right-hand drawer or modal chat interface  
- Build message components, threading, and input logic  
- Connect to placeholder AI endpoint for testing  
**Deliverables:**
- Chat UI with basic conversation flow  
- Integrated drawer toggle from Canvas  
**Exit Criteria:**
- Functional chat interface in the app shell  
- Supports message input/output loop  

---

### 🎓 **Epoch 0010 — Coaching Prompts & AI Integration**
**Goal:** Transform the chat interface into a reflective coaching tool.  
**Focus Areas:**
- Develop **coaching-style** dialogue flows that help students discover and articulate aspirations  
- Integrate OpenAI GPT-4 or equivalent conversational model  
- Use LangGraph + RAG pipeline for context-aware conversation  
- Persist chat history securely in MongoDB  
**Deliverables:**
- Conversational coaching prompt library  
- Secure chat data persistence  
- Context-aware, personalised chat experience  
**Exit Criteria:**
- Students use chat to explore and refine goals  
- Chat remembers context and references plan data accurately  

---

## 🧩 Supporting Workstreams

- **Brand & UX Alignment:** Ongoing review with King’s Brand and Marketing for consistency.  
- **Accessibility (WCAG AA+):** Compliance review and testing each epoch.  
- **Security & GDPR:** Data protection and privacy validation.  
- **Documentation:** Continuous updates to `/docs/SPEC/` and `/docs/STATE/` during each epoch.  

---

## ✅ Completion Definition (MVP)

The King’s Canvas project will be considered **MVP complete** when:  
- Students can create and manage a personal Canvas with persistent, authenticated data.  
- AI workflows (LangGraph + RAG) generate, match, and explain suggestions accurately.  
- The Opportunity Drawer and Coaching Chat are both functional and brand-compliant.  
- The app is deployed securely in production.  
- Accessibility and compliance reviews are signed off.  

---

*Next Steps:*  
Once this roadmap is approved, create the first epoch folder at:  
`/docs/ROADMAP/EPOCHS/epoch-0001-canvas-columns-layout/`  
and initialise its `PLAN.md` and `STATUS.yaml` files.  

---
