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
        const audioCtx = (typeof getSharedAudioContext === 'function') ? getSharedAudioContext() : null;
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        if (typeof preloadAllCustomAudioBuffers === 'function') {
            preloadAllCustomAudioBuffers();
        }

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
        if (typeof stopAllSfxAudio === 'function') stopAllSfxAudio();
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
        const grpPos = grp.loopPosition || (grp.isInsideLoop === false ? 'outside' : 'inside');
        const isInside = (grpPos === 'inside');

        if (isOutsideOnly && isInside) return;
        if (isParagraphRunning) {
            let activeTopicList = getParagraphFilteredDatasets();
            const totalSentences = (activeTopicList && activeTopicList.length > 0) ? activeTopicList.length : 1;
            if (grpPos === 'before' && pCurrentSentenceIndex > 0) return;
            if (grpPos === 'after' && pCurrentSentenceIndex < totalSentences - 1) return;
        }

        // Khóa âm thanh chặt chẽ nếu chưa tới phân khu Timeline tương ứng
        if (typeof getZoneBoundary === 'function') {
            const zoneBound = getZoneBoundary(grpPos);
            if (zoneBound) {
                if (curTime < zoneBound.start) return;
                if (zoneBound.maxDur > 0 && curTime > zoneBound.end) return;
            }
        }

        const start = grp.startTime || 0;
        const isOutsideLoop = !isInside;

        // Kích hoạt chuẩn xác:
        // - Với lớp Ngoài vòng lặp (BGM / Intro / Outro): kiểm tra outsideLoopTriggeredAudioGroups (không bị lặp lại mỗi câu)
        // - Với lớp Trong vòng lặp: kiểm tra currentSentenceTriggeredAudioGroups (mỗi câu trigger 1 lần khi playhead chạm tới)
        const isAlreadyTriggered = isOutsideLoop
            ? (typeof outsideLoopTriggeredAudioGroups !== 'undefined' && outsideLoopTriggeredAudioGroups ? outsideLoopTriggeredAudioGroups.has(gIdx) : false)
            : (currentSentenceTriggeredAudioGroups ? currentSentenceTriggeredAudioGroups.has(gIdx) : (activePlayingAudioGroupIdx === gIdx));

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
                if (isOutsideLoop) {
                    if (typeof outsideLoopTriggeredAudioGroups !== 'undefined' && outsideLoopTriggeredAudioGroups) outsideLoopTriggeredAudioGroups.add(gIdx);
                } else {
                    if (currentSentenceTriggeredAudioGroups) currentSentenceTriggeredAudioGroups.add(gIdx);
                }
                activePlayingAudioGroupIdx = gIdx;
                let textToRead = "";
                if (ttsItem.sourceMode === 'custom') {
                    textToRead = (ttsItem.customText || "").trim();
                } else if (isStaticBoardAllLinesMode()) {
                    // Chế độ Hiện tất cả dòng: Đọc toàn bộ các câu bài tập hiện trên bảng tĩnh
                    const fields = ttsItem.ttsSpeakFields || ["Substitution Drills"];
                    activeTopicList.forEach((ds) => {
                        const d = (ds && ds.drills && ds.drills[0]) ? ds.drills[0] : {};
                        const rowMap = {
                            "STT": d.stt || 1,
                            "STT Mẫu": ds.sttMau || 1,
                            "Chủ đề": ds.topic || "",
                            "Mẫu câu": ds.pattern || "",
                            "Câu hỏi cho mẫu câu": ds.question || "",
                            "Từ nối": d.tuNoi !== undefined ? d.tuNoi : "",
                            "Substitution words": d.cueWord || "",
                            "Dịch Substitution words": d.dichCueWord || "",
                            "Substitution Drills": d.drillText || "",
                            "Phiên âm IPA": d.ipa || "",
                            "Dịch Substitution Drills": d.dichDrillText || ""
                        };
                        if (d.rawRow) {
                            Object.keys(d.rawRow).forEach(k => {
                                if (rowMap[k] === undefined) rowMap[k] = String(d.rawRow[k] || "").trim();
                            });
                        }
                        fields.forEach(fk => {
                            if (rowMap[fk]) textToRead += rowMap[fk] + ". ";
                        });
                    });
                    textToRead = textToRead.trim();
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

            const sfxItem = (grp.fields || []).find(f => f.type === 'audio_sfx');
            if (sfxItem) {
                if (isOutsideLoop) {
                    if (typeof outsideLoopTriggeredAudioGroups !== 'undefined' && outsideLoopTriggeredAudioGroups) outsideLoopTriggeredAudioGroups.add(gIdx);
                } else {
                    if (currentSentenceTriggeredAudioGroups) currentSentenceTriggeredAudioGroups.add(gIdx);
                }
                if (typeof playSfxItem === 'function') {
                    playSfxItem(sfxItem, null, isOutsideLoop);
                }
            }
        }
    });
}

