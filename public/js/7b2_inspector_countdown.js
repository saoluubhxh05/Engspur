/**
 * 7b2_inspector_countdown.js
 * Bảng điều khiển thanh Ribbon chuyên biệt cho các tiện ích đặc biệt:
 * Đồng hồ đếm ngược (renderCountdownInspectorRibbon), Thẻ tiến độ (renderProgressTrackerInspectorRibbon)
 * và Thẻ âm thanh SFX (renderAudioSfxInspectorRibbon)
 */

function renderCountdownInspectorRibbon(item, gIdx, fIdx) {
    const body = document.getElementById('inspector-panel-body');
    const targetLabel = document.getElementById('inspector-target-label');
    if (!body) return;

    if (targetLabel) {
        targetLabel.innerHTML = `<span class="flex items-center space-x-1"><i data-lucide="timer" class="w-3 h-3 text-rose-400"></i><span>Đồng Hồ Đếm Ngược (Lớp ${gIdx + 1})</span></span>`;
        targetLabel.className = "text-[9px] font-extrabold bg-rose-950 text-rose-300 border border-rose-700/80 px-2 py-0.5 rounded shadow-sm";
    }

    const sec = item.seconds !== undefined ? item.seconds : 3;
    const curPreset = item.preset || 'green_to_red';
    const isColorShift = item.colorShift !== false;
    const enableTick = item.enableTickSound !== false;
    const soundType = item.tickSoundType || 'mechanical';
    const tickVol = item.tickVolume !== undefined ? item.tickVolume : 80;
    const playChime = item.playEndChime !== false;
    const pos = item.position || 'top_right';
    const size = item.size || 'medium';
    const opacity = item.opacity !== undefined ? item.opacity : 100;
    const bgColor = item.bgColor !== undefined ? item.bgColor : '#0f172a';
    const isTransparentBg = (bgColor === 'transparent' || bgColor === 'none' || item.bgOpacity === 0);
    const bgOpacity = (item.bgOpacity !== undefined && !isNaN(Number(item.bgOpacity))) ? Number(item.bgOpacity) : (isTransparentBg ? 0 : 92);
    const textColor = item.textColor || '#ffffff';
    const textShadow = (item.textShadow !== false);
    const shadowColor = item.shadowColor || 'rgba(0, 0, 0, 0.85)';
    const textGlow = !!item.textGlow;
    const glowColor = item.glowColor || textColor;
    const textStroke = (item.textStroke !== false);
    const strokeColor = item.strokeColor || '#000000';
    const strokeWidth = (item.strokeWidth !== undefined && !isNaN(Number(item.strokeWidth))) ? Number(item.strokeWidth) : 3;

    // Tính toán kích thước Pixel chính xác
    let radius = 34;
    if (item.radius !== undefined && item.radius !== null && !isNaN(Number(item.radius)) && Number(item.radius) > 0) {
        radius = Number(item.radius);
    } else if (size === 'small') {
        radius = 24;
    } else if (size === 'large') {
        radius = 46;
    } else if (size === 'xlarge') {
        radius = 58;
    } else if (size === 'huge') {
        radius = 80;
    }

    // Tự động tính tọa độ Pixel mặc định theo khung Canvas
    const cWidth = (typeof pCanvas !== 'undefined' && pCanvas && pCanvas.width) ? pCanvas.width : 1920;
    const cHeight = (typeof pCanvas !== 'undefined' && pCanvas && pCanvas.height) ? pCanvas.height : 1080;
    const marginDefault = Math.max(radius + 24, 68);
    let defX = cWidth - marginDefault;
    let defY = marginDefault;
    if (pos === 'top_left') {
        defX = marginDefault; defY = marginDefault;
    } else if (pos === 'center') {
        defX = Math.round(cWidth / 2); defY = Math.round(cHeight / 2);
    } else if (pos === 'bottom_center') {
        defX = Math.round(cWidth / 2); defY = cHeight - marginDefault - 8;
    } else if (pos === 'bottom_right') {
        defX = cWidth - marginDefault; defY = cHeight - marginDefault - 8;
    } else if (pos === 'bottom_left') {
        defX = marginDefault; defY = cHeight - marginDefault - 8;
    }

    const posX = (item.posX !== undefined && item.posX !== null && !isNaN(Number(item.posX))) ? Math.round(Number(item.posX)) : Math.round(defX);
    const posY = (item.posY !== undefined && item.posY !== null && !isNaN(Number(item.posY))) ? Math.round(Number(item.posY)) : Math.round(defY);

    const isCustomFont = (item.fontSize !== undefined && item.fontSize !== null && Number(item.fontSize) > 0);
    const customFontSize = isCustomFont ? Number(item.fontSize) : 0;
    const effectiveFontSize = isCustomFont ? customFontSize : Math.max(12, Math.round(radius * 0.82));

    const presetsList = [
        { id: 'speaking_ring', title: 'Vòng Tròn Speaking', desc: 'Đổi màu Xanh ➔ Đỏ, viền mảnh không nền, số giây & nhãn', icon: 'mic', badge: 'Mới' },
        { id: 'green_to_red', title: 'Xanh ➔ Đỏ (Cảnh Báo)', desc: 'Chuyển màu Xanh -> Vàng -> Đỏ khi cạn giờ', icon: 'sparkles', badge: 'Hot' },
        { id: 'neon_ring', title: 'Vòng Neon Hiện Đại', desc: 'Vòng tròn phát sáng neon quét 360°', icon: 'circle-dot', badge: 'Modern' },
        { id: 'digital_badge', title: 'Digital LED Thể Thao', desc: 'Đồng hồ điện tử viền sáng kèm thanh bar', icon: 'watch', badge: 'LED' },
        { id: 'minimal_pill', title: 'Pill Tối Giản', desc: 'Viên thuốc thanh lịch kèm icon đồng hồ', icon: 'pill', badge: 'Clean' },
        { id: 'bomb_pulse', title: 'Quả Bom Kịch Tính', desc: 'Hiệu ứng nhịp đập rung lắc dồn dập', icon: 'flame', badge: 'Pulse' },
        { id: 'classic_circle', title: 'Cổ Điển Bo Tròn', desc: 'Hình tròn nguyên bản đỏ đơn giản', icon: 'circle', badge: 'Classic' }
    ];

    body.innerHTML = `
        <div class="space-y-3 text-xs">
            ${(typeof renderCardZOrderToolbarHtml === 'function') ? renderCardZOrderToolbarHtml(gIdx, fIdx, 'countdown') : ''}

            <!-- NÚT ÁP DỤNG CHUNG CHO TOÀN BỘ ĐỒNG HỒ (ACCORDION MỌI KỊCH BẢN) -->
            ${(typeof renderBatchStyleAccordionUI === 'function') ? renderBatchStyleAccordionUI('countdown') : ''}

            <!-- 1. BỘ PRESETS ĐỒNG HỒ ĐẾM NGƯỢC -->
            <div class="space-y-2 bg-slate-900 p-2.5 rounded-xl border border-rose-500/40 shadow">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-extrabold text-rose-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <i data-lucide="palette" class="w-3.5 h-3.5 text-rose-400"></i>
                        <span>Presets Đồng Hồ Đếm Ngược</span>
                    </span>
                    <span class="text-[8px] bg-rose-950 text-rose-300 font-extrabold px-1.5 py-0.5 rounded border border-rose-800">7 Giao Diện</span>
                </div>

                <div class="grid grid-cols-2 gap-1.5 pt-1">
                    ${presetsList.map(p => {
                        const isSel = (curPreset === p.id);
                        return `
                            <button type="button" onclick="setCountdownPreset(${gIdx}, ${fIdx}, '${p.id}')" class="text-left p-1.5 rounded-lg border transition cursor-pointer flex flex-col justify-between ${isSel ? 'bg-rose-950/90 border-rose-400 ring-1 ring-rose-400/50 shadow-md' : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'}">
                                <div class="flex items-center justify-between w-full mb-0.5">
                                    <span class="text-[9px] font-extrabold ${isSel ? 'text-white' : 'text-slate-200'} flex items-center space-x-1">
                                        <i data-lucide="${p.icon}" class="w-2.5 h-2.5 ${isSel ? 'text-rose-400' : 'text-slate-400'}"></i>
                                        <span class="truncate">${p.title}</span>
                                    </span>
                                    <span class="text-[7px] font-bold px-1 rounded ${isSel ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'}">${p.badge}</span>
                                </div>
                                <span class="text-[7.5px] text-slate-400 leading-tight line-clamp-1">${p.desc}</span>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- 2. HIỆU ỨNG ĐỔI MÀU TỪ XANH SANG ĐỎ (COLOR SHIFT) -->
            <div class="space-y-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 shadow">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <i data-lucide="sun-medium" class="w-3.5 h-3.5 text-amber-400"></i>
                        <span>Đổi Màu Theo Thời Gian</span>
                    </span>
                    <label class="flex items-center space-x-1.5 cursor-pointer">
                        <input type="checkbox" ${isColorShift ? 'checked' : ''} onchange="updateCountdownProp(${gIdx}, ${fIdx}, 'colorShift', this.checked)" class="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 w-3.5 h-3.5">
                        <span class="text-[9px] font-bold ${isColorShift ? 'text-emerald-300' : 'text-slate-400'}">Kích hoạt</span>
                    </label>
                </div>

                <div class="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div class="flex items-center justify-between text-[8px] font-extrabold">
                        <span class="text-emerald-400 flex items-center space-x-0.5"><span>●</span><span>>50%: Xanh lá</span></span>
                        <span class="text-amber-400 flex items-center space-x-0.5"><span>●</span><span>20-50%: Vàng cam</span></span>
                        <span class="text-rose-400 flex items-center space-x-0.5"><span>●</span><span><20%: Đỏ cảnh báo</span></span>
                    </div>
                    <!-- Thanh dải màu trực quan -->
                    <div class="w-full h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 shadow-inner"></div>
                    <span class="text-[8px] text-slate-400 italic block text-center">Tự động đổi màu từ Xanh sang Đỏ khi sắp hết giờ để cảnh báo khẩn cấp.</span>
                </div>
            </div>

            <!-- 3. THỜI LƯỢNG & PHÍM TẮT NHANH -->
            <div class="space-y-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 shadow">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <i data-lucide="clock" class="w-3.5 h-3.5 text-indigo-400"></i>
                        <span>Thời Lượng Đếm Ngược</span>
                    </span>
                    <span class="text-[9px] font-extrabold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/80">${sec} Giây</span>
                </div>

                <div class="flex items-center space-x-2">
                    <div class="w-20">
                        <input type="number" min="1" max="300" value="${sec}" onchange="updateCountdownProp(${gIdx}, ${fIdx}, 'seconds', parseInt(this.value, 10))" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-amber-300 font-extrabold text-center text-xs">
                    </div>
                    <div class="flex-1 grid grid-cols-6 gap-1">
                        ${[3, 5, 10, 15, 30, 45].map(s => `
                            <button type="button" onclick="updateCountdownProp(${gIdx}, ${fIdx}, 'seconds', ${s})" class="py-1 px-1 rounded text-[8px] font-extrabold border transition ${sec === s ? 'bg-indigo-600 border-indigo-400 text-white shadow' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'}">
                                ${s}s
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- 4. ÂM THANH TÍCH TẮC KHI ĐẾM NGƯỢC (AUDIO ENGINE) -->
            <div class="space-y-2 bg-slate-900 p-2.5 rounded-xl border border-rose-500/40 shadow">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-extrabold text-rose-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <i data-lucide="volume-2" class="w-3.5 h-3.5 text-rose-400"></i>
                        <span>Âm Thanh Tích Tắc Đếm Ngược</span>
                    </span>
                    <label class="flex items-center space-x-1.5 cursor-pointer">
                        <input type="checkbox" ${enableTick ? 'checked' : ''} onchange="updateCountdownProp(${gIdx}, ${fIdx}, 'enableTickSound', this.checked)" class="rounded bg-slate-950 border-slate-700 text-rose-500 focus:ring-0 w-3.5 h-3.5">
                        <span class="text-[9px] font-bold ${enableTick ? 'text-rose-300' : 'text-slate-400'}">Bật tiếng</span>
                    </label>
                </div>

                <div class="space-y-2 pt-0.5">
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-[8.5px] text-slate-400 block mb-0.5 font-bold">Kiểu tiếng tích tắc</label>
                            <select onchange="updateCountdownProp(${gIdx}, ${fIdx}, 'tickSoundType', this.value)" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-slate-200 font-bold text-[10px]">
                                <option value="mechanical" ${soundType === 'mechanical' ? 'selected' : ''}>Cơ học (Đồng hồ thật)</option>
                                <option value="beep" ${soundType === 'beep' ? 'selected' : ''}>Điện tử (Digital Bíp)</option>
                                <option value="wood" ${soundType === 'wood' ? 'selected' : ''}>Gõ gỗ (Woodblock ấm)</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[8.5px] text-slate-400 block mb-0.5 font-bold">Âm lượng tích tắc: <span class="text-rose-300 font-extrabold">${tickVol}%</span></label>
                            <input type="range" min="10" max="100" step="5" value="${tickVol}" oninput="updateCountdownProp(${gIdx}, ${fIdx}, 'tickVolume', parseInt(this.value, 10))" class="w-full accent-rose-500 mt-1 cursor-pointer">
                        </div>
                    </div>

                    <div class="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/80 border border-slate-800">
                        <label class="flex items-center space-x-1.5 cursor-pointer text-[9px] font-bold text-slate-300">
                            <input type="checkbox" ${playChime ? 'checked' : ''} onchange="updateCountdownProp(${gIdx}, ${fIdx}, 'playEndChime', this.checked)" class="rounded bg-slate-950 border-slate-700 text-rose-500 focus:ring-0 w-3 h-3">
                            <span>Phát chuông Ting/Ding khi hết giờ (0s)</span>
                        </label>
                    </div>

                    <!-- Nút nghe thử âm thanh & chạy thử đếm ngược -->
                    <div class="grid grid-cols-2 gap-1.5 pt-1">
                        <button type="button" onclick="testCountdownAudioSound(${gIdx}, ${fIdx})" class="py-1.5 px-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-600/70 text-rose-200 rounded-lg text-[9px] font-extrabold flex items-center justify-center space-x-1 transition active:scale-95 shadow cursor-pointer">
                            <i data-lucide="volume-2" class="w-3 h-3 text-rose-400"></i>
                            <span>Nghe Thử Tích Tắc</span>
                        </button>
                        <button type="button" onclick="previewCountdownLiveAnimation(${gIdx}, ${fIdx})" class="py-1.5 px-2 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-600/70 text-indigo-200 rounded-lg text-[9px] font-extrabold flex items-center justify-center space-x-1 transition active:scale-95 shadow cursor-pointer">
                            <i data-lucide="play" class="w-3 h-3 text-indigo-400"></i>
                            <span>Chạy Thử Timeline</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- 5. VỊ TRÍ HIỂN THỊ (TỌA ĐỘ PIXEL X, Y) -->
            <div class="space-y-2.5 bg-slate-900 p-2.5 rounded-xl border border-rose-500/40 shadow">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-extrabold text-rose-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <i data-lucide="crosshair" class="w-3.5 h-3.5 text-rose-400"></i>
                        <span>Vị Trí Tọa Độ Pixel (X, Y)</span>
                    </span>
                    <span id="cd-pos-coord-badge" class="text-[9px] font-mono font-extrabold text-rose-300 bg-rose-950/90 px-2 py-0.5 rounded border border-rose-800 shadow-inner">
                        X: ${posX}px | Y: ${posY}px
                    </span>
                </div>

                <!-- Phím tắt căn vị trí nhanh (6 góc chuẩn) -->
                <div>
                    <span class="text-[8px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Căn Nhanh Vị Trí Chuẩn</span>
                    <div class="grid grid-cols-3 gap-1">
                        <button type="button" onclick="updateCountdownPositionPreset(${gIdx}, ${fIdx}, 'top_left')" class="p-1 rounded text-[8.5px] font-bold border transition cursor-pointer flex items-center justify-center space-x-1 ${pos === 'top_left' ? 'bg-rose-950 border-rose-400 text-rose-200' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'}">
                            <span>↖ Trên-Trái</span>
                        </button>
                        <button type="button" onclick="updateCountdownPositionPreset(${gIdx}, ${fIdx}, 'center')" class="p-1 rounded text-[8.5px] font-bold border transition cursor-pointer flex items-center justify-center space-x-1 ${pos === 'center' ? 'bg-rose-950 border-rose-400 text-rose-200' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'}">
                            <span>⊙ Giữa Màn</span>
                        </button>
                        <button type="button" onclick="updateCountdownPositionPreset(${gIdx}, ${fIdx}, 'top_right')" class="p-1 rounded text-[8.5px] font-bold border transition cursor-pointer flex items-center justify-center space-x-1 ${pos === 'top_right' ? 'bg-rose-950 border-rose-400 text-rose-200' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'}">
                            <span>↗ Trên-Phải</span>
                        </button>
                        <button type="button" onclick="updateCountdownPositionPreset(${gIdx}, ${fIdx}, 'bottom_left')" class="p-1 rounded text-[8.5px] font-bold border transition cursor-pointer flex items-center justify-center space-x-1 ${pos === 'bottom_left' ? 'bg-rose-950 border-rose-400 text-rose-200' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'}">
                            <span>↙ Dưới-Trái</span>
                        </button>
                        <button type="button" onclick="updateCountdownPositionPreset(${gIdx}, ${fIdx}, 'bottom_center')" class="p-1 rounded text-[8.5px] font-bold border transition cursor-pointer flex items-center justify-center space-x-1 ${pos === 'bottom_center' ? 'bg-rose-950 border-rose-400 text-rose-200' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'}">
                            <span>↓ Đáy-Giữa</span>
                        </button>
                        <button type="button" onclick="updateCountdownPositionPreset(${gIdx}, ${fIdx}, 'bottom_right')" class="p-1 rounded text-[8.5px] font-bold border transition cursor-pointer flex items-center justify-center space-x-1 ${pos === 'bottom_right' ? 'bg-rose-950 border-rose-400 text-rose-200' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'}">
                            <span>↘ Dưới-Phải</span>
                        </button>
                    </div>
                </div>

                <!-- Điều chỉnh chi tiết tọa độ X (Pixel) -->
                <div class="bg-slate-950/80 p-2 rounded-lg border border-slate-800 space-y-1">
                    <div class="flex items-center justify-between text-[8.5px] font-bold text-slate-300">
                        <span class="flex items-center space-x-1">
                            <span class="text-rose-400">↔</span>
                            <span>Tọa độ X (Ngang, Pixel)</span>
                        </span>
                        <span id="cd-posx-val" class="font-mono text-rose-400 font-extrabold text-[9.5px]">${posX}px</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <input id="cd-posx-slider" type="range" min="0" max="${cWidth}" step="2" value="${posX}" oninput="updateCountdownPixelCoord(${gIdx}, ${fIdx}, 'posX', this.value, true)" onchange="updateCountdownPixelCoord(${gIdx}, ${fIdx}, 'posX', this.value, false)" class="flex-1 accent-rose-500 cursor-pointer">
                        <input id="cd-posx-input" type="number" min="0" max="${cWidth + 500}" step="1" value="${posX}" onchange="updateCountdownPixelCoord(${gIdx}, ${fIdx}, 'posX', this.value, false)" class="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-rose-300 font-mono text-right font-extrabold text-[10px]">
                    </div>
                </div>

                <!-- Điều chỉnh chi tiết tọa độ Y (Pixel) -->
                <div class="bg-slate-950/80 p-2 rounded-lg border border-slate-800 space-y-1">
                    <div class="flex items-center justify-between text-[8.5px] font-bold text-slate-300">
                        <span class="flex items-center space-x-1">
                            <span class="text-rose-400">↕</span>
                            <span>Tọa độ Y (Dọc, Pixel)</span>
                        </span>
                        <span id="cd-posy-val" class="font-mono text-rose-400 font-extrabold text-[9.5px]">${posY}px</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <input id="cd-posy-slider" type="range" min="0" max="${cHeight}" step="2" value="${posY}" oninput="updateCountdownPixelCoord(${gIdx}, ${fIdx}, 'posY', this.value, true)" onchange="updateCountdownPixelCoord(${gIdx}, ${fIdx}, 'posY', this.value, false)" class="flex-1 accent-rose-500 cursor-pointer">
                        <input id="cd-posy-input" type="number" min="0" max="${cHeight + 500}" step="1" value="${posY}" onchange="updateCountdownPixelCoord(${gIdx}, ${fIdx}, 'posY', this.value, false)" class="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-rose-300 font-mono text-right font-extrabold text-[10px]">
                    </div>
                </div>

                <!-- Nút dịch chuyển vi sai (Nudge ±10px) -->
                <div class="flex items-center justify-between pt-0.5">
                    <span class="text-[8px] text-slate-400 italic">Dịch nhanh:</span>
                    <div class="flex items-center space-x-1">
                        <button type="button" onclick="nudgeCountdownPixel(${gIdx}, ${fIdx}, -10, 0)" class="py-0.5 px-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded text-[8px] font-mono font-bold transition cursor-pointer">⬅ -10px</button>
                        <button type="button" onclick="nudgeCountdownPixel(${gIdx}, ${fIdx}, 10, 0)" class="py-0.5 px-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded text-[8px] font-mono font-bold transition cursor-pointer">➡ +10px</button>
                        <button type="button" onclick="nudgeCountdownPixel(${gIdx}, ${fIdx}, 0, -10)" class="py-0.5 px-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded text-[8px] font-mono font-bold transition cursor-pointer">⬆ -10px</button>
                        <button type="button" onclick="nudgeCountdownPixel(${gIdx}, ${fIdx}, 0, 10)" class="py-0.5 px-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded text-[8px] font-mono font-bold transition cursor-pointer">⬇ +10px</button>
                    </div>
                </div>
            </div>

            <!-- 6. KÍCH THƯỚC ĐỒNG HỒ (BÁN KÍNH, ĐƯỜNG KÍNH & CỠ CHỮ PIXEL) -->
            <div class="space-y-2.5 bg-slate-900 p-2.5 rounded-xl border border-amber-500/40 shadow">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <i data-lucide="maximize-2" class="w-3.5 h-3.5 text-amber-400"></i>
                        <span>Kích Thước Đồng Hồ (Pixel)</span>
                    </span>
                    <span id="cd-size-badge" class="text-[9px] font-mono font-extrabold text-amber-300 bg-amber-950/90 px-2 py-0.5 rounded border border-amber-800 shadow-inner">
                        R: ${radius}px (Ø ${radius * 2}px)
                    </span>
                </div>

                <!-- Chọn nhanh kích thước tiêu chuẩn -->
                <div>
                    <span class="text-[8px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Cỡ Chuẩn Định Sẵn</span>
                    <div class="grid grid-cols-5 gap-1">
                        <button type="button" onclick="setCountdownPresetSize(${gIdx}, ${fIdx}, 24, 'small')" class="p-1 rounded text-[8px] font-bold border transition cursor-pointer text-center ${radius === 24 ? 'bg-amber-950 border-amber-400 text-amber-200 shadow' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'}">
                            <div>Nhỏ</div>
                            <div class="text-[7px] text-slate-400 font-mono">24px</div>
                        </button>
                        <button type="button" onclick="setCountdownPresetSize(${gIdx}, ${fIdx}, 34, 'medium')" class="p-1 rounded text-[8px] font-bold border transition cursor-pointer text-center ${radius === 34 ? 'bg-amber-950 border-amber-400 text-amber-200 shadow' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'}">
                            <div>Vừa</div>
                            <div class="text-[7px] text-slate-400 font-mono">34px</div>
                        </button>
                        <button type="button" onclick="setCountdownPresetSize(${gIdx}, ${fIdx}, 46, 'large')" class="p-1 rounded text-[8px] font-bold border transition cursor-pointer text-center ${radius === 46 ? 'bg-amber-950 border-amber-400 text-amber-200 shadow' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'}">
                            <div>Lớn</div>
                            <div class="text-[7px] text-slate-400 font-mono">46px</div>
                        </button>
                        <button type="button" onclick="setCountdownPresetSize(${gIdx}, ${fIdx}, 58, 'xlarge')" class="p-1 rounded text-[8px] font-bold border transition cursor-pointer text-center ${radius === 58 ? 'bg-amber-950 border-amber-400 text-amber-200 shadow' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'}">
                            <div>Cực Đại</div>
                            <div class="text-[7px] text-slate-400 font-mono">58px</div>
                        </button>
                        <button type="button" onclick="setCountdownPresetSize(${gIdx}, ${fIdx}, 80, 'huge')" class="p-1 rounded text-[8px] font-bold border transition cursor-pointer text-center ${radius === 80 ? 'bg-amber-950 border-amber-400 text-amber-200 shadow' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'}">
                            <div>Khổng Lồ</div>
                            <div class="text-[7px] text-slate-400 font-mono">80px</div>
                        </button>
                    </div>
                </div>

                <!-- Điều chỉnh Bán kính / Kích thước chính xác (Pixel) -->
                <div class="bg-slate-950/80 p-2 rounded-lg border border-slate-800 space-y-1">
                    <div class="flex items-center justify-between text-[8.5px] font-bold text-slate-300">
                        <span>Bán kính đồng hồ (Radius pixel):</span>
                        <span id="cd-radius-val" class="font-mono text-amber-400 font-extrabold text-[9.5px]">${radius}px | Đường kính: ${radius * 2}px</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <input id="cd-radius-slider" type="range" min="14" max="180" step="1" value="${radius}" oninput="updateCountdownPixelSize(${gIdx}, ${fIdx}, 'radius', this.value, true)" onchange="updateCountdownPixelSize(${gIdx}, ${fIdx}, 'radius', this.value, false)" class="flex-1 accent-amber-500 cursor-pointer">
                        <input id="cd-radius-input" type="number" min="10" max="300" step="1" value="${radius}" onchange="updateCountdownPixelSize(${gIdx}, ${fIdx}, 'radius', this.value, false)" class="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-amber-300 font-mono text-right font-extrabold text-[10px]">
                    </div>
                </div>

                <!-- Điều chỉnh Cỡ chữ số đếm ngược (Font Size Pixel) -->
                <div class="bg-slate-950/80 p-2 rounded-lg border border-slate-800 space-y-1">
                    <div class="flex items-center justify-between text-[8.5px] font-bold text-slate-300">
                        <span>Cỡ chữ số đếm ngược:</span>
                        <span id="cd-font-val" class="font-mono text-indigo-300 font-extrabold text-[9px]">${effectiveFontSize}px ${isCustomFont ? '(Tùy chỉnh)' : '(Tự động 82%)'}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <input id="cd-font-slider" type="range" min="0" max="150" step="1" value="${customFontSize}" oninput="updateCountdownPixelSize(${gIdx}, ${fIdx}, 'fontSize', this.value, true)" onchange="updateCountdownPixelSize(${gIdx}, ${fIdx}, 'fontSize', this.value, false)" class="flex-1 accent-indigo-500 cursor-pointer">
                        <input id="cd-font-input" type="number" min="0" max="250" step="1" value="${customFontSize}" placeholder="0 = Tự động" onchange="updateCountdownPixelSize(${gIdx}, ${fIdx}, 'fontSize', this.value, false)" class="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-indigo-300 font-mono text-right font-extrabold text-[10px]">
                    </div>
                    <span class="text-[7.5px] text-slate-400 italic block">Nhập 0 để tự động co dãn theo tỷ lệ chuẩn của bán kính (${Math.round(radius * 0.82)}px).</span>
                </div>

                <!-- Độ mờ đục (Opacity) -->
                <div>
                    <div class="flex items-center justify-between text-[8.5px] font-bold text-slate-400 mb-0.5">
                        <span>Độ mờ đục toàn thẻ (Opacity)</span>
                        <span id="cd-opacity-val" class="text-slate-200 font-bold font-mono">${opacity}%</span>
                    </div>
                    <input type="range" min="15" max="100" step="5" value="${opacity}" oninput="const b = document.getElementById('cd-opacity-val'); if (b) b.innerText = this.value + '%'; updateCountdownProp(${gIdx}, ${fIdx}, 'opacity', parseInt(this.value, 10), true)" onchange="updateCountdownProp(${gIdx}, ${fIdx}, 'opacity', parseInt(this.value, 10), false)" class="w-full accent-slate-400 cursor-pointer">
                </div>
            </div>

            <!-- 7. MÀU NỀN ĐỒNG HỒ (TƯƠNG PHẢN VÒNG MÀU) -->
            <div class="space-y-2.5 bg-slate-900 p-2.5 rounded-xl border border-rose-500/40 shadow">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-extrabold text-rose-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <i data-lucide="paint-bucket" class="w-3.5 h-3.5 text-rose-400"></i>
                        <span>Màu Nền Đồng Hồ (Tương Phản Vòng Màu)</span>
                    </span>
                    <div class="flex items-center space-x-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        <span id="cd-bgcolor-dot" class="w-3 h-3 rounded-full border border-white/50 inline-block shadow" style="${isTransparentBg ? 'background: repeating-linear-gradient(45deg, #475569, #475569 2px, #0f172a 2px, #0f172a 4px);' : 'background-color: ' + bgColor + ';'}"></span>
                        <span id="cd-bgcolor-text" class="text-[9px] font-mono font-extrabold text-rose-200 uppercase">${isTransparentBg ? 'Trong Suốt' : bgColor}</span>
                    </div>
                </div>

                <!-- 3 PHÍM CHỌN NHANH CHẾ ĐỘ NỀN -->
                <div>
                    <span class="text-[8px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">Chọn Nhanh Chế Độ Nền</span>
                    <div class="grid grid-cols-3 gap-1">
                        <button type="button" onclick="setCountdownBgPreset(${gIdx}, ${fIdx}, 'black')" class="p-1.5 rounded-lg border transition cursor-pointer text-center flex flex-col items-center justify-center ${(!isTransparentBg && (bgColor === '#000000' || bgColor.toLowerCase() === '#000')) ? 'bg-rose-950 border-rose-400 text-rose-200 shadow ring-1 ring-rose-400/50' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'}" title="Nền đen tuyền giúp vòng tròn quét màu Xanh-Vàng-Đỏ tương phản rực rỡ nhất">
                            <span class="text-[8.5px] font-extrabold text-white flex items-center space-x-1">
                                <span class="w-2 h-2 rounded-full bg-black border border-white/50 inline-block"></span>
                                <span>Đen Đậm Siêu Rõ</span>
                            </span>
                            <span class="text-[7px] text-rose-300 font-bold">Khuyên dùng ★</span>
                        </button>
                        <button type="button" onclick="setCountdownBgPreset(${gIdx}, ${fIdx}, 'transparent')" class="p-1.5 rounded-lg border transition cursor-pointer text-center flex flex-col items-center justify-center ${isTransparentBg ? 'bg-rose-950 border-rose-400 text-rose-200 shadow ring-1 ring-rose-400/50' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'}" title="Không nền, chỉ hiện vòng tròn và chữ số nổi trực tiếp trên video">
                            <span class="text-[8.5px] font-extrabold text-white flex items-center space-x-1">
                                <span class="w-2 h-2 rounded-full border border-dashed border-white inline-block"></span>
                                <span>Trong Suốt 100%</span>
                            </span>
                            <span class="text-[7px] text-slate-400">Không nền</span>
                        </button>
                        <button type="button" onclick="setCountdownBgPreset(${gIdx}, ${fIdx}, 'slate')" class="p-1.5 rounded-lg border transition cursor-pointer text-center flex flex-col items-center justify-center ${(!isTransparentBg && bgColor.toLowerCase() === '#0f172a') ? 'bg-rose-950 border-rose-400 text-rose-200 shadow ring-1 ring-rose-400/50' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'}" title="Màu xám than cổ điển ban đầu">
                            <span class="text-[8.5px] font-extrabold text-white flex items-center space-x-1">
                                <span class="w-2 h-2 rounded-full bg-slate-800 border border-slate-600 inline-block"></span>
                                <span>Xám Slate Chuẩn</span>
                            </span>
                            <span class="text-[7px] text-slate-400">Mặc định</span>
                        </button>
                    </div>
                </div>

                <!-- BỘ CHỌN MÀU TỰ DO & BẢNG MÀU PHỔ BIẾN -->
                <div class="bg-slate-950/80 p-2 rounded-lg border border-slate-800 space-y-1.5">
                    <div class="flex items-center justify-between">
                        <span class="text-[8.5px] text-slate-300 font-bold">Bảng màu tự chọn (Color Picker):</span>
                        <div class="flex items-center space-x-2">
                            <button type="button" onclick="setCountdownBgPreset(${gIdx}, ${fIdx}, 'transparent')" class="text-[8px] text-amber-400 hover:text-amber-300 underline cursor-pointer">Trong suốt</button>
                            <button type="button" onclick="setCountdownBgPreset(${gIdx}, ${fIdx}, 'black')" class="text-[8px] text-rose-400 hover:text-rose-300 underline cursor-pointer">Đen đậm</button>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <input id="cd-bgcolor-picker" type="color" value="${(!isTransparentBg && bgColor.startsWith('#') && bgColor.length === 7) ? bgColor : '#000000'}" oninput="updateCountdownBgColor(${gIdx}, ${fIdx}, this.value, true)" onchange="updateCountdownBgColor(${gIdx}, ${fIdx}, this.value, false)" class="w-9 h-8 rounded border border-slate-700 bg-slate-900 p-0.5 cursor-pointer">
                        <input id="cd-bgcolor-hex" type="text" value="${isTransparentBg ? 'transparent' : bgColor}" onchange="updateCountdownBgColor(${gIdx}, ${fIdx}, this.value, false)" class="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-rose-300 uppercase focus:border-rose-400 focus:outline-none">
                        <span class="text-[8px] text-slate-400 flex-1">Chọn mã màu nền</span>
                    </div>

                    <!-- Bảng màu nền nhanh (8 màu chuẩn tương phản) -->
                    <div class="pt-1">
                        <span class="text-[8px] text-slate-400 font-bold block mb-1">Màu nền tối ưu tương phản:</span>
                        <div class="grid grid-cols-8 gap-1">
                            ${[
                                { c: '#000000', name: 'Đen Tuyền Tuyệt Đối' },
                                { c: '#080c14', name: 'Đen Than Siêu Sâu' },
                                { c: '#0f172a', name: 'Xám Slate Đậm' },
                                { c: '#091e42', name: 'Xanh Đêm Deep Navy' },
                                { c: '#1e1b4b', name: 'Tím Đậm Dark Violet' },
                                { c: '#450a0a', name: 'Nâu Đỏ Rượu Dark Burgundy' },
                                { c: '#052e16', name: 'Xanh Rêu Đậm Deep Forest' },
                                { c: '#ffffff', name: 'Trắng Sáng Light Disc' }
                            ].map(itemColor => `
                                <button type="button" title="${itemColor.name} (${itemColor.c})" onclick="updateCountdownBgColor(${gIdx}, ${fIdx}, '${itemColor.c}')" class="h-6 rounded border transition cursor-pointer flex items-center justify-center ${(!isTransparentBg && bgColor.toLowerCase() === itemColor.c.toLowerCase()) ? 'border-rose-400 ring-2 ring-rose-400/50 scale-105' : 'border-slate-700 hover:border-slate-500'}" style="background-color: ${itemColor.c};">
                                    ${(!isTransparentBg && bgColor.toLowerCase() === itemColor.c.toLowerCase()) ? '<span class="text-[10px] ' + (itemColor.c === '#ffffff' ? 'text-black' : 'text-white') + ' font-black">✓</span>' : ''}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- ĐIỀU CHỈNH ĐỘ MỜ ĐỤC NỀN (BACKGROUND OPACITY) -->
                <div class="bg-slate-950/80 p-2 rounded-lg border border-slate-800 space-y-1">
                    <div class="flex items-center justify-between text-[8.5px] font-bold text-slate-300">
                        <span class="flex items-center space-x-1">
                            <span class="text-rose-400">◐</span>
                            <span>Độ đậm đặc nền (Background Opacity)</span>
                        </span>
                        <span id="cd-bgopacity-val" class="font-mono text-rose-300 font-extrabold text-[9.5px]">${isTransparentBg ? '0%' : bgOpacity + '%'}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <input id="cd-bgopacity-slider" type="range" min="0" max="100" step="5" value="${isTransparentBg ? 0 : bgOpacity}" oninput="updateCountdownBgOpacity(${gIdx}, ${fIdx}, this.value, true)" onchange="updateCountdownBgOpacity(${gIdx}, ${fIdx}, this.value, false)" class="flex-1 accent-rose-500 cursor-pointer">
                        <span class="text-[8px] text-slate-400 w-16 text-right">${isTransparentBg ? 'Trong suốt' : (bgOpacity >= 95 ? 'Đậm đặc' : 'Mờ nhẹ')}</span>
                    </div>
                    <span class="text-[7.5px] text-slate-400 italic block">Kéo về 0% để nền trong suốt hoàn toàn, hoặc tăng lên 95%-100% để vòng tròn quét màu hiển thị rõ nét nhất trên mọi khung hình.</span>
                </div>
            </div>

            <!-- 8. MÀU SẮC CHỮ SỐ & HIỆU ỨNG (COLOR, GLOW, SHADOW & VIỀN NÉT) -->
            <div class="space-y-2.5 bg-slate-900 p-2.5 rounded-xl border border-amber-500/40 shadow">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <i data-lucide="palette" class="w-3.5 h-3.5 text-amber-400"></i>
                        <span>Màu Chữ Số & Hiệu Ứng Nổi Bật</span>
                    </span>
                    <div class="flex items-center space-x-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        <span id="cd-color-dot" class="w-3 h-3 rounded-full border border-white/50 inline-block shadow" style="background-color: ${textColor};"></span>
                        <span id="cd-color-text" class="text-[9px] font-mono font-extrabold text-amber-200 uppercase">${textColor}</span>
                    </div>
                </div>

                <!-- Bộ chọn màu (Color Picker & Input HEX) -->
                <div class="bg-slate-950/80 p-2 rounded-lg border border-slate-800 space-y-1.5">
                    <div class="flex items-center justify-between">
                        <span class="text-[8.5px] text-slate-300 font-bold">Bảng màu tự chọn (Color Picker):</span>
                        <button type="button" onclick="updateCountdownTextColor(${gIdx}, ${fIdx}, '#ffffff')" class="text-[8px] text-slate-400 hover:text-white underline cursor-pointer">Khôi phục trắng</button>
                    </div>
                    <div class="flex items-center space-x-2">
                        <input id="cd-color-picker" type="color" value="${(textColor.startsWith('#') && textColor.length === 7) ? textColor : '#ffffff'}" oninput="updateCountdownTextColor(${gIdx}, ${fIdx}, this.value, true)" onchange="updateCountdownTextColor(${gIdx}, ${fIdx}, this.value, false)" class="w-9 h-8 rounded border border-slate-700 bg-slate-900 p-0.5 cursor-pointer">
                        <input id="cd-color-hex" type="text" value="${textColor}" onchange="updateCountdownTextColor(${gIdx}, ${fIdx}, this.value, false)" class="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-amber-300 uppercase focus:border-amber-400 focus:outline-none">
                        <span class="text-[8px] text-slate-400 flex-1">Chọn màu số hiển thị</span>
                    </div>

                    <!-- Bảng màu chọn nhanh (8 màu nổi bật nhất) -->
                    <div class="pt-1">
                        <span class="text-[8px] text-slate-400 font-bold block mb-1">Màu nhanh phổ biến:</span>
                        <div class="grid grid-cols-8 gap-1">
                            ${[
                                { c: '#ffffff', name: 'Trắng' },
                                { c: '#fde047', name: 'Vàng Neon' },
                                { c: '#f59e0b', name: 'Cam' },
                                { c: '#ef4444', name: 'Đỏ Rực' },
                                { c: '#22c55e', name: 'Xanh Neon' },
                                { c: '#06b6d4', name: 'Cyan' },
                                { c: '#f43f5e', name: 'Hồng' },
                                { c: '#0f172a', name: 'Đen' }
                            ].map(itemColor => `
                                <button type="button" title="${itemColor.name} (${itemColor.c})" onclick="updateCountdownTextColor(${gIdx}, ${fIdx}, '${itemColor.c}')" class="h-6 rounded border transition cursor-pointer flex items-center justify-center ${textColor.toLowerCase() === itemColor.c.toLowerCase() ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105' : 'border-slate-700 hover:border-slate-500'}" style="background-color: ${itemColor.c};">
                                    ${textColor.toLowerCase() === itemColor.c.toLowerCase() ? '<span class="text-[10px] ' + (itemColor.c === '#ffffff' || itemColor.c === '#fde047' ? 'text-black' : 'text-white') + ' font-black">✓</span>' : ''}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Hiệu ứng Đổ bóng tương phản & Phát sáng Neon -->
                <div class="grid grid-cols-2 gap-1.5">
                    <!-- Đổ bóng Shadow -->
                    <div class="bg-slate-950/80 p-2 rounded-lg border border-slate-800 space-y-1.5">
                        <label class="flex items-center space-x-1.5 cursor-pointer">
                            <input type="checkbox" ${textShadow ? 'checked' : ''} onchange="updateCountdownProp(${gIdx}, ${fIdx}, 'textShadow', this.checked)" class="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 w-3.5 h-3.5">
                            <span class="text-[9px] font-extrabold text-slate-200">Đổ bóng chữ (Shadow)</span>
                        </label>
                        <span class="text-[7.5px] text-slate-400 leading-tight block">Tạo bóng mờ tương phản cao, số luôn rõ nét trên mọi nền video.</span>
                    </div>

                    <!-- Phát sáng Neon Glow -->
                    <div class="bg-slate-950/80 p-2 rounded-lg border border-slate-800 space-y-1.5">
                        <div class="flex items-center justify-between">
                            <label class="flex items-center space-x-1.5 cursor-pointer">
                                <input type="checkbox" ${textGlow ? 'checked' : ''} onchange="updateCountdownProp(${gIdx}, ${fIdx}, 'textGlow', this.checked)" class="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 w-3.5 h-3.5">
                                <span class="text-[9px] font-extrabold text-slate-200">Phát sáng Neon (Glow)</span>
                            </label>
                            ${textGlow ? `
                                <input type="color" value="${(glowColor.startsWith('#') && glowColor.length === 7) ? glowColor : '#ffffff'}" oninput="updateCountdownProp(${gIdx}, ${fIdx}, 'glowColor', this.value, true); drawParagraphCanvasFrame();" onchange="updateCountdownProp(${gIdx}, ${fIdx}, 'glowColor', this.value, false)" class="w-5 h-5 rounded border border-slate-700 bg-slate-900 p-0 cursor-pointer" title="Màu phát sáng Neon">
                            ` : ''}
                        </div>
                        <span class="text-[7.5px] text-slate-400 leading-tight block">Tỏa ánh hào quang neon công nghệ xung quanh con số.</span>
                    </div>
                </div>

                <!-- Viền nét chữ (Stroke Outline) -->
                <div class="bg-slate-950/80 p-2 rounded-lg border border-slate-800 space-y-1.5">
                    <div class="flex items-center justify-between">
                        <label class="flex items-center space-x-1.5 cursor-pointer">
                            <input type="checkbox" ${textStroke ? 'checked' : ''} onchange="updateCountdownProp(${gIdx}, ${fIdx}, 'textStroke', this.checked)" class="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 w-3.5 h-3.5">
                            <span class="text-[9px] font-extrabold text-slate-200">Viền nét chữ (Stroke Outline)</span>
                        </label>
                        ${textStroke ? `
                            <div class="flex items-center space-x-1.5">
                                <span class="text-[8px] text-slate-400">Màu viền:</span>
                                <input type="color" value="${(strokeColor.startsWith('#') && strokeColor.length === 7) ? strokeColor : '#000000'}" oninput="updateCountdownProp(${gIdx}, ${fIdx}, 'strokeColor', this.value, true); drawParagraphCanvasFrame();" onchange="updateCountdownProp(${gIdx}, ${fIdx}, 'strokeColor', this.value, false)" class="w-5 h-5 rounded border border-slate-700 bg-slate-900 p-0 cursor-pointer" title="Màu nét viền">
                            </div>
                        ` : ''}
                    </div>
                    ${textStroke ? `
                        <div class="flex items-center justify-between pt-1 border-t border-slate-850">
                            <span class="text-[8px] text-slate-400">Độ dày viền nét:</span>
                            <div class="flex items-center space-x-1">
                                ${[1.5, 2.5, 4].map(w => `
                                    <button type="button" onclick="updateCountdownProp(${gIdx}, ${fIdx}, 'strokeWidth', ${w})" class="py-0.5 px-1.5 rounded text-[8px] font-mono font-bold border transition cursor-pointer ${strokeWidth === w ? 'bg-amber-950 border-amber-400 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-400'}">${w}px</button>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <span class="text-[7.5px] text-slate-400 leading-tight block">Kẻ viền ngoài chữ số giúp tương phản rõ rệt ngay cả trên nền video rực rỡ nhiều chi tiết.</span>
                    `}
                </div>
            </div>

            <!-- NÚT XÓA THẺ -->
            <div class="pt-1 flex items-center justify-between text-[10px]">
                <span class="text-[8.5px] text-slate-500 italic">Đồng hồ đếm ngược tự động khớp theo layer.</span>
                <button type="button" onclick="removeFieldItemFromGroup(${gIdx}, ${fIdx}); selectedCountdownTarget = null; renderInspectorRibbon(); renderTimelineLayersListUI();" class="py-1 px-2.5 text-rose-400 hover:text-white hover:bg-rose-950/80 rounded-lg font-extrabold border border-rose-800/60 transition cursor-pointer">
                    ✕ Xóa thẻ này
                </button>
            </div>
        </div>
    `;
    if (window.lucide && lucide.createIcons) lucide.createIcons();
}

function updateCountdownProp(gIdx, fIdx, prop, val, skipRibbonRerender = false) {
    const grp = paragraphGridConfig.groups && paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];
    item[prop] = val;

    if (prop === 'seconds' && typeof val === 'number' && val > 0) {
        if (!grp.duration || grp.duration <= item.seconds + 1) {
            grp.duration = val;
            if (typeof renderTimelineTracksUI === 'function') renderTimelineTracksUI();
        }
    }

    if (typeof drawParagraphCanvasFrame === 'function') drawParagraphCanvasFrame();

    if (!skipRibbonRerender) {
        if (typeof renderTimelineLayersListUI === 'function') renderTimelineLayersListUI();
        if (selectedCountdownTarget && selectedCountdownTarget.gIdx === gIdx && selectedCountdownTarget.fIdx === fIdx) {
            renderCountdownInspectorRibbon(item, gIdx, fIdx);
        }
        if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
    }
}

function updateCountdownPixelCoord(gIdx, fIdx, coordKey, rawVal, isLive = false) {
    const val = Math.max(0, parseInt(rawVal, 10) || 0);
    const grp = paragraphGridConfig.groups && paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];
    item[coordKey] = val;
    item.position = 'custom';

    const cWidth = (typeof pCanvas !== 'undefined' && pCanvas && pCanvas.width) ? pCanvas.width : 1920;
    const cHeight = (typeof pCanvas !== 'undefined' && pCanvas && pCanvas.height) ? pCanvas.height : 1080;
    const posX = (item.posX !== undefined) ? item.posX : (cWidth - 68);
    const posY = (item.posY !== undefined) ? item.posY : 68;

    const badge = document.getElementById('cd-pos-coord-badge');
    if (badge) badge.innerText = `X: ${posX}px | Y: ${posY}px`;

    const valBadge = document.getElementById(`cd-${coordKey.toLowerCase()}-val`);
    if (valBadge) valBadge.innerText = `${val}px`;

    const otherInput = document.getElementById(`cd-${coordKey.toLowerCase()}-input`);
    const otherSlider = document.getElementById(`cd-${coordKey.toLowerCase()}-slider`);
    if (otherInput && !isLive) otherInput.value = val;
    if (otherSlider && !isLive) otherSlider.value = val;

    if (typeof drawParagraphCanvasFrame === 'function') drawParagraphCanvasFrame();

    if (!isLive) {
        if (typeof renderTimelineLayersListUI === 'function') renderTimelineLayersListUI();
        if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
    }
}

function updateCountdownPixelSize(gIdx, fIdx, propKey, rawVal, isLive = false) {
    const val = Math.max(0, parseInt(rawVal, 10) || 0);
    const grp = paragraphGridConfig.groups && paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];
    item[propKey] = val;

    if (propKey === 'radius') {
        item.size = (val <= 26 ? 'small' : (val <= 38 ? 'medium' : (val <= 50 ? 'large' : 'xlarge')));
    }

    const radius = item.radius || (item.size === 'small' ? 24 : (item.size === 'large' ? 46 : (item.size === 'xlarge' ? 58 : 34)));
    const isCustomFont = (item.fontSize !== undefined && Number(item.fontSize) > 0);
    const effectiveFontSize = isCustomFont ? Number(item.fontSize) : Math.max(12, Math.round(radius * 0.82));

    const sizeBadge = document.getElementById('cd-size-badge');
    if (sizeBadge) sizeBadge.innerText = `R: ${radius}px (Ø ${radius * 2}px)`;

    const radiusVal = document.getElementById('cd-radius-val');
    if (radiusVal) radiusVal.innerText = `${radius}px | Đường kính: ${radius * 2}px`;

    const fontVal = document.getElementById('cd-font-val');
    if (fontVal) fontVal.innerText = `${effectiveFontSize}px (${isCustomFont ? 'Tùy chỉnh' : 'Tự động 82%'})`;

    const otherInput = document.getElementById(`cd-${propKey.toLowerCase()}-input`);
    const otherSlider = document.getElementById(`cd-${propKey.toLowerCase()}-slider`);
    if (otherInput && !isLive) otherInput.value = val;
    if (otherSlider && !isLive) otherSlider.value = val;

    if (typeof drawParagraphCanvasFrame === 'function') drawParagraphCanvasFrame();

    if (!isLive) {
        if (typeof renderTimelineLayersListUI === 'function') renderTimelineLayersListUI();
        if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
    }
}

function updateCountdownTextColor(gIdx, fIdx, color, isLive = false) {
    const grp = paragraphGridConfig.groups && paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];
    item.textColor = color;

    const dot = document.getElementById('cd-color-dot');
    if (dot) dot.style.backgroundColor = color;
    const textBadge = document.getElementById('cd-color-text');
    if (textBadge) textBadge.innerText = color;
    const hexInput = document.getElementById('cd-color-hex');
    if (hexInput && !isLive) hexInput.value = color;
    const picker = document.getElementById('cd-color-picker');
    if (picker && !isLive && color.startsWith('#') && color.length === 7) picker.value = color;

    if (typeof drawParagraphCanvasFrame === 'function') drawParagraphCanvasFrame();

    if (!isLive) {
        if (typeof renderTimelineLayersListUI === 'function') renderTimelineLayersListUI();
        if (selectedCountdownTarget && selectedCountdownTarget.gIdx === gIdx && selectedCountdownTarget.fIdx === fIdx) {
            renderCountdownInspectorRibbon(item, gIdx, fIdx);
        }
        if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
    }
}

function updateCountdownBgColor(gIdx, fIdx, color, isLive = false) {
    const grp = paragraphGridConfig.groups && paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];
    const isTrans = (color === 'transparent' || color === 'none');
    item.bgColor = isTrans ? 'transparent' : color;
    if (isTrans) {
        item.bgOpacity = 0;
    } else if (item.bgOpacity === undefined || item.bgOpacity === 0) {
        item.bgOpacity = 92;
    }

    const dot = document.getElementById('cd-bgcolor-dot');
    if (dot) {
        if (isTrans) {
            dot.style.background = 'repeating-linear-gradient(45deg, #475569, #475569 2px, #0f172a 2px, #0f172a 4px)';
        } else {
            dot.style.background = color;
        }
    }
    const textBadge = document.getElementById('cd-bgcolor-text');
    if (textBadge) textBadge.innerText = isTrans ? 'Trong Suốt' : color;
    const hexInput = document.getElementById('cd-bgcolor-hex');
    if (hexInput && !isLive) hexInput.value = isTrans ? 'transparent' : color;
    const picker = document.getElementById('cd-bgcolor-picker');
    if (picker && !isLive && color.startsWith('#') && color.length === 7) picker.value = color;

    const opBadge = document.getElementById('cd-bgopacity-val');
    if (opBadge) opBadge.innerText = (item.bgOpacity || 0) + '%';
    const opSlider = document.getElementById('cd-bgopacity-slider');
    if (opSlider && !isLive) opSlider.value = item.bgOpacity || 0;

    if (typeof drawParagraphCanvasFrame === 'function') drawParagraphCanvasFrame();

    if (!isLive) {
        if (typeof renderTimelineLayersListUI === 'function') renderTimelineLayersListUI();
        if (selectedCountdownTarget && selectedCountdownTarget.gIdx === gIdx && selectedCountdownTarget.fIdx === fIdx) {
            renderCountdownInspectorRibbon(item, gIdx, fIdx);
        }
        if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
    }
}

function setCountdownBgPreset(gIdx, fIdx, mode) {
    const grp = paragraphGridConfig.groups && paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];

    if (mode === 'black') {
        item.bgColor = '#000000';
        item.bgOpacity = 95;
    } else if (mode === 'transparent') {
        item.bgColor = 'transparent';
        item.bgOpacity = 0;
    } else if (mode === 'slate') {
        item.bgColor = '#0f172a';
        item.bgOpacity = 90;
    }

    if (typeof drawParagraphCanvasFrame === 'function') drawParagraphCanvasFrame();
    if (typeof renderTimelineLayersListUI === 'function') renderTimelineLayersListUI();
    if (selectedCountdownTarget && selectedCountdownTarget.gIdx === gIdx && selectedCountdownTarget.fIdx === fIdx) {
        renderCountdownInspectorRibbon(item, gIdx, fIdx);
    }
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function updateCountdownBgOpacity(gIdx, fIdx, rawVal, isLive = false) {
    const val = Math.max(0, Math.min(100, parseInt(rawVal, 10) || 0));
    const grp = paragraphGridConfig.groups && paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];

    item.bgOpacity = val;
    if (val === 0) {
        item.bgColor = 'transparent';
    } else if (item.bgColor === 'transparent' || item.bgColor === 'none') {
        item.bgColor = '#000000';
    }

    const opBadge = document.getElementById('cd-bgopacity-val');
    if (opBadge) opBadge.innerText = `${val}%`;

    const dot = document.getElementById('cd-bgcolor-dot');
    if (dot) {
        if (item.bgColor === 'transparent' || val === 0) {
            dot.style.background = 'repeating-linear-gradient(45deg, #475569, #475569 2px, #0f172a 2px, #0f172a 4px)';
        } else {
            dot.style.background = item.bgColor;
        }
    }
    const textBadge = document.getElementById('cd-bgcolor-text');
    if (textBadge) textBadge.innerText = (item.bgColor === 'transparent' || val === 0) ? 'Trong Suốt' : item.bgColor;

    if (typeof drawParagraphCanvasFrame === 'function') drawParagraphCanvasFrame();

    if (!isLive) {
        if (typeof renderTimelineLayersListUI === 'function') renderTimelineLayersListUI();
        if (selectedCountdownTarget && selectedCountdownTarget.gIdx === gIdx && selectedCountdownTarget.fIdx === fIdx) {
            renderCountdownInspectorRibbon(item, gIdx, fIdx);
        }
        if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
    }
}

function updateCountdownPositionPreset(gIdx, fIdx, posPreset) {
    const grp = paragraphGridConfig.groups && paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];
    item.position = posPreset;

    const cWidth = (typeof pCanvas !== 'undefined' && pCanvas && pCanvas.width) ? pCanvas.width : 1920;
    const cHeight = (typeof pCanvas !== 'undefined' && pCanvas && pCanvas.height) ? pCanvas.height : 1080;
    const radius = item.radius || (item.size === 'small' ? 24 : (item.size === 'large' ? 46 : (item.size === 'xlarge' ? 58 : 34)));
    const margin = Math.max(radius + 24, 68);

    if (posPreset === 'top_right') {
        item.posX = cWidth - margin;
        item.posY = margin;
    } else if (posPreset === 'top_left') {
        item.posX = margin;
        item.posY = margin;
    } else if (posPreset === 'center') {
        item.posX = Math.round(cWidth / 2);
        item.posY = Math.round(cHeight / 2);
    } else if (posPreset === 'bottom_center') {
        item.posX = Math.round(cWidth / 2);
        item.posY = cHeight - margin - 8;
    } else if (posPreset === 'bottom_right') {
        item.posX = cWidth - margin;
        item.posY = cHeight - margin - 8;
    } else if (posPreset === 'bottom_left') {
        item.posX = margin;
        item.posY = cHeight - margin - 8;
    }

    renderCountdownInspectorRibbon(item, gIdx, fIdx);
    if (typeof drawParagraphCanvasFrame === 'function') drawParagraphCanvasFrame();
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function nudgeCountdownPixel(gIdx, fIdx, dx, dy) {
    const grp = paragraphGridConfig.groups && paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];
    const cWidth = (typeof pCanvas !== 'undefined' && pCanvas && pCanvas.width) ? pCanvas.width : 1920;
    const cHeight = (typeof pCanvas !== 'undefined' && pCanvas && pCanvas.height) ? pCanvas.height : 1080;
    const currentX = (item.posX !== undefined) ? item.posX : (cWidth - 68);
    const currentY = (item.posY !== undefined) ? item.posY : 68;

    item.posX = Math.max(0, currentX + dx);
    item.posY = Math.max(0, currentY + dy);
    item.position = 'custom';

    renderCountdownInspectorRibbon(item, gIdx, fIdx);
    if (typeof drawParagraphCanvasFrame === 'function') drawParagraphCanvasFrame();
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function setCountdownPresetSize(gIdx, fIdx, r, sizeName) {
    const grp = paragraphGridConfig.groups && paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];
    item.radius = r;
    item.size = sizeName;

    renderCountdownInspectorRibbon(item, gIdx, fIdx);
    if (typeof drawParagraphCanvasFrame === 'function') drawParagraphCanvasFrame();
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function setCountdownPreset(gIdx, fIdx, presetName) {
    const grp = paragraphGridConfig.groups && paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];
    item.preset = presetName;
    if (presetName === 'speaking_ring') {
        item.colorShift = true;
        item.bgColor = 'transparent';
        item.bgOpacity = 0;
        item.textColor = '#ffffff';
        item.textStroke = false;
        item.textShadow = true;
        if (item.subLabel === undefined) item.subLabel = 'giây chuẩn bị';
        item.showSubLabel = (item.showSubLabel !== false);
    } else if (presetName === 'green_to_red' || presetName === 'neon_ring') {
        item.colorShift = true;
    }
    if (item.enableTickSound === undefined) {
        item.enableTickSound = true;
    }
    if (typeof renderTimelineLayersListUI === 'function') renderTimelineLayersListUI();
    if (typeof drawParagraphCanvasFrame === 'function') drawParagraphCanvasFrame();
    renderCountdownInspectorRibbon(item, gIdx, fIdx);
    if (typeof showToast === 'function') {
        const names = {
            speaking_ring: 'Vòng Tròn Speaking (Xanh ➔ Đỏ)',
            green_to_red: 'Chuyển Màu Xanh ➔ Đỏ (Cảnh báo)',
            neon_ring: 'Vòng Neon Hiện Đại',
            digital_badge: 'Digital LED Thể Thao',
            minimal_pill: 'Pill Tối Giản',
            bomb_pulse: 'Quả Bom Kịch Tính',
            classic_circle: 'Cổ Điển Bo Tròn'
        };
        showToast(`Đã áp dụng Preset: ${names[presetName] || presetName}`, 'success');
    }
}

function previewCountdownLiveAnimation(gIdx, fIdx) {
    const grp = paragraphGridConfig.groups && paragraphGridConfig.groups[gIdx];
    if (!grp) return;
    if (typeof seekTimeline === 'function') {
        seekTimeline(grp.startTime || 0);
    }
    if (typeof isTimelinePlaying !== 'undefined' && !isTimelinePlaying && typeof toggleTimelinePlayback === 'function') {
        toggleTimelinePlayback();
    }
    if (typeof showToast === 'function') {
        showToast("Đang phát thử đồng hồ đếm ngược trên Timeline...", "info");
    }
}

window.updateCountdownProp = updateCountdownProp;
window.setCountdownPreset = setCountdownPreset;
window.previewCountdownLiveAnimation = previewCountdownLiveAnimation;

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
            ${(typeof renderCardZOrderToolbarHtml === 'function') ? renderCardZOrderToolbarHtml(gIdx, fIdx, 'progress_tracker') : ''}

            <!-- NÚT ÁP DỤNG CHUNG CHO TOÀN BỘ THẺ TIẾN ĐỘ (ACCORDION MỌI KỊCH BẢN) -->
            ${(typeof renderBatchStyleAccordionUI === 'function') ? renderBatchStyleAccordionUI('progress_tracker') : ''}

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
            ${(typeof renderCardZOrderToolbarHtml === 'function') ? renderCardZOrderToolbarHtml(gIdx, fIdx, 'audio_sfx') : ''}

            <!-- NÚT ÁP DỤNG CHUNG CHO TOÀN BỘ THẺ SFX (ACCORDION MỌI KỊCH BẢN) -->
            ${(typeof renderBatchStyleAccordionUI === 'function') ? renderBatchStyleAccordionUI('audio_sfx') : ''}

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

/**
 * =========================================================================
 * BẢNG RIBBON ĐỊNH DẠNG: THẺ VIDEO (CLIP & NỀN ĐỘC LẬP / ĐỘNG NỐI CỘT EXCEL)
 * =========================================================================
 */
function updateVideoLiveCoord(gIdx, fIdx, key, rawVal, isLive = false) {
    const val = Math.max(0, parseInt(rawVal, 10) || 0);
    const grp = paragraphGridConfig.groups && paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];
    item[key] = val;

    const valBadge = document.getElementById(`vid-${key.toLowerCase()}-val`);
    if (valBadge) valBadge.innerText = `${val}px`;

    const otherInput = document.getElementById(`vid-${key.toLowerCase()}-input`);
    const otherSlider = document.getElementById(`vid-${key.toLowerCase()}-slider`);
    if (otherInput && !isLive) otherInput.value = val;
    if (otherSlider && !isLive) otherSlider.value = val;

    if (typeof drawParagraphCanvasFrame === 'function') drawParagraphCanvasFrame();

    if (!isLive) {
        if (typeof renderTimelineLayersListUI === 'function') renderTimelineLayersListUI();
        if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
    }
}

function updateVideoLiveSize(gIdx, fIdx, key, rawVal, isLive = false) {
    const val = Math.max(20, parseInt(rawVal, 10) || 100);
    const grp = paragraphGridConfig.groups && paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];
    item[key] = val;

    const valBadge = document.getElementById(`vid-${key.toLowerCase()}-val`);
    if (valBadge) valBadge.innerText = `${val}px`;

    const otherInput = document.getElementById(`vid-${key.toLowerCase()}-input`);
    const otherSlider = document.getElementById(`vid-${key.toLowerCase()}-slider`);
    if (otherInput && !isLive) otherInput.value = val;
    if (otherSlider && !isLive) otherSlider.value = val;

    if (typeof drawParagraphCanvasFrame === 'function') drawParagraphCanvasFrame();

    if (!isLive) {
        if (typeof renderTimelineLayersListUI === 'function') renderTimelineLayersListUI();
        if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
    }
}

function renderVideoInspectorRibbon(item, gIdx, fIdx) {
    const body = document.getElementById('inspector-panel-body');
    const targetLabel = document.getElementById('inspector-target-label');
    if (!body) return;

    if (targetLabel) {
        targetLabel.innerText = `Video Clip • Lớp ${gIdx + 1}`;
        targetLabel.className = "text-[9px] font-extrabold bg-sky-950 text-sky-300 border border-sky-700/60 px-2 py-0.5 rounded shadow";
    }

    const sourceMode = item.sourceMode || 'file';
    const excelCol = item.excelColumn || '';
    const videoFileName = item.videoFileName || '';
    const posX = item.posX !== undefined ? item.posX : 120;
    const posY = item.posY !== undefined ? item.posY : 120;
    const boxW = item.width !== undefined ? item.width : 640;
    const boxH = item.height !== undefined ? item.height : 360;
    const fitMode = item.fitMode || 'cover';
    const borderRadius = item.borderRadius !== undefined ? item.borderRadius : 16;
    const borderWidth = item.borderWidth !== undefined ? item.borderWidth : 0;
    const borderColor = item.borderColor || '#38bdf8';
    const opacity = item.opacity !== undefined ? item.opacity : 100;
    const isShadow = item.shadow !== false;
    const isMuted = item.isMuted !== false;
    const volume = item.volume !== undefined ? item.volume : 0;
    const isLoop = item.loop !== false;
    const playbackRate = item.playbackRate || 1.0;

    const localRepoCount = (typeof localPCVideoMap !== 'undefined') ? Object.keys(localPCVideoMap).length : 0;
    const cols = (typeof excelColumnsList !== 'undefined' && Array.isArray(excelColumnsList)) ? excelColumnsList : [];

    body.innerHTML = `
        <div class="space-y-3 pb-8">
            ${(typeof renderCardZOrderToolbarHtml === 'function') ? renderCardZOrderToolbarHtml(gIdx, fIdx, 'video') : ''}

            <!-- ACCORDION ĐỒNG BỘ ĐỊNH DẠNG MỌI KỊCH BẢN -->
            ${typeof renderBatchStyleAccordionUI === 'function' ? renderBatchStyleAccordionUI('video') : ''}

            <!-- KHỐI 1: NGUỒN VIDEO (FILE LOCAL HOẶC NỐI CỘT EXCEL) -->
            <div class="bg-slate-900 border border-sky-800/60 rounded-xl p-3 space-y-2.5 shadow">
                <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span class="text-[10px] font-extrabold text-sky-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <i data-lucide="folder-video" class="w-3.5 h-3.5 text-sky-400"></i>
                        <span>1. Nguồn Video Clip</span>
                    </span>
                    <span class="text-[9px] text-slate-400 font-mono">Lớp ${gIdx + 1}</span>
                </div>

                <!-- Chế độ nguồn: Tải file hoặc Nối cột Excel -->
                <div class="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
                    <button type="button" onclick="updateVideoProp(${gIdx}, ${fIdx}, 'sourceMode', 'file')" class="py-1 px-2 rounded text-[10px] font-bold flex items-center justify-center space-x-1 transition ${sourceMode === 'file' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                        <i data-lucide="hard-drive" class="w-3 h-3"></i>
                        <span>Tải file máy tính</span>
                    </button>
                    <button type="button" onclick="updateVideoProp(${gIdx}, ${fIdx}, 'sourceMode', 'excel')" class="py-1 px-2 rounded text-[10px] font-bold flex items-center justify-center space-x-1 transition ${sourceMode === 'excel' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                        <i data-lucide="file-spreadsheet" class="w-3 h-3"></i>
                        <span>Nối cột Excel</span>
                    </button>
                </div>

                ${sourceMode === 'file' ? `
                    <!-- Chọn file trực tiếp -->
                    <div class="space-y-1.5">
                        <label class="block text-[9px] font-bold text-slate-300">Chọn file Video từ máy tính (.mp4, .webm, .mov):</label>
                        <div class="flex items-center space-x-2">
                            <label class="flex-1 cursor-pointer py-2 px-3 bg-sky-950/70 hover:bg-sky-900 border border-sky-700/80 rounded-lg text-sky-200 text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95 shadow">
                                <i data-lucide="upload" class="w-3.5 h-3.5 text-sky-400"></i>
                                <span>${videoFileName ? 'Đổi video khác...' : 'Tải Video (.mp4, .webm)'}</span>
                                <input type="file" accept="video/mp4,video/webm,video/quicktime,video/*" class="hidden" onchange="handleVideoFileUpload(${gIdx}, ${fIdx}, this)">
                            </label>
                        </div>
                        ${videoFileName ? `
                            <div class="p-2 bg-slate-950 border border-sky-900/60 rounded-lg flex items-center justify-between">
                                <div class="flex items-center space-x-2 min-w-0">
                                    <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                                    <span class="text-[10px] font-mono text-slate-200 truncate" title="${videoFileName}">${videoFileName}</span>
                                </div>
                                <button type="button" onclick="updateVideoProp(${gIdx}, ${fIdx}, 'videoFileName', ''); updateVideoProp(${gIdx}, ${fIdx}, 'videoUrl', '');" class="text-[10px] text-rose-400 hover:text-white px-1 font-bold" title="Hủy file này">✕</button>
                            </div>
                        ` : `
                            <p class="text-[8.5px] text-slate-400 italic">Chưa chọn video. Khung placeholder sẽ hiển thị trên Canvas cho đến khi bạn nạp clip.</p>
                        `}
                    </div>
                ` : `
                    <!-- Nối động theo cột Excel -->
                    <div class="space-y-2">
                        <div>
                            <label class="block text-[9px] font-bold text-indigo-300 mb-1">Chọn cột Excel chứa tên file video:</label>
                            <select onchange="updateVideoProp(${gIdx}, ${fIdx}, 'excelColumn', this.value)" class="w-full py-1 px-2 bg-slate-950 border border-indigo-700/80 rounded-lg text-xs font-bold text-indigo-200 focus:outline-none focus:border-indigo-400">
                                <option value="">-- Chọn cột Excel --</option>
                                ${cols.map(c => `<option value="${c}" ${excelCol === c ? 'selected' : ''}>{{${c}}}</option>`).join('')}
                            </select>
                            <span class="block text-[8.5px] text-slate-400 mt-1">Mỗi câu sẽ tự động lấy clip theo tên ghi trong cột này (vd: clip01.mp4, run.mp4).</span>
                        </div>

                        <!-- Kho video cục bộ phục vụ Excel -->
                        <div class="p-2 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
                            <div class="flex items-center justify-between">
                                <span class="text-[9px] font-bold text-slate-300 flex items-center space-x-1">
                                    <i data-lucide="database" class="w-3 h-3 text-sky-400"></i>
                                    <span>Kho Video Cho Excel</span>
                                </span>
                                <span class="text-[9px] font-bold bg-sky-950 border border-sky-700/60 text-sky-300 px-1.5 py-0.2 rounded font-mono">${localRepoCount} file đã nạp</span>
                            </div>
                            <label class="block cursor-pointer py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded text-[10px] font-bold text-center transition">
                                <span>📁 Nạp thư mục hoặc nhiều video (.mp4)...</span>
                                <input type="file" multiple accept="video/*" class="hidden" onchange="handleBatchVideoFilesUpload(this)">
                            </label>
                        </div>
                    </div>
                `}
            </div>

            <!-- KHỐI 2: VỊ TRÍ & KÍCH THƯỚC (GEOMETRY & PRESETS) -->
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2.5 shadow">
                <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span class="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <i data-lucide="maximize-2" class="w-3.5 h-3.5 text-amber-400"></i>
                        <span>2. Vị Trí & Kích Thước</span>
                    </span>
                    <span class="text-[9px] text-slate-400 font-mono">${boxW}x${boxH} px</span>
                </div>

                <!-- Nút Preset nhanh -->
                <div>
                    <span class="block text-[8.5px] font-bold text-slate-400 mb-1">Mẫu kích thước chuẩn (1 click):</span>
                    <div class="grid grid-cols-4 gap-1">
                        <button type="button" onclick="setVideoQuickPreset(${gIdx}, ${fIdx}, '16_9_medium')" class="py-1 px-1.5 bg-slate-950 hover:bg-amber-950/60 border border-slate-800 text-[9px] font-bold text-slate-300 hover:text-amber-200 rounded text-center transition">
                            📺 16:9 Lỡ
                        </button>
                        <button type="button" onclick="setVideoQuickPreset(${gIdx}, ${fIdx}, '16_9_large')" class="py-1 px-1.5 bg-slate-950 hover:bg-amber-950/60 border border-slate-800 text-[9px] font-bold text-slate-300 hover:text-amber-200 rounded text-center transition">
                            🖥️ 16:9 Lớn
                        </button>
                        <button type="button" onclick="setVideoQuickPreset(${gIdx}, ${fIdx}, '9_16_phone')" class="py-1 px-1.5 bg-slate-950 hover:bg-amber-950/60 border border-slate-800 text-[9px] font-bold text-slate-300 hover:text-amber-200 rounded text-center transition">
                            📱 9:16 Dọc
                        </button>
                        <button type="button" onclick="setVideoQuickPreset(${gIdx}, ${fIdx}, 'full')" class="py-1 px-1.5 bg-slate-950 hover:bg-amber-950/60 border border-slate-800 text-[9px] font-bold text-slate-300 hover:text-amber-200 rounded text-center transition">
                            ⏹️ Toàn Màn
                        </button>
                    </div>
                </div>

                <!-- Tọa độ X, Y -->
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <div class="flex justify-between items-center mb-0.5">
                            <label class="text-[9px] font-bold text-slate-400">Tọa độ X (Ngang):</label>
                            <span id="vid-posx-val" class="text-[10px] font-mono text-amber-300 font-bold">${posX}px</span>
                        </div>
                        <input type="range" min="0" max="1920" step="5" value="${posX}" id="vid-posx-slider" oninput="updateVideoLiveCoord(${gIdx}, ${fIdx}, 'posX', this.value, true)" onchange="updateVideoLiveCoord(${gIdx}, ${fIdx}, 'posX', this.value, false)" class="w-full accent-amber-500 cursor-pointer">
                    </div>
                    <div>
                        <div class="flex justify-between items-center mb-0.5">
                            <label class="text-[9px] font-bold text-slate-400">Tọa độ Y (Dọc):</label>
                            <span id="vid-posy-val" class="text-[10px] font-mono text-amber-300 font-bold">${posY}px</span>
                        </div>
                        <input type="range" min="0" max="1080" step="5" value="${posY}" id="vid-posy-slider" oninput="updateVideoLiveCoord(${gIdx}, ${fIdx}, 'posY', this.value, true)" onchange="updateVideoLiveCoord(${gIdx}, ${fIdx}, 'posY', this.value, false)" class="w-full accent-amber-500 cursor-pointer">
                    </div>
                </div>

                <!-- Chiều Rộng, Cao -->
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <div class="flex justify-between items-center mb-0.5">
                            <label class="text-[9px] font-bold text-slate-400">Chiều Rộng (W):</label>
                            <span id="vid-width-val" class="text-[10px] font-mono text-amber-300 font-bold">${boxW}px</span>
                        </div>
                        <input type="range" min="100" max="1920" step="10" value="${boxW}" id="vid-width-slider" oninput="updateVideoLiveSize(${gIdx}, ${fIdx}, 'width', this.value, true)" onchange="updateVideoLiveSize(${gIdx}, ${fIdx}, 'width', this.value, false)" class="w-full accent-amber-500 cursor-pointer">
                    </div>
                    <div>
                        <div class="flex justify-between items-center mb-0.5">
                            <label class="text-[9px] font-bold text-slate-400">Chiều Cao (H):</label>
                            <span id="vid-height-val" class="text-[10px] font-mono text-amber-300 font-bold">${boxH}px</span>
                        </div>
                        <input type="range" min="100" max="1080" step="10" value="${boxH}" id="vid-height-slider" oninput="updateVideoLiveSize(${gIdx}, ${fIdx}, 'height', this.value, true)" onchange="updateVideoLiveSize(${gIdx}, ${fIdx}, 'height', this.value, false)" class="w-full accent-amber-500 cursor-pointer">
                    </div>
                </div>
            </div>

            <!-- KHỐI 3: ĐỊNH DẠNG & THẨM MỸ (FIT MODE, BO GÓC, VIỀN, ĐỔ BÓNG) -->
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2.5 shadow">
                <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span class="text-[10px] font-extrabold text-teal-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <i data-lucide="palette" class="w-3.5 h-3.5 text-teal-400"></i>
                        <span>3. Định Dạng & Thẩm Mỹ</span>
                    </span>
                    <span class="text-[9px] text-slate-400 font-mono">${fitMode}</span>
                </div>

                <!-- Chế độ vừa khung (Fit Mode) -->
                <div>
                    <label class="block text-[9px] font-bold text-slate-300 mb-1">Chế độ vừa khung (Fit Mode):</label>
                    <div class="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
                        <button type="button" onclick="updateVideoProp(${gIdx}, ${fIdx}, 'fitMode', 'cover')" class="py-1 px-1 rounded text-[9px] font-bold transition text-center ${fitMode === 'cover' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}" title="Cắt vừa khung, không méo hình">
                            Cover (Phủ kín)
                        </button>
                        <button type="button" onclick="updateVideoProp(${gIdx}, ${fIdx}, 'fitMode', 'contain')" class="py-1 px-1 rounded text-[9px] font-bold transition text-center ${fitMode === 'contain' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}" title="Thu trọn vẹn, không mất góc">
                            Contain (Trọn vẹn)
                        </button>
                        <button type="button" onclick="updateVideoProp(${gIdx}, ${fIdx}, 'fitMode', 'stretch')" class="py-1 px-1 rounded text-[9px] font-bold transition text-center ${fitMode === 'stretch' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}" title="Kéo dãn vừa khít">
                            Stretch (Kéo dãn)
                        </button>
                    </div>
                </div>

                <!-- Bo góc & Độ mờ đục -->
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <div class="flex justify-between items-center mb-0.5">
                            <label class="text-[9px] font-bold text-slate-400">Bo góc viền:</label>
                            <span class="text-[10px] font-mono text-teal-300 font-bold">${borderRadius}px</span>
                        </div>
                        <input type="range" min="0" max="80" value="${borderRadius}" oninput="updateVideoProp(${gIdx}, ${fIdx}, 'borderRadius', parseInt(this.value, 10), true)" onchange="updateVideoProp(${gIdx}, ${fIdx}, 'borderRadius', parseInt(this.value, 10), false)" class="w-full accent-teal-500 cursor-pointer">
                    </div>
                    <div>
                        <div class="flex justify-between items-center mb-0.5">
                            <label class="text-[9px] font-bold text-slate-400">Độ mờ đục:</label>
                            <span class="text-[10px] font-mono text-teal-300 font-bold">${opacity}%</span>
                        </div>
                        <input type="range" min="10" max="100" value="${opacity}" oninput="updateVideoProp(${gIdx}, ${fIdx}, 'opacity', parseInt(this.value, 10), true)" onchange="updateVideoProp(${gIdx}, ${fIdx}, 'opacity', parseInt(this.value, 10), false)" class="w-full accent-teal-500 cursor-pointer">
                    </div>
                </div>

                <!-- Đường viền & Màu viền -->
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <div class="flex justify-between items-center mb-0.5">
                            <label class="text-[9px] font-bold text-slate-400">Độ dày nét viền:</label>
                            <span class="text-[10px] font-mono text-teal-300 font-bold">${borderWidth}px</span>
                        </div>
                        <input type="range" min="0" max="16" value="${borderWidth}" oninput="updateVideoProp(${gIdx}, ${fIdx}, 'borderWidth', parseInt(this.value, 10), true)" onchange="updateVideoProp(${gIdx}, ${fIdx}, 'borderWidth', parseInt(this.value, 10), false)" class="w-full accent-teal-500 cursor-pointer">
                    </div>
                    <div>
                        <label class="block text-[9px] font-bold text-slate-400 mb-0.5">Màu đường viền:</label>
                        <div class="flex items-center space-x-1.5">
                            <input type="color" value="${borderColor}" onchange="updateVideoProp(${gIdx}, ${fIdx}, 'borderColor', this.value)" class="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-slate-950">
                            <input type="text" value="${borderColor}" onchange="updateVideoProp(${gIdx}, ${fIdx}, 'borderColor', this.value)" class="flex-1 py-1 px-1.5 bg-slate-950 border border-slate-800 rounded text-[10px] font-mono text-slate-200">
                        </div>
                    </div>
                </div>

                <!-- Đổ bóng 3D -->
                <div class="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                    <label for="vid-shadow-cb" class="text-[10px] font-bold text-slate-300 cursor-pointer flex items-center space-x-1.5">
                        <i data-lucide="layers" class="w-3.5 h-3.5 text-teal-400"></i>
                        <span>Đổ bóng viền 3D nổi bật</span>
                    </label>
                    <input type="checkbox" id="vid-shadow-cb" ${isShadow ? 'checked' : ''} onchange="updateVideoProp(${gIdx}, ${fIdx}, 'shadow', this.checked, false)" class="rounded bg-slate-900 border-slate-700 text-teal-600 cursor-pointer">
                </div>
            </div>

            <!-- KHỐI 4: ÂM THANH & PHÁT LẠI (PLAYBACK & AUDIO) -->
            <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2.5 shadow">
                <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span class="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <i data-lucide="volume-2" class="w-3.5 h-3.5 text-purple-400"></i>
                        <span>4. Âm Thanh & Phát Lại</span>
                    </span>
                    <span class="text-[9px] text-slate-400 font-mono">${isMuted ? 'Tắt tiếng' : `${volume}%`}</span>
                </div>

                <!-- Tắt tiếng (Muted) -->
                <div class="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                        <span class="text-[10px] font-bold text-purple-300 block">Tắt tiếng video (Muted)</span>
                        <span class="text-[8.5px] text-slate-400">Khuyên dùng BẬT để âm thanh video không át giọng đọc AI (TTS).</span>
                    </div>
                    <input type="checkbox" id="vid-muted-cb" ${isMuted ? 'checked' : ''} onchange="updateVideoProp(${gIdx}, ${fIdx}, 'isMuted', this.checked, false)" class="rounded bg-slate-900 border-slate-700 text-purple-600 cursor-pointer">
                </div>

                ${!isMuted ? `
                    <!-- Âm lượng video -->
                    <div>
                        <div class="flex justify-between items-center mb-0.5">
                            <label class="text-[9px] font-bold text-slate-400">Âm lượng video:</label>
                            <span class="text-[10px] font-mono text-purple-300 font-bold">${volume}%</span>
                        </div>
                        <input type="range" min="0" max="100" value="${volume}" oninput="updateVideoProp(${gIdx}, ${fIdx}, 'volume', parseInt(this.value, 10), true)" onchange="updateVideoProp(${gIdx}, ${fIdx}, 'volume', parseInt(this.value, 10), false)" class="w-full accent-purple-500 cursor-pointer">
                    </div>
                ` : ''}

                <!-- Lặp lại & Tốc độ phát -->
                <div class="grid grid-cols-2 gap-2 pt-1">
                    <div class="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                        <label for="vid-loop-cb" class="text-[9.5px] font-bold text-slate-300 cursor-pointer">Lặp lại (Loop):</label>
                        <input type="checkbox" id="vid-loop-cb" ${isLoop ? 'checked' : ''} onchange="updateVideoProp(${gIdx}, ${fIdx}, 'loop', this.checked, false)" class="rounded bg-slate-900 border-slate-700 text-purple-600 cursor-pointer">
                    </div>
                    <div class="p-1.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center space-x-1.5">
                        <label class="text-[9.5px] font-bold text-slate-300 shrink-0">Tốc độ:</label>
                        <select onchange="updateVideoProp(${gIdx}, ${fIdx}, 'playbackRate', parseFloat(this.value))" class="w-full py-0.5 px-1 bg-slate-900 border border-slate-700 rounded text-[10px] font-bold text-purple-300">
                            <option value="0.5" ${playbackRate === 0.5 ? 'selected' : ''}>0.5x</option>
                            <option value="0.75" ${playbackRate === 0.75 ? 'selected' : ''}>0.75x</option>
                            <option value="1.0" ${playbackRate === 1.0 ? 'selected' : ''}>1.0x (Chuẩn)</option>
                            <option value="1.25" ${playbackRate === 1.25 ? 'selected' : ''}>1.25x</option>
                            <option value="1.5" ${playbackRate === 1.5 ? 'selected' : ''}>1.5x</option>
                        </select>
                    </div>
                </div>

                <!-- Xóa thẻ video -->
                <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                    <span class="text-[9px] text-slate-400 italic">Tự động phát đồng bộ theo Timeline của Lớp ${gIdx + 1}.</span>
                    <button type="button" onclick="removeFieldItemFromGroup(${gIdx}, ${fIdx}); selectedVideoTarget = null; renderInspectorRibbon(); renderTimelineLayersListUI();" class="py-1 px-2.5 text-rose-400 hover:text-white hover:bg-rose-950/60 rounded font-bold transition">
                        ✕ Xóa thẻ video này
                    </button>
                </div>
            </div>
        </div>
    `;

    if (window.lucide && lucide.createIcons) lucide.createIcons();
}

