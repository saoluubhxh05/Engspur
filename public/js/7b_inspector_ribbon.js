/**
 * 7b_inspector_ribbon.js
 * Quản lý Ribbon định dạng (phông chữ, màu sắc, vệt highlight, thụt lề, preset) và thanh chèn thẻ Mail-Merge Chips
 */

var selectedCustomTextTarget = null;
var selectedTtsTarget = null;
var selectedCountdownTarget = null;
var selectedProgressTrackerTarget = null;
var selectedAudioSfxTarget = null;

function toggleSelectFieldMulti(fKey, e) {
    selectedCustomTextTarget = null;
    selectedTtsTarget = null;
    selectedCountdownTarget = null;
    selectedProgressTrackerTarget = null;
    selectedAudioSfxTarget = null;
    if (e && (e.ctrlKey || e.metaKey)) {
        if (selectedFieldKeysList.includes(fKey)) {
            if (selectedFieldKeysList.length > 1) selectedFieldKeysList = selectedFieldKeysList.filter(k => k !== fKey);
        } else {
            selectedFieldKeysList.push(fKey);
        }
    } else {
        selectedFieldKeysList = [fKey];
    }
    paragraphSelectedFieldKey = fKey;
    if (typeof switchLeftSubTab === 'function') switchLeftSubTab(4);
    renderTimelineLayersListUI();
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
}

function selectLayerFieldItem(gIdx, fKey, e) {
    paragraphSelectedGroupIdx = gIdx;
    selectedCustomTextTarget = null;
    selectedTtsTarget = null;
    selectedCountdownTarget = null;
    selectedProgressTrackerTarget = null;
    selectedAudioSfxTarget = null;
    toggleSelectFieldMulti(fKey, e);
    showToast(`Đang định dạng {{${fKey}}} (Lớp ${gIdx + 1})!`);
}

function selectCustomTextItem(gIdx, fIdx) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;
    paragraphSelectedGroupIdx = gIdx;
    selectedCustomTextTarget = { gIdx, fIdx };
    selectedTtsTarget = null;
    selectedCountdownTarget = null;
    selectedProgressTrackerTarget = null;
    selectedAudioSfxTarget = null;
    paragraphSelectedFieldKey = '__CUSTOM_TEXT__';
    getCustomTextDefaults(grp.fields[fIdx]);
    if (typeof switchLeftSubTab === 'function') switchLeftSubTab(4);
    renderTimelineLayersListUI();
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
    showToast(`Đang chỉnh sửa Thẻ Chữ Tự Do trong Lớp ${gIdx + 1}!`);
}

function selectTtsItem(gIdx, fIdx) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;
    paragraphSelectedGroupIdx = gIdx;
    selectedTtsTarget = { gIdx, fIdx };
    selectedCustomTextTarget = null;
    selectedCountdownTarget = null;
    selectedProgressTrackerTarget = null;
    selectedAudioSfxTarget = null;
    paragraphSelectedFieldKey = '__TTS__';
    if (typeof switchLeftSubTab === 'function') switchLeftSubTab(4);
    renderTimelineLayersListUI();
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
    showToast(`Đang cấu hình Thẻ Giọng Đọc AI trong Lớp ${gIdx + 1}!`);
}

function selectCountdownItem(gIdx, fIdx) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;
    paragraphSelectedGroupIdx = gIdx;
    selectedCountdownTarget = { gIdx, fIdx };
    selectedCustomTextTarget = null;
    selectedTtsTarget = null;
    selectedProgressTrackerTarget = null;
    selectedAudioSfxTarget = null;
    paragraphSelectedFieldKey = '__COUNTDOWN__';
    if (typeof switchLeftSubTab === 'function') switchLeftSubTab(4);
    renderTimelineLayersListUI();
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
    showToast(`Đang cấu hình Đồng Hồ Đếm Ngược trong Lớp ${gIdx + 1}!`);
}

function selectProgressTrackerItem(gIdx, fIdx) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;
    paragraphSelectedGroupIdx = gIdx;
    selectedProgressTrackerTarget = { gIdx, fIdx };
    selectedCustomTextTarget = null;
    selectedTtsTarget = null;
    selectedCountdownTarget = null;
    selectedAudioSfxTarget = null;
    paragraphSelectedFieldKey = '__PROGRESS_TRACKER__';
    if (typeof switchLeftSubTab === 'function') switchLeftSubTab(4);
    renderTimelineLayersListUI();
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
    showToast(`Đang cấu hình Thẻ Tiến Độ trong Lớp ${gIdx + 1}!`);
}

function selectAudioSfxItem(gIdx, fIdx) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;
    paragraphSelectedGroupIdx = gIdx;
    selectedAudioSfxTarget = { gIdx, fIdx };
    selectedCustomTextTarget = null;
    selectedTtsTarget = null;
    selectedCountdownTarget = null;
    selectedProgressTrackerTarget = null;
    paragraphSelectedFieldKey = '__AUDIO_SFX__';
    if (typeof switchLeftSubTab === 'function') switchLeftSubTab(4);
    renderTimelineLayersListUI();
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
    showToast(`Đang cấu hình Thẻ Âm Thanh SFX trong Lớp ${gIdx + 1}!`);
}

function updateProgressTrackerProp(gIdx, fIdx, prop, val, skipRibbonRerender = false) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;
    grp.fields[fIdx][prop] = val;

    if (prop === 'position' && val === 'custom') {
        if (grp.fields[fIdx].posX === undefined || grp.fields[fIdx].posX <= 100) {
            grp.fields[fIdx].posX = 1520;
        }
        if (grp.fields[fIdx].posY === undefined || grp.fields[fIdx].posY <= 100) {
            grp.fields[fIdx].posY = 30;
        }
    }

    if (!skipRibbonRerender) {
        renderInspectorRibbon();
    }
    renderTimelineLayersListUI();
    drawParagraphCanvasFrame();
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function updateAudioSfxProp(gIdx, fIdx, prop, val, skipRibbonRerender = false) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;
    grp.fields[fIdx][prop] = val;

    // Cập nhật âm lượng thời gian thực cho luồng âm thanh đang phát
    if (prop === 'volume') {
        if (typeof updateActiveSfxVolume === 'function') {
            updateActiveSfxVolume(grp.fields[fIdx], val);
        }
        const valBadge = document.getElementById(`sfx-vol-badge-${gIdx}-${fIdx}`);
        if (valBadge) valBadge.innerText = `${val}%`;
    }
    if (prop === 'ducking') {
        if (typeof updateActiveSfxDucking === 'function') {
            updateActiveSfxDucking(grp.fields[fIdx], val);
        }
    }

    if (!skipRibbonRerender) {
        renderInspectorRibbon();
    }
    renderTimelineLayersListUI();
    drawParagraphCanvasFrame();
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function handleAudioSfxFileUpload(gIdx, fIdx, fileInput) {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;

    const audioCtx = (typeof getSharedAudioContext === 'function') ? getSharedAudioContext() : null;
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }

    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;

    grp.fields[fIdx].customAudioName = file.name;
    grp.fields[fIdx].soundType = 'custom';

    // 1. Tận dụng giải mã nhị phân trực tiếp từ ArrayBuffer (nhanh gấp nhiều lần base64)
    if (file.arrayBuffer && audioCtx && typeof safeDecodeAudioData === 'function') {
        file.arrayBuffer().then(ab => {
            return safeDecodeAudioData(audioCtx, ab);
        }).then(buf => {
            if (grp && grp.fields[fIdx]) {
                if (typeof setCachedAudioBuffer === 'function') {
                    setCachedAudioBuffer(grp.fields[fIdx], buf);
                } else {
                    grp.fields[fIdx].customAudioDuration = buf.duration;
                }
                renderInspectorRibbon();
                renderTimelineLayersListUI();
                showToast(`Đã nạp file âm thanh: ${file.name} (${buf.duration.toFixed(1)}s)!`, "success");
            }
        }).catch(err => {
            console.warn("Giải mã nhanh ArrayBuffer thất bại, chờ FileReader:", err);
        });
    }

    // 2. Đồng thời đọc Data URL để lưu vào file dự án / IndexedDB
    const reader = new FileReader();
    reader.onload = (e) => {
        if (grp && grp.fields[fIdx]) {
            const dataUrl = e.target.result;
            grp.fields[fIdx].customAudioData = dataUrl;

            // Nếu chưa có cache từ arrayBuffer, giải mã từ dataUrl
            const hasCache = (typeof getCachedAudioBuffer === 'function') && getCachedAudioBuffer(grp.fields[fIdx]);
            if (!hasCache && typeof decodeBase64AudioToBuffer === 'function') {
                decodeBase64AudioToBuffer(dataUrl, audioCtx).then(buf => {
                    if (typeof setCachedAudioBuffer === 'function') {
                        setCachedAudioBuffer(grp.fields[fIdx], buf);
                    } else {
                        grp.fields[fIdx].customAudioDuration = buf.duration;
                    }
                    renderInspectorRibbon();
                    renderTimelineLayersListUI();
                }).catch(() => {});
            }
            if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
        }
    };
    reader.readAsDataURL(file);
}

function updateCustomTextProp(gIdx, fIdx, prop, val) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];
    item[prop] = val;
    renderInspectorRibbon();
    renderTimelineLayersListUI();
    drawParagraphCanvasFrame();
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function updateCustomTextDirectInput(gIdx, fIdx, val) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];
    item.text = val;
    const countEl = document.getElementById('ct-char-word-count');
    if (countEl) {
        const words = val.trim() ? val.trim().split(/\s+/).length : 0;
        countEl.innerText = `${val.length} ký tự • ${words} từ`;
    }
    renderTimelineLayersListUI();
    drawParagraphCanvasFrame();
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function setCustomTextContent(gIdx, fIdx, val) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;
    grp.fields[fIdx].text = val;
    renderInspectorRibbon();
    renderTimelineLayersListUI();
    drawParagraphCanvasFrame();
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function stepCustomTextFontSize(gIdx, fIdx, delta) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];
    const curSize = parseInt(item.size, 10) || 28;
    item.size = Math.max(10, Math.min(140, curSize + delta));
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function toggleCustomTextStyle(gIdx, fIdx, styleType) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];
    if (styleType === 'bold') {
        item.style = (item.style === 'bold' || item.style === 'extrabold') ? 'normal' : 'bold';
    } else if (styleType === 'italic') {
        item.style = (item.style === 'italic') ? 'normal' : 'italic';
    } else if (styleType === 'underline') {
        item.underline = !item.underline;
    }
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function setCustomTextShadowPreset(gIdx, fIdx, offX, offY, blur) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];
    item.shadowEnabled = true;
    item.shadowOffsetX = offX;
    item.shadowOffsetY = offY;
    item.shadowBlur = blur;
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function applyCustomTextPrefixQuick(gIdx, fIdx, prefixVal) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;
    grp.fields[fIdx].prefix = prefixVal;
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function applyCustomTextSuffixQuick(gIdx, fIdx, suffixVal) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;
    grp.fields[fIdx].suffix = suffixVal;
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function duplicateCustomTextItem(gIdx, fIdx) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;
    const original = grp.fields[fIdx];
    const clone = JSON.parse(JSON.stringify(original));
    clone.id = "custom_text_" + Date.now();
    clone.posY = (clone.posY || 120) + 40;
    clone.posX = (clone.posX || 120) + 20;
    grp.fields.splice(fIdx + 1, 0, clone);
    selectCustomTextItem(gIdx, fIdx + 1);
    showToast("Đã nhân bản Thẻ Chữ Tự Do!");
}

function deleteCustomTextItem(gIdx, fIdx) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;
    grp.fields.splice(fIdx, 1);
    selectedCustomTextTarget = null;
    paragraphSelectedFieldKey = "Substitution words";
    renderTimelineLayersListUI();
    renderTimelineTracksUI();
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
    showToast("Đã xóa Thẻ Chữ Tự Do!");
}

