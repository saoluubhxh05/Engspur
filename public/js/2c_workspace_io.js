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
    const bdSt = videoConfig.badgeStyle || { widthPct: 15, heightPct: 10, posX: 82, posY: 4, opacity: 100, borderRadius: 20 };

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
        "STT", "STT Mẫu", "Chủ đề", "Mẫu câu", "Từ gợi mở", "Câu hỏi cho mẫu câu", "Từ nối",
        "Substitution words", "Dịch Substitution words", "Substitution Drills",
        "Phiên âm IPA", "Dịch Substitution Drills", "Minh họa", "ten_file_dinh_kem"
    ];

    paragraphSelectedTopic = "ALL";
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
 * Xuất toàn bộ không gian làm việc (Toàn bộ Excel, Ảnh Base64, Kịch bản, Thông số) ra 1 file JSON duy nhất
 */
function exportFullWorkspaceToJSON() {
    const backupData = {
        app: "EngSpur Auto Video Studio",
        version: "1.0",
        exportDate: new Date().toISOString(),
        importedDatasets,
        excelColumnsList,
        videoConfig,
        savedParagraphProfiles,
        activeParagraphProfileId,
        paragraphGridConfig,
        paragraphFieldStyles,
        localPCImageBase64Map,
        canvasBgBase64,
        canvasBadgeBase64,
        paragraphSelectedTopic,
        masterTimelineDuration
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const nowStr = new Date().toISOString().slice(0, 10);
    const filename = `EngSpur_Full_Workspace_Backup_${nowStr}.json`;
    downloadBlobFallback(blob, filename);
    showToast("Đã xuất gói dự án hoàn chỉnh (.JSON)! Bạn có thể cất file này trên máy.");
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
                if (data.importedDatasets) importedDatasets = data.importedDatasets;
                if (data.excelColumnsList) excelColumnsList = data.excelColumnsList;
                if (data.videoConfig) videoConfig = { ...videoConfig, ...data.videoConfig };
                if (data.savedParagraphProfiles) savedParagraphProfiles = data.savedParagraphProfiles;
                if (data.activeParagraphProfileId) activeParagraphProfileId = data.activeParagraphProfileId;
                if (data.paragraphGridConfig) paragraphGridConfig = data.paragraphGridConfig;
                if (data.paragraphFieldStyles) paragraphFieldStyles = data.paragraphFieldStyles;
                if (data.paragraphSelectedTopic) paragraphSelectedTopic = data.paragraphSelectedTopic;
                if (data.masterTimelineDuration) masterTimelineDuration = data.masterTimelineDuration;

                localPCImageBase64Map = data.localPCImageBase64Map || {};
                localPCImageMap = {};
                Object.keys(localPCImageBase64Map).forEach(k => {
                    const img = new Image();
                    img.src = localPCImageBase64Map[k];
                    localPCImageMap[k] = img;
                });
                if (document.getElementById('pc-image-badge')) {
                    document.getElementById('pc-image-badge').innerText = `${Object.keys(localPCImageMap).length} Ảnh Local`;
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

                await saveFullSystemState(false);
                showToast("Đã khôi phục toàn bộ không gian làm việc từ file JSON thành công!");
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
