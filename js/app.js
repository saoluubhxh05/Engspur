/**
 * app.js
 * Điểm khởi tạo ứng dụng, chuyển đổi view/cột, điều hướng di động, thông báo Toast và sự kiện DOMContentLoaded
 */

var currentMobileTab = 'center';

function syncMobileNavState(tab) {
    const tabs = ['studio', 'data', 'grid', 'batch', 'tools'];
    const tabMap = {
        'center': 'studio',
        'left': 'data',
        'right': 'grid',
        'batch': 'batch'
    };
    const activeNavKey = tabMap[tab] || tab;

    tabs.forEach(tKey => {
        const btn = document.getElementById(`mob-nav-${tKey}`);
        if (!btn) return;
        const iconDiv = btn.querySelector('div');
        if (tKey === activeNavKey) {
            btn.className = "flex flex-col items-center justify-center flex-1 py-1 text-indigo-400 font-bold text-[10px] transition active:scale-95 mob-nav-active";
            if (iconDiv) iconDiv.className = "p-1 rounded-lg bg-indigo-600/30 text-indigo-300";
        } else {
            btn.className = "flex flex-col items-center justify-center flex-1 py-1 text-slate-400 font-bold text-[10px] transition active:scale-95";
            if (iconDiv) iconDiv.className = "p-1 rounded-lg text-slate-400";
        }
    });
}

function switchMobileTab(tab) {
    currentMobileTab = tab;
    syncMobileNavState(tab);

    const vStudio = document.getElementById('view-studio');
    const vBatch = document.getElementById('view-batch-render');

    if (tab === 'batch') {
        if (typeof activateBatchRenderView === 'function') {
            activateBatchRenderView();
        }
        return;
    }

    if (vStudio) {
        vStudio.classList.remove('hidden');
        vStudio.classList.remove('mobile-show-center', 'mobile-show-left', 'mobile-show-right');
        vStudio.classList.add(`mobile-show-${tab}`);
    }
    if (vBatch) {
        vBatch.classList.add('hidden');
    }

    const btnStudio = document.getElementById('tab-paragraph-btn');
    const btnBatch = document.getElementById('tab-batch-btn');
    if (btnStudio) {
        btnStudio.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap bg-indigo-600 text-white shadow-md";
    }
    if (btnBatch) {
        btnBatch.className = "px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition flex items-center space-x-1.5 whitespace-nowrap";
    }

    if (tab === 'center') {
        setTimeout(() => {
            if (typeof drawParagraphCanvasFrame === 'function') drawParagraphCanvasFrame();
            if (typeof renderTimelineTracksUI === 'function') renderTimelineTracksUI();
        }, 60);
    } else if (tab === 'left') {
        setTimeout(() => {
            if (typeof renderMailMergeFieldChips === 'function') renderMailMergeFieldChips();
            if (typeof renderInspectorRibbon === 'function') renderInspectorRibbon();
        }, 60);
    } else if (tab === 'right') {
        setTimeout(() => {
            if (typeof renderTimelineLayersListUI === 'function') renderTimelineLayersListUI();
            if (typeof syncInlineGridSettingsInputs === 'function') syncInlineGridSettingsInputs();
        }, 60);
    }
}

