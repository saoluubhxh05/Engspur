/**
 * app.js
 * Điểm khởi tạo ứng dụng, chuyển đổi view/cột, thông báo Toast và sự kiện DOMContentLoaded
 */

function switchLeftSubTab(subTabNum) {
    if (isLeftCollapsed) toggleLeftColumn();

    const titles = [
        "1. Upload Excel & Ảnh",
        "2. Kịch Bản & Nền",
        "3. Kho Thẻ Đối Tượng",
        "4. Định Dạng & Ribbon"
    ];
    const titleEl = document.getElementById('left-col-title');
    if (titleEl) titleEl.innerText = titles[subTabNum - 1];

    for (let i = 1; i <= 4; i++) {
        const btn = document.getElementById(`hdr-subtab-btn-${i}`);
        const panel = document.getElementById(`subtab-panel-${i}`);
        if (i === subTabNum) {
            if (btn) btn.className = "px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap subtab-active";
            if (panel) panel.classList.remove('hidden');
        } else {
            if (btn) btn.className = "px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap text-slate-400 hover:text-white";
            if (panel) panel.classList.add('hidden');
        }
    }

    if (subTabNum === 4) {
        const scrollContainer = document.getElementById('col-left-scroll-container');
        if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        if (typeof renderInspectorRibbon === 'function') {
            renderInspectorRibbon();
        }
    }
}

function activateStudioWorkspace() {
    const vStudio = document.getElementById('view-studio');
    const vBatch = document.getElementById('view-batch-render');
    if (vStudio) vStudio.classList.remove('hidden');
    if (vBatch) vBatch.classList.add('hidden');

    const btnStudio = document.getElementById('tab-paragraph-btn');
    const btnBatch = document.getElementById('tab-batch-btn');
    if (btnStudio) {
        btnStudio.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap bg-indigo-600 text-white shadow-md";
    }
    if (btnBatch) {
        btnBatch.className = "px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition flex items-center space-x-1.5 whitespace-nowrap";
    }

    if (studioSavedBackupState) {
        paragraphGridConfig = JSON.parse(JSON.stringify(studioSavedBackupState.paragraphGridConfig));
        paragraphFieldStyles = JSON.parse(JSON.stringify(studioSavedBackupState.paragraphFieldStyles));
        masterTimelineDuration = studioSavedBackupState.masterTimelineDuration;
        activeParagraphProfileId = studioSavedBackupState.activeParagraphProfileId;
        paragraphSelectedTopic = studioSavedBackupState.paragraphSelectedTopic;

        const durInput = document.getElementById('master-loop-duration-input');
        if (durInput) durInput.value = masterTimelineDuration;

        if (typeof updateLoopPresentationModeUI === 'function') updateLoopPresentationModeUI();
        if (typeof renderSavedParagraphProfilesDropdown === 'function') renderSavedParagraphProfilesDropdown();
        if (typeof renderTimelineLayersListUI === 'function') renderTimelineLayersListUI();
        if (typeof renderTimelineTracksUI === 'function') renderTimelineTracksUI();
        if (typeof renderInspectorRibbon === 'function') renderInspectorRibbon();
        if (typeof syncInlineGridSettingsInputs === 'function') syncInlineGridSettingsInputs();
        if (typeof updateTopicDropdown === 'function') updateTopicDropdown();
    }

    if (isLeftCollapsed) toggleLeftColumn();
    if (isRightCollapsed) toggleRightColumn();
    if (typeof drawParagraphCanvasFrame === 'function') drawParagraphCanvasFrame();
    if (typeof renderTimelineTracksUI === 'function') renderTimelineTracksUI();
    showToast("Đã kích hoạt Studio Timeline & Lưới Bố Cục!");
}

function focusRightColumnGrid() {
    if (isRightCollapsed) toggleRightColumn();
    const panel = document.getElementById('inline-grid-settings-panel');
    if (panel) panel.classList.remove('hidden');
    const scrollCont = document.getElementById('col-right-scroll-container');
    if (scrollCont) scrollCont.scrollTo({ top: 0, behavior: 'smooth' });
    showToast("Đang tập trung cấu hình Lưới Cột & Lề!");
}

