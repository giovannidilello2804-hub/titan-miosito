// JavaScript per Titan 3D Studio - Calcolatore Preventivo Interattivo

const serviceTypeSelect = document.getElementById('service-type');
const materialTypeSelect = document.getElementById('material-type');
const printQualitySelect = document.getElementById('print-quality');
const estimatedPriceEl = document.getElementById('estimated-price');
const quoteForm = document.getElementById('quote-form');
const quoteFeedback = document.getElementById('quote-feedback');

const successModal = document.getElementById('success-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');

// Price Calculation Logic
function calculateEstimate() {
    const service = serviceTypeSelect.value;
    const material = materialTypeSelect.value;
    const quality = printQualitySelect.value;

    let baseMin = 10;
    let baseMax = 20;

    // Service Multiplier
    if (service === 'bambu') {
        baseMin += 5;
        baseMax += 15;
    } else if (service === 'maxi') {
        baseMin += 15;
        baseMax += 35;
    } else if (service === 'scan') {
        baseMin += 20;
        baseMax += 40;
    } else if (service === 'cad') {
        baseMin += 25;
        baseMax += 50;
    }

    // Material Adjustment
    if (material === 'carbon') {
        baseMin += 10;
        baseMax += 20;
    } else if (material === 'tpu' || material === 'abs') {
        baseMin += 5;
        baseMax += 10;
    }

    // Quality Adjustment
    if (quality === 'ultra') {
        baseMin += 5;
        baseMax += 10;
    }

    estimatedPriceEl.textContent = `€ ${baseMin},00 - € ${baseMax},00`;
}

// Event Listeners for Live Calculation
if (serviceTypeSelect) {
    serviceTypeSelect.addEventListener('change', calculateEstimate);
    materialTypeSelect.addEventListener('change', calculateEstimate);
    printQualitySelect.addEventListener('change', calculateEstimate);
}

// Quote Form Submit Handler
if (quoteForm) {
    quoteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Show success modal
        if (successModal) {
            successModal.classList.add('open');
        }
        
        quoteFeedback.textContent = "✓ Richiesta preventivo inviata con successo! Ti risponderemo a breve.";
        quoteForm.reset();
        calculateEstimate();
    });
}

// Close Modal Handler
if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
        successModal.classList.remove('open');
    });
}

if (successModal) {
    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) {
            successModal.classList.remove('open');
        }
    });
}

// Initial calculation on page load
calculateEstimate();
