/**
 * 2c_workspace_io.js
 * Quản lý xuất/nhập toàn bộ Workspace JSON, tạo ảnh mẫu 9:16 và nạp Rich Demo Dataset
 */

function setQuickPosition(target, x, y, w, h) {
    if (target === 'bg') {
        if (!videoConfig.bgImageStyle) videoConfig.bgImageStyle = { widthPct: 100, heightPct: 100, posX: 0, posY: 0, opacity: 100 };
        videoConfig.bgImageStyle.posX = x;
        videoConfig.bgImageStyle.posY = y;
        if (w !== undefined) videoConfig.bgImageStyle.widthPct = w;
        if (h !== undefined) videoConfig.bgImageStyle.heightPct = h;
        syncMediaInputsFromConfig();
        drawParagraphCanvasFrame();
        showToast(`Đã căn vị trí Nền: (${x}%, ${y}%)`);
    } else if (target === 'badge') {
        if (!videoConfig.badgeStyle) videoConfig.badgeStyle = { widthPct: 15, heightPct: 10, posX: 82, posY: 4, opacity: 100, borderRadius: 20 };
        videoConfig.badgeStyle.posX = x;
        videoConfig.badgeStyle.posY = y;
        if (w !== undefined) videoConfig.badgeStyle.widthPct = w;
        syncMediaInputsFromConfig();
        drawParagraphCanvasFrame();
        showToast(`Đã căn Logo vào: (${x}%, ${y}%)`);
    }
}

function syncMediaInputsFromConfig() {
    const bgSt = videoConfig.bgImageStyle || { widthPct: 100, heightPct: 100, posX: 0, posY: 0, opacity: 100 };
    const bdSt = videoConfig.badgeStyle || { widthPct: 15, heightPct: 10, posX: 82, posY: 4, opacity: 100, borderRadius: 20, isCircle: true, removeWhiteBg: false };

    if (document.getElementById('cfg-bg-w')) document.getElementById('cfg-bg-w').value = bgSt.widthPct || 100;
    if (document.getElementById('cfg-bg-h')) document.getElementById('cfg-bg-h').value = bgSt.heightPct || 100;
    if (document.getElementById('cfg-bg-x')) document.getElementById('cfg-bg-x').value = bgSt.posX || 0;
    if (document.getElementById('cfg-bg-y')) document.getElementById('cfg-bg-y').value = bgSt.posY || 0;
    if (document.getElementById('cfg-bg-op')) document.getElementById('cfg-bg-op').value = bgSt.opacity !== undefined ? bgSt.opacity : 100;

    if (document.getElementById('cfg-bd-w')) document.getElementById('cfg-bd-w').value = bdSt.widthPct || 15;
    if (document.getElementById('cfg-bd-r')) document.getElementById('cfg-bd-r').value = bdSt.borderRadius !== undefined ? bdSt.borderRadius : 20;
    if (document.getElementById('cfg-bd-x')) document.getElementById('cfg-bd-x').value = bdSt.posX || 82;
    if (document.getElementById('cfg-bd-y')) document.getElementById('cfg-bd-y').value = bdSt.posY || 4;
    if (document.getElementById('cfg-bd-op')) document.getElementById('cfg-bd-op').value = bdSt.opacity !== undefined ? bdSt.opacity : 100;

    // Đồng bộ nút hình tròn / chữ nhật và khử nền trắng
    const isCircle = bdSt.isCircle !== false;
    const btnCircle = document.getElementById('btn-logo-shape-circle');
    const btnRect = document.getElementById('btn-logo-shape-rect');
    const rContainer = document.getElementById('cfg-bd-r-container');
    if (btnCircle && btnRect) {
        if (isCircle) {
            btnCircle.className = "p-1.5 bg-amber-600 border border-amber-500 rounded text-white flex items-center justify-center space-x-1 shadow-sm transition";
            btnRect.className = "p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 flex items-center justify-center space-x-1 transition";
        } else {
            btnCircle.className = "p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 flex items-center justify-center space-x-1 transition";
            btnRect.className = "p-1.5 bg-amber-600 border border-amber-500 rounded text-white flex items-center justify-center space-x-1 shadow-sm transition";
        }
    }
    if (rContainer) {
        if (isCircle) {
            rContainer.classList.add('opacity-40', 'pointer-events-none');
        } else {
            rContainer.classList.remove('opacity-40', 'pointer-events-none');
        }
    }
    const chkRemoveWhite = document.getElementById('cfg-bd-remove-white');
    if (chkRemoveWhite) chkRemoveWhite.checked = !!bdSt.removeWhiteBg;

    const maskInset = bdSt.maskInsetPct !== undefined ? bdSt.maskInsetPct : 5;
    if (document.getElementById('cfg-bd-inset')) document.getElementById('cfg-bd-inset').value = maskInset;
    if (document.getElementById('cfg-bd-inset-val')) document.getElementById('cfg-bd-inset-val').innerText = `${maskInset}%`;
}

