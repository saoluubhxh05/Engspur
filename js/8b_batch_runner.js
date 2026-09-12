/**
 * 8b_batch_runner.js
 * Quản lý vòng lặp Render Hàng Loạt (Batch Runner), MediaRecorder kép (Full + Clean), ghi âm luồng PCM/WAV và điều phối đồng bộ
 */

var studioWakeLock = null;
async function requestScreenWakeLock() {
    if ('wakeLock' in navigator) {
        try { studioWakeLock = await navigator.wakeLock.request('screen'); } catch(e) {}
    }
}
function releaseScreenWakeLock() {
    if (studioWakeLock) {
        try { studioWakeLock.release(); } catch(e){}
        studioWakeLock = null;
    }
}

/**
 * Khởi động tiến trình Render Hàng Loạt cho 3 nút:
 * 1. 'combined' -> Nút "Render MP4 Nhanh": Xuất 01 file MP4 tích hợp sẵn âm thanh cho mỗi bài học
 * 2. 'separate_wav' -> Nút "Tách Audio WAV": Xuất 01 file MP4 + 01 file WAV riêng biệt đồng bộ
 * 3. 'dual_parallel' -> Nút "Render Kép (Full + Clean + WAV)": Xuất trọn gói bộ 3 file (Full.mp4, Clean.mp4, .wav)
 */
async function startBatchRenderPipeline(mode = 'combined') {
    ensureSavedParagraphProfiles();
    buildBatchQueueList();

    if (batchRenderQueue.length === 0) {
        showToast("Hàng đợi render trống! Vui lòng kiểm tra lại chủ đề và kịch bản.", "error");
        return;
    }

    const activeQueueItems = batchRenderQueue.filter(q => q.selected !== false);
    if (activeQueueItems.length === 0) {
        showToast("Vui lòng tick chọn ít nhất 1 dòng trong hàng đợi bài học để render!", "warning");
        return;
    }

    if (isBatchRunning || isParagraphRunning) {
        showToast("Đang có tiến trình render chạy! Vui lòng chờ hoặc hủy trước.", "info");
        return;
    }

    // 1. LƯU LẠI 100% TRẠNG THÁI HIỆN TẠI CỦA STUDIO ĐỂ KHÔNG BỊ XÁO TRỘN DỮ LIỆU
    studioSavedBackupState = {
        paragraphGridConfig: JSON.parse(JSON.stringify(paragraphGridConfig)),
        paragraphFieldStyles: JSON.parse(JSON.stringify(paragraphFieldStyles)),
        masterTimelineDuration: masterTimelineDuration,
        activeParagraphProfileId: activeParagraphProfileId,
        paragraphSelectedTopic: paragraphSelectedTopic
    };

    batchExecutionMode = mode;
    batchSharedAudioTrack = null;
    batchCurrentTopicPcmChunks = [];
    batchTopicScheduledAudioList = [];

    // Khởi tạo luồng âm thanh phòng thu nội bộ
    try {
        const audioCtx = (typeof getSharedAudioContext === 'function') ? getSharedAudioContext() : new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }
        batchStudioAudioDest = audioCtx.createMediaStreamDestination();
        batchSharedAudioTrack = batchStudioAudioDest.stream.getAudioTracks()[0];
    } catch(err) {
        console.warn("Lỗi khởi tạo studio audio bus:", err);
    }

    isBatchRunning = true;
    isBatchPaused = false;
    requestScreenWakeLock();

    currentBatchQueueIndex = 0;
    batchTotalVideos = batchRenderQueue.filter(q => q.selected !== false).length;
    batchCompletedReports = [];
    batchTimelineSentenceLogs = [];
    batchRenderStartTime = Date.now();

    // Reset trạng thái hiển thị của các mục trong hàng đợi
    batchRenderQueue.forEach(q => q.status = 'pending');

    // Các nút render bị mờ đi; hai nút "Tạm Dừng" và "Hủy Hàng Đợi" sáng lên
    const btnPause = document.getElementById('btn-batch-pause-resume');
    const btnCancel = document.getElementById('btn-batch-cancel');
    const btnDual = document.getElementById('btn-batch-dual-render');
    const btnSeparate = document.getElementById('btn-batch-separate-render');
    const btnStart = document.getElementById('btn-start-batch-render');
    const btnStatic = document.getElementById('btn-batch-static-render');

    if (btnPause) { btnPause.disabled = false; btnPause.className = "py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center space-x-1 transition"; }
    if (btnCancel) { btnCancel.disabled = false; btnCancel.className = "py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1 transition"; }
    if (btnDual) { btnDual.disabled = true; btnDual.classList.add('opacity-50'); }
    if (btnSeparate) { btnSeparate.disabled = true; btnSeparate.classList.add('opacity-50'); }
    if (btnStart) { btnStart.disabled = true; btnStart.classList.add('opacity-50'); }
    if (btnStatic) { btnStatic.disabled = true; btnStatic.classList.add('opacity-50'); }

    // Dòng trạng thái đổi thông báo
    const statusText = document.getElementById('batch-progress-status-text');
    if (statusText) {
        if (mode === 'dual_parallel') {
            statusText.innerText = "Tiến độ: Đang Render KÉP (Full + Clean + WAV)...";
            statusText.className = "text-xs font-bold text-purple-400";
        } else if (mode === 'separate_wav') {
            statusText.innerText = "Tiến độ: Đang Render Video + Tách Audio WAV...";
            statusText.className = "text-xs font-bold text-teal-400";
        } else {
            statusText.innerText = "Tiến độ: Đang Render...";
            statusText.className = "text-xs font-bold text-amber-400";
        }
    }

    startBatchOverallTimer();
    updateBatchOverallProgress();
    renderBatchTableUI();

    // Bắt đầu mục đầu tiên trong hàng đợi
    runCurrentBatchQueueItem();
}

