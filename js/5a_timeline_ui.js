/**
 * 5a_timeline_ui.js
 * Giao diện trục thời gian Timeline: vẽ tracks, thước đo (ruler), kéo thả di chuyển/đổi thời lượng ray,
 * khóa ranh giới từng phân khu (Intro, Drills, Outro, Cố định) và chỉnh sửa thời lượng từng khu trực tiếp.
 */

function updateTimelineZonesBarUI() {
    if (typeof getZoneDurations !== 'function') return;
    const zones = getZoneDurations();

    const segIntro = document.getElementById('zone-segment-intro');
    const segDrills = document.getElementById('zone-segment-drills');
    const segOutro = document.getElementById('zone-segment-outro');
    const zonesBar = document.getElementById('timeline-zones-bar');
    if (!zonesBar) return;

    // Kiểm tra xem phân khu nào có lớp
    const hasIntro = typeof hasZoneLayers === 'function' ? hasZoneLayers('intro') : true;
    const hasDrills = typeof hasZoneLayers === 'function' ? hasZoneLayers('drills') : true;
    const hasOutro = typeof hasZoneLayers === 'function' ? hasZoneLayers('outro') : true;

    // Trên timeline, phân khu nào không có lớp thì KHÔNG HIỆN RA
    if (segIntro) segIntro.style.display = hasIntro ? 'flex' : 'none';
    if (segDrills) segDrills.style.display = hasDrills ? 'flex' : 'none';
    if (segOutro) segOutro.style.display = hasOutro ? 'flex' : 'none';

    // Tập hợp các phân khu đang được hiển thị
    const activeSegments = [];
    if (hasIntro && segIntro) {
        activeSegments.push({ key: 'intro', el: segIntro, dur: zones.intro || 2.0 });
    }
    if (hasDrills && segDrills) {
        const drillsDur = (!hasIntro && !hasOutro) 
            ? (typeof masterTimelineDuration === 'number' && masterTimelineDuration > 0 ? masterTimelineDuration : 8.0) 
            : (zones.drills || 4.5);
        activeSegments.push({ key: 'drills', el: segDrills, dur: drillsDur });
    }
    if (hasOutro && segOutro) {
        activeSegments.push({ key: 'outro', el: segOutro, dur: zones.outro || 1.5 });
    }

    if (activeSegments.length === 0) {
        zonesBar.style.display = 'none';
    } else {
        zonesBar.style.display = 'flex';

        if (activeSegments.length === 1) {
            activeSegments[0].el.style.width = '100%';
            activeSegments[0].el.classList.remove('border-r');
        } else {
            const totalDur = activeSegments.reduce((sum, s) => sum + s.dur, 0);
            let accumulatedPct = 0;
            activeSegments.forEach((segObj, idx) => {
                const isLast = (idx === activeSegments.length - 1);
                let pct = isLast ? Math.max(5, 100 - accumulatedPct) : ((segObj.dur / totalDur) * 100);
                pct = Math.max(5, Math.min(100, pct));
                accumulatedPct += pct;

                segObj.el.style.width = `${pct.toFixed(2)}%`;

                if (isLast) {
                    segObj.el.classList.remove('border-r');
                } else {
                    segObj.el.classList.add('border-r');
                }
            });
        }
    }

    const inpIntro = document.getElementById('zone-duration-input-intro');
    const inpDrills = document.getElementById('zone-duration-input-drills');
    const inpOutro = document.getElementById('zone-duration-input-outro');

    if (inpIntro && document.activeElement !== inpIntro) inpIntro.value = (zones.intro || 0).toFixed(1);
    if (inpDrills && document.activeElement !== inpDrills) {
        const drillsVal = (!hasIntro && !hasOutro) 
            ? (typeof masterTimelineDuration === 'number' && masterTimelineDuration > 0 ? masterTimelineDuration : 8.0) 
            : (zones.drills || 4.5);
        inpDrills.value = drillsVal.toFixed(1);
    }
    if (inpOutro && document.activeElement !== inpOutro) inpOutro.value = (zones.outro || 0).toFixed(1);
}

function onZoneDurationInputChange(zoneKey, val) {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) {
        showToast("Vui lòng nhập số giây hợp lệ (>= 0)!", "warning");
        updateTimelineZonesBarUI();
        return;
    }
    updateZoneDuration(zoneKey, num);
}