function renderCustomTextInspectorRibbon(item, gIdx, fIdx) {
    const body = document.getElementById('inspector-panel-body');
    const targetLabel = document.getElementById('inspector-target-label');
    if (!body) return;

    item = getCustomTextDefaults(item);

    if (targetLabel) {
        targetLabel.innerHTML = `<span class="flex items-center space-x-1"><i data-lucide="type" class="w-3 h-3 text-teal-400"></i><span>Chữ Tự Do (Lớp ${gIdx + 1})</span></span>`;
        targetLabel.className = "text-[9px] font-extrabold bg-teal-950 text-teal-300 border border-teal-700/80 px-2 py-0.5 rounded";
    }

    const wordsCount = (item.text || '').trim() ? (item.text || '').trim().split(/\s+/).length : 0;
    const charsCount = (item.text || '').length;

    const fontOptions = ['Quicksand', 'Plus Jakarta Sans', 'Nunito', 'Inter', 'Courier Prime'];
    let fontOptionsHtml = fontOptions.map(f => `<option value="${f}" ${item.font === f ? 'selected' : ''}>${f}</option>`).join('');

    const isBold = (item.style === 'bold' || item.style === 'extrabold');
    const isItalic = (item.style === 'italic');
    const isUnderline = !!item.underline;

    const textCase = item.textCase || 'none';

    body.innerHTML = `
        <div class="space-y-3 text-xs">
            <!-- NHÓM 0: NHẬP NỘI DUNG TRỰC TIẾP -->
            <div class="space-y-2 bg-slate-900 p-2.5 rounded-xl border border-teal-500/50 shadow-md">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-extrabold text-teal-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <i data-lucide="edit-3" class="w-3.5 h-3.5 text-teal-400"></i>
                        <span>Nội Dung Văn Bản</span>
                    </span>
                    <span id="ct-char-word-count" class="text-[9px] font-mono text-teal-300/90 bg-teal-950 px-1.5 py-0.5 rounded border border-teal-800/80">
                        ${charsCount} ký tự • ${wordsCount} từ
                    </span>
                </div>
                <textarea id="ct-direct-text-input" rows="3" oninput="updateCustomTextDirectInput(${gIdx}, ${fIdx}, this.value)" class="w-full bg-slate-950 border border-slate-700 focus:border-teal-400 rounded-lg p-2 font-bold text-slate-100 text-xs focus:ring-0 leading-relaxed resize-none" placeholder="Nhập trực tiếp câu chữ, tiêu đề, ghi chú...">${item.text || ''}</textarea>
                <div class="flex items-center justify-between pt-0.5 text-[9px]">
                    <div class="flex items-center space-x-1">
                        <span class="text-slate-400">Mẫu nhanh:</span>
                        <button onclick="setCustomTextContent(${gIdx}, ${fIdx}, 'Tiêu Đề Bài Học')" class="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-teal-200 rounded font-semibold">+ Tiêu đề</button>
                        <button onclick="setCustomTextContent(${gIdx}, ${fIdx}, 'Ghi nhớ quan trọng:')" class="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-teal-200 rounded font-semibold">+ Ghi nhớ</button>
                        <button onclick="setCustomTextContent(${gIdx}, ${fIdx}, 'Đáp Án Chuẩn')" class="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-teal-200 rounded font-semibold">+ Đáp án</button>
                    </div>
                    <button onclick="setCustomTextContent(${gIdx}, ${fIdx}, '')" class="text-rose-400 hover:text-rose-300 font-bold">Xóa trắng</button>
                </div>
            </div>

            <!-- NÚT ÁP DỤNG CHUNG CHO TOÀN BỘ THẺ CHỮ TỰ DO (ACCORDION MỌI KỊCH BẢN) -->
            ${renderBatchStyleAccordionUI('custom_text')}

            <!-- NHÓM 1: PHÔNG CHỮ & KIỂU DÁNG HIỂN THỊ -->
            <div class="space-y-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 shadow">
                <span class="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <i data-lucide="type" class="w-3.5 h-3.5 text-indigo-400"></i>
                    <span>1. Phông Chữ & Kiểu Dáng</span>
                </span>
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="text-[9px] text-slate-400 block mb-0.5">Phông chữ</label>
                        <select onchange="updateCustomTextProp(${gIdx}, ${fIdx}, 'font', this.value)" class="w-full bg-slate-950 border border-slate-800 rounded p-1 text-slate-200 text-xs font-semibold">
                            ${fontOptionsHtml}
                        </select>
                    </div>
                    <div>
                        <label class="text-[9px] text-slate-400 block mb-0.5">Cỡ chữ (px)</label>
                        <div class="flex items-center space-x-1">
                            <button onclick="stepCustomTextFontSize(${gIdx}, ${fIdx}, -2)" title="Giảm 2px" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold rounded border border-slate-700 text-xs">-2</button>
                            <input type="number" value="${item.size || 28}" min="10" max="140" step="2" onchange="updateCustomTextProp(${gIdx}, ${fIdx}, 'size', parseInt(this.value, 10))" class="w-full bg-slate-950 border border-slate-800 rounded p-1 text-slate-200 text-xs text-center font-bold">
                            <button onclick="stepCustomTextFontSize(${gIdx}, ${fIdx}, 2)" title="Tăng 2px" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold rounded border border-slate-700 text-xs">+2</button>
                        </div>
                    </div>
                </div>

                <!-- B / I / U & TEXT CASE -->
                <div class="flex items-center justify-between pt-1">
                    <div class="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <button onclick="toggleCustomTextStyle(${gIdx}, ${fIdx}, 'bold')" title="In Đậm" class="w-7 h-6 rounded flex items-center justify-center font-bold text-xs transition ${isBold ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}">B</button>
                        <button onclick="toggleCustomTextStyle(${gIdx}, ${fIdx}, 'italic')" title="In Nghiêng" class="w-7 h-6 rounded flex items-center justify-center italic text-xs transition ${isItalic ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}">I</button>
                        <button onclick="toggleCustomTextStyle(${gIdx}, ${fIdx}, 'underline')" title="Gạch Chân" class="w-7 h-6 rounded flex items-center justify-center underline text-xs transition ${isUnderline ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}">U</button>
                    </div>

                    <div class="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800" title="Kiểu chữ hoa">
                        <button onclick="updateCustomTextProp(${gIdx}, ${fIdx}, 'textCase', 'none')" class="px-1.5 py-0.5 rounded text-[10px] font-bold transition ${textCase === 'none' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}">abc</button>
                        <button onclick="updateCustomTextProp(${gIdx}, ${fIdx}, 'textCase', 'uppercase')" class="px-1.5 py-0.5 rounded text-[10px] font-bold transition ${textCase === 'uppercase' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}">ABC</button>
                        <button onclick="updateCustomTextProp(${gIdx}, ${fIdx}, 'textCase', 'capitalize')" class="px-1.5 py-0.5 rounded text-[10px] font-bold transition ${textCase === 'capitalize' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}">Abc</button>
                    </div>
                </div>
            </div>

            <!-- NHÓM 2: MÀU SẮC, VIỀN CHỮ (STROKE) & ĐỔ BÓNG (SHADOW) -->
            <div class="space-y-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 shadow">
                <span class="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <i data-lucide="palette" class="w-3.5 h-3.5 text-amber-400"></i>
                    <span>2. Màu Sắc, Viền Nét & Đổ Bóng</span>
                </span>
                
                <!-- Màu chữ chính -->
                <div class="flex items-center justify-between bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                    <span class="text-slate-300 font-semibold text-[11px]">Màu chữ chính:</span>
                    <div class="flex items-center space-x-2">
                        <input type="color" value="${item.color || '#ffffff'}" onchange="updateCustomTextProp(${gIdx}, ${fIdx}, 'color', this.value)" class="w-7 h-7 rounded cursor-pointer border-0 bg-transparent">
                        <span class="text-[10px] font-mono text-slate-400">${item.color || '#ffffff'}</span>
                    </div>
                </div>

                <!-- Viền nét chữ (Stroke) -->
                <div class="p-2 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                    <div class="flex items-center justify-between">
                        <label class="flex items-center space-x-1.5 cursor-pointer">
                            <input type="checkbox" ${item.strokeEnabled ? 'checked' : ''} onchange="updateCustomTextProp(${gIdx}, ${fIdx}, 'strokeEnabled', this.checked)" class="rounded text-amber-500">
                            <span class="text-[11px] font-bold text-slate-200">Viền nét chữ (Outline/Stroke)</span>
                        </label>
                        <input type="color" value="${item.strokeColor || '#000000'}" onchange="updateCustomTextProp(${gIdx}, ${fIdx}, 'strokeColor', this.value)" class="w-6 h-6 rounded cursor-pointer border-0 bg-transparent ${!item.strokeEnabled ? 'opacity-40' : ''}">
                    </div>
                    <div class="flex items-center justify-between text-[10px] text-slate-400 ${!item.strokeEnabled ? 'opacity-40 pointer-events-none' : ''}">
                        <span>Độ dày nét:</span>
                        <div class="flex items-center space-x-2 w-36">
                            <input type="range" min="1" max="10" step="1" value="${item.strokeWidth || 3}" oninput="updateCustomTextProp(${gIdx}, ${fIdx}, 'strokeWidth', parseInt(this.value, 10))" class="w-full accent-amber-500">
                            <span class="w-6 text-right font-mono font-bold">${item.strokeWidth || 3}px</span>
                        </div>
                    </div>
                </div>

                <!-- Đổ bóng chữ (Shadow) -->
                <div class="p-2 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                    <div class="flex items-center justify-between">
                        <label class="flex items-center space-x-1.5 cursor-pointer">
                            <input type="checkbox" ${item.shadowEnabled ? 'checked' : ''} onchange="updateCustomTextProp(${gIdx}, ${fIdx}, 'shadowEnabled', this.checked)" class="rounded text-amber-500">
                            <span class="text-[11px] font-bold text-slate-200">Đổ bóng chữ (Drop Shadow)</span>
                        </label>
                        <input type="color" value="${item.shadowColor || '#000000'}" onchange="updateCustomTextProp(${gIdx}, ${fIdx}, 'shadowColor', this.value)" class="w-6 h-6 rounded cursor-pointer border-0 bg-transparent ${!item.shadowEnabled ? 'opacity-40' : ''}">
                    </div>
                    <div class="flex items-center justify-between text-[10px] text-slate-400 ${!item.shadowEnabled ? 'opacity-40 pointer-events-none' : ''}">
                        <span>Độ nhòe bóng:</span>
                        <div class="flex items-center space-x-2 w-36">
                            <input type="range" min="0" max="20" step="1" value="${item.shadowBlur !== undefined ? item.shadowBlur : 6}" oninput="updateCustomTextProp(${gIdx}, ${fIdx}, 'shadowBlur', parseInt(this.value, 10))" class="w-full accent-amber-500">
                            <span class="w-6 text-right font-mono font-bold">${item.shadowBlur !== undefined ? item.shadowBlur : 6}px</span>
                        </div>
                    </div>
                    <div class="flex items-center space-x-1 pt-1 ${!item.shadowEnabled ? 'opacity-40 pointer-events-none' : ''}">
                        <span class="text-[9px] text-slate-400">Hướng bóng:</span>
                        <button onclick="setCustomTextShadowPreset(${gIdx}, ${fIdx}, 3, 3, 6)" class="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-semibold">Dưới-Phải</button>
                        <button onclick="setCustomTextShadowPreset(${gIdx}, ${fIdx}, 0, 4, 6)" class="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-semibold">Trực-Diện</button>
                        <button onclick="setCustomTextShadowPreset(${gIdx}, ${fIdx}, 0, 0, 10)" class="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-semibold">Tỏa Đều</button>
                    </div>
                </div>
            </div>

            <!-- NHÓM 3: HỘP NỀN (CARD BOX), VỆT HIGHLIGHT & BO GÓC -->
            <div class="space-y-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 shadow">
                <span class="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <i data-lucide="square" class="w-3.5 h-3.5 text-emerald-400"></i>
                    <span>3. Hộp Nền (Box), Highlight & Bo Góc</span>
                </span>

                <!-- Màu nền thẻ -->
                <div class="flex items-center justify-between bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                    <span class="text-slate-300 font-semibold text-[11px]">Nền hộp thẻ:</span>
                    <div class="flex items-center space-x-2">
                        <button onclick="updateCustomTextProp(${gIdx}, ${fIdx}, 'boxBgColor', 'transparent')" class="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-[9px] font-bold">Trong suốt</button>
                        <input type="color" value="${(item.boxBgColor && item.boxBgColor !== 'transparent') ? item.boxBgColor : '#0f172a'}" onchange="updateCustomTextProp(${gIdx}, ${fIdx}, 'boxBgColor', this.value)" class="w-7 h-7 rounded cursor-pointer border-0 bg-transparent">
                    </div>
                </div>

                <!-- Vệt Highlight chữ -->
                <div class="p-2 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                    <div class="flex items-center justify-between">
                        <span class="text-[11px] font-bold text-slate-200">Vệt Highlight chữ:</span>
                        <div class="flex items-center space-x-1.5">
                            <button onclick="updateCustomTextProp(${gIdx}, ${fIdx}, 'highlightColor', 'transparent')" class="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-[9px]">Tắt</button>
                            <input type="color" value="${(item.highlightColor && item.highlightColor !== 'transparent') ? item.highlightColor : '#fde047'}" onchange="updateCustomTextProp(${gIdx}, ${fIdx}, 'highlightColor', this.value)" class="w-6 h-6 rounded cursor-pointer border-0 bg-transparent">
                        </div>
                    </div>
                    <div class="flex items-center space-x-1">
                        <span class="text-[9px] text-slate-400">Chọn nhanh:</span>
                        <button onclick="updateCustomTextProp(${gIdx}, ${fIdx}, 'highlightColor', '#fde047')" class="w-5 h-5 rounded bg-yellow-300 border border-yellow-500 shadow-sm" title="Vàng dạ quang"></button>
                        <button onclick="updateCustomTextProp(${gIdx}, ${fIdx}, 'highlightColor', '#86efac')" class="w-5 h-5 rounded bg-emerald-300 border border-emerald-500 shadow-sm" title="Xanh mint"></button>
                        <button onclick="updateCustomTextProp(${gIdx}, ${fIdx}, 'highlightColor', '#fdba74')" class="w-5 h-5 rounded bg-orange-300 border border-orange-500 shadow-sm" title="Cam pastel"></button>
                        <button onclick="updateCustomTextProp(${gIdx}, ${fIdx}, 'highlightColor', '#f472b6')" class="w-5 h-5 rounded bg-pink-400 border border-pink-500 shadow-sm" title="Hồng phấn"></button>
                    </div>
                </div>

                <!-- Bo góc & Padding -->
                <div class="grid grid-cols-2 gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div>
                        <label class="text-[9px] text-slate-400 block mb-1">Bo góc viền (Radius)</label>
                        <div class="flex items-center space-x-1">
                            <button onclick="updateCustomTextProp(${gIdx}, ${fIdx}, 'boxRadius', 8)" class="px-1.5 py-0.5 rounded text-[9px] font-bold ${item.boxRadius === 8 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}">8px</button>
                            <button onclick="updateCustomTextProp(${gIdx}, ${fIdx}, 'boxRadius', 16)" class="px-1.5 py-0.5 rounded text-[9px] font-bold ${item.boxRadius === 16 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}">16px</button>
                            <button onclick="updateCustomTextProp(${gIdx}, ${fIdx}, 'boxRadius', 99)" class="px-1.5 py-0.5 rounded text-[9px] font-bold ${item.boxRadius >= 50 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}">Pill</button>
                        </div>
                    </div>
                    <div>
                        <label class="text-[9px] text-slate-400 block mb-1">Đệm viền (Padding)</label>
                        <input type="number" min="0" max="50" step="2" value="${item.boxPadding !== undefined ? item.boxPadding : 12}" onchange="updateCustomTextProp(${gIdx}, ${fIdx}, 'boxPadding', parseInt(this.value, 10))" class="w-full bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 text-xs text-center font-bold">
                    </div>
                </div>

                <!-- Tự co giãn ôm khít chữ -->
                <label class="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 cursor-pointer">
                    <span class="text-[11px] font-semibold text-slate-200">Tự ôm sát chữ vừa khít (shrinkToFit):</span>
                    <input type="checkbox" ${item.shrinkToFit !== false ? 'checked' : ''} onchange="updateCustomTextProp(${gIdx}, ${fIdx}, 'shrinkToFit', this.checked)" class="rounded text-indigo-600">
                </label>
            </div>

            <!-- NHÓM 4: VỊ TRÍ, CĂN LỀ & TIỀN TỐ / HẬU TỐ -->
            <div class="space-y-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 shadow">
                <span class="text-[10px] font-extrabold text-sky-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <i data-lucide="layout" class="w-3.5 h-3.5 text-sky-400"></i>
                    <span>4. Vị Trí, Căn Lề & Tiền Tố / Hậu Tố</span>
                </span>

                <!-- Chế độ tọa độ -->
                <label class="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 cursor-pointer">
                    <span class="text-[11px] font-bold text-sky-300">Tọa độ tự do (Pixel X, Y, W, H):</span>
                    <input type="checkbox" ${item.useCustomCoords ? 'checked' : ''} onchange="updateCustomTextProp(${gIdx}, ${fIdx}, 'useCustomCoords', this.checked)" class="rounded text-sky-500">
                </label>

                ${item.useCustomCoords ? `
                <div class="grid grid-cols-2 gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div>
                        <label class="text-[9px] text-slate-400 block mb-0.5">Tọa độ X (px)</label>
                        <input type="number" step="10" value="${item.posX !== undefined ? item.posX : 120}" onchange="updateCustomTextProp(${gIdx}, ${fIdx}, 'posX', parseInt(this.value, 10))" class="w-full bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 text-xs font-mono">
                    </div>
                    <div>
                        <label class="text-[9px] text-slate-400 block mb-0.5">Tọa độ Y (px)</label>
                        <input type="number" step="10" value="${item.posY !== undefined ? item.posY : 120}" onchange="updateCustomTextProp(${gIdx}, ${fIdx}, 'posY', parseInt(this.value, 10))" class="w-full bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 text-xs font-mono">
                    </div>
                    <div>
                        <label class="text-[9px] text-slate-400 block mb-0.5">Chiều Rộng (W px)</label>
                        <input type="number" step="10" value="${item.width !== undefined ? item.width : 520}" onchange="updateCustomTextProp(${gIdx}, ${fIdx}, 'width', parseInt(this.value, 10))" class="w-full bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 text-xs font-mono">
                    </div>
                    <div>
                        <label class="text-[9px] text-slate-400 block mb-0.5">Chiều Cao (H px)</label>
                        <input type="number" step="10" value="${item.height !== undefined ? item.height : 120}" onchange="updateCustomTextProp(${gIdx}, ${fIdx}, 'height', parseInt(this.value, 10))" class="w-full bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 text-xs font-mono">
                    </div>
                </div>
                ` : `
                <div class="text-[9px] text-slate-400 italic bg-slate-950/60 p-1.5 rounded border border-slate-800">
                    Đang bố trí tự động theo Cột ${paragraphGridConfig.groups[gIdx].targetColumn || 1} của Lớp ${gIdx + 1}. Bật công tắc phía trên nếu muốn kéo thả pixel tự do.
                </div>
                `}

                <!-- Căn lề ngang -->
                <div class="flex items-center justify-between bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                    <span class="text-slate-300 font-semibold text-[11px]">Căn lề chữ:</span>
                    <div class="flex items-center space-x-1">
                        <button onclick="updateCustomTextProp(${gIdx}, ${fIdx}, 'hAlign', 'left')" class="px-2 py-0.5 rounded text-[10px] font-bold ${(!item.hAlign || item.hAlign === 'left') ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}">Trái</button>
                        <button onclick="updateCustomTextProp(${gIdx}, ${fIdx}, 'hAlign', 'center')" class="px-2 py-0.5 rounded text-[10px] font-bold ${item.hAlign === 'center' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}">Giữa</button>
                        <button onclick="updateCustomTextProp(${gIdx}, ${fIdx}, 'hAlign', 'right')" class="px-2 py-0.5 rounded text-[10px] font-bold ${item.hAlign === 'right' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}">Phải</button>
                    </div>
                </div>

                <!-- Tự động phóng to theo khung (Auto-Scale) -->
                <label class="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-teal-500/40 cursor-pointer">
                    <div>
                        <div class="flex items-center space-x-1.5">
                            <span class="text-[11px] font-extrabold text-teal-300">Tự phóng to theo khung (Auto-Scale)</span>
                            <span class="text-[8px] bg-teal-500 text-black px-1 rounded font-black">AI Fit</span>
                        </div>
                        <p class="text-[9px] text-slate-400">Tự co giãn cỡ chữ lớn nhất vừa vặn khít khung</p>
                    </div>
                    <input type="checkbox" ${item.autoScale ? 'checked' : ''} onchange="updateCustomTextProp(${gIdx}, ${fIdx}, 'autoScale', this.checked)" class="rounded text-teal-500">
                </label>

                <!-- Tiền tố & Hậu tố -->
                <div class="p-2 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                    <span class="text-[10px] font-bold text-slate-300 block">Tiền tố & Hậu tố (Prefix / Suffix):</span>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-[9px] text-slate-400 block mb-0.5">Tiền tố (Prefix)</label>
                            <input type="text" value="${item.prefix || ''}" oninput="updateCustomTextProp(${gIdx}, ${fIdx}, 'prefix', this.value)" placeholder="Vd: Q: hoặc 👉" class="w-full bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 text-xs font-semibold">
                        </div>
                        <div>
                            <label class="text-[9px] text-slate-400 block mb-0.5">Hậu tố (Suffix)</label>
                            <input type="text" value="${item.suffix || ''}" oninput="updateCustomTextProp(${gIdx}, ${fIdx}, 'suffix', this.value)" placeholder="Vd: ? hoặc (Đáp án)" class="w-full bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 text-xs font-semibold">
                        </div>
                    </div>
                    <div class="flex items-center space-x-1 pt-1">
                        <span class="text-[9px] text-slate-400">Nhanh:</span>
                        <button onclick="applyCustomTextPrefixQuick(${gIdx}, ${fIdx}, 'Q:')" class="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded text-[9px] font-bold">Q:</button>
                        <button onclick="applyCustomTextPrefixQuick(${gIdx}, ${fIdx}, 'A:')" class="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded text-[9px] font-bold">A:</button>
                        <button onclick="applyCustomTextPrefixQuick(${gIdx}, ${fIdx}, '👉')" class="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded text-[9px]">👉</button>
                        <button onclick="applyCustomTextSuffixQuick(${gIdx}, ${fIdx}, '?')" class="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded text-[9px] font-bold">?</button>
                        <button onclick="applyCustomTextSuffixQuick(${gIdx}, ${fIdx}, '!')" class="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded text-[9px] font-bold">!</button>
                        <button onclick="applyCustomTextPrefixQuick(${gIdx}, ${fIdx}, ''); applyCustomTextSuffixQuick(${gIdx}, ${fIdx}, '')" class="text-rose-400 hover:text-rose-300 text-[9px] font-semibold ml-auto">Xóa</button>
                    </div>
                </div>
            </div>

            <!-- THAO TÁC THẺ: NHÂN BẢN & XÓA -->
            <div class="flex items-center space-x-2 pt-1">
                <button onclick="duplicateCustomTextItem(${gIdx}, ${fIdx})" class="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg font-bold text-xs flex items-center justify-center space-x-1 transition">
                    <i data-lucide="copy" class="w-3.5 h-3.5 text-teal-400"></i>
                    <span>Nhân Bản Thẻ</span>
                </button>
                <button onclick="deleteCustomTextItem(${gIdx}, ${fIdx})" class="py-1.5 px-3 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 text-rose-300 rounded-lg font-bold text-xs flex items-center justify-center space-x-1 transition">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5 text-rose-400"></i>
                    <span>Xóa</span>
                </button>
            </div>
        </div>
    `;

    if (window.lucide && lucide.createIcons) lucide.createIcons();
}

