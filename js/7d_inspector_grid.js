/**
 * 7d_inspector_grid.js
 * Cấu hình ma trận lưới Grid Matrix (1-4 cột), tỉ lệ độ rộng cột, lề đệm 4 chiều
 * và chế độ khóa dòng đồng bộ Excel (Sync Column Controls)
 */

function toggleInlineGridSettingsPanel() {
    const panel = document.getElementById('inline-grid-settings-panel');
    if (panel) panel.classList.toggle('hidden');
}

function syncInlineGridSettingsInputs() {
    const matrix = paragraphGridConfig.gridMatrix || { 
        columnCount: 3, 
        columnWidths: [36, 40, 20], 
        paddingTopPct: 8, 
        paddingBottomPct: 8, 
        paddingLeftPct: 4, 
        paddingRightPct: 4, 
        columnGapPct: 2, 
        showGridOverlay: false,
        colSyncSettings: { 1: { locked: true }, 2: { locked: true }, 3: { locked: false, freeMode: 'center' } }
    };
    
    if (!matrix.colSyncSettings) {
        matrix.colSyncSettings = {
            1: { locked: true, freeMode: 'span' },
            2: { locked: true, freeMode: 'span' },
            3: { locked: false, freeMode: 'center' }
        };
    }
    paragraphGridConfig.gridMatrix = matrix;

    if (document.getElementById('grid-inline-col-count')) document.getElementById('grid-inline-col-count').value = matrix.columnCount || 3;
    if (document.getElementById('grid-inline-show-lines')) document.getElementById('grid-inline-show-lines').checked = !!matrix.showGridOverlay;

    if (document.getElementById('grid-inline-padding-top')) document.getElementById('grid-inline-padding-top').value = matrix.paddingTopPct !== undefined ? matrix.paddingTopPct : 8;
    if (document.getElementById('grid-inline-padding-bottom')) document.getElementById('grid-inline-padding-bottom').value = matrix.paddingBottomPct !== undefined ? matrix.paddingBottomPct : 8;
    if (document.getElementById('grid-inline-padding-left')) document.getElementById('grid-inline-padding-left').value = matrix.paddingLeftPct !== undefined ? matrix.paddingLeftPct : 4;
    if (document.getElementById('grid-inline-padding-right')) document.getElementById('grid-inline-padding-right').value = matrix.paddingRightPct !== undefined ? matrix.paddingRightPct : 4;

    const gapInput = document.getElementById('loop-stack-gap-input');
    const gapBadge = document.getElementById('loop-gap-val-badge');
    const curGap = paragraphGridConfig.loopBlockGap !== undefined ? paragraphGridConfig.loopBlockGap : 24;
    if (gapInput) gapInput.value = curGap;
    if (gapBadge) gapBadge.innerText = `${curGap} px`;

    renderGridInlineWidthInputs();
    renderColumnLockControls();
    syncColumnBoxWrapperUI();
}

function updateLoopBlockGap(val) {
    paragraphGridConfig.loopBlockGap = isNaN(val) ? 20 : Math.max(0, val);
    const gapBadge = document.getElementById('loop-gap-val-badge');
    if (gapBadge) gapBadge.innerText = `${paragraphGridConfig.loopBlockGap} px`;
    drawParagraphCanvasFrame();
    showToast(`Khoảng cách đệm giữa các khối lặp: ${paragraphGridConfig.loopBlockGap}px`);
}

