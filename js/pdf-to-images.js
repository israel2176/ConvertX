/**
 * PDF to Images Module
 */

// Global variable for PDF file
let pdfFile = null;

/**
 * Handle PDF file selection for image conversion
 * @param {FileList} files - Selected files
 */
async function onPdfImageSelect(files) {
    if (files.length === 0) return;
    pdfFile = files[0];

    document.getElementById('pdf-to-img-btn').disabled = false;

    // Show preview
    const dropContent = document.getElementById('pdf-img-drop-content');
    const preview = document.getElementById('pdf-img-preview');

    dropContent.style.display = 'none';
    preview.style.display = 'flex';

    document.getElementById('pdf-img-preview-name').textContent = pdfFile.name;
    document.getElementById('pdf-img-preview-size').textContent = formatFileSize(pdfFile.size);

    // Render first page preview
    try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        document.getElementById('pdf-img-preview-pages').textContent = `${pdf.numPages} עמודים`;

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.getElementById('pdf-img-canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport: viewport }).promise;
    } catch (e) {
        console.error('PDF preview error:', e);
    }
}

/**
 * Remove the selected PDF file
 */
function removePdfImageFile() {
    pdfFile = null;
    document.getElementById('pdf-img-drop-content').style.display = 'flex';
    document.getElementById('pdf-img-preview').style.display = 'none';
    document.getElementById('pdf-to-img-btn').disabled = true;
    document.getElementById('pdf-img-input').value = '';
}

/**
 * Handle pages option change
 */
function onPdfPagesChange(e) {
    document.getElementById('custom-pages-group').style.display =
        e.target.value === 'custom' ? 'block' : 'none';
}

/**
 * Parse page range string
 * @param {string} rangeStr - Range string (e.g., "1-5, 8, 10-12")
 * @param {number} maxPages - Maximum number of pages
 * @returns {number[]} Array of page numbers
 */
function parsePageRange(rangeStr, maxPages) {
    const pages = new Set();
    const parts = rangeStr.split(',').map(p => p.trim());

    for (const part of parts) {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(n => parseInt(n.trim()));
            for (let i = Math.max(1, start); i <= Math.min(maxPages, end); i++) {
                pages.add(i);
            }
        } else {
            const num = parseInt(part);
            if (num >= 1 && num <= maxPages) {
                pages.add(num);
            }
        }
    }

    return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Convert PDF to images
 */
async function convertPdfToImages() {
    if (!pdfFile) return;

    const format = document.getElementById('img-output-format').value;
    const scale = parseFloat(document.getElementById('img-scale').value);
    const pagesOption = document.getElementById('pdf-pages').value;

    document.getElementById('pdf-img-progress').style.display = 'block';
    document.getElementById('pdf-to-img-btn').disabled = true;

    try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;

        let pagesToConvert;
        if (pagesOption === 'all') {
            pagesToConvert = Array.from({ length: totalPages }, (_, i) => i + 1);
        } else if (pagesOption === 'first') {
            pagesToConvert = [1];
        } else {
            const customRange = document.getElementById('custom-pages').value;
            pagesToConvert = parsePageRange(customRange, totalPages);
            if (pagesToConvert.length === 0) {
                throw new Error('לא נבחרו עמודים תקינים');
            }
        }

        const images = [];

        for (let i = 0; i < pagesToConvert.length; i++) {
            const pageNum = pagesToConvert[i];
            const progress = Math.round(((i + 1) / pagesToConvert.length) * 100);
            document.getElementById('pdf-img-progress-fill').style.width = progress + '%';
            document.getElementById('pdf-img-progress-text').textContent = `ממיר עמוד ${pageNum}...`;

            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
            const quality = format === 'jpeg' ? 0.92 : undefined;

            const blob = await new Promise(resolve =>
                canvas.toBlob(resolve, mimeType, quality)
            );

            images.push({
                blob,
                name: `${pdfFile.name.replace('.pdf', '')}_page_${pageNum}.${format}`
            });
        }

        window.allConvertedImages = images;
        const totalSize = images.reduce((sum, img) => sum + img.blob.size, 0);

        // Show download modal
        showDownloadModal({
            title: 'ההמרה הושלמה!',
            subtitle: `${images.length} תמונות נוצרו`,
            newSize: totalSize,
            blob: images.length === 1 ? images[0].blob : null,
            filename: images.length === 1 ? images[0].name : 'images',
            showOriginalSize: false
        });

        // Override download button for multiple images
        if (images.length > 1) {
            document.getElementById('modal-download-btn').onclick = () => {
                downloadAllImages();
                closeDownloadModal();
            };
            document.getElementById('modal-download-btn').textContent = '↓ הורד הכל';
        }

    } catch (error) {
        console.error('PDF to image error:', error);
        showError('pdf-img-result', error.message);
    }

    document.getElementById('pdf-img-progress').style.display = 'none';
    document.getElementById('pdf-to-img-btn').disabled = false;
}

/**
 * Download all images (one by one with delay)
 */
async function downloadAllImages() {
    const images = window.allConvertedImages;
    for (let i = 0; i < images.length; i++) {
        setTimeout(() => {
            downloadBlob(images[i].blob, images[i].name);
        }, i * 500);
    }
}

/**
 * Initialize PDF to images converter
 */
function initPdfToImages() {
    // Setup drop zone
    setupDropZone(
        document.getElementById('pdf-img-drop'),
        document.getElementById('pdf-img-input'),
        onPdfImageSelect
    );

    // Setup pages option change
    document.getElementById('pdf-pages').addEventListener('change', onPdfPagesChange);

    // Setup remove button
    document.getElementById('pdf-img-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        removePdfImageFile();
    });

    // Setup convert button
    document.getElementById('pdf-to-img-btn').addEventListener('click', convertPdfToImages);
}
