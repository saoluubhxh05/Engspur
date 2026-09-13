/**
 * 1_state_config.js
 * Quản lý các biến trạng thái toàn cục và cấu hình kịch bản mẫu
 */

var APP_VERSION_INFO = {
    version: "V13.2",
    releaseDate: "13/09/2026",
    status: "Mới nhất & Ổn định",
    summary: "Bản nâng cấp V13.2: Đồng bộ toàn diện các thông số và tùy chọn của Tab 3 (Render Hàng Loạt) vào nút 'Xuất File' JSON và hệ thống lưu trữ IndexedDB, khôi phục nguyên vẹn 100% khi nhập lại.",
    categories: [
        {
            title: "Xuất & Nhập Toàn Diện Cấu Hình Tab 3 (Render Hàng Loạt)",
            icon: "file-cog",
            color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
            items: [
                "Đóng gói trọn vẹn Tab 3 vào file .JSON: Mẫu đặt tên file ({stt}, {script}, {topic}, {genre}, các thẻ {Cột_Excel}), Chế độ/Chuỗi render, Gom nhóm Chủ đề/Thể loại, Quy cách tách file và Danh sách chuỗi kịch bản đã chọn.",
                "Tự động khôi phục 100% khi Nhập File (.JSON): Tái lập toàn bộ trạng thái giao diện Tab 3, cập nhật danh sách chọn, hàng đợi render và dòng xem trước (preview) tên file tức thì.",
                "Đồng bộ lưu trữ IndexedDB (Lưu Máy & Tự động lưu): Giữ nguyên toàn bộ cấu hình Render Hàng Loạt qua các phiên làm việc và khi tải lại trình duyệt."
            ]
        },
        {
            title: "Tính Năng Đặt Tên File Thông Minh (Tab Render Hàng Loạt)",
            icon: "file-text",
            color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
            items: [
                "Bảng chọn thẻ (Tag Popover): Chèn nhanh các thẻ hệ thống {STT}, {Kịch bản}, {Chủ đề}, {Thể loại}, {Ngày} và toàn bộ các cột từ file Excel thực tế.",
                "Xem trước tên file thời gian thực: Dòng xem trước (Live Preview) hiển thị chính xác tên file mp4 được sinh ra khi gõ hoặc click chọn thẻ.",
                "Tối ưu không gian giao diện: Tích hợp gọn gàng ngay cạnh 'Chế độ/Chuỗi render', dọn dẹp sạch mã nguồn cũ và giúp các thành phần tự dãn đều tự nhiên.",
                "Tự động làm sạch tên file (Sanitize): Loại bỏ ký tự đặc biệt không hợp lệ trong hệ điều hành Windows/macOS/Linux."
            ]
        },
        {
            title: "Bộ Lọc Kịch Bản JSON & Gom Nhóm Thể Loại / Chủ Đề",
            icon: "filter",
            color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
            items: [
                "Quản lý kịch bản JSON: Tùy chọn Chế độ lọc Thể loại (Genre) hiển thị chuẩn '-- Tất cả thể loại trong Excel --' cùng toàn bộ các thể loại trích xuất từ Excel.",
                "Tự động đổi tiêu đề nhãn và bảng dữ liệu theo Thể loại hoặc Chủ đề tương ứng.",
                "Tab 3 Render Hàng Loạt: Gom nhóm xuất file 'Tạo file theo từng Chủ Đề' hoặc 'Tạo file theo từng Thể Loại' Excel với tag {theloai} / {genre}."
            ]
        },
        {
            title: "Động Cơ Render & Nền (Background Worker)",
            icon: "cpu",
            color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
            items: [
                "Tích hợp Web Worker nhịp xung ngầm độc lập (33ms) duy trì vòng lặp render mượt mà ngay cả khi chuyển sang tab khác hoặc thu nhỏ trình duyệt.",
                "Tích hợp Screen Wake Lock API tự động khóa màn hình không bị tắt hoặc rơi vào chế độ ngủ (Sleep) trong suốt tiến trình Batch Render.",
                "Cơ chế giải nhiệt Cool-down bắt buộc: Nghỉ 2.0s giữa pha Full & Clean, nghỉ 2.5s giữa các bài học để GPU/CPU xả tải và hạ nhiệt an toàn."
            ]
        },
        {
            title: "Giọng Đọc AI & Báo Cáo Xuất Bản",
            icon: "mic",
            color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
            items: [
                "Tích hợp 12 giọng đọc Microsoft Edge Neural Voice (Jenny, Guy, Aria,...) chuẩn ngữ điệu người bản xứ, hoàn toàn miễn phí và không giới hạn.",
                "Xuất file báo cáo Excel 2 Sheet chi tiết: Sheet 1 (Tổng quan video) và Sheet 2 (Mốc thời gian thực start/end từng câu drills chuẩn ms)."
            ]
        }
    ],
    history: [
        {
            version: "V13.2",
            date: "13/09/2026",
            highlight: "Tích hợp toàn diện các thông số và tùy chọn Tab 3 (Render Hàng Loạt) vào nút 'Xuất File' JSON và tự động khôi phục 100% khi Nhập File."
        },
        {
            version: "V13.1",
            date: "13/09/2026",
            highlight: "Nâng cấp tính năng 'Đặt tên file' thông minh với Bảng chọn thẻ Popover cho mọi trường Excel và xem trước tên file thực tế tức thì."
        },
        {
            version: "V13.0",
            date: "13/09/2026",
            highlight: "Chuẩn hóa bộ lọc Thể loại trong Quản lý kịch bản JSON với mục 'Tất cả thể loại trong Excel', đồng bộ danh sách thời gian thực."
        },
        {
            version: "V12.9",
            date: "13/09/2026",
            highlight: "Bổ sung bộ lọc Thể loại (Genre) & Chủ đề (Topic) và gom nhóm Batch Render theo Thể loại."
        },
        {
            version: "V12.8",
            date: "13/09/2026",
            highlight: "Động cơ Render ngầm chống gián đoạn khi chuyển tab, cơ chế giải nhiệt GPU/RAM tự động, và giọng đọc Edge Neural TTS."
        },
        {
            version: "V12.7",
            date: "05/09/2026",
            highlight: "Tích hợp Microsoft Edge Neural TTS và xuất file báo cáo Excel 2 Sheet chuẩn mili-giây."
        },
        {
            version: "V12.6",
            date: "28/08/2026",
            highlight: "Nâng cấp giao diện Batch Multi-Chain Pipeline, hỗ trợ xuất đồng thời Full MP4 + Clean MP4 + Audio WAV."
        },
        {
            version: "V12.0",
            date: "15/08/2026",
            highlight: "Khởi tạo kiến trúc Studio Timeline: Lưới đa cột, tự động ngắt dòng Smart Word-wrap, lưu trữ IndexedDB."
        }
    ]
};

