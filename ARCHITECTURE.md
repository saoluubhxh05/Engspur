# BẢN ĐỒ KIẾN TRÚC DỰ ÁN ENGSPUR AUTO VIDEO STUDIO

## 1. TỔNG QUAN HỆ THỐNG
Dự án tạo video tự động từ file Excel & ảnh, hỗ trợ xem trước trên Timeline, tổng hợp giọng nói TTS AI, xuất video MP4 và render hàng loạt (Batch Multi-Chain Pipeline) kèm xuất audio WAV và báo cáo Excel 2 sheet chuẩn từng mili-giây.

Ứng dụng tuân thủ mô hình thuần trình duyệt (Vanilla JS, HTML5 Canvas, Web Audio API, IndexedDB, File System Access API), không sử dụng framework nặng hay npm bundler phức tạp.

---

## 2. CẤU TRÚC THƯ MỤC & PHÂN BỔ CHUYÊN MÔN CÁC FILE

```
/
├── index.html                  # Giao diện chính, CDN và các thẻ <script> theo thứ tự phụ thuộc
├── styles.css                  # Phông chữ Google Fonts, thanh cuộn, hiệu ứng kim phát Timeline
├── ARCHITECTURE.md             # Bản đồ kiến trúc chi tiết từng file mã nguồn
├── metadata.json               # Cấu hình ứng dụng
└── js/ (và public/js/)
    ├── 1_state_config.js       # Biến trạng thái toàn cục, cấu hình grid, phông chữ, mẫu kịch bản
    ├── 2a_storage_idb.js       # Lưu trữ IndexedDB, tự động lưu (Auto-Save), khôi phục trạng thái
    ├── 2b_profiles_manager.js  # Quản lý kịch bản (Profiles CRUD), nạp mẫu mặc định, xuất/nhập JSON
    ├── 2c_workspace_io.js      # Xuất/nhập toàn bộ Workspace (dữ liệu + ảnh + kịch bản), tải mẫu demo
    ├── 3_excel_assets.js       # Đọc file Excel (.xlsx), phân loại chủ đề, quản lý thư viện ảnh cục bộ
    ├── 4a_canvas_engine.js     # Lõi đồ họa Canvas 1920x1080, context, cấu trúc render khung hình và hit-boxes
    ├── 4b_canvas_text.js       # Động cơ chữ: Word-Wrap thông minh, tự co dãn hộp thẻ auto-flow, chữ tự do
    ├── 4c_canvas_overlays.js   # Các lớp phủ đặc biệt: đồng hồ đếm ngược, thanh tiến độ, khung ảnh đính kèm
    ├── 5a_timeline_ui.js       # Giao diện Timeline: vẽ đường ray, waveform, ruler, mật độ, kéo thả tay nắm
    ├── 5b_timeline_engine.js   # Động cơ Timeline: vòng lặp playback, Web Worker clock, đồng bộ TTS, preview
    ├── 6a_tts_voice.js         # Giọng đọc AI Web Speech & Edge TTS, đo thời lượng ray, xuất Audio Master WAV
    ├── 6b_sfx_audio.js         # Tổng hợp âm thanh SFX Web Audio (tích tắc, chuông báo) và cơ chế né tiếng Audio Ducking
    ├── 7a_inspector_popover.js # Hộp thoại Popover nổi cấu hình thẻ TTS đọc AI, countdown, chữ tự do
    ├── 7b_inspector_ribbon.js  # Ribbon định dạng phông, cỡ chữ, màu sắc, vệt highlight, bo góc, mail-merge chips
    ├── 7b2_inspector_countdown.js # Ribbon cấu hình chuyên sâu Đồng hồ đếm ngược, Thẻ tiến độ và Thẻ SFX
    ├── 7c_inspector_layers.js  # Quản lý danh sách lớp (Layers), thêm/sắp xếp/xóa lớp và điều khiển thẻ trong lớp
    ├── 7d_inspector_grid.js    # Cấu hình ma trận lưới Grid Matrix (1-4 cột), tỉ lệ cột, lề đệm và khóa cột Excel
    ├── 8a_batch_queue.js       # Hàng đợi Batch Render: định dạng tên file, chuỗi kịch bản, chọn thư mục
    ├── 8b_batch_runner.js      # Động cơ Batch: MediaRecorder kép (Full + Clean), ghi âm PCM/WAV, wake lock
    ├── 8c_batch_exporter.js    # Xuất báo cáo Excel 2 Sheet (Tổng quan + Timeline ms), File Picker API lưu file
    ├── 9_offline_render.js     # Chế độ Render Siêu Tốc: đồng hồ ảo 30fps + WebCodecs VideoEncoder + OfflineAudioContext
    └── app.js                  # Khởi động ứng dụng (DOMContentLoaded), điều hướng tab, phím tắt, thông báo
```

