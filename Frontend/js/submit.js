/*
 * submit.js — Problem submission form handler with Voice Input & Evidence Upload
 */

const problemForm  = document.getElementById('problemForm');
const submitStatus = document.getElementById('submitStatus');
const submitBtn    = document.getElementById('submitBtn');

const voiceBtn     = document.getElementById('voiceBtn');
const voiceBtnText = document.getElementById('voiceBtnText');
const micIcon      = document.getElementById('micIcon');
const voiceStatus  = document.getElementById('voiceStatus');
const languageSelect = document.getElementById('language');
const descriptionEl = document.getElementById('description');
const evidenceFileEl = document.getElementById('evidenceFile');

if (typeof requireAuth === 'function') {
    requireAuth('citizen');
}

// ── Voice Input (Web Speech API) ─────────────────────────────────────────────
let recognition = null;
let isRecording = false;

const LANG_CODE_MAP = {
    'English':  'en-IN',
    'Hindi':    'hi-IN',
    'Gujarati': 'gu-IN',
};

if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
        isRecording = true;
        if (voiceBtn) {
            voiceBtn.classList.remove('btn-secondary');
            voiceBtn.classList.add('btn-primary');
            voiceBtn.style.background = '#e11d48';
            voiceBtn.style.borderColor = '#e11d48';
            voiceBtn.style.color = '#fff';
        }
        if (micIcon) micIcon.textContent = '⏹️';
        if (voiceBtnText) voiceBtnText.textContent = 'Stop Recording (Listening...)';
        if (voiceStatus) {
            voiceStatus.style.display = 'inline-block';
            voiceStatus.textContent = '🎙️ Listening... Speak clearly now.';
            voiceStatus.style.color = '#e11d48';
        }
    };

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        if (descriptionEl && transcript.trim()) {
            // Append or update description
            const current = descriptionEl.value.trim();
            if (!current.includes(transcript.trim())) {
                descriptionEl.value = current ? `${current} ${transcript.trim()}` : transcript.trim();
            }
        }
    };

    recognition.onerror = (err) => {
        console.warn('Speech recognition error:', err);
        stopRecording();
        if (voiceStatus) {
            voiceStatus.textContent = '⚠️ Microphone error or permission denied.';
            voiceStatus.style.color = 'var(--accent-red)';
        }
    };

    recognition.onend = () => {
        stopRecording();
    };
} else {
    if (voiceBtnText) voiceBtnText.textContent = 'Voice Input Unavailable';
    if (voiceBtn) voiceBtn.disabled = true;
}

function stopRecording() {
    isRecording = false;
    if (voiceBtn) {
        voiceBtn.classList.remove('btn-primary');
        voiceBtn.classList.add('btn-secondary');
        voiceBtn.style.background = '';
        voiceBtn.style.borderColor = '';
        voiceBtn.style.color = '';
    }
    if (micIcon) micIcon.textContent = '🎤';
    if (voiceBtnText) voiceBtnText.textContent = 'Speak Problem (Voice Input)';
    if (voiceStatus) {
        voiceStatus.style.display = 'inline-block';
        voiceStatus.textContent = '✓ Voice recording stopped. You can edit the text above.';
        voiceStatus.style.color = 'var(--brand-primary)';
    }
}

if (voiceBtn && recognition) {
    voiceBtn.addEventListener('click', () => {
        if (isRecording) {
            recognition.stop();
            stopRecording();
        } else {
            const selectedLang = languageSelect ? languageSelect.value : 'English';
            recognition.lang = LANG_CODE_MAP[selectedLang] || 'en-IN';
            try {
                recognition.start();
            } catch (e) {
                console.warn('Speech start error:', e);
            }
        }
    });
}

// ── Form Submission ───────────────────────────────────────────────────────────
problemForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (isRecording && recognition) {
        recognition.stop();
        stopRecording();
    }

    // ── Collect fields ──────────────────────────────────────
    const title       = document.getElementById('title').value.trim();
    const description = descriptionEl.value.trim();
    const location    = document.getElementById('location').value.trim();
    const category    = document.getElementById('category').value;
    const affected    = document.getElementById('affected').value.trim();
    const urgency     = document.getElementById('urgency').value;
    const language    = languageSelect ? languageSelect.value : 'English';

    // ── Validate ─────────────────────────────────────────────
    if (!title || !description || !location || !affected || !urgency) {
        setStatus('Please fill in all required fields.', 'error');
        return;
    }

    // ── Loading state ─────────────────────────────────────────
    setStatus('Analyzing your problem with AI… This may take a few seconds.', '');
    submitBtn.disabled    = true;
    submitBtn.textContent = '⏳  Analyzing…';

    try {
        // ── Call backend ──────────────────────────────────────
        const result = await createProblem({
            title,
            description,
            location,
            category,
            affected,
            urgency,
            input_type: isRecording ? 'voice' : 'text',
            language:   language,
        });

        if (!result || !result.problem || !result.problem.id) {
            throw new Error('Invalid response from server.');
        }

        const problem = result.problem;

        // ── Upload evidence file if attached ─────────────────
        if (evidenceFileEl && evidenceFileEl.files && evidenceFileEl.files[0]) {
            setStatus('Uploading evidence document / image…', '');
            try {
                await uploadProblemEvidence(problem.id, evidenceFileEl.files[0], 'Citizen Evidence Attachment');
                console.log('✅ Evidence uploaded successfully');
            } catch (evErr) {
                console.warn('⚠️ Evidence upload warning:', evErr);
            }
        }

        console.log('✅ Problem submitted:', problem);

        // Store for navigation
        sessionStorage.setItem('lastProblemId', problem.id);

        // ── Show analysis card (no redirect yet) ──────────────
        setStatus('✓ Analysis complete! Review your results below.', 'success');
        showAnalysisCard(problem);

    } catch (err) {
        console.error('❌ Submission error:', err);
        setStatus(
            err.message || 'Submission failed. Make sure the backend is running and try again.',
            'error'
        );
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Analyze Problem with AI →';
    }
});