var importedDatasets = [
    {
        sttMau: "1",
        genre: "Giao tiếp cơ bản",
        topic: "Describe Person",
        pattern: "She looks very [Adj] with her [Noun].",
        question: "What does she look like?",
        drills: [
            { stt: 1, cueWord: "smart / glasses", dichCueWord: "thông minh / cặp kính", drillText: "She looks very smart with her glasses.", ipa: "/ʃiː lʊks ˈvɛri smɑːt wɪð hɜː ˈɡlɑːsɪz/", dichDrillText: "Cô ấy trông rất thông minh với cặp kính.", imageName: "image001.jpg" },
            { stt: 2, cueWord: "kind / helps others", dichCueWord: "tốt bụng / giúp đỡ người khác", drillText: "She is a kind person who often helps others.", ipa: "/ʃiː ɪz ə kaɪnd ˈpɜːsn huː ˈɒfn hɛlps ˈʌðəz/", dichDrillText: "Cô ấy là một người tốt bụng, thường giúp đỡ người khác.", imageName: "image002.jpg" },
            { stt: 3, cueWord: "polite", dichCueWord: "lịch sự", drillText: "I like her because she is always polite.", ipa: "/aɪ laɪk hɜː bɪˈkɒz ʃiː ɪz ˈɔːlweɪz pəˈlaɪt/", dichDrillText: "Tôi thích cô ấy vì cô ấy luôn lịch sự.", imageName: "image003.jpg" }
        ]
    }
];