---

## 3. CHI TIẾT NHIỆM VỤ TỪNG FILE MÃ NGUỒN

### 1. `index.html`
- Chứa toàn bộ cây DOM giao diện: Thanh công cụ Header, Cột điều khiển trái (5 Sub-tabs), Màn hình Canvas 16:9 trung tâm, Trục Timeline phía dưới, Cột bên phải, và Màn hình Render Hàng Loạt (Batch Multi-Chain View).
- Nạp CDN thư viện: Tailwind CSS, Lucide Icons, SheetJS XLSX.
- Nạp 21 tệp JavaScript theo đúng thứ tự phân tầng kiến trúc từ lõi State đến Động cơ đồ họa, Âm thanh, UI và Khởi tạo.

### 2. `styles.css` (và `css/styles.css`, `public/styles.css`)
- Nạp phông chữ quốc tế qua Google Fonts (@import Quicksand, Plus Jakarta Sans, Nunito, Inter, Courier Prime).
- CSS tùy biến thanh cuộn mảnh (custom scrollbar), kim phát Timeline `.playhead-needle`, các hiệu ứng active button.

### 3. `js/1_state_config.js`
- **Chuyên môn:** Khai báo cấu trúc dữ liệu và biến trạng thái toàn cục.
- **Biến chủ chốt:**
  - `APP_VERSION_INFO`: Lưu trữ số hiệu phiên bản hiện tại (V14.6), ngày phát hành, trạng thái, danh mục tính năng cập nhật và lịch sử các bản phát hành trước.
  - `importedDatasets`: Mảng chứa danh sách câu, mẫu câu, từ thay thế (drills) trích xuất từ Excel.
  - `paragraphGridConfig`: Cấu hình bố cục lưới Canvas (ma trận cột, danh sách các nhóm/lớp Groups, lề đệm).
  - `paragraphFieldStyles`: Từ điển cấu hình phông, cỡ, màu sắc, kiểu highlight, thụt lề cho từng trường.
  - `DEFAULT_TEMPLATES_JSON`: Mẫu kịch bản có sẵn (Mode 1: Phản xạ 1:1, Mode 2: Xếp tầng nối tiếp).
  - `videoConfig`: Cấu hình tỷ lệ video, giọng đọc AI mặc định, ảnh nền, logo.

### 4. Nhóm Lưu Trữ & Hồ Sơ (`js/2a_`, `js/2b_`, `js/2c_`)
- **`2a_storage_idb.js`:**
  - Khởi tạo cơ sở dữ liệu IndexedDB `EngSpurParagraphFactoryDB` (ObjectStore: `app_state`).
  - `saveFullSystemState()`, `loadFullSystemState()`: Lưu trữ và khôi phục toàn bộ phiên làm việc.
  - `triggerAutoSave()`, `updateAutoSaveIndicator()`: Cơ chế tự động lưu ngầm chống mất dữ liệu sau mỗi thao tác.
- **`2b_profiles_manager.js`:**
  - Quản lý danh sách kịch bản `savedParagraphProfiles`: Thêm, nhân bản, sửa tên, xóa, đổi thứ tự.
  - `applyParagraphProfile()`: Áp dụng kịch bản vào không gian thiết kế mà không làm mất liên kết dữ liệu Excel.
  - `exportCurrentProfileToJSON()`, `handleImportProfileJSON()`: Xuất/nhập file mẫu kịch bản định dạng JSON.
  - `loadPresetDesignMode()`: Nạp nhanh các mẫu thiết kế chuẩn.
- **`2c_workspace_io.js`:**
  - `exportCompleteWorkspaceProject()`: Đóng gói toàn bộ dự án (Dữ liệu Excel + Kho ảnh Base64 + Mọi kịch bản) thành 1 file JSON duy nhất để sao lưu hoặc chuyển đổi máy tính.
  - `importCompleteWorkspaceProject()`: Khôi phục 100% môi trường làm việc từ file dự án JSON.
  - `loadDemoDataset()`: Nạp dữ liệu mẫu 5 chủ đề tiếng Anh với đầy đủ câu hỏi, phiên âm IPA, bản dịch để trải nghiệm ngay.

