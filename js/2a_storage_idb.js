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

// ==========================================
// HỆ THỐNG LỊCH SỬ THAO TÁC & HOÀN TÁC (UNDO / REDO) - TỐI ƯU V15.5
// ==========================================
var studioHistoryStack = [];
var studioHistoryIndex = -1;
var isExecutingHistory = false;
var MAX_HISTORY_STEPS = 20; // Chuẩn hóa 20 bước hoàn tác mượt mà, tiết kiệm 50% RAM

/**
 * Loại bỏ triệt để các chuỗi âm thanh và dữ liệu Base64 kích thước lớn trước khi lưu vào History
 */
function stripHeavyDataForHistory(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => stripHeavyDataForHistory(item));
    }
    const cleanObj = {};
    for (const key of Object.keys(obj)) {
        const val = obj[key];
        // Loại bỏ các chuỗi âm thanh Base64 nặng ẩn trong các field
        if (key === 'customAudioData' || key === 'customAudioBase64' || key === 'audioData' || key === 'audioBase64' || key === 'audioBufferData') {
            continue;
        }
        // Loại bỏ bất kỳ chuỗi Data URI Base64 ẩn nào quá dài (> 250 ký tự)
        if (typeof val === 'string' && val.startsWith('data:') && val.length > 250) {
            continue;
        }
        if (val !== null && typeof val === 'object') {
            cleanObj[key] = stripHeavyDataForHistory(val);
        } else {
            cleanObj[key] = val;
        }
    }
    return cleanObj;
}

function getStudioHistorySnapshot() {
    try {
        const rawSnap = {
            videoConfig: JSON.parse(JSON.stringify(videoConfig)),
            paragraphGridConfig: JSON.parse(JSON.stringify(paragraphGridConfig)),
            paragraphFieldStyles: JSON.parse(JSON.stringify(paragraphFieldStyles)),
            masterTimelineDuration: masterTimelineDuration,
            activeParagraphProfileId: activeParagraphProfileId,
            paragraphSelectedTopic: paragraphSelectedTopic,
            paragraphFilterMode: paragraphFilterMode || 'topic',
            paragraphSelectedGenre: paragraphSelectedGenre || 'ALL',
            importedDatasets: (typeof importedDatasets !== 'undefined' && Array.isArray(importedDatasets)) ? JSON.parse(JSON.stringify(importedDatasets)) : [],
            excelColumnsList: (typeof excelColumnsList !== 'undefined' && Array.isArray(excelColumnsList)) ? JSON.parse(JSON.stringify(excelColumnsList)) : [],
            savedParagraphProfiles: (typeof savedParagraphProfiles !== 'undefined' && Array.isArray(savedParagraphProfiles)) ? JSON.parse(JSON.stringify(savedParagraphProfiles)) : []
        };
        // Làm sạch dữ liệu nặng trước khi đưa vào History Stack
        return stripHeavyDataForHistory(cleanStateForStorage(rawSnap));
    } catch (e) {
        console.warn("History snapshot error:", e);
        return null;
    }
}

function pushStudioHistoryState(force = false) {
    if (isExecutingHistory) return;
    const snap = getStudioHistorySnapshot();
    if (!snap) return;

    const snapStr = JSON.stringify(snap);
    
    // Kiểm tra nếu giống trạng thái hiện tại thì bỏ qua
    if (!force && studioHistoryIndex >= 0 && studioHistoryIndex < studioHistoryStack.length) {
        if (studioHistoryStack[studioHistoryIndex].hash === snapStr) {
            return;
        }
    }

    // Cắt bỏ các nhánh Redo phía sau nếu người dùng đang ở giữa lịch sử và thực hiện thao tác mới
    if (studioHistoryIndex < studioHistoryStack.length - 1) {
        studioHistoryStack = studioHistoryStack.slice(0, studioHistoryIndex + 1);
    }

    // Đẩy snapshot mới vào ngăn xếp
    studioHistoryStack.push({
        data: snap,
        hash: snapStr,
        timestamp: Date.now()
    });

    if (studioHistoryStack.length > MAX_HISTORY_STEPS) {
        studioHistoryStack.shift();
    }

    studioHistoryIndex = studioHistoryStack.length - 1;
    updateUndoRedoButtonsUI();
}