var excelColumnsList = [
    "STT", "STT Mẫu", "Thể loại", "Chủ đề", "Mẫu câu", "Từ gợi mở", "Câu hỏi cho mẫu câu", "Từ nối",
    "Substitution words", "Dịch Substitution words", "Substitution Drills",
    "Phiên âm IPA", "Dịch Substitution Drills", "Minh họa", "ten_file_dinh_kem"
];

var paragraphFilterMode = "topic"; // 'topic' | 'genre'
var paragraphSelectedTopic = "ALL";
var paragraphSelectedGenre = "ALL";
var batchGroupingMode = "topic"; // 'topic' (theo từng Chủ Đề) | 'genre' (theo từng Thể Loại)
var batchGenreFilter = "ALL";
var localPCImageMap = {}; 
var localPCImageBase64Map = {}; 
var canvasBgImage = null;
var canvasBgBase64 = null;
var canvasBadgeImage = null;
var canvasBadgeBase64 = null;

var pCanvas = null, pCtx = null;
var pCleanCanvas = null, pCleanCtx = null; // Canvas ngầm cho bản Clean (nền trắng, không logo)
var isParagraphRunning = false;
var isParagraphPaused = false;
var pRenderTimer = null;
var pCurrentSentenceIndex = 0;
var pRecordedChunks = [];
var pMediaRecorder = null;
var pCleanMediaRecorder = null;            // Bộ thu hình song song cho bản Clean
var pCleanRecordedChunks = [];
var pRenderedBlob = null;

// BIẾN LƯU VẾT ĐỂ KHÔNG BỊ ĐÈ KỊCH BẢN KHI CHUYỂN TAB HOẶC RENDER XONG
var studioSavedBackupState = null;

var masterTimelineDuration = 8.0;
var currentTimelinePlayTime = 0.0;
var isTimelinePlaying = false;
var timelinePlayAnimFrame = null;
var timelineLastTimestamp = 0;
var activePlayingAudioGroupIdx = -1;
var isSingleSentencePreview = false;

var timelineTrackDensity = 'normal'; // 'compact' | 'normal' | 'spacious'

var batchTopicsList = [];
var batchDirectoryHandle = null;
var batchDirectoryName = "";
var isBatchRunning = false;
var isBatchPaused = false;
var isStaticOutsideLoopRunning = false;
var currentBatchIndex = 0;
var batchTotalVideos = 0;
var batchRenderStartTime = 0;
var batchOverallTimer = null;
var batchCompletedReports = [];
var batchCurrentVideoStartTime = 0;
var batchSharedAudioTrack = null;
var batchExecutionMode = 'combined';
var batchCurrentSubPhase = 'full'; // 'full' | 'clean'
var batchAudioContext = null;
var batchAudioSourceNode = null;
var batchAudioProcessorNode = null;
var batchCurrentTopicPcmChunks = [];
var batchTopicScheduledAudioList = [];
var batchCurrentTopicRealSentenceLogs = [];
var currentBatchSentenceLog = null;
var currentSentenceStartWallTime = 0;
var currentSentenceTriggeredAudioGroups = new Set();
var batchAudioSampleRate = 44100;

var selectedFieldKeysList = ["Substitution words"];
var paragraphSelectedGroupIdx = 0;
var paragraphSelectedFieldKey = "Substitution words";
var selectedCustomTextTarget = null; // { gIdx, fIdx }