var ttsCustomTextDebounce = null;

function setTtsSourceMode(gIdx, fIdx, mode) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];
    item.sourceMode = mode;
    if (typeof autoRecalculateAudioLayersDuration === 'function') autoRecalculateAudioLayersDuration();
    if (typeof renderTimelineLayersListUI === 'function') renderTimelineLayersListUI();
    if (typeof renderTimelineTracksUI === 'function') renderTimelineTracksUI();
    renderTtsInspectorRibbon(item, gIdx, fIdx);
}

function updateTtsCustomText(gIdx, fIdx, text) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];
    item.customText = text;

    const statsEl = document.getElementById('tts-custom-text-stats');
    if (statsEl) {
        const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
        statsEl.innerText = `${words} từ • ${text.length} ký tự`;
    }

    if (ttsCustomTextDebounce) clearTimeout(ttsCustomTextDebounce);
    ttsCustomTextDebounce = setTimeout(() => {
        if (typeof autoRecalculateAudioLayersDuration === 'function') autoRecalculateAudioLayersDuration();
        if (typeof renderTimelineLayersListUI === 'function') renderTimelineLayersListUI();
        if (typeof renderTimelineTracksUI === 'function') renderTimelineTracksUI();
    }, 250);
}

function clearTtsCustomText(gIdx, fIdx) {
    const input = document.getElementById('tts-custom-text-input');
    if (input) input.value = '';
    updateTtsCustomText(gIdx, fIdx, '');
    const grp = paragraphGridConfig.groups[gIdx];
    if (grp && grp.fields[fIdx]) {
        renderTtsInspectorRibbon(grp.fields[fIdx], gIdx, fIdx);
    }
}

function renderTtsInspectorRibbon(item, gIdx, fIdx) {
    const body = document.getElementById('inspector-panel-body');
    const targetLabel = document.getElementById('inspector-target-label');
    if (!body) return;

    if (targetLabel) {
        targetLabel.innerHTML = `<span class="flex items-center space-x-1"><i data-lucide="volume-2" class="w-3 h-3 text-indigo-400"></i><span>AI Đọc TTS (Lớp ${gIdx + 1})</span></span>`;
        targetLabel.className = "text-[9px] font-extrabold bg-indigo-950 text-indigo-300 border border-indigo-700/80 px-2 py-0.5 rounded";
    }

    const sourceMode = item.sourceMode || 'fields'; // 'fields' | 'custom'
    const curFields = item.ttsSpeakFields || [];
    const customText = item.customText || '';

    const allTextFields = (typeof excelColumnsList !== 'undefined' && excelColumnsList.length > 0)
        ? excelColumnsList.filter(c => !c.toLowerCase().includes('anh') && !c.toLowerCase().includes('dinh_kem'))
        : ['Sentence', 'Phonetic', 'Vietnamese meaning', 'Example sentence', 'Substitution words'];

    const checkboxesHtml = allTextFields.map(tf => {
        const isChecked = curFields.includes(tf);
        return `
            <label class="flex items-center space-x-2 p-1.5 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer hover:border-indigo-500 transition">
                <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleTTSMultiFieldSelection(${gIdx}, ${fIdx}, '${tf}', this.checked)" class="rounded bg-slate-900 border-slate-700 text-indigo-500 w-3.5 h-3.5 focus:ring-0">
                <span class="text-[10px] font-bold text-slate-200 truncate">{{${tf}}}</span>
            </label>
        `;
    }).join('');

    const wordCount = customText.trim() ? customText.trim().split(/\s+/).filter(Boolean).length : 0;
    const charCount = customText.length;

    body.innerHTML = `
        <div class="space-y-3 text-xs">
            <div class="space-y-2.5 bg-slate-900 p-2.5 rounded-xl border border-indigo-500/50 shadow">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <i data-lucide="volume-2" class="w-3.5 h-3.5 text-indigo-400"></i>
                        <span>Cài Đặt Giọng Đọc AI (TTS)</span>
                    </span>
                    <span class="text-[9px] text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded font-bold border border-indigo-800">
                        ${sourceMode === 'custom' ? `${wordCount} từ` : `${curFields.length} trường chọn`}
                    </span>
                </div>

                <!-- CHUYỂN ĐỔI CHẾ ĐỘ NGUỒN ĐỌC -->
                <div class="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px] font-bold">
                    <button type="button" onclick="setTtsSourceMode(${gIdx}, ${fIdx}, 'fields')" class="py-1.5 px-2 rounded-md transition flex items-center justify-center space-x-1 ${sourceMode === 'fields' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}">
                        <i data-lucide="table" class="w-3 h-3"></i>
                        <span>Từ Cột Excel</span>
                    </button>
                    <button type="button" onclick="setTtsSourceMode(${gIdx}, ${fIdx}, 'custom')" class="py-1.5 px-2 rounded-md transition flex items-center justify-center space-x-1 ${sourceMode === 'custom' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}">
                        <i data-lucide="edit-3" class="w-3 h-3"></i>
                        <span>Đoạn Text Tự Nhập</span>
                    </button>
                </div>

                <!-- NỘI DUNG CHẾ ĐỘ 1: TỪ CỘT EXCEL -->
                <div id="tts-mode-fields-panel" class="${sourceMode === 'fields' ? 'space-y-2' : 'hidden'}">
                    <p class="text-[10px] text-slate-400 leading-normal">Tích chọn các trường dữ liệu mà AI sẽ ghép nối lại thành đoạn audio đọc:</p>
                    <div class="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto p-1.5 bg-slate-950 rounded-lg border border-slate-800">
                        ${checkboxesHtml}
                    </div>
                </div>

                <!-- NỘI DUNG CHẾ ĐỘ 2: ĐOẠN TEXT TỰ NHẬP -->
                <div id="tts-mode-custom-panel" class="${sourceMode === 'custom' ? 'space-y-2' : 'hidden'}">
                    <div class="flex items-center justify-between">
                        <label class="text-[10px] text-slate-300 font-bold block">Nhập đoạn văn bản cần đọc:</label>
                        <span id="tts-custom-text-stats" class="text-[9px] text-amber-400 font-mono font-bold">${wordCount} từ • ${charCount} ký tự</span>
                    </div>
                    <textarea 
                        id="tts-custom-text-input" 
                        rows="3" 
                        oninput="updateTtsCustomText(${gIdx}, ${fIdx}, this.value)" 
                        placeholder="Nhập câu tiếng Anh hoặc hướng dẫn để AI đọc (Ví dụ: Listen carefully and repeat after the tone)..." 
                        class="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-slate-100 text-xs font-normal focus:ring-0 resize-y leading-relaxed"
                    >${customText}</textarea>
                    <div class="flex items-center justify-between text-[9px] text-slate-400">
                        <span>AI sẽ đọc chính xác đoạn text này và tự khóa độ dài Timeline.</span>
                        <button type="button" onclick="clearTtsCustomText(${gIdx}, ${fIdx})" class="text-rose-400 hover:text-rose-300 hover:underline">Xóa text</button>
                    </div>
                </div>

                <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                    <button id="btn-ribbon-preview-tts" type="button" onclick="previewCurrentTTSVoice()" class="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center space-x-1.5 transition shadow active:scale-95">
                        <i data-lucide="play" class="w-3.5 h-3.5"></i>
                        <span>Nghe thử AI</span>
                    </button>
                    <button type="button" onclick="removeFieldItemFromGroup(${gIdx}, ${fIdx}); selectedTtsTarget = null; renderInspectorRibbon(); renderTimelineLayersListUI();" class="py-1 px-2 text-rose-400 hover:text-white hover:bg-rose-950/60 rounded font-bold transition">
                        ✕ Xóa thẻ này
                    </button>
                </div>
            </div>
        </div>
    `;
    if (window.lucide && lucide.createIcons) lucide.createIcons();
}

