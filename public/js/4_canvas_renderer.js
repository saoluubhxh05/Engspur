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

    const isSingleMode = (paragraphGridConfig.presentationMode === 'single');
    const startSentenceIdx = isSingleMode ? (isParagraphRunning ? pCurrentSentenceIndex : 0) : 0;
    const maxSentencesToDraw = isSingleMode ? (startSentenceIdx + 1) : (isParagraphRunning ? Math.min(pCurrentSentenceIndex + 1, totalSentences) : totalSentences);

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
            if (grp.isInsideLoop === false && sIdx > 0) return;
            if (isOutsideOnlyRender && grp.isInsideLoop !== false) return;
            const targetColIdx = Math.max(1, Math.min(grp.targetColumn || 1, colCount));
            const isColLocked = matrix.colSyncSettings && matrix.colSyncSettings[targetColIdx] ? matrix.colSyncSettings[targetColIdx].locked : true;

            if (isColLocked) {
                lockedColumnsInRow.push(targetColIdx);
                const colLayout = colLayouts[targetColIdx - 1] || colLayouts[0];
                const groupW = colLayout.w;
                const customSpacing = (grp.fieldSpacing !== undefined ? grp.fieldSpacing : 12);
                let estimatedGroupH = 0;

                grp.fields.forEach(item => {
                    const itemType = item.type || 'field';
                    if (itemType === 'field') {
                        const fKey = typeof item === 'string' ? item : item.key;
                        const st = paragraphFieldStyles[fKey];
                        if (st && st.type !== 'image') {
                            const rawVal = (grp.isInsideLoop === false && sentenceDataMaps[0]) ? sentenceDataMaps[0][fKey] : dataMap[fKey];
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
            if (grp.isInsideLoop === false && sIdx > 0) return;
            if (isOutsideOnlyRender && grp.isInsideLoop !== false) return;
            if (isCurrentSentence) {
                const start = grp.startTime || 0;
                let end = start + (grp.duration || masterTimelineDuration);
                if (grp.snapEndToTotalDuration) {
                    const curTotal = (typeof getEffectiveSentenceDuration === 'function')
                        ? getEffectiveSentenceDuration(isParagraphRunning ? pCurrentSentenceIndex : 0)
                        : masterTimelineDuration;
                    end = curTotal;
                }
                // Nếu chưa đến thời điểm bắt đầu của lớp thì chưa vẽ
                if (currentTimelinePlayTime < start) return;

                // Chỉ ẩn khi hết thời lượng nếu lớp đó thuần túy là bộ đếm ngược countdown (không chứa text/image)
                const isOnlyCountdown = grp.fields && grp.fields.length > 0 && grp.fields.every(f => (typeof f === 'object' ? f.type : f) === 'countdown');
                if (isOnlyCountdown && currentTimelinePlayTime > end) return;

                // Các lớp nội dung (văn bản, dịch nghĩa, ảnh minh họa) một khi đã xuất hiện tại start
                // sẽ duy trì hiển thị liên tục đến hết câu và trong suốt khoảng nghỉ chuyển tiếp (transition),
                // loại bỏ triệt để hiện tượng mất nội dung hoặc chớp tắt giữa các câu.
            }

            const isGrpInsideLoop = (grp.isInsideLoop !== false);
            const activeDataMap = (!isGrpInsideLoop && sentenceDataMaps[0]) ? sentenceDataMaps[0] : dataMap;

            const targetColIdx = Math.max(1, Math.min(grp.targetColumn || 1, colCount));
            const colLayout = colLayouts[targetColIdx - 1] || colLayouts[0];
            const isColLocked = matrix.colSyncSettings && matrix.colSyncSettings[targetColIdx] ? matrix.colSyncSettings[targetColIdx].locked : true;
            const freeMode = matrix.colSyncSettings && matrix.colSyncSettings[targetColIdx] ? matrix.colSyncSettings[targetColIdx].freeMode : 'center';

            const offX = grp.offsetX || 0;
            const offY = grp.offsetY || 0;
            const originX = colLayout.x + offX;
            const groupW = colLayout.w;
            const rowOffsetPx = (grp.startRowOffset || 0) * 45;

            let currentFieldY = (isSingleMode ? paddingTop : colVerticalPositions[targetColIdx]) + rowOffsetPx + offY;

            ctx.save();
            const frameOpacity = grp.opacity !== undefined ? grp.opacity : 100;
            ctx.globalAlpha = Math.max(0, Math.min(100, frameOpacity)) / 100;
            const customSpacing = (grp.fieldSpacing !== undefined ? grp.fieldSpacing : 12);

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
                        let imgH = st.height !== undefined ? st.height : Math.max(260, effectiveHeight - 60);

                        if (!isColLocked) {
                            if (freeMode === 'center') {
                                imgX = originX;
                                imgY = paddingTop + (effectiveHeight - imgH) / 2;
                            } else if (freeMode === 'span') {
                                imgX = originX;
                                imgY = totalLockedBlockTop;
                                imgH = Math.max(200, totalLockedBlockBottom - totalLockedBlockTop);
                            }
                        }

                        const customR = st.boxRadius !== undefined ? st.boxRadius : 20;
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
                            const renderedHeight = drawAutoFlowCardBox(ctx, originX, currentFieldY, groupW, val, st);
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
                    const renderedHeight = drawCustomTextCardBox(ctx, originX, currentFieldY, groupW, item, paragraphGridConfig.groups.indexOf(grp), fIdx);
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

            ctx.restore();

            if (!isColLocked && !isSingleMode) {
                colVerticalPositions[targetColIdx] = currentFieldY;
            }
        });

        if (!isSingleMode) {
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

function drawAutoFlowCardBox(ctx, startX, startY, maxGroupW, textVal, st) {
    if (!textVal || String(textVal).trim() === "") {
        return 0;
    }
    ctx.save();
    let size = st.size || 28;
    const pad = st.boxPadding !== undefined ? st.boxPadding : 12;
    const indentL = st.indentLeft || 0;
    const indentR = st.indentRight || 0;
    const spaceB = st.spaceBefore || 0;
    const spaceA = st.spaceAfter || 0;

    const effectiveW = Math.max(40, maxGroupW - pad * 2 - indentL - indentR);
    
    ctx.font = `${st.style === 'bold' || st.style === 'extrabold' ? 'bold' : (st.style === 'italic' ? 'italic' : 'normal')} ${size}px "${st.font || 'Quicksand'}", sans-serif`;
    let lines = calculateTextLines(ctx, textVal, effectiveW, size, st.font);
    
    if (st.shrinkToFit !== false && lines.length > 3) {
        size = Math.max(16, Math.round(size * 0.85));
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
        actualBoxW = Math.min(maxGroupW, maxLineW + pad * 2 + indentL + indentR + 16);
        if (st.hAlign === 'center') actualBoxX = startX + (maxGroupW - actualBoxW) / 2;
        else if (st.hAlign === 'right') actualBoxX = startX + maxGroupW - actualBoxW;
    }

    if (st.boxBgColor && st.boxBgColor !== 'transparent') {
        ctx.fillStyle = st.boxBgColor;
        ctx.beginPath();
        const radius = Math.round(st.boxRadius !== undefined ? st.boxRadius : 18);
        if (ctx.roundRect) ctx.roundRect(actualBoxX, startY + spaceB, actualBoxW, actualBoxH - spaceB - spaceA, radius);
        else ctx.rect(actualBoxX, startY + spaceB, actualBoxW, actualBoxH - spaceB - spaceA);
        ctx.fill();

        ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    let textY = startY + spaceB + pad + size * 0.85;

    const hlPadX = st.highlightPaddingX !== undefined ? st.highlightPaddingX : 8;
    const hlPadY = st.highlightPaddingY !== undefined ? st.highlightPaddingY : 4;

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
            ctx.lineWidth = Math.max(1, size / 15);
            let startUlX = textX;
            if (st.hAlign === 'center') startUlX = textX - lineW / 2;
            else if (st.hAlign === 'right') startUlX = textX - lineW;
            ctx.beginPath();
            ctx.moveTo(startUlX, textY + 4);
            ctx.lineTo(startUlX + lineW, textY + 4);
            ctx.stroke();
            ctx.restore();
        }

        textY += size * (st.lineSpacing || 1.25);
    });

    ctx.restore();
    return actualBoxH;
}

function drawCustomTextCardBox(ctx, startX, startY, maxGroupW, rawItem, gIdx, fIdx) {
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
    const targetH = isCustomCoords ? (item.height !== undefined ? item.height : 100) : null;

    let size = item.size || 28;
    const pad = item.boxPadding !== undefined ? item.boxPadding : 12;
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
        size = Math.max(16, Math.round(size * 0.85));
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
        actualBoxW = Math.min(maxGroupW, maxLineW + pad * 2 + 16);
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
        const radius = Math.round(item.boxRadius !== undefined ? item.boxRadius : 16);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(actualBoxX, actualBoxY, actualBoxW, actualBoxH, radius);
        else ctx.rect(actualBoxX, actualBoxY, actualBoxW, actualBoxH);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1.5;
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
        const r = Math.round(item.boxRadius !== undefined ? item.boxRadius : 16);
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

    const hlPadX = item.highlightPaddingX !== undefined ? item.highlightPaddingX : 8;
    const hlPadY = item.highlightPaddingY !== undefined ? item.highlightPaddingY : 4;

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
    const barThickness = item.barThickness !== undefined ? item.barThickness : 8;
    const barColor = item.barColor || '#10b981';
    const barBgColor = item.barBgColor || 'rgba(255, 255, 255, 0.25)';
    const pillBgColor = item.pillBgColor || 'rgba(15, 23, 42, 0.85)';
    const textColor = item.textColor || '#ffffff';
    const fontSize = item.fontSize || 22;

    // Định dạng chữ đếm câu
    let template = item.textTemplate || "Câu {STT}/{Tổng_câu}";
    let textStr = template
        .replace(/\{STT\}|\{stt\}|\{current\}|\{cau\}/gi, currentSentence)
        .replace(/\{Tổng_câu\}|\{tong_cau\}|\{total\}|\{tong\}/gi, totalCount);

    ctx.font = `900 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
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
            const pillPadX = 14;
            const pillPadY = 6;
            const pillW = textW + pillPadX * 2;
            const pillH = textH + pillPadY * 2;
            const pillX = (width - pillW) / 2;
            const pillY = isTop ? (barThickness + 14) : (barY - pillH - 14);

            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
            else ctx.rect(pillX, pillY, pillW, pillH);
            ctx.fillStyle = pillBgColor;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = textColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(textStr, width / 2, pillY + pillH / 2 + 1);
        }
    } else if (position === 'top_right' || position === 'top_left' || position === 'bottom_center' || position === 'custom') {
        let boxX = 0, boxY = 0;
        const boxPadX = 14;
        const boxPadY = 8;
        const miniBarW = Math.max(90, textW);
        const boxW = (displayMode === 'text' ? textW : Math.max(textW, miniBarW)) + boxPadX * 2;
        const boxH = (displayMode === 'both' ? (textH + barThickness + 14) : (displayMode === 'bar' ? (barThickness + boxPadY * 2) : (textH + boxPadY * 2)));

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
            boxX = ((item.posX !== undefined ? item.posX : 50) / 100) * width - boxW / 2;
            boxY = ((item.posY !== undefined ? item.posY : 5) / 100) * height;
        }

        // Vẽ Hộp Container mờ bo tròn
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(boxX, boxY, boxW, boxH, 14);
        else ctx.rect(boxX, boxY, boxW, boxH);
        ctx.fillStyle = pillBgColor;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        let curContentY = boxY + boxPadY;

        if (displayMode === 'both' || displayMode === 'text') {
            ctx.fillStyle = textColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(textStr, boxX + boxW / 2, curContentY);
            curContentY += textH + 8;
        }

        if (displayMode === 'both' || displayMode === 'bar') {
            const barStartX = boxX + (boxW - miniBarW) / 2;
            const barStartY = (displayMode === 'bar') ? (boxY + (boxH - barThickness) / 2) : curContentY;

            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(barStartX, barStartY, miniBarW, barThickness, barThickness / 2);
            else ctx.rect(barStartX, barStartY, miniBarW, barThickness);
            ctx.fillStyle = barBgColor;
            ctx.fill();

            const fillW = Math.max(barThickness, miniBarW * ratio);
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(barStartX, barStartY, fillW, barThickness, barThickness / 2);
            else ctx.rect(barStartX, barStartY, fillW, barThickness);
            ctx.fillStyle = barColor;
            ctx.fill();
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
