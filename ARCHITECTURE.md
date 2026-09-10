# BẢN ĐỒ KIẾN TRÚC DỰ ÁN ENGSPUR AUTO VIDEO STUDIO

## 1. TỔNG QUAN HỆ THỐNG
Dự án tạo video tự động từ file Excel & ảnh, hỗ trợ xem trước trên Timeline, tổng hợp giọng nói TTS, xuất video MP4 và render hàng loạt (Batch Pipeline).

## 2. CẤU TRÚC THƯ MỤC & NHIỆM VỤ CÁC FILE

### 1. `index.html`
- Chứa toàn bộ thẻ giao diện HTML (Header, Cột Trái, Khung Canvas trung tâm, Timeline, Cột Phải, View Render Hàng Loạt).
- Nạp thư viện CDN (Tailwind, Lucide Icons, SheetJS XLSX).
- Nạp CSS và các file JavaScript theo đúng thứ tự phụ thuộc.

### 2. `styles.css` (và `css/styles.css`)
- Chứa phông chữ Google Fonts (@import), tùy biến thanh cuộn, hiệu ứng kim phát Timeline (.playhead-needle), animation.

### 3. `js/1_state_config.js`
- Quản lý các biến trạng thái toàn cục:
  - `importedDatasets`: Mảng chứa dữ liệu câu hỏi, drills từ Excel.
  - `paragraphFieldStyles`: Định dạng phông, cỡ chữ, màu nền từng trường text/ảnh.
  - `DEFAULT_TEMPLATES_JSON`: Mẫu kịch bản 1 (Phản xạ 1:1) và Mẫu 2 (Xếp tầng).
  - `videoConfig`: Cấu hình giọng đọc mặc định, tỷ lệ khung hình, ảnh nền canvas.

### 4. `js/2_storage.js`
- Xử lý bộ nhớ trình duyệt (IndexedDB) và File JSON:
  - `saveFullSystemState()`, `loadFullSystemState()`: Lưu/khôi phục toàn bộ trạng thái vào IndexedDB.
  - `exportCurrentProfileToJSON()`, `handleImportProfileJSON()`: Xuất/nhập cấu hình kịch bản JSON.
  - `saveCurrentProfileOver()`, `saveCurrentProfileAsNew()`: Quản lý danh sách kịch bản lưu trong bộ nhớ.

### 5. `js/3_excel_assets.js`
- Xử lý đầu vào dữ liệu:
  - `handleExcelUpload()`, `processImportedExcelRows()`: Đọc và bóc tách file Excel thành câu và drills.
  - `handleLocalImagesUpload()`: Đọc thư mục ảnh từ máy tính, chuyển sang Base64 gán vào `localPCImageMap`.
  - `renderDatasetTable()`, `updateTopicDropdown()`: Cập nhật danh sách câu và lọc theo chủ đề.

### 6. `js/4_canvas_renderer.js`
- Trái tim render đồ họa trên Canvas 1920x1080:
  - `drawParagraphCanvasFrame()`: Điều phối vẽ khung hình chính và khung hình Clean (nền trắng không logo).
  - `renderSingleFrameToContext()`: Tính toán vị trí cột grid, lề padding, khoảng cách dòng.
  - `drawAutoFlowCardBox()`: Tự động ngắt dòng (word-wrap), co giãn hộp ôm sát chữ (shrinkToFit), vẽ nền và highlight chữ.
  - `drawRect916PhotoFrame()`: Vẽ khung ảnh bo góc, căn tỉ lệ ảnh đính kèm.

### 7. `js/5_timeline_player.js`
- Điều khiển trục thời gian Timeline và Playback:
  - `renderTimelineTracksUI()`: Vẽ các đường ray (tracks), tay nắm co kéo (resizers).
  - `onTimelineBarMouseDown()`, `onTimelineBarMouseMove()`: Kéo thả di chuyển hoặc đổi thời lượng ray.
  - `toggleTimelinePlayback()`, `seekTimeline()`: Phát/dừng hoặc tua câu hiện tại.
  - `runUnifiedSentenceSequence()`: Vòng lặp chạy thử toàn bộ danh sách câu từ đầu đến cuối.

### 8. `js/6_tts_audio.js`
- Âm thanh và Giọng đọc AI:
  - `speakTTS()`, `populateVoiceList()`: Gọi Web Speech API phát âm tiếng Anh.
  - `autoRecalculateAudioLayersDuration()`: Tự động đo độ dài văn bản để khóa thời lượng ray Timeline.
  - `createWavHeader()`, `encodePcmChunksToWavBlob()`: Thu âm và mã hóa dữ liệu PCM thành file âm thanh WAV chuẩn 44.1kHz Stereo 16-bit.

### 9. `js/7_inspector_ui.js`
- Bảng điều khiển Ribbon và Hộp thoại Popover:
  - `renderInspectorRibbon()`: Bảng chỉnh sửa font, size, màu sắc, lề padding của trường đang chọn.
  - `applyMultiFieldProp()`, `toggleMultiFieldStyle()`: Áp dụng định dạng cho một hoặc nhiều trường đồng thời.
  - `openFloatingCardPopover()`: Mở popover nổi chỉnh cấu hình thẻ TTS, đồng hồ đếm ngược, chữ tự do.
  - `syncInlineGridSettingsInputs()`: Cấu hình chia cột lưới, tỷ lệ rộng, lề 4 chiều.

### 10. `js/8_batch_pipeline.js`
- Quá trình Render Video hàng loạt và Báo cáo:
  - `startBatchRenderPipeline()`, `runNextBatchTopic()`: Quản lý hàng đợi render theo chuỗi kịch bản & chủ đề.
  - `saveBatchVideoFileDirectly()`: Ghi video và file WAV trực tiếp vào thư mục máy qua File System Access API.
  - `exportBatchExcelReport()`: Xuất báo cáo kết quả render ra file Excel gồm 2 sheet chi tiết tới mili-giây.

### 11. `js/app.js`
- Điểm khởi động ứng dụng:
  - Sự kiện `DOMContentLoaded`, khởi tạo Canvas, Lucide icons, gọi nạp dữ liệu từ IndexedDB.
  - `showToast()`: Hiển thị thông báo trạng thái góc màn hình.