function getCustomTextDefaults(item) {
    if (!item) item = {};
    if (item.text === undefined) item.text = "Ghi chú tiêu đề ở đây";
    if (item.font === undefined) item.font = "Quicksand";
    if (item.size === undefined) item.size = 28;
    if (item.style === undefined) item.style = "bold";
    if (item.underline === undefined) item.underline = false;
    if (item.textCase === undefined) item.textCase = "none"; // 'none' | 'uppercase' | 'capitalize'
    if (item.color === undefined) item.color = "#ffffff";
    if (item.strokeEnabled === undefined) item.strokeEnabled = false;
    if (item.strokeColor === undefined) item.strokeColor = "#000000";
    if (item.strokeWidth === undefined) item.strokeWidth = 3;
    if (item.shadowEnabled === undefined) item.shadowEnabled = false;
    if (item.shadowColor === undefined) item.shadowColor = "rgba(0, 0, 0, 0.6)";
    if (item.shadowBlur === undefined) item.shadowBlur = 6;
    if (item.shadowOffsetX === undefined) item.shadowOffsetX = 3;
    if (item.shadowOffsetY === undefined) item.shadowOffsetY = 3;
    if (item.boxBgColor === undefined) item.boxBgColor = "#0f172a";
    if (item.highlightColor === undefined) item.highlightColor = "transparent";
    if (item.highlightPaddingX === undefined) item.highlightPaddingX = 8;
    if (item.highlightPaddingY === undefined) item.highlightPaddingY = 4;
    if (item.boxRadius === undefined) item.boxRadius = 16;
    if (item.boxPadding === undefined) item.boxPadding = 12;
    if (item.shrinkToFit === undefined) item.shrinkToFit = true;
    if (item.useCustomCoords === undefined) item.useCustomCoords = false;
    if (item.posX === undefined) item.posX = 120;
    if (item.posY === undefined) item.posY = 120;
    if (item.width === undefined) item.width = 520;
    if (item.height === undefined) item.height = 120;
    if (item.hAlign === undefined) item.hAlign = "left";
    if (item.lineSpacing === undefined) item.lineSpacing = 1.25;
    if (item.autoScale === undefined) item.autoScale = false;
    if (item.prefix === undefined) item.prefix = "";
    if (item.suffix === undefined) item.suffix = "";
    return item;
}

var isLeftCollapsed = false;
var isRightCollapsed = false;

