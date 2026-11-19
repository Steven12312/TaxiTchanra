/* ============================================================
   TAXI HANAU TCHANRA – JavaScript
   Navigation, Scroll Animations, Forms, FAQ Accordion, Tabs
   ============================================================ */

const CONSENT_KEY = 'taxi_tchanra_cookie_consent';
const CONSENT_VERSION = 2;
const GOOGLE_ADS_ID = 'AW-11364909431';
const GOOGLE_ANALYTICS_ID = 'G-FTW99X5SP5';
const GOOGLE_CALL_CONVERSION_ID = 'AW-11364909431/d8SACOTQhpgdEPeCm6sq';
const BUSINESS_PHONE_DISPLAY = '06181 9996510';
const BUSINESS_PHONE_HREF = 'tel:+4961819996510';

window.taxiTchanraConsent = {
  decided: false,
  statistics: false,
  marketing: false
};
window.googleTagLoadingStarted = false;
window.googleWebsiteCallTrackingInitialized = false;

function readConsentPreferences() {
  let storedValue = null;

  try {
    storedValue = localStorage.getItem(CONSENT_KEY);
  } catch (err) {
    console.warn('Unable to read consent preferences:', err);
  }

  if (!storedValue) return { ...window.taxiTchanraConsent };

  // Preserve decisions made with the previous all-or-nothing banner.
  if (storedValue === 'granted') {
    return { decided: true, statistics: true, marketing: true };
  }
  if (storedValue === 'denied') {
    return { decided: true, statistics: false, marketing: false };
  }

  try {
    const parsed = JSON.parse(storedValue);
    if (parsed.version !== CONSENT_VERSION) return { ...window.taxiTchanraConsent };

    return {
      decided: true,
      statistics: parsed.statistics === true,
      marketing: parsed.marketing === true
    };
  } catch (err) {
    console.warn('Unable to parse consent preferences:', err);
    return { ...window.taxiTchanraConsent };
  }
}

function hasTrackingConsent(category) {
  return window.taxiTchanraConsent.decided === true &&
    window.taxiTchanraConsent[category] === true;
}

