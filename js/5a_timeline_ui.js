/**
 * 5a_timeline_ui.js
 * Giao diện trục thời gian Timeline: vẽ tracks, thước đo (ruler), kéo thả di chuyển/đổi thời lượng ray
 */

function updateMasterLoopDuration(val) {
    if (isNaN(val) || val <= 1) val = 8.0;
    masterTimelineDuration = val;
    paragraphGridConfig.groups.forEach(g => {
        if (g.startTime + g.duration > masterTimelineDuration) {
            g.duration = Math.max(1, masterTimelineDuration - g.startTime);
        }
    });
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

    paragraphGridConfig.groups.forEach((grp, gIdx) => {
        const trackRow = document.createElement('div');
        trackRow.className = "relative bg-slate-900/90 rounded-md border border-slate-800 overflow-hidden flex items-center transition-all duration-150";
        trackRow.style.height = `${trackHeight}px`;

        const isAudio = typeof isAudioLayer === 'function' ? isAudioLayer(grp) : false;
        const isInsideLoop = grp.isInsideLoop !== false;
        const loopTag = isInsideLoop 
            ? '' 
            : `<span class="relative z-10 text-[7px] bg-amber-950/90 text-amber-300 border border-amber-600/70 px-1 py-0.2 rounded font-extrabold flex items-center space-x-0.5 shrink-0"><i data-lucide="pin" class="w-2 h-2"></i><span>Cố định</span></span>`;

        const start = Math.max(0, grp.startTime || 0);
        const dur = Math.max(0.5, grp.duration || (masterTimelineDuration - start));
        const leftPct = (start / masterTimelineDuration) * 100;
        const widthPct = Math.min(100 - leftPct, (dur / masterTimelineDuration) * 100);

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
                    <span class="font-extrabold truncate">${grp.name} (${start.toFixed(1)}s - ${(start + dur).toFixed(1)}s)</span>
                </div>
                <span class="relative z-10 text-[8px] bg-black/40 px-1 rounded font-mono text-purple-200 shrink-0">${dur.toFixed(1)}s</span>
            `;
            bar.addEventListener('mousedown', (e) => onTimelineBarMouseDown(e, gIdx, 'move'));
        } else {
            bar.title = `${grp.name} (${start.toFixed(1)}s - ${(start + dur).toFixed(1)}s)`;
            bar.innerHTML = `
                <div class="resizer-handle resizer-left" style="width: ${handleWidth};" title="Kéo mép trái để đổi giây bắt đầu"></div>
                <div class="truncate pointer-events-none drop-shadow px-1.5 flex items-center space-x-1">
                    ${loopTag}
                    <span class="truncate">${grp.name} (${start.toFixed(1)}s - ${(start + dur).toFixed(1)}s)</span>
                </div>
                <div class="resizer-handle resizer-right" style="width: ${handleWidth};" title="Kéo mép phải để đổi thời lượng"></div>
            `;

            bar.addEventListener('mousedown', (e) => onTimelineBarMouseDown(e, gIdx, 'move'));
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
            }
            if (handleRight) {
                handleRight.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    onTimelineBarMouseDown(e, gIdx, 'resize-right');
                });
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
    if (window.lucide && lucide.createIcons) lucide.createIcons();
}

function promptEditTrackTimes(gIdx) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp) return;

    if (typeof isAudioLayer === 'function' && isAudioLayer(grp)) {
        showToast("Lớp giọng đọc AI được khóa cứng thời lượng theo chữ đọc!", "info");
        return;
    }

    const newStartStr = prompt(`Nhập giây bắt đầu cho "${grp.name}":`, grp.startTime.toFixed(1));
    if (newStartStr === null) return;
    const newStart = parseFloat(newStartStr);

    const newDurStr = prompt(`Nhập thời lượng (giây) cho "${grp.name}":`, grp.duration.toFixed(1));
    if (newDurStr === null) return;
    const newDur = parseFloat(newDurStr);

    if (!isNaN(newStart) && !isNaN(newDur) && newDur > 0) {
        grp.startTime = Math.max(0, Math.min(masterTimelineDuration - 0.2, newStart));
        grp.duration = Math.max(0.5, Math.min(masterTimelineDuration - grp.startTime, newDur));
        renderTimelineTracksUI();
        renderTimelineLayersListUI();
        drawParagraphCanvasFrame();
        showToast(`Đã cập nhật ${grp.name}: ${grp.startTime.toFixed(1)}s - ${(grp.startTime + grp.duration).toFixed(1)}s`);
    }
}

function onTimelineBarMouseDown(e, gIdx, mode) {
    if (e.button !== 0) return;
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp) return;

    paragraphSelectedGroupIdx = gIdx;
    renderTimelineLayersListUI();
    renderInspectorRibbon();

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

function onTimelineBarMouseMove(e) {
    if (!activeDragState) return;
    const { gIdx, mode, startX, initialStart, initialDuration, viewportWidth } = activeDragState;
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp) return;

    const deltaX = e.clientX - startX;
    const deltaSec = (deltaX / viewportWidth) * masterTimelineDuration;
    const isAudio = typeof isAudioLayer === 'function' ? isAudioLayer(grp) : false;

    if (mode === 'move') {
        let newStart = initialStart + deltaSec;
        newStart = Math.max(0, Math.min(masterTimelineDuration - initialDuration, newStart));
        grp.startTime = Math.round(newStart * 10) / 10;
    } else if (mode === 'resize-left' && !isAudio) {
        let newStart = initialStart + deltaSec;
        newStart = Math.max(0, Math.min(initialStart + initialDuration - 0.5, newStart));
        const newDur = (initialStart + initialDuration) - newStart;
        grp.startTime = Math.round(newStart * 10) / 10;
        grp.duration = Math.round(newDur * 10) / 10;
    } else if (mode === 'resize-right' && !isAudio) {
        let newDur = initialDuration + deltaSec;
        newDur = Math.max(0.5, Math.min(masterTimelineDuration - grp.startTime, newDur));
        grp.duration = Math.round(newDur * 10) / 10;
    }

    renderTimelineTracksUI();
    drawParagraphCanvasFrame();
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
}

function updatePlayheadNeedlePosition() {
    const needle = document.getElementById('timeline-playhead-needle');
    if (needle) {
        const pct = (currentTimelinePlayTime / masterTimelineDuration) * 100;
        needle.style.left = `${Math.min(99.5, pct)}%`;
    }
}