var paragraphFieldStyles = {
    "Câu hỏi cho mẫu câu": { 
        type: 'text', font: 'Quicksand', style: 'bold', size: 30, color: '#0f172a', highlightColor: 'transparent', 
        highlightPaddingX: 8, highlightPaddingY: 4,
        hAlign: 'left', vAlign: 'middle', lineSpacing: 1.25, underline: false, 
        indentLeft: 0, indentRight: 0, spaceBefore: 0, spaceAfter: 0,
        boxBgColor: '#f1f5f9', boxRadius: 18, boxPadding: 14, textWrap: true, shrinkToFit: true 
    },
    "Mẫu câu": { 
        type: 'text', font: 'Quicksand', style: 'bold', size: 26, color: '#0f172a', highlightColor: 'transparent', 
        highlightPaddingX: 8, highlightPaddingY: 4,
        hAlign: 'left', vAlign: 'middle', lineSpacing: 1.25, underline: false, 
        indentLeft: 0, indentRight: 0, spaceBefore: 0, spaceAfter: 0,
        boxBgColor: '#ffedd5', boxRadius: 18, boxPadding: 12, textWrap: true, shrinkToFit: true 
    },
    "Substitution words": { 
        type: 'text', font: 'Quicksand', style: 'extrabold', size: 28, color: '#0f172a', highlightColor: 'transparent', 
        highlightPaddingX: 8, highlightPaddingY: 4,
        hAlign: 'left', vAlign: 'middle', lineSpacing: 1.25, underline: false, 
        indentLeft: 0, indentRight: 0, spaceBefore: 0, spaceAfter: 0,
        boxBgColor: '#fef08a', boxRadius: 18, boxPadding: 12, textWrap: true, shrinkToFit: true 
    },
    "Dịch Substitution words": { 
        type: 'text', font: 'Quicksand', style: 'normal', size: 20, color: '#475569', highlightColor: 'transparent', 
        highlightPaddingX: 8, highlightPaddingY: 4,
        hAlign: 'left', vAlign: 'middle', lineSpacing: 1.25, underline: false, 
        indentLeft: 0, indentRight: 0, spaceBefore: 0, spaceAfter: 0,
        boxBgColor: '#f8fafc', boxRadius: 14, boxPadding: 10, textWrap: true, shrinkToFit: true 
    },
    "Substitution Drills": { 
        type: 'text', font: 'Quicksand', style: 'extrabold', size: 28, color: '#0f172a', highlightColor: 'transparent', 
        highlightPaddingX: 8, highlightPaddingY: 4,
        hAlign: 'left', vAlign: 'middle', lineSpacing: 1.25, underline: false, 
        indentLeft: 0, indentRight: 0, spaceBefore: 0, spaceAfter: 0,
        boxBgColor: '#bbf7d0', boxRadius: 18, boxPadding: 12, textWrap: true, shrinkToFit: true 
    },
    "Phiên âm IPA": { 
        type: 'text', font: 'Quicksand', style: 'bold', size: 22, color: '#4f46e5', highlightColor: 'transparent', 
        highlightPaddingX: 8, highlightPaddingY: 4,
        hAlign: 'left', vAlign: 'middle', lineSpacing: 1.25, underline: false, 
        indentLeft: 0, indentRight: 0, spaceBefore: 0, spaceAfter: 0,
        boxBgColor: '#e0e7ff', boxRadius: 14, boxPadding: 8, textWrap: true, shrinkToFit: true 
    },
    "Dịch Substitution Drills": { 
        type: 'text', font: 'Quicksand', style: 'normal', size: 20, color: '#1e293b', highlightColor: 'transparent', 
        highlightPaddingX: 8, highlightPaddingY: 4,
        hAlign: 'left', vAlign: 'middle', lineSpacing: 1.25, underline: false, 
        indentLeft: 0, indentRight: 0, spaceBefore: 0, spaceAfter: 0,
        boxBgColor: '#f8fafc', boxRadius: 14, boxPadding: 10, textWrap: true, shrinkToFit: true 
    },
    "ten_file_dinh_kem": { 
        type: 'image', posX: 1300, posY: 100, width: 520, height: 880, boxRadius: 24, opacity: 100 
    }
};

