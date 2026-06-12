/* ═══ DR. ORGANIC — SHARED JS ═══
   Language: Hindi pre-rendered in HTML (zero flash).
   data-en attribute holds English. data-hi captured at init. */

// 1. Capture Hindi originals
document.querySelectorAll('[data-en]').forEach(el => {
  el.setAttribute('data-hi', el.innerHTML);
});

function applyLang(lang) {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-en]').forEach(el => {
    el.innerHTML = el.getAttribute(lang === 'en' ? 'data-en' : 'data-hi');
  });
  var bHi = document.getElementById('bHi'), bEn = document.getElementById('bEn');
  if (bHi) bHi.classList.toggle('active', lang === 'hi');
  if (bEn) bEn.classList.toggle('active', lang === 'en');
  var t = document.querySelector('title');
  if (t && t.getAttribute('data-en')) {
    document.title = lang === 'en' ? t.getAttribute('data-en') : t.getAttribute('data-hi');
  }
  try { localStorage.setItem('lang', lang); } catch (e) {}
  // re-measure any open FAQ panels (text length differs per language)
  document.querySelectorAll('.faq-i.open .faq-a').forEach(function (a) {
    a.style.maxHeight = a.scrollHeight + 'px';
  });
}
function setLang(l) { applyLang(l); }

// Auto-detect: saved > device > Hindi
(function () {
  var lang = 'hi';
  try {
    var saved = localStorage.getItem('lang');
    if (saved) lang = saved;
    else if ((navigator.language || 'hi').toLowerCase().indexOf('en') === 0) lang = 'en';
  } catch (e) {}
  if (lang !== 'hi') applyLang(lang);
})();

// 2. Menu drawer
function toggleMenu() {
  var open = document.getElementById('drawer').classList.toggle('open');
  document.getElementById('menuBtn').classList.toggle('open', open);
  document.getElementById('scrim').classList.toggle('on', open);
}

// 3. FAQ accordion
function toggleFaq(btn) {
  var item = btn.parentElement;
  var ans = item.querySelector('.faq-a');
  var was = item.classList.contains('open');
  document.querySelectorAll('.faq-i.open').forEach(function (i) {
    i.classList.remove('open');
    i.querySelector('.faq-a').style.maxHeight = '0';
  });
  if (!was) {
    item.classList.add('open');
    ans.style.maxHeight = ans.scrollHeight + 'px';
  }
}

// 4. Testimonial infinite loop (if present)
(function () {
  var t = document.getElementById('tstTrack');
  if (!t) return;
  t.innerHTML += t.innerHTML;
  t.querySelectorAll('[data-en]:not([data-hi])').forEach(function (el) {
    el.setAttribute('data-hi', el.innerHTML);
  });
})();

// 5. Nav shadow
window.addEventListener('scroll', function () {
  var n = document.getElementById('nav');
  if (n) n.classList.toggle('raised', window.scrollY > 8);
}, { passive: true });

// 6. Scroll reveal
var io = new IntersectionObserver(function (es) {
  es.forEach(function (e) {
    if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
  });
}, { threshold: .07, rootMargin: '0px 0px -20px 0px' });
document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });

// 7. Gallery filter (gallery page)
function galFilter(btn, cat) {
  document.querySelectorAll('.gchip').forEach(function (c) { c.classList.remove('active'); });
  btn.classList.add('active');
  document.querySelectorAll('.gitem').forEach(function (g) {
    g.style.display = (cat === 'all' || g.getAttribute('data-cat') === cat) ? '' : 'none';
  });
}

// 8. WhatsApp enquiry form (contact page)
function sendWa(e) {
  e.preventDefault();
  var name = document.getElementById('wfName').value.trim();
  var place = document.getElementById('wfPlace').value.trim();
  var topic = document.getElementById('wfTopic').value;
  var msg = document.getElementById('wfMsg').value.trim();
  var lang = document.documentElement.lang;
  var lines;
  if (lang === 'en') {
    lines = ['Namaste Dr. Sharvan ji 🙏',
      'Name: ' + name,
      'Location: ' + place,
      'Subject: ' + topic,
      msg ? 'Message: ' + msg : ''].filter(Boolean);
  } else {
    lines = ['नमस्ते डॉ. शरवन जी 🙏',
      'नाम: ' + name,
      'स्थान: ' + place,
      'विषय: ' + topic,
      msg ? 'संदेश: ' + msg : ''].filter(Boolean);
  }
  var url = 'https://wa.me/916377544290?text=' + encodeURIComponent(lines.join('\n'));
  window.open(url, '_blank');
  return false;
}
