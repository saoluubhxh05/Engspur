/**
 * 4a_canvas_engine.js
 * Lõi đồ họa Canvas 1920x1080: quản lý context, render khung hình chính (renderSingleFrameToContext) và đồng bộ Canvas
 */

var miniBatchFrameCounter = 0;
var canvasCustomTextHitBoxes = [];
var canvasFieldHitBoxes = [];
var canvasCountdownHitBoxes = [];
var canvasVideoHitBoxes = [];

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
                    if (typeof focusAndScrollToLayer === 'function') {
                        focusAndScrollToLayer(hb.gIdx);
                    }
                    return;
                }
            }

            // 2. Hit-test Thẻ Đồng Hồ Đếm Ngược
            for (let i = canvasCountdownHitBoxes.length - 1; i >= 0; i--) {
                const cb = canvasCountdownHitBoxes[i];
                if (clickX >= cb.x && clickX <= cb.x + cb.w && clickY >= cb.y && clickY <= cb.y + cb.h) {
                    if (typeof selectCountdownItem === 'function') {
                        selectCountdownItem(cb.gIdx, cb.fIdx);
                    }
                    if (typeof focusAndScrollToLayer === 'function') {
                        focusAndScrollToLayer(cb.gIdx);
                    }
                    return;
                }
            }

            // 2b. Hit-test Thẻ Video Clip
            for (let i = canvasVideoHitBoxes.length - 1; i >= 0; i--) {
                const vb = canvasVideoHitBoxes[i];
                if (clickX >= vb.x && clickX <= vb.x + vb.w && clickY >= vb.y && clickY <= vb.y + vb.h) {
                    if (typeof selectVideoItem === 'function') {
                        selectVideoItem(vb.gIdx, vb.fIdx);
                    }
                    if (typeof focusAndScrollToLayer === 'function') {
                        focusAndScrollToLayer(vb.gIdx);
                    }
                    return;
                }
            }

            // 3. Hit-test Các Thẻ Trường Mail Merge / Khung Ảnh
            for (let i = canvasFieldHitBoxes.length - 1; i >= 0; i--) {
                const fb = canvasFieldHitBoxes[i];
                if (clickX >= fb.x && clickX <= fb.x + fb.w && clickY >= fb.y && clickY <= fb.y + fb.h) {
                    if (typeof selectLayerFieldItem === 'function') {
                        selectLayerFieldItem(fb.gIdx, fb.fKey, e);
                    } else if (typeof toggleSelectFieldMulti === 'function') {
                        paragraphSelectedGroupIdx = fb.gIdx;
                        toggleSelectFieldMulti(fb.fKey, e);
                    }
                    if (typeof focusAndScrollToLayer === 'function') {
                        focusAndScrollToLayer(fb.gIdx);
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
        canvasCountdownHitBoxes = [];
        canvasVideoHitBoxes = [];
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

    // TÍNH TOÁN & VẼ KHUNG VIỀN BAO GỘP CỘT (MODE 2 - COLUMN BOX WRAPPER)
    const wrapBox = matrix.columnBoxWrapper;
    const isWrapBoxActive = !!(wrapBox && wrapBox.enabled);
    const wrapLayerOrder = (wrapBox && wrapBox.layerOrder) ? wrapBox.layerOrder : 'under';
    let wrapBoxX = 0, wrapBoxW = 0, wrapBoxPadLeft = 0, wrapBoxPadRight = 0, wrapBoxPadTop = 0, wrapBoxPadBottom = 0;
    let wrapStartCol = 1, wrapEndCol = 2;
    let wrapMaxY = paddingTop;
    let wrapMinY = height;
    let wrapActualContentBottom = 0;
    let isFullGrid = false, isFullHeight = false;
    let finalBoxY = paddingTop, finalBoxH = effectiveHeight;
    let boxRadius = 20;

    if (isWrapBoxActive) {
        wrapStartCol = Math.max(1, Math.min(colCount, parseInt(wrapBox.startCol) || 1));
        wrapEndCol = Math.max(wrapStartCol, Math.min(colCount, parseInt(wrapBox.endCol) || 2));
        
        const padXFallback = wrapBox.paddingX !== undefined ? wrapBox.paddingX : 16;
        const padYFallback = wrapBox.paddingY !== undefined ? wrapBox.paddingY : 16;
        wrapBoxPadLeft = wrapBox.paddingLeft !== undefined ? wrapBox.paddingLeft : padXFallback;
        wrapBoxPadRight = wrapBox.paddingRight !== undefined ? wrapBox.paddingRight : padXFallback;
        wrapBoxPadTop = wrapBox.paddingTop !== undefined ? wrapBox.paddingTop : padYFallback;
        wrapBoxPadBottom = wrapBox.paddingBottom !== undefined ? wrapBox.paddingBottom : padYFallback;

        isFullGrid = (wrapBox.heightMode === 'full' || wrapBox.heightMode === 'full_grid');
        isFullHeight = (isFullGrid || wrapBox.heightMode === 'full_cols');

        let startColLayout, endColLayout;
        if (isFullGrid) {
            startColLayout = colLayouts[0];
            endColLayout = colLayouts[colLayouts.length - 1];
        } else {
            startColLayout = colLayouts[wrapStartCol - 1] || colLayouts[0];
            endColLayout = colLayouts[wrapEndCol - 1] || colLayouts[colLayouts.length - 1];
        }

        if (startColLayout && endColLayout) {
            wrapBoxX = startColLayout.x - wrapBoxPadLeft;
            wrapBoxW = Math.max(0, (endColLayout.x + endColLayout.w) - startColLayout.x + wrapBoxPadLeft + wrapBoxPadRight);
        }

        if (isFullHeight) {
            finalBoxY = paddingTop - wrapBoxPadTop;
            finalBoxH = Math.max(10, effectiveHeight + wrapBoxPadTop + wrapBoxPadBottom);
        } else {
            // Tự động tính toán trước chiều cao ôm sát nội dung bài tập (Auto Height Mode)
            let estMinY = height;
            let estMaxBottom = 0;
            let tempColY = new Array(colCount + 1).fill(paddingTop);

            for (let sIdx = startSentenceIdx; sIdx < maxSentencesToDraw; sIdx++) {
                const curMap = sentenceDataMaps[sIdx] || sentenceDataMaps[0];
                let curMaxLockedH = 0;
                let lockedCols = [];

                paragraphGridConfig.groups.forEach(grp => {
                    if (grp.visible === false) return;
                    const grpPos = grp.loopPosition || (grp.isInsideLoop === false ? 'outside' : 'inside');
                    if (grpPos !== 'inside' && sIdx > 0) return;

                    const tCol = Math.max(1, Math.min(grp.targetColumn || 1, colCount));
                    const isLocked = matrix.colSyncSettings && matrix.colSyncSettings[tCol] ? matrix.colSyncSettings[tCol].locked : true;
                    const grpMode = typeof getGroupPresentationMode === 'function' ? getGroupPresentationMode(grp) : (grp.presentationMode || paragraphGridConfig.presentationMode || 'single');

                    if (grpMode === 'single' && sIdx !== activeSentenceIdx) return;
                    if (grpMode === 'stack' && isParagraphRunning && sIdx > activeSentenceIdx) return;

                    const colLay = colLayouts[tCol - 1] || colLayouts[0];
                    let gW = colLay.w;
                    if (grp.colSpan) {
                        if (grp.colSpan === 'all') {
                            gW = (colLayouts[colCount - 1].x + colLayouts[colCount - 1].w) - colLayouts[0].x;
                        } else {
                            const spanC = Math.min(parseInt(grp.colSpan) || 1, colCount - tCol + 1);
                            if (spanC > 1 && colLayouts[tCol - 1 + spanC - 1]) {
                                gW = (colLayouts[tCol - 1 + spanC - 1].x + colLayouts[tCol - 1 + spanC - 1].w) - colLay.x;
                            }
                        }
                    }

                    const rowOff = (grp.startRowOffset || 0) * 45;
                    const gY = (grpMode === 'single' ? paddingTop : tempColY[tCol]) + rowOff + (grp.offsetY || 0);
                    const gH = Math.max(20, estimateGroupContentHeight(ctx, grp, curMap, gW, (grpPos === 'inside'), sentenceDataMaps, 1.0));

                    if (tCol >= wrapStartCol && tCol <= wrapEndCol) {
                        estMinY = Math.min(estMinY, gY);
                        estMaxBottom = Math.max(estMaxBottom, gY + gH);
                    }

                    if (isLocked) {
                        lockedCols.push(tCol);
                        if (gH > curMaxLockedH) curMaxLockedH = gH;
                    } else if (grpMode !== 'single') {
                        tempColY[tCol] = gY + gH;
                    }
                });

                if (hasAnyStackLayer || hasAnyAllLayer) {
                    const nextStartY = (lockedCols.length > 0 ? tempColY[lockedCols[0]] : paddingTop) + curMaxLockedH + blockGap;
                    for (let c = 1; c <= colCount; c++) {
                        if (matrix.colSyncSettings && matrix.colSyncSettings[c] && matrix.colSyncSettings[c].locked) {
                            tempColY[c] = nextStartY;
                        }
                    }
                    if (wrapStartCol <= 2 && wrapEndCol >= 1) {
                        estMaxBottom = Math.max(estMaxBottom, nextStartY - blockGap);
                    }
                }
            }

            const cTop = (estMinY < height) ? estMinY : (paragraphGridConfig._cachedWrapBoxY !== undefined ? paragraphGridConfig._cachedWrapBoxY : paddingTop);
            const cBottom = (estMaxBottom > 0) ? estMaxBottom : (paragraphGridConfig._cachedWrapBoxH ? (cTop + paragraphGridConfig._cachedWrapBoxH) : (cTop + effectiveHeight * 0.7));

            finalBoxY = cTop - wrapBoxPadTop;
            finalBoxH = Math.max(10, cBottom + wrapBoxPadBottom - finalBoxY);
            paragraphGridConfig._cachedWrapBoxH = finalBoxH;
            paragraphGridConfig._cachedWrapBoxY = cTop;
        }

        boxRadius = Math.max(0, Math.min(Math.min(wrapBoxW / 2, finalBoxH / 2), parseInt(wrapBox.borderRadius) !== undefined ? parseInt(wrapBox.borderRadius) : 20));

        // VẼ KHUNG VIỀN NẰM DƯỚI (LAYER ORDER: 'under' - MẶC ĐỊNH CHO PHONG CÁCH TIÊU ĐỀ ĐÈ LÊN VIỀN)
        // Nếu layerOrder !== 'over', vẽ cả Nền (Fill) và Nét Viền (Stroke) ngay tại đây
        // Nhờ đó, bất kỳ thẻ tiêu đề nào có màu nền khi vẽ sau sẽ tự nhiên che phủ và nổi lên trên nét viền!
        if (wrapBoxW > 0 && finalBoxH > 0) {
            ctx.save();
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(wrapBoxX, finalBoxY, wrapBoxW, finalBoxH, boxRadius);
            else ctx.rect(wrapBoxX, finalBoxY, wrapBoxW, finalBoxH);

            if (wrapBox.bgColor && wrapBox.bgColor !== 'transparent') {
                ctx.fillStyle = wrapBox.bgColor;
                ctx.fill();
            }

            if (wrapLayerOrder !== 'over') {
                const bWidth = Math.max(1, parseInt(wrapBox.borderWidth) || 3);
                const bColor = wrapBox.borderColor || '#d99a14';
                if (bColor && bColor !== 'transparent') {
                    ctx.strokeStyle = bColor;
                    ctx.lineWidth = bWidth;
                    ctx.stroke();
                }
            }
            ctx.restore();
        }
    }

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
            if (grp.visible === false) return;
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
            if (grp.visible === false) return;
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
                        if (isWrapBoxActive && targetColIdx >= wrapStartCol && targetColIdx <= wrapEndCol) {
                            wrapMinY = Math.min(wrapMinY, imgY);
                            wrapActualContentBottom = Math.max(wrapActualContentBottom, imgY + imgH);
                        }
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
                            if (isWrapBoxActive && targetColIdx >= wrapStartCol && targetColIdx <= wrapEndCol) {
                                wrapMinY = Math.min(wrapMinY, currentFieldY);
                                wrapActualContentBottom = Math.max(wrapActualContentBottom, currentFieldY + renderedHeight);
                            }
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
                    if (isWrapBoxActive && targetColIdx >= wrapStartCol && targetColIdx <= wrapEndCol) {
                        wrapMinY = Math.min(wrapMinY, currentFieldY);
                        wrapActualContentBottom = Math.max(wrapActualContentBottom, currentFieldY + renderedHeight);
                    }
                    if (!item.useCustomCoords) {
                        currentFieldY += renderedHeight + customSpacing;
                    }
                } else if (itemType === 'countdown') {
                    const start = grp.startTime || 0;
                    const dur = grp.duration || item.seconds || 3.0;
                    const end = start + dur;
                    const isPlaying = (isParagraphRunning || isTimelinePlaying);
                    const curGroupIdx = paragraphGridConfig.groups.indexOf(grp);
                    const isThisCountdownSelected = (typeof selectedCountdownTarget !== 'undefined' && selectedCountdownTarget && selectedCountdownTarget.gIdx === curGroupIdx && selectedCountdownTarget.fIdx === fIdx);

                    if (isPlaying) {
                        if (currentTimelinePlayTime >= start && currentTimelinePlayTime <= end) {
                            const remaining = Math.max(0, end - currentTimelinePlayTime);
                            const countVal = Math.max(1, Math.ceil(remaining));
                            const progressRatio = Math.max(0, Math.min(1, remaining / dur));
                            drawCountdownOverlay(ctx, width, height, item, countVal, progressRatio, remaining, dur, isThisCountdownSelected, isCleanMode, curGroupIdx, fIdx);
                        }
                    } else {
                        if (currentTimelinePlayTime >= start && currentTimelinePlayTime <= end) {
                            const remaining = Math.max(0, end - currentTimelinePlayTime);
                            const countVal = Math.max(1, Math.ceil(remaining));
                            const progressRatio = Math.max(0, Math.min(1, remaining / dur));
                            drawCountdownOverlay(ctx, width, height, item, countVal, progressRatio, remaining, dur, isThisCountdownSelected, isCleanMode, curGroupIdx, fIdx);
                        } else if (isThisCountdownSelected && !isCleanMode) {
                            // Xem trước trực tiếp khi người dùng bấm chọn thẻ Đếm ngược trong Inspector hoặc Danh sách lớp
                            const previewCount = item.seconds !== undefined ? item.seconds : 3;
                            drawCountdownOverlay(ctx, width, height, item, previewCount, 1.0, previewCount, dur, isThisCountdownSelected, isCleanMode, curGroupIdx, fIdx);
                        }
                    }
                } else if (itemType === 'progress_tracker') {
                    drawProgressTrackerOverlay(ctx, width, height, item);
                } else if (itemType === 'video') {
                    const isPlaying = (isParagraphRunning || isTimelinePlaying);
                    const curGroupIdx = paragraphGridConfig.groups.indexOf(grp);
                    const isThisVideoSelected = (typeof selectedVideoTarget !== 'undefined' && selectedVideoTarget && selectedVideoTarget.gIdx === curGroupIdx && selectedVideoTarget.fIdx === fIdx);
                    if (typeof drawVideoOverlay === 'function') {
                        drawVideoOverlay(ctx, width, height, item, activeDataMap, isPlaying, isThisVideoSelected, isCleanMode, curGroupIdx, fIdx);
                    }
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

            ctx.restore();

            if (!isColLocked && grpMode !== 'single') {
                colVerticalPositions[targetColIdx] = currentFieldY;
            }

            if (isWrapBoxActive && targetColIdx >= wrapStartCol && targetColIdx <= wrapEndCol) {
                wrapMaxY = Math.max(wrapMaxY, currentFieldY);
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
            if (isWrapBoxActive && wrapStartCol <= 2 && wrapEndCol >= 1) {
                wrapMaxY = Math.max(wrapMaxY, totalLockedBlockBottom - blockGap);
            }
        }
    }

    // CẬP NHẬT KÍCH THƯỚC ĐO THỰC TẾ & VẼ NÉT VIỀN ĐÈ LÊN NẾU CHỌN CHẾ ĐỘ 'over' (NẰM TRÊN CÙNG)
    if (isWrapBoxActive && wrapBoxW > 0) {
        const isFullGrid = (wrapBox.heightMode === 'full' || wrapBox.heightMode === 'full_grid');
        const isFullHeight = (isFullGrid || wrapBox.heightMode === 'full_cols');

        const contentTop = (wrapMinY < height) ? wrapMinY : paddingTop;
        const contentBottom = (wrapActualContentBottom > 0) ? wrapActualContentBottom : Math.max(contentTop + 40, wrapMaxY);

        const measuredBoxY = isFullHeight
            ? (paddingTop - wrapBoxPadTop)
            : (contentTop - wrapBoxPadTop);
        const measuredBoxBottom = isFullHeight
            ? (paddingTop + effectiveHeight + wrapBoxPadBottom)
            : (contentBottom + wrapBoxPadBottom);
            
        const measuredBoxH = Math.max(10, measuredBoxBottom - measuredBoxY);
        paragraphGridConfig._cachedWrapBoxH = measuredBoxH;
        paragraphGridConfig._cachedWrapBoxY = contentTop;

        // Chỉ vẽ nét viền ở đây nếu người dùng chọn chế độ 'over' (nằm trên cùng đè lên nội dung)
        // Còn chế độ mặc định 'under' (nằm dưới tiêu đề & nội dung) đã được vẽ ở tầng đáy trước khi vẽ các lớp
        if (wrapLayerOrder === 'over') {
            const measuredRadius = Math.max(0, Math.min(Math.min(wrapBoxW / 2, measuredBoxH / 2), parseInt(wrapBox.borderRadius) !== undefined ? parseInt(wrapBox.borderRadius) : 20));

            ctx.save();
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(wrapBoxX, measuredBoxY, wrapBoxW, measuredBoxH, measuredRadius);
            } else {
                ctx.rect(wrapBoxX, measuredBoxY, wrapBoxW, measuredBoxH);
            }

            const bWidth = Math.max(1, parseInt(wrapBox.borderWidth) || 3);
            const bColor = wrapBox.borderColor || '#d99a14';
            if (bColor && bColor !== 'transparent') {
                ctx.strokeStyle = bColor;
                ctx.lineWidth = bWidth;
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    // BẢN SẠCH: KHÔNG VẼ LOGO / BADGE THƯƠNG HIỆU
    if (!isCleanMode && canvasBadgeImage) {
        ctx.save();
        const bdSt = videoConfig.badgeStyle || { widthPct: 15, heightPct: 10, posX: 82, posY: 4, opacity: 100, borderRadius: 20, isCircle: true, removeWhiteBg: false, maskInsetPct: 5 };
        ctx.globalAlpha = (bdSt.opacity !== undefined ? bdSt.opacity : 100) / 100;
        const bdW = (width * (bdSt.widthPct || 15)) / 100;
        const aspect = canvasBadgeImage.height / canvasBadgeImage.width;
        const bdH = bdW * aspect;
        const bdX = (width * (bdSt.posX !== undefined ? bdSt.posX : 82)) / 100;
        const bdY = (height * (bdSt.posY !== undefined ? bdSt.posY : 4)) / 100;
        const isCircle = bdSt.isCircle !== false; // Mặc định cắt tròn hoàn hảo
        const radius = bdSt.borderRadius !== undefined ? bdSt.borderRadius : 20;
        const maskInsetPct = (bdSt.maskInsetPct !== undefined && !isNaN(bdSt.maskInsetPct)) ? bdSt.maskInsetPct : 5;

        ctx.beginPath();
        if (isCircle) {
            // Cắt mặt nạ hình tròn theo tâm của logo, áp dụng tỷ lệ thu gọn vào trong (maskInsetPct) để ôm sát khít
            const centerX = bdX + bdW / 2;
            const centerY = bdY + bdH / 2;
            const insetFactor = Math.max(0, (100 - maskInsetPct) / 100);
            const rX = (bdW / 2) * insetFactor;
            const rY = (bdH / 2) * insetFactor;
            if (ctx.ellipse) {
                ctx.ellipse(centerX, centerY, rX, rY, 0, 0, Math.PI * 2);
            } else {
                ctx.arc(centerX, centerY, Math.min(rX, rY), 0, Math.PI * 2);
            }
        } else {
            // Chế độ chữ nhật bo góc truyền thống (có thể thu viền nhẹ nếu có inset)
            if (maskInsetPct > 0) {
                const insetX = (bdW * maskInsetPct) / 200;
                const insetY = (bdH * maskInsetPct) / 200;
                const innerW = bdW - insetX * 2;
                const innerH = bdH - insetY * 2;
                if (ctx.roundRect) ctx.roundRect(bdX + insetX, bdY + insetY, innerW, innerH, radius);
                else ctx.rect(bdX + insetX, bdY + insetY, innerW, innerH);
            } else {
                if (ctx.roundRect) ctx.roundRect(bdX, bdY, bdW, bdH, radius);
                else ctx.rect(bdX, bdY, bdW, bdH);
            }
        }
        ctx.clip();

        // Xử lý khử nền trắng nếu bật tùy chọn removeWhiteBg
        if (bdSt.removeWhiteBg) {
            if (!window._cachedFilteredBadgeImg || window._cachedFilteredBadgeSrc !== canvasBadgeBase64) {
                try {
                    const offCanvas = document.createElement('canvas');
                    offCanvas.width = canvasBadgeImage.naturalWidth || canvasBadgeImage.width;
                    offCanvas.height = canvasBadgeImage.naturalHeight || canvasBadgeImage.height;
                    const offCtx = offCanvas.getContext('2d');
                    offCtx.drawImage(canvasBadgeImage, 0, 0);
                    const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
                    const d = imgData.data;
                    const threshold = 230; // Ngưỡng nhận diện màu trắng hoặc gần trắng
                    for (let i = 0; i < d.length; i += 4) {
                        const r = d[i], g = d[i + 1], b = d[i + 2];
                        if (r > threshold && g > threshold && b > threshold) {
                            // Làm trong suốt điểm ảnh trắng
                            d[i + 3] = 0;
                        }
                    }
                    offCtx.putImageData(imgData, 0, 0);
                    window._cachedFilteredBadgeImg = offCanvas;
                    window._cachedFilteredBadgeSrc = canvasBadgeBase64;
                } catch (e) {
                    window._cachedFilteredBadgeImg = null;
                }
            }
            const renderImg = window._cachedFilteredBadgeImg || canvasBadgeImage;
            ctx.drawImage(renderImg, bdX, bdY, bdW, bdH);
        } else {
            ctx.drawImage(canvasBadgeImage, bdX, bdY, bdW, bdH);
        }

        ctx.restore();
    }
}

