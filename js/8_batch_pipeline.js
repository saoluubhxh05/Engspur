/**
 * 8_batch_pipeline.js
 * Quản lý chuỗi batch multi-chain, lưu video MP4/WAV qua File System API,
 * bảng tiến độ tách bạch theo từng kịch bản & chủ đề, và báo cáo Excel 2 sheet chuẩn mili-giây
 */

var batchRenderQueue = [];
var currentBatchQueueIndex = 0;

function resetBatchNamingPattern() {
    const input = document.getElementById('batch-naming-pattern-input');
    if (input) input.value = "{stt}-[{script}]-[{topic}]";
    buildBatchQueueList();
    renderBatchTableUI();
    showToast("Đã đặt lại định dạng tên file mặc định: {stt}-[{script}]-[{topic}]");
}

function ensureSavedParagraphProfiles() {
    if (!savedParagraphProfiles || savedParagraphProfiles.length === 0) {
        savedParagraphProfiles = [];

        // 1. Kịch bản đang thiết kế hiện tại
        const currentProfile = JSON.parse(JSON.stringify(paragraphGridConfig));
        currentProfile.id = activeParagraphProfileId || "profile_current";
        currentProfile.name = paragraphGridConfig.name || "Kịch bản 1 (Mặc định)";
        currentProfile.masterDuration = masterTimelineDuration || 8.0;
        currentProfile.fieldStyles = JSON.parse(JSON.stringify(paragraphFieldStyles));
        savedParagraphProfiles.push(currentProfile);

        // 2. Mẫu 1: Phản xạ 1:1
        if (typeof DEFAULT_TEMPLATES_JSON !== 'undefined' && DEFAULT_TEMPLATES_JSON.mode1) {
            const m1 = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES_JSON.mode1));
            m1.fieldStyles = JSON.parse(JSON.stringify(paragraphFieldStyles));
            savedParagraphProfiles.push(m1);
        }

        // 3. Mẫu 2: Xếp tầng nối tiếp
        if (typeof DEFAULT_TEMPLATES_JSON !== 'undefined' && DEFAULT_TEMPLATES_JSON.mode2) {
            const m2 = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES_JSON.mode2));
            m2.fieldStyles = JSON.parse(JSON.stringify(paragraphFieldStyles));
            savedParagraphProfiles.push(m2);
        }
    }

    if (!batchSelectedChainProfiles || batchSelectedChainProfiles.length === 0) {
        batchSelectedChainProfiles = savedParagraphProfiles.map(p => p.id);
    }
}

function onBatchModeChanged(val) {
    const chainPanel = document.getElementById('batch-chain-selector-panel');
    ensureSavedParagraphProfiles();
    if (val === 'mode3_chain') {
        if (chainPanel) chainPanel.classList.remove('hidden');
        renderBatchChainSelectorList();
    } else {
        if (chainPanel) chainPanel.classList.add('hidden');
    }
    buildBatchQueueList();
    renderBatchTableUI();
}

function renderBatchChainSelectorList() {
    ensureSavedParagraphProfiles();
    const container = document.getElementById('batch-chain-checkboxes-container');
    const badge = document.getElementById('batch-chain-count-badge');
    if (!container) return;
    container.innerHTML = '';

    savedParagraphProfiles.forEach(prof => {
        const isChecked = batchSelectedChainProfiles.includes(prof.id);
        const label = document.createElement('label');
        label.className = "flex items-center space-x-1.5 p-1.5 bg-slate-950 rounded border border-slate-800 cursor-pointer hover:border-indigo-500 transition";
        label.innerHTML = `
            <input type="checkbox" value="${prof.id}" ${isChecked ? 'checked' : ''} onchange="toggleBatchChainProfileSelect('${prof.id}', this.checked)" class="rounded bg-slate-900 border-slate-700 text-indigo-500 w-3.5 h-3.5 focus:ring-0">
            <span class="text-[10px] font-bold text-slate-200 truncate" title="${prof.name}">${prof.name}</span>
        `;
        container.appendChild(label);
    });

    if (badge) badge.innerText = `Đã chọn: ${batchSelectedChainProfiles.length} kịch bản`;
    renderBatchCustomNamingInputs();
}