var DEFAULT_TEMPLATES_JSON = {
    mode1: {
        id: "profile_template_timeline_reflex",
        name: "Mẫu 1: Phản Xạ 1 Câu (Làm mới màn hình)",
        date: "2026-09-06",
        presentationMode: "single",
        stackingFormula: "0",
        masterDuration: 8.0,
        gridMatrix: { 
            columnCount: 2, 
            columnWidths: [62, 34], 
            paddingTopPct: 8, 
            paddingBottomPct: 8, 
            paddingLeftPct: 4, 
            paddingRightPct: 4, 
            columnGapPct: 2, 
            showGridOverlay: false,
            autoRowSync: true 
        },
        groups: [
            {
                id: 1,
                name: "Lớp 1: Đề Bài & Câu Hỏi",
                trackColor: "#3b82f6",
                startTime: 0.0,
                duration: 3.5,
                snapEndToTotalDuration: false,
                isInsideLoop: true,
                targetColumn: 1,
                startRowOffset: 0,
                customHeightPx: 0,
                opacity: 100,
                offsetX: 0,
                offsetY: 0,
                frameAlignment: "left",
                fieldSpacing: 12,
                fields: [
                    { type: "field", key: "Câu hỏi cho mẫu câu" },
                    { type: "field", key: "Mẫu câu" },
                    { type: "field", key: "Substitution words" },
                    { type: "field", key: "Dịch Substitution words" },
                    { type: "tts", ttsSpeakFields: ["Câu hỏi cho mẫu câu"] },
                    { type: "countdown", seconds: 3, position: "top_right", size: "medium" }
                ]
            },
            {
                id: 2,
                name: "Lớp 2: Đáp Án Chuẩn & Giọng Đọc",
                trackColor: "#8b5cf6",
                startTime: 3.5,
                duration: 4.5,
                snapEndToTotalDuration: false,
                isInsideLoop: true,
                targetColumn: 1,
                startRowOffset: 1,
                customHeightPx: 0,
                opacity: 100,
                offsetX: 0,
                offsetY: 0,
                frameAlignment: "left",
                fieldSpacing: 12,
                fields: [
                    { type: "field", key: "Substitution Drills" },
                    { type: "field", key: "Phiên âm IPA" },
                    { type: "field", key: "Dịch Substitution Drills" },
                    { type: "tts", ttsSpeakFields: ["Substitution Drills"] }
                ]
            },
            {
                id: 3,
                name: "Lớp 3: Ảnh Minh Họa",
                trackColor: "#f59e0b",
                startTime: 0.0,
                duration: 8.0,
                snapEndToTotalDuration: true,
                isInsideLoop: true,
                targetColumn: 2,
                startRowOffset: 0,
                customHeightPx: 0,
                opacity: 100,
                offsetX: 0,
                offsetY: 0,
                frameAlignment: "center",
                fieldSpacing: 0,
                fields: [
                    { type: "field", key: "ten_file_dinh_kem" }
                ]
            }
        ]
    },
    mode2: {
        id: "profile_template_timeline_stack",
        name: "Mẫu 2: Xếp Tầng Nối Tiếp (Auto-Fit)",
        date: "2026-09-06",
        presentationMode: "stack",
        stackingFormula: "auto",
        masterDuration: 8.5,
        gridMatrix: { 
            columnCount: 3, 
            columnWidths: [36, 40, 20], 
            paddingTopPct: 8, 
            paddingBottomPct: 8, 
            paddingLeftPct: 3, 
            paddingRightPct: 3, 
            columnGapPct: 1.5, 
            showGridOverlay: false,
            autoRowSync: true 
        },
        groups: [
            {
                id: 1,
                name: "Cột 1: Gợi Ý & Dịch",
                trackColor: "#3b82f6",
                startTime: 0.0,
                duration: 4.0,
                snapEndToTotalDuration: false,
                isInsideLoop: true,
                targetColumn: 1,
                startRowOffset: 0,
                customHeightPx: 0,
                opacity: 100,
                offsetX: 0,
                offsetY: 0,
                frameAlignment: "left",
                fieldSpacing: 12,
                fields: [
                    { type: "field", key: "Substitution words" },
                    { type: "field", key: "Dịch Substitution words" },
                    { type: "countdown", seconds: 3, position: "top_right", size: "medium" }
                ]
            },
            {
                id: 2,
                name: "Cột 2: Câu Chuẩn & Giọng Đọc",
                trackColor: "#8b5cf6",
                startTime: 4.0,
                duration: 4.5,
                snapEndToTotalDuration: false,
                isInsideLoop: true,
                targetColumn: 2,
                startRowOffset: 0,
                customHeightPx: 0,
                opacity: 100,
                offsetX: 0,
                offsetY: 0,
                frameAlignment: "left",
                fieldSpacing: 12,
                fields: [
                    { type: "field", key: "Substitution Drills" },
                    { type: "field", key: "Dịch Substitution Drills" },
                    { type: "tts", ttsSpeakFields: ["Substitution Drills"] }
                ]
            },
            {
                id: 3,
                name: "Cột 3: Ảnh Minh Họa",
                trackColor: "#f59e0b",
                startTime: 0.0,
                duration: 8.5,
                snapEndToTotalDuration: true,
                isInsideLoop: true,
                targetColumn: 3,
                startRowOffset: 0,
                customHeightPx: 0,
                opacity: 100,
                offsetX: 0,
                offsetY: 0,
                frameAlignment: "center",
                fieldSpacing: 0,
                fields: [
                    { type: "field", key: "ten_file_dinh_kem" }
                ]
            }
        ]
    }
};

