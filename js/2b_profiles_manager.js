/**
 * 2b_profiles_manager.js
 * Quản lý danh sách kịch bản (Profiles), lưu/ghi đè, nạp mẫu JSON 1:1 và xếp tầng
 */

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

    if (typeof syncCurrentMediaToActiveProfile === 'function') {
        syncCurrentMediaToActiveProfile();
    }
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
    let newName = `${currentName} (Bản mới)`;
    try {
        const userPrompt = window.prompt("Nhập tên cho kịch bản mới:", newName);
        if (userPrompt && userPrompt.trim()) newName = userPrompt.trim();
    } catch (e) {
        console.warn("IFrame sandbox prevented prompt dialog:", e);
    }

    if (typeof syncCurrentMediaToActiveProfile === 'function') {
        syncCurrentMediaToActiveProfile();
    }

    const newProfile = JSON.parse(JSON.stringify(paragraphGridConfig));
    newProfile.id = "profile_" + Date.now();
    newProfile.name = newName.trim();
    newProfile.masterDuration = masterTimelineDuration;
    newProfile.fieldStyles = JSON.parse(JSON.stringify(paragraphFieldStyles));

    savedParagraphProfiles.push(newProfile);
    activeParagraphProfileId = newProfile.id;
    paragraphGridConfig = newProfile;

    const nameInput = document.getElementById('script-profile-name-input');
    if (nameInput) {
        nameInput.value = newProfile.name;
        try {
            nameInput.focus();
            nameInput.select();
        } catch(e) {}
    }

    if (typeof applyProfileMediaState === 'function') {
        applyProfileMediaState(newProfile);
    }

    renderSavedParagraphProfilesDropdown();
    await saveFullSystemState();
    showToast(`Đã tạo và lưu kịch bản mới: "${newProfile.name}"!`);
}

async function createNewBlankProfile() {
    try {
        // 1. Đồng bộ và lưu lại trạng thái kịch bản hiện tại trước khi chuyển đổi
        if (typeof syncCurrentActiveProfileState === 'function') {
            syncCurrentActiveProfileState();
        } else if (typeof activeParagraphProfileId !== 'undefined' && activeParagraphProfileId && Array.isArray(savedParagraphProfiles)) {
            const cur = savedParagraphProfiles.find(p => p.id === activeParagraphProfileId);
            if (cur) {
                cur.fieldStyles = JSON.parse(JSON.stringify(paragraphFieldStyles || {}));
                cur.groups = JSON.parse(JSON.stringify(paragraphGridConfig.groups || []));
                cur.gridMatrix = JSON.parse(JSON.stringify(paragraphGridConfig.gridMatrix || {}));
                cur.presentationMode = paragraphGridConfig.presentationMode || "normal";
                cur.loopBlockGap = paragraphGridConfig.loopBlockGap || 0;
                cur.masterDuration = masterTimelineDuration;
            }
        }

        // 2. Tự động xác định tên kịch bản mới mà không bị chặn bởi iFrame sandbox
        const defaultNum = (Array.isArray(savedParagraphProfiles) ? savedParagraphProfiles.length : 0) + 1;
        let newName = `Kịch bản trắng ${defaultNum}`;
        try {
            const promptVal = window.prompt("Nhập tên cho kịch bản trắng mới:", newName);
            if (promptVal && promptVal.trim()) {
                newName = promptVal.trim();
            }
        } catch (e) {
            console.warn("IFrame sandbox prevented prompt modal, using default name:", e);
        }

        // 3. Khởi tạo đối tượng kịch bản trắng hoàn toàn (0 lớp, 1 cột chuẩn, 8.0s)
        const blankProfile = {
            id: "profile_" + Date.now(),
            name: newName,
            date: new Date().toISOString().split('T')[0],
            presentationMode: "normal",
            masterDuration: 8.0,
            loopBlockGap: 0,
            zoneDurations: { intro: 2.0, drills: 4.5, outro: 1.5 },
            customMediaEnabled: false,
            customMedia: null,
            gridMatrix: {
                columnCount: 1,
                columnWidths: [100],
                paddingTopPct: 6,
                paddingBottomPct: 6,
                paddingLeftPct: 4,
                paddingRightPct: 4,
                columnGapPct: 2,
                showGridOverlay: false,
                autoRowSync: true,
                columnBoxWrapper: {
                    enabled: false,
                    startCol: 1,
                    endCol: 1,
                    borderColor: "#d99a14",
                    borderWidth: 3,
                    borderRadius: 20,
                    paddingX: 16,
                    paddingY: 16,
                    paddingLeft: 16,
                    paddingRight: 16,
                    paddingTop: 16,
                    paddingBottom: 16,
                    bgColor: "transparent",
                    heightMode: "auto"
                }
            },
            fieldStyles: (typeof paragraphFieldStyles !== 'undefined') ? JSON.parse(JSON.stringify(paragraphFieldStyles)) : {},
            groups: []
        };

        if (!Array.isArray(savedParagraphProfiles)) {
            savedParagraphProfiles = [];
        }
        savedParagraphProfiles.push(blankProfile);
        activeParagraphProfileId = blankProfile.id;
        paragraphGridConfig = JSON.parse(JSON.stringify(blankProfile));
        masterTimelineDuration = blankProfile.masterDuration;

        if (typeof applyProfileMediaState === 'function') {
            applyProfileMediaState(blankProfile);
        }

        // Reset trạng thái chọn lớp & thẻ
        paragraphSelectedGroupIdx = -1;
        paragraphSelectedFieldKey = null;
        selectedFieldKeysList = [];
        selectedCustomTextTarget = null;
        if (typeof selectedCountdownTarget !== 'undefined') selectedCountdownTarget = null;
        if (typeof selectedTtsTarget !== 'undefined') selectedTtsTarget = null;
        if (typeof selectedAudioSfxTarget !== 'undefined') selectedAudioSfxTarget = null;
        if (typeof selectedVideoTarget !== 'undefined') selectedVideoTarget = null;
        if (typeof selectedProgressTrackerTarget !== 'undefined') selectedProgressTrackerTarget = null;

        const nameInput = document.getElementById('script-profile-name-input');
        if (nameInput) {
            nameInput.value = blankProfile.name;
            try {
                nameInput.focus();
                nameInput.select();
            } catch(e) {}
        }

        const durInput = document.getElementById('master-loop-duration-input');
        if (durInput) {
            durInput.value = masterTimelineDuration;
        }

        if (typeof updateLoopPresentationModeUI === 'function') updateLoopPresentationModeUI();
        if (typeof renderSavedParagraphProfilesDropdown === 'function') renderSavedParagraphProfilesDropdown();
        if (typeof renderTimelineLayersListUI === 'function') renderTimelineLayersListUI();
        if (typeof renderTimelineTracksUI === 'function') renderTimelineTracksUI();
        if (typeof renderInspectorRibbon === 'function') renderInspectorRibbon();
        if (typeof syncInlineGridSettingsInputs === 'function') syncInlineGridSettingsInputs();
        if (typeof seekTimeline === 'function') seekTimeline(0);
        if (typeof drawParagraphCanvasFrame === 'function') drawParagraphCanvasFrame();

        if (typeof saveFullSystemState === 'function') await saveFullSystemState();
        showToast(`Đã tạo kịch bản trắng mới: "${blankProfile.name}"! Bạn có thể đổi tên ở ô bên dưới hoặc thêm lớp mới.`);
    } catch (err) {
        console.error("Lỗi khi tạo kịch bản trắng:", err);
        showToast("Đã xảy ra lỗi khi tạo kịch bản: " + (err.message || err), "error");
    }
}

