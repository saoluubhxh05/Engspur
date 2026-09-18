/**
 * 4_canvas_renderer.js
 * Lõi render đồ họa 1920x1080, bố cục lưới cột, card box auto-flow và khung ảnh
 */

var miniBatchFrameCounter = 0;
var canvasCustomTextHitBoxes = [];
var canvasFieldHitBoxes = [];

function ensureCanvasClickListener() {
    if (pCanvas && !pCanvas.__hasCustomTextClickListener) {
        pCanvas.__hasCustomTextClickListener = true;
        pCanvas.addEventListener('click', (e) => {
            const rect = pCanvas.getBoundingClientRect();
            if (!rect || rect.width === 0 || rect.height === 0) return;
            const scaleX = pCanvas.width / rect.width;
            const scaleY = pCanvas.height / rect.height;
            const clickX = (e.clientX - rect.left) * scaleX;
            const clickY = (e.clientY - rect.top) * scaleY;

            // 1. Hit-test Thẻ Chữ Tự Do
            for (let i = canvasCustomTextHitBoxes.length - 1; i >= 0; i--) {
                const hb = canvasCustomTextHitBoxes[i];
                if (clickX >= hb.x && clickX <= hb.x + hb.w && clickY >= hb.y && clickY <= hb.y + hb.h) {
                    if (typeof selectCustomTextItem === 'function') {
                        selectCustomTextItem(hb.gIdx, hb.fIdx);
                    }
                    return;
                }
            }

            // 2. Hit-test Các Thẻ Trường Mail Merge / Khung Ảnh
            for (let i = canvasFieldHitBoxes.length - 1; i >= 0; i--) {
                const fb = canvasFieldHitBoxes[i];
                if (clickX >= fb.x && clickX <= fb.x + fb.w && clickY >= fb.y && clickY <= fb.y + fb.h) {
                    if (typeof selectLayerFieldItem === 'function') {
                        selectLayerFieldItem(fb.gIdx, fb.fKey, e);
                    } else if (typeof toggleSelectFieldMulti === 'function') {
                        paragraphSelectedGroupIdx = fb.gIdx;
                        toggleSelectFieldMulti(fb.fKey, e);
                    }
                    return;
                }
            }
        });
    }
}

function estimateFieldItemHeight(ctx, fKey, dataMap, groupW, isInside, sentenceDataMaps, scaleFactor = 1.0) {
    const st = paragraphFieldStyles[fKey];
    if (!st) return 0;
    if (st.type === 'image') {
        const baseH = st.height !== undefined ? st.height : 360;
        return Math.max(80, Math.round(baseH * scaleFactor));
    }
    const rawVal = (!isInside && sentenceDataMaps && sentenceDataMaps[0]) ? sentenceDataMaps[0][fKey] : (dataMap ? dataMap[fKey] : '');
    const val = (rawVal !== undefined && rawVal !== null) ? String(rawVal).trim() : '';
    if (!val) return 0;

    let size = Math.max(12, Math.round((st.size || 28) * scaleFactor));
    const pad = Math.max(4, Math.round((st.boxPadding !== undefined ? st.boxPadding : 12) * scaleFactor));
    const indentL = Math.round((st.indentLeft || 0) * scaleFactor);
    const indentR = Math.round((st.indentRight || 0) * scaleFactor);
    const spaceB = Math.round((st.spaceBefore || 0) * scaleFactor);
    const spaceA = Math.round((st.spaceAfter || 0) * scaleFactor);
    const effectiveW = Math.max(40, groupW - pad * 2 - indentL - indentR);

    ctx.save();
    ctx.font = `${st.style === 'bold' || st.style === 'extrabold' ? 'bold' : (st.style === 'italic' ? 'italic' : 'normal')} ${size}px "${st.font || 'Quicksand'}", sans-serif`;
    let lines = calculateTextLines(ctx, val, effectiveW, size, st.font);
    if (st.shrinkToFit !== false && lines.length > 3) {
        size = Math.max(12, Math.round(size * 0.85));
        ctx.font = `${st.style === 'bold' || st.style === 'extrabold' ? 'bold' : (st.style === 'italic' ? 'italic' : 'normal')} ${size}px "${st.font || 'Quicksand'}", sans-serif`;
        lines = calculateTextLines(ctx, val, effectiveW, size, st.font);
    }
    ctx.restore();
    return lines.length * (size * (st.lineSpacing || 1.25)) + pad * 2 + spaceB + spaceA;
}

function estimateGroupContentHeight(ctx, grp, dataMap, groupW, isInside, sentenceDataMaps, scaleFactor = 1.0) {
    if (!grp || !grp.fields) return 0;
    let totalH = 0;
    const customSpacing = Math.max(3, Math.round((grp.fieldSpacing !== undefined ? grp.fieldSpacing : 12) * scaleFactor));
    let renderedCount = 0;

    grp.fields.forEach(item => {
        const itemType = item.type || 'field';
        if (itemType === 'field') {
            const fKey = typeof item === 'string' ? item : item.key;
            const h = estimateFieldItemHeight(ctx, fKey, dataMap, groupW, isInside, sentenceDataMaps, scaleFactor);
            if (h > 0) {
                totalH += h;
                renderedCount++;
            }
        } else if (itemType === 'custom_text') {
            if (!item.useCustomCoords) {
                let size = Math.max(12, Math.round((item.size || 28) * scaleFactor));
                const pad = Math.max(4, Math.round((item.boxPadding !== undefined ? item.boxPadding : 12) * scaleFactor));
                const effectiveW = Math.max(40, groupW - pad * 2);
                ctx.save();
                const fontFam = item.font || 'Quicksand';
                const fontStyle = (item.style === 'bold' || item.style === 'extrabold') ? 'bold' : 'normal';
                ctx.font = `${fontStyle} ${size}px "${fontFam}", sans-serif`;
                let fullText = (item.prefix ? item.prefix + ' ' : '') + (item.text || 'Chữ tự do') + (item.suffix ? ' ' + item.suffix : '');
                let lines = calculateTextLines(ctx, fullText, effectiveW, size, fontFam);
                ctx.restore();
                const h = lines.length * (size * (item.lineSpacing || 1.25)) + pad * 2;
                totalH += h;
                renderedCount++;
            }
        }
    });

    if (renderedCount > 1) {
        totalH += (renderedCount - 1) * customSpacing;
    }
    return totalH;
}

function drawParagraphCanvasFrame() {
    if (!pCanvas || !pCtx) return;
    ensureCanvasClickListener();

    // Khi đang ở pha quay bản Clean (Render Kép pha 2): chỉ vẽ lên pCleanCanvas để giải phóng GPU và đạt chuẩn 30fps
    if (isBatchRunning && typeof batchExecutionMode !== 'undefined' && batchExecutionMode === 'dual_parallel' && typeof batchCurrentSubPhase !== 'undefined' && batchCurrentSubPhase === 'clean') {
        if (pCleanCtx && pCleanCanvas) {
            renderSingleFrameToContext(pCleanCtx, pCleanCanvas.width, pCleanCanvas.height, true);
        }
        if (!isBatchRunning || (miniBatchFrameCounter++ % 2 === 0)) {
            syncToMiniBatchCanvas(true);
        }
        return;
    }

    // Pha quay bản Full (hoặc Preview / Render đơn): chỉ vẽ lên pCanvas chính, giải phóng 100% tài nguyên dư thừa
    renderSingleFrameToContext(pCtx, pCanvas.width, pCanvas.height, false);

    if (!isBatchRunning || (miniBatchFrameCounter++ % 2 === 0)) {
        syncToMiniBatchCanvas(false);
    }
}

