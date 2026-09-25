/**
 * 7c_inspector_layers.js
 * Quản lý danh sách Lớp (Layers), phân bổ trường dữ liệu, đối tượng đặc biệt (Custom Text, TTS, Countdown, SFX)
 * và điều khiển tương tác từng thẻ trong Lớp
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

function selectAddLayerType(loopType) {
    const menu = document.getElementById('add-layer-dropdown-menu');
    if (menu) {
        menu.classList.add('hidden');
        menu.classList.remove('dropdown-menu-open');
    }
    addNewGridGroupRow(loopType);
}

function getGroupLoopPosition(grp) {
    if (!grp) return 'inside';
    if (grp.loopPosition) return grp.loopPosition;
    if (grp.isInsideLoop === false) return 'outside';
    return 'inside';
}

function cycleGroupLoopMode(gIdx) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp) return;
    const current = getGroupLoopPosition(grp);
    let next = 'inside';
    let modeText = 'Trong vòng lặp (Drills)';
    if (current === 'before') {
        next = 'inside';
        modeText = 'Trong vòng lặp (Drills)';
    } else if (current === 'inside') {
        next = 'after';
        modeText = 'Sau vòng lặp (Outro)';
    } else if (current === 'after') {
        next = 'outside';
        modeText = 'Cố định toàn video';
    } else {
        next = 'before';
        modeText = 'Trước vòng lặp (Intro)';
    }
    grp.loopPosition = next;
    grp.isInsideLoop = (next === 'inside');

    if (typeof getZoneBoundary === 'function') {
        const bound = getZoneBoundary(next);
        if (bound) {
            if ((grp.startTime || 0) < bound.start || (grp.startTime || 0) >= bound.end) {
                grp.startTime = bound.start;
            }
            if ((grp.startTime + (grp.duration || 1)) > bound.end) {
                grp.duration = Math.round(Math.max(0.5, bound.end - grp.startTime) * 10) / 10;
            }
        }
    }

    renderTimelineLayersListUI();
    renderTimelineTracksUI();
    drawParagraphCanvasFrame();
    showToast(`Lớp "${grp.name}" đổi thành: ${modeText}`);
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function toggleGroupLoopMode(gIdx) {
    cycleGroupLoopMode(gIdx);
}

function addNewGridGroupRow(loopType = 'inside') {
    const nextId = paragraphGridConfig.groups.length + 1;
    const colCount = (paragraphGridConfig.gridMatrix && paragraphGridConfig.gridMatrix.columnCount) ? paragraphGridConfig.gridMatrix.columnCount : 2;
    
    // Normalize boolean if passed from legacy callers
    let resolvedType = loopType;
    if (loopType === true) resolvedType = 'inside';
    else if (loopType === false) resolvedType = 'outside';

    const colorPalette = {
        before: ["#3b82f6", "#2563eb", "#1d4ed8"],
        inside: ["#10b981", "#059669", "#047857", "#06b6d4", "#0891b2"],
        after: ["#8b5cf6", "#7c3aed", "#6d28d9", "#ec4899", "#db2777"],
        outside: ["#f59e0b", "#d97706", "#b45309", "#ea580c", "#e11d48"]
    };

    const colors = colorPalette[resolvedType] || colorPalette.inside;
    const assignedColor = colors[(nextId - 1) % colors.length];

    let defaultName = `Lớp ${nextId}: Trong Lặp`;
    let toastName = 'Lớp Trong Vòng Lặp';
    if (resolvedType === 'before') {
        defaultName = `Lớp ${nextId}: Trước Lặp (Intro)`;
        toastName = 'Lớp Trước Vòng Lặp (Intro)';
    } else if (resolvedType === 'after') {
        defaultName = `Lớp ${nextId}: Sau Lặp (Outro)`;
        toastName = 'Lớp Sau Vòng Lặp (Outro)';
    } else if (resolvedType === 'outside') {
        defaultName = `Lớp ${nextId}: Cố định (Xuyên suốt)`;
        toastName = 'Lớp Cố Định Toàn Video';
    }

    const newGrp = {
        id: nextId,
        name: defaultName,
        trackColor: assignedColor,
        startTime: 0.0,
        duration: masterTimelineDuration,
        snapEndToTotalDuration: false,
        loopPosition: resolvedType,
        isInsideLoop: (resolvedType === 'inside'),
        targetColumn: Math.min(nextId, colCount),
        colSpan: 1,
        startRowOffset: 0,
        customHeightPx: 0,
        opacity: 100,
        offsetX: 0,
        offsetY: 0,
        frameAlignment: "left",
        fieldSpacing: 12,
        fields: []
    };
    paragraphGridConfig.groups.push(newGrp);

    if (typeof getZoneBoundary === 'function') {
        const bound = getZoneBoundary(resolvedType);
        if (bound) {
            newGrp.startTime = bound.start;
            newGrp.duration = Math.round(Math.max(0.5, Math.min(masterTimelineDuration, bound.end - bound.start)) * 10) / 10;
        }
    }
    
    paragraphSelectedGroupIdx = paragraphGridConfig.groups.length - 1;
    renderTimelineLayersListUI();
    renderTimelineTracksUI();
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
    showToast(`Đã thêm ${toastName} ${nextId}!`);
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

// =========================================================================
// HỆ THỐNG QUẢN LÝ LỚP CHUẨN CANVA (CANVA-STYLE LAYER MANAGEMENT SYSTEM)
// =========================================================================
var canvaLayersViewMode = localStorage.getItem('canvaLayersViewMode') || 'canva'; // 'canva' | 'classic'
var canvaLayerSearchQuery = '';
var canvaSelectedZoneTab = 'all'; // 'all' | 'before' | 'inside' | 'after' | 'outside'
var canvaCollapsedCards = {}; // Record of collapsed cards in classic mode

function getGroupPrimaryMeta(grp) {
    if (!grp.fields || grp.fields.length === 0) {
        return { icon: 'layers', label: 'Trống', colorClass: 'text-slate-400', badgeClass: 'bg-slate-900 text-slate-400 border-slate-700' };
    }
    for (const f of grp.fields) {
        const type = f.type || 'field';
        if (type === 'tts') {
            return { icon: 'volume-2', label: 'AI Voice', colorClass: 'text-purple-400', badgeClass: 'bg-purple-950 text-purple-300 border-purple-800' };
        } else if (type === 'audio_sfx') {
            return { icon: 'music', label: 'SFX', colorClass: 'text-fuchsia-400', badgeClass: 'bg-fuchsia-950 text-fuchsia-300 border-fuchsia-800' };
        } else if (type === 'countdown') {
            return { icon: 'timer', label: 'Đếm ngược', colorClass: 'text-rose-400', badgeClass: 'bg-rose-950 text-rose-300 border-rose-800' };
        } else if (type === 'progress_tracker') {
            return { icon: 'sliders', label: 'Tiến độ', colorClass: 'text-emerald-400', badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
        } else if (type === 'custom_text') {
            return { icon: 'type', label: 'Chữ tự do', colorClass: 'text-teal-400', badgeClass: 'bg-teal-950 text-teal-300 border-teal-800' };
        } else if (type === 'video') {
            return { icon: 'video', label: 'Video Clip', colorClass: 'text-sky-400', badgeClass: 'bg-sky-950 text-sky-300 border-sky-800' };
        } else {
            const k = (typeof f === 'string' ? f : f.key) || '';
            if (k.toLowerCase().includes('anh') || k.toLowerCase().includes('dinh_kem')) {
                return { icon: 'image', label: 'Hình ảnh', colorClass: 'text-amber-400', badgeClass: 'bg-amber-950 text-amber-300 border-amber-800' };
            }
        }
    }
    return { icon: 'file-text', label: 'Văn bản', colorClass: 'text-indigo-400', badgeClass: 'bg-indigo-950 text-indigo-300 border-indigo-800' };
}

function toggleGroupVisibility(gIdx, event) {
    if (event) event.stopPropagation();
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp) return;
    grp.visible = (grp.visible === false) ? true : false;
    renderTimelineLayersListUI();
    drawParagraphCanvasFrame();
    showToast(`Lớp "${grp.name}": ${grp.visible !== false ? 'Đã hiện' : 'Đã ẩn'} trên Canvas!`);
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function updateGroupColor(gIdx, color) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp) return;
    grp.trackColor = color;
    renderTimelineLayersListUI();
    renderTimelineTracksUI();
    drawParagraphCanvasFrame();
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function setCanvaViewMode(mode) {
    canvaLayersViewMode = mode;
    try {
        localStorage.setItem('canvaLayersViewMode', mode);
    } catch (e) {}
    renderTimelineLayersListUI();
    showToast(`Chế độ xem: ${mode === 'canva' ? 'Canva (Thu gọn & Bảng chi tiết)' : 'Cổ điển (Mở rộng tất cả)'}`);
}

function onLayerSearchInput(val) {
    canvaLayerSearchQuery = (val || '').trim().toLowerCase();
    renderTimelineLayersListUI();
}

function clearLayerSearch() {
    canvaLayerSearchQuery = '';
    const input = document.getElementById('canva-layer-search-input');
    if (input) input.value = '';
    renderTimelineLayersListUI();
}

function setCanvaZoneTab(zoneKey) {
    canvaSelectedZoneTab = zoneKey;
    renderTimelineLayersListUI();
}

function focusAndScrollToLayer(gIdx) {
    if (gIdx === undefined || gIdx === null || gIdx < 0) return;
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp) return;

    paragraphSelectedGroupIdx = gIdx;

    // Nếu tab phân khu hiện tại đang ẩn lớp này, tự động chuyển về 'all'
    const curPos = getGroupLoopPosition(grp);
    if (canvaSelectedZoneTab !== 'all' && canvaSelectedZoneTab !== curPos) {
        canvaSelectedZoneTab = 'all';
    }

    // Nếu bộ lọc tìm kiếm đang ẩn lớp này, xóa tìm kiếm để hiện lớp
    if (canvaLayerSearchQuery) {
        const matchesName = (grp.name || '').toLowerCase().includes(canvaLayerSearchQuery);
        if (!matchesName) canvaLayerSearchQuery = '';
    }

    renderTimelineLayersListUI();
    scrollLayerIntoView(gIdx);
}
window.focusAndScrollToLayer = focusAndScrollToLayer;

function scrollLayerIntoView(gIdx) {
    setTimeout(() => {
        const el = document.getElementById(`canva-layer-item-${gIdx}`) || document.getElementById(`classic-layer-card-${gIdx}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            el.classList.add('ring-2', 'ring-indigo-400', 'shadow-indigo-500/50');
            setTimeout(() => {
                if (el) el.classList.remove('ring-2', 'ring-indigo-400', 'shadow-indigo-500/50');
            }, 1200);
        }
    }, 60);
}

function toggleCardCollapse(gIdx, event) {
    if (event) event.stopPropagation();
    canvaCollapsedCards[gIdx] = !canvaCollapsedCards[gIdx];
    renderTimelineLayersListUI();
}

function toggleAllCardsCollapse(collapseAll) {
    paragraphGridConfig.groups.forEach((_, idx) => {
        canvaCollapsedCards[idx] = collapseAll;
    });
    renderTimelineLayersListUI();
    showToast(collapseAll ? "Đã thu gọn tất cả thẻ lớp!" : "Đã mở rộng tất cả thẻ lớp!");
}

function toggleActiveLayerAddFieldMenu(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('active-layer-add-field-menu');
    if (menu) menu.classList.toggle('hidden');
}

function addExcelFieldToGroup(gIdx, fieldKey) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp) return;
    paragraphSelectedGroupIdx = gIdx;
    grp.fields.push({ type: "field", key: fieldKey });

    if (!paragraphFieldStyles[fieldKey]) {
        const isImage = fieldKey.toLowerCase().includes('anh') || fieldKey.toLowerCase().includes('dinh_kem');
        if (isImage) {
            paragraphFieldStyles[fieldKey] = { type: 'image', hAlign: 'center', vAlign: 'middle', boxRadius: 20, opacity: 100 };
        } else {
            paragraphFieldStyles[fieldKey] = { 
                type: 'text', font: 'Quicksand', style: 'bold', size: 28, color: '#0f172a', highlightColor: 'transparent', 
                highlightPaddingX: 8, highlightPaddingY: 4, highlightRadius: 6,
                hAlign: 'left', vAlign: 'middle', lineSpacing: 1.25, underline: false,
                indentLeft: 0, indentRight: 0, spaceBefore: 0, spaceAfter: 0,
                boxBgColor: '#fef08a', boxRadius: 18, boxPadding: 12, 
                textWrap: true, shrinkToFit: true 
            };
        }
    }

    paragraphSelectedFieldKey = fieldKey;
    selectedFieldKeysList = [fieldKey];
    renderTimelineLayersListUI();
    renderTimelineTracksUI();
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
    showToast(`Đã thêm {{${fieldKey}}} vào Lớp ${gIdx + 1}!`);
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function renderLayerFieldChipsHtml(grp, gIdx) {
    if (!grp.fields || grp.fields.length === 0) {
        return `<span class="text-slate-500 italic text-[9px] py-0.5">Chưa có thẻ nội dung trong lớp</span>`;
    }

    return grp.fields.map((item, fIdx) => {
        const itemType = item.type || 'field';

        if (itemType === 'tts') {
            const isCustom = item.sourceMode === 'custom';
            const count = (item.ttsSpeakFields || []).length;
            const words = (item.customText || '').trim().split(/\s+/).filter(Boolean).length;
            const labelText = isCustom ? `AI Text (${words} từ)` : `AI Đọc (${count})`;
            const isTtsSel = (typeof selectedTtsTarget !== 'undefined' && selectedTtsTarget && selectedTtsTarget.gIdx === gIdx && selectedTtsTarget.fIdx === fIdx);
            const selClass = isTtsSel ? 'bg-indigo-900 border-2 border-indigo-400 ring-2 ring-indigo-400/50 shadow-md text-white' : 'bg-indigo-950/80 border border-indigo-700/80 hover:border-indigo-500';
            return `
                <div class="flex items-center space-x-1 p-0.5 px-1.5 rounded-md transition cursor-pointer ${selClass}" onclick="event.stopPropagation(); selectTtsItem(${gIdx}, ${fIdx})" title="Nhấp để cấu hình giọng đọc AI">
                    <span class="text-[9px] font-bold text-indigo-200 flex items-center space-x-1 cursor-pointer">
                        <i data-lucide="volume-2" class="w-2.5 h-2.5 text-indigo-400"></i>
                        <span>${labelText}</span>
                    </span>
                    <button onclick="event.stopPropagation(); removeFieldItemFromGroup(${gIdx}, ${fIdx})" class="text-rose-400 hover:text-white text-[10px] font-bold ml-1" title="Xóa thẻ">✕</button>
                </div>
            `;
        } else if (itemType === 'countdown') {
            const sec = item.seconds !== undefined ? item.seconds : 3;
            const pName = item.preset === 'green_to_red' ? 'Xanh➔Đỏ' : (item.preset === 'neon_ring' ? 'Neon' : (item.preset === 'digital_badge' ? 'LED' : (item.preset === 'minimal_pill' ? 'Pill' : (item.preset === 'bomb_pulse' ? 'Bom' : ''))));
            const isCdSel = (typeof selectedCountdownTarget !== 'undefined' && selectedCountdownTarget && selectedCountdownTarget.gIdx === gIdx && selectedCountdownTarget.fIdx === fIdx);
            const selClass = isCdSel ? 'bg-rose-900 border-2 border-rose-400 ring-2 ring-rose-400/50 shadow-md text-white' : 'bg-rose-950/80 border border-rose-700/80 hover:border-rose-500';
            return `
                <div class="flex items-center space-x-1 p-0.5 px-1.5 rounded-md transition cursor-pointer ${selClass}" onclick="event.stopPropagation(); selectCountdownItem(${gIdx}, ${fIdx})" title="Nhấp để cấu hình Đồng Hồ Đếm Ngược">
                    <span class="text-[9px] font-bold text-rose-200 flex items-center space-x-1 cursor-pointer">
                        <i data-lucide="timer" class="w-2.5 h-2.5 text-rose-400"></i>
                        <span>Đếm: ${sec}s${pName ? ` (${pName})` : ''}</span>
                    </span>
                    <button onclick="event.stopPropagation(); removeFieldItemFromGroup(${gIdx}, ${fIdx})" class="text-rose-400 hover:text-white text-[10px] font-bold ml-1" title="Xóa thẻ">✕</button>
                </div>
            `;
        } else if (itemType === 'custom_text') {
            const isCtSel = (typeof selectedCustomTextTarget !== 'undefined' && selectedCustomTextTarget && selectedCustomTextTarget.gIdx === gIdx && selectedCustomTextTarget.fIdx === fIdx);
            const selClass = isCtSel ? 'bg-teal-900 border-2 border-teal-400 ring-2 ring-teal-400/50 shadow-md text-white' : 'bg-teal-950/80 border border-teal-700/80 hover:border-teal-500';
            return `
                <div class="flex items-center space-x-1 p-0.5 px-1.5 rounded-md transition cursor-pointer ${selClass}" onclick="event.stopPropagation(); selectCustomTextItem(${gIdx}, ${fIdx})" title="Nhấp để sửa chữ tự do">
                    <span class="text-[9px] font-bold text-teal-200 flex items-center space-x-1 cursor-pointer">
                        <i data-lucide="type" class="w-2.5 h-2.5 text-teal-400"></i>
                        <span>${(item.text || "Chữ").substring(0, 10)}...</span>
                    </span>
                    <button onclick="event.stopPropagation(); removeFieldItemFromGroup(${gIdx}, ${fIdx})" class="text-rose-400 hover:text-white text-[10px] font-bold ml-1" title="Xóa thẻ">✕</button>
                </div>
            `;
        } else if (itemType === 'progress_tracker') {
            const mode = item.displayMode || 'both';
            const isPtSel = (typeof selectedProgressTrackerTarget !== 'undefined' && selectedProgressTrackerTarget && selectedProgressTrackerTarget.gIdx === gIdx && selectedProgressTrackerTarget.fIdx === fIdx);
            const selClass = isPtSel ? 'bg-emerald-900 border-2 border-emerald-400 ring-2 ring-emerald-400/50 shadow-md text-white' : 'bg-emerald-950/80 border border-emerald-700/80 hover:border-emerald-500';
            return `
                <div class="flex items-center space-x-1 p-0.5 px-1.5 rounded-md transition cursor-pointer ${selClass}" onclick="event.stopPropagation(); selectProgressTrackerItem(${gIdx}, ${fIdx})" title="Nhấp để cấu hình thanh tiến độ">
                    <span class="text-[9px] font-bold text-emerald-200 flex items-center space-x-1 cursor-pointer">
                        <i data-lucide="sliders" class="w-2.5 h-2.5 text-emerald-400"></i>
                        <span>Tiến độ: ${mode === 'bar' ? 'Thanh' : (mode === 'text' ? 'Đếm' : 'Cả hai')}</span>
                    </span>
                    <button onclick="event.stopPropagation(); removeFieldItemFromGroup(${gIdx}, ${fIdx})" class="text-rose-400 hover:text-white text-[10px] font-bold ml-1" title="Xóa thẻ">✕</button>
                </div>
            `;
        } else if (itemType === 'audio_sfx') {
            const sType = item.soundType || 'ding';
            const sLabel = item.customAudioName || (sType === 'ding' ? 'Ting Ting' : (sType === 'tick' ? 'Tích tắc' : (sType === 'whoosh' ? 'Whoosh' : (sType === 'bell' ? 'Chuông Bell' : (sType === 'chime' ? 'Chime' : 'Âm thanh')))));
            const isSfxSel = (typeof selectedAudioSfxTarget !== 'undefined' && selectedAudioSfxTarget && selectedAudioSfxTarget.gIdx === gIdx && selectedAudioSfxTarget.fIdx === fIdx);
            const selClass = isSfxSel ? 'bg-purple-900 border-2 border-purple-400 ring-2 ring-purple-400/50 shadow-md text-white' : 'bg-purple-950/80 border border-purple-700/80 hover:border-purple-500';
            return `
                <div class="flex items-center space-x-1 p-0.5 px-1.5 rounded-md transition cursor-pointer ${selClass}" onclick="event.stopPropagation(); selectAudioSfxItem(${gIdx}, ${fIdx})" title="Nhấp để cấu hình SFX">
                    <span class="text-[9px] font-bold text-purple-200 flex items-center space-x-1 cursor-pointer">
                        <i data-lucide="music" class="w-2.5 h-2.5 text-purple-400"></i>
                        <span>SFX: ${sLabel}</span>
                    </span>
                    <button onclick="event.stopPropagation(); removeFieldItemFromGroup(${gIdx}, ${fIdx})" class="text-rose-400 hover:text-white text-[10px] font-bold ml-1" title="Xóa thẻ">✕</button>
                </div>
            `;
        } else if (itemType === 'video') {
            const isVidSel = (typeof selectedVideoTarget !== 'undefined' && selectedVideoTarget && selectedVideoTarget.gIdx === gIdx && selectedVideoTarget.fIdx === fIdx);
            const selClass = isVidSel ? 'bg-sky-900 border-2 border-sky-400 ring-2 ring-sky-400/50 shadow-md text-white' : 'bg-sky-950/80 border border-sky-700/80 hover:border-sky-500';
            const vLabel = item.sourceMode === 'excel' ? (item.excelColumn ? `Excel: {{${item.excelColumn}}}` : 'Excel Video') : (item.videoFileName || 'Video Clip');
            return `
                <div class="flex items-center space-x-1 p-0.5 px-1.5 rounded-md transition cursor-pointer ${selClass}" onclick="event.stopPropagation(); selectVideoItem(${gIdx}, ${fIdx})" title="Nhấp để cấu hình Video">
                    <span class="text-[9px] font-bold text-sky-200 flex items-center space-x-1 cursor-pointer">
                        <i data-lucide="video" class="w-2.5 h-2.5 text-sky-400"></i>
                        <span class="truncate max-w-[95px]">${vLabel}</span>
                    </span>
                    <button onclick="event.stopPropagation(); removeFieldItemFromGroup(${gIdx}, ${fIdx})" class="text-rose-400 hover:text-white text-[10px] font-bold ml-1" title="Xóa thẻ">✕</button>
                </div>
            `;
        } else {
            const fKey = typeof item === 'string' ? item : item.key;
            const isImg = fKey.toLowerCase().includes('anh') || fKey.toLowerCase().includes('dinh_kem');
            const isFieldSel = selectedFieldKeysList.includes(fKey) && (gIdx === paragraphSelectedGroupIdx) && (!selectedCustomTextTarget && !selectedTtsTarget && !selectedCountdownTarget);
            const bgClass = isFieldSel ? 'bg-amber-500 text-black font-extrabold shadow' : (isImg ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-indigo-950 text-indigo-300 border border-indigo-800');
            const selBorderClass = isFieldSel ? 'border-2 border-amber-400 ring-2 ring-amber-400/50 shadow-md' : 'border-slate-800 hover:border-slate-600';

            return `
                <div class="flex items-center space-x-1 p-0.5 px-1.5 rounded-md transition cursor-pointer bg-slate-900 border ${selBorderClass}" onclick="event.stopPropagation(); selectLayerFieldItem(${gIdx}, '${fKey}', event)" title="Nhấp để định dạng thẻ này">
                    <span class="text-[9px] font-bold flex items-center space-x-1 cursor-pointer transition rounded px-1 ${bgClass}">
                        <span>{{${fKey}}}</span>
                    </span>
                    <button onclick="event.stopPropagation(); removeFieldItemFromGroup(${gIdx}, ${fIdx})" class="text-rose-400 hover:text-white text-[10px] font-bold ml-0.5" title="Xóa thẻ">✕</button>
                </div>
            `;
        }
    }).join('');
}

function renderTimelineLayersListUI() {
    const container = document.getElementById('timeline-layers-list-container');
    if (!container) return;

    if (!paragraphGridConfig.groups || paragraphGridConfig.groups.length === 0) {
        paragraphSelectedGroupIdx = -1;
        container.innerHTML = `
            <div class="p-4 sm:p-5 text-center bg-slate-950/80 rounded-2xl border border-dashed border-slate-700/80 space-y-3 my-2 shadow-inner">
                <div class="w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto text-indigo-400 shadow-md">
                    <i data-lucide="layers" class="w-6 h-6"></i>
                </div>
                <div>
                    <p class="text-xs font-black text-white">Kịch bản trắng chưa có lớp nào</p>
                    <p class="text-[10px] text-slate-400 mt-0.5">Bắt đầu thiết kế bố cục của bạn bằng cách thêm lớp hiển thị hoặc giọng đọc đầu tiên</p>
                </div>
                <div class="pt-1 flex flex-wrap items-center justify-center gap-2">
                    <button onclick="addNewGridGroupRow('inside')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow active:scale-95 transition inline-flex items-center space-x-1.5 cursor-pointer">
                        <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                        <span>+ Thêm Lớp (Drills)</span>
                    </button>
                    <button onclick="addNewGridGroupRow('before')" class="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow active:scale-95 transition inline-flex items-center space-x-1.5 cursor-pointer">
                        <i data-lucide="arrow-left-to-line" class="w-3.5 h-3.5"></i>
                        <span>+ Thêm Intro</span>
                    </button>
                    <button onclick="addNewGridGroupRow('outside')" class="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-extrabold rounded-xl text-xs shadow active:scale-95 transition inline-flex items-center space-x-1.5 cursor-pointer">
                        <i data-lucide="lock" class="w-3.5 h-3.5"></i>
                        <span>+ Thêm Cố Định</span>
                    </button>
                </div>
            </div>
        `;
        const layerBadge = document.getElementById('layer-count-badge');
        if (layerBadge) layerBadge.innerText = `0 Lớp`;
        if (window.lucide && lucide.createIcons) lucide.createIcons();
        return;
    }

    // Đảm bảo paragraphSelectedGroupIdx trong khoảng hợp lệ
    if (paragraphSelectedGroupIdx < 0 || paragraphSelectedGroupIdx >= paragraphGridConfig.groups.length) {
        paragraphSelectedGroupIdx = 0;
    }

    // Đếm số lớp theo phân khu
    let countBefore = 0, countInside = 0, countAfter = 0, countOutside = 0;
    paragraphGridConfig.groups.forEach(g => {
        const p = getGroupLoopPosition(g);
        if (p === 'before') countBefore++;
        else if (p === 'after') countAfter++;
        else if (p === 'outside') countOutside++;
        else countInside++;
    });
    const totalCount = paragraphGridConfig.groups.length;

    const layerBadge = document.getElementById('layer-count-badge');
    if (layerBadge) layerBadge.innerText = `${totalCount} Lớp`;

    // Lọc danh sách theo Tab Phân khu và Search query
    const filteredGroups = [];
    paragraphGridConfig.groups.forEach((grp, gIdx) => {
        const curPos = getGroupLoopPosition(grp);
        if (canvaSelectedZoneTab !== 'all' && curPos !== canvaSelectedZoneTab) {
            return;
        }
        if (canvaLayerSearchQuery) {
            const nameMatch = (grp.name || '').toLowerCase().includes(canvaLayerSearchQuery);
            const posMatch = (curPos || '').includes(canvaLayerSearchQuery);
            const fieldMatch = (grp.fields || []).some(f => {
                const k = (typeof f === 'string' ? f : (f.key || f.type || f.text || '')).toLowerCase();
                return k.includes(canvaLayerSearchQuery);
            });
            if (!nameMatch && !posMatch && !fieldMatch) return;
        }
        filteredGroups.push({ grp, gIdx });
    });

    const colCount = (paragraphGridConfig.gridMatrix && paragraphGridConfig.gridMatrix.columnCount) ? paragraphGridConfig.gridMatrix.columnCount : 2;

    container.innerHTML = '';

    // 1. THANH CÔNG CỤ CANVA: TÌM KIẾM, BỘ LỌC PHÂN KHU & CHUYỂN CHẾ ĐỘ
    const filterHeaderDiv = document.createElement('div');
    filterHeaderDiv.className = 'space-y-2 bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 shadow';

    // Ô tìm kiếm + nút chuyển chế độ
    filterHeaderDiv.innerHTML = `
        <div class="flex items-center gap-1.5">
            <div class="relative flex-1">
                <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none"></i>
                <input id="canva-layer-search-input" type="text" value="${canvaLayerSearchQuery}" placeholder="Tìm tên lớp, thẻ Excel, TTS..." oninput="onLayerSearchInput(this.value)" class="w-full bg-slate-900 border border-slate-700/80 focus:border-indigo-500 rounded-lg pl-7 pr-6 py-1 text-[11px] text-slate-200 placeholder-slate-500 font-medium outline-none transition">
                ${canvaLayerSearchQuery ? `<button onclick="clearLayerSearch()" class="absolute right-2 top-1.5 text-slate-400 hover:text-white text-xs" title="Xóa tìm kiếm">✕</button>` : ''}
            </div>
            <div class="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 shrink-0">
                <button onclick="setCanvaViewMode('canva')" class="px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center space-x-1 ${canvaLayersViewMode === 'canva' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}" title="Chế độ Canva: Danh sách thu gọn + Bảng chi tiết bên dưới">
                    <i data-lucide="layout-list" class="w-3 h-3"></i>
                    <span>Canva</span>
                </button>
                <button onclick="setCanvaViewMode('classic')" class="px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center space-x-1 ${canvaLayersViewMode === 'classic' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}" title="Chế độ Cổ điển: Mở rộng tất cả các thẻ lớp">
                    <i data-lucide="layout-grid" class="w-3 h-3"></i>
                    <span>Mở rộng</span>
                </button>
            </div>
        </div>

        <div class="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5 text-[9px] font-bold">
            <button onclick="setCanvaZoneTab('all')" class="px-2 py-1 rounded-md transition shrink-0 ${canvaSelectedZoneTab === 'all' ? 'bg-slate-200 text-slate-900 shadow' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}">
                Tất cả (${totalCount})
            </button>
            <button onclick="setCanvaZoneTab('before')" class="px-2 py-1 rounded-md transition shrink-0 ${canvaSelectedZoneTab === 'before' ? 'bg-blue-600 text-white shadow' : 'bg-blue-950/60 text-blue-300 hover:text-white border border-blue-900/60'}">
                Khu 1: Intro (${countBefore})
            </button>
            <button onclick="setCanvaZoneTab('inside')" class="px-2 py-1 rounded-md transition shrink-0 ${canvaSelectedZoneTab === 'inside' ? 'bg-teal-600 text-white shadow' : 'bg-teal-950/60 text-teal-300 hover:text-white border border-teal-900/60'}">
                Khu 2: Drills (${countInside})
            </button>
            <button onclick="setCanvaZoneTab('after')" class="px-2 py-1 rounded-md transition shrink-0 ${canvaSelectedZoneTab === 'after' ? 'bg-purple-600 text-white shadow' : 'bg-purple-950/60 text-purple-300 hover:text-white border border-purple-900/60'}">
                Khu 3: Outro (${countAfter})
            </button>
            <button onclick="setCanvaZoneTab('outside')" class="px-2 py-1 rounded-md transition shrink-0 ${canvaSelectedZoneTab === 'outside' ? 'bg-amber-600 text-white shadow' : 'bg-amber-950/60 text-amber-300 hover:text-white border border-amber-900/60'}">
                Cố định (${countOutside})
            </button>
        </div>
    `;
    container.appendChild(filterHeaderDiv);

    // 2. CHẾ ĐỘ CANVA (DANH SÁCH THU GỌN 36PX + BẢNG CHI TIẾT ĐANG CHỌN)
    if (canvaLayersViewMode === 'canva') {
        const canvaContainer = document.createElement('div');
        canvaContainer.className = 'space-y-3';

        // Master List Wrapper
        const masterListWrapper = document.createElement('div');
        masterListWrapper.className = 'space-y-1.5';

        const masterHeader = document.createElement('div');
        masterHeader.className = 'flex items-center justify-between text-[10px] font-bold text-slate-400 px-1';
        masterHeader.innerHTML = `
            <span class="flex items-center space-x-1">
                <i data-lucide="layers" class="w-3 h-3 text-indigo-400"></i>
                <span>Danh Sách Lớp (Hiển thị ${filteredGroups.length}/${totalCount})</span>
            </span>
            <span class="text-[9px] text-slate-500 italic">Nhấp lớp để chỉnh sửa</span>
        `;
        masterListWrapper.appendChild(masterHeader);

        const listScrollBox = document.createElement('div');
        listScrollBox.id = 'canva-master-layers-list';
        listScrollBox.className = 'max-h-[220px] overflow-y-auto pr-0.5 space-y-1 rounded-xl p-1 bg-slate-950/60 border border-slate-800/80';

        if (filteredGroups.length === 0) {
            listScrollBox.innerHTML = `
                <div class="p-4 text-center text-slate-500 text-xs space-y-2">
                    <p>Không có lớp nào phù hợp với bộ lọc!</p>
                    <button onclick="clearLayerSearch(); setCanvaZoneTab('all');" class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold">
                        Xem tất cả lớp
                    </button>
                </div>
            `;
        } else {
            filteredGroups.forEach(({ grp, gIdx }) => {
                const isSel = (gIdx === paragraphSelectedGroupIdx);
                const curPos = getGroupLoopPosition(grp);
                const meta = getGroupPrimaryMeta(grp);
                const isHidden = (grp.visible === false);

                const itemDiv = document.createElement('div');
                itemDiv.id = `canva-layer-item-${gIdx}`;
                itemDiv.className = `group flex items-center justify-between px-2 py-1.5 rounded-lg border transition cursor-pointer text-xs select-none ${isSel ? 'bg-indigo-950/70 border-indigo-500 ring-1 ring-indigo-500/50 shadow-md text-white' : (isHidden ? 'bg-slate-950/40 border-slate-800/50 opacity-60 text-slate-500 hover:border-slate-700' : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-white')}`;
                itemDiv.onclick = () => selectGridGroup(gIdx);

                // Badges
                let zoneBadgeClass = 'bg-teal-950 text-teal-300 border-teal-800';
                let zoneLabel = 'Drills';
                if (curPos === 'before') { zoneBadgeClass = 'bg-blue-950 text-blue-300 border-blue-800'; zoneLabel = 'Intro'; }
                else if (curPos === 'after') { zoneBadgeClass = 'bg-purple-950 text-purple-300 border-purple-800'; zoneLabel = 'Outro'; }
                else if (curPos === 'outside') { zoneBadgeClass = 'bg-amber-950 text-amber-300 border-amber-800'; zoneLabel = 'Cố định'; }

                const colLabel = grp.colSpan === 'all' ? 'Tràn' : (grp.colSpan > 1 ? `Gộp ${grp.colSpan}c` : `C${grp.targetColumn || 1}`);

                itemDiv.innerHTML = `
                    <div class="flex items-center space-x-2 min-w-0 flex-1 mr-1">
                        <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style="background-color: ${grp.trackColor || '#3b82f6'};"></span>
                        <div class="flex items-center space-x-1.5 min-w-0">
                            <i data-lucide="${meta.icon}" class="w-3.5 h-3.5 ${meta.colorClass} shrink-0"></i>
                            <span class="font-bold truncate text-[11px] ${isSel ? 'text-white' : 'text-slate-200'}">${grp.name || `Lớp ${gIdx + 1}`}</span>
                        </div>
                        <span class="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0" title="Cấp bậc tầng: Tầng ${gIdx + 1}/${paragraphGridConfig.groups.length} ${gIdx === paragraphGridConfig.groups.length - 1 ? '(Trên cùng)' : (gIdx === 0 ? '(Dưới cùng)' : '')}">T${gIdx + 1}</span>
                        <span class="text-[8px] font-bold px-1 py-0.2 rounded border ${zoneBadgeClass} shrink-0 hidden sm:inline-block">${zoneLabel}</span>
                        <span class="text-[8px] font-mono px-1 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-400 shrink-0">${colLabel}</span>
                    </div>

                    <div class="flex items-center space-x-0.5 shrink-0" onclick="event.stopPropagation()">
                        <button onclick="toggleGroupVisibility(${gIdx}, event)" class="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition" title="${isHidden ? 'Bật hiện lớp trên Canvas' : 'Tạm ẩn lớp trên Canvas'}">
                            <i data-lucide="${isHidden ? 'eye-off' : 'eye'}" class="w-3.5 h-3.5 ${isHidden ? 'text-rose-400' : 'text-slate-400'}"></i>
                        </button>
                        <button onclick="moveLayerLevel(${gIdx}, 'top')" ${gIdx === paragraphGridConfig.groups.length - 1 ? 'disabled' : ''} class="p-0.5 rounded hover:bg-indigo-600 disabled:opacity-20 text-slate-400 hover:text-white transition" title="Lên trên cùng (Bring to Front)">
                            <span class="text-[9px]">⏫</span>
                        </button>
                        <button onclick="moveLayerLevel(${gIdx}, 'up')" ${gIdx === paragraphGridConfig.groups.length - 1 ? 'disabled' : ''} class="p-0.5 rounded hover:bg-teal-600 disabled:opacity-20 text-slate-400 hover:text-white transition" title="Lên 1 tầng (Bring Forward)">
                            <span class="text-[9px]">🔼</span>
                        </button>
                        <button onclick="moveLayerLevel(${gIdx}, 'down')" ${gIdx === 0 ? 'disabled' : ''} class="p-0.5 rounded hover:bg-amber-600 disabled:opacity-20 text-slate-400 hover:text-white transition" title="Xuống 1 tầng (Send Backward)">
                            <span class="text-[9px]">🔽</span>
                        </button>
                        <button onclick="moveLayerLevel(${gIdx}, 'bottom')" ${gIdx === 0 ? 'disabled' : ''} class="p-0.5 rounded hover:bg-rose-600 disabled:opacity-20 text-slate-400 hover:text-white transition" title="Xuống dưới cùng (Send to Back)">
                            <span class="text-[9px]">⏬</span>
                        </button>
                        <button onclick="duplicateTimelineGroup(${gIdx})" class="p-1 rounded hover:bg-slate-800 text-sky-400 hover:text-sky-300" title="Nhân bản lớp">
                            <i data-lucide="copy" class="w-3 h-3"></i>
                        </button>
                        <button onclick="deleteGridGroup(${gIdx})" class="p-1 rounded hover:bg-slate-800 text-rose-400 hover:text-rose-300" title="Xóa lớp">
                            <i data-lucide="trash-2" class="w-3 h-3"></i>
                        </button>
                    </div>
                `;
                listScrollBox.appendChild(itemDiv);
            });
        }
        masterListWrapper.appendChild(listScrollBox);
        canvaContainer.appendChild(masterListWrapper);

        // Active Layer Detail Inspector (Contextual Panel)
        const activeGrp = paragraphGridConfig.groups[paragraphSelectedGroupIdx];
        if (activeGrp) {
            const gIdx = paragraphSelectedGroupIdx;
            const curPos = getGroupLoopPosition(activeGrp);
            const curOffset = activeGrp.startRowOffset !== undefined ? activeGrp.startRowOffset : 0;

            let colOptionsHtml = '';
            for (let c = 1; c <= colCount; c++) {
                const sel = (activeGrp.targetColumn === c) ? 'selected' : '';
                colOptionsHtml += `<option value="${c}" ${sel}>Cột ${c}</option>`;
            }

            const maxSpan = Math.max(1, colCount - (activeGrp.targetColumn || 1) + 1);
            const curSpan = Math.max(1, Math.min(activeGrp.colSpan || 1, colCount));
            let spanOptionsHtml = `<option value="1" ${curSpan === 1 ? 'selected' : ''}>1 Cột</option>`;
            for (let s = 2; s <= maxSpan; s++) {
                spanOptionsHtml += `<option value="${s}" ${curSpan === s ? 'selected' : ''}>Gộp ${s} cột</option>`;
            }
            if (colCount > 1) {
                spanOptionsHtml += `<option value="all" ${activeGrp.colSpan === 'all' ? 'selected' : ''}>Tràn tất cả cột</option>`;
            }

            const fieldsChipsHtml = renderLayerFieldChipsHtml(activeGrp, gIdx);

            const detailInspectorDiv = document.createElement('div');
            detailInspectorDiv.className = 'p-3 bg-slate-950 rounded-2xl border-2 border-indigo-500 shadow-xl space-y-2.5 text-xs';

            detailInspectorDiv.innerHTML = `
                <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div class="flex items-center space-x-2 flex-1 min-w-0 mr-2">
                        <div class="relative group shrink-0">
                            <span class="w-4 h-4 rounded-full block cursor-pointer border border-white/40 shadow-sm" style="background-color: ${activeGrp.trackColor || '#3b82f6'};" title="Đổi màu vạch đường ray lớp này"></span>
                            <input type="color" value="${activeGrp.trackColor || '#3b82f6'}" onchange="updateGroupColor(${gIdx}, this.value)" class="absolute inset-0 opacity-0 cursor-pointer w-4 h-4">
                        </div>
                        <input type="text" value="${activeGrp.name || `Lớp ${gIdx + 1}`}" onchange="updateGroupName(${gIdx}, this.value)" class="bg-slate-900 border border-slate-700/80 focus:border-indigo-500 rounded-lg px-2 py-0.5 font-black text-slate-100 text-xs focus:ring-0 w-full" title="Sửa tên lớp">
                    </div>
                    <div class="flex items-center space-x-1 shrink-0">
                        <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">Lớp #${gIdx + 1}</span>
                    </div>
                </div>

                <!-- CỤM ĐIỀU HƯỚNG TẦNG NHANH 1-CHẠM & HUY HIỆU LEVEL (V16.9) -->
                <div class="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-slate-900/90 rounded-xl border border-indigo-500/40 text-[9.5px]">
                    <div class="flex items-center space-x-1.5 min-w-0">
                        <span class="text-indigo-300 font-bold shrink-0 flex items-center space-x-1">
                            <i data-lucide="layers" class="w-3.5 h-3.5 text-indigo-400"></i>
                            <span>Cấp Bậc Tầng:</span>
                        </span>
                        <span class="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-[9px] font-black text-amber-300 font-mono shrink-0">
                            Tầng ${gIdx + 1} / ${paragraphGridConfig.groups.length} ${gIdx === paragraphGridConfig.groups.length - 1 ? '• Trên Cùng' : (gIdx === 0 ? '• Dưới Cùng' : '')}
                        </span>
                    </div>
                    <div class="flex items-center space-x-1 shrink-0">
                        <button onclick="moveLayerLevel(${gIdx}, 'top')" ${gIdx === paragraphGridConfig.groups.length - 1 ? 'disabled' : ''} title="Đưa lớp này lên trên cùng mọi lớp khác" class="px-2 py-1 bg-slate-800 hover:bg-indigo-600 disabled:opacity-30 text-slate-200 hover:text-white rounded-md text-[9px] font-black transition active:scale-95 cursor-pointer shadow-sm">
                            <span>⏫ Trên cùng</span>
                        </button>
                        <button onclick="moveLayerLevel(${gIdx}, 'up')" ${gIdx === paragraphGridConfig.groups.length - 1 ? 'disabled' : ''} title="Đưa lớp này lên 1 tầng" class="px-2 py-1 bg-slate-800 hover:bg-teal-600 disabled:opacity-30 text-slate-200 hover:text-white rounded-md text-[9px] font-black transition active:scale-95 cursor-pointer shadow-sm">
                            <span>🔼 Lên 1</span>
                        </button>
                        <button onclick="moveLayerLevel(${gIdx}, 'down')" ${gIdx === 0 ? 'disabled' : ''} title="Đưa lớp này xuống 1 tầng" class="px-2 py-1 bg-slate-800 hover:bg-amber-600 disabled:opacity-30 text-slate-200 hover:text-white rounded-md text-[9px] font-black transition active:scale-95 cursor-pointer shadow-sm">
                            <span>🔽 Xuống 1</span>
                        </button>
                        <button onclick="moveLayerLevel(${gIdx}, 'bottom')" ${gIdx === 0 ? 'disabled' : ''} title="Đưa lớp này xuống dưới cùng mọi lớp khác" class="px-2 py-1 bg-slate-800 hover:bg-rose-600 disabled:opacity-30 text-slate-200 hover:text-white rounded-md text-[9px] font-black transition active:scale-95 cursor-pointer shadow-sm">
                            <span>⏬ Dưới cùng</span>
                        </button>
                    </div>
                </div>

                <!-- Cột Grid & Gộp & Dòng Offset -->
                <div class="grid grid-cols-3 gap-1.5 text-[9px] bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <div>
                        <label class="text-indigo-400 block font-bold mb-0.5">Cột Lưới:</label>
                        <select onchange="updateGroupTargetColumn(${gIdx}, parseInt(this.value))" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-1 font-bold text-slate-200">
                            ${colOptionsHtml}
                        </select>
                    </div>
                    <div>
                        <label class="text-cyan-400 block font-bold mb-0.5" title="Gộp số cột kế tiếp trên lưới">Gộp cột:</label>
                        <select onchange="updateGroupColSpan(${gIdx}, this.value)" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-1 font-bold text-cyan-200">
                            ${spanOptionsHtml}
                        </select>
                    </div>
                    <div>
                        <label class="text-emerald-400 block font-bold mb-0.5">Dòng (Offset):</label>
                        <div class="flex items-center space-x-0.5 bg-slate-950 border border-slate-700 rounded-lg p-0.5">
                            <button onclick="adjustGroupRowOffset(${gIdx}, -1)" class="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black rounded">-</button>
                            <input type="number" value="${curOffset}" onchange="updateGroupRowOffset(${gIdx}, parseInt(this.value))" class="w-full bg-transparent text-center font-bold text-amber-300 border-0 p-0 text-[10px] focus:ring-0">
                            <button onclick="adjustGroupRowOffset(${gIdx}, 1)" class="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black rounded">+</button>
                        </div>
                    </div>
                </div>

                <!-- Phân khu xuất hiện & Trình chiếu riêng -->
                <div class="grid grid-cols-2 gap-1.5 text-[9px] bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <div>
                        <label class="text-slate-400 block font-bold mb-0.5">Phân khu:</label>
                        <select onchange="cycleGroupLoopMode(${gIdx})" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-1 font-bold text-slate-200 cursor-pointer">
                            <option value="before" ${curPos === 'before' ? 'selected' : ''}>Khu 1: Intro (Trước lặp)</option>
                            <option value="inside" ${curPos === 'inside' ? 'selected' : ''}>Khu 2: Drills (Trong lặp)</option>
                            <option value="after" ${curPos === 'after' ? 'selected' : ''}>Khu 3: Outro (Sau lặp)</option>
                            <option value="outside" ${curPos === 'outside' ? 'selected' : ''}>Cố định toàn video</option>
                        </select>
                    </div>
                    <div>
                        <label class="text-amber-400 block font-bold mb-0.5">Trình chiếu riêng:</label>
                        <select onchange="updateGroupPresentationMode(${gIdx}, this.value)" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-1 font-bold text-amber-200 text-[9px]">
                            <option value="default" ${(activeGrp.presentationMode === 'default' || !activeGrp.presentationMode) ? 'selected' : ''}>Theo kịch bản chung</option>
                            <option value="single" ${activeGrp.presentationMode === 'single' ? 'selected' : ''}>1 Câu / Làm mới</option>
                            <option value="stack" ${activeGrp.presentationMode === 'stack' ? 'selected' : ''}>Xếp tầng nối tiếp</option>
                            <option value="all" ${activeGrp.presentationMode === 'all' ? 'selected' : ''}>Hiện tất cả dòng</option>
                        </select>
                    </div>
                </div>

                <!-- Checkbox tùy chọn Auto-Fit và Ghim Đuôi -->
                <div class="space-y-1 bg-slate-900/80 px-2 py-1.5 rounded-xl border border-slate-800 text-[9px]">
                    <label class="flex items-center space-x-1.5 cursor-pointer select-none text-slate-300 hover:text-white">
                        <input type="checkbox" ${activeGrp.autoFitOverflow !== false ? 'checked' : ''} onchange="toggleGroupAutoFitOverflow(${gIdx}, this.checked)" class="w-3.5 h-3.5 rounded border-slate-700 text-teal-500 focus:ring-0 bg-slate-950 cursor-pointer">
                        <span class="font-bold leading-tight ${activeGrp.autoFitOverflow !== false ? 'text-teal-300' : 'text-slate-400'}">Tự co giãn vừa vặn khi chữ quá dài tràn mép dưới (Auto-Fit)</span>
                    </label>
                    <label class="flex items-center space-x-1.5 cursor-pointer select-none text-slate-300 hover:text-white">
                        <input type="checkbox" ${activeGrp.snapEndToTotalDuration ? 'checked' : ''} onchange="toggleGroupSnapEndToTotalDuration(${gIdx}, this.checked)" class="w-3.5 h-3.5 rounded border-slate-700 text-indigo-500 focus:ring-0 bg-slate-950 cursor-pointer">
                        <span class="font-bold leading-tight ${activeGrp.snapEndToTotalDuration ? 'text-amber-300' : 'text-slate-400'}">Thời điểm cuối của khối trùng với cuối tổng thời lượng</span>
                    </label>
                </div>

                <!-- Danh sách Thẻ Nội Dung trong Lớp -->
                <div class="space-y-1.5 pt-1">
                    <div class="flex items-center justify-between text-[10px] font-bold text-slate-300">
                        <span class="flex items-center space-x-1">
                            <i data-lucide="tag" class="w-3 h-3 text-indigo-400"></i>
                            <span>Thẻ Trong Lớp (${activeGrp.fields ? activeGrp.fields.length : 0}):</span>
                        </span>
                        <div class="relative inline-block">
                            <button onclick="toggleActiveLayerAddFieldMenu(event)" class="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[9px] font-bold flex items-center space-x-1 transition shadow">
                                <i data-lucide="plus" class="w-2.5 h-2.5"></i>
                                <span>+ Thêm Thẻ</span>
                            </button>
                            <div id="active-layer-add-field-menu" class="hidden absolute right-0 bottom-full mb-1 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 p-1.5 space-y-1 text-left backdrop-blur-md">
                                <div class="text-[9px] font-bold text-slate-400 px-2 py-0.5 uppercase tracking-wider">Chọn Loại Thẻ Cần Thêm</div>
                                <button onclick="toggleActiveLayerAddFieldMenu(); addSpecialObjectComponent('tts_voice');" class="w-full text-left p-1.5 rounded-lg hover:bg-purple-950 text-purple-300 text-[10px] font-bold flex items-center space-x-2">
                                    <i data-lucide="volume-2" class="w-3 h-3 text-purple-400"></i>
                                    <span>+ Giọng Đọc AI (TTS)</span>
                                </button>
                                <button onclick="toggleActiveLayerAddFieldMenu(); addSpecialObjectComponent('countdown_timer');" class="w-full text-left p-1.5 rounded-lg hover:bg-rose-950 text-rose-300 text-[10px] font-bold flex items-center space-x-2">
                                    <i data-lucide="timer" class="w-3 h-3 text-rose-400"></i>
                                    <span>+ Đồng Hồ Đếm Ngược</span>
                                </button>
                                <button onclick="toggleActiveLayerAddFieldMenu(); addSpecialObjectComponent('custom_text');" class="w-full text-left p-1.5 rounded-lg hover:bg-teal-950 text-teal-300 text-[10px] font-bold flex items-center space-x-2">
                                    <i data-lucide="type" class="w-3 h-3 text-teal-400"></i>
                                    <span>+ Thẻ Chữ Tự Do</span>
                                </button>
                                <button onclick="toggleActiveLayerAddFieldMenu(); addSpecialObjectComponent('progress_tracker');" class="w-full text-left p-1.5 rounded-lg hover:bg-emerald-950 text-emerald-300 text-[10px] font-bold flex items-center space-x-2">
                                    <i data-lucide="sliders" class="w-3 h-3 text-emerald-400"></i>
                                    <span>+ Thẻ Tiến Độ (Progress Bar)</span>
                                </button>
                                <button onclick="toggleActiveLayerAddFieldMenu(); addSpecialObjectComponent('audio_sfx');" class="w-full text-left p-1.5 rounded-lg hover:bg-fuchsia-950 text-fuchsia-300 text-[10px] font-bold flex items-center space-x-2">
                                    <i data-lucide="music" class="w-3 h-3 text-fuchsia-400"></i>
                                    <span>+ Hiệu Ứng Âm Thanh SFX</span>
                                </button>
                                <button onclick="toggleActiveLayerAddFieldMenu(); addSpecialObjectComponent('video');" class="w-full text-left p-1.5 rounded-lg hover:bg-sky-950 text-sky-300 text-[10px] font-bold flex items-center space-x-2">
                                    <i data-lucide="video" class="w-3 h-3 text-sky-400"></i>
                                    <span>+ Thẻ Video (Clip & Nền)</span>
                                </button>
                                ${typeof excelColumnsList !== 'undefined' && excelColumnsList.length > 0 ? `
                                    <div class="border-t border-slate-800 pt-1 mt-1 text-[9px] font-bold text-slate-400 px-2 uppercase tracking-wider">Cột Dữ Liệu Excel</div>
                                    <div class="max-h-28 overflow-y-auto space-y-0.5 pr-1">
                                        ${excelColumnsList.map(colKey => `
                                            <button onclick="toggleActiveLayerAddFieldMenu(); addExcelFieldToGroup(${gIdx}, '${colKey}');" class="w-full text-left px-2 py-1 rounded hover:bg-indigo-950 text-indigo-300 text-[10px] font-medium flex items-center space-x-1.5 truncate">
                                                <i data-lucide="file-spreadsheet" class="w-2.5 h-2.5 text-indigo-400 shrink-0"></i>
                                                <span class="truncate">{{${colKey}}}</span>
                                            </button>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-1 p-2 bg-slate-900/60 rounded-xl border border-slate-800 min-h-[42px] items-center">${fieldsChipsHtml}</div>
                </div>
            `;
            canvaContainer.appendChild(detailInspectorDiv);
        }

        container.appendChild(canvaContainer);

    } else {
        // 3. CHẾ ĐỘ CỔ ĐIỂN (MỞ RỘNG TẤT CẢ CÁC CARD KÈM NÚT THU GỌN ACCORDION)
        const classicContainer = document.createElement('div');
        classicContainer.className = 'space-y-2';

        const classicControls = document.createElement('div');
        classicControls.className = 'flex items-center justify-between text-[10px] font-bold text-slate-400 px-1';
        classicControls.innerHTML = `
            <span>Danh sách lớp mở rộng (${filteredGroups.length}/${totalCount})</span>
            <div class="flex items-center space-x-1">
                <button onclick="toggleAllCardsCollapse(true)" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[9px]">Thu gọn hết</button>
                <button onclick="toggleAllCardsCollapse(false)" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[9px]">Mở rộng hết</button>
            </div>
        `;
        classicContainer.appendChild(classicControls);

        if (filteredGroups.length === 0) {
            classicContainer.innerHTML += `
                <div class="p-4 text-center text-slate-500 text-xs bg-slate-950/60 rounded-xl border border-slate-800">
                    Không có lớp nào phù hợp với bộ lọc!
                </div>
            `;
        } else {
            filteredGroups.forEach(({ grp, gIdx }) => {
                const isSel = (gIdx === paragraphSelectedGroupIdx);
                const isAudio = typeof isAudioLayer === 'function' ? isAudioLayer(grp) : false;
                const curPos = getGroupLoopPosition(grp);
                const isCollapsed = !!canvaCollapsedCards[gIdx];
                const isHidden = (grp.visible === false);

                let zoneBannerHtml = '';
                if (curPos === 'before') {
                    zoneBannerHtml = `<div class="flex items-center justify-between text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-700/50 mb-1"><span class="flex items-center space-x-1"><i data-lucide="arrow-left-to-line" class="w-2.5 h-2.5 text-blue-400"></i><span>PHÂN KHU 1: TRƯỚC VÒNG LẶP (INTRO)</span></span><span class="text-blue-400/80">Mở đầu</span></div>`;
                } else if (curPos === 'after') {
                    zoneBannerHtml = `<div class="flex items-center justify-between text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-700/50 mb-1"><span class="flex items-center space-x-1"><i data-lucide="arrow-right-to-line" class="w-2.5 h-2.5 text-purple-400"></i><span>PHÂN KHU 3: SAU VÒNG LẶP (OUTRO)</span></span><span class="text-purple-400/80">Kết bài</span></div>`;
                } else if (curPos === 'outside') {
                    zoneBannerHtml = `<div class="flex items-center justify-between text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/50 mb-1"><span class="flex items-center space-x-1"><i data-lucide="pin" class="w-2.5 h-2.5 text-amber-400"></i><span>CỐ ĐỊNH TOÀN BỘ VIDEO (XUYÊN SUỐT)</span></span><span class="text-amber-400/80">Global</span></div>`;
                } else {
                    zoneBannerHtml = `<div class="flex items-center justify-between text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-teal-950/80 text-teal-300 border border-teal-700/50 mb-1"><span class="flex items-center space-x-1"><i data-lucide="repeat" class="w-2.5 h-2.5 text-teal-400"></i><span>PHÂN KHU 2: TRONG VÒNG LẶP CHÍNH (DRILLS)</span></span><span class="text-teal-400/80">Theo từng câu</span></div>`;
                }

                const blockDiv = document.createElement('div');
                blockDiv.id = `classic-layer-card-${gIdx}`;
                blockDiv.className = `p-2.5 rounded-xl border transition cursor-pointer space-y-1.5 ${isSel ? 'bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/30' : (isHidden ? 'bg-slate-950/50 border-slate-800 opacity-60' : 'bg-slate-950/80 border-slate-800 hover:border-slate-700')}`;
                blockDiv.onclick = () => selectGridGroup(gIdx);

                let colOptionsHtml = '';
                for (let c = 1; c <= colCount; c++) {
                    const sel = (grp.targetColumn === c) ? 'selected' : '';
                    colOptionsHtml += `<option value="${c}" ${sel}>Cột ${c}</option>`;
                }

                const maxSpan = Math.max(1, colCount - (grp.targetColumn || 1) + 1);
                const curSpan = Math.max(1, Math.min(grp.colSpan || 1, colCount));
                let spanOptionsHtml = `<option value="1" ${curSpan === 1 ? 'selected' : ''}>1 Cột</option>`;
                for (let s = 2; s <= maxSpan; s++) {
                    spanOptionsHtml += `<option value="${s}" ${curSpan === s ? 'selected' : ''}>Gộp ${s} cột</option>`;
                }
                if (colCount > 1) {
                    spanOptionsHtml += `<option value="all" ${grp.colSpan === 'all' ? 'selected' : ''}>Tràn tất cả cột</option>`;
                }

                const fieldsChipsHtml = renderLayerFieldChipsHtml(grp, gIdx);
                const curOffset = grp.startRowOffset !== undefined ? grp.startRowOffset : 0;
                const audioBadge = isAudio ? `<span class="bg-purple-950 text-purple-300 border border-purple-800 text-[8px] font-bold px-1 rounded flex items-center space-x-0.5"><i data-lucide="lock" class="w-2 h-2"></i><span>AI Khóa</span></span>` : `<span class="bg-slate-800 text-slate-400 text-[8px] px-1 rounded">Tĩnh</span>`;

                blockDiv.innerHTML = `
                    ${zoneBannerHtml}
                    <div class="flex items-center justify-between gap-1 border-b border-slate-800/80 pb-1">
                        <div class="flex items-center space-x-1.5 truncate">
                            <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${grp.trackColor || '#3b82f6'};"></span>
                            <span class="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0" title="Cấp bậc tầng: Tầng ${gIdx + 1}/${paragraphGridConfig.groups.length} ${gIdx === paragraphGridConfig.groups.length - 1 ? '(Trên cùng)' : (gIdx === 0 ? '(Dưới cùng)' : '')}">T${gIdx + 1}</span>
                            <input type="text" value="${grp.name || `Lớp ${gIdx + 1}`}" onchange="event.stopPropagation(); updateGroupName(${gIdx}, this.value)" class="bg-transparent border-0 font-bold text-slate-200 text-xs focus:ring-0 truncate w-24">
                            ${audioBadge}
                        </div>
                        
                        <div class="flex items-center space-x-0.5 shrink-0" onclick="event.stopPropagation()">
                            <button onclick="toggleGroupVisibility(${gIdx}, event)" class="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white" title="${isHidden ? 'Bật hiện lớp' : 'Ẩn lớp'}">
                                <i data-lucide="${isHidden ? 'eye-off' : 'eye'}" class="w-3 h-3 ${isHidden ? 'text-rose-400' : 'text-slate-400'}"></i>
                            </button>
                            <button onclick="event.stopPropagation(); moveLayerLevel(${gIdx}, 'top')" ${gIdx === paragraphGridConfig.groups.length - 1 ? 'disabled' : ''} title="Lên trên cùng" class="p-0.5 hover:bg-indigo-600 disabled:opacity-20 rounded text-slate-300"><span class="text-[9px]">⏫</span></button>
                            <button onclick="event.stopPropagation(); moveLayerLevel(${gIdx}, 'up')" ${gIdx === paragraphGridConfig.groups.length - 1 ? 'disabled' : ''} title="Lên 1 tầng" class="p-0.5 hover:bg-teal-600 disabled:opacity-20 rounded text-slate-300"><span class="text-[9px]">🔼</span></button>
                            <button onclick="event.stopPropagation(); moveLayerLevel(${gIdx}, 'down')" ${gIdx === 0 ? 'disabled' : ''} title="Xuống 1 tầng" class="p-0.5 hover:bg-amber-600 disabled:opacity-20 rounded text-slate-300"><span class="text-[9px]">🔽</span></button>
                            <button onclick="event.stopPropagation(); moveLayerLevel(${gIdx}, 'bottom')" ${gIdx === 0 ? 'disabled' : ''} title="Xuống dưới cùng" class="p-0.5 hover:bg-rose-600 disabled:opacity-20 rounded text-slate-300"><span class="text-[9px]">⏬</span></button>
                            <button onclick="duplicateTimelineGroup(${gIdx})" title="Nhân bản" class="p-0.5 hover:bg-slate-800 rounded text-sky-400"><i data-lucide="copy" class="w-3 h-3"></i></button>
                            <button onclick="deleteGridGroup(${gIdx})" class="p-0.5 hover:bg-slate-800 rounded text-rose-400" title="Xóa"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
                            <button onclick="toggleCardCollapse(${gIdx}, event)" class="p-0.5 hover:bg-slate-800 rounded text-slate-400" title="${isCollapsed ? 'Mở rộng thẻ' : 'Thu gọn thẻ'}">
                                <i data-lucide="${isCollapsed ? 'chevron-right' : 'chevron-down'}" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                    </div>

                    ${!isCollapsed ? `
                        <div class="grid grid-cols-3 gap-1 text-[9px] bg-slate-950 p-1.5 rounded-lg border border-slate-800/80">
                            <div>
                                <label class="text-indigo-400 block font-bold">Cột Grid:</label>
                                <select onchange="updateGroupTargetColumn(${gIdx}, parseInt(this.value))" class="w-full bg-slate-900 border border-slate-700 rounded p-0.5 font-bold text-slate-200">
                                    ${colOptionsHtml}
                                </select>
                            </div>
                            <div>
                                <label class="text-cyan-400 block font-bold" title="Gộp số cột kế tiếp trên lưới">Gộp cột:</label>
                                <select onchange="updateGroupColSpan(${gIdx}, this.value)" class="w-full bg-slate-900 border border-slate-700 rounded p-0.5 font-bold text-cyan-200" title="Gộp cột trải dài">
                                    ${spanOptionsHtml}
                                </select>
                            </div>
                            <div>
                                <label class="text-emerald-400 block font-bold">Dòng (Offset):</label>
                                <div class="flex items-center space-x-0.5 bg-slate-900 border border-slate-700 rounded p-0.5">
                                    <button onclick="event.stopPropagation(); adjustGroupRowOffset(${gIdx}, -1)" class="px-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black rounded">-</button>
                                    <input type="number" value="${curOffset}" onchange="updateGroupRowOffset(${gIdx}, parseInt(this.value))" class="w-full bg-transparent text-center font-bold text-amber-300 border-0 p-0 text-[10px] focus:ring-0">
                                    <button onclick="event.stopPropagation(); adjustGroupRowOffset(${gIdx}, 1)" class="px-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black rounded">+</button>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-1 text-[9px] bg-slate-950 p-1.5 rounded-lg border border-slate-800/80">
                            <div>
                                <label class="text-amber-400 block font-bold flex items-center space-x-1" title="Chế độ hiển thị trình chiếu riêng cho lớp này">
                                    <i data-lucide="play-square" class="w-2.5 h-2.5"></i>
                                    <span>Trình chiếu lớp:</span>
                                </label>
                                <select onchange="event.stopPropagation(); updateGroupPresentationMode(${gIdx}, this.value)" class="w-full bg-slate-900 border border-slate-700 rounded p-0.5 font-bold text-amber-200 text-[9px]">
                                    <option value="default" ${(grp.presentationMode === 'default' || !grp.presentationMode) ? 'selected' : ''}>Theo chung</option>
                                    <option value="single" ${grp.presentationMode === 'single' ? 'selected' : ''}>1 Câu / Làm mới</option>
                                    <option value="stack" ${grp.presentationMode === 'stack' ? 'selected' : ''}>Xếp tầng nối tiếp</option>
                                    <option value="all" ${grp.presentationMode === 'all' ? 'selected' : ''}>Hiện tất cả dòng</option>
                                </select>
                            </div>
                            <div>
                                <label class="text-slate-400 block font-bold" title="Vị trí xuất hiện theo phân khu">Phân khu:</label>
                                <button onclick="event.stopPropagation(); cycleGroupLoopMode(${gIdx})" class="w-full mt-0.5 py-1 px-1.5 rounded bg-slate-900 border border-slate-700 font-bold text-[9px] text-slate-200 hover:border-slate-500 text-left flex items-center justify-between">
                                    <span>${curPos === 'before' ? 'Khu 1: Intro' : (curPos === 'after' ? 'Khu 3: Outro' : (curPos === 'outside' ? 'Cố định' : 'Khu 2: Drills'))}</span>
                                    <i data-lucide="refresh-cw" class="w-2.5 h-2.5 opacity-60"></i>
                                </button>
                            </div>
                        </div>

                        <div class="space-y-1 bg-slate-950 px-2 py-1.5 rounded border border-slate-800/80 text-[9px]">
                            <label class="flex items-center space-x-1.5 cursor-pointer select-none text-slate-300 hover:text-white" onclick="event.stopPropagation()">
                                <input type="checkbox" ${grp.autoFitOverflow !== false ? 'checked' : ''} onchange="toggleGroupAutoFitOverflow(${gIdx}, this.checked)" class="w-3.5 h-3.5 rounded border-slate-700 text-teal-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 cursor-pointer">
                                <span class="font-bold text-[9.5px] leading-tight ${grp.autoFitOverflow !== false ? 'text-teal-300' : 'text-slate-400'}">Tự co giãn vừa vặn khi chữ quá dài tràn mép dưới (Auto-Fit)</span>
                            </label>
                            <label class="flex items-center space-x-1.5 cursor-pointer select-none text-slate-300 hover:text-white" onclick="event.stopPropagation()">
                                <input type="checkbox" ${grp.snapEndToTotalDuration ? 'checked' : ''} onchange="toggleGroupSnapEndToTotalDuration(${gIdx}, this.checked)" class="w-3.5 h-3.5 rounded border-slate-700 text-indigo-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 cursor-pointer">
                                <span class="font-bold text-[9.5px] leading-tight ${grp.snapEndToTotalDuration ? 'text-amber-300' : 'text-slate-400'}">Thời điểm cuối của khối trùng với thời điểm cuối của tổng thời lượng</span>
                            </label>
                        </div>

                        <div class="flex flex-wrap gap-1 pt-0.5">${fieldsChipsHtml}</div>
                    ` : `
                        <div class="text-[9px] text-slate-400 flex items-center justify-between pt-0.5">
                            <span>${grp.fields ? grp.fields.length : 0} thẻ nội dung</span>
                            <span class="text-[8px] font-mono text-slate-500">Cột ${grp.targetColumn || 1} • Nhấp để mở rộng</span>
                        </div>
                    `}
                `;
                classicContainer.appendChild(blockDiv);
            });
        }
        container.appendChild(classicContainer);
    }

    if (window.lucide && lucide.createIcons) lucide.createIcons();
    if (typeof updateCanvasQuickLayerBar === 'function') updateCanvasQuickLayerBar();
    if (typeof renderCanvasMasterLayerStackUI === 'function') renderCanvasMasterLayerStackUI();
}

function toggleGroupAutoFitOverflow(gIdx, isChecked) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp) return;
    grp.autoFitOverflow = !!isChecked;
    renderTimelineLayersListUI();
    drawParagraphCanvasFrame();
    showToast(`Lớp "${grp.name}": ${grp.autoFitOverflow !== false ? 'Đã bật' : 'Đã tắt'} tự động co vừa khung khi tràn mép dưới!`);
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function toggleGroupSnapEndToTotalDuration(gIdx, isChecked) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp) return;
    grp.snapEndToTotalDuration = !!isChecked;
    if (grp.snapEndToTotalDuration) {
        const curSentenceTotal = (typeof getEffectiveSentenceDuration === 'function')
            ? getEffectiveSentenceDuration(isParagraphRunning ? pCurrentSentenceIndex : 0)
            : masterTimelineDuration;
        grp.duration = Math.max(0.5, curSentenceTotal - (grp.startTime || 0));
    }
    renderTimelineLayersListUI();
    renderTimelineTracksUI();
    drawParagraphCanvasFrame();
    showToast(`Lớp "${grp.name}": ${grp.snapEndToTotalDuration ? 'Đã bật' : 'Đã tắt'} thời điểm cuối trùng tổng thời lượng!`);
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
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
    if (typeof renderInspectorRibbon === 'function') renderInspectorRibbon();
    drawParagraphCanvasFrame();
    updateCanvasQuickLayerBar();
    renderCanvasMasterLayerStackUI();
    showToast("Đã thay đổi thứ tự lớp!");
    if (typeof triggerAutoSave === 'function') triggerAutoSave(true);
}

/**
 * =========================================================================
 * ĐIỀU HƯỚNG TẦNG NHANH 1-CHẠM & QUẢN LÝ CẤP BẬC TẦNG (LEVEL / Z-INDEX) - V16.9
 * =========================================================================
 */