/**
 * Tự động tạo ảnh thẻ mẫu 9:16 sắc nét bằng Canvas
 */
function generateDemoCardImage(title, subtitle, color1, color2, iconText) {
    const c = document.createElement('canvas');
    c.width = 540;
    c.height = 960;
    const ctx = c.getContext('2d');

    // Nền Gradient chuyển màu cao cấp
    const grad = ctx.createLinearGradient(0, 0, 540, 960);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 540, 960);

    // Họa tiết trang trí dạng sóng & vòng tròn mờ
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    ctx.arc(270, 320, 220, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(420, 780, 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Khung thẻ bo góc ở trung tâm
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 4;
    const rx = 36, ry = 80, rw = 468, rh = 800, rad = 32;
    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(rx, ry, rw, rh, rad);
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.fillRect(rx, ry, rw, rh);
    }
    ctx.restore();

    // Biểu tượng cảm xúc / Icon chính
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "84px sans-serif";
    ctx.fillText(iconText || "⭐", 270, 280);

    // Tiêu đề minh họa
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(title, 270, 420);

    // Phụ đề minh họa
    ctx.fillStyle = "#94a3b8";
    ctx.font = "22px sans-serif";
    ctx.fillText(subtitle, 270, 475);

    // Huy hiệu minh họa EngSpur
    ctx.save();
    ctx.fillStyle = "rgba(79, 70, 229, 0.35)";
    ctx.strokeStyle = "rgba(99, 102, 241, 0.6)";
    ctx.lineWidth = 2;
    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(120, 560, 300, 56, 16);
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.strokeRect(120, 560, 300, 56);
        ctx.fillRect(120, 560, 300, 56);
    }
    ctx.fillStyle = "#a5b4fc";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("ENGSPUR DEMO ASSET", 270, 588);
    ctx.restore();

    // Chân thẻ
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "14px monospace";
    ctx.fillText("9:16 Photo Frame - Ready to Render", 270, 830);

    return c.toDataURL('image/jpeg', 0.85);
}

/**
 * Nạp bộ dữ liệu phong phú gồm 3 chủ đề tiếng Anh chuẩn và 6 ảnh minh họa 9:16
 * Cho phép chạy thử ngay toàn bộ tính năng Studio, Timeline, TTS và Render Hàng Loạt
 */