/**
 * Nút Render Nhanh Kịch Bản Ngoài Lặp:
 * Tự động chuyển chế độ sang outside_loop_only, xây dựng hàng đợi và kích hoạt render ngay
 */
async function startStaticOutsideLoopRender(mode = 'combined') {
    const sel = document.getElementById('batch-render-mode-select');
    if (sel) sel.value = 'outside_loop_only';
    buildBatchQueueList();

    const activeQueueItems = batchRenderQueue.filter(q => q.selected !== false);
    if (activeQueueItems.length === 0) {
        showToast("Không tìm thấy kịch bản nào chỉ có lớp ngoài vòng lặp! Hãy đảm bảo kịch bản của bạn có các lớp và tất cả các lớp đó đều bật 'Ngoài vòng lặp'.", "warning");
        return;
    }
    await startBatchRenderPipeline(mode);
}

function startBatchOverallTimer() {
    if (batchOverallTimer) clearInterval(batchOverallTimer);
    batchOverallTimer = setInterval(() => {
        if (!isBatchRunning) { clearInterval(batchOverallTimer); return; }
        const elapsed = Math.floor((Date.now() - batchRenderStartTime) / 1000);
        const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const s = String(elapsed % 60).padStart(2, '0');
        const timeText = document.getElementById('batch-active-time-text');
        if (timeText) timeText.innerText = `${m}:${s}`;
    }, 1000);
}

async function prepareTopicEdgeTtsAudios(topicName) {
    const isEdge = !videoConfig.ttsVoice || (typeof videoConfig.ttsVoice === 'string' && videoConfig.ttsVoice.startsWith('edge:'));
    if (!isEdge) return;

    // Lọc chuẩn xác danh sách câu theo chủ đề hiện tại cần render
    let activeTopicList = (topicName && topicName !== 'ALL')
        ? importedDatasets.filter(ds => ds.topic === topicName)
        : ((typeof getParagraphFilteredDatasets === 'function') ? getParagraphFilteredDatasets() : importedDatasets);

    if (!activeTopicList || activeTopicList.length === 0) {
        activeTopicList = [{ topic: topicName || "Default", drills: [{ cueWord: "", drillText: "" }] }];
    }

    const fetchPromises = [];

    for (let sIdx = 0; sIdx < activeTopicList.length; sIdx++) {
        const ds = activeTopicList[sIdx];
        const drill = (ds && ds.drills && ds.drills[0]) ? ds.drills[0] : {};
        const dataMap = {
            "Câu hỏi cho mẫu câu": ds.question || "",
            "Mẫu câu": ds.pattern || "",
            "Substitution words": drill.cueWord || "",
            "Dịch Substitution words": drill.dichCueWord || "",
            "Substitution Drills": drill.drillText || "",
            "Phiên âm IPA": drill.ipa || "",
            "Dịch Substitution Drills": drill.dichDrillText || ""
        };
        if (drill.rawRow) {
            Object.keys(drill.rawRow).forEach(k => {
                if (dataMap[k] === undefined) dataMap[k] = String(drill.rawRow[k] || "").trim();
            });
        }

        (paragraphGridConfig.groups || []).forEach((grp) => {
            const ttsItem = (grp.fields || []).find(f => f.type === 'tts');
            if (ttsItem) {
                let textToRead = "";
                if (ttsItem.sourceMode === 'custom') {
                    textToRead = (ttsItem.customText || "").trim();
                } else {
                    const fields = ttsItem.ttsSpeakFields || ["Substitution Drills"];
                    fields.forEach(fk => {
                        if (dataMap[fk]) textToRead += dataMap[fk] + ". ";
                    });
                    textToRead = textToRead.trim();
                }
                if (textToRead) {
                    if (typeof fetchEdgeTtsAudioBuffer === 'function') {
                        const p = fetchEdgeTtsAudioBuffer(textToRead, videoConfig.ttsVoice, videoConfig.ttsRate).catch(e => console.warn("Lỗi fetch trước TTS:", e));
                        fetchPromises.push(p);
                    }
                }
            }
        });
    }

    if (fetchPromises.length > 0) {
        try {
            await Promise.all(fetchPromises);
        } catch (e) {
            console.warn("Lỗi đồng bộ audio buffer:", e);
        }
    }
}

