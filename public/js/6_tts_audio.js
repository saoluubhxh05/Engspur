/**
 * 6_tts_audio.js
 * Tổng hợp giọng đọc AI qua Microsoft Edge Neural TTS & Web Audio API,
 * ước lượng độ dài câu và xuất file WAV chuẩn Studio 44.1kHz Stereo 16-bit
 */

function getSharedAudioContext() {
    if (!sharedStudioAudioCtx || sharedStudioAudioCtx.state === 'closed') {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        sharedStudioAudioCtx = new AudioCtxClass({ sampleRate: 44100 });
    }
    if (sharedStudioAudioCtx.state === 'suspended') {
        sharedStudioAudioCtx.resume().catch(() => {});
    }
    return sharedStudioAudioCtx;
}

function isAudioLayer(grp) {
    return (grp.fields || []).some(f => f.type === 'tts' || f.type === 'audio_sfx');
}

function calculateEstimatedTTSDuration(grp, sentenceData) {
    const ttsItem = (grp.fields || []).find(f => f.type === 'tts');
    if (!ttsItem) {
        const sfxItem = (grp.fields || []).find(f => f.type === 'audio_sfx');
        if (sfxItem) return grp.duration || 1.0;
        return grp.duration || 4.0;
    }
    
    let text = "";
    if (ttsItem.sourceMode === 'custom') {
        text = (ttsItem.customText || "").trim();
    } else {
        const fields = ttsItem.ttsSpeakFields || ["Substitution Drills"];
        fields.forEach(f => { if (sentenceData && sentenceData[f]) text += sentenceData[f] + " "; });
    }
    if (!text.trim()) text = "Sample phrase sentence for estimate.";
    
    // Kiểm tra nếu đã có trong cache âm thanh
    const voice = videoConfig.ttsVoice || 'edge:en-US-JennyNeural';
    const rate = videoConfig.ttsRate || 0.95;
    const cacheKey = `${voice}__${rate}__${text.trim()}`;
    if (clientAudioBufferCache.has(cacheKey)) {
        const cached = clientAudioBufferCache.get(cacheKey);
        if (cached && cached.duration) {
            return Math.round((cached.duration + 0.5) * 10) / 10;
        }
    }

    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const dur = Math.max(1.5, Math.round(((words / 2.3) / rate + 0.6) * 10) / 10);
    return dur;
}

function getEffectiveSentenceDuration(sIdx = 0) {
    const activeTopicList = (typeof getParagraphFilteredDatasets === 'function') ? getParagraphFilteredDatasets() : importedDatasets;
    const ds = activeTopicList[sIdx] || importedDatasets[0] || {};
    const drill = (ds && ds.drills && ds.drills[0]) ? ds.drills[0] : {};
    const dataMap = {
        "Câu hỏi cho mẫu câu": ds.question || "",
        "Mẫu câu": ds.pattern || "",
        "Substitution words": drill.cueWord || "",
        "Dịch Substitution words": drill.dichCueWord || "",
        "Substitution Drills": drill.drillText || "",
        "Phiên âm IPA": drill.ipa || "",
        "Dịch Substitution Drills": drill.dichDrillText || ""
    };
    if (drill.rawRow) {
        Object.keys(drill.rawRow).forEach(k => {
            if (dataMap[k] === undefined) dataMap[k] = String(drill.rawRow[k] || "").trim();
        });
    }

    let totalDur = masterTimelineDuration || 8.0;

    (paragraphGridConfig.groups || []).forEach(grp => {
        if (typeof isAudioLayer === 'function' && isAudioLayer(grp)) {
            const start = grp.startTime || 0;
            const audioDur = calculateEstimatedTTSDuration(grp, dataMap);
            const end = start + audioDur;
            if (end > totalDur) {
                totalDur = Math.round((end + 0.5) * 10) / 10;
            }
        }
    });

    return Math.max(2.0, totalDur);
}

function autoRecalculateAudioLayersDuration() {
    const activeTopicList = (typeof getParagraphFilteredDatasets === 'function') ? getParagraphFilteredDatasets() : importedDatasets;
    const curDs = activeTopicList[0] || importedDatasets[0] || {};
    const drill = (curDs && curDs.drills && curDs.drills[0]) ? curDs.drills[0] : {};
    const sampleDataMap = {
        "Câu hỏi cho mẫu câu": curDs.question || "",
        "Mẫu câu": curDs.pattern || "",
        "Substitution words": drill.cueWord || "",
        "Dịch Substitution words": drill.dichCueWord || "",
        "Substitution Drills": drill.drillText || "She looks very smart with her glasses.",
        "Phiên âm IPA": drill.ipa || "",
        "Dịch Substitution Drills": drill.dichDrillText || ""
    };

    let requiredTotalDuration = masterTimelineDuration;

    paragraphGridConfig.groups.forEach(grp => {
        if (isAudioLayer(grp)) {
            const estDur = calculateEstimatedTTSDuration(grp, sampleDataMap);
            grp.duration = estDur; 
            const end = (grp.startTime || 0) + estDur;
            if (end > requiredTotalDuration) {
                requiredTotalDuration = Math.round((end + 0.5) * 10) / 10;
            }
        }
    });

    if (requiredTotalDuration > masterTimelineDuration) {
        masterTimelineDuration = requiredTotalDuration;
        const durInput = document.getElementById('master-loop-duration-input');
        if (durInput) durInput.value = masterTimelineDuration;
        showToast(`Đã tự động nới dài tổng thời lượng câu lên ${masterTimelineDuration.toFixed(1)}s để vừa giọng đọc AI!`, "info");
    }

    // Tự động kéo dài đuôi của các khối đã chọn "Thời điểm cuối trùng tổng thời lượng"
    paragraphGridConfig.groups.forEach(grp => {
        if (grp.snapEndToTotalDuration) {
            grp.duration = Math.max(0.5, masterTimelineDuration - (grp.startTime || 0));
        }
    });
}

