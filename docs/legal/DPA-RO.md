# Acord de Prelucrare a Datelor (DPA)

**Între:**

**Operator:** [Numele complet al școlii / organizației]
- CUI/CIF: [...]
- Adresă: [...]
- Reprezentant legal: [...]
- Email: [...]

**Procesator:** [Numele complet al entității juridice TrainBot]
- CUI/CNP: [...]
- Adresă: [...]
- Email: moldemil@gmail.com

> **DRAFT v0.1 — necesită revizuire de către consilier juridic înainte de utilizare.**

## Preambul

Operatorul și Procesatorul au încheiat un acord pentru utilizarea platformei TrainBot. Conform GDPR (Regulamentul UE 2016/679) Art. 28, este necesar un acord de prelucrare ce reglementează rolurile, scopurile și măsurile de protecție.

## 1. Definiții

Termenii "date cu caracter personal", "prelucrare", "operator", "procesator", "persoană vizată" au înțelesul din GDPR.

## 2. Obiect și durată

- **Obiect:** prelucrarea de către Procesator a datelor personale ale profesorilor și elevilor, în numele Operatorului, exclusiv în scopul furnizării platformei TrainBot
- **Durată:** pe durata utilizării platformei + 30 de zile pentru ștergere
- **Natură:** colectare, stocare, structurare, modificare, consultare, ștergere

## 3. Categorii de persoane vizate

- Profesori înregistrați
- Elevi cu cont creat de profesor
- Părinți/tutori (date de contact, dacă sunt furnizate pentru consimțământ)

## 4. Categorii de date personale prelucrate

Vezi Politica de confidențialitate Secțiunea 3.

**Date sensibile:** imaginile încărcate de elevi pot conține elemente identificabile (chipuri, locații). Operatorul este responsabil pentru a instrui elevii să **NU** încarce imagini cu persoane identificabile fără acordul acestora.

## 5. Obligațiile Procesatorului (TrainBot)

Procesatorul:
1. Prelucrează datele exclusiv pe baza instrucțiunilor documentate ale Operatorului
2. Asigură confidențialitatea persoanelor cu acces la date (acord NDA)
3. Implementează măsuri tehnice și organizatorice (Anexa I)
4. Nu angajează sub-procesatori fără acord prealabil scris (lista actuală: Anexa II)
5. Asistă Operatorul în răspunsul la cererile persoanelor vizate (drepturi GDPR)
6. Asistă Operatorul în notificările de breach către ANSPDCP (max 72h)
7. La încetarea contractului: șterge sau returnează toate datele și copiile, conform alegerii Operatorului
8. Pune la dispoziție informații necesare auditării conformității

## 6. Obligațiile Operatorului (Școala)

Operatorul:
1. Are temeiul juridic pentru prelucrarea datelor (consimțământ, contract, etc.)
2. Pentru elevi sub 16 ani: obține și păstrează consimțământul parental scris
3. Informează persoanele vizate (profesori, elevi, părinți) despre prelucrare
4. Răspunde primar la cererile persoanelor vizate
5. Notifică Procesatorul despre orice cerere relevantă

## 7. Drepturi și obligații în caz de breach

În caz de incident de securitate:
- Procesatorul notifică Operatorul **fără întârzieri nejustificate** (max 24h de la descoperire)
- Notificarea include: natura incidentului, categoriile/numărul de persoane afectate, măsuri luate
- Operatorul notifică ANSPDCP în max 72h dacă breach-ul implică risc pentru persoanele vizate

## 8. Transferuri internaționale

- Datele sunt stocate în EU (Frankfurt, infrastructura DigitalOcean)
- Sub-procesatori din afara EU folosesc Clauze Contractuale Standard (SCC) UE
- Lista sub-procesatorilor este publicată în Anexa II

## 9. Audit

Operatorul are dreptul (max o dată pe an, cu notificare prealabilă de 30 zile) să auditeze conformitatea Procesatorului. Auditul poate fi realizat printr-un terț acceptat de ambele părți.

## 10. Răspundere

Fiecare parte răspunde pentru încălcările proprii. Răspunderea Procesatorului este limitată conform Termenilor și Condițiilor de utilizare TrainBot.

## 11. Lege aplicabilă

Acest DPA este guvernat de GDPR și de legea română (Legea 190/2018). Litigiile sunt de competența instanțelor române.

---

## Anexa I — Măsuri tehnice și organizatorice (TOM)

| Categorie | Măsură |
|-----------|--------|
| Acces fizic | Server în datacenter ISO 27001 (DigitalOcean Frankfurt) |
| Acces logic | SSH cu chei publice, ufw firewall (22/80/443), user dedicat non-root |
| Autentificare | bcrypt cost 12, JWT cu rotation refresh tokens, sesiune 15 min |
| Transport | HTTPS exclusiv (Let's Encrypt TLS 1.2+) |
| Backup | pg_dump zilnic criptat, retention 7 zile |
| Logging | log-uri structurate, retenție 30 zile, fără date personale în log-uri sensibile |
| Hardening | OS up-to-date, automated updates pentru security patches |
| Recovery | RTO 4h, RPO 24h |

## Anexa II — Sub-procesatori

| Sub-procesator | Locație | Scop | Garanții |
|----------------|---------|------|----------|
| DigitalOcean LLC | EU (Frankfurt) | Găzduire infrastructură | DPA + SCC |
| Let's Encrypt (ISRG) | EU/SUA | Certificate SSL | Nu primesc date |

În viitor (dacă se adaugă):
- Anthropic (LLM proxy) — SCC + DPA
- DigitalOcean Spaces (file storage) — același DPA cu DO

---

**Semnătura Operator:** ________________ **Data:** _________
**Semnătura Procesator:** ________________ **Data:** _________
