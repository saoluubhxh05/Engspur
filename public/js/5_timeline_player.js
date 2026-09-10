/**
 * 5_timeline_player.js
 * Điều khiển trục thời gian Timeline, kéo thả căn chỉnh ray, playhead và vòng lặp phát thử
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
                    <span class="font-extrabold truncate">${grp.name} (${start.toFixed(1)}s - ${(start + dur).toFixed(1)}s)</span>
                </div>
                <span class="relative z-10 text-[8px] bg-black/40 px-1 rounded font-mono text-purple-200 shrink-0">${dur.toFixed(1)}s</span>
            `;
            bar.addEventListener('mousedown', (e) => onTimelineBarMouseDown(e, gIdx, 'move'));
        } else {
            bar.title = `${grp.name} (${start.toFixed(1)}s - ${(start + dur).toFixed(1)}s)`;
            bar.innerHTML = `
                <div class="resizer-handle resizer-left" style="width: ${handleWidth};" title="Kéo mép trái để đổi giây bắt đầu"></div>
                <span class="truncate pointer-events-none drop-shadow px-1.5">${grp.name} (${start.toFixed(1)}s - ${(start + dur).toFixed(1)}s)</span>
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

function toggleTimelinePlayback() {
    if (isParagraphRunning) {
        togglePreviewAllPlayback();
        return;
    }

    isTimelinePlaying = !isTimelinePlaying;
    const icon = document.getElementById('timeline-play-icon');

    if (isTimelinePlaying) {
        isSingleSentencePreview = true;
        if (icon) icon.setAttribute('data-lucide', 'pause');
        activePlayingAudioGroupIdx = -1;
        timelineLastTimestamp = performance.now();
        timelinePlayAnimFrame = requestAnimationFrame(timelinePlaybackLoop);
        const statusBadge = document.getElementById('p-status-badge-text');
        if (statusBadge) statusBadge.innerText = "Trạng thái: Đang Play thử câu hiện tại...";
    } else {
        if (icon) icon.setAttribute('data-lucide', 'play');
        if (timelinePlayAnimFrame) cancelAnimationFrame(timelinePlayAnimFrame);
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        activePlayingAudioGroupIdx = -1;
        const statusBadge = document.getElementById('p-status-badge-text');
        if (statusBadge) statusBadge.innerText = "Trạng thái: Đã tạm dừng!";
    }
    if (window.lucide && lucide.createIcons) lucide.createIcons();
}

function timelinePlaybackLoop(timestamp) {
    if (!isTimelinePlaying) return;
    const deltaMs = timestamp - timelineLastTimestamp;
    timelineLastTimestamp = timestamp;

    currentTimelinePlayTime += deltaMs / 1000;
    if (currentTimelinePlayTime >= masterTimelineDuration) {
        if (isSingleSentencePreview) {
            currentTimelinePlayTime = 0;
            isTimelinePlaying = false;
            const icon = document.getElementById('timeline-play-icon');
            if (icon) icon.setAttribute('data-lucide', 'play');
            if (window.lucide && lucide.createIcons) lucide.createIcons();
            seekTimeline(0);
            activePlayingAudioGroupIdx = -1;
            const statusBadge = document.getElementById('p-status-badge-text');
            if (statusBadge) statusBadge.innerText = "Trạng thái: Đã phát xong câu!";
            return;
        } else {
            currentTimelinePlayTime = 0;
            activePlayingAudioGroupIdx = -1;
        }
    }

    const timeDisplay = document.getElementById('timeline-current-time-display');
    if (timeDisplay) timeDisplay.innerText = `${currentTimelinePlayTime.toFixed(1)}s`;
    updatePlayheadNeedlePosition();
    drawParagraphCanvasFrame();

    checkAndTriggerTimelineAudio(currentTimelinePlayTime);

    timelinePlayAnimFrame = requestAnimationFrame(timelinePlaybackLoop);
}

function checkAndTriggerTimelineAudio(curTime) {
    const activeTopicList = getParagraphFilteredDatasets();
    const curIdx = isParagraphRunning ? pCurrentSentenceIndex : 0;
    const curDs = activeTopicList[curIdx] || importedDatasets[0] || {};
    const drill = (curDs && curDs.drills && curDs.drills[0]) ? curDs.drills[0] : {};

    const dataMap = {
        "STT": drill.stt || 1,
        "STT Mẫu": curDs.sttMau || 1,
        "Chủ đề": curDs.topic || "",
        "Mẫu câu": curDs.pattern || "",
        "Câu hỏi cho mẫu câu": curDs.question || "",
        "Từ nối": drill.tuNoi !== undefined ? drill.tuNoi : "",
        "Substitution words": drill.cueWord || "",
        "Dịch Substitution words": drill.dichCueWord || "",
        "Substitution Drills": drill.drillText || "",
        "Phiên âm IPA": drill.ipa || "",
        "Dịch Substitution Drills": drill.dichDrillText || ""
    };
    if (drill.rawRow) {
        Object.keys(drill.rawRow).forEach(k => {
            if (dataMap[k] === undefined) {
                dataMap[k] = String(drill.rawRow[k] || "").trim();
            }
        });
    }

    paragraphGridConfig.groups.forEach((grp, gIdx) => {
        const start = grp.startTime || 0;
        if (curTime >= start && curTime < (start + 0.35) && activePlayingAudioGroupIdx !== gIdx) {
            const ttsItem = (grp.fields || []).find(f => f.type === 'tts');
            if (ttsItem) {
                activePlayingAudioGroupIdx = gIdx;
                let textToRead = "";
                const fields = ttsItem.ttsSpeakFields || ["Substitution Drills"];
                fields.forEach(fk => {
                    if (dataMap[fk]) textToRead += dataMap[fk] + ". ";
                });

                if (textToRead.trim()) {
                    speakTTS(textToRead.trim());
                }
            }
        }
    });
}

function togglePreviewAllPlayback() {
    const btnIcon = document.getElementById('p-preview-btn-icon');
    const btnText = document.getElementById('p-preview-btn-text');

    if (!isParagraphRunning) {
        isParagraphRunning = true;
        isParagraphPaused = false;
        pCurrentSentenceIndex = 0;
        currentTimelinePlayTime = 0.0;
        if (btnIcon) btnIcon.setAttribute('data-lucide', 'pause-circle');
        if (btnText) btnText.innerText = "Tạm Dừng Chạy Thử";
        const statusBadge = document.getElementById('p-status-badge-text');
        if (statusBadge) statusBadge.innerText = "Trạng thái: Đang Chạy Thử Toàn Bộ...";
        if (window.lucide && lucide.createIcons) lucide.createIcons();
        runUnifiedSentenceSequence();
    } else if (isParagraphRunning && !isParagraphPaused) {
        isParagraphPaused = true;
        if ('speechSynthesis' in window) window.speechSynthesis.pause();
        stopStudioRenderClock();
        if (pRenderTimer) cancelAnimationFrame(pRenderTimer);
        if (btnIcon) btnIcon.setAttribute('data-lucide', 'play-circle');
        if (btnText) btnText.innerText = "Tiếp Tục Chạy Thử";
        const statusBadge = document.getElementById('p-status-badge-text');
        if (statusBadge) statusBadge.innerText = `Trạng thái: Tạm dừng tại câu ${pCurrentSentenceIndex + 1} (${currentTimelinePlayTime.toFixed(1)}s)`;
        if (window.lucide && lucide.createIcons) lucide.createIcons();
        showToast("Đã tạm dừng bài học! Bấm Tiếp Tục để chạy tiếp.");
    } else if (isParagraphRunning && isParagraphPaused) {
        isParagraphPaused = false;
        if ('speechSynthesis' in window) window.speechSynthesis.resume();
        if (btnIcon) btnIcon.setAttribute('data-lucide', 'pause-circle');
        if (btnText) btnText.innerText = "Tạm Dừng Chạy Thử";
        const statusBadge = document.getElementById('p-status-badge-text');
        if (statusBadge) statusBadge.innerText = "Trạng thái: Tiếp tục Chạy Thử...";
        if (window.lucide && lucide.createIcons) lucide.createIcons();
        resumeUnifiedSentenceSequence();
        showToast("Tiếp tục phát bài học!");
    }
}

function runUnifiedSentenceSequence() {
    if (!isParagraphRunning || isParagraphPaused) return;
    const activeTopicList = getParagraphFilteredDatasets();

    if (pCurrentSentenceIndex >= activeTopicList.length) {
        finishParagraphExport();
        return;
    }

    seekTimeline(0.0);
    updateParagraphProgressBar();
    activePlayingAudioGroupIdx = -1;
    resumeUnifiedSentenceSequence();
}

var studioBackgroundWorker = null;
var studioRenderClockCallback = null;
var studioRenderClockRafId = null;

function getStudioBackgroundWorker() {
    if (!studioBackgroundWorker && typeof Worker !== 'undefined') {
        try {
            const workerCode = `
                var timer = null;
                self.onmessage = function(e) {
                    if (e.data === 'start') {
                        if (timer) clearInterval(timer);
                        timer = setInterval(function() {
                            self.postMessage('tick');
                        }, 33);
                    } else if (e.data === 'stop') {
                        if (timer) clearInterval(timer);
                        timer = null;
                    }
                };
            `;
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            studioBackgroundWorker = new Worker(URL.createObjectURL(blob));
        } catch(e) {
            console.warn("Không thể tạo Web Worker nền:", e);
        }
    }
    return studioBackgroundWorker;
}

function startStudioRenderClock(callback) {
    stopStudioRenderClock();
    studioRenderClockCallback = callback;

    const worker = getStudioBackgroundWorker();
    if (worker) {
        worker.onmessage = function(e) {
            if (e.data === 'tick' && document.hidden) {
                if (studioRenderClockCallback) {
                    studioRenderClockCallback(performance.now());
                }
            }
        };
        worker.postMessage('start');
    }

    const rafLoop = (nowTs) => {
        if (!document.hidden && studioRenderClockCallback) {
            studioRenderClockCallback(nowTs);
        }
        if (studioRenderClockCallback) {
            studioRenderClockRafId = requestAnimationFrame(rafLoop);
        }
    };
    studioRenderClockRafId = requestAnimationFrame(rafLoop);
}

function stopStudioRenderClock() {
    if (studioRenderClockRafId) {
        cancelAnimationFrame(studioRenderClockRafId);
        studioRenderClockRafId = null;
    }
    const worker = getStudioBackgroundWorker();
    if (worker) {
        worker.postMessage('stop');
    }
    studioRenderClockCallback = null;
}

function resumeUnifiedSentenceSequence() {
    let lastTs = performance.now();
    let isTransitioningToNext = false;

    const sentenceStep = (nowTs) => {
        if (!isParagraphRunning || isParagraphPaused || isTransitioningToNext) return;
        const rawDelta = (nowTs - lastTs) / 1000;
        const delta = Math.min(0.05, Math.max(0.001, rawDelta));
        lastTs = nowTs;

        currentTimelinePlayTime += delta;
        if (currentTimelinePlayTime < masterTimelineDuration) {
            const timeDisplay = document.getElementById('timeline-current-time-display');
            if (timeDisplay) timeDisplay.innerText = `${currentTimelinePlayTime.toFixed(1)}s`;
            updatePlayheadNeedlePosition();
            drawParagraphCanvasFrame();
            checkAndTriggerTimelineAudio(currentTimelinePlayTime);
        } else {
            isTransitioningToNext = true;
            stopStudioRenderClock();
            setTimeout(() => {
                if (!isParagraphPaused && isParagraphRunning) {
                    pCurrentSentenceIndex++;
                    currentTimelinePlayTime = 0.0;
                    runUnifiedSentenceSequence();
                }
            }, 800);
        }
    };

    startStudioRenderClock(sentenceStep);
}

function finishParagraphExport() {
    setTimeout(() => {
        stopStudioRenderClock();
        if (pMediaRecorder && pMediaRecorder.state !== 'inactive') try { pMediaRecorder.stop(); } catch(e){}
        if (pCleanMediaRecorder && pCleanMediaRecorder.state !== 'inactive') try { pCleanMediaRecorder.stop(); } catch(e){}
        if (pRenderTimer) cancelAnimationFrame(pRenderTimer);

        isParagraphRunning = false;
        isParagraphPaused = false;
        const btnIcon = document.getElementById('p-preview-btn-icon');
        const btnText = document.getElementById('p-preview-btn-text');
        if (btnIcon) btnIcon.setAttribute('data-lucide', 'play-circle');
        if (btnText) btnText.innerText = "Chạy Thử Toàn Bộ (Preview)";
        if (window.lucide && lucide.createIcons) lucide.createIcons();

        const statusBadge = document.getElementById('p-status-badge-text');
        if (statusBadge) statusBadge.innerText = "Trạng thái: Hoàn Tất!";
        const pBar = document.getElementById('p-render-progress-bar');
        if (pBar) pBar.style.width = '100%';
        const pPct = document.getElementById('p-render-percentage-text');
        if (pPct) pPct.innerText = '100%';
        seekTimeline(0);
        if (!isBatchRunning) showToast("Đã xem thử hoàn tất toàn bộ video!");
    }, 800);
}

function resetParagraphEngine() {
    isParagraphRunning = false;
    isParagraphPaused = false;
    isTimelinePlaying = false;
    pCurrentSentenceIndex = 0;
    currentTimelinePlayTime = 0.0;
    activePlayingAudioGroupIdx = -1;

    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    stopStudioRenderClock();
    if (pRenderTimer) cancelAnimationFrame(pRenderTimer);
    if (timelinePlayAnimFrame) cancelAnimationFrame(timelinePlayAnimFrame);

    const icon = document.getElementById('timeline-play-icon');
    if (icon) icon.setAttribute('data-lucide', 'play');

    const btnIcon = document.getElementById('p-preview-btn-icon');
    const btnText = document.getElementById('p-preview-btn-text');
    if (btnIcon) btnIcon.setAttribute('data-lucide', 'play-circle');
    if (btnText) btnText.innerText = "Chạy Thử Toàn Bộ (Preview)";

    const statusBadge = document.getElementById('p-status-badge-text');
    if (statusBadge) statusBadge.innerText = "Trạng thái: Sẵn sàng";
    const pBar = document.getElementById('p-render-progress-bar');
    if (pBar) pBar.style.width = '0%';
    const pPct = document.getElementById('p-render-percentage-text');
    if (pPct) pPct.innerText = '0%';
    seekTimeline(0);
    if (window.lucide && lucide.createIcons) lucide.createIcons();
    showToast("Đã đặt lại Engine!");
}

function updateParagraphProgressBar() {
    const activeTopicList = getParagraphFilteredDatasets();
    const total = activeTopicList.length;
    const cur = pCurrentSentenceIndex + 1;
    const pct = Math.min(100, Math.round((cur / Math.max(1, total)) * 100));

    const pBar = document.getElementById('p-render-progress-bar');
    if (pBar) pBar.style.width = `${pct}%`;
    const pPct = document.getElementById('p-render-percentage-text');
    if (pPct) pPct.innerText = `${pct}%`;
    const pInfo = document.getElementById('p-info-step-text');
    if (pInfo) pInfo.innerText = `Tiến độ câu: ${cur} / ${total}`;
}
