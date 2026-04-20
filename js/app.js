/* ===========================
   Castalia Field Report – App Logic
   =========================== */

(function () {
    'use strict';

    // ── DOM References ──
    const splashScreen = document.getElementById('splash-screen');
    const formView = document.getElementById('form-view');
    const reportView = document.getElementById('report-view');
    const reportForm = document.getElementById('report-form');
    const lakesContainer = document.getElementById('lakes-container');
    const btnAddLake = document.getElementById('btn-add-lake');
    const btnBack = document.getElementById('btn-back');
    const btnPrint = document.getElementById('btn-print');
    const reportInfoGrid = document.getElementById('report-info-grid');
    const sectionLakesReport = document.getElementById('section-lakes-report');
    const sectionRecommendationsReport = document.getElementById('section-recommendations-report');
    const sectionActionsReport = document.getElementById('section-actions-report');

    // ── Auto-fill Today's Date ──
    const dateInput = document.getElementById('date');
    if (dateInput && !dateInput.value) {
        // Gets local date string correctly formatted as YYYY-MM-DD
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }
    const lakeTemplate = document.getElementById('lake-form-template');

    let lakeCount = 0;

    // ── Auto-resize Textareas ──
    document.addEventListener('input', function (e) {
        if (e.target.tagName.toLowerCase() === 'textarea') {
            e.target.style.height = 'auto';
            e.target.style.height = (e.target.scrollHeight) + 'px';
        }
    });

    // ── Splash Screen ──
    window.addEventListener('load', () => {
        setTimeout(() => {
            splashScreen.classList.add('fade-out');
            setTimeout(() => splashScreen.remove(), 500);
        }, 800);
    });



    // ── Lake Block Management ──
    function addLakeBlock() {
        lakeCount++;
        const clone = lakeTemplate.content.cloneNode(true);
        const block = clone.querySelector('.lake-block');
        block.dataset.index = lakeCount;
        block.querySelector('.lake-index').textContent = lakeCount;
        const lakeNameInput = block.querySelector('[name="lakeName[]"]');
        if (lakeNameInput) {
            lakeNameInput.required = true;
        }

        // Remove button
        block.querySelector('.btn-remove').addEventListener('click', () => {
            block.remove();
            renumberLakes();
        });

        lakesContainer.appendChild(clone);
    }

    function renumberLakes() {
        const blocks = lakesContainer.querySelectorAll('.lake-block');
        blocks.forEach((block, i) => {
            block.dataset.index = i + 1;
            block.querySelector('.lake-index').textContent = i + 1;
        });
        lakeCount = blocks.length;
    }

    function hasValue(value) {
        return String(value || '').trim().length > 0;
    }

    btnAddLake.addEventListener('click', addLakeBlock);

    // ── Collect Lake Data ──
    function collectLakes() {
        const blocks = lakesContainer.querySelectorAll('.lake-block');
        const lakes = [];
        blocks.forEach((block) => {
            const lakeData = {
                name: block.querySelector('[name="lakeName[]"]').value.trim(),
                area: block.querySelector('[name="lakeArea[]"]').value.trim(),
                stockingDate: block.querySelector('[name="lakeStockingDate[]"]').value,
                fishQuantity: block.querySelector('[name="lakeFishQuantity[]"]').value.trim(),
                initialWeight: block.querySelector('[name="lakeInitialWeight[]"]').value.trim(),
                sampleWeight: block.querySelector('[name="lakeSampleWeight[]"]').value.trim(),
                consumption: block.querySelector('[name="lakeConsumption[]"]').value.trim(),
                prevDate: block.querySelector('[name="lakePrevDate[]"]').value,
                prevWeight: block.querySelector('[name="lakePrevWeight[]"]').value.trim(),
                prevConsumption: block.querySelector('[name="lakePrevConsumption[]"]').value.trim(),
                observations: block.querySelector('[name="lakeObservations[]"]').value.trim(),
            };
            const hasAnyLakeValue = Object.values(lakeData).some(hasValue);
            if (!hasAnyLakeValue) return;
            lakes.push({
                ...lakeData,
            });
        });
        return lakes;
    }

    // ── Format date nicely ──
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function toggleSection(section, show) {
        section.classList.toggle('hidden-section', !show);
    }

    function renderInfoItem(itemId, outId, value) {
        const item = document.getElementById(itemId);
        const out = document.getElementById(outId);
        if (!item || !out) return false;
        const visible = hasValue(value);
        out.textContent = visible ? value : '';
        item.classList.toggle('hidden-section', !visible);
        return visible;
    }

    // ── Render Report ──
    function renderReport(data) {
        const visibleInfoItems = [
            renderInfoItem('item-date', 'out-date', formatDate(data.date)),
            renderInfoItem('item-municipality', 'out-municipality', data.municipality),
            renderInfoItem('item-farm', 'out-farm', data.farm),
            renderInfoItem('item-owner', 'out-owner', data.owner),
            renderInfoItem('item-attendedBy', 'out-attendedBy', data.attendedBy),
            renderInfoItem('item-technician', 'out-technician', data.technician),
        ].filter(Boolean).length;
        reportInfoGrid.classList.toggle('hidden-section', visibleInfoItems === 0);

        // Lakes
        const outLakes = document.getElementById('out-lakes');
        outLakes.innerHTML = '';
        let renderedLakeCards = 0;
        data.lakes.forEach((lake, i) => {
            const card = document.createElement('div');
            // Calcular Métricas
            let daysInCulture = '';
            if (lake.stockingDate && data.date) {
                const sDate = new Date(lake.stockingDate + 'T00:00:00');
                const tDate = new Date(data.date + 'T00:00:00');
                const diffTime = tDate - sDate;
                if (diffTime >= 0) {
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    daysInCulture = diffDays;
                }
            }

            let weightGain = '';
            let gdpText = '';
            let periodDays = 0;
            let initialW = parseFloat(lake.initialWeight);
            let sampleW = parseFloat(lake.sampleWeight);
            let isPositiveGain = false;
            
            // Si hay peso anterior, calculamos el Delta y el GDP
            let pWeight = parseFloat(lake.prevWeight);
            if (!isNaN(sampleW)) {
                let referenceWeight = isNaN(pWeight) ? initialW : pWeight;
                if (!isNaN(referenceWeight)) {
                    let gain = sampleW - referenceWeight;
                    isPositiveGain = gain >= 0;
                    let sign = gain > 0 ? '↑ ' : (gain < 0 ? '↓ ' : '');
                    weightGain = sign + Math.abs(gain).toFixed(1) + 'g';
                    
                    // Ganancia Diaria Promedio (GDP)
                    if (lake.prevDate && data.date && !isNaN(pWeight)) {
                        const pDate = new Date(lake.prevDate + 'T00:00:00');
                        const tDate = new Date(data.date + 'T00:00:00');
                        const dTime = tDate - pDate;
                        if (dTime > 0) {
                            periodDays = Math.ceil(dTime / (1000 * 60 * 60 * 24));
                            const gdp = gain / periodDays;
                            gdpText = ` (${gdp > 0 ? '+' : ''}${gdp.toFixed(2)}g/día)`;
                        }
                    }
                }
            }

            let biomass = '';
            let biomassGainText = '';
            let isBiomassPositive = false;
            let qty = parseInt(lake.fishQuantity);
            let bFinal = null;
            let bInitial = null;
            let bPrev = null;
            
            if (!isNaN(qty) && !isNaN(sampleW)) {
                bFinal = (qty * sampleW) / 1000;
                biomass = bFinal.toLocaleString('es-CO', {maximumFractionDigits: 1}) + ' kg';
            }
            if (!isNaN(qty) && !isNaN(initialW)) {
                bInitial = (qty * initialW) / 1000;
            }
            if (!isNaN(qty) && !isNaN(pWeight)) {
                bPrev = (qty * pWeight) / 1000;
            }

            // Ganancia de Biomasa (Deltas)
            if (bFinal !== null) {
                let bioRef = bPrev !== null ? bPrev : bInitial;
                if (bioRef !== null) {
                    let bioGain = bFinal - bioRef;
                    isBiomassPositive = bioGain >= 0;
                    biomassGainText = `${bioGain >= 0 ? '↑' : '↓'} +${Math.abs(bioGain).toFixed(1)} kg`;
                }
            }

            let fcaGlobalValue = '';
            let fcaPeriodValue = '';
            let fcaGlobalEval = '';
            let fcaPeriodEval = '';
            
            let cons = parseFloat(lake.consumption);
            let pCons = parseFloat(lake.prevConsumption);
            
            // Global FCA
            if (!isNaN(cons) && bFinal !== null && bInitial !== null) {
                let bioGain = bFinal - bInitial;
                if (bioGain > 0) {
                    let fca = cons / bioGain;
                    fcaGlobalValue = fca.toFixed(2);
                    if (fca < 1.5) fcaGlobalEval = 'Óptimo';
                    else if (fca <= 1.8) fcaGlobalEval = 'Normal';
                    else fcaGlobalEval = 'Alto';
                }
            }

            // Period FCA
            let hasPeriodFCA = false;
            let fcaDiffClass = '';
            let fcaPeriodArrow = '';

            if (!isNaN(pCons) && !isNaN(pWeight) && !isNaN(qty) && bFinal !== null) {
                let pBio = (qty * pWeight) / 1000;
                let periodBioGain = bFinal - pBio;
                let periodCons = cons - pCons;

                if (periodBioGain > 0 && !isNaN(periodCons)) {
                    let fcaP = periodCons / periodBioGain;
                    fcaPeriodValue = fcaP.toFixed(2);
                    hasPeriodFCA = true;
                    
                    // Flechas y Colores contra el Global
                    if (fcaGlobalValue) {
                        let fcbG = parseFloat(fcaGlobalValue);
                        if (fcaP > fcbG) {
                            fcaPeriodArrow = '↑ '; // Aumentó el FCA (peor conversión)
                            fcaDiffClass = 'negative';
                        } else if (fcaP < fcbG) {
                            fcaPeriodArrow = '↓ '; // Bajó el FCA (mejor conversión)
                            fcaDiffClass = 'positive';
                        }
                    }

                    if (fcaP < 1.5) fcaPeriodEval = 'Ópt.';
                    else if (fcaP <= 1.8) fcaPeriodEval = 'Norm.';
                    else fcaPeriodEval = 'Alto';
                }
            }

            let fmtSampleWeight = isNaN(sampleW) ? '' : sampleW + 'g';
            const subtitleParts = [];
            if (hasValue(daysInCulture)) subtitleParts.push(`Día ${daysInCulture}`);
            if (hasValue(lake.area)) subtitleParts.push(`${escapeHTML(lake.area)} m²`);
            if (hasValue(lake.stockingDate)) subtitleParts.push(`Siembra: ${formatDate(lake.stockingDate)}`);
            if (hasValue(lake.initialWeight)) subtitleParts.push(`Peso Inicial: ${escapeHTML(lake.initialWeight)}g`);

            const metricCards = [];
            if (fmtSampleWeight) {
                metricCards.push(`
                    <div class="metric-box">
                        <span class="metric-label">PROMEDIO ACTUAL</span>
                        <span class="metric-value">${fmtSampleWeight}</span>
                        <span class="metric-subtext ${isPositiveGain ? 'positive' : ''}">${weightGain ? weightGain + gdpText : ''}</span>
                        ${periodDays > 0 ? `<span class="period-label">Últ. ${periodDays} días</span>` : ''}
                    </div>
                `);
            }
            if (fcaGlobalValue) {
                metricCards.push(`
                    <div class="metric-box">
                        <span class="metric-label">CONVERSIÓN (FCA)</span>
                        <span class="metric-value">${fcaGlobalValue}</span>
                        <span class="metric-subtext ${hasPeriodFCA ? fcaDiffClass : (parseFloat(fcaGlobalValue) < 1.5 ? 'positive' : '')}">${hasPeriodFCA ? fcaPeriodArrow + 'Per: ' + fcaPeriodValue + ' (' + fcaPeriodEval + ')' : fcaGlobalEval}</span>
                        ${periodDays > 0 ? `<span class="period-label">Últ. ${periodDays} días</span>` : ''}
                    </div>
                `);
            }
            if (biomass) {
                metricCards.push(`
                    <div class="metric-box">
                        <span class="metric-label">BIOMASA ESTIMADA</span>
                        <span class="metric-value">${biomass}</span>
                        <span class="metric-subtext ${isBiomassPositive ? 'positive' : ''}">${biomassGainText}</span>
                        ${periodDays > 0 && biomassGainText ? `<span class="period-label">Últ. ${periodDays} días</span>` : ''}
                    </div>
                `);
            }

            const footerItems = [];
            if (hasValue(lake.fishQuantity)) {
                footerItems.push(`
                    <div class="footer-item">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        Población: ${escapeHTML(lake.fishQuantity)}
                    </div>
                `);
            }
            if (hasValue(lake.consumption)) {
                footerItems.push(`
                    <div class="footer-item">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                        Consumo: ${escapeHTML(lake.consumption)} kg
                    </div>
                `);
            }
            if (fcaGlobalValue) {
                const viableClass = parseFloat(fcaGlobalValue) <= 1.8 ? 'status-ok' : 'status-warn';
                const viableText = parseFloat(fcaGlobalValue) <= 1.8 ? 'Lote Viable' : 'Lote No Viable';
                footerItems.push(`
                    <div class="footer-item ${viableClass}">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        ${viableText}
                    </div>
                `);
            }

            if (!hasValue(lake.name) && subtitleParts.length === 0 && metricCards.length === 0 && footerItems.length === 0 && !hasValue(lake.observations)) {
                return;
            }

            card.className = 'lake-report-card';
            card.innerHTML = `
                <div class="lake-card-header">
                    <div class="lake-title-group">
                        <h3>Est. ${i + 1}${hasValue(lake.name) ? `: ${escapeHTML(lake.name)}` : ''}</h3>
                        ${subtitleParts.length ? `<div class="lake-subtitle">${subtitleParts.map((part, idx) => `${idx > 0 ? '<span class="divider">|</span>' : ''}<span>${part}</span>`).join('')}</div>` : ''}
                    </div>
                </div>
                
                ${metricCards.length ? `<div class="lake-analytics-row">${metricCards.join('')}</div>` : ''}
                ${footerItems.length ? `<div class="lake-footer-bar">${footerItems.join('<div class="divider"></div>')}</div>` : ''}
                ${hasValue(lake.observations) ? `<div class="observations">
                    <span class="label">Observaciones:</span>
                    <p>${escapeHTML(lake.observations)}</p>
                </div>` : ''}
            `;
            outLakes.appendChild(card);
            renderedLakeCards++;
        });
        toggleSection(sectionLakesReport, renderedLakeCards > 0);

        // Recommendations & Actions
        const recommendationsValue = (data.recommendations || '').trim();
        const actionsValue = (data.actions || '').trim();
        document.getElementById('out-recommendations').textContent = recommendationsValue;
        document.getElementById('out-actions').textContent = actionsValue;
        toggleSection(sectionRecommendationsReport, hasValue(recommendationsValue));
        toggleSection(sectionActionsReport, hasValue(actionsValue));
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function updateReportPreviewScale() {
        const reportView = document.getElementById('report-view');
        const reportPaper = reportView ? reportView.querySelector('.report-paper') : null;
        if (!reportView || !reportPaper) return;

        // Snapshot-style scale: compute once when report view opens.
        const availableWidth = Math.max(0, window.innerWidth - 16);
        const letterPreviewWidthPx = (196 / 25.4) * 96; // 196mm rendered at 96dpi
        const paperWidth = letterPreviewWidthPx;
        const scale = Math.min(1, availableWidth / paperWidth);
        reportView.style.setProperty('--report-preview-scale', scale.toFixed(4));
    }

    // ── View Switching ──
    function showView(viewId) {
        document.querySelectorAll('.view').forEach((v) => {
            v.classList.remove('active');
            v.classList.add('hidden');
        });
        const target = document.getElementById(viewId);
        target.classList.remove('hidden');
        target.classList.add('active');
        document.body.classList.toggle('report-preview-active', viewId === 'report-view');
        if (viewId === 'report-view') {
            // Wait for layout pass so scale snapshots correctly.
            requestAnimationFrame(updateReportPreviewScale);
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
    }


    // ── Form Submit → Generate Report ──
    reportForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const data = {
            date: document.getElementById('date').value,
            municipality: document.getElementById('municipality').value,
            farm: document.getElementById('farm').value,
            owner: document.getElementById('owner').value,
            attendedBy: document.getElementById('attendedBy').value,
            technician: document.getElementById('technician').value,
            recommendations: document.getElementById('recommendations').value.trim(),
            actions: document.getElementById('actions').value.trim(),
            lakes: collectLakes(),
        };

        renderReport(data);
        showView('report-view');
    });

    // ── Back to form ──
    btnBack.addEventListener('click', () => {
        showView('form-view');
    });

    // ── Print / Save as PDF (native browser dialog, A4 styles) ──
    btnPrint.addEventListener('click', function () {
        var actionsBar = document.querySelector('.report-actions');
        if (actionsBar) actionsBar.style.display = 'none';
        btnPrint.textContent = 'Abriendo...';
        btnPrint.disabled = true;
        window.scrollTo(0, 0);
        window.print();
        if (actionsBar) actionsBar.style.display = '';
        btnPrint.textContent = 'Descargar PDF';
        btnPrint.disabled = false;
    });

    // ── Service Worker Registration ──
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('./service-worker.js')
            .then((reg) => {
                console.log('Service worker registered:', reg.scope);
            })
            .catch((err) => {
                console.warn('Service worker registration failed:', err);
            });
    }
})();