function updateZoneDuration(zoneKey, newDuration) {
    if (typeof getZoneDurations !== 'function') return;
    const zones = getZoneDurations();
    
    if (zoneKey === 'intro') {
        zones.intro = Math.max(0, Math.round(newDuration * 10) / 10);
    } else if (zoneKey === 'drills') {
        zones.drills = Math.max(0.5, Math.round(newDuration * 10) / 10);
    } else if (zoneKey === 'outro') {
        zones.outro = Math.max(0, Math.round(newDuration * 10) / 10);
    }

    paragraphGridConfig.zoneDurations = zones;

    const hasIntro = typeof hasZoneLayers === 'function' ? hasZoneLayers('intro') : true;
    const hasDrills = typeof hasZoneLayers === 'function' ? hasZoneLayers('drills') : true;
    const hasOutro = typeof hasZoneLayers === 'function' ? hasZoneLayers('outro') : true;

    // Tổng thời lượng được tính dựa trên các phân khu đang có lớp
    let newTotal = 0;
    if (hasIntro) newTotal += zones.intro;
    if (hasDrills) newTotal += zones.drills;
    if (hasOutro) newTotal += zones.outro;
    if (newTotal <= 0) newTotal = masterTimelineDuration || 8.0;

    masterTimelineDuration = Math.max(1.0, Math.round(newTotal * 10) / 10);

    const masterInp = document.getElementById('master-loop-duration-input');
    if (masterInp) masterInp.value = masterTimelineDuration.toFixed(1);

    // Tự động giới hạn (clamp) các lớp thuộc các khu để không bị tràn ra ngoài ranh giới
    paragraphGridConfig.groups.forEach(grp => {
        const grpPos = typeof getGroupLoopPosition === 'function' ? getGroupLoopPosition(grp) : (grp.loopPosition || 'inside');
        const bound = (typeof getZoneBoundary === 'function') ? getZoneBoundary(grpPos) : { start: 0, end: masterTimelineDuration };

        if (grp.snapEndToTotalDuration) {
            grp.startTime = Math.max(bound.start, Math.min(bound.end - 0.5, grp.startTime || 0));
            grp.duration = Math.round(Math.max(0.5, bound.end - grp.startTime) * 10) / 10;
        } else {
            if ((grp.startTime || 0) < bound.start) grp.startTime = bound.start;
            if ((grp.startTime || 0) >= bound.end) grp.startTime = Math.max(bound.start, bound.end - 0.5);
            if (grp.startTime + (grp.duration || 1) > bound.end) {
                grp.duration = Math.round(Math.max(0.5, bound.end - grp.startTime) * 10) / 10;
            }
        }
    });

    updateTimelineZonesBarUI();
    renderTimelineTracksUI();
    renderTimelineLayersListUI();
    drawParagraphCanvasFrame();
    showToast(`Đã chỉnh thời lượng ${zoneKey === 'intro' ? 'Khu 1 (Intro)' : (zoneKey === 'drills' ? 'Khu 2 (Drills)' : 'Khu 3 (Outro)')}: ${newDuration.toFixed(1)}s (Tổng: ${masterTimelineDuration.toFixed(1)}s)!`);
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function updateMasterLoopDuration(val) {
    if (isNaN(val) || val <= 1) val = 8.0;
    masterTimelineDuration = val;

    // Cập nhật lại thời lượng các khu cho vừa tổng thời lượng (chỉ xét các khu đang có lớp)
    if (typeof getZoneDurations === 'function') {
        const zones = getZoneDurations();
        const hasIntro = typeof hasZoneLayers === 'function' ? hasZoneLayers('intro') : false;
        const hasOutro = typeof hasZoneLayers === 'function' ? hasZoneLayers('outro') : false;
        const activeIntro = hasIntro ? (zones.intro || 0) : 0;
        const activeOutro = hasOutro ? (zones.outro || 0) : 0;
        const remain = Math.max(0.5, masterTimelineDuration - activeIntro - activeOutro);
        zones.drills = Math.round(remain * 10) / 10;
        paragraphGridConfig.zoneDurations = zones;
    }

    paragraphGridConfig.groups.forEach(g => {
        const grpPos = typeof getGroupLoopPosition === 'function' ? getGroupLoopPosition(g) : (g.loopPosition || 'inside');
        const bound = (typeof getZoneBoundary === 'function') ? getZoneBoundary(grpPos) : { start: 0, end: masterTimelineDuration };

        if (g.snapEndToTotalDuration) {
            g.startTime = Math.max(bound.start, Math.min(bound.end - 0.5, g.startTime || 0));
            g.duration = Math.max(0.5, bound.end - g.startTime);
        } else if (g.startTime + g.duration > bound.end) {
            g.duration = Math.max(0.5, bound.end - g.startTime);
        }
    });

    updateTimelineZonesBarUI();
    renderTimelineTracksUI();
    renderTimelineLayersListUI();
    seekTimeline(currentTimelinePlayTime);
    showToast(`Tổng thời lượng 1 câu: ${masterTimelineDuration.toFixed(1)}s`);
    if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
}

function setTimelineTrackDensity(density) {
    timelineTrackDensity = density;
    const btnCompact = document.getElementById('btn-density-compact');
    const btnNormal = document.getElementById('btn-density-normal');
    const btnSpacious = document.getElementById('btn-density-spacious');

    if (btnCompact && btnNormal && btnSpacious) {
        const activeClass = "px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-600 text-white shadow";
        const inactiveClass = "px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-400 hover:text-white transition";
        btnCompact.className = density === 'compact' ? activeClass : inactiveClass;
        btnNormal.className = density === 'normal' ? activeClass : inactiveClass;
        btnSpacious.className = density === 'spacious' ? activeClass : inactiveClass;
    }

    renderTimelineTracksUI();
    showToast(`Đã chọn độ dày đường ray: ${density === 'compact' ? 'Mỏng (20px)' : (density === 'spacious' ? 'Rộng (34px)' : 'Chuẩn (26px)')}`);
}

function drawWaveformOnCanvas(canvasEl) {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    const w = canvasEl.width = canvasEl.offsetWidth || 180;
    const h = canvasEl.height = canvasEl.offsetHeight || 24;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';

    const barWidth = 2;
    const gap = 2;
    const count = Math.floor(w / (barWidth + gap));

    for (let i = 0; i < count; i++) {
        const wave = Math.sin(i * 0.25) * 0.4 + 0.6;
        const noise = Math.random() * 0.35;
        const barHeight = Math.max(2, Math.min(h - 2, (h * 0.7) * (wave * 0.7 + noise * 0.3)));
        const x = i * (barWidth + gap);
        const y = (h - barHeight) / 2;
        ctx.fillRect(x, y, barWidth, barHeight);
    }
}

function renderTimelineTracksUI() {
    const tracksContainer = document.getElementById('timeline-tracks-container');
    const ticksContainer = document.getElementById('timeline-ruler-ticks');
    if (!tracksContainer || !ticksContainer) return;

    ticksContainer.innerHTML = '';
    const totalSec = Math.ceil(masterTimelineDuration);
    for (let s = 0; s <= totalSec; s++) {
        const tick = document.createElement('div');
        tick.className = "flex-1 timeline-ruler-tick pl-1";
        tick.innerText = `${s}s`;
        ticksContainer.appendChild(tick);
    }

    const needle = document.getElementById('timeline-playhead-needle');
    tracksContainer.innerHTML = '';
    if (needle) tracksContainer.appendChild(needle);

    if (typeof autoRecalculateAudioLayersDuration === 'function') {
        autoRecalculateAudioLayersDuration();
    }

    let trackHeight = 26;
    let textSizeClass = "text-[9px]";
    let handleWidth = "8px";

    if (timelineTrackDensity === 'compact') {
        trackHeight = 20;
        textSizeClass = "text-[8px]";
        handleWidth = "7px";
    } else if (timelineTrackDensity === 'spacious') {
        trackHeight = 34;
        textSizeClass = "text-[10px]";
        handleWidth = "10px";
    }

    const tracksBadge = document.getElementById('timeline-all-tracks-badge');
    if (tracksBadge) {
        tracksBadge.innerText = `${paragraphGridConfig.groups.length} Lớp (Hiện 100%)`;
    }
    if (typeof updatePreviewButtonLabel === 'function') {
        updatePreviewButtonLabel();
    }

    paragraphGridConfig.groups.forEach((grp, gIdx) => {
        const trackRow = document.createElement('div');
        trackRow.className = "relative bg-slate-900/90 rounded-md border border-slate-800 overflow-hidden flex items-center transition-all duration-150";
        trackRow.style.height = `${trackHeight}px`;

        const isAudio = typeof isAudioLayer === 'function' ? isAudioLayer(grp) : false;
        const grpPos = typeof getGroupLoopPosition === 'function' ? getGroupLoopPosition(grp) : (grp.loopPosition || (grp.isInsideLoop === false ? 'outside' : 'inside'));
        
        let loopTag = '';
        if (grpPos === 'before') {
            loopTag = `<span class="relative z-10 text-[7px] bg-blue-950/90 text-blue-300 border border-blue-600/70 px-1 py-0.2 rounded font-extrabold flex items-center space-x-0.5 shrink-0" title="Phân khu 1: Mở đầu (Intro)"><i data-lucide="arrow-left-to-line" class="w-2 h-2"></i><span>Intro</span></span>`;
        } else if (grpPos === 'after') {
            loopTag = `<span class="relative z-10 text-[7px] bg-purple-950/90 text-purple-300 border border-purple-600/70 px-1 py-0.2 rounded font-extrabold flex items-center space-x-0.5 shrink-0" title="Phân khu 3: Kết bài (Outro)"><i data-lucide="arrow-right-to-line" class="w-2 h-2"></i><span>Outro</span></span>`;
        } else if (grpPos === 'outside') {
            loopTag = `<span class="relative z-10 text-[7px] bg-amber-950/90 text-amber-300 border border-amber-600/70 px-1 py-0.2 rounded font-extrabold flex items-center space-x-0.5 shrink-0" title="Cố định xuyên suốt"><i data-lucide="pin" class="w-2 h-2"></i><span>Cố định</span></span>`;
        } else {
            loopTag = `<span class="relative z-10 text-[7px] bg-teal-950/90 text-teal-300 border border-teal-600/70 px-1 py-0.2 rounded font-extrabold flex items-center space-x-0.5 shrink-0" title="Phân khu 2: Vòng lặp chính (Drills)"><i data-lucide="repeat" class="w-2 h-2"></i><span>Từng câu</span></span>`;
        }

        const isSnapEnd = grp.snapEndToTotalDuration === true;
        const start = Math.max(0, grp.startTime || 0);
        const dur = isSnapEnd 
            ? Math.max(0.5, masterTimelineDuration - start) 
            : Math.max(0.5, grp.duration || (masterTimelineDuration - start));
        if (isSnapEnd) grp.duration = dur;
        const leftPct = (start / masterTimelineDuration) * 100;
        const widthPct = Math.min(100 - leftPct, (dur / masterTimelineDuration) * 100);

        const snapTag = isSnapEnd
            ? `<span class="relative z-10 text-[7px] bg-indigo-950/90 text-indigo-300 border border-indigo-500/70 px-1 py-0.2 rounded font-extrabold flex items-center space-x-0.5 shrink-0" title="Thời điểm cuối của khối trùng với thời điểm cuối của tổng thời lượng"><i data-lucide="anchor" class="w-2 h-2"></i><span>Trùng đuôi (${(start + dur).toFixed(1)}s)</span></span>`
            : '';

        const bar = document.createElement('div');
        bar.className = `timeline-track-bar absolute h-full rounded flex items-center justify-between px-2 ${textSizeClass} font-bold text-white shadow transition-colors relative overflow-hidden`;
        bar.style.left = `${leftPct}%`;
        bar.style.width = `${widthPct}%`;
        bar.style.backgroundColor = isAudio ? '#7c3aed' : (grp.trackColor || '#3b82f6');

        if (isAudio) {
            bar.title = `${grp.name} (Âm thanh khóa: ${dur.toFixed(1)}s)`;
            bar.innerHTML = `
                <canvas class="audio-waveform-canvas"></canvas>
                <div class="relative z-10 flex items-center space-x-1 truncate pointer-events-none drop-shadow">
                    <i data-lucide="lock" class="w-2.5 h-2.5 text-purple-300 shrink-0"></i>
                    <i data-lucide="volume-2" class="w-2.5 h-2.5 text-purple-300 shrink-0"></i>
                    ${loopTag}
                    ${snapTag}
                    <span class="font-extrabold truncate">${grp.name} (${start.toFixed(1)}s - ${(start + dur).toFixed(1)}s)</span>
                </div>
                <span class="relative z-10 text-[8px] bg-black/40 px-1 rounded font-mono text-purple-200 shrink-0">${dur.toFixed(1)}s</span>
            `;
            bar.addEventListener('mousedown', (e) => onTimelineBarMouseDown(e, gIdx, 'move'));
            bar.addEventListener('touchstart', (e) => onTimelineBarTouchStart(e, gIdx, 'move'), { passive: false });
        } else {
            bar.title = `${grp.name} (${start.toFixed(1)}s - ${(start + dur).toFixed(1)}s)`;
            bar.innerHTML = `
                <div class="resizer-handle resizer-left" style="width: ${handleWidth};" title="Kéo mép trái để đổi giây bắt đầu"></div>
                <div class="truncate pointer-events-none drop-shadow px-1.5 flex items-center space-x-1">
                    ${loopTag}
                    ${snapTag}
                    <span class="truncate">${grp.name} (${start.toFixed(1)}s - ${(start + dur).toFixed(1)}s)</span>
                </div>
                ${isSnapEnd 
                    ? `<div class="px-1 text-[8px] text-indigo-300 select-none flex items-center shrink-0" title="Khối khóa trùng đuôi tổng thời lượng"><i data-lucide="anchor" class="w-2.5 h-2.5"></i></div>` 
                    : `<div class="resizer-handle resizer-right" style="width: ${handleWidth};" title="Kéo mép phải để đổi thời lượng"></div>`}
            `;

            bar.addEventListener('mousedown', (e) => onTimelineBarMouseDown(e, gIdx, 'move'));
            bar.addEventListener('touchstart', (e) => onTimelineBarTouchStart(e, gIdx, 'move'), { passive: false });
            bar.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                promptEditTrackTimes(gIdx);
            });

            const handleLeft = bar.querySelector('.resizer-left');
            const handleRight = bar.querySelector('.resizer-right');

            if (handleLeft) {
                handleLeft.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    onTimelineBarMouseDown(e, gIdx, 'resize-left');
                });
                handleLeft.addEventListener('touchstart', (e) => {
                    e.stopPropagation();
                    onTimelineBarTouchStart(e, gIdx, 'resize-left');
                }, { passive: false });
            }
            if (handleRight) {
                handleRight.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    onTimelineBarMouseDown(e, gIdx, 'resize-right');
                });
                handleRight.addEventListener('touchstart', (e) => {
                    e.stopPropagation();
                    onTimelineBarTouchStart(e, gIdx, 'resize-right');
                }, { passive: false });
            }
        }

        trackRow.appendChild(bar);
        tracksContainer.appendChild(trackRow);

        if (isAudio) {
            setTimeout(() => {
                const waveCanvas = bar.querySelector('.audio-waveform-canvas');
                drawWaveformOnCanvas(waveCanvas);
            }, 10);
        }
    });

    updatePlayheadNeedlePosition();
    updateTimelineZonesBarUI();
    if (window.lucide && lucide.createIcons) lucide.createIcons();
}