var savedParagraphProfiles = [];
var activeParagraphProfileId = "";
var paragraphGridConfig = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES_JSON.mode1));

var EDGE_NEURAL_VOICES = [
    { id: "edge:en-US-JennyNeural", name: "🇺🇸 Jenny (Nữ Mỹ - Truyền cảm, chuẩn nhất)", lang: "en-US" },
    { id: "edge:en-US-GuyNeural", name: "🇺🇸 Guy (Nam Mỹ - Trầm ấm, dứt khoát)", lang: "en-US" },
    { id: "edge:en-US-AriaNeural", name: "🇺🇸 Aria (Nữ Mỹ - Sư phạm, bài giảng)", lang: "en-US" },
    { id: "edge:en-US-ChristopherNeural", name: "🇺🇸 Christopher (Nam Mỹ - Tự nhiên, rõ chữ)", lang: "en-US" },
    { id: "edge:en-US-EricNeural", name: "🇺🇸 Eric (Nam Mỹ - Năng động, trẻ trung)", lang: "en-US" },
    { id: "edge:en-US-MichelleNeural", name: "🇺🇸 Michelle (Nữ Mỹ - Điềm tĩnh)", lang: "en-US" },
    { id: "edge:en-GB-SoniaNeural", name: "🇬🇧 Sonia (Nữ Anh - Chuẩn BBC/Oxford)", lang: "en-GB" },
    { id: "edge:en-GB-RyanNeural", name: "🇬🇧 Ryan (Nam Anh - Chuẩn BBC/Oxford)", lang: "en-GB" },
    { id: "edge:en-GB-LibbyNeural", name: "🇬🇧 Libby (Nữ Anh - Tự nhiên)", lang: "en-GB" },
    { id: "edge:en-AU-NatashaNeural", name: "🇦🇺 Natasha (Nữ Úc)", lang: "en-AU" },
    { id: "edge:en-AU-WilliamNeural", name: "🇦🇺 William (Nam Úc)", lang: "en-AU" },
    { id: "edge:en-CA-ClaraNeural", name: "🇨🇦 Clara (Nữ Canada)", lang: "en-CA" }
];

var sharedStudioAudioCtx = null;
var clientAudioBufferCache = new Map();
var currentPlayingAudioSource = null;
var batchStudioAudioDest = null;
var batchTopicScheduledAudioList = [];

var videoConfig = {
    aspectRatio: '16:9',
    resolution: '1080p',
    ttsVoice: 'edge:en-US-JennyNeural',
    ttsRate: 0.95,
    bgImageStyle: { widthPct: 100, heightPct: 100, posX: 0, posY: 0, opacity: 100 },
    badgeStyle: { widthPct: 15, heightPct: 10, posX: 82, posY: 4, opacity: 100, borderRadius: 20 }
};

var isPopoverDragging = false;
var popoverDragOffset = { x: 0, y: 0 };
var activePopoverData = { gIdx: 0, fIdx: 0, type: '' };
var activeDragState = null;

var batchSelectedChainProfiles = [];
var batchTimelineSentenceLogs = [];
var batchCustomScriptNamingMap = {};
var currentBatchChainIndex = 0;
var currentBatchTopicIndex = 0;
