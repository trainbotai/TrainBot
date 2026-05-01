# Privacy Policy — TrainBot

> **DRAFT v0.1 — requires legal counsel review before publication.**

**Last updated:** May 1, 2026

## 1. Who we are

TrainBot is an educational platform that lets teachers and students (ages 7-14) learn AI/ML concepts through hands-on projects training image classification models.

- **Data controller:** [Full legal entity name]
- **Address:** [...]
- **Contact:** moldemil@gmail.com
- **DPO:** [Name / "Not applicable — below threshold"]

## 2. Who this applies to

- **Teachers** who create accounts and manage classes
- **Students** receiving credentials from teachers to access the iOS app

## 3. Data we collect

### 3.1 Teacher accounts
- Email, name, password (hashed with bcrypt), school/organization name, last login

### 3.2 Student accounts (created by teachers)
- Username, display name (optional), password (hashed), class code, last activity

### 3.3 Usage-generated data
- Images uploaded by students for ML training (currently stored locally on iOS device; future versions may sync to server)
- ML labels and projects
- Resulting Core ML models (stay on iOS device)

### 3.4 Automatic technical data
- IP address (in server logs, 30-day retention)
- User agent
- JWT tokens (Keychain on iOS, localStorage on web)

## 4. Why we collect (GDPR legal basis)

| Data | Purpose | Basis |
|------|---------|-------|
| Teacher account | Account management, auth | Art. 6(1)(b) — contract |
| Student account | Educational content access | Art. 6(1)(b) — contract with school |
| ML images | Core functionality | Art. 6(1)(b) + Art. 8 parental consent if under 16 |
| Tech logs | Security, debugging | Art. 6(1)(f) — legitimate interest |

**Important for minors (GDPR Art. 8 + Romanian Law 190/2018):** In Romania, the minimum age for self-consent in information society services is **16**. For students under 16, the teacher/school must obtain documented parental consent before creating the student account.

## 5. Data sharing

### Sub-processors
- **DigitalOcean LLC** (US, EU infrastructure — Frankfurt): server hosting (EU SCCs)
- **Let's Encrypt (ISRG, US):** SSL certificates (no personal data)

### We do NOT sell data
TrainBot never sells or rents personal data for marketing.

### Authorities
We may disclose data only under valid court order or legal obligation.

## 6. Retention

| Category | Retention |
|----------|-----------|
| Active teacher account | Contract duration + 30 days |
| Active student account | School year + 30 days, or upon teacher request |
| DB backups | 7 days rolling |
| Tech logs | 30 days |
| ML images on device | User-controlled |

## 7. Your rights (GDPR Art. 15-22)

You have the right to:
- **Access** your data (Art. 15)
- **Rectify** incorrect data (Art. 16)
- **Erase** ("right to be forgotten", Art. 17)
- **Restrict** processing (Art. 18)
- **Portability** (Art. 20)
- **Object** to processing (Art. 21)
- **Withdraw consent** anytime
- **Complain** to ANSPDCP (Romania) or your local DPA: https://edpb.europa.eu/about-edpb/board/members_en

Exercise rights at **moldemil@gmail.com**. We respond within 30 days.

## 8. Security

- Bcrypt-hashed passwords (cost 12)
- HTTPS only (TLS 1.2+)
- JWT with refresh rotation
- Restricted server access, firewalled
- Daily encrypted DB backups

## 9. Cookies

Web app uses **localStorage** for auth tokens. No tracking/advertising cookies. iOS uses system Keychain.

## 10. Changes

We notify by email at least 30 days before any material change.

## 11. Contact

**Email:** moldemil@gmail.com
**URL:** https://trainbot.perpetuummobile.tech