function promptEditTrackTimes(gIdx) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp) return;

    if (typeof isAudioLayer === 'function' && isAudioLayer(grp)) {
        showToast("Lớp giọng đọc AI được khóa cứng thời lượng theo chữ đọc!", "info");
        return;
    }

    const grpPos = typeof getGroupLoopPosition === 'function' ? getGroupLoopPosition(grp) : (grp.loopPosition || 'inside');
    const bound = (typeof getZoneBoundary === 'function') ? getZoneBoundary(grpPos) : { start: 0, end: masterTimelineDuration, name: 'Toàn video' };

    if (grp.snapEndToTotalDuration) {
        const newStartStr = prompt(`Nhập giây bắt đầu cho "${grp.name}" trong [${bound.name}: ${bound.start.toFixed(1)}s - ${bound.end.toFixed(1)}s] (Ghim đuôi tại ${bound.end.toFixed(1)}s):`, grp.startTime.toFixed(1));
        if (newStartStr === null) return;
        const newStart = parseFloat(newStartStr);
        if (!isNaN(newStart)) {
            grp.startTime = Math.max(bound.start, Math.min(bound.end - 0.5, newStart));
            grp.duration = Math.round(Math.max(0.5, bound.end - grp.startTime) * 10) / 10;
            renderTimelineTracksUI();
            renderTimelineLayersListUI();
            drawParagraphCanvasFrame();
            showToast(`Đã cập nhật ${grp.name}: ${grp.startTime.toFixed(1)}s - ${(grp.startTime + grp.duration).toFixed(1)}s (${bound.name})`);
        }
        return;
    }

    const newStartStr = prompt(`Nhập giây bắt đầu cho "${grp.name}" trong [${bound.name}: ${bound.start.toFixed(1)}s - ${bound.end.toFixed(1)}s]:`, grp.startTime.toFixed(1));
    if (newStartStr === null) return;
    const newStart = parseFloat(newStartStr);

    const candidateStart = !isNaN(newStart) ? Math.max(bound.start, Math.min(bound.end - 0.2, newStart)) : grp.startTime;
    const maxAvailDur = Math.max(0.5, bound.end - candidateStart);
    const newDurStr = prompt(`Nhập thời lượng (tối đa ${maxAvailDur.toFixed(1)}s để không tràn ${bound.name}):`, Math.min(grp.duration, maxAvailDur).toFixed(1));
    if (newDurStr === null) return;
    const newDur = parseFloat(newDurStr);

    if (!isNaN(newStart) && !isNaN(newDur) && newDur > 0) {
        grp.startTime = candidateStart;
        grp.duration = Math.max(0.5, Math.min(bound.end - grp.startTime, newDur));
        renderTimelineTracksUI();
        renderTimelineLayersListUI();
        drawParagraphCanvasFrame();
        showToast(`Đã cập nhật ${grp.name}: ${grp.startTime.toFixed(1)}s - ${(grp.startTime + grp.duration).toFixed(1)}s (${bound.name})`);
    }
}