/**
 * Thực thi render bài học hiện tại trong hàng đợi:
 * Tách biệt hoàn toàn từng kịch bản và chủ đề thành các file riêng
 */
async function runCurrentBatchQueueItem() {
    if (!isBatchRunning) return;

    // Tự động bỏ qua các mục không được tick chọn
    while (currentBatchQueueIndex < batchRenderQueue.length && batchRenderQueue[currentBatchQueueIndex].selected === false) {
        currentBatchQueueIndex++;
    }

    if (currentBatchQueueIndex >= batchRenderQueue.length) {
        finishBatchPipeline();
        return;
    }

    const currentItem = batchRenderQueue[currentBatchQueueIndex];
    if (!currentItem) {
        finishBatchPipeline();
        return;
    }

    // 1. Cập nhật nhãn trạng thái của mục trong hàng đợi sang 🔄 Render...
    currentItem.status = 'rendering';
    renderBatchTableUI();

    // 2. Cập nhật Mini Live Monitor góc phải: hiện tên kịch bản và chủ đề đang chạy
    const currentTopicBadge = document.getElementById('batch-current-topic-badge');
    if (currentTopicBadge) {
        currentTopicBadge.innerText = `[${currentItem.scriptTag}] ${currentItem.topic}`;
    }

    // 3. Tự động chuyển tiếp kịch bản sang bài học mới: Nạp cấu hình kịch bản độc lập
    const scriptProf = currentItem.scriptConfig;
    if (scriptProf) {
        paragraphGridConfig = JSON.parse(JSON.stringify(scriptProf));
        masterTimelineDuration = scriptProf.masterDuration || 8.0;

        if (scriptProf.fieldStyles) {
            paragraphFieldStyles = JSON.parse(JSON.stringify(scriptProf.fieldStyles));
        }

        const durInput = document.getElementById('master-loop-duration-input');
        if (durInput) durInput.value = masterTimelineDuration;

        if (typeof updateLoopPresentationModeUI === 'function') updateLoopPresentationModeUI();
        if (typeof syncInlineGridSettingsInputs === 'function') syncInlineGridSettingsInputs();
        if (typeof renderTimelineLayersListUI === 'function') renderTimelineLayersListUI();
        if (typeof renderTimelineTracksUI === 'function') renderTimelineTracksUI();
        if (typeof autoRecalculateAudioLayersDuration === 'function') autoRecalculateAudioLayersDuration();
    }

    paragraphSelectedTopic = currentItem.topic;
    isStaticOutsideLoopRunning = !!currentItem.isOutsideLoopOnly;
    pCurrentSentenceIndex = 0;
    currentTimelinePlayTime = 0.0;
    activePlayingAudioGroupIdx = -1;
    batchCurrentVideoStartTime = 0;
    batchCurrentTopicRealSentenceLogs = [];
    currentBatchSentenceLog = null;

    // 4. RESET DỨT ĐIỂM RECORDER VÀ CHUNKS TRƯỚC KHI BẮT ĐẦU BÀI MỚI (TRÁNH BỊ GOM CHUNG)
    pRecordedChunks = [];
    pCleanRecordedChunks = [];
    batchCurrentTopicPcmChunks = [];
    batchTopicScheduledAudioList = [];

    if (pMediaRecorder && pMediaRecorder.state !== 'inactive') {
        try { pMediaRecorder.stop(); } catch(e) {}
    }
    if (pCleanMediaRecorder && pCleanMediaRecorder.state !== 'inactive') {
        try { pCleanMediaRecorder.stop(); } catch(e) {}
    }

    // Tải trước 100% âm thanh Edge TTS cho chủ đề hiện tại vào cache để phát tức thì 0ms độ trễ
    if (typeof prepareTopicEdgeTtsAudios === 'function') {
        await prepareTopicEdgeTtsAudios(currentItem.topic);
    }

    // Đảm bảo audio track phòng thu luôn tươi mới cho từng bài học
    try {
        const audioCtx = (typeof getSharedAudioContext === 'function') ? getSharedAudioContext() : new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        // Tạo một MediaStreamDestination hoàn toàn mới cho từng bài để timestamp Audio bắt đầu chuẩn xác từ 0ms
        const rawAudioDest = audioCtx.createMediaStreamDestination();

        // Bơm tín hiệu liên tục để AudioTrack không bao giờ bị gián đoạn hay trôi timestamp
        try {
            const osc = audioCtx.createConstantSource ? audioCtx.createConstantSource() : audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            gain.gain.value = 0.00001; // Không nghe thấy nhưng giữ luồng audio liên tục 44.1kHz
            osc.connect(gain);
            gain.connect(rawAudioDest);
            osc.start(0);
        } catch(silErr) {}

        // Gán batchStudioAudioDest trực tiếp vào rawAudioDest (0ms delay - đồng bộ 100% với loa ngoài)
        batchStudioAudioDest = rawAudioDest;
        batchSharedAudioTrack = rawAudioDest.stream.getAudioTracks()[0];
    } catch(e) {
        console.warn("Lỗi khởi tạo studio audio bus:", e);
    }

    // Vẽ khung hình kịch bản lên Canvas chính và đồng bộ sang Mini Live Monitor
    drawParagraphCanvasFrame();
    syncToMiniBatchCanvas();

    // Khởi tạo luồng ghi âm PCM
    if (batchSharedAudioTrack && batchSharedAudioTrack.readyState === 'live') {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!batchAudioContext || batchAudioContext.state === 'closed') {
                batchAudioContext = new AudioCtx({ sampleRate: 44100 });
            }
            if (batchAudioContext.state === 'suspended') {
                batchAudioContext.resume();
            }
            batchAudioSampleRate = batchAudioContext.sampleRate || 44100;

            if (batchAudioProcessorNode) {
                try { batchAudioProcessorNode.disconnect(); } catch(e){}
                batchAudioProcessorNode = null;
            }
            if (batchAudioSourceNode) {
                try { batchAudioSourceNode.disconnect(); } catch(e){}
                batchAudioSourceNode = null;
            }

            const audioStream = new MediaStream([batchSharedAudioTrack]);
            batchAudioSourceNode = batchAudioContext.createMediaStreamSource(audioStream);
            batchAudioProcessorNode = batchAudioContext.createScriptProcessor(4096, 2, 2);
            batchAudioProcessorNode.onaudioprocess = (e) => {
                if (!isBatchRunning || isBatchPaused) return;
                const inL = e.inputBuffer.getChannelData(0);
                const inR = e.inputBuffer.numberOfChannels > 1 ? e.inputBuffer.getChannelData(1) : inL;
                batchCurrentTopicPcmChunks.push({
                    l: new Float32Array(inL),
                    r: new Float32Array(inR)
                });
            };

            batchAudioSourceNode.connect(batchAudioProcessorNode);
            try {
                const muteNode = batchAudioContext.createGain();
                muteNode.gain.value = 0;
                batchAudioProcessorNode.connect(muteNode);
                muteNode.connect(batchAudioContext.destination);
            } catch(muteErr) {
                batchAudioProcessorNode.connect(batchAudioContext.destination);
            }
        } catch(err) {
            console.error("Lỗi khởi tạo Audio Recording cho Topic:", err);
        }
    }

    // 5. TẠO LUỒNG GHI HÌNH CHÍNH (FULL CANVAS CÓ ẢNH NỀN & LOGO) VỚI ĐỒNG BỘ ÂM THANH 100%
    const canvasStream = pCanvas.captureStream(30);
    const videoTracks = [...canvasStream.getVideoTracks()];
    let finalVideoTracks = [...videoTracks];

    if (batchSharedAudioTrack && batchSharedAudioTrack.readyState === 'live') {
        finalVideoTracks.push(batchSharedAudioTrack);
    }

    const videoStream = new MediaStream(finalVideoTracks);
    let mime = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2';
    if (!MediaRecorder.isTypeSupported(mime)) {
        if (MediaRecorder.isTypeSupported('video/mp4')) mime = 'video/mp4';
        else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) mime = 'video/webm;codecs=vp9,opus';
        else mime = 'video/webm';
    }

    const recorderOptions = {
        mimeType: mime,
        videoBitsPerSecond: 4000000,
        audioBitsPerSecond: 192000
    };

    try { pMediaRecorder = new MediaRecorder(videoStream, recorderOptions); }
    catch(e) { pMediaRecorder = new MediaRecorder(videoStream); }

    pMediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) pRecordedChunks.push(e.data);
    };

    // 6. XỬ LÝ KHI KẾT THÚC GHI HÌNH BẢN FULL CỦA BÀI HỌC HIỆN TẠI
    pMediaRecorder.onstop = async () => {
        // Dừng và ngắt audio processor node
        if (batchAudioProcessorNode) {
            try { batchAudioProcessorNode.disconnect(); } catch(e){}
            batchAudioProcessorNode = null;
        }
        if (batchAudioSourceNode) {
            try { batchAudioSourceNode.disconnect(); } catch(e){}
            batchAudioSourceNode = null;
        }

        const ext = mime.includes('mp4') ? 'mp4' : 'webm';
        const durationMs = Math.max(100, Math.round(performance.now() - batchCurrentVideoStartTime));
        const baseName = currentItem.baseName;

        // TÊN CÁC FILE ĐẦU RA ĐỒNG BỘ TUYỆT ĐỐI THEO [STT]-[Tên Kịch Bản]-[Tên Chủ Đề]
        const fullVideoFilename = (batchExecutionMode === 'dual_parallel') ? `${baseName}-Full.mp4` : `${baseName}.mp4`;
        const cleanVideoFilename = `${baseName}-Clean.mp4`;
        const audioFilename = `${baseName}.wav`;

        // Tạo blob video Full
        const videoBlob = new Blob(pRecordedChunks, { type: pMediaRecorder.mimeType || `video/${ext}` });
        const sizeMb = (videoBlob.size / (1024 * 1024)).toFixed(2);

        // Sắp xếp các đoạn âm thanh theo mốc thời gian thực tế đã phát
        if (batchTopicScheduledAudioList && batchTopicScheduledAudioList.length > 0) {
            batchTopicScheduledAudioList.sort((a, b) => a.timeMs - b.timeMs);
        }

        // Tần số lấy mẫu đồng bộ với AudioContext phần cứng
        const targetWavRate = (typeof sharedStudioAudioCtx !== 'undefined' && sharedStudioAudioCtx && sharedStudioAudioCtx.sampleRate) ? sharedStudioAudioCtx.sampleRate : 44100;

        // Tạo blob audio WAV chuẩn phòng thu (Đồng bộ tuyệt đối từng frame với Video và Mini Live Monitor)
        let wavBlob = null;
        if (batchTopicScheduledAudioList && batchTopicScheduledAudioList.length > 0 && typeof createMasterWavBlobFromSentenceAudios === 'function') {
            wavBlob = createMasterWavBlobFromSentenceAudios(batchTopicScheduledAudioList, durationMs, targetWavRate);
        } else if (batchCurrentTopicPcmChunks && batchCurrentTopicPcmChunks.length > 0 && typeof encodePcmChunksToWavBlob === 'function') {
            wavBlob = encodePcmChunksToWavBlob(batchCurrentTopicPcmChunks, durationMs, batchAudioSampleRate);
        } else {
            wavBlob = createWavHeader(Math.floor((durationMs / 1000) * targetWavRate * 4), targetWavRate, 2, 16);
        }

        // LƯU CÁC FILE VÀO MÁY THEO ĐÚNG ĐẶC TẢ CỦA TỪNG NÚT:
        // Lưu file Full.mp4
        await saveBatchVideoFileDirectly(videoBlob, fullVideoFilename);

        // Nếu là Separate WAV hoặc Dual: Lưu file .wav
        if (batchExecutionMode === 'separate_wav' || batchExecutionMode === 'dual_parallel') {
            await saveBatchVideoFileDirectly(wavBlob, audioFilename);
        }

        // NẾU LÀ CHẾ ĐỘ RENDER KÉP (Nút 3): CHẠY TIẾP PHA 2 - QUAY BẢN CLEAN (SIÊU MƯỢT 30FPS, KHÔNG NGHẼN GPU)
        if (batchExecutionMode === 'dual_parallel' && pCleanCanvas) {
            currentItem.status = 'rendering_clean';
            renderBatchTableUI();

            const currentTopicBadge = document.getElementById('batch-current-topic-badge');
            if (currentTopicBadge) {
                currentTopicBadge.innerText = `[${currentItem.scriptTag}] ${currentItem.topic} (Quay Clean 2/2...)`;
            }

            // Chuyển sang pha Clean: Không cần âm thanh, chỉ render pCleanCanvas
            batchCurrentSubPhase = 'clean';
            pCleanRecordedChunks = [];

            const cleanCanvasStream = pCleanCanvas.captureStream(30);
            const cleanStreamTracks = [...cleanCanvasStream.getVideoTracks()];
            const cleanVideoStream = new MediaStream(cleanStreamTracks);

            const cleanRecorderOptions = {
                mimeType: mime,
                videoBitsPerSecond: 3000000
            };

            try { pCleanMediaRecorder = new MediaRecorder(cleanVideoStream, cleanRecorderOptions); }
            catch(e) { pCleanMediaRecorder = new MediaRecorder(cleanVideoStream); }

            pCleanMediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) pCleanRecordedChunks.push(e.data);
            };

            pCleanMediaRecorder.onstop = async () => {
                const cleanBlob = new Blob(pCleanRecordedChunks, { type: pCleanMediaRecorder?.mimeType || `video/${ext}` });
                await saveBatchVideoFileDirectly(cleanBlob, cleanVideoFilename);

                // Hoàn tất mục trong hàng đợi
                completeCurrentBatchQueueItem(currentItem, baseName, fullVideoFilename, cleanVideoFilename, audioFilename, durationMs, sizeMb);
            };

            // Bắt đầu chuỗi quay cho bản Clean
            pCleanMediaRecorder.start(100);
            isParagraphRunning = true;
            isStaticOutsideLoopRunning = !!currentItem.isOutsideLoopOnly;
            pCurrentSentenceIndex = 0;
            currentTimelinePlayTime = 0.0;
            activePlayingAudioGroupIdx = -1;
            drawParagraphCanvasFrame();
            runUnifiedSentenceSequence();
            return;
        }

        // Với Nút 1 và Nút 2: Hoàn tất ngay sau khi lưu
        completeCurrentBatchQueueItem(currentItem, baseName, fullVideoFilename, cleanVideoFilename, audioFilename, durationMs, sizeMb);
    };

    // 7. BẮT ĐẦU GHI HÌNH ĐỒNG BỘ TUYỆT ĐỐI (ZERO LATENCY - 100% SYNC VỚI MINI LIVE MONITOR)
    batchCurrentSubPhase = 'full';
    batchTopicScheduledAudioList = [];
    batchCurrentTopicRealSentenceLogs = [];
    currentBatchSentenceLog = null;

    drawParagraphCanvasFrame();
    syncToMiniBatchCanvas(false);

    batchCurrentVideoStartTime = performance.now();

    pMediaRecorder.start(100);

    isParagraphRunning = true;
    isStaticOutsideLoopRunning = !!currentItem.isOutsideLoopOnly;
    pCurrentSentenceIndex = 0;
    runUnifiedSentenceSequence();
}

