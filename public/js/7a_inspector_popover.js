/**
 * 7a_inspector_popover.js
 * Quản lý Popover nổi chỉnh sửa đối tượng đặc biệt (Giọng đọc AI TTS, Đồng hồ đếm ngược, Chữ tự do)
 */

function initFloatingPopoverDraggable() {
    const popover = document.getElementById('floating-card-popover');
    const header = document.getElementById('floating-popover-header');
    if (!header || !popover) return;

    header.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
        isPopoverDragging = true;
        const rect = popover.getBoundingClientRect();
        popoverDragOffset.x = e.clientX - rect.left;
        popoverDragOffset.y = e.clientY - rect.top;
        document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isPopoverDragging) return;
        const newX = Math.max(10, Math.min(window.innerWidth - 320, e.clientX - popoverDragOffset.x));
        const newY = Math.max(10, Math.min(window.innerHeight - 300, e.clientY - popoverDragOffset.y));
        popover.style.left = `${newX}px`;
        popover.style.top = `${newY}px`;
        popover.style.right = 'auto';
        popover.style.bottom = 'auto';
    });

    window.addEventListener('mouseup', () => {
        if (isPopoverDragging) {
            isPopoverDragging = false;
            document.body.style.userSelect = '';
        }
    });
}

function resetPopoverPosition() {
    const popover = document.getElementById('floating-card-popover');
    if (popover) {
        popover.style.left = 'auto';
        popover.style.right = '24px';
        popover.style.top = '56px';
        popover.style.bottom = 'auto';
        showToast("Đã neo khung cài đặt về góc trên bên phải!");
    }
}

function openFloatingCardPopover(e, gIdx, fIdx, type) {
    activePopoverData = { gIdx, fIdx, type };
    const grp = paragraphGridConfig.groups[gIdx];
    const item = grp.fields[fIdx];
    if (!item) return;

    const popover = document.getElementById('floating-card-popover');
    const badgeType = document.getElementById('popover-badge-type');
    const body = document.getElementById('popover-content-body');

    if (type === 'tts') {
        badgeType.innerText = "Giọng Đọc AI (TTS)";
        badgeType.className = "text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500 text-white";

        const sourceMode = item.sourceMode || 'fields';
        const allTextFields = (typeof excelColumnsList !== 'undefined' && excelColumnsList.length > 0)
            ? excelColumnsList.filter(c => !c.toLowerCase().includes('anh') && !c.toLowerCase().includes('dinh_kem'))
            : ['Sentence', 'Phonetic', 'Vietnamese meaning', 'Example sentence', 'Substitution words'];
        const curFields = item.ttsSpeakFields || [];
        const customText = item.customText || '';

        const checkboxesHtml = allTextFields.map(tf => {
            const isChecked = curFields.includes(tf);
            return `
                <label class="flex items-center space-x-1.5 p-1 bg-slate-950 rounded border border-slate-800 cursor-pointer hover:border-indigo-500">
                    <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleTTSMultiFieldSelection(${gIdx}, ${fIdx}, '${tf}', this.checked)" class="rounded bg-slate-900 border-slate-700 text-indigo-500 w-3.5 h-3.5 focus:ring-0">
                    <span class="text-[10px] font-semibold text-slate-200 truncate">{{${tf}}}</span>
                </label>
            `;
        }).join('');

        const words = customText.trim() ? customText.trim().split(/\s+/).filter(Boolean).length : 0;

        body.innerHTML = `
            <div class="space-y-2">
                <div class="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px] font-bold">
                    <button type="button" onclick="setTtsSourceMode(${gIdx}, ${fIdx}, 'fields'); openFloatingCardPopover(null, ${gIdx}, ${fIdx}, 'tts');" class="py-1 px-1.5 rounded transition flex items-center justify-center space-x-1 ${sourceMode === 'fields' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}">
                        <span>Từ Cột Excel</span>
                    </button>
                    <button type="button" onclick="setTtsSourceMode(${gIdx}, ${fIdx}, 'custom'); openFloatingCardPopover(null, ${gIdx}, ${fIdx}, 'tts');" class="py-1 px-1.5 rounded transition flex items-center justify-center space-x-1 ${sourceMode === 'custom' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}">
                        <span>Đoạn Text Tự Nhập</span>
                    </button>
                </div>

                ${sourceMode === 'fields' ? `
                    <div class="space-y-1.5">
                        <label class="text-[10px] text-slate-300 font-bold block">Tích chọn các trường để AI đọc:</label>
                        <div class="grid grid-cols-2 gap-1 max-h-36 overflow-y-auto p-1 bg-slate-900 rounded-lg border border-slate-800">
                            ${checkboxesHtml}
                        </div>
                    </div>
                ` : `
                    <div class="space-y-1.5">
                        <div class="flex items-center justify-between">
                            <label class="text-[10px] text-slate-300 font-bold block">Nhập đoạn text cần đọc:</label>
                            <span class="text-[9px] text-amber-400 font-mono">${words} từ</span>
                        </div>
                        <textarea rows="3" oninput="updateTtsCustomText(${gIdx}, ${fIdx}, this.value)" placeholder="Nhập câu tiếng Anh hoặc hướng dẫn..." class="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-100">${customText}</textarea>
                    </div>
                `}

                <div class="flex items-center justify-between pt-1 border-t border-slate-800">
                    <button type="button" onclick="previewCurrentTTSVoice()" class="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center space-x-1">
                        <i data-lucide="play" class="w-3 h-3"></i>
                        <span>Nghe thử AI</span>
                    </button>
                    <span class="text-[9px] text-indigo-300 italic">Khóa độ dài tự động trên Timeline</span>
                </div>
            </div>
        `;
        if (window.lucide && lucide.createIcons) lucide.createIcons();
    } else if (type === 'countdown') {
        badgeType.innerText = "Đồng Hồ Đếm Ngược";
        badgeType.className = "text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500 text-white";

        body.innerHTML = `
            <div class="space-y-2">
                <div>
                    <label class="text-[10px] text-slate-300 font-bold block mb-0.5">Số giây đếm ngược:</label>
                    <input type="number" value="${item.seconds || 3}" onchange="updateCountdownProp(${gIdx}, ${fIdx}, 'seconds', parseInt(this.value))" class="w-full bg-slate-950 border border-slate-700 rounded p-1 font-bold text-amber-300 text-xs">
                </div>
                <div>
                    <label class="text-[10px] text-slate-300 font-bold block mb-0.5">Vị trí hiển thị:</label>
                    <select onchange="updateCountdownProp(${gIdx}, ${fIdx}, 'position', this.value)" class="w-full bg-slate-950 border border-slate-700 rounded p-1 font-bold text-slate-200 text-xs">
                        <option value="top_right" ${item.position === 'top_right' ? 'selected' : ''}>Góc trên bên phải</option>
                        <option value="center" ${item.position === 'center' ? 'selected' : ''}>Chính giữa màn hình</option>
                        <option value="bottom_center" ${item.position === 'bottom_center' ? 'selected' : ''}>Dưới đáy màn hình</option>
                    </select>
                </div>
            </div>
        `;
    } else if (type === 'custom_text') {
        badgeType.innerText = "Chữ Tự Do";
        badgeType.className = "text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500 text-white";

        body.innerHTML = `
            <div class="space-y-2">
                <div>
                    <label class="text-[10px] text-slate-300 font-bold block mb-0.5">Nội dung văn bản:</label>
                    <input type="text" value="${item.text || ''}" oninput="updateCustomTextVal(${gIdx}, ${fIdx}, this.value)" class="w-full bg-slate-950 border border-slate-700 rounded p-1.5 font-bold text-slate-100 text-xs">
                </div>
            </div>
        `;
    }

    popover.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-2');
    popover.classList.add('opacity-100', 'translate-y-0');
}

