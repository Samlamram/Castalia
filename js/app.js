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

    btnAddLake.addEventListener('click', addLakeBlock);

    // Add one lake block by default
    addLakeBlock();

    // ── Collect Lake Data ──
    function collectLakes() {
        const blocks = lakesContainer.querySelectorAll('.lake-block');
        const lakes = [];
        blocks.forEach((block) => {
            lakes.push({
                name: block.querySelector('[name="lakeName[]"]').value || '—',
                area: block.querySelector('[name="lakeArea[]"]').value || '—',
                stockingDate: block.querySelector('[name="lakeStockingDate[]"]').value || '—',
                fishQuantity: block.querySelector('[name="lakeFishQuantity[]"]').value || '—',
                initialWeight: block.querySelector('[name="lakeInitialWeight[]"]').value || '—',
                sampleWeight: block.querySelector('[name="lakeSampleWeight[]"]').value || '—',
                consumption: block.querySelector('[name="lakeConsumption[]"]').value || '—',
                prevDate: block.querySelector('[name="lakePrevDate[]"]').value || '',
                prevWeight: block.querySelector('[name="lakePrevWeight[]"]').value || '',
                prevConsumption: block.querySelector('[name="lakePrevConsumption[]"]').value || '',
                observations: block.querySelector('[name="lakeObservations[]"]').value || '—',
            });
        });
        return lakes;
    }

    // ── Format date nicely ──
    function formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    // ── Render Report ──
    function renderReport(data) {
        // General info
        document.getElementById('out-date').textContent = formatDate(data.date);
        document.getElementById('out-municipality').textContent = data.municipality || '—';
        document.getElementById('out-farm').textContent = data.farm || '—';
        document.getElementById('out-owner').textContent = data.owner || '—';
        document.getElementById('out-attendedBy').textContent = data.attendedBy || '—';
        document.getElementById('out-technician').textContent = data.technician || '—';

        // Lakes
        const outLakes = document.getElementById('out-lakes');
        outLakes.innerHTML = '';
        data.lakes.forEach((lake, i) => {
            const card = document.createElement('div');
            // Calcular Métricas
            let daysInCulture = '—';
            if (lake.stockingDate !== '—' && data.date) {
                const sDate = new Date(lake.stockingDate + 'T00:00:00');
                const tDate = new Date(data.date + 'T00:00:00');
                const diffTime = tDate - sDate;
                if (diffTime >= 0) {
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    daysInCulture = diffDays;
                }
            }

            let weightGain = '—';
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

            let biomass = '—';
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

            let fcaGlobalValue = '—';
            let fcaPeriodValue = '—';
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
                    if (fcaGlobalValue !== '—') {
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

            let fmtSampleWeight = isNaN(sampleW) ? '—' : sampleW + 'g';

            card.className = 'lake-report-card';
            card.innerHTML = `
                <div class="lake-card-header">
                    <div class="lake-title-group">
                        <h3>Est. ${i + 1}: ${escapeHTML(lake.name)}</h3>
                        <div class="lake-subtitle">
                            <span>Día ${daysInCulture}</span> <span class="divider">|</span> <span>${escapeHTML(lake.area)} m²</span> <span class="divider">|</span> <span>Siembra: ${lake.stockingDate !== '—' ? formatDate(lake.stockingDate) : '—'}</span> <span class="divider">|</span> <span>Peso Inicial: ${escapeHTML(lake.initialWeight)}${lake.initialWeight !== '—' ? 'g' : ''}</span>
                        </div>
                    </div>
                </div>
                
                <div class="lake-analytics-row">
                    <div class="metric-box">
                        <span class="metric-label">PROMEDIO ACTUAL</span>
                        <span class="metric-value">${fmtSampleWeight}</span>
                        <span class="metric-subtext ${isPositiveGain ? 'positive' : ''}">${weightGain !== '—' ? weightGain + gdpText : ''}</span>
                        ${periodDays > 0 ? `<span class="period-label">Últ. ${periodDays} días</span>` : ''}
                    </div>
                    <div class="metric-box">
                        <span class="metric-label">CONVERSIÓN (FCA)</span>
                        <span class="metric-value">${fcaGlobalValue}</span>
                        <span class="metric-subtext ${hasPeriodFCA ? fcaDiffClass : (fcaGlobalValue !== '—' && parseFloat(fcaGlobalValue) < 1.5 ? 'positive' : '')}">${hasPeriodFCA ? fcaPeriodArrow + 'Per: ' + fcaPeriodValue + ' (' + fcaPeriodEval + ')' : fcaGlobalEval}</span>
                        ${periodDays > 0 ? `<span class="period-label">Últ. ${periodDays} días</span>` : ''}
                    </div>
                    <div class="metric-box">
                        <span class="metric-label">BIOMASA ESTIMADA</span>
                        <span class="metric-value">${biomass}</span>
                        <span class="metric-subtext ${isBiomassPositive ? 'positive' : ''}">${biomassGainText}</span>
                        ${periodDays > 0 && biomassGainText ? `<span class="period-label">Últ. ${periodDays} días</span>` : ''}
                    </div>
                </div>

                <div class="lake-footer-bar">
                    <div class="footer-item">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        Población: ${escapeHTML(lake.fishQuantity)}
                    </div>
                    <div class="divider"></div>
                    <div class="footer-item">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                        Consumo: ${escapeHTML(lake.consumption)}${lake.consumption !== '—' ? ' kg' : ''}
                    </div>
                    <div class="divider"></div>
                    <div class="footer-item ${fcaGlobalValue !== '—' ? (parseFloat(fcaGlobalValue) <= 1.8 ? 'status-ok' : 'status-warn') : 'status-warn'}">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        ${fcaGlobalValue !== '—' ? (parseFloat(fcaGlobalValue) <= 1.8 ? 'Lote Viable' : 'Lote No Viable') : 'Evaluando Viabilidad'}
                    </div>
                </div>

                <div class="observations">
                    <span class="label">Observaciones:</span>
                    <p>${escapeHTML(lake.observations)}</p>
                </div>
            `;
            outLakes.appendChild(card);
        });

        // Recommendations & Actions
        document.getElementById('out-recommendations').textContent = data.recommendations || '—';
        document.getElementById('out-actions').textContent = data.actions || '—';
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
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
            recommendations: document.getElementById('recommendations').value,
            actions: document.getElementById('actions').value,
            lakes: collectLakes(),
        };

        renderReport(data);
        showView('report-view');
    });

    // ── Back to form ──
    btnBack.addEventListener('click', () => {
        showView('form-view');
    });

    // ── Generate PDF (html2pdf strict 9:16) + native share ──
    btnPrint.addEventListener('click', function () {
        if (typeof html2pdf === 'undefined') {
            window.print();
            return;
        }

        var reportPaper = document.querySelector('.report-paper');
        var actionsBar = document.querySelector('.report-actions');
        if (actionsBar) actionsBar.style.display = 'none';

        var farmEl = document.getElementById('out-farm');
        var dateEl = document.getElementById('out-date');
        var farmName = (farmEl && farmEl.textContent) ? farmEl.textContent.trim().replace(/\s+/g, '_') : 'Informe';
        var dateStr = (dateEl && dateEl.textContent) ? dateEl.textContent.trim().replace(/\s+/g, '_') : '';
        var fileName = 'Castalia_' + farmName + '_' + dateStr + '.pdf';

        btnPrint.textContent = 'Generando...';
        btnPrint.disabled = true;
        window.scrollTo(0, 0);

        var opt = {
            margin:      [6, 5, 6, 5],
            filename:    fileName,
            image:       { type: 'png' },
            html2canvas: { scale: 3, useCORS: true, scrollY: 0 },
            jsPDF:       { unit: 'mm', format: [144, 256], orientation: 'portrait', compress: true },
            pagebreak:   { avoid: ['.report-footer-print', '.footer-img', 'tfoot', '.lake-report-card', '.summary-card', '.keep-together', '.report-header-compact'] }
        };

        html2pdf().set(opt).from(reportPaper).toPdf().get('pdf').then(function (pdf) {
            var pdfBlob = pdf.output('blob');

            // Try native share on iOS/Android
            if (navigator.share && navigator.canShare) {
                try {
                    var file = new File([pdfBlob], fileName, { type: 'application/pdf' });
                    if (navigator.canShare({ files: [file] })) {
                        navigator.share({
                            title: 'Informe Técnico Castalia',
                            files: [file]
                        }).catch(function () {
                            // User cancelled share – that's fine
                        }).finally(function () {
                            restore();
                        });
                        return;
                    }
                } catch (e) {
                    // canShare not supported, fall through
                }
            }

            // Fallback: direct download
            pdf.save(fileName);
            restore();
        }).catch(function (err) {
            console.error('PDF error:', err);
            restore();
            window.print();
        });

        function restore() {
            if (actionsBar) actionsBar.style.display = '';
            btnPrint.textContent = 'Descargar PDF';
            btnPrint.disabled = false;
        }
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