function moveLayerLevel(gIdx, action) {
    if (!paragraphGridConfig || !paragraphGridConfig.groups || paragraphGridConfig.groups.length === 0) return;
    const total = paragraphGridConfig.groups.length;
    let targetIdx = gIdx;
    if (action === 'top') {
        targetIdx = total - 1;
    } else if (action === 'bottom') {
        targetIdx = 0;
    } else if (action === 'up') {
        targetIdx = Math.min(total - 1, gIdx + 1);
    } else if (action === 'down') {
        targetIdx = Math.max(0, gIdx - 1);
    }
    if (targetIdx === gIdx) return;
    const item = paragraphGridConfig.groups.splice(gIdx, 1)[0];
    paragraphGridConfig.groups.splice(targetIdx, 0, item);
    paragraphSelectedGroupIdx = targetIdx;
    renderTimelineLayersListUI();
    renderTimelineTracksUI();
    if (typeof renderInspectorRibbon === 'function') renderInspectorRibbon();
    drawParagraphCanvasFrame();
    updateCanvasQuickLayerBar();
    renderCanvasMasterLayerStackUI();
    const actionNames = { 'top': 'Lên trên cùng', 'up': 'Lên 1 tầng', 'down': 'Xuống 1 tầng', 'bottom': 'Xuống dưới cùng' };
    showToast(`Lớp "${item.name}": Đã ${actionNames[action]} (Tầng ${targetIdx + 1}/${total})!`);
    if (typeof triggerAutoSave === 'function') triggerAutoSave(true);
}