function renderColumnLockControls() {
    const container = document.getElementById('grid-column-locks-container');
    if (!container) return;
    container.innerHTML = '';

    const matrix = paragraphGridConfig.gridMatrix;
    const count = matrix.columnCount || 3;
    if (!matrix.colSyncSettings) matrix.colSyncSettings = {};

    for (let c = 1; c <= count; c++) {
        if (!matrix.colSyncSettings[c]) {
            matrix.colSyncSettings[c] = { locked: (c <= 2), freeMode: (c === 3 ? 'center' : 'span') };
        }
        const conf = matrix.colSyncSettings[c];
        const row = document.createElement('div');
        row.className = "p-1.5 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-col space-y-1";

        row.innerHTML = `
            <div class="flex items-center justify-between">
                <label class="flex items-center space-x-1.5 cursor-pointer">
                    <input type="checkbox" ${conf.locked ? 'checked' : ''} onchange="toggleColumnLock(${c}, this.checked)" class="w-3.5 h-3.5 rounded bg-slate-900 border-emerald-500 text-emerald-500 focus:ring-0">
                    <span class="text-[10px] font-bold ${conf.locked ? 'text-emerald-300' : 'text-slate-400'}">Cột ${c}: Khóa Hàng Excel</span>
                </label>
                <span class="text-[8px] font-mono px-1 rounded ${conf.locked ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'}">${conf.locked ? 'Song song' : 'Tự do'}</span>
            </div>
            ${!conf.locked ? `
                <div class="flex items-center justify-between pl-5 pt-0.5 text-[9px]">
                    <span class="text-slate-400">Chế độ Cột ${c}:</span>
                    <select onchange="updateColumnFreeMode(${c}, this.value)" class="bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-amber-300 text-[9px] font-bold">
                        <option value="center" ${conf.freeMode === 'center' ? 'selected' : ''}>Căn giữa khung hình</option>
                        <option value="span" ${conf.freeMode === 'span' ? 'selected' : ''}>Trải dài bằng tổng hàng</option>
                        <option value="free" ${conf.freeMode === 'free' ? 'selected' : ''}>Tự do (tọa độ thủ công)</option>
                    </select>
                </div>
            ` : ''}
        `;
        container.appendChild(row);
    }
}

function toggleColumnLock(colIdx, isLocked) {
    const matrix = paragraphGridConfig.gridMatrix;
    if (!matrix.colSyncSettings) matrix.colSyncSettings = {};
    if (!matrix.colSyncSettings[colIdx]) matrix.colSyncSettings[colIdx] = { locked: true, freeMode: 'center' };
    matrix.colSyncSettings[colIdx].locked = isLocked;
    renderColumnLockControls();
    drawParagraphCanvasFrame();
    showToast(`Cột ${colIdx}: Đã ${isLocked ? 'BẬT Khóa hàng Excel' : 'chuyển sang Tự do'}`);
}

function updateColumnFreeMode(colIdx, mode) {
    const matrix = paragraphGridConfig.gridMatrix;
    if (matrix.colSyncSettings && matrix.colSyncSettings[colIdx]) {
        matrix.colSyncSettings[colIdx].freeMode = mode;
        drawParagraphCanvasFrame();
        showToast(`Cột ${colIdx}: Chế độ ${mode}`);
    }
}

function onGridColumnCountChange(colCount) {
    const matrix = paragraphGridConfig.gridMatrix;
    matrix.columnCount = colCount;

    if (colCount === 1) matrix.columnWidths = [94];
    else if (colCount === 2) matrix.columnWidths = [60, 36];
    else if (colCount === 3) matrix.columnWidths = [36, 40, 20];
    else if (colCount === 4) matrix.columnWidths = [24, 24, 24, 24];

    renderGridInlineWidthInputs();
    renderTimelineLayersListUI();
    renderColumnBoxWrapperColOptions();
    drawParagraphCanvasFrame();
}

function renderGridInlineWidthInputs() {
    const container = document.getElementById('grid-inline-col-widths-container');
    if (!container) return;
    container.innerHTML = '';
    const matrix = paragraphGridConfig.gridMatrix;
    const count = matrix.columnCount || 2;

    container.className = `grid grid-cols-${count} gap-1`;

    for (let i = 0; i < count; i++) {
        const w = (matrix.columnWidths && matrix.columnWidths[i] !== undefined) ? matrix.columnWidths[i] : Math.floor(90 / count);
        const div = document.createElement('div');
        div.innerHTML = `
            <label class="text-[9px] text-slate-400 block mb-0.5 font-bold">Cột ${i + 1}:</label>
            <input type="number" value="${w}" onchange="updateSingleColumnWidth(${i}, parseInt(this.value))" class="w-full bg-slate-900 border border-slate-700 rounded p-1 font-bold text-amber-300 text-[10px] text-center">
        `;
        container.appendChild(div);
    }
}