/**
 * Thu hồi bớt ngăn xếp lịch sử cũ để trả lại RAM cho trình duyệt (đặc biệt trước khi Batch Render)
 */
function releaseStudioHistoryMemory() {
    if (studioHistoryStack.length > 5) {
        const startIndex = Math.max(0, studioHistoryIndex - 2);
        studioHistoryStack = studioHistoryStack.slice(startIndex, startIndex + 5);
        studioHistoryIndex = Math.min(studioHistoryStack.length - 1, 2);
        updateUndoRedoButtonsUI();
    }
}

async function applyStudioHistorySnapshot(snap) {
    if (!snap) return;
    isExecutingHistory = true;
    try {
        // Lưu giữ ánh xạ customAudioData đang có trong bộ nhớ để không bị mất khi Hoàn tác
        const activeAudioCache = {};
        if (paragraphGridConfig && Array.isArray(paragraphGridConfig.groups)) {
            paragraphGridConfig.groups.forEach(g => {
                if (Array.isArray(g.fields)) {
                    g.fields.forEach(f => {
                        if (f.customAudioName && f.customAudioData) {
                            activeAudioCache[f.customAudioName] = f.customAudioData;
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
                                if (f.customAudioName && f.customAudioData) {
                                    activeAudioCache[f.customAudioName] = f.customAudioData;
                                }
                            });
                        }
                    });
                }
            });
        }

        if (snap.videoConfig) {
            videoConfig = JSON.parse(JSON.stringify(snap.videoConfig));
        }
        if (snap.paragraphGridConfig) {
            paragraphGridConfig = JSON.parse(JSON.stringify(snap.paragraphGridConfig));
            // Tái liên kết âm thanh custom nếu có
            if (paragraphGridConfig && Array.isArray(paragraphGridConfig.groups)) {
                paragraphGridConfig.groups.forEach(g => {
                    if (Array.isArray(g.fields)) {
                        g.fields.forEach(f => {
                            if (f.customAudioName && !f.customAudioData && activeAudioCache[f.customAudioName]) {
                                f.customAudioData = activeAudioCache[f.customAudioName];
                            }
                        });
                    }
                });
            }
        }
        if (snap.paragraphFieldStyles) {
            paragraphFieldStyles = JSON.parse(JSON.stringify(snap.paragraphFieldStyles));
        }
        if (typeof snap.masterTimelineDuration === 'number') {
            masterTimelineDuration = snap.masterTimelineDuration;
            const durInput = document.getElementById('master-loop-duration-input');
            if (durInput) durInput.value = masterTimelineDuration;
        }
        if (snap.activeParagraphProfileId) {
            activeParagraphProfileId = snap.activeParagraphProfileId;
        }
        if (snap.paragraphSelectedTopic) {
            paragraphSelectedTopic = snap.paragraphSelectedTopic;
        }
        if (snap.paragraphFilterMode) {
            paragraphFilterMode = snap.paragraphFilterMode;
        }
        if (snap.paragraphSelectedGenre) {
            paragraphSelectedGenre = snap.paragraphSelectedGenre;
        }
        if (snap.importedDatasets && Array.isArray(snap.importedDatasets) && snap.importedDatasets.length > 0) {
            importedDatasets = JSON.parse(JSON.stringify(snap.importedDatasets));
        }
        if (snap.excelColumnsList && Array.isArray(snap.excelColumnsList)) {
            excelColumnsList = JSON.parse(JSON.stringify(snap.excelColumnsList));
        }
        if (snap.savedParagraphProfiles && Array.isArray(snap.savedParagraphProfiles)) {
            savedParagraphProfiles = JSON.parse(JSON.stringify(snap.savedParagraphProfiles));
            savedParagraphProfiles.forEach(prof => {
                if (prof && Array.isArray(prof.groups)) {
                    prof.groups.forEach(g => {
                        if (Array.isArray(g.fields)) {
                            g.fields.forEach(f => {
                                if (f.customAudioName && !f.customAudioData && activeAudioCache[f.customAudioName]) {
                                    f.customAudioData = activeAudioCache[f.customAudioName];
                                }
                            });
                        }
                    });
                }
            });
        }

        // Đồng bộ toàn diện các giao diện
        if (typeof syncMediaInputsFromConfig === 'function') syncMediaInputsFromConfig();
        if (typeof renderSavedParagraphProfilesDropdown === 'function') renderSavedParagraphProfilesDropdown();
        if (typeof renderMailMergeFieldChips === 'function') renderMailMergeFieldChips();
        if (typeof renderTimelineLayersListUI === 'function') renderTimelineLayersListUI();
        if (typeof renderTimelineTracksUI === 'function') renderTimelineTracksUI();
        if (typeof renderInspectorRibbon === 'function') renderInspectorRibbon();
        if (typeof updateTopicDropdown === 'function') updateTopicDropdown();
        if (typeof renderDatasetTable === 'function') renderDatasetTable();
        if (typeof refreshBatchTopicsTable === 'function') refreshBatchTopicsTable();
        if (typeof syncInlineGridSettingsInputs === 'function') syncInlineGridSettingsInputs();
        if (typeof drawParagraphCanvasFrame === 'function') drawParagraphCanvasFrame();

        // Tự động lưu ngầm xuống IndexedDB (không đẩy history mới)
        await saveFullSystemState(false);
    } catch (err) {
        console.error("Error applying history snapshot:", err);
    } finally {
        isExecutingHistory = false;
        updateUndoRedoButtonsUI();
    }
}