function isStaticBoardAllLinesMode() {
    if (typeof paragraphGridConfig === 'undefined' || !paragraphGridConfig) return false;
    if (paragraphGridConfig.presentationMode === 'all') return true;
    if (paragraphGridConfig.groups && paragraphGridConfig.groups.length > 0) {
        return paragraphGridConfig.groups.some(g => {
            const mode = (typeof getGroupPresentationMode === 'function')
                ? getGroupPresentationMode(g)
                : (g.presentationMode || paragraphGridConfig.presentationMode);
            return mode === 'all';
        });
    }
    return false;
}

function updatePreviewButtonLabel() {
    const btnText = document.getElementById('p-preview-btn-text');
    const pBtn = document.getElementById('p-btn-preview');
    if (!btnText || isParagraphRunning) return;
    const isAll = isStaticBoardAllLinesMode();
    if (isAll) {
        btnText.innerText = "Chạy Thử Trang Tĩnh (1 Chu Kỳ)";
        if (pBtn) pBtn.title = "Chế độ Hiện tất cả dòng: Chạy thử đúng 1 chu kỳ thời lượng Timeline (8s-10s) cho toàn bộ trang bài học";
    } else {
        btnText.innerText = "Chạy Thử Toàn Bộ (Preview)";
        if (pBtn) pBtn.title = "Chạy thử tuần tự tất cả các câu trong bài học theo kịch bản";
    }
}

