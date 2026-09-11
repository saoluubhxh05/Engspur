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
    return (grp.fields || []).some(f => f.type === 'tts');
}

function calculateEstimatedTTSDuration(grp, sentenceData) {
    const ttsItem = (grp.fields || []).find(f => f.type === 'tts');
    if (!ttsItem) return grp.duration || 4.0;
    
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
        let finished = false;
        const onFinished = () => {
            if (!finished) {
                finished = true;
                currentPlayingAudioSource = null;
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
                if (watchdogTimer) clearTimeout(watchdogTimer);
                if (callback) callback();
            }
        };

        utterance.onend = safeCallback;
        utterance.onerror = safeCallback;

        const calculatedTimeout = Math.max(2500, (text.length / 5) * 1000 + 1500);
        watchdogTimer = setTimeout(safeCallback, calculatedTimeout);

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