/**
 * Quản lý trạng thái Accordion & Danh sách tích chọn đối tượng trong các kịch bản
 */
var batchStyleAccordionOpen = false;
var batchStyleSelectedTargets = new Set(); // chứa chuỗi "profileId:::targetKey"

function toggleBatchStyleAccordion() {
    batchStyleAccordionOpen = !batchStyleAccordionOpen;
    const content = document.getElementById('batch-style-accordion-content');
    const chevron = document.getElementById('batch-style-chevron-icon');
    if (content) {
        if (batchStyleAccordionOpen) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    }
    if (chevron) {
        chevron.style.transform = batchStyleAccordionOpen ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

/**
 * Trả về danh sách kịch bản hợp lệ hiện có
 */
function getBatchStyleProfilesList() {
    if (typeof syncCurrentActiveProfileState === 'function') {
        syncCurrentActiveProfileState();
    }
    if (!Array.isArray(savedParagraphProfiles) || savedParagraphProfiles.length === 0) {
        if (typeof paragraphGridConfig !== 'undefined' && paragraphGridConfig) {
            return [paragraphGridConfig];
        }
        return [];
    }
    return savedParagraphProfiles;
}

/**
 * Đồng bộ trạng thái kịch bản đang mở vào mảng savedParagraphProfiles
 */
function syncCurrentActiveProfileState() {
    if (typeof activeParagraphProfileId !== 'undefined' && activeParagraphProfileId && Array.isArray(savedParagraphProfiles)) {
        const curProf = savedParagraphProfiles.find(p => p.id === activeParagraphProfileId);
        if (curProf) {
            if (typeof paragraphFieldStyles !== 'undefined') {
                curProf.fieldStyles = JSON.parse(JSON.stringify(paragraphFieldStyles));
            }
            if (typeof paragraphGridConfig !== 'undefined' && paragraphGridConfig.groups) {
                curProf.groups = JSON.parse(JSON.stringify(paragraphGridConfig.groups));
                curProf.gridMatrix = JSON.parse(JSON.stringify(paragraphGridConfig.gridMatrix || []));
                curProf.presentationMode = paragraphGridConfig.presentationMode;
                curProf.loopBlockGap = paragraphGridConfig.loopBlockGap;
            }
            if (typeof masterTimelineDuration !== 'undefined') {
                curProf.masterDuration = masterTimelineDuration;
            }
        }
    }
}

/**
 * Lấy danh sách các đối tượng có thể định dạng trong một kịch bản theo loại type
 */
function getEligibleObjectsInProfile(prof, type) {
    const list = [];
    if (!prof) return list;

    if (type === 'excel_text') {
        // Thu thập các trường text từ fieldStyles và groups
        const keysSet = new Set();
        if (prof.fieldStyles) {
            Object.keys(prof.fieldStyles).forEach(k => {
                const isImg = k.toLowerCase().includes('anh') || k.toLowerCase().includes('dinh_kem') || (prof.fieldStyles[k] && prof.fieldStyles[k].type === 'image');
                if (!isImg) keysSet.add(k);
            });
        }
        if (Array.isArray(prof.groups)) {
            prof.groups.forEach(g => {
                if (Array.isArray(g.fields)) {
                    g.fields.forEach(f => {
                        if (f.type === 'field' && f.key) {
                            const isImg = f.key.toLowerCase().includes('anh') || f.key.toLowerCase().includes('dinh_kem');
                            if (!isImg) keysSet.add(f.key);
                        }
                    });
                }
            });
        }
        keysSet.forEach(k => {
            list.push({
                targetKey: k,
                label: `{{${k}}}`,
                subLabel: 'Trường văn bản',
                type: 'excel_text'
            });
        });
    } else if (type === 'excel_image') {
        const keysSet = new Set();
        if (prof.fieldStyles) {
            Object.keys(prof.fieldStyles).forEach(k => {
                const isImg = k.toLowerCase().includes('anh') || k.toLowerCase().includes('dinh_kem') || (prof.fieldStyles[k] && prof.fieldStyles[k].type === 'image');
                if (isImg) keysSet.add(k);
            });
        }
        if (Array.isArray(prof.groups)) {
            prof.groups.forEach(g => {
                if (Array.isArray(g.fields)) {
                    g.fields.forEach(f => {
                        if (f.type === 'field' && f.key) {
                            const isImg = f.key.toLowerCase().includes('anh') || f.key.toLowerCase().includes('dinh_kem');
                            if (isImg) keysSet.add(f.key);
                        }
                    });
                }
            });
        }
        keysSet.forEach(k => {
            list.push({
                targetKey: k,
                label: `{{${k}}}`,
                subLabel: 'Khung hình ảnh',
                type: 'excel_image'
            });
        });
    } else if (type === 'custom_text') {
        if (Array.isArray(prof.groups)) {
            prof.groups.forEach((g, gi) => {
                if (Array.isArray(g.fields)) {
                    g.fields.forEach((f, fi) => {
                        if (f.type === 'custom_text') {
                            const snippet = (f.text || 'Chữ Tự Do').substring(0, 20);
                            list.push({
                                targetKey: `ct_${gi}_${fi}`,
                                gIdx: gi,
                                fIdx: fi,
                                label: `"${snippet}"`,
                                subLabel: `Lớp ${gi + 1} • Chữ tự do`,
                                type: 'custom_text'
                            });
                        }
                    });
                }
            });
        }
    } else if (type === 'countdown') {
        if (Array.isArray(prof.groups)) {
            prof.groups.forEach((g, gi) => {
                if (Array.isArray(g.fields)) {
                    g.fields.forEach((f, fi) => {
                        if (f.type === 'countdown') {
                            list.push({
                                targetKey: `cd_${gi}_${fi}`,
                                gIdx: gi,
                                fIdx: fi,
                                label: `Đồng hồ (${f.seconds || 3}s)`,
                                subLabel: `Lớp ${gi + 1} • Preset: ${f.preset || 'green_to_red'}`,
                                type: 'countdown'
                            });
                        }
                    });
                }
            });
        }
    } else if (type === 'progress_tracker') {
        if (Array.isArray(prof.groups)) {
            prof.groups.forEach((g, gi) => {
                if (Array.isArray(g.fields)) {
                    g.fields.forEach((f, fi) => {
                        if (f.type === 'progress_tracker') {
                            list.push({
                                targetKey: `pt_${gi}_${fi}`,
                                gIdx: gi,
                                fIdx: fi,
                                label: `Tiến độ (${f.textTemplate || 'Câu {STT}/{Tổng_câu}'})`,
                                subLabel: `Lớp ${gi + 1} • Kiểu: ${f.displayMode || 'both'}`,
                                type: 'progress_tracker'
                            });
                        }
                    });
                }
            });
        }
    } else if (type === 'audio_sfx') {
        if (Array.isArray(prof.groups)) {
            prof.groups.forEach((g, gi) => {
                if (Array.isArray(g.fields)) {
                    g.fields.forEach((f, fi) => {
                        if (f.type === 'audio_sfx') {
                            list.push({
                                targetKey: `sfx_${gi}_${fi}`,
                                gIdx: gi,
                                fIdx: fi,
                                label: `SFX: ${f.soundType || 'ding'}`,
                                subLabel: `Lớp ${gi + 1} • Âm lượng: ${f.volume !== undefined ? f.volume : 80}%`,
                                type: 'audio_sfx'
                            });
                        }
                    });
                }
            });
        }
    }
    return list;
}

/**
 * Xử lý khi người dùng click vào một mục đối tượng trong accordion:
 * 1. Chuyển sang kịch bản đó (loadSelectedParagraphProfile) để xem trước ngay trên khung review
 * 2. Tạm thời áp dụng định dạng nguồn vào đối tượng đó để xem trước trực tiếp trên Canvas
 */
function previewBatchStyleTarget(profileId, type, targetKey, gIdx, fIdx) {
    syncCurrentActiveProfileState();

    // 1. Chuyển kịch bản đang hiển thị nếu khác kịch bản hiện tại
    if (activeParagraphProfileId !== profileId && typeof loadSelectedParagraphProfile === 'function') {
        loadSelectedParagraphProfile(profileId);
    }

    // 2. Tạm thời nạp định dạng từ đối tượng mẫu sang đối tượng này trong kịch bản để xem trước ngay
    applyCurrentStylesToSpecificTarget(type, profileId, targetKey, gIdx, fIdx);

    // 3. Render lại Canvas và timeline
    if (typeof drawParagraphCanvasFrame === 'function') drawParagraphCanvasFrame();
    if (typeof renderTimelineLayersListUI === 'function') renderTimelineLayersListUI();
    if (typeof renderTimelineTracksUI === 'function') renderTimelineTracksUI();

    // Cập nhật nhãn thông báo
    if (typeof showToast === 'function') {
        const prof = (savedParagraphProfiles || []).find(p => p.id === profileId) || paragraphGridConfig;
        showToast(`Đang xem trước định dạng trên: "${prof ? prof.name : 'Kịch bản'}"`, 'info');
    }
}

/**
 * Bật/tắt checkbox của 1 đối tượng cụ thể
 */
function toggleBatchTargetCheckbox(profileId, targetKey, isChecked) {
    const itemKey = `${profileId}:::${targetKey}`;
    if (isChecked) {
        batchStyleSelectedTargets.add(itemKey);
    } else {
        batchStyleSelectedTargets.delete(itemKey);
    }
    updateBatchStyleCountBadge();
}

/**
 * Chọn tất cả / Bỏ chọn tất cả đối tượng trong toàn bộ kịch bản
 */
function toggleBatchSelectAllTargets(type, selectAll) {
    const profiles = getBatchStyleProfilesList();
    profiles.forEach(prof => {
        const items = getEligibleObjectsInProfile(prof, type);
        items.forEach(item => {
            const itemKey = `${prof.id}:::${item.targetKey}`;
            if (selectAll) {
                batchStyleSelectedTargets.add(itemKey);
            } else {
                batchStyleSelectedTargets.delete(itemKey);
            }
        });
    });

    // Cập nhật lại các checkbox trên UI
    document.querySelectorAll('.batch-target-checkbox').forEach(cb => {
        cb.checked = selectAll;
    });
    updateBatchStyleCountBadge();
}

function updateBatchStyleCountBadge() {
    const badge = document.getElementById('batch-style-count-badge');
    if (badge) {
        badge.innerText = `${batchStyleSelectedTargets.size} đã chọn`;
    }
}

/**
 * Áp dụng kiểu dáng hiện tại sang 1 đối tượng cụ thể trong kịch bản chỉ định
 */
function applyCurrentStylesToSpecificTarget(type, profileId, targetKey, gIdx, fIdx) {
    const prof = (savedParagraphProfiles || []).find(p => p.id === profileId) || (activeParagraphProfileId === profileId ? paragraphGridConfig : null);
    if (!prof) return;

    if (type === 'excel_text') {
        const activeKey = paragraphSelectedFieldKey || (selectedFieldKeysList && selectedFieldKeysList[0]) || "Substitution words";
        const srcSt = paragraphFieldStyles[activeKey] || paragraphFieldStyles["Substitution words"];
        if (!srcSt) return;

        const textProps = [
            'font', 'style', 'size', 'color', 'highlightColor', 'highlightPaddingX', 'highlightPaddingY',
            'hAlign', 'vAlign', 'lineSpacing', 'underline', 'indentLeft', 'indentRight', 'spaceBefore',
            'spaceAfter', 'boxBgColor', 'boxRadius', 'boxPadding', 'textWrap', 'shrinkToFit'
        ];

        if (!prof.fieldStyles) prof.fieldStyles = {};
        if (!prof.fieldStyles[targetKey]) prof.fieldStyles[targetKey] = {};

        textProps.forEach(p => {
            if (srcSt[p] !== undefined) {
                prof.fieldStyles[targetKey][p] = srcSt[p];
            }
        });

        // Nếu kịch bản này đang là kịch bản hiện hành, đồng bộ luôn paragraphFieldStyles
        if (activeParagraphProfileId === profileId && typeof paragraphFieldStyles !== 'undefined') {
            if (!paragraphFieldStyles[targetKey]) paragraphFieldStyles[targetKey] = {};
            textProps.forEach(p => {
                if (srcSt[p] !== undefined) {
                    paragraphFieldStyles[targetKey][p] = srcSt[p];
                }
            });
        }
    } else if (type === 'excel_image') {
        const activeKey = paragraphSelectedFieldKey || "ten_file_dinh_kem";
        const srcSt = paragraphFieldStyles[activeKey] || {};
        const imgProps = ['width', 'height', 'posX', 'posY', 'boxRadius', 'opacity'];

        if (!prof.fieldStyles) prof.fieldStyles = {};
        if (!prof.fieldStyles[targetKey]) prof.fieldStyles[targetKey] = {};

        imgProps.forEach(p => {
            if (srcSt[p] !== undefined) {
                prof.fieldStyles[targetKey][p] = srcSt[p];
            }
        });

        if (activeParagraphProfileId === profileId && typeof paragraphFieldStyles !== 'undefined') {
            if (!paragraphFieldStyles[targetKey]) paragraphFieldStyles[targetKey] = {};
            imgProps.forEach(p => {
                if (srcSt[p] !== undefined) {
                    paragraphFieldStyles[targetKey][p] = srcSt[p];
                }
            });
        }
    } else if (type === 'custom_text') {
        if (!selectedCustomTextTarget) return;
        const srcGrp = paragraphGridConfig.groups && paragraphGridConfig.groups[selectedCustomTextTarget.gIdx];
        const srcItem = (srcGrp && srcGrp.fields) ? srcGrp.fields[selectedCustomTextTarget.fIdx] : null;
        if (!srcItem) return;

        const targetGrp = prof.groups && prof.groups[gIdx];
        const targetItem = (targetGrp && targetGrp.fields) ? targetGrp.fields[fIdx] : null;
        if (targetItem && targetItem.type === 'custom_text') {
            // Áp dụng toàn bộ định dạng: vị trí, kích thước, tọa độ tự do, phông chữ, màu sắc, viền nét, đổ bóng, hộp nền, bo góc, căn lề, tiền tố/hậu tố...
            // TUYỆT ĐỐI KHÔNG ghi đè nội dung văn bản (targetItem.text), id, type
            Object.keys(srcItem).forEach(p => {
                if (p !== 'id' && p !== 'type' && p !== 'text') {
                    targetItem[p] = srcItem[p];
                }
            });
            if (srcItem.useCustomCoords !== undefined) targetItem.useCustomCoords = srcItem.useCustomCoords;
            if (srcItem.posX !== undefined) targetItem.posX = srcItem.posX;
            if (srcItem.posY !== undefined) targetItem.posY = srcItem.posY;
            if (srcItem.width !== undefined) targetItem.width = srcItem.width;
            if (srcItem.height !== undefined) targetItem.height = srcItem.height;
            if (srcItem.prefix !== undefined) targetItem.prefix = srcItem.prefix;
            if (srcItem.suffix !== undefined) targetItem.suffix = srcItem.suffix;
        }

        // Nếu kịch bản này đang là kịch bản hiện hành, đồng bộ trực tiếp sang bộ nhớ paragraphGridConfig
        if (activeParagraphProfileId === profileId && paragraphGridConfig && paragraphGridConfig.groups && paragraphGridConfig.groups[gIdx]) {
            const activeTargetItem = paragraphGridConfig.groups[gIdx].fields && paragraphGridConfig.groups[gIdx].fields[fIdx];
            if (activeTargetItem && activeTargetItem.type === 'custom_text') {
                Object.keys(srcItem).forEach(p => {
                    if (p !== 'id' && p !== 'type' && p !== 'text') {
                        activeTargetItem[p] = srcItem[p];
                    }
                });
                if (srcItem.useCustomCoords !== undefined) activeTargetItem.useCustomCoords = srcItem.useCustomCoords;
                if (srcItem.posX !== undefined) activeTargetItem.posX = srcItem.posX;
                if (srcItem.posY !== undefined) activeTargetItem.posY = srcItem.posY;
                if (srcItem.width !== undefined) activeTargetItem.width = srcItem.width;
                if (srcItem.height !== undefined) activeTargetItem.height = srcItem.height;
                if (srcItem.prefix !== undefined) activeTargetItem.prefix = srcItem.prefix;
                if (srcItem.suffix !== undefined) activeTargetItem.suffix = srcItem.suffix;
            }
        }
    } else if (type === 'countdown') {
        if (!selectedCountdownTarget) return;
        const srcGrp = paragraphGridConfig.groups && paragraphGridConfig.groups[selectedCountdownTarget.gIdx];
        const srcItem = (srcGrp && srcGrp.fields) ? srcGrp.fields[selectedCountdownTarget.fIdx] : null;
        if (!srcItem) return;

        const countdownProps = [
            'preset', 'colorShift', 'enableTickSound', 'tickSoundType', 'tickVolume',
            'playEndChime', 'endSoundType', 'size', 'radius', 'fontSize', 'opacity',
            'bgColor', 'bgOpacity', 'textColor', 'textShadow', 'shadowColor',
            'textGlow', 'glowColor', 'textStroke', 'strokeColor', 'strokeWidth',
            'position', 'posX', 'posY', 'useCustomCoords', 'width', 'height'
        ];

        const targetGrp = prof.groups && prof.groups[gIdx];
        const targetItem = (targetGrp && targetGrp.fields) ? targetGrp.fields[fIdx] : null;
        if (targetItem && targetItem.type === 'countdown') {
            countdownProps.forEach(p => {
                if (srcItem[p] !== undefined) {
                    targetItem[p] = srcItem[p];
                }
            });
        }

        if (activeParagraphProfileId === profileId && paragraphGridConfig && paragraphGridConfig.groups && paragraphGridConfig.groups[gIdx]) {
            const activeTargetItem = paragraphGridConfig.groups[gIdx].fields && paragraphGridConfig.groups[gIdx].fields[fIdx];
            if (activeTargetItem && activeTargetItem.type === 'countdown') {
                countdownProps.forEach(p => {
                    if (srcItem[p] !== undefined) {
                        activeTargetItem[p] = srcItem[p];
                    }
                });
            }
        }
    } else if (type === 'progress_tracker') {
        if (!selectedProgressTrackerTarget) return;
        const srcGrp = paragraphGridConfig.groups && paragraphGridConfig.groups[selectedProgressTrackerTarget.gIdx];
        const srcItem = (srcGrp && srcGrp.fields) ? srcGrp.fields[selectedProgressTrackerTarget.fIdx] : null;
        if (!srcItem) return;

        const trackerProps = [
            'displayMode', 'textTemplate', 'position', 'barThickness', 'borderRadius',
            'borderWidth', 'opacity', 'fontSize', 'fontWeight', 'pillBgColor', 'pillBgOpacity',
            'borderColor', 'borderOpacity', 'barColor', 'barBgColor', 'barBgOpacity', 'textColor', 'shadow',
            'posX', 'posY', 'useCustomCoords', 'width', 'height'
        ];

        const targetGrp = prof.groups && prof.groups[gIdx];
        const targetItem = (targetGrp && targetGrp.fields) ? targetGrp.fields[fIdx] : null;
        if (targetItem && targetItem.type === 'progress_tracker') {
            trackerProps.forEach(p => {
                if (srcItem[p] !== undefined) {
                    targetItem[p] = srcItem[p];
                }
            });
        }

        if (activeParagraphProfileId === profileId && paragraphGridConfig && paragraphGridConfig.groups && paragraphGridConfig.groups[gIdx]) {
            const activeTargetItem = paragraphGridConfig.groups[gIdx].fields && paragraphGridConfig.groups[gIdx].fields[fIdx];
            if (activeTargetItem && activeTargetItem.type === 'progress_tracker') {
                trackerProps.forEach(p => {
                    if (srcItem[p] !== undefined) {
                        activeTargetItem[p] = srcItem[p];
                    }
                });
            }
        }
    } else if (type === 'audio_sfx') {
        if (!selectedAudioSfxTarget) return;
        const srcGrp = paragraphGridConfig.groups && paragraphGridConfig.groups[selectedAudioSfxTarget.gIdx];
        const srcItem = (srcGrp && srcGrp.fields) ? srcGrp.fields[selectedAudioSfxTarget.fIdx] : null;
        if (!srcItem) return;

        const sfxProps = ['soundType', 'volume', 'ducking'];
        const targetGrp = prof.groups && prof.groups[gIdx];
        const targetItem = (targetGrp && targetGrp.fields) ? targetGrp.fields[fIdx] : null;
        if (targetItem && targetItem.type === 'audio_sfx') {
            sfxProps.forEach(p => {
                if (srcItem[p] !== undefined) {
                    if (p === 'soundType' && srcItem[p] === 'custom') return;
                    targetItem[p] = srcItem[p];
                }
            });
        }
    }
}

/**
 * Sinh khối giao diện Accordion danh sách kịch bản & đối tượng cùng loại
 */
function renderBatchStyleAccordionUI(type) {
    const profiles = getBatchStyleProfilesList();
    const typeNames = {
        excel_text: { title: 'Thẻ Chữ Excel', color: 'emerald', border: 'border-emerald-500/50', bg: 'from-emerald-950/80 to-indigo-950/80', text: 'text-emerald-300', btn: 'bg-emerald-600 hover:bg-emerald-500' },
        excel_image: { title: 'Thẻ Khung Ảnh', color: 'amber', border: 'border-amber-500/50', bg: 'from-amber-950/80 to-yellow-950/80', text: 'text-amber-300', btn: 'bg-amber-600 hover:bg-amber-500' },
        custom_text: { title: 'Thẻ Chữ Tự Do', color: 'teal', border: 'border-teal-500/50', bg: 'from-teal-950/80 to-emerald-950/80', text: 'text-teal-300', btn: 'bg-teal-600 hover:bg-teal-500' },
        countdown: { title: 'Thẻ Đồng Hồ', color: 'rose', border: 'border-rose-500/50', bg: 'from-rose-950/80 to-amber-950/80', text: 'text-rose-300', btn: 'bg-rose-600 hover:bg-rose-500' },
        progress_tracker: { title: 'Thẻ Tiến Độ', color: 'teal', border: 'border-emerald-500/50', bg: 'from-emerald-950/80 to-teal-950/80', text: 'text-emerald-300', btn: 'bg-emerald-600 hover:bg-emerald-500' },
        audio_sfx: { title: 'Thẻ Âm Thanh SFX', color: 'purple', border: 'border-purple-500/50', bg: 'from-purple-950/80 to-indigo-950/80', text: 'text-purple-300', btn: 'bg-purple-600 hover:bg-purple-500' }
    };
    const tConfig = typeNames[type] || typeNames.excel_text;

    let totalEligibleCount = 0;
    profiles.forEach(p => {
        totalEligibleCount += getEligibleObjectsInProfile(p, type).length;
    });

    return `
        <!-- BẢNG ĐIỀU KHIỂN ĐỒNG BỘ ĐỊNH DẠNG HÀNG LOẠT (ACCORDION DRAWER) -->
        <div class="bg-gradient-to-r ${tConfig.bg} border ${tConfig.border} rounded-xl p-2.5 mb-2.5 shadow-sm space-y-2">
            <!-- Header thanh Accordion -->
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center space-x-2 min-w-0 cursor-pointer" onclick="toggleBatchStyleAccordion()">
                    <div class="p-1.5 rounded-lg bg-black/30 ${tConfig.text} shrink-0">
                        <i data-lucide="layers" class="w-4 h-4"></i>
                    </div>
                    <div class="truncate">
                        <div class="flex items-center space-x-1.5">
                            <span class="text-[11px] font-extrabold ${tConfig.text} truncate">Đồng Bộ Định Dạng Mọi Kịch Bản</span>
                            <span id="batch-style-count-badge" class="text-[8px] bg-black/40 px-1.5 py-0.5 rounded font-bold text-slate-300 border border-slate-700/60">${batchStyleSelectedTargets.size} đã chọn</span>
                        </div>
                        <span class="block text-[8.5px] text-slate-300/80 truncate">Tích chọn để áp dụng cho ${totalEligibleCount} đối tượng qua ${profiles.length} kịch bản</span>
                    </div>
                </div>

                <div class="flex items-center space-x-1 shrink-0">
                    <button type="button" onclick="applyCurrentStylesToAllSameType('${type}')" class="py-1.5 px-2.5 ${tConfig.btn} text-white rounded-lg text-[10px] font-black flex items-center space-x-1 transition shadow active:scale-95" title="Áp dụng định dạng cho các đối tượng đã tích chọn">
                        <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
                        <span>Áp Dụng Tất Cả</span>
                    </button>
                    <button type="button" onclick="toggleBatchStyleAccordion()" class="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition" title="Mở/Thu gọn danh sách kịch bản">
                        <i id="batch-style-chevron-icon" data-lucide="chevron-down" class="w-4 h-4 transition-transform duration-200" style="transform: ${batchStyleAccordionOpen ? 'rotate(180deg)' : 'rotate(0deg)'}"></i>
                    </button>
                </div>
            </div>

            <!-- Ngăn kéo danh sách kịch bản & đối tượng (Mặc định uncheck, bấm là preview ngay) -->
            <div id="batch-style-accordion-content" class="${batchStyleAccordionOpen ? '' : 'hidden'} pt-2 border-t border-white/10 space-y-2">
                <div class="flex items-center justify-between text-[9px]">
                    <span class="text-slate-300 font-bold">Danh sách kịch bản & đối tượng:</span>
                    <div class="flex items-center space-x-2">
                        <button type="button" onclick="toggleBatchSelectAllTargets('${type}', true)" class="text-amber-300 hover:underline font-bold">Chọn hết</button>
                        <span class="text-slate-500">|</span>
                        <button type="button" onclick="toggleBatchSelectAllTargets('${type}', false)" class="text-slate-400 hover:underline">Bỏ chọn hết</button>
                    </div>
                </div>

                <div class="max-h-56 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
                    ${profiles.map(prof => {
                        const items = getEligibleObjectsInProfile(prof, type);
                        const isActiveProf = (prof.id === activeParagraphProfileId);
                        if (items.length === 0) return '';

                        return `
                            <div class="bg-slate-950/80 border ${isActiveProf ? 'border-indigo-500/70' : 'border-slate-800'} rounded-lg p-2 space-y-1.5 shadow-inner">
                                <div class="flex items-center justify-between">
                                    <span class="text-[9.5px] font-extrabold ${isActiveProf ? 'text-indigo-300' : 'text-slate-200'} flex items-center space-x-1.5 truncate">
                                        <i data-lucide="film" class="w-3 h-3 ${isActiveProf ? 'text-indigo-400' : 'text-slate-400'} shrink-0"></i>
                                        <span class="truncate">${prof.name || 'Kịch bản'}</span>
                                        ${isActiveProf ? '<span class="text-[7px] bg-indigo-950 text-indigo-300 border border-indigo-700/80 px-1 rounded uppercase tracking-wider font-mono shrink-0">Đang mở</span>' : ''}
                                    </span>
                                    <span class="text-[8px] font-mono text-slate-400 shrink-0">${items.length} mục</span>
                                </div>

                                <div class="grid grid-cols-1 gap-1">
                                    ${items.map(item => {
                                        const itemKey = `${prof.id}:::${item.targetKey}`;
                                        const isChecked = batchStyleSelectedTargets.has(itemKey);
                                        const gIdxArg = item.gIdx !== undefined ? item.gIdx : 0;
                                        const fIdxArg = item.fIdx !== undefined ? item.fIdx : 0;

                                        return `
                                            <div class="flex items-center justify-between bg-slate-900/90 hover:bg-slate-850 p-1.5 rounded border border-slate-800/80 transition text-[9px] group">
                                                <div class="flex items-center space-x-2 min-w-0 flex-grow cursor-pointer" onclick="previewBatchStyleTarget('${prof.id}', '${type}', '${item.targetKey}', ${gIdxArg}, ${fIdxArg})" title="Nhấp để xem trước kịch bản này trên Canvas">
                                                    <i data-lucide="eye" class="w-3 h-3 text-slate-400 group-hover:text-amber-400 transition shrink-0"></i>
                                                    <div class="truncate">
                                                        <span class="font-bold text-slate-200 group-hover:text-amber-200 transition block truncate">${item.label}</span>
                                                        <span class="text-[7.5px] text-slate-400 block truncate">${item.subLabel}</span>
                                                    </div>
                                                </div>

                                                <label class="flex items-center space-x-1.5 cursor-pointer pl-2 border-l border-slate-800 shrink-0">
                                                    <input type="checkbox" class="batch-target-checkbox w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0 cursor-pointer" ${isChecked ? 'checked' : ''} onchange="toggleBatchTargetCheckbox('${prof.id}', '${item.targetKey}', this.checked)">
                                                </label>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="text-[8px] text-slate-400 italic text-center pt-0.5">
                    * Mẹo: Nhấp vào dòng đối tượng để xem trước ngay trên khung Canvas. Sau đó bấm "Áp Dụng Tất Cả" để lưu cho các mục đã tích chọn.
                </div>
            </div>
        </div>
    `;
}

/**
 * ÁP DỤNG CHUNG CHO CÁC THẺ / ĐỐI TƯỢNG ĐÃ CHỌN HOẶC TOÀN BỘ CÙNG LOẠI
 * Hỗ trợ đồng bộ xuyên suốt mọi kịch bản (savedParagraphProfiles)
 */
function applyCurrentStylesToAllSameType(type) {
    syncCurrentActiveProfileState();
    const profiles = getBatchStyleProfilesList();
    let appliedCount = 0;

    // Nếu người dùng có tích chọn một số đối tượng cụ thể trong Accordion
    if (batchStyleSelectedTargets.size > 0) {
        batchStyleSelectedTargets.forEach(itemKey => {
            const [profileId, targetKey] = itemKey.split(':::');
            if (!profileId || !targetKey) return;

            const prof = profiles.find(p => p.id === profileId) || (activeParagraphProfileId === profileId ? paragraphGridConfig : null);
            if (!prof) return;

            const items = getEligibleObjectsInProfile(prof, type);
            const foundItem = items.find(it => it.targetKey === targetKey);
            if (foundItem) {
                applyCurrentStylesToSpecificTarget(type, profileId, targetKey, foundItem.gIdx, foundItem.fIdx);
                appliedCount++;
            }
        });
        showToast(`Đã áp dụng thành công định dạng (vị trí, kích thước, kiểu dáng) cho ${appliedCount} đối tượng được chọn qua các kịch bản! (Giữ nguyên nội dung văn bản)`, "success");
    } else {
        // Mặc định nếu không có checkbox nào tích chọn riêng: áp dụng cho toàn bộ đối tượng cùng loại trong kịch bản hiện hành
        // VÀ hỏi người dùng hoặc áp dụng cho các kịch bản
        if (type === 'excel_text') {
            const activeKey = paragraphSelectedFieldKey || (selectedFieldKeysList && selectedFieldKeysList[0]) || "Substitution words";
            const srcSt = paragraphFieldStyles[activeKey] || paragraphFieldStyles["Substitution words"];
            if (!srcSt) {
                showToast("Không tìm thấy định dạng nguồn để áp dụng!", "error");
                return;
            }

            const textProps = [
                'font', 'style', 'size', 'color', 'highlightColor', 'highlightPaddingX', 'highlightPaddingY',
                'hAlign', 'vAlign', 'lineSpacing', 'underline', 'indentLeft', 'indentRight', 'spaceBefore',
                'spaceAfter', 'boxBgColor', 'boxRadius', 'boxPadding', 'textWrap', 'shrinkToFit'
            ];

            // Áp dụng cho mọi thẻ chữ trong paragraphFieldStyles
            Object.keys(paragraphFieldStyles).forEach(key => {
                const isImg = key.toLowerCase().includes('anh') || key.toLowerCase().includes('dinh_kem') || (paragraphFieldStyles[key] && paragraphFieldStyles[key].type === 'image');
                if (!isImg && key !== activeKey) {
                    textProps.forEach(p => {
                        if (srcSt[p] !== undefined) {
                            paragraphFieldStyles[key][p] = srcSt[p];
                        }
                    });
                    appliedCount++;
                }
            });

            // Khởi tạo luôn cho các cột văn bản Excel chưa có trong paragraphFieldStyles
            if (Array.isArray(excelColumnsList)) {
                excelColumnsList.forEach(col => {
                    const isImg = col.toLowerCase().includes('anh') || col.toLowerCase().includes('dinh_kem');
                    if (!isImg && !paragraphFieldStyles[col]) {
                        paragraphFieldStyles[col] = {};
                        textProps.forEach(p => {
                            if (srcSt[p] !== undefined) {
                                paragraphFieldStyles[col][p] = srcSt[p];
                            }
                        });
                        appliedCount++;
                    }
                });
            }

            showToast(`Đã áp dụng định dạng {{${activeKey}}} cho toàn bộ ${appliedCount + 1} thẻ chữ Excel!`, "success");
        } else if (type === 'excel_image') {
            const activeKey = paragraphSelectedFieldKey || "ten_file_dinh_kem";
            const srcSt = paragraphFieldStyles[activeKey] || {};
            const imgProps = ['width', 'height', 'posX', 'posY', 'boxRadius', 'opacity'];

            Object.keys(paragraphFieldStyles).forEach(key => {
                const isImg = key.toLowerCase().includes('anh') || key.toLowerCase().includes('dinh_kem') || (paragraphFieldStyles[key] && paragraphFieldStyles[key].type === 'image');
                if (isImg && key !== activeKey) {
                    imgProps.forEach(p => {
                        if (srcSt[p] !== undefined) {
                            paragraphFieldStyles[key][p] = srcSt[p];
                        }
                    });
                    appliedCount++;
                }
            });

            showToast(`Đã áp dụng thông số khung ảnh cho toàn bộ ${appliedCount + 1} thẻ hình ảnh!`, "success");
        } else if (type === 'custom_text') {
            if (!selectedCustomTextTarget) {
                showToast("Vui lòng chọn một Thẻ Chữ Tự Do để làm mẫu!", "error");
                return;
            }
            const { gIdx, fIdx } = selectedCustomTextTarget;
            const grp = paragraphGridConfig.groups && paragraphGridConfig.groups[gIdx];
            const srcItem = (grp && grp.fields) ? grp.fields[fIdx] : null;
            if (!srcItem) return;

            if (Array.isArray(paragraphGridConfig.groups)) {
                paragraphGridConfig.groups.forEach((g, gi) => {
                    if (Array.isArray(g.fields)) {
                        g.fields.forEach((f, fi) => {
                            if (f.type === 'custom_text' && (gi !== gIdx || fi !== fIdx)) {
                                Object.keys(srcItem).forEach(p => {
                                    if (p !== 'id' && p !== 'type' && p !== 'text') {
                                        f[p] = srcItem[p];
                                    }
                                });
                                if (srcItem.useCustomCoords !== undefined) f.useCustomCoords = srcItem.useCustomCoords;
                                if (srcItem.posX !== undefined) f.posX = srcItem.posX;
                                if (srcItem.posY !== undefined) f.posY = srcItem.posY;
                                if (srcItem.width !== undefined) f.width = srcItem.width;
                                if (srcItem.height !== undefined) f.height = srcItem.height;
                                if (srcItem.prefix !== undefined) f.prefix = srcItem.prefix;
                                if (srcItem.suffix !== undefined) f.suffix = srcItem.suffix;
                                appliedCount++;
                            }
                        });
                    }
                });
            }

            showToast(`Đã áp dụng định dạng (vị trí, kích thước, kiểu dáng) cho toàn bộ ${appliedCount + 1} thẻ Chữ Tự Do trong mọi lớp! (Giữ nguyên nội dung văn bản)`, "success");
        } else if (type === 'countdown') {
            if (!selectedCountdownTarget) {
                showToast("Vui lòng chọn một Thẻ Đồng Hồ để làm mẫu!", "error");
                return;
            }
            const { gIdx, fIdx } = selectedCountdownTarget;
            const grp = paragraphGridConfig.groups && paragraphGridConfig.groups[gIdx];
            const srcItem = (grp && grp.fields) ? grp.fields[fIdx] : null;
            if (!srcItem) return;

            const countdownProps = [
                'preset', 'colorShift', 'enableTickSound', 'tickSoundType', 'tickVolume',
                'playEndChime', 'endSoundType', 'size', 'radius', 'fontSize', 'opacity',
                'bgColor', 'bgOpacity', 'textColor', 'textShadow', 'shadowColor',
                'textGlow', 'glowColor', 'textStroke', 'strokeColor', 'strokeWidth',
                'position', 'posX', 'posY', 'useCustomCoords', 'width', 'height'
            ];

            if (Array.isArray(paragraphGridConfig.groups)) {
                paragraphGridConfig.groups.forEach((g, gi) => {
                    if (Array.isArray(g.fields)) {
                        g.fields.forEach((f, fi) => {
                            if (f.type === 'countdown' && (gi !== gIdx || fi !== fIdx)) {
                                countdownProps.forEach(p => {
                                    if (srcItem[p] !== undefined) {
                                        f[p] = srcItem[p];
                                    }
                                });
                                appliedCount++;
                            }
                        });
                    }
                });
            }

            showToast(`Đã áp dụng giao diện & vị trí cho toàn bộ ${appliedCount + 1} thẻ Đồng Hồ Đếm Ngược!`, "success");
        } else if (type === 'progress_tracker') {
            if (!selectedProgressTrackerTarget) {
                showToast("Vui lòng chọn một Thẻ Tiến Độ để làm mẫu!", "error");
                return;
            }
            const { gIdx, fIdx } = selectedProgressTrackerTarget;
            const grp = paragraphGridConfig.groups && paragraphGridConfig.groups[gIdx];
            const srcItem = (grp && grp.fields) ? grp.fields[fIdx] : null;
            if (!srcItem) return;

            const trackerProps = [
                'displayMode', 'textTemplate', 'position', 'barThickness', 'borderRadius',
                'borderWidth', 'opacity', 'fontSize', 'fontWeight', 'pillBgColor', 'pillBgOpacity',
                'borderColor', 'borderOpacity', 'barColor', 'barBgColor', 'barBgOpacity', 'textColor', 'shadow',
                'posX', 'posY', 'useCustomCoords', 'width', 'height'
            ];

            if (Array.isArray(paragraphGridConfig.groups)) {
                paragraphGridConfig.groups.forEach((g, gi) => {
                    if (Array.isArray(g.fields)) {
                        g.fields.forEach((f, fi) => {
                            if (f.type === 'progress_tracker' && (gi !== gIdx || fi !== fIdx)) {
                                trackerProps.forEach(p => {
                                    if (srcItem[p] !== undefined) {
                                        f[p] = srcItem[p];
                                    }
                                });
                                appliedCount++;
                            }
                        });
                    }
                });
            }

            showToast(`Đã áp dụng cài đặt cho toàn bộ ${appliedCount + 1} thẻ Tiến Độ!`, "success");
        } else if (type === 'audio_sfx') {
            if (!selectedAudioSfxTarget) {
                showToast("Vui lòng chọn một Thẻ SFX để làm mẫu!", "error");
                return;
            }
            const { gIdx, fIdx } = selectedAudioSfxTarget;
            const grp = paragraphGridConfig.groups && paragraphGridConfig.groups[gIdx];
            const srcItem = (grp && grp.fields) ? grp.fields[fIdx] : null;
            if (!srcItem) return;

            const sfxProps = ['soundType', 'volume', 'ducking'];

            if (Array.isArray(paragraphGridConfig.groups)) {
                paragraphGridConfig.groups.forEach((g, gi) => {
                    if (Array.isArray(g.fields)) {
                        g.fields.forEach((f, fi) => {
                            if (f.type === 'audio_sfx' && (gi !== gIdx || fi !== fIdx)) {
                                sfxProps.forEach(p => {
                                    if (srcItem[p] !== undefined) {
                                        if (p === 'soundType' && srcItem[p] === 'custom') return;
                                        f[p] = srcItem[p];
                                    }
                                });
                                appliedCount++;
                            }
                        });
                    }
                });
            }

            showToast(`Đã áp dụng âm lượng & cài đặt cho toàn bộ ${appliedCount + 1} thẻ Âm Thanh SFX!`, "success");
        }
    }

    // Đồng bộ lại vào profile lưu trữ & lưu hệ thống
    syncCurrentActiveProfileState();
    if (typeof saveFullSystemState === 'function') saveFullSystemState();
    if (typeof renderTimelineLayersListUI === 'function') renderTimelineLayersListUI();
    if (typeof renderTimelineTracksUI === 'function') renderTimelineTracksUI();
    if (typeof drawParagraphCanvasFrame === 'function') drawParagraphCanvasFrame();
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
    renderInspectorRibbon();
}

function renderInspectorRibbon() {
    const body = document.getElementById('inspector-panel-body');
    const targetLabel = document.getElementById('inspector-target-label');
    if (!body) return;

    // KIỂM TRA NẾU ĐANG CHỌN THẺ CHỮ TỰ DO
    if (selectedCustomTextTarget) {
        const { gIdx, fIdx } = selectedCustomTextTarget;
        const grp = paragraphGridConfig.groups[gIdx];
        const item = (grp && grp.fields) ? grp.fields[fIdx] : null;
        if (item && item.type === 'custom_text') {
            renderCustomTextInspectorRibbon(item, gIdx, fIdx);
            return;
        } else {
            selectedCustomTextTarget = null;
        }
    }

    // KIỂM TRA NẾU ĐANG CHỌN THẺ TTS
    if (selectedTtsTarget) {
        const { gIdx, fIdx } = selectedTtsTarget;
        const grp = paragraphGridConfig.groups[gIdx];
        const item = (grp && grp.fields) ? grp.fields[fIdx] : null;
        if (item && item.type === 'tts') {
            renderTtsInspectorRibbon(item, gIdx, fIdx);
            return;
        } else {
            selectedTtsTarget = null;
        }
    }

    // KIỂM TRA NẾU ĐANG CHỌN THẺ ĐẾM NGƯỢC
    if (selectedCountdownTarget) {
        const { gIdx, fIdx } = selectedCountdownTarget;
        const grp = paragraphGridConfig.groups[gIdx];
        const item = (grp && grp.fields) ? grp.fields[fIdx] : null;
        if (item && item.type === 'countdown') {
            renderCountdownInspectorRibbon(item, gIdx, fIdx);
            return;
        } else {
            selectedCountdownTarget = null;
        }
    }

    // KIỂM TRA NẾU ĐANG CHỌN THẺ TIẾN ĐỘ
    if (selectedProgressTrackerTarget) {
        const { gIdx, fIdx } = selectedProgressTrackerTarget;
        const grp = paragraphGridConfig.groups[gIdx];
        const item = (grp && grp.fields) ? grp.fields[fIdx] : null;
        if (item && item.type === 'progress_tracker') {
            renderProgressTrackerInspectorRibbon(item, gIdx, fIdx);
            return;
        } else {
            selectedProgressTrackerTarget = null;
        }
    }

    // KIỂM TRA NẾU ĐANG CHỌN THẺ ÂM THANH SFX
    if (selectedAudioSfxTarget) {
        const { gIdx, fIdx } = selectedAudioSfxTarget;
        const grp = paragraphGridConfig.groups[gIdx];
        const item = (grp && grp.fields) ? grp.fields[fIdx] : null;
        if (item && item.type === 'audio_sfx') {
            renderAudioSfxInspectorRibbon(item, gIdx, fIdx);
            return;
        } else {
            selectedAudioSfxTarget = null;
        }
    }

    const activeKey = paragraphSelectedFieldKey || (selectedFieldKeysList[0] || "Substitution words");
    const st = paragraphFieldStyles[activeKey] || paragraphFieldStyles["Substitution words"];

    if (targetLabel) {
        targetLabel.innerText = selectedFieldKeysList.length > 1 ? `${selectedFieldKeysList.length} trường` : `{{${activeKey}}}`;
        targetLabel.className = "text-[9px] font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded";
    }

    // BẢNG THÔNG SỐ ĐIỀU KHIỂN HÌNH ẢNH DÀNH RIÊNG CHO ten_file_dinh_kem
    if (st.type === 'image' || activeKey === 'ten_file_dinh_kem' || activeKey.toLowerCase().includes('dinh_kem')) {
        const posX = st.posX !== undefined ? st.posX : 1300;
        const posY = st.posY !== undefined ? st.posY : 100;
        const imgW = st.width !== undefined ? st.width : 520;
        const imgH = st.height !== undefined ? st.height : 880;
        const radius = st.boxRadius !== undefined ? st.boxRadius : 20;
        const opacity = st.opacity !== undefined ? st.opacity : 100;

        body.innerHTML = `
            <div class="space-y-3 bg-slate-900 p-3 rounded-xl border border-amber-500/50 text-xs">
                <!-- NÚT ÁP DỤNG CHUNG CHO TOÀN BỘ THẺ ẢNH (ACCORDION MỌI KỊCH BẢN) -->
                ${renderBatchStyleAccordionUI('excel_image')}

                <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span class="font-extrabold text-amber-300 flex items-center space-x-1.5">
                        <i data-lucide="image" class="w-4 h-4 text-amber-400"></i>
                        <span>Thông Số Khung Ảnh (Pixel)</span>
                    </span>
                    <span class="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-bold">1920x1080</span>
                </div>

                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="text-[10px] text-slate-300 font-bold block mb-0.5">Vị trí X (px):</label>
                        <input type="number" value="${posX}" step="10" onchange="applyMultiFieldProp('posX', parseInt(this.value))" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 font-bold text-amber-300 text-xs">
                    </div>
                    <div>
                        <label class="text-[10px] text-slate-300 font-bold block mb-0.5">Vị trí Y (px):</label>
                        <input type="number" value="${posY}" step="10" onchange="applyMultiFieldProp('posY', parseInt(this.value))" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 font-bold text-amber-300 text-xs">
                    </div>
                    <div>
                        <label class="text-[10px] text-slate-300 font-bold block mb-0.5">Chiều Rộng (Width px):</label>
                        <input type="number" value="${imgW}" step="10" min="20" onchange="applyMultiFieldProp('width', parseInt(this.value))" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 font-bold text-emerald-300 text-xs">
                    </div>
                    <div>
                        <label class="text-[10px] text-slate-300 font-bold block mb-0.5">Chiều Cao (Height px):</label>
                        <input type="number" value="${imgH}" step="10" min="20" onchange="applyMultiFieldProp('height', parseInt(this.value))" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 font-bold text-emerald-300 text-xs">
                    </div>
                    <div class="col-span-2">
                        <div class="flex justify-between items-center mb-0.5">
                            <label class="text-[10px] text-slate-300 font-bold">Bo Góc (Border Radius px):</label>
                            <span class="font-mono text-[10px] text-indigo-300 font-bold">${radius}px</span>
                        </div>
                        <input type="range" min="0" max="150" value="${radius}" oninput="applyMultiFieldProp('boxRadius', parseInt(this.value))" class="w-full accent-amber-500 cursor-pointer">
                    </div>
                    <div class="col-span-2">
                        <div class="flex justify-between items-center mb-0.5">
                            <label class="text-[10px] text-slate-300 font-bold">Độ Mờ Đục (Opacity %):</label>
                            <span class="font-mono text-[10px] text-amber-300 font-bold">${opacity}%</span>
                        </div>
                        <input type="range" min="0" max="100" value="${opacity}" oninput="applyMultiFieldProp('opacity', parseInt(this.value))" class="w-full accent-amber-500 cursor-pointer">
                    </div>
                </div>

                <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                    <button onclick="applyMultiFieldProp('posX', 1300); applyMultiFieldProp('posY', 100); applyMultiFieldProp('width', 520); applyMultiFieldProp('height', 880); renderInspectorRibbon();" class="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold">Đặt Lại Chuẩn Cột Phải</button>
                    <button onclick="applyMultiFieldProp('posX', 60); applyMultiFieldProp('posY', 100); applyMultiFieldProp('width', 600); applyMultiFieldProp('height', 880); renderInspectorRibbon();" class="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold">Chuyển Sang Trái</button>
                </div>
            </div>
        `;
        if (window.lucide && lucide.createIcons) lucide.createIcons();
        return;
    }

    const isBold = st.style === 'bold' || st.style === 'extrabold';
    const isItalic = st.style === 'italic';
    const isUnderline = !!st.underline;

    const curPadX = st.highlightPaddingX !== undefined ? st.highlightPaddingX : 8;
    const curPadY = st.highlightPaddingY !== undefined ? st.highlightPaddingY : 4;

    body.innerHTML = `
        <!-- NÚT ÁP DỤNG CHUNG CHO TOÀN BỘ THẺ CHỮ EXCEL (ACCORDION MỌI KỊCH BẢN) -->
        ${renderBatchStyleAccordionUI('excel_text')}

        <div class="space-y-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
            <span class="text-[9px] font-bold text-indigo-300 uppercase tracking-wider block">1. Phông Chữ & Màu Sắc</span>
            <div class="flex flex-wrap items-center gap-1">
                <select onchange="applyMultiFieldProp('font', this.value)" class="bg-slate-950 border border-slate-700 rounded-lg p-1 text-[11px] text-slate-200 font-semibold">
                    <option value="Quicksand" ${st.font === 'Quicksand' ? 'selected' : ''}>Quicksand</option>
                    <option value="Plus Jakarta Sans" ${st.font === 'Plus Jakarta Sans' ? 'selected' : ''}>Plus Jakarta Sans</option>
                    <option value="Nunito" ${st.font === 'Nunito' ? 'selected' : ''}>Nunito</option>
                    <option value="Inter" ${st.font === 'Inter' ? 'selected' : ''}>Inter</option>
                    <option value="Courier Prime" ${st.font === 'Courier Prime' ? 'selected' : ''}>Courier Prime</option>
                </select>
                <div class="flex items-center space-x-1 bg-slate-950 border border-slate-700 rounded-lg p-1">
                    <input type="number" value="${st.size}" onchange="applyMultiFieldProp('size', parseInt(this.value))" class="w-8 bg-transparent text-center font-bold text-slate-200 text-xs">
                    <span class="text-[8px] text-slate-500">px</span>
                </div>
                <div class="flex items-center bg-slate-950 border border-slate-700 rounded-lg p-0.5 space-x-0.5">
                    <button onclick="toggleMultiFieldStyle('bold')" class="p-1 rounded font-black text-[10px] min-w-[20px] ${isBold ? 'btn-tb-active' : 'text-slate-300 hover:bg-slate-800'}">B</button>
                    <button onclick="toggleMultiFieldStyle('italic')" class="p-1 rounded italic font-serif text-[10px] min-w-[20px] ${isItalic ? 'btn-tb-active' : 'text-slate-300 hover:bg-slate-800'}">I</button>
                    <button onclick="toggleMultiFieldStyle('underline')" class="p-1 rounded underline text-[10px] min-w-[20px] ${isUnderline ? 'btn-tb-active' : 'text-slate-300 hover:bg-slate-800'}">U</button>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-1.5 pt-1">
                <div class="flex items-center space-x-1 bg-slate-950 border border-slate-700 rounded-lg p-1">
                    <span class="text-[9px] font-bold text-slate-400 shrink-0">Màu Chữ:</span>
                    <input type="color" value="${st.color}" onchange="applyMultiFieldProp('color', this.value)" class="w-4 h-4 bg-transparent rounded cursor-pointer border-0 shrink-0">
                </div>
                <div class="flex items-center space-x-1 bg-slate-950 border border-slate-700 rounded-lg p-1">
                    <span class="text-[9px] font-bold text-slate-400 shrink-0">Highlight:</span>
                    <input type="color" value="${st.highlightColor === 'transparent' ? '#fde047' : st.highlightColor}" onchange="applyMultiFieldProp('highlightColor', this.value)" class="w-4 h-4 bg-transparent rounded cursor-pointer border-0 shrink-0">
                    <button onclick="applyMultiFieldProp('highlightColor', 'transparent')" class="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[7px] rounded font-bold shrink-0">Clear</button>
                </div>
            </div>

            <div class="p-2 bg-slate-950 rounded-lg border border-amber-500/40 space-y-1.5">
                <div class="flex items-center justify-between">
                    <span class="text-[9px] font-bold text-amber-300 uppercase">Kích Thước Vệt Highlight:</span>
                    <div class="flex items-center space-x-1">
                        <button onclick="setHighlightPresetSize(4, 2)" class="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[8px] font-bold rounded">Mảnh</button>
                        <button onclick="setHighlightPresetSize(8, 4)" class="px-1 py-0.5 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-[8px] font-bold rounded">Vừa</button>
                        <button onclick="setHighlightPresetSize(14, 8)" class="px-1 py-0.5 bg-amber-950/60 hover:bg-amber-900 text-amber-200 text-[8px] font-bold rounded">Dày</button>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-1.5">
                    <div>
                        <label class="text-[8px] text-slate-400 block">Dãn ngang (Padding X px):</label>
                        <input type="number" value="${curPadX}" onchange="applyMultiFieldProp('highlightPaddingX', parseInt(this.value))" class="w-full bg-slate-900 border border-slate-700 rounded p-1 font-bold text-amber-300 text-[10px]">
                    </div>
                    <div>
                        <label class="text-[8px] text-slate-400 block">Dãn dọc (Padding Y px):</label>
                        <input type="number" value="${curPadY}" onchange="applyMultiFieldProp('highlightPaddingY', parseInt(this.value))" class="w-full bg-slate-900 border border-slate-700 rounded p-1 font-bold text-amber-300 text-[10px]">
                    </div>
                </div>
            </div>

            <div class="flex items-center justify-between gap-1 pt-1">
                <div class="flex items-center bg-slate-950 border border-slate-700 rounded-lg p-0.5 space-x-0.5">
                    <button onclick="applyMultiFieldProp('hAlign', 'left')" class="p-1 rounded ${st.hAlign === 'left' ? 'btn-tb-active' : 'text-slate-400 hover:bg-slate-800'}"><i data-lucide="align-left" class="w-3 h-3"></i></button>
                    <button onclick="applyMultiFieldProp('hAlign', 'center')" class="p-1 rounded ${st.hAlign === 'center' ? 'btn-tb-active' : 'text-slate-400 hover:bg-slate-800'}"><i data-lucide="align-center" class="w-3 h-3"></i></button>
                    <button onclick="applyMultiFieldProp('hAlign', 'right')" class="p-1 rounded ${st.hAlign === 'right' ? 'btn-tb-active' : 'text-slate-400 hover:bg-slate-800'}"><i data-lucide="align-right" class="w-3 h-3"></i></button>
                </div>
                <div class="flex items-center space-x-1 bg-slate-950 border border-slate-700 rounded-lg px-1.5 py-0.5">
                    <span class="text-[9px] text-slate-400 font-bold">Dãn:</span>
                    <select onchange="applyMultiFieldProp('lineSpacing', parseFloat(this.value))" class="bg-transparent text-slate-200 font-bold text-[10px] border-0">
                        <option value="1.0" ${st.lineSpacing === 1.0 ? 'selected' : ''}>1.0</option>
                        <option value="1.25" ${st.lineSpacing === 1.25 ? 'selected' : ''}>1.25</option>
                        <option value="1.5" ${st.lineSpacing === 1.5 ? 'selected' : ''}>1.5</option>
                        <option value="2.0" ${st.lineSpacing === 2.0 ? 'selected' : ''}>2.0</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="space-y-1 bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[9px]">
            <span class="text-[9px] font-bold text-sky-400 uppercase tracking-wider block">2. Thụt Lề & Dãn Đoạn</span>
            <div class="grid grid-cols-2 gap-1.5">
                <div>
                    <label class="text-slate-400 block">Thụt Trái (px):</label>
                    <input type="number" value="${st.indentLeft || 0}" onchange="applyMultiFieldProp('indentLeft', parseInt(this.value))" class="w-full bg-slate-950 border border-slate-700 rounded p-1 font-bold text-slate-200">
                </div>
                <div>
                    <label class="text-slate-400 block">Thụt Phải (px):</label>
                    <input type="number" value="${st.indentRight || 0}" onchange="applyMultiFieldProp('indentRight', parseInt(this.value))" class="w-full bg-slate-950 border border-slate-700 rounded p-1 font-bold text-slate-200">
                </div>
                <div>
                    <label class="text-slate-400 block">Dãn Trên (px):</label>
                    <input type="number" value="${st.spaceBefore || 0}" onchange="applyMultiFieldProp('spaceBefore', parseInt(this.value))" class="w-full bg-slate-950 border border-slate-700 rounded p-1 font-bold text-slate-200">
                </div>
                <div>
                    <label class="text-slate-400 block">Dãn Dưới (px):</label>
                    <input type="number" value="${st.spaceAfter || 0}" onchange="applyMultiFieldProp('spaceAfter', parseInt(this.value))" class="w-full bg-slate-950 border border-slate-700 rounded p-1 font-bold text-slate-200">
                </div>
            </div>
        </div>

        <div class="space-y-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[9px]">
            <span class="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">3. Hộp Thẻ & Ôm Sát Chữ</span>
            <div class="grid grid-cols-2 gap-1.5">
                <div class="flex items-center space-x-1 bg-slate-950 border border-slate-700 rounded-lg p-1">
                    <span class="text-[9px] font-bold text-slate-400 shrink-0">Nền:</span>
                    <input type="color" value="${st.boxBgColor === 'transparent' ? '#FFFFFF' : st.boxBgColor}" onchange="applyMultiFieldProp('boxBgColor', this.value)" class="w-4 h-4 bg-transparent rounded cursor-pointer border-0 shrink-0">
                    <button onclick="applyMultiFieldProp('boxBgColor', 'transparent')" class="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[7px] rounded font-bold shrink-0">Clear</button>
                </div>
                <div>
                    <label class="text-slate-400 block">Bo Góc (px):</label>
                    <input type="number" value="${st.boxRadius !== undefined ? st.boxRadius : 18}" onchange="applyMultiFieldProp('boxRadius', parseInt(this.value))" class="w-full bg-slate-950 border border-slate-700 rounded p-1 font-bold text-slate-200">
                </div>
                <div class="col-span-2">
                    <label class="text-slate-400 block">Đệm Viền Trong (Padding px):</label>
                    <input type="number" value="${st.boxPadding !== undefined ? st.boxPadding : 12}" onchange="applyMultiFieldProp('boxPadding', parseInt(this.value))" class="w-full bg-slate-950 border border-slate-700 rounded p-1 font-bold text-slate-200">
                </div>
            </div>

            <div class="p-1.5 bg-slate-950 rounded-lg border border-indigo-500/30 flex items-center justify-between">
                <span class="text-indigo-300 font-bold text-[10px] flex items-center space-x-1">
                    <i data-lucide="shrink" class="w-3 h-3 text-indigo-400"></i>
                    <span>Tự ôm sát chữ vừa khít:</span>
                </span>
                <input type="checkbox" ${st.shrinkToFit !== false ? 'checked' : ''} onchange="applyMultiFieldProp('shrinkToFit', this.checked)" class="rounded bg-slate-900 border-indigo-500 text-indigo-500 focus:ring-0 cursor-pointer w-3.5 h-3.5">
            </div>
        </div>

        <div class="space-y-1 bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[9px]">
            <span class="text-[9px] font-bold text-purple-400 uppercase tracking-wider block">4. Bộ Mẫu Phối Màu Nhanh</span>
            <div class="grid grid-cols-2 gap-1">
                <button onclick="applyPresetToSelectedFields('yellowPill')" class="px-1.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[9px] font-bold transition">Vàng Pill</button>
                <button onclick="applyPresetToSelectedFields('creamCard')" class="px-1.5 py-1 bg-amber-950/40 hover:bg-amber-900/40 text-amber-200 border border-amber-700/40 rounded text-[9px] font-bold transition">Kem Pastel</button>
                <button onclick="applyPresetToSelectedFields('indigoIPA')" class="px-1.5 py-1 bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-300 border border-indigo-700/40 rounded text-[9px] font-bold transition">Tím IPA</button>
                <button onclick="applyPresetToSelectedFields('greyVN')" class="px-1.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded text-[9px] font-bold transition">Ghi Dịch</button>
            </div>
        </div>
    `;

    if (window.lucide && lucide.createIcons) lucide.createIcons();
}

function setHighlightPresetSize(padX, padY) {
    selectedFieldKeysList.forEach(k => {
        if (!paragraphFieldStyles[k]) paragraphFieldStyles[k] = { ...paragraphFieldStyles["Substitution words"] };
        paragraphFieldStyles[k].highlightPaddingX = padX;
        paragraphFieldStyles[k].highlightPaddingY = padY;
    });
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
    showToast(`Đã chọn kích thước Highlight: ${padX}x${padY}px`);
}

function applyPresetToSelectedFields(presetType) {
    selectedFieldKeysList.forEach(k => {
        if (!paragraphFieldStyles[k]) paragraphFieldStyles[k] = { ...paragraphFieldStyles["Substitution words"] };
        const st = paragraphFieldStyles[k];

        if (presetType === 'yellowPill') {
            st.color = '#000000'; st.boxBgColor = '#FFDC00'; st.boxRadius = 20; st.boxPadding = 14; st.font = 'Quicksand'; st.style = 'extrabold'; st.shrinkToFit = true;
        } else if (presetType === 'creamCard') {
            st.color = '#000000'; st.boxBgColor = '#FFEDD5'; st.boxRadius = 16; st.boxPadding = 12; st.font = 'Quicksand'; st.style = 'bold'; st.shrinkToFit = true;
        } else if (presetType === 'indigoIPA') {
            st.color = '#4F46E5'; st.boxBgColor = '#EEF2FF'; st.boxRadius = 14; st.boxPadding = 8; st.font = 'Quicksand'; st.style = 'bold'; st.shrinkToFit = true;
        } else if (presetType === 'greyVN') {
            st.color = '#1E293B'; st.boxBgColor = '#E2E8F0'; st.boxRadius = 14; st.boxPadding = 10; st.font = 'Quicksand'; st.style = 'normal'; st.shrinkToFit = true;
        } else if (presetType === 'transparentText') {
            st.color = '#FFFFFF'; st.boxBgColor = 'transparent'; st.boxRadius = 0; st.boxPadding = 4; st.font = 'Plus Jakarta Sans'; st.style = 'bold'; st.shrinkToFit = true;
        }
    });

    renderInspectorRibbon();
    drawParagraphCanvasFrame();
    showToast(`Đã áp dụng mẫu màu: ${presetType}!`);
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function applyMultiFieldProp(prop, val) {
    selectedFieldKeysList.forEach(k => {
        if (!paragraphFieldStyles[k]) paragraphFieldStyles[k] = { ...paragraphFieldStyles["Substitution words"] };
        paragraphFieldStyles[k][prop] = val;
    });
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function toggleMultiFieldStyle(styleType) {
    selectedFieldKeysList.forEach(k => {
        const st = paragraphFieldStyles[k];
        if (!st) return;
        if (styleType === 'bold') st.style = (st.style === 'bold' || st.style === 'extrabold') ? 'normal' : 'bold';
        else if (styleType === 'italic') st.style = (st.style === 'italic') ? 'normal' : 'italic';
        else if (styleType === 'underline') st.underline = !st.underline;
    });
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function renderMailMergeFieldChips() {
    const container = document.getElementById('mail-merge-chips-container');
    const totalCountBadge = document.getElementById('chips-total-count');
    if (!container) return;
    container.innerHTML = '';

    // Đảm bảo lấy duy nhất toàn bộ các trường của file Excel
    const uniqueFields = Array.from(new Set(excelColumnsList));
    if (totalCountBadge) totalCountBadge.innerText = `${uniqueFields.length} trường`;

    uniqueFields.forEach(col => {
        const isImage = col.toLowerCase().includes('anh') || col.toLowerCase().includes('dinh_kem');
        const chip = document.createElement('button');
        chip.onclick = () => onMailMergeChipClicked(col);

        if (isImage) {
            chip.className = "px-1.5 py-0.5 bg-amber-950/60 hover:bg-amber-900 border border-amber-700/60 text-amber-200 rounded text-[9px] font-bold transition flex items-center space-x-1 shadow active:scale-95";
            chip.innerHTML = `<i data-lucide="image" class="w-2.5 h-2.5 text-amber-400"></i><span>{{${col}}}</span>`;
        } else {
            chip.className = "px-1.5 py-0.5 bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 rounded text-[9px] font-bold transition flex items-center space-x-1 shadow active:scale-95";
            chip.innerHTML = `<i data-lucide="type" class="w-2.5 h-2.5 text-indigo-400"></i><span>{{${col}}}</span>`;
        }
        container.appendChild(chip);
    });
    if (window.lucide && lucide.createIcons) lucide.createIcons();
}

function onMailMergeChipClicked(fieldKey) {
    selectedCustomTextTarget = null;
    const grp = paragraphGridConfig.groups[paragraphSelectedGroupIdx];
    if (grp) {
        grp.fields.push({ type: "field", key: fieldKey });
    }

    if (!paragraphFieldStyles[fieldKey]) {
        const isImage = fieldKey.toLowerCase().includes('anh') || fieldKey.toLowerCase().includes('dinh_kem');
        if (isImage) {
            paragraphFieldStyles[fieldKey] = { type: 'image', hAlign: 'center', vAlign: 'middle', boxRadius: 20, opacity: 100 };
        } else {
            paragraphFieldStyles[fieldKey] = { 
                type: 'text', font: 'Quicksand', style: 'bold', size: 28, color: '#0f172a', highlightColor: 'transparent', 
                highlightPaddingX: 8, highlightPaddingY: 4,
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
    showToast(`Đã thêm {{${fieldKey}}} vào Lớp ${paragraphSelectedGroupIdx + 1}!`);
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function toggleAllFieldChipsVisibility() {
    const container = document.getElementById('mail-merge-chips-container');
    if (container) container.classList.toggle('hidden');
}

// Window global bindings for batch styling and preview
window.toggleBatchStyleAccordion = toggleBatchStyleAccordion;
window.previewBatchStyleTarget = previewBatchStyleTarget;
window.toggleBatchTargetCheckbox = toggleBatchTargetCheckbox;
window.toggleBatchSelectAllTargets = toggleBatchSelectAllTargets;
window.applyCurrentStylesToAllSameType = applyCurrentStylesToAllSameType;
window.renderBatchStyleAccordionUI = renderBatchStyleAccordionUI;