function togglePreviewAllPlayback() {
    const btnIcon = document.getElementById('p-preview-btn-icon');
    const btnText = document.getElementById('p-preview-btn-text');

    const audioCtx = (typeof getSharedAudioContext === 'function') ? getSharedAudioContext() : null;
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
    if (typeof preloadAllCustomAudioBuffers === 'function') {
        preloadAllCustomAudioBuffers();
    }

    const isStaticAll = isStaticBoardAllLinesMode();

    if (!isParagraphRunning) {
        isParagraphRunning = true;
        isParagraphPaused = false;
        pCurrentSentenceIndex = 0;
        currentTimelinePlayTime = 0.0;
        if (typeof outsideLoopTriggeredAudioGroups !== 'undefined' && outsideLoopTriggeredAudioGroups) {
            outsideLoopTriggeredAudioGroups.clear();
        }
        if (btnIcon) btnIcon.setAttribute('data-lucide', 'pause-circle');
        if (btnText) btnText.innerText = "Tạm Dừng Chạy Thử";
        const statusBadge = document.getElementById('p-status-badge-text');
        if (statusBadge) {
            statusBadge.innerText = isStaticAll
                ? "Trạng thái: Đang Chạy Thử Trang Tĩnh (Hiện tất cả dòng - 1 chu kỳ)..."
                : "Trạng thái: Đang Chạy Thử Toàn Bộ...";
        }
        if (window.lucide && lucide.createIcons) lucide.createIcons();
        runUnifiedSentenceSequence();
    } else if (isParagraphRunning && !isParagraphPaused) {
        isParagraphPaused = true;
        if ('speechSynthesis' in window) window.speechSynthesis.pause();
        if (audioCtx && audioCtx.state === 'running') {
            audioCtx.suspend().catch(() => {});
        }
        stopStudioRenderClock();
        if (pRenderTimer) cancelAnimationFrame(pRenderTimer);
        if (btnIcon) btnIcon.setAttribute('data-lucide', 'play-circle');
        if (btnText) btnText.innerText = isStaticAll ? "Tiếp Tục Trang Tĩnh" : "Tiếp Tục Chạy Thử";
        const statusBadge = document.getElementById('p-status-badge-text');
        if (statusBadge) statusBadge.innerText = isStaticAll ? `Trạng thái: Tạm dừng trang tĩnh (${currentTimelinePlayTime.toFixed(1)}s)` : `Trạng thái: Tạm dừng tại câu ${pCurrentSentenceIndex + 1} (${currentTimelinePlayTime.toFixed(1)}s)`;
        if (window.lucide && lucide.createIcons) lucide.createIcons();
        showToast("Đã tạm dừng bài học! Bấm Tiếp Tục để chạy tiếp.");
    } else if (isParagraphRunning && isParagraphPaused) {
        isParagraphPaused = false;
        if ('speechSynthesis' in window) window.speechSynthesis.resume();
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        if (btnIcon) btnIcon.setAttribute('data-lucide', 'pause-circle');
        if (btnText) btnText.innerText = "Tạm Dừng Chạy Thử";
        const statusBadge = document.getElementById('p-status-badge-text');
        if (statusBadge) statusBadge.innerText = isStaticAll ? "Trạng thái: Tiếp tục phát trang tĩnh..." : "Trạng thái: Tiếp tục Chạy Thử...";
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

    // Khi chọn "Hiện tất cả các dòng", toàn bộ các câu bài học đã xuất hiện trọn vẹn trên màn hình.
    // Chạy thử (Preview) hoặc Render vận hành theo Phương án 2 (1 trang tĩnh: phát đúng 1 chu kỳ thời lượng Timeline).
    const isSingleStaticBoardMode = isStaticBoardAllLinesMode();

    const totalSentences = (isOutsideOnly || isSingleStaticBoardMode) ? 1 : Math.max(1, activeTopicList.length);

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
    if (typeof stopInsideLoopSfxAudio === 'function') stopInsideLoopSfxAudio();

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
            cueWord: isOutsideOnly ? "Ngoài vòng lặp" : (isSingleStaticBoardMode ? "Trang tĩnh (Tất cả dòng)" : (drill.cueWord || "")),
            drillText: isOutsideOnly ? "Kịch bản tĩnh ngoài vòng lặp" : (isSingleStaticBoardMode ? `Toàn bộ ${activeTopicList.length} câu trên 1 trang` : (drill.drillText || "")),
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
            // Giữ cố định khung hình hoàn chỉnh ở cuối câu vừa phát (curSentenceTotalDur - 0.02s)
            // để Preview và luồng MediaRecorder duy trì hình ảnh liên tục, không bị chớp tắt hay màn hình trống
            const transitionStartTs = performance.now();
            const pauseDurationMs = 500; // Khoảng dừng 0.5s tự nhiên giữa các câu
            currentTimelinePlayTime = Math.max(0, curSentenceTotalDur - 0.02);

            const transitionStep = () => {
                if (!isParagraphRunning || isParagraphPaused) {
                    stopStudioRenderClock();
                    return;
                }
                currentTimelinePlayTime = Math.max(0, curSentenceTotalDur - 0.02);
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
    // Duy trì vẽ canvas 500ms cuối trước khi dừng MediaRecorder để không bị ngắt cụt đuôi video
    const finishStartTs = performance.now();
    const curSentenceTotalDur = (typeof getEffectiveSentenceDuration === 'function')
        ? getEffectiveSentenceDuration(Math.max(0, pCurrentSentenceIndex - 1))
        : masterTimelineDuration;
    currentTimelinePlayTime = Math.max(0, curSentenceTotalDur - 0.02);

    const finishStep = () => {
        currentTimelinePlayTime = Math.max(0, curSentenceTotalDur - 0.02);
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
            if (typeof stopAllSfxAudio === 'function') stopAllSfxAudio();
            if (typeof outsideLoopTriggeredAudioGroups !== 'undefined' && outsideLoopTriggeredAudioGroups) {
                outsideLoopTriggeredAudioGroups.clear();
            }
            const btnIcon = document.getElementById('p-preview-btn-icon');
            if (btnIcon) btnIcon.setAttribute('data-lucide', 'play-circle');
            updatePreviewButtonLabel();
            if (window.lucide && lucide.createIcons) lucide.createIcons();

            const isStaticAll = isStaticBoardAllLinesMode();
            const statusBadge = document.getElementById('p-status-badge-text');
            if (statusBadge) statusBadge.innerText = isStaticAll ? "Trạng thái: Hoàn Tất Trang Tĩnh (1 chu kỳ)!" : "Trạng thái: Hoàn Tất!";
            const pBar = document.getElementById('p-render-progress-bar');
            if (pBar) pBar.style.width = '100%';
            const pPct = document.getElementById('p-render-percentage-text');
            if (pPct) pPct.innerText = '100%';
            seekTimeline(0);
            if (!isBatchRunning) {
                showToast(isStaticAll ? "Đã chạy thử hoàn tất trang tĩnh bài học (1 chu kỳ)!" : "Đã xem thử hoàn tất toàn bộ video!");
            }
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
    if (typeof stopAllSfxAudio === 'function') stopAllSfxAudio();
    if (typeof outsideLoopTriggeredAudioGroups !== 'undefined' && outsideLoopTriggeredAudioGroups) {
        outsideLoopTriggeredAudioGroups.clear();
    }
    stopStudioRenderClock();
    if (pRenderTimer) cancelAnimationFrame(pRenderTimer);
    if (timelinePlayAnimFrame) cancelAnimationFrame(timelinePlayAnimFrame);

    const icon = document.getElementById('timeline-play-icon');
    if (icon) icon.setAttribute('data-lucide', 'play');

    const btnIcon = document.getElementById('p-preview-btn-icon');
    if (btnIcon) btnIcon.setAttribute('data-lucide', 'play-circle');
    updatePreviewButtonLabel();

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
    const isStaticAll = isStaticBoardAllLinesMode();
    if (isOutsideOnly || isStaticAll) {
        const pBar = document.getElementById('p-render-progress-bar');
        if (pBar) pBar.style.width = '100%';
        const pPct = document.getElementById('p-render-percentage-text');
        if (pPct) pPct.innerText = '100%';
        const pInfo = document.getElementById('p-info-step-text');
        if (pInfo) pInfo.innerText = isStaticAll ? "Trang bài học tĩnh (Hiện tất cả dòng)" : "Tiến độ: Kịch bản Ngoài Vòng Lặp (1/1)";
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