function renderBatchCustomNamingInputs() {
    const namingContainer = document.getElementById('batch-script-custom-naming-container');
    if (!namingContainer) return;
    namingContainer.innerHTML = '';

    if (batchSelectedChainProfiles.length === 0) {
        namingContainer.innerHTML = '<span class="text-slate-500 italic p-1">Tick chọn kịch bản ở trên để tùy chỉnh tên riêng cho từng loại kịch bản.</span>';
        return;
    }

    batchSelectedChainProfiles.forEach((profId, idx) => {
        const prof = savedParagraphProfiles.find(p => p.id === profId);
        if (!prof) return;
        const defaultTag = sanitizeFilename(prof.name || `KB_${idx + 1}`);
        const currentTag = batchCustomScriptNamingMap[profId] !== undefined ? batchCustomScriptNamingMap[profId] : defaultTag;

        const row = document.createElement('div');
        row.className = "flex items-center justify-between gap-2 p-1 bg-slate-950 rounded border border-slate-800";
        row.innerHTML = `
            <span class="font-bold text-slate-300 truncate max-w-[140px]" title="${prof.name}">#${idx + 1}. ${prof.name}:</span>
            <div class="flex items-center space-x-1">
                <span class="text-[8px] text-slate-500">Tên gán:</span>
                <input type="text" value="${currentTag}" oninput="updateScriptNamingTag('${profId}', this.value)" class="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-amber-300 font-mono focus:ring-0 w-32">
            </div>
        `;
        namingContainer.appendChild(row);
    });
}

function updateScriptNamingTag(profId, val) {
    batchCustomScriptNamingMap[profId] = val.trim();
    buildBatchQueueList();
    renderBatchTableUI();
}

function toggleBatchChainProfileSelect(profId, isChecked) {
    if (isChecked) {
        if (!batchSelectedChainProfiles.includes(profId)) batchSelectedChainProfiles.push(profId);
    } else {
        batchSelectedChainProfiles = batchSelectedChainProfiles.filter(id => id !== profId);
    }
    const badge = document.getElementById('batch-chain-count-badge');
    if (badge) badge.innerText = `Đã chọn: ${batchSelectedChainProfiles.length} kịch bản`;
    renderBatchCustomNamingInputs();
    buildBatchQueueList();
    renderBatchTableUI();
}

function refreshBatchTopicsTable() {
    ensureSavedParagraphProfiles();
    const topicMap = new Map();
    importedDatasets.forEach(ds => {
        const t = ds.topic || "General";
        if (!topicMap.has(t)) topicMap.set(t, { topic: t, patternsCount: 0, drillsCount: 0, items: [] });
        const cur = topicMap.get(t);
        cur.patternsCount++;
        cur.drillsCount += (ds.drills || []).length;
        cur.items.push(ds);
    });

    if (topicMap.size === 0) {
        topicMap.set("Default Topic", { topic: "Default Topic", patternsCount: 1, drillsCount: 1, items: [] });
    }

    batchTopicsList = Array.from(topicMap.values()).map((top, idx) => ({
        ...top,
        stt: idx + 1,
        selected: true,
        status: 'pending',
        savedFilename: '',
        durationMs: 0,
        fileSizeMb: 0
    }));

    buildBatchQueueList();
    renderBatchTableUI();
}