// ── Status helper ─────────────────────────────────────────────────────────────
function setStatus(msg, type) {
    if (!submitStatus) return;
    submitStatus.textContent  = msg;
    submitStatus.className    = 'submit-status' + (type ? ' ' + type : '');
}


// ── Build and inject the analysis result card ─────────────────────────────────
function showAnalysisCard(problem) {

    // Remove any previous card
    const old = document.getElementById('analysisCard');
    if (old) old.remove();

    // Helper to render tag chips
    const renderTags = (arr) => {
        if (!Array.isArray(arr) || arr.length === 0) {
            return '<span class="tag-chip">Not available</span>';
        }
        return arr.map(t => `<span class="tag-chip">${escapeHTML(t)}</span>`).join('');
    };

    // Urgency badge class
    const urgency      = problem.urgency || 'Medium';
    const urgencyClass = {
        Critical: 'badge-red',
        High:     'badge-amber',
        Medium:   'badge-blue',
        Low:      'badge-green',
    }[urgency] || 'badge-neutral';

    const card = document.createElement('div');
    card.id    = 'analysisCard';
    card.style.cssText = 'margin-top:28px;';

    card.innerHTML = `
      <div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-xl);box-shadow:var(--shadow-md);overflow:hidden;">

        <!-- Card header -->
        <div style="padding:20px 26px;background:linear-gradient(135deg,#f8f9ff 0%,#f0efff 100%);border-bottom:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:space-between;gap:12px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:20px;">🤖</span>
            <div>
              <div style="font-size:15px;font-weight:700;color:var(--text-primary);">AI Analysis Complete</div>
              <div style="font-size:12px;color:var(--text-muted);">Powered by Google Gemini</div>
            </div>
          </div>
          <span class="badge badge-green">✓ Saved</span>
        </div>

        <div style="padding:24px 26px;">

          <!-- Score boxes -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:22px;">

            <div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:16px;text-align:center;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);margin-bottom:8px;">Category</div>
              <div style="font-size:14px;font-weight:700;color:var(--text-primary);">${escapeHTML(problem.category || problem.detected_category || '—')}</div>
            </div>

            <div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:16px;text-align:center;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);margin-bottom:8px;">Priority</div>
              <div style="font-size:24px;font-weight:800;color:var(--brand-primary);line-height:1;">${problem.priority_score ?? '—'}<span style="font-size:13px;color:var(--text-muted);font-weight:400;">/100</span></div>
            </div>

            <div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:16px;text-align:center;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);margin-bottom:8px;">Urgency</div>
              <div style="margin-top:6px;"><span class="badge ${urgencyClass}">${escapeHTML(urgency)}</span></div>
            </div>

          </div>

          <!-- Department -->
          <div style="background:var(--bg-subtle);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:14px 16px;margin-bottom:16px;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);margin-bottom:6px;">Responsible Government Department</div>
            <div style="font-size:14px;font-weight:600;">${escapeHTML(problem.department || problem.detected_department || 'Not determined')}</div>
          </div>

          <!-- Expertise -->
          <div style="margin-bottom:16px;">
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);margin-bottom:8px;">Required Expertise</div>
            <div style="display:flex;flex-wrap:wrap;gap:7px;">${renderTags(problem.required_expertise)}</div>
          </div>

          <!-- Solution areas -->
          <div style="margin-bottom:24px;">
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);margin-bottom:8px;">Suggested Solution Areas</div>
            <div style="display:flex;flex-wrap:wrap;gap:7px;">${renderTags(problem.suggested_solution_areas)}</div>
          </div>

          <!-- CTA -->
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <button
              type="button"
              class="btn btn-primary"
              style="flex:1;justify-content:center;"
              onclick="window.location.href='problem.html?id=${problem.id}'"
            >
              View Full Problem Details →
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              onclick="window.location.href='government.html'"
            >
              Go to Government Dashboard
            </button>
          </div>

        </div>
      </div>
    `;

    problemForm.insertAdjacentElement('afterend', card);

    // Hide the submit button — they've already submitted
    submitBtn.style.display = 'none';

    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// ── XSS helper ────────────────────────────────────────────────────────────────
function escapeHTML(val) {
    if (val === null || val === undefined) return '';
    return String(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
