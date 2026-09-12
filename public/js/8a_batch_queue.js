/**
 * 8a_batch_queue.js
 * Quản lý hàng đợi Batch Render: cấu hình đặt tên file theo mẫu, kịch bản chuỗi (chain), bảng danh sách chủ đề, chọn thư mục lưu
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

function isScriptOutsideLoopOnly(gridConfig) {
    if (!gridConfig || !gridConfig.groups || gridConfig.groups.length === 0) return false;
    return gridConfig.groups.every(grp => grp.isInsideLoop === false);
}

function buildBatchQueueList() {
    ensureSavedParagraphProfiles();
    const targetMode = document.getElementById('batch-target-practice-mode')?.value || 'mode3';
    const separateType = document.getElementById('batch-separate-output-type')?.value || 'per_script';
    const patternInput = document.getElementById('batch-naming-pattern-input');
    let pattern = (patternInput && patternInput.value.trim()) ? patternInput.value.trim() : "{stt}-[{script}]-[{topic}]";

    let profilesToRun = [];
    if (targetMode === 'mode3_chain') {
        const selectedIds = (batchSelectedChainProfiles && batchSelectedChainProfiles.length > 0)
            ? batchSelectedChainProfiles
            : savedParagraphProfiles.map(p => p.id);
        selectedIds.forEach(id => {
            const p = savedParagraphProfiles.find(x => x.id === id);
            if (p) profilesToRun.push(p);
        });
    } else if (targetMode === 'outside_loop_only') {
        profilesToRun = [{
            id: activeParagraphProfileId || 'curr_profile',
            name: paragraphGridConfig.name || "Kịch bản ngoài vòng lặp",
            masterDuration: masterTimelineDuration || 8.0,
            fieldStyles: paragraphFieldStyles,
            isOutsideLoopOnly: true,
            ...paragraphGridConfig
        }];
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

    const newQueue = [];

    if (targetMode === 'outside_loop_only') {
        // Kịch bản chỉ có lớp ngoài vòng lặp: Chỉ tạo 1 hàng duy nhất trong hàng đợi (1 video độc lập)
        const prof = profilesToRun[0];
        const defaultTag = sanitizeFilename(prof.name || "KB_NgoaiLap");
        const scriptTag = batchCustomScriptNamingMap[prof.id] || defaultTag;
        const sttStr = "01";
        const safeTopic = "Ngoai_Vong_Lap";

        let baseName = pattern
            .replace(/\{stt\}/gi, sttStr)
            .replace(/\{script\}/gi, scriptTag)
            .replace(/\{topic\}/gi, safeTopic);
        baseName = sanitizeFilename(baseName);

        const existing = batchRenderQueue.find(q => q.isOutsideLoopOnly || q.topic === "Cố định (Ngoài vòng lặp)");
        const status = existing ? existing.status : 'pending';
        const isSelected = (existing && existing.selected !== undefined) ? existing.selected : true;

        newQueue.push({
            queueId: `q_outside_loop`,
            stt: 1,
            sttDisplay: sttStr,
            selected: isSelected,
            isOutsideLoopOnly: true,
            scriptId: prof.id,
            scriptName: prof.name || `Kịch bản ngoài vòng lặp`,
            scriptTag: scriptTag,
            scriptConfig: prof,
            chainProfiles: [prof],
            chainFiles: [{
                profIndex: 0,
                scriptProf: prof,
                scriptTag: scriptTag,
                baseName: baseName,
                expectedFilename: `${baseName}.mp4`
            }],
            topic: "Cố định (Ngoài vòng lặp)",
            patternsCount: 1,
            drillsCount: 1,
            baseName: baseName,
            expectedFilename: `${baseName}.mp4`,
            status: status,
            savedFilename: existing ? existing.savedFilename : '',
            durationMs: existing ? existing.durationMs : 0,
            fileSizeMb: existing ? existing.fileSizeMb : 0
        });
    } else {
        // Tự động nạp toàn bộ danh sách chủ đề bài học vào hàng đợi render:
        // ĐẢM BẢO KHÔNG TĂNG THÊM BỘ DÒNG MỖI CHẾ ĐỘ - SỐ THỨ TỰ MỖI DÒNG ĐÚNG THEO BAN ĐẦU CỦA BÀI HỌC (01, 02, 03...)
        const activeTopics = (batchTopicsList && batchTopicsList.length > 0)
            ? batchTopicsList
            : [{ topic: "Default Topic", patternsCount: 1, drillsCount: 1, stt: 1 }];

        activeTopics.forEach((top, tIdx) => {
            const sttNum = top.stt || (tIdx + 1);
            const sttStr = String(sttNum).padStart(2, '0');
            const safeTopic = sanitizeFilename(top.topic);

            // Xây dựng danh sách kịch bản và file cho bài học này:
            const isChain = (targetMode === 'mode3_chain');
            const chainFiles = profilesToRun.map((prof, pIdx) => {
                const defaultTag = sanitizeFilename(prof.name || `KB_${pIdx + 1}`);
                const sTag = batchCustomScriptNamingMap[prof.id] || defaultTag;
                let bName = pattern
                    .replace(/\{stt\}/gi, sttStr)
                    .replace(/\{script\}/gi, sTag)
                    .replace(/\{topic\}/gi, safeTopic);
                bName = sanitizeFilename(bName);
                return {
                    profIndex: pIdx,
                    scriptProf: prof,
                    scriptTag: sTag,
                    baseName: bName,
                    expectedFilename: `${bName}.mp4`
                };
            });

            // Tên kịch bản hiển thị
            const scriptTags = chainFiles.map(cf => cf.scriptTag);
            const scriptTag = scriptTags.join(' + ');
            const scriptName = isChain
                ? (profilesToRun.length > 1 ? `Chuỗi ${profilesToRun.length} kịch bản` : (profilesToRun[0]?.name || "Kịch bản 1"))
                : (profilesToRun[0]?.name || "Kịch bản hiện tại");

            // Tên file hiển thị dự kiến
            let baseName = chainFiles[0]?.baseName || `${sttStr}-[KB]-[${safeTopic}]`;
            let expectedFilename = "";
            if (isChain && separateType === 'combined_chain') {
                let combBase = pattern
                    .replace(/\{stt\}/gi, sttStr)
                    .replace(/\{script\}/gi, "Chain")
                    .replace(/\{topic\}/gi, safeTopic);
                combBase = sanitizeFilename(combBase);
                baseName = combBase;
                expectedFilename = `${combBase}.mp4`;
            } else if (chainFiles.length > 1) {
                expectedFilename = chainFiles.map(cf => cf.expectedFilename).join(', ');
            } else {
                expectedFilename = `${baseName}.mp4`;
            }

            // Giữ lại trạng thái nếu mục đã render hoặc được uncheck trước đó
            const existing = batchRenderQueue.find(q => q.topic === top.topic);
            const status = existing ? existing.status : 'pending';
            const isSelected = (existing && existing.selected !== undefined) ? existing.selected : true;

            newQueue.push({
                queueId: `q_topic_${tIdx}`,
                stt: sttNum,
                sttDisplay: sttStr,
                selected: isSelected,
                isOutsideLoopOnly: false,
                scriptId: profilesToRun[0]?.id || 'profile_1',
                scriptName: scriptName,
                scriptTag: scriptTag,
                scriptConfig: profilesToRun[0],
                chainProfiles: profilesToRun,
                chainFiles: chainFiles,
                isChain: isChain,
                topic: top.topic,
                patternsCount: top.patternsCount || 1,
                drillsCount: top.drillsCount || 1,
                baseName: baseName,
                expectedFilename: expectedFilename,
                status: status,
                savedFilename: existing ? existing.savedFilename : '',
                durationMs: existing ? existing.durationMs : 0,
                fileSizeMb: existing ? existing.fileSizeMb : 0
            });
        });
    }

    batchRenderQueue = newQueue;
}

function renderBatchTableUI() {
    const tbody = document.getElementById('batch-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (batchRenderQueue.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="p-6 text-center text-slate-400 italic text-xs">
                    ⚠️ Hàng đợi render trống. Vui lòng nạp file Excel hoặc kịch bản để bắt đầu!
                </td>
            </tr>
        `;
        return;
    }

    const separateType = document.getElementById('batch-separate-output-type')?.value || 'per_script';

    batchRenderQueue.forEach((item, qIdx) => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-800/80 transition";

        let statusBadge = `<span class="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-lg text-[9px] font-bold whitespace-nowrap">⏳ Đang chờ</span>`;
        if (item.status === 'rendering') {
            statusBadge = `<span class="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-lg text-[9px] font-bold animate-pulse whitespace-nowrap">🔄 Render Full...</span>`;
        } else if (item.status && item.status.startsWith('rendering_kb_')) {
            const kbStepText = item.status.replace('rendering_kb_', '');
            statusBadge = `<span class="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-lg text-[9px] font-bold animate-pulse whitespace-nowrap">🔄 Render KB ${kbStepText}...</span>`;
        } else if (item.status === 'cooling_down') {
            statusBadge = `<span class="bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-lg text-[9px] font-bold animate-pulse whitespace-nowrap">❄️ Giải nhiệt...</span>`;
        } else if (item.status === 'rendering_clean') {
            statusBadge = `<span class="bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded-lg text-[9px] font-bold animate-pulse whitespace-nowrap">🔄 Clean (2/2)...</span>`;
        } else if (item.status === 'saved') {
            statusBadge = `<span class="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-lg text-[9px] font-bold whitespace-nowrap">✅ Đã Lưu</span>`;
        }

        const isChecked = item.selected !== false;

        let scriptBadgeHtml = "";
        if (item.isOutsideLoopOnly) {
            scriptBadgeHtml = `<span class="bg-amber-950 text-amber-300 border border-amber-700/80 text-[10px] font-bold px-2 py-0.5 rounded-md truncate inline-flex items-center space-x-1 max-w-[140px]" title="${item.scriptName}">
                    <i data-lucide="pin" class="w-2.5 h-2.5 shrink-0 text-amber-400"></i>
                    <span class="truncate">${item.scriptTag}</span>
               </span>`;
        } else if (item.chainFiles && item.chainFiles.length > 1) {
            scriptBadgeHtml = `<div class="flex flex-wrap gap-1 max-w-[180px]">` +
                item.chainFiles.map((cf, idx) => `
                    <span class="bg-indigo-950 text-indigo-300 border border-indigo-800/80 text-[9px] font-bold px-1.5 py-0.5 rounded truncate max-w-[130px]" title="${cf.scriptProf?.name || cf.scriptTag}">
                        ${idx + 1}. ${cf.scriptTag}
                    </span>
                `).join('') + `</div>`;
        } else {
            scriptBadgeHtml = `<span class="bg-indigo-950 text-indigo-300 border border-indigo-800/80 text-[10px] font-bold px-2 py-0.5 rounded-md truncate inline-block max-w-[140px]" title="${item.scriptName}">
                    ${item.scriptTag}
               </span>`;
        }

        const topicHtml = item.isOutsideLoopOnly
            ? `<span class="text-amber-300 font-bold flex items-center space-x-1 text-[11px]" title="${item.topic}"><i data-lucide="pin" class="w-3 h-3 shrink-0 text-amber-400"></i><span class="truncate">${item.topic}</span></span>`
            : `<span class="truncate block" title="${item.topic}">${item.topic}</span>`;

        const patternsDisplay = item.isOutsideLoopOnly ? '<span class="text-slate-500 font-mono text-[10px]">-</span>' : `<span class="text-indigo-300 font-mono text-[10px]">${item.patternsCount}</span>`;
        const drillsDisplay = item.isOutsideLoopOnly ? '<span class="text-slate-500 font-mono text-[10px]">-</span>' : `<span class="text-teal-300 font-mono text-[10px]">${item.drillsCount}</span>`;

        let expectedFileHtml = "";
        if (item.chainFiles && item.chainFiles.length > 1 && (!item.isChain || separateType !== 'combined_chain')) {
            expectedFileHtml = `<div class="space-y-0.5 font-mono text-[10px] text-amber-200">` +
                item.chainFiles.map(cf => `<div class="truncate max-w-[220px]" title="${cf.expectedFilename}">📄 ${cf.expectedFilename}</div>`).join('') +
                `</div>`;
        } else {
            expectedFileHtml = `<span class="text-amber-200 font-mono text-[10px] truncate block max-w-[200px]" title="${item.expectedFilename}">📄 ${item.expectedFilename}</span>`;
        }

        tr.innerHTML = `
            <td class="p-2.5 text-center">
                <input type="checkbox" id="batch-queue-row-cb-${qIdx}" ${isChecked ? 'checked' : ''} onchange="toggleBatchQueueRowSelect(${qIdx}, this.checked)" class="rounded bg-slate-900 border-slate-700 text-emerald-500 w-3.5 h-3.5 focus:ring-0 cursor-pointer" title="Tick chọn để render dòng này">
            </td>
            <td class="p-2.5 font-mono text-slate-400 text-[10px] font-bold">${item.sttDisplay}</td>
            <td class="p-2.5">
                ${scriptBadgeHtml}
            </td>
            <td class="p-2.5 font-bold text-slate-100 text-[11px] truncate max-w-[150px]">
                ${topicHtml}
            </td>
            <td class="p-2.5">${patternsDisplay}</td>
            <td class="p-2.5">${drillsDisplay}</td>
            <td class="p-2.5">
                ${expectedFileHtml}
            </td>
            <td class="p-2.5 text-right">${statusBadge}</td>
        `;
        tbody.appendChild(tr);
    });

    const master = document.getElementById('batch-master-checkbox');
    if (master) {
        master.checked = batchRenderQueue.length > 0 && batchRenderQueue.every(q => q.selected !== false);
    }

    updateBatchQueueCountBadge();

    if (window.lucide && lucide.createIcons) lucide.createIcons();
}

function updateBatchQueueCountBadge() {
    const badge = document.getElementById('batch-queue-count-badge');
    if (!badge) return;
    const totalCount = batchRenderQueue.length;
    const selectedCount = batchRenderQueue.filter(q => q.selected !== false).length;
    badge.innerText = `Đã chọn: ${selectedCount}/${totalCount} bài học`;
}

function toggleBatchQueueRowSelect(qIdx, isChecked) {
    if (batchRenderQueue[qIdx]) {
        batchRenderQueue[qIdx].selected = isChecked;
    }
    const master = document.getElementById('batch-master-checkbox');
    if (master) {
        master.checked = batchRenderQueue.length > 0 && batchRenderQueue.every(q => q.selected !== false);
    }
    updateBatchQueueCountBadge();
    updateBatchOverallProgress();
}

function toggleSelectAllBatchTopics(isChecked) {
    toggleSelectAllBatchQueueRows(isChecked);
}

function toggleSelectAllBatchQueueRows(isChecked) {
    batchRenderQueue.forEach(q => q.selected = isChecked);
    const master = document.getElementById('batch-master-checkbox');
    if (master) master.checked = isChecked;
    renderBatchTableUI();
    updateBatchQueueCountBadge();
    updateBatchOverallProgress();
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
