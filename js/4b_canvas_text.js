/**
 * 4b_canvas_text.js
 * Động cơ kết xuất văn bản Canvas: tự động ngắt dòng thông minh (calculateTextLines),
 * hộp thẻ co giãn tự ôm sát (drawAutoFlowCardBox) và thẻ chữ tự do (drawCustomTextCardBox)
 */

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