function persistConsentPreferences(preferences) {
  const value = {
    version: CONSENT_VERSION,
    statistics: preferences.statistics === true,
    marketing: preferences.marketing === true,
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
}

function clearRevokedGoogleBrowserData(preferences) {
  const shouldDeleteCookie = name =>
    (!preferences.statistics && /^(_ga|_gid|_gat)/.test(name)) ||
    (!preferences.marketing && /^(_gcl|_gac)/.test(name));
  const host = window.location.hostname;

  document.cookie.split(';').forEach(cookie => {
    const name = cookie.split('=')[0].trim();
    if (!shouldDeleteCookie(name)) return;

    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${host}; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.${host}; SameSite=Lax`;
  });

  [localStorage, sessionStorage].forEach(storage => {
    try {
      Object.keys(storage).forEach(key => {
        const isMarketingKey = key.startsWith('_gcl') || key.includes('d8SACOTQhpgdEPeCm6sq');
        if (key !== CONSENT_KEY && !preferences.marketing && isMarketingKey) {
          storage.removeItem(key);
        }
      });
    } catch (err) {
      console.warn('Unable to clear Google browser data:', err);
    }
  });
}

function updateGoogleForwardingNumber(formattedNumber, mobileNumber) {
  if (!formattedNumber || !mobileNumber || !hasTrackingConsent('marketing')) return;

  const forwardingHref = 'tel:' + String(mobileNumber).replace(/[^\d+]/g, '');
  document.querySelectorAll(`a[href="${BUSINESS_PHONE_HREF}"]`).forEach(link => {
    link.href = forwardingHref;

    if (link.getAttribute('aria-label')) {
      link.setAttribute('aria-label',
        link.getAttribute('aria-label').replace(BUSINESS_PHONE_DISPLAY, formattedNumber));
    }

    link.childNodes.forEach(node => {
      if (node.textContent && node.textContent.includes(BUSINESS_PHONE_DISPLAY)) {
        node.textContent = node.textContent.replace(BUSINESS_PHONE_DISPLAY, formattedNumber);
      }
    });
  });
}

function activateGoogleWebsiteCallTracking() {
  if (window.googleWebsiteCallTrackingInitialized ||
      !hasTrackingConsent('marketing') || typeof window.gtag !== 'function') return;

  window.gtag('config', GOOGLE_CALL_CONVERSION_ID, {
    phone_conversion_number: BUSINESS_PHONE_DISPLAY,
    phone_conversion_callback: updateGoogleForwardingNumber
  });
  window.googleWebsiteCallTrackingInitialized = true;
}

function loadConsentedGoogleServices() {
  const statistics = hasTrackingConsent('statistics');
  const marketing = hasTrackingConsent('marketing');
  if ((!statistics && !marketing) || window.googleTagLoadingStarted) return;

  window.googleTagLoadingStarted = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function() {
    window.dataLayer.push(arguments);
  };

  // Basic Consent Mode: the consent choice is queued before Google code is loaded.
  window.gtag('consent', 'default', {
    analytics_storage: statistics ? 'granted' : 'denied',
    ad_storage: marketing ? 'granted' : 'denied',
    ad_user_data: marketing ? 'granted' : 'denied',
    ad_personalization: 'denied'
  });
  window.gtag('set', 'allow_ad_personalization_signals', false);
  window.gtag('js', new Date());

  if (statistics) {
    window.gtag('config', GOOGLE_ANALYTICS_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
  }
  if (marketing) {
    // GA4 page views are configured separately by the statistics category.
    window.gtag('config', GOOGLE_ADS_ID, { send_page_view: false });
    activateGoogleWebsiteCallTracking();
  }

  const script = document.createElement('script');
  script.async = true;
  script.id = 'google-tag-script';
  script.src = `https://www.googletagmanager.com/gtag/js?id=${statistics ? GOOGLE_ANALYTICS_ID : GOOGLE_ADS_ID}`;
  script.onerror = () => console.warn('Google Tag could not be loaded.');
  document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', () => {
  initCookieConsent();
  initNavigation();
  initScrollReveal();
  initFAQ();
  initForms();
  initTabs();
  initStickyHeader();
  initGoogleMapsConsent();
  initWhatsAppWidget();
  initAddressAutocomplete();
});

/* ---------- Sticky Header ---------- */
function initStickyHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  const observer = () => {
    if (window.scrollY > 50) {
      header.classList.add('header--scrolled');
      header.classList.remove('header--transparent');
    } else {
      header.classList.remove('header--scrolled');
      header.classList.add('header--transparent');
    }
  };

  observer();
  window.addEventListener('scroll', observer, { passive: true });
}

/* ---------- Mobile Navigation ---------- */
function initNavigation() {
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.header__nav');
  const header = document.querySelector('.header');
  if (!burger || !nav) return;

  burger.addEventListener('click', () => {
    const isOpen = burger.classList.toggle('burger--open');
    nav.classList.toggle('header__nav--open', isOpen);
    if (header) header.classList.toggle('header--menu-open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    burger.setAttribute('aria-expanded', isOpen);
  });

  // Close nav on link click
  nav.querySelectorAll('.header__nav-link').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('burger--open');
      nav.classList.remove('header__nav--open');
      if (header) header.classList.remove('header--menu-open');
      document.body.style.overflow = '';
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('header__nav--open')) {
      burger.classList.remove('burger--open');
      nav.classList.remove('header__nav--open');
      if (header) header.classList.remove('header--menu-open');
      document.body.style.overflow = '';
      burger.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ---------- Scroll Reveal Animation ---------- */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  reveals.forEach(el => observer.observe(el));
}

/* ---------- FAQ Accordion ---------- */
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('faq-item--open');

      // Close all others
      faqItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('faq-item--open');
          const otherBtn = other.querySelector('.faq-question');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle current
      item.classList.toggle('faq-item--open', !isOpen);
      question.setAttribute('aria-expanded', !isOpen);
    });
  });
}

