/**
 * 7c_inspector_grid.js
 * Quản lý danh sách Lớp (Layers), cấu hình lưới (Grid Matrix), khóa hàng song song và phân cột
 */

function toggleAddLayerDropdown(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('add-layer-dropdown-menu');
    if (!menu) return;
    const isHidden = menu.classList.contains('hidden');
    
    // Close any other popovers if open
    document.querySelectorAll('.dropdown-menu-open').forEach(el => el.classList.add('hidden'));

    if (isHidden) {
        menu.classList.remove('hidden');
        menu.classList.add('dropdown-menu-open');
        if (window.lucide && lucide.createIcons) lucide.createIcons();

        // Listen for outside click once
        const onOutsideClick = (e) => {
            const container = document.getElementById('dropdown-add-layer-container');
            if (container && !container.contains(e.target)) {
                menu.classList.add('hidden');
                menu.classList.remove('dropdown-menu-open');
                window.removeEventListener('click', onOutsideClick);
            }
        };
        setTimeout(() => window.addEventListener('click', onOutsideClick), 10);
    } else {
        menu.classList.add('hidden');
        menu.classList.remove('dropdown-menu-open');
    }
}

function selectAddLayerType(isInsideLoop) {
    const menu = document.getElementById('add-layer-dropdown-menu');
    if (menu) {
        menu.classList.add('hidden');
        menu.classList.remove('dropdown-menu-open');
    }
    addNewGridGroupRow(isInsideLoop);
}

