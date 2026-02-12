/**
 * Images to PDF Module
 */

// Global variable for image files
let imageFiles = [];

/**
 * Handle image files selection
 * @param {FileList} files - Selected files
 */
function onImageFilesSelect(files) {
    for (let file of files) {
        if (file.type.startsWith('image/')) {
            imageFiles.push(file);
        }
    }
    renderImageGrid();
}

/**
 * Render the image preview grid
 */
function renderImageGrid() {
    const grid = document.getElementById('img-preview-grid');
    grid.innerHTML = '';

    imageFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'image-preview-item';

        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = file.name;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeImage(index);
        };

        const orderBadge = document.createElement('div');
        orderBadge.className = 'image-order';
        orderBadge.textContent = index + 1;

        item.appendChild(img);
        item.appendChild(removeBtn);
        item.appendChild(orderBadge);
        grid.appendChild(item);
    });

    document.getElementById('img-to-pdf-btn').disabled = imageFiles.length === 0;

    // Update drop zone hint
    const dropContent = document.getElementById('img-drop-content');
    if (imageFiles.length > 0) {
        dropContent.querySelector('.drop-zone-hint').textContent = `${imageFiles.length} תמונות נבחרו - לחץ להוספה`;
    } else {
        dropContent.querySelector('.drop-zone-hint').textContent = 'ניתן לבחור מספר תמונות';
    }
}

/**
 * Remove an image from the list
 * @param {number} index - Index of image to remove
 */
function removeImage(index) {
    imageFiles.splice(index, 1);
    renderImageGrid();
}

/**
 * Update quality display
 */
function updateImageQualityDisplay(e) {
    document.getElementById('img-quality-value').textContent = e.target.value + '%';
}

/**
 * Convert images to PDF
 */
async function convertImagesToPDF() {
    if (imageFiles.length === 0) return;

    const pageSize = document.getElementById('pdf-page-size').value;
    const quality = parseInt(document.getElementById('img-quality').value) / 100;
    const position = document.getElementById('img-position').value;

    document.getElementById('img-pdf-progress').style.display = 'block';
    document.getElementById('img-to-pdf-btn').disabled = true;

    try {
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.create();

        const pageSizes = {
            'a4': [595.28, 841.89],
            'letter': [612, 792]
        };

        for (let i = 0; i < imageFiles.length; i++) {
            const progress = Math.round(((i + 1) / imageFiles.length) * 100);
            document.getElementById('img-pdf-progress-fill').style.width = progress + '%';
            document.getElementById('img-pdf-progress-text').textContent = `מעבד תמונה ${i + 1} מתוך ${imageFiles.length}...`;

            const file = imageFiles[i];
            const arrayBuffer = await file.arrayBuffer();

            let image;
            if (file.type === 'image/png') {
                image = await pdfDoc.embedPng(arrayBuffer);
            } else {
                // Convert to JPEG for other formats
                const img = await createImageBitmap(file);
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                const jpegBlob = await new Promise(resolve =>
                    canvas.toBlob(resolve, 'image/jpeg', quality)
                );
                const jpegBuffer = await jpegBlob.arrayBuffer();
                image = await pdfDoc.embedJpg(jpegBuffer);
            }

            let pageWidth, pageHeight;
            if (pageSize === 'fit') {
                pageWidth = image.width;
                pageHeight = image.height;
            } else {
                [pageWidth, pageHeight] = pageSizes[pageSize];
            }

            const page = pdfDoc.addPage([pageWidth, pageHeight]);

            let x, y, width, height;
            const imgAspect = image.width / image.height;
            const pageAspect = pageWidth / pageHeight;

            if (position === 'stretch') {
                x = 0;
                y = 0;
                width = pageWidth;
                height = pageHeight;
            } else if (position === 'fit') {
                if (imgAspect > pageAspect) {
                    width = pageWidth;
                    height = pageWidth / imgAspect;
                } else {
                    height = pageHeight;
                    width = pageHeight * imgAspect;
                }
                x = (pageWidth - width) / 2;
                y = (pageHeight - height) / 2;
            } else { // center
                const scale = Math.min(pageWidth / image.width, pageHeight / image.height, 1);
                width = image.width * scale;
                height = image.height * scale;
                x = (pageWidth - width) / 2;
                y = (pageHeight - height) / 2;
            }

            page.drawImage(image, { x, y, width, height });
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

        // Show download modal
        showDownloadModal({
            title: 'ה-PDF נוצר בהצלחה!',
            subtitle: `${imageFiles.length} עמודים`,
            newSize: blob.size,
            blob: blob,
            filename: 'images.pdf',
            showOriginalSize: false
        });

    } catch (error) {
        console.error('PDF creation error:', error);
        showError('img-pdf-result', error.message);
    }

    document.getElementById('img-pdf-progress').style.display = 'none';
    document.getElementById('img-to-pdf-btn').disabled = false;
}

/**
 * Initialize images to PDF converter
 */
function initImagesToPdf() {
    // Setup drop zone
    setupDropZone(
        document.getElementById('img-drop'),
        document.getElementById('img-input'),
        onImageFilesSelect
    );

    // Setup quality slider
    document.getElementById('img-quality').addEventListener('input', updateImageQualityDisplay);

    // Setup convert button
    document.getElementById('img-to-pdf-btn').addEventListener('click', convertImagesToPDF);
}