function renderSingleFrameToContext(ctx, width, height, isCleanMode = false) {
    if (!isCleanMode) {
        canvasCustomTextHitBoxes = [];
        canvasFieldHitBoxes = [];
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    if (!isCleanMode) {
        if (canvasBgImage) {
            ctx.save();
            const bgSt = videoConfig.bgImageStyle || { widthPct: 100, heightPct: 100, posX: 0, posY: 0, opacity: 100 };
            ctx.globalAlpha = (bgSt.opacity !== undefined ? bgSt.opacity : 100) / 100;
            const bgW = (width * (bgSt.widthPct || 100)) / 100;
            const bgH = (height * (bgSt.heightPct || 100)) / 100;
            const bgX = (width * (bgSt.posX || 0)) / 100;
            const bgY = (height * (bgSt.posY || 0)) / 100;
            ctx.drawImage(canvasBgImage, bgX, bgY, bgW, bgH);
            ctx.restore();
        } else {
            drawThemeBlobs(ctx, width, height);
        }
    }

    const matrix = paragraphGridConfig.gridMatrix || { 
        columnCount: 3, 
        columnWidths: [36, 40, 20], 
        paddingTopPct: 8, 
        paddingBottomPct: 8, 
        paddingLeftPct: 4, 
        paddingRightPct: 4, 
        columnGapPct: 2, 
        showGridOverlay: false,
        colSyncSettings: { 1: { locked: true }, 2: { locked: true }, 3: { locked: false, freeMode: 'center' } }
    };

    const colCount = matrix.columnCount || 3;
    const paddingTop = (height * (matrix.paddingTopPct !== undefined ? matrix.paddingTopPct : 8)) / 100;
    const paddingBottom = (height * (matrix.paddingBottomPct !== undefined ? matrix.paddingBottomPct : 8)) / 100;
    const paddingLeft = (width * (matrix.paddingLeftPct !== undefined ? matrix.paddingLeftPct : 4)) / 100;
    const paddingRight = (width * (matrix.paddingRightPct !== undefined ? matrix.paddingRightPct : 4)) / 100;
    const colGap = (width * (matrix.columnGapPct !== undefined ? matrix.columnGapPct : 2)) / 100;
    const blockGap = paragraphGridConfig.loopBlockGap !== undefined ? paragraphGridConfig.loopBlockGap : 24;

    const effectiveHeight = height - paddingTop - paddingBottom;
    const colLayouts = [];
    let currentX = paddingLeft;

    for (let i = 0; i < colCount; i++) {
        const wPct = (matrix.columnWidths && matrix.columnWidths[i] !== undefined) ? matrix.columnWidths[i] : (90 / colCount);
        const colW = (width * wPct) / 100;
        colLayouts.push({ colIndex: i + 1, x: currentX, w: colW });
        currentX += colW + colGap;
    }

    if (matrix.showGridOverlay && !isCleanMode) {
        ctx.save();
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        colLayouts.forEach(cl => ctx.strokeRect(cl.x, paddingTop, cl.w, effectiveHeight));
        ctx.restore();
    }

    let activeTopicList = getParagraphFilteredDatasets();
    if (!activeTopicList || activeTopicList.length === 0) {
        activeTopicList = [{ topic: "Default", drills: [{ cueWord: "", drillText: "" }] }];
    }
    const totalSentences = activeTopicList.length;

    const sentenceDataMaps = activeTopicList.map((ds, sIdx) => {
        const drill = (ds && ds.drills && ds.drills[0]) ? ds.drills[0] : {};
        const baseMap = {
            "STT": drill.stt || (sIdx + 1),
            "STT Mẫu": ds.sttMau || (sIdx + 1),
            "Chủ đề": ds.topic || "",
            "Mẫu câu": ds.pattern || "",
            "Câu hỏi cho mẫu câu": ds.question || "",
            "Từ nối": drill.tuNoi !== undefined ? drill.tuNoi : "",
            "Substitution words": drill.cueWord || "",
            "Dịch Substitution words": drill.dichCueWord || "",
            "Substitution Drills": drill.drillText || "",
            "Phiên âm IPA": drill.ipa || "",
            "Dịch Substitution Drills": drill.dichDrillText || "",
            "ten_file_dinh_kem": drill.imageName || "",
            "Minh họa": drill.imageName || ""
        };
        if (drill.rawRow) {
            Object.keys(drill.rawRow).forEach(k => {
                if (baseMap[k] === undefined) {
                    baseMap[k] = String(drill.rawRow[k] || "").trim();
                }
            });
        }
        return baseMap;
    });

    const activeSentenceIdx = isParagraphRunning ? pCurrentSentenceIndex : 0;
    const currentSentenceData = sentenceDataMaps[activeSentenceIdx] || sentenceDataMaps[0] || {};
    const currentActiveImage = currentSentenceData["ten_file_dinh_kem"] || "";
    const currentActiveFallbackWord = currentSentenceData["Substitution words"] || "";

    const hasAnyAllLayer = paragraphGridConfig.groups.some(g => (typeof getGroupPresentationMode === 'function' ? getGroupPresentationMode(g) : (g.presentationMode || paragraphGridConfig.presentationMode)) === 'all') || (paragraphGridConfig.presentationMode === 'all');
    const hasAnyStackLayer = paragraphGridConfig.groups.some(g => (typeof getGroupPresentationMode === 'function' ? getGroupPresentationMode(g) : (g.presentationMode || paragraphGridConfig.presentationMode)) === 'stack') || (paragraphGridConfig.presentationMode === 'stack');

    let maxSentencesToDraw = totalSentences;
    if (hasAnyAllLayer) {
        maxSentencesToDraw = totalSentences;
    } else if (hasAnyStackLayer) {
        maxSentencesToDraw = isParagraphRunning ? Math.min(pCurrentSentenceIndex + 1, totalSentences) : totalSentences;
    } else {
        maxSentencesToDraw = isParagraphRunning ? (pCurrentSentenceIndex + 1) : 1;
    }
    const startSentenceIdx = 0;

    let colVerticalPositions = new Array(colCount + 1).fill(paddingTop);
    let totalLockedBlockTop = paddingTop;
    let totalLockedBlockBottom = paddingTop;

    for (let sIdx = startSentenceIdx; sIdx < maxSentencesToDraw; sIdx++) {
        const dataMap = sentenceDataMaps[sIdx];
        if (!dataMap) continue;

        const isCurrentSentence = (sIdx === (isParagraphRunning ? pCurrentSentenceIndex : 0));
        const isOutsideOnlyRender = (typeof isBatchRunning !== 'undefined' && isBatchRunning && typeof batchRenderQueue !== 'undefined' && batchRenderQueue[currentBatchQueueIndex] && batchRenderQueue[currentBatchQueueIndex].isOutsideLoopOnly) || (typeof isStaticOutsideLoopRunning !== 'undefined' && isStaticOutsideLoopRunning);
        let maxLockedRowHeight = 0;
        let lockedColumnsInRow = [];

        paragraphGridConfig.groups.forEach(grp => {
            const grpPos = grp.loopPosition || (grp.isInsideLoop === false ? 'outside' : 'inside');
            const isInside = (grpPos === 'inside');

            if (!isInside && sIdx > 0) return;
            if (isOutsideOnlyRender && isInside) return;
            if (isParagraphRunning) {
                if (grpPos === 'before' && pCurrentSentenceIndex > 0) return;
                if (grpPos === 'after' && pCurrentSentenceIndex < totalSentences - 1) return;
            }

            // Khóa chặt chẽ theo ranh giới phân khu Timeline (Khu 1: Intro, Khu 2: Drills, Khu 3: Outro)
            if (typeof getZoneBoundary === 'function') {
                const zoneBound = getZoneBoundary(grpPos);
                if (zoneBound) {
                    if (currentTimelinePlayTime < zoneBound.start) return;
                    if (zoneBound.maxDur > 0 && currentTimelinePlayTime > zoneBound.end) {
                        if (grpPos === 'inside') {
                            const outroBound = getZoneBoundary('after');
                            const hasActiveOutro = outroBound && outroBound.hasLayers && (!isParagraphRunning || pCurrentSentenceIndex === totalSentences - 1);
                            if (hasActiveOutro) return;
                        } else {
                            return;
                        }
                    }
                }
            }

            const targetColIdx = Math.max(1, Math.min(grp.targetColumn || 1, colCount));
            const isColLocked = matrix.colSyncSettings && matrix.colSyncSettings[targetColIdx] ? matrix.colSyncSettings[targetColIdx].locked : true;

            if (isColLocked) {
                lockedColumnsInRow.push(targetColIdx);
                const colLayout = colLayouts[targetColIdx - 1] || colLayouts[0];
                let groupW = colLayout.w;

                // Tính toán bề rộng gộp nhiều cột (ColSpan)
                if (grp.colSpan) {
                    if (grp.colSpan === 'all') {
                        const firstCol = colLayouts[0];
                        const lastCol = colLayouts[colCount - 1];
                        groupW = (lastCol.x + lastCol.w) - firstCol.x;
                    } else {
                        const spanCount = Math.min(parseInt(grp.colSpan) || 1, colCount - targetColIdx + 1);
                        if (spanCount > 1) {
                            const endCol = colLayouts[targetColIdx - 1 + spanCount - 1];
                            if (endCol) {
                                groupW = (endCol.x + endCol.w) - colLayout.x;
                            }
                        }
                    }
                }

                const customSpacing = (grp.fieldSpacing !== undefined ? grp.fieldSpacing : 12);
                let estimatedGroupH = 0;

                grp.fields.forEach(item => {
                    const itemType = item.type || 'field';
                    if (itemType === 'field') {
                        const fKey = typeof item === 'string' ? item : item.key;
                        const st = paragraphFieldStyles[fKey];
                        if (st && st.type !== 'image') {
                            const rawVal = (!isInside && sentenceDataMaps[0]) ? sentenceDataMaps[0][fKey] : dataMap[fKey];
                            const val = (rawVal !== undefined && rawVal !== null) ? String(rawVal).trim() : '';
                            if (!val) return;
                            let size = st.size || 28;
                            const pad = st.boxPadding !== undefined ? st.boxPadding : 12;
                            const effectiveW = Math.max(40, groupW - pad * 2);
                            ctx.font = `${st.style === 'bold' || st.style === 'extrabold' ? 'bold' : 'normal'} ${size}px "${st.font || 'Quicksand'}", sans-serif`;
                            let lines = calculateTextLines(ctx, val, effectiveW, size, st.font);
                            let h = lines.length * (size * (st.lineSpacing || 1.25)) + pad * 2 + (st.spaceBefore || 0) + (st.spaceAfter || 0);
                            estimatedGroupH += h + customSpacing;
                        }
                    } else if (itemType === 'custom_text') {
                        if (!item.useCustomCoords) {
                            estimatedGroupH += (item.size || 28) * (item.lineSpacing || 1.25) + (item.boxPadding !== undefined ? item.boxPadding : 12) * 2 + customSpacing;
                        }
                    }
                });

                if (grp.customHeightPx && grp.customHeightPx > 0) estimatedGroupH = Math.max(estimatedGroupH, grp.customHeightPx);
                if (estimatedGroupH > maxLockedRowHeight) maxLockedRowHeight = estimatedGroupH;
            }
        });

        paragraphGridConfig.groups.forEach(grp => {
            const grpPos = grp.loopPosition || (grp.isInsideLoop === false ? 'outside' : 'inside');
            const isInside = (grpPos === 'inside');

            if (!isInside && sIdx > 0) return;
            if (isOutsideOnlyRender && isInside) return;
            if (isParagraphRunning) {
                if (grpPos === 'before' && pCurrentSentenceIndex > 0) return;
                if (grpPos === 'after' && pCurrentSentenceIndex < totalSentences - 1) return;
            }

            // Khóa chặt chẽ theo ranh giới phân khu Timeline (Khu 1: Intro, Khu 2: Drills, Khu 3: Outro)
            // Chưa đến mốc bắt đầu của khu nào thì ẩn 100% tất cả các lớp của khu đó
            if (typeof getZoneBoundary === 'function') {
                const zoneBound = getZoneBoundary(grpPos);
                if (zoneBound) {
                    if (currentTimelinePlayTime < zoneBound.start) return;
                    if (zoneBound.maxDur > 0 && currentTimelinePlayTime > zoneBound.end) {
                        if (grpPos === 'inside') {
                            const outroBound = getZoneBoundary('after');
                            const hasActiveOutro = outroBound && outroBound.hasLayers && (!isParagraphRunning || pCurrentSentenceIndex === totalSentences - 1);
                            if (hasActiveOutro) return;
                        } else {
                            return;
                        }
                    }
                }
            }

            const grpMode = typeof getGroupPresentationMode === 'function' ? getGroupPresentationMode(grp) : (grp.presentationMode || paragraphGridConfig.presentationMode || 'single');

            // Xử lý chế độ trình chiếu riêng của từng lớp
            if (grpMode === 'single') {
                if (sIdx !== activeSentenceIdx) return;
            } else if (grpMode === 'stack') {
                if (isParagraphRunning && sIdx > activeSentenceIdx) return;
            }
            // grpMode === 'all': Vẽ toàn bộ các câu từ đầu đến cuối

            const start = grp.startTime || 0;
            let end = start + (grp.duration || masterTimelineDuration);
            if (grp.snapEndToTotalDuration) {
                const curTotal = (typeof getEffectiveSentenceDuration === 'function')
                    ? getEffectiveSentenceDuration(isParagraphRunning ? pCurrentSentenceIndex : 0)
                    : masterTimelineDuration;
                end = curTotal;
            }

            // Khóa hiển thị theo thời gian của từng lớp:
            // Áp dụng cho: toàn bộ các dòng trong chế độ 'all', chế độ 'single', hoặc dòng hiện tại của 'stack'
            if (grpMode === 'all' || grpMode === 'single' || isCurrentSentence) {
                if (currentTimelinePlayTime < start) return;
            }

            // Chỉ ẩn khi hết thời lượng nếu lớp đó thuần túy là bộ đếm ngược countdown (không chứa text/image)
            const isOnlyCountdown = grp.fields && grp.fields.length > 0 && grp.fields.every(f => (typeof f === 'object' ? f.type : f) === 'countdown');
            if (isOnlyCountdown && currentTimelinePlayTime > end) return;

            // Các lớp nội dung (văn bản, dịch nghĩa, ảnh minh họa) một khi đã xuất hiện tại start
            // sẽ duy trì hiển thị liên tục đến hết câu và trong suốt khoảng nghỉ chuyển tiếp (transition),
            // loại bỏ triệt để hiện tượng mất nội dung hoặc chớp tắt giữa các câu.

            const activeDataMap = (!isInside && sentenceDataMaps[0]) ? sentenceDataMaps[0] : dataMap;

            const targetColIdx = Math.max(1, Math.min(grp.targetColumn || 1, colCount));
            const colLayout = colLayouts[targetColIdx - 1] || colLayouts[0];
            const isColLocked = matrix.colSyncSettings && matrix.colSyncSettings[targetColIdx] ? matrix.colSyncSettings[targetColIdx].locked : true;
            const freeMode = matrix.colSyncSettings && matrix.colSyncSettings[targetColIdx] ? matrix.colSyncSettings[targetColIdx].freeMode : 'center';

            const offX = grp.offsetX || 0;
            const offY = grp.offsetY || 0;
            let originX = colLayout.x + offX;
            let groupW = colLayout.w;

            // Tính toán bề rộng gộp nhiều cột (ColSpan)
            if (grp.colSpan) {
                if (grp.colSpan === 'all') {
                    const firstCol = colLayouts[0];
                    const lastCol = colLayouts[colCount - 1];
                    originX = firstCol.x + offX;
                    groupW = (lastCol.x + lastCol.w) - firstCol.x;
                } else {
                    const spanCount = Math.min(parseInt(grp.colSpan) || 1, colCount - targetColIdx + 1);
                    if (spanCount > 1) {
                        const endCol = colLayouts[targetColIdx - 1 + spanCount - 1];
                        if (endCol) {
                            groupW = (endCol.x + endCol.w) - colLayout.x;
                        }
                    }
                }
            }

            const rowOffsetPx = (grp.startRowOffset || 0) * 45;

            let currentFieldY = (grpMode === 'single' ? paddingTop : colVerticalPositions[targetColIdx]) + rowOffsetPx + offY;

            // PHƯƠNG ÁN 1: TỰ ĐỘNG CO GIÃN THÔNG MINH KHI TRÀN MÉP DƯỚI (AUTO-FIT & SCALE DOWN)
            let layerScaleFactor = 1.0;
            const allowAutoFit = (grp.autoFitOverflow !== false);
            const maxSafeBottomY = height - Math.max(24, paddingBottom);
            const availableSpaceH = maxSafeBottomY - currentFieldY;

            if (allowAutoFit && availableSpaceH > 60) {
                const rawEstH = estimateGroupContentHeight(ctx, grp, activeDataMap, groupW, isInside, sentenceDataMaps, 1.0);
                if (rawEstH > availableSpaceH) {
                    let targetScale = availableSpaceH / rawEstH;
                    targetScale = Math.max(0.48, Math.min(1.0, targetScale));
                    const retestH = estimateGroupContentHeight(ctx, grp, activeDataMap, groupW, isInside, sentenceDataMaps, targetScale);
                    if (retestH > availableSpaceH && targetScale > 0.48) {
                        targetScale = Math.max(0.45, targetScale * (availableSpaceH / retestH));
                    }
                    layerScaleFactor = targetScale;
                }
            }

            ctx.save();
            const frameOpacity = grp.opacity !== undefined ? grp.opacity : 100;
            ctx.globalAlpha = Math.max(0, Math.min(100, frameOpacity)) / 100;
            const customSpacing = Math.max(2, Math.round((grp.fieldSpacing !== undefined ? grp.fieldSpacing : 12) * layerScaleFactor));

            // KHUNG VIỀN & MÀU NỀN BAO TOÀN BỘ LỚP (LAYER BORDER & BOX CONTAINER)
            const hasLayerBorder = !!grp.borderEnabled && (grp.borderWidth > 0);
            const hasLayerBg = !!grp.backgroundColor && grp.backgroundColor !== 'transparent' && grp.backgroundColor !== '';
            const layerPad = (hasLayerBorder || hasLayerBg) ? Math.max(0, Math.round((grp.borderPadding !== undefined ? grp.borderPadding : 10) * layerScaleFactor)) : 0;
            const effectiveContentW = Math.max(40, groupW - layerPad * 2);

            if (hasLayerBorder || hasLayerBg) {
                let estimatedContentH = 0;
                if (grp.customHeightPx && grp.customHeightPx > 0) {
                    estimatedContentH = Math.round(grp.customHeightPx * layerScaleFactor);
                } else {
                    estimatedContentH = estimateGroupContentHeight(ctx, grp, activeDataMap, effectiveContentW, isInside, sentenceDataMaps, layerScaleFactor);
                }

                if (estimatedContentH > 0 || (grp.fields && grp.fields.length > 0)) {
                    const boxX = originX;
                    const boxY = currentFieldY;
                    const boxW = groupW;
                    const boxH = estimatedContentH + layerPad * 2;
                    const bRadius = Math.max(0, Math.round((grp.borderRadius !== undefined ? grp.borderRadius : 12) * layerScaleFactor));

                    ctx.save();

                    // Hiệu ứng đổ bóng mờ hoặc hào quang phát sáng (Box Shadow & Glow)
                    if (grp.boxShadowEnabled) {
                        ctx.shadowColor = grp.boxShadowColor || 'rgba(0, 0, 0, 0.35)';
                        ctx.shadowBlur = Math.round((grp.boxShadowBlur !== undefined ? grp.boxShadowBlur : 10) * layerScaleFactor);
                        ctx.shadowOffsetX = 0;
                        ctx.shadowOffsetY = 4;
                    }

                    // 1. Vẽ Màu nền hộp lớp
                    if (hasLayerBg) {
                        ctx.save();
                        const bgOp = (grp.backgroundOpacity !== undefined ? grp.backgroundOpacity : 100) / 100;
                        ctx.globalAlpha = ctx.globalAlpha * bgOp;
                        ctx.fillStyle = grp.backgroundColor;
                        ctx.beginPath();
                        if (ctx.roundRect) {
                            ctx.roundRect(boxX, boxY, boxW, boxH, bRadius);
                        } else {
                            ctx.rect(boxX, boxY, boxW, boxH);
                        }
                        ctx.fill();
                        ctx.restore();
                    }

                    // 2. Vẽ Viền bao quanh lớp
                    if (hasLayerBorder) {
                        ctx.save();
                        const bWidth = Math.max(0.5, (grp.borderWidth !== undefined ? grp.borderWidth : 2) * layerScaleFactor);
                        ctx.lineWidth = bWidth;
                        ctx.strokeStyle = grp.borderColor || (grp.trackColor || '#3b82f6');

                        const bStyle = grp.borderStyle || 'solid';
                        if (bStyle === 'dashed') {
                            ctx.setLineDash([Math.round(8 * layerScaleFactor), Math.round(5 * layerScaleFactor)]);
                        } else if (bStyle === 'dotted') {
                            ctx.setLineDash([Math.round(3 * layerScaleFactor), Math.round(3 * layerScaleFactor)]);
                        } else {
                            ctx.setLineDash([]);
                        }

                        ctx.beginPath();
                        if (ctx.roundRect) {
                            ctx.roundRect(boxX, boxY, boxW, boxH, bRadius);
                        } else {
                            ctx.rect(boxX, boxY, boxW, boxH);
                        }
                        ctx.stroke();
                        ctx.restore();
                    }

                    ctx.restore();

                    // Đệm lề (Padding) để các trường con nằm lọt gọn bên trong khung viền
                    originX = originX + layerPad;
                    groupW = effectiveContentW;
                    currentFieldY = currentFieldY + layerPad;
                }
            }

            grp.fields.forEach((item, fIdx) => {
                const itemType = item.type || 'field';

                if (itemType === 'field') {
                    const fKey = typeof item === 'string' ? item : item.key;
                    const st = paragraphFieldStyles[fKey];
                    if (!st) return;

                    if (st.type === 'image') {
                        let imgX = st.posX !== undefined ? st.posX : originX;
                        let imgY = st.posY !== undefined ? st.posY : currentFieldY;
                        let imgW = st.width !== undefined ? st.width : groupW;
                        let baseImgH = st.height !== undefined ? st.height : Math.max(260, effectiveHeight - 60);
                        let imgH = Math.max(80, Math.round(baseImgH * layerScaleFactor));

                        if (!isColLocked) {
                            if (freeMode === 'center') {
                                imgX = originX;
                                imgY = paddingTop + (effectiveHeight - imgH) / 2;
                            } else if (freeMode === 'span') {
                                imgX = originX;
                                imgY = totalLockedBlockTop;
                                imgH = Math.max(120, totalLockedBlockBottom - totalLockedBlockTop);
                            }
                        }

                        const customR = Math.round(Math.max(4, (st.boxRadius !== undefined ? st.boxRadius : 20) * layerScaleFactor));
                        const customOp = st.opacity !== undefined ? st.opacity : 100;
                        drawRect916PhotoFrame(ctx, imgX, imgY, imgW, imgH, currentActiveImage, currentActiveFallbackWord, true, customR, customOp);
                        if (!isCleanMode) {
                            canvasFieldHitBoxes.push({
                                x: imgX,
                                y: imgY,
                                w: imgW,
                                h: imgH,
                                gIdx: paragraphGridConfig.groups.indexOf(grp),
                                fKey: fKey
                            });
                        }
                        currentFieldY += imgH + customSpacing;
                    } else {
                        const rawVal = activeDataMap[fKey];
                        const val = (rawVal !== undefined && rawVal !== null) ? String(rawVal).trim() : '';
                        if (val !== '') {
                            const renderedHeight = drawAutoFlowCardBox(ctx, originX, currentFieldY, groupW, val, st, layerScaleFactor);
                            if (!isCleanMode) {
                                canvasFieldHitBoxes.push({
                                    x: originX,
                                    y: currentFieldY,
                                    w: groupW,
                                    h: renderedHeight,
                                    gIdx: paragraphGridConfig.groups.indexOf(grp),
                                    fKey: fKey
                                });
                            }
                            currentFieldY += renderedHeight + customSpacing;
                        }
                    }
                } else if (itemType === 'custom_text') {
                    const renderedHeight = drawCustomTextCardBox(ctx, originX, currentFieldY, groupW, item, paragraphGridConfig.groups.indexOf(grp), fIdx, layerScaleFactor);
                    if (!item.useCustomCoords) {
                        currentFieldY += renderedHeight + customSpacing;
                    }
                } else if (itemType === 'countdown') {
                    if ((isParagraphRunning || isTimelinePlaying) && currentTimelinePlayTime < (grp.startTime + (grp.duration || 3.0))) {
                        const countVal = Math.max(1, Math.ceil((grp.startTime + (grp.duration || 3.0)) - currentTimelinePlayTime));
                        drawCountdownOverlay(ctx, width, height, item, countVal);
                    }
                } else if (itemType === 'progress_tracker') {
                    drawProgressTrackerOverlay(ctx, width, height, item);
                }
            });

            // Hiển thị chỉ báo Auto-Fit thu nhỏ trong Studio khi preview (bản quay MP4 Clean không hiện)
            if (layerScaleFactor < 0.98 && !isCleanMode) {
                ctx.save();
                const pct = Math.round(layerScaleFactor * 100);
                const tagText = `Auto-Fit: ${pct}%`;
                ctx.font = 'bold 11px sans-serif';
                const tagW = ctx.measureText(tagText).width + 12;
                const tagX = originX + groupW - tagW - 4;
                const tagY = (grpMode === 'single' ? paddingTop : colVerticalPositions[targetColIdx]) + rowOffsetPx + offY + 4;
                
                ctx.fillStyle = 'rgba(13, 148, 136, 0.85)';
                if (ctx.roundRect) ctx.roundRect(tagX, tagY, tagW, 18, 4);
                else ctx.rect(tagX, tagY, tagW, 18);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText(tagText, tagX + tagW / 2, tagY + 13);
                ctx.restore();
            }

            if (hasLayerBorder || hasLayerBg) {
                currentFieldY += layerPad;
            }

            ctx.restore();

            if (!isColLocked && grpMode !== 'single') {
                colVerticalPositions[targetColIdx] = currentFieldY;
            }
        });

        if (hasAnyStackLayer || hasAnyAllLayer) {
            const nextRowStartY = (lockedColumnsInRow.length > 0 ? colVerticalPositions[lockedColumnsInRow[0]] : paddingTop) + maxLockedRowHeight + blockGap;
            for (let c = 1; c <= colCount; c++) {
                const isLocked = matrix.colSyncSettings && matrix.colSyncSettings[c] ? matrix.colSyncSettings[c].locked : true;
                if (isLocked) {
                    colVerticalPositions[c] = nextRowStartY;
                }
            }
            totalLockedBlockBottom = nextRowStartY;
        }
    }

    // BẢN SẠCH: KHÔNG VẼ LOGO / BADGE THƯƠNG HIỆU
    if (!isCleanMode && canvasBadgeImage) {
        ctx.save();
        const bdSt = videoConfig.badgeStyle || { widthPct: 15, heightPct: 10, posX: 82, posY: 4, opacity: 100, borderRadius: 20 };
        ctx.globalAlpha = (bdSt.opacity !== undefined ? bdSt.opacity : 100) / 100;
        const bdW = (width * (bdSt.widthPct || 15)) / 100;
        const aspect = canvasBadgeImage.height / canvasBadgeImage.width;
        const bdH = bdW * aspect;
        const bdX = (width * (bdSt.posX !== undefined ? bdSt.posX : 82)) / 100;
        const bdY = (height * (bdSt.posY !== undefined ? bdSt.posY : 4)) / 100;
        const radius = bdSt.borderRadius !== undefined ? bdSt.borderRadius : 20;

        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bdX, bdY, bdW, bdH, radius);
        else ctx.rect(bdX, bdY, bdW, bdH);
        ctx.clip();
        ctx.drawImage(canvasBadgeImage, bdX, bdY, bdW, bdH);
        ctx.restore();
    }
}

