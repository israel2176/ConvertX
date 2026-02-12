/**
 * Trim Media Module - Cut video/audio files
 */

// Global variables for trim
let trimFile = null;
let trimDuration = 0;

/**
 * Parse time string to seconds
 * @param {string} timeStr - Time string in MM:SS or HH:MM:SS format
 * @returns {number|null} Time in seconds or null if invalid
 */
function parseTimeToSeconds(timeStr) {
    if (!timeStr || timeStr.trim() === '') return null;

    const parts = timeStr.trim().split(':').map(p => parseFloat(p));

    if (parts.some(isNaN)) return null;

    if (parts.length === 2) {
        // MM:SS
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
        // HH:MM:SS
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 1) {
        // Just seconds
        return parts[0];
    }

    return null;
}

/**
 * Format seconds to time string
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Handle trim file selection
 * @param {FileList} files - Selected files
 */
function onTrimFileSelect(files) {
    if (files.length === 0) return;
    trimFile = files[0];

    const isVideo = trimFile.type.startsWith('video/') ||
                   ['.mp4', '.webm', '.avi', '.mkv', '.mov'].some(ext => trimFile.name.toLowerCase().endsWith(ext));

    // Show preview
    const dropContent = document.getElementById('trim-drop-content');
    const preview = document.getElementById('trim-preview');
    const videoPreview = document.getElementById('trim-video-preview');
    const audioPreview = document.getElementById('trim-audio-preview');
    const dropZone = document.getElementById('trim-drop');

    dropContent.style.display = 'none';
    preview.style.display = 'flex';

    document.getElementById('trim-preview-name').textContent = trimFile.name;
    document.getElementById('trim-preview-size').textContent = formatFileSize(trimFile.size);

    const url = URL.createObjectURL(trimFile);

    if (isVideo) {
        videoPreview.src = url;
        videoPreview.style.display = 'block';
        audioPreview.style.display = 'none';
        preview.classList.add('media-preview-full');
        dropZone.classList.add('has-video-preview');

        videoPreview.onloadedmetadata = () => {
            trimDuration = videoPreview.duration;
            document.getElementById('trim-preview-duration').textContent = `משך: ${formatTime(trimDuration)}`;
            document.getElementById('trim-end').placeholder = formatTime(trimDuration);
            updateTrimDuration();
        };
    } else {
        audioPreview.src = url;
        audioPreview.style.display = 'block';
        videoPreview.style.display = 'none';
        preview.classList.remove('media-preview-full');
        dropZone.classList.remove('has-video-preview');

        audioPreview.onloadedmetadata = () => {
            trimDuration = audioPreview.duration;
            document.getElementById('trim-preview-duration').textContent = `משך: ${formatTime(trimDuration)}`;
            document.getElementById('trim-end').placeholder = formatTime(trimDuration);
            updateTrimDuration();
        };
    }

    document.getElementById('trim-controls').style.display = 'block';
    document.getElementById('trim-btn').disabled = false;

    // Clear previous values
    document.getElementById('trim-start').value = '';
    document.getElementById('trim-end').value = '';
}

/**
 * Remove the selected trim file
 */
function removeTrimFile() {
    trimFile = null;
    trimDuration = 0;
    document.getElementById('trim-drop-content').style.display = 'flex';
    const preview = document.getElementById('trim-preview');
    preview.style.display = 'none';
    preview.classList.remove('media-preview-full');
    document.getElementById('trim-drop').classList.remove('has-video-preview');
    document.getElementById('trim-video-preview').src = '';
    document.getElementById('trim-audio-preview').src = '';
    document.getElementById('trim-btn').disabled = true;
    document.getElementById('trim-input').value = '';
    document.getElementById('trim-controls').style.display = 'none';
    document.getElementById('trim-start').value = '';
    document.getElementById('trim-end').value = '';
    document.getElementById('trim-result-duration').textContent = '--:--';
}

/**
 * Set current time from video/audio to input
 * @param {string} inputId - The input element ID
 */
function setCurrentTime(inputId) {
    const videoPreview = document.getElementById('trim-video-preview');
    const audioPreview = document.getElementById('trim-audio-preview');

    let currentTime = 0;
    if (videoPreview.style.display !== 'none') {
        currentTime = videoPreview.currentTime;
    } else {
        currentTime = audioPreview.currentTime;
    }

    document.getElementById(inputId).value = formatTime(currentTime);
    updateTrimDuration();
}

/**
 * Update the trim result duration display
 */
function updateTrimDuration() {
    const startTime = parseTimeToSeconds(document.getElementById('trim-start').value) || 0;
    const endTime = parseTimeToSeconds(document.getElementById('trim-end').value) || trimDuration;

    const duration = endTime - startTime;

    if (duration > 0) {
        document.getElementById('trim-result-duration').textContent = formatTime(duration);
    } else {
        document.getElementById('trim-result-duration').textContent = '--:--';
    }
}

/**
 * Show trim error message
 * @param {string} message - Error message to display
 */
function showTrimError(message) {
    const resultEl = document.getElementById('trim-result');
    resultEl.innerHTML = `
        <p>שגיאה</p>
        <p style="color: #888;">${message}</p>
    `;
    resultEl.className = 'result error';
    resultEl.style.display = 'block';
}