function completeCurrentBatchQueueItem(currentItem, baseName, fullVideoFilename, cleanVideoFilename, audioFilename, durationMs, sizeMb) {
    batchCurrentSubPhase = 'full';
    isStaticOutsideLoopRunning = false;
    currentItem.status = 'saved';
    currentItem.savedFilename = (batchExecutionMode === 'dual_parallel') ? `${baseName} (Bộ 3 file)` : ((batchExecutionMode === 'separate_wav') ? `${baseName} (MP4 + WAV)` : fullVideoFilename);
    currentItem.durationMs = durationMs;
    currentItem.fileSizeMb = sizeMb;

    // Thêm vào báo cáo tổng quan Sheet 1
    batchCompletedReports.push({
        stt: currentItem.stt,
        scriptName: currentItem.scriptTag,
        topic: currentItem.topic,
        filename: fullVideoFilename,
        audioFilename: (batchExecutionMode === 'dual_parallel') ? `${cleanVideoFilename} + ${audioFilename}` : ((batchExecutionMode === 'separate_wav') ? audioFilename : 'Đã tích hợp trong MP4'),
        patternsCount: currentItem.patternsCount,
        drillsCount: currentItem.drillsCount,
        durationMs: durationMs,
        durationSec: (durationMs / 1000).toFixed(1),
        fileSizeMb: sizeMb,
        status: 'Hoàn thành'
    });

    // Thêm vào báo cáo chi tiết Sheet 2 (chính xác từng ms theo đồng hồ thực)
    if (currentItem.isOutsideLoopOnly) {
        batchTimelineSentenceLogs.push({
            stt: batchTimelineSentenceLogs.length + 1,
            scriptName: currentItem.scriptTag,
            topic: "Cố định (Ngoài vòng lặp)",
            sentenceIdx: 1,
            cueWord: "Ngoài vòng lặp",
            drillText: "Kịch bản tĩnh ngoài vòng lặp (1 lần)",
            startMs: 0,
            endMs: durationMs,
            durationMs: durationMs
        });
    } else if (batchCurrentTopicRealSentenceLogs && batchCurrentTopicRealSentenceLogs.length > 0) {
        batchCurrentTopicRealSentenceLogs.forEach(logItem => {
            batchTimelineSentenceLogs.push(logItem);
        });
    } else {
        const activeTopicList = getParagraphFilteredDatasets();
        let accumulatedMs = 0;
        activeTopicList.forEach((ds, dIdx) => {
            const drill = (ds && ds.drills && ds.drills[0]) ? ds.drills[0] : {};
            const sentDurMs = Math.round(masterTimelineDuration * 1000);
            batchTimelineSentenceLogs.push({
                stt: batchTimelineSentenceLogs.length + 1,
                scriptName: currentItem.scriptTag,
                topic: currentItem.topic,
                sentenceIdx: dIdx + 1,
                cueWord: drill.cueWord || "",
                drillText: drill.drillText || "",
                startMs: accumulatedMs,
                endMs: accumulatedMs + sentDurMs,
                durationMs: sentDurMs
            });
            accumulatedMs += sentDurMs + 800;
        });
    }

    // Tăng chỉ số hàng đợi và cập nhật giao diện
    currentBatchQueueIndex++;
    updateBatchOverallProgress();
    renderBatchTableUI();

    // Tự động chuyển tiếp sang bài học tiếp theo mà không cần can thiệp
    setTimeout(() => {
        if (isBatchRunning) {
            runCurrentBatchQueueItem();
        }
    }, 600);
}