async function executeStudioUndo() {
    if (isExecutingHistory) return;
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
    }

    if (studioHistoryIndex <= 0) {
        showToast("Không còn thao tác trước đó để Hoàn tác (Undo)");
        return;
    }

    studioHistoryIndex--;
    const targetState = studioHistoryStack[studioHistoryIndex];
    if (targetState && targetState.data) {
        await applyStudioHistorySnapshot(targetState.data);
        showToast("Đã hoàn tác (Undo) thành công!");
    }
}

async function executeStudioRedo() {
    if (isExecutingHistory) return;
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
    }

    if (studioHistoryIndex >= studioHistoryStack.length - 1) {
        showToast("Không có thao tác nào để Làm lại (Redo)");
        return;
    }

    studioHistoryIndex++;
    const targetState = studioHistoryStack[studioHistoryIndex];
    if (targetState && targetState.data) {
        await applyStudioHistorySnapshot(targetState.data);
        showToast("Đã làm lại (Redo) thành công!");
    }
}

function updateUndoRedoButtonsUI() {
    const canUndo = studioHistoryIndex > 0;
    const canRedo = studioHistoryIndex >= 0 && studioHistoryIndex < studioHistoryStack.length - 1;

    const btnUndo = document.getElementById('btn-studio-undo');
    const btnRedo = document.getElementById('btn-studio-redo');
    const btnUndoMob = document.getElementById('btn-studio-undo-mob');
    const btnRedoMob = document.getElementById('btn-studio-redo-mob');

    [btnUndo, btnUndoMob].forEach(btn => {
        if (!btn) return;
        btn.disabled = !canUndo;
        if (canUndo) {
            btn.classList.remove('opacity-40', 'cursor-not-allowed', 'text-slate-400');
            btn.classList.add('text-slate-200', 'hover:text-white', 'cursor-pointer');
        } else {
            btn.classList.add('opacity-40', 'cursor-not-allowed', 'text-slate-400');
            btn.classList.remove('text-slate-200', 'hover:text-white', 'cursor-pointer');
        }
    });

    [btnRedo, btnRedoMob].forEach(btn => {
        if (!btn) return;
        btn.disabled = !canRedo;
        if (canRedo) {
            btn.classList.remove('opacity-40', 'cursor-not-allowed', 'text-slate-400');
            btn.classList.add('text-slate-200', 'hover:text-white', 'cursor-pointer');
        } else {
            btn.classList.add('opacity-40', 'cursor-not-allowed', 'text-slate-400');
            btn.classList.remove('text-slate-200', 'hover:text-white', 'cursor-pointer');
        }
    });
}

