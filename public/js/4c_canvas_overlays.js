/**
 * 4c_canvas_overlays.js
 * Các thành phần phủ Canvas đặc biệt: đồng hồ đếm ngược (drawCountdownOverlay),
 * thanh tiến độ (drawProgressTrackerOverlay), khung ảnh đính kèm (drawRect916PhotoFrame) và họa tiết nền
 */

function renderCountdownNumberText(ctx, text, x, y, item, defaultColor, font) {
    const textColor = (item && item.textColor) ? item.textColor : defaultColor;
    const hasShadow = (item && item.textShadow !== undefined) ? item.textShadow : true;
    const shadowColor = (item && item.shadowColor) ? item.shadowColor : 'rgba(0, 0, 0, 0.95)';
    const shadowBlur = (item && item.shadowBlur !== undefined && !isNaN(Number(item.shadowBlur))) ? Number(item.shadowBlur) : 6;
    const hasGlow = (item && item.textGlow);
    const glowColor = (item && item.glowColor) ? item.glowColor : textColor;
    // Mặc định luôn bật viền nét tương phản nếu không cấu hình để số luôn rõ nét trên mọi nền video
    const hasStroke = (item && item.textStroke !== undefined) ? item.textStroke : true;
    const strokeColor = (item && item.strokeColor) ? item.strokeColor : '#000000';
    const strokeWidth = (item && item.strokeWidth !== undefined && !isNaN(Number(item.strokeWidth))) ? Number(item.strokeWidth) : 3;

    ctx.save();
    // BẮT BUỘC: Giữ cho chữ số luôn đạt 100% độ sáng (Solid 1.0), không bị ảnh hưởng bởi độ trong suốt của nền
    ctx.globalAlpha = 1.0;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 1. Vẽ lớp viền nét đen dày tương phản cao (Stroke Outline)
    if (hasStroke) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(text, x, y);
    }

    // 2. Hiệu ứng phát sáng Neon (Glow) hoặc đổ bóng sâu 2 lớp (Drop Shadow)
    if (hasGlow) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 16;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    } else if (hasShadow) {
        // Đổ bóng đậm nét 2 lớp giúp chữ số nổi hẳn lên khỏi nền
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = 1.5;
        ctx.shadowOffsetY = 2;
    } else {
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    ctx.fillStyle = textColor;
    ctx.fillText(text, x, y);

    // Vẽ thêm 1 pass chữ mờ để tăng cường độ tinh khiết của màu trắng/màu số
    if (hasShadow) {
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillText(text, x, y);
    }

    ctx.restore();
}

