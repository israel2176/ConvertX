/**
 * Media Converter Module - FFmpeg-based video/audio conversion
 */

// Global variables for media converter
let ffmpeg = null;
let ffmpegLoaded = false;
let mediaFile = null;

/**
 * Load FFmpeg WASM
 */
async function loadFFmpeg() {
    try {
        const { createFFmpeg, fetchFile } = FFmpeg;

        ffmpeg = createFFmpeg({
            log: true,
            progress: ({ ratio }) => {
                const percent = Math.round(ratio * 100);
                document.getElementById('media-progress-fill').style.width = percent + '%';
                document.getElementById('media-progress-text').textContent = `ממיר... ${percent}%`;
            }
        });

        await ffmpeg.load();

        // Store fetchFile for later use
        window.ffmpegFetchFile = fetchFile;

        ffmpegLoaded = true;
        document.getElementById('ffmpeg-status').style.display = 'none';
        document.getElementById('media-converter').style.display = 'block';

        // Also update trim tab
        const trimStatus = document.getElementById('trim-ffmpeg-status');
        const trimConverter = document.getElementById('trim-converter');
        if (trimStatus) trimStatus.style.display = 'none';
        if (trimConverter) trimConverter.style.display = 'block';
    } catch (error) {
        console.error('Error loading FFmpeg:', error);
        document.getElementById('ffmpeg-status').innerHTML = `
            <p style="color: #e94560;">שגיאה בטעינת מנוע ההמרה</p>
            <p style="color: #888; font-size: 0.9em;">${error.message}</p>
            <p style="color: #888; font-size: 0.9em; margin-top: 10px;">
                נסה לרענן את הדף או להשתמש בדפדפן Chrome/Edge
            </p>
        `;
    }
}

/**
 * Handle media file selection
 * @param {FileList} files - Selected files
 */
function onMediaFileSelect(files) {
    if (files.length === 0) return;
    mediaFile = files[0];

    // Show/hide video options based on file type
    const isVideo = mediaFile.type.startsWith('video/') ||
                   ['.mp4', '.webm', '.avi', '.mkv', '.mov'].some(ext => mediaFile.name.toLowerCase().endsWith(ext));
    document.getElementById('video-options').style.display = isVideo ? 'block' : 'none';
    document.getElementById('video-quality-options').style.display = isVideo ? 'block' : 'none';
    document.getElementById('media-convert-btn').disabled = false;

    // Show preview
    const dropContent = document.getElementById('media-drop-content');
    const preview = document.getElementById('media-preview');
    const videoPreview = document.getElementById('video-preview');
    const audioPreview = document.getElementById('audio-preview');

    dropContent.style.display = 'none';
    preview.style.display = 'flex';

    document.getElementById('media-preview-name').textContent = mediaFile.name;
    document.getElementById('media-preview-size').textContent = formatFileSize(mediaFile.size);

    const url = URL.createObjectURL(mediaFile);

    const dropZone = document.getElementById('media-drop');

    if (isVideo) {
        videoPreview.src = url;
        videoPreview.style.display = 'block';
        audioPreview.style.display = 'none';
        preview.classList.add('media-preview-full');
        dropZone.classList.add('has-video-preview');
    } else {
        audioPreview.src = url;
        audioPreview.style.display = 'block';
        videoPreview.style.display = 'none';
        preview.classList.remove('media-preview-full');
        dropZone.classList.remove('has-video-preview');
    }
}

/**
 * Remove the selected media file
 */
function removeMediaFile() {
    mediaFile = null;
    document.getElementById('media-drop-content').style.display = 'flex';
    const preview = document.getElementById('media-preview');
    preview.style.display = 'none';
    preview.classList.remove('media-preview-full');
    document.getElementById('media-drop').classList.remove('has-video-preview');
    document.getElementById('video-preview').src = '';
    document.getElementById('audio-preview').src = '';
    document.getElementById('media-convert-btn').disabled = true;
    document.getElementById('media-input').value = '';
}