### 5. `js/3_excel_assets.js`
- **Chuyên môn:** Phân tích dữ liệu bảng tính Excel và quản lý kho ảnh đính kèm.
- `handleExcelUpload()`: Sử dụng SheetJS đọc file `.xlsx` / `.xls`, trích xuất các cột thông tin.
- `processImportedExcelRows()`: Bóc tách danh sách cột, tự động nhận diện các trường ảnh và văn bản.
- `handleLocalImagesUpload()`: Đọc hàng loạt file ảnh từ thư mục máy tính, chuyển sang Base64 lưu vào `localPCImageMap`.
- `updateTopicDropdown()`, `onParagraphTopicSelectChange()`: Quản lý danh sách chủ đề bài học và lọc câu.

### 6. Nhóm Động Cơ Đồ Họa Canvas (`js/4a_`, `js/4b_`, `js/4c_`)
- **`4a_canvas_engine.js`:**
  - `drawParagraphCanvasFrame()`: Vẽ khung hình Canvas chính và đồng bộ sang Mini Live Monitor.
  - `renderSingleFrameToContext()`: Quản lý vòng lặp vẽ khung hình, tỷ lệ chia cột, ảnh nền, logo và phân bổ tọa độ các lớp.
  - `ensureCanvasClickListener()`: Quản lý sự kiện nhấp chuột chọn đối tượng trực tiếp trên mặt Canvas (Hit-testing).
- **`4b_canvas_text.js`:**
  - `calculateTextLines()`: Thuật toán ngắt dòng thông minh (Smart Word-Wrap) chuẩn từng pixel font.
  - `drawAutoFlowCardBox()`: Tự co giãn hộp thẻ theo nội dung (`shrinkToFit`), đổ bóng, bo góc, vẽ vệt nền Highlight tùy chỉnh đệm viền.
  - `drawCustomTextCardBox()`: Kết xuất thẻ chữ tự do với tiền tố, hậu tố, chữ hoa/thường, bóng đổ nổi khối.
- **`4c_canvas_overlays.js`:**
  - `drawCountdownOverlay()`: Vẽ đồng hồ đếm ngược với đĩa chống lóa than chì, chữ số Solid 100%, viền nét tương phản và hiệu ứng chuyển màu sống động.
  - `drawProgressTrackerOverlay()`: Vẽ thanh tiến độ hoặc chỉ số phần trăm hoàn thành bài học.
  - `drawRect916PhotoFrame()`: Vẽ khung ảnh đính kèm bo góc mượt mà, hiệu ứng mờ đục và icon dự phòng.

### 7. Nhóm Trục Thời Gian & Phát Video (`js/5a_`, `js/5b_`)
- **`5a_timeline_ui.js`:**
  - `renderTimelineTracksUI()`: Vẽ trực quan các dải đường ray (Tracks) biểu thị thời gian xuất hiện của từng lớp.
  - `setTimelineTrackDensity()`: Chuyển đổi 3 mức mật độ hiển thị ray (Mỏng 20px, Chuẩn 26px, Rộng 34px) đảm bảo 100% không bị cuộn dọc màn hình.
  - `onTimelineBarMouseDown()`, `onTimelineBarMouseMove()`: Xử lý kéo thả di chuyển ray hoặc co kéo thời lượng xuất hiện.
  - `drawTimelineWaveformPreview()`: Vẽ dạng sóng âm thanh trực quan phía dưới từng ray audio.
  - `renderTimelineRuler()`: Vẽ thước đo vạch thời gian (ruler ticks) theo từng giây.
- **`5b_timeline_engine.js`:**
  - `startTimelinePlayback()`, `toggleTimelinePlayback()`: Vòng lặp phát câu hiện tại với Web Worker Clock độ chính xác cao.
  - `seekTimeline()`: Tua đến mốc thời gian bất kỳ trên trục Timeline và cập nhật Canvas tức thì.
  - `runUnifiedSentenceSequence()`: Trình điều phối chạy nối tiếp các câu theo thứ tự, tự động kích hoạt giọng đọc AI và chuyển câu.
  - `togglePreviewAllPlayback()`: Chế độ chạy thử liên tục toàn bộ kịch bản.

