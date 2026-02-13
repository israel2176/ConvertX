/**
 * Utility functions for File Converter
 */

// ============================================
// STATISTICS TRACKING
// ============================================

const STATS_KEY = 'convertx_stats';

/**
 * Get current statistics from localStorage
 * @returns {Object} Stats object with filesProcessed and bytesProcessed
 */
function getStats() {
    try {
        const stats = localStorage.getItem(STATS_KEY);
        if (stats) {
            return JSON.parse(stats);
        }
    } catch (e) {
        console.error('Error reading stats:', e);
    }
    return { filesProcessed: 0, bytesProcessed: 0 };
}

/**
 * Save statistics to localStorage
 * @param {Object} stats - Stats object to save
 */
function saveStats(stats) {
    try {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
        console.error('Error saving stats:', e);
    }
}

/**
 * Track a processed file
 * @param {number} bytes - Size of the processed file in bytes
 */
function trackFileProcessed(bytes) {
    const stats = getStats();
    stats.filesProcessed++;
    stats.bytesProcessed += bytes;
    saveStats(stats);
    updateStatsDisplay();
}

/**
 * Update the statistics display in the UI
 */
function updateStatsDisplay() {
    const stats = getStats();
    const filesEl = document.getElementById('stats-files');
    const sizeEl = document.getElementById('stats-size');

    if (filesEl) {
        filesEl.textContent = stats.filesProcessed.toLocaleString('he-IL');
    }
    if (sizeEl) {
        sizeEl.textContent = formatFileSize(stats.bytesProcessed);
    }
}

/**
 * Reset statistics in localStorage and UI
 */
function resetStats() {
    if (confirm('האם אתה בטוח שברצונך לאפס את הסטטיסטיקה?')) {
        saveStats({ filesProcessed: 0, bytesProcessed: 0 });
        updateStatsDisplay();
    }
}

// ============================================
// FILE SIZE FORMATTING
// ============================================

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Download a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename for download
 */
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Setup drag-and-drop functionality for a drop zone
 * @param {HTMLElement} dropZone - The drop zone element
 * @param {HTMLInputElement} input - The file input element
 * @param {Function} onFileSelect - Callback when files are selected
 */
function setupDropZone(dropZone, input, onFileSelect) {
    dropZone.addEventListener('click', () => input.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        onFileSelect(files);
    });

    input.addEventListener('change', (e) => {
        onFileSelect(e.target.files);
    });
}

/**
 * Show error message in a result element
 * @param {string} elementId - The ID of the result element
 * @param {string} message - The error message
 */
function showError(elementId, message) {
    const resultEl = document.getElementById(elementId);
    resultEl.innerHTML = `
        <p>שגיאה</p>
        <p style="color: #888;">${message}</p>
    `;
    resultEl.className = 'result error';
    resultEl.style.display = 'block';
}

/**
 * Show success message with download button
 * @param {string} elementId - The ID of the result element
 * @param {string} message - The success message
 * @param {string} downloadHtml - HTML for download button(s)
 */
function showSuccess(elementId, message, downloadHtml) {
    const resultEl = document.getElementById(elementId);
    resultEl.innerHTML = `
        <p>${message}</p>
        ${downloadHtml}
    `;
    resultEl.className = 'result';
    resultEl.style.display = 'block';
}

/**
 * Show download modal
 * @param {Object} options - Modal options
 * @param {string} options.title - Modal title
 * @param {string} options.subtitle - Modal subtitle
 * @param {number} options.originalSize - Original file size in bytes
 * @param {number} options.newSize - New file size in bytes
 * @param {Blob} options.blob - The blob to download
 * @param {string} options.filename - Download filename
 * @param {boolean} options.showOriginalSize - Whether to show original size (default: true)
 */
function showDownloadModal(options) {
    const modal = document.getElementById('download-modal');
    const modalStats = document.getElementById('modal-stats');

    document.getElementById('modal-title').textContent = options.title || 'ההמרה הושלמה!';
    document.getElementById('modal-subtitle').textContent = options.subtitle || 'הקובץ מוכן להורדה';

    if (options.showOriginalSize !== false && options.originalSize) {
        modalStats.innerHTML = `
            <div class="modal-stat">
                <div class="modal-stat-value">${formatFileSize(options.originalSize)}</div>
                <div class="modal-stat-label">גודל מקורי</div>
            </div>
            <div class="modal-stat highlight">
                <div class="modal-stat-value">${formatFileSize(options.newSize)}</div>
                <div class="modal-stat-label">גודל חדש</div>
            </div>
        `;
    } else {
        modalStats.innerHTML = `
            <div class="modal-stat highlight" style="flex: none; min-width: 150px;">
                <div class="modal-stat-value">${formatFileSize(options.newSize)}</div>
                <div class="modal-stat-label">גודל הקובץ</div>
            </div>
        `;
    }

    const downloadBtn = document.getElementById('modal-download-btn');
    downloadBtn.onclick = () => {
        downloadBlob(options.blob, options.filename);
        closeDownloadModal();
    };

    // Track statistics
    if (options.originalSize) {
        trackFileProcessed(options.originalSize);
    } else if (options.newSize) {
        trackFileProcessed(options.newSize);
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close the download modal
 */
function closeDownloadModal() {
    const modal = document.getElementById('download-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Close modal on overlay click
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('download-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeDownloadModal();
            }
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDownloadModal();
        }
    });
});