async function loadRichDemoDataset(showToastMsg = true) {
    // 1. Tự động sinh 6 ảnh minh họa 9:16 chất lượng cao
    localPCImageBase64Map = {
        "image001.jpg": generateDemoCardImage("Describe Person", "Smart with glasses", "#1e1b4b", "#065f46", "👓"),
        "image002.jpg": generateDemoCardImage("Describe Person", "Kind & Warm smile", "#311042", "#831843", "✨"),
        "image003.jpg": generateDemoCardImage("Describe Person", "Always polite", "#0f172a", "#0284c7", "🌟"),
        "image004.jpg": generateDemoCardImage("Daily Routines", "Morning Coffee & Work", "#3f1a04", "#78350f", "☕"),
        "image005.jpg": generateDemoCardImage("Daily Routines", "Jog around the park", "#064e3b", "#0d9488", "🏃"),
        "image006.jpg": generateDemoCardImage("Daily Routines", "Read news before sleep", "#172554", "#4338ca", "📖")
    };

    localPCImageMap = {};
    Object.keys(localPCImageBase64Map).forEach(key => {
        const img = new Image();
        img.src = localPCImageBase64Map[key];
        localPCImageMap[key] = img;
    });

    const pcBadge = document.getElementById('pc-image-badge');
    if (pcBadge) pcBadge.innerText = `${Object.keys(localPCImageMap).length} Ảnh Local`;

    // 2. Nạp bộ 3 chủ đề câu hỏi phong phú
    importedDatasets = [
        {
            sttMau: "1",
            genre: "Giao Tiếp Hàng Ngày",
            topic: "Describe Person",
            pattern: "She looks very [Adj] with her [Noun].",
            question: "What does she look like?",
            drills: [
                { stt: 1, tuNoi: "", cueWord: "smart / glasses", dichCueWord: "thông minh / cặp kính", drillText: "She looks very smart with her glasses.", ipa: "/ʃiː lʊks ˈvɛri smɑːt wɪð hɜː ˈɡlɑːsɪz/", dichDrillText: "Cô ấy trông rất thông minh với cặp kính.", imageName: "image001.jpg" },
                { stt: 2, tuNoi: "And", cueWord: "kind / warm smile", dichCueWord: "tốt bụng / nụ cười ấm áp", drillText: "She is a kind girl with a warm smile.", ipa: "/ʃiː ɪz ə kaɪnd ɡɜːl wɪð ə wɔːm smaɪl/", dichDrillText: "Cô ấy là một cô gái tốt bụng với nụ cười ấm áp.", imageName: "image002.jpg" },
                { stt: 3, tuNoi: "Moreover", cueWord: "polite / friends", dichCueWord: "lịch sự / bạn bè", drillText: "She is always polite to her friends.", ipa: "/ʃiː ɪz ˈɔːlweɪz pəˈlaɪt tuː hɜː frɛndz/", dichDrillText: "Cô ấy luôn lịch thiệp với bạn bè của mình.", imageName: "image003.jpg" }
            ]
        },
        {
            sttMau: "2",
            genre: "Giao Tiếp Hàng Ngày",
            topic: "Daily Routines",
            pattern: "I usually [Verb] before [Activity].",
            question: "What do you do every morning?",
            drills: [
                { stt: 1, tuNoi: "", cueWord: "drink coffee / working", dichCueWord: "uống cà phê / làm việc", drillText: "I usually drink coffee before working.", ipa: "/aɪ ˈjuːʒuəli drɪŋk ˈkɒfi bɪˈfɔː ˈwɜːkɪŋ/", dichDrillText: "Tôi thường uống cà phê trước khi bắt đầu làm việc.", imageName: "image004.jpg" },
                { stt: 2, tuNoi: "Then", cueWord: "jog around the park / breakfast", dichCueWord: "chạy bộ / ăn sáng", drillText: "I usually jog around the park before breakfast.", ipa: "/aɪ ˈjuːʒuəli dʒɒɡ əˈraʊnd ðə pɑːk bɪˈfɔː ˈbrɛkfəst/", dichDrillText: "Tôi thường chạy bộ quanh công viên trước bữa sáng.", imageName: "image005.jpg" },
                { stt: 3, tuNoi: "Finally", cueWord: "read news / sleeping", dichCueWord: "đọc tin tức / đi ngủ", drillText: "I usually read news before sleeping.", ipa: "/aɪ ˈjuːʒuəli riːd njuːz bɪˈfɔː ˈsliːpɪŋ/", dichDrillText: "Tôi thường đọc tin tức trước khi đi ngủ.", imageName: "image006.jpg" }
            ]
        },
        {
            sttMau: "3",
            genre: "Du Lịch & Đời Sống",
            topic: "Travel & Vacation",
            pattern: "We plan to visit [Place] this [Time].",
            question: "Where are you going on holiday?",
            drills: [
                { stt: 1, tuNoi: "", cueWord: "Da Nang beach / summer", dichCueWord: "bãi biển Đà Nẵng / mùa hè", drillText: "We plan to visit Da Nang beach this summer.", ipa: "/wiː plæn tuː ˈvɪzɪt dɑː næŋ biːtʃ ðɪs ˈsʌmər/", dichDrillText: "Chúng tôi dự định đi thăm bãi biển Đà Nẵng vào mùa hè này.", imageName: "image001.jpg" },
                { stt: 2, tuNoi: "Also", cueWord: "Sapa mountains / weekend", dichCueWord: "núi Sa Pa / cuối tuần", drillText: "We plan to visit Sapa mountains this weekend.", ipa: "/wiː plæn tuː ˈvɪzɪt ˈsɑːpɑː ˈmaʊntɪnz ðɪs ˈwiːkˌɛnd/", dichDrillText: "Chúng tôi lên kế hoạch đi vùng núi Sa Pa vào cuối tuần này.", imageName: "image002.jpg" },
                { stt: 3, tuNoi: "And", cueWord: "ancient town / holiday", dichCueWord: "phố cổ / kỳ nghỉ", drillText: "We plan to visit ancient town this holiday.", ipa: "/wiː plæn tuː ˈvɪzɪt ˈeɪnʃənt taʊn ðɪs ˈhɒlɪdeɪ/", dichDrillText: "Chúng tôi dự định ghé thăm phố cổ vào kỳ nghỉ này.", imageName: "image003.jpg" }
            ]
        }
    ];

    excelColumnsList = [
        "STT", "STT Mẫu", "Thể loại", "Chủ đề", "Mẫu câu", "Từ gợi mở", "Câu hỏi cho mẫu câu", "Từ nối",
        "Substitution words", "Dịch Substitution words", "Substitution Drills",
        "Phiên âm IPA", "Dịch Substitution Drills", "Minh họa", "ten_file_dinh_kem"
    ];

    paragraphSelectedTopic = "ALL";
    paragraphSelectedGenre = "ALL";
    pCurrentSentenceIndex = 0;

    // Đảm bảo có sẵn ít nhất 2 kịch bản mẫu chuẩn
    if (typeof ensureSavedParagraphProfiles === 'function') ensureSavedParagraphProfiles();
    if (typeof loadDefaultJSONTemplate === 'function') loadDefaultJSONTemplate(1, false);

    // Cập nhật toàn bộ các bảng, dropdown và canvas
    renderSavedParagraphProfilesDropdown();
    renderMailMergeFieldChips();
    renderTimelineLayersListUI();
    renderTimelineTracksUI();
    renderInspectorRibbon();
    updateTopicDropdown();
    renderDatasetTable();
    refreshBatchTopicsTable();
    syncInlineGridSettingsInputs();
    drawParagraphCanvasFrame();

    // Tự động lưu trạng thái này vào IndexedDB để lần sau mở ra có ngay
    await saveFullSystemState(false);

    if (showToastMsg) {
        showToast("⚡ Đã nạp 3 chủ đề mẫu & 6 ảnh minh họa! Sẵn sàng chạy thử mọi tính năng.");
    }
}

