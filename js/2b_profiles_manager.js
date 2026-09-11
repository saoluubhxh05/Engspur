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