function toggleLeftColumn() {
    const col = document.getElementById('col-left');
    const icon = document.getElementById('btn-icon-collapse-left');
    isLeftCollapsed = !isLeftCollapsed;

    if (isLeftCollapsed) {
        col.style.width = '0px';
        col.style.minWidth = '0px';
        col.style.maxWidth = '0px';
        col.style.padding = '0px';
        col.style.border = 'none';
        col.style.overflow = 'hidden';
        if (icon) icon.setAttribute('data-lucide', 'panel-left-open');
    } else {
        col.style.width = '25%';
        col.style.minWidth = '280px';
        col.style.maxWidth = '380px';
        col.style.padding = '';
        col.style.border = '';
        col.style.overflow = '';
        if (icon) icon.setAttribute('data-lucide', 'panel-left-close');
    }
    if (window.lucide && lucide.createIcons) lucide.createIcons();
    setTimeout(() => {
        if (typeof drawParagraphCanvasFrame === 'function') drawParagraphCanvasFrame();
    }, 260);
}

function toggleRightColumn() {
    const col = document.getElementById('col-right');
    const icon = document.getElementById('btn-icon-collapse-right');
    isRightCollapsed = !isRightCollapsed;

    if (isRightCollapsed) {
        col.style.width = '0px';
        col.style.minWidth = '0px';
        col.style.maxWidth = '0px';
        col.style.padding = '0px';
        col.style.border = 'none';
        col.style.overflow = 'hidden';
        if (icon) icon.setAttribute('data-lucide', 'panel-right-open');
    } else {
        col.style.width = '25%';
        col.style.minWidth = '280px';
        col.style.maxWidth = '380px';
        col.style.padding = '';
        col.style.border = '';
        col.style.overflow = '';
        if (icon) icon.setAttribute('data-lucide', 'panel-right-close');
    }
    if (window.lucide && lucide.createIcons) lucide.createIcons();
    setTimeout(() => {
        if (typeof drawParagraphCanvasFrame === 'function') drawParagraphCanvasFrame();
    }, 260);
}

function sanitizeFilename(name) { 
    return String(name).replace(/[\/:*?"<>|]/g, '_').trim(); 
}

function showToast(message, type = "success") {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    const bgClass = type === "success" ? "bg-emerald-950 text-emerald-200 border-emerald-800" : (type === "info" ? "bg-sky-950 text-sky-200 border-sky-800" : "bg-rose-950 text-rose-200 border-rose-800");
    const icon = type === "success" ? "check-circle" : (type === "info" ? "info" : "alert-circle");

    toast.className = `flex items-center space-x-2 px-3 py-2 rounded-xl border shadow-xl text-xs font-semibold pointer-events-auto transition-all transform translate-y-2 opacity-0 ${bgClass}`;
    toast.innerHTML = `<i data-lucide="${icon}" class="w-3.5 h-3.5 shrink-0"></i><span>${message}</span>`;

    container.appendChild(toast);
    if (window.lucide && lucide.createIcons) lucide.createIcons();

    setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 50);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

window.addEventListener('DOMContentLoaded', async () => {
    pCanvas = document.getElementById('paragraph-factory-canvas');
    if (pCanvas) pCtx = pCanvas.getContext('2d');

    // Tạo Canvas ngầm bản Clean (1920x1080)
    pCleanCanvas = document.createElement('canvas');
    pCleanCanvas.width = 1920;
    pCleanCanvas.height = 1080;
    pCleanCtx = pCleanCanvas.getContext('2d');

    if (window.lucide && lucide.createIcons) lucide.createIcons();
    if (typeof initFloatingPopoverDraggable === 'function') initFloatingPopoverDraggable();
    if (typeof populateVoiceList === 'function') populateVoiceList();
    if (typeof renderMailMergeFieldChips === 'function') renderMailMergeFieldChips();
    if (typeof renderTimelineLayersListUI === 'function') renderTimelineLayersListUI();
    if (typeof renderTimelineTracksUI === 'function') renderTimelineTracksUI();
    if (typeof renderInspectorRibbon === 'function') renderInspectorRibbon();
    if (typeof updateTopicDropdown === 'function') updateTopicDropdown();
    if (typeof renderDatasetTable === 'function') renderDatasetTable();
    if (typeof refreshBatchTopicsTable === 'function') refreshBatchTopicsTable();
    if (typeof syncMediaInputsFromConfig === 'function') syncMediaInputsFromConfig();
    if (typeof syncInlineGridSettingsInputs === 'function') syncInlineGridSettingsInputs();

    if (typeof loadFullSystemState === 'function') {
        await loadFullSystemState(false);
    }
    if (typeof drawParagraphCanvasFrame === 'function') {
        drawParagraphCanvasFrame();
    }
});
