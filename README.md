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

## פריסה (Deployment)

הפרויקט הוא אתר סטטי וניתן לארח אותו בכל שרת אינטרנט או שירות כמו GitHub Pages, Vercel, או Netlify.

### דגש חשוב: SharedArrayBuffer
כדי ש-FFmpeg.wasm יעבוד, הדפדפן דורש "בידוד חוצה-מקורות" (Cross-Origin Isolation). זה מושג באמצעות שני כותרות HTTP:
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Opener-Policy: same-origin`

**הפתרון שלנו:** הפרויקט כולל את `coi-serviceworker.js` שטוען את הכותרות הללו באופן אוטומטי גם בשירותים שלא מאפשרים להגדיר כותרות HTTP (כמו GitHub Pages).

### הרצה מקומית
ניתן להריץ את הפרויקט מקומית באמצעות שרת HTTP פשוט. לדוגמה:
```bash
npx serve .
```

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

## Deployment

The project is a static website and can be hosted on any web server or service such as GitHub Pages, Vercel, or Netlify.

### Important: SharedArrayBuffer
For FFmpeg.wasm to function, the browser requires "Cross-Origin Isolation". This is achieved using two HTTP headers:
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Opener-Policy: same-origin`

**Our Solution:** The project includes `coi-serviceworker.js`, which automatically handles these headers even on platforms that do not allow custom HTTP headers (like GitHub Pages).

### Local Development
You can run the project locally using a simple HTTP server. For example:
```bash
npx serve .
```
