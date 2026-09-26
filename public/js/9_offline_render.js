/**
 * 9_offline_render.js
 * CHẾ ĐỘ "RENDER SIÊU TỐC" (OFFLINE RENDER - ĐỒNG HỒ ẢO)
 *
 * Mục tiêu: xuất video KHÔNG cần chờ theo thời gian thực, KHÔNG cần mở cửa sổ, cho kết quả
 * giống hệt 3 nút Render hiện có (dùng lại 100% động cơ vẽ Canvas, Timeline, TTS, SFX, đếm ngược...).
 *
 * Nguyên lý (không sửa bất kỳ file cũ nào, chỉ "móc" vào các hàm toàn cục khi đang render siêu tốc):
 *  1. Đồng hồ ảo: performance.now() và startStudioRenderClock()/stopStudioRenderClock() được thay bằng
 *     đồng hồ ảo nhảy đúng 1/30 giây mỗi bước. Máy vẽ nhanh bao nhiêu thì xuất nhanh bấy nhiêu.
 *  2. Ghi hình: MediaRecorder được thay bằng bộ ghi WebCodecs (VideoEncoder) lấy từng khung hình Canvas
 *     sau mỗi bước -> tốc độ khung hình cố định 30 fps (CFR), không rớt khung, không "câm hình".
 *  3. Âm thanh: AudioContext dùng chung được thay bằng "AudioContext ghi sổ": mọi lệnh phát TTS/SFX/tích tắc,
 *     âm lượng, né tiếng (ducking), lặp, dừng... được ghi lại theo giờ ảo rồi trộn lại chính xác bằng
 *     OfflineAudioContext, mã hoá AAC (hoặc Opus nếu máy không có AAC) và ghép vào MP4.
 *     Khi render siêu tốc, loa ngoài im lặng (không phát tiếng tua nhanh).
 *  4. Lớp video (Video Layer): tua từng khung hình theo đồng hồ ảo thay vì phát tự do.
 *
 * Cách dùng:
 *  - Giao diện: tick ô "⚡ Siêu Tốc" cạnh các nút Render -> bấm nút Render như bình thường.
 *  - Tự động hoá (robot/Playwright): await window.EngSpurOfflineRender.run('combined' | 'separate_wav' | 'dual_parallel')
 *  - Mở app với tham số ?turbo=1 để bật sẵn ô Siêu Tốc.
 *
 * Viết cho EngSpur V17.0 (25/09/2026). Không sửa file cũ nào; chỉ thêm file này + 1 thẻ <script> trong index.html.
 * Yêu cầu: Chrome/Edge bản mới (WebCodecs). Thư viện ghép MP4 "mp4-muxer" được tải tự động từ CDN khi cần.
 */

