/**
 * 1_state_config.js
 * Quản lý các biến trạng thái toàn cục và cấu hình kịch bản mẫu
 */

var APP_VERSION_INFO = {
    version: "V16.1",
    releaseDate: "21/09/2026",
    status: "Mới nhất & Ổn định",
    summary: "Bản nâng cấp V16.1: Tích hợp Thẻ Video (Clip & Nền) độc lập và động nối cột Excel, hỗ trợ toàn diện định dạng kích thước, vị trí, căn vừa khung, âm lượng và lặp lại.",
    categories: [
        {
            title: "Tích Hợp Thẻ Video (Clip & Nền) Độc Lập & Động Nối Cột Excel (V16.1)",
            icon: "video",
            color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
            items: [
                "Thẻ Video Clip & Nền độc lập: Thêm đối tượng video vào bất kỳ lớp nào trên Timeline, hỗ trợ định dạng vị trí X-Y, kích thước (Rộng - Cao), bo góc viền và đổ bóng.",
                "2 Chế độ nguồn linh hoạt: Tải trực tiếp file video (.mp4, .webm, .mov) từ máy tính hoặc kết nối động theo tên cột trong file Excel (mỗi câu một clip minh họa khác nhau).",
                "3 Chế độ vừa khung (Fit Mode): Tùy chọn 'Cắt vừa khung (Cover)', 'Thu trọn vẹn (Contain)' hoặc 'Kéo dãn (Stretch)' không lo vỡ khung hay biến dạng tỷ lệ.",
                "Điều khiển âm thanh & phát lại mượt mà: Bật/tắt tiếng (Mute), thanh trượt âm lượng 0-100%, lặp lại (Loop) theo độ dài câu và điều chỉnh tốc độ phát lại."
            ]
        },
        {
            title: "Căn Chỉnh Đệm 4 Chiều Cho Khung Viền Toàn Lưới & 2 Chế Độ Chiều Cao (V16.0)",
            icon: "maximize-2",
            color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
            items: [
                "Linh hoạt 2 chế độ phủ toàn diện: Hỗ trợ 'Toàn lưới (Tất cả cột & Toàn chiều cao)' bao trọn toàn bộ ma trận lưới và 'Toàn chiều cao (Theo cột chọn)' phủ trọn chiều cao theo đúng các cột mong muốn.",
                "Tinh chỉnh độc lập 4 chiều (Trên - Dưới - Trái - Phải): Cho phép tăng giảm số pixel (kể cả số âm từ -200 đến 200px) trên từng hướng của khung viền ở mọi chế độ, cập nhật tức thì trên Canvas.",
                "Đồng bộ chuẩn xác tọa độ Nền & Nét viền: Khắc phục triệt để độ lệch mép trên khi chọn toàn lưới, đảm bảo nền màu và đường nét viền khớp khít 100%."
            ]
        },
        {
            title: "Tách Riêng 4 Hướng Đệm & Đo Đáy Ôm Sát Khít Nội Dung (V15.9)",
            icon: "box-select",
            color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
            items: [
                "Tách riêng 4 hướng đệm độc lập: Cung cấp 4 ô điều chỉnh riêng biệt gồm Đệm Trái (Left), Đệm Phải (Right), Đệm Trên (Top), Đệm Dưới (Bottom) đều hỗ trợ số âm (-200 đến 200px).",
                "Đo đáy thực tế chuẩn xác tuyệt đối: Thuật toán đo đáy loại bỏ hoàn toàn khoảng cách thừa ảo ở dòng cuối, viền dưới co ôm sát khít ngay chân câu cuối cùng.",
                "Điều chỉnh độc lập không ảnh hưởng lẫn nhau: Kéo viền dưới co lên không làm tụt viền trên; chỉnh lề trái không làm xô lệch lề phải.",
                "Tương thích ngược 100%: Tự động kế thừa từ các dự án và mẫu kịch bản cũ mà không làm sai lệch thiết kế đã lưu."
            ]
        },
        {
            title: "Hỗ Trợ Giá Trị Âm Cho Đệm Ngang & Dọc Khung Bao Cột (V15.8)",
            icon: "sliders",
            color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
            items: [
                "Cho phép nhập giá trị âm (ví dụ: -10, -20px): Đệm Ngang (X) và Đệm Dọc (Y) giờ đây hỗ trợ số âm, giúp thu hẹp khung viền ôm sát khít các cột bài tập hơn.",
                "Cập nhật thời gian thực (Live Preview): Thao tác gõ phím hoặc chỉnh stepper lập tức vẽ lại trên Canvas và lưu tự động mà không cần chờ chuyển tiêu điểm.",
                "Bảo vệ kích thước an toàn: Tự động giữ chiều rộng và chiều cao khung viền không bị âm hoặc méo góc bo khi dùng giá trị âm lớn."
            ]
        },
        {
            title: "Khung Viền Bao Gộp Cột Tự Động (V15.7)",
            icon: "square",
            color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
            items: [
                "Khung bao gộp cột linh hoạt (Mode 2 Cue Words): Tự động bao trọn từ Cột 1 đến Cột 2 (hoặc tùy chọn các cột) tạo khung phân chia rõ ràng giữa cột gợi ý/mẫu câu và cột hình ảnh minh họa.",
                "Tùy biến thẩm mỹ toàn diện: Bộ chọn màu viền HEX (mặc định vàng nghệ #d99a14), độ dày nét viền (1-20px), bo góc tròn mượt (0-80px) và khoảng đệm trong (Padding X/Y).",
                "2 Chế độ chiều cao thông minh: Hỗ trợ 'Ôm sát nội dung bài tập' (tự động co giãn theo số lượng dòng chữ) hoặc 'Toàn lưới' (kéo dài hết chiều cao khả dụng).",
                "Đồng bộ lưu trữ & Render Clean: Tự động lưu trữ trong kịch bản JSON, hiển thị trực tiếp trên Canvas Studio và bản xuất MP4 Clean chất lượng cao."
            ]
        },
        {
            title: "Đồng Bộ Vị Trí, Kích Thước & Toàn Diện Định Dạng (V15.6)",
            icon: "copy-check",
            color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
            items: [
                "Áp dụng trọn vẹn vị trí & kích thước: Khi bấm 'Áp Dụng Tất Cả', toàn bộ vị trí (X, Y), kích thước (Rộng, Cao), chế độ tọa độ tự do, bo góc, căn lề và tỷ lệ co giãn được sao chép chuẩn xác sang các đối tượng đã tích chọn.",
                "Bảo toàn 100% Nội dung văn bản: Giữ nguyên vẹn tuyệt đối nội dung chữ gốc của từng thẻ, đảm bảo không bị ghi đè văn bản khi đồng bộ kiểu dáng và layout hàng loạt qua các kịch bản.",
                "Đồng bộ tức thì trên Canvas & Bộ nhớ: Tự động cập nhật trực tiếp cả kịch bản đang mở lẫn tất cả kịch bản được lưu trữ trong danh sách.",
                "Tương thích toàn diện mọi loại đối tượng: Hỗ trợ trọn vẹn Thẻ Chữ Tự Do, Thẻ Đồng Hồ Đếm Ngược, Thẻ Tiến Độ, Khung Ảnh và Thẻ Chữ Excel."
            ]
        },
        {
            title: "Tối Ưu Bộ Nhớ Tự Động Lưu & Lịch Sử Hoàn Tác (V15.5)",
            icon: "shield-check",
            color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
            items: [
                "Giới hạn 20 bước hoàn tác siêu nhẹ: Chuẩn hóa 20 bước Undo/Redo tối ưu, loại bỏ hoàn toàn các chuỗi âm thanh và ảnh Base64 nặng ẩn trong lịch sử, giảm tới 80% RAM tiêu thụ.",
                "Tự động lưu thông minh (Smart Debounce & Queue): Gom trễ hợp lý (1000ms) khi chỉnh sửa liên tục, xếp hàng lưu tuần tự chống nghẽn I/O và loại bỏ hoàn toàn hiện tượng khựng giật giao diện.",
                "Cơ chế cứu hộ chống đầy bộ nhớ (IndexedDB Quota Defense): Tự động phát hiện khi bộ nhớ trình duyệt chạm ngưỡng giới hạn, ưu tiên bảo toàn 100% kịch bản, lưới cột, timeline và dữ liệu chữ Excel.",
                "Thu hồi bộ nhớ RAM khi Render: Tự động dọn dẹp ngăn xếp lịch sử cũ trước khi chạy xuất video hàng loạt, tối ưu hóa tài nguyên cho MediaRecorder."
            ]
        },
        {
            title: "Mặt Nạ Cắt Logo Tròn Sát Khít & Tùy Chỉnh Viền (V15.4)",
            icon: "crop",
            color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
            items: [
                "Tự động gọt sát viền mép (Crop Inset): Mặc định tự động thu mặt nạ tròn vào 5% để gọt sạch mọi viền trắng hoặc khoảng đệm thừa ngoài mép logo.",
                "Thanh trượt tinh chỉnh độ sát viền (0% - 25%): Cho phép bạn kéo trượt tùy biến độ ôm sát khít của đường tròn, xem trước tức thì trên Canvas Preview.",
                "Đồng bộ lưu trữ & Profile: Giữ nguyên thông số thu viền trong cấu hình dự án và xuất/nhập file JSON an toàn."
            ]
        },
        {
            title: "Lọc Sạch Âm Thanh Base64 Ẩn Cho Bản Siêu Nhẹ (V15.3)",
            icon: "file-check-2",
            color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
            items: [
                "Lọc sạch dữ liệu âm thanh Base64 ẩn: Tự động phát hiện và loại bỏ triệt để toàn bộ chuỗi customAudioData (âm thanh tải lên) ẩn sâu trong các thẻ và nhóm kịch bản con.",
                "Giảm dung lượng thực tế từ 58MB xuống < 100 KB: Giải quyết triệt để tình trạng file Bản Siêu Nhẹ bị nặng do nhân bản âm thanh qua nhiều profile kịch bản.",
                "Bảo toàn 100% kịch bản & khôi phục thông minh: Giữ nguyên tên tệp âm thanh, thời lượng đếm ngược, timeline và cấu hình chữ Excel; tự động liên kết lại âm thanh sẵn có trên máy khi nhập file."
            ]
        },
        {
            title: "Tối Ưu Xuất File JSON & 3 Chế Độ Linh Hoạt (V15.2)",
            icon: "download",
            color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
            items: [
                "Hộp thoại xuất thông minh 3 lựa chọn: Khi nhấn 'Xuất File', giao diện hiển thị bảng chọn trực quan giữa Bản Siêu Nhẹ, Bản Nén Tối Ưu và Bản Gốc Đầy Đủ.",
                "Bản Siêu Nhẹ (Khuyên dùng - Giảm ~98%): Chỉ lưu toàn bộ kịch bản, lưới cột, Timeline, cấu hình Render và dữ liệu chữ Excel; loại bỏ hoàn toàn các chuỗi ảnh Base64 giúp file chỉ còn vài chục KB, tải và gửi cực nhanh.",
                "Bản Nén Tối Ưu (Có đủ ảnh - Giảm ~80%): Tự động nén kích thước ảnh JPEG chuẩn video 720p bằng Canvas API và thu gọn mã JSON, giữ trọn vẹn hình ảnh để mở trên máy khác mà không cần nạp lại ảnh.",
                "Bảo toàn dữ liệu & Khôi phục thông minh: Khôi phục nguyên vẹn 100% khi nhập lại; tự động giữ nguyên ảnh cục bộ đang có nếu nhập file bản siêu nhẹ."
            ]
        },
        {
            title: "Hoàn Tác & Làm Lại (Undo / Redo) Chuẩn Studio (V15.1)",
            icon: "undo-2",
            color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
            items: [
                "Bộ đôi nút Undo & Redo trực quan: Thay thế vị trí nút Nạp Mẫu Thử và Lưu Máy trên thanh Header, hỗ trợ hoàn tác và làm lại tức thì.",
                "Phím tắt toàn năng: Hỗ trợ phím tắt tiêu chuẩn Ctrl+Z để Hoàn tác (Undo) và Ctrl+Y hoặc Ctrl+Shift+Z để Làm lại (Redo).",
                "Quản lý lịch sử thay đổi thông minh: Tự động lưu vết các thao tác thêm, sửa, xóa lớp, căn chỉnh lưới, định dạng màu sắc, đồng hồ, tiến độ và dòng thời gian.",
                "Trạng thái nút mờ thông minh: Tự động khóa mờ khi không còn thao tác để Undo/Redo và hiển thị thông báo trạng thái Toast tức thì."
            ]
        },
        {
            title: "Áp Dụng Chung Cho Toàn Bộ Thẻ Cùng Loại (V15.0)",
            icon: "copy-check",
            color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
            items: [
                "Nút 1-Chạm 'Áp Dụng Tất Cả': Xuất hiện nổi bật ngay đầu mỗi bảng cài đặt thuộc tính (Thẻ chữ Excel, Chữ tự do, Đồng hồ đếm ngược, Thanh tiến độ, Âm thanh SFX, Khung ảnh).",
                "Đồng bộ chuẩn xác theo loại đối tượng: Tự động quét toàn bộ kịch bản, sao chép trọn vẹn phông chữ, cỡ chữ, màu chữ, nền, bo góc, vệt highlight, viền nét, âm lượng sang mọi thẻ cùng loại.",
                "Bảo toàn nội dung và thời lượng riêng: Chỉ đồng bộ phong cách thiết kế, giữ nguyên văn bản và nội dung riêng biệt của từng thẻ.",
                "Thông báo trạng thái trực quan: Hiển thị ngay số lượng thẻ đã được cập nhật thành công và tự động lưu trạng thái vào bộ nhớ."
            ]
        },
        {
            title: "Tối Ưu Hiển Thị Logo Tròn & Khử Nền Trắng (V14.9)",
            icon: "circle",
            color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
            items: [
                "Cắt khung Logo hình tròn (Circular Mask): Tự động tạo mặt nạ hình tròn vừa khít với tâm ảnh, triệt tiêu hoàn toàn 4 góc vuông trắng của file ảnh.",
                "Tự động khử nền trắng (Remove White Background): Bộ lọc pixel thông minh biến toàn bộ nền trắng xung quanh logo thành trong suốt 100%.",
                "Chuyển đổi 1 chạm linh hoạt: Các nút bấm chọn nhanh 'Hình Tròn', 'Chữ Nhật Bo Góc' và thanh gạt 'Khử nền trắng' tích hợp ngay trong bảng điều khiển Logo."
            ]
        },
        {
            title: "Tinh Giản Giao Diện Đồng Hồ (V14.8)",
            icon: "minimize-2",
            color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
            items: [
                "Lược bỏ khung 'Nhãn phụ dưới đồng hồ' (Sub-Label) trong bảng điều khiển đối tượng.",
                "Giao diện gọn gàng, liền mạch: Các thanh cấu hình thời lượng, âm thanh tích tắc và màu sắc hiển thị tối ưu hơn."
            ]
        },
        {
            title: "Tùy Chỉnh Màu Nền Đồng Hồ Đếm Ngược (V14.7)",
            icon: "paint-bucket",
            color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
            items: [
                "Tùy chỉnh màu nền linh hoạt: Bộ chọn màu (Color Picker), mã HEX và 8 tông màu nền tương phản cao (Đen tuyền, Đen than, Xám Slate, Xanh đêm, Tím đậm, Nâu đỏ, Xanh rêu, Trắng sáng).",
                "3 phím chọn nhanh chế độ nền: Chuyển đổi 1 chạm giữa Đen Đậm Siêu Rõ (khuyên dùng để làm nổi bật 100% vòng tròn quét màu Xanh ➔ Vàng ➔ Đỏ), Trong Suốt Hoàn Toàn và Xám Slate Mặc Định.",
                "Thanh trượt độ mờ đục nền (0% - 100%): Cho phép tùy biến độ đậm nhạt của đĩa đệm chống lóa, xem trước trực quan tức thì trên Canvas Preview."
            ]
        },
        {
            title: "Tối Ưu & Bóc Tách Module Chuyên Môn (V14.6)",
            icon: "box",
            color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
            items: [
                "Bóc tách Động cơ Canvas: Chia nhỏ thành 4a_canvas_engine (vòng lặp render), 4b_canvas_text (thuật toán ngắt dòng chữ) và 4c_canvas_overlays (đồng hồ, thanh tiến độ, ảnh).",
                "Bóc tách Hệ thống Âm thanh: Tách riêng 6a_tts_voice (giọng đọc AI Edge TTS & Web Speech) và 6b_sfx_audio (tích tắc, chuông báo, Audio Ducking).",
                "Bóc tách Bảng điều khiển Inspector: Tách 7b_inspector_ribbon (định dạng chữ/màu) và 7b2_inspector_countdown (tiện ích đồng hồ, SFX, tiến độ).",
                "Bóc tách Quản lý Lớp & Lưới: Phân tách 7c_inspector_layers (danh sách layers, thêm/xóa thẻ) và 7d_inspector_grid (cấu hình ma trận cột, lề đệm và khóa cột Excel)."
            ]
        },
        {
            title: "Đĩa Chống Lóa & Chữ Số Siêu Sáng 100% (V14.5)",
            icon: "sun",
            color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
            items: [
                "Khóa độ sáng 100% cho chữ số (Solid Pure White): Tách riêng độ trong suốt của vỏ ngoài khỏi chữ số bên trong, đảm bảo con số luôn giữ màu trắng sáng tinh khiết hoặc màu tự chọn 100%, không bị xỉn màu.",
                "Đĩa đệm chống lóa cao cấp (Anti-Glare Shield): Tích hợp đĩa đệm đen than sâu bên dưới đồng hồ, che chắn hoàn toàn các chi tiết/màu nền video phức tạp không bị xuyên qua làm chìm con số.",
                "Mặc định viền nét tương phản (Crisp Stroke Outline 3px): Tự động bật viền nét đen sắc nét bao quanh con số, phân tách hoàn toàn chữ số khỏi màu sắc vòng đĩa.",
                "Đổ bóng kép nổi khối (Double-layer Drop Shadow): Tăng cường chiều sâu 3D giúp số nổi bật, rõ ràng ngay cả khi xem ở khoảng cách xa hoặc trên màn hình nhỏ."
            ]
        },
        {
            title: "Màu Sắc & Hiệu Ứng Số Đồng Hồ Đếm Ngược (V14.4)",
            icon: "palette",
            color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
            items: [
                "Tùy chọn màu số tự do: Bảng chọn mã màu HEX (Color Picker) kèm 8 nút màu nhanh (Trắng, Vàng Neon, Cam, Đỏ, Xanh Lá, Cyan, Hồng, Đen) xem trước trực tiếp trên Canvas.",
                "Hiệu ứng viền nét chữ (Stroke Outline): Cho phép bật/tắt viền nét đậm, tùy chỉnh màu viền và độ dày viền nét để chữ số luôn rõ ràng ngay cả khi đặt trên nền phức tạp.",
                "Đổ bóng nổi bật & Phát sáng Neon (Glow/Shadow): Tùy chọn đổ bóng mờ 3D hoặc phát sáng neon rực rỡ, tự động hòa trộn ánh sáng chuyên nghiệp.",
                "Tọa độ Pixel & Bán kính chính xác: Cung cấp thanh trượt tọa độ X/Y và bán kính R (pixel) kèm các phím căn vị trí chuẩn và dịch chuyển vi sai ±10px."
            ]
        },
        {
            title: "Đồng Hồ Đếm Ngược: Presets & Tiếng Tích Tắc (V14.3)",
            icon: "timer",
            color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
            items: [
                "Tạo tiếng tích tắc chân thực: Tích hợp bộ tổng hợp âm thanh Web Audio API tạo tiếng tích tắc (Cơ học, Bíp điện tử, Gõ gỗ) đồng bộ chuẩn từng giây và chuông Ting/Ding khi đếm về 0s.",
                "Kho Presets đồng hồ đếm ngược: Lựa chọn linh hoạt giữa 6 giao diện: Chuyển màu Xanh ➔ Đỏ cảnh báo, Vòng Neon công nghệ, Digital LED thể thao, Pill tối giản, Bom kịch tính, Vòng tròn cổ điển.",
                "Hiệu ứng đổi màu Xanh sang Đỏ: Tự động đổi màu từ Xanh lá (>50%) sang Vàng cam (20%-50%) và Đỏ thẫm rực rỡ (<20% và giây cuối) kèm hiệu ứng rung đập (pulse) báo hiệu sắp hết giờ.",
                "Xem thử trực quan tức thì: Xem trước ngay giao diện đồng hồ trên Canvas khi bấm thẻ và nút 'Nghe thử âm thanh' / 'Chạy thử đếm ngược' ngay trong bảng cài đặt."
            ]
        },
        {
            title: "Timeline 1 Trang Tĩnh Khi 'Hiện Tất Cả Dòng' (V14.2)",
            icon: "play-circle",
            color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
            items: [
                "Phương án 2 - Chạy thử 1 chu kỳ trang tĩnh: Khi kịch bản hoặc lớp có tùy chọn 'Hiện tất cả các dòng', nút Chạy Thử Toàn Bộ tự động kích hoạt 1 chu kỳ duy nhất theo đúng thời lượng Timeline (8s-10s), không lặp lại tua kim qua từng câu.",
                "Đồng bộ giọng đọc TTS toàn trang: Tự động tổng hợp và đọc toàn bộ các dòng bài tập hiển thị trên trang tĩnh thay vì chỉ đọc câu đầu tiên.",
                "Hiển thị giao diện thông minh: Nút Chạy Thử và thanh trạng thái tự động cập nhật nhãn 'Chạy Thử Trang Tĩnh (1 Chu Kỳ)' giúp người dùng nắm bắt tức thì chế độ đang hoạt động."
            ]
        },
        {
            title: "Khắc Phục Chuyển Dòng Mượt Mà & Duy Trì Preview (V14.1)",
            icon: "check-circle",
            color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
            items: [
                "Khắc phục triệt để màn hình trống khi chuyển câu: Khóa giữ khung hình câu vừa hoàn thành liên tục trong suốt 0.5s chuyển dòng, loại bỏ hoàn toàn hiện tượng chớp tắt hoặc màn hình trắng.",
                "Tối ưu ranh giới phân khu: Khu 2 (Drills) duy trì hiển thị ổn định xuyên suốt đến hết câu và khoảng nghỉ (chỉ ẩn khi có Khu 3 Outro thực sự có lớp kích hoạt ở câu cuối cùng).",
                "Đồng bộ luồng quay video (MediaRecorder): Giữ luồng khung hình 30fps liền mạch không khựng timestamp, đảm bảo file video xuất ra mượt mà tuyệt đối."
            ]
        },
        {
            title: "Khóa Hiển Thị Phân Khu Chặt Chẽ Theo Timeline (V14.0)",
            icon: "lock",
            color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
            items: [
                "Khóa hiển thị theo thời gian phân khu: Kim Timeline chưa chạy tới mốc bắt đầu của khu nào (ví dụ chưa tới Khu 2: Drills) thì toàn bộ các lớp của khu đó bị ẩn hoàn toàn 100% trên Canvas Preview.",
                "Sửa triệt để chế độ 'Hiện tất cả dòng': Áp dụng kiểm tra thời điểm bắt đầu (startTime) cho toàn bộ các dòng của lớp, không còn bị lộ các câu sau khi kim Timeline chưa chạm mốc bắt đầu.",
                "Khóa âm thanh đồng bộ: Lớp âm thanh/giọng đọc thuộc từng khu chỉ được kích hoạt khi kim Timeline thực sự bước vào phân khu tương ứng."
            ]
        },
        {
            title: "Tùy Chỉnh Chế Độ Trình Chiếu Riêng Từng Lớp (V13.9)",
            icon: "layers",
            color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
            items: [
                "Cấu hình độc lập từng lớp: Mỗi lớp có thể tự do chọn '1 Câu / Làm mới', 'Xếp tầng nối tiếp', 'Hiện tất cả dòng cùng lúc' hoặc 'Kế thừa mặc định chung'.",
                "Hiển thị linh hoạt: Cho phép kết hợp trong cùng 1 bài học: tiêu đề/câu hỏi hiện liên tục tất cả dòng, trong khi đáp án hoặc gợi ý xuất hiện xếp tầng hoặc làm mới theo từng câu.",
                "Chọn nhanh trên thẻ lớp & Ribbon: Tích hợp menu chọn chế độ trình chiếu trực tiếp trên từng thẻ lớp ở Cột phải và trên thanh định dạng Ribbon."
            ]
        },
        {
            title: "Giới Hạn Lớp Theo Ranh Giới Khu & Chỉnh Sửa Thời Gian Từng Khu (V13.9)",
            icon: "clock",
            color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
            items: [
                "Khóa ranh giới nghiêm ngặt (Không tràn khu): Lớp thuộc Khu nào (Khu 1: Intro, Khu 2: Drills, Khu 3: Outro) thì thanh ray bị giới hạn chặt chẽ trong ranh giới thời gian của khu đó khi kéo di chuyển hoặc kéo giãn thời lượng.",
                "Chỉnh sửa tổng thời gian từng khu: Bổ sung ô nhập và nút chỉnh số giây trực tiếp cho từng khu ngay trên thanh Timeline (Khu 1, Khu 2, Khu 3), thanh khoang tự động co giãn tỷ lệ % chuẩn xác.",
                "Tự động căn chỉnh khi đổi khu: Khi chuyển đổi vị trí lớp giữa các khu, thời gian bắt đầu và thời lượng của lớp tự động co vừa vặn với ranh giới của khu mới."
            ]
        },
        {
            title: "Trực Quan Hóa Timeline 3 Phân Khu (V13.8)",
            icon: "film",
            color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
            items: [
                "Thanh phân khu 3 khoang: Tích hợp dải định vị trực quan ngay trên thước đo Timeline mô phỏng các phần mềm dựng video cao cấp (Khu 1: Intro ➔ Khu 2: Drills ➔ Khu 3: Outro).",
                "Huy hiệu phân khu trên Thẻ lớp: Mỗi thẻ lớp hiển thị biểu ngữ rõ ràng xác định lớp thuộc Mở đầu (Intro), Trong vòng lặp (Drills), Kết bài (Outro) hay Cố định toàn video.",
                "Thẻ ray thời lượng (Tracks): Thanh thời lượng trên ray hiển thị nhãn viết tắt kèm icon chuẩn xác (Intro, Từng câu, Outro, Cố định) giúp nhận diện tức thì khi rê chuột hoặc kéo chỉnh."
            ]
        },
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
            version: "V14.1",
            date: "17/09/2026",
            highlight: "Khắc phục triệt để màn hình trống khi chuyển dòng trong chế độ 3.2, duy trì khung hình hoàn chỉnh liên tục suốt 0.5s chuyển câu."
        },
        {
            version: "V14.0",
            date: "17/09/2026",
            highlight: "Khóa hiển thị các phân khu chặt chẽ theo Timeline (chưa tới khu nào thì ẩn 100% tất cả các lớp của khu đó) và đồng bộ thời điểm bắt đầu cho chế độ 'Hiện tất cả dòng'."
        },
        {
            version: "V13.9",
            date: "17/09/2026",
            highlight: "Chế độ trình chiếu riêng từng lớp (1 Câu / Xếp tầng / Hiện tất cả dòng), giới hạn lớp theo ranh giới phân khu Timeline và chỉnh sửa thời gian từng khu trực tiếp."
        },
        {
            version: "V13.8",
            date: "17/09/2026",
            highlight: "Trực quan hóa Timeline theo 3 Phân khu chuyên nghiệp (Khu 1: Intro ➔ Khu 2: Drills ➔ Khu 3: Outro), huy hiệu phân khu trên thẻ lớp và dải ray thời lượng."
        },
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
var localPCVideoMap = {}; 
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
var currentCountdownTriggeredTicks = new Set();
var runtimeAudioBufferCache = new Map();
var batchAudioSampleRate = 44100;

var selectedFieldKeysList = ["Substitution words"];
var paragraphSelectedGroupIdx = 0;
var paragraphSelectedFieldKey = "Substitution words";
var selectedCustomTextTarget = null; // { gIdx, fIdx }

function getCountdownDefaults(item) {
    if (!item) item = {};
    if (item.type === undefined) item.type = "countdown";
    if (item.seconds === undefined) item.seconds = 3;
    if (item.preset === undefined) item.preset = "green_to_red";
    if (item.colorShift === undefined) item.colorShift = true;
    if (item.enableTickSound === undefined) item.enableTickSound = true;
    if (item.tickSoundType === undefined) item.tickSoundType = "mechanical";
    if (item.tickVolume === undefined) item.tickVolume = 80;
    if (item.playEndChime === undefined) item.playEndChime = true;
    if (item.endSoundType === undefined) item.endSoundType = "ding";
    if (item.position === undefined) item.position = "top_right";
    if (item.size === undefined) item.size = "medium";
    if (item.radius === undefined) {
        item.radius = (item.size === 'small' ? 24 : (item.size === 'large' ? 46 : (item.size === 'xlarge' ? 58 : 34)));
    }
    if (item.posX === undefined) {
        item.posX = (item.position === 'top_left' || item.position === 'bottom_left') ? 68 : (item.position === 'center' || item.position === 'bottom_center' ? 960 : 1852);
    }
    if (item.posY === undefined) {
        item.posY = (item.position === 'bottom_left' || item.position === 'bottom_center' || item.position === 'bottom_right') ? 1004 : 68;
    }
    if (item.opacity === undefined) item.opacity = 100;
    if (item.textColor === undefined) item.textColor = "#ffffff";
    if (item.textShadow === undefined) item.textShadow = true;
    if (item.shadowColor === undefined) item.shadowColor = "rgba(0, 0, 0, 0.95)";
    if (item.textGlow === undefined) item.textGlow = false;
    if (item.glowColor === undefined) item.glowColor = "#ffffff";
    if (item.textStroke === undefined) item.textStroke = true; // Mặc định bật viền nét để chữ số luôn rõ nét trên mọi nền
    if (item.strokeColor === undefined) item.strokeColor = "#000000";
    if (item.strokeWidth === undefined) item.strokeWidth = 3;
    return item;
}

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
        zoneDurations: { intro: 2.0, drills: 4.5, outro: 1.5 },
        gridMatrix: { 
            columnCount: 2, 
            columnWidths: [62, 34], 
            paddingTopPct: 8, 
            paddingBottomPct: 8, 
            paddingLeftPct: 4, 
            paddingRightPct: 4, 
            columnGapPct: 2, 
            showGridOverlay: false,
            autoRowSync: true,
            columnBoxWrapper: {
                enabled: false,
                startCol: 1,
                endCol: 2,
                borderColor: "#d99a14",
                borderWidth: 3,
                borderRadius: 20,
                paddingX: 16,
                paddingY: 16,
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 16,
                paddingBottom: 16,
                bgColor: "transparent",
                heightMode: "auto"
            }
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
                    { type: "countdown", seconds: 3, position: "top_right", size: "medium", preset: "green_to_red", colorShift: true, enableTickSound: true, tickSoundType: "mechanical", playEndChime: true, tickVolume: 80 }
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
        zoneDurations: { intro: 2.0, drills: 5.0, outro: 1.5 },
        gridMatrix: { 
            columnCount: 3, 
            columnWidths: [36, 40, 20], 
            paddingTopPct: 8, 
            paddingBottomPct: 8, 
            paddingLeftPct: 3, 
            paddingRightPct: 3, 
            columnGapPct: 1.5, 
            showGridOverlay: false,
            autoRowSync: true,
            columnBoxWrapper: {
                enabled: true,
                startCol: 1,
                endCol: 2,
                borderColor: "#d99a14",
                borderWidth: 3,
                borderRadius: 20,
                paddingX: 16,
                paddingY: 16,
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 16,
                paddingBottom: 16,
                bgColor: "transparent",
                heightMode: "auto"
            }
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
                    { type: "countdown", seconds: 3, position: "top_right", size: "medium", preset: "green_to_red", colorShift: true, enableTickSound: true, tickSoundType: "mechanical", playEndChime: true, tickVolume: 80 }
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
    badgeStyle: { widthPct: 15, heightPct: 10, posX: 82, posY: 4, opacity: 100, borderRadius: 20, isCircle: true, removeWhiteBg: false, maskInsetPct: 5 }
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

/**
 * Lấy cấu hình thời lượng 3 phân khu (Khu 1: Intro, Khu 2: Drills, Khu 3: Outro)
 */
function getZoneDurations() {
    if (!paragraphGridConfig.zoneDurations) {
        var total = typeof masterTimelineDuration === 'number' && masterTimelineDuration > 0 ? masterTimelineDuration : 8.0;
        var introD = 2.0;
        var outroD = 1.5;
        var drillsD = Math.max(1.0, total - introD - outroD);
        paragraphGridConfig.zoneDurations = {
            intro: introD,
            drills: Math.round(drillsD * 10) / 10,
            outro: outroD
        };
    }
    if (isNaN(paragraphGridConfig.zoneDurations.intro) || paragraphGridConfig.zoneDurations.intro < 0) paragraphGridConfig.zoneDurations.intro = 0;
    if (isNaN(paragraphGridConfig.zoneDurations.drills) || paragraphGridConfig.zoneDurations.drills < 0.5) paragraphGridConfig.zoneDurations.drills = 4.5;
    if (isNaN(paragraphGridConfig.zoneDurations.outro) || paragraphGridConfig.zoneDurations.outro < 0) paragraphGridConfig.zoneDurations.outro = 0;
    return paragraphGridConfig.zoneDurations;
}

/**
 * Kiểm tra xem phân khu (Intro, Drills, Outro, Cố định) có chứa ít nhất 1 lớp hay không
 * @param {string} zoneKey - 'intro' | 'before', 'drills' | 'inside', 'outro' | 'after', 'outside'
 * @returns {boolean}
 */
function hasZoneLayers(zoneKey) {
    if (!paragraphGridConfig || !Array.isArray(paragraphGridConfig.groups)) return false;
    return paragraphGridConfig.groups.some(function(grp) {
        var pos = typeof getGroupLoopPosition === 'function' 
            ? getGroupLoopPosition(grp) 
            : (grp.loopPosition || (grp.isInsideLoop === false ? 'outside' : 'inside'));
        if (zoneKey === 'intro' || zoneKey === 'before') return pos === 'before';
        if (zoneKey === 'drills' || zoneKey === 'inside') return pos === 'inside';
        if (zoneKey === 'outro' || zoneKey === 'after') return pos === 'after';
        if (zoneKey === 'outside') return pos === 'outside';
        return false;
    });
}

/**
 * Lấy ranh giới thời gian (Start, End) chính xác của một phân khu
 * Phân khu nào không có lớp thì thời lượng và ranh giới không tồn tại trên timeline
 * @param {string} zoneType - 'before' (Intro), 'inside' (Drills), 'after' (Outro), hoặc 'outside' (Cố định toàn video)
 */
function getZoneBoundary(zoneType) {
    var zones = getZoneDurations();
    var hasIntro = typeof hasZoneLayers === 'function' ? hasZoneLayers('intro') : true;
    var hasDrills = typeof hasZoneLayers === 'function' ? hasZoneLayers('drills') : true;
    var hasOutro = typeof hasZoneLayers === 'function' ? hasZoneLayers('outro') : true;

    var effIntroDur = hasIntro ? Math.max(0, zones.intro || 0) : 0;
    var effOutroDur = hasOutro ? Math.max(0, zones.outro || 0) : 0;
    var total = typeof masterTimelineDuration === 'number' && masterTimelineDuration > 0 ? masterTimelineDuration : 8.0;

    var effDrillsDur;
    if (hasDrills) {
        if (!hasIntro && !hasOutro) {
            effDrillsDur = total;
        } else {
            effDrillsDur = Math.max(0.5, total - effIntroDur - effOutroDur);
        }
    } else {
        effDrillsDur = 0;
    }

    var introStart = 0;
    var introEnd = Math.round(effIntroDur * 10) / 10;

    var drillsStart = introEnd;
    var drillsEnd = Math.round((drillsStart + effDrillsDur) * 10) / 10;

    var outroStart = drillsEnd;
    var outroEnd = Math.round((outroStart + effOutroDur) * 10) / 10;

    var grandTotal = Math.max(0.5, Math.max(total, outroEnd));

    if (zoneType === 'before') {
        return { 
            start: introStart, 
            end: introEnd, 
            maxDur: effIntroDur, 
            hasLayers: hasIntro,
            key: 'intro', 
            name: "Khu 1: Mở đầu (Intro)" 
        };
    } else if (zoneType === 'inside') {
        return { 
            start: drillsStart, 
            end: drillsEnd, 
            maxDur: effDrillsDur, 
            hasLayers: hasDrills,
            key: 'drills', 
            name: "Khu 2: Vòng lặp chính (Drills)" 
        };
    } else if (zoneType === 'after') {
        return { 
            start: outroStart, 
            end: outroEnd, 
            maxDur: effOutroDur, 
            hasLayers: hasOutro,
            key: 'outro', 
            name: "Khu 3: Kết bài (Outro)" 
        };
    } else {
        // 'outside' (Cố định toàn video)
        return { 
            start: 0, 
            end: grandTotal, 
            maxDur: grandTotal, 
            hasLayers: true,
            key: 'total', 
            name: "Cố định toàn video (Xuyên suốt)" 
        };
    }
}

/**
 * Lấy chế độ trình chiếu của một lớp cụ thể
 * Trả về: 'single' | 'stack' | 'all'
 */
function getGroupPresentationMode(grp) {
    if (!grp) return paragraphGridConfig.presentationMode || 'single';
    if (grp.presentationMode && grp.presentationMode !== 'default') {
        return grp.presentationMode;
    }
    return paragraphGridConfig.presentationMode || 'single';
}