function updateSingleColumnWidth(colIdx, val) {
    if (!paragraphGridConfig.gridMatrix.columnWidths) paragraphGridConfig.gridMatrix.columnWidths = [60, 36];
    paragraphGridConfig.gridMatrix.columnWidths[colIdx] = isNaN(val) ? 20 : val;
    drawParagraphCanvasFrame();
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function updateGridGlobalPadding() {
    const matrix = paragraphGridConfig.gridMatrix;
    matrix.paddingTopPct = parseInt(document.getElementById('grid-inline-padding-top').value) || 8;
    matrix.paddingBottomPct = parseInt(document.getElementById('grid-inline-padding-bottom').value) || 8;
    matrix.paddingLeftPct = parseInt(document.getElementById('grid-inline-padding-left').value) || 4;
    matrix.paddingRightPct = parseInt(document.getElementById('grid-inline-padding-right').value) || 4;
    drawParagraphCanvasFrame();
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function updateGroupPresentationMode(gIdx, mode) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp) return;
    grp.presentationMode = mode;
    drawParagraphCanvasFrame();
    renderTimelineTracksUI();
    renderTimelineLayersListUI();
    const modeName = mode === 'single' ? '1 Câu / Làm mới' : (mode === 'all' ? 'Hiện tất cả dòng' : (mode === 'stack' ? 'Xếp tầng nối tiếp' : 'Theo kịch bản chung'));
    showToast(`Lớp "${grp.name}": Trình chiếu "${modeName}"!`);
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}


function toggleGridOverlayLines(isChecked) {
    paragraphGridConfig.gridMatrix.showGridOverlay = isChecked;
    drawParagraphCanvasFrame();
}

function toggleSection(contentId, iconId) {
    const content = document.getElementById(contentId);
    const icon = document.getElementById(iconId);
    if (!content) return;
    const isHidden = content.classList.contains('hidden');
    if (isHidden) {
        content.classList.remove('hidden');
        if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
        content.classList.add('hidden');
        if (icon) icon.style.transform = 'rotate(0deg)';
    }
}

/**
 * =========================================================================
 * KHUNG VIỀN BAO GỘP CỘT (COLUMN BOX WRAPPER - MODE 2)
 * =========================================================================
 */

function getColumnBoxWrapperConfig() {
    if (!paragraphGridConfig.gridMatrix) {
        paragraphGridConfig.gridMatrix = { columnCount: 3, columnWidths: [36, 40, 20] };
    }
    if (!paragraphGridConfig.gridMatrix.columnBoxWrapper) {
        paragraphGridConfig.gridMatrix.columnBoxWrapper = {
            enabled: false,
            startCol: 1,
            endCol: 2,
            borderColor: "#d99a14",
            borderWidth: 3,
            borderRadius: 20,
            paddingX: 16,
            paddingY: 16,
            bgColor: "transparent",
            heightMode: "auto",
            layerOrder: "under"
        };
    }
    if (paragraphGridConfig.gridMatrix.columnBoxWrapper.layerOrder === undefined) {
        paragraphGridConfig.gridMatrix.columnBoxWrapper.layerOrder = "under";
    }
    return paragraphGridConfig.gridMatrix.columnBoxWrapper;
}

function renderColumnBoxWrapperColOptions() {
    const count = (paragraphGridConfig.gridMatrix && paragraphGridConfig.gridMatrix.columnCount) || 3;
    const startSelect = document.getElementById('grid-wrap-box-start-col');
    const endSelect = document.getElementById('grid-wrap-box-end-col');
    const wrapBox = getColumnBoxWrapperConfig();

    if (startSelect) {
        const curVal = parseInt(startSelect.value) || wrapBox.startCol || 1;
        startSelect.innerHTML = '';
        for (let i = 1; i <= count; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerText = `Cột ${i}`;
            if (i === curVal) opt.selected = true;
            startSelect.appendChild(opt);
        }
    }

    if (endSelect) {
        const curVal = parseInt(endSelect.value) || wrapBox.endCol || Math.min(count, 2);
        endSelect.innerHTML = '';
        for (let i = 1; i <= count; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerText = `Cột ${i}`;
            if (i === curVal) opt.selected = true;
            endSelect.appendChild(opt);
        }
    }
}