window.createNewBlankProfile = createNewBlankProfile;
window.saveCurrentProfileAsNew = saveCurrentProfileAsNew;

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
    if (typeof applyProfileMediaState === 'function') applyProfileMediaState(paragraphGridConfig);
    seekTimeline(0);

    if (showNotif) showToast(`Đã nạp Kịch Bản Mẫu: ${template.name}!`);
}

function exportCurrentProfileToJSON() {
    if (typeof syncCurrentMediaToActiveProfile === 'function') {
        syncCurrentMediaToActiveProfile();
    }
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
                if (typeof applyProfileMediaState === 'function') applyProfileMediaState(parsed);
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
            if (typeof syncCurrentMediaToActiveProfile === 'function') syncCurrentMediaToActiveProfile();
            currentProfile.customMediaEnabled = paragraphGridConfig.customMediaEnabled;
            currentProfile.customMedia = paragraphGridConfig.customMedia ? JSON.parse(JSON.stringify(paragraphGridConfig.customMedia)) : null;
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

        // Tự động nạp hoặc khôi phục Nền & Logo tương ứng của kịch bản này
        if (typeof applyProfileMediaState === 'function') {
            applyProfileMediaState(found);
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

        showToast(`Đã chuyển sang kịch bản: ${found.name}! Toàn bộ Lưới, Timeline, Nền & Logo đã được làm mới.`);
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
    if (typeof updatePreviewButtonLabel === 'function') updatePreviewButtonLabel();
    let label = "Đã chuyển sang chế độ Xếp tầng";
    if (mode === 'single') label = "Đã chuyển sang chế độ 1 Câu / Làm mới";
    else if (mode === 'all') label = "Đã chuyển sang chế độ Hiện tất cả dòng cùng 1 lúc";
    showToast(label);
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function updateLoopPresentationModeUI() {
    const btnSingle = document.getElementById('loop-mode-single-btn');
    const btnStack = document.getElementById('loop-mode-stack-btn');
    const btnAll = document.getElementById('loop-mode-all-btn');
    const selectFormula = document.getElementById('loop-stack-formula-select');
    const mode = paragraphGridConfig.presentationMode || 'stack';

    const activeClass = "px-2 py-0.5 rounded transition bg-indigo-600 text-white shadow font-bold";
    const inactiveClass = "px-2 py-0.5 rounded transition text-slate-400 hover:text-white";

    if (btnSingle) btnSingle.className = (mode === 'single') ? activeClass : inactiveClass;
    if (btnStack) btnStack.className = (mode === 'stack') ? activeClass : inactiveClass;
    if (btnAll) btnAll.className = (mode === 'all') ? activeClass : inactiveClass;

    if (selectFormula) {
        selectFormula.value = paragraphGridConfig.stackingFormula || (mode === 'single' ? "0" : "auto");
    }
}

function updateGlobalStackingFormula(val) {
    paragraphGridConfig.stackingFormula = val;
    drawParagraphCanvasFrame();
    showToast(`Kiểu xếp dòng: ${val}`);
}
