/**
 * 2a_storage_idb.js
 * Quản lý kết nối IndexedDB, tự động lưu (Auto-Save) và khôi phục trạng thái hệ thống
 */

const DB_NAME = "EngSpurStudioDB_v127";
const DB_VERSION = 1;
const STORE_NAME = "system_full_state";

function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function idbSet(key, value) {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function idbGet(key) {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

var autoSaveTimer = null;
var isAutoSaving = false;

function triggerAutoSave(immediate = false) {
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
    }
    if (immediate) {
        saveFullSystemState(false);
    } else {
        updateAutoSaveStatusBadge("Đang lưu...");
        autoSaveTimer = setTimeout(() => {
            saveFullSystemState(false);
        }, 700);
    }
}

function updateAutoSaveStatusBadge(text) {
    const badge = document.getElementById('hdr-autosave-status');
    if (badge) {
        badge.innerText = text;
        badge.classList.remove('opacity-0');
        if (text === "Đã tự động lưu") {
            setTimeout(() => {
                if (badge.innerText === "Đã tự động lưu") {
                    badge.classList.add('opacity-0');
                }
            }, 2500);
        }
    }
}

async function saveFullSystemState(showToastMsg = true) {
    if (isAutoSaving) return;
    isAutoSaving = true;
    try {
        const state = {
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
            paragraphFilterMode: paragraphFilterMode || 'topic',
            paragraphSelectedGenre: paragraphSelectedGenre || 'ALL',
            batchGroupingMode: batchGroupingMode || 'topic',
            masterTimelineDuration,
            batchDirectoryHandle: batchDirectoryHandle || null,
            batchDirectoryName: batchDirectoryName || ''
        };
        await idbSet("saved_state", state);
        updateAutoSaveStatusBadge("Đã tự động lưu");
        if (showToastMsg) {
            showToast("Đã lưu toàn bộ dữ liệu & cấu hình vào máy!");
        }
    } catch (err) {
        console.error("AutoSave Error:", err);
        updateAutoSaveStatusBadge("Lỗi lưu");
    } finally {
        isAutoSaving = false;
    }
}

async function loadFullSystemState(isManual = false) {
    try {
        const saved = await idbGet("saved_state");
        if (saved) {
            if (saved.importedDatasets && saved.importedDatasets.length > 0) {
                importedDatasets = saved.importedDatasets;
            }
            if (saved.excelColumnsList && saved.excelColumnsList.length > 0) {
                excelColumnsList = saved.excelColumnsList;
            }
            if (saved.videoConfig) {
                videoConfig = { ...videoConfig, ...saved.videoConfig };
            }
            if (saved.savedParagraphProfiles && saved.savedParagraphProfiles.length > 0) {
                savedParagraphProfiles = saved.savedParagraphProfiles;
            }
            if (saved.activeParagraphProfileId) {
                activeParagraphProfileId = saved.activeParagraphProfileId;
            }
            if (saved.paragraphGridConfig) {
                paragraphGridConfig = saved.paragraphGridConfig;
            }
            if (saved.paragraphFieldStyles) {
                paragraphFieldStyles = saved.paragraphFieldStyles;
            }
            if (saved.paragraphSelectedTopic) {
                paragraphSelectedTopic = saved.paragraphSelectedTopic;
            }
            if (saved.paragraphFilterMode) {
                paragraphFilterMode = saved.paragraphFilterMode;
            }
            if (saved.paragraphSelectedGenre) {
                paragraphSelectedGenre = saved.paragraphSelectedGenre;
            }
            if (saved.batchGroupingMode) {
                batchGroupingMode = saved.batchGroupingMode;
                const batchGrpSelect = document.getElementById('batch-grouping-mode-select');
                if (batchGrpSelect) batchGrpSelect.value = batchGroupingMode;
                const headerElem = document.getElementById('batch-table-header-group');
                if (headerElem) {
                    headerElem.innerText = (batchGroupingMode === 'genre') ? 'Thể Loại (Genre)' : 'Chủ Đề (Topic)';
                }
            }
            if (saved.masterTimelineDuration) {
                masterTimelineDuration = saved.masterTimelineDuration;
                if (document.getElementById('master-loop-duration-input')) {
                    document.getElementById('master-loop-duration-input').value = masterTimelineDuration;
                }
            }
            if (saved.localPCImageBase64Map) {
                localPCImageBase64Map = saved.localPCImageBase64Map;
                localPCImageMap = {};
                Object.keys(localPCImageBase64Map).forEach(key => {
                    const img = new Image();
                    img.src = localPCImageBase64Map[key];
                    localPCImageMap[key] = img;
                });
                const pcBadge = document.getElementById('pc-image-badge');
                if (pcBadge) pcBadge.innerText = `${Object.keys(localPCImageMap).length} Ảnh Local`;
            }
            if (saved.canvasBgBase64) {
                canvasBgBase64 = saved.canvasBgBase64;
                const bgImg = new Image();
                bgImg.src = canvasBgBase64;
                bgImg.onload = () => {
                    canvasBgImage = bgImg;
                    drawParagraphCanvasFrame();
                };
            }
            if (saved.canvasBadgeBase64) {
                canvasBadgeBase64 = saved.canvasBadgeBase64;
                const bdImg = new Image();
                bdImg.src = canvasBadgeBase64;
                bdImg.onload = () => {
                    canvasBadgeImage = bdImg;
                    drawParagraphCanvasFrame();
                };
            }

            if (saved.batchDirectoryHandle) {
                batchDirectoryHandle = saved.batchDirectoryHandle;
            }
            if (saved.batchDirectoryName) {
                batchDirectoryName = saved.batchDirectoryName;
                const pathText = document.getElementById('batch-output-path-text');
                if (pathText) {
                    pathText.innerText = `Thư mục lưu: ${batchDirectoryName} (Đã sẵn sàng ghi trực tiếp)`;
                    pathText.classList.remove('text-amber-400');
                    pathText.classList.add('text-emerald-400');
                }
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

            if (isManual) showToast("Đã khôi phục dữ liệu hoàn chỉnh!");
        } else {
            // Chưa có dữ liệu hoặc bộ nhớ trống -> Nạp bộ dữ liệu mẫu đầy đủ để dùng thử ngay
            await loadRichDemoDataset(false);
        }
    } catch(e) {
        console.error("Load state error", e);
        await loadRichDemoDataset(false);
    }
}

async function clearAllUploadedData() {
    if (!confirm("Bạn có chắc muốn xóa sạch dữ liệu Excel và toàn bộ ảnh local đã upload?")) return;
    importedDatasets = [];
    localPCImageBase64Map = {};
    localPCImageMap = {};
    excelColumnsList = [
        "STT", "STT Mẫu", "Chủ đề", "Mẫu câu", "Từ gợi mở", "Câu hỏi cho mẫu câu", "Từ nối",
        "Substitution words", "Dịch Substitution words", "Substitution Drills",
        "Phiên âm IPA", "Dịch Substitution Drills", "Minh họa", "ten_file_dinh_kem"
    ];
    const pcBadge = document.getElementById('pc-image-badge');
    if (pcBadge) pcBadge.innerText = `0 Ảnh Local`;
    renderDatasetTable();
    renderMailMergeFieldChips();
    refreshBatchTopicsTable();
    updateTopicDropdown();
    drawParagraphCanvasFrame();
    await saveFullSystemState();
    showToast("Đã xóa sạch Excel và ảnh đã upload!");
}

async function saveUploadedDataPermanently() {
    await saveFullSystemState();
    showToast("Đã lưu vĩnh viễn Excel và ảnh vào trình duyệt! Lần sau mở ra dùng ngay.");
}