function drawAutoFlowCardBox(ctx, startX, startY, maxGroupW, textVal, st, scaleFactor = 1.0) {
    if (!textVal || String(textVal).trim() === "") {
        return 0;
    }
    ctx.save();
    let size = Math.max(12, Math.round((st.size || 28) * scaleFactor));
    const pad = Math.max(4, Math.round((st.boxPadding !== undefined ? st.boxPadding : 12) * scaleFactor));
    const indentL = Math.round((st.indentLeft || 0) * scaleFactor);
    const indentR = Math.round((st.indentRight || 0) * scaleFactor);
    const spaceB = Math.round((st.spaceBefore || 0) * scaleFactor);
    const spaceA = Math.round((st.spaceAfter || 0) * scaleFactor);

    const effectiveW = Math.max(40, maxGroupW - pad * 2 - indentL - indentR);
    
    ctx.font = `${st.style === 'bold' || st.style === 'extrabold' ? 'bold' : (st.style === 'italic' ? 'italic' : 'normal')} ${size}px "${st.font || 'Quicksand'}", sans-serif`;
    let lines = calculateTextLines(ctx, textVal, effectiveW, size, st.font);
    
    if (st.shrinkToFit !== false && lines.length > 3) {
        size = Math.max(11, Math.round(size * 0.85));
        ctx.font = `${st.style === 'bold' || st.style === 'extrabold' ? 'bold' : (st.style === 'italic' ? 'italic' : 'normal')} ${size}px "${st.font || 'Quicksand'}", sans-serif`;
        lines = calculateTextLines(ctx, textVal, effectiveW, size, st.font);
    }

    let actualBoxW = maxGroupW;
    const actualBoxH = lines.length * (size * (st.lineSpacing || 1.25)) + pad * 2 + spaceB + spaceA;
    let actualBoxX = startX;

    if (st.shrinkToFit !== false) {
        let maxLineW = 0;
        lines.forEach(l => {
            const lw = ctx.measureText(l).width;
            if (lw > maxLineW) maxLineW = lw;
        });
        actualBoxW = Math.min(maxGroupW, maxLineW + pad * 2 + indentL + indentR + 16 * scaleFactor);
        if (st.hAlign === 'center') actualBoxX = startX + (maxGroupW - actualBoxW) / 2;
        else if (st.hAlign === 'right') actualBoxX = startX + maxGroupW - actualBoxW;
    }

    if (st.boxBgColor && st.boxBgColor !== 'transparent') {
        ctx.fillStyle = st.boxBgColor;
        ctx.beginPath();
        const radius = Math.round(Math.max(4, (st.boxRadius !== undefined ? st.boxRadius : 18) * scaleFactor));
        if (ctx.roundRect) ctx.roundRect(actualBoxX, startY + spaceB, actualBoxW, actualBoxH - spaceB - spaceA, radius);
        else ctx.rect(actualBoxX, startY + spaceB, actualBoxW, actualBoxH - spaceB - spaceA);
        ctx.fill();

        ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)';
        ctx.lineWidth = Math.max(1, 1.5 * scaleFactor);
        ctx.stroke();
    }

    let textY = startY + spaceB + pad + size * 0.85;

    const hlPadX = Math.round((st.highlightPaddingX !== undefined ? st.highlightPaddingX : 8) * scaleFactor);
    const hlPadY = Math.round((st.highlightPaddingY !== undefined ? st.highlightPaddingY : 4) * scaleFactor);

    lines.forEach(lineText => {
        const lineW = ctx.measureText(lineText).width;
        let textX = actualBoxX + pad + indentL;
        if (st.hAlign === 'center') textX = actualBoxX + actualBoxW / 2;
        else if (st.hAlign === 'right') textX = actualBoxX + actualBoxW - pad - indentR;

        if (st.highlightColor && st.highlightColor !== 'transparent') {
            ctx.save();
            ctx.fillStyle = st.highlightColor;
            let hlX = textX;
            if (st.hAlign === 'center') hlX = textX - lineW / 2 - hlPadX;
            else if (st.hAlign === 'right') hlX = textX - lineW - hlPadX;
            else hlX = textX - hlPadX / 2;

            const hlW = lineW + hlPadX * 2;
            const hlH = size * 1.05 + hlPadY * 2;
            const hlY = textY - size * 0.8 - hlPadY;

            ctx.fillRect(hlX, hlY, hlW, hlH);
            ctx.restore();
        }

        ctx.fillStyle = st.color || '#000000';
        ctx.font = `${st.style === 'bold' || st.style === 'extrabold' ? 'bold' : (st.style === 'italic' ? 'italic' : 'normal')} ${size}px "${st.font || 'Quicksand'}", sans-serif`;
        ctx.textAlign = st.hAlign || 'left';
        ctx.fillText(lineText, textX, textY);

        if (st.underline) {
            ctx.save();
            ctx.strokeStyle = st.color || '#000000';
            ctx.lineWidth = Math.max(1, (size / 15));
            let startUlX = textX;
            if (st.hAlign === 'center') startUlX = textX - lineW / 2;
            else if (st.hAlign === 'right') startUlX = textX - lineW;
            ctx.beginPath();
            ctx.moveTo(startUlX, textY + 4 * scaleFactor);
            ctx.lineTo(startUlX + lineW, textY + 4 * scaleFactor);
            ctx.stroke();
            ctx.restore();
        }

        textY += size * (st.lineSpacing || 1.25);
    });

    ctx.restore();
    return actualBoxH;
}