function moveCardLevel(gIdx, fIdx, action) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields || grp.fields.length === 0) return;
    const total = grp.fields.length;
    let targetIdx = fIdx;
    if (action === 'top') {
        targetIdx = total - 1;
    } else if (action === 'bottom') {
        targetIdx = 0;
    } else if (action === 'up') {
        targetIdx = Math.min(total - 1, fIdx + 1);
    } else if (action === 'down') {
        targetIdx = Math.max(0, fIdx - 1);
    }
    if (targetIdx === fIdx) return;
    const item = grp.fields.splice(fIdx, 1)[0];
    grp.fields.splice(targetIdx, 0, item);
    
    // Cập nhật lại chỉ số chọn nếu thẻ này đang được mở chỉnh sửa
    if (typeof selectedCustomTextTarget !== 'undefined' && selectedCustomTextTarget && selectedCustomTextTarget.gIdx === gIdx && selectedCustomTextTarget.fIdx === fIdx) {
        selectedCustomTextTarget.fIdx = targetIdx;
    } else if (typeof selectedCountdownTarget !== 'undefined' && selectedCountdownTarget && selectedCountdownTarget.gIdx === gIdx && selectedCountdownTarget.fIdx === fIdx) {
        selectedCountdownTarget.fIdx = targetIdx;
    } else if (typeof selectedTtsTarget !== 'undefined' && selectedTtsTarget && selectedTtsTarget.gIdx === gIdx && selectedTtsTarget.fIdx === fIdx) {
        selectedTtsTarget.fIdx = targetIdx;
    } else if (typeof selectedProgressTrackerTarget !== 'undefined' && selectedProgressTrackerTarget && selectedProgressTrackerTarget.gIdx === gIdx && selectedProgressTrackerTarget.fIdx === fIdx) {
        selectedProgressTrackerTarget.fIdx = targetIdx;
    } else if (typeof selectedAudioSfxTarget !== 'undefined' && selectedAudioSfxTarget && selectedAudioSfxTarget.gIdx === gIdx && selectedAudioSfxTarget.fIdx === fIdx) {
        selectedAudioSfxTarget.fIdx = targetIdx;
    } else if (typeof selectedVideoTarget !== 'undefined' && selectedVideoTarget && selectedVideoTarget.gIdx === gIdx && selectedVideoTarget.fIdx === fIdx) {
        selectedVideoTarget.fIdx = targetIdx;
    }

    renderTimelineLayersListUI();
    if (typeof renderInspectorRibbon === 'function') renderInspectorRibbon();
    drawParagraphCanvasFrame();
    updateCanvasQuickLayerBar();
    renderCanvasMasterLayerStackUI();
    showToast(`Đã thay đổi vị trí thẻ trong Lớp "${grp.name}"!`);
    if (typeof triggerAutoSave === 'function') triggerAutoSave(true);
}