function closeFloatingPopover() {
    const popover = document.getElementById('floating-card-popover');
    if (popover) {
        popover.classList.add('opacity-0', 'pointer-events-none', '-translate-y-2');
        popover.classList.remove('opacity-100', 'translate-y-0');
    }
}

function toggleTTSMultiFieldSelection(gIdx, fIdx, fieldKey, isChecked) {
    const item = paragraphGridConfig.groups[gIdx].fields[fIdx];
    if (!item.ttsSpeakFields) item.ttsSpeakFields = [];

    if (isChecked) {
        if (!item.ttsSpeakFields.includes(fieldKey)) item.ttsSpeakFields.push(fieldKey);
    } else {
        item.ttsSpeakFields = item.ttsSpeakFields.filter(k => k !== fieldKey);
    }

    autoRecalculateAudioLayersDuration();
    renderTimelineLayersListUI();
    renderTimelineTracksUI();
    if (typeof selectedTtsTarget !== 'undefined' && selectedTtsTarget && selectedTtsTarget.gIdx === gIdx && selectedTtsTarget.fIdx === fIdx) {
        if (typeof renderTtsInspectorRibbon === 'function') renderTtsInspectorRibbon(item, gIdx, fIdx);
    }
}

function updateCountdownProp(gIdx, fIdx, prop, val) {
    const item = paragraphGridConfig.groups[gIdx].fields[fIdx];
    if (item) {
        item[prop] = val;
        renderTimelineLayersListUI();
        drawParagraphCanvasFrame();
    }
}

function updateCustomTextVal(gIdx, fIdx, val) {
    const item = paragraphGridConfig.groups[gIdx].fields[fIdx];
    if (item) {
        item.text = val;
        renderTimelineLayersListUI();
        drawParagraphCanvasFrame();
    }
}
