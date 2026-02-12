/**
 * PDF Compress Module
 */

// Global variable for PDF compress file
let pdfCompressFile = null;

/**
 * Handle PDF file selection for compression
 * @param {FileList} files - Selected files
 */
async function onPdfCompressSelect(files) {
    if (files.length === 0) return;
    pdfCompressFile = files[0];

    document.getElementById('pdf-compress-btn').disabled = false;

    // Show preview
    const dropContent = document.getElementById('pdf-compress-drop-content');
    const preview = document.getElementById('pdf-compress-preview');

    dropContent.style.display = 'none';
    preview.style.display = 'flex';

    document.getElementById('pdf-compress-preview-name').textContent = pdfCompressFile.name;
    document.getElementById('pdf-compress-preview-size').textContent = formatFileSize(pdfCompressFile.size);

    // Render first page preview
    try {
        const arrayBuffer = await pdfCompressFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        document.getElementById('pdf-compress-preview-pages').textContent = `${pdf.numPages} עמודים`;

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.getElementById('pdf-compress-canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport: viewport }).promise;
    } catch (e) {
        console.error('PDF preview error:', e);
    }
}

/**
 * Remove the selected PDF compress file
 */
function removePdfCompressFile() {
    pdfCompressFile = null;
    document.getElementById('pdf-compress-drop-content').style.display = 'flex';
    document.getElementById('pdf-compress-preview').style.display = 'none';
    document.getElementById('pdf-compress-btn').disabled = true;
    document.getElementById('pdf-compress-input').value = '';
}

/**
 * Update PDF image quality display
 */
function updatePdfImageQualityDisplay(e) {
    document.getElementById('pdf-img-quality-value').textContent = e.target.value + '%';
}

/**
 * Compress PDF
 */
async function compressPDF() {
    if (!pdfCompressFile) return;

    const level = document.getElementById('compress-level').value;
    const imgQuality = parseInt(document.getElementById('pdf-img-quality').value) / 100;

    document.getElementById('pdf-compress-progress').style.display = 'block';
    document.getElementById('pdf-compress-btn').disabled = true;

    try {
        const { PDFDocument } = PDFLib;

        document.getElementById('pdf-compress-progress-text').textContent = 'קורא PDF...';
        document.getElementById('pdf-compress-progress-fill').style.width = '20%';

        const arrayBuffer = await pdfCompressFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, {
            ignoreEncryption: true
        });

        document.getElementById('pdf-compress-progress-text').textContent = 'מעבד...';
        document.getElementById('pdf-compress-progress-fill').style.width = '50%';

        // Re-render pages at lower quality to compress
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const newPdfDoc = await PDFDocument.create();

        const scales = { low: 1.5, medium: 1.2, high: 0.8 };
        const scale = scales[level];

        for (let i = 1; i <= pdf.numPages; i++) {
            const progress = 50 + Math.round((i / pdf.numPages) * 40);
            document.getElementById('pdf-compress-progress-fill').style.width = progress + '%';
            document.getElementById('pdf-compress-progress-text').textContent = `מעבד עמוד ${i} מתוך ${pdf.numPages}...`;

            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            const jpegBlob = await new Promise(resolve =>
                canvas.toBlob(resolve, 'image/jpeg', imgQuality)
            );
            const jpegBuffer = await jpegBlob.arrayBuffer();
            const jpegImage = await newPdfDoc.embedJpg(jpegBuffer);

            const originalPage = await pdf.getPage(i);
            const originalViewport = originalPage.getViewport({ scale: 1 });

            const newPage = newPdfDoc.addPage([originalViewport.width, originalViewport.height]);
            newPage.drawImage(jpegImage, {
                x: 0,
                y: 0,
                width: originalViewport.width,
                height: originalViewport.height
            });
        }

        document.getElementById('pdf-compress-progress-text').textContent = 'שומר...';
        document.getElementById('pdf-compress-progress-fill').style.width = '95%';

        const compressedBytes = await newPdfDoc.save();
        const blob = new Blob([compressedBytes], { type: 'application/pdf' });

        const originalSize = pdfCompressFile.size;
        const newSize = blob.size;
        const reduction = Math.round((1 - newSize / originalSize) * 100);

        const downloadName = 'compressed_' + pdfCompressFile.name;

        // Show download modal
        showDownloadModal({
            title: 'הדחיסה הושלמה!',
            subtitle: reduction > 0 ? `חיסכון של ${reduction}%` : 'הקובץ גדל - נסה רמת דחיסה גבוהה יותר',
            originalSize: originalSize,
            newSize: newSize,
            blob: blob,
            filename: downloadName
        });

    } catch (error) {
        console.error('PDF compression error:', error);
        showError('pdf-compress-result', error.message);
    }

    document.getElementById('pdf-compress-progress').style.display = 'none';
    document.getElementById('pdf-compress-btn').disabled = false;
}

/**
 * Initialize PDF compress
 */
function initPdfCompress() {
    // Setup drop zone
    setupDropZone(
        document.getElementById('pdf-compress-drop'),
        document.getElementById('pdf-compress-input'),
        onPdfCompressSelect
    );

    // Setup quality slider
    document.getElementById('pdf-img-quality').addEventListener('input', updatePdfImageQualityDisplay);

    // Setup remove button
    document.getElementById('pdf-compress-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        removePdfCompressFile();
    });

    // Setup compress button
    document.getElementById('pdf-compress-btn').addEventListener('click', compressPDF);
}