function syncColumnBoxWrapperUI() {
    const wrapBox = getColumnBoxWrapperConfig();

    renderColumnBoxWrapperColOptions();

    const enabledCheck = document.getElementById('grid-wrap-box-enabled');
    const statusBadge = document.getElementById('grid-wrap-box-status-badge');
    const controlsContainer = document.getElementById('grid-wrap-box-controls');

    if (enabledCheck) enabledCheck.checked = !!wrapBox.enabled;
    if (statusBadge) {
        statusBadge.innerText = wrapBox.enabled ? "Đang Bật" : "Tắt";
        statusBadge.className = wrapBox.enabled ? "text-[9px] text-amber-400 font-bold font-mono px-1 rounded bg-amber-950/80 border border-amber-800/60" : "text-[9px] text-slate-500 font-mono";
    }

    if (controlsContainer) {
        if (wrapBox.enabled) {
            controlsContainer.classList.remove('opacity-40', 'pointer-events-none');
        } else {
            controlsContainer.classList.add('opacity-40', 'pointer-events-none');
        }
    }

    const startSelect = document.getElementById('grid-wrap-box-start-col');
    const endSelect = document.getElementById('grid-wrap-box-end-col');
    if (startSelect) startSelect.value = wrapBox.startCol || 1;
    if (endSelect) endSelect.value = wrapBox.endCol || 2;

    const colorPicker = document.getElementById('grid-wrap-box-color');
    const colorHex = document.getElementById('grid-wrap-box-color-hex');
    const bColor = wrapBox.borderColor || "#d99a14";
    if (colorPicker) colorPicker.value = bColor.startsWith('#') ? bColor : "#d99a14";
    if (colorHex) colorHex.value = bColor;

    const widthInput = document.getElementById('grid-wrap-box-width');
    if (widthInput) widthInput.value = wrapBox.borderWidth !== undefined ? wrapBox.borderWidth : 3;

    const radiusInput = document.getElementById('grid-wrap-box-radius');
    if (radiusInput) radiusInput.value = wrapBox.borderRadius !== undefined ? wrapBox.borderRadius : 20;

    const padLeftInput = document.getElementById('grid-wrap-box-pad-left');
    if (padLeftInput) padLeftInput.value = wrapBox.paddingLeft !== undefined ? wrapBox.paddingLeft : (wrapBox.paddingX !== undefined ? wrapBox.paddingX : 16);

    const padRightInput = document.getElementById('grid-wrap-box-pad-right');
    if (padRightInput) padRightInput.value = wrapBox.paddingRight !== undefined ? wrapBox.paddingRight : (wrapBox.paddingX !== undefined ? wrapBox.paddingX : 16);

    const padTopInput = document.getElementById('grid-wrap-box-pad-top');
    if (padTopInput) padTopInput.value = wrapBox.paddingTop !== undefined ? wrapBox.paddingTop : (wrapBox.paddingY !== undefined ? wrapBox.paddingY : 16);

    const padBottomInput = document.getElementById('grid-wrap-box-pad-bottom');
    if (padBottomInput) padBottomInput.value = wrapBox.paddingBottom !== undefined ? wrapBox.paddingBottom : (wrapBox.paddingY !== undefined ? wrapBox.paddingY : 16);

    const heightModeSelect = document.getElementById('grid-wrap-box-height-mode');
    if (heightModeSelect) {
        let curMode = wrapBox.heightMode || "auto";
        if (curMode === 'full_grid') curMode = 'full';
        heightModeSelect.value = curMode;
    }

    const isFullGrid = (wrapBox.heightMode === 'full' || wrapBox.heightMode === 'full_grid');
    const colRangeRow = document.getElementById('grid-wrap-box-col-range-row');
    if (colRangeRow) {
        if (isFullGrid) {
            colRangeRow.classList.add('opacity-40', 'pointer-events-none');
        } else {
            colRangeRow.classList.remove('opacity-40', 'pointer-events-none');
        }
    }

    const bgColorPicker = document.getElementById('grid-wrap-box-bg-color');
    if (bgColorPicker && wrapBox.bgColor && wrapBox.bgColor.startsWith('#')) {
        bgColorPicker.value = wrapBox.bgColor;
    }

    const layerOrderSelect = document.getElementById('grid-wrap-box-layer-order');
    if (layerOrderSelect) {
        layerOrderSelect.value = wrapBox.layerOrder || "under";
    }
}

