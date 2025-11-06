# Glossary — King’s Canvas

This document defines key terms used throughout the King’s Canvas application and specification. These terms reflect both product language and domain concepts specific to King’s College London’s student experience.

---

## 🎯 Core Concepts

### **Intention**
A high-level personal goal or aspiration defined by the student (e.g. “Become a teacher”).  
Intentions sit in future buckets ("Before I Graduate" or "After I Graduate") and form the anchor for connected steps.

### **Step**
An actionable item that helps move the student closer to fulfilling an Intention. Steps are placed in "Do Now" or "Do Later" buckets and may be manually added or suggested by the AI.

### **Canvas Board**
The visual interface where students arrange Intentions and Steps into four time-oriented columns:
- Do Now
- Do Later
- Do Before I Graduate
- Do After I Graduate

Each Intention creates a “swim lane” that includes its associated Steps.

---

## 🔍 Matching & AI

### **Opportunity**
A real, live activity (e.g. event, module, workshop) pulled from the King’s Edge catalogue or related sources. Opportunities can be linked to Steps, forming concrete ways to act.

### **Suggestion Badge**
A numeric indicator shown on a Step card, displaying how many new Opportunities are available that match the Step.

### **Snooze**
An action to temporarily hide an Opportunity suggestion. Snoozed items resurface later but are not counted in the badge.

### **Dismiss**
A rejection action applied to an Opportunity. Dismissed items are remembered and excluded from future suggestions (unless re-ingested or reclassified).

### **Linked Opportunity**
An Opportunity that a student has accepted and formally attached to a Step. These appear inline on the Step card.

---

## 🤖 AI Terms

### **AI Assistant**
A conversational agent available via chat, used to help students:
- Define or refine their Intentions
- Suggest Steps for existing Intentions
- Explain matches or recommend Opportunities

### **AI Memory**
A private log that tracks student interactions with the AI, including rejections, preferences, and seen suggestions, to improve future matching.

---

## 🗂 Metadata & Tagging

### **Tag**
A keyword or skill descriptor associated with a Step. Tags improve Opportunity matching by aligning user goals with opportunity metadata (e.g. “teaching”, “leadership”, “Strand campus”).

### **Eligibility**
Criteria attached to an Opportunity that determines whether it should be shown to a user. May include programme, year of study, faculty, or campus.

---

## 📦 System & Structure

### **Match Engine**
A background service that periodically evaluates each Step against all available Opportunities and updates the suggestion list and badge.

### **Opportunity Drawer**
A UI panel that displays Opportunity suggestions for a Step. Allows students to preview, add, dismiss, or snooze Opportunities.

### **Swim Lane**
The horizontal visual grouping of a single Intention and all its associated Steps across the Canvas.

---

## 🧑‍🎓 Stakeholder Roles

### **Student**
The primary user of the app. Owns and manages their Canvas.

### **Staff**
(Phase 2+) View aggregated, anonymised usage analytics to support programme design or outreach.

---

## 🔒 Compliance & Privacy

### **Opt-Out Logging**
A control to allow students to use the app without storing AI interaction data for analysis or improvement.

### **GDPR Support**
All data is stored with deletion, export, and visibility options in line with King’s College London’s data governance and GDPR requirements.

---