/* ---------- Form Handling ---------- */
function initForms() {
  const forms = document.querySelectorAll('form[data-form]');

  forms.forEach(form => {
    const btn = form.querySelector('[type="submit"]');
    if (!btn) return;

    const originalText = btn.textContent;
    let isSubmitting = false;
    let statusResetTimer = null;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (isSubmitting) return;

      // Honeypot check
      const hp = form.querySelector('.form__hp input');
      if (hp && hp.value.trim() !== '') {
        console.log('Bot submission blocked');
        return;
      }

      // Basic validation
      const required = form.querySelectorAll('[required]');
      let valid = true;

      required.forEach(field => {
        if (!field.value.trim() || (field.type === 'checkbox' && !field.checked)) {
          field.style.borderColor = 'var(--color-red)';
          valid = false;
        } else {
          field.style.borderColor = '';
        }
      });

      if (!valid) return;

      clearTimeout(statusResetTimer);
      isSubmitting = true;
      btn.textContent = '⏳ Wird gesendet...';
      btn.disabled = true;
      btn.style.background = '';
      btn.style.color = '';

      const formData = new FormData(form);
      formData.append('form_type', form.dataset.form || 'Kontaktformular');

      try {
        const res = await fetch('send.php', {
          method: 'POST',
          body: formData
        });
        const data = await res.json().catch(() => null);

        if (!res.ok || !data || data.success !== true) {
          throw new Error(data && data.message
            ? data.message
            : 'Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.');
        }

        btn.textContent = '✓ Anfrage gesendet!';
        btn.style.background = 'var(--color-green)';
        btn.style.color = 'var(--color-white)';

        trackSuccessfulFormSubmission(form);

        statusResetTimer = setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
          btn.style.color = '';
          btn.disabled = false;
          form.reset();
          isSubmitting = false;
        }, 4000);
      } catch (err) {
        console.error('Form submission failed:', err);
        btn.textContent = '✕ Versand fehlgeschlagen – bitte erneut versuchen';
        btn.style.background = 'var(--color-red)';
        btn.style.color = 'var(--color-white)';
        btn.disabled = false;
        isSubmitting = false;

        statusResetTimer = setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
          btn.style.color = '';
        }, 6000);
      }
    });
  });
}

function trackSuccessfulFormSubmission(form) {
  const eventNames = {
    'landing-form': 'flughafen_formular_submit',
    'contact-form': 'kontakt_formular_submit'
  };
  const eventName = eventNames[form.id];

  if (!eventName || typeof gtag !== 'function') return;

  if (!hasTrackingConsent('statistics')) return;

  try {
    gtag('event', eventName, {
      event_category: 'Contact',
      event_label: form.dataset.form,
      form_id: form.id,
      send_to: GOOGLE_ANALYTICS_ID
    });
  } catch (err) {
    console.warn('Unable to send form analytics event:', err);
  }
}

/* ---------- Tab Navigation ---------- */
function initTabs() {
  const tabNavs = document.querySelectorAll('.tab-nav');

  tabNavs.forEach(nav => {
    const buttons = nav.querySelectorAll('.tab-nav__btn');
    const panels = nav.parentElement.querySelectorAll('.tab-panel');

    const activateTab = (target) => {
      buttons.forEach(b => {
        const isActive = b.dataset.tab === target;
        b.classList.toggle('tab-nav__btn--active', isActive);
        b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      panels.forEach(panel => {
        panel.classList.toggle('tab-panel--active', panel.id === target);
      });
    };

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        activateTab(btn.dataset.tab);
      });
    });

    const hashToTab = {
      '#kontakt': 'tab-kontakt',
      '#impressum': 'tab-impressum',
      '#datenschutz': 'tab-datenschutz'
    };

    if (hashToTab[window.location.hash]) {
      activateTab(hashToTab[window.location.hash]);
    }

    document.querySelectorAll('a[href$="#kontakt"], a[href$="#impressum"], a[href$="#datenschutz"]').forEach(link => {
      link.addEventListener('click', () => {
        const hash = new URL(link.href, window.location.href).hash;
        if (hashToTab[hash]) {
          activateTab(hashToTab[hash]);
        }
      });
    });
  });
}

/* ---------- Google Maps 2-Click Consent ---------- */
function initGoogleMapsConsent() {
  const buttons = document.querySelectorAll('.map-consent__btn[data-map-src]');
  if (!buttons.length) return;

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const wrapper = button.closest('.map-wrapper');
      const src = button.dataset.mapSrc;
      if (!wrapper || !src) return;

      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.width = '100%';
      iframe.height = '400';
      iframe.style.border = '0';
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.title = button.dataset.mapTitle || 'Google Maps Karte';

      wrapper.classList.remove('map-consent');
      wrapper.replaceChildren(iframe);
    });
  });
}

