/**
 * 5b_timeline_engine.js
 * Động cơ phát thử Timeline: Playhead loop, đồng bộ âm thanh TTS, Background Worker clock và chạy chuỗi câu
 */

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
            if (currentSentenceTriggeredAudioGroups) currentSentenceTriggeredAudioGroups.clear();
            const statusBadge = document.getElementById('p-status-badge-text');
            if (statusBadge) statusBadge.innerText = "Trạng thái: Đã phát xong câu!";
            return;
        } else {
            currentTimelinePlayTime = 0;
            activePlayingAudioGroupIdx = -1;
            if (currentSentenceTriggeredAudioGroups) currentSentenceTriggeredAudioGroups.clear();
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
    let activeTopicList = getParagraphFilteredDatasets();
    if (!activeTopicList || activeTopicList.length === 0) {
        activeTopicList = [{ topic: "Default", drills: [{ cueWord: "", drillText: "" }] }];
    }
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

    const isOutsideOnly = (typeof isBatchRunning !== 'undefined' && isBatchRunning && typeof batchRenderQueue !== 'undefined' && batchRenderQueue[currentBatchQueueIndex] && batchRenderQueue[currentBatchQueueIndex].isOutsideLoopOnly) || (typeof isStaticOutsideLoopRunning !== 'undefined' && isStaticOutsideLoopRunning);

    paragraphGridConfig.groups.forEach((grp, gIdx) => {
        if (isOutsideOnly && grp.isInsideLoop !== false) return;
        const start = grp.startTime || 0;
        // Kích hoạt chuẩn xác khi playhead chạm tới mốc bắt đầu layer và chưa từng trigger trong câu này
        const isAlreadyTriggered = currentSentenceTriggeredAudioGroups ? currentSentenceTriggeredAudioGroups.has(gIdx) : (activePlayingAudioGroupIdx === gIdx);
        if (curTime >= start && !isAlreadyTriggered) {
            // Khi đang ở pha quay bản Clean (Render Kép pha 2): tuyệt đối không phát âm thanh để tiết kiệm tài nguyên
            if (isBatchRunning && typeof batchCurrentSubPhase !== 'undefined' && batchCurrentSubPhase === 'clean') {
                return;
            }

            // ĐẢM BẢO CHẶT CHẼ: Nếu có bất kỳ layer nào đứng trước chứa đồng hồ đếm ngược (countdown) mà thời gian đếm ngược chưa xong,
            // TUYỆT ĐỐI KHÔNG kích hoạt âm thanh của layer này (loại bỏ triệt để hiện tượng tiếng câu sau phát đè lên lúc đếm ngược)
            const hasPendingCountdownBefore = paragraphGridConfig.groups.some((otherGrp, otherIdx) => {
                if (otherIdx >= gIdx) return false;
                const hasCountdown = (otherGrp.fields || []).some(f => f.type === 'countdown');
                if (!hasCountdown) return false;
                const otherEnd = (otherGrp.startTime || 0) + (otherGrp.duration || 3.0);
                return curTime < otherEnd;
            });
            if (hasPendingCountdownBefore) {
                return;
            }

            const ttsItem = (grp.fields || []).find(f => f.type === 'tts');
            if (ttsItem) {
                if (currentSentenceTriggeredAudioGroups) currentSentenceTriggeredAudioGroups.add(gIdx);
                activePlayingAudioGroupIdx = gIdx;
                let textToRead = "";
                if (ttsItem.sourceMode === 'custom') {
                    textToRead = (ttsItem.customText || "").trim();
                } else {
                    const fields = ttsItem.ttsSpeakFields || ["Substitution Drills"];
                    fields.forEach(fk => {
                        if (dataMap[fk]) textToRead += dataMap[fk] + ". ";
                    });
                    textToRead = textToRead.trim();
                }

                if (textToRead) {
                    speakTTS(textToRead);
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
    let activeTopicList = getParagraphFilteredDatasets();
    if (!activeTopicList || activeTopicList.length === 0) {
        activeTopicList = [{ topic: "Default", drills: [{ cueWord: "", drillText: "" }] }];
    }

    const isOutsideOnly = (typeof isBatchRunning !== 'undefined' && isBatchRunning && typeof batchRenderQueue !== 'undefined' && batchRenderQueue[currentBatchQueueIndex] && batchRenderQueue[currentBatchQueueIndex].isOutsideLoopOnly) || (typeof isStaticOutsideLoopRunning !== 'undefined' && isStaticOutsideLoopRunning);

    const totalSentences = isOutsideOnly ? 1 : Math.max(1, activeTopicList.length);

    if (pCurrentSentenceIndex >= totalSentences) {
        finishParagraphExport();
        return;
    }

    const curSentenceTotalDur = (typeof getEffectiveSentenceDuration === 'function')
        ? getEffectiveSentenceDuration(pCurrentSentenceIndex)
        : masterTimelineDuration;

    // Tự động kéo dãn thời lượng các lớp có snapEndToTotalDuration theo độ dài câu này
    paragraphGridConfig.groups.forEach(grp => {
        if (grp.snapEndToTotalDuration) {
            grp.duration = Math.max(0.5, curSentenceTotalDur - (grp.startTime || 0));
        }
    });

    seekTimeline(0.0);
    updateParagraphProgressBar();
    activePlayingAudioGroupIdx = -1;
    if (currentSentenceTriggeredAudioGroups) currentSentenceTriggeredAudioGroups.clear();

    // Ghi nhận mốc thời gian bắt đầu câu thực tế cho Báo cáo Sheet 2 của Batch Render
    if (isBatchRunning && batchCurrentVideoStartTime > 0) {
        const curDs = activeTopicList[pCurrentSentenceIndex] || importedDatasets[0] || {};
        const drill = (curDs && curDs.drills && curDs.drills[0]) ? curDs.drills[0] : {};
        const currentItem = (typeof batchRenderQueue !== 'undefined' && batchRenderQueue[currentBatchQueueIndex]) ? batchRenderQueue[currentBatchQueueIndex] : null;
        const startMs = Math.round(performance.now() - batchCurrentVideoStartTime);

        currentBatchSentenceLog = {
            stt: (batchTimelineSentenceLogs ? batchTimelineSentenceLogs.length : 0) + (batchCurrentTopicRealSentenceLogs ? batchCurrentTopicRealSentenceLogs.length : 0) + 1,
            scriptName: currentItem ? currentItem.scriptTag : "",
            topic: currentItem ? currentItem.topic : "",
            sentenceIdx: pCurrentSentenceIndex + 1,
            cueWord: isOutsideOnly ? "Ngoài vòng lặp" : (drill.cueWord || ""),
            drillText: isOutsideOnly ? "Kịch bản tĩnh ngoài vòng lặp" : (drill.drillText || ""),
            startMs: startMs,
            endMs: startMs + Math.round(curSentenceTotalDur * 1000),
            durationMs: Math.round(curSentenceTotalDur * 1000)
        };
    }

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
    let sentenceStartTs = performance.now() - (currentTimelinePlayTime * 1000);
    let isTransitioningToNext = false;

    const sentenceStep = (nowTs) => {
        if (!isParagraphRunning || isParagraphPaused || isTransitioningToNext) return;

        // ĐỒNG BỘ THỜI GIAN THEO ĐỒNG HỒ THỜI GIAN THỰC (REAL-TIME CLOCK SYNCHRONIZATION)
        // 1 giây đời thực = 1 giây timeline, loại bỏ triệt để hiện tượng hình chạy chậm hơn tiếng
        const elapsedSec = (nowTs - sentenceStartTs) / 1000;
        currentTimelinePlayTime = Math.max(0, elapsedSec);

        const curSentenceTotalDur = (typeof getEffectiveSentenceDuration === 'function')
            ? getEffectiveSentenceDuration(pCurrentSentenceIndex)
            : masterTimelineDuration;

        if (currentTimelinePlayTime < curSentenceTotalDur) {
            const timeDisplay = document.getElementById('timeline-current-time-display');
            if (timeDisplay) timeDisplay.innerText = `${currentTimelinePlayTime.toFixed(1)}s / ${curSentenceTotalDur.toFixed(1)}s`;
            updatePlayheadNeedlePosition();
            drawParagraphCanvasFrame();
            checkAndTriggerTimelineAudio(currentTimelinePlayTime);
        } else {
            isTransitioningToNext = true;
            stopStudioRenderClock();

            // Chốt mốc kết thúc câu thực tế cho Báo cáo Sheet 2 của Batch Render
            if (isBatchRunning && currentBatchSentenceLog) {
                const endMs = Math.round(performance.now() - batchCurrentVideoStartTime);
                currentBatchSentenceLog.endMs = endMs;
                currentBatchSentenceLog.durationMs = endMs - currentBatchSentenceLog.startMs;
                if (batchCurrentTopicRealSentenceLogs) {
                    batchCurrentTopicRealSentenceLogs.push(currentBatchSentenceLog);
                }
                currentBatchSentenceLog = null;
            }

            // DUY TRÌ VẼ CANVAS 30FPS LIÊN TỤC TRONG KHOẢNG NGHỈ GIỮA 2 CÂU (INTER-SENTENCE TRANSITION)
            // Đảm bảo captureStream không bị khựng hoặc lệch timestamp so với luồng AudioTrack trong file Full.mp4
            const transitionStartTs = performance.now();
            const pauseDurationMs = 500; // Khoảng dừng 0.5s tự nhiên giữa các câu

            const transitionStep = () => {
                if (!isParagraphRunning || isParagraphPaused) {
                    stopStudioRenderClock();
                    return;
                }
                drawParagraphCanvasFrame();

                if (performance.now() - transitionStartTs >= pauseDurationMs) {
                    stopStudioRenderClock();
                    if (!isParagraphPaused && isParagraphRunning) {
                        pCurrentSentenceIndex++;
                        currentTimelinePlayTime = 0.0;
                        runUnifiedSentenceSequence();
                    }
                }
            };
            startStudioRenderClock(transitionStep);
        }
    };

    startStudioRenderClock(sentenceStep);
}

function finishParagraphExport() {
    // Duy trì vẽ canvas 400ms cuối trước khi dừng MediaRecorder để không bị ngắt cụt đuôi video
    const finishStartTs = performance.now();
    const finishStep = () => {
        drawParagraphCanvasFrame();
        if (performance.now() - finishStartTs >= 500) {
            stopStudioRenderClock();
            if (isBatchRunning && typeof batchExecutionMode !== 'undefined' && batchExecutionMode === 'dual_parallel' && typeof batchCurrentSubPhase !== 'undefined' && batchCurrentSubPhase === 'clean') {
                if (pCleanMediaRecorder && pCleanMediaRecorder.state !== 'inactive') try { pCleanMediaRecorder.stop(); } catch(e){}
            } else {
                if (pMediaRecorder && pMediaRecorder.state !== 'inactive') try { pMediaRecorder.stop(); } catch(e){}
            }
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
        }
    };
    startStudioRenderClock(finishStep);
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
    const isOutsideOnly = (typeof isBatchRunning !== 'undefined' && isBatchRunning && typeof batchRenderQueue !== 'undefined' && batchRenderQueue[currentBatchQueueIndex] && batchRenderQueue[currentBatchQueueIndex].isOutsideLoopOnly) || (typeof isStaticOutsideLoopRunning !== 'undefined' && isStaticOutsideLoopRunning);
    if (isOutsideOnly) {
        const pBar = document.getElementById('p-render-progress-bar');
        if (pBar) pBar.style.width = '100%';
        const pPct = document.getElementById('p-render-percentage-text');
        if (pPct) pPct.innerText = '100%';
        const pInfo = document.getElementById('p-info-step-text');
        if (pInfo) pInfo.innerText = `Tiến độ: Kịch bản Ngoài Vòng Lặp (1/1)`;
        return;
    }
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
