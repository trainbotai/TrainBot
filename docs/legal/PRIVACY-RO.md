# Politică de confidențialitate — TrainBot

> **DRAFT v0.1 — necesită revizuire de către consilier juridic înainte de publicare.**
> Operatorul trebuie să completeze placeholder-urile `[...]` cu informații reale.

**Ultima actualizare:** 1 mai 2026

## 1. Cine suntem

TrainBot este o platformă educațională care permite profesorilor și elevilor (7-14 ani) să învețe concepte de inteligență artificială și machine learning prin proiecte practice de antrenare a modelelor de clasificare a imaginilor.

- **Operator de date:** [Numele complet al entității juridice / PFA]
- **CUI / CNP:** [...]
- **Adresă:** [...]
- **Email contact:** moldemil@gmail.com
- **Responsabil cu protecția datelor (DPO):** [Nume / "Nu aplicabil — sub pragul de obligativitate"]

## 2. Cui se aplică această politică

- **Profesori** care își creează cont și administrează clase
- **Elevi** care primesc credențiale create de profesor pentru a accesa aplicația iOS

## 3. Ce date colectăm

### 3.1 Conturi profesori
- Email
- Nume
- Parolă (stocată hash-uită cu bcrypt)
- Numele și identificatorul școlii/organizației
- Data ultimei autentificări

### 3.2 Conturi elevi (creați de profesori)
- Username (ales de profesor)
- Nume afișat (opțional)
- Parolă (hash-uită)
- Codul clasei
- Data ultimei activități

### 3.3 Date generate prin utilizare
- Imagini încărcate de elevi pentru antrenarea modelelor ML (stocate local pe dispozitivul iOS în versiunea curentă; sincronizare cu serverul în viitoare versiuni)
- Etichetele și proiectele ML create
- Modelele Core ML rezultate (rămân pe dispozitivul iOS)

### 3.4 Date tehnice automate
- Adresa IP (în log-uri server, retenție 30 zile)
- User-agent al browser-ului / device-ului
- Token-uri JWT (păstrate în Keychain pe iOS, localStorage pe web)

## 4. De ce colectăm aceste date (temei juridic GDPR)

| Date | Scop | Temei (Art. 6 / 8 GDPR) |
|------|------|-------------------------|
| Cont profesor | Gestionare cont, autentificare | 6(1)(b) — executare contract |
| Cont elev | Acces la conținut educațional | 6(1)(b) — contract cu școala |
| Imagini ML | Funcționalitate de bază (antrenare AI) | 6(1)(b) + consimțământ parental Art. 8 dacă elevul are sub 16 ani |
| Log-uri tehnice | Securitate, debugging | 6(1)(f) — interes legitim |

**Important pentru minori (Art. 8 GDPR + Legea 190/2018):** Conform legislației române, vârsta minimă pentru consimțământ propriu la prelucrarea datelor în contextul serviciilor societății informaționale este de **16 ani**. Pentru elevii sub 16 ani, profesorul/școala trebuie să obțină consimțământul parental documentat înainte de a crea contul elevului. TrainBot pune la dispoziția școlilor un formular-model de consimțământ parental.

## 5. Cui transferăm datele

### 5.1 Sub-procesatori
- **DigitalOcean LLC (SUA, infrastructură EU — Frankfurt):** găzduire server (clauze contractuale standard UE-SUA aplicabile, server în EU)
- **Let's Encrypt (ISRG, SUA):** certificate SSL (nu primesc date personale)

### 5.2 Nu vindem date
TrainBot nu vinde și nu închiriază date personale către terți pentru marketing.

### 5.3 Autorități
Putem dezvălui date la cererea autorităților publice doar în baza unui ordin judecătoresc valabil sau a unei obligații legale.

## 6. Cât timp păstrăm datele

| Categorie | Retenție |
|-----------|----------|
| Cont profesor activ | Pe durata contractului + 30 zile după ștergere cont |
| Cont elev activ | Pe durata anului școlar + 30 zile sau până la cererea profesorului |
| Backup-uri DB | 7 zile rotativ |
| Log-uri tehnice | 30 zile |
| Imagini ML pe dispozitiv | Controlate de utilizator (poate șterge oricând din aplicație) |

## 7. Drepturile dumneavoastră (GDPR Art. 15-22)

Ca persoană vizată aveți dreptul să:
- **Accesați** datele pe care le deținem despre dvs. (Art. 15)
- **Rectificați** date incorecte (Art. 16)
- **Ștergeți** datele ("dreptul de a fi uitat", Art. 17)
- **Restricționați** prelucrarea (Art. 18)
- **Portați** datele într-un format structurat (Art. 20)
- **Vă opuneți** prelucrării (Art. 21)
- **Retrageți consimțământul** oricând (când prelucrarea se bazează pe consimțământ)
- **Depuneți plângere** la ANSPDCP: https://www.dataprotection.ro/

Pentru a vă exercita aceste drepturi, contactați-ne la **moldemil@gmail.com**. Răspundem în maxim 30 zile.

## 8. Securitate

- Parole hash-uite cu bcrypt (cost factor 12)
- Comunicare HTTPS exclusiv (TLS 1.2+)
- JWT-uri cu refresh rotation
- Acces server limitat, firewall configurat
- Backup zilnic criptat al bazei de date

## 9. Cookies și tehnologii similare

Aplicația web folosește **localStorage** pentru a păstra token-urile de autentificare. Nu folosim cookies pentru tracking sau publicitate. Aplicația iOS folosește Keychain-ul sistemului pentru token-uri.

## 10. Modificări la politica de confidențialitate

Vă vom notifica prin email cu cel puțin 30 de zile înainte de orice modificare materială.

## 11. Contact

Pentru orice întrebare privind prelucrarea datelor:
**Email:** moldemil@gmail.com
**Pagină web:** https://trainbot.perpetuummobile.tech