function buildBatchQueueList() {
    ensureSavedParagraphProfiles();
    const targetMode = document.getElementById('batch-target-practice-mode')?.value || 'mode3';

    let profilesToRun = [];
    if (targetMode === 'mode3_chain') {
        const selectedIds = batchSelectedChainProfiles.length > 0 ? batchSelectedChainProfiles : savedParagraphProfiles.map(p => p.id);
        selectedIds.forEach(id => {
            const p = savedParagraphProfiles.find(x => x.id === id);
            if (p) profilesToRun.push(p);
        });
    } else {
        profilesToRun = [{
            id: activeParagraphProfileId || 'curr_profile',
            name: paragraphGridConfig.name || "Kịch bản hiện tại",
            masterDuration: masterTimelineDuration || 8.0,
            fieldStyles: paragraphFieldStyles,
            ...paragraphGridConfig
        }];
    }

    if (profilesToRun.length === 0) {
        profilesToRun = [paragraphGridConfig];
    }

    const selectedTopics = batchTopicsList.filter(t => t.selected);
    const activeTopics = (selectedTopics.length > 0) ? selectedTopics : batchTopicsList;

    const newQueue = [];
    let counter = 1;

    profilesToRun.forEach((prof, pIdx) => {
        const defaultTag = sanitizeFilename(prof.name || `KB_${pIdx + 1}`);
        const scriptTag = batchCustomScriptNamingMap[prof.id] || defaultTag;

        activeTopics.forEach((top) => {
            const sttStr = String(counter).padStart(2, '0');
            const safeTopic = sanitizeFilename(top.topic);

            const patternInput = document.getElementById('batch-naming-pattern-input');
            let pattern = (patternInput && patternInput.value.trim()) ? patternInput.value.trim() : "{stt}-[{script}]-[{topic}]";

            let baseName = pattern
                .replace(/\{stt\}/gi, sttStr)
                .replace(/\{script\}/gi, scriptTag)
                .replace(/\{topic\}/gi, safeTopic);
            baseName = sanitizeFilename(baseName);

            // Giữ lại trạng thái nếu item đã hoàn thành trong lượt chạy
            const existing = batchRenderQueue.find(q => q.scriptId === prof.id && q.topic === top.topic);
            const status = existing ? existing.status : 'pending';

            newQueue.push({
                queueId: `q_${pIdx}_${top.topic}`,
                stt: counter,
                sttDisplay: sttStr,
                scriptId: prof.id,
                scriptName: prof.name || `Kịch bản ${pIdx + 1}`,
                scriptTag: scriptTag,
                scriptConfig: prof,
                topic: top.topic,
                patternsCount: top.patternsCount || 1,
                drillsCount: top.drillsCount || 1,
                baseName: baseName,
                expectedFilename: `${baseName}.mp4`,
                status: status,
                savedFilename: existing ? existing.savedFilename : '',
                durationMs: existing ? existing.durationMs : 0,
                fileSizeMb: existing ? existing.fileSizeMb : 0
            });
            counter++;
        });
    });

    batchRenderQueue = newQueue;
}

function renderBatchTableUI() {
    const tbody = document.getElementById('batch-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (batchRenderQueue.length === 0) {
        buildBatchQueueList();
    }

    batchRenderQueue.forEach((item) => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-800/80 transition";

        let statusBadge = `<span class="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-lg text-[9px] font-bold whitespace-nowrap">⏳ Đang chờ</span>`;
        if (item.status === 'rendering') {
            statusBadge = `<span class="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-lg text-[9px] font-bold animate-pulse whitespace-nowrap">🔄 Render...</span>`;
        } else if (item.status === 'saved') {
            statusBadge = `<span class="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-lg text-[9px] font-bold whitespace-nowrap">✅ Đã Lưu</span>`;
        }

        tr.innerHTML = `
            <td class="p-2.5 text-center">
                <span class="w-2 h-2 rounded-full inline-block ${item.status === 'saved' ? 'bg-emerald-400' : (item.status === 'rendering' ? 'bg-amber-400 animate-ping' : 'bg-slate-600')}"></span>
            </td>
            <td class="p-2.5 font-mono text-slate-400 text-[10px] font-bold">${item.sttDisplay}</td>
            <td class="p-2.5">
                <span class="bg-indigo-950 text-indigo-300 border border-indigo-800/80 text-[10px] font-bold px-2 py-0.5 rounded-md truncate inline-block max-w-[140px]" title="${item.scriptName}">
                    ${item.scriptTag}
                </span>
            </td>
            <td class="p-2.5 font-bold text-slate-100 text-[11px] truncate max-w-[150px]" title="${item.topic}">
                ${item.topic}
            </td>
            <td class="p-2.5 text-indigo-300 font-mono text-[10px]">${item.patternsCount}</td>
            <td class="p-2.5 text-teal-300 font-mono text-[10px]">${item.drillsCount}</td>
            <td class="p-2.5 text-amber-200 font-mono text-[10px] truncate max-w-[180px]" title="${item.expectedFilename}">
                ${item.expectedFilename}
            </td>
            <td class="p-2.5 text-right">${statusBadge}</td>
        `;
        tbody.appendChild(tr);
    });

    if (window.lucide && lucide.createIcons) lucide.createIcons();
}