function moveCurrentSelectedZOrder(action) {
    // 1. Kiểm tra nếu đang chọn thẻ con cụ thể
    if (typeof selectedCustomTextTarget !== 'undefined' && selectedCustomTextTarget) {
        moveCardLevel(selectedCustomTextTarget.gIdx, selectedCustomTextTarget.fIdx, action);
        return;
    }
    if (typeof selectedCountdownTarget !== 'undefined' && selectedCountdownTarget) {
        moveCardLevel(selectedCountdownTarget.gIdx, selectedCountdownTarget.fIdx, action);
        return;
    }
    if (typeof selectedTtsTarget !== 'undefined' && selectedTtsTarget) {
        moveCardLevel(selectedTtsTarget.gIdx, selectedTtsTarget.fIdx, action);
        return;
    }
    if (typeof selectedProgressTrackerTarget !== 'undefined' && selectedProgressTrackerTarget) {
        moveCardLevel(selectedProgressTrackerTarget.gIdx, selectedProgressTrackerTarget.fIdx, action);
        return;
    }
    if (typeof selectedAudioSfxTarget !== 'undefined' && selectedAudioSfxTarget) {
        moveCardLevel(selectedAudioSfxTarget.gIdx, selectedAudioSfxTarget.fIdx, action);
        return;
    }
    if (typeof selectedVideoTarget !== 'undefined' && selectedVideoTarget) {
        moveCardLevel(selectedVideoTarget.gIdx, selectedVideoTarget.fIdx, action);
        return;
    }

    // 2. Nếu đang chọn thẻ trường dữ liệu (fieldKey)
    if (paragraphSelectedGroupIdx !== undefined && paragraphSelectedGroupIdx >= 0) {
        const grp = paragraphGridConfig.groups[paragraphSelectedGroupIdx];
        if (grp && paragraphSelectedFieldKey && paragraphSelectedFieldKey !== '__CUSTOM_TEXT__' && paragraphSelectedFieldKey !== '__TTS__' && paragraphSelectedFieldKey !== '__COUNTDOWN__') {
            const fIdx = grp.fields.findIndex(f => (typeof f === 'string' ? f : f.key) === paragraphSelectedFieldKey);
            if (fIdx >= 0 && grp.fields.length > 1) {
                moveCardLevel(paragraphSelectedGroupIdx, fIdx, action);
                return;
            }
        }

        // Mặc định di chuyển toàn bộ Lớp đang chọn
        moveLayerLevel(paragraphSelectedGroupIdx, action);
        return;
    }

    showToast("Vui lòng chọn 1 đối tượng hoặc 1 lớp trên Canvas để điều hướng tầng!", "info");
}

