/**
 * 7_inspector_ui.js
 * Quản lý Ribbon định dạng (phông, kích cỡ, màu, highlight, bo góc), bảng danh sách Layer, Popover nổi và Grid Inspector
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

        const allTextFields = excelColumnsList.filter(c => !c.toLowerCase().includes('anh') && !c.toLowerCase().includes('dinh_kem'));
        const curFields = item.ttsSpeakFields || [];

        const checkboxesHtml = allTextFields.map(tf => {
            const isChecked = curFields.includes(tf);
            return `
                <label class="flex items-center space-x-1.5 p-1 bg-slate-950 rounded border border-slate-800 cursor-pointer hover:border-indigo-500">
                    <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleTTSMultiFieldSelection(${gIdx}, ${fIdx}, '${tf}', this.checked)" class="rounded bg-slate-900 border-slate-700 text-indigo-500 w-3.5 h-3.5 focus:ring-0">
                    <span class="text-[10px] font-semibold text-slate-200 truncate">{{${tf}}}</span>
                </label>
            `;
        }).join('');

        body.innerHTML = `
            <div class="space-y-1.5">
                <label class="text-[10px] text-slate-300 font-bold block">Tích chọn các trường để AI đọc:</label>
                <div class="grid grid-cols-2 gap-1 max-h-36 overflow-y-auto p-1 bg-slate-900 rounded-lg border border-slate-800">
                    ${checkboxesHtml}
                </div>
                <p class="text-[9px] text-indigo-300 italic">Hệ thống sẽ tự động đo số giây và khóa độ dài chính xác trên Timeline.</p>
            </div>
        `;
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

function toggleSelectFieldMulti(fKey, e) {
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

function renderInspectorRibbon() {
    const body = document.getElementById('inspector-panel-body');
    const targetLabel = document.getElementById('inspector-target-label');
    if (!body) return;

    const activeKey = paragraphSelectedFieldKey || (selectedFieldKeysList[0] || "Substitution words");
    const st = paragraphFieldStyles[activeKey] || paragraphFieldStyles["Substitution words"];

    if (targetLabel) {
        targetLabel.innerText = selectedFieldKeysList.length > 1 ? `${selectedFieldKeysList.length} trường` : `{{${activeKey}}}`;
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

function addNewGridGroupRow(isInsideLoop = true) {
    const nextId = paragraphGridConfig.groups.length + 1;
    const colCount = (paragraphGridConfig.gridMatrix && paragraphGridConfig.gridMatrix.columnCount) ? paragraphGridConfig.gridMatrix.columnCount : 2;
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];
    const assignedColor = colors[(nextId - 1) % colors.length];

    paragraphGridConfig.groups.push({
        id: nextId,
        name: `Lớp ${nextId}: Đối Tượng`,
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
    showToast(`Đã thêm Lớp đường ray ${nextId}!`);
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
                const count = (item.ttsSpeakFields || []).length;
                return `
                    <div class="flex items-center space-x-1 p-0.5 px-1.5 rounded-md bg-indigo-950/80 border border-indigo-700/80" onclick="event.stopPropagation(); openFloatingCardPopover(event, ${gIdx}, ${fIdx}, 'tts')">
                        <span class="text-[9px] font-bold text-indigo-200 flex items-center space-x-1 cursor-pointer">
                            <i data-lucide="volume-2" class="w-2.5 h-2.5 text-indigo-400"></i>
                            <span>AI Đọc (${count})</span>
                        </span>
                        <button onclick="event.stopPropagation(); removeFieldItemFromGroup(${gIdx}, ${fIdx})" class="text-rose-400 hover:text-white text-[10px] font-bold ml-1">✕</button>
                    </div>
                `;
            } else if (itemType === 'countdown') {
                const sec = item.seconds !== undefined ? item.seconds : 3;
                return `
                    <div class="flex items-center space-x-1 p-0.5 px-1.5 rounded-md bg-rose-950/80 border border-rose-700/80" onclick="event.stopPropagation(); openFloatingCardPopover(event, ${gIdx}, ${fIdx}, 'countdown')">
                        <span class="text-[9px] font-bold text-rose-200 flex items-center space-x-1 cursor-pointer">
                            <i data-lucide="timer" class="w-2.5 h-2.5 text-rose-400"></i>
                            <span>Đếm: ${sec}s</span>
                        </span>
                        <button onclick="event.stopPropagation(); removeFieldItemFromGroup(${gIdx}, ${fIdx})" class="text-rose-400 hover:text-white text-[10px] font-bold ml-1">✕</button>
                    </div>
                `;
            } else if (itemType === 'custom_text') {
                return `
                    <div class="flex items-center space-x-1 p-0.5 px-1.5 rounded-md bg-teal-950/80 border border-teal-700/80" onclick="event.stopPropagation(); openFloatingCardPopover(event, ${gIdx}, ${fIdx}, 'custom_text')">
                        <span class="text-[9px] font-bold text-teal-200 flex items-center space-x-1 cursor-pointer">
                            <i data-lucide="type" class="w-2.5 h-2.5 text-teal-400"></i>
                            <span>${(item.text || "Chữ").substring(0, 10)}...</span>
                        </span>
                        <button onclick="event.stopPropagation(); removeFieldItemFromGroup(${gIdx}, ${fIdx})" class="text-rose-400 hover:text-white text-[10px] font-bold ml-1">✕</button>
                    </div>
                `;
            } else {
                const fKey = typeof item === 'string' ? item : item.key;
                const isImg = fKey.toLowerCase().includes('anh') || fKey.toLowerCase().includes('dinh_kem');
                const isFieldSel = selectedFieldKeysList.includes(fKey) && isSel;
                const bgClass = isFieldSel ? 'bg-amber-500 text-black font-extrabold shadow' : (isImg ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-indigo-950 text-indigo-300 border border-indigo-800');

                return `
                    <div class="flex items-center space-x-1 p-0.5 px-1.5 rounded-md bg-slate-900 border border-slate-800" onclick="event.stopPropagation(); toggleSelectFieldMulti('${fKey}', event)">
                        <span class="text-[9px] font-bold flex items-center space-x-1 cursor-pointer hover:scale-105 transition rounded px-1 ${bgClass}">
                            <span>{{${fKey}}}</span>
                        </span>
                        <button onclick="event.stopPropagation(); removeFieldItemFromGroup(${gIdx}, ${fIdx})" class="text-rose-400 hover:text-white text-[10px] font-bold ml-0.5">✕</button>
                    </div>
                `;
            }
        }).join('');

        if (grp.fields.length === 0) fieldsChipsHtml = `<span class="text-slate-500 italic text-[9px]">Chưa có thẻ trong lớp</span>`;

        const curOffset = grp.startRowOffset !== undefined ? grp.startRowOffset : 0;
        const audioBadge = isAudio ? `<span class="bg-purple-950 text-purple-300 border border-purple-800 text-[8px] font-bold px-1 rounded flex items-center space-x-0.5"><i data-lucide="lock" class="w-2 h-2"></i><span>AI Khóa</span></span>` : `<span class="bg-slate-800 text-slate-400 text-[8px] px-1 rounded">Tĩnh</span>`;

        blockDiv.innerHTML = `
            <div class="flex items-center justify-between gap-1 border-b border-slate-800/80 pb-1">
                <div class="flex items-center space-x-1.5 truncate">
                    <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${grp.trackColor || '#3b82f6'};"></span>
                    <input type="text" value="${grp.name || `Lớp ${gIdx + 1}`}" onchange="event.stopPropagation(); updateGroupName(${gIdx}, this.value)" class="bg-transparent border-0 font-bold text-slate-200 text-xs focus:ring-0 truncate w-24">
                    ${audioBadge}
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

    if (type === 'tts_voice') {
        grp.fields.push({ type: "tts", ttsSpeakFields: ["Substitution Drills"] });
        grp.trackColor = "#8b5cf6";
        autoRecalculateAudioLayersDuration();
        showToast("Đã thêm Thẻ Giọng Đọc AI & Khóa độ dài Timeline!");
    } else if (type === 'countdown_timer') {
        grp.fields.push({ type: "countdown", seconds: 3, position: "top_right", size: "medium" });
        showToast("Đã thêm Đồng Hồ Đếm Ngược!");
    } else if (type === 'custom_text') {
        grp.fields.push({ type: "custom_text", text: "Ghi chú tiêu đề ở đây" });
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