function toggleBatchTopicSelect(idx, isChecked) {
    if (batchTopicsList[idx]) {
        batchTopicsList[idx].selected = isChecked;
        buildBatchQueueList();
        renderBatchTableUI();
    }
}

function toggleSelectAllBatchTopics(isChecked) {
    batchTopicsList.forEach(t => t.selected = isChecked);
    const master = document.getElementById('batch-master-checkbox');
    if (master) master.checked = isChecked;
    buildBatchQueueList();
    renderBatchTableUI();
}

async function pickBatchDirectoryHandle() {
    if (window.showDirectoryPicker) {
        try {
            batchDirectoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            batchDirectoryName = batchDirectoryHandle.name || 'Thư mục đã chọn';
            const dirDisp = document.getElementById('batch-dir-display');
            if (dirDisp) {
                dirDisp.innerText = `📁 ${batchDirectoryName}`;
                dirDisp.className = "text-[10px] text-emerald-300 font-bold truncate";
            }
            showToast(`Đã chọn thư mục lưu trực tiếp: ${batchDirectoryName}!`, "success");
        } catch(e) {
            if (e.name !== 'AbortError') showToast("Không thể cấp quyền truy cập thư mục!", "error");
        }
    } else {
        showToast("Trình duyệt không hỗ trợ chọn thư mục, hệ thống sẽ tự động tải các file về máy.", "info");
    }
}

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

    // 2. BƯỚC 5: HỘP THOẠI TRÌNH DUYỆT HỎI CHIA SẺ ÂM THANH THẺ BÀI HỌC (SHARE TAB AUDIO)
    showToast("💡 Hãy chọn thẻ bài học hiện tại, TÍCH Ô 'Chia sẻ âm thanh thẻ' (Share tab audio) rồi bấm xác nhận!", "info");
    try {
        const systemStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
        });
        const audioTrack = systemStream.getAudioTracks()[0];
        if (audioTrack) {
            batchSharedAudioTrack = audioTrack;
            audioTrack.onended = () => { batchSharedAudioTrack = null; };
            showToast("✅ Đã kết nối âm thanh thẻ trình duyệt thành công! Luồng âm thanh chuẩn xác.", "success");
        } else {
            showToast("⚠️ Chưa tích chọn 'Chia sẻ âm thanh thẻ'. Hệ thống sẽ tự động dùng âm thanh phòng thu tích hợp.", "info");
        }
        // Dừng video tracks của display media để không tốn tài nguyên vì ta dùng pCanvas captureStream
        systemStream.getVideoTracks().forEach(track => track.stop());
    } catch(e) {
        console.warn("Display audio prompt skipped or cancelled, falling back to studio destination.", e);
        try {
            const audioCtx = (typeof getSharedAudioContext === 'function') ? getSharedAudioContext() : new (window.AudioContext || window.webkitAudioContext)();
            batchStudioAudioDest = audioCtx.createMediaStreamDestination();
            batchSharedAudioTrack = batchStudioAudioDest.stream.getAudioTracks()[0];
        } catch(err) {}
    }

    isBatchRunning = true;
    isBatchPaused = false;
    requestScreenWakeLock();

    currentBatchQueueIndex = 0;
    batchTotalVideos = batchRenderQueue.length;
    batchCompletedReports = [];
    batchTimelineSentenceLogs = [];
    batchRenderStartTime = Date.now();

    // Reset trạng thái hiển thị của các mục trong hàng đợi
    batchRenderQueue.forEach(q => q.status = 'pending');

    // 3 nút render bị mờ đi; hai nút "Tạm Dừng" và "Hủy Hàng Đợi" sáng lên
    const btnPause = document.getElementById('btn-batch-pause-resume');
    const btnCancel = document.getElementById('btn-batch-cancel');
    const btnDual = document.getElementById('btn-batch-dual-render');
    const btnSeparate = document.getElementById('btn-batch-separate-render');
    const btnStart = document.getElementById('btn-start-batch-render');

    if (btnPause) { btnPause.disabled = false; btnPause.className = "py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center space-x-1 transition"; }
    if (btnCancel) { btnCancel.disabled = false; btnCancel.className = "py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1 transition"; }
    if (btnDual) { btnDual.disabled = true; btnDual.classList.add('opacity-50'); }
    if (btnSeparate) { btnSeparate.disabled = true; btnSeparate.classList.add('opacity-50'); }
    if (btnStart) { btnStart.disabled = true; btnStart.classList.add('opacity-50'); }

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
    batchTopicScheduledAudioList = [];
    const isEdge = !videoConfig.ttsVoice || (typeof videoConfig.ttsVoice === 'string' && videoConfig.ttsVoice.startsWith('edge:'));
    if (!isEdge) return;

    const activeTopicList = (typeof getParagraphFilteredDatasets === 'function') ? getParagraphFilteredDatasets() : importedDatasets;
    let currentOffsetMs = 0;
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
                const fields = ttsItem.ttsSpeakFields || ["Substitution Drills"];
                let textToRead = "";
                fields.forEach(fk => {
                    if (dataMap[fk]) textToRead += dataMap[fk] + ". ";
                });
                textToRead = textToRead.trim();
                if (textToRead) {
                    const groupStartMs = Math.round((grp.startTime || 0) * 1000);
                    const absTimeMs = currentOffsetMs + groupStartMs;
                    if (typeof fetchEdgeTtsAudioBuffer === 'function') {
                        const p = fetchEdgeTtsAudioBuffer(textToRead, videoConfig.ttsVoice, videoConfig.ttsRate).then(buf => {
                            if (buf) {
                                batchTopicScheduledAudioList.push({
                                    timeMs: absTimeMs,
                                    audioBuffer: buf
                                });
                            }
                        }).catch(e => console.warn("Lỗi fetch trước TTS:", e));
                        fetchPromises.push(p);
                    }
                }
            }
        });

        currentOffsetMs += Math.round(masterTimelineDuration * 1000) + 800;
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
    pCurrentSentenceIndex = 0;
    currentTimelinePlayTime = 0.0;
    activePlayingAudioGroupIdx = -1;
    batchCurrentVideoStartTime = Date.now();

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

    // Tải trước âm thanh Edge TTS cho chủ đề hiện tại
    if (typeof prepareTopicEdgeTtsAudios === 'function') {
        await prepareTopicEdgeTtsAudios(currentItem.topic);
    }

    // Đảm bảo audio track phòng thu luôn có sẵn
    if (!batchSharedAudioTrack || batchSharedAudioTrack.readyState !== 'live') {
        try {
            const audioCtx = (typeof getSharedAudioContext === 'function') ? getSharedAudioContext() : new (window.AudioContext || window.webkitAudioContext)();
            batchStudioAudioDest = audioCtx.createMediaStreamDestination();
            batchSharedAudioTrack = batchStudioAudioDest.stream.getAudioTracks()[0];
        } catch(e) {}
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
            batchAudioProcessorNode.connect(batchAudioContext.destination);
        } catch(err) {
            console.error("Lỗi khởi tạo Audio Recording cho Topic:", err);
        }
    }

    // 5. TẠO LUỒNG GHI HÌNH CHÍNH (FULL CANVAS CÓ ẢNH NỀN & LOGO)
    const canvasStream = pCanvas.captureStream(30);
    const videoTracks = [...canvasStream.getVideoTracks()];
    let finalVideoTracks = [...videoTracks];

    if (batchSharedAudioTrack && batchSharedAudioTrack.readyState === 'live') {
        finalVideoTracks.push(batchSharedAudioTrack);
    }

    const videoStream = new MediaStream(finalVideoTracks);
    let mime = 'video/webm;codecs=vp9,opus';
    if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2')) mime = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2';
    else if (MediaRecorder.isTypeSupported('video/mp4')) mime = 'video/mp4';

    try { pMediaRecorder = new MediaRecorder(videoStream, { mimeType: mime }); }
    catch(e) { pMediaRecorder = new MediaRecorder(videoStream); }

    pMediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) pRecordedChunks.push(e.data);
    };

    // 6. NẾU LÀ CHẾ ĐỘ RENDER KÉP (Nút 3): TẠO LUỒNG GHI HÌNH CLEAN (NỀN TRẮNG KHÔNG LOGO)
    if (batchExecutionMode === 'dual_parallel' && pCleanCanvas) {
        const cleanCanvasStream = pCleanCanvas.captureStream(30);
        const cleanStreamTracks = [...cleanCanvasStream.getVideoTracks()];
        const cleanVideoStream = new MediaStream(cleanStreamTracks);

        try { pCleanMediaRecorder = new MediaRecorder(cleanVideoStream, { mimeType: mime }); }
        catch(e) { pCleanMediaRecorder = new MediaRecorder(cleanVideoStream); }

        pCleanMediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) pCleanRecordedChunks.push(e.data);
        };
    }

    // 7. XỬ LÝ KHI KẾT THÚC GHI HÌNH CỦA BÀI HỌC HIỆN TẠI
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

        // Dừng Clean MediaRecorder nếu đang chạy
        if (pCleanMediaRecorder && pCleanMediaRecorder.state !== 'inactive') {
            try { pCleanMediaRecorder.stop(); } catch(e){}
        }

        const ext = mime.includes('mp4') ? 'mp4' : 'webm';
        const durationMs = Date.now() - batchCurrentVideoStartTime;
        const baseName = currentItem.baseName;

        // TÊN CÁC FILE ĐẦU RA ĐỒNG BỘ TUYỆT ĐỐI THEO [STT]-[Tên Kịch Bản]-[Tên Chủ Đề]
        const fullVideoFilename = (batchExecutionMode === 'dual_parallel') ? `${baseName}-Full.mp4` : `${baseName}.mp4`;
        const cleanVideoFilename = `${baseName}-Clean.mp4`;
        const audioFilename = `${baseName}.wav`;

        // Tạo blob video Full
        const videoBlob = new Blob(pRecordedChunks, { type: pMediaRecorder.mimeType || `video/${ext}` });
        const sizeMb = (videoBlob.size / (1024 * 1024)).toFixed(2);

        // Tạo blob audio WAV chuẩn phòng thu 44.1kHz Stereo 16-bit
        let wavBlob = null;
        if (batchTopicScheduledAudioList && batchTopicScheduledAudioList.length > 0 && typeof createMasterWavBlobFromSentenceAudios === 'function') {
            wavBlob = createMasterWavBlobFromSentenceAudios(batchTopicScheduledAudioList, durationMs, 44100);
        } else if (batchCurrentTopicPcmChunks && batchCurrentTopicPcmChunks.length > 0 && typeof encodePcmChunksToWavBlob === 'function') {
            wavBlob = encodePcmChunksToWavBlob(batchCurrentTopicPcmChunks, durationMs, batchAudioSampleRate);
        } else {
            wavBlob = createWavHeader(Math.floor((durationMs / 1000) * 44100 * 4), 44100, 2, 16);
        }

        // LƯU CÁC FILE VÀO MÁY THEO ĐÚNG ĐẶC TẢ CỦA TỪNG NÚT:
        if (batchExecutionMode === 'dual_parallel') {
            // Nút 3: Render Kép -> Lưu bộ 3 file: Full.mp4, Clean.mp4, .wav
            await saveBatchVideoFileDirectly(videoBlob, fullVideoFilename);

            if (pCleanRecordedChunks.length > 0) {
                const cleanBlob = new Blob(pCleanRecordedChunks, { type: pCleanMediaRecorder?.mimeType || `video/${ext}` });
                await saveBatchVideoFileDirectly(cleanBlob, cleanVideoFilename);
            }
            await saveBatchVideoFileDirectly(wavBlob, audioFilename);
        } else if (batchExecutionMode === 'separate_wav') {
            // Nút 2: Tách Audio WAV -> Lưu 02 file đồng bộ: .mp4 và .wav
            await saveBatchVideoFileDirectly(videoBlob, fullVideoFilename);
            await saveBatchVideoFileDirectly(wavBlob, audioFilename);
        } else {
            // Nút 1: Render MP4 Nhanh -> Lưu 01 file MP4 hoàn chỉnh có sẵn tiếng
            await saveBatchVideoFileDirectly(videoBlob, fullVideoFilename);
        }

        // Cập nhật nhãn trạng thái mục này thành ✅ Đã Lưu
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

        // Thêm vào báo cáo chi tiết Sheet 2 (chính xác từng ms)
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
    };

    // 8. BẮT ĐẦU GHI HÌNH VÀ CHẠY TIMELINE BÀI HỌC
    pMediaRecorder.start(100);
    if (pCleanMediaRecorder && pCleanMediaRecorder.state === 'inactive') {
        pCleanMediaRecorder.start(100);
    }

    isParagraphRunning = true;
    pCurrentSentenceIndex = 0;
    runUnifiedSentenceSequence();
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
    const total = Math.max(1, batchRenderQueue.length);
    const completed = batchRenderQueue.filter(q => q.status === 'saved').length;
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

    if (btnPause) { btnPause.disabled = true; btnPause.className = "py-1.5 px-3 bg-slate-800 text-slate-500 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-not-allowed"; }
    if (btnCancel) { btnCancel.disabled = true; btnCancel.className = "py-1.5 px-3 bg-slate-800 text-slate-500 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-not-allowed"; }
    if (btnDual) { btnDual.disabled = false; btnDual.classList.remove('opacity-50'); }
    if (btnSeparate) { btnSeparate.disabled = false; btnSeparate.classList.remove('opacity-50'); }
    if (btnStart) { btnStart.disabled = false; btnStart.classList.remove('opacity-50'); }

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

    if (btnPause) { btnPause.disabled = true; btnPause.className = "py-1.5 px-3 bg-slate-800 text-slate-500 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-not-allowed"; }
    if (btnCancel) { btnCancel.disabled = true; btnCancel.className = "py-1.5 px-3 bg-slate-800 text-slate-500 rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-not-allowed"; }
    if (btnDual) { btnDual.disabled = false; btnDual.classList.remove('opacity-50'); }
    if (btnSeparate) { btnSeparate.disabled = false; btnSeparate.classList.remove('opacity-50'); }
    if (btnStart) { btnStart.disabled = false; btnStart.classList.remove('opacity-50'); }

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