function toggleGroupLoopMode(gIdx) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp) return;
    grp.isInsideLoop = (grp.isInsideLoop === false) ? true : false;
    const modeText = grp.isInsideLoop ? "Trong vòng lặp (Drills)" : "Ngoài vòng lặp (Cố định toàn video)";
    renderTimelineLayersListUI();
    renderTimelineTracksUI();
    drawParagraphCanvasFrame();
    showToast(`Lớp "${grp.name}" đổi thành: ${modeText}`);
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function addNewGridGroupRow(isInsideLoop = true) {
    const nextId = paragraphGridConfig.groups.length + 1;
    const colCount = (paragraphGridConfig.gridMatrix && paragraphGridConfig.gridMatrix.columnCount) ? paragraphGridConfig.gridMatrix.columnCount : 2;
    const insideColors = ["#3b82f6", "#10b981", "#8b5cf6", "#06b6d4", "#ec4899"];
    const outsideColors = ["#f59e0b", "#d97706", "#b45309", "#ea580c", "#e11d48"];
    const assignedColor = isInsideLoop 
        ? insideColors[(nextId - 1) % insideColors.length]
        : outsideColors[(nextId - 1) % outsideColors.length];

    const defaultName = isInsideLoop 
        ? `Lớp ${nextId}: Trong Lặp`
        : `Lớp ${nextId}: Ngoài Lặp (Cố định)`;

    paragraphGridConfig.groups.push({
        id: nextId,
        name: defaultName,
        trackColor: assignedColor,
        startTime: 0.0,
        duration: masterTimelineDuration,
        isInsideLoop: isInsideLoop,
        targetColumn: Math.min(nextId, colCount),
        startRowOffset: 0,
        customHeightPx: 0,
        opacity: 100,
        offsetX: 0,
        offsetY: 0,
        frameAlignment: "left",
        fieldSpacing: 12,
        fields: []
    });
    
    paragraphSelectedGroupIdx = paragraphGridConfig.groups.length - 1;
    renderTimelineLayersListUI();
    renderTimelineTracksUI();
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
    showToast(`Đã thêm ${isInsideLoop ? 'Lớp Trong Vòng Lặp' : 'Lớp Ngoài Vòng Lặp (Cố định)'} ${nextId}!`);
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function renderTimelineLayersListUI() {
    const container = document.getElementById('timeline-layers-list-container');
    const layerBadge = document.getElementById('layer-count-badge');
    if (layerBadge) layerBadge.innerText = `${paragraphGridConfig.groups.length} Lớp`;
    if (!container) return;
    container.innerHTML = '';

    const colCount = (paragraphGridConfig.gridMatrix && paragraphGridConfig.gridMatrix.columnCount) ? paragraphGridConfig.gridMatrix.columnCount : 2;

    paragraphGridConfig.groups.forEach((grp, gIdx) => {
        const isSel = (gIdx === paragraphSelectedGroupIdx);
        const isAudio = typeof isAudioLayer === 'function' ? isAudioLayer(grp) : false;
        const blockDiv = document.createElement('div');
        blockDiv.className = `p-2 rounded-xl border transition cursor-pointer space-y-1.5 ${isSel ? 'bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/30' : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'}`;
        blockDiv.onclick = () => selectGridGroup(gIdx);

        let colOptionsHtml = '';
        for (let c = 1; c <= colCount; c++) {
            const sel = (grp.targetColumn === c) ? 'selected' : '';
            colOptionsHtml += `<option value="${c}" ${sel}>Cột ${c}</option>`;
        }

        let fieldsChipsHtml = grp.fields.map((item, fIdx) => {
            const itemType = item.type || 'field';

            if (itemType === 'tts') {
                const isCustom = item.sourceMode === 'custom';
                const count = (item.ttsSpeakFields || []).length;
                const words = (item.customText || '').trim().split(/\s+/).filter(Boolean).length;
                const labelText = isCustom ? `AI Text (${words} từ)` : `AI Đọc (${count})`;
                const isTtsSel = (typeof selectedTtsTarget !== 'undefined' && selectedTtsTarget && selectedTtsTarget.gIdx === gIdx && selectedTtsTarget.fIdx === fIdx);
                const selClass = isTtsSel ? 'bg-indigo-900 border-2 border-indigo-400 ring-2 ring-indigo-400/50 shadow-md text-white' : 'bg-indigo-950/80 border border-indigo-700/80 hover:border-indigo-500';
                return `
                    <div class="flex items-center space-x-1 p-0.5 px-1.5 rounded-md transition cursor-pointer ${selClass}" onclick="event.stopPropagation(); selectTtsItem(${gIdx}, ${fIdx})" title="Nhấp để mở bảng định dạng ở cột trái">
                        <span class="text-[9px] font-bold text-indigo-200 flex items-center space-x-1 cursor-pointer">
                            <i data-lucide="volume-2" class="w-2.5 h-2.5 text-indigo-400"></i>
                            <span>${labelText}</span>
                        </span>
                        <button onclick="event.stopPropagation(); removeFieldItemFromGroup(${gIdx}, ${fIdx})" class="text-rose-400 hover:text-white text-[10px] font-bold ml-1" title="Xóa thẻ">✕</button>
                    </div>
                `;
            } else if (itemType === 'countdown') {
                const sec = item.seconds !== undefined ? item.seconds : 3;
                const isCdSel = (typeof selectedCountdownTarget !== 'undefined' && selectedCountdownTarget && selectedCountdownTarget.gIdx === gIdx && selectedCountdownTarget.fIdx === fIdx);
                const selClass = isCdSel ? 'bg-rose-900 border-2 border-rose-400 ring-2 ring-rose-400/50 shadow-md text-white' : 'bg-rose-950/80 border border-rose-700/80 hover:border-rose-500';
                return `
                    <div class="flex items-center space-x-1 p-0.5 px-1.5 rounded-md transition cursor-pointer ${selClass}" onclick="event.stopPropagation(); selectCountdownItem(${gIdx}, ${fIdx})" title="Nhấp để mở bảng định dạng ở cột trái">
                        <span class="text-[9px] font-bold text-rose-200 flex items-center space-x-1 cursor-pointer">
                            <i data-lucide="timer" class="w-2.5 h-2.5 text-rose-400"></i>
                            <span>Đếm: ${sec}s</span>
                        </span>
                        <button onclick="event.stopPropagation(); removeFieldItemFromGroup(${gIdx}, ${fIdx})" class="text-rose-400 hover:text-white text-[10px] font-bold ml-1" title="Xóa thẻ">✕</button>
                    </div>
                `;
            } else if (itemType === 'custom_text') {
                const isCtSel = (typeof selectedCustomTextTarget !== 'undefined' && selectedCustomTextTarget && selectedCustomTextTarget.gIdx === gIdx && selectedCustomTextTarget.fIdx === fIdx);
                const selClass = isCtSel ? 'bg-teal-900 border-2 border-teal-400 ring-2 ring-teal-400/50 shadow-md text-white' : 'bg-teal-950/80 border border-teal-700/80 hover:border-teal-500';
                return `
                    <div class="flex items-center space-x-1 p-0.5 px-1.5 rounded-md transition cursor-pointer ${selClass}" onclick="event.stopPropagation(); selectCustomTextItem(${gIdx}, ${fIdx})" title="Nhấp để mở bảng định dạng ở cột trái">
                        <span class="text-[9px] font-bold text-teal-200 flex items-center space-x-1 cursor-pointer">
                            <i data-lucide="type" class="w-2.5 h-2.5 text-teal-400"></i>
                            <span>${(item.text || "Chữ").substring(0, 10)}...</span>
                        </span>
                        <button onclick="event.stopPropagation(); removeFieldItemFromGroup(${gIdx}, ${fIdx})" class="text-rose-400 hover:text-white text-[10px] font-bold ml-1" title="Xóa thẻ">✕</button>
                    </div>
                `;
            } else {
                const fKey = typeof item === 'string' ? item : item.key;
                const isImg = fKey.toLowerCase().includes('anh') || fKey.toLowerCase().includes('dinh_kem');
                const isFieldSel = selectedFieldKeysList.includes(fKey) && isSel && (!selectedCustomTextTarget && !selectedTtsTarget && !selectedCountdownTarget);
                const bgClass = isFieldSel ? 'bg-amber-500 text-black font-extrabold shadow' : (isImg ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-indigo-950 text-indigo-300 border border-indigo-800');
                const selBorderClass = isFieldSel ? 'border-2 border-amber-400 ring-2 ring-amber-400/50 shadow-md' : 'border-slate-800 hover:border-slate-600';

                return `
                    <div class="flex items-center space-x-1 p-0.5 px-1.5 rounded-md transition cursor-pointer bg-slate-900 border ${selBorderClass}" onclick="event.stopPropagation(); selectLayerFieldItem(${gIdx}, '${fKey}', event)" title="Nhấp để mở bảng định dạng ở cột trái">
                        <span class="text-[9px] font-bold flex items-center space-x-1 cursor-pointer transition rounded px-1 ${bgClass}">
                            <span>{{${fKey}}}</span>
                        </span>
                        <button onclick="event.stopPropagation(); removeFieldItemFromGroup(${gIdx}, ${fIdx})" class="text-rose-400 hover:text-white text-[10px] font-bold ml-0.5" title="Xóa thẻ">✕</button>
                    </div>
                `;
            }
        }).join('');

        if (grp.fields.length === 0) fieldsChipsHtml = `<span class="text-slate-500 italic text-[9px]">Chưa có thẻ trong lớp</span>`;

        const curOffset = grp.startRowOffset !== undefined ? grp.startRowOffset : 0;
        const audioBadge = isAudio ? `<span class="bg-purple-950 text-purple-300 border border-purple-800 text-[8px] font-bold px-1 rounded flex items-center space-x-0.5"><i data-lucide="lock" class="w-2 h-2"></i><span>AI Khóa</span></span>` : `<span class="bg-slate-800 text-slate-400 text-[8px] px-1 rounded">Tĩnh</span>`;

        const isInside = (grp.isInsideLoop !== false);
        const loopBadge = isInside
            ? `<button onclick="event.stopPropagation(); toggleGroupLoopMode(${gIdx})" title="Đang trong vòng lặp (Drills). Nhấp để đổi sang Ngoài vòng lặp (Cố định toàn video)." class="bg-teal-950/80 hover:bg-teal-900 text-teal-300 border border-teal-700/80 text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center space-x-0.5 transition cursor-pointer shrink-0"><i data-lucide="repeat" class="w-2.5 h-2.5"></i><span>Trong lặp</span></button>`
            : `<button onclick="event.stopPropagation(); toggleGroupLoopMode(${gIdx})" title="Đang ngoài vòng lặp (Cố định). Nhấp để đổi sang Trong vòng lặp (Drills)." class="bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/80 text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center space-x-0.5 transition cursor-pointer shrink-0"><i data-lucide="pin" class="w-2.5 h-2.5"></i><span>Ngoài lặp</span></button>`;

        blockDiv.innerHTML = `
            <div class="flex items-center justify-between gap-1 border-b border-slate-800/80 pb-1">
                <div class="flex items-center space-x-1.5 truncate">
                    <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${grp.trackColor || '#3b82f6'};"></span>
                    <input type="text" value="${grp.name || `Lớp ${gIdx + 1}`}" onchange="event.stopPropagation(); updateGroupName(${gIdx}, this.value)" class="bg-transparent border-0 font-bold text-slate-200 text-xs focus:ring-0 truncate w-20">
                    ${audioBadge}
                    ${loopBadge}
                </div>
                
                <div class="flex items-center space-x-0.5 shrink-0" onclick="event.stopPropagation()">
                    <button onclick="moveTimelineGroup(${gIdx}, -1)" ${gIdx === 0 ? 'disabled' : ''} title="Lên" class="p-0.5 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-300"><i data-lucide="chevron-up" class="w-3 h-3"></i></button>
                    <button onclick="moveTimelineGroup(${gIdx}, 1)" ${gIdx === paragraphGridConfig.groups.length - 1 ? 'disabled' : ''} title="Xuống" class="p-0.5 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-300"><i data-lucide="chevron-down" class="w-3 h-3"></i></button>
                    <button onclick="duplicateTimelineGroup(${gIdx})" title="Nhân bản" class="p-0.5 hover:bg-slate-800 rounded text-sky-400"><i data-lucide="copy" class="w-3 h-3"></i></button>
                    <button onclick="deleteGridGroup(${gIdx})" class="p-0.5 hover:bg-slate-800 rounded text-rose-400" title="Xóa"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-1 text-[9px] bg-slate-950 p-1.5 rounded-lg border border-slate-800/80">
                <div>
                    <label class="text-indigo-400 block font-bold">Cột Grid:</label>
                    <select onchange="updateGroupTargetColumn(${gIdx}, parseInt(this.value))" class="w-full bg-slate-900 border border-slate-700 rounded p-0.5 font-bold text-slate-200">
                        ${colOptionsHtml}
                    </select>
                </div>
                <div>
                    <label class="text-emerald-400 block font-bold">Dòng bắt đầu (Offset):</label>
                    <div class="flex items-center space-x-1 bg-slate-900 border border-slate-700 rounded p-0.5">
                        <button onclick="event.stopPropagation(); adjustGroupRowOffset(${gIdx}, -1)" class="px-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black rounded">-</button>
                        <input type="number" value="${curOffset}" onchange="updateGroupRowOffset(${gIdx}, parseInt(this.value))" class="w-full bg-transparent text-center font-bold text-amber-300 border-0 p-0 text-[10px] focus:ring-0">
                        <button onclick="event.stopPropagation(); adjustGroupRowOffset(${gIdx}, 1)" class="px-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black rounded">+</button>
                    </div>
                </div>
            </div>

            <div class="flex flex-wrap gap-1 pt-0.5">${fieldsChipsHtml}</div>
        `;

        container.appendChild(blockDiv);
    });

    if (window.lucide && lucide.createIcons) lucide.createIcons();
}

function updateGroupLayerProp(gIdx, prop, val) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (grp) {
        grp[prop] = isNaN(val) ? 0 : val;
        drawParagraphCanvasFrame();
    }
}

function updateGroupAlignment(gIdx, alignVal) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (grp) {
        grp.frameAlignment = alignVal;
        grp.fields.forEach(fItem => {
            const fKey = typeof fItem === 'string' ? fItem : fItem.key;
            if (paragraphFieldStyles[fKey]) paragraphFieldStyles[fKey].hAlign = alignVal;
        });
        renderTimelineLayersListUI();
        renderInspectorRibbon();
        drawParagraphCanvasFrame();
        showToast(`Căn lề ${alignVal.toUpperCase()} cho toàn khung!`);
    }
}

