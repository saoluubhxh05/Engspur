/**
 * 8c_batch_exporter.js
 * Quản lý xuất báo cáo Excel 2 Sheet (Tổng quan + Chi tiết Timeline mili-giây) và File Picker API lưu file
 */

function exportBatchExcelReport() {
    if (batchCompletedReports.length === 0) {
        showToast("Chưa có dữ liệu hoàn thành để xuất báo cáo!", "info");
        return;
    }
    const wb = XLSX.utils.book_new();

    // SHEET 1: TỔNG QUAN VIDEO
    const wsOverview = XLSX.utils.json_to_sheet(batchCompletedReports.map(r => ({
        "STT": r.stt,
        "Kịch Bản": r.scriptName,
        "Thể Loại": r.genre || "Chung",
        "Chủ Đề": r.topic,
        "Tên File Video": r.filename,
        "File Audio Kèm Theo": r.audioFilename,
        "Số Mẫu Câu": r.patternsCount,
        "Tổng Drills": r.drillsCount,
        "Thời Lượng Video (ms)": r.durationMs,
        "Thời Lượng (Giây)": r.durationSec,
        "Dung Lượng (MB)": r.fileSizeMb,
        "Trạng Thái": r.status
    })));
    XLSX.utils.book_append_sheet(wb, wsOverview, "Tổng Quan Video");

    // SHEET 2: CHI TIẾT TIMELINE (CHUẨN TỪNG MILLISECOND)
    const wsTimeline = XLSX.utils.json_to_sheet(batchTimelineSentenceLogs.map((log) => ({
        "STT Dòng": log.stt,
        "Kịch Bản": log.scriptName,
        "Thể Loại": log.genre || "Chung",
        "Chủ Đề": log.topic,
        "Thứ Tự Câu": log.sentenceIdx,
        "Từ Gợi Mở (Cue)": log.cueWord,
        "Câu Luyện Tập (Drill)": log.drillText,
        "Bắt Đầu (ms)": log.startMs,
        "Kết Thúc (ms)": log.endMs,
        "Thời Lượng (ms)": log.durationMs
    })));
    XLSX.utils.book_append_sheet(wb, wsTimeline, "Chi Tiết Timeline");

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `EngSpur_Batch_Detailed_Report_${dateStr}.xlsx`);
    showToast("Đã xuất và tải file Excel báo cáo 2 Sheet chuẩn xác từng mili-giây!", "success");
}

async function triggerFilePickerSave() {
    const blob = pRenderedBlob;
    if (!blob) return;
    const ext = 'mp4';

    if (window.showSaveFilePicker) {
        try {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: `EngSpur_Video_${Date.now()}.${ext}`,
                types: [{ description: 'Video MP4 File', accept: { 'video/*': [`.${ext}`] } }]
            });
            const writableStream = await fileHandle.createWritable();
            await writableStream.write(blob);
            await writableStream.close();
            closeSaveFileModal();
            showToast("Đã lưu video thành công vào máy tính!");
        } catch(e) {
            if (e.name !== 'AbortError') downloadBlobFallback(blob, `EngSpur_Video_${Date.now()}.${ext}`);
            closeSaveFileModal();
        }
    } else {
        downloadBlobFallback(blob, `EngSpur_Video_${Date.now()}.${ext}`);
        closeSaveFileModal();
    }
}