function exportBatchExcelReport() {
    if (batchCompletedReports.length === 0) {
        showToast("Chưa có dữ liệu hoàn thành để xuất báo cáo!", "info");
        return;
    }
    const wb = XLSX.utils.book_new();

    // SHEET 1: TỔNG QUAN VIDEO
    const wsOverview = XLSX.utils.json_to_sheet(batchCompletedReports.map(r => ({
        "STT": r.stt,
        "Kịch Bản": r.scriptName,
        "Chủ Đề": r.topic,
        "Tên File Video": r.filename,
        "File Audio Kèm Theo": r.audioFilename,
        "Số Mẫu Câu": r.patternsCount,
        "Tổng Drills": r.drillsCount,
        "Thời Lượng Video (ms)": r.durationMs,
        "Thời Lượng (Giây)": r.durationSec,
        "Dung Lượng (MB)": r.fileSizeMb,
        "Trạng Thái": r.status
    })));
    XLSX.utils.book_append_sheet(wb, wsOverview, "Tổng Quan Video");

    // SHEET 2: CHI TIẾT TIMELINE (CHUẨN TỪNG MILLISECOND)
    const wsTimeline = XLSX.utils.json_to_sheet(batchTimelineSentenceLogs.map((log) => ({
        "STT Dòng": log.stt,
        "Kịch Bản": log.scriptName,
        "Chủ Đề": log.topic,
        "Thứ Tự Câu": log.sentenceIdx,
        "Từ Gợi Mở (Cue)": log.cueWord,
        "Câu Luyện Tập (Drill)": log.drillText,
        "Bắt Đầu (ms)": log.startMs,
        "Kết Thúc (ms)": log.endMs,
        "Thời Lượng (ms)": log.durationMs
    })));
    XLSX.utils.book_append_sheet(wb, wsTimeline, "Chi Tiết Timeline");

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `EngSpur_Batch_Detailed_Report_${dateStr}.xlsx`);
    showToast("Đã xuất và tải file Excel báo cáo 2 Sheet chuẩn xác từng mili-giây!", "success");
}