function selectLayerFieldByOrder(gIdx, fIdx) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields || !grp.fields[fIdx]) return;
    paragraphSelectedGroupIdx = gIdx;
    const item = grp.fields[fIdx];
    const type = item.type || 'field';
    if (type === 'custom_text') {
        if (typeof selectCustomTextItem === 'function') selectCustomTextItem(gIdx, fIdx);
    } else if (type === 'countdown') {
        if (typeof selectCountdownItem === 'function') selectCountdownItem(gIdx, fIdx);
    } else if (type === 'tts') {
        if (typeof selectTtsItem === 'function') selectTtsItem(gIdx, fIdx);
    } else if (type === 'progress_tracker') {
        if (typeof selectProgressTrackerItem === 'function') selectProgressTrackerItem(gIdx, fIdx);
    } else if (type === 'audio_sfx') {
        if (typeof selectAudioSfxItem === 'function') selectAudioSfxItem(gIdx, fIdx);
    } else if (type === 'video') {
        if (typeof selectVideoItem === 'function') selectVideoItem(gIdx, fIdx);
    } else {
        const fKey = typeof item === 'string' ? item : item.key;
        if (fKey && typeof selectLayerFieldItem === 'function') selectLayerFieldItem(gIdx, fKey);
    }
}

function updateCanvasQuickLayerBar() {
    const bar = document.getElementById('canvas-quick-layer-bar');
    if (!bar) return;

    const iconEl = document.getElementById('quick-layer-target-icon');
    const nameEl = document.getElementById('quick-layer-target-name');
    const badgeEl = document.getElementById('quick-layer-level-badge');

    if (!paragraphGridConfig || !paragraphGridConfig.groups || paragraphGridConfig.groups.length === 0) {
        if (nameEl) nameEl.innerText = "Chưa có lớp";
        if (badgeEl) badgeEl.innerText = "Tầng 0";
        return;
    }

    const totalGroups = paragraphGridConfig.groups.length;
    let targetName = "";
    let targetBadge = "";
    let iconName = "layers";

    if (typeof selectedCustomTextTarget !== 'undefined' && selectedCustomTextTarget) {
        const { gIdx, fIdx } = selectedCustomTextTarget;
        const grp = paragraphGridConfig.groups[gIdx];
        const item = grp && grp.fields ? grp.fields[fIdx] : null;
        targetName = `Thẻ Chữ: "${(item && item.text) ? item.text.substring(0, 14) : ''}..."`;
        targetBadge = `Thẻ ${fIdx + 1}/${grp ? grp.fields.length : 1} • Tầng ${gIdx + 1}`;
        iconName = "type";
    } else if (typeof selectedCountdownTarget !== 'undefined' && selectedCountdownTarget) {
        const { gIdx, fIdx } = selectedCountdownTarget;
        const grp = paragraphGridConfig.groups[gIdx];
        targetName = `Đồng Hồ Đếm Ngược`;
        targetBadge = `Thẻ ${fIdx + 1}/${grp ? grp.fields.length : 1} • Tầng ${gIdx + 1}`;
        iconName = "timer";
    } else if (typeof selectedTtsTarget !== 'undefined' && selectedTtsTarget) {
        const { gIdx, fIdx } = selectedTtsTarget;
        const grp = paragraphGridConfig.groups[gIdx];
        targetName = `Giọng Đọc AI (TTS)`;
        targetBadge = `Thẻ ${fIdx + 1}/${grp ? grp.fields.length : 1} • Tầng ${gIdx + 1}`;
        iconName = "volume-2";
    } else if (typeof selectedProgressTrackerTarget !== 'undefined' && selectedProgressTrackerTarget) {
        const { gIdx, fIdx } = selectedProgressTrackerTarget;
        const grp = paragraphGridConfig.groups[gIdx];
        targetName = `Thanh Tiến Độ`;
        targetBadge = `Thẻ ${fIdx + 1}/${grp ? grp.fields.length : 1} • Tầng ${gIdx + 1}`;
        iconName = "sliders";
    } else if (typeof selectedAudioSfxTarget !== 'undefined' && selectedAudioSfxTarget) {
        const { gIdx, fIdx } = selectedAudioSfxTarget;
        const grp = paragraphGridConfig.groups[gIdx];
        targetName = `Hiệu Ứng SFX`;
        targetBadge = `Thẻ ${fIdx + 1}/${grp ? grp.fields.length : 1} • Tầng ${gIdx + 1}`;
        iconName = "music";
    } else if (typeof selectedVideoTarget !== 'undefined' && selectedVideoTarget) {
        const { gIdx, fIdx } = selectedVideoTarget;
        const grp = paragraphGridConfig.groups[gIdx];
        targetName = `Thẻ Video`;
        targetBadge = `Thẻ ${fIdx + 1}/${grp ? grp.fields.length : 1} • Tầng ${gIdx + 1}`;
        iconName = "video";
    } else if (paragraphSelectedFieldKey && paragraphSelectedFieldKey !== '__CUSTOM_TEXT__' && paragraphSelectedFieldKey !== '__TTS__' && paragraphSelectedFieldKey !== '__COUNTDOWN__') {
        const gIdx = Math.max(0, Math.min(totalGroups - 1, paragraphSelectedGroupIdx || 0));
        const grp = paragraphGridConfig.groups[gIdx];
        const fIdx = grp && grp.fields ? grp.fields.findIndex(f => (typeof f === 'string' ? f : f.key) === paragraphSelectedFieldKey) : -1;
        targetName = `Thẻ: {{${paragraphSelectedFieldKey}}}`;
        targetBadge = (fIdx >= 0) ? `Thẻ ${fIdx + 1}/${grp.fields.length} • Lớp Tầng ${gIdx + 1}` : `Lớp Tầng ${gIdx + 1}/${totalGroups}`;
        iconName = "tag";
    } else {
        const gIdx = Math.max(0, Math.min(totalGroups - 1, paragraphSelectedGroupIdx || 0));
        const grp = paragraphGridConfig.groups[gIdx];
        targetName = grp ? (grp.name || `Lớp ${gIdx + 1}`) : `Lớp ${gIdx + 1}`;
        const posLabel = (gIdx === totalGroups - 1) ? 'Trên Cùng' : (gIdx === 0 ? 'Dưới Cùng' : 'Giữa');
        targetBadge = `Tầng ${gIdx + 1} / ${totalGroups} [${posLabel}]`;
        iconName = "layers";
    }

    if (nameEl) nameEl.innerText = targetName;
    if (badgeEl) badgeEl.innerText = targetBadge;
    if (iconEl) iconEl.setAttribute('data-lucide', iconName);
    if (window.lucide && lucide.createIcons) lucide.createIcons();
}