/**
 * Mở hộp thoại tùy chọn xuất file JSON (Siêu nhẹ / Nén tối ưu / Đầy đủ)
 */
function openExportWorkspaceModal() {
    const modal = document.getElementById('export-workspace-options-modal');
    if (modal) {
        modal.classList.remove('hidden');
        if (window.lucide && lucide.createIcons) lucide.createIcons();
    }
}

/**
 * Đóng hộp thoại tùy chọn xuất file JSON
 */
function closeExportWorkspaceModal() {
    const modal = document.getElementById('export-workspace-options-modal');
    if (modal) modal.classList.add('hidden');
}

/**
 * Hàm nén hình ảnh Base64 bằng HTML5 Canvas API (thu nhỏ kích thước và nén JPEG)
 */
function compressBase64Image(dataUrl, maxWidth = 720, maxHeight = 1280, quality = 0.7) {
    return new Promise((resolve) => {
        if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
            return resolve(dataUrl);
        }
        const img = new Image();
        img.onload = () => {
            try {
                let w = img.width;
                let h = img.height;
                if (w > maxWidth || h > maxHeight) {
                    const ratio = Math.min(maxWidth / w, maxHeight / h);
                    w = Math.max(1, Math.round(w * ratio));
                    h = Math.max(1, Math.round(h * ratio));
                }
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const compressed = canvas.toDataURL('image/jpeg', quality);
                // Giữ lại bản có kích thước chuỗi nhỏ hơn
                resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
            } catch (err) {
                resolve(dataUrl);
            }
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}

/**
 * Quét đệ quy và loại bỏ toàn bộ chuỗi Base64 âm thanh và ảnh nặng ẩn trong đối tượng kịch bản
 */
function stripHeavyBase64Data(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => stripHeavyBase64Data(item));
    }
    const cleanObj = {};
    for (const key of Object.keys(obj)) {
        const val = obj[key];
        // Loại bỏ hoàn toàn các chuỗi dữ liệu âm thanh Base64 nặng (thường 5MB - 20MB mỗi tệp)
        if (key === 'customAudioData' || key === 'customAudioBase64' || key === 'audioData' || key === 'audioBase64' || key === 'audioBufferData') {
            continue;
        }
        // Loại bỏ bất kỳ chuỗi Data URI Base64 ẩn nào quá dài (> 200 ký tự)
        if (typeof val === 'string' && val.startsWith('data:') && val.length > 200) {
            continue;
        }
        if (val !== null && typeof val === 'object') {
            cleanObj[key] = stripHeavyBase64Data(val);
        } else {
            cleanObj[key] = val;
        }
    }
    return cleanObj;
}

/**
 * Điểm vào hàm xuất: Nếu không truyền mode thì mở Modal tùy chọn, nếu có mode thì xuất trực tiếp
 */
