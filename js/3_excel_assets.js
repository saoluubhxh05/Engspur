/**
 * 3_excel_assets.js
 * Xử lý tải và bóc tách file Excel, thư mục ảnh local và ảnh nền/logo canvas
 */

function downloadExcelTemplate() {
    const data = [{
        "STT": 1, "STT Mẫu": "1", "Thể loại": "Giao tiếp cơ bản", "Chủ đề": "Describe Person",
        "Mẫu câu": "She looks very [Adj] with her [Noun].",
        "Câu hỏi cho mẫu câu": "What does she look like?",
        "Substitution words": "smart / glasses", "Dịch Substitution words": "thông minh / cặp kính",
        "Substitution Drills": "She looks very smart with her glasses.",
        "Phiên âm IPA": "/ʃiː lʊks ˈvɛri smɑːt wɪð hɜː ˈɡlɑːsɪz/",
        "Dịch Substitution Drills": "Cô ấy trông rất thông minh với cặp kính.",
        "ten_file_dinh_kem": "image001.jpg"
    }];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "EngSpur_Script");
    XLSX.writeFile(wb, "EngSpur_Template.xlsx");
    showToast("Đã tải file Excel mẫu có cột Thể loại!");
}

function handleExcelUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonRows = XLSX.utils.sheet_to_json(sheet);

            if (jsonRows && jsonRows.length > 0) {
                // Nạp TOÀN BỘ tất cả các trường xuất hiện trong mọi dòng file Excel
                const allColsSet = new Set();
                jsonRows.forEach(row => {
                    Object.keys(row).forEach(k => allColsSet.add(k.trim()));
                });
                excelColumnsList = Array.from(allColsSet);

                processImportedExcelRows(jsonRows);
                renderMailMergeFieldChips();
                renderInspectorRibbon();
                showToast(`Đã nhận diện đủ ${excelColumnsList.length} trường từ file Excel!`);
            }
        } catch (err) {
            showToast("Lỗi khi đọc file Excel!", "error");
        }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
}

function processImportedExcelRows(rows) {
    const patternMap = new Map();
    rows.forEach((row, idx) => {
        const stt = row["STT"] || idx + 1;
        let sttMau = row["STT Mẫu"] || row["STT Mau"] || row["STT_Mẫu"] || "";
        let genre = row["Thể loại"] || row["The loai"] || row["Thể Loại"] || row["The Loai"] || row["Category"] || row["category"] || row["Genre"] || row["genre"] || "Chung";
        let topic = row["Chủ đề"] || row["Chu de"] || "General";
        let pattern = row["Mẫu câu"] || row["Mau cau"] || "Pattern";
        let question = row["Câu hỏi cho mẫu câu"] || row["Câu hỏi"] || row["Cau hoi"] || "";

        // Ô "Từ nối" nào không có thì bỏ trống hoàn toàn chuỗi ""
        const rawTuNoi = row["Từ nối"] !== undefined ? row["Từ nối"] : (row["Tu noi"] !== undefined ? row["Tu noi"] : (row["Từ Nối"] !== undefined ? row["Từ Nối"] : ""));
        const tuNoi = (rawTuNoi !== null && rawTuNoi !== undefined) ? String(rawTuNoi).trim() : "";

        const cueWord = row["Substitution words"] || row["Từ gợi mở"] || row["Từ gợi ý"] || "";
        const dichCueWord = row["Dịch Substitution words"] || row["Dịch từ gợi mở"] || "";
        const drillText = row["Substitution Drills"] || "";
        const ipa = row["Phiên âm Substitution Drill"] || row["Phiên âm IPA"] || "";
        const dichDrillText = row["Dịch Substitution Drills"] || "";
        const imageName = row["ten_file_dinh_kem"] || row["Minh họa"] || "";

        if (!sttMau) sttMau = `M-${patternMap.size + 1}`;
        const groupKey = `${sttMau}___${pattern}`;

        if (!patternMap.has(groupKey)) {
            patternMap.set(groupKey, { sttMau: String(sttMau), genre: String(genre).trim(), topic: String(topic).trim(), pattern, question, drills: [] });
        }

        patternMap.get(groupKey).drills.push({
            stt,
            tuNoi: tuNoi,
            cueWord: String(cueWord || "").trim(),
            dichCueWord: String(dichCueWord || "").trim(),
            drillText: String(drillText || "").trim(),
            ipa: String(ipa || "").trim(),
            dichDrillText: String(dichDrillText || "").trim(),
            imageName: String(imageName || "").trim(),
            rawRow: row
        });
    });

    const parsed = Array.from(patternMap.values()).filter(p => p.drills.length > 0);
    if (parsed.length > 0) {
        importedDatasets = parsed;
        paragraphSelectedTopic = "ALL";
        paragraphSelectedGenre = "ALL";
        updateTopicDropdown();
        renderDatasetTable();
        refreshBatchTopicsTable();
        autoRecalculateAudioLayersDuration();
        drawParagraphCanvasFrame();
        showToast(`Đã import ${rows.length} dòng thành ${parsed.length} Mẫu câu!`);
        if (typeof triggerAutoSave === 'function') triggerAutoSave(true);
    }
}