function drawCustomTextCardBox(ctx, startX, startY, maxGroupW, rawItem, gIdx, fIdx, scaleFactor = 1.0) {
    if (typeof getCustomTextDefaults === 'function') {
        rawItem = getCustomTextDefaults(rawItem);
    }
    const item = rawItem || {};

    let fullText = (item.prefix ? item.prefix + ' ' : '') + (item.text || '') + (item.suffix ? ' ' + item.suffix : '');
    if (!fullText.trim()) fullText = item.text || "Chữ tự do";

    if (item.textCase === 'uppercase') {
        fullText = fullText.toUpperCase();
    } else if (item.textCase === 'capitalize') {
        fullText = fullText.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }

    ctx.save();

    const isCustomCoords = !!item.useCustomCoords;
    const originX = isCustomCoords ? (item.posX !== undefined ? item.posX : startX) : startX;
    const originY = isCustomCoords ? (item.posY !== undefined ? item.posY : startY) : startY;
    const targetW = isCustomCoords ? (item.width !== undefined ? item.width : maxGroupW) : maxGroupW;
    const targetH = isCustomCoords ? (item.height !== undefined ? Math.round(item.height * scaleFactor) : 100) : null;

    let size = Math.max(12, Math.round((item.size || 28) * scaleFactor));
    const pad = Math.max(4, Math.round((item.boxPadding !== undefined ? item.boxPadding : 12) * scaleFactor));
    const effectiveW = Math.max(40, targetW - pad * 2);

    const fontFam = item.font || 'Quicksand';
    const fontStyle = (item.style === 'bold' || item.style === 'extrabold') ? 'bold' : (item.style === 'italic' ? 'italic' : 'normal');

    if (item.autoScale && targetH) {
        const maxH = Math.max(24, targetH - pad * 2);
        for (let s = Math.max(size, 80); s >= 12; s -= 2) {
            ctx.font = `${fontStyle} ${s}px "${fontFam}", sans-serif`;
            const testLines = calculateTextLines(ctx, fullText, effectiveW, s, fontFam);
            const testTotalH = testLines.length * (s * (item.lineSpacing || 1.25));
            if (testTotalH <= maxH) {
                let fits = true;
                for (let li = 0; li < testLines.length; li++) {
                    if (ctx.measureText(testLines[li]).width > effectiveW) {
                        fits = false;
                        break;
                    }
                }
                if (fits) {
                    size = s;
                    break;
                }
            }
        }
    }

    ctx.font = `${fontStyle} ${size}px "${fontFam}", sans-serif`;
    let lines = calculateTextLines(ctx, fullText, effectiveW, size, fontFam);

    if (item.shrinkToFit !== false && lines.length > 3 && !isCustomCoords) {
        size = Math.max(11, Math.round(size * 0.85));
        ctx.font = `${fontStyle} ${size}px "${fontFam}", sans-serif`;
        lines = calculateTextLines(ctx, fullText, effectiveW, size, fontFam);
    }

    let actualBoxW = targetW;
    let actualBoxH = targetH ? targetH : (lines.length * (size * (item.lineSpacing || 1.25)) + pad * 2);
    let actualBoxX = originX;
    let actualBoxY = originY;

    if (item.shrinkToFit !== false && !isCustomCoords) {
        let maxLineW = 0;
        lines.forEach(l => {
            const lw = ctx.measureText(l).width;
            if (lw > maxLineW) maxLineW = lw;
        });
        actualBoxW = Math.min(maxGroupW, maxLineW + pad * 2 + 16 * scaleFactor);
        if (item.hAlign === 'center') actualBoxX = originX + (maxGroupW - actualBoxW) / 2;
        else if (item.hAlign === 'right') actualBoxX = originX + maxGroupW - actualBoxW;
    }

    canvasCustomTextHitBoxes.push({
        x: actualBoxX,
        y: actualBoxY,
        w: actualBoxW,
        h: actualBoxH,
        gIdx: gIdx,
        fIdx: fIdx
    });

    if (item.boxBgColor && item.boxBgColor !== 'transparent') {
        ctx.save();
        ctx.fillStyle = item.boxBgColor;
        const radius = Math.round(Math.max(4, (item.boxRadius !== undefined ? item.boxRadius : 16) * scaleFactor));
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(actualBoxX, actualBoxY, actualBoxW, actualBoxH, radius);
        else ctx.rect(actualBoxX, actualBoxY, actualBoxW, actualBoxH);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = Math.max(1, 1.5 * scaleFactor);
        ctx.stroke();
        ctx.restore();
    }

    const isSelected = (typeof selectedCustomTextTarget !== 'undefined' && selectedCustomTextTarget && selectedCustomTextTarget.gIdx === gIdx && selectedCustomTextTarget.fIdx === fIdx);
    if (isSelected) {
        ctx.save();
        ctx.strokeStyle = '#2dd4bf';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        const r = Math.round(Math.max(4, (item.boxRadius !== undefined ? item.boxRadius : 16) * scaleFactor));
        if (ctx.roundRect) ctx.roundRect(actualBoxX - 3, actualBoxY - 3, actualBoxW + 6, actualBoxH + 6, r + 2);
        else ctx.rect(actualBoxX - 3, actualBoxY - 3, actualBoxW + 6, actualBoxH + 6);
        ctx.stroke();
        ctx.restore();
    }

    const totalLinesH = lines.length * (size * (item.lineSpacing || 1.25));
    let textY = actualBoxY + pad + size * 0.85;
    if (targetH && actualBoxH > totalLinesH + pad * 2) {
        textY = actualBoxY + (actualBoxH - totalLinesH) / 2 + size * 0.85;
    }

    const hlPadX = Math.round((item.highlightPaddingX !== undefined ? item.highlightPaddingX : 8) * scaleFactor);
    const hlPadY = Math.round((item.highlightPaddingY !== undefined ? item.highlightPaddingY : 4) * scaleFactor);

    lines.forEach(lineText => {
        const lineW = ctx.measureText(lineText).width;
        let textX = actualBoxX + pad;
        if (item.hAlign === 'center') textX = actualBoxX + actualBoxW / 2;
        else if (item.hAlign === 'right') textX = actualBoxX + actualBoxW - pad;

        if (item.highlightColor && item.highlightColor !== 'transparent') {
            ctx.save();
            ctx.fillStyle = item.highlightColor;
            let hlX = textX;
            if (item.hAlign === 'center') hlX = textX - lineW / 2 - hlPadX;
            else if (item.hAlign === 'right') hlX = textX - lineW - hlPadX;
            else hlX = textX - hlPadX / 2;

            const hlW = lineW + hlPadX * 2;
            const hlH = size * 1.05 + hlPadY * 2;
            const hlY = textY - size * 0.8 - hlPadY;

            ctx.fillRect(hlX, hlY, hlW, hlH);
            ctx.restore();
        }

        ctx.save();
        ctx.font = `${fontStyle} ${size}px "${fontFam}", sans-serif`;
        ctx.textAlign = item.hAlign || 'left';

        if (item.shadowEnabled) {
            ctx.shadowColor = item.shadowColor || 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = item.shadowBlur !== undefined ? item.shadowBlur : 6;
            ctx.shadowOffsetX = item.shadowOffsetX !== undefined ? item.shadowOffsetX : 3;
            ctx.shadowOffsetY = item.shadowOffsetY !== undefined ? item.shadowOffsetY : 3;
        } else {
            ctx.shadowColor = 'transparent';
        }

        if (item.strokeEnabled) {
            ctx.strokeStyle = item.strokeColor || '#000000';
            ctx.lineWidth = Math.max(1, item.strokeWidth || 3);
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;
            ctx.strokeText(lineText, textX, textY);
        }

        ctx.fillStyle = item.color || '#ffffff';
        ctx.fillText(lineText, textX, textY);

        if (item.underline) {
            ctx.strokeStyle = item.color || '#ffffff';
            ctx.lineWidth = Math.max(1, size / 15);
            let startUlX = textX;
            if (item.hAlign === 'center') startUlX = textX - lineW / 2;
            else if (item.hAlign === 'right') startUlX = textX - lineW;
            ctx.beginPath();
            ctx.moveTo(startUlX, textY + 4);
            ctx.lineTo(startUlX + lineW, textY + 4);
            ctx.stroke();
        }

        ctx.restore();

        textY += size * (item.lineSpacing || 1.25);
    });

    ctx.restore();
    return isCustomCoords ? 0 : actualBoxH;
}