/* ---------- Phone Click Tracking ---------- */
document.addEventListener('click', (e) => {
  const phoneLink = e.target.closest('a[href^="tel:"]');
  if (phoneLink && hasTrackingConsent('marketing') && typeof window.gtag === 'function') {
    gtag('event', 'phone_click', {
      event_category: 'Contact',
      event_label: phoneLink.href,
      send_to: GOOGLE_ADS_ID
    });
    gtag('event', 'conversion', {
      'send_to': 'AW-11364909431/phone_click'
    });
  }
});

/* ---------- Cookie Consent Management (Basic Consent Mode) ---------- */
function initCookieConsent() {
  function renderBanner() {
    if (document.getElementById('cookie-consent-banner')) return;

    const preferences = window.taxiTchanraConsent;

    const banner = document.createElement('div');
    banner.id = 'cookie-consent-banner';
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-labelledby', 'cookie-banner-title');

    banner.innerHTML = `
      <div class="cookie-banner__content">
        <div class="cookie-banner__text">
          <div class="cookie-banner__title" id="cookie-banner-title">Privatsphäre-Einstellungen</div>
          <p>
            Optionale Google-Dienste werden erst nach Ihrer Auswahl geladen. Telefon, Formulare und die Website
            funktionieren auch ohne Einwilligung. Details finden Sie in unserer
            <a href="/kontakt#datenschutz" target="_blank" rel="noopener">Datenschutzerklärung</a>.
          </p>
          <div class="cookie-banner__choices">
            <div class="cookie-banner__choice cookie-banner__choice--essential">
              <span><strong>Erforderlich</strong><small>Speichert ausschließlich Ihre Datenschutzauswahl.</small></span>
              <span class="cookie-banner__required">Immer aktiv</span>
            </div>
            <label class="cookie-banner__choice" for="cookie-statistics">
              <span><strong>Statistik</strong><small>Google Analytics und erfolgreiche Formularanfragen.</small></span>
              <input type="checkbox" id="cookie-statistics" ${preferences.statistics ? 'checked' : ''}>
            </label>
            <label class="cookie-banner__choice" for="cookie-marketing">
              <span><strong>Marketing</strong><small>Google Ads, Telefonklicks und Google-Weiterleitungsnummer.</small></span>
              <input type="checkbox" id="cookie-marketing" ${preferences.marketing ? 'checked' : ''}>
            </label>
          </div>
        </div>
        <div class="cookie-banner__actions">
          <button type="button" class="cookie-banner__btn cookie-banner__btn--choice" id="cookie-deny-all">
            Alle ablehnen
          </button>
          <button type="button" class="cookie-banner__btn cookie-banner__btn--save" id="cookie-save-selection">
            Auswahl speichern
          </button>
          <button type="button" class="cookie-banner__btn cookie-banner__btn--choice" id="cookie-accept-all">
            Alle akzeptieren
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('cookie-accept-all').addEventListener('click', () => {
      savePreferences({ statistics: true, marketing: true });
    });
    document.getElementById('cookie-deny-all').addEventListener('click', () => {
      savePreferences({ statistics: false, marketing: false });
    });
    document.getElementById('cookie-save-selection').addEventListener('click', () => {
      savePreferences({
        statistics: document.getElementById('cookie-statistics').checked,
        marketing: document.getElementById('cookie-marketing').checked
      });
    });
  }

  function savePreferences(preferences) {
    const previouslyLoaded = window.googleTagLoadingStarted;
    const changed = preferences.statistics !== window.taxiTchanraConsent.statistics ||
      preferences.marketing !== window.taxiTchanraConsent.marketing;

    try {
      persistConsentPreferences(preferences);
    } catch (err) {
      console.warn('Unable to save consent preferences:', err);
      return;
    }

    window.taxiTchanraConsent = { decided: true, ...preferences };

    clearRevokedGoogleBrowserData(preferences);

    // Once Google code was loaded, a clean reload is the reliable way to revoke
    // permissions and restore the original phone number without sending an update ping.
    if (previouslyLoaded && changed) {
      window.location.reload();
      return;
    }

    loadConsentedGoogleServices();
    closeBanner();
  }

  function openBanner() {
    renderBanner();
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) {
      setTimeout(() => banner.classList.add('cookie-banner--visible'), 10);
      setTimeout(() => document.getElementById('cookie-deny-all')?.focus(), 20);
    }
  }

  function closeBanner() {
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) {
      banner.classList.remove('cookie-banner--visible');
      setTimeout(() => banner.remove(), 300);
    }
  }

  const savedConsent = readConsentPreferences();
  window.taxiTchanraConsent = savedConsent;

  if (savedConsent.decided) {
    try {
      persistConsentPreferences(savedConsent);
    } catch (err) {
      console.warn('Unable to migrate consent preferences:', err);
    }

    clearRevokedGoogleBrowserData(savedConsent);
    if (savedConsent.statistics || savedConsent.marketing) {
      loadConsentedGoogleServices();
    }
  } else {
    setTimeout(openBanner, 600);
  }

  window.openCookieSettings = function(e) {
    if (e) e.preventDefault();
    openBanner();
  };

  document.addEventListener('click', (e) => {
    if (e.target.closest('#open-cookie-banner') || e.target.closest('a[href="#cookie-settings"]')) {
      e.preventDefault();
      openBanner();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('cookie-consent-banner')) {
      closeBanner();
    }
  });
}

/* ---------- WhatsApp Floating Widget & Modal ---------- */
function initWhatsAppWidget() {
  const widgetHtml = `
    <!-- Floating WhatsApp Button -->
    <div class="wa-float" id="wa-float-btn" aria-label="WhatsApp Kontakt" title="Per WhatsApp anfragen">
      <svg class="wa-float-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.299.434 2.503 1.185 3.468l-.784 2.863 2.94-.771c.92.536 1.989.843 3.127.844 3.18 0 5.767-2.586 5.768-5.766.001-3.18-2.585-5.766-5.768-5.766zm3.411 8.21c-.144.406-.838.773-1.168.805-.33.032-.748.147-2.484-.572-1.737-.719-2.836-2.5-2.923-2.616-.087-.116-.708-.941-.708-1.794 0-.853.448-1.272.607-1.446.159-.174.347-.217.463-.217.116 0 .232.001.332.006.107.005.252-.04.394.301.144.347.491 1.2.535 1.287.043.087.072.188.014.303-.058.116-.087.188-.174.289l-.261.303c-.087.087-.179.182-.077.357.101.174.453.748.973 1.212.668.596 1.233.78 1.407.867.174.087.275.072.376-.043.101-.116.434-.506.55-.68.116-.174.232-.145.391-.087.159.058 1.011.477 1.185.564.174.087.289.13.332.202.043.072.043.419-.101.825z"/>
        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.957-1.301C8.384 21.536 10.129 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.63 0-3.14-.442-4.444-1.212l-.318-.189-2.289.601.611-2.232-.207-.329C4.542 15.312 4 13.722 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
      </svg>
    </div>

    <!-- GDPR WhatsApp Modal -->
    <div class="wa-modal-overlay" id="wa-modal-overlay">
      <div class="wa-modal" role="dialog" aria-labelledby="wa-modal-title" aria-modal="true">
        <button class="wa-modal-close" id="wa-modal-close" aria-label="Schließen">&times;</button>
        <div class="wa-modal-header">
          <div class="wa-modal-icon">💬</div>
          <h3 class="wa-modal-title" id="wa-modal-title">WhatsApp Kontaktaufnahme</h3>
        </div>
        <div class="wa-modal-body">
          <p>Wenn Sie uns per WhatsApp kontaktieren, werden Daten (z.&nbsp;B. Telefonnummer &amp; Nachricht) an WhatsApp / Meta Platforms übertragen. Bitte bestätigen Sie Ihre Einwilligung vor der Weiterleitung:</p>
        </div>
        <div class="wa-modal-check">
          <input type="checkbox" id="wa-consent-check">
          <label for="wa-consent-check">
            Ich habe die <a href="/kontakt#datenschutz" target="_blank" style="color:var(--color-gold); text-decoration:underline;">Datenschutzerklärung</a> zur Kenntnis genommen und stimme der Übermittlung an WhatsApp zu. *
          </label>
        </div>
        <button class="wa-modal-btn" id="wa-go-btn">
          💬 Weiter zu WhatsApp (0176 31791627)
        </button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', widgetHtml);

  const floatBtn = document.getElementById('wa-float-btn');
  const modalOverlay = document.getElementById('wa-modal-overlay');
  const modalClose = document.getElementById('wa-modal-close');
  const consentCheck = document.getElementById('wa-consent-check');
  const goBtn = document.getElementById('wa-go-btn');

  if (!floatBtn || !modalOverlay) return;

  floatBtn.addEventListener('click', () => {
    modalOverlay.classList.add('wa-modal--open');
  });

  modalClose.addEventListener('click', () => {
    modalOverlay.classList.remove('wa-modal--open');
  });

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('wa-modal--open');
    }
  });

  consentCheck.addEventListener('change', () => {
    if (consentCheck.checked) {
      goBtn.classList.add('wa-modal-btn--enabled');
    } else {
      goBtn.classList.remove('wa-modal-btn--enabled');
    }
  });

  goBtn.addEventListener('click', () => {
    if (consentCheck.checked) {
      window.open('https://wa.me/4917631791627?text=Hallo%20Taxi%20Tchanra,%20ich%20m%C3%B6chte%20eine%20Fahrt%20anfragen.', '_blank');
      modalOverlay.classList.remove('wa-modal--open');
    }
  });
}