function renderDatasetTable() {
    const body = document.getElementById('script-table-body');
    const activeList = getParagraphFilteredDatasets();
    const badge = document.getElementById('script-count-badge');
    if (badge) badge.innerText = `${activeList.length} Mẫu`;
    if (!body) return;
    body.innerHTML = '';

    activeList.forEach((ds, idx) => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-800/80 transition";
        const displayLabel = (paragraphFilterMode === 'genre') ? (ds.genre || "Chung") : (ds.topic || "General");
        const subLabel = (paragraphFilterMode === 'genre') ? ds.topic : ds.genre;
        tr.innerHTML = `
            <td class="p-2 font-mono text-slate-400">${ds.sttMau || idx + 1}</td>
            <td class="p-2 font-bold text-slate-200 truncate max-w-[80px]" title="${displayLabel} (${subLabel || ''})">
                <span class="block truncate">${displayLabel}</span>
                ${subLabel ? `<span class="text-[8px] text-slate-400 block truncate font-normal">${subLabel}</span>` : ''}
            </td>
            <td class="p-2 font-mono text-indigo-400 font-bold truncate max-w-[90px]" title="${ds.pattern}">${ds.pattern}</td>
            <td class="p-2 text-right">
                <button onclick="activateScript(${idx})" class="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-[9px] transition">Chọn</button>
            </td>
        `;
        body.appendChild(tr);
    });
    if (window.lucide && lucide.createIcons) lucide.createIcons();
}

function activateScript(idx) {
    const activeList = getParagraphFilteredDatasets();
    if (activeList[idx]) {
        if (paragraphFilterMode === 'genre') {
            paragraphSelectedGenre = activeList[idx].genre || "Chung";
            const pDropdown = document.getElementById('p-selected-topic-dropdown');
            if (pDropdown) pDropdown.value = paragraphSelectedGenre;
        } else {
            paragraphSelectedTopic = activeList[idx].topic;
            const pDropdown = document.getElementById('p-selected-topic-dropdown');
            if (pDropdown) pDropdown.value = paragraphSelectedTopic;
        }
    }
    pCurrentSentenceIndex = 0;
    seekTimeline(0);
    autoRecalculateAudioLayersDuration();
    drawParagraphCanvasFrame();
    showToast(`Đã kích hoạt mẫu câu ${idx + 1}!`);
}

function handleLocalImagesUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let loadedCount = 0;
    const totalImageFiles = Array.from(files).filter(f => f.type.startsWith('image/')).length;
    if (totalImageFiles === 0) return;

    for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (f.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const base64 = evt.target.result;
                const key = f.name.toLowerCase();
                localPCImageBase64Map[key] = base64;
                const img = new Image();
                img.src = base64;
                img.onload = () => {
                    localPCImageMap[key] = img;
                    loadedCount++;
                    const pcBadge = document.getElementById('pc-image-badge');
                    if (pcBadge) pcBadge.innerText = `${Object.keys(localPCImageMap).length} Ảnh Local`;
                    drawParagraphCanvasFrame();

                    if (loadedCount >= totalImageFiles) {
                        if (typeof triggerAutoSave === 'function') triggerAutoSave(true);
                    }
                };
            };
            reader.readAsDataURL(f);
        }
    }
    showToast(`Đang nạp ${totalImageFiles} ảnh từ thư mục...`);
}

function updateTopicDropdown() {
    const pDropdown = document.getElementById('p-selected-topic-dropdown');
    const labelElem = document.getElementById('p-filter-dropdown-label');
    const modeSelect = document.getElementById('p-filter-mode-select');

    if (modeSelect) {
        modeSelect.value = paragraphFilterMode || 'topic';
    }

    if (pDropdown) {
        if (paragraphFilterMode === 'genre') {
            if (labelElem) labelElem.innerText = "Lọc Theo Thể Loại Excel:";
            const genres = new Set();
            importedDatasets.forEach(ds => {
                if (ds.genre) genres.add(ds.genre);
                else genres.add("Chung");
            });

            pDropdown.innerHTML = '<option value="ALL">-- Tất cả thể loại trong Excel --</option>';
            genres.forEach(gen => {
                const opt = document.createElement('option');
                opt.value = gen;
                opt.innerText = gen;
                pDropdown.appendChild(opt);
            });
            pDropdown.value = paragraphSelectedGenre || "ALL";
        } else {
            if (labelElem) labelElem.innerText = "Lọc Theo Chủ Đề Excel:";
            const topics = new Set();
            importedDatasets.forEach(ds => { if (ds.topic) topics.add(ds.topic); });

            pDropdown.innerHTML = '<option value="ALL">-- Tất cả chủ đề trong Excel --</option>';
            topics.forEach(top => {
                const opt = document.createElement('option');
                opt.value = top;
                opt.innerText = top;
                pDropdown.appendChild(opt);
            });
            pDropdown.value = paragraphSelectedTopic || "ALL";
        }
    }
}

function onParagraphFilterModeChange(modeVal) {
    paragraphFilterMode = modeVal;
    if (modeVal === 'genre') {
        paragraphSelectedGenre = "ALL";
    } else {
        paragraphSelectedTopic = "ALL";
    }
    updateTopicDropdown();
    renderDatasetTable();
    pCurrentSentenceIndex = 0;
    seekTimeline(0);
    drawParagraphCanvasFrame();
    showToast(`Đã chuyển chế độ: Lọc theo ${modeVal === 'genre' ? 'Thể loại' : 'Chủ đề'}!`);
}

function onParagraphTopicChange(val) {
    if (paragraphFilterMode === 'genre') {
        paragraphSelectedGenre = val;
        showToast(`Đã chọn thể loại: ${val === 'ALL' ? 'Tất cả thể loại' : val}`);
    } else {
        paragraphSelectedTopic = val;
        showToast(`Đã chọn chủ đề: ${val === 'ALL' ? 'Tất cả chủ đề' : val}`);
    }
    renderDatasetTable();
    pCurrentSentenceIndex = 0;
    seekTimeline(0);
    drawParagraphCanvasFrame();
}

function getParagraphFilteredDatasets() {
    if (paragraphFilterMode === 'genre') {
        if (!paragraphSelectedGenre || paragraphSelectedGenre === 'ALL') return importedDatasets;
        return importedDatasets.filter(ds => (ds.genre || "Chung") === paragraphSelectedGenre);
    } else {
        if (!paragraphSelectedTopic || paragraphSelectedTopic === 'ALL') return importedDatasets;
        return importedDatasets.filter(ds => ds.topic === paragraphSelectedTopic);
    }
}

function handleCanvasBgUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        canvasBgBase64 = evt.target.result;
        const img = new Image();
        img.src = canvasBgBase64;
        img.onload = () => {
            canvasBgImage = img;
            if (document.getElementById('p-bg-file-name-badge')) document.getElementById('p-bg-file-name-badge').innerText = file.name;
            drawParagraphCanvasFrame();
            showToast("Đã tải ảnh nền Canvas!");
            if (typeof triggerAutoSave === 'function') triggerAutoSave(true);
        };
    };
    reader.readAsDataURL(file);
}

function clearCanvasBgImage() {
    canvasBgImage = null;
    canvasBgBase64 = null;
    if (document.getElementById('p-bg-file-name-badge')) document.getElementById('p-bg-file-name-badge').innerText = "Chưa chọn ảnh nền";
    drawParagraphCanvasFrame();
    showToast("Đã xóa ảnh nền Canvas!");
    if (typeof triggerAutoSave === 'function') triggerAutoSave(true);
}

function handleCanvasBadgeUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        canvasBadgeBase64 = evt.target.result;
        const img = new Image();
        img.src = canvasBadgeBase64;
        img.onload = () => {
            canvasBadgeImage = img;
            if (document.getElementById('p-badge-file-name-info')) document.getElementById('p-badge-file-name-info').innerText = file.name;
            drawParagraphCanvasFrame();
            showToast("Đã tải Logo/Badge!");
            if (typeof triggerAutoSave === 'function') triggerAutoSave(true);
        };
    };
    reader.readAsDataURL(file);
}

function clearCanvasBadgeImage() {
    canvasBadgeImage = null;
    canvasBadgeBase64 = null;
    if (document.getElementById('p-badge-file-name-info')) document.getElementById('p-badge-file-name-info').innerText = "Chưa tải Logo/Badge";
    drawParagraphCanvasFrame();
    showToast("Đã xóa Logo/Badge!");
    if (typeof triggerAutoSave === 'function') triggerAutoSave(true);
}

function updateCanvasBgProp(prop, val) {
    if (!videoConfig.bgImageStyle) videoConfig.bgImageStyle = { widthPct: 100, heightPct: 100, posX: 0, posY: 0, opacity: 100 };
    videoConfig.bgImageStyle[prop] = isNaN(val) ? 0 : val;
    drawParagraphCanvasFrame();
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function updateCanvasBadgeProp(prop, val) {
    if (!videoConfig.badgeStyle) videoConfig.badgeStyle = { widthPct: 15, heightPct: 10, posX: 82, posY: 4, opacity: 100, borderRadius: 20 };
    videoConfig.badgeStyle[prop] = isNaN(val) ? 0 : val;
    drawParagraphCanvasFrame();
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function switchParagraphFrameSubTab(subKey) {
    const b1 = document.getElementById('p-sub-tab-bg-btn');
    const b2 = document.getElementById('p-sub-tab-badge-btn');
    const p1 = document.getElementById('p-frame-sub-panel-bg');
    const p2 = document.getElementById('p-frame-sub-panel-badge');

    if (subKey === 'bg') {
        if (b1) b1.className = "w-1/2 py-1 rounded-lg transition tab-sub-active text-[10px]";
        if (b2) b2.className = "w-1/2 py-1 rounded-lg text-slate-400 hover:text-white transition text-[10px]";
        if (p1) p1.classList.remove('hidden');
        if (p2) p2.classList.add('hidden');
    } else {
        if (b2) b2.className = "w-1/2 py-1 rounded-lg transition tab-sub-active text-[10px]";
        if (b1) b1.className = "w-1/2 py-1 rounded-lg text-slate-400 hover:text-white transition text-[10px]";
        if (p2) p2.classList.remove('hidden');
        if (p1) p1.classList.add('hidden');
    }
}