var hasPendingAutoSave = false;

function triggerAutoSave(immediate = false) {
    if (isExecutingHistory) return;
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
    }
    if (immediate) {
        pushStudioHistoryState();
        saveFullSystemState(false);
    } else {
        updateAutoSaveStatusBadge("Đang lưu...");
        // Tối ưu V15.5: Nâng debounce lên 1000ms giúp gom nhóm các thao tác kéo trượt/gõ chữ liên tục, chống giật khựng Canvas
        autoSaveTimer = setTimeout(() => {
            pushStudioHistoryState();
            saveFullSystemState(false);
        }, 1000);
    }
}

function updateAutoSaveStatusBadge(text) {
    const badge = document.getElementById('hdr-autosave-status');
    if (badge) {
        badge.innerText = text;
        badge.classList.remove('opacity-0');
        if (text === "Đã tự động lưu" || text === "Đã lưu an toàn") {
            setTimeout(() => {
                if (badge.innerText === "Đã tự động lưu" || badge.innerText === "Đã lưu an toàn") {
                    badge.classList.add('opacity-0');
                }
            }, 2500);
        }
    }
}

function cleanStateForStorage(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    try {
        return JSON.parse(JSON.stringify(obj, (key, value) => {
            // Loại bỏ các thuộc tính nội bộ hoặc đối tượng không tuần tự hóa được
            if (key.startsWith('_') && key.includes('Buffer')) return undefined;
            if (value instanceof AudioBuffer) return undefined;
            if (value instanceof AudioContext || value instanceof BaseAudioContext) return undefined;
            if (value instanceof AudioNode) return undefined;
            return value;
        }));
    } catch (e) {
        return obj;
    }
}

