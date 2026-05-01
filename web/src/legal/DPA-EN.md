# Data Processing Agreement (DPA)

**Between:**

**Controller:** [Full school/organization name] — [legal ID, address, legal rep, email]

**Processor:** [Full TrainBot legal entity name] — [legal ID, address, email moldemil@gmail.com]

> **DRAFT v0.1 — requires legal counsel review before use.**

## Preamble

The Controller and Processor have entered an agreement for the use of the TrainBot platform. Under GDPR (EU 2016/679) Art. 28, a Data Processing Agreement is required to govern roles, purposes, and protection measures.

## 1. Definitions

Terms "personal data", "processing", "controller", "processor", "data subject" have the meanings of GDPR.

## 2. Subject and duration

- **Subject:** processing by Processor of teachers' and students' personal data, on behalf of Controller, solely for providing the TrainBot platform
- **Duration:** for the platform usage period + 30 days for deletion
- **Nature:** collection, storage, structuring, modification, consultation, deletion

## 3. Categories of data subjects

- Registered teachers
- Students with accounts created by teachers
- Parents/guardians (contact data, where provided for consent)

## 4. Categories of personal data processed

See Privacy Policy Section 3.

**Sensitive data:** images uploaded by students may contain identifiable elements (faces, locations). The Controller is responsible for instructing students **NOT** to upload images of identifiable persons without their consent.

## 5. Processor obligations (TrainBot)

The Processor:
1. Processes data only on documented Controller instructions
2. Ensures confidentiality of personnel with data access (NDA)
3. Implements technical and organizational measures (Annex I)
4. Does not engage sub-processors without prior written consent (current list: Annex II)
5. Assists Controller with data subject requests (GDPR rights)
6. Assists Controller with breach notifications to ANSPDCP (max 72h)
7. At contract end: deletes or returns all data and copies, per Controller choice
8. Provides information needed for compliance audits

## 6. Controller obligations (School)

The Controller:
1. Has legal basis for processing (consent, contract, etc.)
2. For students under 16: obtains and retains written parental consent
3. Informs data subjects (teachers, students, parents) about processing
4. Primary responder to data subject requests
5. Notifies Processor of any relevant requests

## 7. Breach handling

- Processor notifies Controller **without undue delay** (max 24h from discovery)
- Notification includes: nature of incident, categories/number of affected persons, mitigations
- Controller notifies ANSPDCP within 72h if breach implies risk to data subjects

## 8. International transfers

- Data stored in EU (Frankfurt, DigitalOcean infrastructure)
- Sub-processors outside EU use EU Standard Contractual Clauses (SCCs)
- Sub-processor list in Annex II

## 9. Audit

Controller has the right (max once per year, with 30-day prior notice) to audit Processor compliance. Audit may be conducted by a third party accepted by both parties.

## 10. Liability

Each party liable for own breaches. Processor liability capped per TrainBot Terms of Service.

## 11. Governing law

This DPA is governed by GDPR and Romanian law (Law 190/2018). Disputes fall under Romanian court jurisdiction.

---

## Annex I — Technical and Organizational Measures (TOM)

| Category | Measure |
|----------|---------|
| Physical access | ISO 27001 datacenter (DigitalOcean Frankfurt) |
| Logical access | SSH with public keys, ufw firewall (22/80/443), dedicated non-root user |
| Authentication | bcrypt cost 12, JWT with refresh rotation, 15-min session |
| Transport | HTTPS only (Let's Encrypt TLS 1.2+) |
| Backup | Daily encrypted pg_dump, 7-day retention |
| Logging | Structured logs, 30-day retention, no sensitive PII in logs |
| Hardening | OS up-to-date, automated security updates |
| Recovery | RTO 4h, RPO 24h |

## Annex II — Sub-processors

| Sub-processor | Location | Purpose | Safeguards |
|---------------|----------|---------|------------|
| DigitalOcean LLC | EU (Frankfurt) | Infrastructure hosting | DPA + SCCs |
| Let's Encrypt (ISRG) | EU/US | SSL certificates | No data access |

Future additions:
- Anthropic (LLM proxy) — SCCs + DPA
- DigitalOcean Spaces (file storage) — same DO DPA

---

**Controller signature:** ________________ **Date:** _________
**Processor signature:** ________________ **Date:** _________