function moveTimelineGroup(gIdx, direction) {
    const targetIdx = gIdx + direction;
    if (targetIdx < 0 || targetIdx >= paragraphGridConfig.groups.length) return;
    const item = paragraphGridConfig.groups.splice(gIdx, 1)[0];
    paragraphGridConfig.groups.splice(targetIdx, 0, item);
    paragraphSelectedGroupIdx = targetIdx;
    renderTimelineLayersListUI();
    renderTimelineTracksUI();
    drawParagraphCanvasFrame();
    showToast("Đã thay đổi thứ tự lớp!");
}

function duplicateTimelineGroup(gIdx) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp) return;
    const newGrp = JSON.parse(JSON.stringify(grp));
    newGrp.id = paragraphGridConfig.groups.length + 1;
    newGrp.name = `${grp.name} (Bản sao)`;
    paragraphGridConfig.groups.splice(gIdx + 1, 0, newGrp);
    paragraphSelectedGroupIdx = gIdx + 1;
    renderTimelineLayersListUI();
    renderTimelineTracksUI();
    drawParagraphCanvasFrame();
    showToast("Đã nhân bản lớp thành công!");
}

function updateGroupName(gIdx, val) {
    if (paragraphGridConfig.groups[gIdx]) {
        paragraphGridConfig.groups[gIdx].name = val;
        renderTimelineLayersListUI();
        renderTimelineTracksUI();
    }
}

