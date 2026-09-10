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

var autoSaveTimer = null;
var isAutoSaving = false;

function triggerAutoSave(immediate = false) {
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
    }
    if (immediate) {
        saveFullSystemState(false);
    } else {
        updateAutoSaveStatusBadge("Đang lưu...");
        autoSaveTimer = setTimeout(() => {
            saveFullSystemState(false);
        }, 700);
    }
}

function updateAutoSaveStatusBadge(text) {
    const badge = document.getElementById('hdr-autosave-status');
    if (badge) {
        badge.innerText = text;
        badge.classList.remove('opacity-0');
        if (text === "Đã tự động lưu") {
            setTimeout(() => {
                if (badge.innerText === "Đã tự động lưu") {
                    badge.classList.add('opacity-0');
                }
            }, 2500);
        }
    }
}

async function saveFullSystemState(showToastMsg = true) {
    if (isAutoSaving) return;
    isAutoSaving = true;
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
        updateAutoSaveStatusBadge("Đã tự động lưu");
        if (showToastMsg) {
            showToast("Đã lưu toàn bộ dữ liệu & cấu hình vào máy!");
        }
    } catch (err) {
        console.error("Save error", err);
        updateAutoSaveStatusBadge("Lỗi lưu");
        if (showToastMsg) {
            showToast("Lỗi khi lưu hệ thống", "error");
        }
    } finally {
        isAutoSaving = false;
    }
}

