/**
 * 7b_inspector_ribbon.js
 * Quản lý Ribbon định dạng (phông chữ, màu sắc, vệt highlight, thụt lề, preset) và thanh chèn thẻ Mail-Merge Chips
 */

var selectedCustomTextTarget = null;
var selectedTtsTarget = null;
var selectedCountdownTarget = null;
var selectedProgressTrackerTarget = null;
var selectedAudioSfxTarget = null;
var selectedLayerBorderTarget = null;

function toggleSelectFieldMulti(fKey, e) {
    selectedCustomTextTarget = null;
    selectedTtsTarget = null;
    selectedCountdownTarget = null;
    selectedProgressTrackerTarget = null;
    selectedAudioSfxTarget = null;
    selectedLayerBorderTarget = null;
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
    selectedLayerBorderTarget = null;
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
    selectedLayerBorderTarget = null;
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
    selectedLayerBorderTarget = null;
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
    selectedLayerBorderTarget = null;
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
    selectedLayerBorderTarget = null;
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
    selectedLayerBorderTarget = null;
    paragraphSelectedFieldKey = '__AUDIO_SFX__';
    if (typeof switchLeftSubTab === 'function') switchLeftSubTab(4);
    renderTimelineLayersListUI();
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
    showToast(`Đang cấu hình Thẻ Âm Thanh SFX trong Lớp ${gIdx + 1}!`);
}

function selectLayerBorderTarget(gIdx) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp) return;
    paragraphSelectedGroupIdx = gIdx;
    selectedLayerBorderTarget = { gIdx };
    selectedCustomTextTarget = null;
    selectedTtsTarget = null;
    selectedCountdownTarget = null;
    selectedProgressTrackerTarget = null;
    selectedAudioSfxTarget = null;
    paragraphSelectedFieldKey = '__LAYER_BORDER__';
    if (typeof ensureGroupBorderDefaults === 'function') ensureGroupBorderDefaults(grp);
    if (typeof switchLeftSubTab === 'function') switchLeftSubTab(4);
    renderTimelineLayersListUI();
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
    showToast(`Đang cài đặt Khung Viền & Hộp Lớp: "${grp.name || `Lớp ${gIdx + 1}`}"!`);
}