function updateGroupTargetColumn(gIdx, colIdx) {
    if (paragraphGridConfig.groups[gIdx]) {
        paragraphGridConfig.groups[gIdx].targetColumn = colIdx;
        drawParagraphCanvasFrame();
        showToast(`Lớp chuyển sang Cột ${colIdx}!`);
    }
}

function updateGroupRowOffset(gIdx, offsetVal) {
    if (paragraphGridConfig.groups[gIdx]) {
        paragraphGridConfig.groups[gIdx].startRowOffset = isNaN(offsetVal) ? 0 : Math.max(0, offsetVal);
        drawParagraphCanvasFrame();
    }
}

function adjustGroupRowOffset(gIdx, delta) {
    if (paragraphGridConfig.groups[gIdx]) {
        let cur = paragraphGridConfig.groups[gIdx].startRowOffset || 0;
        paragraphGridConfig.groups[gIdx].startRowOffset = Math.max(0, cur + delta);
        renderTimelineLayersListUI();
        drawParagraphCanvasFrame();
    }
}

function selectGridGroup(gIdx) {
    paragraphSelectedGroupIdx = gIdx;
    const grp = paragraphGridConfig.groups[gIdx];
    if (grp && grp.fields && grp.fields.length > 0) {
        const first = grp.fields[0];
        const type = first.type || 'field';
        if (type === 'custom_text') {
            if (typeof selectCustomTextItem === 'function') {
                selectCustomTextItem(gIdx, 0);
                return;
            }
        } else if (type === 'tts') {
            if (typeof selectTtsItem === 'function') {
                selectTtsItem(gIdx, 0);
                return;
            }
        } else if (type === 'countdown') {
            if (typeof selectCountdownItem === 'function') {
                selectCountdownItem(gIdx, 0);
                return;
            }
        } else {
            const fKey = typeof first === 'string' ? first : first.key;
            if (fKey && typeof selectLayerFieldItem === 'function') {
                selectLayerFieldItem(gIdx, fKey);
                return;
            }
        }
    }
    renderTimelineLayersListUI();
    renderTimelineTracksUI();
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
}