function openMobileQuickActionsSheet() {
    const modal = document.getElementById('mobile-quick-actions-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    if (window.lucide && lucide.createIcons) lucide.createIcons();
}

function closeMobileQuickActionsSheet() {
    const modal = document.getElementById('mobile-quick-actions-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function switchLeftSubTab(subTabNum) {
    if (isLeftCollapsed) toggleLeftColumn();

    // Nếu đang trên di động và đang xem màn hình khác, tự động chuyển về tab Dữ liệu
    if (window.innerWidth < 1024 && currentMobileTab !== 'left') {
        switchMobileTab('left');
    }

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
        const mobBtn = document.getElementById(`mob-subtab-btn-${i}`);
        const panel = document.getElementById(`subtab-panel-${i}`);
        if (i === subTabNum) {
            if (btn) btn.className = "px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap subtab-active";
            if (mobBtn) mobBtn.className = "px-2.5 py-1 rounded-lg text-[10px] font-bold subtab-active whitespace-nowrap";
            if (panel) panel.classList.remove('hidden');
        } else {
            if (btn) btn.className = "px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap text-slate-400 hover:text-white";
            if (mobBtn) mobBtn.className = "px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white whitespace-nowrap";
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
    if (vStudio) {
        vStudio.classList.remove('hidden');
        if (window.innerWidth < 1024) {
            vStudio.classList.remove('mobile-show-left', 'mobile-show-right');
            vStudio.classList.add('mobile-show-center');
            currentMobileTab = 'center';
        }
    }
    if (vBatch) vBatch.classList.add('hidden');
    syncMobileNavState('center');

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

    if (window.innerWidth >= 1024) {
        if (isLeftCollapsed) toggleLeftColumn();
        if (isRightCollapsed) toggleRightColumn();
    }
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

function openVersionChangelogModal() {
    renderVersionChangelogModal();
    const modal = document.getElementById('version-changelog-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
    if (window.lucide && lucide.createIcons) lucide.createIcons();
}

function closeVersionChangelogModal() {
    const modal = document.getElementById('version-changelog-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function renderVersionChangelogModal() {
    const container = document.getElementById('version-changelog-body');
    if (!container) return;
    
    const info = (typeof APP_VERSION_INFO !== 'undefined') ? APP_VERSION_INFO : {
        version: "V13.2",
        releaseDate: "13/09/2026",
        status: "Mới nhất & Ổn định",
        summary: "Bản nâng cấp V13.2: Đồng bộ toàn diện các thông số và tùy chọn của Tab 3 (Render Hàng Loạt) vào nút 'Xuất File' JSON và hệ thống lưu trữ IndexedDB, khôi phục nguyên vẹn 100% khi nhập lại.",
        categories: [],
        history: []
    };

    const verTag = document.getElementById('modal-version-tag');
    if (verTag) verTag.innerText = info.version;
    const verDate = document.getElementById('modal-version-date');
    if (verDate) verDate.innerText = `Cập nhật: ${info.releaseDate} • Trạng thái: ${info.status}`;

    let html = `
        <!-- Tóm tắt phiên bản -->
        <div class="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-3.5 space-y-1.5 shadow-sm">
            <div class="flex items-center justify-between">
                <span class="text-[11px] font-black text-indigo-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <i data-lucide="award" class="w-4 h-4 text-amber-400"></i>
                    <span>Tóm Tắt Bản Phát Hành</span>
                </span>
                <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">● ${info.status}</span>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed">${info.summary}</p>
        </div>

        <!-- Chi tiết các hạng mục nâng cấp -->
        <div class="space-y-3 pt-1">
            <div class="flex items-center space-x-1.5">
                <i data-lucide="sparkles" class="w-4 h-4 text-amber-400"></i>
                <h3 class="text-xs font-black text-white uppercase tracking-wider">Nội Dung Đã Cập Nhật Ở Phiên Bản Này (${info.version})</h3>
            </div>
    `;

    if (info.categories && info.categories.length > 0) {
        info.categories.forEach(cat => {
            html += `
                <div class="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 space-y-2">
                    <div class="flex items-center space-x-2">
                        <div class="p-1.5 rounded-lg border ${cat.color}">
                            <i data-lucide="${cat.icon}" class="w-3.5 h-3.5"></i>
                        </div>
                        <h4 class="text-xs font-bold text-white">${cat.title}</h4>
                    </div>
                    <ul class="space-y-1.5 pl-2">
            `;
            cat.items.forEach(item => {
                html += `
                    <li class="flex items-start space-x-2 text-[11px] text-slate-300 leading-normal">
                        <span class="text-emerald-400 font-bold mt-0.5 shrink-0">✓</span>
                        <span>${item}</span>
                    </li>
                `;
            });
            html += `
                    </ul>
                </div>
            `;
        });
    }

    // Lịch sử các phiên bản trước
    if (info.history && info.history.length > 0) {
        html += `
            <div class="pt-2">
                <details class="group bg-slate-950/50 border border-slate-800/70 rounded-2xl overflow-hidden transition">
                    <summary class="p-3 text-xs font-bold text-slate-400 hover:text-white cursor-pointer flex items-center justify-between select-none">
                        <span class="flex items-center space-x-2">
                            <i data-lucide="history" class="w-3.5 h-3.5 text-indigo-400"></i>
                            <span>Lịch Sử Các Phiên Bản Trước</span>
                        </span>
                        <span class="text-[10px] text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div class="p-3 pt-0 space-y-2 border-t border-slate-800/60 mt-1">
        `;
        info.history.forEach(h => {
            html += `
                <div class="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] space-y-0.5">
                    <div class="flex items-center justify-between">
                        <span class="font-extrabold text-indigo-300">${h.version}</span>
                        <span class="text-[10px] text-slate-500">${h.date}</span>
                    </div>
                    <p class="text-slate-400 text-[11px] leading-relaxed">${h.highlight}</p>
                </div>
            `;
        });
        html += `
                    </div>
                </details>
            </div>
        `;
    }

    html += `</div>`;
    container.innerHTML = html;
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeVersionChangelogModal();
        if (typeof closeExportWorkspaceModal === 'function') closeExportWorkspaceModal();
        if (typeof closeSaveFileModal === 'function') closeSaveFileModal();
        if (typeof closeFloatingPopover === 'function') closeFloatingPopover();
        if (typeof closeBatchNamingPopover === 'function') closeBatchNamingPopover();
    }

    // Phím tắt Studio Hoàn tác (Ctrl+Z) và Làm lại (Ctrl+Y / Ctrl+Shift+Z)
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    if (modifier) {
        const activeTag = document.activeElement ? document.activeElement.tagName : '';
        const isEditable = document.activeElement && (
            activeTag === 'TEXTAREA' || 
            (activeTag === 'INPUT' && ['text', 'search', 'email', 'url', 'password', 'number'].includes(document.activeElement.type)) ||
            document.activeElement.isContentEditable
        );

        // Ctrl + Z (Undo)
        if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
            if (!isEditable && typeof executeStudioUndo === 'function') {
                e.preventDefault();
                executeStudioUndo();
            }
        }
        // Ctrl + Y hoặc Ctrl + Shift + Z (Redo)
        else if ((e.key.toLowerCase() === 'y' && !e.shiftKey) || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
            if (!isEditable && typeof executeStudioRedo === 'function') {
                e.preventDefault();
                executeStudioRedo();
            }
        }
    }
});

window.addEventListener('DOMContentLoaded', async () => {
    pCanvas = document.getElementById('paragraph-factory-canvas');
    if (pCanvas) pCtx = pCanvas.getContext('2d');

    // Tạo Canvas ngầm bản Clean (1920x1080)
    pCleanCanvas = document.createElement('canvas');
    pCleanCanvas.width = 1920;
    pCleanCanvas.height = 1080;
    pCleanCtx = pCleanCanvas.getContext('2d');

    const headerVerTag = document.getElementById('app-header-version-tag');
    if (headerVerTag && typeof APP_VERSION_INFO !== 'undefined') {
        headerVerTag.innerText = APP_VERSION_INFO.version;
    }

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
    if (typeof renderBatchNamingExcelFields === 'function') renderBatchNamingExcelFields();
    if (typeof updateBatchNamingPreview === 'function') updateBatchNamingPreview();
    if (typeof syncMediaInputsFromConfig === 'function') syncMediaInputsFromConfig();
    if (typeof syncInlineGridSettingsInputs === 'function') syncInlineGridSettingsInputs();

    if (typeof loadFullSystemState === 'function') {
        await loadFullSystemState(false);
    }
    if (typeof updateUndoRedoButtonsUI === 'function') {
        updateUndoRedoButtonsUI();
    }
    if (window.lucide && lucide.createIcons) {
        lucide.createIcons();
    }
    if (typeof drawParagraphCanvasFrame === 'function') {
        drawParagraphCanvasFrame();
    }
});