### 8. Nhóm Âm Thanh & Giọng Đọc AI (`js/6a_`, `js/6b_`)
- **`6a_tts_voice.js`:**
  - `speakTTS()`, `populateVoiceList()`: Tích hợp Web Speech API trình duyệt và Edge TTS service.
  - `fetchEdgeTtsAudioBuffer()`: Tải và giải mã âm thanh trước vào bộ nhớ đệm giúp phát với độ trễ 0ms.
  - `autoRecalculateAudioLayersDuration()`: Tự động đo độ dài đoạn văn bản để khóa thời lượng ray Timeline vừa khít với giọng nói.
  - `createMasterWavBlobFromSentenceAudios()`, `createWavHeader()`: Tổng hợp và đóng gói file âm thanh Master WAV chuẩn 44.1kHz Stereo 16-bit.
- **`6b_sfx_audio.js`:**
  - `generateSynthesizedSfxBuffer()`: Tổng hợp tiếng tích tắc cơ học, bíp điện tử, tiếng vút (whoosh), chuông báo hoàn toàn offline qua Web Audio API.
  - `duckAllActiveSfx()`: Cơ chế né tiếng thông minh (Audio Ducking) tự động hạ âm lượng SFX khi giọng đọc AI cất tiếng.
  - `playSfxItem()`, `testPlayAudioSfxWithDucking()`: Phát và kiểm tra hiệu ứng âm thanh SFX tức thì.

### 9. Nhóm Thanh Công Cụ & Tùy Chỉnh (`js/7a_`, `js/7b_`, `js/7b2_`, `js/7c_`, `js/7d_`)
- **`7a_inspector_popover.js`:**
  - `openFloatingCardPopover()`: Hộp thoại nổi nhanh khi nhấp trực tiếp vào chip thành phần trên Timeline.
- **`7b_inspector_ribbon.js`:**
  - `renderInspectorRibbon()`: Bảng điều khiển định dạng kiểu dáng văn bản, kích thước vệt highlight, lề đệm, bo góc và khung ảnh.
  - `applyPresetToSelectedFields()`: Áp dụng nhanh các bộ phối màu thị giác (Vàng Pill, Kem Pastel, Tím IPA, Ghi Dịch).
  - `renderMailMergeFieldChips()`: Hiển thị thanh thẻ trường dữ liệu Excel để thêm vào lớp thiết kế.
- **`7b2_inspector_countdown.js`:**
  - `renderCountdownInspectorRibbon()`: Cấu hình chuyên sâu Đồng hồ đếm ngược (thời gian, giao diện preset, màu số, tọa độ pixel, âm thanh tích tắc).
  - `renderProgressTrackerInspectorRibbon()`: Bảng điều khiển thanh tiến độ bài tập.
  - `renderAudioSfxInspectorRibbon()`: Bảng điều khiển thẻ âm thanh SFX và nhạc nền.
- **`7c_inspector_layers.js`:**
  - `renderTimelineLayersListUI()`: Danh sách các lớp (Layers), thêm lớp mới, nhân bản, ẩn/hiện, sắp xếp thứ tự và gắn chip dữ liệu.
  - `addSpecialObjectComponent()`: Chèn nhanh các đối tượng đặc biệt (Custom Text, Giọng đọc TTS, Đồng hồ, SFX).
- **`7d_inspector_grid.js`:**
  - `syncInlineGridSettingsInputs()`: Thiết lập ma trận lưới Grid Matrix (1 - 4 cột), tỉ lệ độ rộng các cột (%), đệm lề 4 chiều.
  - `renderColumnLockControls()`: Khóa đồng bộ hàng Excel song song hoặc để cột ở chế độ căn giữa tự do.

### 10. Nhóm Render Hàng Loạt & Báo Cáo (`js/8a_`, `js/8b_`, `js/8c_`)
- **`8a_batch_queue.js`:**
  - `buildBatchQueueList()`: Xây dựng danh sách hàng đợi render tự động từ ma trận [Kịch bản] x [Chủ đề bài học].
  - `resetBatchNamingPattern()`: Quy tắc đặt tên file linh hoạt (`{stt}-[{script}]-[{topic}]`).
  - `renderBatchTableUI()`: Bảng quản lý tiến độ từng bài học, hỗ trợ tick chọn riêng lẻ từng dòng để render.
  - `pickBatchDirectoryHandle()`: Tích hợp File System Access API cho phép người dùng chỉ định thư mục lưu video trực tiếp vào ổ cứng.