function exportFullWorkspaceToJSON(mode) {
    if (mode && (mode === 'light' || mode === 'optimized' || mode === 'full')) {
        executeExportWorkspaceByMode(mode);
    } else {
        openExportWorkspaceModal();
    }
}

/**
 * Thực thi xuất không gian làm việc theo chế độ được chọn
 * @param {'light' | 'optimized' | 'full'} mode
 */
async function executeExportWorkspaceByMode(mode = 'light') {
    const overlay = document.getElementById('export-compress-loading-overlay');
    const progressText = document.getElementById('export-compress-progress-text');

    // 1. Thu thập các thông số cấu hình Tab 3: Render Hàng Loạt
    const targetPracticeMode = document.getElementById('batch-target-practice-mode')?.value || 'mode3';
    const namingPattern = document.getElementById('batch-naming-pattern-input')?.value || '{stt}-[{script}]-[{topic}]';
    const groupingMode = document.getElementById('batch-grouping-mode-select')?.value || (typeof batchGroupingMode !== 'undefined' ? batchGroupingMode : 'topic');
    const separateOutputType = document.getElementById('batch-separate-output-type')?.value || 'per_script';
    const selectedChainProfiles = (typeof batchSelectedChainProfiles !== 'undefined' && Array.isArray(batchSelectedChainProfiles)) ? [...batchSelectedChainProfiles] : [];
    const customScriptNamingMap = (typeof batchCustomScriptNamingMap !== 'undefined' && batchCustomScriptNamingMap) ? { ...batchCustomScriptNamingMap } : {};
    
    const queueSelections = (typeof batchRenderQueue !== 'undefined' && Array.isArray(batchRenderQueue))
        ? batchRenderQueue.map(item => ({ queueId: item.queueId, stt: item.stt, topic: item.topic, selected: item.selected !== false }))
        : [];

    let exportImagesMap = {};
    let exportCanvasBg = "";
    let exportCanvasBadge = "";
    let isMinified = false;

    // Chuẩn bị dữ liệu kịch bản: Nếu là Bản Siêu Nhẹ, quét sạch mọi âm thanh và ảnh Base64 ẩn
    let exportGridConfig = paragraphGridConfig;
    let exportSavedProfiles = savedParagraphProfiles;
    let exportDatasets = importedDatasets;
    let exportFieldStyles = paragraphFieldStyles;

    if (mode === 'light') {
        // Chế độ Siêu Nhẹ: Loại bỏ hoàn toàn ảnh Base64 VÀ âm thanh Base64 ẩn trong kịch bản
        exportImagesMap = {};
        exportCanvasBg = "";
        exportCanvasBadge = "";
        isMinified = true; // Thu gọn JSON loại bỏ khoảng trắng thừa

        exportGridConfig = stripHeavyBase64Data(paragraphGridConfig);
        exportSavedProfiles = (savedParagraphProfiles || []).map(prof => stripHeavyBase64Data(prof));
        exportDatasets = stripHeavyBase64Data(importedDatasets);
        exportFieldStyles = stripHeavyBase64Data(paragraphFieldStyles);
    } else if (mode === 'optimized') {
        // Chế độ Nén Tối Ưu: Nén từng ảnh Base64 bằng Canvas
        if (overlay) overlay.classList.remove('hidden');
        if (progressText) progressText.innerText = "Đang tối ưu ảnh minh họa...";

        const totalKeys = Object.keys(localPCImageBase64Map || {});
        let count = 0;
        for (const key of totalKeys) {
            count++;
            if (progressText) progressText.innerText = `Đang nén ảnh ${count} / ${totalKeys.length} (${key})...`;
            const originalUrl = localPCImageBase64Map[key];
            exportImagesMap[key] = await compressBase64Image(originalUrl, 720, 1280, 0.7);
        }

        if (canvasBgBase64) {
            if (progressText) progressText.innerText = "Đang nén ảnh nền video...";
            exportCanvasBg = await compressBase64Image(canvasBgBase64, 720, 1280, 0.7);
        }
        if (canvasBadgeBase64) {
            if (progressText) progressText.innerText = "Đang nén logo badge...";
            exportCanvasBadge = await compressBase64Image(canvasBadgeBase64, 400, 400, 0.75);
        }
        isMinified = true;
    } else {
        // Chế độ Đầy Đủ: Giữ nguyên 100% bản gốc
        exportImagesMap = localPCImageBase64Map ? { ...localPCImageBase64Map } : {};
        exportCanvasBg = canvasBgBase64 || "";
        exportCanvasBadge = canvasBadgeBase64 || "";
        isMinified = false;
    }

    const backupData = {
        app: "EngSpur Auto Video Studio",
        version: (typeof APP_VERSION_INFO !== 'undefined' && APP_VERSION_INFO.version) ? APP_VERSION_INFO.version : "V15.3",
        exportMode: mode,
        exportDate: new Date().toISOString(),
        importedDatasets: exportDatasets,
        excelColumnsList,
        videoConfig,
        savedParagraphProfiles: exportSavedProfiles,
        activeParagraphProfileId,
        paragraphGridConfig: exportGridConfig,
        paragraphFieldStyles: exportFieldStyles,
        localPCImageBase64Map: exportImagesMap,
        canvasBgBase64: exportCanvasBg,
        canvasBadgeBase64: exportCanvasBadge,
        paragraphSelectedTopic,
        paragraphFilterMode: (typeof paragraphFilterMode !== 'undefined') ? paragraphFilterMode : 'topic',
        paragraphSelectedGenre: (typeof paragraphSelectedGenre !== 'undefined') ? paragraphSelectedGenre : 'ALL',
        masterTimelineDuration,
        // Cấu hình Tab 3: Render Hàng Loạt (Batch Multi-Chain Pipeline)
        batchRenderConfig: {
            targetPracticeMode,
            namingPattern,
            namingPresets: (typeof batchNamingPresets !== 'undefined') ? batchNamingPresets : [],
            groupingMode,
            separateOutputType,
            selectedChainProfiles,
            customScriptNamingMap,
            queueSelections,
            directoryName: (typeof batchDirectoryName !== 'undefined') ? batchDirectoryName : ''
        },
        batchTargetPracticeMode: targetPracticeMode,
        batchNamingPattern: namingPattern,
        batchNamingPresets: (typeof batchNamingPresets !== 'undefined') ? batchNamingPresets : [],
        batchGroupingMode: groupingMode,
        batchSeparateOutputType: separateOutputType,
        batchSelectedChainProfiles: selectedChainProfiles,
        batchCustomScriptNamingMap: customScriptNamingMap,
        batchDirectoryName: (typeof batchDirectoryName !== 'undefined') ? batchDirectoryName : ''
    };

    const jsonStr = isMinified ? JSON.stringify(backupData) : JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const nowStr = new Date().toISOString().slice(0, 10);
    
    let filename = `EngSpur_Workspace_Backup_${nowStr}.json`;
    if (mode === 'light') filename = `EngSpur_Workspace_Light_${nowStr}.json`;
    else if (mode === 'optimized') filename = `EngSpur_Workspace_Optimized_${nowStr}.json`;
    else filename = `EngSpur_Workspace_FullBackup_${nowStr}.json`;

    // Tính kích thước file hiển thị thân thiện
    const sizeInKB = (blob.size / 1024);
    const formattedSize = sizeInKB > 1024 
        ? `${(sizeInKB / 1024).toFixed(2)} MB` 
        : `${Math.round(sizeInKB)} KB`;

    downloadBlobFallback(blob, filename);

    if (overlay) overlay.classList.add('hidden');
    closeExportWorkspaceModal();

    if (mode === 'light') {
        showToast(`⚡ Đã xuất Bản Siêu Nhẹ thành công (${formattedSize})!`);
    } else if (mode === 'optimized') {
        showToast(`📦 Đã xuất Bản Nén Tối Ưu thành công (${formattedSize})!`);
    } else {
        showToast(`💾 Đã xuất Bản Gốc Đầy Đủ thành công (${formattedSize})!`);
    }
}