function updateGroupBorderProp(gIdx, prop, val, skipRibbonRerender = false) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp) return;
    if (typeof ensureGroupBorderDefaults === 'function') ensureGroupBorderDefaults(grp);
    grp[prop] = val;
    drawParagraphCanvasFrame();
    if (!skipRibbonRerender) {
        renderInspectorRibbon();
        renderTimelineLayersListUI();
    }
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function copyLayerBorderStyleToAll(srcGIdx) {
    const srcGrp = paragraphGridConfig.groups[srcGIdx];
    if (!srcGrp) return;
    if (typeof ensureGroupBorderDefaults === 'function') ensureGroupBorderDefaults(srcGrp);

    paragraphGridConfig.groups.forEach((grp, idx) => {
        if (idx !== srcGIdx) {
            if (typeof ensureGroupBorderDefaults === 'function') ensureGroupBorderDefaults(grp);
            grp.borderEnabled = srcGrp.borderEnabled;
            grp.borderColor = srcGrp.borderColor;
            grp.borderWidth = srcGrp.borderWidth;
            grp.borderStyle = srcGrp.borderStyle;
            grp.borderRadius = srcGrp.borderRadius;
            grp.borderPadding = srcGrp.borderPadding;
            grp.backgroundColor = srcGrp.backgroundColor;
            grp.backgroundOpacity = srcGrp.backgroundOpacity;
            grp.boxShadowEnabled = srcGrp.boxShadowEnabled;
            grp.boxShadowColor = srcGrp.boxShadowColor;
            grp.boxShadowBlur = srcGrp.boxShadowBlur;
        }
    });

    renderTimelineLayersListUI();
    renderInspectorRibbon();
    drawParagraphCanvasFrame();
    showToast(`Đã sao chép kiểu viền của "${srcGrp.name}" cho tất cả các lớp!`, "success");
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
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

function renderCountdownInspectorRibbon(item, gIdx, fIdx) {
    const body = document.getElementById('inspector-panel-body');
    const targetLabel = document.getElementById('inspector-target-label');
    if (!body) return;

    if (targetLabel) {
        targetLabel.innerHTML = `<span class="flex items-center space-x-1"><i data-lucide="timer" class="w-3 h-3 text-rose-400"></i><span>Đếm Ngược (Lớp ${gIdx + 1})</span></span>`;
        targetLabel.className = "text-[9px] font-extrabold bg-rose-950 text-rose-300 border border-rose-700/80 px-2 py-0.5 rounded";
    }

    const sec = item.seconds !== undefined ? item.seconds : 3;
    const pos = item.position || 'top_right';

    body.innerHTML = `
        <div class="space-y-3 text-xs">
            <div class="space-y-2.5 bg-slate-900 p-2.5 rounded-xl border border-rose-500/50 shadow">
                <span class="text-[10px] font-extrabold text-rose-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <i data-lucide="timer" class="w-3.5 h-3.5 text-rose-400"></i>
                    <span>Cài Đặt Đồng Hồ Đếm Ngược</span>
                </span>

                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="text-[9px] text-slate-400 block mb-0.5 font-bold">Số giây đếm ngược</label>
                        <input type="number" min="1" max="60" value="${sec}" onchange="updateCountdownProp(${gIdx}, ${fIdx}, 'seconds', parseInt(this.value, 10))" class="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-amber-300 font-bold text-center">
                    </div>
                    <div>
                        <label class="text-[9px] text-slate-400 block mb-0.5 font-bold">Vị trí hiển thị</label>
                        <select onchange="updateCountdownProp(${gIdx}, ${fIdx}, 'position', this.value)" class="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200 font-bold">
                            <option value="top_right" ${pos === 'top_right' ? 'selected' : ''}>Góc trên phải</option>
                            <option value="center" ${pos === 'center' ? 'selected' : ''}>Chính giữa màn hình</option>
                            <option value="bottom_center" ${pos === 'bottom_center' ? 'selected' : ''}>Dưới đáy màn hình</option>
                        </select>
                    </div>
                </div>

                <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                    <span class="text-[9px] text-slate-400 italic">Đếm ngược khớp theo thời lượng lớp.</span>
                    <button onclick="removeFieldItemFromGroup(${gIdx}, ${fIdx}); selectedCountdownTarget = null; renderInspectorRibbon(); renderTimelineLayersListUI();" class="py-1 px-2 text-rose-400 hover:text-white hover:bg-rose-950/60 rounded font-bold transition">
                        ✕ Xóa thẻ này
                    </button>
                </div>
            </div>
        </div>
    `;
    if (window.lucide && lucide.createIcons) lucide.createIcons();
}

function ptExtractHexAndAlpha(colorVal, defaultHex, defaultAlphaPct) {
    if (!colorVal) return { hex: defaultHex, alpha: defaultAlphaPct };
    if (colorVal.startsWith('#')) {
        return { hex: colorVal.slice(0, 7), alpha: defaultAlphaPct };
    }
    const match = colorVal.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
    if (match) {
        const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
        const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
        const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
        const a = match[4] !== undefined ? Math.round(parseFloat(match[4]) * 100) : defaultAlphaPct;
        return { hex: `#${r}${g}${b}`, alpha: a };
    }
    return { hex: defaultHex, alpha: defaultAlphaPct };
}

function renderProgressTrackerInspectorRibbon(item, gIdx, fIdx) {
    const body = document.getElementById('inspector-panel-body');
    const targetLabel = document.getElementById('inspector-target-label');
    if (!body) return;

    if (targetLabel) {
        targetLabel.innerHTML = `<span class="flex items-center space-x-1"><i data-lucide="sliders" class="w-3 h-3 text-emerald-400"></i><span>Tiến Độ (Lớp ${gIdx + 1})</span></span>`;
        targetLabel.className = "text-[9px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-700/80 px-2 py-0.5 rounded";
    }

    const mode = item.displayMode || 'both';
    const pos = item.position || 'top_bar';
    const isCustomPos = (pos === 'custom');
    const template = item.textTemplate || 'Câu {STT}/{Tổng_câu}';
    const barThick = item.barThickness !== undefined ? item.barThickness : 8;
    const bRadius = item.borderRadius !== undefined ? item.borderRadius : 14;
    const bWidth = item.borderWidth !== undefined ? item.borderWidth : 1.5;
    const opacity = item.opacity !== undefined ? item.opacity : 100;
    const fontSize = item.fontSize || 22;
    const fontWeight = item.fontWeight || 900;
    const boxW = item.boxWidth !== undefined ? item.boxWidth : 0;
    const boxH = item.boxHeight !== undefined ? item.boxHeight : 0;
    const posX = item.posX !== undefined ? item.posX : 1520;
    const posY = item.posY !== undefined ? item.posY : 30;
    const hasShadow = item.shadow !== false;

    const pillColorData = ptExtractHexAndAlpha(item.pillBgColor, '#0f172a', item.pillBgOpacity !== undefined ? item.pillBgOpacity : 85);
    const borderColorData = ptExtractHexAndAlpha(item.borderColor, '#ffffff', item.borderOpacity !== undefined ? item.borderOpacity : 25);
    const barColor = (item.barColor && item.barColor.startsWith('#')) ? item.barColor : '#10b981';
    const barBgData = ptExtractHexAndAlpha(item.barBgColor, '#ffffff', item.barBgOpacity !== undefined ? item.barBgOpacity : 25);
    const textColor = (item.textColor && item.textColor.startsWith('#')) ? item.textColor : '#ffffff';

    body.innerHTML = `
        <div class="space-y-3 text-xs">
            <div class="space-y-2.5 bg-slate-900 p-2.5 rounded-xl border border-emerald-500/50 shadow">
                <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span class="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <i data-lucide="sliders" class="w-3.5 h-3.5 text-emerald-400"></i>
                        <span>Cài Đặt Thẻ Tiến Độ & Đếm Câu</span>
                    </span>
                    <span class="text-[9px] px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-bold">Lớp ${gIdx + 1}</span>
                </div>

                <!-- 1. Chế độ hiển thị -->
                <div>
                    <label class="text-[9px] text-slate-400 block mb-1 font-bold">Kiểu hiển thị</label>
                    <div class="grid grid-cols-3 gap-1">
                        <button type="button" onclick="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'displayMode', 'both')" class="py-1 px-1.5 rounded text-[10px] font-bold border transition ${mode === 'both' ? 'bg-emerald-600 text-white border-emerald-400 shadow' : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'}">
                            Cả hai (Bar + Chữ)
                        </button>
                        <button type="button" onclick="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'displayMode', 'bar')" class="py-1 px-1.5 rounded text-[10px] font-bold border transition ${mode === 'bar' ? 'bg-emerald-600 text-white border-emerald-400 shadow' : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'}">
                            Chỉ Thanh Bar
                        </button>
                        <button type="button" onclick="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'displayMode', 'text')" class="py-1 px-1.5 rounded text-[10px] font-bold border transition ${mode === 'text' ? 'bg-emerald-600 text-white border-emerald-400 shadow' : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'}">
                            Chỉ Chữ Đếm
                        </button>
                    </div>
                </div>

                <!-- 2. Mẫu câu đếm (Text Template) -->
                ${mode !== 'bar' ? `
                <div>
                    <label class="text-[9px] text-slate-400 block mb-0.5 font-bold flex justify-between items-center">
                        <span>Định dạng chữ đếm câu</span>
                        <span class="text-[8px] text-emerald-400 italic">Dùng {STT} và {Tổng_câu}</span>
                    </label>
                    <input type="text" value="${template}" oninput="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'textTemplate', this.value, true)" onchange="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'textTemplate', this.value, false)" class="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-amber-300 font-bold text-xs mb-1">
                    <div class="flex flex-wrap gap-1">
                        <button type="button" onclick="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'textTemplate', 'Câu {STT}/{Tổng_câu}')" class="text-[8px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                            Câu {STT}/{Tổng_câu}
                        </button>
                        <button type="button" onclick="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'textTemplate', 'Question {STT}/{Tổng_câu}')" class="text-[8px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                            Question {STT}/{Tổng_câu}
                        </button>
                        <button type="button" onclick="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'textTemplate', '{STT} / {Tổng_câu}')" class="text-[8px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                            {STT} / {Tổng_câu}
                        </button>
                        <button type="button" onclick="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'textTemplate', 'Part {STT}')" class="text-[8px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                            Part {STT}
                        </button>
                    </div>
                </div>
                ` : ''}

                <!-- 3. Vị trí hiển thị -->
                <div>
                    <label class="text-[9px] text-slate-400 block mb-0.5 font-bold flex justify-between items-center">
                        <span>Vị trí hiển thị</span>
                        ${isCustomPos ? '<span class="text-[8px] text-sky-400 font-mono font-bold">Chế độ Tọa độ Pixel Tự Do</span>' : ''}
                    </label>
                    <select onchange="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'position', this.value)" class="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200 font-bold text-[11px]">
                        <option value="top_bar" ${pos === 'top_bar' ? 'selected' : ''}>Sát mép trên (Toàn màn ngang)</option>
                        <option value="bottom_bar" ${pos === 'bottom_bar' ? 'selected' : ''}>Sát mép dưới (Toàn màn ngang)</option>
                        <option value="top_right" ${pos === 'top_right' ? 'selected' : ''}>Góc trên phải (Hộp nổi)</option>
                        <option value="top_left" ${pos === 'top_left' ? 'selected' : ''}>Góc trên trái (Hộp nổi)</option>
                        <option value="bottom_center" ${pos === 'bottom_center' ? 'selected' : ''}>Dưới đáy giữa (Hộp nổi)</option>
                        <option value="custom" ${isCustomPos ? 'selected' : ''}>📍 Tọa độ tự do Pixel (X, Y px)</option>
                    </select>
                </div>

                <!-- 4. Tọa độ tự do Pixel (X, Y px) -->
                ${isCustomPos ? `
                <div class="space-y-2 bg-slate-950 p-2 rounded-lg border border-sky-500/40">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-bold text-sky-300 flex items-center space-x-1">
                            <i data-lucide="crosshair" class="w-3 h-3 text-sky-400"></i>
                            <span>Tọa Độ Pixel (Chuẩn 1920x1080)</span>
                        </span>
                        <span class="text-[9px] text-slate-400 font-mono">X:${posX}px | Y:${posY}px</span>
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <div class="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
                                <span>Tọa độ X (px)</span>
                                <span id="pt-posx-badge" class="font-mono text-sky-300 font-bold">${posX}px</span>
                            </div>
                            <input id="pt-posx-input" type="number" min="0" max="1920" step="10" value="${posX}" oninput="document.getElementById('pt-posx-badge').innerText = this.value + 'px'; document.getElementById('pt-posx-range').value = this.value; updateProgressTrackerProp(${gIdx}, ${fIdx}, 'posX', parseInt(this.value, 10) || 0, true);" onchange="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'posX', parseInt(this.value, 10) || 0, false);" class="w-full bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 text-xs font-mono font-bold mb-1">
                            <input id="pt-posx-range" type="range" min="0" max="1920" step="10" value="${posX}" oninput="document.getElementById('pt-posx-input').value = this.value; document.getElementById('pt-posx-badge').innerText = this.value + 'px'; updateProgressTrackerProp(${gIdx}, ${fIdx}, 'posX', parseInt(this.value, 10), true);" onchange="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'posX', parseInt(this.value, 10), false);" class="w-full accent-sky-500">
                        </div>
                        <div>
                            <div class="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
                                <span>Tọa độ Y (px)</span>
                                <span id="pt-posy-badge" class="font-mono text-sky-300 font-bold">${posY}px</span>
                            </div>
                            <input id="pt-posy-input" type="number" min="0" max="1080" step="10" value="${posY}" oninput="document.getElementById('pt-posy-badge').innerText = this.value + 'px'; document.getElementById('pt-posy-range').value = this.value; updateProgressTrackerProp(${gIdx}, ${fIdx}, 'posY', parseInt(this.value, 10) || 0, true);" onchange="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'posY', parseInt(this.value, 10) || 0, false);" class="w-full bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 text-xs font-mono font-bold mb-1">
                            <input id="pt-posy-range" type="range" min="0" max="1080" step="10" value="${posY}" oninput="document.getElementById('pt-posy-input').value = this.value; document.getElementById('pt-posy-badge').innerText = this.value + 'px'; updateProgressTrackerProp(${gIdx}, ${fIdx}, 'posY', parseInt(this.value, 10), true);" onchange="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'posY', parseInt(this.value, 10), false);" class="w-full accent-sky-500">
                        </div>
                    </div>

                    <!-- Nút căn vị trí nhanh theo Pixel -->
                    <div class="flex flex-wrap gap-1 pt-1 border-t border-slate-800">
                        <button type="button" onclick="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'posX', 30, true); updateProgressTrackerProp(${gIdx}, ${fIdx}, 'posY', 30, false);" class="text-[8px] bg-slate-800 hover:bg-slate-700 text-sky-300 px-1.5 py-0.5 rounded font-mono">
                            ↖ Trên-Trái (30, 30)
                        </button>
                        <button type="button" onclick="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'posX', 800, true); updateProgressTrackerProp(${gIdx}, ${fIdx}, 'posY', 30, false);" class="text-[8px] bg-slate-800 hover:bg-slate-700 text-sky-300 px-1.5 py-0.5 rounded font-mono">
                            ↑ Giữa-Trên (800, 30)
                        </button>
                        <button type="button" onclick="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'posX', 1520, true); updateProgressTrackerProp(${gIdx}, ${fIdx}, 'posY', 30, false);" class="text-[8px] bg-slate-800 hover:bg-slate-700 text-sky-300 px-1.5 py-0.5 rounded font-mono">
                            ↗ Trên-Phải (1520, 30)
                        </button>
                        <button type="button" onclick="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'posX', 800, true); updateProgressTrackerProp(${gIdx}, ${fIdx}, 'posY', 980, false);" class="text-[8px] bg-slate-800 hover:bg-slate-700 text-sky-300 px-1.5 py-0.5 rounded font-mono">
                            ↓ Đáy-Giữa (800, 980)
                        </button>
                    </div>
                </div>
                ` : ''}

                <!-- 5. Kích thước Khung & Thanh Bar (px) -->
                <div class="space-y-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span class="text-[10px] font-bold text-slate-300 block">Kích Thước Khung & Thanh Bar (px)</span>

                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-[9px] text-slate-400 block mb-0.5">Chiều Rộng (W px)</label>
                            <input type="number" min="0" max="1920" step="10" value="${boxW}" placeholder="0 = Tự động co" oninput="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'boxWidth', parseInt(this.value, 10) || 0, true);" onchange="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'boxWidth', parseInt(this.value, 10) || 0, false);" class="w-full bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 text-xs font-mono font-bold">
                            <span class="text-[8px] text-slate-500 italic block mt-0.5">Nhập 0 để tự co theo chữ</span>
                        </div>
                        <div>
                            <label class="text-[9px] text-slate-400 block mb-0.5">Chiều Cao (H px)</label>
                            <input type="number" min="0" max="400" step="5" value="${boxH}" placeholder="0 = Tự động co" oninput="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'boxHeight', parseInt(this.value, 10) || 0, true);" onchange="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'boxHeight', parseInt(this.value, 10) || 0, false);" class="w-full bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 text-xs font-mono font-bold">
                            <span class="text-[8px] text-slate-500 italic block mt-0.5">Nhập 0 để tự co theo nội dung</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900">
                        <div>
                            <div class="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
                                <span>Độ dày thanh bar</span>
                                <span id="pt-bar-thick-badge" class="font-mono text-emerald-400 font-bold">${barThick}px</span>
                            </div>
                            <input type="range" min="2" max="30" value="${barThick}" oninput="document.getElementById('pt-bar-thick-badge').innerText = this.value + 'px'; updateProgressTrackerProp(${gIdx}, ${fIdx}, 'barThickness', parseInt(this.value, 10), true);" onchange="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'barThickness', parseInt(this.value, 10), false);" class="w-full accent-emerald-500">
                        </div>
                        <div>
                            <div class="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
                                <span>Bo góc khung</span>
                                <span id="pt-radius-badge" class="font-mono text-emerald-400 font-bold">${bRadius}px</span>
                            </div>
                            <input type="range" min="0" max="40" value="${bRadius}" oninput="document.getElementById('pt-radius-badge').innerText = this.value + 'px'; updateProgressTrackerProp(${gIdx}, ${fIdx}, 'borderRadius', parseInt(this.value, 10), true);" onchange="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'borderRadius', parseInt(this.value, 10), false);" class="w-full accent-emerald-500">
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900">
                        <div>
                            <div class="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
                                <span>Độ dày viền khung</span>
                                <span id="pt-border-badge" class="font-mono text-emerald-400 font-bold">${bWidth}px</span>
                            </div>
                            <input type="range" min="0" max="8" step="0.5" value="${bWidth}" oninput="document.getElementById('pt-border-badge').innerText = this.value + 'px'; updateProgressTrackerProp(${gIdx}, ${fIdx}, 'borderWidth', parseFloat(this.value), true);" onchange="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'borderWidth', parseFloat(this.value), false);" class="w-full accent-emerald-500">
                        </div>
                        <div>
                            <div class="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
                                <span>Độ mờ toàn thẻ</span>
                                <span id="pt-opacity-badge" class="font-mono text-emerald-400 font-bold">${opacity}%</span>
                            </div>
                            <input type="range" min="10" max="100" value="${opacity}" oninput="document.getElementById('pt-opacity-badge').innerText = this.value + '%'; updateProgressTrackerProp(${gIdx}, ${fIdx}, 'opacity', parseInt(this.value, 10), true);" onchange="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'opacity', parseInt(this.value, 10), false);" class="w-full accent-emerald-500">
                        </div>
                    </div>
                </div>

                <!-- 6. Tùy Biến Màu Sắc & Khung Nền -->
                <div class="space-y-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span class="text-[10px] font-bold text-slate-300 block">Tùy Biến Màu Sắc Khung & Chi Tiết</span>

                    <!-- Màu nền khung chứa -->
                    <div>
                        <div class="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
                            <span>Màu nền khung</span>
                            <span class="font-mono text-slate-300 font-bold">Độ mờ: <span id="pt-bg-alpha-badge">${pillColorData.alpha}%</span></span>
                        </div>
                        <div class="grid grid-cols-2 gap-2 items-center">
                            <div class="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 rounded p-1">
                                <input type="color" value="${pillColorData.hex}" onchange="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'pillBgColor', this.value, false)" class="w-5 h-5 rounded border-0 cursor-pointer bg-transparent">
                                <span class="text-[10px] font-mono text-slate-300 font-bold">${pillColorData.hex}</span>
                            </div>
                            <input type="range" min="0" max="100" value="${pillColorData.alpha}" oninput="document.getElementById('pt-bg-alpha-badge').innerText = this.value + '%'; updateProgressTrackerProp(${gIdx}, ${fIdx}, 'pillBgOpacity', parseInt(this.value, 10), true);" onchange="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'pillBgOpacity', parseInt(this.value, 10), false);" class="w-full accent-emerald-500">
                        </div>
                    </div>

                    <!-- Màu viền khung -->
                    <div>
                        <div class="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
                            <span>Màu viền khung</span>
                            <span class="font-mono text-slate-300 font-bold">Độ mờ: <span id="pt-border-alpha-badge">${borderColorData.alpha}%</span></span>
                        </div>
                        <div class="grid grid-cols-2 gap-2 items-center">
                            <div class="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 rounded p-1">
                                <input type="color" value="${borderColorData.hex}" onchange="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'borderColor', this.value, false)" class="w-5 h-5 rounded border-0 cursor-pointer bg-transparent">
                                <span class="text-[10px] font-mono text-slate-300 font-bold">${borderColorData.hex}</span>
                            </div>
                            <input type="range" min="0" max="100" value="${borderColorData.alpha}" oninput="document.getElementById('pt-border-alpha-badge').innerText = this.value + '%'; updateProgressTrackerProp(${gIdx}, ${fIdx}, 'borderOpacity', parseInt(this.value, 10), true);" onchange="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'borderOpacity', parseInt(this.value, 10), false);" class="w-full accent-emerald-500">
                        </div>
                    </div>

                    <!-- Màu thanh chạy & Màu rãnh -->
                    <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900">
                        <div>
                            <label class="text-[9px] text-slate-400 block mb-0.5">Màu thanh chạy</label>
                            <div class="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 rounded p-1">
                                <input type="color" value="${barColor}" onchange="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'barColor', this.value, false)" class="w-5 h-5 rounded border-0 cursor-pointer bg-transparent">
                                <span class="text-[10px] font-mono text-slate-300 font-bold">${barColor}</span>
                            </div>
                        </div>
                        <div>
                            <label class="text-[9px] text-slate-400 block mb-0.5">Màu rãnh nền thanh</label>
                            <div class="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 rounded p-1">
                                <input type="color" value="${barBgData.hex}" onchange="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'barBgColor', this.value, false)" class="w-5 h-5 rounded border-0 cursor-pointer bg-transparent">
                                <span class="text-[10px] font-mono text-slate-300 font-bold">${barBgData.hex}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Chữ đếm câu & Cỡ chữ (nếu mode !== 'bar') -->
                    ${mode !== 'bar' ? `
                    <div class="pt-1 border-t border-slate-900 space-y-1.5">
                        <div class="grid grid-cols-2 gap-2 items-center">
                            <div>
                                <label class="text-[9px] text-slate-400 block mb-0.5">Màu chữ đếm</label>
                                <div class="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 rounded p-1">
                                    <input type="color" value="${textColor}" onchange="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'textColor', this.value, false)" class="w-5 h-5 rounded border-0 cursor-pointer bg-transparent">
                                    <span class="text-[10px] font-mono text-slate-300 font-bold">${textColor}</span>
                                </div>
                            </div>
                            <div>
                                <div class="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
                                    <span>Cỡ chữ</span>
                                    <span id="pt-font-size-badge" class="font-mono text-emerald-400 font-bold">${fontSize}px</span>
                                </div>
                                <input type="range" min="14" max="42" value="${fontSize}" oninput="document.getElementById('pt-font-size-badge').innerText = this.value + 'px'; updateProgressTrackerProp(${gIdx}, ${fIdx}, 'fontSize', parseInt(this.value, 10), true);" onchange="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'fontSize', parseInt(this.value, 10), false);" class="w-full accent-emerald-500">
                            </div>
                        </div>
                        <div class="flex items-center justify-between pt-1">
                            <span class="text-[9px] text-slate-400">Độ đậm font chữ:</span>
                            <div class="flex items-center space-x-1">
                                <button type="button" onclick="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'fontWeight', 700)" class="px-2 py-0.5 rounded text-[10px] font-bold ${fontWeight === 700 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}">Đậm (700)</button>
                                <button type="button" onclick="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'fontWeight', 900)" class="px-2 py-0.5 rounded text-[10px] font-bold ${fontWeight === 900 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}">Siêu Đậm (900)</button>
                            </div>
                        </div>
                    </div>
                    ` : ''}

                    <!-- Tùy chọn đổ bóng -->
                    <div class="pt-1 border-t border-slate-900">
                        <label class="flex items-center justify-between cursor-pointer">
                            <span class="text-[10px] text-slate-300 font-medium">Đổ bóng mờ nổi khối (Box Shadow)</span>
                            <input type="checkbox" ${hasShadow ? 'checked' : ''} onchange="updateProgressTrackerProp(${gIdx}, ${fIdx}, 'shadow', this.checked)" class="rounded bg-slate-900 border-slate-700 text-emerald-500 w-3.5 h-3.5 focus:ring-0">
                        </label>
                    </div>
                </div>

                <!-- Thao tác xóa -->
                <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                    <span class="text-[9px] text-slate-400 italic">Tự động tính theo tổng số câu trong bài học.</span>
                    <button type="button" onclick="removeFieldItemFromGroup(${gIdx}, ${fIdx}); selectedProgressTrackerTarget = null; renderInspectorRibbon(); renderTimelineLayersListUI();" class="py-1 px-2 text-rose-400 hover:text-white hover:bg-rose-950/60 rounded font-bold transition">
                        ✕ Xóa thẻ này
                    </button>
                </div>
            </div>
        </div>
    `;

    if (window.lucide && lucide.createIcons) lucide.createIcons();
}

function renderAudioSfxInspectorRibbon(item, gIdx, fIdx) {
    const body = document.getElementById('inspector-panel-body');
    const targetLabel = document.getElementById('inspector-target-label');
    if (!body) return;

    if (targetLabel) {
        targetLabel.innerHTML = `<span class="flex items-center space-x-1"><i data-lucide="music" class="w-3 h-3 text-purple-400"></i><span>Âm Thanh SFX (Lớp ${gIdx + 1})</span></span>`;
        targetLabel.className = "text-[9px] font-extrabold bg-purple-950 text-purple-300 border border-purple-700/80 px-2 py-0.5 rounded";
    }

    const soundType = item.soundType || 'ding';
    const volume = item.volume !== undefined ? item.volume : 80;
    const isDucking = item.ducking !== false;
    const customName = item.customAudioName || '';

    body.innerHTML = `
        <div class="space-y-3 text-xs">
            <div class="space-y-2.5 bg-slate-900 p-2.5 rounded-xl border border-purple-500/50 shadow">
                <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span class="text-[10px] font-extrabold text-purple-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <i data-lucide="music" class="w-3.5 h-3.5 text-purple-400"></i>
                        <span>Cài Đặt Thẻ Âm Thanh SFX</span>
                    </span>
                    <span class="text-[9px] px-1.5 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded font-bold">Lớp ${gIdx + 1}</span>
                </div>

                <!-- Chọn loại âm thanh -->
                <div>
                    <label class="text-[9px] text-slate-400 block mb-0.5 font-bold">Nguồn âm thanh</label>
                    <select onchange="updateAudioSfxProp(${gIdx}, ${fIdx}, 'soundType', this.value)" class="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-purple-200 font-bold text-[11px]">
                        <option value="ding" ${soundType === 'ding' ? 'selected' : ''}>🔔 Ting Ting (Đáp án đúng / Chúc mừng)</option>
                        <option value="tick" ${soundType === 'tick' ? 'selected' : ''}>⏱ Tích Tắc (Nhịp đồng hồ / Tập trung)</option>
                        <option value="whoosh" ${soundType === 'whoosh' ? 'selected' : ''}>💨 Whoosh (Chuyển cảnh / Xuất hiện)</option>
                        <option value="bell" ${soundType === 'bell' ? 'selected' : ''}>🛎 Chuông Bell (Vang, sáng rõ)</option>
                        <option value="chime" ${soundType === 'chime' ? 'selected' : ''}>✨ Chime (Hợp âm 3 nốt thăng hoa)</option>
                        <option value="custom" ${soundType === 'custom' ? 'selected' : ''}>📁 Tải file âm thanh riêng (.mp3, .wav)</option>
                    </select>
                </div>

                <!-- Nạp file âm thanh riêng nếu chọn custom -->
                ${soundType === 'custom' ? `
                <div class="p-2 bg-slate-950 rounded-lg border border-purple-800/60 space-y-1.5">
                    <label class="text-[9px] text-purple-300 block font-bold">File âm thanh từ máy tính (.mp3, .wav):</label>
                    <input type="file" accept="audio/*" onchange="handleAudioSfxFileUpload(${gIdx}, ${fIdx}, this)" class="w-full text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-purple-900 file:text-purple-200 hover:file:bg-purple-800 cursor-pointer">
                    ${customName ? `<div class="text-[9px] text-emerald-400 font-bold flex items-center space-x-1"><i data-lucide="check-circle-2" class="w-2.5 h-2.5"></i><span>Đã nạp: ${customName}</span></div>` : '<div class="text-[9px] text-slate-500 italic">Chưa nạp file (sẽ dùng âm thanh Ting Ting tạm thời)</div>'}
                </div>
                ` : ''}

                <!-- Nút nghe thử âm thanh -->
                <div class="space-y-1.5">
                    <button type="button" id="sfx-test-play-btn" onclick="testPlayAudioSfx(${gIdx}, ${fIdx})" class="w-full py-1.5 px-3 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-extrabold rounded-lg text-xs flex items-center justify-center space-x-1.5 shadow active:scale-95 transition cursor-pointer">
                        <i data-lucide="play" id="sfx-test-btn-icon" class="w-3.5 h-3.5"></i>
                        <span id="sfx-test-btn-text">Nghe thử âm thanh này</span>
                    </button>
                    <button type="button" onclick="testPlayAudioSfxWithDucking(${gIdx}, ${fIdx})" class="w-full py-1.5 px-2.5 bg-slate-950 hover:bg-purple-950/60 border border-purple-800/80 text-purple-200 font-bold rounded-lg text-[11px] flex items-center justify-center space-x-1.5 shadow active:scale-95 transition cursor-pointer" title="Phát SFX kèm giọng đọc AI để nghe hiệu ứng né tiếng tự động">
                        <i data-lucide="headphones" class="w-3.5 h-3.5 text-purple-400"></i>
                        <span>Nghe thử Né Tiếng (Ducking) với Giọng đọc AI</span>
                    </button>
                </div>

                <!-- Âm lượng -->
                <div>
                    <div class="flex justify-between items-center mb-0.5">
                        <label class="text-[9px] text-slate-400 font-bold">Âm lượng SFX</label>
                        <span id="sfx-vol-badge-${gIdx}-${fIdx}" class="text-[10px] font-bold text-amber-300 font-mono">${volume}%</span>
                    </div>
                    <input type="range" min="0" max="100" value="${volume}" oninput="updateAudioSfxProp(${gIdx}, ${fIdx}, 'volume', parseInt(this.value, 10), true)" onchange="updateAudioSfxProp(${gIdx}, ${fIdx}, 'volume', parseInt(this.value, 10), false)" class="w-full accent-purple-500 cursor-pointer">
                </div>

                <!-- Né tiếng Ducking -->
                <div class="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-start space-x-2">
                    <input type="checkbox" id="sfx-ducking-cb" ${isDucking ? 'checked' : ''} onchange="updateAudioSfxProp(${gIdx}, ${fIdx}, 'ducking', this.checked, false)" class="mt-0.5 rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-0 cursor-pointer">
                    <label for="sfx-ducking-cb" class="text-[10px] text-slate-300 font-semibold cursor-pointer select-none leading-snug">
                        <span class="font-bold text-purple-300 block">Tự động né tiếng (Audio Ducking)</span>
                        <span class="text-[9px] text-slate-400">Tự động hạ nhỏ âm lượng SFX này khi Giọng đọc AI (TTS) đang nói để không làm át lời.</span>
                    </label>
                </div>

                <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                    <span class="text-[9px] text-slate-400 italic">Kích hoạt chuẩn xác theo thời điểm bắt đầu lớp.</span>
                    <button type="button" onclick="removeFieldItemFromGroup(${gIdx}, ${fIdx}); selectedAudioSfxTarget = null; renderInspectorRibbon(); renderTimelineLayersListUI();" class="py-1 px-2 text-rose-400 hover:text-white hover:bg-rose-950/60 rounded font-bold transition">
                        ✕ Xóa thẻ này
                    </button>
                </div>
            </div>
        </div>
    `;

    if (window.lucide && lucide.createIcons) lucide.createIcons();
}

function renderLayerBorderInspectorRibbon(grp, gIdx) {
    const body = document.getElementById('inspector-panel-body');
    const targetLabel = document.getElementById('inspector-target-label');
    if (!body || !grp) return;

    if (typeof ensureGroupBorderDefaults === 'function') ensureGroupBorderDefaults(grp);

    if (targetLabel) {
        targetLabel.innerHTML = `<span class="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style="background:${grp.trackColor || '#3b82f6'}"></span>Viền & Hộp: ${grp.name || `Lớp ${gIdx + 1}`}`;
        targetLabel.className = "text-[9px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 px-2 py-0.5 rounded flex items-center shadow-sm";
    }

    const borderEnabled = !!grp.borderEnabled;
    const borderColor = grp.borderColor || (grp.trackColor || '#3b82f6');
    const borderWidth = grp.borderWidth !== undefined ? grp.borderWidth : 2;
    const borderStyle = grp.borderStyle || 'solid';
    const borderRadius = grp.borderRadius !== undefined ? grp.borderRadius : 12;
    const borderPadding = grp.borderPadding !== undefined ? grp.borderPadding : 10;
    const backgroundColor = grp.backgroundColor || 'transparent';
    const backgroundOpacity = grp.backgroundOpacity !== undefined ? grp.backgroundOpacity : 100;
    const boxShadowEnabled = !!grp.boxShadowEnabled;
    const boxShadowColor = grp.boxShadowColor || 'rgba(0, 0, 0, 0.35)';
    const boxShadowBlur = grp.boxShadowBlur !== undefined ? grp.boxShadowBlur : 10;

    const paletteColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#e2e8f0', '#ffffff', '#0f172a'];

    body.innerHTML = `
        <div class="space-y-3 bg-slate-900 p-3 rounded-xl border border-indigo-500/50 text-xs">
            <!-- Header thông tin lớp -->
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                <div class="flex items-center space-x-1.5">
                    <span class="w-3 h-3 rounded-full flex-shrink-0" style="background: ${grp.trackColor || '#3b82f6'}"></span>
                    <span class="font-bold text-indigo-300 text-xs uppercase tracking-wider">Cài Đặt Khung Viền & Hộp Lớp</span>
                </div>
                <span class="text-[9px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Lớp #${gIdx + 1}</span>
            </div>

            <!-- Tên lớp & vị trí -->
            <div class="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-1.5">
                <div class="flex items-center justify-between">
                    <label class="text-[10px] font-bold text-slate-300">Tên Lớp:</label>
                    <input type="text" value="${(grp.name || '').replace(/"/g, '&quot;')}" onchange="grp.name = this.value; renderTimelineLayersListUI(); renderInspectorRibbon(); if (typeof triggerAutoSave === 'function') triggerAutoSave(false);" class="w-40 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-white font-semibold focus:border-indigo-500">
                </div>
                <div class="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Vị trí cột: <strong class="text-sky-300 font-mono">Cột ${grp.targetCol || 1}</strong> (span: ${grp.colSpan || 1})</span>
                    <span>Phân khu: <strong class="text-amber-300 font-mono">${grp.timelineBoundary === 'intro' ? 'Khu 1' : (grp.timelineBoundary === 'outro' ? 'Khu 3' : 'Khu 2')}</strong></span>
                </div>
            </div>

            <!-- 1. CÀI ĐẶT VIỀN TOÀN BỘ LỚP (LAYER BORDER) -->
            <div class="space-y-2.5 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div class="flex items-center justify-between">
                    <label class="flex items-center space-x-2 cursor-pointer select-none">
                        <input type="checkbox" ${borderEnabled ? 'checked' : ''} onchange="updateGroupBorderProp(${gIdx}, 'borderEnabled', this.checked);" class="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-indigo-500 w-4 h-4 cursor-pointer">
                        <span class="text-[11px] font-bold text-slate-200">Bật Viền Bao Quanh Lớp</span>
                    </label>
                    <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${borderEnabled ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800 text-slate-400'}">${borderEnabled ? 'ĐANG BẬT' : 'ĐÃ TẮT'}</span>
                </div>

                ${borderEnabled ? `
                <div class="space-y-2 pt-1 border-t border-slate-900">
                    <!-- Chọn màu viền -->
                    <div>
                        <div class="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span>Màu sắc viền</span>
                            <span class="font-mono text-indigo-300 font-bold">${borderColor}</span>
                        </div>
                        <div class="flex items-center space-x-1.5">
                            <input type="color" value="${borderColor.startsWith('#') && borderColor.length === 7 ? borderColor : '#3b82f6'}" oninput="updateGroupBorderProp(${gIdx}, 'borderColor', this.value, true);" onchange="updateGroupBorderProp(${gIdx}, 'borderColor', this.value, false);" class="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer flex-shrink-0">
                            <input type="text" value="${borderColor}" onchange="updateGroupBorderProp(${gIdx}, 'borderColor', this.value, false);" class="w-24 bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 text-xs font-mono">
                            <!-- Bảng màu mẫu nhanh -->
                            <div class="flex flex-wrap gap-1 items-center flex-1 justify-end">
                                ${paletteColors.map(c => `
                                    <button type="button" onclick="updateGroupBorderProp(${gIdx}, 'borderColor', '${c}', false);" class="w-4 h-4 rounded-full border border-slate-700 hover:scale-125 transition flex-shrink-0" style="background:${c};" title="${c}"></button>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Độ dày viền & Kiểu nét -->
                    <div class="grid grid-cols-2 gap-2 pt-1">
                        <div>
                            <div class="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                                <span>Độ dày viền</span>
                                <span id="layer-border-w-badge" class="font-mono text-indigo-300 font-bold">${borderWidth}px</span>
                            </div>
                            <input type="range" min="0.5" max="15" step="0.5" value="${borderWidth}" oninput="document.getElementById('layer-border-w-badge').innerText = this.value + 'px'; updateGroupBorderProp(${gIdx}, 'borderWidth', parseFloat(this.value), true);" onchange="updateGroupBorderProp(${gIdx}, 'borderWidth', parseFloat(this.value), false);" class="w-full accent-indigo-500">
                        </div>

                        <div>
                            <span class="text-[10px] text-slate-400 block mb-0.5">Kiểu nét viền</span>
                            <select onchange="updateGroupBorderProp(${gIdx}, 'borderStyle', this.value);" class="w-full bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 text-xs">
                                <option value="solid" ${borderStyle === 'solid' ? 'selected' : ''}>Nét liền (Solid)</option>
                                <option value="dashed" ${borderStyle === 'dashed' ? 'selected' : ''}>Nét đứt (Dashed)</option>
                                <option value="dotted" ${borderStyle === 'dotted' ? 'selected' : ''}>Chấm bi (Dotted)</option>
                            </select>
                        </div>
                    </div>

                    <!-- Bo góc & Khoảng đệm Padding -->
                    <div class="grid grid-cols-2 gap-2 pt-1">
                        <div>
                            <div class="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                                <span>Bo góc (Radius)</span>
                                <span id="layer-border-r-badge" class="font-mono text-indigo-300 font-bold">${borderRadius}px</span>
                            </div>
                            <input type="range" min="0" max="50" step="1" value="${borderRadius}" oninput="document.getElementById('layer-border-r-badge').innerText = this.value + 'px'; updateGroupBorderProp(${gIdx}, 'borderRadius', parseInt(this.value, 10), true);" onchange="updateGroupBorderProp(${gIdx}, 'borderRadius', parseInt(this.value, 10), false);" class="w-full accent-indigo-500">
                        </div>

                        <div>
                            <div class="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                                <span>Khoảng đệm (Padding)</span>
                                <span id="layer-border-p-badge" class="font-mono text-indigo-300 font-bold">${borderPadding}px</span>
                            </div>
                            <input type="range" min="0" max="40" step="2" value="${borderPadding}" oninput="document.getElementById('layer-border-p-badge').innerText = this.value + 'px'; updateGroupBorderProp(${gIdx}, 'borderPadding', parseInt(this.value, 10), true);" onchange="updateGroupBorderProp(${gIdx}, 'borderPadding', parseInt(this.value, 10), false);" class="w-full accent-indigo-500">
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- 2. MÀU NỀN HỘP LỚP & ĐỘ MỜ ĐỤC (BACKGROUND & OPACITY) -->
            <div class="space-y-2.5 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span class="text-[11px] font-bold text-slate-300 block">Màu Nền Hộp Lớp & Độ Mờ Đục</span>

                <div>
                    <div class="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span>Màu nền hộp</span>
                        <div class="flex items-center space-x-1">
                            <span class="font-mono text-indigo-300 font-bold">${backgroundColor}</span>
                            <button type="button" onclick="updateGroupBorderProp(${gIdx}, 'backgroundColor', 'transparent');" class="text-[9px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-1 py-0.5 rounded border border-slate-700">Trong suốt</button>
                        </div>
                    </div>
                    <div class="flex items-center space-x-1.5">
                        <input type="color" value="${backgroundColor.startsWith('#') && backgroundColor.length === 7 ? backgroundColor : '#0f172a'}" oninput="updateGroupBorderProp(${gIdx}, 'backgroundColor', this.value, true);" onchange="updateGroupBorderProp(${gIdx}, 'backgroundColor', this.value, false);" class="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer flex-shrink-0">
                        <input type="text" value="${backgroundColor}" onchange="updateGroupBorderProp(${gIdx}, 'backgroundColor', this.value, false);" placeholder="transparent hoặc #màu" class="w-28 bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 text-xs font-mono">
                    </div>
                    
                    <!-- Presets nền nhanh -->
                    <div class="flex flex-wrap gap-1 pt-1.5">
                        <button type="button" onclick="updateGroupBorderProp(${gIdx}, 'backgroundColor', 'rgba(15, 23, 42, 0.85)');" class="text-[8px] bg-slate-900 border border-slate-700 hover:border-indigo-400 text-slate-300 px-1.5 py-0.5 rounded">Tối Slate (85%)</button>
                        <button type="button" onclick="updateGroupBorderProp(${gIdx}, 'backgroundColor', 'rgba(0, 0, 0, 0.7)');" class="text-[8px] bg-black border border-slate-700 hover:border-indigo-400 text-slate-300 px-1.5 py-0.5 rounded">Đen mờ (70%)</button>
                        <button type="button" onclick="updateGroupBorderProp(${gIdx}, 'backgroundColor', 'rgba(255, 255, 255, 0.12)');" class="text-[8px] bg-white/10 border border-slate-700 hover:border-indigo-400 text-slate-300 px-1.5 py-0.5 rounded">Kính mờ (Frosted)</button>
                        <button type="button" onclick="updateGroupBorderProp(${gIdx}, 'backgroundColor', '#ffffff');" class="text-[8px] bg-white text-slate-900 font-bold px-1.5 py-0.5 rounded">Trắng sáng</button>
                        <button type="button" onclick="updateGroupBorderProp(${gIdx}, 'backgroundColor', 'transparent');" class="text-[8px] bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded">Không nền</button>
                    </div>
                </div>

                <!-- Độ mờ đục nền -->
                <div>
                    <div class="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                        <span>Độ mờ đục nền (Opacity)</span>
                        <span id="layer-bg-op-badge" class="font-mono text-indigo-300 font-bold">${backgroundOpacity}%</span>
                    </div>
                    <input type="range" min="0" max="100" step="5" value="${backgroundOpacity}" oninput="document.getElementById('layer-bg-op-badge').innerText = this.value + '%'; updateGroupBorderProp(${gIdx}, 'backgroundOpacity', parseInt(this.value, 10), true);" onchange="updateGroupBorderProp(${gIdx}, 'backgroundOpacity', parseInt(this.value, 10), false);" class="w-full accent-indigo-500">
                </div>
            </div>

            <!-- 3. HIỆU ỨNG ĐỔ BÓNG & HÀO QUANG (BOX SHADOW & GLOW) -->
            <div class="space-y-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div class="flex items-center justify-between">
                    <label class="flex items-center space-x-2 cursor-pointer select-none">
                        <input type="checkbox" ${boxShadowEnabled ? 'checked' : ''} onchange="updateGroupBorderProp(${gIdx}, 'boxShadowEnabled', this.checked);" class="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-indigo-500 w-4 h-4 cursor-pointer">
                        <span class="text-[11px] font-bold text-slate-200">Bật Đổ Bóng / Hào Quang Glow</span>
                    </label>
                    <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${boxShadowEnabled ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-500'}">${boxShadowEnabled ? 'BẬT' : 'TẮT'}</span>
                </div>

                ${boxShadowEnabled ? `
                <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900">
                    <div>
                        <span class="text-[10px] text-slate-400 block mb-1">Màu bóng / hào quang</span>
                        <div class="flex items-center space-x-1">
                            <input type="color" value="${boxShadowColor.startsWith('#') && boxShadowColor.length === 7 ? boxShadowColor : '#000000'}" oninput="updateGroupBorderProp(${gIdx}, 'boxShadowColor', this.value, true);" onchange="updateGroupBorderProp(${gIdx}, 'boxShadowColor', this.value, false);" class="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer">
                            <input type="text" value="${boxShadowColor}" onchange="updateGroupBorderProp(${gIdx}, 'boxShadowColor', this.value, false);" class="w-full bg-slate-900 border border-slate-700 rounded p-1 text-[10px] font-mono text-slate-200">
                        </div>
                    </div>
                    <div>
                        <div class="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                            <span>Độ nhòe (Blur)</span>
                            <span id="layer-shadow-blur-badge" class="font-mono text-indigo-300 font-bold">${boxShadowBlur}px</span>
                        </div>
                        <input type="range" min="0" max="35" step="1" value="${boxShadowBlur}" oninput="document.getElementById('layer-shadow-blur-badge').innerText = this.value + 'px'; updateGroupBorderProp(${gIdx}, 'boxShadowBlur', parseInt(this.value, 10), true);" onchange="updateGroupBorderProp(${gIdx}, 'boxShadowBlur', parseInt(this.value, 10), false);" class="w-full accent-indigo-500">
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- 4. TIỆN ÍCH & ÁP DỤNG ĐỒNG LOẠT -->
            <div class="space-y-2 pt-1">
                <button type="button" onclick="copyLayerBorderStyleToAll(${gIdx});" class="w-full py-1.5 px-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-950/50 transition cursor-pointer">
                    <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                    <span>Áp Dụng Kiểu Viền Này Cho Tất Cả Các Lớp</span>
                </button>

                <div class="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
                    <button type="button" onclick="updateGroupBorderProp(${gIdx}, 'borderEnabled', false); updateGroupBorderProp(${gIdx}, 'backgroundColor', 'transparent');" class="text-slate-400 hover:text-white hover:underline cursor-pointer">
                        Đặt lại không viền
                    </button>
                    ${grp.fields && grp.fields.length > 0 ? `
                    <button type="button" onclick="selectGridGroup(${gIdx});" class="text-sky-400 hover:text-sky-300 font-bold hover:underline cursor-pointer">
                        Xem các thẻ con (${grp.fields.length}) →
                    </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    if (window.lucide && lucide.createIcons) lucide.createIcons();
}

function renderInspectorRibbon() {
    const body = document.getElementById('inspector-panel-body');
    const targetLabel = document.getElementById('inspector-target-label');
    if (!body) return;

    // KIỂM TRA NẾU ĐANG CHỌN KHUNG VIỀN LỚP
    if (selectedLayerBorderTarget) {
        const { gIdx } = selectedLayerBorderTarget;
        const grp = paragraphGridConfig.groups[gIdx];
        if (grp) {
            renderLayerBorderInspectorRibbon(grp, gIdx);
            return;
        } else {
            selectedLayerBorderTarget = null;
        }
    }

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
