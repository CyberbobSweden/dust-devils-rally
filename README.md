# 🏎️ Dust Devils Rally — Deploy-guide

## Repo & Live URL
- **GitHub:** https://github.com/CyberbobSweden/dust-devils-rally
- **Live spel:** https://cyberbobsweden.github.io/dust-devils-rally/

---

## 📁 Filstruktur i C:\dust-devils-rally\

```
C:\dust-devils-rally\
├── index.html          ← MASTER-FILEN (allt är byggt hit)
├── favicon.ico
├── music.ogg
├── style.css
├── capacitor.config.json
├── package.json
├── android\            ← APK-projekt (Capacitor)
├── www\                ← Gammal byggmapp (ignorera)
└── js\                 ← Källfiler (ignorera, byggt in i index.html)
```

**Det enda du behöver pusha är `index.html`** — allt annat är redan uppe.

---

## 🚀 Pusha ny version till GitHub Pages

Öppna **Command Prompt** i `C:\dust-devils-rally\` och kör:

```cmd
git add index.html
git commit -m "feat: beskrivning av vad du ändrat"
git push
```

Det tar **30–60 sekunder** innan live-sidan uppdateras.

### Kontrollera att det funkar
Gå till: https://cyberbobsweden.github.io/dust-devils-rally/

Tryck **Ctrl+Shift+R** (hård reload utan cache) om du ser gammal version.

---

## 📋 Steg-för-steg första gången (om git krånglar)

```cmd
cd C:\dust-devils-rally

REM Kolla status
git status

REM Lägg till index.html
git add index.html

REM Skapa commit med beskrivning
git commit -m "feat: daily challenges, shop, league system"

REM Pusha till GitHub
git push origin main
```

Om det frågar efter lösenord: använd ditt **GitHub-token** (inte lösenordet).

---

## 🔑 Om git push inte funkar

### Fel: "not a git repository"
```cmd
git init
git remote add origin https://github.com/CyberbobSweden/dust-devils-rally.git
git branch -M main
git push -u origin main
```

### Fel: "Authentication failed"
1. Gå till GitHub → Settings → Developer settings → Personal access tokens
2. Skapa nytt token med `repo`-behörighet
3. Använd token som lösenord när git frågar

### Kolla vilken branch du är på
```cmd
git branch
git log --oneline -5
```

---

## 📱 Bygg Android APK

När du uppdaterat index.html och pushat till GitHub, bygg APK:n:

```cmd
cd C:\dust-devils-rally

REM Synka web-filer till Android-projektet
npx cap sync android

REM Öppna Android Studio
npx cap open android
```

I Android Studio:
1. **Build** → Generate Signed Bundle / APK
2. Välj **Android App Bundle (.aab)**
3. Välj keystore: `dust-devils-rally.jks`
4. Ladda upp `.aab`-filen till Google Play Console

---

## 🔢 Versionshantering

Innan varje push — uppdatera versionen i index.html (valfritt):
```
const BUILD = '20260628.XXXX';  // hittas nära toppen av index.html
```

---

## 📝 Vanliga git-kommandon

| Kommando | Vad det gör |
|----------|-------------|
| `git status` | Visa vad som ändrats |
| `git add index.html` | Markera index.html för commit |
| `git commit -m "text"` | Spara ändringen lokalt |
| `git push` | Ladda upp till GitHub |
| `git pull` | Hämta senaste från GitHub |
| `git log --oneline -5` | Se de 5 senaste commits |
| `git diff index.html` | Se exakt vad som ändrats |

---

## ⚡ Snabbkommando (klistra in allt på en gång)

```cmd
git add index.html && git commit -m "update" && git push
```

---

*Senast uppdaterad: 2026-06-28*
