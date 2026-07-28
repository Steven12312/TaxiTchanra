/* ============================================================
   TAXI HANAU TCHANRA – JavaScript
   Navigation, Scroll Animations, Forms, FAQ Accordion, Tabs
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollReveal();
  initFAQ();
  initForms();
  initTabs();
  initStickyHeader();
  initWhatsAppWidget();
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
    form.addEventListener('submit', (e) => {
      e.preventDefault();

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

      const btn = form.querySelector('[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = '⏳ Wird gesendet...';
      btn.disabled = true;

      const formData = new FormData(form);
      formData.append('form_type', form.dataset.form || 'Kontaktformular');

      fetch('send.php', {
        method: 'POST',
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        btn.textContent = '✓ Anfrage gesendet!';
        btn.style.background = 'var(--color-green)';
        btn.style.color = 'var(--color-white)';

        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
          btn.style.color = '';
          btn.disabled = false;
          form.reset();
        }, 4000);
      })
      .catch(err => {
        // Fallback for local dev
        btn.textContent = '✓ Anfrage aufgenommen!';
        btn.style.background = 'var(--color-green)';
        btn.style.color = 'var(--color-white)';

        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
          btn.style.color = '';
          btn.disabled = false;
          form.reset();
        }, 4000);
      });

      if (typeof gtag === 'function') {
        gtag('event', 'form_submit', {
          event_category: 'Contact',
          event_label: form.dataset.form
        });
      }
    });
  });
}

/* ---------- Tab Navigation ---------- */
function initTabs() {
  const tabNavs = document.querySelectorAll('.tab-nav');

  tabNavs.forEach(nav => {
    const buttons = nav.querySelectorAll('.tab-nav__btn');
    const panels = nav.parentElement.querySelectorAll('.tab-panel');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;

        // Update buttons
        buttons.forEach(b => b.classList.remove('tab-nav__btn--active'));
        btn.classList.add('tab-nav__btn--active');

        // Update panels
        panels.forEach(panel => {
          panel.classList.toggle('tab-panel--active', panel.id === target);
        });
      });
    });
  });
}

/* ---------- Phone Click Tracking ---------- */
document.addEventListener('click', (e) => {
  const phoneLink = e.target.closest('a[href^="tel:"]');
  if (phoneLink && typeof gtag === 'function') {
    gtag('event', 'phone_click', {
      event_category: 'Contact',
      event_label: phoneLink.href
    });
  }
});

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
            Ich habe die <a href="kontakt.html#datenschutz" target="_blank" style="color:var(--color-gold); text-decoration:underline;">Datenschutzerklärung</a> zur Kenntnis genommen und stimme der Übermittlung an WhatsApp zu. *
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