(function () {
    'use strict';

    var OFR_VERSION = '1.0.0';
    var FPS = 30;
    var FRAME_MS = 1000 / FPS;
    var MUXER_URLS = [
        'https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.1/build/mp4-muxer.js',
        'https://unpkg.com/mp4-muxer@5.2.1/build/mp4-muxer.js'
    ];
    var TURBO_STORAGE_KEY = 'engspur_turbo_render_enabled';

    // ====== LƯU LẠI CÁC HÀM GỐC ======
    var realPerfNow = performance.now.bind(performance);
    var realMediaRecorder = window.MediaRecorder;
    var realPlay = HTMLMediaElement.prototype.play;
    var realPause = HTMLMediaElement.prototype.pause;
    var realPausedDesc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'paused');
    var saved = null; // các hàm toàn cục của app được lưu khi kích hoạt

    // ====== TRẠNG THÁI ======
    var OFR = {
        version: OFR_VERSION,
        active: false,
        codecs: null,          // { video: {...}, audio: {...} }
        lastRun: null,         // thống kê lần chạy gần nhất
        log: []
    };
    window.EngSpurOfflineRender = OFR;

    var vNow = 0;                 // giờ ảo (ms), cùng hệ quy chiếu với performance.now()
    var clockCb = null;           // callback đồng hồ Studio đang chạy
    var recorders = [];           // các bộ ghi đang ghi hình
    var finalizing = 0;           // số bộ ghi đang hoàn tất (mã hoá âm thanh, ghép MP4)
    var fakeCtx = null;           // AudioContext ghi sổ
    var audioSources = [];        // nhật ký các nguồn âm đã phát
    var managedVideos = new Set();
    var driverRunning = false;
    var runStats = null;
    var pendingLoads = 0;         // số tác vụ tải/giải mã âm thanh đang chờ (đồng hồ ảo tạm dừng để không lệch tiếng)
    var lastProgressReal = 0;

    function trackLoad(promise) {
        pendingLoads++;
        var done = function () { pendingLoads = Math.max(0, pendingLoads - 1); };
        promise.then(done, done);
        return promise;
    }

    function logMsg(msg) {
        var line = '[Siêu Tốc] ' + msg;
        OFR.log.push(line);
        if (OFR.log.length > 300) OFR.log.shift();
        console.log(line);
    }

    // Nhường luồng cho trình duyệt (MessageChannel không bị bóp tốc độ khi tab chạy nền)
    var yieldChannel = new MessageChannel();
    var yieldQueue = [];
    yieldChannel.port1.onmessage = function () { var r = yieldQueue.shift(); if (r) r(); };
    function realYield() { return new Promise(function (r) { yieldQueue.push(r); yieldChannel.port2.postMessage(0); }); }
    function realSleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    // =====================================================================
    // 1. CHỌN CODEC & TẢI THƯ VIỆN GHÉP MP4
    // =====================================================================
    function loadScriptOnce(url) {
        return new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = url;
            s.async = true;
            s.onload = function () { resolve(); };
            s.onerror = function () { s.remove(); reject(new Error('Không tải được ' + url)); };
            document.head.appendChild(s);
        });
    }

    async function ensureMuxer() {
        if (window.Mp4Muxer && window.Mp4Muxer.Muxer) return;
        var lastErr = null;
        for (var i = 0; i < MUXER_URLS.length; i++) {
            try {
                await loadScriptOnce(MUXER_URLS[i]);
                if (window.Mp4Muxer && window.Mp4Muxer.Muxer) return;
            } catch (e) { lastErr = e; }
        }
        throw lastErr || new Error('Không tải được thư viện mp4-muxer');
    }

    async function pickCodecs(width, height) {
        if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') {
            throw new Error('Trình duyệt chưa hỗ trợ WebCodecs. Hãy dùng Google Chrome hoặc Microsoft Edge bản mới.');
        }
        var videoCands = [
            // H.264 High (ưu tiên, nét hơn cùng dung lượng) -> Main -> Baseline -> VP9 -> AV1
            { codec: 'avc1.640028', mux: 'avc', label: 'H.264 High' },
            { codec: 'avc1.4D0028', mux: 'avc', label: 'H.264 Main' },
            { codec: 'avc1.42E028', mux: 'avc', label: 'H.264 Baseline' },
            { codec: 'vp09.00.40.08', mux: 'vp9', label: 'VP9' },
            { codec: 'av01.0.08M.08', mux: 'av1', label: 'AV1' }
        ];
        var video = null;
        for (var i = 0; i < videoCands.length; i++) {
            var c = videoCands[i];
            var cfg = { codec: c.codec, width: width, height: height, bitrate: 4000000, framerate: FPS, latencyMode: 'quality' };
            if (c.mux === 'avc') cfg.avc = { format: 'avc' };
            try {
                var hw = await VideoEncoder.isConfigSupported(Object.assign({}, cfg, { hardwareAcceleration: 'prefer-hardware' }));
                if (hw.supported) { video = Object.assign({}, c, { config: hw.config }); break; }
                var sw = await VideoEncoder.isConfigSupported(cfg);
                if (sw.supported) { video = Object.assign({}, c, { config: sw.config }); break; }
            } catch (e) { /* thử codec kế tiếp */ }
        }
        if (!video) throw new Error('Máy không có bộ mã hoá video phù hợp (H.264/VP9/AV1).');

        var audio = null;
        if (typeof AudioEncoder !== 'undefined') {
            var audioCands = [
                { codec: 'mp4a.40.2', mux: 'aac', label: 'AAC', sampleRate: 44100 },
                { codec: 'mp4a.40.2', mux: 'aac', label: 'AAC', sampleRate: 48000 },
                { codec: 'opus', mux: 'opus', label: 'Opus', sampleRate: 48000 }
            ];
            for (var j = 0; j < audioCands.length; j++) {
                var a = audioCands[j];
                var acfg = { codec: a.codec, sampleRate: a.sampleRate, numberOfChannels: 2, bitrate: 192000 };
                try {
                    var r = await AudioEncoder.isConfigSupported(acfg);
                    if (r.supported) { audio = Object.assign({}, a, { config: r.config }); break; }
                } catch (e) { /* thử codec kế tiếp */ }
            }
        }
        if (!audio) throw new Error('Máy không có bộ mã hoá âm thanh phù hợp (AAC/Opus).');
        return { video: video, audio: audio };
    }

    // =====================================================================
    // 2. AUDIOCONTEXT "GHI SỔ" (không phát ra loa, ghi lại mọi lệnh theo giờ ảo)
    // =====================================================================
    function FakeParam(defaultValue) {
        this._value = defaultValue;
        this.defaultValue = defaultValue;
        this.events = [];
    }
    Object.defineProperty(FakeParam.prototype, 'value', {
        get: function () { return this._value; },
        set: function (v) { this._value = v; this.events.push(['setValueAtTime', [v, vNow / 1000]]); }
    });
    ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime', 'setTargetAtTime',
        'cancelScheduledValues', 'cancelAndHoldAtTime', 'setValueCurveAtTime'].forEach(function (m) {
        FakeParam.prototype[m] = function () {
            var args = Array.prototype.slice.call(arguments);
            if (m === 'setValueAtTime') this._value = args[0];
            this.events.push([m, args]);
            return this;
        };
    });

    function FakeNode(kind) {
        this.kind = kind;
        this.outputs = [];
        this.numberOfOutputs = 1;
        this.numberOfInputs = 1;
        this.channelCount = 2;
        this.context = fakeCtx;
    }
    // Ghi lại mọi kết nối kèm thời điểm nối / ngắt (để trộn âm sau này đúng như lúc phát)
    FakeNode.prototype.connect = function (dest) {
        if (!dest) return dest;
        var open = this.outputs.some(function (e) { return e.dest === dest && e.offV === null; });
        if (!open) this.outputs.push({ dest: dest, onV: vNow, offV: null });
        return dest;
    };
    FakeNode.prototype.disconnect = function (dest) {
        this.outputs.forEach(function (e) {
            if (e.offV === null && (dest === undefined || e.dest === dest)) e.offV = vNow;
        });
    };
    FakeNode.prototype.addEventListener = function (type, fn) {
        if (type === 'ended') { this._endedListeners = this._endedListeners || []; this._endedListeners.push(fn); }
    };
    FakeNode.prototype.removeEventListener = function (type, fn) {
        if (type === 'ended' && this._endedListeners) this._endedListeners = this._endedListeners.filter(function (f) { return f !== fn; });
    };

    function FakeGain() { FakeNode.call(this, 'gain'); this.gain = new FakeParam(1); }
    FakeGain.prototype = Object.create(FakeNode.prototype);

    function FakeBufferSource() {
        FakeNode.call(this, 'buffer');
        this.buffer = null;
        this.loop = false;
        this.loopStart = 0;
        this.loopEnd = 0;
        this.playbackRate = new FakeParam(1);
        this.detune = new FakeParam(0);
        this.onended = null;
        this.startV = null;
        this.stopV = null;
        this._endFired = false;
        this._endTimer = null;
    }
    FakeBufferSource.prototype = Object.create(FakeNode.prototype);
    FakeBufferSource.prototype.start = function (when, offset, duration) {
        if (this.startV !== null) return;
        var nowSec = vNow / 1000;
        var startSec = (when && when > nowSec) ? when : nowSec;
        this.startV = startSec * 1000;
        this.offset = offset || 0;
        this.duration = duration;
        audioSources.push(this);
        if (!this.loop && this.buffer) {
            var rate = this.playbackRate._value || 1;
            var playSec = (duration !== undefined ? duration : Math.max(0, this.buffer.duration - this.offset)) / rate;
            this._scheduleEnd(this.startV + playSec * 1000);
        }
    };
    FakeBufferSource.prototype.stop = function (when) {
        if (this.startV === null) return;
        var nowSec = vNow / 1000;
        var stopSec = (when && when > nowSec) ? when : nowSec;
        var stopMs = stopSec * 1000;
        if (this.stopV === null || stopMs < this.stopV) this.stopV = stopMs;
        this._scheduleEnd(stopMs);
    };
    FakeBufferSource.prototype._scheduleEnd = function (atV) {
        if (this._endFired) return;
        if (this._endAt !== undefined && this._endAt <= atV) return;
        this._endAt = atV;
        pendingEnds.push(this);
    };
    FakeBufferSource.prototype._fireEnded = function () {
        if (this._endFired) return;
        this._endFired = true;
        var ev = { type: 'ended', target: this };
        try { if (typeof this.onended === 'function') this.onended(ev); } catch (e) { console.error(e); }
        (this._endedListeners || []).forEach(function (fn) { try { fn(ev); } catch (e) { console.error(e); } });
    };

    function FakeScheduledSource(kind) {
        FakeNode.call(this, kind);
        this.offset = new FakeParam(1);
        this.frequency = new FakeParam(440);
        this.detune = new FakeParam(0);
        this.type = 'sine';
    }
    FakeScheduledSource.prototype = Object.create(FakeNode.prototype);
    FakeScheduledSource.prototype.start = function () { };
    FakeScheduledSource.prototype.stop = function () { };

    // Danh sách nguồn âm chờ phát sự kiện "ended" theo giờ ảo
    var pendingEnds = [];
    function firePendingEnds() {
        if (pendingEnds.length === 0) return;
        var due = [];
        var keep = [];
        pendingEnds.forEach(function (s) {
            if (s._endFired) return;
            if (s._endAt <= vNow + 0.001) due.push(s); else keep.push(s);
        });
        pendingEnds = keep;
        due.sort(function (a, b) { return a._endAt - b._endAt; });
        due.forEach(function (s) { s._fireEnded(); });
    }

    function createRecordingAudioContext(realCtx) {
        var sink = new FakeNode('destination');
        sink.isSink = true;
        sink.maxChannelCount = 2;
        var base = {
            _ofrRecording: true,
            destination: sink,
            state: 'running',
            listener: realCtx.listener,
            baseLatency: 0,
            outputLatency: 0,
            onstatechange: null,
            resume: function () { return Promise.resolve(); },
            suspend: function () { return Promise.resolve(); },
            close: function () { return Promise.resolve(); },
            decodeAudioData: function () { return trackLoad(realCtx.decodeAudioData.apply(realCtx, arguments)); },
            createBuffer: function () { return realCtx.createBuffer.apply(realCtx, arguments); },
            createMediaStreamDestination: function () {
                var n = realCtx.createMediaStreamDestination();
                return n; // nút thật (để MediaStream hợp lệ); khi trộn âm được coi là "đầu ra"
            },
            createBufferSource: function () { return new FakeBufferSource(); },
            createGain: function () { return new FakeGain(); },
            createConstantSource: function () { return new FakeScheduledSource('constant'); },
            createOscillator: function () { return new FakeScheduledSource('oscillator'); },
            addEventListener: function () { },
            removeEventListener: function () { },
            getOutputTimestamp: function () { return { contextTime: vNow / 1000, performanceTime: vNow }; }
        };
        Object.defineProperty(base, 'currentTime', { get: function () { return vNow / 1000; } });
        Object.defineProperty(base, 'sampleRate', { get: function () { return realCtx.sampleRate; } });
        return new Proxy(base, {
            get: function (t, p) {
                if (p in t) return t[p];
                if (typeof p === 'string' && p.indexOf('create') === 0) {
                    // Nút lạ (lọc, nén, pan...): coi như đi thẳng (pass-through)
                    return function () { var n = new FakeNode(p); n.gain = new FakeParam(1); return n; };
                }
                var v = realCtx[p];
                return (typeof v === 'function') ? v.bind(realCtx) : v;
            }
        });
    }

    // Trộn lại toàn bộ âm thanh của 1 video bằng OfflineAudioContext
    async function mixAudioForWindow(startV, endV, sampleRate) {
        var durSec = Math.max(0.05, (endV - startV) / 1000);
        var length = Math.max(1, Math.ceil(durSec * sampleRate));
        var off = new OfflineAudioContext(2, length, sampleRate);
        var built = new Map();
        var t0 = startV / 1000;
        var count = 0;

        function isSink(node) {
            if (!node) return false;
            if (node.isSink) return true;
            if (typeof AudioNode !== 'undefined' && node instanceof AudioNode) return true; // nút thật (MediaStreamDestination...)
            return false;
        }
        function replayParam(fakeParam, realParam) {
            try { realParam.value = fakeParam.defaultValue; } catch (e) { }
            fakeParam.events.forEach(function (ev) {
                var m = ev[0];
                var a = ev[1].slice();
                try {
                    if (m === 'setValueAtTime' || m === 'linearRampToValueAtTime' || m === 'exponentialRampToValueAtTime') {
                        a[1] = Math.max(0, (a[1] || 0) - t0);
                        if (m === 'exponentialRampToValueAtTime' && a[0] <= 0) a[0] = 0.0001;
                    } else if (m === 'setTargetAtTime') {
                        a[1] = Math.max(0, (a[1] || 0) - t0);
                        a[2] = Math.max(0.0001, a[2] || 0.0001);
                    } else if (m === 'cancelScheduledValues' || m === 'cancelAndHoldAtTime') {
                        a[0] = Math.max(0, (a[0] || 0) - t0);
                    } else if (m === 'setValueCurveAtTime') {
                        a[1] = Math.max(0, (a[1] || 0) - t0);
                    }
                    realParam[m].apply(realParam, a);
                } catch (e) { /* bỏ qua lệnh không hợp lệ */ }
            });
        }
        function buildNode(fake) {
            if (built.has(fake)) return { node: built.get(fake), isNew: false };
            var n;
            if (fake instanceof FakeGain) {
                n = off.createGain();
                replayParam(fake.gain, n.gain);
            } else {
                n = off.createGain(); // nút lạ: đi thẳng
                if (fake.gain instanceof FakeParam) replayParam(fake.gain, n.gain);
            }
            built.set(fake, n);
            return { node: n, isNew: true };
        }
        function gateFor(edge, fromNode) {
            // Cạnh nối có thời điểm nối/ngắt: chèn 1 "cổng" âm lượng 0/1 theo đúng thời điểm đó
            var onSec = (edge.onV - startV) / 1000;
            var offSec = edge.offV === null ? null : (edge.offV - startV) / 1000;
            if (onSec <= 0.0005 && offSec === null) return fromNode;
            var g = off.createGain();
            g.gain.setValueAtTime(onSec > 0.0005 ? 0 : 1, 0);
            if (onSec > 0.0005) g.gain.setValueAtTime(1, onSec);
            if (offSec !== null) g.gain.setValueAtTime(0, Math.max(0, offSec));
            fromNode.connect(g);
            return g;
        }
        function wireOutputs(fake, realNode, depth) {
            if (depth > 20) return;
            // Giống hệt MediaRecorder thật: chỉ lấy tiếng đi vào "studio bus" (MediaStreamDestination) nếu có;
            // bỏ nhánh ra loa (destination) để không bị cộng đôi âm lượng.
            var hasStudioBus = fake.outputs.some(function (e) { return isSink(e.dest) && !e.dest.isSink; });
            fake.outputs.forEach(function (edge) {
                if (hasStudioBus && edge.dest && edge.dest.isSink) return;
                var out = edge.dest;
                if (edge.offV !== null && edge.offV <= startV) return; // đã ngắt trước khi video bắt đầu
                if (isSink(out)) {
                    gateFor(edge, realNode).connect(off.destination);
                } else if (out instanceof FakeParam) {
                    // kết nối vào AudioParam: bỏ qua (không dùng trong app)
                } else if (out instanceof FakeNode) {
                    var b = buildNode(out);
                    gateFor(edge, realNode).connect(b.node);
                    if (b.isNew) wireOutputs(out, b.node, depth + 1);
                }
            });
        }

        audioSources.forEach(function (s) {
            if (!s.buffer || s.startV === null) return;
            if (s.startV < startV - 1 || s.startV >= endV) return;
            var src = off.createBufferSource();
            src.buffer = s.buffer;
            src.loop = !!s.loop;
            if (s.loopStart) src.loopStart = s.loopStart;
            if (s.loopEnd) src.loopEnd = s.loopEnd;
            replayParam(s.playbackRate, src.playbackRate);
            wireOutputs(s, src, 0);
            var when = Math.max(0, (s.startV - startV) / 1000);
            if (s.duration !== undefined) src.start(when, s.offset || 0, s.duration);
            else src.start(when, s.offset || 0);
            if (s.stopV !== null && s.stopV !== undefined) {
                var stopAt = Math.max(when, (s.stopV - startV) / 1000);
                if (stopAt < durSec) src.stop(stopAt);
            }
            count++;
        });
        var rendered = await off.startRendering();
        return { buffer: rendered, sourceCount: count };
    }

    // =====================================================================
    // 3. BỘ GHI HÌNH THAY THẾ MEDIARECORDER (WEBCODECS + MP4)
    // =====================================================================
    function OfflineRecorder(stream, options) {
        this.stream = stream;
        this.options = options || {};
        this.state = 'inactive';
        this.mimeType = 'video/mp4';
        this.ondataavailable = null;
        this.onstop = null;
        this.onstart = null;
        this.onerror = null;
        var vt = stream && stream.getVideoTracks ? stream.getVideoTracks()[0] : null;
        this.canvas = (vt && vt.canvas) ? vt.canvas : (typeof pCanvas !== 'undefined' ? pCanvas : null);
        this.hasAudio = !!(stream && stream.getAudioTracks && stream.getAudioTracks().length > 0);
        this.videoChunks = [];
        this.encoder = null;
        this.frameIndex = 0;
        this.error = null;
    }
    OfflineRecorder.isTypeSupported = function (mime) { return /mp4/i.test(String(mime || '')); };
    OfflineRecorder.prototype.addEventListener = function (type, fn) { this['on' + type] = fn; };
    OfflineRecorder.prototype.removeEventListener = function () { };
    OfflineRecorder.prototype.requestData = function () { };
    OfflineRecorder.prototype.pause = function () { };
    OfflineRecorder.prototype.resume = function () { };

    OfflineRecorder.prototype.start = function () {
        if (this.state !== 'inactive') return;
        var self = this;
        var codecs = OFR.codecs;
        var cv = this.canvas;
        this.width = cv.width - (cv.width % 2);
        this.height = cv.height - (cv.height % 2);
        var vcfg = Object.assign({}, codecs.video.config, { width: this.width, height: this.height });
        var bitrate = Number(this.options.videoBitsPerSecond) || 3500000;
        vcfg.bitrate = Math.max(bitrate, 3000000);
        this.encoder = new VideoEncoder({
            output: function (chunk, meta) {
                var data = new Uint8Array(chunk.byteLength);
                chunk.copyTo(data);
                self.videoChunks.push({ type: chunk.type, timestamp: chunk.timestamp, duration: chunk.duration, data: data, meta: meta });
            },
            error: function (e) { self.error = e; console.error('[Siêu Tốc] Lỗi mã hoá video:', e); }
        });
        this.encoder.configure(vcfg);
        this.startV = vNow;
        this.state = 'recording';
        recorders.push(this);
        this.captureFrame(); // khung hình đầu tiên (t = 0)
        if (typeof this.onstart === 'function') { try { this.onstart(); } catch (e) { } }
    };

    OfflineRecorder.prototype.captureFrame = function () {
        if (this.state !== 'recording' || !this.encoder || this.encoder.state !== 'configured') return;
        var tsUs = Math.round(this.frameIndex * FRAME_MS * 1000);
        var frame;
        try {
            frame = new VideoFrame(this.canvas, { timestamp: tsUs, duration: Math.round(FRAME_MS * 1000), visibleRect: { x: 0, y: 0, width: this.width, height: this.height } });
        } catch (e) {
            frame = new VideoFrame(this.canvas, { timestamp: tsUs, duration: Math.round(FRAME_MS * 1000) });
        }
        this.encoder.encode(frame, { keyFrame: this.frameIndex % (FPS * 2) === 0 });
        frame.close();
        this.frameIndex++;
        if (runStats) runStats.frames++;
    };

    OfflineRecorder.prototype.stop = function () {
        if (this.state === 'inactive') return;
        this.state = 'inactive';
        this.stopV = this.startV + this.frameIndex * FRAME_MS; // độ dài video = số khung hình x 1/30s
        var idx = recorders.indexOf(this);
        if (idx !== -1) recorders.splice(idx, 1);
        try { if (this.stream) this.stream.getVideoTracks().forEach(function (t) { t.stop(); }); } catch (e) { }
        finalizing++;
        var self = this;
        this.finalize().catch(function (e) {
            console.error('[Siêu Tốc] Lỗi hoàn tất video:', e);
            if (typeof showToast === 'function') showToast('Render Siêu Tốc lỗi: ' + (e && e.message ? e.message : e), 'error');
            self.error = self.error || e;
            if (runStats) runStats.errors.push(String(e && e.message ? e.message : e));
            // Không để hàng đợi treo: dừng an toàn toàn bộ Batch
            try { if (typeof cancelBatchRender === 'function') cancelBatchRender(); } catch (e2) { }
        }).then(function () {
            finalizing--;
        });
    };

    OfflineRecorder.prototype.finalize = async function () {
        var codecs = OFR.codecs;
        var tA = realPerfNow();
        await this.encoder.flush();
        var tB = realPerfNow();
        try { this.encoder.close(); } catch (e) { }
        if (this.error) throw this.error;

        // ---- Âm thanh ----
        var audioChunks = [];
        var mixed = null;
        if (this.hasAudio) {
            var sr = codecs.audio.sampleRate;
            var mix = await mixAudioForWindow(this.startV, this.stopV, sr);
            mixed = mix.buffer;
            this._audioClips = mix.sourceCount;
            audioChunks = await encodeAudioBuffer(mixed, codecs.audio);
        }

        var tC = realPerfNow();
        // ---- Ghép MP4 (xen kẽ hình/tiếng theo thời gian) ----
        var M = window.Mp4Muxer;
        var target = new M.ArrayBufferTarget();
        var muxOpts = {
            target: target,
            video: { codec: codecs.video.mux, width: this.width, height: this.height, frameRate: FPS },
            fastStart: 'in-memory',
            firstTimestampBehavior: 'offset'
        };
        if (this.hasAudio && audioChunks.length > 0) {
            muxOpts.audio = { codec: codecs.audio.mux, numberOfChannels: 2, sampleRate: codecs.audio.sampleRate };
        }
        var muxer = new M.Muxer(muxOpts);
        var vi = 0, ai = 0;
        var vcs = this.videoChunks;
        while (vi < vcs.length || (muxOpts.audio && ai < audioChunks.length)) {
            var useVideo = (vi < vcs.length) && (!muxOpts.audio || ai >= audioChunks.length || vcs[vi].timestamp <= audioChunks[ai].timestamp);
            if (useVideo) {
                var c = vcs[vi++];
                muxer.addVideoChunkRaw(c.data, c.type, c.timestamp, c.duration, c.meta);
            } else {
                var a = audioChunks[ai++];
                muxer.addAudioChunkRaw(a.data, a.type, a.timestamp, a.duration, a.meta);
            }
        }
        muxer.finalize();
        var blob = new Blob([target.buffer], { type: 'video/mp4' });
        this.videoChunks = [];

        if (runStats) {
            runStats.videos.push({
                durationMs: Math.round(this.stopV - this.startV),
                frames: this.frameIndex,
                sizeMb: +(blob.size / 1048576).toFixed(2),
                audioClips: this._audioClips || 0
            });
        }

        // Trả kết quả cho động cơ Batch như MediaRecorder thật
        if (mixed) {
            // Để nút "Tách Audio WAV" / "Render Kép" xuất WAV đúng bản trộn (có âm lượng, né tiếng, lặp)
            window.batchTopicScheduledAudioList = [{ timeMs: 0, audioBuffer: mixed }];
        }
        if (typeof this.ondataavailable === 'function') this.ondataavailable({ data: blob });
        var tD = realPerfNow();
        if (typeof this.onstop === 'function') await this.onstop();
        logMsg('Hoàn tất 1 video: xả mã hoá ' + Math.round(tB - tA) + 'ms, trộn + mã hoá tiếng ' + Math.round(tC - tB) + 'ms, ghép MP4 ' + Math.round(tD - tC) + 'ms, lưu file ' + Math.round(realPerfNow() - tD) + 'ms.');
    };

    async function encodeAudioBuffer(buffer, audioCodec) {
        var out = [];
        var err = null;
        var enc = new AudioEncoder({
            output: function (chunk, meta) {
                var data = new Uint8Array(chunk.byteLength);
                chunk.copyTo(data);
                out.push({ type: chunk.type, timestamp: chunk.timestamp, duration: chunk.duration, data: data, meta: meta });
            },
            error: function (e) { err = e; }
        });
        enc.configure(audioCodec.config);
        var sr = buffer.sampleRate;
        var L = buffer.getChannelData(0);
        var R = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : L;
        var CH = 4800;
        for (var pos = 0; pos < buffer.length; pos += CH) {
            var n = Math.min(CH, buffer.length - pos);
            var planar = new Float32Array(n * 2);
            planar.set(L.subarray(pos, pos + n), 0);
            planar.set(R.subarray(pos, pos + n), n);
            var ad = new AudioData({ format: 'f32-planar', sampleRate: sr, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(pos / sr * 1e6), data: planar });
            enc.encode(ad);
            ad.close();
            if (enc.encodeQueueSize > 20) await realYield();
        }
        await enc.flush();
        enc.close();
        if (err) throw err;
        return out;
    }

    // =====================================================================
    // 4. ĐỒNG HỒ ẢO & VÒNG LẶP ĐIỀU KHIỂN
    // =====================================================================
    function virtualStartClock(callback) {
        clockCb = callback;
    }
    function virtualStopClock() {
        clockCb = null;
    }

    async function stepManagedVideos(dtMs) {
        if (managedVideos.size === 0) return;
        var waits = [];
        managedVideos.forEach(function (el) {
            if (!el._ofrPlaying || !(el.duration > 0)) return;
            var rate = el.playbackRate || 1;
            var t = (el._ofrTime !== undefined ? el._ofrTime : el.currentTime) + (dtMs / 1000) * rate;
            if (t >= el.duration) t = el.loop ? (t % el.duration) : Math.max(0, el.duration - 0.001);
            el._ofrTime = t;
            var canWait = !el._ofrNoWait && el.seekable && el.seekable.length > 0;
            if (!canWait) { try { el.currentTime = t; } catch (e) { } return; }
            waits.push(new Promise(function (resolve) {
                var done = false;
                var timer = null;
                var fin = function (timedOut) {
                    if (done) return;
                    done = true;
                    el.removeEventListener('seeked', onSeeked);
                    if (timer) clearTimeout(timer);
                    if (timedOut === true) {
                        el._ofrTimeouts = (el._ofrTimeouts || 0) + 1;
                        if (el._ofrTimeouts >= 3) { el._ofrNoWait = true; logMsg('Lớp video không tua được chính xác, chuyển sang chế độ tua gần đúng.'); }
                    }
                    resolve();
                };
                var onSeeked = function () { fin(false); };
                el.addEventListener('seeked', onSeeked);
                timer = setTimeout(function () { fin(true); }, 400);
                try { el.currentTime = t; } catch (e) { fin(false); }
            }));
        });
        if (waits.length) await Promise.all(waits);
    }

    async function driverLoop() {
        if (driverRunning) return;
        driverRunning = true;
        var sinceYield = 0;
        try {
            while (OFR.active) {
                var paused = (typeof isBatchPaused !== 'undefined' && isBatchPaused);
                if (clockCb && !paused && pendingLoads > 0) {
                    // Đang tải giọng đọc/âm thanh chưa có sẵn: dừng đồng hồ ảo chờ tải xong (tối đa 20 giây)
                    var waitStart = realPerfNow();
                    while (pendingLoads > 0 && realPerfNow() - waitStart < 20000) await realSleep(10);
                    if (pendingLoads > 0) { logMsg('Cảnh báo: tải âm thanh quá lâu, tiếp tục render.'); pendingLoads = 0; }
                    lastProgressReal = realPerfNow();
                    continue;
                }
                if (clockCb && !paused) {
                    lastProgressReal = realPerfNow();
                    await stepManagedVideos(FRAME_MS);
                    vNow += FRAME_MS;
                    firePendingEnds();
                    var cb = clockCb;
                    if (cb) {
                        try { cb(vNow); } catch (e) { console.error('[Siêu Tốc] Lỗi trong vòng vẽ:', e); }
                    }
                    for (var i = 0; i < recorders.length; i++) {
                        var rec = recorders[i];
                        rec.captureFrame();
                        while (rec.encoder && rec.encoder.encodeQueueSize > 6) await realYield();
                    }
                    if (++sinceYield >= 4) { sinceYield = 0; await realYield(); }
                } else {
                    firePendingEnds();
                    await realSleep(8);
                    // Chống treo: hàng đợi báo đang chạy nhưng không có gì tiến triển quá 3 phút -> dừng an toàn
                    if (!paused && isBatchRunningSafe() && finalizing === 0 && pendingLoads === 0 && lastProgressReal && realPerfNow() - lastProgressReal > 180000) {
                        logMsg('Không thấy tiến triển trong 3 phút, dừng an toàn hàng đợi.');
                        if (runStats) runStats.errors.push('Treo quá 3 phút, đã dừng an toàn.');
                        try { if (typeof cancelBatchRender === 'function') cancelBatchRender(); } catch (e) { }
                    }
                }
                if (finalizing > 0) lastProgressReal = realPerfNow();
                // Tự tắt khi hàng đợi Batch đã xong và mọi video đã ghi xong
                if (runStats && runStats.started && !isBatchRunningSafe() && finalizing === 0 && recorders.length === 0) {
                    break;
                }
            }
        } finally {
            driverRunning = false;
        }
    }

    function isBatchRunningSafe() {
        return (typeof isBatchRunning !== 'undefined') && !!isBatchRunning;
    }

    // =====================================================================
    // 5. KÍCH HOẠT / KHÔI PHỤC
    // =====================================================================
    function activate() {
        if (OFR.active) return;
        saved = {
            startStudioRenderClock: window.startStudioRenderClock,
            stopStudioRenderClock: window.stopStudioRenderClock,
            getSharedAudioContext: window.getSharedAudioContext,
            MediaRecorder: window.MediaRecorder
        };
        // Dừng mọi đồng hồ thật đang chạy
        try { if (typeof saved.stopStudioRenderClock === 'function') saved.stopStudioRenderClock(); } catch (e) { }

        var realCtx = saved.getSharedAudioContext();
        fakeCtx = createRecordingAudioContext(realCtx);
        audioSources = [];
        pendingEnds = [];
        vNow = realPerfNow();

        performance.now = function () { return vNow; };
        window.startStudioRenderClock = virtualStartClock;
        window.stopStudioRenderClock = virtualStopClock;
        window.getSharedAudioContext = function () { return fakeCtx; };
        window.MediaRecorder = OfflineRecorder;
        ['fetchEdgeTtsAudioBuffer', 'decodeBase64AudioToBuffer'].forEach(function (fn) {
            if (typeof window[fn] === 'function') {
                saved[fn] = window[fn];
                window[fn] = function () { return trackLoad(Promise.resolve(saved[fn].apply(this, arguments))); };
            }
        });
        pendingLoads = 0;
        lastProgressReal = realPerfNow();

        // Lớp video: tua theo đồng hồ ảo
        HTMLMediaElement.prototype.play = function () {
            if (this instanceof HTMLVideoElement) {
                this._ofrPlaying = true;
                this._ofrManaged = true;
                managedVideos.add(this);
                return Promise.resolve();
            }
            return realPlay.apply(this, arguments);
        };
        HTMLMediaElement.prototype.pause = function () {
            if (this._ofrManaged) { this._ofrPlaying = false; return; }
            return realPause.apply(this, arguments);
        };
        if (realPausedDesc && realPausedDesc.get) {
            Object.defineProperty(HTMLMediaElement.prototype, 'paused', {
                configurable: true,
                get: function () { return this._ofrManaged ? !this._ofrPlaying : realPausedDesc.get.call(this); }
            });
        }
        document.querySelectorAll('video').forEach(function (v) { try { realPause.call(v); } catch (e) { } });

        OFR.active = true;
        logMsg('Đã bật đồng hồ ảo (' + OFR.codecs.video.label + ' + ' + OFR.codecs.audio.label + ').');
    }

    function deactivate() {
        if (!OFR.active) return;
        OFR.active = false;
        clockCb = null;
        performance.now = realPerfNow;
        try { delete performance.now; } catch (e) { }
        if (performance.now !== realPerfNow && typeof performance.now !== 'function') performance.now = realPerfNow;
        window.startStudioRenderClock = saved.startStudioRenderClock;
        window.stopStudioRenderClock = saved.stopStudioRenderClock;
        window.getSharedAudioContext = saved.getSharedAudioContext;
        window.MediaRecorder = saved.MediaRecorder || realMediaRecorder;
        ['fetchEdgeTtsAudioBuffer', 'decodeBase64AudioToBuffer'].forEach(function (fn) { if (saved[fn]) window[fn] = saved[fn]; });
        HTMLMediaElement.prototype.play = realPlay;
        HTMLMediaElement.prototype.pause = realPause;
        if (realPausedDesc) Object.defineProperty(HTMLMediaElement.prototype, 'paused', realPausedDesc);
        managedVideos.forEach(function (el) { el._ofrManaged = false; el._ofrPlaying = false; delete el._ofrTime; delete el._ofrNoWait; delete el._ofrTimeouts; });
        managedVideos.clear();
        audioSources = [];
        pendingEnds = [];
        fakeCtx = null;
        logMsg('Đã trả lại đồng hồ thật.');
    }

    // =====================================================================
    // 6. CHẠY RENDER SIÊU TỐC
    // =====================================================================
    var originalStartBatch = null;

    async function run(mode) {
        mode = mode || 'combined';
        if (OFR.active) throw new Error('Render Siêu Tốc đang chạy.');
        if (isBatchRunningSafe() || (typeof isParagraphRunning !== 'undefined' && isParagraphRunning)) {
            if (typeof showToast === 'function') showToast('Đang có tiến trình render chạy! Vui lòng chờ hoặc hủy trước.', 'info');
            throw new Error('Đang có tiến trình render khác.');
        }
        var cv = (typeof pCanvas !== 'undefined' && pCanvas) ? pCanvas : null;
        if (!cv) throw new Error('Chưa khởi tạo Canvas.');

        await ensureMuxer();
        OFR.codecs = await pickCodecs(cv.width - (cv.width % 2), cv.height - (cv.height % 2));

        runStats = { mode: mode, started: false, frames: 0, videos: [], errors: [], realStart: realPerfNow(), realEnd: 0, virtualStart: 0 };
        activate();
        runStats.virtualStart = vNow;
        if (typeof showToast === 'function') showToast('⚡ Render Siêu Tốc: đang xuất video bằng đồng hồ ảo (' + OFR.codecs.video.label + ')...', 'info');

        var loop = driverLoop();
        try {
            var starter = originalStartBatch || window.startBatchRenderPipeline;
            await starter(mode);
            runStats.started = true;
            await loop;
        } finally {
            if (driverRunning) { runStats.started = true; }
            // chờ vòng lặp kết thúc hẳn
            var guard = 0;
            while (driverRunning && guard++ < 2000) await realSleep(10);
            runStats.realEnd = realPerfNow();
            deactivate();
        }

        var totalVideoMs = runStats.videos.reduce(function (s, v) { return s + v.durationMs; }, 0);
        var realMs = runStats.realEnd - runStats.realStart;
        var result = {
            mode: mode,
            codecs: { video: OFR.codecs.video.label + ' (' + OFR.codecs.video.config.codec + ')', audio: OFR.codecs.audio.label + ' ' + OFR.codecs.audio.sampleRate + 'Hz' },
            videos: runStats.videos,
            totalVideoSec: +(totalVideoMs / 1000).toFixed(2),
            realSec: +(realMs / 1000).toFixed(2),
            speedX: realMs > 0 ? +(totalVideoMs / realMs).toFixed(2) : null,
            errors: runStats.errors
        };
        OFR.lastRun = result;
        logMsg('Hoàn tất: ' + result.videos.length + ' video, ' + result.totalVideoSec + 's video trong ' + result.realSec + 's (nhanh gấp ' + result.speedX + ' lần).');
        if (typeof showToast === 'function') {
            showToast('⚡ Xong Render Siêu Tốc: ' + result.videos.length + ' video, nhanh gấp ' + result.speedX + ' lần thời gian thực.', result.errors.length ? 'warning' : 'success');
        }
        return result;
    }
    OFR.run = run;

    OFR.isTurboEnabled = function () {
        var cb = document.getElementById('batch-turbo-toggle');
        return !!(cb && cb.checked);
    };

    // Bọc hàm startBatchRenderPipeline: khi tick "Siêu Tốc" thì 3 nút Render cũ chạy chế độ siêu tốc
    function installWrapper() {
        if (typeof window.startBatchRenderPipeline !== 'function' || originalStartBatch) return;
        originalStartBatch = window.startBatchRenderPipeline;
        window.startBatchRenderPipeline = function (mode) {
            if (!OFR.active && OFR.isTurboEnabled()) {
                return run(mode).catch(function (e) {
                    console.error(e);
                    if (typeof showToast === 'function') showToast('Không chạy được Render Siêu Tốc: ' + (e && e.message ? e.message : e), 'error');
                });
            }
            return originalStartBatch.apply(this, arguments);
        };
    }

    function injectToggleUI() {
        if (document.getElementById('batch-turbo-toggle')) return;
        var anchor = document.getElementById('btn-batch-static-render') || document.getElementById('btn-batch-dual-render');
        if (!anchor || !anchor.parentNode) return;
        var label = document.createElement('label');
        label.className = 'py-1.5 px-2.5 bg-slate-900 border border-amber-500/60 text-amber-300 rounded-lg text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer select-none';
        label.title = 'Xuất video bằng đồng hồ ảo: không cần chờ theo thời gian thực, không phát tiếng ra loa. Bấm các nút Render như bình thường.';
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.id = 'batch-turbo-toggle';
        cb.className = 'accent-amber-500';
        var on = false;
        try { on = localStorage.getItem(TURBO_STORAGE_KEY) === '1'; } catch (e) { }
        try { if (new URLSearchParams(location.search).get('turbo') === '1') on = true; } catch (e) { }
        cb.checked = on;
        cb.addEventListener('change', function () {
            try { localStorage.setItem(TURBO_STORAGE_KEY, cb.checked ? '1' : '0'); } catch (e) { }
            if (typeof showToast === 'function') showToast(cb.checked ? '⚡ Đã bật Render Siêu Tốc cho các nút Render.' : 'Đã tắt Render Siêu Tốc (quay theo thời gian thực như cũ).', 'info');
        });
        var span = document.createElement('span');
        span.textContent = '⚡ Siêu Tốc';
        label.appendChild(cb);
        label.appendChild(span);
        anchor.parentNode.insertBefore(label, anchor);
    }

    function init() {
        installWrapper();
        injectToggleUI();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