async function saveBatchVideoFileDirectly(blob, filename) {
    if (batchDirectoryHandle) {
        try {
            const fileHandle = await batchDirectoryHandle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            return true;
        } catch(e) {
            console.error("Lỗi khi ghi tệp trực tiếp vào thư mục máy:", e);
        }
    }
    downloadBlobFallback(blob, filename);
    return true;
}

function updateBatchOverallProgress() {
    const selectedItems = batchRenderQueue.filter(q => q.selected !== false);
    const total = Math.max(1, selectedItems.length);
    const completed = selectedItems.filter(q => q.status === 'saved' || q.status === 'Hoàn thành').length;
    const pct = Math.min(100, Math.round((completed / total) * 100));

    const overallBar = document.getElementById('batch-overall-bar');
    if (overallBar) overallBar.style.width = `${pct}%`;

    const pctText = document.getElementById('batch-progress-pct');
    if (pctText) pctText.innerText = `${pct}%`;

    const countText = document.getElementById('batch-rendered-count-text');
    if (countText) countText.innerText = `Video Hoàn Thành: ${completed} / ${total}`;
}

function toggleBatchPauseResume() {
    isBatchPaused = !isBatchPaused;
    isParagraphPaused = isBatchPaused;

    const text = document.getElementById('batch-pause-text');
    const icon = document.getElementById('batch-pause-icon');

    if (isBatchPaused) {
        if (text) text.innerText = "Tiếp Tục";
        if (icon) icon.setAttribute('data-lucide', 'play');
        showToast("Đã tạm dừng hàng đợi Render!", "info");
    } else {
        if (text) text.innerText = "Tạm Dừng";
        if (icon) icon.setAttribute('data-lucide', 'pause');
        showToast("Tiếp tục chạy hàng đợi!", "success");
        runUnifiedSentenceSequence();
    }
    if (window.lucide && lucide.createIcons) lucide.createIcons();
}

