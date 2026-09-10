/**
 * 2_storage.js
 * Xử lý lưu trữ hệ thống (IndexedDB), xuất nhập JSON kịch bản và quản lý profile
 */

const DB_NAME = "EngSpurStudioDB_v127";
const DB_VERSION = 1;
const STORE_NAME = "system_full_state";

function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function idbSet(key, value) {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function idbGet(key) {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function saveFullSystemState() {
    try {
        const state = {
            importedDatasets,
            excelColumnsList,
            videoConfig,
            savedParagraphProfiles,
            activeParagraphProfileId,
            paragraphGridConfig,
            paragraphFieldStyles,
            localPCImageBase64Map,
            canvasBgBase64,
            canvasBadgeBase64,
            paragraphSelectedTopic,
            masterTimelineDuration,
            batchDirectoryHandle: batchDirectoryHandle || null,
            batchDirectoryName: batchDirectoryName || ''
        };
        await idbSet("saved_state", state);
        showToast("Đã lưu toàn bộ dữ liệu & cấu hình vào máy!");
    } catch (err) {
        console.error("Save error", err);
        showToast("Lỗi khi lưu hệ thống", "error");
    }
}

async function loadFullSystemState(isManual = false) {
    try {
        const state = await idbGet("saved_state");
        if (state) {
            if (state.importedDatasets) importedDatasets = state.importedDatasets;
            if (state.excelColumnsList) excelColumnsList = state.excelColumnsList;
            if (state.videoConfig) videoConfig = { ...videoConfig, ...state.videoConfig };
            if (state.savedParagraphProfiles) savedParagraphProfiles = state.savedParagraphProfiles;
            if (state.activeParagraphProfileId) activeParagraphProfileId = state.activeParagraphProfileId;
            if (state.paragraphGridConfig) paragraphGridConfig = state.paragraphGridConfig;
            if (state.paragraphFieldStyles) paragraphFieldStyles = state.paragraphFieldStyles;
            if (state.paragraphSelectedTopic) paragraphSelectedTopic = state.paragraphSelectedTopic;
            if (state.masterTimelineDuration) masterTimelineDuration = state.masterTimelineDuration;

            if (state.batchDirectoryHandle) {
                batchDirectoryHandle = state.batchDirectoryHandle;
                batchDirectoryName = state.batchDirectoryName || 'Thư mục đã chọn';
                const dirDisp = document.getElementById('batch-dir-display');
                if (dirDisp) {
                    dirDisp.innerText = `📁 ${batchDirectoryName}`;
                    dirDisp.className = "text-[10px] text-emerald-300 font-bold truncate";
                }
            }

            localPCImageBase64Map = state.localPCImageBase64Map || {};
            localPCImageMap = {};
            Object.keys(localPCImageBase64Map).forEach(k => {
                const img = new Image();
                img.src = localPCImageBase64Map[k];
                localPCImageMap[k] = img;
            });
            if (document.getElementById('pc-image-badge')) {
                document.getElementById('pc-image-badge').innerText = `${Object.keys(localPCImageMap).length} Ảnh Local`;
            }

            if (state.canvasBgBase64) {
                canvasBgBase64 = state.canvasBgBase64;
                const bgImg = new Image();
                bgImg.src = state.canvasBgBase64;
                bgImg.onload = () => { canvasBgImage = bgImg; drawParagraphCanvasFrame(); };
            }
            if (state.canvasBadgeBase64) {
                canvasBadgeBase64 = state.canvasBadgeBase64;
                const bdImg = new Image();
                bdImg.src = state.canvasBadgeBase64;
                bdImg.onload = () => { canvasBadgeImage = bdImg; drawParagraphCanvasFrame(); };
            }

            if (document.getElementById('master-loop-duration-input')) {
                document.getElementById('master-loop-duration-input').value = masterTimelineDuration;
            }

            syncMediaInputsFromConfig();
            renderSavedParagraphProfilesDropdown();
            renderMailMergeFieldChips();
            renderTimelineLayersListUI();
            renderTimelineTracksUI();
            renderInspectorRibbon();
            updateTopicDropdown();
            renderDatasetTable();
            refreshBatchTopicsTable();
            syncInlineGridSettingsInputs();
            drawParagraphCanvasFrame();

            if (isManual) showToast("Đã khôi phục dữ liệu hoàn chỉnh!");
        } else {
            loadDefaultJSONTemplate(1, false);
        }
    } catch(e) {
        console.error("Load state error", e);
        loadDefaultJSONTemplate(1, false);
    }
}

function setQuickPosition(target, x, y, w, h) {
    if (target === 'bg') {
        if (!videoConfig.bgImageStyle) videoConfig.bgImageStyle = { widthPct: 100, heightPct: 100, posX: 0, posY: 0, opacity: 100 };
        videoConfig.bgImageStyle.posX = x;
        videoConfig.bgImageStyle.posY = y;
        if (w !== undefined) videoConfig.bgImageStyle.widthPct = w;
        if (h !== undefined) videoConfig.bgImageStyle.heightPct = h;
        syncMediaInputsFromConfig();
        drawParagraphCanvasFrame();
        showToast(`Đã căn vị trí Nền: (${x}%, ${y}%)`);
    } else if (target === 'badge') {
        if (!videoConfig.badgeStyle) videoConfig.badgeStyle = { widthPct: 15, heightPct: 10, posX: 82, posY: 4, opacity: 100, borderRadius: 20 };
        videoConfig.badgeStyle.posX = x;
        videoConfig.badgeStyle.posY = y;
        if (w !== undefined) videoConfig.badgeStyle.widthPct = w;
        syncMediaInputsFromConfig();
        drawParagraphCanvasFrame();
        showToast(`Đã căn Logo vào: (${x}%, ${y}%)`);
    }
}

function syncMediaInputsFromConfig() {
    const bgSt = videoConfig.bgImageStyle || { widthPct: 100, heightPct: 100, posX: 0, posY: 0, opacity: 100 };
    const bdSt = videoConfig.badgeStyle || { widthPct: 15, heightPct: 10, posX: 82, posY: 4, opacity: 100, borderRadius: 20 };

    if (document.getElementById('cfg-bg-w')) document.getElementById('cfg-bg-w').value = bgSt.widthPct || 100;
    if (document.getElementById('cfg-bg-h')) document.getElementById('cfg-bg-h').value = bgSt.heightPct || 100;
    if (document.getElementById('cfg-bg-x')) document.getElementById('cfg-bg-x').value = bgSt.posX || 0;
    if (document.getElementById('cfg-bg-y')) document.getElementById('cfg-bg-y').value = bgSt.posY || 0;
    if (document.getElementById('cfg-bg-op')) document.getElementById('cfg-bg-op').value = bgSt.opacity !== undefined ? bgSt.opacity : 100;

    if (document.getElementById('cfg-bd-w')) document.getElementById('cfg-bd-w').value = bdSt.widthPct || 15;
    if (document.getElementById('cfg-bd-r')) document.getElementById('cfg-bd-r').value = bdSt.borderRadius !== undefined ? bdSt.borderRadius : 20;
    if (document.getElementById('cfg-bd-x')) document.getElementById('cfg-bd-x').value = bdSt.posX || 82;
    if (document.getElementById('cfg-bd-y')) document.getElementById('cfg-bd-y').value = bdSt.posY || 4;
    if (document.getElementById('cfg-bd-op')) document.getElementById('cfg-bd-op').value = bdSt.opacity !== undefined ? bdSt.opacity : 100;
}

function updateProfileName(newName) {
    if (!newName.trim()) return;
    paragraphGridConfig.name = newName.trim();
    const found = savedParagraphProfiles.find(p => p.id === activeParagraphProfileId);
    if (found) found.name = newName.trim();
    renderSavedParagraphProfilesDropdown();
    showToast(`Đã đổi tên kịch bản thành: ${newName.trim()}`);
}

async function saveCurrentProfileOver() {
    const input = document.getElementById('script-profile-name-input');
    if (input && input.value.trim()) paragraphGridConfig.name = input.value.trim();

    paragraphGridConfig.masterDuration = masterTimelineDuration;
    paragraphGridConfig.fieldStyles = JSON.parse(JSON.stringify(paragraphFieldStyles));

    const idx = savedParagraphProfiles.findIndex(p => p.id === activeParagraphProfileId);
    if (idx >= 0) {
        savedParagraphProfiles[idx] = JSON.parse(JSON.stringify(paragraphGridConfig));
    } else {
        savedParagraphProfiles.push(JSON.parse(JSON.stringify(paragraphGridConfig)));
    }

    renderSavedParagraphProfilesDropdown();
    await saveFullSystemState();
    showToast(`Đã lưu kịch bản "${paragraphGridConfig.name}" thành công! Lần sau vào tự động có sẵn.`);
}

async function saveCurrentProfileAsNew() {
    const currentName = paragraphGridConfig.name || "Kịch bản";
    const newName = prompt("Nhập tên cho kịch bản mới:", `${currentName} (Bản mới)`);
    if (!newName || !newName.trim()) return;

    const newProfile = JSON.parse(JSON.stringify(paragraphGridConfig));
    newProfile.id = "profile_" + Date.now();
    newProfile.name = newName.trim();
    newProfile.masterDuration = masterTimelineDuration;
    newProfile.fieldStyles = JSON.parse(JSON.stringify(paragraphFieldStyles));

    savedParagraphProfiles.push(newProfile);
    activeParagraphProfileId = newProfile.id;
    paragraphGridConfig = newProfile;

    const nameInput = document.getElementById('script-profile-name-input');
    if (nameInput) nameInput.value = newProfile.name;

    renderSavedParagraphProfilesDropdown();
    await saveFullSystemState();
    showToast(`Đã tạo và lưu kịch bản mới: "${newProfile.name}"!`);
}

function loadDefaultJSONTemplate(modeNum, showNotif = true) {
    const template = (modeNum === 1) ? DEFAULT_TEMPLATES_JSON.mode1 : DEFAULT_TEMPLATES_JSON.mode2;
    paragraphGridConfig = JSON.parse(JSON.stringify(template));
    activeParagraphProfileId = template.id;
    masterTimelineDuration = template.masterDuration || 8.0;

    if (!template.fieldStyles) {
        template.fieldStyles = JSON.parse(JSON.stringify(paragraphFieldStyles));
    } else {
        paragraphFieldStyles = JSON.parse(JSON.stringify(template.fieldStyles));
    }

    const existingIdx = savedParagraphProfiles.findIndex(p => p.id === template.id);
    const profileToSave = {
        ...JSON.parse(JSON.stringify(template)),
        fieldStyles: JSON.parse(JSON.stringify(paragraphFieldStyles))
    };

    if (existingIdx >= 0) savedParagraphProfiles[existingIdx] = profileToSave;
    else savedParagraphProfiles.push(profileToSave);

    paragraphSelectedGroupIdx = 0;
    paragraphSelectedFieldKey = "Substitution words";
    selectedFieldKeysList = [paragraphSelectedFieldKey];

    if (document.getElementById('master-loop-duration-input')) {
        document.getElementById('master-loop-duration-input').value = masterTimelineDuration;
    }
    updateLoopPresentationModeUI();
    renderSavedParagraphProfilesDropdown();
    renderTimelineLayersListUI();
    renderTimelineTracksUI();
    renderInspectorRibbon();
    syncInlineGridSettingsInputs();
    seekTimeline(0);

    if (showNotif) showToast(`Đã nạp Kịch Bản Mẫu: ${template.name}!`);
}

function exportCurrentProfileToJSON() {
    paragraphGridConfig.masterDuration = masterTimelineDuration;
    paragraphGridConfig.fieldStyles = paragraphFieldStyles;
    const jsonStr = JSON.stringify(paragraphGridConfig, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const filename = `EngSpur_Timeline_${sanitizeFilename(paragraphGridConfig.name || "Script")}.json`;
    downloadBlobFallback(blob, filename);
    showToast("Đã xuất file cấu hình JSON thành công!");
}

function handleImportProfileJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const parsed = JSON.parse(evt.target.result);
            if (parsed && parsed.groups && parsed.gridMatrix) {
                parsed.id = "profile_" + Date.now();
                if (parsed.fieldStyles) {
                    paragraphFieldStyles = JSON.parse(JSON.stringify(parsed.fieldStyles));
                }
                savedParagraphProfiles.push(parsed);
                activeParagraphProfileId = parsed.id;
                paragraphGridConfig = JSON.parse(JSON.stringify(parsed));
                if (parsed.masterDuration) masterTimelineDuration = parsed.masterDuration;

                if (document.getElementById('master-loop-duration-input')) {
                    document.getElementById('master-loop-duration-input').value = masterTimelineDuration;
                }
                updateLoopPresentationModeUI();
                renderSavedParagraphProfilesDropdown();
                renderTimelineLayersListUI();
                renderTimelineTracksUI();
                renderInspectorRibbon();
                syncInlineGridSettingsInputs();
                seekTimeline(0);
                saveFullSystemState();
                showToast(`Đã nhập kịch bản Timeline JSON: ${parsed.name || "Thành công"}!`);
            } else {
                showToast("File JSON không đúng cấu trúc kịch bản!", "error");
            }
        } catch(err) {
            showToast("Lỗi khi đọc file JSON!", "error");
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function renderSavedParagraphProfilesDropdown() {
    const dropdown = document.getElementById('p-saved-profiles-dropdown');
    if (!dropdown) return;
    dropdown.innerHTML = '';

    if (savedParagraphProfiles.length === 0) {
        dropdown.innerHTML = '<option value="">-- Chưa có kịch bản đã lưu --</option>';
        return;
    }

    savedParagraphProfiles.forEach(prof => {
        const opt = document.createElement('option');
        opt.value = prof.id;
        opt.innerText = `${prof.name} (${prof.groups.length} Lớp)`;
        dropdown.appendChild(opt);
    });
    dropdown.value = activeParagraphProfileId;
    const currentProfile = savedParagraphProfiles.find(p => p.id === activeParagraphProfileId);
    const nameInput = document.getElementById('script-profile-name-input');
    if (nameInput && currentProfile) nameInput.value = currentProfile.name;
}

function loadSelectedParagraphProfile(profileId) {
    if (activeParagraphProfileId) {
        const currentProfile = savedParagraphProfiles.find(p => p.id === activeParagraphProfileId);
        if (currentProfile) {
            currentProfile.fieldStyles = JSON.parse(JSON.stringify(paragraphFieldStyles));
            currentProfile.groups = JSON.parse(JSON.stringify(paragraphGridConfig.groups));
            currentProfile.gridMatrix = JSON.parse(JSON.stringify(paragraphGridConfig.gridMatrix));
            currentProfile.presentationMode = paragraphGridConfig.presentationMode;
            currentProfile.loopBlockGap = paragraphGridConfig.loopBlockGap;
            currentProfile.masterDuration = masterTimelineDuration;
        }
    }

    const found = savedParagraphProfiles.find(p => p.id === profileId);
    if (found) {
        activeParagraphProfileId = profileId;
        const nameInput = document.getElementById('script-profile-name-input');
        if (nameInput) nameInput.value = found.name;
        paragraphGridConfig = JSON.parse(JSON.stringify(found));
        masterTimelineDuration = found.masterDuration || 8.0;
        if (document.getElementById('master-loop-duration-input')) {
            document.getElementById('master-loop-duration-input').value = masterTimelineDuration;
        }

        if (found.fieldStyles) {
            paragraphFieldStyles = JSON.parse(JSON.stringify(found.fieldStyles));
        }

        paragraphSelectedGroupIdx = 0;
        paragraphSelectedFieldKey = "Substitution words";
        selectedFieldKeysList = [paragraphSelectedFieldKey];

        updateLoopPresentationModeUI();
        syncInlineGridSettingsInputs();
        renderTimelineLayersListUI();
        renderTimelineTracksUI();
        renderInspectorRibbon();
        seekTimeline(0);
        saveFullSystemState();

        showToast(`Đã chuyển sang kịch bản: ${found.name}! Toàn bộ Lưới, Timeline & Định dạng đã được làm mới.`);
    }
}

function deleteCurrentParagraphProfile() {
    if (savedParagraphProfiles.length <= 1) {
        showToast("Phải giữ lại ít nhất 1 kịch bản!", "error");
        return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa kịch bản "${paragraphGridConfig.name}"?`)) return;

    savedParagraphProfiles = savedParagraphProfiles.filter(p => p.id !== activeParagraphProfileId);
    activeParagraphProfileId = savedParagraphProfiles[0].id;
    paragraphGridConfig = JSON.parse(JSON.stringify(savedParagraphProfiles[0]));
    masterTimelineDuration = paragraphGridConfig.masterDuration || 8.0;
    if (document.getElementById('master-loop-duration-input')) {
        document.getElementById('master-loop-duration-input').value = masterTimelineDuration;
    }

    updateLoopPresentationModeUI();
    renderSavedParagraphProfilesDropdown();
    renderTimelineLayersListUI();
    renderTimelineTracksUI();
    renderInspectorRibbon();
    syncInlineGridSettingsInputs();
    seekTimeline(0);
    saveFullSystemState();
    showToast("Đã xóa kịch bản thành công!");
}

function setLoopPresentationMode(mode) {
    paragraphGridConfig.presentationMode = mode;
    updateLoopPresentationModeUI();
    drawParagraphCanvasFrame();
    showToast(mode === 'single' ? "Đã chuyển sang chế độ 1 Câu / Làm mới" : "Đã chuyển sang chế độ Xếp tầng");
}

function updateLoopPresentationModeUI() {
    const btnSingle = document.getElementById('loop-mode-single-btn');
    const btnStack = document.getElementById('loop-mode-stack-btn');
    const selectFormula = document.getElementById('loop-stack-formula-select');
    const isSingle = (paragraphGridConfig.presentationMode === 'single');

    if (btnSingle && btnStack) {
        if (isSingle) {
            btnSingle.className = "px-2 py-0.5 rounded transition bg-indigo-600 text-white shadow";
            btnStack.className = "px-2 py-0.5 rounded transition text-slate-400 hover:text-white";
        } else {
            btnStack.className = "px-2 py-0.5 rounded transition bg-indigo-600 text-white shadow";
            btnSingle.className = "px-2 py-0.5 rounded transition text-slate-400 hover:text-white";
        }
    }

    if (selectFormula) {
        selectFormula.value = paragraphGridConfig.stackingFormula || (isSingle ? "0" : "auto");
    }
}

function updateGlobalStackingFormula(val) {
    paragraphGridConfig.stackingFormula = val;
    drawParagraphCanvasFrame();
    showToast(`Kiểu xếp dòng: ${val}`);
}

async function clearAllUploadedData() {
    if (!confirm("Bạn có chắc muốn xóa sạch dữ liệu Excel và toàn bộ ảnh local đã upload?")) return;
    importedDatasets = [];
    localPCImageBase64Map = {};
    localPCImageMap = {};
    excelColumnsList = [
        "STT", "STT Mẫu", "Chủ đề", "Mẫu câu", "Từ gợi mở", "Câu hỏi cho mẫu câu", "Từ nối",
        "Substitution words", "Dịch Substitution words", "Substitution Drills",
        "Phiên âm IPA", "Dịch Substitution Drills", "Minh họa", "ten_file_dinh_kem"
    ];
    const pcBadge = document.getElementById('pc-image-badge');
    if (pcBadge) pcBadge.innerText = `0 Ảnh Local`;
    renderDatasetTable();
    renderMailMergeFieldChips();
    refreshBatchTopicsTable();
    updateTopicDropdown();
    drawParagraphCanvasFrame();
    await saveFullSystemState();
    showToast("Đã xóa sạch Excel và ảnh đã upload!");
}

async function saveUploadedDataPermanently() {
    await saveFullSystemState();
    showToast("Đã lưu vĩnh viễn Excel và ảnh vào trình duyệt! Lần sau mở ra dùng ngay.");
}