/**
 * Nhập lại toàn bộ không gian làm việc từ file JSON dự phòng
 */
function handleImportFullWorkspaceJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const data = JSON.parse(evt.target.result);
            if (data && (data.importedDatasets || data.savedParagraphProfiles || data.paragraphGridConfig)) {
                // Ghi nhớ các âm thanh Base64 hiện có trên máy người dùng để bảo lưu nếu file nhập là bản siêu nhẹ
                const localAudioCache = {};
                if (paragraphGridConfig && Array.isArray(paragraphGridConfig.groups)) {
                    paragraphGridConfig.groups.forEach(g => {
                        if (Array.isArray(g.fields)) {
                            g.fields.forEach(f => {
                                if (f.customAudioName && f.customAudioData) {
                                    localAudioCache[f.customAudioName] = f.customAudioData;
                                }
                            });
                        }
                    });
                }

                if (data.importedDatasets) importedDatasets = data.importedDatasets;
                if (data.excelColumnsList) excelColumnsList = data.excelColumnsList;
                if (data.videoConfig) videoConfig = { ...videoConfig, ...data.videoConfig };
                if (data.savedParagraphProfiles) savedParagraphProfiles = data.savedParagraphProfiles;
                if (data.activeParagraphProfileId) activeParagraphProfileId = data.activeParagraphProfileId;
                if (data.paragraphGridConfig) paragraphGridConfig = data.paragraphGridConfig;
                if (data.paragraphFieldStyles) paragraphFieldStyles = data.paragraphFieldStyles;
                if (data.paragraphSelectedTopic) paragraphSelectedTopic = data.paragraphSelectedTopic;
                if (data.paragraphFilterMode && typeof paragraphFilterMode !== 'undefined') paragraphFilterMode = data.paragraphFilterMode;
                if (data.paragraphSelectedGenre && typeof paragraphSelectedGenre !== 'undefined') paragraphSelectedGenre = data.paragraphSelectedGenre;
                if (data.masterTimelineDuration) masterTimelineDuration = data.masterTimelineDuration;

                // Khôi phục lại customAudioData nếu file nhập là bản siêu nhẹ và máy có sẵn âm thanh
                if (paragraphGridConfig && Array.isArray(paragraphGridConfig.groups)) {
                    paragraphGridConfig.groups.forEach(g => {
                        if (Array.isArray(g.fields)) {
                            g.fields.forEach(f => {
                                if (f.customAudioName && !f.customAudioData && localAudioCache[f.customAudioName]) {
                                    f.customAudioData = localAudioCache[f.customAudioName];
                                }
                            });
                        }
                    });
                }
                if (Array.isArray(savedParagraphProfiles)) {
                    savedParagraphProfiles.forEach(prof => {
                        if (prof && Array.isArray(prof.groups)) {
                            prof.groups.forEach(g => {
                                if (Array.isArray(g.fields)) {
                                    g.fields.forEach(f => {
                                        if (f.customAudioName && !f.customAudioData && localAudioCache[f.customAudioName]) {
                                            f.customAudioData = localAudioCache[f.customAudioName];
                                        }
                                    });
                                }
                            });
                        }
                    });
                }

                // Khôi phục các thông số và tùy chọn cấu hình Tab 3: Render Hàng Loạt
                const batchCfg = data.batchRenderConfig || {};
                const importedTargetMode = batchCfg.targetPracticeMode || data.batchTargetPracticeMode || 'mode3';
                const importedNamingPattern = batchCfg.namingPattern || data.batchNamingPattern || '{stt}-[{script}]-[{topic}]';
                const importedNamingPresets = batchCfg.namingPresets || data.batchNamingPresets;
                const importedGroupingMode = batchCfg.groupingMode || data.batchGroupingMode || 'topic';
                const importedSeparateType = batchCfg.separateOutputType || data.batchSeparateOutputType || 'per_script';
                const importedChainProfiles = batchCfg.selectedChainProfiles || data.batchSelectedChainProfiles;
                const importedCustomNaming = batchCfg.customScriptNamingMap || data.batchCustomScriptNamingMap;
                const importedDirName = batchCfg.directoryName || data.batchDirectoryName || '';

                // 1. Áp dụng Chế độ / Chuỗi Render
                const targetModeEl = document.getElementById('batch-target-practice-mode');
                if (targetModeEl) {
                    targetModeEl.value = importedTargetMode;
                }

                // 2. Áp dụng Mẫu Đặt Tên File & Danh sách mẫu đã lưu
                const patternInput = document.getElementById('batch-naming-pattern-input');
                if (patternInput) {
                    patternInput.value = importedNamingPattern;
                }
                if (importedNamingPresets && Array.isArray(importedNamingPresets) && importedNamingPresets.length > 0) {
                    batchNamingPresets = importedNamingPresets;
                }

                // 3. Áp dụng Gom nhóm tạo file (Chủ đề / Thể loại)
                if (typeof batchGroupingMode !== 'undefined') {
                    batchGroupingMode = importedGroupingMode;
                }
                const groupSelect = document.getElementById('batch-grouping-mode-select');
                if (groupSelect) {
                    groupSelect.value = importedGroupingMode;
                }
                const headerElem = document.getElementById('batch-table-header-group');
                if (headerElem) {
                    headerElem.innerText = (importedGroupingMode === 'genre') ? 'Thể Loại (Genre)' : 'Chủ Đề (Topic)';
                }

                // 4. Áp dụng Quy cách tách file
                const separateSelect = document.getElementById('batch-separate-output-type');
                if (separateSelect) {
                    separateSelect.value = importedSeparateType;
                }

                // 5. Áp dụng Danh sách kịch bản trong chuỗi Multi-Chain
                if (importedChainProfiles && Array.isArray(importedChainProfiles)) {
                    batchSelectedChainProfiles = importedChainProfiles;
                }

                // 6. Áp dụng Tùy chỉnh tên kịch bản
                if (importedCustomNaming && typeof importedCustomNaming === 'object') {
                    batchCustomScriptNamingMap = importedCustomNaming;
                }

                // 7. Hiển thị thông tin thư mục nếu có
                if (importedDirName) {
                    batchDirectoryName = importedDirName;
                    const dirDisplay = document.getElementById('batch-dir-display');
                    if (dirDisplay) dirDisplay.innerText = importedDirName;
                }

                // 8. Đồng bộ bảng chọn chuỗi kịch bản nếu chế độ là mode3_chain
                const chainPanel = document.getElementById('batch-chain-selector-panel');
                if (chainPanel) {
                    if (importedTargetMode === 'mode3_chain') {
                        chainPanel.classList.remove('hidden');
                    } else {
                        chainPanel.classList.add('hidden');
                    }
                }

                const hasImagesInFile = data.localPCImageBase64Map && Object.keys(data.localPCImageBase64Map).length > 0;
                if (hasImagesInFile) {
                    localPCImageBase64Map = data.localPCImageBase64Map;
                    localPCImageMap = {};
                    Object.keys(localPCImageBase64Map).forEach(k => {
                        const img = new Image();
                        img.src = localPCImageBase64Map[k];
                        localPCImageMap[k] = img;
                    });
                } else if (!localPCImageBase64Map) {
                    localPCImageBase64Map = {};
                    localPCImageMap = {};
                }
                if (document.getElementById('pc-image-badge')) {
                    document.getElementById('pc-image-badge').innerText = `${Object.keys(localPCImageMap || {}).length} Ảnh Local`;
                }

                if (data.canvasBgBase64) {
                    canvasBgBase64 = data.canvasBgBase64;
                    const bgImg = new Image();
                    bgImg.src = data.canvasBgBase64;
                    bgImg.onload = () => { canvasBgImage = bgImg; drawParagraphCanvasFrame(); };
                }
                if (data.canvasBadgeBase64) {
                    canvasBadgeBase64 = data.canvasBadgeBase64;
                    const bdImg = new Image();
                    bdImg.src = data.canvasBadgeBase64;
                    bdImg.onload = () => { canvasBadgeImage = bdImg; drawParagraphCanvasFrame(); };
                }

                if (document.getElementById('master-loop-duration-input')) {
                    document.getElementById('master-loop-duration-input').value = masterTimelineDuration;
                }

                syncMediaInputsFromConfig();
                renderSavedParagraphProfilesDropdown();
                renderMailMergeFieldChips();
                renderTimelineLayersListUI();
                renderTimelineTracksUI();
                renderInspectorRibbon();
                updateTopicDropdown();
                renderDatasetTable();
                refreshBatchTopicsTable();
                syncInlineGridSettingsInputs();
                drawParagraphCanvasFrame();

                if (typeof renderBatchChainSelectorList === 'function') {
                    renderBatchChainSelectorList();
                }
                if (typeof updateBatchNamingPreview === 'function') {
                    updateBatchNamingPreview();
                }

                // 9. Khôi phục trạng thái tick chọn trong hàng đợi bài học nếu có
                if (batchCfg.queueSelections && Array.isArray(batchCfg.queueSelections) && typeof batchRenderQueue !== 'undefined') {
                    batchCfg.queueSelections.forEach(savedItem => {
                        const found = batchRenderQueue.find(q => q.queueId === savedItem.queueId || (q.stt === savedItem.stt && q.topic === savedItem.topic));
                        if (found && savedItem.selected !== undefined) {
                            found.selected = savedItem.selected;
                        }
                    });
                    if (typeof renderBatchTableUI === 'function') renderBatchTableUI();
                }

                await saveFullSystemState(false);
                if (data.exportMode === 'light' || !hasImagesInFile) {
                    showToast("Đã khôi phục kịch bản & thông số dự án thành công (Bản siêu nhẹ)! Giữ nguyên ảnh nếu đã có sẵn.");
                } else {
                    showToast("Đã khôi phục toàn bộ không gian làm việc & ảnh minh họa thành công!");
                }
            } else {
                showToast("File JSON không hợp lệ hoặc thiếu dữ liệu!", "error");
            }
        } catch(err) {
            console.error("Import workspace error", err);
            showToast("Lỗi khi đọc file sao lưu JSON!", "error");
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}
