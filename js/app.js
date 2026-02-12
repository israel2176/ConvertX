/**
 * Main Application Initialization
 */

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize tabs
    initTabs();

    // Initialize media converter
    initMediaConverter();

    // Initialize trim
    initTrim();

    // Initialize images to PDF
    initImagesToPdf();

    // Initialize PDF to images
    initPdfToImages();

    // Initialize PDF compress
    initPdfCompress();

    // Update stats display
    if (typeof updateStatsDisplay === 'function') {
        updateStatsDisplay();
    }
});