function deleteGridGroup(gIdx) {
    if (paragraphGridConfig.groups.length <= 1) {
        showToast("Phải giữ lại ít nhất 1 lớp!", "error");
        return;
    }
    paragraphGridConfig.groups.splice(gIdx, 1);
    paragraphSelectedGroupIdx = Math.max(0, gIdx - 1);
    renderTimelineLayersListUI();
    renderTimelineTracksUI();
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
    showToast("Đã xóa lớp!");
}

function removeFieldItemFromGroup(gIdx, fIdx) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (grp && grp.fields[fIdx]) {
        grp.fields.splice(fIdx, 1);
        autoRecalculateAudioLayersDuration();
        renderTimelineLayersListUI();
        renderTimelineTracksUI();
        renderInspectorRibbon();
        drawParagraphCanvasFrame();
    }
}

function addSpecialObjectComponent(type) {
    const grp = paragraphGridConfig.groups[paragraphSelectedGroupIdx];
    if (!grp) {
        showToast("Vui lòng chọn 1 lớp trước!", "error");
        return;
    }

    const newIdx = grp.fields.length;
    if (type === 'tts_voice') {
        grp.fields.push({ type: "tts", sourceMode: "fields", ttsSpeakFields: ["Substitution Drills"], customText: "" });
        grp.trackColor = "#8b5cf6";
        autoRecalculateAudioLayersDuration();
        if (typeof selectTtsItem === 'function') {
            selectTtsItem(paragraphSelectedGroupIdx, newIdx);
        }
        showToast("Đã thêm Thẻ Giọng Đọc AI & Khóa độ dài Timeline!");
    } else if (type === 'countdown_timer') {
        grp.fields.push({ type: "countdown", seconds: 3, position: "top_right", size: "medium" });
        if (typeof selectCountdownItem === 'function') {
            selectCountdownItem(paragraphSelectedGroupIdx, newIdx);
        }
        showToast("Đã thêm Đồng Hồ Đếm Ngược!");
    } else if (type === 'custom_text') {
        grp.fields.push({ type: "custom_text", text: "Ghi chú tiêu đề ở đây" });
        if (typeof selectCustomTextItem === 'function') {
            selectCustomTextItem(paragraphSelectedGroupIdx, newIdx);
        }
        showToast("Đã thêm Thẻ Chữ Tự Do!");
    }

    renderTimelineLayersListUI();
    renderTimelineTracksUI();
    drawParagraphCanvasFrame();
}

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