function onTimelineBarMouseDown(e, gIdx, mode) {
    if (e.button !== 0) return;
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp) return;

    paragraphSelectedGroupIdx = gIdx;
    renderTimelineLayersListUI();
    renderInspectorRibbon();
    if (typeof focusAndScrollToLayer === 'function') {
        focusAndScrollToLayer(gIdx);
    }

    const viewport = document.getElementById('timeline-tracks-container');
    const rect = viewport.getBoundingClientRect();

    activeDragState = {
        gIdx,
        mode,
        startX: e.clientX,
        initialStart: grp.startTime || 0,
        initialDuration: grp.duration || 4.0,
        viewportWidth: rect.width
    };

    window.addEventListener('mousemove', onTimelineBarMouseMove);
    window.addEventListener('mouseup', onTimelineBarMouseUp);
}

function handleTimelineBarDragMove(clientX) {
    if (!activeDragState) return;
    const { gIdx, mode, startX, initialStart, initialDuration, viewportWidth } = activeDragState;
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp) return;

    const deltaX = clientX - startX;
    const deltaSec = (deltaX / viewportWidth) * masterTimelineDuration;
    const isAudio = typeof isAudioLayer === 'function' ? isAudioLayer(grp) : false;

    // Khóa chặt ranh giới theo phân khu của lớp, tuyệt đối không cho tràn ra ngoài khu khác
    const grpPos = typeof getGroupLoopPosition === 'function' ? getGroupLoopPosition(grp) : (grp.loopPosition || 'inside');
    const bound = (typeof getZoneBoundary === 'function') ? getZoneBoundary(grpPos) : { start: 0, end: masterTimelineDuration };

    if (mode === 'move') {
        let newStart = initialStart + deltaSec;
        const maxStart = grp.snapEndToTotalDuration ? (bound.end - 0.5) : (bound.end - initialDuration);
        newStart = Math.max(bound.start, Math.min(maxStart, newStart));
        grp.startTime = Math.round(newStart * 10) / 10;
        if (grp.snapEndToTotalDuration) {
            grp.duration = Math.round(Math.max(0.5, bound.end - grp.startTime) * 10) / 10;
        }
    } else if (mode === 'resize-left' && !isAudio) {
        let newStart = initialStart + deltaSec;
        const maxStart = grp.snapEndToTotalDuration ? (bound.end - 0.5) : (initialStart + initialDuration - 0.5);
        newStart = Math.max(bound.start, Math.min(maxStart, newStart));
        grp.startTime = Math.round(newStart * 10) / 10;
        const newDur = grp.snapEndToTotalDuration 
            ? (bound.end - grp.startTime) 
            : ((initialStart + initialDuration) - newStart);
        grp.duration = Math.round(Math.max(0.5, newDur) * 10) / 10;
    } else if (mode === 'resize-right' && !isAudio && !grp.snapEndToTotalDuration) {
        let newDur = initialDuration + deltaSec;
        const maxDur = Math.max(0.5, bound.end - grp.startTime);
        newDur = Math.max(0.5, Math.min(maxDur, newDur));
        grp.duration = Math.round(newDur * 10) / 10;
    }

    renderTimelineTracksUI();
    drawParagraphCanvasFrame();
}