function activateBatchRenderView() {
    const vStudio = document.getElementById('view-studio');
    const vBatch = document.getElementById('view-batch-render');
    if (vStudio) vStudio.classList.add('hidden');
    if (vBatch) vBatch.classList.remove('hidden');

    const btnStudio = document.getElementById('tab-paragraph-btn');
    const btnBatch = document.getElementById('tab-batch-btn');
    if (btnStudio) {
        btnStudio.className = "px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition flex items-center space-x-1.5 whitespace-nowrap";
    }
    if (btnBatch) {
        btnBatch.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap bg-emerald-600 text-white shadow-md";
    }

    ensureSavedParagraphProfiles();
    refreshBatchTopicsTable();
    showToast("Đã mở giao diện Render Hàng Loạt!");
}

function openBatchRenderModal() {
    activateBatchRenderView();
}

function closeBatchRenderModal() {
    activateStudioWorkspace();
}

function showDirectLiveVideoPlayer() {
    if (!pRenderedBlob) {
        showToast("Chưa có video render!", "error");
        return;
    }
    closeSaveFileModal();
    showToast("Đã mở trình xem trực tiếp Video MP4!");
}

function closeSaveFileModal() { 
    const modal = document.getElementById('save-file-modal');
    if (modal) modal.classList.add('hidden'); 
}

async function triggerFilePickerSave() {
    const blob = pRenderedBlob;
    if (!blob) return;
    const ext = 'mp4';

    if (window.showSaveFilePicker) {
        try {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: `EngSpur_Video_${Date.now()}.${ext}`,
                types: [{ description: 'Video MP4 File', accept: { 'video/*': [`.${ext}`] } }]
            });
            const writableStream = await fileHandle.createWritable();
            await writableStream.write(blob);
            await writableStream.close();
            closeSaveFileModal();
            showToast("Đã lưu video thành công vào máy tính!");
        } catch(e) {
            if (e.name !== 'AbortError') downloadBlobFallback(blob, `EngSpur_Video_${Date.now()}.${ext}`);
            closeSaveFileModal();
        }
    } else {
        downloadBlobFallback(blob, `EngSpur_Video_${Date.now()}.${ext}`);
        closeSaveFileModal();
    }
}

function downloadBlobFallback(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
    showToast(`Đã tải file ${filename} về máy!`, "success");
}