function cancelBatchRender() {
    isBatchRunning = false;
    isBatchPaused = false;
    isParagraphRunning = false;
    batchCurrentSubPhase = 'full';
    releaseScreenWakeLock();
    if (typeof stopStudioRenderClock === 'function') stopStudioRenderClock();

    if (pMediaRecorder && pMediaRecorder.state !== 'inactive') try { pMediaRecorder.stop(); } catch(e){}
    if (pCleanMediaRecorder && pCleanMediaRecorder.state !== 'inactive') try { pCleanMediaRecorder.stop(); } catch(e){}
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (pRenderTimer) cancelAnimationFrame(pRenderTimer);
    if (batchOverallTimer) clearInterval(batchOverallTimer);

    if (batchAudioProcessorNode) {
        try { batchAudioProcessorNode.disconnect(); } catch(e){}
        batchAudioProcessorNode = null;
    }
    if (batchAudioSourceNode) {
        try { batchAudioSourceNode.disconnect(); } catch(e){}
        batchAudioSourceNode = null;
    }
    batchCurrentTopicPcmChunks = [];

    if (batchSharedAudioTrack) {
        try { batchSharedAudioTrack.stop(); } catch(e){}
        batchSharedAudioTrack = null;
    }

    const btnPause = document.getElementById('btn-batch-pause-resume');
    const btnCancel = document.getElementById('btn-batch-cancel');
    const btnDual = document.getElementById('btn-batch-dual-render');
    const btnSeparate = document.getElementById('btn-batch-separate-render');
    const btnStart = document.getElementById('btn-start-batch-render');
    const btnStatic = document.getElementById('btn-batch-static-render');

    if (btnPause) { btnPause.disabled = true; btnPause.className = "py-1.5 px-3 bg-slate-800 text-slate-500 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-not-allowed"; }
    if (btnCancel) { btnCancel.disabled = true; btnCancel.className = "py-1.5 px-3 bg-slate-800 text-slate-500 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-not-allowed"; }
    if (btnDual) { btnDual.disabled = false; btnDual.classList.remove('opacity-50'); }
    if (btnSeparate) { btnSeparate.disabled = false; btnSeparate.classList.remove('opacity-50'); }
    if (btnStart) { btnStart.disabled = false; btnStart.classList.remove('opacity-50'); }
    if (btnStatic) { btnStatic.disabled = false; btnStatic.classList.remove('opacity-50'); }
    isStaticOutsideLoopRunning = false;

    const statusText = document.getElementById('batch-progress-status-text');
    if (statusText) {
        statusText.innerText = "Tiến độ: Đã hủy hàng đợi";
        statusText.className = "text-xs font-bold text-rose-400";
    }

    // Khôi phục 100% kịch bản Studio đang thiết kế
    if (studioSavedBackupState) {
        paragraphGridConfig = JSON.parse(JSON.stringify(studioSavedBackupState.paragraphGridConfig));
        paragraphFieldStyles = JSON.parse(JSON.stringify(studioSavedBackupState.paragraphFieldStyles));
        masterTimelineDuration = studioSavedBackupState.masterTimelineDuration;
        activeParagraphProfileId = studioSavedBackupState.activeParagraphProfileId;
        paragraphSelectedTopic = studioSavedBackupState.paragraphSelectedTopic;
    }

    renderBatchTableUI();
    showToast("Đã dừng an toàn hàng đợi Batch!", "info");
}