function onTimelineBarMouseMove(e) {
    handleTimelineBarDragMove(e.clientX);
}

function onTimelineBarTouchStart(e, gIdx, mode) {
    if (!e.touches || e.touches.length === 0) return;
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp) return;

    paragraphSelectedGroupIdx = gIdx;
    renderTimelineLayersListUI();
    renderInspectorRibbon();
    if (typeof focusAndScrollToLayer === 'function') {
        focusAndScrollToLayer(gIdx);
    }

    const viewport = document.getElementById('timeline-tracks-container');
    const rect = viewport.getBoundingClientRect();

    activeDragState = {
        gIdx,
        mode,
        startX: e.touches[0].clientX,
        initialStart: grp.startTime || 0,
        initialDuration: grp.duration || 4.0,
        viewportWidth: rect.width
    };

    window.addEventListener('touchmove', onTimelineBarTouchMove, { passive: false });
    window.addEventListener('touchend', onTimelineBarTouchEnd);
    window.addEventListener('touchcancel', onTimelineBarTouchEnd);
}

function onTimelineBarTouchMove(e) {
    if (!activeDragState || !e.touches || e.touches.length === 0) return;
    if (e.cancelable) e.preventDefault();
    handleTimelineBarDragMove(e.touches[0].clientX);
}

