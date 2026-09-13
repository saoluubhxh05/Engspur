/**
 * 8a_batch_queue.js
 * Quản lý hàng đợi Batch Render: cấu hình đặt tên file thông minh theo mẫu & trường Excel, kịch bản chuỗi (chain), bảng danh sách chủ đề, chọn thư mục lưu
 */

var batchRenderQueue = [];
var currentBatchQueueIndex = 0;

/**
 * Phân giải mẫu tên file động hỗ trợ {stt}, {script}, {topic}, {genre}, {ngay} và các trường Excel {Tên_Cột}
 */
function resolveBatchFilename(pattern, context) {
    if (!pattern || typeof pattern !== 'string') pattern = "{stt}-[{script}]-[{topic}]";
    const sttStr = context?.sttDisplay || (context?.stt !== undefined ? String(context.stt).padStart(2, '0') : "01");
    const scriptTag = context?.scriptTag || context?.scriptName || "KB";
    const topic = context?.topic || "Topic";
    const genre = context?.genre || context?.topic || "Genre";
    const dateStr = context?.dateStr || new Date().toISOString().slice(0, 10).replace(/-/g, '');

    let filename = pattern
        .replace(/\{stt\}/gi, sttStr)
        .replace(/\{script\}/gi, scriptTag)
        .replace(/\{topic\}/gi, topic)
        .replace(/\{genre\}/gi, genre)
        .replace(/\{theloai\}/gi, genre)
        .replace(/\{chude\}/gi, topic)
        .replace(/\{ngay\}/gi, dateStr);

    // Thay thế động mọi thẻ {Tên_Cột_Excel}
    filename = filename.replace(/\{([^}]+)\}/g, (match, rawKey) => {
        const key = rawKey.trim();
        const lowerKey = key.toLowerCase();

        // 1. Kiểm tra trong dòng Excel thực tế
        if (context?.excelRow && typeof context.excelRow === 'object') {
            if (context.excelRow[key] !== undefined && context.excelRow[key] !== null) {
                return String(context.excelRow[key]).trim();
            }
            const foundKey = Object.keys(context.excelRow).find(k => k.trim().toLowerCase() === lowerKey);
            if (foundKey && context.excelRow[foundKey] !== undefined && context.excelRow[foundKey] !== null) {
                return String(context.excelRow[foundKey]).trim();
            }
        }

        // 2. Kiểm tra trong dataset bài học
        if (context?.ds) {
            if (context.ds[key] !== undefined && context.ds[key] !== null) {
                return String(context.ds[key]).trim();
            }
            const foundDsKey = Object.keys(context.ds).find(k => k.trim().toLowerCase() === lowerKey);
            if (foundDsKey && context.ds[foundDsKey] !== undefined && context.ds[foundDsKey] !== null) {
                return String(context.ds[foundDsKey]).trim();
            }
        }

        // 3. Dự phòng cho các tên cột phổ biến
        if (lowerKey === 'mẫu câu' || lowerKey === 'mau cau') return "Mau_Cau";
        if (lowerKey === 'thể loại' || lowerKey === 'the loai') return genre;
        if (lowerKey === 'chủ đề' || lowerKey === 'chu de') return topic;

        return key;
    });

    if (typeof sanitizeFilename === 'function') {
        return sanitizeFilename(filename);
    }
    return filename.replace(/[/\\?%*:|"<>]/g, '_').trim();
}

/**
 * Hiển thị xem trước tên file thực tế ngay tức thì dưới ô nhập
 */
function updateBatchNamingPreview() {
    const previewEl = document.getElementById('batch-naming-preview-tag');
    if (!previewEl) return;
    const patternInput = document.getElementById('batch-naming-pattern-input');
    const pattern = (patternInput && patternInput.value.trim()) ? patternInput.value.trim() : "{stt}-[{script}]-[{topic}]";

    let sampleContext = {
        stt: 1,
        sttDisplay: "01",
        scriptTag: "KB1",
        scriptName: "Kịch bản 1",
        topic: "Describe_Person",
        genre: "Giao_Tiep"
    };

    if (batchRenderQueue && batchRenderQueue.length > 0) {
        const first = batchRenderQueue[0];
        sampleContext.stt = first.stt;
        sampleContext.sttDisplay = first.sttDisplay;
        sampleContext.scriptTag = first.chainFiles?.[0]?.scriptTag || first.scriptTag || "KB1";
        sampleContext.scriptName = first.scriptName || "KB1";
        sampleContext.topic = first.topic || "Describe_Person";
        sampleContext.genre = first.genre || "Giao_Tiep";
        if (first.chainFiles?.[0]?.excelRow) {
            sampleContext.excelRow = first.chainFiles[0].excelRow;
        }
    }

    if (!sampleContext.excelRow && typeof importedDatasets !== 'undefined' && importedDatasets && importedDatasets.length > 0) {
        sampleContext.ds = importedDatasets[0];
        if (importedDatasets[0].drills && importedDatasets[0].drills.length > 0) {
            sampleContext.excelRow = importedDatasets[0].drills[0].rawRow;
        }
    }

    const sampleName = resolveBatchFilename(pattern, sampleContext);
    previewEl.innerText = `${sampleName}.mp4`;
    previewEl.title = `Xem trước mẫu: ${sampleName}.mp4`;
}

/**
 * Bật/Tắt Popover bảng chọn thẻ
 */
function toggleBatchNamingPopover(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    const popover = document.getElementById('batch-naming-popover');
    if (!popover) return;
    const isHidden = popover.classList.contains('hidden');
    if (isHidden) {
        renderBatchNamingExcelFields();
        popover.classList.remove('hidden');
        if (window.lucide && lucide.createIcons) lucide.createIcons();
    } else {
        popover.classList.add('hidden');
    }
}

/**
 * Đóng Popover bảng chọn thẻ
 */
function closeBatchNamingPopover() {
    const popover = document.getElementById('batch-naming-popover');
    if (popover) popover.classList.add('hidden');
}

/**
 * Kết xuất danh sách các thẻ trường Excel vào Popover
 */
function renderBatchNamingExcelFields() {
    const listContainer = document.getElementById('batch-naming-excel-fields-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const cols = (typeof excelColumnsList !== 'undefined' && excelColumnsList && excelColumnsList.length > 0)
        ? excelColumnsList
        : ["STT", "Thể loại", "Chủ đề", "Mẫu câu", "Câu hỏi cho mẫu câu", "Substitution words", "Substitution Drills", "Phiên âm IPA"];

    cols.forEach(col => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'px-1.5 py-0.5 bg-slate-950 hover:bg-amber-950 text-amber-300 hover:text-amber-100 border border-amber-500/30 hover:border-amber-400 rounded text-[10px] font-mono transition active:scale-95 whitespace-nowrap shadow-sm';
        btn.innerText = `+{${col}}`;
        btn.title = `Chèn trường Excel: {${col}}`;
        btn.onclick = () => insertBatchNamingTag(`{${col}}`);
        listContainer.appendChild(btn);
    });
}

/**
 * Chèn thẻ vào vị trí con trỏ trong ô nhập mẫu đặt tên
 */
function insertBatchNamingTag(tag) {
    const input = document.getElementById('batch-naming-pattern-input');
    if (!input) return;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const oldVal = input.value;
    input.value = oldVal.substring(0, start) + tag + oldVal.substring(end);
    input.focus();
    const newCursor = start + tag.length;
    input.setSelectionRange(newCursor, newCursor);
    onBatchNamingPatternChanged();
}

/**
 * Lắng nghe thay đổi mẫu tên file
 */
function onBatchNamingPatternChanged() {
    updateBatchNamingPreview();
    buildBatchQueueList();
    renderBatchTableUI();
}

/**
 * Đặt lại mẫu tên file mặc định
 */
function resetBatchNamingPatternToDefault() {
    const input = document.getElementById('batch-naming-pattern-input');
    if (input) input.value = "{stt}-[{script}]-[{topic}]";
    onBatchNamingPatternChanged();
    showToast("Đã đặt lại định dạng tên file: {stt}-[{script}]-[{topic}]");
}

function resetBatchNamingPattern() {
    resetBatchNamingPatternToDefault();
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
}

function toggleBatchChainProfileSelect(profId, isChecked) {
    if (isChecked) {
        if (!batchSelectedChainProfiles.includes(profId)) batchSelectedChainProfiles.push(profId);
    } else {
        batchSelectedChainProfiles = batchSelectedChainProfiles.filter(id => id !== profId);
    }
    const badge = document.getElementById('batch-chain-count-badge');
    if (badge) badge.innerText = `Đã chọn: ${batchSelectedChainProfiles.length} kịch bản`;
    buildBatchQueueList();
    renderBatchTableUI();
}

function onBatchGroupingModeChanged(mode) {
    batchGroupingMode = mode || 'topic';
    const headerElem = document.getElementById('batch-table-header-group');
    if (headerElem) {
        headerElem.innerText = (batchGroupingMode === 'genre') ? 'Thể Loại (Genre)' : 'Chủ Đề (Topic)';
    }
    refreshBatchTopicsTable();
    showToast(`Đã chuyển sang gom nhóm tạo file theo: ${batchGroupingMode === 'genre' ? 'Thể Loại Excel' : 'Chủ Đề Excel'}`);
}

function refreshBatchTopicsTable() {
    ensureSavedParagraphProfiles();
    const groupMap = new Map();
    const isGenreMode = (typeof batchGroupingMode !== 'undefined' && batchGroupingMode === 'genre');

    importedDatasets.forEach(ds => {
        const groupKey = isGenreMode ? (ds.genre || "General") : (ds.topic || "General");
        const topicName = ds.topic || "General";
        const genreName = ds.genre || "General";

        if (!groupMap.has(groupKey)) {
            groupMap.set(groupKey, {
                groupKey: groupKey,
                topic: isGenreMode ? groupKey : topicName,
                genre: genreName,
                groupMode: isGenreMode ? 'genre' : 'topic',
                patternsCount: 0,
                drillsCount: 0,
                items: []
            });
        }
        const cur = groupMap.get(groupKey);
        cur.patternsCount++;
        cur.drillsCount += (ds.drills || []).length;
        cur.items.push(ds);
    });

    if (groupMap.size === 0) {
        const defKey = isGenreMode ? "Default Genre" : "Default Topic";
        groupMap.set(defKey, {
            groupKey: defKey,
            topic: defKey,
            genre: isGenreMode ? defKey : "General",
            groupMode: isGenreMode ? 'genre' : 'topic',
            patternsCount: 1,
            drillsCount: 1,
            items: []
        });
    }

    batchTopicsList = Array.from(groupMap.values()).map((top, idx) => ({
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
        const scriptTag = (batchCustomScriptNamingMap && batchCustomScriptNamingMap[prof.id]) || defaultTag;
        const sttStr = "01";
        const safeTopic = "Ngoai_Vong_Lap";

        let baseName = resolveBatchFilename(pattern, {
            stt: 1,
            sttDisplay: sttStr,
            scriptTag: scriptTag,
            scriptName: prof.name || "Kịch bản ngoài vòng lặp",
            topic: safeTopic,
            genre: "Ngoai_Vong_Lap"
        });

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
        // Tự động nạp toàn bộ danh sách chủ đề hoặc thể loại bài học vào hàng đợi render:
        // ĐẢM BẢO KHÔNG TĂNG THÊM BỘ DÒNG MỖI CHẾ ĐỘ - SỐ THỨ TỰ MỖI DÒNG ĐÚNG THEO BAN ĐẦU CỦA BÀI HỌC (01, 02, 03...)
        const activeTopics = (batchTopicsList && batchTopicsList.length > 0)
            ? batchTopicsList
            : [{ topic: "Default Topic", genre: "General", patternsCount: 1, drillsCount: 1, stt: 1 }];

        activeTopics.forEach((top, tIdx) => {
            const sttNum = top.stt || (tIdx + 1);
            const sttStr = String(sttNum).padStart(2, '0');
            const safeTopic = sanitizeFilename(top.topic || "Topic");
            const safeGenre = sanitizeFilename(top.genre || top.topic || "Genre");

            // Xây dựng danh sách kịch bản và file cho bài học này:
            const isChain = (targetMode === 'mode3_chain');
            const sampleDs = (top.items && top.items.length > 0) ? top.items[0] : null;
            const sampleRow = (sampleDs && sampleDs.drills && sampleDs.drills.length > 0) ? sampleDs.drills[0].rawRow : (top.rawRow || null);

            const chainFiles = profilesToRun.map((prof, pIdx) => {
                const defaultTag = sanitizeFilename(prof.name || `KB_${pIdx + 1}`);
                const sTag = (batchCustomScriptNamingMap && batchCustomScriptNamingMap[prof.id]) || defaultTag;
                let bName = resolveBatchFilename(pattern, {
                    stt: sttNum,
                    sttDisplay: sttStr,
                    scriptTag: sTag,
                    scriptName: prof.name || `Kịch bản ${pIdx + 1}`,
                    topic: top.topic,
                    genre: top.genre,
                    ds: sampleDs,
                    excelRow: sampleRow
                });
                return {
                    profIndex: pIdx,
                    scriptProf: prof,
                    scriptTag: sTag,
                    baseName: bName,
                    expectedFilename: `${bName}.mp4`,
                    excelRow: sampleRow,
                    ds: sampleDs
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
                let combBase = resolveBatchFilename(pattern, {
                    stt: sttNum,
                    sttDisplay: sttStr,
                    scriptTag: "Chain",
                    scriptName: "Chuỗi kịch bản",
                    topic: top.topic,
                    genre: top.genre,
                    ds: sampleDs,
                    excelRow: sampleRow
                });
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
                genre: top.genre,
                groupKey: top.groupKey || top.topic,
                groupMode: top.groupMode || (typeof batchGroupingMode !== 'undefined' ? batchGroupingMode : 'topic'),
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
    updateBatchNamingPreview();
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

        const isGenreMode = (typeof batchGroupingMode !== 'undefined' && batchGroupingMode === 'genre');
        const topicHtml = item.isOutsideLoopOnly
            ? `<span class="text-amber-300 font-bold flex items-center space-x-1 text-[11px]" title="${item.topic}"><i data-lucide="pin" class="w-3 h-3 shrink-0 text-amber-400"></i><span class="truncate">${item.topic}</span></span>`
            : (isGenreMode
                ? `<span class="truncate block text-amber-300 font-bold" title="Thể loại: ${item.topic}">📁 ${item.topic}</span>`
                : `<span class="truncate block" title="${item.topic}">${item.topic}</span>`);

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

// Đóng Popover đặt tên khi click ra ngoài
document.addEventListener('click', function(e) {
    const box = document.getElementById('batch-naming-box-container');
    const popover = document.getElementById('batch-naming-popover');
    if (popover && !popover.classList.contains('hidden')) {
        if (box && !box.contains(e.target)) {
            popover.classList.add('hidden');
        }
    }
});