/**
 * Trim the media file
 */
async function trimMedia() {
    if (!trimFile || !ffmpegLoaded) return;

    const startTime = parseTimeToSeconds(document.getElementById('trim-start').value);
    const endTime = parseTimeToSeconds(document.getElementById('trim-end').value);

    // Validation
    if (startTime === null && endTime === null) {
        showTrimError('נא להזין זמן התחלה או סיום לחיתוך');
        return;
    }

    if (startTime !== null && startTime < 0) {
        showTrimError('זמן ההתחלה לא יכול להיות שלילי');
        return;
    }

    if (endTime !== null && endTime < 0) {
        showTrimError('זמן הסיום לא יכול להיות שלילי');
        return;
    }

    if (startTime !== null && startTime >= trimDuration) {
        showTrimError(`זמן ההתחלה (${formatTime(startTime)}) חורג מאורך הקובץ (${formatTime(trimDuration)})`);
        return;
    }

    if (endTime !== null && endTime > trimDuration) {
        showTrimError(`זמן הסיום (${formatTime(endTime)}) חורג מאורך הקובץ (${formatTime(trimDuration)})`);
        return;
    }

    if (startTime !== null && endTime !== null && startTime >= endTime) {
        showTrimError('זמן ההתחלה חייב להיות קטן מזמן הסיום');
        return;
    }

    // Hide any previous error
    document.getElementById('trim-result').style.display = 'none';
    document.getElementById('trim-result').classList.remove('error');

    const inputExt = trimFile.name.substring(trimFile.name.lastIndexOf('.'));
    const inputName = 'input' + inputExt;
    const outputName = 'output' + inputExt;
    const downloadName = trimFile.name.substring(0, trimFile.name.lastIndexOf('.')) + '_trimmed' + inputExt;

    document.getElementById('trim-progress').style.display = 'block';
    document.getElementById('trim-btn').disabled = true;

    try {
        const fetchFile = window.ffmpegFetchFile;
        ffmpeg.FS('writeFile', inputName, await fetchFile(trimFile));

        let args = [];

        // Add start time (before input for faster seeking)
        if (startTime !== null && startTime > 0) {
            args.push('-ss', startTime.toString());
        }

        args.push('-i', inputName);

        // Add end time
        if (endTime !== null) {
            if (startTime !== null && startTime > 0) {
                const duration = endTime - startTime;
                if (duration > 0) {
                    args.push('-t', duration.toString());
                }
            } else {
                args.push('-to', endTime.toString());
            }
        }

        // Copy codecs for faster processing
        args.push('-c', 'copy');
        args.push('-y', outputName);

        // Update progress
        document.getElementById('trim-progress-fill').style.width = '50%';
        document.getElementById('trim-progress-text').textContent = 'חותך...';

        await ffmpeg.run(...args);

        document.getElementById('trim-progress-fill').style.width = '100%';

        const data = ffmpeg.FS('readFile', outputName);
        const blob = new Blob([data.buffer], { type: trimFile.type });

        const actualStart = startTime || 0;
        const actualEnd = endTime || trimDuration;
        const resultDuration = actualEnd - actualStart;

        // Show download modal
        showDownloadModal({
            title: 'החיתוך הושלם!',
            subtitle: `${formatTime(actualStart)} - ${formatTime(actualEnd)} (${formatTime(resultDuration)})`,
            originalSize: trimFile.size,
            newSize: blob.size,
            blob: blob,
            filename: downloadName
        });

        // Cleanup
        ffmpeg.FS('unlink', inputName);
        ffmpeg.FS('unlink', outputName);

    } catch (error) {
        console.error('Trim error:', error);
        showError('trim-result', error.message);
    }

    document.getElementById('trim-progress').style.display = 'none';
    document.getElementById('trim-btn').disabled = false;
}

/**
 * Initialize trim converter
 */
function initTrim() {
    // Setup drop zone
    setupDropZone(
        document.getElementById('trim-drop'),
        document.getElementById('trim-input'),
        onTrimFileSelect
    );

    // Setup remove button
    document.getElementById('trim-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        removeTrimFile();
    });

    // Setup set time buttons
    document.getElementById('trim-set-start').addEventListener('click', () => {
        setCurrentTime('trim-start');
    });

    document.getElementById('trim-set-end').addEventListener('click', () => {
        setCurrentTime('trim-end');
    });

    // Update duration on input change
    document.getElementById('trim-start').addEventListener('input', updateTrimDuration);
    document.getElementById('trim-end').addEventListener('input', updateTrimDuration);

    // Prevent video/audio clicks from opening file dialog
    document.getElementById('trim-video-preview').addEventListener('click', (e) => {
        e.stopPropagation();
    });
    document.getElementById('trim-audio-preview').addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Setup trim button
    document.getElementById('trim-btn').addEventListener('click', trimMedia);

    // Hide controls initially
    document.getElementById('trim-controls').style.display = 'none';

    // Check if FFmpeg is already loaded
    if (ffmpegLoaded) {
        document.getElementById('trim-ffmpeg-status').style.display = 'none';
        document.getElementById('trim-converter').style.display = 'block';
    }
}
