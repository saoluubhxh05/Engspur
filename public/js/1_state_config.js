/**
 * 1_state_config.js
 * Quản lý các biến trạng thái toàn cục và cấu hình kịch bản mẫu
 */

var APP_VERSION_INFO = {
    version: "V13.7",
    releaseDate: "17/09/2026",
    status: "Mới nhất & Ổn định",
    summary: "Bản nâng cấp V13.7: Bổ sung cấu hình Lớp Trước Vòng Lặp (Intro) và Sau Vòng Lặp (Outro); Tính năng Gộp Nhiều Cột (Merge Columns / ColSpan) cho các lớp tiêu đề và banner trải dài; và Chế độ Trình Chiếu Mới: Hiện Tất Cả Dòng Cùng 1 Lúc ngay từ đầu.",
    categories: [
        {
            title: "Lớp Trước / Trong / Sau Vòng Lặp & Cố Định Toàn Video (V13.7)",
            icon: "repeat",
            color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
            items: [
                "Trước vòng lặp (Intro / Mở đầu): Lớp chỉ hiển thị ở đầu video trước khi các câu lặp bắt đầu (rất phù hợp cho tiêu đề bài học, lời chào, mục tiêu bài học).",
                "Trong vòng lặp (Drills / Từng câu): Lớp nội dung lặp lại và cập nhật theo từng câu trong file bài tập Excel.",
                "Sau vòng lặp (Outro / Kết bài): Lớp chỉ xuất hiện sau khi tất cả các câu bài tập kết thúc (lời cảm ơn, kêu gọi đăng ký, tóm tắt).",
                "Cố định toàn video (Xuyên suốt): Lớp hiển thị liên tục xuyên suốt từ đầu tới cuối video (Khung viền, Header, Logo, Nhạc nền BGM)."
            ]
        },
        {
            title: "Tính Năng Lớp Gộp Nhiều Cột (Merge Columns / ColSpan) (V13.7)",
            icon: "columns",
            color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
            items: [
                "Tùy chọn Số cột gộp (ColSpan): Cho phép chọn lớp đối tượng trải rộng qua 1 cột, 2 cột, 3 cột hoặc 'Tràn tất cả các cột' trên lưới.",
                "Tự động tính toán bề rộng: Canvas renderer tự động gộp các cột kế tiếp kèm khoảng cách giữa các cột (Column Gap), giúp tiêu đề, bảng hoặc ảnh minh họa dàn trang hoàn hảo.",
                "Tương thích tuyệt đối: Áp dụng mượt mà cho mọi loại thẻ (Trường Excel, Chữ tùy chọn, Ảnh, Âm thanh, Tiến độ, Đếm ngược)."
            ]
        },
        {
            title: "Chế Độ Trình Chiếu: Hiện Tất Cả Dòng Cùng 1 Lúc (V13.7)",
            icon: "layout-grid",
            color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
            items: [
                "Hiển thị toàn bộ câu ngay từ đầu: Bên cạnh '1 Câu / Làm mới' và 'Xếp tầng', chế độ mới vẽ đầy đủ tất cả các dòng bài học ngay từ khung hình đầu tiên.",
                "Tự động canh đều dòng: Kết hợp mượt mà với khoảng cách đệm (Gap px) giữa các dòng để tạo bố cục bài giảng hoàn chỉnh."
            ]
        },
        {
            title: "Khắc Phục & Tối Ưu Âm Thanh: Nhạc Tải Lên & Nhạc Nền Xuyên Suốt (V13.6)",
            icon: "music",
            color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
            items: [
                "Mở khóa AudioContext tức thì: Tự động kích hoạt luồng âm thanh ngay khi người dùng bấm 'Chạy Thử Toàn Bộ (Preview)' hoặc 'Play thử câu', khắc phục triệt để lỗi trình duyệt chặn âm thanh ngầm.",
                "Giải mã nhị phân siêu tốc (Direct Binary Buffer): Tối ưu giải mã file MP3/WAV tải từ máy tính trực tiếp từ luồng nhị phân và native fetch ArrayBuffer, loại bỏ hoàn toàn độ trễ và lỗi treo bộ nhớ của cơ chế cũ.",
                "Nhạc nền liên tục Ngoài Vòng Lặp (Continuous BGM): Thẻ Âm Thanh đặt tại lớp 'Ngoài vòng lặp (Cố định toàn video)' tự động phát liên tục êm ái xuyên suốt toàn bộ các câu bài học mà không bị ngắt quãng hay lặp chồng.",
                "Tự động nạp trước bộ đệm (Preload Audio): Toàn bộ file âm thanh riêng được nạp sẵn vào bộ nhớ ngay khi tải lên, đảm bảo khi chạy thử hoặc Xuất video Batch Render âm thanh khớp chuẩn 100% không độ trễ."
            ]
        },
        {
            title: "Nâng Cấp Thẻ Tiến Độ: Tọa Độ Pixel & Màu Sắc Khung (V13.5)",
            icon: "sliders",
            color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
            items: [
                "Tọa độ tự do Pixel (X, Y px): Cho phép nhập chính xác pixel trên khung hình 1920x1080 kèm thanh trượt kép và 4 nút căn vị trí nhanh (Trên-Trái, Giữa-Trên, Trên-Phải, Đáy-Giữa).",
                "Kích thước khung theo px: Tùy chỉnh Chiều Rộng (Width px) và Chiều Cao (Height px) với cơ chế co giãn thông minh (0 = Tự động co theo chữ).",
                "Tùy biến khung chứa & viền: Điều chỉnh Màu nền khung kèm Độ mờ đục (Opacity), Màu viền khung, Độ dày viền (0 - 8px), Bo góc hộp (0 - 40px) và Tùy chọn Đổ bóng mờ nổi khối (Box Shadow).",
                "Độ dày thanh bar & font chữ: Tinh chỉnh độ dày thanh bar chạy (2 - 30px), màu thanh chạy & màu rãnh nền bar, kích cỡ font chữ đếm và tùy chọn độ đậm (Bold 700 / Black 900)."
            ]
        },
        {
            title: "Tối Ưu Âm Lượng & Né Tiếng SFX (Smart Audio Ducking)",
            icon: "volume-2",
            color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
            items: [
                "Điều chỉnh âm lượng thời gian thực (Live Volume): Kéo thanh trượt âm lượng (0 - 100%) nghe thấy độ lớn âm thanh đổi ngay lập tức trên luồng đang phát mà không bị gián đoạn hay mất nét giao diện.",
                "Cơ chế Né Tiếng thông minh (Audio Ducking): Tự động liên kết mượt mà với Web Audio Gain Node. Khi Giọng đọc AI (TTS) cất tiếng, âm lượng SFX tự động lùi xuống 20% và tự động phục hồi về 100% khi AI nói xong.",
                "Nút nghe thử Né Tiếng chuyên dụng: Bấm 'Nghe thử Né Tiếng (Ducking) với Giọng đọc AI' để trải nghiệm ngay lập tức cách SFX tự động nhường lời cho giọng đọc.",
                "Bổ sung nút Dừng phát (Play/Stop toggle): Cho phép dừng âm thanh nghe thử bất cứ lúc nào, đặc biệt tiện lợi khi tải lên file nhạc hoặc hiệu ứng âm thanh dài."
            ]
        },
        {
            title: "Thẻ Tiến Độ (Progress Bar & Bộ Đếm Câu Hỏi)",
            icon: "sliders",
            color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
            items: [
                "3 Kiểu hiển thị linh hoạt: Cả hai (Thanh Bar + Chữ đếm câu), Chỉ Thanh Bar đồ họa, hoặc Chỉ Huy hiệu chữ đếm số ('Câu 3/15').",
                "Tùy biến định dạng linh hoạt: Hỗ trợ mẫu chữ 'Câu {STT}/{Tổng_câu}', 'Question {STT}/{Tổng_câu}', '{STT} / {Tổng_câu}' tự động đếm tổng số câu trong file Excel.",
                "Căn nhanh vị trí: Sát mép trên cùng, Sát đáy màn hình, Góc trên phải, Góc trên trái, Dưới đáy giữa hoặc tọa độ tự do X/Y.",
                "Tùy biến thẩm mỹ: Độ dày thanh bar (4px, 8px, 12px, 16px), màu sắc thanh tiến trình, màu nền bar, cỡ chữ, màu chữ và khung viền mờ bo tròn (Pill background)."
            ]
        },
        {
            title: "Thẻ Âm Thanh (Hiệu Ứng SFX & Nhạc Nền)",
            icon: "music",
            color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
            items: [
                "Kho âm thanh hiệu ứng có sẵn (Built-in SFX): Tích hợp sẵn tiếng Ting Ting trả lời đúng, Tích tắc đếm ngược, Whoosh xuất hiện, Chuông Bell và Chime khen ngợi tạo bằng Web Audio API chạy trực tiếp không cần mạng.",
                "Hỗ trợ tải file âm thanh riêng (.mp3, .wav) từ máy tính, xem tên file và nghe thử tức thì ngay tại bảng điều khiển.",
                "Điều chỉnh âm lượng (0 - 100%) và tính năng Tự Động Né Tiếng (Audio Ducking) tự hạ âm lượng khi Giọng đọc AI (TTS) cất tiếng.",
                "Đồng bộ mốc phát chuẩn xác theo Timeline và tự động lưu vào luồng thu âm MP4/WAV chuẩn xác từng mili-giây."
            ]
        },
        {
            title: "Xuất & Nhập Toàn Diện Cấu Hình Tab 3 (Render Hàng Loạt)",
            icon: "file-cog",
            color: "text-teal-400 bg-teal-500/10 border-teal-500/30",
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
            version: "V13.3",
            date: "16/09/2026",
            highlight: "Tích hợp Thẻ Tiến Độ (Progress Bar & Đếm câu linh hoạt) và Thẻ Âm Thanh (Hiệu ứng SFX có sẵn, tải file âm thanh, né tiếng Audio Ducking)."
        },
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
var outsideLoopTriggeredAudioGroups = new Set();
var runtimeAudioBufferCache = new Map();
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