/**
 * Handle format change to show/hide video options
 */
function onMediaFormatChange(e) {
    const isVideoFormat = ['mp4', 'webm', 'avi'].includes(e.target.value);
    document.getElementById('video-options').style.display = isVideoFormat ? 'block' : 'none';
    document.getElementById('video-quality-options').style.display = isVideoFormat ? 'block' : 'none';
}

/**
 * Convert media file using FFmpeg
 */
async function convertMedia() {
    if (!mediaFile || !ffmpegLoaded) return;

    const format = document.getElementById('media-format').value;
    const audioBitrate = document.getElementById('audio-bitrate').value;
    const resolution = document.getElementById('video-resolution').value;
    const crf = document.getElementById('video-crf').value;

    const inputExt = mediaFile.name.substring(mediaFile.name.lastIndexOf('.'));
    const inputName = 'input' + inputExt;
    const outputName = 'output.' + format;
    const downloadName = mediaFile.name.substring(0, mediaFile.name.lastIndexOf('.')) + '.' + format;

    document.getElementById('media-progress').style.display = 'block';
    document.getElementById('media-convert-btn').disabled = true;
    document.getElementById('media-result').className = 'result';

    try {
        const fetchFile = window.ffmpegFetchFile;
        ffmpeg.FS('writeFile', inputName, await fetchFile(mediaFile));

        let args = ['-i', inputName];

        // Audio settings
        const audioFormats = ['mp3', 'wav', 'ogg', 'm4a'];
        if (audioFormats.includes(format)) {
            args.push('-b:a', audioBitrate);
            if (format === 'mp3') {
                args.push('-codec:a', 'libmp3lame');
            }
        } else {
            // Video settings
            args.push('-b:a', audioBitrate);
            args.push('-crf', crf);

            if (resolution !== 'original') {
                args.push('-vf', `scale=${resolution}`);
            }

            if (format === 'webm') {
                args.push('-c:v', 'libvpx');
                args.push('-c:a', 'libvorbis');
            } else if (format === 'mp4') {
                args.push('-c:v', 'libx264');
                args.push('-c:a', 'aac');
            }
        }

        args.push('-y', outputName);

        await ffmpeg.run(...args);

        const data = ffmpeg.FS('readFile', outputName);
        const mimeTypes = {
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'ogg': 'audio/ogg',
            'm4a': 'audio/mp4',
            'mp4': 'video/mp4',
            'webm': 'video/webm',
            'avi': 'video/x-msvideo'
        };

        const blob = new Blob([data.buffer], { type: mimeTypes[format] });

        const originalSize = mediaFile.size;

        // Show download modal
        showDownloadModal({
            title: 'ההמרה הושלמה!',
            subtitle: downloadName,
            originalSize: originalSize,
            newSize: blob.size,
            blob: blob,
            filename: downloadName
        });

        // Cleanup
        ffmpeg.FS('unlink', inputName);
        ffmpeg.FS('unlink', outputName);

    } catch (error) {
        console.error('Conversion error:', error);
        showError('media-result', error.message);
    }

    document.getElementById('media-progress').style.display = 'none';
    document.getElementById('media-convert-btn').disabled = false;
}

/**
 * Initialize media converter
 */
function initMediaConverter() {
    // Setup drop zone
    setupDropZone(
        document.getElementById('media-drop'),
        document.getElementById('media-input'),
        onMediaFileSelect
    );

    // Prevent video/audio clicks from opening file dialog
    document.getElementById('video-preview').addEventListener('click', (e) => {
        e.stopPropagation();
    });
    document.getElementById('audio-preview').addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Setup format change listener
    document.getElementById('media-format').addEventListener('change', onMediaFormatChange);

    // Setup remove button
    document.getElementById('media-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        removeMediaFile();
    });

    // Setup convert button
    document.getElementById('media-convert-btn').addEventListener('click', convertMedia);

    // Load FFmpeg
    loadFFmpeg();
}