function toggleColumnBoxWrapper(isChecked) {
    const wrapBox = getColumnBoxWrapperConfig();
    wrapBox.enabled = isChecked;

    syncColumnBoxWrapperUI();
    drawParagraphCanvasFrame();

    showToast(isChecked ? "Đã BẬT Khung Viền Bao Cột (Mode 2)!" : "Đã TẮT Khung Viền Bao Cột!");
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function updateColumnBoxWrapperConfig() {
    const wrapBox = getColumnBoxWrapperConfig();

    const startSelect = document.getElementById('grid-wrap-box-start-col');
    const endSelect = document.getElementById('grid-wrap-box-end-col');
    const colorHex = document.getElementById('grid-wrap-box-color-hex');
    const widthInput = document.getElementById('grid-wrap-box-width');
    const radiusInput = document.getElementById('grid-wrap-box-radius');
    const padLeftInput = document.getElementById('grid-wrap-box-pad-left');
    const padRightInput = document.getElementById('grid-wrap-box-pad-right');
    const padTopInput = document.getElementById('grid-wrap-box-pad-top');
    const padBottomInput = document.getElementById('grid-wrap-box-pad-bottom');
    const heightModeSelect = document.getElementById('grid-wrap-box-height-mode');
    const layerOrderSelect = document.getElementById('grid-wrap-box-layer-order');

    let sCol = startSelect ? parseInt(startSelect.value) : 1;
    let eCol = endSelect ? parseInt(endSelect.value) : 2;
    if (sCol > eCol) {
        const temp = sCol;
        sCol = eCol;
        eCol = temp;
        if (startSelect) startSelect.value = sCol;
        if (endSelect) endSelect.value = eCol;
    }

    wrapBox.startCol = sCol;
    wrapBox.endCol = eCol;
    if (colorHex) wrapBox.borderColor = colorHex.value.trim() || "#d99a14";
    if (widthInput) wrapBox.borderWidth = Math.max(1, parseInt(widthInput.value) || 3);
    if (radiusInput) wrapBox.borderRadius = Math.max(0, parseInt(radiusInput.value) || 0);

    const padL = padLeftInput ? (isNaN(parseInt(padLeftInput.value)) ? 0 : parseInt(padLeftInput.value)) : 16;
    const padR = padRightInput ? (isNaN(parseInt(padRightInput.value)) ? 0 : parseInt(padRightInput.value)) : 16;
    const padT = padTopInput ? (isNaN(parseInt(padTopInput.value)) ? 0 : parseInt(padTopInput.value)) : 16;
    const padB = padBottomInput ? (isNaN(parseInt(padBottomInput.value)) ? 0 : parseInt(padBottomInput.value)) : 16;

    wrapBox.paddingLeft = padL;
    wrapBox.paddingRight = padR;
    wrapBox.paddingTop = padT;
    wrapBox.paddingBottom = padB;
    // Đồng bộ tương thích ngược
    wrapBox.paddingX = padL;
    wrapBox.paddingY = padT;

    if (heightModeSelect) wrapBox.heightMode = heightModeSelect.value;
    if (layerOrderSelect) wrapBox.layerOrder = layerOrderSelect.value || "under";

    const isFullGrid = (wrapBox.heightMode === 'full' || wrapBox.heightMode === 'full_grid');
    const colRangeRow = document.getElementById('grid-wrap-box-col-range-row');
    if (colRangeRow) {
        if (isFullGrid) {
            colRangeRow.classList.add('opacity-40', 'pointer-events-none');
        } else {
            colRangeRow.classList.remove('opacity-40', 'pointer-events-none');
        }
    }

    drawParagraphCanvasFrame();
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function onWrapBoxColorPickerChange(val) {
    const colorHex = document.getElementById('grid-wrap-box-color-hex');
    if (colorHex) colorHex.value = val;
    updateColumnBoxWrapperConfig();
}

function onWrapBoxHexChange(val) {
    let cleanHex = val.trim();
    if (!cleanHex.startsWith('#') && cleanHex.length >= 3) {
        cleanHex = '#' + cleanHex;
    }
    const colorPicker = document.getElementById('grid-wrap-box-color');
    if (colorPicker && /^#[0-9A-Fa-f]{6}$/.test(cleanHex)) {
        colorPicker.value = cleanHex;
    }
    const colorHex = document.getElementById('grid-wrap-box-color-hex');
    if (colorHex) colorHex.value = cleanHex;
    updateColumnBoxWrapperConfig();
}

function setColumnBoxWrapperBg(colorVal) {
    const wrapBox = getColumnBoxWrapperConfig();
    wrapBox.bgColor = colorVal;
    drawParagraphCanvasFrame();
    showToast(`Nền khung viền: ${colorVal === 'transparent' ? 'Trong suốt' : colorVal}`);
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