async function fetchEdgeTtsAudioBuffer(text, voice = 'edge:en-US-JennyNeural', rate = 0.95) {
    if (!text || !text.trim()) return null;
    const cleanVoice = voice.replace(/^edge:/, '');
    const cacheKey = `${cleanVoice}__${rate}__${text.trim()}`;

    if (clientAudioBufferCache.has(cacheKey)) {
        return clientAudioBufferCache.get(cacheKey);
    }

    try {
        const url = `/api/tts?voice=${encodeURIComponent(cleanVoice)}&rate=${encodeURIComponent(rate)}&text=${encodeURIComponent(text.trim())}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const arrayBuf = await res.arrayBuffer();
        const audioCtx = getSharedAudioContext();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuf);
        clientAudioBufferCache.set(cacheKey, audioBuffer);
        return audioBuffer;
    } catch (err) {
        console.warn("Lỗi tải âm thanh Edge TTS:", err);
        return null;
    }
}

function getCachedAudioBuffer(text, voice = 'edge:en-US-JennyNeural', rate = 0.95) {
    if (!text || !text.trim()) return null;
    const cleanVoice = (voice || 'edge:en-US-JennyNeural').replace(/^edge:/, '');
    const cacheKey = `${cleanVoice}__${rate}__${text.trim()}`;
    return clientAudioBufferCache.get(cacheKey) || null;
}

function playAudioBufferDirectly(buffer, callback) {
    if (!buffer) {
        if (callback) callback();
        return;
    }
    const audioCtx = getSharedAudioContext();
    if (currentPlayingAudioSource) {
        try {
            currentPlayingAudioSource.stop();
            currentPlayingAudioSource.disconnect();
        } catch (e) {}
        currentPlayingAudioSource = null;
    }

    try {
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;

        // Kết nối tới loa ngoài người dùng
        source.connect(audioCtx.destination);

        // Luôn kết nối trực tiếp vào studio bus để MediaRecorder thu âm trong veo, không độ trễ
        if (batchStudioAudioDest) {
            try {
                source.connect(batchStudioAudioDest);
            } catch (e) {
                console.warn("Không thể kết nối vào batchStudioAudioDest", e);
            }
        }

        currentPlayingAudioSource = source;
        if (typeof setTtsSpeakingState === 'function') setTtsSpeakingState(true);
        let finished = false;
        const onFinished = () => {
            if (!finished) {
                finished = true;
                currentPlayingAudioSource = null;
                if (typeof setTtsSpeakingState === 'function') setTtsSpeakingState(false);
                if (callback) callback();
            }
        };

        source.onended = onFinished;
        source.start(0);

        // ĐỒNG BỘ 100% VỚI MINI LIVE MONITOR:
        // Ghi lại mốc mili-giây chính xác khi âm thanh bắt đầu phát ra loa và vào luồng MediaRecorder
        if (typeof isBatchRunning !== 'undefined' && isBatchRunning && typeof batchCurrentVideoStartTime !== 'undefined' && batchCurrentVideoStartTime > 0) {
            const actualAudioTimeMs = Math.max(0, Math.round(performance.now() - batchCurrentVideoStartTime));
            if (typeof batchTopicScheduledAudioList !== 'undefined' && Array.isArray(batchTopicScheduledAudioList)) {
                batchTopicScheduledAudioList.push({
                    timeMs: actualAudioTimeMs,
                    audioBuffer: buffer
                });
            }
        }

        setTimeout(onFinished, Math.max(2000, buffer.duration * 1000 + 500));
    } catch (err) {
        console.error("Lỗi phát audio qua AudioContext:", err);
        if (callback) callback();
    }
}

function speakTTS(text, callback) {
    if (!text || !text.trim()) {
        if (callback) callback();
        return;
    }

    const currentVoice = videoConfig.ttsVoice || 'edge:en-US-JennyNeural';
    const currentRate = videoConfig.ttsRate || 0.95;

    // DÙNG GIỌNG MICROSOFT EDGE NEURAL TRỰC TIẾP QUA WEB AUDIO API
    if (typeof currentVoice === 'string' && currentVoice.startsWith('edge:')) {
        // Kiểm tra tức thì trong cache để phát với độ trễ 0ms (Zero Latency Sync)
        const cached = getCachedAudioBuffer(text, currentVoice, currentRate);
        if (cached) {
            playAudioBufferDirectly(cached, callback);
            return;
        }

        fetchEdgeTtsAudioBuffer(text, currentVoice, currentRate).then(buffer => {
            if (!buffer) {
                speakWithSpeechSynthesisFallback(text, callback);
                return;
            }
            playAudioBufferDirectly(buffer, callback);
        }).catch(err => {
            console.error("Lỗi fetch audio:", err);
            speakWithSpeechSynthesisFallback(text, callback);
        });
        return;
    }

    // DÙNG GIỌNG TRÌNH DUYỆT (SPEECH SYNTHESIS NỘI BỘ)
    speakWithSpeechSynthesisFallback(text, callback);
}

function speakWithSpeechSynthesisFallback(text, callback) {
    if ('speechSynthesis' in window && text) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = videoConfig.ttsRate || 0.95;

        const voices = speechSynthesis.getVoices();
        if (videoConfig.ttsVoice !== 'default' && voices[videoConfig.ttsVoice]) {
            utterance.voice = voices[videoConfig.ttsVoice];
        }

        let done = false;
        let watchdogTimer = null;

        const safeCallback = () => {
            if (!done) {
                done = true;
                if (typeof setTtsSpeakingState === 'function') setTtsSpeakingState(false);
                if (watchdogTimer) clearTimeout(watchdogTimer);
                if (callback) callback();
            }
        };

        utterance.onend = safeCallback;
        utterance.onerror = safeCallback;

        const calculatedTimeout = Math.max(2500, (text.length / 5) * 1000 + 1500);
        watchdogTimer = setTimeout(safeCallback, calculatedTimeout);

        if (typeof setTtsSpeakingState === 'function') setTtsSpeakingState(true);
        window.speechSynthesis.speak(utterance);
    } else {
        if (callback) callback();
    }
}

function previewCurrentTTSVoice(customSampleText = null) {
    const btn = document.getElementById('btn-preview-tts') || document.getElementById('btn-ribbon-preview-tts');
    if (btn) {
        btn.classList.add('opacity-50', 'pointer-events-none');
    }
    showToast("Đang phát thử giọng đọc AI...", "info");

    let textToPlay = customSampleText;
    if (!textToPlay || !textToPlay.trim()) {
        // Kiểm tra xem có đang chọn thẻ TTS nào trong Inspector không
        if (typeof selectedTtsTarget !== 'undefined' && selectedTtsTarget) {
            const grp = paragraphGridConfig?.groups?.[selectedTtsTarget.gIdx];
            const item = grp?.fields?.[selectedTtsTarget.fIdx];
            if (item) {
                if (item.sourceMode === 'custom' && item.customText && item.customText.trim()) {
                    textToPlay = item.customText.trim();
                } else if (item.ttsSpeakFields && item.ttsSpeakFields.length > 0) {
                    const activeTopicList = (typeof getParagraphFilteredDatasets === 'function') ? getParagraphFilteredDatasets() : importedDatasets;
                    const curDs = activeTopicList[0] || importedDatasets[0] || {};
                    const drill = (curDs && curDs.drills && curDs.drills[0]) ? curDs.drills[0] : {};
                    const sampleMap = {
                        "Câu hỏi cho mẫu câu": curDs.question || "",
                        "Mẫu câu": curDs.pattern || "",
                        "Substitution words": drill.cueWord || "",
                        "Dịch Substitution words": drill.dichCueWord || "",
                        "Substitution Drills": drill.drillText || "She looks very smart with her glasses.",
                        "Phiên âm IPA": drill.ipa || "",
                        "Dịch Substitution Drills": drill.dichDrillText || ""
                    };
                    if (drill.rawRow) {
                        Object.keys(drill.rawRow).forEach(k => {
                            if (sampleMap[k] === undefined) sampleMap[k] = String(drill.rawRow[k] || "").trim();
                        });
                    }
                    let t = "";
                    item.ttsSpeakFields.forEach(f => {
                        if (sampleMap[f]) t += sampleMap[f] + ". ";
                    });
                    if (t.trim()) textToPlay = t.trim();
                }
            }
        }
    }

    if (!textToPlay || !textToPlay.trim()) {
        textToPlay = "Hello! Welcome to EngSpur Auto Video Studio. You are listening to high quality neural voice.";
    }

    speakTTS(textToPlay, () => {
        if (btn) {
            btn.classList.remove('opacity-50', 'pointer-events-none');
        }
        showToast("Đã nghe thử xong giọng đọc!", "success");
    });
}

function populateVoiceList() {
    const s2 = document.getElementById('p-tts-voice');
    if (!s2) return;

    s2.innerHTML = '';

    // 1. NHÓM GIỌNG ĐỌC MICROSOFT EDGE NEURAL (TỰ NHIÊN - MIỄN PHÍ - KHÔNG CẦN HỘP THOẠI)
    const edgeGroup = document.createElement('optgroup');
    edgeGroup.label = "🌟 Giọng Microsoft Edge Neural (Chuẩn tự nhiên - Không cần hộp thoại)";
    EDGE_NEURAL_VOICES.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = item.name;
        if (videoConfig.ttsVoice === item.id) {
            opt.selected = true;
        }
        edgeGroup.appendChild(opt);
    });
    s2.appendChild(edgeGroup);

    // 2. NHÓM GIỌNG ĐỌC TRÌNH DUYỆT THIẾT BỊ NỘI BỘ
    if ('speechSynthesis' in window) {
        const updateDeviceVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            let deviceGroup = s2.querySelector('optgroup[data-device="true"]');
            if (!deviceGroup) {
                deviceGroup = document.createElement('optgroup');
                deviceGroup.setAttribute('data-device', 'true');
                deviceGroup.label = "💻 Giọng Trình Duyệt Thiết Bị (Cũ)";
                s2.appendChild(deviceGroup);
            } else {
                deviceGroup.innerHTML = '';
            }

            const defOpt = document.createElement('option');
            defOpt.value = "default";
            defOpt.textContent = "Mặc định Thiết Bị";
            if (videoConfig.ttsVoice === "default") defOpt.selected = true;
            deviceGroup.appendChild(defOpt);

            voices.forEach((voice, index) => {
                if (voice.lang.includes('en')) {
                    const opt = document.createElement('option');
                    opt.value = String(index);
                    opt.textContent = `${voice.name} (${voice.lang})`;
                    if (String(videoConfig.ttsVoice) === String(index)) {
                        opt.selected = true;
                    }
                    deviceGroup.appendChild(opt);
                }
            });
        };

        updateDeviceVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = updateDeviceVoices;
        }
    }

    // Nếu chưa gán hoặc đang là default, đặt mặc định sang Jenny Neural
    if (!videoConfig.ttsVoice || videoConfig.ttsVoice === 'default') {
        videoConfig.ttsVoice = 'edge:en-US-JennyNeural';
        s2.value = 'edge:en-US-JennyNeural';
    } else {
        s2.value = videoConfig.ttsVoice;
    }
}

function updateParagraphConfig() {
    const voiceSelect = document.getElementById('p-tts-voice');
    const rateSelect = document.getElementById('p-tts-rate');
    if (voiceSelect) videoConfig.ttsVoice = voiceSelect.value;
    if (rateSelect) videoConfig.ttsRate = parseFloat(rateSelect.value) || 0.95;
    autoRecalculateAudioLayersDuration();
    if (typeof renderTimelineTracksUI === 'function') renderTimelineTracksUI();
    if (typeof drawParagraphCanvasFrame === 'function') drawParagraphCanvasFrame();
}

/**
 * Ghép nối các đoạn AudioBuffer thành một file WAV chuẩn Studio 44.1kHz Stereo 16-bit
 * Khớp chuẩn từng mili-giây với timeline kịch bản, không lẫn tạp âm, không phụ thuộc loa máy
 */
function createMasterWavBlobFromSentenceAudios(scheduledAudios, totalDurationMs = 0, targetSampleRate = 44100) {
    const numChannels = 2;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;

    // Tự động nhận diện sample rate của AudioBuffer thực tế (thường là 48000Hz hoặc 44100Hz của phần cứng)
    let sampleRate = targetSampleRate;
    if (scheduledAudios && scheduledAudios.length > 0 && scheduledAudios[0].audioBuffer) {
        sampleRate = scheduledAudios[0].audioBuffer.sampleRate || targetSampleRate;
    } else if (typeof sharedStudioAudioCtx !== 'undefined' && sharedStudioAudioCtx && sharedStudioAudioCtx.sampleRate) {
        sampleRate = sharedStudioAudioCtx.sampleRate;
    }

    const totalSamples = Math.max(
        Math.round(sampleRate * 0.5),
        Math.round((totalDurationMs / 1000) * sampleRate)
    );

    const masterLeft = new Float32Array(totalSamples);
    const masterRight = new Float32Array(totalSamples);

    if (scheduledAudios && scheduledAudios.length > 0) {
        scheduledAudios.forEach(item => {
            const buffer = item.audioBuffer;
            if (!buffer) return;
            const startSample = Math.max(0, Math.round((item.timeMs / 1000) * sampleRate));
            const bufLen = buffer.length;
            const bL = buffer.getChannelData(0);
            const bR = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : bL;
            const bufRate = buffer.sampleRate || sampleRate;

            if (bufRate === sampleRate) {
                for (let i = 0; i < bufLen; i++) {
                    const targetIdx = startSample + i;
                    if (targetIdx >= totalSamples) break;
                    masterLeft[targetIdx] += bL[i];
                    masterRight[targetIdx] += bR[i];
                }
            } else {
                const ratio = bufRate / sampleRate;
                const effectiveLen = Math.round(bufLen / ratio);
                for (let i = 0; i < effectiveLen; i++) {
                    const targetIdx = startSample + i;
                    if (targetIdx >= totalSamples) break;
                    const srcIdx = i * ratio;
                    const i0 = Math.floor(srcIdx);
                    const i1 = Math.min(bufLen - 1, i0 + 1);
                    const frac = srcIdx - i0;
                    const sL = bL[i0] + frac * ((bL[i1] || 0) - bL[i0]);
                    const sR = bR[i0] + frac * ((bR[i1] || 0) - bR[i0]);
                    masterLeft[targetIdx] += sL;
                    masterRight[targetIdx] += sR;
                }
            }
        });
    }

    const dataLength = totalSamples * blockAlign;
    const fileBuffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(fileBuffer);

    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    let byteOffset = 44;
    for (let i = 0; i < totalSamples; i++) {
        let sL = Math.max(-1, Math.min(1, masterLeft[i]));
        let intL = sL < 0 ? Math.round(sL * 0x8000) : Math.round(sL * 0x7FFF);
        view.setInt16(byteOffset, intL, true);

        let sR = Math.max(-1, Math.min(1, masterRight[i]));
        let intR = sR < 0 ? Math.round(sR * 0x8000) : Math.round(sR * 0x7FFF);
        view.setInt16(byteOffset + 2, intR, true);

        byteOffset += 4;
    }

    return new Blob([fileBuffer], { type: 'audio/wav' });
}

function createWavHeader(dataLength, sampleRate = 44100, numChannels = 2, bitsPerSample = 16) {
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const safeDataLen = Math.max(0, Math.floor(dataLength));
    const buffer = new ArrayBuffer(44 + safeDataLen);
    const view = new DataView(buffer);

    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + safeDataLen, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, safeDataLen, true);

    return new Blob([buffer], { type: 'audio/wav' });
}

function encodePcmChunksToWavBlob(pcmChunks, targetDurationMs = 0, sampleRate = 44100) {
    const numChannels = 2;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;

    let recordedSampleCount = 0;
    if (pcmChunks && pcmChunks.length > 0) {
        for (let i = 0; i < pcmChunks.length; i++) {
            if (pcmChunks[i] && pcmChunks[i].l) {
                recordedSampleCount += pcmChunks[i].l.length;
            }
        }
    }

    const expectedSampleCount = targetDurationMs > 0 ? Math.round((targetDurationMs / 1000) * sampleRate) : recordedSampleCount;
    const finalSampleCount = Math.max(recordedSampleCount, expectedSampleCount, Math.round(sampleRate * 0.5));
    const dataLength = finalSampleCount * blockAlign;

    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    let byteOffset = 44;
    if (pcmChunks && pcmChunks.length > 0) {
        for (let c = 0; c < pcmChunks.length; c++) {
            const chunk = pcmChunks[c];
            if (!chunk || !chunk.l) continue;
            const len = chunk.l.length;
            for (let i = 0; i < len; i++) {
                if (byteOffset + 4 > buffer.byteLength) break;

                let sL = Math.max(-1, Math.min(1, chunk.l[i]));
                let intL = sL < 0 ? Math.round(sL * 0x8000) : Math.round(sL * 0x7FFF);
                view.setInt16(byteOffset, intL, true);

                let sR = (chunk.r && chunk.r[i] !== undefined) ? Math.max(-1, Math.min(1, chunk.r[i])) : sL;
                let intR = sR < 0 ? Math.round(sR * 0x8000) : Math.round(sR * 0x7FFF);
                view.setInt16(byteOffset + 2, intR, true);

                byteOffset += 4;
            }
        }
    }

    while (byteOffset + 4 <= buffer.byteLength) {
        view.setInt16(byteOffset, 0, true);
        view.setInt16(byteOffset + 2, 0, true);
        byteOffset += 4;
    }

    return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * TỔNG HỢP ÂM THANH HIỆU ỨNG (SFX) TRỰC TIẾP QUA WEB AUDIO API
 * Chạy 100% offline không cần kết nối mạng hoặc tải file ngoài
 */
function generateSynthesizedSfxBuffer(soundType, audioCtx) {
    const sampleRate = audioCtx.sampleRate || 44100;

    if (soundType === 'tick') {
        const dur = 0.08;
        const numSamples = Math.floor(sampleRate * dur);
        const buffer = audioCtx.createBuffer(1, numSamples, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            const freq = 1200;
            const env = Math.exp(-t * 90);
            data[i] = Math.sin(2 * Math.PI * freq * t) * env;
        }
        return buffer;
    } else if (soundType === 'whoosh') {
        const dur = 0.35;
        const numSamples = Math.floor(sampleRate * dur);
        const buffer = audioCtx.createBuffer(1, numSamples, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            const p = t / dur;
            const noise = (Math.random() * 2 - 1);
            const env = Math.sin(p * Math.PI);
            const sweep = Math.sin(2 * Math.PI * (200 + p * 800) * t);
            data[i] = (noise * 0.4 + sweep * 0.6) * env * 0.7;
        }
        return buffer;
    } else if (soundType === 'bell') {
        const dur = 1.2;
        const numSamples = Math.floor(sampleRate * dur);
        const buffer = audioCtx.createBuffer(1, numSamples, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            const env = Math.exp(-t * 3.5);
            const s1 = Math.sin(2 * Math.PI * 587.33 * t);
            const s2 = 0.5 * Math.sin(2 * Math.PI * 880 * t);
            const s3 = 0.25 * Math.sin(2 * Math.PI * 1174.66 * t);
            data[i] = (s1 + s2 + s3) * env * 0.6;
        }
        return buffer;
    } else if (soundType === 'chime') {
        const dur = 0.9;
        const numSamples = Math.floor(sampleRate * dur);
        const buffer = audioCtx.createBuffer(1, numSamples, sampleRate);
        const data = buffer.getChannelData(0);
        const notes = [
            { f: 523.25, start: 0.0, end: 0.5 },
            { f: 659.25, start: 0.15, end: 0.65 },
            { f: 783.99, start: 0.3, end: 0.9 }
        ];
        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            let val = 0;
            notes.forEach(n => {
                if (t >= n.start && t < n.end) {
                    const nt = t - n.start;
                    const env = Math.exp(-nt * 5.0);
                    val += Math.sin(2 * Math.PI * n.f * nt) * env * 0.4;
                }
            });
            data[i] = val;
        }
        return buffer;
    } else {
        // Mặc định: 'ding' (Ting Ting sắc nét, vui tai)
        const dur = 0.7;
        const numSamples = Math.floor(sampleRate * dur);
        const buffer = audioCtx.createBuffer(1, numSamples, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            const env = Math.exp(-t * 5.5);
            const fundamental = Math.sin(2 * Math.PI * 880 * t);
            const overtone = 0.4 * Math.sin(2 * Math.PI * 1760 * t);
            data[i] = (fundamental + overtone) * env * 0.7;
        }
        return buffer;
    }
}

// TRẠNG THÁI TOÀN CỤC PHỤC VỤ NÉ TIẾNG DUCKING & ÂM LƯỢNG THỜI GIAN THỰC
var isTtsAudioSpeaking = false;
var activeSfxInstances = [];

function setTtsSpeakingState(isSpeaking) {
    isTtsAudioSpeaking = isSpeaking;
    if (typeof duckAllActiveSfx === 'function') {
        duckAllActiveSfx(isSpeaking);
    }
}

function duckAllActiveSfx(isDuckingActive) {
    const audioCtx = getSharedAudioContext();
    const now = audioCtx.currentTime;
    activeSfxInstances.forEach(inst => {
        if (inst.isDucking && inst.gainNode) {
            const target = isDuckingActive ? (inst.baseVolume * 0.2) : inst.baseVolume;
            try {
                inst.gainNode.gain.cancelScheduledValues(now);
                inst.gainNode.gain.setTargetAtTime(target, now, 0.08);
            } catch(e) {}
        }
    });
}

function updateActiveSfxVolume(item, newVolume) {
    const audioCtx = getSharedAudioContext();
    const now = audioCtx.currentTime;
    const baseVol = (newVolume !== undefined ? newVolume : 80) / 100;
    activeSfxInstances.forEach(inst => {
        if (inst.item === item && inst.gainNode) {
            inst.baseVolume = baseVol;
            const target = (inst.isDucking && isTtsAudioSpeaking) ? (baseVol * 0.2) : baseVol;
            try {
                inst.gainNode.gain.cancelScheduledValues(now);
                inst.gainNode.gain.setTargetAtTime(target, now, 0.02);
            } catch(e) {}
        }
    });
}

function updateActiveSfxDucking(item, isDucking) {
    const audioCtx = getSharedAudioContext();
    const now = audioCtx.currentTime;
    activeSfxInstances.forEach(inst => {
        if (inst.item === item && inst.gainNode) {
            inst.isDucking = isDucking;
            const target = (isDucking && isTtsAudioSpeaking) ? (inst.baseVolume * 0.2) : inst.baseVolume;
            try {
                inst.gainNode.gain.cancelScheduledValues(now);
                inst.gainNode.gain.setTargetAtTime(target, now, 0.05);
            } catch(e) {}
        }
    });
}

function stopInsideLoopSfxAudio() {
    const remaining = [];
    activeSfxInstances.forEach(inst => {
        if (!inst.isOutsideLoop) {
            try {
                if (inst.source) {
                    inst.source.stop();
                    inst.source.disconnect();
                }
            } catch(e) {}
        } else {
            remaining.push(inst);
        }
    });
    activeSfxInstances = remaining;
    if (activeSfxInstances.length === 0) {
        updateSfxTestButtonState(false);
    }
}

function stopAllSfxAudio() {
    activeSfxInstances.forEach(inst => {
        try {
            if (inst.source) {
                inst.source.stop();
                inst.source.disconnect();
            }
        } catch(e) {}
    });
    activeSfxInstances = [];
    if (typeof outsideLoopTriggeredAudioGroups !== 'undefined' && outsideLoopTriggeredAudioGroups) {
        outsideLoopTriggeredAudioGroups.clear();
    }
    updateSfxTestButtonState(false);
}

function updateSfxTestButtonState(isPlaying) {
    const btnText = document.getElementById('sfx-test-btn-text');
    const btnIcon = document.getElementById('sfx-test-btn-icon');
    const btn = document.getElementById('sfx-test-play-btn');
    if (btnText && btnIcon) {
        if (isPlaying) {
            btnText.innerText = "Dừng phát âm thanh";
            btnIcon.setAttribute('data-lucide', 'square');
            if (btn) btn.className = "w-full py-1.5 px-3 bg-rose-700 hover:bg-rose-600 text-white font-extrabold rounded-lg text-xs flex items-center justify-center space-x-1.5 shadow active:scale-95 transition cursor-pointer";
        } else {
            btnText.innerText = "Nghe thử âm thanh này";
            btnIcon.setAttribute('data-lucide', 'play');
            if (btn) btn.className = "w-full py-1.5 px-3 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-extrabold rounded-lg text-xs flex items-center justify-center space-x-1.5 shadow active:scale-95 transition cursor-pointer";
        }
        if (window.lucide && lucide.createIcons) lucide.createIcons();
    }
}

function safeDecodeAudioData(audioCtx, arrayBuffer) {
    return new Promise((resolve, reject) => {
        try {
            if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                return reject(new Error("ArrayBuffer rỗng"));
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume().catch(() => {});
            }
            const bufCopy = arrayBuffer.slice(0);
            let settled = false;
            const onOk = (buf) => {
                if (!settled) {
                    settled = true;
                    resolve(buf);
                }
            };
            const onFail = (err) => {
                if (!settled) {
                    settled = true;
                    reject(err || new Error("decodeAudioData failed"));
                }
            };

            const p = audioCtx.decodeAudioData(bufCopy, onOk, onFail);
            if (p && typeof p.then === 'function') {
                p.then(onOk).catch(onFail);
            }
        } catch (e) {
            reject(e);
        }
    });
}

function fallbackDecodeBase64(base64Str, audioCtx) {
    return new Promise((resolve, reject) => {
        try {
            const rawStr = base64Str.indexOf(',') !== -1 ? base64Str.split(',')[1] : base64Str;
            const binaryString = atob(rawStr);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            safeDecodeAudioData(audioCtx, bytes.buffer).then(resolve).catch(reject);
        } catch (err) {
            console.error("Lỗi fallback decodeBase64:", err);
            reject(err);
        }
    });
}

function decodeBase64AudioToBuffer(base64Str, audioCtx) {
    return new Promise((resolve, reject) => {
        if (!base64Str) {
            return reject(new Error("Dữ liệu âm thanh rỗng"));
        }
        if (!audioCtx) {
            audioCtx = getSharedAudioContext();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }

        // Nếu truyền trực tiếp ArrayBuffer (từ File.arrayBuffer())
        if (base64Str instanceof ArrayBuffer) {
            return safeDecodeAudioData(audioCtx, base64Str).then(resolve).catch(reject);
        }

        // Nếu là Data URL, trình duyệt xử lý native C++ giải mã nhanh hơn gấp 10 lần atob
        if (typeof base64Str === 'string' && base64Str.startsWith('data:')) {
            fetch(base64Str)
                .then(res => res.arrayBuffer())
                .then(arrBuf => safeDecodeAudioData(audioCtx, arrBuf))
                .then(resolve)
                .catch(() => {
                    fallbackDecodeBase64(base64Str, audioCtx).then(resolve).catch(reject);
                });
            return;
        }

        fallbackDecodeBase64(base64Str, audioCtx).then(resolve).catch(reject);
    });
}

function getCachedAudioBuffer(item) {
    if (!item) return null;
    if (typeof runtimeAudioBufferCache !== 'undefined' && runtimeAudioBufferCache) {
        if (item.customAudioData && runtimeAudioBufferCache.has(item.customAudioData)) {
            return runtimeAudioBufferCache.get(item.customAudioData);
        }
    }
    return null;
}

function setCachedAudioBuffer(item, buf) {
    if (!item || !buf) return;
    if (typeof runtimeAudioBufferCache !== 'undefined' && runtimeAudioBufferCache) {
        if (item.customAudioData) {
            runtimeAudioBufferCache.set(item.customAudioData, buf);
        }
    }
    item.customAudioDuration = buf.duration;
}

function preloadAllCustomAudioBuffers() {
    const audioCtx = getSharedAudioContext();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
    const promises = [];
    if (typeof paragraphGridConfig !== 'undefined' && Array.isArray(paragraphGridConfig.groups)) {
        paragraphGridConfig.groups.forEach(grp => {
            (grp.fields || []).forEach(f => {
                if (f.type === 'audio_sfx' && f.soundType === 'custom' && f.customAudioData) {
                    const existingBuf = getCachedAudioBuffer(f);
                    if (!existingBuf) {
                        const p = decodeBase64AudioToBuffer(f.customAudioData, audioCtx)
                            .then(buf => {
                                setCachedAudioBuffer(f, buf);
                            })
                            .catch(err => {
                                console.warn("Không thể giải mã trước audio buffer:", f.customAudioName, err);
                            });
                        promises.push(p);
                    }
                }
            });
        });
    }
    return Promise.all(promises);
}

function playSfxItem(item, callback, isOutsideLoop = false) {
    if (!item) {
        if (callback) callback();
        return;
    }

    try {
        const audioCtx = getSharedAudioContext();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }

        const baseVolume = (item.volume !== undefined ? item.volume : 80) / 100;
        const isDucking = item.ducking !== false;
        const initialVol = (isDucking && isTtsAudioSpeaking) ? (baseVolume * 0.2) : baseVolume;

        const handleBufferPlayback = (buffer) => {
            if (!buffer) {
                if (callback) callback();
                return;
            }

            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            // Với nhạc nền ngoài vòng lặp: cho phép lặp liên tục nếu file ngắn hơn video
            if (isOutsideLoop && item.loop !== false) {
                source.loop = true;
            }

            const gainNode = audioCtx.createGain();
            gainNode.gain.setValueAtTime(initialVol, audioCtx.currentTime);

            source.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            if (batchStudioAudioDest) {
                try {
                    gainNode.connect(batchStudioAudioDest);
                } catch(e) {}
            }

            const inst = {
                item,
                source,
                gainNode,
                baseVolume,
                isDucking,
                isOutsideLoop: !!isOutsideLoop
            };
            activeSfxInstances.push(inst);
            updateSfxTestButtonState(true);

            source.onended = () => {
                const idx = activeSfxInstances.indexOf(inst);
                if (idx !== -1) activeSfxInstances.splice(idx, 1);
                if (activeSfxInstances.length === 0) {
                    updateSfxTestButtonState(false);
                }
                if (callback) callback();
            };

            source.start(0);

            // Ghi nhận mốc nếu đang xuất video hàng loạt
            if (typeof isBatchRunning !== 'undefined' && isBatchRunning && typeof batchCurrentVideoStartTime !== 'undefined' && batchCurrentVideoStartTime > 0) {
                const actualAudioTimeMs = Math.max(0, Math.round(performance.now() - batchCurrentVideoStartTime));
                if (typeof batchTopicScheduledAudioList !== 'undefined' && Array.isArray(batchTopicScheduledAudioList)) {
                    batchTopicScheduledAudioList.push({
                        timeMs: actualAudioTimeMs,
                        audioBuffer: buffer
                    });
                }
            }
        };

        if (item.soundType === 'custom' && item.customAudioData) {
            const cachedBuf = getCachedAudioBuffer(item);
            if (cachedBuf) {
                handleBufferPlayback(cachedBuf);
            } else {
                decodeBase64AudioToBuffer(item.customAudioData, audioCtx)
                    .then(buf => {
                        setCachedAudioBuffer(item, buf);
                        handleBufferPlayback(buf);
                    })
                    .catch(() => {
                        const fallbackBuffer = generateSynthesizedSfxBuffer('ding', audioCtx);
                        handleBufferPlayback(fallbackBuffer);
                    });
            }
        } else {
            const synthBuffer = generateSynthesizedSfxBuffer(item.soundType || 'ding', audioCtx);
            handleBufferPlayback(synthBuffer);
        }
    } catch (e) {
        console.error("Lỗi phát SFX:", e);
        if (callback) callback();
    }
}

function testPlayAudioSfx(gIdx, fIdx) {
    if (activeSfxInstances.length > 0) {
        stopAllSfxAudio();
        showToast("Đã dừng phát âm thanh.");
        return;
    }
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];
    playSfxItem(item);
    showToast(`Đang nghe thử: ${item.customAudioName || item.soundType || 'Ting Ting'} (Âm lượng ${item.volume !== undefined ? item.volume : 80}%)!`);
}

function testPlayAudioSfxWithDucking(gIdx, fIdx) {
    stopAllSfxAudio();
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];

    // Phát âm thanh SFX
    playSfxItem(item);
    showToast("Đang phát SFX, giọng đọc AI sẽ cất tiếng sau 0.5s để thử tính năng Né Tiếng...");

    // Kích hoạt giọng đọc AI sau 500ms để người dùng nghe rõ âm lượng SFX tự hạ xuống rồi tự tăng lại
    setTimeout(() => {
        speakTTS("EngSpur Studio. Testing smart audio ducking.", () => {
            showToast("Giọng đọc kết thúc. SFX đã tự khôi phục âm lượng ban đầu!", "success");
        });
    }, 500);
}