function finishBatchPipeline() {
    isBatchRunning = false;
    isBatchPaused = false;
    isParagraphRunning = false;
    releaseScreenWakeLock();
    if (typeof stopStudioRenderClock === 'function') stopStudioRenderClock();

    if (batchOverallTimer) clearInterval(batchOverallTimer);
    if (pCleanMediaRecorder && pCleanMediaRecorder.state !== 'inactive') {
        try { pCleanMediaRecorder.stop(); } catch(e){}
    }
    if (batchAudioProcessorNode) {
        try { batchAudioProcessorNode.disconnect(); } catch(e){}
        batchAudioProcessorNode = null;
    }
    if (batchAudioSourceNode) {
        try { batchAudioSourceNode.disconnect(); } catch(e){}
        batchAudioSourceNode = null;
    }
    batchCurrentTopicPcmChunks = [];

    if (batchSharedAudioTrack) {
        try { batchSharedAudioTrack.stop(); } catch(e){}
        batchSharedAudioTrack = null;
    }

    const btnPause = document.getElementById('btn-batch-pause-resume');
    const btnCancel = document.getElementById('btn-batch-cancel');
    const btnDual = document.getElementById('btn-batch-dual-render');
    const btnSeparate = document.getElementById('btn-batch-separate-render');
    const btnStart = document.getElementById('btn-start-batch-render');
    const btnStatic = document.getElementById('btn-batch-static-render');

    if (btnPause) { btnPause.disabled = true; btnPause.className = "py-1.5 px-3 bg-slate-800 text-slate-500 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-not-allowed"; }
    if (btnCancel) { btnCancel.disabled = true; btnCancel.className = "py-1.5 px-3 bg-slate-800 text-slate-500 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-not-allowed"; }
    if (btnDual) { btnDual.disabled = false; btnDual.classList.remove('opacity-50'); }
    if (btnSeparate) { btnSeparate.disabled = false; btnSeparate.classList.remove('opacity-50'); }
    if (btnStart) { btnStart.disabled = false; btnStart.classList.remove('opacity-50'); }
    if (btnStatic) { btnStatic.disabled = false; btnStatic.classList.remove('opacity-50'); }
    isStaticOutsideLoopRunning = false;

    const statusText = document.getElementById('batch-progress-status-text');
    if (statusText) {
        statusText.innerText = "Tiến độ: ĐÃ XUẤT XONG TẤT CẢ!";
        statusText.className = "text-xs font-bold text-emerald-400";
    }

    const overallBar = document.getElementById('batch-overall-bar');
    if (overallBar) overallBar.style.width = '100%';
    const pctText = document.getElementById('batch-progress-pct');
    if (pctText) pctText.innerText = '100%';
    const countText = document.getElementById('batch-rendered-count-text');
    if (countText) countText.innerText = `Video Hoàn Thành: ${batchRenderQueue.length} / ${batchRenderQueue.length}`;

    const excelBtn = document.getElementById('btn-manual-export-excel');
    if (excelBtn) excelBtn.disabled = false;

    // KHÔI PHỤC NGUYÊN VẸN 100% KỊCH BẢN ĐANG THIẾT KẾ Ở MÀN HÌNH STUDIO MÀ KHÔNG BỊ ĐÈ HAY XÁO TRỘN DỮ LIỆU
    if (studioSavedBackupState) {
        paragraphGridConfig = JSON.parse(JSON.stringify(studioSavedBackupState.paragraphGridConfig));
        paragraphFieldStyles = JSON.parse(JSON.stringify(studioSavedBackupState.paragraphFieldStyles));
        masterTimelineDuration = studioSavedBackupState.masterTimelineDuration;
        activeParagraphProfileId = studioSavedBackupState.activeParagraphProfileId;
        paragraphSelectedTopic = studioSavedBackupState.paragraphSelectedTopic;

        const durInput = document.getElementById('master-loop-duration-input');
        if (durInput) durInput.value = masterTimelineDuration;
    }

    // Tự động tải về file Excel báo cáo 2 Sheet chuẩn xác theo từng ms
    exportBatchExcelReport();
    showToast("🎉 ĐÃ HOÀN TẤT TOÀN BỘ HÀNG ĐỢI & XUẤT BÁO CÁO EXCEL 2 SHEET!", "success");
}