async function loadFullSystemState(isManual = false) {
    try {
        const state = await idbGet("saved_state");
        if (state && state.importedDatasets && state.importedDatasets.length > 0) {
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
            // Chưa có dữ liệu hoặc bộ nhớ trống -> Nạp bộ dữ liệu mẫu đầy đủ để dùng thử ngay
            await loadRichDemoDataset(false);
        }
    } catch(e) {
        console.error("Load state error", e);
        await loadRichDemoDataset(false);
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

/**
 * Tự động tạo ảnh thẻ mẫu 9:16 sắc nét bằng Canvas
 */
function generateDemoCardImage(title, subtitle, color1, color2, iconText) {
    const c = document.createElement('canvas');
    c.width = 540;
    c.height = 960;
    const ctx = c.getContext('2d');

    // Nền Gradient chuyển màu cao cấp
    const grad = ctx.createLinearGradient(0, 0, 540, 960);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 540, 960);

    // Họa tiết trang trí dạng sóng & vòng tròn mờ
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    ctx.arc(270, 320, 220, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(420, 780, 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Khung thẻ bo góc ở trung tâm
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 4;
    const rx = 36, ry = 80, rw = 468, rh = 800, rad = 32;
    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(rx, ry, rw, rh, rad);
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.fillRect(rx, ry, rw, rh);
    }
    ctx.restore();

    // Biểu tượng cảm xúc / Icon chính
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "84px sans-serif";
    ctx.fillText(iconText || "⭐", 270, 280);

    // Tiêu đề minh họa
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(title, 270, 420);

    // Phụ đề minh họa
    ctx.fillStyle = "#94a3b8";
    ctx.font = "22px sans-serif";
    ctx.fillText(subtitle, 270, 475);

    // Huy hiệu minh họa EngSpur
    ctx.save();
    ctx.fillStyle = "rgba(79, 70, 229, 0.35)";
    ctx.strokeStyle = "rgba(99, 102, 241, 0.6)";
    ctx.lineWidth = 2;
    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(120, 560, 300, 56, 16);
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.strokeRect(120, 560, 300, 56);
        ctx.fillRect(120, 560, 300, 56);
    }
    ctx.fillStyle = "#a5b4fc";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("ENGSPUR DEMO ASSET", 270, 588);
    ctx.restore();

    // Chân thẻ
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "14px monospace";
    ctx.fillText("9:16 Photo Frame - Ready to Render", 270, 830);

    return c.toDataURL('image/jpeg', 0.85);
}

/**
 * Nạp bộ dữ liệu phong phú gồm 3 chủ đề tiếng Anh chuẩn và 6 ảnh minh họa 9:16
 * Cho phép chạy thử ngay toàn bộ tính năng Studio, Timeline, TTS và Render Hàng Loạt
 */
async function loadRichDemoDataset(showToastMsg = true) {
    // 1. Tự động sinh 6 ảnh minh họa 9:16 chất lượng cao
    localPCImageBase64Map = {
        "image001.jpg": generateDemoCardImage("Describe Person", "Smart with glasses", "#1e1b4b", "#065f46", "👓"),
        "image002.jpg": generateDemoCardImage("Describe Person", "Kind & Warm smile", "#311042", "#831843", "✨"),
        "image003.jpg": generateDemoCardImage("Describe Person", "Always polite", "#0f172a", "#0284c7", "🌟"),
        "image004.jpg": generateDemoCardImage("Daily Routines", "Morning Coffee & Work", "#3f1a04", "#78350f", "☕"),
        "image005.jpg": generateDemoCardImage("Daily Routines", "Jog around the park", "#064e3b", "#0d9488", "🏃"),
        "image006.jpg": generateDemoCardImage("Daily Routines", "Read news before sleep", "#172554", "#4338ca", "📖")
    };

    localPCImageMap = {};
    Object.keys(localPCImageBase64Map).forEach(key => {
        const img = new Image();
        img.src = localPCImageBase64Map[key];
        localPCImageMap[key] = img;
    });

    const pcBadge = document.getElementById('pc-image-badge');
    if (pcBadge) pcBadge.innerText = `${Object.keys(localPCImageMap).length} Ảnh Local`;

    // 2. Nạp bộ 3 chủ đề câu hỏi phong phú
    importedDatasets = [
        {
            sttMau: "1",
            topic: "Describe Person",
            pattern: "She looks very [Adj] with her [Noun].",
            question: "What does she look like?",
            drills: [
                { stt: 1, tuNoi: "", cueWord: "smart / glasses", dichCueWord: "thông minh / cặp kính", drillText: "She looks very smart with her glasses.", ipa: "/ʃiː lʊks ˈvɛri smɑːt wɪð hɜː ˈɡlɑːsɪz/", dichDrillText: "Cô ấy trông rất thông minh với cặp kính.", imageName: "image001.jpg" },
                { stt: 2, tuNoi: "And", cueWord: "kind / warm smile", dichCueWord: "tốt bụng / nụ cười ấm áp", drillText: "She is a kind girl with a warm smile.", ipa: "/ʃiː ɪz ə kaɪnd ɡɜːl wɪð ə wɔːm smaɪl/", dichDrillText: "Cô ấy là một cô gái tốt bụng với nụ cười ấm áp.", imageName: "image002.jpg" },
                { stt: 3, tuNoi: "Moreover", cueWord: "polite / friends", dichCueWord: "lịch sự / bạn bè", drillText: "She is always polite to her friends.", ipa: "/ʃiː ɪz ˈɔːlweɪz pəˈlaɪt tuː hɜː frɛndz/", dichDrillText: "Cô ấy luôn lịch thiệp với bạn bè của mình.", imageName: "image003.jpg" }
            ]
        },
        {
            sttMau: "2",
            topic: "Daily Routines",
            pattern: "I usually [Verb] before [Activity].",
            question: "What do you do every morning?",
            drills: [
                { stt: 1, tuNoi: "", cueWord: "drink coffee / working", dichCueWord: "uống cà phê / làm việc", drillText: "I usually drink coffee before working.", ipa: "/aɪ ˈjuːʒuəli drɪŋk ˈkɒfi bɪˈfɔː ˈwɜːkɪŋ/", dichDrillText: "Tôi thường uống cà phê trước khi bắt đầu làm việc.", imageName: "image004.jpg" },
                { stt: 2, tuNoi: "Then", cueWord: "jog around the park / breakfast", dichCueWord: "chạy bộ / ăn sáng", drillText: "I usually jog around the park before breakfast.", ipa: "/aɪ ˈjuːʒuəli dʒɒɡ əˈraʊnd ðə pɑːk bɪˈfɔː ˈbrɛkfəst/", dichDrillText: "Tôi thường chạy bộ quanh công viên trước bữa sáng.", imageName: "image005.jpg" },
                { stt: 3, tuNoi: "Finally", cueWord: "read news / sleeping", dichCueWord: "đọc tin tức / đi ngủ", drillText: "I usually read news before sleeping.", ipa: "/aɪ ˈjuːʒuəli riːd njuːz bɪˈfɔː ˈsliːpɪŋ/", dichDrillText: "Tôi thường đọc tin tức trước khi đi ngủ.", imageName: "image006.jpg" }
            ]
        },
        {
            sttMau: "3",
            topic: "Travel & Vacation",
            pattern: "We plan to visit [Place] this [Time].",
            question: "Where are you going on holiday?",
            drills: [
                { stt: 1, tuNoi: "", cueWord: "Da Nang beach / summer", dichCueWord: "bãi biển Đà Nẵng / mùa hè", drillText: "We plan to visit Da Nang beach this summer.", ipa: "/wiː plæn tuː ˈvɪzɪt dɑː næŋ biːtʃ ðɪs ˈsʌmər/", dichDrillText: "Chúng tôi dự định đi thăm bãi biển Đà Nẵng vào mùa hè này.", imageName: "image001.jpg" },
                { stt: 2, tuNoi: "Also", cueWord: "Sapa mountains / weekend", dichCueWord: "núi Sa Pa / cuối tuần", drillText: "We plan to visit Sapa mountains this weekend.", ipa: "/wiː plæn tuː ˈvɪzɪt ˈsɑːpɑː ˈmaʊntɪnz ðɪs ˈwiːkˌɛnd/", dichDrillText: "Chúng tôi lên kế hoạch đi vùng núi Sa Pa vào cuối tuần này.", imageName: "image002.jpg" },
                { stt: 3, tuNoi: "And", cueWord: "ancient town / holiday", dichCueWord: "phố cổ / kỳ nghỉ", drillText: "We plan to visit ancient town this holiday.", ipa: "/wiː plæn tuː ˈvɪzɪt ˈeɪnʃənt taʊn ðɪs ˈhɒlɪdeɪ/", dichDrillText: "Chúng tôi dự định ghé thăm phố cổ vào kỳ nghỉ này.", imageName: "image003.jpg" }
            ]
        }
    ];

    excelColumnsList = [
        "STT", "STT Mẫu", "Chủ đề", "Mẫu câu", "Từ gợi mở", "Câu hỏi cho mẫu câu", "Từ nối",
        "Substitution words", "Dịch Substitution words", "Substitution Drills",
        "Phiên âm IPA", "Dịch Substitution Drills", "Minh họa", "ten_file_dinh_kem"
    ];

    paragraphSelectedTopic = "ALL";
    pCurrentSentenceIndex = 0;

    // Đảm bảo có sẵn ít nhất 2 kịch bản mẫu chuẩn
    if (typeof ensureSavedParagraphProfiles === 'function') ensureSavedParagraphProfiles();
    if (typeof loadDefaultJSONTemplate === 'function') loadDefaultJSONTemplate(1, false);

    // Cập nhật toàn bộ các bảng, dropdown và canvas
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

    // Tự động lưu trạng thái này vào IndexedDB để lần sau mở ra có ngay
    await saveFullSystemState(false);

    if (showToastMsg) {
        showToast("⚡ Đã nạp 3 chủ đề mẫu & 6 ảnh minh họa! Sẵn sàng chạy thử mọi tính năng.");
    }
}

/**
 * Xuất toàn bộ không gian làm việc (Toàn bộ Excel, Ảnh Base64, Kịch bản, Thông số) ra 1 file JSON duy nhất
 */
function exportFullWorkspaceToJSON() {
    const backupData = {
        app: "EngSpur Auto Video Studio",
        version: "1.0",
        exportDate: new Date().toISOString(),
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
        masterTimelineDuration
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const nowStr = new Date().toISOString().slice(0, 10);
    const filename = `EngSpur_Full_Workspace_Backup_${nowStr}.json`;
    downloadBlobFallback(blob, filename);
    showToast("Đã xuất gói dự án hoàn chỉnh (.JSON)! Bạn có thể cất file này trên máy.");
}

/**
 * Nhập lại toàn bộ không gian làm việc từ file JSON dự phòng
 */
function handleImportFullWorkspaceJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const data = JSON.parse(evt.target.result);
            if (data && (data.importedDatasets || data.savedParagraphProfiles || data.paragraphGridConfig)) {
                if (data.importedDatasets) importedDatasets = data.importedDatasets;
                if (data.excelColumnsList) excelColumnsList = data.excelColumnsList;
                if (data.videoConfig) videoConfig = { ...videoConfig, ...data.videoConfig };
                if (data.savedParagraphProfiles) savedParagraphProfiles = data.savedParagraphProfiles;
                if (data.activeParagraphProfileId) activeParagraphProfileId = data.activeParagraphProfileId;
                if (data.paragraphGridConfig) paragraphGridConfig = data.paragraphGridConfig;
                if (data.paragraphFieldStyles) paragraphFieldStyles = data.paragraphFieldStyles;
                if (data.paragraphSelectedTopic) paragraphSelectedTopic = data.paragraphSelectedTopic;
                if (data.masterTimelineDuration) masterTimelineDuration = data.masterTimelineDuration;

                localPCImageBase64Map = data.localPCImageBase64Map || {};
                localPCImageMap = {};
                Object.keys(localPCImageBase64Map).forEach(k => {
                    const img = new Image();
                    img.src = localPCImageBase64Map[k];
                    localPCImageMap[k] = img;
                });
                if (document.getElementById('pc-image-badge')) {
                    document.getElementById('pc-image-badge').innerText = `${Object.keys(localPCImageMap).length} Ảnh Local`;
                }

                if (data.canvasBgBase64) {
                    canvasBgBase64 = data.canvasBgBase64;
                    const bgImg = new Image();
                    bgImg.src = data.canvasBgBase64;
                    bgImg.onload = () => { canvasBgImage = bgImg; drawParagraphCanvasFrame(); };
                }
                if (data.canvasBadgeBase64) {
                    canvasBadgeBase64 = data.canvasBadgeBase64;
                    const bdImg = new Image();
                    bdImg.src = data.canvasBadgeBase64;
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

                await saveFullSystemState(false);
                showToast("Đã khôi phục toàn bộ không gian làm việc từ file JSON thành công!");
            } else {
                showToast("File JSON không hợp lệ hoặc thiếu dữ liệu!", "error");
            }
        } catch(err) {
            console.error("Import workspace error", err);
            showToast("Lỗi khi đọc file sao lưu JSON!", "error");
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}
