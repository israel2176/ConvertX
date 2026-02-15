# ConvertX - המרת קבצים חכמה בדפדפן

[English version follows below](#english)

ConvertX הוא כלי עוצמתי ופרטי לחלוטין לעיבוד והמרת קבצים ישירות בדפדפן. כל העיבוד מתבצע בצד הלקוח, מה שאומר שהקבצים שלך לעולם לא עוזבים את המחשב.

## תכונות עיקריות
- **המרת מדיה**: המרת וידאו ואודיו בין פורמטים שונים (MP3, MP4, WAV, WebM, OGG ועוד).
- **חיתוך מדיה**: חיתוך קטעי וידאו ואודיו בקלות.
- **תמונות ל-PDF**: יצירת קבצי PDF מרובי עמודים מתמונות.
- **PDF לתמונות**: המרת דפי PDF לתמונות PNG/JPG באיכות גבוהה.
- **דחיסת PDF**: הקטנת נפח קבצי PDF תוך שמירה על איכות.

## טכנולוגיות
- [FFmpeg.wasm](https://ffmpegwasm.netlify.app/) - לעיבוד וידאו ואודיו.
- [PDF-lib](https://pdf-lib.js.org/) - ליצירה ושינוי קבצי PDF.
- [PDF.js](https://mozilla.github.io/pdf.js/) - לקריאה ותצוגה של קבצי PDF.
- [coi-serviceworker](https://github.com/gzuidhof/coi-serviceworker) - לאיפשור SharedArrayBuffer בסביבות אירוח סטטיות.

## איך להריץ את הפרויקט?

ניתן להשתמש ב-ConvertX בשתי דרכים:

### 1. הרצה מקומית על המחשב
1. **הורדת הקבצים**: הורד את הפרויקט כקובץ ZIP וחלץ אותו, או שclone את המאגר:
   ```bash
   git clone https://github.com/YOUR_USERNAME/convertx.git
   cd convertx
   ```
2. **הפעלת שרת**: מכיוון שהפרויקט משתמש ב-Service Workers וב-WebAssembly, אי אפשר פשוט לפתוח את קובץ ה-`index.html` ישירות מהתיקייה. יש להריץ שרת מקומי.
   - אם מותקן לכם Node.js:
     ```bash
     npx serve .
     ```
   - אם מותקן לכם Python:
     ```bash
     python -m http.server 3000
     ```
3. **פתיחה בדפדפן**: עברו לכתובת `http://localhost:3000`.

### 2. פריסה לשרת (Production)
הפרויקט הוא אתר סטטי לחלוטין. ניתן להעלות את כל הקבצים לכל שירות אירוח (GitHub Pages, Netlify, Vercel, שרת Apache/Nginx וכו').

#### דגש חשוב: SharedArrayBuffer
כדי שמנוע ההמרה (FFmpeg) יעבוד, הדפדפן דורש סביבה מאובטחת ו"בידוד חוצה-מקורות".
**אל דאגה!** הפרויקט כולל את `coi-serviceworker.js` שדואג לזה אוטומטית. אין צורך בהגדרות מיוחדות בשרת ברוב המקרים.

---


---

<a name="english"></a>
# ConvertX - Smart In-Browser File Conversion

ConvertX is a powerful and fully private tool for processing and converting files directly in your browser. All processing is done client-side, meaning your files never leave your computer.

## Key Features
- **Media Conversion**: Convert video and audio between various formats (MP3, MP4, WAV, WebM, OGG, etc.).
- **Media Trimming**: Easily cut video and audio clips.
- **Images to PDF**: Create multi-page PDF files from images.
- **PDF to Images**: Convert PDF pages to high-quality PNG/JPG images.
- **PDF Compression**: Reduce the size of PDF files while maintaining quality.

## Technologies
- [FFmpeg.wasm](https://ffmpegwasm.netlify.app/) - For video and audio processing.
- [PDF-lib](https://pdf-lib.js.org/) - For creating and modifying PDF files.
- [PDF.js](https://mozilla.github.io/pdf.js/) - For reading and rendering PDF files.
- [coi-serviceworker](https://github.com/gzuidhof/coi-serviceworker) - To enable SharedArrayBuffer in static hosting environments.

## How to Run?

You can use ConvertX in two ways:

### 1. Locally on Your Computer
1. **Download/Clone**: Download the project as a ZIP and extract it, or clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/convertx.git
   cd convertx
   ```
2. **Run a Server**: Due to the use of Service Workers and WebAssembly, you cannot simply open `index.html` directly from your file explorer. You must use a local server.
   - If you have Node.js:
     ```bash
     npx serve .
     ```
   - If you have Python:
     ```bash
     python -m http.server 3000
     ```
3. **Open Browser**: Go to `http://localhost:3000`.

### 2. Production Deployment
The project is entirely static. You can upload all files to any hosting service (GitHub Pages, Netlify, Vercel, Apache/Nginx, etc.).

#### Important: SharedArrayBuffer
For the conversion engine (FFmpeg) to work, browsers require a secure environment and "Cross-Origin Isolation".
**Don't worry!** The project includes `coi-serviceworker.js` which handles this automatically. In most cases, no special server configuration is needed.

---