function calculateTextLines(ctx, text, maxW, fontSize, fontFam) {
    if (!text) return [];
    ctx.save();
    ctx.font = `bold ${fontSize}px "${fontFam || 'Quicksand'}", sans-serif`;
    const words = String(text).split(' ');
    let line = '';
    const lines = [];

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        if (ctx.measureText(testLine).width > maxW && n > 0) {
            lines.push(line.trim());
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line.trim());
    ctx.restore();
    return lines;
}

function drawCountdownOverlay(ctx, width, height, item, countVal) {
    ctx.save();
    const radius = 28;
    let cx = width - 60, cy = 60;

    if (item.position === 'center') {
        cx = width / 2; cy = height / 2;
    } else if (item.position === 'bottom_center') {
        cx = width / 2; cy = height - 70;
    }

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `900 28px "Plus Jakarta Sans"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(countVal.toString(), cx, cy + 2);
    ctx.restore();
}

function ptHexToRgbaStr(hex, alphaRatio = 1) {
    if (!hex) return `rgba(15, 23, 42, ${alphaRatio})`;
    if (hex.startsWith('rgba(')) {
        return hex.replace(/[\d.]+\)$/g, `${alphaRatio})`);
    }
    if (hex.startsWith('rgb(')) {
        return hex.replace('rgb(', 'rgba(').replace(')', `, ${alphaRatio})`);
    }
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    if (isNaN(num)) return `rgba(15, 23, 42, ${alphaRatio})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alphaRatio})`;
}

function drawProgressTrackerOverlay(ctx, width, height, item) {
    ctx.save();
    let activeTopicList = (typeof getParagraphFilteredDatasets === 'function') ? getParagraphFilteredDatasets() : importedDatasets;
    if (!activeTopicList || activeTopicList.length === 0) {
        activeTopicList = (typeof importedDatasets !== 'undefined' && importedDatasets.length > 0) ? importedDatasets : [{ topic: "Default", drills: [{}] }];
    }
    const totalCount = Math.max(1, activeTopicList.length);
    const curIdx = (typeof isParagraphRunning !== 'undefined' && isParagraphRunning) ? pCurrentSentenceIndex : 0;
    const currentSentence = Math.min(totalCount, curIdx + 1);

    const ratio = Math.min(1, Math.max(0, currentSentence / totalCount));
    const displayMode = item.displayMode || 'both'; // 'both' | 'bar' | 'text'
    const position = item.position || 'top_bar'; // 'top_bar' | 'bottom_bar' | 'top_right' | 'top_left' | 'bottom_center' | 'custom'

    // Áp dụng độ mờ đục toàn thẻ (Opacity)
    const overallOpacity = (item.opacity !== undefined ? item.opacity : 100) / 100;
    ctx.globalAlpha = Math.max(0.05, Math.min(1, overallOpacity));

    const barThickness = item.barThickness !== undefined ? item.barThickness : 8;
    const barColor = item.barColor || '#10b981';

    // Helper đổi màu kèm alpha
    function resolveColor(val, defaultHex, defaultAlphaPct) {
        if (!val) return ptHexToRgbaStr(defaultHex, defaultAlphaPct / 100);
        if (val.startsWith('rgba') || val.startsWith('rgb')) return val;
        return ptHexToRgbaStr(val, defaultAlphaPct / 100);
    }

    const pillBgAlpha = item.pillBgOpacity !== undefined ? item.pillBgOpacity : 85;
    const pillBgColor = resolveColor(item.pillBgColor, '#0f172a', pillBgAlpha);

    const borderAlpha = item.borderOpacity !== undefined ? item.borderOpacity : 25;
    const borderColor = resolveColor(item.borderColor, '#ffffff', borderAlpha);
    const borderWidth = item.borderWidth !== undefined ? item.borderWidth : 1.5;
    const borderRadius = item.borderRadius !== undefined ? item.borderRadius : 14;

    const barBgAlpha = item.barBgOpacity !== undefined ? item.barBgOpacity : 25;
    const barBgColor = resolveColor(item.barBgColor, '#ffffff', barBgAlpha);

    const textColor = item.textColor || '#ffffff';
    const fontSize = item.fontSize || 22;
    const fontWeight = item.fontWeight || 900;
    const hasShadow = item.shadow !== false;

    // Định dạng chữ đếm câu
    let template = item.textTemplate || "Câu {STT}/{Tổng_câu}";
    let textStr = template
        .replace(/\{STT\}|\{stt\}|\{current\}|\{cau\}/gi, currentSentence)
        .replace(/\{Tổng_câu\}|\{tong_cau\}|\{total\}|\{tong\}/gi, totalCount);

    ctx.font = `${fontWeight} ${fontSize}px "Plus Jakarta Sans", sans-serif`;
    const textMetrics = ctx.measureText(textStr);
    const textW = textMetrics.width;
    const textH = fontSize;

    if (position === 'top_bar' || position === 'bottom_bar') {
        const isTop = (position === 'top_bar');
        const barY = isTop ? 0 : (height - barThickness);

        // 1. Vẽ thanh tiến trình Full bề ngang
        if (displayMode === 'both' || displayMode === 'bar') {
            ctx.fillStyle = barBgColor;
            ctx.fillRect(0, barY, width, barThickness);

            ctx.fillStyle = barColor;
            ctx.fillRect(0, barY, width * ratio, barThickness);
        }

        // 2. Vẽ huy hiệu chữ (Pill)
        if (displayMode === 'both' || displayMode === 'text') {
            const pillPadX = 16;
            const pillPadY = 8;
            const pillW = (item.boxWidth && item.boxWidth > 0) ? item.boxWidth : (textW + pillPadX * 2);
            const pillH = (item.boxHeight && item.boxHeight > 0) ? item.boxHeight : (textH + pillPadY * 2);
            const pillX = (width - pillW) / 2;
            const pillY = isTop ? (barThickness + 14) : (barY - pillH - 14);

            if (hasShadow) {
                ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetY = 3;
            }

            ctx.beginPath();
            const rRadius = Math.min(borderRadius, pillH / 2);
            if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillW, pillH, rRadius);
            else ctx.rect(pillX, pillY, pillW, pillH);
            ctx.fillStyle = pillBgColor;
            ctx.fill();

            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            if (borderWidth > 0) {
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = borderWidth;
                ctx.stroke();
            }

            ctx.fillStyle = textColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(textStr, pillX + pillW / 2, pillY + pillH / 2 + 1);
        }
    } else {
        // top_right | top_left | bottom_center | custom
        const boxPadX = 16;
        const boxPadY = 10;
        const miniBarW = Math.max(90, textW);
        const autoBoxW = (displayMode === 'text' ? textW : Math.max(textW, miniBarW)) + boxPadX * 2;
        const autoBoxH = (displayMode === 'both' ? (textH + barThickness + 18) : (displayMode === 'bar' ? (barThickness + boxPadY * 2) : (textH + boxPadY * 2)));

        const boxW = (item.boxWidth && item.boxWidth > 0) ? item.boxWidth : autoBoxW;
        const boxH = (item.boxHeight && item.boxHeight > 0) ? item.boxHeight : autoBoxH;

        let boxX = 0, boxY = 0;
        if (position === 'top_right') {
            boxX = width - boxW - 28;
            boxY = 24;
        } else if (position === 'top_left') {
            boxX = 28;
            boxY = 24;
        } else if (position === 'bottom_center') {
            boxX = (width - boxW) / 2;
            boxY = height - boxH - 24;
        } else {
            // custom: Tọa độ Pixel tự do
            boxX = item.posX !== undefined ? item.posX : (width - boxW - 28);
            boxY = item.posY !== undefined ? item.posY : 24;
        }

        // Vẽ Hộp Container mờ bo tròn
        if (hasShadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = 4;
        }

        ctx.beginPath();
        const rRadius = Math.min(borderRadius, boxH / 2);
        if (ctx.roundRect) ctx.roundRect(boxX, boxY, boxW, boxH, rRadius);
        else ctx.rect(boxX, boxY, boxW, boxH);
        ctx.fillStyle = pillBgColor;
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        if (borderWidth > 0) {
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = borderWidth;
            ctx.stroke();
        }

        let curContentY = boxY + boxPadY;

        if (displayMode === 'both' || displayMode === 'text') {
            ctx.fillStyle = textColor;
            ctx.textAlign = 'center';
            if (displayMode === 'text') {
                ctx.textBaseline = 'middle';
                ctx.fillText(textStr, boxX + boxW / 2, boxY + boxH / 2 + 1);
            } else {
                ctx.textBaseline = 'top';
                ctx.fillText(textStr, boxX + boxW / 2, curContentY);
                curContentY += textH + 8;
            }
        }

        if (displayMode === 'both' || displayMode === 'bar') {
            const availW = Math.max(20, boxW - boxPadX * 2);
            const actualBarW = (item.barWidth && item.barWidth > 0) ? Math.min(availW, item.barWidth) : availW;
            const barStartX = boxX + (boxW - actualBarW) / 2;
            const barStartY = (displayMode === 'bar') ? (boxY + (boxH - barThickness) / 2) : (curContentY + (boxH - curContentY - barThickness) / 2);
            const barRadius = barThickness / 2;

            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(barStartX, barStartY, actualBarW, barThickness, barRadius);
            else ctx.rect(barStartX, barStartY, actualBarW, barThickness);
            ctx.fillStyle = barBgColor;
            ctx.fill();

            const fillW = Math.min(actualBarW, Math.max(0, actualBarW * ratio));
            if (fillW > 0) {
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(barStartX, barStartY, fillW, barThickness, barRadius);
                else ctx.rect(barStartX, barStartY, fillW, barThickness);
                ctx.fillStyle = barColor;
                ctx.fill();
            }
        }
    }

    ctx.restore();
}

function drawThemeBlobs(ctx, width, height) {
    ctx.save();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.04)';
    ctx.beginPath();
    ctx.arc(width * 0.9, height * 0.1, Math.min(width, height) * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawRect916PhotoFrame(ctx, x, y, w, h, imgFileName, fallbackKeyword, drawBorder = true, customRadius = 24, customOpacity = 100) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(100, customOpacity)) / 100;

    const radius = Math.min(customRadius, Math.min(w, h) / 2);

    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(x, y, w, h, radius);
    } else {
        ctx.rect(x, y, w, h);
    }
    ctx.clip();

    if (drawBorder) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(x, y, w, h);
    }

    const imgKey = (imgFileName || '').toLowerCase();
    if (localPCImageMap[imgKey]) {
        try {
            const img = localPCImageMap[imgKey];
            const scale = Math.max(w / img.width, h / img.height);
            const drawW = img.width * scale;
            const drawH = img.height * scale;
            const drawX = x + (w - drawW) / 2;
            const drawY = y + (h - drawH) / 2;
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
        } catch(e) {
            drawFallbackVectorIcon(ctx, x + w / 2, y + h / 2, fallbackKeyword);
        }
    } else {
        drawFallbackVectorIcon(ctx, x + w / 2, y + h / 2, fallbackKeyword);
    }

    if (drawBorder) {
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, radius);
        else ctx.rect(x, y, w, h);
        ctx.stroke();
    }
    ctx.restore();
}

function drawFallbackVectorIcon(ctx, cx, cy, keyword) {
    ctx.save();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(cx, cy, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 18px "Plus Jakarta Sans"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(keyword || "IMAGE", cx, cy);
    ctx.restore();
}

function syncToMiniBatchCanvas(isClean = false) {
    const miniCanvas = document.getElementById('batch-mini-preview-canvas');
    const sourceCanvas = (isClean && pCleanCanvas) ? pCleanCanvas : pCanvas;
    if (miniCanvas && sourceCanvas) {
        const mCtx = miniCanvas.getContext('2d');
        mCtx.clearRect(0, 0, miniCanvas.width, miniCanvas.height);
        mCtx.drawImage(sourceCanvas, 0, 0, miniCanvas.width, miniCanvas.height);
    }
}