function renderCanvasMasterLayerStackUI() {
    const container = document.getElementById('canvas-master-stack-content');
    const totalBadge = document.getElementById('master-stack-total-badge');
    if (!container) return;

    if (!paragraphGridConfig || !paragraphGridConfig.groups || paragraphGridConfig.groups.length === 0) {
        container.innerHTML = `<div class="p-3 text-center text-slate-500 text-xs">Chưa có đối tượng nào trên Canvas!</div>`;
        if (totalBadge) totalBadge.innerText = '0 Đối tượng';
        return;
    }

    const groups = paragraphGridConfig.groups;
    const totalLayers = groups.length;
    let totalCards = 0;
    groups.forEach(g => { if (g.fields) totalCards += g.fields.length; });

    const wrapBox = paragraphGridConfig.gridMatrix && paragraphGridConfig.gridMatrix.columnBoxWrapper;
    const isWrapBoxActive = !!(wrapBox && wrapBox.enabled);
    const wrapBoxAbove = isWrapBoxActive && (wrapBox.zOrder === 'above_layers');

    const hasBadge = !!(canvasBadgeImage || (videoConfig && videoConfig.badgeStyle));
    const badgeBelow = hasBadge && (videoConfig.badgeStyle && videoConfig.badgeStyle.zOrder === 'below_layers');

    if (totalBadge) {
        totalBadge.innerText = `${totalLayers} Lớp • ${totalCards} Thẻ • ${isWrapBoxActive ? 'Khung viền • ' : ''}${hasBadge ? 'Logo • ' : ''}Nền`;
    }

    let html = `
        <div class="space-y-1.5 p-1 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px]">
            <div class="flex items-center justify-between text-[9px] font-bold text-slate-400 px-1 pb-1 border-b border-slate-800/80">
                <span class="flex items-center space-x-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Thứ Tự Hiển Thị Từ Trên Cùng ➔ Dưới Cùng (Canvas View)</span>
                </span>
                <span class="text-amber-400 font-mono">Trực quan 100%</span>
            </div>
    `;

    // 1. TOPMOST: Logo nếu ở chế độ mặc định / trên cùng
    if (hasBadge && !badgeBelow) {
        html += `
            <div class="flex items-center justify-between p-1.5 rounded-lg bg-amber-950/40 border border-amber-600/40 text-amber-200">
                <div class="flex items-center space-x-2 min-w-0">
                    <span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[8.5px] border border-amber-500/40 shrink-0">TOP</span>
                    <i data-lucide="award" class="w-3.5 h-3.5 text-amber-400 shrink-0"></i>
                    <span class="font-extrabold truncate">Logo / Huy Hiệu Thương Hiệu</span>
                </div>
                <div class="flex items-center space-x-1 shrink-0">
                    <span class="text-[8px] font-mono px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-300 border border-amber-700/80">Trên cùng</span>
                    <button onclick="setCanvasBadgeZOrder('below_layers')" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[9px] font-bold transition" title="Chuyển Logo xuống dưới các lớp">
                        ⏬ Hạ xuống
                    </button>
                </div>
            </div>
        `;
    }

    // 2. KHUNG VIỀN BAO GỘP nếu zOrder === 'above_layers'
    if (isWrapBoxActive && wrapBoxAbove) {
        html += `
            <div class="flex items-center justify-between p-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/40 text-indigo-200">
                <div class="flex items-center space-x-2 min-w-0">
                    <span class="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[8.5px] border border-indigo-500/40 shrink-0">ĐÈ LỚP</span>
                    <i data-lucide="box" class="w-3.5 h-3.5 text-indigo-400 shrink-0"></i>
                    <span class="font-extrabold truncate">Khung Viền Bao Gộp Cột</span>
                </div>
                <div class="flex items-center space-x-1 shrink-0">
                    <span class="text-[8px] font-mono px-1.5 py-0.5 rounded bg-indigo-900/80 text-indigo-300 border border-indigo-700/80">Đè lên lớp</span>
                    <button onclick="setColumnBoxWrapperZOrder('below_layers')" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[9px] font-bold transition" title="Hạ khung viền xuống dưới các lớp">
                        ⏬ Hạ xuống
                    </button>
                </div>
            </div>
        `;
    }

    // 3. CÁC LỚP NỘI DUNG (Từ Lớp cuối vẽ sau cùng - Tầng cao nhất, xuống Lớp đầu tiên vẽ trước - Tầng thấp nhất)
    for (let gIdx = totalLayers - 1; gIdx >= 0; gIdx--) {
        const grp = groups[gIdx];
        const isSel = (gIdx === paragraphSelectedGroupIdx);
        const isTop = (gIdx === totalLayers - 1);
        const isBottom = (gIdx === 0);
        const levelNum = gIdx + 1;
        const meta = getGroupPrimaryMeta(grp);

        html += `
            <div class="p-1.5 rounded-lg border transition ${isSel ? 'bg-indigo-950/80 border-indigo-500 shadow-md ring-1 ring-indigo-500/50' : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'} space-y-1">
                <div class="flex items-center justify-between cursor-pointer" onclick="selectGridGroup(${gIdx})">
                    <div class="flex items-center space-x-2 min-w-0 flex-1 mr-1">
                        <span class="px-1.5 py-0.5 rounded font-mono font-black text-[9px] shrink-0 ${isTop ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : (isBottom ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40')}">
                            T${levelNum}
                        </span>
                        <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style="background-color: ${grp.trackColor || '#3b82f6'};"></span>
                        <div class="flex items-center space-x-1.5 min-w-0">
                            <i data-lucide="${meta.icon}" class="w-3.5 h-3.5 ${meta.colorClass} shrink-0"></i>
                            <span class="font-extrabold truncate ${isSel ? 'text-white' : 'text-slate-200'}">${grp.name || `Lớp ${levelNum}`}</span>
                        </div>
                        <span class="text-[8px] font-bold px-1.5 py-0.2 rounded shrink-0 ${isTop ? 'bg-amber-950 text-amber-300 border border-amber-800' : (isBottom ? 'bg-slate-900 text-slate-500 border border-slate-800' : 'bg-slate-900 text-slate-400 border border-slate-800')}">
                            ${isTop ? 'Trên cùng' : (isBottom ? 'Dưới cùng' : 'Giữa')}
                        </span>
                    </div>

                    <div class="flex items-center space-x-0.5 shrink-0" onclick="event.stopPropagation()">
                        <button onclick="moveLayerLevel(${gIdx}, 'top')" ${isTop ? 'disabled' : ''} class="p-1 rounded bg-slate-900 hover:bg-indigo-600 disabled:opacity-20 text-slate-300 hover:text-white transition" title="Lên trên cùng (Bring to Front)">
                            <span class="text-[9px]">⏫</span>
                        </button>
                        <button onclick="moveLayerLevel(${gIdx}, 'up')" ${isTop ? 'disabled' : ''} class="p-1 rounded bg-slate-900 hover:bg-teal-600 disabled:opacity-20 text-slate-300 hover:text-white transition" title="Lên 1 tầng (Bring Forward)">
                            <span class="text-[9px]">🔼</span>
                        </button>
                        <button onclick="moveLayerLevel(${gIdx}, 'down')" ${isBottom ? 'disabled' : ''} class="p-1 rounded bg-slate-900 hover:bg-amber-600 disabled:opacity-20 text-slate-300 hover:text-white transition" title="Xuống 1 tầng (Send Backward)">
                            <span class="text-[9px]">🔽</span>
                        </button>
                        <button onclick="moveLayerLevel(${gIdx}, 'bottom')" ${isBottom ? 'disabled' : ''} class="p-1 rounded bg-slate-900 hover:bg-rose-600 disabled:opacity-20 text-slate-300 hover:text-white transition" title="Xuống dưới cùng (Send to Back)">
                            <span class="text-[9px]">⏬</span>
                        </button>
                    </div>
                </div>

                ${grp.fields && grp.fields.length > 0 ? `
                    <div class="pl-5 pt-0.5 border-t border-slate-900 flex flex-wrap gap-1 items-center">
                        <span class="text-[8px] text-slate-500 font-bold shrink-0">Thẻ con:</span>
                        ${grp.fields.map((fItem, fIdx) => {
                            const fKey = typeof fItem === 'string' ? fItem : (fItem.key || fItem.type || fItem.text || 'Thẻ');
                            const isFKeySel = (isSel && ((typeof selectedFieldKeysList !== 'undefined' && selectedFieldKeysList.includes(fKey)) || (typeof selectedCustomTextTarget !== 'undefined' && selectedCustomTextTarget && selectedCustomTextTarget.gIdx === gIdx && selectedCustomTextTarget.fIdx === fIdx) || (typeof selectedCountdownTarget !== 'undefined' && selectedCountdownTarget && selectedCountdownTarget.gIdx === gIdx && selectedCountdownTarget.fIdx === fIdx)));
                            return `
                                <div class="flex items-center space-x-0.5 px-1.5 py-0.5 rounded border text-[8.5px] cursor-pointer ${isFKeySel ? 'bg-amber-500/20 text-amber-200 border-amber-500/60 font-bold' : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'}" onclick="event.stopPropagation(); selectLayerFieldByOrder(${gIdx}, ${fIdx})">
                                    <span class="text-[8px] text-slate-500 font-mono">#${fIdx + 1}</span>
                                    <span class="truncate max-w-[80px]">${fKey}</span>
                                    ${grp.fields.length > 1 ? `
                                        <button onclick="event.stopPropagation(); moveCardLevel(${gIdx}, ${fIdx}, 'up')" ${fIdx === grp.fields.length - 1 ? 'disabled' : ''} class="text-[7.5px] text-slate-400 hover:text-white disabled:opacity-20 px-0.5" title="Đẩy thẻ lên trước">▲</button>
                                        <button onclick="event.stopPropagation(); moveCardLevel(${gIdx}, ${fIdx}, 'down')" ${fIdx === 0 ? 'disabled' : ''} class="text-[7.5px] text-slate-400 hover:text-white disabled:opacity-20 px-0.5" title="Hạ thẻ xuống sau">▼</button>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // 4. KHUNG VIỀN BAO GỘP nếu zOrder !== 'above_layers' (nằm dưới các lớp)
    if (isWrapBoxActive && !wrapBoxAbove) {
        html += `
            <div class="flex items-center justify-between p-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/40 text-indigo-200">
                <div class="flex items-center space-x-2 min-w-0">
                    <span class="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[8.5px] border border-indigo-500/40 shrink-0">DƯỚI LỚP</span>
                    <i data-lucide="box" class="w-3.5 h-3.5 text-indigo-400 shrink-0"></i>
                    <span class="font-extrabold truncate">Khung Viền Bao Gộp Cột</span>
                </div>
                <div class="flex items-center space-x-1 shrink-0">
                    <span class="text-[8px] font-mono px-1.5 py-0.5 rounded bg-indigo-900/80 text-indigo-300 border border-indigo-700/80">Dưới các lớp</span>
                    <button onclick="setColumnBoxWrapperZOrder('above_layers')" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[9px] font-bold transition" title="Đưa khung viền lên đè lên các lớp">
                        ⏫ Đưa lên
                    </button>
                </div>
            </div>
        `;
    }

    // 5. LOGO nếu zOrder === 'below_layers'
    if (hasBadge && badgeBelow) {
        html += `
            <div class="flex items-center justify-between p-1.5 rounded-lg bg-amber-950/40 border border-amber-600/40 text-amber-200">
                <div class="flex items-center space-x-2 min-w-0">
                    <span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[8.5px] border border-amber-500/40 shrink-0">DƯỚI LỚP</span>
                    <i data-lucide="award" class="w-3.5 h-3.5 text-amber-400 shrink-0"></i>
                    <span class="font-extrabold truncate">Logo / Huy Hiệu Thương Hiệu</span>
                </div>
                <div class="flex items-center space-x-1 shrink-0">
                    <span class="text-[8px] font-mono px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-300 border border-amber-700/80">Dưới các lớp</span>
                    <button onclick="setCanvasBadgeZOrder('top')" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[9px] font-bold transition" title="Chuyển Logo lên trên cùng">
                        ⏫ Lên trên
                    </button>
                </div>
            </div>
        `;
    }

    // 6. TẦNG ĐÁY CỐ ĐỊNH: KHUNG NỀN CANVAS
    html += `
            <div class="flex items-center justify-between p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
                <div class="flex items-center space-x-2 min-w-0">
                    <span class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono font-bold text-[8.5px] border border-slate-700 shrink-0">ĐÁY 0</span>
                    <i data-lucide="image" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
                    <span class="font-extrabold truncate">Khung Nền Canvas (Màu / Ảnh Nền / Blobs)</span>
                </div>
                <span class="text-[8px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800">Cố định đáy</span>
            </div>
        </div>
    `;

    container.innerHTML = html;
    if (window.lucide && lucide.createIcons) lucide.createIcons();
}

function toggleCanvasMasterStackContent() {
    const content = document.getElementById('canvas-master-stack-content');
    const icon = document.getElementById('master-stack-toggle-icon');
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

function toggleCanvasMasterStackPanel() {
    const panel = document.getElementById('canvas-master-stack-panel');
    const content = document.getElementById('canvas-master-stack-content');
    const icon = document.getElementById('master-stack-toggle-icon');
    if (content && content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        if (icon) icon.style.transform = 'rotate(180deg)';
    }
    if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        panel.classList.add('ring-2', 'ring-indigo-500', 'bg-indigo-950/40');
        setTimeout(() => {
            panel.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-950/40');
        }, 1200);
    }
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
    if (typeof updateCanvasQuickLayerBar === 'function') updateCanvasQuickLayerBar();
    if (typeof renderCanvasMasterLayerStackUI === 'function') renderCanvasMasterLayerStackUI();
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
        renderTimelineLayersListUI();
        drawParagraphCanvasFrame();
        showToast(`Lớp chuyển sang Cột ${colIdx}!`);
        if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
    }
}

function updateGroupColSpan(gIdx, spanVal) {
    if (paragraphGridConfig.groups[gIdx]) {
        if (spanVal === 'all') {
            paragraphGridConfig.groups[gIdx].colSpan = 'all';
            showToast(`Lớp "${paragraphGridConfig.groups[gIdx].name}" gộp Tràn tất cả cột!`);
        } else {
            const num = parseInt(spanVal) || 1;
            paragraphGridConfig.groups[gIdx].colSpan = Math.max(1, num);
            showToast(`Lớp "${paragraphGridConfig.groups[gIdx].name}" gộp ${num} cột!`);
        }
        drawParagraphCanvasFrame();
        if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
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
    if (typeof updateCanvasQuickLayerBar === 'function') updateCanvasQuickLayerBar();
    if (typeof renderCanvasMasterLayerStackUI === 'function') renderCanvasMasterLayerStackUI();
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
    if (typeof updateCanvasQuickLayerBar === 'function') updateCanvasQuickLayerBar();
    if (typeof renderCanvasMasterLayerStackUI === 'function') renderCanvasMasterLayerStackUI();
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
        grp.fields.push({
            type: "countdown",
            preset: "speaking_ring",
            seconds: 45,
            colorShift: true,
            bgColor: "transparent",
            bgOpacity: 0,
            textColor: "#ffffff",
            subLabel: "giây chuẩn bị",
            showSubLabel: true,
            position: "top_right",
            size: "medium",
            radius: 36,
            posX: 1845,
            posY: 70
        });
        if (typeof selectCountdownItem === 'function') {
            selectCountdownItem(paragraphSelectedGroupIdx, newIdx);
        }
        showToast("Đã thêm Đồng Hồ Đếm Ngược (Speaking Ring)!");
    } else if (type === 'custom_text') {
        grp.fields.push({ type: "custom_text", text: "Ghi chú tiêu đề ở đây" });
        if (typeof selectCustomTextItem === 'function') {
            selectCustomTextItem(paragraphSelectedGroupIdx, newIdx);
        }
        showToast("Đã thêm Thẻ Chữ Tự Do!");
    } else if (type === 'progress_tracker') {
        grp.fields.push({
            type: "progress_tracker",
            displayMode: "both",
            textTemplate: "Câu {STT}/{Tổng_câu}",
            position: "top_bar",
            barThickness: 8,
            barColor: "#10b981",
            barBgColor: "#ffffff",
            barBgOpacity: 25,
            pillBgColor: "#0f172a",
            pillBgOpacity: 85,
            borderColor: "#ffffff",
            borderOpacity: 25,
            borderWidth: 1.5,
            borderRadius: 14,
            opacity: 100,
            textColor: "#ffffff",
            fontSize: 22,
            fontWeight: 900,
            boxWidth: 0,
            boxHeight: 0,
            posX: 1520,
            posY: 30,
            shadow: true
        });
        if (typeof selectProgressTrackerItem === 'function') {
            selectProgressTrackerItem(paragraphSelectedGroupIdx, newIdx);
        }
        showToast("Đã thêm Thẻ Tiến Độ (Progress & Đếm Câu)!");
    } else if (type === 'audio_sfx') {
        grp.fields.push({
            type: "audio_sfx",
            soundType: "ding",
            customAudioName: "",
            customAudioData: null,
            volume: 80,
            ducking: true
        });
        grp.trackColor = "#9333ea";
        if (typeof selectAudioSfxItem === 'function') {
            selectAudioSfxItem(paragraphSelectedGroupIdx, newIdx);
        }
        showToast("Đã thêm Thẻ Âm Thanh (Hiệu Ứng SFX & Nhạc)!");
    } else if (type === 'video') {
        grp.fields.push({
            type: "video",
            sourceMode: "file",
            excelColumn: "",
            videoFileName: "",
            videoUrl: "",
            posX: 120,
            posY: 120,
            width: 640,
            height: 360,
            fitMode: "cover",
            borderRadius: 16,
            borderWidth: 0,
            borderColor: "#38bdf8",
            opacity: 100,
            shadow: true,
            volume: 0,
            isMuted: true,
            loop: true,
            playbackRate: 1.0,
            autoFitTimeline: true
        });
        grp.trackColor = "#0284c7";
        if (typeof selectVideoItem === 'function') {
            selectVideoItem(paragraphSelectedGroupIdx, newIdx);
        }
        showToast("Đã thêm Thẻ Video (Clip & Nền)!");
    }

    renderTimelineLayersListUI();
    renderTimelineTracksUI();
    drawParagraphCanvasFrame();
}

