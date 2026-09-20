/**
 * 6b_sfx_audio.js
 * Tổng hợp hiệu ứng âm thanh (SFX) Web Audio API (tích tắc đồng hồ, chuông báo, whoosh),
 * quản lý file âm thanh tùy chỉnh và cơ chế né tiếng thông minh (Audio Ducking)
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

function createTickSoundBuffer(audioCtx, style = 'mechanical', isWarning = false) {
    const sampleRate = audioCtx.sampleRate || 44100;
    const dur = isWarning ? 0.08 : 0.055;
    const numSamples = Math.floor(sampleRate * dur);
    const buffer = audioCtx.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);

    if (style === 'beep') {
        const freq = isWarning ? 1200 : 880;
        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            const env = Math.sin((t / dur) * Math.PI);
            data[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.75;
        }
    } else if (style === 'wood') {
        const freq = isWarning ? 920 : 640;
        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            const env = Math.exp(-t * 95);
            const body = Math.sin(2 * Math.PI * freq * t);
            const harm = 0.3 * Math.sin(2 * Math.PI * (freq * 1.6) * t);
            data[i] = (body + harm) * env * 0.85;
        }
    } else {
        const primaryFreq = isWarning ? 3200 : 2600;
        const lowFreq = isWarning ? 1400 : 1100;
        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            const clickEnv = Math.exp(-t * 260);
            const bodyEnv = Math.exp(-t * 80);
            const click = Math.sin(2 * Math.PI * primaryFreq * t) * clickEnv * 0.7;
            const body = Math.sin(2 * Math.PI * lowFreq * t) * bodyEnv * 0.4;
            const noise = (Math.random() * 2 - 1) * clickEnv * 0.25;
            data[i] = (click + body + noise) * 0.95;
        }
    }
    return buffer;
}

function playCountdownTickSound(item, isWarning = false, isEnd = false) {
    if (!item || item.enableTickSound === false) return;
    try {
        const audioCtx = getSharedAudioContext();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }

        let buffer = null;
        if (isEnd) {
            if (item.playEndChime === false) return;
            const soundType = item.endSoundType || 'ding';
            buffer = generateSynthesizedSfxBuffer(soundType, audioCtx);
        } else {
            const style = item.tickSoundType || 'mechanical';
            buffer = createTickSoundBuffer(audioCtx, style, isWarning);
        }

        if (!buffer) return;

        const baseVolume = (item.tickVolume !== undefined ? item.tickVolume : 80) / 100;
        const isDucking = (item.ducking !== false);
        const actualVol = (isDucking && isTtsAudioSpeaking) ? (baseVolume * 0.35) : baseVolume;

        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(actualVol, audioCtx.currentTime);

        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        if (typeof batchStudioAudioDest !== 'undefined' && batchStudioAudioDest) {
            try { gainNode.connect(batchStudioAudioDest); } catch(e) {}
        }

        source.start(0);

        if (typeof isBatchRunning !== 'undefined' && isBatchRunning && typeof batchCurrentVideoStartTime !== 'undefined' && batchCurrentVideoStartTime > 0) {
            const actualAudioTimeMs = Math.max(0, Math.round(performance.now() - batchCurrentVideoStartTime));
            if (typeof batchTopicScheduledAudioList !== 'undefined' && Array.isArray(batchTopicScheduledAudioList)) {
                batchTopicScheduledAudioList.push({
                    timeMs: actualAudioTimeMs,
                    audioBuffer: buffer
                });
            }
        }
    } catch (e) {
        console.warn("Lỗi phát âm thanh đếm ngược:", e);
    }
}

function testCountdownAudioSound(gIdx, fIdx) {
    const grp = paragraphGridConfig.groups[gIdx];
    if (!grp || !grp.fields[fIdx]) return;
    const item = grp.fields[fIdx];

    playCountdownTickSound(item, false, false);
    if (typeof showToast === 'function') {
        const styleName = item.tickSoundType === 'beep' ? 'Điện tử' : (item.tickSoundType === 'wood' ? 'Gõ gỗ' : 'Cơ học');
        showToast(`Đang nghe thử tiếng tích tắc: ${styleName} (Âm lượng ${item.tickVolume !== undefined ? item.tickVolume : 80}%)...`);
    }

    setTimeout(() => {
        playCountdownTickSound(item, true, false);
    }, 400);

    if (item.playEndChime !== false) {
        setTimeout(() => {
            playCountdownTickSound(item, false, true);
        }, 800);
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
    if (typeof currentCountdownTriggeredTicks !== 'undefined' && currentCountdownTriggeredTicks) {
        currentCountdownTriggeredTicks.clear();
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