function onTimelineBarTouchEnd() {
    window.removeEventListener('touchmove', onTimelineBarTouchMove);
    window.removeEventListener('touchend', onTimelineBarTouchEnd);
    window.removeEventListener('touchcancel', onTimelineBarTouchEnd);
    onTimelineBarMouseUp();
}

function onTimelineBarMouseUp() {
    if (activeDragState) {
        activeDragState = null;
        window.removeEventListener('mousemove', onTimelineBarMouseMove);
        window.removeEventListener('mouseup', onTimelineBarMouseUp);
        renderTimelineLayersListUI();
        if (typeof triggerAutoSave === 'function') triggerAutoSave(false);
    }
}

function onTimelineRulerClick(e) {
    const ruler = document.getElementById('timeline-ruler-track');
    if (!ruler) return;
    const rect = ruler.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const sec = (clickX / rect.width) * masterTimelineDuration;
    seekTimeline(sec);
}

function onTimelineRulerTouch(e) {
    if (!e.touches || e.touches.length === 0) return;
    const ruler = document.getElementById('timeline-ruler-track');
    if (!ruler) return;
    const rect = ruler.getBoundingClientRect();
    const touchX = Math.max(0, Math.min(rect.width, e.touches[0].clientX - rect.left));
    const sec = (touchX / rect.width) * masterTimelineDuration;
    seekTimeline(sec);
}

function seekTimeline(sec) {
    currentTimelinePlayTime = Math.max(0, Math.min(masterTimelineDuration, sec));
    const timeDisplay = document.getElementById('timeline-current-time-display');
    if (timeDisplay) timeDisplay.innerText = `${currentTimelinePlayTime.toFixed(1)}s`;
    updatePlayheadNeedlePosition();
    drawParagraphCanvasFrame();
    
    if ('speechSynthesis' in window && !isTimelinePlaying && !isParagraphRunning) {
        window.speechSynthesis.cancel();
        activePlayingAudioGroupIdx = -1;
    }
    if (typeof currentCountdownTriggeredTicks !== 'undefined' && currentCountdownTriggeredTicks) {
        currentCountdownTriggeredTicks.clear();
    }
}

function updatePlayheadNeedlePosition() {
    const needle = document.getElementById('timeline-playhead-needle');
    if (needle) {
        const pct = (currentTimelinePlayTime / masterTimelineDuration) * 100;
        needle.style.left = `${Math.min(99.5, pct)}%`;
    }
}