async function saveFullSystemState(showToastMsg = true) {
    if (isAutoSaving) {
        hasPendingAutoSave = true;
        return;
    }
    isAutoSaving = true;
    try {
        const targetPracticeMode = document.getElementById('batch-target-practice-mode')?.value || 'mode3';
        const namingPattern = document.getElementById('batch-naming-pattern-input')?.value || '{stt}-[{script}]-[{topic}]';
        const separateOutputType = document.getElementById('batch-separate-output-type')?.value || 'per_script';

        const rawState = {
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
            batchTargetPracticeMode: targetPracticeMode,
            batchNamingPattern: namingPattern,
            batchNamingPresets: (typeof batchNamingPresets !== 'undefined') ? batchNamingPresets : [],
            batchSeparateOutputType: separateOutputType,
            batchSelectedChainProfiles: (typeof batchSelectedChainProfiles !== 'undefined') ? batchSelectedChainProfiles : [],
            batchCustomScriptNamingMap: (typeof batchCustomScriptNamingMap !== 'undefined') ? batchCustomScriptNamingMap : {},
            masterTimelineDuration,
            batchDirectoryHandle: batchDirectoryHandle || null,
            batchDirectoryName: batchDirectoryName || ''
        };
        const state = cleanStateForStorage(rawState);
        
        try {
            await idbSet("saved_state", state);
            updateAutoSaveStatusBadge("Đã tự động lưu");
            if (showToastMsg) {
                showToast("Đã lưu toàn bộ dữ liệu & cấu hình vào máy!");
            }
        } catch (idbErr) {
            console.warn("Lưu đầy đủ gặp lỗi quota, kích hoạt chế độ Lưu An Toàn Cứu Hộ (Emergency Safe Save):", idbErr);
            // Tối ưu V15.5: Khi IndexedDB chạm ngưỡng giới hạn dung lượng do nhiều ảnh Base64,
            // tự động tách bỏ ảnh Base64 để bảo toàn 100% kịch bản, lưới cột, timeline và Excel chữ!
            const emergencyState = { ...state };
            emergencyState.localPCImageBase64Map = {};
            emergencyState.canvasBgBase64 = "";
            emergencyState.canvasBadgeBase64 = "";
            emergencyState._isEmergencySafeSave = true;
            try {
                await idbSet("saved_state", emergencyState);
                updateAutoSaveStatusBadge("Đã lưu an toàn");
                if (showToastMsg) {
                    showToast("Bộ nhớ trình duyệt gần đầy: Đã ưu tiên lưu an toàn 100% kịch bản & dữ liệu!", "info");
                }
            } catch (innerErr) {
                console.error("Emergency save error:", innerErr);
                updateAutoSaveStatusBadge("Lỗi lưu");
            }
        }
    } catch (err) {
        console.error("AutoSave Error:", err);
        updateAutoSaveStatusBadge("Lỗi lưu");
    } finally {
        isAutoSaving = false;
        if (hasPendingAutoSave) {
            hasPendingAutoSave = false;
            setTimeout(() => {
                saveFullSystemState(false);
            }, 300);
        }
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
            if (saved.batchTargetPracticeMode) {
                const targetModeEl = document.getElementById('batch-target-practice-mode');
                if (targetModeEl) targetModeEl.value = saved.batchTargetPracticeMode;
                const chainPanel = document.getElementById('batch-chain-selector-panel');
                if (chainPanel) {
                    if (saved.batchTargetPracticeMode === 'mode3_chain') {
                        chainPanel.classList.remove('hidden');
                    } else {
                        chainPanel.classList.add('hidden');
                    }
                }
            }
            if (saved.batchNamingPattern) {
                const patInput = document.getElementById('batch-naming-pattern-input');
                if (patInput) patInput.value = saved.batchNamingPattern;
            }
            if (saved.batchNamingPresets && Array.isArray(saved.batchNamingPresets) && saved.batchNamingPresets.length > 0) {
                batchNamingPresets = saved.batchNamingPresets;
            }
            if (saved.batchSeparateOutputType) {
                const sepSelect = document.getElementById('batch-separate-output-type');
                if (sepSelect) sepSelect.value = saved.batchSeparateOutputType;
            }
            if (saved.batchSelectedChainProfiles && Array.isArray(saved.batchSelectedChainProfiles)) {
                batchSelectedChainProfiles = saved.batchSelectedChainProfiles;
            }
            if (saved.batchCustomScriptNamingMap) {
                batchCustomScriptNamingMap = saved.batchCustomScriptNamingMap;
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
            if (typeof renderBatchChainSelectorList === 'function') renderBatchChainSelectorList();
            if (typeof updateBatchNamingPreview === 'function') updateBatchNamingPreview();
            syncInlineGridSettingsInputs();
            drawParagraphCanvasFrame();

            pushStudioHistoryState(true);
            updateUndoRedoButtonsUI();

            if (saved._isEmergencySafeSave) {
                showToast("Đã khôi phục toàn bộ kịch bản & dữ liệu an toàn!", "info");
            } else if (isManual) {
                showToast("Đã khôi phục dữ liệu hoàn chỉnh!");
            }
        } else {
            // Chưa có dữ liệu hoặc bộ nhớ trống -> Nạp bộ dữ liệu mẫu đầy đủ để dùng thử ngay
            await loadRichDemoDataset(false);
            pushStudioHistoryState(true);
            updateUndoRedoButtonsUI();
        }
    } catch(e) {
        console.error("Load state error", e);
        await loadRichDemoDataset(false);
        pushStudioHistoryState(true);
        updateUndoRedoButtonsUI();
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