- **`8b_batch_runner.js`:**
  - `startBatchRenderPipeline()`: Khởi chạy tiến trình kết xuất video hàng loạt tự động với 3 chế độ:
    1. *Render MP4 Nhanh*: Xuất 01 file MP4 tích hợp sẵn audio.
    2. *Tách Audio WAV*: Xuất 01 file MP4 + 01 file WAV riêng biệt đồng bộ tuyệt đối.
    3. *Render Kép*: Xuất trọn bộ 3 file (Full.mp4, Clean.mp4 nền trắng không logo, và Audio.wav).
  - Sử dụng MediaRecorder ghi hình Canvas và luồng âm thanh PCM không nén 44.1kHz.
  - `requestScreenWakeLock()`: Khóa màn hình không bị tắt trong suốt quá trình render.
  - **Cơ chế bảo vệ phần cứng Cool-down (Giải nhiệt GPU/RAM):** Tự động nghỉ giải nhiệt 2 giây giữa pha Full và Clean, nghỉ 2.5 giây giữa các bài học, tối ưu bitrate và giải phóng buffer RAM tức thì giúp chống quá nhiệt phần cứng và sập nguồn máy tính.
- **`8c_batch_exporter.js`:**
  - `exportBatchExcelReport()`: Tự động trích xuất file báo cáo Excel 2 Sheet chi tiết:
    - *Sheet 1 (Tổng Quan Video)*: STT, Kịch bản, Chủ đề, Tên file, Thời lượng ms/giây, Dung lượng MB.
    - *Sheet 2 (Chi Tiết Timeline)*: Chi tiết từng câu luyện tập (drills), từ gợi mở (cue), thời điểm bắt đầu (start ms), kết thúc (end ms) chuẩn xác theo đồng hồ thực tế.
  - `triggerFilePickerSave()`: Hỗ trợ lưu video đơn lẻ qua File Picker dialog.

### 11. `js/9_offline_render.js`
- **Chuyên môn:** Chế độ Render Siêu Tốc (Offline Turbo Render) sử dụng đồng hồ ảo + WebCodecs.
- Tự động thay thế `performance.now()`, `startStudioRenderClock()` và `MediaRecorder` bằng đồng hồ ảo 30 fps và `VideoEncoder` + ghép container MP4 (`mp4-muxer`).
- Sử dụng AudioContext ghi sổ và `OfflineAudioContext` để trộn âm thanh TTS/SFX chính xác theo giờ ảo, loa ngoài không phát tiếng, kết xuất video tốc độ cao không cần chờ thời gian thực.

### 12. `js/app.js`
- **Chuyên môn:** Điểm khởi động ứng dụng và quản lý tương tác cấp hệ thống.
- Lắng nghe `DOMContentLoaded`, khởi tạo Canvas, render danh sách phông chữ, nạp trạng thái từ IndexedDB.
- `openVersionChangelogModal()`, `closeVersionChangelogModal()`: Quản lý hộp thoại hiển thị số hiệu phiên bản và nhật ký chi tiết các tính năng mới cập nhật.
- `switchLeftSubTab()`: Chuyển đổi các tab bên cột trái (Kịch bản, Dữ liệu, Lớp & Grid, Hiệu ứng, Định dạng).
- `showToast()`: Hệ thống thông báo trạng thái góc màn hình.
- Phím tắt bàn phím toàn cục (Space: Play/Pause, Ctrl+Z / Ctrl+S).

---

## 4. QUY TẮC ĐỒNG BỘ VÀ NGUYÊN TẮC BẢO TRÌ
1. **Mô hình Phạm Vi Toàn Cục (Global Scope):** Mọi hàm và biến dùng chung được khai báo ở phạm vi cửa sổ trình duyệt (window), không dùng `import/export`. Thứ tự nạp `<script>` trong `index.html` quyết định tính khả dụng.
2. **Đồng bộ hai chiều `js/` và `public/js/`:** Mọi thay đổi trong thư mục `/js/` phải luôn được sao chép nguyên vẹn sang `/public/js/`.
3. **Tính toàn vẹn mã nguồn:** Không bao giờ viết tắt hay để lại chú thích lược bỏ code. Mọi tính năng hoạt động độc lập và ổn định 100%.