function drawCountdownOverlay(ctx, width, height, item, countVal, progressRatio = 1.0, remainingTime = null, totalDur = null, isSelected = false, isCleanMode = false, curGroupIdx = null, fIdx = null) {
    if (!item) return;
    ctx.save();

    // 1. Kích thước (Size in Pixel)
    const size = item.size || 'medium';
    let radius = 34;
    if (size === 'small') {
        radius = 24;
    } else if (size === 'large') {
        radius = 46;
    } else if (size === 'xlarge') {
        radius = 58;
    } else if (size === 'huge') {
        radius = 80;
    }

    // Tùy biến bán kính chính xác theo pixel
    if (item.radius !== undefined && item.radius !== null && !isNaN(Number(item.radius)) && Number(item.radius) > 0) {
        radius = Number(item.radius);
    }

    // Cỡ chữ số đếm ngược: nếu có tùy biến font size thì dùng, nếu không thì tự tính theo tỷ lệ 82% bán kính
    let fontSize = Math.max(12, Math.round(radius * 0.82));
    if (item.fontSize !== undefined && item.fontSize !== null && !isNaN(Number(item.fontSize)) && Number(item.fontSize) > 0) {
        fontSize = Number(item.fontSize);
    }

    // 2. Vị trí hiển thị (Positioning in Pixel)
    const pos = item.position || 'top_right';
    const marginDefault = Math.max(radius + 24, 68);
    let defaultX = width - marginDefault;
    let defaultY = marginDefault;

    if (pos === 'top_left') {
        defaultX = marginDefault;
        defaultY = marginDefault;
    } else if (pos === 'center') {
        defaultX = Math.round(width / 2);
        defaultY = Math.round(height / 2);
    } else if (pos === 'bottom_center') {
        defaultX = Math.round(width / 2);
        defaultY = height - marginDefault - 8;
    } else if (pos === 'bottom_right') {
        defaultX = width - marginDefault;
        defaultY = height - marginDefault - 8;
    } else if (pos === 'bottom_left') {
        defaultX = marginDefault;
        defaultY = height - marginDefault - 8;
    }

    // Tọa độ tâm đồng hồ: ưu tiên tuyệt đối posX, posY pixel tùy biến
    let cx = (item.posX !== undefined && item.posX !== null && !isNaN(Number(item.posX))) ? Number(item.posX) : defaultX;
    let cy = (item.posY !== undefined && item.posY !== null && !isNaN(Number(item.posY))) ? Number(item.posY) : defaultY;

    // Đăng ký vùng Hit-Box cho thao tác Click chuột trực tiếp trên Canvas
    if (!isCleanMode && curGroupIdx !== null && fIdx !== null && typeof canvasCountdownHitBoxes !== 'undefined') {
        const extraH = (item.preset === 'speaking_ring' && item.showSubLabel !== false && item.subLabel) ? 22 : 0;
        const hitBoxW = (item.preset === 'digital_badge' ? radius * 2.7 : (item.preset === 'minimal_pill' ? radius * 2.5 : radius * 2)) + 16;
        const hitBoxH = (item.preset === 'digital_badge' ? radius * 1.45 : (item.preset === 'minimal_pill' ? radius * 1.25 : radius * 2)) + 16 + extraH;
        canvasCountdownHitBoxes.push({
            gIdx: curGroupIdx,
            fIdx: fIdx,
            x: cx - hitBoxW / 2,
            y: cy - hitBoxH / 2,
            w: hitBoxW,
            h: hitBoxH
        });
    }

    // 3. Preset & Thuật toán chuyển màu (Color Shift Xanh ➔ Vàng ➔ Đỏ)
    const preset = item.preset || 'green_to_red';
    const isColorShift = (item.colorShift !== false);

    let mainColor = '#10b981';
    let glowColor = 'rgba(16, 185, 129, 0.4)';
    const clampedRatio = Math.max(0, Math.min(1, progressRatio));

    if (isColorShift) {
        if (clampedRatio > 0.5) {
            const t = (1 - clampedRatio) * 2;
            const r = Math.round(16 + (245 - 16) * t);
            const g = Math.round(185 + (158 - 185) * t);
            const b = Math.round(129 + (11 - 129) * t);
            mainColor = `rgb(${r}, ${g}, ${b})`;
            glowColor = `rgba(${r}, ${g}, ${b}, 0.4)`;
        } else if (clampedRatio > 0.18) {
            const t = (0.5 - clampedRatio) / 0.32;
            const r = Math.round(245 + (239 - 245) * t);
            const g = Math.round(158 + (68 - 158) * t);
            const b = Math.round(11 + (68 - 11) * t);
            mainColor = `rgb(${r}, ${g}, ${b})`;
            glowColor = `rgba(${r}, ${g}, ${b}, 0.55)`;
        } else {
            mainColor = '#ef4444';
            glowColor = 'rgba(239, 68, 68, 0.8)';
        }
    } else {
        mainColor = item.customColor || (preset === 'classic_circle' ? '#ef4444' : '#10b981');
        glowColor = ptHexToRgbaStr(mainColor, 0.4);
    }

    const isUrgent = (countVal <= 1 || clampedRatio <= 0.2);

    let pulseScale = 1.0;
    if (isUrgent && (preset === 'bomb_pulse' || preset === 'green_to_red' || preset === 'neon_ring')) {
        const tVal = (remainingTime !== null) ? remainingTime : countVal;
        const phase = (tVal % 1);
        pulseScale = 1.0 + 0.08 * Math.sin(phase * Math.PI * 2);
    }

    ctx.translate(cx, cy);
    ctx.scale(pulseScale, pulseScale);

    // 4. MÀU NỀN & ĐỘ MỜ ĐỤC NỀN ĐỒNG HỒ (Custom Background Color & Opacity)
    const rawBgColor = (item.bgColor !== undefined && item.bgColor !== null) ? item.bgColor : '#0f172a';
    const isTransparentBg = (preset === 'speaking_ring') || (rawBgColor === 'transparent' || rawBgColor === 'none' || item.bgOpacity === 0);
    const bgOpacityRatio = (item.bgOpacity !== undefined && !isNaN(Number(item.bgOpacity)))
        ? Math.max(0, Math.min(100, Number(item.bgOpacity))) / 100
        : (isTransparentBg ? 0 : 0.92);

    const computedBgFill = isTransparentBg ? 'transparent' : ptHexToRgbaStr(rawBgColor, bgOpacityRatio);

    // 4b. LỚP ĐỆM CHỐNG LÓA DÀY DẶN (Solid Anti-Glare Backing Disc)
    // Giúp cô lập đồng hồ và chữ số hoàn toàn khỏi các hình khối, màu sắc nền video phức tạp phía sau.
    // Nếu người dùng chọn trong suốt hoặc dùng mẫu Speaking Ring thì bỏ qua lớp đệm; nếu chọn nền đen hoặc màu tùy chỉnh thì áp dụng đúng tông màu.
    if (!isTransparentBg && bgOpacityRatio > 0.05 && preset !== 'speaking_ring') {
        ctx.save();
        ctx.globalAlpha = Math.min(1.0, bgOpacityRatio * 1.05);
        ctx.beginPath();
        if (preset === 'digital_badge') {
            const bW = radius * 2.7;
            const bH = radius * 1.45;
            if (ctx.roundRect) ctx.roundRect(-bW / 2, -bH / 2, bW, bH, 10);
            else ctx.rect(-bW / 2, -bH / 2, bW, bH);
        } else if (preset === 'minimal_pill') {
            const pW = radius * 2.5;
            const pH = radius * 1.25;
            if (ctx.roundRect) ctx.roundRect(-pW / 2, -pH / 2, pW, pH, pH / 2);
            else ctx.rect(-pW / 2, -pH / 2, pW, pH);
        } else {
            ctx.arc(0, 0, radius + 2, 0, Math.PI * 2);
        }
        ctx.fillStyle = ptHexToRgbaStr(rawBgColor, Math.min(1.0, bgOpacityRatio));
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 3;
        ctx.fill();
        ctx.restore();
    }

    // 5. Độ trong suốt của vỏ ngoài (Opacity)
    const opacity = (item.opacity !== undefined ? item.opacity : 100) / 100;
    ctx.globalAlpha = Math.max(0.05, Math.min(1, opacity));

    if (preset === 'speaking_ring') {
        // 1. Đường ray viền tròn thanh mảnh, tinh tế (Subtle Crisp Circular Track)
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.lineWidth = Math.max(2, Math.round(radius * 0.08));
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.stroke();

        // 2. Vòng tiến độ (Progress Ring): sắc nét đổi màu theo thời gian đếm ngược (Xanh -> Vàng -> Đỏ)
        const startAngle = -Math.PI / 2;
        const sweepAngle = Math.PI * 2 * clampedRatio;
        if (clampedRatio > 0.005) {
            ctx.beginPath();
            ctx.arc(0, 0, radius, startAngle, startAngle + sweepAngle);
            ctx.strokeStyle = mainColor;
            ctx.lineWidth = Math.max(3.5, Math.round(radius * 0.11));
            ctx.lineCap = 'round';
            ctx.shadowBlur = isUrgent ? 10 : 5;
            ctx.shadowColor = mainColor;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // 3. Hiển thị số đếm ở giữa: Chữ số trắng nổi bật, font sans-serif bo tròn đậm rõ, cân đối tâm hoàn hảo
        renderCountdownNumberText(ctx, countVal.toString(), 0, 1, item, '#ffffff', `800 ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`);

        // 4. Nhãn phụ bên dưới đáy vòng tròn (Ví dụ: "giây chuẩn bị", "còn lại để nói")
        const showSub = (item.showSubLabel !== false && item.subLabel && item.subLabel.trim() !== '');
        if (showSub) {
            ctx.save();
            const subText = item.subLabel.trim();
            const subFontSize = Math.max(10, Math.round(radius * 0.32));
            ctx.font = `600 ${subFontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
            ctx.fillStyle = item.subLabelColor || 'rgba(255, 255, 255, 0.85)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 1;
            ctx.fillText(subText, 0, radius + Math.max(6, Math.round(radius * 0.2)));
            ctx.restore();
        }

    } else if (preset === 'green_to_red') {
        if (!isTransparentBg) {
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fillStyle = computedBgFill;
            ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(0, 0, radius - 2, 0, Math.PI * 2);
        ctx.lineWidth = Math.max(3.5, radius * 0.13);
        ctx.strokeStyle = isTransparentBg ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)';
        ctx.stroke();

        const startAngle = -Math.PI / 2;
        const sweepAngle = Math.PI * 2 * clampedRatio;
        ctx.beginPath();
        ctx.arc(0, 0, radius - 2, startAngle, startAngle + sweepAngle);
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = Math.max(4, radius * 0.14);
        ctx.lineCap = 'round';
        ctx.shadowBlur = isUrgent ? 16 : 9;
        ctx.shadowColor = mainColor;
        ctx.stroke();
        ctx.shadowBlur = 0;

        renderCountdownNumberText(ctx, countVal.toString(), 0, 2, item, '#ffffff', `900 ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`);

    } else if (preset === 'neon_ring') {
        if (!isTransparentBg) {
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fillStyle = computedBgFill;
            ctx.fill();
        }

        ctx.shadowBlur = isUrgent ? 22 : 14;
        ctx.shadowColor = mainColor;
        ctx.lineWidth = Math.max(3.5, radius * 0.14);
        ctx.strokeStyle = mainColor;
        const startAngle = -Math.PI / 2;
        const sweepAngle = Math.PI * 2 * clampedRatio;
        ctx.beginPath();
        ctx.arc(0, 0, radius - 2, startAngle, startAngle + sweepAngle);
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        renderCountdownNumberText(ctx, countVal.toString(), 0, 1, item, '#ffffff', `900 ${fontSize}px "Plus Jakarta Sans", monospace`);

    } else if (preset === 'digital_badge') {
        const badgeW = radius * 2.7;
        const badgeH = radius * 1.45;
        const x0 = -badgeW / 2;
        const y0 = -badgeH / 2;
        const cornerR = 10;

        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x0, y0, badgeW, badgeH, cornerR);
        else ctx.rect(x0, y0, badgeW, badgeH);
        if (!isTransparentBg) {
            ctx.fillStyle = computedBgFill;
            ctx.fill();
        }

        ctx.lineWidth = 2;
        ctx.strokeStyle = mainColor;
        ctx.shadowBlur = isUrgent ? 10 : 5;
        ctx.shadowColor = mainColor;
        ctx.stroke();
        ctx.shadowBlur = 0;

        const paddedVal = countVal < 10 ? `0${countVal}s` : `${countVal}s`;
        renderCountdownNumberText(ctx, paddedVal, 0, -3, item, mainColor, `900 ${Math.round(fontSize * 0.82)}px "Courier New", monospace, sans-serif`);

        const barMargin = 7;
        const barW = badgeW - barMargin * 2;
        const barH = 3.5;
        const barY = y0 + badgeH - 6.5;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        if (ctx.roundRect) ctx.roundRect(x0 + barMargin, barY, barW, barH, 2);
        else ctx.rect(x0 + barMargin, barY, barW, barH);
        ctx.fill();

        ctx.fillStyle = mainColor;
        const activeBarW = Math.max(0, barW * clampedRatio);
        if (ctx.roundRect) ctx.roundRect(x0 + barMargin, barY, activeBarW, barH, 2);
        else ctx.rect(x0 + barMargin, barY, activeBarW, barH);
        ctx.fill();

    } else if (preset === 'minimal_pill') {
        const pillW = radius * 2.5;
        const pillH = radius * 1.25;
        const x0 = -pillW / 2;
        const y0 = -pillH / 2;
        const r = pillH / 2;

        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x0, y0, pillW, pillH, r);
        else ctx.rect(x0, y0, pillW, pillH);
        if (!isTransparentBg) {
            ctx.fillStyle = computedBgFill;
            ctx.fill();
        }
        ctx.lineWidth = 2;
        ctx.strokeStyle = mainColor;
        ctx.stroke();

        const iconX = x0 + pillH * 0.52;
        const iconY = 0;
        const iconR = pillH * 0.26;
        ctx.beginPath();
        ctx.arc(iconX, iconY, iconR, 0, Math.PI * 2);
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(iconX, iconY);
        ctx.lineTo(iconX, iconY - iconR * 0.55);
        ctx.lineTo(iconX + iconR * 0.45, iconY);
        ctx.stroke();

        renderCountdownNumberText(ctx, `${countVal}s`, pillW * 0.16, 1, item, '#ffffff', `800 ${Math.round(fontSize * 0.78)}px "Plus Jakarta Sans", sans-serif`);

    } else if (preset === 'bomb_pulse') {
        if (isUrgent) {
            ctx.beginPath();
            ctx.arc(0, 0, radius * 1.35, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = mainColor;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        renderCountdownNumberText(ctx, countVal.toString(), 0, 2, item, '#ffffff', `900 ${fontSize}px "Plus Jakarta Sans", sans-serif`);

    } else {
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        if (!isTransparentBg) {
            ctx.fillStyle = (item.bgColor && item.bgColor !== 'transparent') ? computedBgFill : mainColor;
            ctx.fill();
        }
        ctx.lineWidth = 2;
        ctx.strokeStyle = mainColor;
        ctx.stroke();

        renderCountdownNumberText(ctx, countVal.toString(), 0, 2, item, '#ffffff', `900 ${fontSize}px "Plus Jakarta Sans", sans-serif`);
    }

    // Khung viền viền chọn & thông số Pixel hiển thị trực quan trên Canvas khi được chọn
    if (isSelected && !isCleanMode) {
        ctx.save();
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 4]);

        const extraH = (preset === 'speaking_ring' && item.showSubLabel !== false && item.subLabel) ? 24 : 0;
        const boxW = (preset === 'digital_badge' ? radius * 2.7 : (preset === 'minimal_pill' ? radius * 2.5 : radius * 2)) + 12;
        const boxH = (preset === 'digital_badge' ? radius * 1.45 : (preset === 'minimal_pill' ? radius * 1.25 : radius * 2)) + 12;

        ctx.beginPath();
        if (preset === 'digital_badge' || preset === 'minimal_pill') {
            if (ctx.roundRect) ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 12);
            else ctx.rect(-boxW / 2, -boxH / 2, boxW, boxH);
        } else {
            ctx.arc(0, 0, radius + 6, 0, Math.PI * 2);
        }
        ctx.stroke();

        // Huy hiệu thông tin Tọa độ & Bán kính Pixel
        const tagText = `X:${Math.round(cx)} Y:${Math.round(cy)} | R:${Math.round(radius)}px`;
        ctx.font = 'bold 11px monospace';
        const tw = ctx.measureText(tagText).width + 12;
        const tagY = (preset === 'digital_badge' || preset === 'minimal_pill') ? (boxH / 2 + 5) : (radius + 10 + extraH);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        if (ctx.roundRect) ctx.roundRect(-tw / 2, tagY, tw, 18, 4);
        else ctx.rect(-tw / 2, tagY, tw, 18);
        ctx.fill();

        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        if (ctx.roundRect) ctx.roundRect(-tw / 2, tagY, tw, 18, 4);
        else ctx.rect(-tw / 2, tagY, tw, 18);
        ctx.stroke();

        ctx.fillStyle = '#fda4af';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagText, 0, tagY + 9);

        ctx.restore();
    }

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