/* ---------- DSGVO Address Autocomplete ---------- */
function initAddressAutocomplete() {
  const input = document.getElementById('landing-pickup');
  const resultsList = document.getElementById('autocomplete-results');
  const enableButton = document.getElementById('enable-address-search');
  const status = document.getElementById('address-search-status');

  if (!input || !resultsList || !enableButton) return;

  let debounceTimer = null;
  let activeRequest = null;
  let activeIndex = -1;
  let searchEnabled = false;

  function hideResults() {
    resultsList.hidden = true;
    resultsList.innerHTML = '';
    activeIndex = -1;
  }

  function showResults(items) {
    if (!items || !items.length) {
      hideResults();
      return;
    }

    resultsList.innerHTML = items.map((item, index) => `
      <li class="autocomplete-item" role="option" data-index="${index}" data-val="${escapeHtml(item.formatted)}">
        <span class="autocomplete-item-icon" aria-hidden="true">${item.icon || '📍'}</span>
        <span>${escapeHtml(item.formatted)}</span>
      </li>
    `).join('');

    resultsList.hidden = false;
    activeIndex = -1;

    resultsList.querySelectorAll('.autocomplete-item').forEach(el => {
      el.addEventListener('click', () => {
        input.value = el.dataset.val;
        hideResults();
      });
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Fetch recommendations from local PHP proxy (address_search.php)
  function fetchAddressSuggestions(query) {
    if (!query || query.length < 2) {
      hideResults();
      return;
    }

    if (!searchEnabled) return;

    if (activeRequest) activeRequest.abort();
    activeRequest = new AbortController();

    fetch('address_search.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: `q=${encodeURIComponent(query)}`,
      signal: activeRequest.signal
    })
      .then(res => {
        if (!res.ok) throw new Error(`Address search failed with status ${res.status}`);
        return res.json();
      })
      .then(items => {
        showResults(items);
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        console.warn('Address search unavailable:', err);
        hideResults();
      });
  }

  enableButton.addEventListener('click', () => {
    searchEnabled = true;
    enableButton.classList.add('btn-optin-live--active');
    enableButton.textContent = 'Adresssuche aktiv';
    enableButton.setAttribute('aria-pressed', 'true');
    enableButton.disabled = true;
    if (status) status.textContent = 'Automatische Vorschläge sind für diese Seite aktiviert.';

    const currentValue = input.value.trim();
    if (currentValue.length >= 2) fetchAddressSuggestions(currentValue);
    input.focus();
  });

  // Manual entry never triggers a request until the separate opt-in was used.
  input.addEventListener('input', () => {
    const val = input.value.trim();
    clearTimeout(debounceTimer);

    if (!searchEnabled || val.length < 2) {
      hideResults();
      return;
    }

    debounceTimer = setTimeout(() => {
      fetchAddressSuggestions(val);
    }, 250);
  });

  // Handle Keyboard Navigation
  input.addEventListener('keydown', (e) => {
    if (resultsList.hidden) return;

    const items = resultsList.querySelectorAll('.autocomplete-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      updateActiveItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      updateActiveItem(items);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      items[activeIndex].click();
    } else if (e.key === 'Escape') {
      hideResults();
    }
  });

  function updateActiveItem(items) {
    items.forEach((item, idx) => {
      if (idx === activeIndex) {
        item.classList.add('autocomplete-item--active');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('autocomplete-item--active');
      }
    });
  }

  // Close list on outside click
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !resultsList.contains(e.target)) {
      hideResults();
    }
  });
}

