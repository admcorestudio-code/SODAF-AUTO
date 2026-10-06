
// ---------- Base de données SODAF (Supabase) ----------
// Clé publique : elle ne donne accès qu'à ce que les règles de sécurité de la base autorisent
// (visiteurs : s'inscrire et envoyer un devoir ; équipe connectée : le reste).
// Outils communs (une seule version pour tout le site) : protéger un texte avant de l'afficher, écrire un nombre en milliers
const escHtml = (t) => String(t == null ? "" : t).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));
const milliers = (n) => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const SB_URL = "https://fpfmpiodbznjofxjfyjf.supabase.co";
const SB_KEY = "sb_publishable_Up-XDNsPpfOsMR00Owu6wQ_FCFCwmwP";
const DB = {
  _k: "sodaf.sb",
  get session() { try { return JSON.parse(localStorage.getItem(this._k) || "null"); } catch (e) { return null; } },
  set session(v) { try { v ? localStorage.setItem(this._k, JSON.stringify(v)) : localStorage.removeItem(this._k); } catch (e) {} },
  async _auth(path, body) {
    const r = await fetch(SB_URL + "/auth/v1/" + path, { method: "POST", headers: { apikey: SB_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error_description || j.msg || j.message || "Connexion impossible");
    this.session = { access: j.access_token, refresh: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000, user: j.user };
    return this.session;
  },
  login(email, password) { return this._auth("token?grant_type=password", { email, password }); },
  async refresh() { const s = this.session; if (!s) throw new Error("Session expirée"); return this._auth("token?grant_type=refresh_token", { refresh_token: s.refresh }); },
  async logout() { const s = this.session; this.session = null; if (s) fetch(SB_URL + "/auth/v1/logout", { method: "POST", headers: { apikey: SB_KEY, Authorization: "Bearer " + s.access } }).catch(() => {}); },
  async token() { let s = this.session; if (!s) return null; if (Date.now() > s.exp - 60000) s = await this.refresh(); return s.access; },
  // Requête à l'API de la base. path ex. "eleves?select=*&order=cree_le.desc"
  async q(path, opt = {}) {
    const h = { apikey: SB_KEY, "Content-Type": "application/json" };
    if (!opt.anon) { const t = await this.token(); if (t) h.Authorization = "Bearer " + t; }
    if (opt.prefer) h.Prefer = opt.prefer;
    const r = await fetch(SB_URL + "/rest/v1/" + path, { method: opt.method || "GET", headers: h, body: opt.body ? JSON.stringify(opt.body) : undefined });
    if (!r.ok) { const j = await r.json().catch(() => ({})); const e = new Error(j.message || ("Erreur " + r.status)); e.status = r.status; throw e; }
    if (r.status === 204 || (opt.prefer || "").includes("return=minimal")) return true;
    return r.json();
  },
  // Envoi public (visiteur non connecté) : true si la ligne est bien enregistrée
  async add(table, row) {
    if (navigator.onLine === false) return false;
    try { await this.q(table, { method: "POST", body: row, prefer: "return=minimal", anon: true }); return true; } catch (e) { return false; }
  },
};

const WA = "https://wa.me/22872544166";
const P_MONO = "M15.42 43.8 l0 10.32 c0 3.66 -1.5 6.24 -6.12 6.24 l-0.84 0 c-4.5 0 -6.06 -2.58 -6.06 -6.24 l0 -14.64 l2.28 0 l0 13.68 c0 2.64 0.6 4.92 4.26 4.92 c3.6 0 4.2 -2.28 4.2 -4.92 l0 -9.96 c0 -3.9 -2.64 -7.2 -4.92 -10.5 c-3.84 -5.58 -5.82 -7.74 -5.82 -13.56 l0 -9.36 c0 -3.66 1.5 -6.24 6.06 -6.24 l0.84 0 c4.56 0 6.12 2.58 6.12 6.24 l0 14.76 l-2.28 0 l0 -13.8 c0 -2.64 -0.66 -4.92 -4.26 -4.92 s-4.2 2.28 -4.2 4.92 l0 9 c-0.06 3.78 1.62 6.3 4.62 10.62 c4.08 5.88 6.12 8.04 6.12 13.44 z";
const P_SLOGAN = "M7.695313 5.888672 c2.763672 0 4.482422 2.050781 4.482422 4.560547 c0 2.568359 -1.71875 4.492188 -4.482422 4.492188 l-2.939453 0 l0 5.058594 l-2.929687 0 l0 -14.111328 l5.869141 0 z M7.207031 12.490234 c1.464844 0 2.148438 -0.810547 2.148438 -2.080078 c0 -1.220703 -0.683594 -2.070312 -2.148437 -2.070312 l-2.451172 0 l0 4.150391 l2.451172 0 z M20.888672 20.195313 c-4.150391 0 -7.216797 -2.832031 -7.216797 -7.255859 c0 -4.433594 3.066406 -7.246094 7.216797 -7.246094 c4.140625 0 7.207031 2.8125 7.207031 7.246094 c0 4.423828 -3.066406 7.255859 -7.207031 7.255859 z M20.888672 17.509766 c2.431641 0 4.296875 -1.708984 4.296875 -4.570312 c0 -2.851562 -1.865234 -4.550781 -4.296875 -4.550781 s-4.296875 1.699219 -4.296875 4.550781 c0 2.861328 1.865234 4.570313 4.296875 4.570313 z M33.085938 20 l-3.691406 -14.111328 l3.046875 0 l2.753906 10.683594 l3.154297 -10.683594 l2.470703 0 l3.134766 10.683594 l2.783203 -10.683594 l3.037109 0 l-3.691406 14.111328 l-3.769531 0 l-2.734375 -8.720703 l-2.724609 8.720703 l-3.769531 0 z M60.214844 8.466797 l-5.234375 0 l0 3.203125 l4.638672 0 l0 2.548828 l-4.638672 0 l0 3.193359 l5.234375 0 l0 2.587891 l-8.183594 0 l0 -14.111328 l8.183594 0 l0 2.578125 z M70.683594 20 l-3.671875 -6.210937 l-0.849609 0 l0 6.210938 l-2.929687 0 l0 -14.111328 l5.117188 0 c3.193359 0 4.541016 1.884766 4.541016 4.21875 c0 1.894531 -1.074219 3.125 -2.988281 3.535156 l4.248047 6.357422 l-3.466797 0 z M66.162109 8.320313 l0 3.369141 l1.728516 0 c1.5625 0 2.197266 -0.664062 2.197266 -1.679687 c0 -1.005859 -0.634766 -1.689453 -2.197266 -1.689453 l-1.728516 0 z M84.482422 8.466797 l-5.234375 0 l0 3.203125 l4.638672 0 l0 2.548828 l-4.638672 0 l0 3.193359 l5.234375 0 l0 2.587891 l-8.183594 0 l0 -14.111328 l8.183594 0 l0 2.578125 z M87.5 20 l0 -14.111328 l5.107422 0 c4.501953 0 6.728516 2.832031 6.728516 7.050781 c0 4.228516 -2.226562 7.060547 -6.728516 7.060547 l-5.107422 0 z M90.429687 17.412109 l2.03125 0 c2.597656 0 3.789063 -1.621094 3.789063 -4.472656 s-1.191406 -4.472656 -3.789062 -4.472656 l-2.03125 0 l0 8.945313 z M114.853516 12.548828 c1.591797 0.439453 2.65625 1.484375 2.65625 3.496094 c0 2.382813 -1.445312 3.955078 -4.423828 3.955078 l-5.810547 0 l0 -14.111328 l4.570313 0 c3.046875 0 4.648438 1.464844 4.648438 3.867188 c0 1.240234 -0.537109 2.255859 -1.640625 2.792969 z M111.875 8.320313 l-1.777344 0 l0 3.320313 l1.904297 0 c1.25 0 1.796875 -0.742187 1.796875 -1.699219 c0 -0.9375 -0.615234 -1.621094 -1.923828 -1.621094 z M112.539063 17.490234 c1.582031 0 2.128906 -0.849609 2.128906 -1.767578 c0 -0.9375 -0.537109 -1.826172 -2.1875 -1.826172 l-2.382812 0 l0 3.59375 l2.441406 0 z M130.703125 5.888672 l-4.638672 7.353516 l0 6.757813 l-2.939453 0 l0 -6.689453 l-4.667969 -7.421875 l3.242188 0 l2.880859 4.804688 l2.890625 -4.804687 l3.232422 0 z M147.324219 20 l-1.025391 -2.910156 l-5.927734 0 l-1.025391 2.910156 l-2.998047 0 l5.195313 -14.111328 l3.583984 0 l5.195313 14.111328 l-2.998047 0 z M141.230469 14.638672 l4.208984 0 l-2.099609 -5.986328 z M152.441406 20 l0 -14.111328 l5.107422 0 c4.501953 0 6.728516 2.832031 6.728516 7.050781 c0 4.228516 -2.226562 7.060547 -6.728516 7.060547 l-5.107422 0 z M155.371093 17.412109 l2.03125 0 c2.597656 0 3.789063 -1.621094 3.789063 -4.472656 s-1.191406 -4.472656 -3.789062 -4.472656 l-2.03125 0 l0 8.945313 z M183.19336 20 l-2.919922 0 l-0.927734 -10.634766 l-3.574219 10.634766 l-1.894531 0 l-3.574219 -10.634766 l-0.9375 10.634766 l-2.929687 0 l1.181641 -14.111328 l4.179688 0 l3.007813 8.857422 l3.046875 -8.857422 l4.179688 0 z M197.705078 20.195313 c-4.150391 0 -7.216797 -2.822266 -7.216797 -7.255859 s3.066406 -7.246094 7.216797 -7.246094 c3.144531 0 5.664063 1.611328 6.669922 4.287109 l-2.734375 0.996094 c-0.625 -1.640625 -2.119141 -2.587891 -3.935547 -2.587891 c-2.431641 0 -4.296875 1.699219 -4.296875 4.550781 s1.865234 4.560547 4.296875 4.560547 c1.816406 0 3.310547 -0.957031 3.935547 -2.597656 l2.734375 0.996094 c-1.005859 2.675781 -3.525391 4.296875 -6.669922 4.296875 z M213.027344 20.195313 c-4.150391 0 -7.216797 -2.832031 -7.216797 -7.255859 c0 -4.433594 3.066406 -7.246094 7.216797 -7.246094 c4.140625 0 7.207031 2.8125 7.207031 7.246094 c0 4.423828 -3.066406 7.255859 -7.207031 7.255859 z M213.027344 17.509766 c2.431641 0 4.296875 -1.708984 4.296875 -4.570312 c0 -2.851562 -1.865234 -4.550781 -4.296875 -4.550781 s-4.296875 1.699219 -4.296875 4.550781 c0 2.861328 1.865234 4.570313 4.296875 4.570313 z M230.38086 20 l-3.671875 -6.210937 l-0.849609 0 l0 6.210938 l-2.929687 0 l0 -14.111328 l5.117188 0 c3.193359 0 4.541016 1.884766 4.541016 4.21875 c0 1.894531 -1.074219 3.125 -2.988281 3.535156 l4.248047 6.357422 l-3.466797 0 z M225.859375 8.320313 l0 3.369141 l1.728516 0 c1.5625 0 2.197266 -0.664062 2.197266 -1.679687 c0 -1.005859 -0.634766 -1.689453 -2.197266 -1.689453 l-1.728516 0 z M244.179688 8.466797 l-5.234375 0 l0 3.203125 l4.638672 0 l0 2.548828 l-4.638672 0 l0 3.193359 l5.234375 0 l0 2.587891 l-8.183594 0 l0 -14.111328 l8.183594 0 l0 2.578125 z";
const P_S = "M13.027344 40.390625 c-6.054687 0 -10.78125 -2.910156 -11.640625 -8.203125 l6.054688 -1.386719 c0.390625 3.164063 2.714844 4.804688 5.820313 4.804688 c2.382813 0 4.277344 -1.054687 4.257813 -3.4375 c-0.019531 -2.65625 -3.144531 -3.496094 -6.582031 -4.550781 c-4.140625 -1.289062 -8.574219 -2.8125 -8.574219 -8.007812 c0 -5.253906 4.296875 -8.222656 9.960938 -8.222656 c4.960938 0 9.960938 2.011719 11.09375 7.421875 l-5.664062 1.40625 c-0.527344 -2.8125 -2.421875 -4.042969 -5.078125 -4.042969 c-2.363281 0 -4.375 0.976563 -4.375 3.300781 c0 2.167969 2.773438 2.890625 5.976563 3.847656 c4.257813 1.289063 9.296875 2.929688 9.296875 8.554688 c0 5.996094 -5.019531 8.515625 -10.546875 8.515625 z";
const P_SYM = "M169.72 64.47c22.62.01 45.36 7.69 63.49 20.59q7.26 5.17 16.49 14.56c14.14 14.38 23.59 33.87 27.25 53.02a1.08 1.07-23.8 0 1-.41 1.05l-24.37 18.13a1.03 1.03 0 0 1-1.03.12l-18.46-8.18a2.18 2.17-80.5 0 1-1.28-1.8q-1.04-12.01-7.870-22.28-6.99-10.51-13.36-15.020-10.57-7.49-21.78-10.47a.96.95 15.1 0 1-.68-1.17l3.48-12.82a2.63 2.62-54.3 0 0-.35-2.14l-21.73-32.45a.73.73 0 0 1 .61-1.14M67.99 169.3a.4.4 0 0 1-.53-.45c4.82-24.68 16.16-47.31 34.82-64.57q20.1-18.58 47.07-24.67a1.28 1.28 0 0 1 1.27.44l16.67 20.24a2.34 2.32 33.1 0 1 .45 2.08l-5.42 19.98a.96.95-88.9 0 1-.7.68q-32.53 7.65-43.31 38.82a.09.09 0 0 1-.12.05l-13.48-6.41a1.7 1.7 0 0 0-1.38-.05zM181.05 284.03q-11.81.19-19.36-1.46-25.55-5.56-44.12-18.88-8.23-5.9-17.98-16.21c-13.35-14.12-21.92-31.46-26.04-50.06a1.26 1.25-25.8 0 1 .44-1.25q10.73-8.5 18.68-14.49 3.13-2.35 6.04-3.83a1.48 1.45 42.9 0 1 1.27-.03l18.31 8.1a.86.85-82.3 0 1 .49.65q.58 3.88 1.62 8.07c2.15 8.66 6.85 15.82 12.74 22.39 7.54 8.4 17.42 12.93 28.24 16.49a.89.89 0 0 1 .59 1.03l-3.18 14.41a1.71 1.69 34.7 0 0 .25 1.32l22.27 33.27a.31.31 0 0 1-.26.48M281.9 179.96a.31.3-6.5 0 1 .42.33c-7.78 42.68-38.46 77.58-80.58 88.76a1.88 1.87-28 0 1-1.91-.58c-8.29-9.52-12.99-14.64-17.86-21.74a1.45 1.42-55.1 0 1-.2-1.18l5.18-19.12a2.51 2.49-88.6 0 1 1.85-1.77q31.14-7.07 42.46-37.11a.61.6 25.3 0 1 .87-.31l12.770 7.37a1.88 1.87 48.7 0 0 1.65.11z";
const P_DAF = "M3.652344 40 l0 -28.222656 l10.214844 0 c9.003906 0 13.457031 5.664063 13.457031 14.101563 c0 8.457031 -4.453125 14.121094 -13.457031 14.121094 l-10.214844 0 z M9.511719 34.824219 l4.0625 0 c5.195313 0 7.578125 -3.242187 7.578125 -8.945312 s-2.382812 -8.945312 -7.578125 -8.945312 l-4.0625 0 l0 17.890625 z M48.813477 40 l-2.050781 -5.820312 l-11.855469 0 l-2.050781 5.820313 l-5.996094 0 l10.390625 -28.222656 l7.167969 0 l10.390625 28.222656 l-5.996094 0 z M36.625977 29.277344 l8.417969 0 l-4.199219 -11.972656 z M72.802735 16.933594 l-10.742187 0 l0 6.40625 l9.277344 0 l0 5.097656 l-9.277344 0 l0 11.5625 l-5.898437 0 l0 -28.222656 l16.640625 0 l0 5.15625 z";
const G_MONO = `<g transform="matrix(6.9124421532822655,0,0,6.9124421532822655,-16.58986182709929,-24.47007132780466)"><path d="${P_MONO}"/></g>`;
const G_WORD = `<g transform="matrix(1.2412121212121212,0,0,1.2412121212121212,108.27878787878788,154.86666666666667)"><path d="${P_S}"/></g><g transform="matrix(0.163949618536616,0,0,0.163949618536616,131.9410958938379,158.43017289615585)"><path d="${P_SYM}"/></g><g transform="matrix(1.2755709342560553,0,0,1.2755709342560553,178.34117647058824,153.9771626297578)"><path d="${P_DAF}"/></g>`;
const G_SLOGAN = `<g transform="matrix(0.5941733489140508,0,0,0.5941733489140508,108.91493705801467,211.61715787690898)"><path d="${P_SLOGAN}"/></g>`;
const LOGO = (c, v) => {
  const vb = v === "word" ? "108 167 165 40" : v === "ws" ? "108 167 165 58" : v === "mono" ? "-2 -4 96 400" : "-4 -6 279 404";
  const inner = v === "word" ? G_WORD : v === "ws" ? G_WORD + G_SLOGAN : v === "mono" ? G_MONO : G_MONO + G_WORD + G_SLOGAN;
  return `<svg class="lg lg-${v}" viewBox="${vb}" fill="${c}" role="img" aria-label="SODAF" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
};
const FAVICON = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#14171C"/><g fill="#fff" transform="translate(24.4 5.3) scale(0.86)"><path d="${P_MONO}"/></g></svg>`);
const PX = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1800`;
const SLIDES = [
  { img: PX(4606336), rule: "Ceinture obligatoire, à l'avant comme à l'arrière.", tag: "Conduite" },
  { img: PX(13749873), rule: "Passage piéton : arrêt et stationnement interdits dessus.", tag: "Marquages" },
  { img: PX(4606341), rule: "Mains à 9h15 sur le volant : le meilleur contrôle.", tag: "Poste de conduite" },
  { img: PX(8811580), rule: "Ligne continue : dépassement interdit.", tag: "Code de la route" },
];

const CSS = String.raw`
#sodaf-root{--bg:#FFFFFF;--soft:#F6F7F8;--ink:#14171C;--muted:#5D6570;--line:#E6E8EB;--green:#0B6E4F;--green-soft:#E8F3EE;--yellow:#F2B100;--red:#C8372D;--red-soft:#FBEAE8;--blue:#2B63B5;
--f-display:"Outfit","Figtree",system-ui,-apple-system,"Segoe UI",sans-serif;--f-body:"Figtree",system-ui,-apple-system,"Segoe UI",sans-serif;--f-mono:"Outfit","Figtree",system-ui,sans-serif;
background:var(--bg);color:var(--ink);font-family:var(--f-body);font-size:17px;line-height:1.65;-webkit-font-smoothing:antialiased}
#home-header3,[id="b6478570-c21e-4a22-ba14-4a078936f572"],[data-block-id="b6478570-c21e-4a22-ba14-4a078936f572"],[data-id="b6478570-c21e-4a22-ba14-4a078936f572"],[data-hrid="home-header3"],[data-block-hrid="home-header3"]{display:none!important}
#sodaf-root *{box-sizing:border-box}
@media (prefers-reduced-motion:reduce){#sodaf-root *{animation:none!important;transition:none!important}}
#sodaf-root a{color:var(--green)}
#sodaf-root :focus-visible{outline:3px solid var(--yellow);outline-offset:2px;border-radius:4px}
#sodaf-root h1,#sodaf-root h2,#sodaf-root h3{font-family:var(--f-display);line-height:1.08;letter-spacing:-.025em;text-wrap:balance;margin:0;color:var(--ink)}
#sodaf-root h2{font-size:clamp(1.75rem,3.6vw,2.4rem);font-weight:700}
#sodaf-root h3{font-size:1.22rem;font-weight:700;letter-spacing:-.015em}
#sodaf-root h4{font:700 1.08rem var(--f-body);margin:24px 0 6px}
#sodaf-root p{margin:0}
#sodaf-root ul{list-style:disc}#sodaf-root ol{list-style:decimal}
#sodaf-root [hidden]{display:none!important}
#sodaf-root img{max-width:100%;display:block}
#sodaf-root svg{display:inline-block}
.wrap{max-width:1160px;margin-inline:auto;padding-inline:clamp(16px,4vw,32px)}
.eyebrow{font-family:var(--f-display);font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:600;display:flex;align-items:center;gap:10px}

.btn{display:inline-flex;align-items:center;gap:.5em;font:600 1rem var(--f-body);padding:.8em 1.35em;border-radius:999px;border:1.5px solid transparent;cursor:pointer;text-decoration:none;transition:transform .15s,box-shadow .15s}
.btn:hover{transform:translateY(-1px)}
#sodaf-root .btn-green{background:var(--green);color:#fff}
.btn-yellow{background:var(--yellow);color:var(--ink)}
#sodaf-root .btn-green:hover{box-shadow:0 10px 24px -12px rgba(11,110,79,.7)}
#sodaf-root .btn-line{background:#fff;border-color:var(--line);color:var(--ink)}
#sodaf-root .btn-line:hover{border-color:var(--ink)}
.btn-sm{padding:.45em .95em;font-size:.9rem}
.tag{display:inline-block;align-self:flex-start;font-family:var(--f-mono);font-size:.7rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:.28em .6em;border-radius:4px;background:var(--soft);color:var(--muted)}
.tag.y{background:var(--yellow);color:var(--ink)}

/* header */
header.top{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.92);backdrop-filter:saturate(1.4) blur(10px);border-bottom:1px solid var(--line)}
.bar{display:flex;align-items:center;gap:20px;min-height:66px;position:relative}
#sodaf-root .logo{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--ink)}
.logo-mark{width:34px;height:34px;border-radius:9px;background:var(--ink);display:grid;place-items:center;color:#fff;font:800 1.3rem/1 var(--f-display)}
.logo-word{font:800 1.6rem/1 var(--f-display);letter-spacing:.05em}
.logo small{display:block;font:500 .56rem var(--f-mono);letter-spacing:.16em;color:var(--muted);margin-top:2px}
nav.main{display:flex;gap:2px;margin-left:auto}
#sodaf-root nav.main a{color:var(--muted);text-decoration:none;font-weight:600;font-size:.95rem;padding:.45em .75em;border-radius:8px;white-space:nowrap}
#sodaf-root nav.main a:hover{color:var(--ink);background:var(--soft)}
#sodaf-root nav.main a.on{color:var(--ink);box-shadow:inset 0 -3px 0 var(--yellow);border-radius:0}
.burger{display:none;margin-left:auto;background:#fff;border:1.5px solid var(--line);color:var(--ink);border-radius:8px;padding:.35em .8em;font:600 .95rem var(--f-body);cursor:pointer}
.hdr-link{font-weight:600;font-size:.95rem;color:var(--ink)!important;text-decoration:none;white-space:nowrap;padding:.45em .2em;border-bottom:2px solid var(--yellow)}
.pricebar{position:relative;z-index:3;margin-top:-34px;background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:0 18px 40px -26px rgba(0,0,0,.35);padding:18px 22px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) auto;gap:16px 28px;align-items:center}
.pb-item{display:flex;flex-direction:column;gap:2px;min-width:0;padding-left:16px;border-left:3px solid var(--line)}
.pb-item:first-child{border-left-color:var(--green)}
.pb-item span{font-size:.86rem;color:var(--muted)}
.pb-item b{font:800 1.45rem/1.1 var(--f-display);letter-spacing:-.02em}
@media (min-width:821px){.dots{bottom:50px!important}.rule{bottom:70px!important}.hero-in{padding-bottom:120px!important}}
@media (max-width:900px){.pricebar{grid-template-columns:repeat(2,minmax(0,1fr))}.pricebar .btn{grid-column:1/-1;justify-content:center}}
@media (max-width:520px){.pricebar{grid-template-columns:1fr;margin-top:-20px}}
@media (max-width:1300px){.burger{display:inline-block}.bar>.btn-green,.bar>.hdr-link{display:none!important}nav.main{display:none;position:absolute;left:-16px;right:-16px;top:100%;background:#fff;flex-direction:column;padding:8px 16px 18px;border-bottom:1px solid var(--line);box-shadow:0 20px 30px -20px rgba(0,0,0,.2)}nav.main.open{display:flex}#sodaf-root nav.main a{padding:.8em .6em;font-size:1.08rem}#sodaf-root nav.main a.on{box-shadow:inset 3px 0 0 var(--yellow)}}

/* subtle white-background patterns */
.pat-dots{background-image:radial-gradient(rgba(20,23,28,.07) 1px,transparent 1.2px);background-size:22px 22px}
.pat-lane{height:6px;background:repeating-linear-gradient(90deg,var(--yellow) 0 34px,transparent 34px 58px) #15191E}
.zebra{position:absolute;width:180px;height:120px;background:repeating-linear-gradient(90deg,rgba(20,23,28,.045) 0 16px,transparent 16px 32px);pointer-events:none}

/* hero */
.hero{position:relative;min-height:min(86vh,740px);display:flex;align-items:center;overflow:hidden;background:#fff}
.slides{position:absolute;inset:0}
#sodaf-root .slides img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 1.6s ease;transform:scale(1.06)}
#sodaf-root .slides img.on{opacity:1;animation:sdkb 9s ease-out forwards}
@keyframes sdkb{from{transform:scale(1.06) translate(0,0)}to{transform:scale(1.16) translate(-2%,-1.5%)}}
.veil{position:absolute;inset:0;background:linear-gradient(90deg,#fff 0%,rgba(255,255,255,.96) 32%,rgba(255,255,255,.6) 56%,rgba(255,255,255,.05) 82%)}
.hero::after{content:"";position:absolute;left:0;right:0;bottom:0;height:120px;background:linear-gradient(to bottom,rgba(255,255,255,0),#fff)}
.hero-in{position:relative;z-index:2;padding-block:64px 96px;width:100%}
.hero-copy{max-width:560px}
.greet{font-family:var(--f-display);font-size:.95rem;letter-spacing:0;color:var(--green);font-weight:600;margin-bottom:16px!important}
#sodaf-root .hero h1{font-size:clamp(2.7rem,6.4vw,4.9rem);font-weight:800;line-height:1.02;letter-spacing:-.035em}
.hero h1 em{font-style:normal;color:var(--green)}
.hslogan{margin:14px 0 18px!important;font:700 clamp(1.05rem,2vw,1.3rem)/1.3 var(--f-display);letter-spacing:-.01em;display:inline-block;padding-bottom:4px;border-bottom:3px solid var(--yellow)}
.hero p.lead{margin-top:20px;max-width:46ch;font-size:1.12rem;color:var(--muted)}
.ctas{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}
.facts{display:flex;flex-wrap:wrap;gap:20px 34px;margin-top:34px}
.facts b{display:block;font:800 2rem/1 var(--f-display)}
.facts span{font-size:.86rem;color:var(--muted)}
.rule{position:absolute;z-index:3;right:clamp(16px,4vw,40px);bottom:56px;display:flex;gap:12px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px 16px;max-width:340px;box-shadow:0 18px 40px -24px rgba(0,0,0,.35);transition:opacity .5s}
.rule .dot{width:36px;height:36px;border-radius:50%;background:var(--yellow);display:grid;place-items:center;flex-shrink:0;font:800 1rem var(--f-display)}
.rule small{display:block;font:600 .66rem var(--f-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.rule p{font-size:.94rem;font-weight:600;line-height:1.35}
.dots{position:absolute;z-index:3;left:clamp(16px,4vw,32px);bottom:30px;display:flex;gap:8px}
.dots button{width:28px;height:4px;border-radius:2px;border:0;background:var(--line);cursor:pointer;padding:0}
.dots button.on{background:var(--ink)}
.lane{position:absolute;z-index:2;left:0;right:0;bottom:0;height:5px;background:repeating-linear-gradient(90deg,var(--ink) 0 46px,transparent 46px 80px);opacity:.12;animation:sdlane 1.4s linear infinite}
@keyframes sdlane{to{background-position:80px 0}}
@media (max-width:820px){.hero{align-items:flex-end;min-height:auto}.veil{background:linear-gradient(180deg,rgba(255,255,255,.15) 0%,rgba(255,255,255,.85) 42%,#fff 62%)}.hero-in{padding-block:240px 110px}.rule{left:16px;right:16px;bottom:52px;max-width:none}}

/* sections */
section.page{padding-bottom:88px}
.sec{padding-top:72px;position:relative}
.sec-head{display:flex;flex-wrap:wrap;align-items:end;justify-content:space-between;gap:12px 24px;margin-bottom:28px}
.sec-head p{max-width:52ch;color:var(--muted)}
.grid{display:grid;gap:18px}
.g2{grid-template-columns:repeat(2,minmax(0,1fr))}.g3{grid-template-columns:repeat(3,minmax(0,1fr))}.g4{grid-template-columns:repeat(4,minmax(0,1fr))}
@media (max-width:900px){.g3,.g4{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:600px){.g2,.g3,.g4{grid-template-columns:1fr}}
.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:22px;min-width:0}
.card h3{margin-bottom:8px}
.card p{color:var(--muted)}
.card.soft{background:var(--soft);border-color:transparent}

/* 4 signalisations */
.signals{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--line);border-radius:14px;overflow:hidden;background:#fff}
#sodaf-root .signals a{display:flex;gap:14px;align-items:center;padding:20px;text-decoration:none;color:var(--ink);border-right:1px solid var(--line);transition:background .15s}
#sodaf-root .signals a:last-child{border-right:0}
#sodaf-root .signals a:hover{background:var(--soft)}
.signals svg{width:44px;height:44px;flex-shrink:0}
.signals b{display:block;font-weight:700}
.signals span{font-size:.88rem;color:var(--muted)}
@media (max-width:900px){.signals{grid-template-columns:repeat(2,minmax(0,1fr))}#sodaf-root .signals a:nth-child(2){border-right:0}#sodaf-root .signals a:nth-child(-n+2){border-bottom:1px solid var(--line)}}
@media (max-width:520px){.signals{grid-template-columns:1fr}#sodaf-root .signals a{border-right:0;border-bottom:1px solid var(--line)}#sodaf-root .signals a:last-child{border-bottom:0}}

.feat{display:flex;flex-direction:column;gap:10px}
.fico{width:42px;height:42px;border-radius:11px;background:var(--green-soft);color:var(--green);display:grid;place-items:center}#sodaf-root .fico svg{display:block;width:22px;height:22px}
#sodaf-root .feat a.more{margin-top:auto;font-weight:600;text-decoration:none}

/* parcours on a road line */
.route{position:relative;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:16px}
.route::before{content:"";position:absolute;left:0;right:0;top:19px;height:3px;background:repeating-linear-gradient(90deg,var(--ink) 0 18px,transparent 18px 32px);opacity:.18}
.stop{position:relative;min-width:0}
.stop i{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:#fff;border:2px solid var(--ink);font:800 1.1rem var(--f-display);font-style:normal;margin-bottom:12px}
.stop:last-child i{background:var(--green);border-color:var(--green);color:#fff}
.stop b{display:block}.stop span{font-size:.92rem;color:var(--muted)}
@media (max-width:820px){.route{grid-template-columns:1fr;gap:18px}.route::before{left:19px;right:auto;top:0;bottom:0;width:3px;height:auto;background:repeating-linear-gradient(180deg,var(--ink) 0 14px,transparent 14px 26px)}.stop{display:grid;grid-template-columns:40px 1fr;gap:14px}.stop i{margin:0}}

/* question du jour */
.qday{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:32px;align-items:start;position:relative;overflow:hidden}
.qday .zebra{right:-20px;top:-20px}
@media (max-width:820px){.qday{grid-template-columns:1fr}}

.band{border:1px solid var(--line);border-radius:18px;padding:36px;display:grid;grid-template-columns:1fr auto;gap:20px;align-items:center;position:relative;overflow:hidden;background:#fff}
.band .zebra{left:-30px;bottom:-40px;transform:rotate(-8deg)}
.band p{color:var(--muted);margin-top:8px;max-width:56ch}
@media (max-width:700px){.band{grid-template-columns:1fr;padding:26px}}

/* page heads (inner pages) */
.page-head{position:relative;padding-block:56px 36px;border-bottom:1px solid var(--line);overflow:hidden}
.page-head .zebra{right:6%;top:24px}
#sodaf-root .page-head h1{font-size:clamp(2.2rem,5.4vw,3.4rem);font-weight:800;letter-spacing:-.03em;margin-top:10px}
.page-head p.lead{max-width:60ch;margin-top:12px;color:var(--muted);font-size:1.08rem}

/* formations */
.offer{display:flex;flex-direction:column;gap:12px}
.offer .cat{font:800 2.2rem/1 var(--f-display);letter-spacing:-.03em}
.offer h3{margin:0}
.alacarte{display:grid;gap:4px}
.acrow{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:12px 0;border-top:1px solid var(--line)}
.acrow:first-of-type{margin-top:8px}
.acrow span{color:var(--muted)}
.wk{display:flex;justify-content:space-between;align-items:baseline;gap:14px;padding:11px 0;border-top:1px solid var(--line)}
.wk:first-of-type{margin-top:10px}
.wk b{font-family:var(--f-display);font-weight:700;white-space:nowrap}
.wk span{color:var(--muted);text-align:right}
.steps-ol{margin:12px 0 0;padding-left:1.2em;color:var(--muted);display:grid;gap:8px}
.steps-ol b{color:var(--ink)}
.classband{display:flex;flex-wrap:wrap;align-items:center;gap:10px 22px;margin-top:28px;padding:16px 20px;border-radius:12px;background:var(--soft);border-left:4px solid var(--yellow)}
.classband p{margin:0}
#sodaf-root footer.site a.teamlink{display:inline;color:rgba(255,255,255,.45);padding:0}
#sodaf-root footer.site a.fcls{display:inline-flex;align-items:center;gap:8px;margin-top:10px;padding:.45em .9em;border:1px solid rgba(242,177,0,.6);border-radius:999px;color:#fff;font-weight:600}
#sodaf-root footer.site a.fcls:hover{background:rgba(242,177,0,.12)}
#sodaf-root footer.site a.fcls span{font:600 .62rem var(--f-mono);letter-spacing:.1em;text-transform:uppercase;background:var(--yellow);color:var(--ink);padding:.2em .55em;border-radius:999px}
.lockcard{max-width:460px;margin:0 auto;text-align:center}
.lockico{width:56px;height:56px;border-radius:50%;background:var(--soft);display:grid;place-items:center;margin:0 auto 14px;color:var(--ink)}
.lockcard form{display:flex;gap:10px;margin-top:18px}
.lockcard input{flex:1;min-width:0;text-transform:uppercase;letter-spacing:.12em;text-align:center}
.teamgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
@media (max-width:1100px){.teamgrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:600px){.teamgrid{grid-template-columns:1fr}}
a.teamtile{display:flex;flex-direction:column;gap:6px;text-decoration:none;color:var(--ink);transition:transform .15s,box-shadow .15s}
a.teamtile:hover{transform:translateY(-2px);box-shadow:0 14px 30px -18px rgba(0,0,0,.35)}
a.teamtile b{font:700 1.3rem var(--f-display)}
a.teamtile span{color:var(--muted)}
a.teamtile em{font-style:normal;font-weight:700;color:var(--green);margin-top:8px}
.teamsteps{margin:10px 0 0;padding-left:1.2em;display:grid;gap:8px;color:var(--muted)}
.teamsteps b{color:var(--ink)}
.sits{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:12px}
@media (max-width:700px){.sits{grid-template-columns:1fr}}
.sit{border:1px solid var(--line);border-radius:12px;padding:12px;background:#fff}
.scene{display:block;width:100%;height:auto;border-radius:8px}
#sodaf-root .sit h5{font:700 1.05rem var(--f-display);margin:12px 0 4px}
.sit p{margin:0}
.sit details{margin-top:8px}
.sit summary{cursor:pointer;font-weight:700;color:var(--green)}
.sit details p{margin-top:6px;color:var(--muted)}
.sit details b{color:var(--ink)}
.fig{margin:16px 0 0}
.fig svg{display:block;width:100%;max-width:400px;height:auto;border-radius:8px}
.fig figcaption{font-size:.92rem;color:var(--muted);margin-top:8px;max-width:60ch}
.pas svg{width:42px;height:42px;display:block;margin-bottom:8px}
.qscene{max-width:340px;margin:0 0 14px}
.cls-sitwrap{display:grid;grid-template-columns:420px minmax(0,1fr);gap:30px;align-items:center}
.cls-sitwrap .scene{width:420px}
.cls-sitwrap .cls-qt{font-size:1.7rem}
/* mode classe */
.cls{position:fixed;inset:0;z-index:9000;background:#fff;display:flex;flex-direction:column;color:var(--ink)}
.cls-top{display:flex;align-items:center;gap:12px 18px;flex-wrap:wrap;padding:10px 20px;border-bottom:1px solid var(--line)}
.cls-brand{display:flex;align-items:center;gap:10px;font:600 .72rem var(--f-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.cls-brand svg{height:22px;width:auto}
.cls-tabs{display:flex;gap:6px;background:var(--soft);padding:4px;border-radius:999px}
.cls-tabs button{border:0;background:transparent;font:600 .95rem var(--f-body);padding:.5em 1em;border-radius:999px;cursor:pointer;color:var(--muted)}
.cls-tabs button[aria-selected="true"]{background:#fff;color:var(--ink);box-shadow:0 1px 4px rgba(0,0,0,.12)}
.cls-top select{font:500 .95rem var(--f-body);padding:.5em .8em;border:1px solid var(--line);border-radius:10px;background:#fff;max-width:320px}
.cls-count{font:600 .95rem var(--f-mono);color:var(--muted);margin-left:auto}
.cls-top .btn{padding:.5em 1em}
.cls-stage{flex:1;min-height:0;overflow:auto;display:flex;justify-content:center;align-items:flex-start;padding:24px 20px}
.cls-zoom{width:900px;font-size:20px;line-height:1.5;margin:auto 0}
.cls-zoom p,.cls-zoom li{max-width:none}
.cls-zoom h4{font:700 1.35rem var(--f-display);margin:18px 0 8px;color:var(--green)}
.cls-zoom h4:first-child{margin-top:0}
.cls-zoom .sign svg{width:96px;height:96px}
.cls-kicker{font:600 .8rem var(--f-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:0 0 10px}
.cls-h1{font:800 3.4rem/1.05 var(--f-display);letter-spacing:-.03em;margin:0}
.cls-title{text-align:center;padding:40px 0}
.cls-title .cls-bar{width:90px;height:8px;background:var(--yellow);border-radius:4px;margin:22px auto 0}
.cls-qt{font:700 2rem/1.2 var(--f-display);margin:0 0 22px}
.cls-opts{display:grid;gap:12px}
.cls-opt{display:flex;gap:16px;align-items:center;border:2px solid var(--line);border-radius:14px;padding:14px 18px;font-size:1.25rem;background:#fff}
.cls-opt b{font:700 1rem var(--f-mono);width:40px;height:40px;border-radius:8px;display:grid;place-items:center;background:var(--soft);flex-shrink:0}
.cls-opt.good{border-color:var(--green);background:var(--green-soft)}
.cls-opt.good b{background:var(--green);color:#fff}
.cls-opt.dim{opacity:.45}
.cls-exp{margin-top:18px;border-left:5px solid var(--green);background:var(--soft);border-radius:0 12px 12px 0;padding:14px 18px;font-size:1.1rem}
.cls-sign{text-align:center}
.cls-sign svg{width:300px;height:300px;display:block;margin:10px auto 18px}
.cls-sign .cls-ans{font:800 2.2rem var(--f-display)}
.cls-sign .cls-desc{font-size:1.2rem;color:var(--muted);margin-top:6px}
.cls-ask{font:600 1.4rem var(--f-display);color:var(--muted)}
.cls-bot{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 20px;border-top:1px solid var(--line)}
.cls-bot .btn{font-size:1.05rem;padding:.75em 1.4em}
.cls-help{font-size:.85rem;color:var(--muted);text-align:center}
@media (max-width:700px){.cls-help{display:none}.cls-count{margin-left:0}}
#sodaf-root .cls-qt{margin:0 0 24px}
#sodaf-root .cls-kicker{margin:0 0 10px}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (max-width:760px){#sd-teamPanel .g2{grid-template-columns:1fr}}

.classband .cb-t{font-family:var(--f-display);font-weight:700}
.classband .cb-d{color:var(--muted);font-size:.95rem}
.acrow strong{font:800 1.2rem var(--f-display);white-space:nowrap}
@media (max-width:600px){.acrow{flex-direction:column;align-items:flex-start;gap:4px}
.wk{flex-direction:column;gap:2px}.wk span{text-align:left}
.classband .btn{margin-left:0!important}}
#sodaf-root .offer ul{margin:0;padding-left:1.1em;color:var(--muted)}
.price{margin-top:auto;padding-top:14px;border-top:1px dashed var(--line);display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.price b{font-family:var(--f-mono);font-size:.84rem;color:var(--muted)}
.offer.star{border:2px solid var(--ink)}
.pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.pills span{font-weight:600;font-size:.9rem;padding:.45em .85em;border-radius:999px;border:1px solid var(--line)}

/* cours */
.course{display:grid;grid-template-columns:250px minmax(0,1fr);gap:36px;align-items:start;padding-top:36px}
.toc{position:sticky;top:86px;border:1px solid var(--line);border-radius:14px;padding:12px;max-height:calc(100vh - 110px);overflow:auto;background:#fff}
.toc .part{font:600 .68rem var(--f-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:12px 8px 4px}
.toc button{display:flex;justify-content:space-between;align-items:center;gap:8px;width:100%;text-align:left;background:none;border:0;padding:.42em .55em;border-radius:6px;font:500 .93rem var(--f-body);color:var(--ink);cursor:pointer}
.toc button:hover{background:var(--soft)}
.toc .done{width:14px;height:14px;border-radius:50%;border:2px solid var(--line);flex-shrink:0}
.toc button.read .done{background:var(--green);border-color:var(--green)}
.toc button.cur{background:var(--green-soft);font-weight:600}
.toc button.cur .done{border-color:var(--green);box-shadow:inset 0 0 0 3px #fff,inset 0 0 0 8px var(--yellow)}
.toc button.cur.read .done{box-shadow:inset 0 0 0 3px var(--green),inset 0 0 0 8px var(--yellow)}
.toc .done{transition:box-shadow .2s,background .2s,border-color .2s}
@media (max-width:900px){.course{grid-template-columns:minmax(0,1fr);gap:20px}.toc{position:static;max-height:none;display:flex;gap:6px;overflow-x:auto;padding:10px}.toc .part{display:none}.toc button{white-space:nowrap;width:auto;background:var(--soft)}}
article.ch{border:1px solid var(--line);border-radius:14px;padding:clamp(20px,3vw,34px);margin-bottom:22px;scroll-margin-top:90px;background:#fff}
article.ch header{display:flex;justify-content:space-between;align-items:start;gap:16px;flex-wrap:wrap;padding-bottom:16px;margin-bottom:18px;border-bottom:1px solid var(--line)}
#sodaf-root article.ch h2{font-size:clamp(1.8rem,4vw,2.4rem)}
article.ch p,article.ch li{max-width:70ch}
article.ch p+p{margin-top:10px}
#sodaf-root article.ch ul,#sodaf-root article.ch ol{padding-left:1.2em;margin:8px 0}
.dl{display:grid;border-top:1px solid var(--line);margin:0}
.dl div{display:grid;grid-template-columns:200px minmax(0,1fr);gap:16px;padding:12px 0;border-bottom:1px solid var(--line)}
.dl dt{font-weight:700}.dl dd{margin:0;color:var(--muted)}
@media (max-width:600px){.dl div{grid-template-columns:1fr;gap:2px}}
.tbl{overflow-x:auto;border:1px solid var(--line);border-radius:10px;margin:12px 0}
.tbl table{border-collapse:collapse;width:100%;min-width:540px;font-size:.95rem}
.tbl th,.tbl td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}
.tbl th{background:var(--soft);font:600 .74rem var(--f-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.tbl tr:last-child td{border-bottom:0}
#sodaf-root .tbl svg{display:block}
.note{border-left:4px solid var(--yellow);background:var(--soft);border-radius:0 8px 8px 0;padding:12px 16px;margin:14px 0;font-size:.97rem}
.note.red{border-left-color:var(--red);background:var(--red-soft)}
#sodaf-root .read-btn{color:var(--ink)}
#sodaf-root .read-btn.done{background:var(--green);color:#fff;border-color:var(--green)}
.read-foot{margin-top:22px;padding-top:16px;border-top:1.5px dashed var(--line);display:flex;justify-content:center}
#sodaf-root .read-foot .read-btn{white-space:normal;text-align:center;max-width:100%}
.signs{display:flex;flex-wrap:wrap;gap:16px;margin:12px 0}
.sign{display:flex;flex-direction:column;align-items:center;gap:6px;width:104px;text-align:center;font-size:.82rem;color:var(--muted)}
#sodaf-root .sign svg{display:block;width:60px;height:60px}
.mnemo{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:12px 0}
.mnemo div{background:var(--soft);border-radius:10px;padding:14px}
.mnemo b{display:block;font:800 2rem/1 var(--f-display);color:var(--green);margin-bottom:4px}
@media (max-width:600px){.mnemo{grid-template-columns:1fr}}
.lights .card{border-top-width:5px}

/* quiz */
.quiz{max-width:760px;margin-inline:auto}
.qbar{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px;font-family:var(--f-mono);font-size:.82rem;color:var(--muted)}
.progress{height:6px;background:var(--soft);border-radius:99px;overflow:hidden;margin-bottom:22px}
.progress i{display:block;height:100%;background:var(--green)}
.qtext{font:700 1.28rem/1.4 var(--f-body);margin-bottom:18px!important}
.opts{display:grid;gap:10px}
.opt{display:flex;gap:12px;align-items:center;text-align:left;width:100%;background:#fff;border:1.5px solid var(--line);border-radius:12px;padding:13px 16px;font:500 1rem var(--f-body);color:var(--ink);cursor:pointer}
.opt:hover:not(:disabled){border-color:var(--ink)}
.opt .k{font:700 .82rem var(--f-mono);width:28px;height:28px;border-radius:6px;display:grid;place-items:center;background:var(--soft);flex-shrink:0}
.opt.good{border-color:var(--green);background:var(--green-soft)}
.opt.bad{border-color:var(--red);background:var(--red-soft)}
.explain{margin-top:16px;padding:14px 16px;border-radius:10px;background:var(--soft)}
.explain b{display:block;margin-bottom:4px}
.qactions{display:flex;justify-content:space-between;gap:12px;margin-top:18px;flex-wrap:wrap}
.result{text-align:center}
.result .big{font:800 5rem/1 var(--f-display);color:var(--green)}
.ptools{display:flex;flex-wrap:wrap;gap:12px 16px;align-items:center;margin-bottom:10px}
.pfilters{display:flex;flex-wrap:wrap;gap:8px;flex:1 1 auto}
.pfilters button{background:#fff;border:1.5px solid var(--line);border-radius:999px;padding:.45em .95em;font:600 .9rem var(--f-body);color:var(--ink);cursor:pointer}
.pfilters button[aria-selected="true"]{background:var(--ink);border-color:var(--ink);color:#fff}
.psearch input{font:1rem var(--f-body);padding:.6em .9em;border:1.5px solid var(--line);border-radius:999px;min-width:0;width:260px;max-width:100%}
.psearch input:focus{border-color:var(--ink);outline:none}
.ptoggle{display:flex;align-items:center;gap:8px;font-weight:600;cursor:pointer;white-space:nowrap}
.ptoggle input{width:19px;height:19px;accent-color:var(--green)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.phint{color:var(--muted);margin:4px 0 18px!important;min-height:1.5em}
.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px}
.pcard{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px 14px;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;cursor:default;font:inherit;color:inherit}
.pcard svg{width:96px;height:96px;display:block}
.pcard b{font:700 1rem/1.25 var(--f-display);letter-spacing:-.01em}
.pcard span{font-size:.86rem;color:var(--muted);line-height:1.4}
.pgrid.rev .pcard{cursor:pointer}
.pgrid.rev .pcard .ptxt{visibility:hidden}
.pgrid.rev .pcard.shown .ptxt{visibility:visible}
.preveal{display:none;font-style:normal;font-size:.82rem;font-weight:600;color:var(--green)}
.pgrid.rev .pcard:not(.shown) .preveal{display:block}
.pgrid.rev .pcard:not(.shown) .ptxt{display:none}
.ptxt{display:flex;flex-direction:column;gap:4px}
.pempty{color:var(--muted)}
.pnote{font-size:.84rem;color:var(--muted);margin-top:24px!important}
@media (max-width:520px){.pgrid{grid-template-columns:repeat(2,minmax(0,1fr))}.pcard svg{width:76px;height:76px}.psearch,.psearch input{width:100%}}
.qbest{max-width:760px;margin:0 auto 18px;text-align:center;font-size:.95rem;color:var(--muted)}
.qbest b{color:var(--green)}
.modes{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:26px}
.modes button{background:#fff;border:1.5px solid var(--line);border-radius:999px;padding:.5em 1em;font:600 .93rem var(--f-body);color:var(--ink);cursor:pointer}
.modes button.on{border-color:var(--ink);background:var(--ink);color:#fff}

/* devoirs */
.qsign{display:flex;justify-content:center;margin-bottom:16px}
.qsign svg{width:120px;height:120px;display:block}
.devnow{display:grid;grid-template-columns:auto 1fr auto;gap:18px 26px;align-items:center;padding:26px 28px;border-radius:18px;background:#15191E;color:#fff;margin-bottom:22px}
.devnow .dl{font:800 4.2rem/1 var(--f-display);color:var(--yellow);width:86px;height:86px;border-radius:16px;background:rgba(242,177,0,.12);display:grid;place-items:center}
#sodaf-root .devnow h3{font:700 1.5rem/1.2 var(--f-display);margin:4px 0 6px;color:#fff}
#sodaf-root .devnow .btn-line{background:transparent;color:#fff;border-color:rgba(255,255,255,.35)}
.devnow p{color:#C9CED6;margin:0}
.devnow .eyebrow{color:var(--yellow)}
.devnow .done{color:#7FD3AE;font-weight:700}
.devacts{display:flex;flex-direction:column;gap:8px;align-items:stretch}
.devacts .btn{justify-content:center;text-align:center}
@media (max-width:760px){.devnow{grid-template-columns:auto 1fr}.devacts{grid-column:1/-1}}
.devgrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
@media (max-width:900px){.devgrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
.devtile{display:flex;flex-direction:column;gap:4px;text-align:left;background:#fff;border:1.5px solid var(--line);border-radius:14px;padding:14px;font:inherit;color:var(--ink);cursor:pointer}
.devtile:hover{border-color:var(--ink)}
.devtile b{font:800 1.6rem/1 var(--f-display)}
.devtile span{font-size:.9rem;line-height:1.3}
.devtile em{font-style:normal;font-size:.8rem;color:var(--muted);margin-top:auto;padding-top:6px}
.devtile em.ok{color:var(--green);font-weight:700}
.devtile.now{border-color:var(--yellow);box-shadow:inset 0 0 0 1.5px var(--yellow)}
.devlink{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:6px 16px;max-width:760px;margin:0 auto 22px;padding:14px 18px;border-radius:12px;background:#15191E;color:#fff;text-decoration:none}
.devlink b{font:700 1.05rem var(--f-display);color:var(--yellow)}
.devlink span{color:#C9CED6;font-size:.95rem}
#sd-dev{scroll-margin-top:90px}
.fslogan{margin-top:14px!important;font:700 1.05rem/1.3 var(--f-display);color:var(--yellow)}
.entgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.entdoc{display:flex;flex-direction:column;gap:14px}
.entdoc img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:10px;background:#15191E;border:1px solid var(--line)}
.entdoc img.tall{object-fit:contain;background:var(--soft)}
.entdoc img.sq{object-fit:contain;background:#fff}
.entdoc b{display:block;font:700 1.15rem var(--f-display)}
.entdoc span{display:block;color:var(--muted);font-size:.93rem;margin-top:4px}
.entdoc .acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.navteam{display:none}
@media (max-width:1300px){#sodaf-root nav.main a.navteam{display:block;margin-top:6px;border-top:1px solid var(--line);color:var(--green)}}
.rcmotifs{border:0;padding:0;margin:0 0 6px;display:grid;gap:8px;min-width:0}
.rcmotifs legend{font-weight:600;margin-bottom:8px;padding:0}
.rcm{display:flex;align-items:center;gap:12px;border:1.5px solid var(--line);border-radius:12px;padding:12px 14px;cursor:pointer;background:#fff}
.rcm[hidden]{display:none}
.rcm.on{border-color:var(--green);background:var(--green-soft)}
#sodaf-root .rcm input{width:20px;height:20px;padding:0;margin:0;flex:0 0 20px;accent-color:var(--green)}
.rcm span{flex:1;min-width:0}
.rcm b{display:block;font-weight:700}
.rcm small{display:block;color:var(--muted);font-size:.88rem;margin-top:2px}
.rcm em{font-style:normal;font:800 1.05rem var(--f-display);color:var(--green);white-space:nowrap}
@media (max-width:520px){.rcm{flex-wrap:wrap}.rcm span{flex:1 1 calc(100% - 40px)}.rcm em{margin-left:32px}}
#sodaf-root #sd-rcOther{font:1rem var(--f-body);padding:.7em .8em;border:1.5px solid var(--line);border-radius:10px;width:100%}
.rcmodes{border:0;padding:0;margin:0 0 6px;min-width:0;display:flex;flex-wrap:wrap;gap:8px}
.rcmodes legend{font-weight:600;margin-bottom:8px;padding:0;width:100%}
#sodaf-root .rcmodes .rcmode{display:inline-flex;width:auto;align-items:center;gap:10px;border:1.5px solid var(--line);border-radius:999px;padding:10px 18px;cursor:pointer;font-weight:600}
.rcmode:has(input:checked){border-color:var(--green);background:var(--green-soft)}
#sodaf-root .rcmode input{width:18px;height:18px;padding:0;margin:0;flex:0 0 18px;accent-color:var(--green)}
.rcform .row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media (max-width:640px){.rcform .row2{grid-template-columns:1fr}}
.rcout{margin-top:18px}
.rcacts{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:12px 0}
.rcacts .devsent{margin-top:0}
.rchelp{font-size:.88rem;color:var(--muted)}
.rc-prev{overflow:auto;padding:16px;background:var(--soft);border-radius:14px;display:flex;justify-content:center}
.rc-prev .rc{box-shadow:0 18px 40px -22px rgba(0,0,0,.45)}
@media (max-width:640px){.rc-prev .rc{zoom:.58}}
.rc-render{position:fixed;left:-10000px;top:0}
.rc{width:559px;height:793px;background:#fff;color:#15191E;font-family:Figtree,sans-serif;display:flex;flex-direction:column;flex-shrink:0;overflow:hidden}
.rc-top{background:#15191E;color:#fff;padding:26px 30px 22px;display:flex;justify-content:space-between;align-items:flex-start;border-bottom:6px solid #F2B100}
.rc-logo svg{width:150px;height:auto;display:block}
.rc-logo small{display:block;margin-top:8px;font:600 10px Outfit,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#F2B100}
.rc-no{text-align:right;display:flex;flex-direction:column;gap:3px}
.rc-no b{font:800 20px Outfit,sans-serif}
.rc-no span{font-size:12px;color:#C9CED6}
.rc-body{padding:22px 30px 0;flex:1;display:flex;flex-direction:column;gap:12px}
.rc-row{display:grid;grid-template-columns:96px 1fr;column-gap:12px;row-gap:2px;padding-bottom:10px;border-bottom:1px solid #E6E8EB}
.rc-row span{grid-row:span 2;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#5D6570;padding-top:3px}
.rc-row b{font:700 16px Outfit,sans-serif}
.rc-row em{font-style:normal;font-size:12px;color:#5D6570}
.rc-amt{background:#E8F3EE;border-radius:14px;padding:16px 18px;display:flex;flex-direction:column;gap:2px}
.rc-amt span{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0B6E4F}
.rc-amt b{font:800 34px/1.1 Outfit,sans-serif;color:#0B6E4F}
.rc-amt em{font-style:normal;font-size:13px;color:#15191E}
.rc-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.rc-grid div{border:1.5px solid #E6E8EB;border-radius:12px;padding:10px 14px}
.rc-grid span{display:block;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#5D6570}
.rc-grid b{font:700 16px Outfit,sans-serif}
.rc-cond{font-size:11.5px;line-height:1.5;color:#5D6570;background:#F6F7F8;border-radius:10px;padding:10px 14px}
.rc-cond b{display:block;color:#15191E;font-size:11px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:2px}
.rc-note{font-size:12px;color:#5D6570;margin:0!important}
.rc-sign{margin-top:auto;display:flex;justify-content:space-between;align-items:center;gap:16px;padding-bottom:12px}
.rc-sign span{display:block;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#5D6570}
.rc-sign b{display:block;font:700 15px Outfit,sans-serif;margin-top:2px}
.rc-sign small{display:block;font-size:10.5px;color:#5D6570;margin-top:8px;max-width:270px;line-height:1.4}
.rc-sign img{width:132px;height:132px;transform:rotate(-9deg);opacity:.9;margin-right:6px}
.rc-foot{background:#F6F7F8;padding:12px 30px;display:flex;justify-content:space-between;gap:10px;font-size:10.5px;color:#5D6570;align-items:center}
.rc-foot b{color:#0B6E4F;font:700 11px Outfit,sans-serif;white-space:nowrap}
.tm-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px 24px;flex-wrap:wrap;margin-bottom:22px}
.tm-today{color:var(--muted);margin-top:6px!important}
.tm-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:12px}
.tm-tabs button{text-align:left;border:1.5px solid var(--line);background:#fff;border-radius:14px;padding:14px 16px;cursor:pointer;font:inherit;color:var(--ink);display:flex;flex-direction:column;gap:2px;border-top:4px solid var(--line)}
.tm-tabs button b{font:700 1.15rem var(--f-display)}
.tm-tabs button small{color:var(--muted);font-size:.86rem}
.tm-tabs button[data-t="sec"][aria-selected="true"]{border-color:var(--green);border-top-color:var(--green);background:var(--green-soft)}
.tm-tabs button[data-t="mon"][aria-selected="true"]{border-color:#C99400;border-top-color:var(--yellow);background:#FFF7DC}
.tm-tabs button[data-t="docs"][aria-selected="true"]{border-color:var(--ink);border-top-color:var(--ink);background:var(--soft)}
@media (max-width:640px){.tm-tabs{grid-template-columns:1fr}.tm-tabs button{flex-direction:row;align-items:baseline;gap:10px;padding:12px 14px}}
.tm-hint{font-size:.88rem;color:var(--muted);margin-bottom:22px!important}
.tm-role{font-weight:600;margin-bottom:16px!important;padding-left:12px;border-left:4px solid var(--green)}
.tm-pane[data-pane="mon"] .tm-role{border-left-color:var(--yellow)}
.tm-pane[data-pane="docs"] .tm-role{border-left-color:var(--ink)}
.tm-sub{display:flex;justify-content:space-between;align-items:end;flex-wrap:wrap;gap:8px 24px;margin:34px 0 14px}
.tm-sub h3{font:700 1.45rem var(--f-display);margin-top:2px}
.tm-sub p:not(.eyebrow){max-width:52ch;color:var(--muted)}
.tm-guides{margin-top:0}
.tm-note{font-size:.9rem;color:var(--muted);margin-top:10px!important}
a.teamtile.hl{border-color:var(--green);box-shadow:inset 0 0 0 1px var(--green)}
.tm-pane[data-pane="mon"] a.teamtile.hl{border-color:var(--yellow);box-shadow:inset 0 0 0 1px var(--yellow)}
.tm-week{margin-bottom:16px;border-top:4px solid var(--yellow)}
.tm-wk-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px 20px;flex-wrap:wrap;margin-bottom:14px}
.tm-wk-head h3{font:700 1.3rem var(--f-display);margin-top:2px}
.tm-days{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
@media (max-width:900px){.tm-days{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:480px){.tm-days{grid-template-columns:1fr}}
.tm-day{display:flex;flex-direction:column;gap:2px;padding:12px 14px;border-radius:12px;background:var(--soft);text-decoration:none;color:var(--ink)}
.tm-day:hover{background:#FFF7DC}
.tm-day b{font:700 1rem var(--f-display)}
.tm-day span{font-size:.92rem}
.tm-day em{font-style:normal;font-size:.84rem;color:var(--green);font-weight:700;margin-top:4px}
.rcbox{margin-top:0}
#sd-teamPanel a.teamtile b,#sd-teamPanel .tm-day b{color:#14171C}
#sd-teamPanel .tm-day span{color:#3D444D}
#sd-teamPanel a.teamtile em,#sd-teamPanel .tm-day em{color:#064D36}
#sd-teamPanel a.teamtile:hover b{text-decoration:underline;text-decoration-color:var(--yellow);text-decoration-thickness:3px;text-underline-offset:4px}
.tm-pane[data-pane="mon"] .teamgrid{grid-template-columns:repeat(2,minmax(0,1fr))}
@media (max-width:600px){.tm-pane[data-pane="mon"] .teamgrid{grid-template-columns:1fr}}
/* espace équipe : connexion et données */
.lockcard form.tmlogin{flex-direction:column;align-items:stretch}
.lockcard .tmlogin input{text-transform:none;letter-spacing:0;text-align:left;font:1rem var(--f-body);padding:.75em .9em;border:1.5px solid var(--line);border-radius:10px;background:#fff;color:var(--ink)}
.lockcard .tmlogin input:focus{border-color:var(--ink);outline:none}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.tm-acc{display:flex;gap:6px 18px;flex-wrap:wrap;align-items:center}
.tmpw{margin-bottom:16px;max-width:520px}
.tmpw label{font-weight:600;display:block;margin-bottom:8px}
.tmpw div{display:flex;gap:10px}
.tmpw input,.tm-bar input,.tm-bar select,.tm-row select,.tm-row input,.tm-msg,#sd-dvWeek{font:.98rem var(--f-body);padding:.6em .75em;border:1.5px solid var(--line);border-radius:10px;background:#fff;color:var(--ink);min-width:0}
.tmpw input{flex:1}
.tm-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:9500;background:var(--ink);color:#fff;padding:.7em 1.2em;border-radius:12px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.2);max-width:calc(100vw - 32px)}
.tm-toast.bad{background:var(--red)}
.tm-subnav{display:flex;gap:6px;flex-wrap:wrap;border-bottom:1.5px solid var(--line);margin-bottom:18px}
.tm-subnav button{font:600 .98rem var(--f-body);background:none;border:0;padding:.7em .9em;cursor:pointer;color:#3D444D;border-bottom:3px solid transparent;margin-bottom:-1.5px;display:flex;align-items:center;gap:6px}
.tm-subnav button[aria-selected="true"]{color:var(--ink);border-bottom-color:var(--green)}
.tm-count:not(:empty){background:var(--red);color:#fff;font:700 .75rem/1 var(--f-body);padding:.3em .55em;border-radius:999px}
.tm-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px}
.tm-bar input[type=search]{flex:1 1 220px}
.tm-day-nav b{font:700 1.1rem var(--f-display);min-width:12ch;text-align:center;flex:1}
.tm-form{margin-bottom:16px}
.row3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
@media (max-width:760px){.row3{grid-template-columns:1fr}}
.tm-formact{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-top:6px}
.tm-err{color:var(--red);font-weight:600;font-size:.92rem}
.tm-list{display:flex;flex-direction:column;gap:8px}
.tm-row{display:flex;gap:12px 16px;align-items:center;flex-wrap:wrap;background:#fff;border:1.5px solid var(--line);border-left:5px solid var(--line);border-radius:12px;padding:12px 14px}
.tm-main{flex:1 1 260px;min-width:0;display:flex;flex-direction:column;gap:2px}
.tm-main b{font-weight:700;color:var(--ink)}
.tm-main span{color:#3D444D;font-size:.94rem}
.tm-main small{color:var(--muted);font-size:.85rem}
.tm-main select,.tm-main input{width:100%;margin-top:4px}
.tm-acts{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.tm-time{font:700 1rem var(--f-mono);min-width:5.5ch;color:var(--ink)}
.tm-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-top:6px}.tm-dot-r{background:#D7263D}.tm-dot-o{background:#F08A24}.tm-dot-y{background:#E8C21A}
.tm-empty{color:var(--muted);padding:18px;text-align:center;background:var(--soft);border-radius:12px}
.tm-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-bottom:14px}
.tm-stats div{background:var(--soft);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column}
.tm-stats span{font-size:.85rem;color:#3D444D}
.tm-stats b{font:700 1.35rem var(--f-display);color:var(--ink)}
.tm-msg{width:100%;min-height:200px;font:.92rem/1.5 var(--f-mono);margin:10px 0}
#sd-dvWeek{width:100%;margin-bottom:12px}
.tm-mon{margin-bottom:16px}
.tm-h3{font:700 1.25rem var(--f-display);margin:2px 0 12px!important}
.tm-lab{font-weight:700;margin:12px 0 6px!important}
.tm-checks{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;margin-bottom:12px}
.tm-checks label{display:flex;gap:8px;align-items:center;background:var(--soft);padding:.5em .7em;border-radius:10px;cursor:pointer}
.tm-checks input{width:18px;height:18px;accent-color:var(--green)}
.tm-notes{flex-basis:100%;margin:0!important;font-size:.88rem;color:#3D444D;background:#FFF7DC;border-radius:8px;padding:.35em .7em}
.tm-edit{flex-basis:100%;border-top:1.5px dashed var(--line);padding-top:12px;margin-top:4px}
.row2e{display:grid;grid-template-columns:1fr 2fr;gap:12px}
@media (max-width:760px){.row2e{grid-template-columns:1fr}}
.tm-row.annule{background:var(--soft);opacity:.75}
.tm-row.annule .tm-main b{text-decoration:line-through}
.tm-ko{color:var(--red)!important;text-decoration:none!important}
.tm-closed{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;background:var(--red-soft);border:1.5px solid var(--red);border-radius:12px;padding:12px 14px;margin-bottom:14px;color:var(--ink)}
.tm-foot{margin-top:14px!important;text-align:right}
.tm-warn:not(:empty){margin-bottom:26px;padding-bottom:18px;border-bottom:1.5px dashed var(--line)}
.tm-warn .tm-sub{margin-top:6px}
@media (min-width:641px){.tm-tabs{grid-template-columns:repeat(auto-fit,minmax(170px,1fr))}}
@media (max-width:640px){.tm-tabs button{flex-wrap:wrap;row-gap:0}}
.tm-tabs button[data-t="dir"][aria-selected="true"]{border-color:var(--blue);border-top-color:var(--blue);background:#EAF1FB}
.tm-tabs button[data-t="ger"][aria-selected="true"]{border-color:#6B4FA0;border-top-color:#6B4FA0;background:#F1ECF9}
.tm-pane[data-pane="ger"] .tm-role{border-left-color:#6B4FA0}
.tm-tabs button{position:relative}
.tm-pane[data-pane="dir"] .tm-role{border-left-color:var(--blue)}
.tm-drmonth{font:700 1.15rem var(--f-display);flex:1}
.tm-dr div{position:relative}
.tm-dr div.hl{background:var(--ink);color:#fff}
.tm-dr div.hl span,.tm-dr div.hl small{color:#C9CED4}
.tm-dr div.hl b{color:#fff}
.tm-dr small{font-size:.8rem;color:var(--muted)}
.tm-drex{grid-template-columns:repeat(3,1fr)}@media(max-width:700px){.tm-drex{grid-template-columns:repeat(2,1fr)}}
.tm-small{font-size:.82rem!important;min-width:6ch}
.tm-src{display:flex;flex-direction:column;gap:10px}
.tm-srow{display:grid;grid-template-columns:minmax(120px,190px) 1fr auto;gap:12px;align-items:center;font-size:.94rem}
.tm-srow i{display:block;height:10px;background:var(--soft);border-radius:999px;overflow:hidden}
.tm-srow em{display:block;height:100%;background:var(--green);border-radius:999px}
.tm-srow b{font-variant-numeric:tabular-nums;min-width:9ch;text-align:right}
.tm-months{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;align-items:end}
.tm-mo{display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center}
.tm-bar-v{height:110px;width:100%;max-width:56px;background:var(--soft);border-radius:8px;display:flex;align-items:flex-end;overflow:hidden}
.tm-bar-v i{display:block;width:100%;background:var(--green);border-radius:8px 8px 0 0}
.tm-mo b{font:700 .95rem var(--f-display);margin-top:6px}
.tm-mo span{font-size:.85rem;color:#3D444D}
.tm-mo small{font-size:.78rem;color:var(--muted)}
.tm-install{display:flex;align-items:center;gap:14px;background:var(--ink);color:#fff;border-radius:16px;padding:14px 16px;margin:0 auto 18px;max-width:760px;position:relative}
.tm-install b{display:block;font:700 1.05rem var(--f-display)}
.tm-install span{font-size:.92rem;color:#C9CED4}
.tm-install>div:nth-child(2){flex:1;min-width:0}
.tm-install-ico{width:46px;height:46px;border-radius:12px;background:var(--green);display:grid;place-items:center;flex-shrink:0;padding:6px}
.tm-install-ico svg{height:34px;width:auto}
.tm-install-x{background:none;border:0;color:#C9CED4;font-size:1.5rem;cursor:pointer;line-height:1;padding:0 4px}
@media (max-width:560px){.tm-install{flex-wrap:wrap}.tm-install .btn{width:100%}.tm-months{gap:4px}}
/* mode application (autosodaf.com/equipe/) */
#sodaf-root.app-mode nav.main,#sodaf-root.app-mode .burger,#sodaf-root.app-mode header.top>.wrap>.btn,#sodaf-root.app-mode footer.site,#sodaf-root.app-mode .wa-float,#sodaf-root.app-mode section[data-page="equipe"] .page-head{display:none!important}
#sodaf-root.app-mode section[data-page="equipe"]>.wrap{padding-top:22px}
#sodaf-root.app-mode .logo-sub{color:var(--green)}
/* Espace équipe : fond de travail gris clair, cartes blanches, bandeau d'accueil foncé */
html:has(#sodaf-root.app-mode),body:has(#sodaf-root.app-mode){background:#E9ECEF}
#sodaf-root.app-mode{background:#E9ECEF;min-height:100vh}
#sodaf-root.app-mode #app,#sodaf-root.app-mode main{background:transparent}
#sodaf-root.app-mode .card,#sodaf-root.app-mode .pc-list,#sodaf-root.app-mode .pc-block,#sodaf-root.app-mode .pc-none,#sodaf-root.app-mode .pc-sbox{background:#fff;border-color:#DDE1E5;box-shadow:0 1px 2px rgba(20,23,28,.05)}
#sodaf-root.app-mode .card.soft{background:#fff;border:1px solid #DDE1E5}
#sodaf-root.app-mode .pc-sbox{border-color:var(--ink)}
#sodaf-root.app-mode .pc-none{border-style:solid}
#sodaf-root.app-mode .pc-info{background:#fff;border:1px solid #DDE1E5}
#sodaf-root.app-mode .tm-tabs button{box-shadow:0 1px 2px rgba(20,23,28,.05);border-color:#DDE1E5}
#sodaf-root.app-mode .tm-stats div{background:#fff;border:1px solid #DDE1E5}
#sodaf-root.app-mode .tm-stats div.hl{background:var(--ink);border-color:var(--ink)}
#sodaf-root.app-mode .tm-subnav{border-bottom-color:#D3D8DD}
#sodaf-root.app-mode .tm-top{position:relative;overflow:hidden;background:var(--ink);color:#fff;border-radius:18px;padding:24px 28px 30px;margin-bottom:18px}
#sodaf-root.app-mode .tm-top::after{content:"";position:absolute;left:0;right:0;bottom:0;height:6px;background:repeating-linear-gradient(90deg,var(--yellow) 0 28px,transparent 28px 44px)}
#sodaf-root.app-mode .tm-top h2{color:#fff}
#sodaf-root.app-mode .tm-top .eyebrow{color:var(--yellow)}
#sodaf-root.app-mode .tm-top .tm-today{color:#C9CED4}
#sodaf-root.app-mode .tm-top .linkbtn{color:#E6E8EB}
#sodaf-root.app-mode .tm-top .linkbtn:hover{color:#fff}
#sodaf-root.app-mode .tm-role{background:#fff;border-radius:0 10px 10px 0;padding:10px 14px!important}
@media (max-width:640px){#sodaf-root.app-mode .tm-top{padding:18px 18px 24px;border-radius:14px}}
.pc{display:grid;grid-template-columns:minmax(280px,360px) minmax(0,1fr);gap:18px;align-items:start}
.pc-list{border:1.5px solid var(--line);border-radius:14px;background:#fff;overflow:hidden;position:sticky;top:76px}
.pc-stages{display:flex;flex-wrap:wrap;gap:6px;padding:10px;background:var(--soft);border-bottom:1.5px solid var(--line)}
.pc-stages button{flex:1 1 40%;font:600 .9rem var(--f-body);padding:.55em .6em;border-radius:10px;border:1.5px solid var(--line);background:#fff;color:#3D444D;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:6px}
.pc-stages button em{font-style:normal;font-size:.78rem;background:var(--soft);border-radius:999px;padding:.1em .55em;color:var(--ink)}
.pc-stages button[aria-selected="true"]{border-color:var(--ink);background:var(--ink);color:#fff}
.pc-stages button[aria-selected="true"] em{background:var(--yellow);color:var(--ink)}
.pc-stages button[data-st="accueil"] em:not(:empty){}
.pc-tools{display:flex;gap:8px;padding:10px;border-bottom:1.5px solid var(--line)}
.pc-edit{text-align:right;margin-top:6px}
.ex-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:0 0 14px}
.ex-steps span{display:flex;align-items:center;gap:8px;font:600 .84rem var(--f-body);color:var(--muted);background:#fff;border:1.5px solid var(--line);border-radius:10px;padding:8px 10px;line-height:1.2}
.ex-steps i{font-style:normal;display:grid;place-items:center;flex:0 0 24px;height:24px;border-radius:50%;background:var(--soft);color:var(--muted);font:700 .8rem var(--f-display)}
.ex-steps .on{border-color:var(--ink);color:var(--ink)}.ex-steps .on i{background:var(--ink);color:#fff}
.ex-steps .done{color:var(--green);border-color:var(--green-soft);background:var(--green-soft)}.ex-steps .done i{background:var(--green);color:#fff}
.ex-docs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:10px}
.ex-doc{display:flex;flex-direction:column;gap:2px;border:1.5px dashed #C9CED4;border-radius:12px;padding:10px 12px}
.ex-doc span{font-size:.86rem;color:var(--red)}
.ex-doc.ok{border:1.5px solid var(--green);background:var(--green-soft)}.ex-doc.ok span{color:#064D36}
.ex-doc .linkbtn{align-self:flex-start;font-size:.86rem}
label.ex-doc{position:relative;cursor:pointer;padding-left:44px}
label.ex-doc input{position:absolute;left:14px;top:12px;width:20px;height:20px;accent-color:var(--green)}
.ex-lot{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;background:var(--ink);color:#fff;padding:12px 14px}
.ex-lot b{display:block;font:700 1rem var(--f-display)}.ex-lot span{font-size:.84rem;color:#C9CED4}
.ex-lot-acts{display:flex;gap:6px;flex-wrap:wrap}
.ex-lot-why{flex-basis:100%;margin:2px 0 0!important;font-size:.84rem;color:#FFD66B}
#sodaf-root .ex-lot .btn[disabled]{opacity:.45;cursor:not-allowed}
#sodaf-root .ex-lot .btn-line{background:#fff;color:var(--ink)}#sodaf-root .ex-lot .btn-green{background:var(--yellow);color:var(--ink)}
.ex-check{margin:0 0 10px;padding-left:1.2em;display:flex;flex-direction:column;gap:4px;font-weight:600}
.ex-conv{display:grid;grid-template-columns:1fr 1.4fr;gap:10px}
#sodaf-root .pc-block .tm-formact input[type=date]{flex:0 0 auto;width:auto;min-width:0}
.ex-conv input,.pc-block input[type=date]{font:.95rem var(--f-body);padding:.5em .7em;border:1.5px solid var(--line);border-radius:10px}
.ex-big .ex-when{font:700 1.3rem var(--f-display);margin:0 0 12px!important;text-transform:capitalize}
.ex-big .ex-when span{font:500 1rem var(--f-body);color:#3D444D;text-transform:none}
.pc-gh.g-xpret{background:#FFF1C2;color:#6B4E00;border-left:5px solid #E0A400;font-size:.8rem}
.pc-gh.g-xcomplet{background:#FDE3D6;color:#7A2E0E;border-left:5px solid #D9622B;font-size:.8rem}
.pc-gh.g-xdepose{background:#DCE8F8;color:#163E7A;border-left:5px solid var(--blue);font-size:.8rem}
.pc-gh.g-xko{background:#FDE0DD;color:#7A1A12;border-left:5px solid var(--red);font-size:.8rem}
.t-xko{background:#FDE0DD;color:#7A1A12}
.pc-gh.g-xconvoque,.pc-gh.g-xok{background:var(--green-soft);color:#064D36;border-left:5px solid var(--green);font-size:.8rem}
@media (max-width:640px){.ex-steps{grid-template-columns:1fr}.ex-docs,.ex-conv{grid-template-columns:1fr}}
.pc-search{display:flex;gap:10px;align-items:center;margin:0 0 14px}
#sodaf-root #sd-elAddBtn{white-space:nowrap;flex-shrink:0}
#sodaf-root #sd-elAddBtn[hidden]{display:none}
.pc-sbox{flex:1;display:flex;align-items:center;gap:10px;border:2px solid var(--ink);border-radius:12px;padding:0 14px;background:#fff;color:#3D444D}
.pc-sbox:focus-within{border-color:var(--green);box-shadow:0 0 0 3px var(--green-soft)}
.pc-sbox input{flex:1;min-width:0;border:0;outline:0;font:1rem var(--f-body);padding:.75em 0;background:transparent}
.pc-else{display:block;margin-top:8px}.pc-else .linkbtn{margin:0 6px}
.pc-hint{padding:10px 14px;font-size:.85rem;color:var(--muted);margin:0!important;border-bottom:1px solid var(--line)}
.pc-tools input{flex:1;min-width:0;font:.95rem var(--f-body);padding:.55em .7em;border:1.5px solid var(--line);border-radius:10px}
.pc-list .tm-form{margin:10px;padding:14px}
#sodaf-root #sd-elAdd{background:var(--ink);border-color:var(--ink);color:#fff;box-shadow:0 8px 24px rgba(20,23,28,.18)}
#sodaf-root #sd-elAdd .eyebrow{color:var(--yellow)}
#sodaf-root #sd-elAdd label{color:#fff}
#sodaf-root #sd-elAdd input,#sodaf-root #sd-elAdd select{background:#fff;color:var(--ink);border-color:#fff}
#sodaf-root #sd-elAdd .tel{border-color:#fff}
#sodaf-root #sd-elAdd .linkbtn{color:#C9CED4}
#sodaf-root #sd-elAdd .tm-err{color:#FF9B92}
#sodaf-root #sd-elAdd .btn-green{background:var(--yellow);color:var(--ink)}
.pc-items{max-height:68vh;overflow:auto}
.pc-gh{display:flex;justify-content:space-between;font:600 .74rem var(--f-body);letter-spacing:.08em;text-transform:uppercase;color:#3D444D;background:var(--soft);padding:8px 14px;margin:0!important;border-bottom:1px solid var(--line)}
.pc-gh span{background:#fff;border-radius:999px;padding:0 .5em}
.pc-items>.pc-gh:not(:first-child){margin-top:14px!important;border-top:2px solid var(--ink)}
.pc-item.i-done{opacity:.55}
.pc-item.i-done.on{opacity:1}
.pc-item{all:unset;box-sizing:border-box;display:flex;flex-direction:column;gap:1px;width:100%;padding:11px 14px;border-bottom:1px solid var(--line);cursor:pointer;border-left:4px solid transparent}
.pc-item:hover{background:#FAFBFB}
.pc-fold{all:unset;box-sizing:border-box;width:100%;cursor:pointer;display:flex!important;align-items:center;gap:8px;padding:12px 14px;font:700 .82rem var(--f-body);letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid var(--line)}
.pc-fold[aria-expanded="false"]::after{content:"· ouvrir";font:500 .72rem var(--f-body);letter-spacing:0;text-transform:none;opacity:.75;margin-left:4px}
.pc-fold[aria-expanded="false"] span{order:3}
.pc-fold i{font-style:normal;display:inline-block;transition:transform .15s;font-size:.8rem}
.pc-fold[aria-expanded="true"] i{transform:rotate(90deg)}
.pc-fold span{margin-left:auto;background:#fff;border-radius:999px;padding:0 .55em}
.pc-fold:focus-visible{outline:3px solid var(--yellow);outline-offset:-3px}
.pc-gh.g-first{background:var(--green-soft);color:#064D36;border-left:5px solid var(--green);font-size:.8rem}
.pc-gh.g-matin{background:#FFF1C2;color:#6B4E00;border-left:5px solid #E0A400;font-size:.8rem}
.pc-gh.g-am{background:#DCE8F8;color:#163E7A;border-left:5px solid var(--blue);font-size:.8rem}
.pc-gh.g-matin span,.pc-gh.g-am span,.pc-gh.g-first span{font-weight:800;color:var(--ink)}
.pc-item.i-first{border-left-color:var(--green)}
.pc-gh.g-verif{background:#FDE0DD;color:#7A1A12;border-left:5px solid var(--red);font-size:.8rem}
.pc-gh.g-agence{background:var(--green-soft);color:#064D36;border-left:5px solid var(--green);font-size:.8rem}
.pc-item.i-verif{border-left-color:var(--red)}
.pc-item.i-agence{border-left-color:var(--green)}
.t-verif{background:#FDE0DD;color:#7A1A12}
.t-agence{background:var(--green-soft);color:#064D36}
.pc-web{border-color:var(--green);box-shadow:inset 0 0 0 1px var(--green)}
.pc-verif{margin:0 0 12px}
/* page publique : finaliser son inscription */
.insc{max-width:860px;margin:0 auto}
.insc-form{display:flex;flex-direction:column;gap:18px}
.ex-up{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.ex-tile{position:relative;display:flex;flex-direction:column;gap:3px;border:2px dashed #C9CED4;border-radius:14px;padding:14px;cursor:pointer;background:#fff;min-height:110px}
.ex-tile input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%}
.ex-tile b{font:700 1.05rem var(--f-display)}
.ex-tile small{color:var(--muted);font-size:.86rem}
.ex-st{margin-top:auto;font:600 .9rem var(--f-body);color:var(--blue)}
.ex-tile.ok{border:2px solid var(--green);background:var(--green-soft)}.ex-tile.ok .ex-st{color:var(--green)}
.ex-tile.busy{opacity:.7}.ex-tile.err{border-color:var(--red)}.ex-tile.err .ex-st{color:var(--red)}
.exm{max-width:860px;margin:0 auto}.exm .insc-find{margin-top:24px}
.ex-list{display:flex;flex-direction:column;gap:8px}
.ex-item{display:flex;gap:12px;align-items:flex-start;border:1.5px solid var(--line);border-radius:12px;padding:12px 14px;background:#fff}
.ex-item i{font-style:normal;flex:0 0 24px;height:24px;border-radius:6px;border:2px solid #C9CED4;display:grid;place-items:center;color:#fff;font-weight:800;font-size:.85rem;margin-top:2px}
.ex-item b{display:block;font:700 1.02rem var(--f-display)}.ex-item small{color:var(--muted);font-size:.88rem}
.ex-item.ok{border-color:var(--green);background:var(--green-soft)}.ex-item.ok i{background:var(--green);border-color:var(--green)}
.ex-paid{background:var(--green-soft);color:#064D36;border-radius:12px;padding:12px 14px;font-weight:600}
.ex-paid.wait{background:#FFF5D6;color:#5A4300}
@media (max-width:560px){.ex-up{grid-template-columns:1fr}}
.insc-hello h2{font-size:clamp(1.6rem,4vw,2.2rem);margin-top:6px}
.insc-hello p:not(.eyebrow){color:var(--muted);margin-top:6px}
.insc-step{border:1.5px solid var(--line);border-radius:16px;padding:18px;margin:0;min-width:0;background:#fff}
.insc-step legend{display:flex;align-items:center;gap:10px;font:700 1.15rem var(--f-display);padding:0 6px}
.insc-step legend i{font-style:normal;display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--ink);color:#fff;font-size:.95rem}
.insc-cards{display:flex;flex-direction:column;gap:8px}
.insc-two{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.rcm.off{opacity:.55;cursor:not-allowed}
.insc-sum{margin-top:12px!important;background:var(--soft);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:2px}
.insc-sum b{font:800 1.25rem var(--f-display);color:var(--green)}
.insc-sum span{font-size:.9rem;color:#3D444D}
.insc-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 14px}
.insc-mixx{margin-top:14px;background:#FFF5D6;border:1.5px solid var(--yellow);border-radius:12px;padding:14px 16px}
.insc-mixx ol{margin:0 0 10px;padding-left:1.2em}
.insc-mixx li{margin-bottom:4px}
.insc-note{font-size:.95rem;color:#3D444D;background:var(--soft);border-radius:12px;padding:12px 14px}
.insc-err{color:var(--red);font-weight:600}
.insc-load{color:var(--muted);padding:30px 0;text-align:center}
.insc-hint{font-size:.9rem;color:var(--muted);margin:-4px 0 10px!important}
.insc-go{align-self:flex-start;font-size:1.05rem;padding:.85em 1.6em}
.insc-msg,.insc-ok{display:flex;flex-direction:column;gap:10px;align-items:flex-start;margin-bottom:18px}
.insc-ok{border-top:5px solid var(--green)}
.insc-ok h3,.insc-msg h3{font-size:1.5rem}
.insc-find{display:grid;grid-template-columns:1.1fr 1fr;gap:18px;align-items:start}
.insc-map{border-radius:16px;overflow:hidden;border:1.5px solid var(--line);aspect-ratio:4/3;max-width:100%;background:var(--soft)}
.insc-map iframe{width:100%;height:100%;border:0;display:block}
.insc-addr{display:flex;flex-direction:column;gap:10px;align-items:flex-start}
.insc-addr h3{font-size:1.4rem}
.insc-big{font:700 1.15rem var(--f-display)}
.insc-list{margin:0;padding-left:1.1em;display:flex;flex-direction:column;gap:6px;font-size:.96rem}
@media (max-width:720px){.insc-two,.insc-grid,.insc-find{grid-template-columns:1fr}.insc-go{align-self:stretch}}
.pc-gh.g-late{background:#FDE3D6;color:#7A2E0E;border-left:5px solid #D9622B;font-size:.8rem}
.pc-gh.g-wait{background:var(--soft);color:#3D444D;border-left:5px solid #9AA3AB;font-size:.8rem}
.pc-item.i-late{border-left-color:#D9622B}
.pc-item.i-wait{border-left-color:#9AA3AB}
.t-late{background:#FDE3D6;color:#7A2E0E}
.t-wait{background:var(--soft);color:#3D444D}
.pc-dos{border-color:var(--green);box-shadow:inset 0 0 0 1px var(--green)}
.pc-more{margin-top:12px}
.pc-more summary{cursor:pointer;font-weight:600;color:var(--green);margin-bottom:8px}
.pc-item.i-matin{border-left-color:#E0A400}
.pc-item.i-am{border-left-color:var(--blue)}
.pc-item.on.i-matin{background:#FFF7DC}
.pc-item.on.i-am{background:#EAF1FB}
.pc-tag{font-style:normal;font:700 .68rem var(--f-body);letter-spacing:.04em;text-transform:uppercase;padding:.15em .5em;border-radius:999px;margin-left:6px;vertical-align:2px}
.t-first{background:var(--green-soft);color:#064D36}
.t-xpret{background:#FFE9A8;color:#6B4E00}.t-xcomplet{background:#FDE3D6;color:#7A2E0E}.t-xdepose{background:#DCE8F8;color:#163E7A}.t-xconvoque,.t-xok{background:var(--green-soft);color:#064D36}
.t-matin{background:#FFE9A8;color:#6B4E00}
.t-am{background:#DCE8F8;color:#163E7A}
@media (prefers-reduced-motion:reduce){.pc-fold i{transition:none}}
.pc-item.on{background:var(--green-soft);border-left-color:var(--green)}
.pc-item b{font-weight:700;color:var(--ink)}
.pc-item span{font-size:.88rem;color:#3D444D}
.pc-item small{font-size:.8rem;color:var(--muted)}
.pc-item:focus-visible{outline:3px solid var(--yellow);outline-offset:-3px}
.pc-detail{min-width:0}
.pc-none{border:1.5px dashed var(--line);border-radius:14px;padding:40px 20px;text-align:center;display:flex;flex-direction:column;gap:4px;color:var(--muted)}
.pc-none b{color:var(--ink);font:700 1.1rem var(--f-display)}
.pc-back{display:none;margin-bottom:10px}
.pc-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;padding-bottom:14px;border-bottom:1.5px solid var(--line);margin-bottom:14px}
.pc-head h3{font:700 1.7rem var(--f-display);margin-top:2px}
.pc-head h3 span{font-weight:500;color:var(--muted)}
.btn-blue{background:var(--blue);color:#fff}
.pc-info{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px 18px;background:var(--soft);border-radius:12px;padding:14px 16px}
.pc-info div{display:flex;flex-direction:column;min-width:0}
.pc-info .wide{grid-column:1/-1}
.pc-info span{font-size:.76rem;color:#3D444D;font-weight:600}
.pc-info b{font-weight:700;color:var(--ink);overflow-wrap:anywhere}
.pc-info a{color:var(--ink)}
.pc-info select{font:inherit;padding:.3em .5em;border:1.5px solid var(--line);border-radius:8px}
.pc-proto{font:.88rem/1.5 var(--f-body);background:#fff;border:1px solid #DDE1E5;border-left:4px solid var(--blue);border-radius:8px;padding:8px 12px;margin:14px 0 0!important;color:#3D444D}
.pc-block{border:1.5px solid var(--line);border-radius:12px;padding:14px 16px;margin-top:14px;background:#fff}
.pc-bh{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}
.pc-bh b{font:700 1.08rem var(--f-display)}
.pc-ok{font-size:.85rem;font-weight:700;color:var(--green)}
.pc-block textarea{width:100%;font:.95rem/1.5 var(--f-body);padding:.7em .8em;border:1.5px solid var(--line);border-radius:10px;resize:vertical}
.pc-block .tm-formact input{flex:1;min-width:180px;font:.95rem var(--f-body);padding:.55em .7em;border:1.5px solid var(--line);border-radius:10px}
.pc-lab{font-size:.8rem;font-weight:700;color:#3D444D;margin-bottom:6px!important}
.pc-steps{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
#sodaf-root [data-rappel],#sodaf-root [data-ko]{display:inline-flex;align-items:center;justify-content:center;gap:8px;font:700 .95rem var(--f-body);padding:.7em 1.1em;border-radius:12px;border:2px solid;cursor:pointer;line-height:1.25}
#sodaf-root [data-rappel=""]{border-color:var(--green);color:var(--green);background:var(--green-soft);min-width:230px}
#sodaf-root [data-ko="matin"]{border-color:#D99A00;color:#14171C;background:#E8A800;box-shadow:0 2px 0 #B47F00}
#sodaf-root [data-ko="apres-midi"]{border-color:#1D4F91;color:#fff;background:#1D4F91;box-shadow:0 2px 0 #133A6C}
#sodaf-root [data-ko="matin"]:hover{background:#D99A00}#sodaf-root [data-ko="apres-midi"]:hover{background:#174380}
#sodaf-root [data-ko]{padding:.85em 1.1em;font-size:1rem}
#sodaf-root [data-rappel=""][aria-pressed="true"]{background:var(--green);color:#fff}
#sodaf-root [data-ko][aria-pressed="true"]{outline:3px solid var(--ink);outline-offset:2px}
.pc-callnow{padding-bottom:14px;margin-bottom:14px;border-bottom:2px solid var(--ink)}
.tm-newins{margin:6px 6px 10px auto;align-self:center}
#sodaf-root .tm-newins{position:relative;overflow:hidden;display:inline-flex;align-items:center;gap:10px;padding:7px 18px 7px 7px;border-radius:999px;border:2px solid var(--yellow);background:linear-gradient(135deg,#0E2A4E 0%,#1A4A85 100%);color:#fff;cursor:pointer;font:inherit;box-shadow:0 0 0 4px rgba(242,177,0,.18),0 8px 20px rgba(14,42,78,.35),inset 0 1px 0 rgba(255,255,255,.18);transition:transform .15s ease,box-shadow .15s ease}
#sodaf-root .tm-newins:hover{transform:translateY(-1px);box-shadow:0 0 0 6px rgba(242,177,0,.25),0 12px 26px rgba(14,42,78,.45),inset 0 1px 0 rgba(255,255,255,.18)}
#sodaf-root .tm-newins:active{transform:translateY(1px);box-shadow:0 0 0 3px rgba(242,177,0,.25),inset 0 3px 8px rgba(0,0,0,.4)}
#sodaf-root .tm-newins:focus-visible{outline:3px solid var(--yellow);outline-offset:3px}
#sodaf-root .tm-newins:after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.28),transparent);transform:skewX(-20deg);animation:niShine 4.5s ease-in-out infinite}
@keyframes niShine{0%,70%{left:-60%}100%{left:130%}}
@media (prefers-reduced-motion:reduce){#sodaf-root .tm-newins:after{animation:none;display:none}}
.ni-ico{width:36px;height:36px;border-radius:50%;background:var(--yellow);color:#0E2A4E;display:grid;place-items:center;flex-shrink:0;box-shadow:inset 0 -2px 0 rgba(0,0,0,.15)}
.ni-txt{display:flex;flex-direction:column;line-height:1.1;text-align:left}
.ni-txt b{font-size:.95rem;font-weight:800;letter-spacing:.01em}
.ni-txt small{font-size:.7rem;color:#FFD66B;font-weight:600;text-transform:uppercase;letter-spacing:.08em}
#sodaf-root .ins-box{background:linear-gradient(160deg,#0E2A4E 0%,#133A6C 100%);color:#fff}
#sodaf-root .ins-box .eyebrow{color:var(--yellow)}
#sodaf-root .ins-hd h3{color:#fff}
#sodaf-root .ins-x{background:rgba(255,255,255,.12);color:#fff}
#sodaf-root .ins-step{border-color:rgba(255,255,255,.18)}
#sodaf-root .ins-step legend{color:#fff}#sodaf-root .ins-step legend i{background:var(--yellow);color:#0E2A4E}
#sodaf-root .ins-box label{color:#D6E2F2}
#sodaf-root .ins-box input,#sodaf-root .ins-box select{background:#fff;color:var(--ink);border-color:#fff}
#sodaf-root .ins-box .tel{border-color:#fff;background:#fff}
#sodaf-root .ins-ft{border-top-color:rgba(255,255,255,.18)}
#sodaf-root .ins-sum{color:#D6E2F2}
#sodaf-root .ins-box .tm-err{color:#FFB4AB}
#sodaf-root .ins-box .btn-green{background:var(--yellow);color:#0E2A4E;border-color:var(--yellow)}
#sodaf-root .ins-ok{background:rgba(255,255,255,.1)}#sodaf-root .ins-ok small{color:#D6E2F2}
#sodaf-root .ins-check{background:var(--yellow);color:#0E2A4E}
#sodaf-root .ins-acts .linkbtn{color:#D6E2F2}
.ins-ok{display:flex;gap:12px;align-items:center;background:var(--green-soft);border-radius:14px;padding:14px;margin:8px 0 12px}
.ins-ok b{display:block;font-size:1.05rem}.ins-ok small{color:var(--muted)}
.ins-check{width:42px;height:42px;border-radius:50%;background:var(--green);color:#fff;display:grid;place-items:center;font-size:1.3rem;font-weight:700;flex-shrink:0}
.ins-acts{display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin-top:12px}
.ins-ov{position:fixed;inset:0;z-index:9000;background:rgba(15,22,20,.55);display:flex;align-items:flex-start;justify-content:center;padding:4vh 12px;overflow:auto}
.ins-ov[hidden],.ins-ft[hidden],.ins-step[hidden],.ins-done[hidden]{display:none}
.ins-box{background:#fff;border-radius:20px;width:100%;max-width:680px;padding:20px 22px;box-shadow:0 24px 60px rgba(0,0,0,.3)}
.ins-hd{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}.ins-hd h3{margin:2px 0 0;font:700 1.5rem var(--f-display)}
.ins-x{border:0;background:#F1F3F2;width:38px;height:38px;border-radius:50%;font-size:1.4rem;cursor:pointer;line-height:1}
.ins-step{border:1.5px solid var(--line);border-radius:14px;padding:12px 14px 6px;margin:12px 0}
.ins-step legend{font-weight:700;padding:0 6px;display:flex;align-items:center;gap:8px}.ins-step legend i{font-style:normal;width:24px;height:24px;border-radius:50%;background:var(--ink);color:#fff;display:grid;place-items:center;font-size:.8rem}
.ins-forms,.ins-pay{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:6px 0 10px}
.ins-f,.ins-p{display:flex;align-items:center;gap:10px;border:1.5px solid var(--line);border-radius:12px;padding:10px 12px;cursor:pointer}
.ins-f.on,.ins-p.on{border-color:var(--green);background:var(--green-soft)}
.ins-f span,.ins-p span{flex:1;display:flex;flex-direction:column;line-height:1.25}.ins-f small,.ins-p small{color:var(--muted);font-size:.78rem}
.ins-f em,.ins-p em{font-style:normal;font-weight:700;color:var(--green);white-space:nowrap}
.ins-mode{display:flex;gap:16px;margin:0 0 10px;font-weight:600}.ins-mode[hidden]{display:none}
.ins-ft{display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:flex-end;border-top:1.5px solid var(--line);padding-top:14px}
.ins-sum{margin-right:auto;font-size:.95rem}.ins-sum b{color:var(--green);font-size:1.1rem}
@media (max-width:600px){.ins-forms,.ins-pay{grid-template-columns:1fr}.ins-box{padding:16px}#sodaf-root .tm-newins{width:100%;margin:6px 0 10px;justify-content:center}}
.wl-card{background:linear-gradient(135deg,#0F3D2E 0%,#14523C 60%,#1B6B4D 100%);color:#fff;border-radius:18px;padding:22px 22px 16px;box-shadow:0 14px 34px rgba(15,61,46,.22);position:relative;overflow:hidden}
.wl-card:after{content:"";position:absolute;right:-60px;top:-60px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(255,214,107,.22),transparent 70%)}
.wl-top{display:flex;gap:14px;align-items:flex-start;position:relative}
.wl-ico{flex-shrink:0;width:56px;height:56px;border-radius:16px;background:rgba(255,255,255,.12);display:grid;place-items:center;color:#FFD66B}
.wl-k{margin:0!important;font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#FFD66B}
.wl-top h4{margin:2px 0 4px;font:700 1.35rem var(--f-display);color:#fff}
.wl-sub{margin:0!important;font-size:.9rem;color:#CFE3D9;max-width:52ch}
.wl-chips{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 18px;position:relative}
.wl-chips span{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:.35em .85em;font-size:.82rem;color:#CFE3D9}
.wl-chips b{color:#fff;font-weight:700;margin-left:4px}
.wl-act{display:flex;flex-wrap:wrap;gap:14px;align-items:center;position:relative}
#sodaf-root .wl-btn{display:inline-flex;align-items:center;gap:10px;font-size:1.02rem;padding:.85em 1.4em;border-radius:14px;box-shadow:0 6px 18px rgba(37,211,102,.35)}
#sodaf-root .wl-act .linkbtn{color:#CFE3D9}
.wl-act .tm-err{color:#FFB4AB}
.wl-more{margin-top:14px;position:relative}.wl-more summary{cursor:pointer;font-size:.85rem;color:#CFE3D9;font-weight:600}
.wl-more textarea{margin-top:8px;width:100%;border-radius:12px;border:0;padding:12px;font:.92rem var(--f-body);color:var(--ink)}
.se-bar{height:8px;background:#E6EAE8;border-radius:99px;overflow:hidden;margin:2px 0 8px}.se-bar i{display:block;height:100%;background:var(--green);border-radius:99px}
.se-txt{margin:0 0 6px!important;font-size:.92rem;color:var(--muted)}.se-txt b{color:var(--ink)}
.se-al{border-radius:10px;padding:10px 12px;font-size:.92rem;margin-top:6px}.se-al .tm-formact{margin-top:8px}
.se-ok{background:#E8F5EE;border:1px solid #9BD3B4}.se-warn{background:#FFF4E8;border:1px solid #F5C08A}.se-info{background:#EEF3FB;border:1px solid #AFC4E6}
.se-num{font-style:normal;font-size:.75rem;font-weight:700;color:var(--green);background:#E8F5EE;border-radius:99px;padding:.1em .6em;margin-left:4px}.se-num.hot{color:#B45309;background:#FFF4E8}
.se-mev{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:6px}.se-mev span{font-size:.85rem;font-weight:700;color:#B45309;flex-basis:100%}
#sodaf-root a[data-ko]{text-decoration:none}
#sodaf-root [data-ko] small{display:block;font-size:.72rem;font-weight:600;opacity:.8;margin-top:1px}
#sodaf-root [data-ko] span{display:flex;flex-direction:column;align-items:flex-start;line-height:1.15}
#sodaf-root .pc-final{background:var(--red);color:#fff;border-color:var(--red);width:100%;justify-content:center;text-decoration:none;padding:.85em 1em}
.sol-rap{display:block;margin-top:6px;font-size:.88rem;font-weight:600;color:#7A2E27}
.gc-bar{background:#F3F6F4;border-bottom:1px solid var(--line);padding:10px 12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between}
.gc-chips{display:flex;flex-wrap:wrap;gap:6px}
.gc-chip{display:flex;flex-direction:column;background:#fff;border:1.5px solid var(--green);border-radius:10px;padding:4px 10px;font-size:.84rem;line-height:1.25}
.gc-chip b{font-weight:700}.gc-chip small{color:var(--muted);font-size:.75rem}
.gc-chip.full{border-color:#D7263D;background:#FDECEE}.gc-chip.wait{border-color:#F08A24;background:#FFF4E8}
.gc-tip{flex-basis:100%;margin:0!important;font-size:.84rem;color:#B45309;font-weight:600}
.gc-man{flex-basis:100%;display:grid;gap:6px;margin-top:4px}
.gc-row{display:flex;justify-content:space-between;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:8px 10px}
.gc-row small{display:block;color:var(--muted);font-size:.8rem}
.gc-pick{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.gc-pick select{flex:1;min-width:220px;font:600 .95rem var(--f-body);padding:.5em .6em;border:1.5px solid var(--line);border-radius:10px}
.pc-waittag{font-size:.78rem;font-weight:700;color:#B45309;background:#FFF4E8;border-radius:999px;padding:.15em .7em}
.gc-ses{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.cd-done{font-size:.85rem;font-weight:700;color:var(--green);white-space:nowrap}
.pc-status{display:flex;align-items:center;gap:10px;flex-wrap:wrap;color:var(--green)}
.pc-status b{font-size:1.15rem;color:var(--ink)}
.pc-status span{font-size:.85rem;font-weight:600;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:.15em .7em}
.pc-range .pc-rgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
#sodaf-root .pc-range .pc-rgrid .btn{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;padding:.75em .9em;border-radius:12px;white-space:normal;line-height:1.2}
#sodaf-root .pc-range .pc-rgrid small{font-weight:500;font-size:.78rem;opacity:.8}
@media (max-width:600px){.pc-range .pc-rgrid{grid-template-columns:1fr}}
.pc-konote{width:100%;font:.95rem var(--f-body);padding:.55em .7em;border:1.5px solid var(--line);border-radius:10px;margin-bottom:8px}
.pc-ko+.pc-triesrow{margin-top:12px}
.pc-triesrow{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:10px}
.pc-triesrow .pc-lab{margin:0!important}
.pc-triesrow small{flex-basis:100%;font-size:.8rem;color:var(--muted)}
.pc-tries{display:flex;flex-wrap:wrap;gap:6px}
.pc-tries i{font-style:normal;font:600 .82rem var(--f-body);padding:.3em .65em;border-radius:999px;border:1.5px solid var(--line);color:var(--muted)}
.pc-tries i.on{background:var(--red-soft);border-color:var(--red);color:var(--red)}
.pc-alert{margin-top:12px;background:var(--red-soft);border:1.5px solid var(--red);border-radius:10px;padding:12px 14px;font-size:.94rem}
.pc-script{font-size:1rem;line-height:1.6}
.sc{list-style:none;counter-reset:sc;margin:0;padding:0;display:flex;flex-direction:column;gap:14px}
.sc li{counter-increment:sc;position:relative;padding-left:38px}
.sc li::before{content:counter(sc);position:absolute;left:0;top:0;width:26px;height:26px;border-radius:50%;background:var(--ink);color:#fff;display:grid;place-items:center;font:700 .85rem var(--f-display)}
.sc li>b{display:block;font:700 .82rem var(--f-body);letter-spacing:.06em;text-transform:uppercase;color:#3D444D;margin:3px 0 6px}
.sc-say{font-size:1.08rem;line-height:1.6;font-weight:600;color:var(--ink);background:var(--green-soft);border-left:4px solid var(--green);border-radius:0 10px 10px 0;padding:8px 12px;margin:0 0 6px!important}
.sc-tip{font-size:.88rem;color:#3D444D;font-style:italic;margin:0 0 6px!important;padding-left:2px}
.pc-script p{margin:0 0 10px!important}
.pc-checks{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:6px}
.pc-checks label{display:flex;gap:8px;align-items:center;background:var(--soft);padding:.5em .7em;border-radius:10px;cursor:pointer;font-size:.94rem}
.pc-checks input{width:18px;height:18px;accent-color:var(--green)}
.pc-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:14px;padding-top:14px;border-top:1.5px solid var(--line)}
.pc-foot>span{font-weight:700}
.pc-red{background:var(--red);color:#fff}
#sodaf-root .sc,#sodaf-root .sc li{list-style:none}
.pc-dark{background:var(--ink);color:#fff}
.btn.armed{outline:3px solid var(--yellow);outline-offset:2px}
.pc-mini{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:8px}
.pc-mini div{background:var(--soft);border-radius:10px;padding:8px 12px;display:flex;flex-direction:column}
.pc-mini span{font-size:.78rem;color:#3D444D}
.pc-mini b{font:700 1.05rem var(--f-display)}
.pc-line{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;font-size:.92rem;padding:6px 0;border-top:1px solid var(--line)}
.pc-line em{font-style:normal;color:var(--muted);flex:1;min-width:0}
.pc-paylist{border-top:1px solid #DDE1E5;padding-top:10px}
#sodaf-root .pc-info .pc-paylist .pc-line{display:flex;flex-direction:row;align-items:baseline;gap:12px;flex-wrap:wrap;border-top:0;padding:4px 0;font-size:.95rem}
#sodaf-root .pc-info .pc-line span{font-size:.9rem;font-weight:500;color:#3D444D}
#sodaf-root .pc-info .pc-line em{font-style:normal;color:var(--muted);flex:1;min-width:0}
#sodaf-root .pc-info .pc-line a{color:var(--green)}
.pc-due{color:var(--red)}
.pc-feed{display:flex;flex-direction:column;gap:0}
.pc-feed div{display:grid;grid-template-columns:auto 1fr;gap:0 12px;padding:7px 0;border-top:1px solid var(--line);font-size:.92rem}
.pc-feed time{color:var(--muted);font-size:.82rem;grid-row:1/3;font-variant-numeric:tabular-nums}
.pc-feed span{color:#3D444D}
@media (max-width:899px){.pc{grid-template-columns:1fr}.pc-list{position:static}.pc-items{max-height:none}.pc.has-sel .pc-list{display:none}.pc:not(.has-sel) .pc-detail{display:none}.pc-back{display:inline-block}#sodaf-root .pc-steps [data-ko]{font-size:.86rem;padding:.65em .5em}.pc-head h3{font-size:1.4rem}}
.tm-row.st-libre{border-left-color:#C9CED4;background:#FAFBFB}
.tm-row.st-reserve{border-left-color:var(--blue)}
.tm-row.st-fait{border-left-color:var(--green);background:var(--green-soft)}
.tm-row.st-absent{border-left-color:var(--red);background:var(--red-soft)}
.tm-row.st-annule{border-left-color:#8A9099;opacity:.7}
@media (max-width:600px){.tm-row{padding:10px 12px}.tm-acts{width:100%}.tm-subnav button{padding:.6em .6em;font-size:.92rem}}
.devlist-h{font:700 1rem var(--f-display);margin:0 0 12px!important;color:var(--muted)}
.devform{max-width:520px;margin:0 auto}
.devform .row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media (max-width:520px){.devform .row2{grid-template-columns:1fr}}
.opt.pick{border-color:var(--ink);background:var(--soft);box-shadow:inset 0 0 0 1px var(--ink)}
.devres{text-align:center}
.devres .who{font:700 1.15rem var(--f-display);margin-top:6px}
.devsent{display:inline-flex;align-items:center;gap:8px;margin-top:14px;padding:.5em 1em;border-radius:999px;font-weight:600;font-size:.93rem;background:var(--soft)}
.devsent.ok{background:var(--green-soft);color:var(--green)}
.devsent.ko{background:var(--red-soft);color:var(--red)}
.corr{margin-top:22px;display:grid;gap:10px;text-align:left}
.corr div{padding:12px 14px;border-radius:10px;border-left:4px solid var(--green);background:var(--soft)}
.corr div.ko{border-left-color:var(--red)}
.corr p{margin:0!important}
.corr small{display:block;color:var(--muted);margin-top:4px;font-size:.88rem}
.cls-signq svg{width:min(34vh,300px);height:min(34vh,300px);display:block}

/* outils */
.calc{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:28px;align-items:center}
@media (max-width:820px){.calc{grid-template-columns:1fr}}
.speed{font:800 5rem/1 var(--f-display)}
.speed small{font-size:1.5rem;color:var(--muted)}
#sodaf-root input[type=range]{width:100%;accent-color:var(--green)}
.bars{display:grid;gap:14px}
.lbl{display:flex;justify-content:space-between;font-size:.92rem;margin-bottom:4px;gap:8px}
.lbl b{font-family:var(--f-mono);font-variant-numeric:tabular-nums}
.track{height:22px;background:var(--soft);border-radius:6px;overflow:hidden;display:flex}
.track i{display:block;height:100%;transition:width .25s}
.track .re{background:var(--yellow)}.track .fr{background:var(--green)}.track .frw{background:var(--blue)}
.legend{display:flex;gap:16px;flex-wrap:wrap;font-size:.84rem;color:var(--muted)}
.legend span::before{content:"";display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;background:var(--c)}
.check{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
@media (max-width:640px){.check{grid-template-columns:1fr}}
.check label,.path label{display:flex;gap:10px;align-items:flex-start;padding:11px 12px;border-radius:10px;border:1px solid var(--line);cursor:pointer;background:#fff}
.check input,.path input{width:19px;height:19px;accent-color:var(--green);flex-shrink:0;margin-top:3px}
.check label.ok,.path label.ok{background:var(--green-soft);border-color:transparent}
.path{display:grid;gap:8px;margin-top:12px}
.path label.ok span{text-decoration:line-through;color:var(--muted)}
.sos{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
@media (max-width:820px){.sos{grid-template-columns:repeat(2,minmax(0,1fr))}}
.sos>div{border:1px solid var(--line);border-top:5px solid var(--red);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:4px;background:#fff}
.sos b{font:800 2.6rem/1 var(--f-display);color:var(--red);user-select:all}
.sos span{font-size:.9rem;color:var(--muted)}
.sos button{margin-top:6px;align-self:flex-start;background:var(--soft);color:var(--ink);border:0;border-radius:6px;padding:.3em .7em;font:600 .82rem var(--f-body);cursor:pointer}

/* documents */
.doc{display:grid;grid-template-columns:56px minmax(0,1fr);gap:16px;align-items:start}
.doc-cover{grid-template-columns:120px minmax(0,1fr);gap:22px}
#sodaf-root .doc-cover .cover{width:120px;height:auto;border-radius:8px;box-shadow:0 14px 28px -16px rgba(0,0,0,.5)}
@media (max-width:520px){.doc-cover{grid-template-columns:84px minmax(0,1fr)}#sodaf-root .doc-cover .cover{width:84px}}
.faddr{margin:6px 0 4px!important;font-size:.9rem;line-height:1.45}
.file{width:56px;height:70px;border-radius:6px;border:1.5px solid var(--ink);display:grid;place-items:center;font:800 1.05rem var(--f-display);position:relative;background:#fff}
.file::after{content:"";position:absolute;top:-1.5px;right:-1.5px;width:14px;height:14px;background:linear-gradient(225deg,#fff 50%,var(--ink) 50%)}
.acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
#sodaf-root .toc-list{columns:2;column-gap:28px;padding-left:1.2em;margin:10px 0 0}
@media (max-width:600px){#sodaf-root .toc-list{columns:1}}

/* progression (anneau) */
.ring{width:150px;height:150px;position:relative;flex-shrink:0}
#sodaf-root .ring svg{display:block;width:100%;height:100%;transform:rotate(-90deg)}
.ring b{position:absolute;inset:0;display:grid;place-items:center;font:800 2.4rem var(--f-display)}
.dash-top{display:flex;gap:28px;align-items:center;flex-wrap:wrap;margin-top:12px}
.stat{font:800 3.2rem/1 var(--f-display)}

/* inscription */
.row2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
@media (max-width:640px){.row2{grid-template-columns:1fr}}
.field{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;min-width:0}
.field label{font-weight:600;font-size:.94rem}
.field input,.field select,.field textarea{font:1rem var(--f-body);padding:.7em .8em;border:1.5px solid var(--line);border-radius:10px;background:#fff;color:var(--ink);width:100%}
.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--ink);outline:none}
.field textarea{min-height:90px}
.okbox{border:1.5px solid var(--green);background:var(--green-soft);border-radius:14px;padding:22px;display:grid;gap:14px}
.okhead{display:flex;gap:14px;align-items:center}
.okcheck{width:46px;height:46px;border-radius:50%;background:var(--green);color:#fff;display:grid;place-items:center;flex-shrink:0;animation:okpop .35s ease-out}
.okcheck svg{width:24px;height:24px}
@keyframes okpop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
.okhead b{display:block;font:700 1.35rem/1.15 var(--f-display);letter-spacing:-.02em}
.okhead span{font-size:.86rem;color:var(--muted)}
.okrecap{display:grid;grid-template-columns:max-content 1fr;gap:6px 16px;margin:0;padding:14px 16px;background:#fff;border-radius:10px;font-size:.94rem}
.okrecap dt{color:var(--muted)}.okrecap dd{margin:0;font-weight:600}
.okwa{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px dashed rgba(11,110,79,.3)}
.okwa p{font-size:.94rem}
#sodaf-root .btn-wa{background:#1FA855;color:#fff}
.linkbtn{justify-self:start;background:none;border:0;padding:0;color:var(--muted);text-decoration:underline;font:500 .9rem var(--f-body);cursor:pointer}
.failbox{border:1.5px solid var(--red);background:var(--red-soft);border-radius:14px;padding:18px;margin-top:14px}
#sd-send[disabled]{opacity:.7;cursor:wait}
.tel{display:flex;align-items:stretch;border:1.5px solid var(--line);border-radius:10px;overflow:hidden;background:#fff}
.tel:focus-within{border-color:var(--ink)}
.tel span{display:flex;align-items:center;padding:0 .85em;background:var(--soft);font-weight:700;border-right:1px solid var(--line);color:var(--ink);user-select:none}
#sodaf-root .tel input{border:0;border-radius:0;min-width:0;flex:1;letter-spacing:.04em}
.out{margin-top:16px;padding:16px;border-radius:12px;background:var(--green-soft)}
.out pre{white-space:pre-wrap;font:500 .86rem var(--f-mono);margin:10px 0;background:#fff;padding:12px;border-radius:8px;border:1px solid var(--line)}
.insc{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:18px}
@media (max-width:860px){.insc{grid-template-columns:1fr}}
.bignum{font:800 2.6rem/1.1 var(--f-display);margin-top:8px!important;user-select:all}

/* footer */
.band-soft{background:var(--soft);padding-block:64px}
.band-dark{background:#15191E;color:#fff;margin-top:72px;padding-block:72px;position:relative;overflow:hidden}
.band-dark::before{content:"";position:absolute;left:0;right:0;top:0;height:5px;background:repeating-linear-gradient(90deg,var(--yellow) 0 46px,transparent 46px 80px);opacity:.85}
#sodaf-root .band-dark h2{color:#fff}
.band-dark .eyebrow{color:rgba(255,255,255,.62)}
.band-dark p{color:rgba(255,255,255,.74)}
.band-dark .qtext{color:#fff}
.band-dark .opt{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.16);color:#fff}
.band-dark .opt .k{background:rgba(255,255,255,.1);color:#fff}
.band-dark .opt:hover:not(:disabled){border-color:#fff}
.band-dark .opt.good{background:rgba(63,191,138,.18);border-color:#3FBF8A}
.band-dark .opt.bad{background:rgba(224,106,96,.18);border-color:#E06A60}
.band-dark .explain{background:rgba(255,255,255,.07);color:#fff}
#sodaf-root .band-dark .btn-line{background:transparent;color:#fff;border-color:rgba(255,255,255,.35)}
#sodaf-root .band-dark .btn-line:hover{border-color:#fff}
#sodaf-root .logo svg.lg-word{display:block;height:24px;width:auto}
.logo-sub{font:600 .6rem var(--f-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted);padding-left:12px;margin-left:2px;border-left:1px solid var(--line);line-height:1.3}
@media (max-width:480px){.logo-sub{display:none}}
#sodaf-root .flogo svg{display:block;height:54px;width:auto}
.mono-wm{position:absolute;right:6%;top:-24px;bottom:-24px;opacity:.07;pointer-events:none;z-index:0}
#sodaf-root .mono-wm svg{display:block;height:100%;width:auto}
@media (max-width:700px){.mono-wm{right:-10px;opacity:.05}}
.page-head{background-color:#15191E;color:#fff;border-bottom:0;padding-bottom:46px}
.page-head.pat-dots{background-image:radial-gradient(rgba(255,255,255,.06) 1px,transparent 1.2px)}
.page-head::after{content:"";position:absolute;left:0;right:0;bottom:0;height:6px;background:repeating-linear-gradient(90deg,var(--yellow) 0 34px,transparent 34px 58px)}
#sodaf-root .page-head h1{color:#fff}
.page-head .eyebrow{color:rgba(255,255,255,.62)}
#sodaf-root .page-head p.lead{color:rgba(255,255,255,.74)}
.page-head .zebra{background:repeating-linear-gradient(90deg,rgba(255,255,255,.05) 0 16px,transparent 16px 32px)}
#sodaf-root footer.site a.logo{display:flex}
footer.site{padding-block:48px 32px;font-size:.94rem;color:rgba(255,255,255,.62);background:#15191E}
#sodaf-root footer.site .logo{color:#fff}
footer.site .logo-mark{background:var(--yellow);color:var(--ink)}
footer.site .logo small{color:rgba(255,255,255,.5)}
.cols{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:28px}
@media (max-width:760px){.cols{grid-template-columns:1fr}}
#sodaf-root footer.site h4{font:600 .72rem var(--f-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--yellow);margin:0 0 10px}
#sodaf-root footer.site a{color:rgba(255,255,255,.72);text-decoration:none;display:block;padding:2px 0}
#sodaf-root footer.site a:hover{color:#fff}
.phone{font:800 1.8rem var(--f-display);color:#fff;user-select:all}
.legal{margin-top:30px;padding-top:18px;border-top:1px solid rgba(255,255,255,.12);display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:.84rem}
.toast{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:var(--ink);color:#fff;padding:.7em 1.2em;border-radius:999px;font-weight:600;font-size:.92rem;z-index:99}
#sodaf-root .wa-float{position:fixed;right:16px;bottom:16px;z-index:60;background:#1FA855;color:#fff;border-radius:999px;padding:.7em 1.05em;font-weight:700;text-decoration:none;box-shadow:0 10px 24px -10px rgba(0,0,0,.45);display:flex;gap:8px;align-items:center;font-size:.9rem}
#sodaf-root .wa-float svg{display:block;width:20px;height:20px}
`;

const SIGN_TRI = (inner) => `<svg viewBox="0 0 64 64"><polygon points="32,6 60,56 4,56" fill="#fff" stroke="#C8372D" stroke-width="6" stroke-linejoin="round"/>${inner}</svg>`;
const LINE = (inner) => `<svg width="110" height="14"><rect width="110" height="14" fill="#2A2F36"/>${inner}</svg>`;
const ZEBRA = '<span class="zebra" aria-hidden="true"></span>';
/* ---------- Situations : schémas d'intersection vus du dessus (dessins originaux SODAF) ---------- */
const SC = { road: "#4A5058", grass: "#E4EBDA", col: { A: "#2B63B5", B: "#C8372D", C: "#0B6E4F", D: "#7A4FA0" } };
const SC_ROT = { s: 0, w: 90, n: 180, e: 270 };
let SC_N = 0;
const scPt = (x, y, deg) => { const r = (deg * Math.PI) / 180, dx = x - 200, dy = y - 200; return [200 + dx * Math.cos(r) - dy * Math.sin(r), 200 + dx * Math.sin(r) + dy * Math.cos(r)]; };
const scBase = (kind) => {
  const dash = 'stroke="#fff" stroke-width="3" stroke-dasharray="14 12"';
  let g = '<rect width="400" height="400" fill="' + SC.grass + '"/>';
  if (kind === "round") {
    g += ["s", "w", "n", "e"].map((d) => '<g transform="rotate(' + SC_ROT[d] + ' 200 200)"><rect x="160" y="250" width="80" height="150" fill="' + SC.road + '"/><line x1="200" y1="300" x2="200" y2="400" ' + dash + "/></g>").join("");
    return g + '<circle cx="200" cy="200" r="94" fill="' + SC.road + '"/><circle cx="200" cy="200" r="44" fill="#B9CFA0" stroke="#fff" stroke-width="3"/>';
  }
  const arms = kind === "T" ? ["s", "w", "e"] : ["s", "w", "n", "e"];
  g += arms.map((d) => '<g transform="rotate(' + SC_ROT[d] + ' 200 200)"><rect x="160" y="200" width="80" height="200" fill="' + SC.road + '"/><line x1="200" y1="256" x2="200" y2="400" ' + dash + "/></g>").join("");
  return g + '<rect x="160" y="160" width="80" height="80" fill="' + SC.road + '"/>';
};
const scMark = (t, at) => {
  const r = 'transform="rotate(' + SC_ROT[at] + ' 200 200)"';
  if (t === "stop") return "<g " + r + '><rect x="200" y="243" width="40" height="6" fill="#fff"/></g>';
  if (t === "cedez") return "<g " + r + '><line x1="201" y1="246" x2="239" y2="246" stroke="#fff" stroke-width="4" stroke-dasharray="7 5"/></g>';
  return "";
};
const scSign = (t, at, kind) => {
  const [x, y] = scPt(262, kind === "round" ? 302 : 268, SC_ROT[at]), tr = 'transform="translate(' + x.toFixed(1) + " " + y.toFixed(1) + ')"';
  if (t === "stop") return "<g " + tr + '><polygon points="-7,-17 7,-17 17,-7 17,7 7,17 -7,17 -17,7 -17,-7" fill="#C8372D" stroke="#fff" stroke-width="2"/><text y="3.5" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="9.5" fill="#fff">STOP</text></g>';
  if (t === "cedez") return "<g " + tr + '><polygon points="-17,-13 17,-13 0,16" fill="#fff" stroke="#C8372D" stroke-width="4.5" stroke-linejoin="round"/></g>';
  if (t === "prio") return "<g " + tr + '><rect x="-12" y="-12" width="24" height="24" transform="rotate(45)" fill="#fff" stroke="#8A9099"/><rect x="-7.5" y="-7.5" width="15" height="15" transform="rotate(45)" fill="#F2B100"/></g>';
  return "";
};
const scCar = (c) => '<rect x="-14" y="-24" width="28" height="48" rx="8" fill="' + c + '"/><rect x="-10" y="-15" width="20" height="10" rx="3" fill="#D6E6F5"/><rect x="-10" y="11" width="20" height="7" rx="2" fill="#D6E6F5" opacity=".85"/>';
const scMoto = () => '<g transform="scale(1.3)"><rect x="-4" y="-21" width="8" height="42" rx="4" fill="#2A2F36"/><circle cy="2" r="9" fill="#F2B100"/><circle cy="-4" r="5.5" fill="#14171C"/></g>';
const scPath = (go, y0) => go === "right" ? "M220 " + y0 + " L220 254 Q220 220 254 220 L374 220" : go === "left" ? "M220 " + y0 + " L220 224 Q220 180 176 180 L26 180" : "M220 " + y0 + " L220 26";
const scLabel = (l, x, y, c) => '<g transform="translate(' + x.toFixed(1) + " " + y.toFixed(1) + ')"><circle r="13" fill="#fff" stroke="' + c + '" stroke-width="3"/><text y="5" text-anchor="middle" font-family="Outfit,Arial,sans-serif" font-weight="800" font-size="15" fill="' + c + '">' + l + "</text></g>";
function SCENE(id) {
  const s = SITS.find((x) => x.id === id); if (!s) return "";
  const u = "sc" + ++SC_N, withC = (v) => ({ ...v, c: v.moto ? "#14171C" : SC.col[v.l] });
  const cars = (s.cars || []).map(withC), raw = (s.raw || []).map(withC), all = cars.concat(raw);
  let defs = "<defs>" + all.map((v) => '<marker id="' + u + v.l + '" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.6" markerHeight="3.6" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="' + v.c + '"/></marker>').join("") + "</defs>";
  let g = scBase(s.kind) + (s.marks || []).map((m) => scMark(m.t, m.at)).join("");
  let paths = "", bodies = "", labels = "";
  cars.forEach((v) => {
    const deg = SC_ROT[v.from], d = v.d || 300;
    if (v.go !== "none") paths += '<path d="' + scPath(v.go, d - 30) + '" transform="rotate(' + deg + ' 200 200)" fill="none" stroke="' + v.c + '" stroke-width="4.5" stroke-dasharray="11 7" stroke-linecap="round" marker-end="url(#' + u + v.l + ')" opacity=".9"/>';
    bodies += '<g transform="rotate(' + deg + ' 200 200) translate(220 ' + d + ')">' + (v.moto ? scMoto() : scCar(v.c)) + "</g>";
    const [lx, ly] = scPt(v.moto ? 248 : 252, d + 4, deg); labels += scLabel(v.l, lx, ly, v.moto ? "#B07F00" : v.c);
  });
  raw.forEach((v) => {
    if (v.path) paths += '<path d="' + v.path + '" fill="none" stroke="' + v.c + '" stroke-width="4.5" stroke-dasharray="11 7" stroke-linecap="round" marker-end="url(#' + u + v.l + ')" opacity=".9"/>';
    bodies += '<g transform="translate(' + v.x + " " + v.y + ") rotate(" + v.rot + ')">' + (v.moto ? scMoto() : scCar(v.c)) + "</g>";
    labels += scLabel(v.l, v.lx, v.ly, v.moto ? "#B07F00" : v.c);
  });
  const signs = (s.signs || []).map((m) => scSign(m.t, m.at, s.kind)).join("");
  const crash = s.crash ? '<g transform="translate(' + s.crash[0] + " " + s.crash[1] + ')"><polygon points="0,-22 6,-8 21,-12 11,0 22,11 6,9 0,23 -6,9 -21,12 -11,0 -22,-11 -6,-8" fill="#F2B100" stroke="#C8372D" stroke-width="3" stroke-linejoin="round"/></g>' : "";
  return '<svg class="scene" viewBox="0 0 400 400" role="img" aria-label="' + s.t + '">' + defs + g + paths + bodies + crash + signs + labels + "</svg>";
}
const SITS = [
  { id: "droite", t: "Priorité à droite", kind: "cross", cars: [{ l: "A", from: "s", go: "straight" }, { l: "B", from: "e", go: "straight" }],
    q: "Aucun panneau. Qui passe en premier ?", a: "B passe en premier, puis A.", e: "Sans panneau, c'est la priorité à droite. B arrive par la droite de A : A le laisse passer.", ch: "cours-priorites" },
  { id: "trois", t: "Trois véhicules, aucun panneau", kind: "cross", cars: [{ l: "A", from: "s", go: "straight" }, { l: "B", from: "w", go: "straight" }, { l: "C", from: "e", go: "straight" }],
    q: "Aucun panneau. Dans quel ordre passent les véhicules ?", a: "C, puis A, puis B.", e: "Personne n'est à la droite de C : il passe. A cède à C, qui vient de sa droite. B cède à A, qui vient de sa droite.", ch: "cours-priorites" },
  { id: "stop", t: "Le stop", kind: "cross", marks: [{ t: "stop", at: "s" }], signs: [{ t: "stop", at: "s" }], cars: [{ l: "A", from: "s", go: "straight" }, { l: "B", from: "w", go: "straight" }],
    q: "A a un stop. Qui passe en premier ?", a: "B passe, puis A.", e: "Au stop : arrêt complet à la ligne, puis on laisse passer tout le monde, même ceux qui viennent de gauche comme B.", ch: "cours-priorites" },
  { id: "cedez", t: "Cédez le passage et zémidjan", kind: "T", marks: [{ t: "cedez", at: "s" }], signs: [{ t: "cedez", at: "s" }], cars: [{ l: "A", from: "s", go: "right" }, { l: "B", from: "w", go: "straight", moto: true }],
    q: "A veut tourner à droite. Qui passe en premier ?", a: "Le zémidjan B, puis A.", e: "Cédez le passage : on ralentit, on s'arrête si besoin et on laisse passer les usagers de la route principale, motos comprises. Un zémidjan arrive souvent plus vite qu'on ne le pense.", ch: "cours-priorites" },
  { id: "prioritaire", t: "Route prioritaire", kind: "cross", marks: [{ t: "cedez", at: "e" }], signs: [{ t: "prio", at: "s" }, { t: "cedez", at: "e" }], cars: [{ l: "A", from: "s", go: "straight" }, { l: "B", from: "e", go: "straight" }],
    q: "A roule sur une route prioritaire (losange jaune). Qui passe en premier ?", a: "A passe, puis B.", e: "Le losange jaune donne la priorité à A, même si B vient de sa droite. B a un Cédez le passage : il attend.", ch: "cours-priorites" },
  { id: "gauche", t: "Tourner à gauche", kind: "cross", cars: [{ l: "A", from: "s", go: "left" }, { l: "B", from: "n", go: "straight" }],
    q: "A veut tourner à gauche, B arrive en face. Qui passe en premier ?", a: "B passe, puis A tourne.", e: "Pour tourner à gauche, on laisse passer les véhicules qui arrivent en face. A attend au centre du carrefour, roues droites, puis tourne.", ch: "cours-priorites" },
  { id: "giratoire", t: "Le rond-point", kind: "round", marks: [{ t: "cedez", at: "s" }], signs: [{ t: "cedez", at: "s" }],
    cars: [{ l: "A", from: "s", go: "none", d: 318 }],
    raw: [{ l: "B", x: 134, y: 218, rot: 165, path: "M141 246 A68 68 0 1 0 224 136 L222 8", lx: 102, ly: 196 }],
    q: "A arrive au rond-point, B y est déjà. Qui passe en premier ?", a: "B, déjà engagé, puis A.", e: "Au rond-point, on cède le passage aux usagers déjà engagés, qui arrivent par la gauche. A attend que B soit passé.", ch: "cours-priorites" },
  { id: "accident", t: "Qui est en tort ?", kind: "cross",
    raw: [{ l: "A", x: 220, y: 250, rot: 0, lx: 252, ly: 276 }, { l: "B", x: 186, y: 220, rot: 90, lx: 160, ly: 252 }], crash: [212, 226],
    q: "Accident à un carrefour sans panneau. Qui est en tort ?", a: "B est en tort.", e: "A venait de la droite de B. Sans panneau, c'est la priorité à droite : B devait le laisser passer.", ch: "cours-priorites" }
];
const SIT_CARDS = (ids) => ids.map((id) => { const s = SITS.find((x) => x.id === id); return '<div class="sit">' + SCENE(id) + "<h5>" + s.t + "</h5><p>" + s.q + "</p><details><summary>Voir la réponse</summary><p><b>" + s.a + "</b> " + s.e + "</p></details></div>"; }).join("");
const MARK_ARROWS = '<svg viewBox="0 0 360 230" role="img" aria-label="Flèches de sélection sur une route à trois voies"><rect width="360" height="230" fill="#E4EBDA"/><rect x="60" y="0" width="240" height="230" fill="#4A5058"/><rect x="60" y="0" width="240" height="6" fill="#fff"/><line x1="140" y1="6" x2="140" y2="110" stroke="#fff" stroke-width="4"/><line x1="220" y1="6" x2="220" y2="110" stroke="#fff" stroke-width="4"/><line x1="140" y1="118" x2="140" y2="230" stroke="#fff" stroke-width="4" stroke-dasharray="16 12"/><line x1="220" y1="118" x2="220" y2="230" stroke="#fff" stroke-width="4" stroke-dasharray="16 12"/><line x1="62" y1="0" x2="62" y2="230" stroke="#fff" stroke-width="3"/><line x1="298" y1="0" x2="298" y2="230" stroke="#fff" stroke-width="3"/>' +
  '<path d="M106 150 V84 Q106 60 82 60" fill="none" stroke="#fff" stroke-width="12"/><path d="M84 46 L64 60 L84 74 Z" fill="#fff"/>' +
  '<path d="M174 150 V70 H160 L180 44 L200 70 H186 V150 Z" fill="#fff"/>' +
  '<path d="M254 150 V84 Q254 60 278 60" fill="none" stroke="#fff" stroke-width="12"/><path d="M276 46 L296 60 L276 74 Z" fill="#fff"/>' +
  '</svg>';
const PAS_ICO = {
  p: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 6 L44 40 H4 Z" fill="none" stroke="#C8372D" stroke-width="5" stroke-linejoin="round"/><path d="M24 19 V29" stroke="#C8372D" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="34.5" r="2.4" fill="#C8372D"/></svg>',
  a: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="14" y="4" width="20" height="40" rx="4" fill="none" stroke="#2B63B5" stroke-width="4"/><path d="M21 37 H27" stroke="#2B63B5" stroke-width="3.5" stroke-linecap="round"/><path d="M38 12 Q43 18 38 24 M42 9 Q49 18 42 27" fill="none" stroke="#2B63B5" stroke-width="3" stroke-linecap="round"/></svg>',
  s: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="8" width="32" height="32" rx="7" fill="#0B6E4F"/><path d="M24 15 V33 M15 24 H33" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>'
};

const HEAD = (eyebrow, title, lead) => `<div class="page-head pat-dots"><span class="mono-wm" aria-hidden="true">${LOGO("#FFFFFF", "mono")}</span><div class="wrap" style="position:relative"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="lead">${lead}</p></div></div>`;

const HTML = `
<header class="top"><div class="wrap bar">
<a class="logo" href="#accueil" aria-label="SODAF, accueil">${LOGO("#14171C", "word")}<small class="logo-sub">Auto-école · Togo</small></a>
<button class="burger" id="sd-burger" aria-expanded="false">Menu</button>
<nav class="main" id="sd-nav">
<a href="#accueil" data-nav="accueil">Accueil</a><a href="#formations" data-nav="formations">Formations et tarifs</a><a href="#cours" data-nav="cours">Cours</a><a href="#panneaux" data-nav="panneaux">Panneaux</a><a href="#quiz" data-nav="quiz">Quiz</a><a href="#devoirs" data-nav="devoirs">Devoirs</a><a href="#outils" data-nav="outils">Outils</a><a href="/equipe/" target="sodaf-equipe" class="navteam">Espace équipe</a>
</nav>
<a class="btn btn-green btn-sm" href="/equipe/" target="sodaf-equipe">Espace équipe</a>
</div></header>
<main>

<section class="page" data-page="accueil">
<div class="hero">
<div class="slides" id="sd-slides">${SLIDES.map((s, i) => `<img src="${s.img}" alt="" loading="${i ? "lazy" : "eager"}"${i ? "" : ' class="on"'}>`).join("")}</div>
<div class="veil"></div>
<div class="wrap hero-in"><div class="hero-copy">
<p class="greet">Woezon · Bienvenue · Alafia</p>
<h1>La route<br>s'apprend <em>ici.</em></h1>
<p class="hslogan">L'art de conduire, la force de réussir.</p>
<p class="lead">SODAF forme les conducteurs du Togo : code de la route, secourisme, mécanique et conduite. Tout ce que tu apprends en salle, tu le retrouves ici, sur ton téléphone.</p>
<div class="ctas"><a class="btn btn-green" href="#inscription">Je m'inscris</a><a class="btn btn-line" href="#cours">Réviser le code</a></div>
<div class="facts"><div><b>16</b><span>chapitres en ligne</span></div><div><b id="sd-qcount">49</b><span>questions corrigées</span></div><div><b>7</b><span>parties du manuel</span></div></div>
</div></div>
<div class="rule" id="sd-rule"><span class="dot">!</span><div><small id="sd-ruleTag">${SLIDES[0].tag}</small><p id="sd-ruleText">${SLIDES[0].rule}</p></div></div>
<div class="dots" id="sd-dots">${SLIDES.map((s, i) => `<button aria-label="Image ${i + 1}" data-i="${i}"${i ? "" : ' class="on"'}></button>`).join("")}</div>
<div class="lane" aria-hidden="true"></div>
</div>

<div class="wrap"><div class="pricebar">
<div class="pb-item"><span>Permis B dès</span><b>35 000 F</b></div>
<div class="pb-item"><span>Formation complète · 12 séances</span><b>55 000 F</b></div>
<div class="pb-item"><span>Paiement</span><b>En 2 tranches</b></div>
<a class="btn btn-green" href="#formations">Voir tous les tarifs</a>
</div></div>

<div class="band-soft"><div class="wrap">
<div class="sec-head"><div><p class="eyebrow">Le code de la route</p><h2>4 signalisations à maîtriser</h2></div><p>Tout le code repose sur elles. Touche une carte pour ouvrir le cours.</p></div>
<div class="signals">
<a href="#cours-marquages"><svg viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#2A2F36"/><path d="M24 6v8M24 20v8M24 34v8" stroke="#fff" stroke-width="3.5"/><path d="M10 6v36M38 6v36" stroke="#F2B100" stroke-width="2.5"/></svg><div><b>Marquages</b><span>Les lignes au sol</span></div></a>
<a href="#cours-panneaux"><svg viewBox="0 0 48 48"><polygon points="24,5 45,42 3,42" fill="#fff" stroke="#C8372D" stroke-width="5" stroke-linejoin="round"/><path d="M24 18v12M24 34v2" stroke="#14171C" stroke-width="3.5" stroke-linecap="round"/></svg><div><b>Panneaux</b><span>Danger, interdiction…</span></div></a>
<a href="#cours-feux"><svg viewBox="0 0 48 48"><rect x="14" y="3" width="20" height="42" rx="7" fill="#2A2F36"/><circle cx="24" cy="13" r="4.5" fill="#C8372D"/><circle cx="24" cy="24" r="4.5" fill="#F2B100"/><circle cx="24" cy="35" r="4.5" fill="#0B6E4F"/></svg><div><b>Feux</b><span>Vert, jaune, rouge</span></div></a>
<a href="#cours-agents"><svg viewBox="0 0 48 48"><circle cx="24" cy="10" r="6" fill="#14171C"/><path d="M24 17v15M24 32l-7 11M24 32l7 11M8 22h32" stroke="#14171C" stroke-width="4" stroke-linecap="round"/></svg><div><b>Agents</b><span>Les gestes à connaître</span></div></a>
</div></div></div>

<div class="wrap sec">
<div class="sec-head"><div><p class="eyebrow">Pourquoi SODAF</p><h2>Une auto-école qui te suit partout</h2></div></div>
<div class="grid g3">
<div class="card feat"><span class="fico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/></svg></span><h3>Le manuel en ligne</h3><p>Les 7 parties du manuel SODAF en chapitres courts, à lire où tu veux.</p><a class="more" href="#cours">Ouvrir les cours</a></div>
<div class="card feat"><span class="fico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg></span><h3>Quiz corrigés</h3><p>Chaque réponse est expliquée et renvoie au chapitre à relire.</p><a class="more" href="#quiz">S'entraîner</a></div>
<div class="card feat"><span class="fico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/></svg></span><h3>Paiement en tranches</h3><p>Règle ta formation en 2 fois (la moitié à l'inscription, le reste dans les 2 semaines), en espèces ou par Mixx by Yas.</p><a class="more" href="#formations">Voir les formules</a></div>
</div></div>

<div class="wrap sec">
<div class="sec-head"><div><p class="eyebrow">Ton parcours</p><h2>De l'inscription au permis</h2></div></div>
<div class="route">
<div class="stop"><i>1</i><div><b>Inscription</b><span>Au secrétariat ou par WhatsApp.</span></div></div>
<div class="stop"><i>2</i><div><b>Cours de code</b><span>En salle, puis révision en ligne.</span></div></div>
<div class="stop"><i>3</i><div><b>Examen du code</b><span>Entraîne-toi jusqu'à 35/40.</span></div></div>
<div class="stop"><i>4</i><div><b>Conduite</b><span>Matin, après-midi ou samedi.</span></div></div>
<div class="stop"><i>✓</i><div><b>Permis</b><span>Et la route est à toi.</span></div></div>
</div></div>

<div class="band-dark"><span class="mono-wm" aria-hidden="true">${LOGO("#FFFFFF", "mono")}</span><div class="wrap" style="position:relative">
<div class="qday">
<div style="position:relative"><p class="eyebrow">Question du jour</p><h2 style="margin-top:10px">Teste-toi en 10 secondes</h2><p style="margin-top:10px">Une question tirée du manuel SODAF. Tu veux aller plus loin ? Le quiz complet t'attend.</p><a class="btn btn-line btn-sm" style="margin-top:16px" href="#quiz">Faire le quiz complet</a></div>
<div id="sd-qday" style="position:relative"></div>
</div></div></div>

<div class="wrap sec"><div class="sec-head"><div><p class="eyebrow">Bon à savoir</p><h2>Les papiers du conducteur</h2></div><p>Ce qu'il faut pour l'examen, ce qu'il faut avoir à bord, et quoi faire après un accrochage.</p></div>
<div class="grid g3">
<div class="card doc"><div class="file">ID</div><div><span class="tag">Examen</span><h3 style="margin-top:8px">Pour l'examen, en fin de formation</h3><ul style="color:var(--muted);padding-left:1.1em;margin:8px 0"><li>Acte de naissance</li><li>Photocopie de la carte d'identité</li><li>2 photos d'identité, format passeport</li></ul><p style="font-size:.88rem">À l'inscription : le droit d'inscription de 5&nbsp;000&nbsp;F. À la fin de la formation : ces papiers et le dépôt de 30&nbsp;000&nbsp;F pour l'examen d'État. SODAF dépose ton dossier ; tu reçois ensuite un message officiel avec la date de ton examen, à passer à SOTOPLA.</p></div></div>
<div class="card doc"><div class="file">CG</div><div><span class="tag">Au volant</span><h3 style="margin-top:8px">Documents de bord</h3><p>Carte grise, assurance, permis, pièce d'identité.</p><div class="acts"><a class="btn btn-line btn-sm" href="#cours-tableau">Voir le chapitre</a></div></div></div>
<div class="card doc"><div class="file">CA</div><div><span class="tag">Accident</span><h3 style="margin-top:8px">Constat amiable</h3><p>Remplis-le sur place, ne signe que ce qui est exact, garde ton exemplaire.</p><div class="acts"><a class="btn btn-line btn-sm" href="#cours-secourisme">En savoir plus</a></div></div></div>
</div>
</div>
<div class="wrap sec"><div class="band">${ZEBRA}<div style="position:relative"><h2 style="font-size:clamp(1.8rem,4vw,2.5rem)">Prêt à prendre le volant ?</h2><p>Pré-inscris-toi en une minute. Le secrétariat te répond sur WhatsApp pour fixer ton premier cours.</p></div><a class="btn btn-green" style="position:relative" href="#inscription">Me pré-inscrire</a></div></div>
</section>

<section class="page" data-page="formations" hidden>
${HEAD("Formations", "Nos formations et tarifs", "Chaque formule comprend le code de la route, l'entretien mécanique et le secourisme. Prix en francs CFA. Droit d'inscription : 5 000 F, payé une fois.")}
<div class="wrap sec">
<div class="sec-head"><div><p class="eyebrow">Permis B · voiture</p><h2>Choisis ta formule</h2></div><p>Les trois formules suivent le même programme. Seuls le rythme et le nombre de séances de conduite changent.</p></div>
<div class="grid g3">
<div class="card offer star"><span class="tag y">Recommandée</span><h3>Formation complète</h3><div class="cat">55 000 F</div><p>Sur 3 mois. Pour apprendre à conduire en partant de zéro.</p><ul><li>12 séances de conduite d'1 h</li><li>Code de la route, théorie et pratique</li><li>Entretien mécanique et secourisme</li></ul><div class="price"><b>+ 5 000 F d'inscription</b><a class="btn btn-green btn-sm" href="#inscription" data-cat="Permis B">Choisir</a></div></div>
<div class="card offer"><span class="tag">Plus rapide</span><h3>Formation accélérée</h3><div class="cat">75 000 F</div><p>En 2 mois, ou <b>80 000 F</b> en 1 mois. Même contenu, planning plus serré.</p><ul><li>12 séances de conduite d'1 h</li><li>Code de la route, théorie et pratique</li><li>Entretien mécanique et secourisme</li></ul><div class="price"><b>+ 5 000 F d'inscription</b><a class="btn btn-line btn-sm" href="#inscription" data-cat="Permis B">Choisir</a></div></div>
<div class="card offer"><span class="tag">Déjà conducteur</span><h3>Formule courte</h3><div class="cat">35 000 F</div><p>Sur 3 mois. Pour ceux qui savent déjà tenir un volant.</p><ul><li>6 séances de conduite d'1 h</li><li>Code de la route, théorie et pratique</li><li>Entretien mécanique et secourisme</li></ul><div class="price"><b>+ 5 000 F d'inscription</b><a class="btn btn-line btn-sm" href="#inscription" data-cat="Permis B">Choisir</a></div></div>
</div>
<div class="card alacarte" style="margin-top:18px"><p class="eyebrow">À la carte</p>
<div class="acrow"><div><b>Formation théorique seule</b><span> · code, mécanique et secourisme, sans conduite</span></div><strong>25 000 F</strong></div>
<div class="acrow"><div><b>Séance de conduite supplémentaire</b><span> · 1 h, à ajouter à n'importe quelle formule</span></div><strong>5 000 F</strong></div>
</div>
<p style="margin-top:14px;display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px"><a class="btn btn-line btn-sm" href="/fiche-renseignement-sodaf.pdf" download>Télécharger la fiche des tarifs (PDF)</a><span style="color:var(--muted);font-size:.92rem">Une page A4, à imprimer ou à partager.</span></p>
</div>
<div class="wrap sec">
<div class="sec-head"><div><p class="eyebrow">Autres formations</p><h2>Moto, remise à niveau, entreprises</h2></div><p>Moto et remise à niveau à prix fixe. Entreprises : sur devis selon le nombre de chauffeurs.</p></div>
<div class="grid g3">
<div class="card offer"><span class="tag">Deux-roues</span><h3>Permis A · moto</h3><div class="cat">30 000 F</div><p>Pour circuler en règle et en sécurité, pour toi ou ton activité.</p><ul><li>Code de la route complet</li><li>Environ 6 séances de moto d'1 h</li><li>Maîtrise à basse vitesse, puis circulation</li></ul><div class="price"><b>+ 5 000 F d'inscription</b><a class="btn btn-line btn-sm" href="#inscription" data-cat="Permis A">Choisir</a></div></div>
<div class="card offer"><span class="tag">Déjà titulaire</span><h3>Remise à niveau</h3><div class="cat">20 000 F</div><p>Tu as ton permis mais tu n'as pas conduit depuis longtemps ? On te remet en confiance.</p><ul><li>4 séances d'1 h, évaluation comprise</li><li>Leçons ciblées : ville, nuit, route</li><li>Rappel des règles du code</li></ul><div class="price"><b>Séance en plus : 5 000 F</b><a class="btn btn-line btn-sm" href="#inscription" data-cat="Remise à niveau">Choisir</a></div></div>
<div class="card offer"><span class="tag">Sociétés, ONG</span><h3>Formation entreprise</h3><p>Pour former vos chauffeurs, selon vos horaires.</p><ul><li>Conduite préventive</li><li>Vérification du véhicule chaque matin</li><li>Secourisme routier et constat amiable</li></ul><div class="price"><b>Sur devis</b><a class="btn btn-line btn-sm" href="#inscription" data-cat="Formation entreprise">Demander un devis</a></div></div>
</div>
<div class="card alacarte" style="margin-top:18px"><p class="eyebrow">Pack</p><div class="acrow"><div><b>Pack A + B · moto et voiture</b><span> · formation complète voiture + permis moto, au lieu de 85 000 F séparément</span></div><strong>80 000 F</strong></div><p style="margin:10px 0 0;font-size:.92rem;color:var(--muted)">En plus, à la fin de la formation : le dépôt de 30&nbsp;000&nbsp;F pour l'examen d'État. <a href="#inscription" data-cat="Pack A + B" data-msg="Je suis intéressé par le Pack A + B (moto et voiture).">Demander le pack</a></p></div>
</div>
<div class="wrap sec">
<div class="sec-head"><div><p class="eyebrow">Ta semaine à SODAF</p><h2>Comment se passe la formation</h2></div><p>Tu révises sur le site quand tu veux. En salle, le moniteur explique, corrige et t'entraîne pour l'examen.</p></div>
<div class="grid g3">
<div class="card"><p class="eyebrow">Code en salle · groupes de 6</p><h3 style="margin-top:10px">2 cours par semaine</h3>
<div class="wk"><b>Après-midi</b><span>14 h 30 – 15 h 30 · lundi et jeudi, ou mardi et vendredi</span></div>
<div class="wk"><b>Matin</b><span>11 h – 12 h · lundi et jeudi</span></div>
<div class="wk"><b>Mercredi 14 h 30</b><span>Rattrapage et examen blanc, tous groupes</span></div>
<p style="margin-top:12px;font-size:.92rem;color:var(--muted)">Un thème par cours, 12 cours en 6 semaines : tu peux commencer n'importe quelle semaine.</p></div>
<div class="card"><p class="eyebrow">Conduite · 1 h, sur rendez-vous</p><h3 style="margin-top:10px">Choisis ton créneau</h3>
<div class="wk"><b>Lun – ven matin</b><span>6 h 30 · 7 h 30 · 8 h 45 · 9 h 45</span></div>
<div class="wk"><b>Lun – ven soir</b><span>15 h 45 · 16 h 45</span></div>
<div class="wk"><b>Samedi</b><span>6 h 30 à 11 h 45</span></div>
<p style="margin-top:12px;font-size:.92rem;color:var(--muted)">Tu travailles ? Les créneaux de 6 h 30, de 16 h 45 et du samedi sont faits pour toi.</p></div>
<div class="card"><p class="eyebrow">Ton parcours</p><h3 style="margin-top:10px">Étape par étape</h3>
<ol class="steps-ol"><li><b>Semaines 1 et 2 :</b> le code d'abord, signalisation et priorités.</li><li><b>Dès la semaine 3 :</b> une séance de conduite par semaine, le code continue.</li><li><b>En 6 semaines</b>, tu vois tous les chapitres en salle (12 cours). Un cours manqué : mercredi 14 h 30 ou sur le site.</li><li><b>Avant l'examen :</b> examens blancs du mercredi.</li></ol></div>
</div>
<div class="card prog-pub" id="sd-progPub" style="margin-top:18px"></div>
</div>
<div class="wrap sec"><div class="grid g3">
<div class="card soft"><p class="eyebrow">Paiement</p><h3 style="margin-top:10px">En 2 tranches</h3><p style="margin-top:8px">La moitié à l'inscription, le reste dans les 2 semaines (avant ta première séance de conduite). Un reçu pour chaque paiement.</p><div class="pills"><span>Espèces</span><span>Mixx by Yas (T-Money)</span></div></div>
<div class="card soft"><p class="eyebrow">Dossier à fournir</p><h3 style="margin-top:10px">Pour l'examen, en fin de formation</h3><ul style="margin:8px 0 0;padding-left:1.1em;color:var(--muted)"><li>Acte de naissance</li><li>Photocopie de la carte d'identité</li><li>2 photos d'identité, format passeport</li></ul><p style="margin-top:10px;font-size:.92rem"><b>Examen d'État</b> : dépôt de 30&nbsp;000&nbsp;F pour l'inscription à l'examen final, à régler à la fin de la formation, en plus du prix de la formation. SODAF dépose ton dossier ; l'État t'envoie ensuite un message avec la date de ton examen, à passer à SOTOPLA.</p></div>
<div class="card soft"><p class="eyebrow">Bon à savoir</p><h3 style="margin-top:10px">Des règles claires</h3><ul style="margin:8px 0 0;padding-left:1.1em;color:var(--muted)"><li>Le droit d'inscription n'est pas remboursable.</li><li>Une séance non faite peut être reportée pendant 6 mois.</li><li>Conduite, sur rendez-vous : du lundi au vendredi de 6 h 30 à 10 h 45 et de 15 h 45 à 17 h 45, le samedi de 6 h 30 à 11 h 45.</li><li>Secrétariat : du lundi au vendredi de 8 h à 12 h 30 et de 14 h 30 à 18 h, le samedi de 8 h à 12 h.</li></ul></div>
</div></div>
<div class="wrap sec" id="formations-docs" style="padding-top:0"><div class="sec-head"><div><p class="eyebrow">À télécharger</p><h2>Fiche et planning</h2></div><p>À imprimer, à garder sur ton téléphone ou à envoyer à un proche.</p></div>
<div class="card doc doc-cover"><img class="cover" src="/apercu-fiche.jpg" alt="Aperçu de la fiche de renseignement SODAF" width="120" height="170" loading="lazy"><div><span class="tag">PDF · 1 page A4</span><h3 style="margin-top:8px">Fiche de renseignement</h3><p>Toutes les formules et leurs prix, le dossier à fournir et les règles de l'auto-école. À imprimer ou à envoyer à un proche.</p>
<div class="acts"><a class="btn btn-green btn-sm" href="/fiche-renseignement-sodaf.pdf" download>Télécharger le PDF</a><a class="btn btn-line btn-sm" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent("La fiche de l'auto-école SODAF (formations et tarifs) : https://autosodaf.com/fiche-renseignement-sodaf.pdf")}">Partager sur WhatsApp</a></div></div></div>
<div class="card doc doc-cover" style="margin-top:18px"><img class="cover" src="/apercu-planning.jpg" alt="Aperçu du planning de la semaine SODAF" width="120" height="85" loading="lazy" style="align-self:start"><div><span class="tag">PDF · A4 paysage</span><h3 style="margin-top:8px">Planning de la semaine</h3><p>Les heures du code en salle, les créneaux de conduite et l'examen blanc du samedi. Garde-le sur ton téléphone.</p>
<div class="acts"><a class="btn btn-green btn-sm" href="/planning-semaine-sodaf.pdf" download>Télécharger le PDF</a><a class="btn btn-line btn-sm" href="#formations">Voir en ligne</a></div></div></div>
</div>
</section>

<section class="page" data-page="cours" hidden>
${HEAD("Manuel officiel SODAF", "Les cours", "Tout ce qui est enseigné en salle, chapitre par chapitre. Marque chaque chapitre comme lu pour voir d'un coup d'œil où tu en es.")}
<div class="wrap"><div class="classband"><p class="cb-t">Code en salle · groupes de 6 élèves</p><p class="cb-d">Groupe A : lundi et jeudi 14 h 30 · Groupe B : mardi et vendredi 14 h 30 · Groupe C : lundi et jeudi 11 h · Mercredi 14 h 30 : rattrapage et examen blanc</p><a class="btn btn-line btn-sm" href="#formations" style="margin-left:auto">Voir le planning</a></div></div>
<div class="wrap" style="margin-top:22px"><div class="card doc doc-cover"><img class="cover" src="/couverture-manuel.jpg" alt="Couverture du manuel de l'élève conducteur SODAF" width="120" height="160" loading="lazy"><div><span class="tag">Manuel officiel · 34 pages</span><h3 style="margin-top:8px">Manuel de l'élève conducteur</h3><p>Code, secourisme et mécanique, en 7 parties :</p>
<ol class="toc-list"><li><a href="#cours-signalisation">Le code de la route</a></li><li><a href="#cours-intersections">Les intersections</a></li><li><a href="#cours-priorites">Les règles de priorité</a></li><li><a href="#cours-secourisme">Le secourisme routier</a></li><li><a href="#cours-assurance">L'assurance automobile</a></li><li><a href="#cours-conduite">Notions de conduite</a></li><li><a href="#cours-mecanique">Mécanique automobile</a></li></ol>
<div class="acts"><a class="btn btn-green btn-sm" href="#cours-signalisation">Commencer la lecture</a><a class="btn btn-line btn-sm" target="_blank" rel="noopener" href="${WA}?text=${encodeURIComponent("Bonjour SODAF, je souhaite recevoir le manuel de l'élève en PDF.")}">Recevoir le PDF sur WhatsApp</a></div></div></div></div>
<div class="wrap course"><aside class="toc" id="sd-toc" aria-label="Chapitres"></aside><div>

<article class="ch" id="cours-signalisation" data-part="A · Code de la route" data-title="Le code et les signalisations">
<header><div><p class="eyebrow">Partie A · Chapitre 1</p><h2>Le code et les signalisations</h2></div></header>
<p><b>Le code de la route</b> est l'ensemble des lois et des règles qui régissent la circulation. Il facilite la circulation et évite les accidents.</p>
<p><b>Les règles de la circulation</b> sont les signalisations qu'un conducteur doit observer pour protéger sa vie et celle des autres.</p>
<h4>Les 4 types de signalisation</h4>
<div class="grid g4"><div class="card soft"><b>Horizontales</b><p>Les marquages au sol.</p></div><div class="card soft"><b>Verticales</b><p>Les panneaux.</p></div><div class="card soft"><b>Lumineuses</b><p>Les feux tricolores.</p></div><div class="card soft"><b>Gestuelles</b><p>Les signes des agents.</p></div></div>
</article>

<article class="ch" id="cours-marquages" data-part="A · Code de la route" data-title="Route, voies et marquages">
<header><div><p class="eyebrow">Partie A · Chapitre 2</p><h2>Route, voies et marquages</h2></div></header>
<dl class="dl">
<div><dt>La route</dt><dd>L'ensemble des voies ouvertes à la circulation du public.</dd></div>
<div><dt>La chaussée</dt><dd>La partie aménagée pour les véhicules. On roule aussi près que possible du bord droit. Avec plusieurs voies dans le même sens, les véhicules de plus de 3,5 t ou de plus de 7 m utilisent les deux voies de droite.</dd></div>
<div><dt>Bande cyclable</dt><dd>Partie de la chaussée réservée aux cycles et cyclomoteurs sans remorque.</dd></div>
<div><dt>Piste cyclable</dt><dd>Chaussée réservée aux cycles. Circulation, arrêt et stationnement interdits aux autres.</dd></div>
<div><dt>Accotement</dt><dd>Partie non aménagée de chaque côté. Arrêt et stationnement permis sauf interdiction.</dd></div>
<div><dt>Trottoir</dt><dd>Partie réservée aux piétons. Arrêt et stationnement interdits.</dd></div>
<div><dt>Ligne médiane</dt><dd>Ligne peinte qui divise la chaussée en deux. L'axe médian est la même ligne, imaginaire.</dd></div>
<div><dt>Voie de stockage</dt><dd>Permet de tourner sans gêner ceux qui continuent tout droit.</dd></div>
<div><dt>Voie pour véhicules lents</dt><dd>À droite dans les fortes pentes, pour les véhicules qui ne dépassent pas 60 km/h.</dd></div>
<div><dt>Voie d'accélération</dt><dd>Pour s'insérer sur voie rapide en cédant le passage aux usagers déjà engagés.</dd></div>
<div><dt>Voie de décélération</dt><dd>Pour quitter une voie rapide. On ne ralentit qu'une fois dessus. Traits de 3 m, intervalles de 3,50 m.</dd></div>
<div><dt>Couloir de bus</dt><dd>Réservé aux autobus, parfois aux taxis et ambulances.</dd></div>
<div><dt>Terre-plein central</dt><dd>Sépare les deux sens et permet aux piétons de traverser en deux temps.</dd></div>
</dl>
<h4>Les lignes au sol</h4>
<div class="tbl"><table><thead><tr><th>Aperçu</th><th>Ligne</th><th>Dimensions</th><th>Règle</th></tr></thead><tbody>
<tr><td>${LINE('<line x1="0" y1="7" x2="110" y2="7" stroke="#fff" stroke-width="3"/>')}</td><td><b>Continue</b></td><td>Trait plein</td><td>Infranchissable.</td></tr>
<tr><td>${LINE('<line x1="0" y1="7" x2="110" y2="7" stroke="#fff" stroke-width="3" stroke-dasharray="12 14"/>')}</td><td><b>De rive</b></td><td>3 m / 3,50 m</td><td>Bord de la chaussée, repère par brouillard.</td></tr>
<tr><td>${LINE('<line x1="0" y1="7" x2="110" y2="7" stroke="#fff" stroke-width="3" stroke-dasharray="9 30"/>')}</td><td><b>Délimitation</b></td><td>3 m / 10 m</td><td>Franchissable pour dépasser ou tourner.</td></tr>
<tr><td>${LINE('<line x1="0" y1="7" x2="110" y2="7" stroke="#fff" stroke-width="3" stroke-dasharray="12 5"/>')}</td><td><b>Dissuasion</b></td><td>Intervalles 1,33 m</td><td>Routes étroites. Dépassement déconseillé.</td></tr>
<tr><td>${LINE('<line x1="0" y1="7" x2="110" y2="7" stroke="#fff" stroke-width="3" stroke-dasharray="20 5"/>')}</td><td><b>Avertissement</b></td><td>Intervalles courts</td><td>Une ligne continue arrive : ne commence pas de dépassement.</td></tr>
<tr><td>${LINE('<line x1="0" y1="4" x2="110" y2="4" stroke="#fff" stroke-width="2.5"/><line x1="0" y1="10" x2="110" y2="10" stroke="#fff" stroke-width="2.5" stroke-dasharray="12 10"/>')}</td><td><b>Mixte</b></td><td>Continue + discontinue</td><td>Franchissable seulement si la discontinue est de ton côté.</td></tr>
</tbody></table></div>
<h4>Autres marquages</h4>
<ul>
<li><b>Ligne STOP</b> (pleine) : arrêt obligatoire. <b>Cédez le passage</b> (discontinue) : ralentir et céder. Ces véhicules partent en dernier.</li>
<li><b>Passage piéton</b> : arrêt et stationnement interdits dessus.</li>
<li><b>Zébras</b> : circulation, arrêt et stationnement interdits.</li>
<li><b>Jaune en zigzag</b> : arrêt réservé aux bus.</li>
<li><b>Jaune discontinue</b> : arrêt permis, stationnement interdit. <b>Jaune continue</b> : les deux interdits.</li>
<li><b>Flèches de sélection</b> : une fois engagé dans la voie, on n'en sort plus. <b>Flèches de rabattement</b> : une ligne continue arrive.</li>
<li><b>Croisement difficile</b> : les véhicules légers reculent pour laisser passer les poids lourds.</li>
</ul>
<figure class="fig">${MARK_ARROWS}<figcaption><b>Flèches de sélection.</b> Choisis ta voie tant que la ligne est discontinue. Quand elle devient continue, tu restes dans ta voie jusqu'au carrefour.</figcaption></figure>
</article>

<article class="ch" id="cours-intersections" data-part="B · Intersections" data-title="Les intersections">
<header><div><p class="eyebrow">Partie B</p><h2>Les intersections</h2></div></header>
<p>Une intersection est le lieu où deux routes ou plus se rejoignent ou se croisent : en T, en Y, en X, en croix avec terre-plein, « à l'indonésienne », giratoire, ou à plusieurs routes.</p>
<h4>Le protocole d'approche</h4>
<div class="mnemo"><div><b>1 · Arrière</b>Rétroviseur : mon freinage va-t-il surprendre celui qui me suit ?</div><div><b>2 · Gauche</b>Le premier danger immédiat vient de la gauche.</div><div><b>3 · Droite</b>Ai-je le droit de tourner ? Quelle priorité ? Quelle visibilité ?</div></div>
<p>Puis adapter la vitesse, freiner, rétrograder. Appel lumineux ou klaxon seulement hors agglomération et de jour.</p>
<h4>La zone dangereuse</h4>
<p>C'est l'espace de conflit au centre de l'intersection. Le temps qu'on y passe dépend de la vitesse des autres véhicules, de la reprise de ta voiture, de l'adhérence, de l'état des pneus et freins, et du gabarit du véhicule.</p>
</article>

<article class="ch" id="cours-priorites" data-part="C · Priorités" data-title="Les règles de priorité">
<header><div><p class="eyebrow">Partie C</p><h2>Les règles de priorité</h2></div></header>
<p>Elles organisent le passage dans les intersections pour éviter les conflits de trajectoire.</p>
<div class="signs">
<div class="sign">${SIGN_TRI('<path d="M32 24v24M22 34h20" stroke="#14171C" stroke-width="4"/>')}Priorité à droite</div>
<div class="sign">${SIGN_TRI('<path d="M32 22v28" stroke="#14171C" stroke-width="7"/><path d="M22 38h20" stroke="#14171C" stroke-width="2.5"/>')}Priorité ponctuelle</div>
<div class="sign"><svg viewBox="0 0 64 64"><rect x="14" y="14" width="36" height="36" transform="rotate(45 32 32)" fill="#fff" stroke="#999"/><rect x="20" y="20" width="24" height="24" transform="rotate(45 32 32)" fill="#F2B100"/></svg>Route prioritaire</div>
<div class="sign"><svg viewBox="0 0 64 64"><rect x="14" y="14" width="36" height="36" transform="rotate(45 32 32)" fill="#fff" stroke="#999"/><rect x="20" y="20" width="24" height="24" transform="rotate(45 32 32)" fill="#F2B100"/><line x1="14" y1="50" x2="50" y2="14" stroke="#14171C" stroke-width="6"/></svg>Fin de priorité</div>
<div class="sign"><svg viewBox="0 0 64 64"><polygon points="4,8 60,8 32,58" fill="#fff" stroke="#C8372D" stroke-width="6" stroke-linejoin="round"/></svg>Cédez le passage</div>
<div class="sign"><svg viewBox="0 0 64 64"><polygon points="20,4 44,4 60,20 60,44 44,60 20,60 4,44 4,20" fill="#C8372D" stroke="#fff" stroke-width="3"/><text x="32" y="38" fill="#fff" font-family="Arial,sans-serif" font-weight="700" font-size="15" text-anchor="middle">STOP</text></svg>Stop</div>
</div>
<h4>Priorité à droite</h4>
<p>On cède le passage à ceux qui viennent de droite : aux intersections sans signalisation, et au panneau d'intersection de deux routes d'importance égale.</p>
<div class="note"><b>Cas particulier :</b> en sortant d'un parking ou d'un chemin privé, tu cèdes le passage à tous. Si le chemin est ouvert au public, même non goudronné, les règles normales s'appliquent.</div>
<h4>Priorité à gauche</h4>
<p>Au rond-point : on cède le passage aux usagers déjà engagés, qui arrivent par la gauche.</p>
<h4>Tourner à gauche</h4>
<p>Avant de tourner à gauche, on laisse passer les véhicules qui arrivent en face. On attend au centre du carrefour, roues droites, puis on tourne.</p>
<h4>Les panneaux de priorité</h4>
<ul><li><b>Ponctuelle</b> : valable à la prochaine intersection seulement.</li><li><b>Route prioritaire</b> (losange jaune) : priorité à toutes les intersections, répété environ tous les 5 km.</li><li><b>Fin de priorité</b> (losange barré) : retour aux règles classiques.</li></ul>
<h4>Cas complexes</h4>
<p><b>Intersection encombrée</b> : interdit de s'engager si tu risques d'y rester bloqué, même au vert. Sur un quadrillage jaune, l'arrêt est interdit.</p>
<p><b>Panonceau schéma</b> : le trait épais montre la route prioritaire, les traits fins les routes avec Stop ou Cédez le passage.</p>
<h4>Entraîne-toi : qui passe en premier ?</h4>
<p>Regarde chaque carrefour vu du dessus, réfléchis, puis ouvre la réponse.</p>
<div class="sits">${SIT_CARDS(["droite", "trois", "stop", "cedez", "prioritaire", "gauche", "giratoire", "accident"])}</div>
</article>

<article class="ch" id="cours-feux" data-part="C · Priorités" data-title="Feux et passages à niveau">
<header><div><p class="eyebrow">Partie C</p><h2>Feux et passages à niveau</h2></div></header>
<div class="grid g3 lights"><div class="card" style="border-top-color:var(--green)"><b>Vert</b><p>Passe si l'intersection est dégagée.</p></div><div class="card" style="border-top-color:var(--yellow)"><b>Jaune</b><p>Arrêt, sauf si tu es trop près pour t'arrêter en sécurité.</p></div><div class="card" style="border-top-color:var(--red)"><b>Rouge</b><p>Arrêt absolu avant la ligne.</p></div></div>
<div class="note"><b>Feux en panne</b> (éteints ou jaune clignotant) : applique les panneaux sur le support du feu, sinon la priorité à droite. Fréquent lors des coupures de courant.</div>
<p><b>Flèche de dégagement</b> : permet d'avancer dans sa direction malgré le rouge, en cédant le passage.</p>
<h4>Passages à niveau</h4>
<p>Annoncés à 150 m hors agglomération, 50 m en agglomération.</p>
<ul><li><b>Sans barrière</b> : arrêt et vérification qu'aucun train n'arrive.</li><li><b>Demi-barrières</b> : feu clignotant et sonnerie, arrêt obligatoire.</li><li><b>Barrières gardées</b> : ralentir fortement pour pouvoir s'arrêter.</li></ul>
</article>

<article class="ch" id="cours-agents" data-part="C · Priorités" data-title="Les gestes des agents">
<header><div><p class="eyebrow">Partie C</p><h2>Les gestes des agents</h2></div></header>
<div class="note red"><b>Priorité absolue :</b> les ordres d'un agent passent avant les feux, les panneaux et les marquages.</div>
<div class="tbl"><table><thead><tr><th>Position ou geste</th><th>Ce que tu fais</th></tr></thead><tbody>
<tr><td>Agent de face ou de dos</td><td><b>Arrêt</b> immédiat.</td></tr>
<tr><td>Agent de profil</td><td><b>Passe</b> si tu es parallèle à ses bras.</td></tr>
<tr><td>Bras levé à la verticale</td><td><b>Arrêt général</b> : le trafic va changer.</td></tr>
<tr><td>Bras de haut en bas</td><td><b>Ralentis</b>.</td></tr>
<tr><td>Mouvement circulaire</td><td><b>Avance</b>, circule.</td></tr>
</tbody></table></div>
</article>

<article class="ch" id="cours-panneaux" data-part="C · Priorités" data-title="Les panneaux">
<header><div><p class="eyebrow">Partie C</p><h2>Les panneaux</h2></div></header>
<p class="note"><b>Tous les panneaux en images :</b> <a href="#panneaux">ouvre la page Panneaux</a> et révise-les en mode quiz.</p>
<p>Placés à droite, ils s'adressent à ceux qui leur font face, jusqu'à la prochaine intersection. Les panneaux de danger sont à environ 150 m du danger hors agglomération, 50 m en ville.</p>
<div class="signs">
<div class="sign"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#fff" stroke="#C8372D" stroke-width="7"/><text x="32" y="40" font-family="Arial,sans-serif" font-weight="700" font-size="22" text-anchor="middle" fill="#14171C">50</text></svg>Interdiction</div>
<div class="sign"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="29" fill="#C8372D"/><rect x="14" y="27" width="36" height="10" fill="#fff"/></svg>Sens interdit</div>
<div class="sign"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#fff" stroke="#888" stroke-width="2"/><line x1="12" y1="52" x2="52" y2="12" stroke="#14171C" stroke-width="6"/></svg>Fin d'interdiction</div>
<div class="sign"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="29" fill="#2B63B5"/><path d="M18 32h24M34 22l10 10-10 10" fill="none" stroke="#fff" stroke-width="6"/></svg>Obligation</div>
</div>
<dl class="dl">
<div><dt>Interdiction</dt><dd>Couronne rouge, fond blanc : accès, sens, dépassement, klaxon interdits, ou vitesse maximale.</dd></div>
<div><dt>Un sens interdit</dt><dd>Le véhicule qui fait face au sens interdit tourne obligatoirement à sa droite. Puis on applique la priorité normale.</dd></div>
<div><dt>Deux sens interdits</dt><dd>Route totalement inaccessible.</dd></div>
<div><dt>Fin d'interdiction</dt><dd>Cercle blanc barré de noir.</dd></div>
<div><dt>Obligation</dt><dd>Cercle bleu : direction, voie ou comportement imposé.</dd></div>
<div><dt>Sens unique</dt><dd>Le sens interdit se trouve derrière le panneau, à la prochaine intersection.</dd></div>
</dl>
</article>

<article class="ch" id="cours-prioritaires" data-part="C · Priorités" data-title="Véhicules prioritaires">
<header><div><p class="eyebrow">Partie C</p><h2>Les véhicules prioritaires</h2></div></header>
<p><b>Prioritaires</b> : Police, Gendarmerie, Sapeurs-pompiers, SAMU, SMUR, Douanes, seulement en mission urgente avec sirène ou gyrophare activé. Facilite-leur le passage ou arrête-toi.</p>
<div class="note"><b>Attention :</b> les ambulances privées et les véhicules de la CEET ou de la TdE ont des gyrophares mais <b>ne sont pas prioritaires</b>. On les laisse passer par courtoisie.</div>
</article>

<article class="ch" id="cours-togo" data-part="Conduire au Togo" data-title="Conduire chez nous">
<header><div><p class="eyebrow">Chapitre bonus SODAF</p><h2>Conduire chez nous</h2></div></header>
<p>Le code est le même partout, mais nos routes ont leurs réalités.</p>
<dl class="dl">
<div><dt>Les zémidjans</dt><dd>Les motos-taxis changent de file sans prévenir. Avant de tourner : rétroviseur, puis coup d'œil par-dessus l'épaule.</dd></div>
<div><dt>L'harmattan</dt><dd>De décembre à février, la poussière réduit la visibilité. Feux de croisement, vitesse réduite, plus de distance.</dd></div>
<div><dt>Saison des pluies</dt><dd>Le freinage double sur route mouillée. Ne traverse pas une flaque dont tu ne vois pas le fond.</dd></div>
<div><dt>Marchés</dt><dd>Piétons, vendeurs et enfants débordent sur la chaussée. Ralentis à l'approche.</dd></div>
<div><dt>Animaux</dt><dd>Chèvres et troupeaux traversent sans prévenir. On ralentit à leur vue.</dd></div>
<div><dt>Coupures de courant</dt><dd>Feux éteints : panneaux du support, sinon priorité à droite.</dd></div>
<div><dt>La nuit</dt><dd>Beaucoup de routes ne sont pas éclairées. Feux de croisement et vitesse réduite.</dd></div>
</dl>
</article>

<article class="ch" id="cours-secourisme" data-part="D · Secourisme" data-title="Secourisme routier">
<header><div><p class="eyebrow">Partie D</p><h2>Le secourisme routier</h2></div></header>
<dl class="dl">
<div><dt>Délit de fuite</dt><dd>Ne pas s'arrêter après un accident pour échapper à sa responsabilité. Sévèrement puni.</dd></div>
<div><dt>Non-assistance</dt><dd>Refuser volontairement de secourir une personne en danger.</dd></div>
<div><dt>Constat amiable</dt><dd>Document qui fixe les responsabilités après un accident matériel.</dd></div>
<div><dt>Témoin</dt><dd>Décrit les faits fidèlement, sans les analyser.</dd></div>
</dl>
<h4>L'action P.A.S.</h4>
<p>Si les secours sont déjà là, ne t'arrête pas. Si l'accident vient d'arriver devant toi :</p>
<div class="mnemo pas"><div>${PAS_ICO.p}<b>Protéger</b>Gare-toi en sécurité. Coupe le contact des véhicules, interdis de fumer. Triangle et feux de détresse.</div><div>${PAS_ICO.a}<b>Alerter</b>Appelle : nature de l'accident, nombre de blessés, véhicules, lieu exact, incendie éventuel.</div><div>${PAS_ICO.s}<b>Secourir</b>Position latérale de sécurité (PLS). Comprime les plaies qui saignent.</div></div>
<p><a href="#outils-urgence">Numéros d'urgence du Togo</a></p>
</article>

<article class="ch" id="cours-assurance" data-part="E · Assurance" data-title="L'assurance automobile">
<header><div><p class="eyebrow">Partie E</p><h2>L'assurance automobile</h2></div></header>
<p>L'assurance est obligatoire pour tout véhicule à moteur qui circule.</p>
<div class="tbl"><table><thead><tr><th>Formule</th><th>Ce qu'elle couvre</th></tr></thead><tbody>
<tr><td><b>Responsabilité civile</b></td><td>Minimum obligatoire. Les dommages causés aux autres, jamais les tiens si tu es responsable.</td></tr>
<tr><td><b>Tiers collision</b></td><td>Tes dégâts, seulement en cas de collision avec un tiers identifié.</td></tr>
<tr><td><b>Tous risques</b></td><td>Tous les dommages de ton véhicule, responsable ou non.</td></tr>
</tbody></table></div>
<div class="note red"><b>L'assureur ne paie jamais</b> tes amendes. Il peut annuler la garantie en cas d'alcool, de lunettes obligatoires non portées, de prime impayée ou de fausse déclaration.</div>
</article>

<article class="ch" id="cours-conduite" data-part="F · Conduite" data-title="Poste de conduite">
<header><div><p class="eyebrow">Partie F</p><h2>Le poste de conduite</h2></div></header>
<p>Boîte automatique : deux pédales. Boîte manuelle : trois pédales.</p>
<div class="mnemo"><div><b>A</b><strong>Embrayage</strong>, pied gauche. Enfoncé, on change de vitesse.</div><div><b>B</b><strong>Frein</strong>, pied droit. Il existe aussi le frein à main et le frein moteur.</div><div><b>C</b><strong>Accélérateur</strong>, pied droit.</div></div>
<p><b>Levier</b> : 1, 3, 5 en haut ; 2, 4 et R en bas. <b>Commodo gauche</b> : feux et clignotants (haut = droite). Un clignotant trop rapide signale une ampoule grillée. <b>Commodo droit</b> : essuie-glaces.</p>
<h4>S'installer</h4>
<p>Fais monter les passagers côté trottoir. Règle dans l'ordre : <b>siège, rétroviseurs, ceinture</b>, levier au point mort.</p>
<h4>La ceinture</h4>
<p>Obligatoire à l'avant et à l'arrière. Dès 15 km/h, tes bras ne peuvent plus retenir ton corps lors d'un choc. Siège auto pour les jeunes enfants.</p>
<h4>Démarrer : V.I.F.</h4>
<div class="mnemo"><div><b>V</b>Vitesse : embrayage à fond, première engagée.</div><div><b>I</b>Indicateur : clignotant gauche.</div><div><b>F</b>Frein à main desserré.</div></div>
<p><b>Mains</b> : 9h15 recommandé. <b>Angles morts</b> : tourne la tête avant tout changement de voie.</p>
</article>

<article class="ch" id="cours-distances" data-part="F · Conduite" data-title="Vitesse et distances">
<header><div><p class="eyebrow">Partie F</p><h2>Vitesse et distances</h2></div></header>
<p>Ralentis obligatoirement aux intersections, passages piétons, virages, sommets de côte, à l'entrée des villes et près des enfants, piétons, cyclistes et animaux.</p>
<div class="tbl"><table><thead><tr><th>Calcul</th><th>Règle</th><th>Exemple</th></tr></thead><tbody>
<tr><td>Distance en 1 seconde</td><td>Dizaines × 3</td><td>90 km/h → 27 m</td></tr>
<tr><td>Distance de sécurité</td><td>2 secondes minimum</td><td>« Un crocodile, deux crocodiles »</td></tr>
<tr><td>Distance d'arrêt (sec)</td><td>Dizaines × dizaines</td><td>90 km/h → 81 m</td></tr>
<tr><td>Freinage</td><td>Suit le carré de la vitesse</td><td>Vitesse × 2 → freinage × 4</td></tr>
<tr><td>Route mouillée</td><td>Freinage doublé</td><td>Charge lourde : plus long</td></tr>
</tbody></table></div>
<p><a href="#outils">Essaie le calculateur</a></p>
</article>

<article class="ch" id="cours-stationnement" data-part="F · Conduite" data-title="Arrêt et stationnement">
<header><div><p class="eyebrow">Partie F</p><h2>Arrêt et stationnement</h2></div></header>
<dl class="dl">
<div><dt>L'arrêt</dt><dd>Immobilisation brève, conducteur au volant ou tout près.</dd></div>
<div><dt>Le stationnement</dt><dd>Immobilisation prolongée, moteur coupé, conducteur éloigné.</dd></div>
<div><dt>Placement</dt><dd>En ville : le long du trottoir, dans le sens de la marche. Hors ville : sur l'accotement.</dd></div>
<div><dt>La nuit</dt><dd>Feux de position si tu empiètes sur la chaussée ou si la rue est mal éclairée.</dd></div>
<div><dt>Abusif</dt><dd>Plus de 7 jours au même endroit : risque de fourrière.</dd></div>
</dl>
<h4>Interdits</h4>
<p>Intersections, virages, sommets de côte, passages à niveau, trottoirs, passages piétons, pistes cyclables, couloirs de bus, ponts et tunnels.</p>
<h4>Se garer</h4>
<div class="grid g3"><div class="card soft"><b>En créneau</b><p>Parallèle au trottoir.</p></div><div class="card soft"><b>En bataille</b><p>À 90°, de préférence en marche arrière.</p></div><div class="card soft"><b>En épi</b><p>En diagonale.</p></div></div>
</article>

<article class="ch" id="cours-mecanique" data-part="G · Mécanique" data-title="Mécanique automobile">
<header><div><p class="eyebrow">Partie G</p><h2>Mécanique automobile</h2></div></header>
<p>Trois grands ensembles : <b>la carrosserie</b>, <b>le châssis</b> (le squelette) et <b>le moteur</b>.</p>
<h4>Le cycle à quatre temps</h4>
<div class="grid g4"><div class="card soft"><b>1 · Admission</b><p>Le piston aspire air + carburant.</p></div><div class="card soft"><b>2 · Compression</b><p>Le piston remonte et comprime.</p></div><div class="card" style="border:2px solid var(--ink)"><b>3 · Explosion</b><p>L'étincelle enflamme : le seul temps moteur.</p></div><div class="card soft"><b>4 · Échappement</b><p>Les gaz brûlés sont chassés.</p></div></div>
<h4>Les quatre circuits</h4>
<dl class="dl">
<div><dt>Alimentation</dt><dd>Réservoir → pompe → filtre → carburateur ou injection → moteur.</dd></div>
<div><dt>Refroidissement</dt><dd>Garde le moteur vers 90 °C grâce à la pompe à eau et au radiateur.</dd></div>
<div><dt>Électricité</dt><dd>Alternateur et batterie 12 V ; la bobine monte à 15 000–25 000 V pour les bougies.</dd></div>
<div><dt>Graissage</dt><dd>La pompe à huile lubrifie les pièces mobiles à travers le filtre.</dd></div>
</dl>
<h4>Les huiles</h4>
<p>Vidange et filtre <b>tous les 5 000 km</b>.</p>
<div class="tbl"><table><thead><tr><th>Norme</th><th>Usage</th></tr></thead><tbody>
<tr><td><b>SAE 90</b></td><td>Boîtes de vitesses manuelles, ponts arrière.</td></tr>
<tr><td><b>SAE 30 / 40</b></td><td>Moteurs essence de voitures légères.</td></tr>
<tr><td><b>SAE 50</b></td><td>Moteurs diesel lourds, camions.</td></tr>
<tr><td><b>SAE 10</b></td><td>Direction assistée, freinage.</td></tr>
</tbody></table></div>
</article>

<article class="ch" id="cours-tableau" data-part="G · Mécanique" data-title="Contrôles et tableau de bord">
<header><div><p class="eyebrow">Partie G</p><h2>Contrôles et tableau de bord</h2></div></header>
<p>Chaque matin, vérifie 12 points. <a href="#outils-check">Ouvrir la check-list</a></p>
<h4>Lot de bord</h4>
<p>Cric, clé démonte-roue, roue de secours, tournevis, extincteur, trousse de secours, triangle.</p>
<h4>Documents de bord</h4>
<p>Carte grise, attestation d'assurance, permis de la bonne catégorie, pièce d'identité.</p>
<h4>Voyants</h4>
<div class="tbl"><table><thead><tr><th>Voyant</th><th>Signification</th><th>Action</th></tr></thead><tbody>
<tr><td><b>Frein à main</b></td><td>Levier engagé.</td><td>Le desserrer.</td></tr>
<tr><td><b style="color:var(--red)">Alerte freinage</b></td><td>Liquide de frein critique.</td><td><b>Arrêt immédiat</b>, faire remorquer.</td></tr>
<tr><td><b>Carburant</b></td><td>Réserve atteinte.</td><td>Station la plus proche.</td></tr>
</tbody></table></div>
</article>

</div></div>
</section>

<section class="page" data-page="panneaux" hidden>
${HEAD("Révision", "Les panneaux", "Les principaux panneaux du code, classés par famille. Passe en mode révision : le nom est caché, touche le panneau pour vérifier ta réponse.")}
<div class="wrap sec">
<div class="ptools">
<div class="pfilters" id="sd-pf" role="tablist" aria-label="Familles de panneaux"></div>
<div class="psearch"><label for="sd-pq" class="sr">Chercher un panneau</label><input id="sd-pq" type="search" placeholder="Chercher : stop, virage, parking…"></div>
<label class="ptoggle" for="sd-prev"><input type="checkbox" id="sd-prev"><span>Mode révision</span></label>
</div>
<p class="phint" id="sd-phint"></p>
<div class="pgrid" id="sd-pgrid"></div>
<p class="pempty" id="sd-pempty" hidden>Aucun panneau ne correspond. Essaie un autre mot.</p>
<p class="pnote">Dessins simplifiés à des fins de révision. Les panneaux réels peuvent varier légèrement.</p>
</div>
</section>

<section class="page" data-page="quiz" hidden>
${HEAD("Entraînement", "Le quiz SODAF", "Questions tirées du manuel, avec l'explication et le chapitre à relire. Objectif examen : 35 sur 40.")}
<div class="wrap sec"><a class="devlink" href="#devoirs"><b>Devoir de la semaine</b><span>Fais le devoir noté envoyé au moniteur →</span></a><p class="qbest" id="sd-qbest" hidden></p><div class="modes" id="sd-modes"><button data-n="10" class="on">Série rapide · 10</button><button data-n="20">Série moyenne · 20</button><button data-n="40">Examen blanc · 40</button></div><div class="quiz card" id="sd-quiz"></div></div>
</section>

<section class="page" data-page="devoirs" hidden>
${HEAD("Devoirs", "Le devoir de la semaine", "Un devoir après chaque cours de code en salle : 10 questions sur le thème du cours. Ton résultat part directement au moniteur, et la correction se fait au début du cours suivant.")}
<div class="wrap sec"><div id="sd-dev"></div></div>
</section>

<section class="page" data-page="outils" hidden>
${HEAD("Outils du conducteur", "Dans ta poche", "Les calculs du manuel, la vérification du matin et les numéros d'urgence.")}
<div class="wrap sec"><div class="card"><p class="eyebrow">Calculateur</p><h3 style="margin:10px 0 18px">Distance d'arrêt</h3><div class="calc">
<div><div class="speed"><span id="sd-spv">50</span> <small>km/h</small></div><label for="sd-speed" style="font-size:.9rem;color:var(--muted)">Choisis ta vitesse</label><input id="sd-speed" type="range" min="20" max="130" step="10" value="50"><p style="margin-top:12px;color:var(--muted)" id="sd-spText"></p></div>
<div class="bars">
<div><div class="lbl"><span>Route sèche</span><b id="sd-dDry"></b></div><div class="track"><i class="re" id="sd-bDryR"></i><i class="fr" id="sd-bDryF"></i></div></div>
<div><div class="lbl"><span>Route mouillée</span><b id="sd-dWet"></b></div><div class="track"><i class="re" id="sd-bWetR"></i><i class="frw" id="sd-bWetF"></i></div></div>
<div class="legend"><span style="--c:var(--yellow)">Réaction (1 s)</span><span style="--c:var(--green)">Freinage sec</span><span style="--c:var(--blue)">Freinage mouillé</span></div>
</div></div></div></div>
<div class="wrap sec" id="outils-check"><div class="card"><div class="sec-head" style="margin-bottom:14px"><div><p class="eyebrow">Avant de partir</p><h3 style="margin-top:10px">Vérification du matin · <span id="sd-ckCount">0</span>/12</h3></div><button class="btn btn-line btn-sm" id="sd-ckReset">Tout décocher</button></div><div class="check" id="sd-check"></div></div></div>
<div class="wrap sec" id="outils-urgence"><div class="sec-head"><div><p class="eyebrow">Urgences · Togo</p><h2>Les numéros qui sauvent</h2></div><p>En cas d'accident : Protéger, Alerter, Secourir.</p></div>
<div class="sos"><div><span>Police, depuis un portable</span><b>161</b><button data-copy="161">Copier</button></div><div><span>Police, depuis un fixe</span><b>117</b><button data-copy="117">Copier</button></div><div><span>Gendarmerie</span><b>172</b><button data-copy="172">Copier</button></div><div><span>Sapeurs-pompiers</span><b>118</b><button data-copy="118">Copier</button></div></div></div>
</section>




<section class="page" data-page="recu" hidden>
${HEAD("SODAF Auto-École", "Ton reçu de paiement", "Garde ce lien ou télécharge ton reçu en PDF. Pour toute question : secrétariat SODAF, +228 72 54 41 66.")}
<div class="wrap sec"><div class="rc-prev" id="sd-rcPub"></div><div class="rcacts" style="justify-content:center"><button class="btn btn-green" type="button" id="sd-rcPubDl" hidden>Télécharger mon reçu (PDF)</button><a class="btn btn-line" href="#accueil">Découvrir le site</a></div></div>
</section>

<section class="page" data-page="inscrire" hidden>
${HEAD("SODAF Auto-École", "Finalise ton inscription", "Choisis ta formule, complète tes informations, puis paie à l'agence ou par Mixx by Yas.")}
<div class="wrap sec"><div id="sd-insc" class="insc"></div></div>
</section>

<section class="page" data-page="equipe" hidden>
${HEAD("Équipe SODAF", "Espace équipe", "Réservé au personnel de l'auto-école : secrétariat et moniteur.")}
<div class="wrap sec">
<div id="sd-tmInstall" class="tm-install" hidden><div class="tm-install-ico">${LOGO("#FFFFFF", "mono")}</div><div><b>Installe SODAF Équipe sur ton téléphone</b><span id="sd-tmInstallTxt">Une icône sur l'écran d'accueil, comme une application : elle s'ouvre directement ici.</span></div><button class="btn btn-yellow btn-sm" type="button" id="sd-tmInstallBtn">Installer</button><button class="tm-install-x" type="button" id="sd-tmInstallX" aria-label="Masquer">×</button></div>
<div id="sd-teamLock" class="card lockcard">
<div class="lockico" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></div>
<h2 style="font-size:1.5rem">Connexion équipe SODAF</h2>
<p style="color:var(--muted);margin-top:8px">Réservé au secrétariat et au moniteur. Si tu es élève, tout ce qu'il te faut est dans les autres pages du site.</p>
<form id="sd-teamForm" class="tmlogin" novalidate><label for="sd-tmEmail" class="sr-only">E-mail</label><input id="sd-tmEmail" type="email" autocomplete="username" placeholder="Ton e-mail"><label for="sd-tmPw" class="sr-only">Mot de passe</label><input id="sd-tmPw" type="password" autocomplete="current-password" placeholder="Mot de passe"><button class="btn btn-green" type="submit" id="sd-tmGo">Se connecter</button></form>
<p id="sd-teamErr" style="color:var(--red);font-weight:600;margin-top:10px" hidden></p>
<a class="btn btn-line btn-sm" href="/" style="margin-top:16px">Retour au site</a>
</div>
<div id="sd-teamPanel" hidden>
<div class="tm-top"><div><p class="eyebrow" id="sd-tmRole">Espace équipe SODAF</p><h2 id="sd-tmHello">Bonjour</h2><p class="tm-today" id="sd-tmToday"></p></div><div class="tm-acc"><a class="tm-visio" id="sd-tmVisio" href="https://meet.google.com/new" target="_blank" rel="noopener" title="Ouvrir une visio Google Meet"><span class="tv-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="14" height="12" rx="3"/><path d="M16 10.5l5.2-3.2a.6.6 0 0 1 .8.5v8.4a.6.6 0 0 1-.8.5L16 13.5z"/></svg><i class="tv-live"></i></span><span class="tv-tx"><b>Visio</b><small>Google Meet</small></span></a><a class="tm-visio-inv" id="sd-tmVisioWa" target="_blank" rel="noopener" hidden>Inviter l'équipe</a><button class="linkbtn" type="button" id="sd-teamOut">Se déconnecter</button></div></div>
<div id="sd-tmToast" class="tm-toast" hidden></div>
<div class="tm-tabs" role="tablist" id="sd-tmTabs">
<button role="tab" data-t="dir" aria-selected="false" hidden><i class="tm-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg></i><b>Direction</b><small>Chiffres du mois, à surveiller</small></button>
<button role="tab" data-t="ger" aria-selected="false" hidden><i class="tm-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l2 2 4-4"/><path d="M4 5h16v11a2 2 0 0 1-2 2H9l-5 3z"/></svg></i><b>Gérance</b><small>Demandes, décisions, rapport</small><em class="tm-badge" id="sd-grTabBadge" hidden></em></button>
<button role="tab" data-t="msg" aria-selected="false"><i class="tm-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 10.5h7M8.5 14h4.5"/></svg></i><b>Messages</b><small>Canaux de l'équipe</small><em class="tm-badge" id="sd-msBadge" hidden></em></button>
<button role="tab" data-t="sec" aria-selected="true"><i class="tm-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v2h6V3M9 10h6M9 14h6M9 18h3"/></svg></i><b>Secrétariat</b><small>Inscriptions, paiements, réservations</small></button>
<button role="tab" data-t="mon" aria-selected="false"><i class="tm-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/><path d="M12 14.5V21M9.6 11.2 3.5 9.5M14.4 11.2l6.1-1.7"/></svg></i><b>Moniteur</b><small>Code en salle, conduite</small></button>
<button role="tab" data-t="docs" aria-selected="false"><i class="tm-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg></i><b>Documents</b><small>Carte, cachet, QR, affiches</small></button>
</div>
<div class="tm-pane" data-pane="sec" role="tabpanel">
<p class="tm-role">Accueil des élèves, inscriptions, paiements, réservations de conduite et messages WhatsApp.</p>
<div class="tm-subnav" id="sd-secNav" role="tablist">
<button data-s="eleves" aria-selected="true">Parcours élèves <span class="tm-count" id="sd-cntNew"></span></button>
<button data-s="conduite" aria-selected="false">Planning conduite</button>
<button data-s="paiements" aria-selected="false">Paiements et reçus</button>
<button data-s="devoirs" aria-selected="false">Devoirs</button>
<button class="tm-newins" type="button" id="sd-insNew"><span class="ni-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M19 8v6M16 11h6"/></svg></span><span class="ni-txt"><b>Nouvelle inscription</b><small>Client au bureau</small></span></button>
</div>
<div class="ins-ov" id="sd-insOv" hidden><form class="ins-box" id="sd-insForm" novalidate>
<div class="ins-hd"><div><p class="eyebrow" style="margin:0">Au bureau</p><h3>Nouvelle inscription</h3></div><button class="ins-x" type="button" id="sd-insX" aria-label="Fermer">×</button></div>
<fieldset class="ins-step"><legend><i>1</i>Le client</legend>
<div class="row2"><div class="field"><label for="sd-insN">Nom</label><input id="sd-insN" autocomplete="off" placeholder="ex. AGBEKO"></div><div class="field"><label for="sd-insP">Prénoms</label><input id="sd-insP" autocomplete="off" placeholder="ex. Yao Koffi"></div></div>
<div class="row2"><div class="field"><label for="sd-insT">Téléphone (WhatsApp)</label><div class="tel"><span>+228</span><input id="sd-insT" inputmode="numeric" maxlength="11" placeholder="90 00 00 00"></div></div><div class="field"><label for="sd-insQ">Quartier</label><input id="sd-insQ" autocomplete="off" placeholder="ex. Bè, Agoè, Tokoin"></div></div>
<div class="row2"><div class="field"><label for="sd-insFo">Formation qui l'intéresse</label><select id="sd-insFo"><option>Permis B</option><option>Permis A</option><option>Pack A + B</option><option>Remise à niveau</option><option>Formation entreprise</option></select></div><div class="field"><label for="sd-insSrc">Comment il nous a connus</label><select id="sd-insSrc"><option value="">— Choisir —</option><option value="agence">Venu à l'agence (passage, enseigne)</option><option value="appel">Appel téléphonique</option><option value="whatsapp">WhatsApp</option><option value="bouche">Bouche-à-oreille (ami, famille, ancien élève)</option><option value="reseaux">Facebook / TikTok / Instagram</option><option value="affiche">Affiche, flyer, QR code</option><option value="entreprise">Entreprise (chauffeur envoyé)</option><option value="autre">Autre</option></select></div></div>
</fieldset>
<div class="ins-ft"><p class="ins-sum">Il recevra sur WhatsApp le lien pour finaliser son inscription lui-même : choix de la formule, puis paiement à l'agence ou par Mixx.</p><span class="tm-err" id="sd-insErr"></span><button class="btn btn-green" type="submit" id="sd-insGo">Enregistrer</button></div>
<div class="ins-done" id="sd-insDone" hidden></div>
</form></div>
<section class="tm-sec" data-s="eleves">
<div class="pc-search"><label class="pc-sbox"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="sd-pcQ" type="search" placeholder="Rechercher un client : N° client (SO12), téléphone ou nom" autocomplete="off"></label></div>
<div class="pc" id="sd-pc">
<div class="pc-list">
<div class="pc-stages" id="sd-pcStages" role="tablist"><button type="button" data-st="accueil">Accueil <em></em></button><button type="button" data-st="appels">Appels <em></em></button><button type="button" data-st="dossier">Paiement en attente <em></em></button><button type="button" data-st="formation">En formation <em></em></button><button type="button" data-st="examen">Dépôt d'examen <em></em></button><button type="button" data-st="archives">Archivés <em></em></button></div>
<form id="sd-elAdd" class="card tm-form" hidden novalidate>
<p class="eyebrow" style="margin:0 0 4px">Nouveau client</p>
<div class="row2"><div class="field"><label for="sd-elN">Nom</label><input id="sd-elN" autocomplete="off" placeholder="ex. AGBEKO"></div><div class="field"><label for="sd-elP">Prénoms</label><input id="sd-elP" autocomplete="off" placeholder="ex. Yao Koffi"></div></div>
<div class="field"><label for="sd-elT">Téléphone</label><div class="tel"><span>+228</span><input id="sd-elT" inputmode="numeric" maxlength="11" placeholder="90 00 00 00"></div></div>
<div class="field"><label for="sd-elQ">Quartier</label><input id="sd-elQ" autocomplete="off" placeholder="ex. Bè, Agoè, Tokoin"></div>
<div class="field"><label for="sd-elSrc">Comment il nous a connus</label><select id="sd-elSrc"><option value="">— Choisir —</option><option value="agence">Venu à l'agence (passage, enseigne)</option><option value="appel">Appel téléphonique</option><option value="whatsapp">WhatsApp</option><option value="bouche">Bouche-à-oreille (ami, famille, ancien élève)</option><option value="reseaux">Facebook / TikTok / Instagram</option><option value="affiche">Affiche, flyer, QR code</option><option value="entreprise">Entreprise (chauffeur envoyé)</option><option value="autre">Autre</option></select></div>
<div class="field"><label for="sd-elFo">Formation</label><select id="sd-elFo"><option>Permis B</option><option>Permis A</option><option>Pack A + B</option><option>Remise à niveau</option><option>Formation entreprise</option></select></div>
<div class="field"><label for="sd-elSt">Étape</label><select id="sd-elSt"><option value="Inscrit">Il paie maintenant (reçu)</option><option value="Contacté">Renseigné, à rappeler</option></select></div>
<div class="tm-formact"><button class="btn btn-green btn-sm" type="submit">Enregistrer</button><button class="linkbtn" type="button" id="sd-elCancel">Annuler</button><span class="tm-err" id="sd-elErr"></span></div>
</form>
<div id="sd-pcList" class="pc-items"></div>
</div>
<div class="pc-detail" id="sd-pcDetail"></div>
</div>
</section>
<section class="tm-sec" data-s="conduite" hidden>
<div class="tm-bar tm-day-nav"><button class="btn btn-line btn-sm" type="button" id="sd-cdPrev">‹ Veille</button><b id="sd-cdDay"></b><button class="btn btn-line btn-sm" type="button" id="sd-cdNext">Lendemain ›</button><button class="linkbtn" type="button" id="sd-cdToday">Aujourd'hui</button></div>
<div id="sd-cdClosed" class="tm-closed" hidden></div>
<form id="sd-cdCloseForm" class="card tm-form" hidden novalidate><div class="field"><label for="sd-cdWhy">Pourquoi ce jour est fermé ?</label><input id="sd-cdWhy" maxlength="60" placeholder="Ex. Jour férié, Tabaski, panne de voiture, moniteur malade"></div><p class="tm-note" style="margin:0 0 12px!important">Toutes les séances de conduite et le cours de code de ce jour passent en « Annulé ». Les élèves déjà réservés s'affichent ensuite avec un bouton WhatsApp pour les prévenir.</p><div class="tm-formact"><button class="btn btn-green btn-sm" type="submit">Fermer ce jour</button><button class="linkbtn" type="button" id="sd-cdCloseCancel">Annuler</button></div></form>
<div id="sd-cdWarn" class="tm-warn"></div>
<div id="sd-cdList" class="tm-list"></div>
<p class="tm-foot"><button class="linkbtn" type="button" id="sd-cdCloseBtn">Fermer ce jour (férié, fermeture exceptionnelle…)</button></p>
</section>
<section class="tm-sec" data-s="paiements" hidden>
<div class="tm-stats" id="sd-pyStats"></div>
<div class="tm-sub" style="margin-top:22px"><div><p class="eyebrow">Ce mois-ci</p><h3>Reçus faits</h3></div></div>
<div id="sd-pyList" class="tm-list"></div>
<div id="sd-pyLate"></div>
<div class="rcbox" id="equipe-recu"><div class="tm-sub"><div><p class="eyebrow">Après chaque paiement</p><h3>Faire un reçu</h3></div><p>Remplis après chaque paiement : le reçu PDF est créé aux couleurs SODAF avec le cachet, enregistré dans la base, et tu l'envoies à l'élève sur WhatsApp.</p></div>
<form class="card rcform" id="sd-rcForm" novalidate>
<input type="hidden" id="sd-rcEid" name="eleve_id"><div class="row2"><div class="field"><label for="sd-rcName">Nom et prénom de l'élève</label><input id="sd-rcName" name="eleve" list="sd-rcEleves" autocomplete="off" placeholder="Tape ou choisis un élève"><datalist id="sd-rcEleves"></datalist></div><div class="field"><label for="sd-rcTel">Téléphone / WhatsApp (facultatif)</label><div class="tel"><span>+228</span><input id="sd-rcTel" name="tel" inputmode="numeric" maxlength="11" placeholder="90 00 00 00"></div></div></div>
<div class="field"><label for="sd-rcF">1. Quelle formation a-t-il choisie ?</label><select id="sd-rcF" name="formation"><option data-p="55000">Formation complète (permis B)</option><option data-p="75000">Formation accélérée 2 mois (permis B)</option><option data-p="80000">Formation accélérée 1 mois (permis B)</option><option data-p="35000">Formule courte (permis B)</option><option data-p="25000">Formation théorique seule</option><option data-p="30000">Permis A (moto)</option><option data-p="80000">Pack A + B (moto et voiture)</option><option data-p="20000">Remise à niveau</option><option data-p="0">Formation entreprise (sur devis)</option><option data-p="0">Hors formation (séance ou frais)</option></select></div>
<fieldset class="field rcmotifs" id="sd-rcMotifs"><legend>2. Qu'est-ce qu'il paie aujourd'hui ?</legend>
<label class="rcm" data-k="ins-half"><input type="radio" name="motif" value="ins-half" checked><span><b>Il s'inscrit et paie la moitié</b><small>Droit d'inscription (5&nbsp;000&nbsp;F) + 1re moitié de la formation</small></span><em data-amt></em></label>
<label class="rcm" data-k="ins-full"><input type="radio" name="motif" value="ins-full"><span><b>Il s'inscrit et paie tout</b><small>Droit d'inscription (5&nbsp;000&nbsp;F) + toute la formation</small></span><em data-amt></em></label>
<label class="rcm" data-k="rest"><input type="radio" name="motif" value="rest"><span><b>Il paie le reste</b><small>2e moitié de la formation, avant sa 1re séance de conduite</small></span><em data-amt></em></label>
<label class="rcm" data-k="examen"><input type="radio" name="motif" value="examen"><span><b>Le dépôt pour l'examen d'État</b><small>Inscription à l'examen final, 30&nbsp;000&nbsp;F</small></span><em data-amt></em></label>
<label class="rcm" data-k="seance"><input type="radio" name="motif" value="seance"><span><b>Une séance de conduite en plus</b><small>1 h, 5&nbsp;000&nbsp;F la séance</small></span><em data-amt></em></label>
<label class="rcm" data-k="autre"><input type="radio" name="motif" value="autre"><span><b>Autre paiement</b><small>Tu écris toi-même le motif et le montant</small></span><em></em></label>
<input id="sd-rcOther" placeholder="Motif, ex. Droit d'inscription seul, 2 séances en plus…" hidden>
</fieldset>
<div class="row2"><div class="field"><label for="sd-rcAmt">3. Montant reçu (F CFA), modifiable</label><input id="sd-rcAmt" name="montant" type="number" inputmode="numeric" min="0" step="500"></div><div class="field" id="sd-rcRestBox"><label for="sd-rcRest">Reste à payer (F CFA)</label><input id="sd-rcRest" name="reste" type="number" inputmode="numeric" min="0" step="500"></div></div>
<fieldset class="field rcmodes"><legend>4. Comment a-t-il payé ?</legend><label class="rcmode"><input type="radio" name="mode" value="Espèces" checked><span>Espèces</span></label><label class="rcmode"><input type="radio" name="mode" value="Mixx by Yas (T-Money)"><span>Mixx by Yas (T-Money)</span></label></fieldset>
<div class="field"><label for="sd-rcNote">Note (facultatif)</label><input id="sd-rcNote" name="note" placeholder="Ex. Référence T-Money, séance du 12 octobre…"></div>
<p id="sd-rcErr" style="color:var(--red);font-weight:600;margin:4px 0 10px" hidden>Indique le nom de l'élève, un montant, et un numéro à 8 chiffres (ou laisse le téléphone vide).</p>
<button class="btn btn-green" type="submit">Créer le reçu</button>
</form>
<div id="sd-rcOut" class="rcout" hidden>
<div class="rcacts"><span id="sd-rcStatus" class="devsent"></span><span id="sd-rcSaved" class="devsent">Enregistrement…</span></div>
<div class="rc-prev" id="sd-rcPreview"></div>
<div class="rcacts"><a class="btn btn-wa" id="sd-rcWa" target="_blank" rel="noopener" href="#">Envoyer sur WhatsApp à l'élève</a><button class="linkbtn" type="button" id="sd-rcShare">Partager le PDF</button><button class="linkbtn" type="button" id="sd-rcDl">Télécharger le PDF</button><button class="linkbtn" type="button" id="sd-rcNew">Faire un autre reçu</button></div>
<p class="rchelp" id="sd-rcHelp">Le bouton vert ouvre directement la discussion WhatsApp de l'élève, avec le message et le lien de son reçu : il n'y a plus qu'à appuyer sur Envoyer.</p>
</div></div>

</section>
<section class="tm-sec" data-s="devoirs" hidden>
<div class="tm-bar"><label for="sd-dvWeek" class="sr-only">Semaine</label><select id="sd-dvWeek"></select></div>
<div class="tm-stats" id="sd-dvStats"></div>
<div class="tm-sub"><div><p class="eyebrow">Fin de semaine</p><h3>Message pour le groupe WhatsApp</h3></div></div>
<textarea id="sd-dvMsg" class="tm-msg" readonly rows="10"></textarea>
<div class="tm-formact"><button class="btn btn-green btn-sm" type="button" id="sd-dvCopy">Copier le message</button><a class="btn btn-wa btn-sm" id="sd-dvWa" target="_blank" rel="noopener" href="#">Ouvrir WhatsApp avec le message</a></div>
<div id="sd-dvRes" class="tm-list" style="margin-top:18px"></div>
</section>
<div class="tm-sub"><div><p class="eyebrow">Mode d'emploi</p><h3>Les gestes du secrétariat</h3></div></div>
<div class="grid g2 tm-guides">
<div class="card soft"><p class="eyebrow">Le parcours d'un élève</p><ol class="teamsteps"><li><b>Accueil</b> : <b>Envoyer l'accueil</b> (WhatsApp). Le dossier passe tout seul en zone d'appel.</li><li><b>Appels</b> : appelle avec le script. Pas de réponse : choisis quand rappeler. À 4 tentatives : relance WhatsApp ou <b>Injoignable</b>.</li><li>Il est intéressé : <b>Envoyer le lien d'inscription</b> (en haut). Le dossier passe tout seul en paiement en attente.</li><li><b>Paiement en attente</b> : Mixx à vérifier sur le téléphone de l'agence, ou paiement à l'agence. Sans nouvelles : relance tous les 5 jours (4 au maximum).</li><li><b>Formation payée ? Faire le reçu</b> : le reçu s'ouvre déjà rempli, envoie-le. L'élève passe <b>En formation</b> et reçoit tout seul une place dans un groupe de code (6 places). Touche <b>Envoyer ses horaires</b>. Groupes complets : il passe en liste d'attente et il est placé tout seul dès qu'une place se libère (pour aller plus vite, ouvre un groupe dans « Gérer les groupes »).</li><li><b>Solde</b> : à payer dans les 2 semaines après l'inscription (c'est écrit sur son reçu). À 7 jours, il passe dans « Rappel de paiement » (en rouge, tout en haut) : le bouton du rappel s'active ce jour-là, envoie-le ; l'élève retourne ensuite dans son groupe. À 14 jours sans paiement, sa place au code est suspendue toute seule jusqu'au règlement.</li><li>Formation terminée : <b>Passer à l'examen</b>, message des papiers. Dossier complet + 30 000 F : reçu.</li><li><b>Dépôt d'examen</b> : coche le lot, imprime le bordereau, fais-le signer, puis <b>Lot déposé</b>. Au résultat : <b>Permis obtenu</b> ou <b>À repasser</b> (archivé « Permis échoué »).</li></ol></div>
<div class="card soft"><p class="eyebrow">Réserver une séance de conduite</p><ol class="teamsteps"><li>Seuls les élèves dont la formation est soldée peuvent être réservés : les autres sont grisés. S'il doit encore payer : fiche de l'élève → <b>Rappel du solde</b>.</li><li><b>Planning conduite</b> : choisis le jour, puis l'élève sur un créneau libre.</li><li>Le choix est enregistré tout de suite. Touche <b>Prévenir l'élève</b> : le message WhatsApp avec le jour et l'heure est prêt. La veille, touche <b>Rappel</b>.</li></ol></div>
<div class="card soft"><p class="eyebrow">Fin de semaine : résultats des devoirs</p><ol class="teamsteps"><li>Onglet <b>Devoirs</b> : le message de la semaine (les 2 devoirs) est déjà écrit.</li><li>Touche <b>Ouvrir WhatsApp avec le message</b> et choisis le groupe.</li></ol></div>
<div class="card soft"><p class="eyebrow">Règles</p><ol class="teamsteps"><li>On ne supprime rien : une séance annulée passe en <b>Annulé</b>, un dossier qui s'arrête va dans <b>Archivés</b> avec son motif, un reçu faux se fait <b>Annuler</b> (avec la raison) puis on refait le bon.</li><li>Erreur de nom ou de numéro : <b>Modifier</b> sur la fiche de l'élève.</li><li>Jour férié ou fermeture : <b>Planning conduite</b> → le jour → « Fermer ce jour », puis <b>Prévenir</b> chaque élève.</li><li>Les créneaux du mois suivant se créent tout seuls le 24.</li></ol></div>
</div></div>
<div class="tm-pane" data-pane="ger" role="tabpanel" hidden>
<p class="tm-role" id="sd-grRole"></p>
<div class="card gr-card" id="sd-gr" hidden><p class="eyebrow">Gérance</p><h3 class="tm-h3" id="sd-grTitre">Gérante et direction</h3><p class="tm-note" id="sd-grIntro" style="margin:0 0 10px!important"></p>
<div class="gr-tabs" role="tablist"><button type="button" role="tab" data-gr="demandes" aria-selected="true">Demandes d'accord<em class="gr-badge" id="sd-grBDem" hidden></em></button><button type="button" role="tab" data-gr="decisions" aria-selected="false">Décisions<em class="gr-badge" id="sd-grBDec" hidden></em></button><button type="button" role="tab" data-gr="rapports" aria-selected="false">Rapport de la semaine<em class="gr-badge" id="sd-grBRap" hidden></em></button></div>
<div class="gr-pane" data-grp="demandes"><form id="sd-grDemForm" class="gr-form" hidden novalidate><div class="row2"><div class="field"><label for="sd-grDemType">Pour quoi ?</label><select id="sd-grDemType"><option>Remise</option><option>Annulation de reçu</option><option>Report de paiement</option><option>Dépense</option><option>Autre</option></select></div><div class="field"><label for="sd-grDemMt">Montant (F, si besoin)</label><input id="sd-grDemMt" inputmode="numeric" autocomplete="off" placeholder="ex. 5 000"></div></div><div class="field gr-elf"><label for="sd-grDemElQ">Élève concerné (si besoin)</label><div class="gr-elbox"><input id="sd-grDemElQ" type="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Tape un nom ou un numéro (SO12)" role="combobox" aria-expanded="false" aria-controls="sd-grDemElL" aria-autocomplete="list"><input type="hidden" id="sd-grDemEl" value=""><div class="gr-elsel" id="sd-grDemElSel" hidden></div><div class="gr-ell" id="sd-grDemElL" role="listbox" hidden></div></div></div><div class="field"><label for="sd-grDemTx">Explique en quelques mots</label><textarea id="sd-grDemTx" rows="2" maxlength="600" placeholder="ex. Deux frères inscrits ensemble, je propose 5 000 F de remise au second."></textarea></div><button type="submit" class="btn btn-sm btn-green">Envoyer à la direction</button></form><div id="sd-grDemList" class="gr-list"></div></div>
<div class="gr-pane" data-grp="decisions" hidden><form id="sd-grDecForm" class="gr-form" hidden novalidate><div class="row2"><div class="field"><label for="sd-grDecCat">Sujet</label><select id="sd-grDecCat"><option>Élèves</option><option>Argent</option><option>Planning</option><option>Équipe</option><option>Autre</option></select></div><div class="field gr-grow"><label for="sd-grDecTx">Ce que j'ai décidé</label><textarea id="sd-grDecTx" rows="2" maxlength="600" placeholder="ex. Séance de samedi 7 h 30 déplacée à 8 h 45, le moniteur est prévenu."></textarea></div></div><button type="submit" class="btn btn-sm btn-green">Noter la décision</button></form><div id="sd-grDecList" class="gr-list"></div></div>
<div class="gr-pane" data-grp="rapports" hidden><div id="sd-grRapNew" hidden><p class="gr-sem" id="sd-grRapSem"></p><div class="tm-stats tm-dr" id="sd-grRapChiffres"></div><div class="field"><label for="sd-grRapTx">Mes remarques pour la direction</label><textarea id="sd-grRapTx" rows="4" maxlength="3000" placeholder="Ce qui s'est bien passé, les problèmes, ce qu'il faudrait changer, ce dont j'ai besoin."></textarea></div><button type="button" class="btn btn-sm btn-green" id="sd-grRapSend">Envoyer le rapport</button></div><div id="sd-grRapList" class="gr-list"></div></div>
</div>
</div>
<div class="tm-pane" data-pane="dir" role="tabpanel" hidden>
<p class="tm-role">Vue d'ensemble de l'auto-école, mise à jour à chaque ouverture. Visible seulement par la direction.</p>
<div class="tm-bar"><b id="sd-drMonth" class="tm-drmonth"></b><button class="linkbtn" type="button" id="sd-drReload">Actualiser</button></div>
<div class="tm-stats tm-dr" id="sd-drStats"></div>
<div class="grid g2 tm-mon" style="margin-top:18px">
<div class="card"><p class="eyebrow">À surveiller</p><h3 class="tm-h3">Ce qui attend une action</h3><div id="sd-drWatch" class="tm-list"></div></div>
<div class="card"><p class="eyebrow">Activité</p><h3 class="tm-h3">Derniers mouvements</h3><div id="sd-drFeed" class="tm-list"></div></div>
</div>
<div class="card" style="margin-top:16px"><p class="eyebrow">Examen</p><h3 class="tm-h3">Dossiers d'examen et résultats</h3><div id="sd-drExam" class="tm-stats tm-dr tm-drex"></div></div>
<div class="card" style="margin-top:16px"><p class="eyebrow">Ce mois-ci</p><h3 class="tm-h3">D'où viennent les nouveaux clients</h3><div id="sd-drSrc" class="tm-src"></div></div>
<div class="card" style="margin-top:16px"><p class="eyebrow">6 derniers mois</p><h3 class="tm-h3">Inscriptions et encaissements</h3><div id="sd-drMonths" class="tm-months"></div></div>
<div class="card" style="margin-top:16px" id="sd-drSec"><p class="eyebrow">Sécurité</p><h3 class="tm-h3">Comptes de l'équipe</h3><p class="tm-note" style="margin:0 0 10px!important">Un compte désactivé ne voit plus rien, tout de suite, sur tous ses appareils. Son historique (reçus, messages) est gardé. Tu reçois une notification quand un compte se connecte depuis un appareil jamais vu, avec le pays et la ville (approximatifs, d'après l'adresse internet) ; chaque appareil se déconnecte seul après 3 jours sans utiliser l'application.</p><div id="sd-drComptes" class="sc-list"></div><div class="sc-add"><button type="button" class="btn btn-sm btn-line" id="sd-cptAddBtn">Ajouter un compte</button><form id="sd-cptAdd" class="sc-form" hidden novalidate><div class="row2"><div class="field"><label for="sd-cptAddRole">Rôle</label><select id="sd-cptAddRole"><option value="secretariat">Secrétariat</option><option value="moniteur">Moniteur</option><option value="gerant">Gérante</option><option value="admin">Direction</option></select></div><div class="field"><label for="sd-cptAddMail">Prénom ou adresse</label><input id="sd-cptAddMail" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="ex. awa"><small class="sc-apercu" data-for="sd-cptAddMail"></small></div></div><div class="field"><label for="sd-cptAddPw">Mot de passe (6 caractères au moins)</label><input id="sd-cptAddPw" type="password" autocomplete="new-password"></div><div class="sc-fbtn"><button type="submit" class="btn btn-sm btn-green">Créer le compte</button><button type="button" class="btn btn-sm btn-line" data-annul="add">Annuler</button></div></form></div><p class="tm-note sc-aide">Pour changer de personne sur un compte : <b>Modifier</b>, tape son prénom et un nouveau mot de passe. Le compte garde tout son historique, l'ancien mot de passe ne marche plus et ses autres appareils sont déconnectés. Les comptes ne se suppriment pas : on change l'adresse, ou on désactive.</p><h4 class="sc-h">Dernières connexions</h4><div id="sd-drCx" class="tm-list"></div></div>
</div>
<div class="tm-pane" data-pane="mon" role="tabpanel" hidden>
<p class="tm-role">Cours de code en salle, séances de conduite et progression des élèves.</p>
<div class="tm-week card"><div class="tm-wk-head"><div><p class="eyebrow">Cette semaine</p><h3 id="sd-tmTheme">Thème</h3></div><div class="mc-launch"><a class="mc-cta" href="#classe-lecon"><i aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="13" rx="2"/><path d="M12 16v4M8 21h8"/><path d="M10 7.5l4 2.5-4 2.5z" fill="currentColor"/></svg></i><span><b>Mode classe</b><small id="sd-mcCtaSub">Projeter le cours du jour au tableau</small></span></a><div class="mc-quick" id="sd-mcQuick"><a href="#classe-lecon">Leçon</a><a href="#classe-devoir">Correction du devoir</a><a href="#classe-quiz">Quiz</a></div></div></div>
<div class="tm-days" id="sd-tmDays"></div></div>
<details class="card tm-prog" id="sd-tmProgBox"><summary><span><b>Programme du code en salle</b><small>12 cours en 6 semaines, puis on recommence</small></span><em>Voir le programme</em></summary><div id="sd-tmProg"></div></details>
<div class="grid g2 tm-mon">
<div class="card" id="sd-mcCode"><p class="eyebrow">Cours de code</p><h3 class="tm-h3" id="sd-mcTitle">Chargement…</h3><div id="sd-mcBody"></div></div>
<div class="card" id="sd-mcDrive"><p class="eyebrow">Conduite</p><h3 class="tm-h3">Mes séances d'aujourd'hui</h3><div id="sd-mcList" class="tm-list"></div></div>
</div>
<div class="card tm-mnplan" id="sd-mnPlan" style="margin-top:16px"><p class="eyebrow">Planning conduite</p><h3 class="tm-h3">Réserver une séance</h3><p class="tm-note" style="margin:0 0 12px!important">À la fin d'une séance, regarde les créneaux libres avec l'élève et mets-le sur le prochain. La secrétaire voit la réservation tout de suite. Un élève qui n'a pas soldé sa formation ne peut pas être réservé.</p><div id="sd-mnPlanSlot"></div></div>
<div class="teamgrid" style="margin-top:16px">
<a class="card teamtile hl" href="#classe"><b>Mode classe</b><span>Projette les leçons, le devoir, le quiz, les panneaux et les carrefours en salle.</span><em>Lancer la projection →</em></a>
<a class="card teamtile" href="#devoirs"><b>Devoir de la semaine</b><span>Ce que font les élèves sur le site cette semaine.</span><em>Voir le devoir →</em></a>
</div>
<div class="tm-sub"><div><p class="eyebrow">Mode d'emploi</p><h3>Les gestes du moniteur</h3></div></div>
<div class="grid g2 tm-guides">
<div class="card soft"><p class="eyebrow">Après chaque cours de code</p><ol class="teamsteps"><li>Au début du cours, ouvre <b>Cours de code</b> : le programme du jour s'affiche.</li><li>Fais l'appel : coche les élèves présents.</li><li>Touche <b>Valider les présences</b> : le cours compte comme fait.</li></ol></div>
<div class="card soft"><p class="eyebrow">Séances de conduite</p><ol class="teamsteps"><li>Le matin, regarde <b>Mes séances d'aujourd'hui</b>.</li><li>Avant de partir : vérification de la voiture (Outils → check-list du matin).</li><li>Après la séance : <b>Fait</b> ou <b>Absent</b>, et une courte note sur les progrès.</li><li>Avec l'élève, réserve sa prochaine séance dans <b>Réserver une séance</b>.</li></ol></div>
</div></div>
<div class="ms-vue" id="sd-msVue" role="dialog" aria-modal="true" aria-label="Photos de la conversation" hidden><div class="ms-vbar"><div class="ms-vtit"><b id="sd-msVueNom"></b><small id="sd-msVueInfo"></small></div><span class="ms-vcpt" id="sd-msVueCpt"></span><a class="ms-vdl" id="sd-msVueDl" href="#" target="_blank" rel="noopener">Télécharger</a><button type="button" class="ms-vx" id="sd-msVueX" aria-label="Fermer">×</button></div><div class="ms-vimg" id="sd-msVueZone"><button type="button" class="ms-vnav prev" id="sd-msVuePrev" aria-label="Photo précédente"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button><img id="sd-msVueImg" alt="" draggable="false"><button type="button" class="ms-vnav next" id="sd-msVueNext" aria-label="Photo suivante"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button></div></div>
<div class="mf-ov" id="sd-mfOv" hidden><div class="mf-box" id="sd-mfBox" role="dialog" aria-modal="true" aria-label="Fiche de l'élève"></div></div>
<div class="tm-pane" data-pane="msg" role="tabpanel" hidden>
<p class="tm-role">Les échanges de l'équipe. Le cadenas indique une conversation privée : seules les personnes nommées en haut de la conversation la lisent. Écris @ pour prévenir quelqu'un, SO12 pour ouvrir la fiche d'un élève, et le trombone (ou glisse le fichier dans la conversation) pour joindre une photo ou un document.</p>
<div class="ms-wrap card" id="sd-msWrap"><nav class="ms-canaux" id="sd-msCanaux" aria-label="Conversations"></nav><section class="ms-fil"><header class="ms-head"><button type="button" class="ms-back" id="sd-msBack" aria-label="Retour aux conversations"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button><div class="ms-hd" id="sd-msHead"></div></header><div class="ms-list" id="sd-msList" aria-live="polite"><p class="ms-vide">Chargement…</p></div><button type="button" class="ms-bas" id="sd-msBas" hidden></button><div class="ms-sug" id="sd-msSug" role="listbox" aria-label="Mentionner" hidden></div><div class="ms-pj" id="sd-msPj" hidden></div><div class="ms-rec" id="sd-msRec" hidden><i class="ms-recdot" aria-hidden="true"></i><b id="sd-msRecT">0:00</b><span>Enregistrement… Touche la flèche pour envoyer (avec ton texte ou ta @mention)</span><button type="button" class="linkbtn" id="sd-msRecX">Annuler</button></div><form class="ms-form" id="sd-msForm" novalidate><label class="ms-clip" title="Joindre une photo ou un fichier" aria-label="Joindre une photo ou un fichier"><input type="file" id="sd-msFile" multiple accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.4 11.1l-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/></svg></label><button type="button" class="ms-mic" id="sd-msMic" title="Message vocal" aria-label="Enregistrer un message vocal"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/></svg></button><textarea id="sd-msTxt" rows="1" maxlength="2000" placeholder="Message… (@ pour mentionner)" aria-label="Message"></textarea><button class="btn btn-green" id="sd-msSend" type="submit" aria-label="Envoyer"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg></button></form></section></div>
<div class="ms-notif" id="sd-msNotif"></div>
</div>
<div class="tm-pane" data-pane="docs" role="tabpanel" hidden>
<p class="tm-role">Supports de communication et documents officiels SODAF, à télécharger ou à envoyer à l'imprimeur.</p>
<div class="entdocs"><div class="tm-sub"><div><p class="eyebrow">Réservé à l'équipe</p><h3>Documents de l'entreprise</h3></div><p>Supports de communication SODAF à télécharger ou à envoyer à l'imprimeur. Slogan officiel : « L'art de conduire, la force de réussir. »</p></div>
<div class="entgrid">
<div class="card entdoc"><img src="/entreprise/apercu-carte.jpg" alt="Carte de visite SODAF, recto" loading="lazy"><div><b>Carte de visite</b><span>85 × 55 mm, recto verso. PDF avec 3 mm de fond perdu, à envoyer tel quel à l'imprimeur (papier 350 g mat).</span><div class="acts"><a class="btn btn-green btn-sm" href="/entreprise/carte-visite-sodaf-91x61mm-fond-perdu.pdf" download>PDF imprimeur</a><a class="btn btn-line btn-sm" href="/entreprise/carte-sodaf-recto-300dpi.png" download>Recto PNG</a><a class="btn btn-line btn-sm" href="/entreprise/carte-sodaf-verso-300dpi.png" download>Verso PNG</a></div></div></div>
<div class="card entdoc"><img src="/entreprise/apercu-affiche-qr.jpg" alt="Affiche du code QR SODAF" loading="lazy" class="tall"><div><b>Affiche du code QR</b><span>A4, « Scanne et découvre SODAF », avec le mode d'emploi iPhone et Android. Pour la vitrine et la salle de code.</span><div class="acts"><a class="btn btn-green btn-sm" href="/entreprise/affiche-qr-sodaf.pdf" download>Affiche A4 (PDF)</a></div></div></div>
<div class="card entdoc"><img src="/entreprise/apercu-qr.jpg" alt="Code QR vers autosodaf.com" loading="lazy" class="sq"><div><b>Code QR seul</b><span>Mène à autosodaf.com. Pour autocollants, voiture école, publications. Minimum 3 cm sur une carte, 15 cm sur une voiture.</span><div class="acts"><a class="btn btn-green btn-sm" href="/entreprise/qr-sodaf.png" download>Code QR (PNG)</a></div></div></div>
<div class="card entdoc"><img src="/entreprise/cachet-sodaf-bleu.png" alt="Cachet SODAF" loading="lazy" class="sq"><div><b>Cachet SODAF</b><span>Rond, 40 mm. Le PDF noir est pour le graveur qui fabrique le tampon ; la version bleue sert aux reçus et documents numériques.</span><div class="acts"><a class="btn btn-green btn-sm" href="/entreprise/cachet-sodaf-40mm-graveur.pdf" download>PDF graveur</a><a class="btn btn-line btn-sm" href="/entreprise/cachet-sodaf-noir-1200px.png" download>Noir PNG</a><a class="btn btn-line btn-sm" href="/entreprise/cachet-sodaf-bleu.png" download>Bleu PNG</a></div></div></div>
<div class="card entdoc"><img src="/entreprise/apercu-couverture.jpg" alt="Couverture WhatsApp Business SODAF" loading="lazy"><div><b>Couverture WhatsApp Business</b><span>Image décorative 16:9 sans texte, à mettre derrière la photo de profil.</span><div class="acts"><a class="btn btn-green btn-sm" href="/entreprise/couverture-whatsapp-sodaf.png" download>Image (PNG)</a></div></div></div>
<div class="card entdoc"><img src="/couverture-manuel.jpg" alt="Couverture du manuel de l'élève SODAF" loading="lazy" class="tall"><div><b>Manuel de l'élève conducteur</b><span>Manuel officiel SODAF, 34 pages : code de la route, secourisme, mécanique. À envoyer aux élèves sur WhatsApp ou à imprimer.</span><div class="acts"><a class="btn btn-green btn-sm" href="/entreprise/manuel-eleve-sodaf.pdf" download>PDF</a><a class="btn btn-line btn-sm" href="/entreprise/manuel-eleve-sodaf.pdf" target="_blank" rel="noopener">Ouvrir</a></div></div></div><div class="card entdoc"><img src="/entreprise/apercu-logo.jpg" alt="Logo SODAF" loading="lazy"><div><b>Logo SODAF</b><span>En noir, blanc et vert. PNG à fond transparent pour WhatsApp, Word et les réseaux ; SVG pour l'imprimeur (s'agrandit sans perte). Le kit contient aussi le grand S seul et la version « Powered by ADM Core ».</span><div class="acts"><a class="btn btn-green btn-sm" href="/entreprise/kit-logo-sodaf.zip" download>Tout le kit (.zip)</a><a class="btn btn-line btn-sm" href="/entreprise/logo/sodaf-nom-noir.png" download>PNG noir</a><a class="btn btn-line btn-sm" href="/entreprise/logo/sodaf-nom-blanc.png" download>PNG blanc</a><a class="btn btn-line btn-sm" href="/entreprise/logo/sodaf-nom-noir.svg" download>SVG</a></div></div></div><div class="card entdoc"><img src="/entreprise/apercu-icones.jpg" alt="Icônes SODAF" loading="lazy"><div><b>Icônes</b><span>Icône d'application et de profil (512 px), version ronde pour Android, icône iPhone et favicon du site. Idéal pour la photo de profil WhatsApp Business et Facebook.</span><div class="acts"><a class="btn btn-green btn-sm" href="/entreprise/logo/sodaf-icone-app-512.png" download>Icône 512 px</a><a class="btn btn-line btn-sm" href="/entreprise/logo/sodaf-icone-app-ronde-512.png" download>Ronde</a><a class="btn btn-line btn-sm" href="/entreprise/logo/sodaf-favicon.ico" download>Favicon</a></div></div></div><div class="card entdoc"><img src="/apercu-fiche.jpg" alt="Fiche de renseignement" loading="lazy" class="tall"><div><b>Fiche de renseignement</b><span>Formations, tarifs, dossier à fournir. Aussi visible par le public dans Documents.</span><div class="acts"><a class="btn btn-green btn-sm" href="/fiche-renseignement-sodaf.pdf" download>PDF</a></div></div></div>
<div class="card entdoc"><img src="/apercu-planning.jpg" alt="Planning de la semaine" loading="lazy"><div><b>Planning mural</b><span>Code en salle, créneaux de conduite et examen blanc. A4 paysage à afficher.</span><div class="acts"><a class="btn btn-green btn-sm" href="/planning-semaine-sodaf.pdf" download>PDF</a></div></div></div>
</div></div>
</div>
</div>
</div>
</section>

<section class="page" data-page="classe" hidden>
<div class="cls" id="sd-cls">
<div class="cls-top">
<div class="cls-brand">${LOGO("#14171C", "word")}<span>Mode classe</span></div>
<div class="cls-tabs" role="tablist" id="sd-clsTabs"><button role="tab" data-m="lecon" aria-selected="true">Leçon</button><button role="tab" data-m="quiz" aria-selected="false">Quiz</button><button role="tab" data-m="devoir" aria-selected="false">Devoir</button><button role="tab" data-m="panneaux" aria-selected="false">Panneaux</button><button role="tab" data-m="situations" aria-selected="false">Situations</button></div>
<label class="sr-only" for="sd-clsSel">Choix</label><select id="sd-clsSel"></select>
<span class="cls-count" id="sd-clsCount"></span>
<button class="btn btn-line btn-sm" type="button" id="sd-clsFs">Plein écran</button>
<a class="btn btn-line btn-sm" href="#accueil">Quitter</a>
</div>
<div class="cls-stage" id="sd-clsStageWrap"><div class="cls-zoom" id="sd-clsStage"></div></div>
<div class="cls-bot">
<button class="btn btn-line" type="button" id="sd-clsPrev">← Précédent</button>
<span class="cls-help">Flèches ← → pour avancer · Espace ou R pour montrer la réponse · F pour le plein écran</span>
<div style="display:flex;gap:10px"><button class="btn btn-yellow" type="button" id="sd-clsReveal" hidden>Montrer la réponse</button><button class="btn btn-green" type="button" id="sd-clsNext">Suivant →</button></div>
</div>
</div>
</section>

<section class="page" data-page="inscription" hidden>
${HEAD("Pré-inscription", "Rejoins SODAF", "Envoie ta demande en une minute : elle arrive directement au secrétariat, qui te recontacte pour fixer ton premier cours.")}
<div class="wrap sec"><div class="insc">
<form class="card" id="sd-form" novalidate>
<div class="row2"><div class="field"><label for="sd-fName">Nom</label><input id="sd-fName" autocomplete="family-name" maxlength="60" placeholder="Ex. AGBEKO"></div><div class="field"><label for="sd-fFirst">Prénoms</label><input id="sd-fFirst" autocomplete="given-name" maxlength="80" placeholder="Ex. Kossi Mawuli"></div></div>
<div class="row2"><div class="field"><label for="sd-fPhone">Téléphone / WhatsApp</label><div class="tel"><span>+228</span><input id="sd-fPhone" inputmode="numeric" maxlength="11" autocomplete="tel-national" placeholder="90 00 00 00"></div></div><div class="field"><label for="sd-fCity">Quartier</label><input id="sd-fCity" maxlength="80" placeholder="Ex. Bè, Adidogomé"></div></div>
<div class="field"><label for="sd-fCat">Formation</label><select id="sd-fCat"><option value="Permis B">Permis B (voiture)</option><option value="Permis A">Permis A (moto)</option><option value="Remise à niveau">Remise à niveau (déjà titulaire du permis)</option><option value="Pack A + B">Pack A + B (moto et voiture)</option><option value="Formation entreprise">Formation entreprise (chauffeurs)</option></select></div>
<div class="field"><label for="sd-fMsg">Message (facultatif)</label><textarea id="sd-fMsg" placeholder="Une question, une contrainte d'horaire…"></textarea></div>
<p id="sd-fErr" style="color:var(--red);font-weight:600;margin-bottom:10px" hidden>Indique ton nom, tes prénoms et ton numéro à 8 chiffres (après le +228).</p>
<button class="btn btn-green" type="submit" id="sd-send">Envoyer ma pré-inscription</button>
<div class="okbox" id="sd-ok" hidden>
<div class="okhead"><span class="okcheck" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><div><b>Pré-inscription envoyée !</b><span id="sd-okWhen"></span></div></div>
<p>Merci <span id="sd-okName"></span>, ta demande est bien arrivée au secrétariat SODAF. On te recontacte au <b id="sd-okPhone"></b> pour fixer ton premier cours.</p>
<dl class="okrecap" id="sd-okRecap"></dl>
<div class="okwa"><p><b>Tu veux aller plus vite ?</b> Écris-nous aussi sur WhatsApp, c'est facultatif.</p><a class="btn btn-wa btn-sm" id="sd-waLink" target="_blank" rel="noopener" href="${WA}">Écrire sur WhatsApp</a></div>
<button class="linkbtn" type="button" id="sd-again">Faire une autre pré-inscription</button>
</div>
<div class="failbox" id="sd-fail" hidden><b>L'envoi n'a pas abouti.</b><p>Vérifie ta connexion internet puis réessaie. Tu peux aussi envoyer ta demande directement sur WhatsApp.</p><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px"><button class="btn btn-green btn-sm" type="button" id="sd-retry">Réessayer</button><a class="btn btn-line btn-sm" id="sd-waFail" target="_blank" rel="noopener" href="${WA}">Envoyer sur WhatsApp</a></div></div>
</form>
<div style="display:flex;flex-direction:column;gap:18px;min-width:0">
<div class="card pat-dots"><p class="eyebrow">Secrétariat</p><p class="bignum">72 54 41 66</p><p style="color:var(--muted)">Appel ou WhatsApp · +228</p><button class="btn btn-line btn-sm" style="margin-top:14px" data-copy="+228 72 54 41 66">Copier le numéro</button></div>
<div class="card"><p class="eyebrow">Nous trouver</p><p style="margin-top:8px;font-weight:600">412 Avenue Akei, Tokoin Tamé, Lomé</p><p style="color:var(--muted)">En face de la caisse</p><p style="margin-top:10px;font-size:.94rem"><b>Secrétariat</b> : du lundi au vendredi de 8 h à 12 h 30 et de 14 h 30 à 18 h, le samedi de 8 h à 12 h. Fermé le dimanche.</p><p style="margin-top:6px;font-size:.94rem"><b>Conduite</b>, sur rendez-vous : dès 6 h 30 en semaine et le samedi.</p><p style="margin-top:6px;font-size:.94rem;color:var(--muted)">Pendant la pause, écris-nous sur WhatsApp : on te répond au retour.</p><a class="btn btn-line btn-sm" style="margin-top:12px" href="https://www.google.com/maps/search/?api=1&query=6.168785%2C1.225462" target="_blank" rel="noopener">Ouvrir l'itinéraire</a></div>
<div class="card soft"><p class="eyebrow">Ensuite</p><ol style="padding-left:1.2em;margin:10px 0 0;color:var(--muted)"><li>Le secrétariat te répond.</li><li>Tu déposes ton dossier.</li><li>On fixe ton premier cours.</li></ol></div>
</div></div></div>
</section>
</main>

<div class="pat-lane" aria-hidden="true"></div>
<footer class="site"><div class="wrap"><div class="cols">
<div><a class="logo flogo" href="#accueil" aria-label="SODAF, accueil">${LOGO("#FFFFFF", "ws")}</a><p class="fslogan">L'art de conduire, la force de réussir.</p><p style="margin-top:8px;max-width:40ch">Code, secourisme, mécanique et conduite, en salle et en ligne.</p></div>
<div><h4>Apprendre</h4><a href="#formations">Formations et tarifs</a><a href="#cours">Les cours</a><a href="#quiz">Le quiz</a><a href="#devoirs">Les devoirs</a><a href="#outils">Les outils</a><a href="#classe" class="fcls">Mode classe <span>Projection</span></a></div>
<div><h4>Secrétariat</h4><span class="phone">72 54 41 66</span><p class="faddr">412 Avenue Akei, Tokoin Tamé, Lomé<br>(en face de la caisse)</p><p class="faddr">Secrétariat : lun – ven 8 h – 12 h 30 et 14 h 30 – 18 h<br>Samedi 8 h – 12 h · Dimanche fermé</p><a href="https://www.google.com/maps/search/?api=1&query=6.168785%2C1.225462" target="_blank" rel="noopener">Itinéraire Google Maps</a><a href="#inscription">Pré-inscription</a></div>
</div><div class="legal"><span>© 2026 SODAF Auto-École · Togo · <a href="/equipe/" target="sodaf-equipe" class="teamlink">Espace équipe</a></span><span>Powered by ADM Core</span></div></div></footer>

<a class="wa-float" href="${WA}?text=${encodeURIComponent("Bonjour SODAF !")}" target="_blank" rel="noopener" aria-label="Écrire à SODAF sur WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.4-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.4-.3z"/></svg>WhatsApp</a>
<div class="toast" id="sd-toast" hidden></div>
`;

const Q = [
["Combien existe-t-il de types de signalisation routière ?",["2","3","4","5"],2,"Horizontale, verticale, lumineuse et gestuelle.","cours-signalisation"],
["Une ligne continue au sol est :",["Franchissable pour dépasser","Infranchissable","Franchissable la nuit","Réservée aux bus"],1,"Dépassement et changement de voie y sont interdits.","cours-marquages"],
["Une ligne mixte (continue + discontinue) est franchissable :",["Toujours","Jamais","Si la discontinue est de ton côté","Si la continue est de ton côté"],2,"Seule la discontinue placée de ton côté te permet de franchir.","cours-marquages"],
["Sur des lignes jaunes discontinues :",["Arrêt et stationnement interdits","Arrêt permis, stationnement interdit","Stationnement permis","Réservé aux taxis"],1,"L'arrêt bref est permis, pas le stationnement.","cours-marquages"],
["Sur une voie de décélération, quand commence-t-on à ralentir ?",["Avant d'y entrer","Une fois sur la voie","On ne ralentit pas","Au panneau de sortie"],1,"On ne ralentit qu'une fois engagé sur la voie.","cours-marquages"],
["Dans quel ordre analyser une intersection ?",["Droite, gauche, arrière","Arrière, gauche, droite","Gauche, droite, arrière","Arrière, droite, gauche"],1,"Rétroviseur d'abord, puis la gauche, puis la droite.","cours-intersections"],
["Au rond-point, la priorité est :",["À droite","À gauche, aux usagers engagés","À celui qui klaxonne","Au plus gros véhicule"],1,"On cède le passage aux usagers déjà engagés.","cours-priorites"],
["En sortant d'un parking, tu dois :",["Appliquer la priorité à droite","Céder le passage à tous","Passer en premier","Klaxonner"],1,"En sortant d'un parking, on cède le passage à tous.","cours-priorites"],
["Le losange jaune bordé de blanc signifie :",["Danger","Route prioritaire","Fin de priorité","Stationnement"],1,"Priorité à toutes les intersections suivantes.","cours-priorites"],
["Feu vert, mais le carrefour est embouteillé. Tu :",["Passes, tu es prioritaire","Attends de pouvoir traverser sans bloquer","Klaxonnes","Passes par le trottoir"],1,"Interdit de s'engager si on risque de rester bloqué.","cours-priorites"],
["Les feux sont éteints (coupure de courant). Tu appliques :",["Le feu vert","Les panneaux du support, sinon priorité à droite","La priorité à gauche","La loi du plus fort"],1,"Feux défaillants : panneaux du support, sinon priorité à droite.","cours-feux"],
["Le feu jaune fixe signifie :",["Accélérer","Arrêt, sauf si trop près pour s'arrêter","Passage libre","Feu en panne"],1,"Le jaune impose l'arrêt sauf impossibilité.","cours-feux"],
["Un passage à niveau est annoncé hors agglomération à :",["50 m","100 m","150 m","300 m"],2,"150 m hors agglomération, 50 m en ville.","cours-feux"],
["L'agent est de profil par rapport à toi. Tu :",["T'arrêtes","Passes","Ralentis","Fais demi-tour"],1,"De profil : passage autorisé.","cours-agents"],
["L'agent lève le bras à la verticale :",["Accélérez","Arrêt général","Tournez à droite","Ralentissez"],1,"Arrêt pour tous, le trafic va changer.","cours-agents"],
["Feu vert, mais l'agent te fait signe de t'arrêter. Qui suis-tu ?",["Le feu","L'agent","Le premier arrivé","Personne"],1,"L'agent prime sur toute signalisation.","cours-agents"],
["Hors agglomération, un panneau de danger est placé à environ :",["50 m","150 m","500 m","Sur le danger"],1,"150 m hors agglomération, 50 m en ville.","cours-panneaux"],
["Un panneau rond à fond bleu est un panneau :",["D'interdiction","D'obligation","De danger","D'indication"],1,"Cercle bleu : obligation.","cours-panneaux"],
["Un panneau rond, couronne rouge, fond blanc :",["Obligation","Interdiction","Fin d'interdiction","Danger"],1,"Couronne rouge : interdiction.","cours-panneaux"],
["Un véhicule de la CEET avec gyrophare est-il prioritaire ?",["Oui, toujours","Non, on le laisse passer par courtoisie","Oui, la nuit","Seulement en ville"],1,"CEET, TdE et ambulances privées ne sont pas prioritaires.","cours-prioritaires"],
["Un véhicule de police est prioritaire quand :",["Il est en service","Sirène ou gyrophare activé en mission urgente","Il roule vite","Toujours"],1,"Seulement en mission urgente, signal activé.","cours-prioritaires"],
["Que signifie P.A.S. ?",["Prévenir, Attendre, Soigner","Protéger, Alerter, Secourir","Partir, Appeler, Sauver","Protéger, Aider, Signaler"],1,"Protéger, Alerter, Secourir.","cours-secourisme"],
["Le numéro des sapeurs-pompiers au Togo :",["161","117","118","172"],2,"Sapeurs-pompiers : 118. Police : 161 depuis un portable, 117 depuis un fixe.","cours-secourisme"],
["Le numéro de la Gendarmerie nationale :",["117","172","118","161"],1,"Gendarmerie : 172.","cours-secourisme"],
["Un blessé inconscient qui respire se place :",["Assis","Debout","En position latérale de sécurité","Sur le ventre"],2,"La PLS garde les voies respiratoires libres.","cours-secourisme"],
["Les secours sont déjà sur place. Tu :",["T'arrêtes pour regarder","Continues pour ne pas encombrer","Klaxonnes","Fais une vidéo"],1,"On ne s'arrête pas si les secours sont là.","cours-secourisme"],
["L'assurance minimale obligatoire est :",["Tous risques","Tiers collision","Responsabilité civile","Aucune"],2,"La responsabilité civile couvre les dommages aux autres.","cours-assurance"],
["L'assureur paie-t-il tes amendes ?",["Oui","Non, jamais","Avec tous risques","La moitié"],1,"Jamais.","cours-assurance"],
["Le protocole V.I.F. signifie :",["Vitesse, Indicateur, Frein à main","Volant, Inclinaison, Feux","Vérifier, Indiquer, Foncer","Vitesse, Inertie, Freinage"],0,"Première, clignotant, frein à main desserré.","cours-conduite"],
["La position des mains recommandée :",["12h","9h15","8h20","Une seule main"],1,"9h15 offre le meilleur contrôle.","cours-conduite"],
["Ordre de réglage avant de démarrer :",["Rétroviseurs, ceinture, siège","Siège, rétroviseurs, ceinture","Ceinture, siège, rétroviseurs","Peu importe"],1,"Siège, rétroviseurs, ceinture.","cours-conduite"],
["L'embrayage s'actionne avec :",["Le pied droit","Le pied gauche","La main","Les deux pieds"],1,"Pied gauche.","cours-conduite"],
["Dès quelle vitesse ne peut-on plus se retenir avec les bras ?",["5 km/h","15 km/h","50 km/h","90 km/h"],1,"Dès 15 km/h, d'où la ceinture.","cours-conduite"],
["À 90 km/h, distance d'arrêt sur route sèche :",["27 m","54 m","81 m","90 m"],2,"9 × 9 = 81 m.","cours-distances"],
["Si ta vitesse double, ta distance de freinage est multipliée par :",["2","3","4","8"],2,"Elle suit le carré de la vitesse.","cours-distances"],
["Sur route mouillée, la distance de freinage est :",["Identique","Doublée","Divisée par deux","Triplée"],1,"Elle double.","cours-distances"],
["La distance de sécurité minimale :",["1 seconde","2 secondes","5 secondes","10 mètres"],1,"« Un crocodile, deux crocodiles ».","cours-distances"],
["Un stationnement devient abusif après :",["24 heures partout","7 jours","1 mois","Jamais"],1,"Plus de 7 jours.","cours-stationnement"],
["Le seul temps moteur du cycle à 4 temps :",["Admission","Compression","Explosion / détente","Échappement"],2,"L'explosion produit l'énergie.","cours-mecanique"],
["La vidange se fait tous les :",["1 000 km","5 000 km","20 000 km","50 000 km"],1,"Tous les 5 000 km.","cours-mecanique"],
["Le voyant d'alerte freinage s'allume. Tu :",["Continues doucement","T'arrêtes immédiatement en sécurité","Ajoutes de l'huile","L'ignores"],1,"Arrêt immédiat et remorquage.","cours-tableau"],
["Aucun panneau. Qui passe en premier ?",["A","B","Ils passent ensemble","Le plus rapide"],1,"Priorité à droite : B arrive par la droite de A.","cours-priorites","droite"],
["Aucun panneau. Dans quel ordre passent les véhicules ?",["A, B, C","B, A, C","C, A, B","C, B, A"],2,"Personne n'est à la droite de C. A cède à C, B cède à A.","cours-priorites","trois"],
["A a un stop. Qui passe en premier ?",["B","A, car B vient de sa gauche","Le premier arrivé","A, s'il klaxonne"],0,"Au stop, on laisse passer tout le monde, même à gauche.","cours-priorites","stop"],
["A veut tourner à droite. Qui passe en premier ?",["A","Ils passent ensemble","Le zémidjan B","Celui qui klaxonne"],2,"Cédez le passage : on laisse passer la route principale, motos comprises.","cours-priorites","cedez"],
["A roule sur la route prioritaire. Qui passe en premier ?",["B, il vient de la droite","Ils s'arrêtent tous","Le premier arrivé","A"],3,"Le losange jaune donne la priorité à A ; B a un Cédez le passage.","cours-priorites","prioritaire"],
["A veut tourner à gauche, B arrive en face. Qui passe ?",["B","A","Le plus rapide","Celui qui fait un appel de phares"],0,"Pour tourner à gauche, on laisse passer ceux qui arrivent en face.","cours-priorites","gauche"],
["Au rond-point, qui passe en premier ?",["A, il vient de la droite","Le plus gros véhicule","B, déjà engagé","Personne, on klaxonne"],2,"On cède le passage aux usagers déjà engagés, qui arrivent par la gauche.","cours-priorites","giratoire"],
["Accident sans panneau : qui est en tort ?",["A","B","Les deux","Personne"],1,"A venait de la droite de B : B devait lui céder le passage.","cours-priorites","accident"],
];

/* ---------- Devoirs de la semaine : 10 devoirs, un par semaine, cycle de 10 semaines ---------- */
// Lundi où commence le Devoir A. Ensuite B, C… puis retour à A toutes les 10 semaines.
const DEV_START = "2026-10-05";
const DEV = [
{ l: "A", t: "Signalisation et marquages", q: [
["Le code de la route, c'est :",["Un examen à passer une fois","L'ensemble des lois et règles qui régissent la circulation","La liste des panneaux","Le permis de conduire"],1,"Il facilite la circulation et évite les accidents.","cours-signalisation"],
["Combien existe-t-il de types de signalisation routière ?",["2","3","4","5"],2,"Horizontale, verticale, lumineuse et gestuelle.","cours-signalisation"],
["Les feux tricolores sont une signalisation :",["Horizontale","Verticale","Lumineuse","Gestuelle"],2,"Horizontale = marquages au sol, verticale = panneaux, lumineuse = feux, gestuelle = agents.","cours-signalisation"],
["Une ligne continue au sol est :",["Franchissable pour dépasser","Infranchissable","Franchissable la nuit","Réservée aux bus"],1,"Dépassement et changement de voie y sont interdits.","cours-marquages"],
["Une ligne mixte (continue + discontinue) est franchissable :",["Toujours","Jamais","Si la discontinue est de ton côté","Si la continue est de ton côté"],2,"Seule la discontinue placée de ton côté te permet de franchir.","cours-marquages"],
["Où l'arrêt et le stationnement sont-ils permis, sauf interdiction ?",["Sur le trottoir","Sur l'accotement","Sur le passage piéton","Sur une piste cyclable"],1,"L'accotement est la partie non aménagée au bord de la route : arrêt et stationnement permis sauf interdiction.","cours-marquages"],
["Sur une ligne jaune discontinue :",["Arrêt et stationnement interdits","Arrêt permis, stationnement interdit","Stationnement permis","Réservé aux taxis"],1,"Jaune discontinue : arrêt bref permis. Jaune continue : les deux interdits.","cours-marquages"],
["La ligne d'avertissement (traits rapprochés) t'annonce :",["Un passage piéton","Une ligne continue : ne commence pas de dépassement","Un arrêt de bus","L'entrée d'une ville"],1,"Une ligne continue arrive bientôt.","cours-marquages"],
["Avec les flèches de sélection, une fois la ligne devenue continue :",["Tu peux encore changer de voie","Tu restes dans ta voie jusqu'au carrefour","Tu dois t'arrêter","Tu klaxonnes avant de changer"],1,"On choisit sa voie tant que la ligne est discontinue.","cours-marquages"],
["Sur une voie de décélération, quand commences-tu à ralentir ?",["Avant d'y entrer","Une fois sur la voie","On ne ralentit pas","Au panneau de sortie"],1,"On ne ralentit qu'une fois engagé sur la voie, pour ne pas gêner ceux qui suivent.","cours-marquages"]] },
{ l: "B", t: "Les panneaux", q: [
["Ce panneau t'oblige à :",["Ralentir seulement","T'arrêter à la ligne, puis céder le passage à tous","Passer en priorité","Klaxonner avant de passer"],1,"Stop : arrêt obligatoire, même si la route paraît libre.","cours-priorites","p:Stop"],
["Devant ce panneau, tu :",["Ralentis et laisses passer les véhicules prioritaires","T'arrêtes toujours, même sans personne","Es prioritaire","Ne peux pas tourner"],0,"Cédez le passage : arrêt seulement si quelqu'un arrive.","cours-priorites","p:Cédez le passage"],
["Ce panneau signifie :",["Danger","Tu es prioritaire à toutes les intersections suivantes","Fin de priorité","Parking"],1,"Losange jaune : route à caractère prioritaire.","cours-priorites","p:Route à caractère prioritaire"],
["Ce panneau t'indique :",["Sens unique","Interdit d'entrer, quel que soit le véhicule","Parking interdit","Fin de route"],1,"Sens interdit.","cours-panneaux","p:Sens interdit"],
["Un panneau rond à fond bleu est un panneau :",["D'interdiction","D'obligation","De danger","D'indication"],1,"Cercle bleu : obligation.","cours-panneaux"],
["Ce panneau annonce :",["Une école ou une aire de jeux : vitesse très réduite","Un passage piéton avec feu","Un arrêt de bus","Un hôpital"],0,"Endroit fréquenté par des enfants.","cours-panneaux","p:Endroit fréquenté par des enfants"],
["Hors agglomération, un panneau de danger est placé à environ :",["50 m du danger","150 m du danger","500 m du danger","Sur le danger"],1,"150 m hors agglomération, 50 m en ville.","cours-panneaux"],
["Ce panneau signifie :",["Fin de toutes les interdictions signalées avant","Route barrée","Interdit à tous","Virage dangereux"],0,"Cercle blanc barré de noir : fin d'interdiction.","cours-panneaux","p:Fin de toutes les interdictions"],
["Avec ce panneau :",["Ni arrêt ni stationnement","Arrêt bref permis, stationnement interdit","Stationnement payant","Réservé aux taxis"],1,"Stationnement interdit : l'arrêt bref reste permis.","cours-panneaux","p:Stationnement interdit"],
["Le véhicule qui fait face à un panneau sens interdit :",["Fait demi-tour","Tourne obligatoirement à sa droite","Tourne à gauche","Recule"],1,"Puis on applique la priorité normale.","cours-panneaux"]] },
{ l: "C", t: "Intersections et priorités", q: [
["Dans quel ordre analyser une intersection ?",["Droite, gauche, arrière","Arrière, gauche, droite","Gauche, droite, arrière","Arrière, droite, gauche"],1,"Rétroviseur d'abord, puis la gauche, puis la droite.","cours-intersections"],
["D'où vient le premier danger immédiat dans une intersection ?",["De la droite","De la gauche","De l'arrière","D'en face"],1,"Les véhicules venant de gauche sont les premiers à croiser ta route.","cours-intersections"],
["Appel lumineux ou klaxon à l'approche d'une intersection :",["Toujours, en ville","Seulement hors agglomération et de jour","La nuit, en ville","Jamais"],1,"Hors agglomération et de jour seulement.","cours-intersections"],
["À une intersection sans aucune signalisation :",["Priorité à gauche","Priorité à droite","Le plus gros véhicule passe","Le premier arrivé passe"],1,"On cède le passage à ceux qui viennent de droite.","cours-priorites"],
["En sortant d'un parking ou d'un chemin privé, tu dois :",["Appliquer la priorité à droite","Céder le passage à tous","Passer en premier","Klaxonner"],1,"On cède le passage à tous.","cours-priorites"],
["Tu sors d'un chemin non goudronné mais ouvert au public :",["Tu cèdes à tous","Les règles normales de priorité s'appliquent","Tu es prioritaire","Tu klaxonnes et tu passes"],1,"Ouvert au public, même non goudronné : règles normales.","cours-priorites"],
["Au rond-point, la priorité est :",["À droite","Aux usagers déjà engagés, qui arrivent par la gauche","À celui qui klaxonne","Au plus gros véhicule"],1,"On cède le passage aux usagers déjà engagés.","cours-priorites"],
["Le panneau de priorité ponctuelle est valable :",["Sur 5 km","À la prochaine intersection seulement","Jusqu'à la fin de la ville","Toute la journée"],1,"Ponctuelle = une seule intersection.","cours-priorites"],
["Le losange jaune (route prioritaire) est répété environ tous les :",["500 m","1 km","5 km","50 km"],2,"Environ tous les 5 km.","cours-priorites"],
["Feu vert, mais le carrefour est embouteillé. Tu :",["Passes, tu es prioritaire","Attends de pouvoir traverser sans bloquer","Klaxonnes","Passes par le trottoir"],1,"Interdit de s'engager si on risque de rester bloqué.","cours-priorites"]] },
{ l: "D", t: "Qui passe en premier ?", q: [
["Aucun panneau. Qui passe en premier ?",["A","B","Ils passent ensemble","Le plus rapide"],1,"Priorité à droite : B arrive par la droite de A.","cours-priorites","droite"],
["Aucun panneau. Dans quel ordre passent les véhicules ?",["A, B, C","B, A, C","C, A, B","C, B, A"],2,"Personne n'est à la droite de C. A cède à C, B cède à A.","cours-priorites","trois"],
["A a un stop. Qui passe en premier ?",["B","A, car B vient de sa gauche","Le premier arrivé","A, s'il klaxonne"],0,"Au stop, on laisse passer tout le monde, même à gauche.","cours-priorites","stop"],
["A veut tourner à droite. Qui passe en premier ?",["A","Ils passent ensemble","Le zémidjan B","Celui qui klaxonne"],2,"Cédez le passage : on laisse passer la route principale, motos comprises.","cours-priorites","cedez"],
["A roule sur la route prioritaire. Qui passe en premier ?",["B, il vient de la droite","Ils s'arrêtent tous","Le premier arrivé","A"],3,"Le losange jaune donne la priorité à A ; B a un Cédez le passage.","cours-priorites","prioritaire"],
["A veut tourner à gauche, B arrive en face. Qui passe ?",["B","A","Le plus rapide","Celui qui fait un appel de phares"],0,"Pour tourner à gauche, on laisse passer ceux qui arrivent en face.","cours-priorites","gauche"],
["Au rond-point, qui passe en premier ?",["A, il vient de la droite","Le plus gros véhicule","B, déjà engagé","Personne, on klaxonne"],2,"On cède le passage aux usagers déjà engagés.","cours-priorites","giratoire"],
["Accident sans panneau : qui est en tort ?",["A","B","Les deux","Personne"],1,"A venait de la droite de B : B devait lui céder le passage.","cours-priorites","accident"],
["Un véhicule de la CEET avec gyrophare est-il prioritaire ?",["Oui, toujours","Non, on le laisse passer par courtoisie","Oui, la nuit","Seulement en ville"],1,"CEET, TdE et ambulances privées ne sont pas prioritaires.","cours-prioritaires"],
["Un véhicule de police est prioritaire quand :",["Il est en service","Sirène ou gyrophare activé, en mission urgente","Il roule vite","Toujours"],1,"Seulement en mission urgente, signal activé.","cours-prioritaires"]] },
{ l: "E", t: "Feux, passages à niveau et agents", q: [
["Le feu jaune fixe signifie :",["Accélérer","Arrêt, sauf si tu es trop près pour t'arrêter en sécurité","Passage libre","Feu en panne"],1,"Le jaune impose l'arrêt sauf impossibilité.","cours-feux"],
["Le feu rouge signifie :",["Arrêt absolu avant la ligne","Passer si personne ne vient","Ralentir","Arrêt après la ligne"],0,"Arrêt absolu, avant la ligne.","cours-feux"],
["Les feux sont éteints (coupure de courant). Tu appliques :",["Le feu vert","Les panneaux du support, sinon la priorité à droite","La priorité à gauche","La loi du plus fort"],1,"Feux défaillants : panneaux du support, sinon priorité à droite.","cours-feux"],
["Un feu jaune clignotant signifie :",["Passage interdit","Feu en panne : panneaux du support, sinon priorité à droite","Accélère","Tu es prioritaire"],1,"Jaune clignotant = feu en panne.","cours-feux"],
["La flèche de dégagement allumée te permet :",["De rien du tout","D'avancer dans sa direction malgré le rouge, en cédant le passage","De faire demi-tour","De passer sans regarder"],1,"Tu avances dans la direction de la flèche en cédant le passage.","cours-feux"],
["Un passage à niveau est annoncé hors agglomération à :",["50 m","100 m","150 m","300 m"],2,"150 m hors agglomération, 50 m en ville.","cours-feux"],
["Passage à niveau sans barrière :",["Tu passes vite","Arrêt et vérification qu'aucun train n'arrive","Tu klaxonnes sans t'arrêter","Tu suis le véhicule devant toi"],1,"On s'arrête, on regarde et on écoute.","cours-feux"],
["L'agent est de profil par rapport à toi. Tu :",["T'arrêtes","Passes","Ralentis","Fais demi-tour"],1,"De profil, parallèle à ses bras : passage autorisé.","cours-agents"],
["L'agent est de face ou de dos par rapport à toi. Tu :",["T'arrêtes immédiatement","Passes","Ralentis seulement","Tournes à droite"],0,"De face ou de dos : arrêt.","cours-agents"],
["Feu vert, mais l'agent te fait signe de t'arrêter. Qui suis-tu ?",["Le feu","L'agent","Le premier arrivé","Personne"],1,"Les ordres de l'agent passent avant toute signalisation.","cours-agents"]] },
{ l: "F", t: "Le poste de conduite", q: [
["Une voiture à boîte manuelle a combien de pédales ?",["2","3","4","1"],1,"Embrayage, frein, accélérateur. Boîte automatique : deux pédales.","cours-conduite"],
["L'embrayage s'actionne avec :",["Le pied droit","Le pied gauche","La main","Les deux pieds"],1,"Pied gauche. Frein et accélérateur : pied droit.","cours-conduite"],
["Ordre de réglage avant de démarrer :",["Rétroviseurs, ceinture, siège","Siège, rétroviseurs, ceinture","Ceinture, siège, rétroviseurs","Peu importe"],1,"Siège, rétroviseurs, ceinture, puis levier au point mort.","cours-conduite"],
["Le protocole V.I.F. pour démarrer signifie :",["Vitesse, Indicateur, Frein à main","Volant, Inclinaison, Feux","Vérifier, Indiquer, Foncer","Vitesse, Inertie, Freinage"],0,"Première engagée, clignotant gauche, frein à main desserré.","cours-conduite"],
["La position des mains recommandée sur le volant :",["12 h","9 h 15","8 h 20","Une seule main"],1,"9 h 15 offre le meilleur contrôle.","cours-conduite"],
["Dès quelle vitesse tes bras ne peuvent plus retenir ton corps lors d'un choc ?",["5 km/h","15 km/h","50 km/h","90 km/h"],1,"Dès 15 km/h, d'où la ceinture.","cours-conduite"],
["La ceinture est obligatoire :",["À l'avant seulement","À l'avant et à l'arrière","Hors de la ville seulement","Pour le conducteur seulement"],1,"Avant et arrière, et siège auto pour les jeunes enfants.","cours-conduite"],
["Un clignotant qui clignote trop vite signale :",["Une batterie pleine","Une ampoule grillée","Un frein usé","Rien de spécial"],1,"Il faut changer l'ampoule.","cours-conduite"],
["Avant de changer de voie, pour vérifier l'angle mort, tu :",["Klaxonnes","Tournes la tête","Freines","Allumes les feux"],1,"Le rétroviseur ne montre pas tout : un coup d'œil par-dessus l'épaule.","cours-conduite"],
["Les passagers montent de préférence :",["Côté chaussée","Côté trottoir","Par le coffre","Peu importe"],1,"Côté trottoir, à l'abri de la circulation.","cours-conduite"]] },
{ l: "G", t: "Vitesse, distances et stationnement", q: [
["À 50 km/h, combien de mètres parcours-tu en 1 seconde ?",["5 m","10 m","15 m","25 m"],2,"Chiffre des dizaines × 3 : 5 × 3 = 15 m.","cours-distances"],
["À 90 km/h, la distance d'arrêt sur route sèche est d'environ :",["27 m","54 m","81 m","90 m"],2,"Dizaines × dizaines : 9 × 9 = 81 m.","cours-distances"],
["À 50 km/h, la distance d'arrêt sur route sèche est d'environ :",["25 m","50 m","15 m","100 m"],0,"5 × 5 = 25 m.","cours-distances"],
["Si ta vitesse double, ta distance de freinage est multipliée par :",["2","3","4","8"],2,"Elle suit le carré de la vitesse.","cours-distances"],
["Sur route mouillée, la distance de freinage est :",["Identique","Doublée","Divisée par deux","Triplée"],1,"Elle double. Attention en saison des pluies.","cours-distances"],
["La distance de sécurité minimale avec le véhicule devant :",["1 seconde","2 secondes","5 secondes","10 mètres"],1,"« Un crocodile, deux crocodiles ».","cours-distances"],
["Quelle est la différence entre l'arrêt et le stationnement ?",["Aucune","L'arrêt est bref, conducteur au volant ou tout près","Le stationnement dure moins de 5 minutes","L'arrêt se fait moteur coupé, conducteur loin"],1,"Stationnement : prolongé, moteur coupé, conducteur éloigné.","cours-stationnement"],
["Où le stationnement est-il interdit ?",["Sur l'accotement hors ville","Sur un pont","Le long du trottoir en ville","Dans un parking"],1,"Interdit aussi dans les virages, intersections, sommets de côte, passages piétons…","cours-stationnement"],
["Un véhicule laissé au même endroit devient en stationnement abusif après :",["24 heures","7 jours","1 mois","Jamais"],1,"Plus de 7 jours : risque de fourrière.","cours-stationnement"],
["Se garer « en bataille », c'est :",["Parallèle au trottoir","À 90°, de préférence en marche arrière","En diagonale","Sur le trottoir"],1,"Créneau = parallèle, épi = diagonale.","cours-stationnement"]] },
{ l: "H", t: "Secourisme routier", q: [
["Que signifie P.A.S. ?",["Prévenir, Attendre, Soigner","Protéger, Alerter, Secourir","Partir, Appeler, Sauver","Protéger, Aider, Signaler"],1,"Protéger, Alerter, Secourir, dans cet ordre.","cours-secourisme"],
["Protéger, c'est notamment :",["Déplacer tout de suite les blessés","Te garer en sécurité, triangle et feux de détresse, couper les contacts","Prendre des photos","Donner à boire aux blessés"],1,"Et interdire de fumer près des véhicules.","cours-secourisme"],
["Quand tu alertes les secours, tu donnes :",["Seulement ton nom","La nature de l'accident, le nombre de blessés, les véhicules, le lieu exact","Le prix des dégâts","Rien, ils savent déjà"],1,"Plus le message est précis, plus les secours sont efficaces.","cours-secourisme"],
["Le numéro des sapeurs-pompiers au Togo :",["161","117","118","172"],2,"Sapeurs-pompiers : 118.","cours-secourisme"],
["Le numéro de la Gendarmerie nationale :",["117","172","118","161"],1,"Gendarmerie : 172.","cours-secourisme"],
["Un blessé inconscient qui respire se place :",["Assis","Debout","En position latérale de sécurité","Sur le ventre"],2,"La PLS garde les voies respiratoires libres.","cours-secourisme"],
["Un blessé saigne beaucoup d'une plaie. Tu :",["Attends les secours sans rien faire","Comprimes la plaie","Le fais marcher","Lui donnes à boire"],1,"On comprime les plaies qui saignent.","cours-secourisme"],
["Les secours sont déjà sur place. Tu :",["T'arrêtes pour regarder","Continues pour ne pas encombrer","Klaxonnes","Filmes la scène"],1,"On ne s'arrête pas si les secours sont là.","cours-secourisme"],
["Le délit de fuite, c'est :",["Rouler trop vite","Ne pas s'arrêter après un accident pour échapper à sa responsabilité","Refuser un contrôle à pied","Dépasser par la droite"],1,"Il est sévèrement puni.","cours-secourisme"],
["Un témoin d'accident doit :",["Décrire les faits fidèlement, sans les analyser","Dire qui a tort","Partir vite","Négocier entre les conducteurs"],0,"Le témoin raconte ce qu'il a vu, c'est tout.","cours-secourisme"]] },
{ l: "I", t: "Assurance et conduire chez nous", q: [
["L'assurance automobile est obligatoire :",["Pour les voitures neuves","Pour tout véhicule à moteur qui circule","Hors de Lomé seulement","Pour les taxis seulement"],1,"Tout véhicule à moteur qui circule.","cours-assurance"],
["L'assurance minimale obligatoire est :",["Tous risques","Tiers collision","Responsabilité civile","Aucune"],2,"Elle couvre les dommages causés aux autres.","cours-assurance"],
["L'assurance tous risques couvre :",["Seulement les dommages aux autres","Tous les dommages de ton véhicule, responsable ou non","Seulement le vol","Tes amendes"],1,"C'est la formule la plus complète.","cours-assurance"],
["L'assureur paie-t-il tes amendes ?",["Oui","Non, jamais","Avec tous risques","La moitié"],1,"Jamais.","cours-assurance"],
["L'assureur peut annuler la garantie si :",["Tu roules la nuit","Tu conduisais après avoir bu de l'alcool","Ta voiture est ancienne","Tu changes de quartier"],1,"Aussi : lunettes obligatoires non portées, prime impayée, fausse déclaration.","cours-assurance"],
["Avant de tourner, à cause des zémidjans, tu :",["Klaxonnes fort et tu tournes","Regardes le rétroviseur puis par-dessus l'épaule","Accélères","Freines brusquement"],1,"Les motos-taxis changent de file sans prévenir.","cours-togo"],
["Pendant l'harmattan (décembre à février) :",["Feux de route et vitesse normale","Feux de croisement, vitesse réduite, plus de distance","Rien ne change","Feux de détresse en roulant"],1,"La poussière réduit la visibilité.","cours-togo"],
["Une flaque dont tu ne vois pas le fond :",["Tu la traverses vite","Tu ne la traverses pas","Tu klaxonnes avant","Tu suis un zémidjan"],1,"Elle peut cacher un trou profond.","cours-togo"],
["Des chèvres sont au bord de la route :",["Tu klaxonnes et accélères","Tu ralentis","Tu fais des appels de phares","Rien, elles ne bougent pas"],1,"Les animaux traversent sans prévenir.","cours-togo"],
["Tu approches d'un marché animé :",["Tu gardes ta vitesse","Tu ralentis : piétons, vendeurs et enfants débordent sur la chaussée","Tu klaxonnes sans arrêt","Tu passes par l'accotement"],1,"On ralentit à l'approche.","cours-togo"]] },
{ l: "J", t: "Mécanique et tableau de bord", q: [
["Les trois grands ensembles d'une voiture :",["Carrosserie, châssis, moteur","Pneus, volant, sièges","Phares, freins, radio","Moteur, batterie, carburant"],0,"Le châssis est le squelette de la voiture.","cours-mecanique"],
["Le seul temps moteur du cycle à 4 temps :",["Admission","Compression","Explosion / détente","Échappement"],2,"L'explosion produit l'énergie.","cours-mecanique"],
["Le circuit de refroidissement garde le moteur vers :",["40 °C","90 °C","150 °C","200 °C"],1,"Grâce à la pompe à eau et au radiateur.","cours-mecanique"],
["La batterie d'une voiture fournit :",["6 V","12 V","220 V","25 000 V"],1,"12 V. La bobine monte à 15 000–25 000 V pour les bougies.","cours-mecanique"],
["La vidange se fait tous les :",["1 000 km","5 000 km","20 000 km","50 000 km"],1,"Vidange et filtre tous les 5 000 km.","cours-mecanique"],
["L'huile SAE 90 sert pour :",["Les moteurs essence","Les boîtes de vitesses manuelles et les ponts arrière","La direction assistée","Les moteurs diesel lourds"],1,"SAE 30/40 : moteurs essence. SAE 50 : diesel lourds.","cours-mecanique"],
["Le voyant d'alerte freinage s'allume. Tu :",["Continues doucement","T'arrêtes immédiatement en sécurité et fais remorquer","Ajoutes de l'huile moteur","L'ignores"],1,"Liquide de frein critique : arrêt immédiat.","cours-tableau"],
["Le voyant carburant s'allume :",["Réserve atteinte : station la plus proche","Arrêt immédiat et remorquage","Il faut ajouter de l'huile","Rien de grave, tu continues des jours"],0,"Tu roules sur la réserve.","cours-tableau"],
["Lequel fait partie du lot de bord ?",["Le triangle","Le permis","La carte grise","La radio"],0,"Lot de bord : cric, clé démonte-roue, roue de secours, tournevis, extincteur, trousse de secours, triangle.","cours-tableau"],
["Lequel est un document de bord ?",["La carte grise","L'extincteur","Le cric","La roue de secours"],0,"Documents : carte grise, attestation d'assurance, permis, pièce d'identité.","cours-tableau"]] },
];
// Programme du code en salle : 12 cours en boucle sur 6 semaines (2 par semaine), le même pour tous les groupes.
// Cours 1 à 10 = les 10 thèmes (1 devoir par cours, A à J) ; cours 11 = révision générale ; cours 12 = examen blanc.
// Même calcul que la base (prive.cours_boucle) : semaine k → 1er jour du groupe = cours 2k+1, 2e jour = cours 2k+2.
// Chapitres de chaque cours : d'abord ceux qui lui appartiennent (le devoir qui a le plus de questions dessus), puis les chapitres liés
const DEV_CH = (() => { const n = DEV.map((d) => { const c = {}; d.q.forEach((q) => (c[q[4]] = (c[q[4]] || 0) + 1)); return c; }), own = (id, k) => DEV.every((d, j) => (n[j][id] || 0) <= (n[k][id] || 0));
  return DEV.map((d, k) => { const all = [...new Set(d.q.map((q) => q[4]))]; return all.filter((id) => own(id, k)).concat(all.filter((id) => !own(id, k))); }); })();
const BOUCLE = DEV.map((d, k) => ({ n: k + 1, t: d.t, dv: k, ch: DEV_CH[k] })).concat([{ n: 11, t: "Révision générale", dv: null, ch: [] }, { n: 12, t: "Examen blanc", dv: null, ch: [] }]);
const bIdx = (t) => BOUCLE.findIndex((b) => b.t === t);
const chNoms = (b) => b.ch.map((id) => { const a = document.getElementById(id); return a ? a.dataset.title : ""; }).filter(Boolean).join(", ");
// Semaine en cours (heure de Lomé = UTC) : lundi AAAA-MM-JJ, semaine du programme (0 à 5) et ses 2 cours
function devWeek(d) {
  d = d || new Date();
  const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  const n = Math.floor((day - new Date(DEV_START + "T00:00:00Z")) / 6048e5), sem = ((n % 6) + 6) % 6;
  return { key: day.toISOString().slice(0, 10), sem, c: [2 * sem, 2 * sem + 1], monday: day };
}
// Devoir du cours qui précède le cours k (corrigé au début du cours k)
const devAvant = (k) => { let i = (k + 11) % 12; while (BOUCLE[i].dv === null) i = (i + 11) % 12; return BOUCLE[i].dv; };
// Devoir à corriger aujourd'hui : lun.–mer. celui du 2e cours de la semaine passée, jeu.–dim. celui du 1er cours de la semaine
// Début du cours k : correction du devoir du cours précédent (ou retour sur l'examen blanc)
const debutCours = (k) => { const p = (k + 11) % 12; return BOUCLE[p].dv !== null ? "correction du devoir " + DEV[BOUCLE[p].dv].l : p === 11 ? "retour sur l'examen blanc" : "pas de devoir à corriger"; };
// Cours du jour pour le Mode classe : lun.–mer. le 1er cours de la semaine, jeu.–dim. le 2e
const coursDuJour = (d) => { d = d || new Date(); const w = devWeek(d); return (d.getUTCDay() + 6) % 7 <= 2 ? w.c[0] : w.c[1]; };
const devCorr = (d) => { d = d || new Date(); const w = devWeek(d); return devAvant((d.getUTCDay() + 6) % 7 <= 2 ? w.c[0] : w.c[1]); };
const progRows = (cur, lundi) => [0, 1, 2, 3, 4, 5].map((k) => { const m = lundi ? new Date(lundi.getTime() + (k - cur) * 6048e5) : null, a = BOUCLE[2 * k], b = BOUCLE[2 * k + 1], lab = (x) => "<span><i>" + x.n + "</i>" + x.t + (x.dv !== null ? " <em>devoir " + DEV[x.dv].l + "</em>" : "") + "</span>";
  return '<div class="prog-w' + (k === cur ? " now" : "") + '"><b>Semaine ' + (k + 1) + (m ? "<small>" + (k === cur ? "cette semaine · " : "") + "lun. " + m.getUTCDate() + " " + ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."][m.getUTCMonth()] + "</small>" : "") + "</b>" + lab(a) + lab(b) + "</div>"; }).join("");

const CK = ["Aucune fuite sous le véhicule","Carrosserie, feux et vitres propres","Pression des 4 pneus","Liquide de refroidissement","Huile moteur (entre MIN et MAX)","Liquide de frein et d'embrayage","Eau de la batterie (si non scellée)","Liquide de direction assistée","Lot de bord complet","Documents de bord valides","Carburant suffisant","Feux, frein et klaxon fonctionnent"];

function signSVG(name) { const g = SIGNS.find((x) => x.n === name); return g ? g.s : ""; }
function qVisual(q) { if (!q[5]) return ""; return q[5].startsWith("p:") ? '<div class="qsign">' + signSVG(q[5].slice(2)) + "</div>" : '<div class="qscene">' + SCENE(q[5]) + "</div>"; }
function optsHTML(q) {
  return qVisual(q) + '<p class="qtext">' + q[0] + '</p><div class="opts">' + q[1].map((o, k) => '<button class="opt" data-k="' + k + '"><span class="k">' + "ABCD"[k] + "</span><span>" + o + "</span></button>").join("") + "</div>";
}


/* ---------- Panneaux : dessins vectoriels simplifiés ---------- */
const PK = "#14171C", PR = "#C8372D", PB = "#2B63B5", PY = "#F2B100";
const SVGW = (inner) => `<svg viewBox="0 0 100 100" aria-hidden="true">${inner}</svg>`;
const sk = (d, w = 7, c = PK) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const fl = (d, c = PK) => `<path d="${d}" fill="${c}"/>`;
const tx = (t, size = 34, c = PK, y = 62) => `<text x="50" y="${y}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="${size}" fill="${c}">${t}</text>`;
const TRI = (i) => SVGW(`<path d="M50 9 L93 85 H7 Z" fill="#fff" stroke="${PR}" stroke-width="8" stroke-linejoin="round"/>${i}`);
const RED = (i) => SVGW(`<circle cx="50" cy="50" r="42" fill="#fff" stroke="${PR}" stroke-width="10"/>${i}`);
const BAR = `<path d="M21 21 L79 79" stroke="${PR}" stroke-width="8"/>`;
const BLUE = (i) => SVGW(`<circle cx="50" cy="50" r="45" fill="${PB}"/>${i}`);
const ENDS = (i) => SVGW(`<circle cx="50" cy="50" r="44" fill="#fff" stroke="#8A9099" stroke-width="2"/>${i}<path d="M24 82 L82 24 M18 76 L76 18 M30 88 L88 30" stroke="${PK}" stroke-width="3"/>`);
const SQ = (i) => SVGW(`<rect x="7" y="7" width="86" height="86" rx="9" fill="${PB}"/>${i}`);
const PERSON = (x = 50, y = 38, s = 1, c = PK) => `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="0" r="5" fill="${c}"/>${sk("M0 7 L0 24 M0 12 L-8 20 M0 12 L8 18 M0 24 L-7 36 M0 24 L7 36", 4.5, c)}</g>`;
const CAR = (x, c) => `<g transform="translate(${x} 0)"><rect x="-10" y="38" width="20" height="30" rx="6" fill="${c}"/><rect x="-7" y="44" width="14" height="7" rx="2" fill="#fff"/></g>`;
const ARROW_UP = (c = "#fff") => fl("M50 18 L70 42 H57 V80 H43 V42 H30 Z", c);

const SIGNS = [
  // Danger
  { f: "danger", n: "Virage à droite", d: "Ralentis avant le virage et garde ta droite.", s: TRI(sk("M42 78 V58 Q42 46 55 46 H58") + fl("M57 37 L69 46 L57 55 Z")) },
  { f: "danger", n: "Virage à gauche", d: "Ralentis avant le virage et garde ta droite.", s: TRI(sk("M58 78 V58 Q58 46 45 46 H42") + fl("M43 37 L31 46 L43 55 Z")) },
  { f: "danger", n: "Succession de virages", d: "Plusieurs virages, le premier à droite.", s: TRI(sk("M44 79 C44 70 57 68 57 59 C57 51 45 50 45 42") + fl("M38 44 L45 32 L52 44 Z")) },
  { f: "danger", n: "Cassis ou dos-d’âne", d: "Bosse ou creux sur la chaussée : ralentis fortement.", s: TRI(sk("M25 74 Q37 56 50 74 Q63 56 75 74", 6)) },
  { f: "danger", n: "Chaussée glissante", d: "Risque de dérapage : vitesse réduite, freinage doux.", s: TRI(`<rect x="38" y="38" width="24" height="16" rx="4" fill="${PK}"/>` + sk("M36 66 q5 -6 10 0 M54 66 q5 -6 10 0 M40 75 q5 -6 10 0 M56 75 q5 -6 10 0", 3.5)) },
  { f: "danger", n: "Chaussée rétrécie", d: "La route se resserre : prépare-toi à croiser au pas.", s: TRI(sk("M36 80 L44 62 V40 M64 80 L56 62 V40", 6)) },
  { f: "danger", n: "Passage piétons", d: "Des piétons peuvent traverser : prêt à t’arrêter.", s: TRI(PERSON(50, 40, 1) + `<path d="M30 79 H70" stroke="${PK}" stroke-width="3" stroke-dasharray="6 4"/>`) },
  { f: "danger", n: "Endroit fréquenté par des enfants", d: "École ou aire de jeux : vitesse très réduite.", s: TRI(PERSON(41, 44, 0.85) + PERSON(59, 46, 0.75)) },
  { f: "danger", n: "Travaux", d: "Chantier sur la route : ralentis, ouvriers possibles.", s: TRI(PERSON(46, 42, 0.9) + sk("M54 52 L66 70", 4) + fl("M58 79 H76 L68 66 Z")) },
  { f: "danger", n: "Feux tricolores", d: "Des feux arrivent : sois prêt à t’arrêter.", s: TRI(`<rect x="41" y="32" width="18" height="46" rx="5" fill="${PK}"/><circle cx="50" cy="42" r="5" fill="${PR}"/><circle cx="50" cy="55" r="5" fill="${PY}"/><circle cx="50" cy="68" r="5" fill="#0B6E4F"/>`) },
  { f: "danger", n: "Intersection, priorité à droite", d: "Cède le passage aux véhicules venant de droite.", s: TRI(sk("M36 46 L64 76 M64 46 L36 76")) },
  { f: "danger", n: "Circulation dans les deux sens", d: "Tu quittes un sens unique : des véhicules arrivent en face.", s: TRI(fl("M40 34 L48 46 H43 V78 H37 V46 H32 Z") + fl("M60 78 L52 66 H57 V34 H63 V66 H68 Z")) },
  { f: "danger", n: "Descente dangereuse", d: "Forte pente : rétrograde et utilise le frein moteur.", s: TRI(fl("M24 78 H76 L24 52 Z") + tx("10%", 13, "#fff", 74)) },
  { f: "danger", n: "Passage à niveau avec barrières", d: "Arrêt si les barrières se ferment ou si le feu clignote.", s: TRI(`<rect x="28" y="52" width="44" height="7" fill="${PK}"/><rect x="28" y="66" width="44" height="7" fill="${PK}"/>` + sk("M34 46 V79 M66 46 V79", 4)) },
  { f: "danger", n: "Passage à niveau sans barrière", d: "Arrête-toi, regarde et écoute avant de traverser.", s: TRI(`<rect x="30" y="54" width="34" height="18" rx="2" fill="${PK}"/><rect x="58" y="44" width="12" height="28" rx="2" fill="${PK}"/><circle cx="38" cy="75" r="4" fill="${PK}"/><circle cx="56" cy="75" r="4" fill="${PK}"/>`) },
  { f: "danger", n: "Autres dangers", d: "Danger signalé par un panonceau dessous : sois attentif.", s: TRI(`<rect x="45.5" y="36" width="9" height="28" rx="2" fill="${PK}"/><circle cx="50" cy="73" r="5" fill="${PK}"/>`) },

  // Priorité
  { f: "priorite", n: "Stop", d: "Arrêt obligatoire à la ligne, puis céder le passage à tous.", s: SVGW(`<path d="M31 6 H69 L94 31 V69 L69 94 H31 L6 69 V31 Z" fill="${PR}" stroke="#fff" stroke-width="3"/>` + tx("STOP", 25, "#fff", 59)) },
  { f: "priorite", n: "Cédez le passage", d: "Ralentis et laisse passer les véhicules prioritaires.", s: SVGW(`<path d="M7 12 H93 L50 90 Z" fill="#fff" stroke="${PR}" stroke-width="8" stroke-linejoin="round"/>`) },
  { f: "priorite", n: "Route à caractère prioritaire", d: "Tu es prioritaire à toutes les intersections suivantes.", s: SVGW(`<rect x="20" y="20" width="60" height="60" transform="rotate(45 50 50)" fill="#fff" stroke="#9AA1A9" stroke-width="2"/><rect x="30" y="30" width="40" height="40" transform="rotate(45 50 50)" fill="${PY}"/>`) },
  { f: "priorite", n: "Fin de route prioritaire", d: "Retour aux règles normales de priorité.", s: SVGW(`<rect x="20" y="20" width="60" height="60" transform="rotate(45 50 50)" fill="#fff" stroke="#9AA1A9" stroke-width="2"/><rect x="30" y="30" width="40" height="40" transform="rotate(45 50 50)" fill="${PY}"/><path d="M20 80 L80 20" stroke="${PK}" stroke-width="7"/>`) },
  { f: "priorite", n: "Priorité à la prochaine intersection", d: "Tu es prioritaire, seulement au prochain carrefour.", s: TRI(sk("M50 36 V80", 10) + sk("M34 58 H66", 4)) },

  // Interdiction
  { f: "interdiction", n: "Sens interdit", d: "Interdit d’entrer, quel que soit le véhicule.", s: SVGW(`<circle cx="50" cy="50" r="45" fill="${PR}"/><rect x="18" y="42" width="64" height="16" fill="#fff"/>`) },
  { f: "interdiction", n: "Circulation interdite", d: "Interdit à tout véhicule dans les deux sens.", s: RED("") },
  { f: "interdiction", n: "Interdiction de tourner à gauche", d: "Tourner à gauche est interdit à la prochaine intersection.", s: RED(sk("M58 74 V50 Q58 40 48 40 H40") + fl("M42 31 L30 40 L42 49 Z") + BAR) },
  { f: "interdiction", n: "Interdiction de tourner à droite", d: "Tourner à droite est interdit à la prochaine intersection.", s: RED(sk("M42 74 V50 Q42 40 52 40 H60") + fl("M58 31 L70 40 L58 49 Z") + `<path d="M79 21 L21 79" stroke="${PR}" stroke-width="8"/>`) },
  { f: "interdiction", n: "Demi-tour interdit", d: "Faire demi-tour est interdit jusqu’à la prochaine intersection.", s: RED(sk("M40 74 V46 Q40 32 52 32 Q64 32 64 46 V56") + fl("M56 54 L64 66 L72 54 Z") + BAR) },
  { f: "interdiction", n: "Interdiction de dépasser", d: "Dépassement interdit, sauf deux-roues sans moteur.", s: RED(CAR(38, PR) + CAR(62, PK)) },
  { f: "interdiction", n: "Vitesse limitée à 50 km/h", d: "Vitesse maximale autorisée : 50 km/h.", s: RED(tx("50", 34)) },
  { f: "interdiction", n: "Signaux sonores interdits", d: "Klaxon interdit, sauf danger immédiat.", s: RED(fl("M30 44 H40 L58 32 V68 L40 56 H30 Z") + sk("M64 40 q6 10 0 20", 4) + BAR) },
  { f: "interdiction", n: "Accès interdit aux piétons", d: "Les piétons ne peuvent pas emprunter cette voie.", s: RED(PERSON(50, 32, 1.05)) },
  { f: "interdiction", n: "Accès interdit aux poids lourds", d: "Interdit aux camions de marchandises.", s: RED(`<rect x="26" y="40" width="34" height="22" fill="${PK}"/><path d="M60 46 H70 L76 54 V62 H60 Z" fill="${PK}"/><circle cx="34" cy="66" r="5" fill="${PK}"/><circle cx="68" cy="66" r="5" fill="${PK}"/>`) },
  { f: "interdiction", n: "Stationnement interdit", d: "Arrêt bref permis, stationnement interdit.", s: SVGW(`<circle cx="50" cy="50" r="42" fill="${PB}" stroke="${PR}" stroke-width="10"/><path d="M21 21 L79 79" stroke="${PR}" stroke-width="9"/>`) },
  { f: "interdiction", n: "Arrêt et stationnement interdits", d: "Ni arrêt ni stationnement, même quelques secondes.", s: SVGW(`<circle cx="50" cy="50" r="42" fill="${PB}" stroke="${PR}" stroke-width="10"/><path d="M21 21 L79 79 M79 21 L21 79" stroke="${PR}" stroke-width="9"/>`) },

  // Fin d'interdiction
  { f: "fin", n: "Fin de limitation à 50 km/h", d: "La limitation de 50 km/h ne s’applique plus.", s: ENDS(tx("50", 34, "#8A9099")) },
  { f: "fin", n: "Fin de toutes les interdictions", d: "Fin de toutes les interdictions signalées avant.", s: ENDS("") },
  { f: "fin", n: "Fin d’interdiction de dépasser", d: "Tu peux de nouveau dépasser, avec prudence.", s: ENDS(CAR(38, "#8A9099") + CAR(62, "#8A9099")) },

  // Obligation
  { f: "obligation", n: "Direction obligatoire : tout droit", d: "Seule direction autorisée à la prochaine intersection.", s: BLUE(ARROW_UP()) },
  { f: "obligation", n: "Direction obligatoire : à droite", d: "Tu dois tourner à droite à la prochaine intersection.", s: BLUE(sk("M42 78 V54 Q42 42 54 42 H60", 12, "#fff") + fl("M58 28 L76 42 L58 56 Z", "#fff")) },
  { f: "obligation", n: "Contournement par la droite", d: "Passe à droite de l’obstacle ou du terre-plein.", s: BLUE(sk("M34 34 L62 62", 12, "#fff") + fl("M70 46 V72 H44 Z", "#fff")) },
  { f: "obligation", n: "Carrefour giratoire", d: "Tourne dans le sens indiqué et cède aux usagers engagés.", s: BLUE(sk("M50 26 A24 24 0 0 1 72 56", 8, "#fff") + sk("M66 70 A24 24 0 0 1 30 64", 8, "#fff") + sk("M27 50 A24 24 0 0 1 40 28", 8, "#fff") + fl("M64 50 L80 54 L70 66 Z", "#fff") + fl("M38 74 L24 70 L32 58 Z", "#fff") + fl("M34 22 L48 22 L44 36 Z", "#fff")) },
  { f: "obligation", n: "Vitesse minimale obligatoire", d: "Tu dois rouler au moins à la vitesse indiquée.", s: BLUE(tx("30", 34, "#fff")) },
  { f: "obligation", n: "Piste cyclable obligatoire", d: "Voie réservée aux cycles, obligatoire pour eux.", s: BLUE(`<circle cx="34" cy="62" r="11" fill="none" stroke="#fff" stroke-width="4"/><circle cx="68" cy="62" r="11" fill="none" stroke="#fff" stroke-width="4"/>` + sk("M34 62 L46 44 H60 L68 62 M46 44 L54 62 L60 44 M44 38 H52", 4, "#fff")) },

  // Indication
  { f: "indication", n: "Parking", d: "Lieu aménagé pour le stationnement.", s: SQ(tx("P", 58, "#fff", 71)) },
  { f: "indication", n: "Sens unique", d: "La route est à sens unique dans la direction de la flèche.", s: SQ(`<rect x="22" y="34" width="56" height="32" fill="#fff"/>` + fl("M30 46 H58 V40 L72 50 L58 60 V54 H30 Z", PB)) },
  { f: "indication", n: "Voie sans issue", d: "Cette route ne débouche pas : impasse.", s: SQ(`<rect x="43" y="40" width="14" height="44" fill="#fff"/><rect x="26" y="22" width="48" height="16" fill="${PR}"/>`) },
  { f: "indication", n: "Passage pour piétons", d: "Emplacement du passage piétons : cède-leur le passage.", s: SQ(`<path d="M50 16 L84 80 H16 Z" fill="#fff"/>` + PERSON(50, 46, 0.95) + `<path d="M32 77 H68" stroke="${PK}" stroke-width="3" stroke-dasharray="5 3"/>`) },
  { f: "indication", n: "Hôpital", d: "Hôpital à proximité : évite le bruit, sois prudent.", s: SQ(tx("H", 58, "#fff", 71)) },
  { f: "indication", n: "Entrée d’agglomération", d: "Début de la ville : 50 km/h maximum sauf indication.", s: SVGW(`<rect x="6" y="26" width="88" height="48" rx="4" fill="#fff" stroke="${PR}" stroke-width="5"/>` + tx("LOMÉ", 22, PK, 58)) },
];
const SIGN_FAMILIES = [
  ["tous", "Tous"], ["danger", "Danger"], ["priorite", "Priorité"], ["interdiction", "Interdiction"], ["fin", "Fin d’interdiction"], ["obligation", "Obligation"], ["indication", "Indication"],
];
const FAMILY_HINT = {
  danger: "Triangle à bord rouge : un danger approche.",
  priorite: "Formes spéciales : qui passe en premier.",
  interdiction: "Rond à bord rouge : ce qui est interdit.",
  fin: "Rond blanc barré : l’interdiction s’arrête.",
  obligation: "Rond bleu : ce que tu dois faire.",
  indication: "Carré ou rectangle : une information utile.",
};

function init(root) {
  const S = { get(k, d) { try { const v = localStorage.getItem("sodaf." + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
              set(k, v) { try { localStorage.setItem("sodaf." + k, JSON.stringify(v)); } catch (e) {} } };
  const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
  const timers = [];
  const toastEl = $("#sd-toast"); let tT;
  const toast = (m) => { toastEl.textContent = m; toastEl.hidden = false; clearTimeout(tT); tT = setTimeout(() => (toastEl.hidden = true), 2200); };
  const fallback = (t) => { const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); toast("Copié"); } catch (e) { toast("Sélectionne le texte pour le copier"); } ta.remove(); };
  const copy = (t) => { try { navigator.clipboard.writeText(t).then(() => toast("Copié : " + t.slice(0, 40)), () => fallback(t)); } catch (e) { fallback(t); } };
  root.addEventListener("click", (e) => { const b = e.target.closest("[data-copy]"); if (b) copy(b.dataset.copy); });

  // hero slideshow
  const imgs = $$("#sd-slides img"), dots = $$("#sd-dots button"), ruleBox = $("#sd-rule");
  let cur = 0;
  function show(i) {
    cur = (i + imgs.length) % imgs.length;
    imgs.forEach((im, k) => { im.classList.remove("on"); if (k === cur) { void im.offsetWidth; im.classList.add("on"); } });
    dots.forEach((d, k) => d.classList.toggle("on", k === cur));
    ruleBox.style.opacity = 0;
    setTimeout(() => { $("#sd-ruleTag").textContent = SLIDES[cur].tag; $("#sd-ruleText").textContent = SLIDES[cur].rule; ruleBox.style.opacity = 1; }, 350);
  }
  let auto = setInterval(() => show(cur + 1), 6500); timers.push(() => clearInterval(auto));
  dots.forEach((d) => d.addEventListener("click", () => { clearInterval(auto); show(+d.dataset.i); auto = setInterval(() => show(cur + 1), 6500); }));

  // question du jour
  const qd = $("#sd-qday");
  const dayIdx = Math.floor(Date.now() / 86400000) % Q.length;
  const qq = Q[dayIdx];
  qd.innerHTML = optsHTML(qq) + '<div id="sd-qdx"></div>';
  qd.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
    const k = +b.dataset.k;
    qd.querySelectorAll(".opt").forEach((o) => { o.disabled = true; const kk = +o.dataset.k; if (kk === qq[2]) o.classList.add("good"); else if (kk === k) o.classList.add("bad"); });
    qd.querySelector("#sd-qdx").innerHTML = '<div class="explain"><b>' + (k === qq[2] ? "Bonne réponse." : "Pas tout à fait.") + "</b>" + qq[3] + "</div>";
  }));

  const pages = $$("section.page").map((p) => p.dataset.page);
  const nav = $("#sd-nav"), burger = $("#sd-burger");
  burger.addEventListener("click", () => { const o = nav.classList.toggle("open"); burger.setAttribute("aria-expanded", o); });

  const chapters = $$("article.ch");
  let read = S.get("read", []);
  const toc = $("#sd-toc"); let lastPart = "";
  chapters.forEach((ch) => {
    if (ch.dataset.part !== lastPart) { lastPart = ch.dataset.part; const d = document.createElement("div"); d.className = "part"; d.textContent = lastPart; toc.appendChild(d); }
    const b = document.createElement("button"); b.dataset.id = ch.id;
    b.innerHTML = "<span>" + ch.dataset.title + '</span><span class="done"></span>';
    b.addEventListener("click", () => { history.replaceState(null, "", "#" + ch.id); ch.scrollIntoView({ behavior: "smooth", block: "start" }); });
    toc.appendChild(b);
    const rb = document.createElement("button"); rb.className = "btn btn-line btn-sm read-btn"; rb.dataset.id = ch.id;
    rb.addEventListener("click", () => { read = read.includes(ch.id) ? read.filter((x) => x !== ch.id) : [...read, ch.id]; S.set("read", read); syncRead(); if (read.includes(ch.id)) toast("Chapitre marqué comme lu"); });
    const rf = document.createElement("div"); rf.className = "read-foot"; rf.appendChild(rb); ch.appendChild(rf);
  });
  function syncRead() {
    $$(".toc button").forEach((b) => b.classList.toggle("read", read.includes(b.dataset.id)));
    $$(".read-btn").forEach((b) => { const r = read.includes(b.dataset.id), t = (root.querySelector("#" + b.dataset.id) || {}).dataset?.title || "ce chapitre"; b.classList.toggle("done", r); b.textContent = r ? "✓ « " + t + " » : lu" : "Marquer « " + t + " » comme lu"; });
  }
  syncRead();
  // section en cours : le rond du sommaire se colore
  let curId = null;
  const setCur = (id) => {
    if (id === curId) return; curId = id;
    $$(".toc button").forEach((b) => b.classList.toggle("cur", b.dataset.id === id));
    const btn = toc.querySelector('button[data-id="' + id + '"]');
    if (btn && toc.scrollWidth > toc.clientWidth) toc.scrollTo({ left: btn.offsetLeft - toc.clientWidth / 2 + btn.offsetWidth / 2, behavior: "smooth" });
  };
  const spy = () => {
    if (root.querySelector('section[data-page="cours"]').hidden) return;
    const line = 120; let best = chapters[0];
    for (const ch of chapters) { if (ch.getBoundingClientRect().top - line <= 0) best = ch; else break; }
    setCur(best.id);
  };
  window.addEventListener("scroll", spy, { passive: true });
  timers.push(() => window.removeEventListener("scroll", spy));

  const qEl = $("#sd-quiz");
  let quiz = { n: 10, list: [], i: 0, score: 0, answered: false, miss: [] };
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const chTitle = (id) => { const c = root.querySelector("#" + id); return c ? c.dataset.title : ""; };
  function startQuiz(n) { quiz = { n, list: shuffle(Q).slice(0, Math.min(n, Q.length)), i: 0, score: 0, answered: false, miss: [] }; renderQ(); }
  function renderQ() {
    const q = quiz.list[quiz.i], n = quiz.list.length;
    if (!q) return renderResult();
    qEl.innerHTML = '<div class="qbar"><span>Question ' + (quiz.i + 1) + " / " + n + "</span><span>Score " + quiz.score + '</span></div><div class="progress"><i style="width:' + (quiz.i / n) * 100 + '%"></i></div>' + optsHTML(q) + '<div id="sd-exp"></div>';
    quiz.answered = false;
    qEl.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => answer(+b.dataset.k)));
  }
  function answer(k) {
    if (quiz.answered) return; quiz.answered = true;
    const q = quiz.list[quiz.i], ok = k === q[2];
    if (ok) quiz.score++; else quiz.miss.push(q);
    qEl.querySelectorAll(".opt").forEach((b) => { b.disabled = true; const kk = +b.dataset.k; if (kk === q[2]) b.classList.add("good"); else if (kk === k) b.classList.add("bad"); });
    const last = quiz.i === quiz.list.length - 1;
    qEl.querySelector("#sd-exp").innerHTML = '<div class="explain"><b>' + (ok ? "Bonne réponse." : "Pas tout à fait.") + "</b>" + q[3] + ' <a href="#' + q[4] + '">Relire : ' + chTitle(q[4]) + '</a></div><div class="qactions"><span></span><button class="btn btn-green" id="sd-nextQ">' + (last ? "Voir mon résultat" : "Question suivante") + "</button></div>";
    const nb = qEl.querySelector("#sd-nextQ"); nb.addEventListener("click", () => { quiz.i++; renderQ(); }); nb.focus();
  }
  function renderResult() {
    const n = quiz.list.length, pct = Math.round((quiz.score / n) * 100);
    const h = S.get("quiz", { best: null, count: 0 }); h.count++; if (h.best === null || pct > h.best) h.best = pct; S.set("quiz", h);
    const msg = pct >= 88 ? "Niveau examen atteint. Bravo !" : pct >= 70 ? "Bon niveau. Relis les chapitres ci-dessous et recommence." : "Relis les chapitres ci-dessous avant la prochaine série.";
    const chs = [...new Set(quiz.miss.map((q) => q[4]))];
    qEl.innerHTML = '<div class="result"><p class="eyebrow" style="justify-content:center">Résultat</p><div class="big">' + quiz.score + "/" + n + '</div><p style="margin-top:8px">' + msg + "</p></div>" +
      (chs.length ? '<div class="explain" style="margin-top:20px"><b>À relire</b>' + chs.map((c) => '<a href="#' + c + '" style="display:block">' + chTitle(c) + "</a>").join("") + "</div>" : "") +
      '<div class="qactions" style="justify-content:center"><button class="btn btn-green" id="sd-again">Nouvelle série</button><a class="btn btn-line" href="#cours">Revoir les cours</a></div>';
    qEl.querySelector("#sd-again").addEventListener("click", () => startQuiz(quiz.n));
    showBest();
  }
  function showBest() {
    const h = S.get("quiz", { best: null, count: 0 }), el = $("#sd-qbest");
    if (h.best === null) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = "Ton meilleur score : <b>" + h.best + " %</b> · " + h.count + (h.count > 1 ? " séries terminées" : " série terminée") + " · " + (h.best >= 88 ? "niveau examen atteint." : "objectif examen : 88 % (35 sur 40).");
  }
  $$("#sd-modes button").forEach((b) => b.addEventListener("click", () => { $$("#sd-modes button").forEach((x) => x.classList.toggle("on", x === b)); startQuiz(+b.dataset.n); }));
  startQuiz(10);

  // ---------- Devoirs de la semaine ----------
  const devEl = $("#sd-dev");
  const escH = escHtml;
  const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const frDay = (d) => d.getUTCDate() + (d.getUTCDate() === 1 ? "er" : "") + " " + MOIS[d.getUTCMonth()];
  const cap = (t) => t.trim().replace(/\s+/g, " ").toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  let dv = null;
  function devList() {
    const w = devWeek(), sent = S.get("devSent", {}), best = S.get("devBest", {});
    const card = (k, quand) => { const d = DEV[k], mine = sent[w.key + d.l]; return '<div class="devnow"><div class="dl">' + d.l + '</div><div><p class="eyebrow">' + quand + '</p><h3>Devoir ' + d.l + " · " + escH(d.t) + "</h3><p>" +
      (mine != null ? '<span class="done">✓ Envoyé au moniteur : ' + mine + "/" + d.q.length + "</span>" : "10 questions · à faire après ce cours, avant le cours suivant") + '</p></div><div class="devacts">' +
      '<button class="btn btn-yellow" data-dev="' + k + '">' + (mine != null ? "Refaire pour m'entraîner" : "Commencer le devoir") + '</button><a class="btn btn-line btn-sm" href="#' + d.q[0][4] + '">Réviser le cours</a></div></div>'; };
    devEl.innerHTML = '<p class="devwk">Semaine du ' + frDay(w.monday) + " · <b>semaine " + (w.sem + 1) + " sur 6</b> du programme</p>" +
      (w.sem < 5 ? card(w.c[0], "Cours " + (w.c[0] + 1) + " · lundi (groupes A et C) ou mardi (B et D)") + card(w.c[1], "Cours " + (w.c[1] + 1) + " · jeudi (groupes A et C) ou vendredi (B et D)")
        : '<div class="devnow"><div class="dl">6</div><div><p class="eyebrow">Cours 11 et 12</p><h3>Semaine de révision · pas de devoir</h3><p>Révision générale, puis examen blanc en salle. Entraîne-toi avec l\'examen blanc de 40 questions.</p></div><div class="devacts"><a class="btn btn-yellow" href="#quiz">Faire un examen blanc</a></div></div>') +
      '<p class="devlist-h">Tous les devoirs · un par cours, le programme fait le tour en 6 semaines</p><div class="devgrid">' +
      DEV.map((d, k) => '<button class="devtile' + (w.c.includes(k) ? " now" : "") + '" data-dev="' + k + '"><b>' + d.l + "</b><span>" + escH(d.t) + "</span>" +
        (best[d.l] != null ? '<em class="ok">Ta meilleure note : ' + best[d.l] + "/" + d.q.length + "</em>" : "<em>" + (w.c.includes(k) ? "Cette semaine" : "Semaine " + (Math.floor(k / 2) + 1) + " du programme") + "</em>") + "</button>").join("") + "</div>";
    devEl.querySelectorAll("[data-dev]").forEach((b) => b.addEventListener("click", () => devName(+b.dataset.dev)));
  }
  function devName(k) {
    const d = DEV[k], who = S.get("devWho", { p: "", n: "" });
    devEl.innerHTML = '<form class="card devform" novalidate><p class="eyebrow">Devoir ' + d.l + '</p><h3 style="font:700 1.4rem var(--f-display);margin:4px 0 6px">' + escH(d.t) + '</h3><p style="color:var(--muted);margin-bottom:18px">Écris ton prénom et ton nom comme sur ta fiche d\'inscription : c\'est ce nom que le moniteur verra.</p>' +
      '<div class="row2"><div class="field"><label for="sd-dvP">Prénom</label><input id="sd-dvP" autocomplete="given-name" value="' + escH(who.p) + '"></div><div class="field"><label for="sd-dvN">Nom</label><input id="sd-dvN" autocomplete="family-name" value="' + escH(who.n) + '"></div></div>' +
      '<p id="sd-dvErr" style="color:var(--red);font-weight:600;margin:4px 0 10px" hidden>Indique ton prénom et ton nom.</p>' +
      '<div class="qactions"><button class="btn btn-line" type="button" id="sd-dvBack">← Retour</button><button class="btn btn-green" type="submit">Commencer · 10 questions</button></div></form>';
    devEl.querySelector("#sd-dvBack").addEventListener("click", devList);
    devEl.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      const p = cap($("#sd-dvP").value), n = cap($("#sd-dvN").value);
      if (p.length < 2 || n.length < 2) { $("#sd-dvErr").hidden = false; return; }
      S.set("devWho", { p, n });
      dv = { k, d, who: p + " " + n, i: 0, picks: [], order: d.q.map((q) => shuffle(q[1].map((_, j) => j))) };
      devQ();
      devEl.scrollIntoView({ block: "start" });
    });
    $("#sd-dvP").focus();
  }
  function devQ() {
    const q = dv.d.q[dv.i], n = dv.d.q.length, ord = dv.order[dv.i], pick = dv.picks[dv.i];
    devEl.innerHTML = '<div class="quiz card"><div class="qbar"><span>Devoir ' + dv.d.l + " · question " + (dv.i + 1) + " / " + n + "</span><span>" + escH(dv.who) + '</span></div><div class="progress"><i style="width:' + (dv.i / n) * 100 + '%"></i></div>' +
      qVisual(q) + '<p class="qtext">' + q[0] + '</p><div class="opts">' + ord.map((j, k) => '<button class="opt' + (pick === j ? " pick" : "") + '" data-j="' + j + '"><span class="k">' + "ABCD"[k] + "</span><span>" + q[1][j] + "</span></button>").join("") + "</div>" +
      '<div class="qactions"><button class="btn btn-line" type="button" id="sd-dvPrev"' + (dv.i ? "" : " hidden") + '>← Précédente</button><button class="btn btn-green" type="button" id="sd-dvNext"' + (pick == null ? " disabled" : "") + ">" + (dv.i === n - 1 ? "Terminer et envoyer" : "Question suivante →") + "</button></div></div>";
    devEl.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
      dv.picks[dv.i] = +b.dataset.j;
      devEl.querySelectorAll(".opt").forEach((x) => x.classList.toggle("pick", x === b));
      $("#sd-dvNext").disabled = false;
    }));
    $("#sd-dvPrev").addEventListener("click", () => { dv.i--; devQ(); });
    $("#sd-dvNext").addEventListener("click", () => { if (dv.i < n - 1) { dv.i++; devQ(); } else devResult(); });
  }
  function devResult() {
    const d = dv.d, n = d.q.length, w = devWeek(), score = d.q.reduce((s, q, i) => s + (dv.picks[i] === q[2] ? 1 : 0), 0);
    const best = S.get("devBest", {}); if (best[d.l] == null || score > best[d.l]) best[d.l] = score; S.set("devBest", best);
    const sent = S.get("devSent", {}), sk = w.key + d.l, already = sent[sk] != null && S.get("devSentWho", {})[sk] === dv.who;
    const msg = score >= 9 ? "Excellent, niveau examen !" : score >= 7 ? "Bon travail. Relis les questions ratées." : "Relis le cours, puis refais le devoir pour t'entraîner.";
    const share = "SODAF Auto-École · Devoir " + d.l + " (" + d.t + ") : " + score + "/" + n + " · " + dv.who;
    devEl.innerHTML = '<div class="quiz card devres"><p class="eyebrow" style="justify-content:center">Devoir ' + d.l + " · " + escH(d.t) + '</p><div class="big result" style="font:800 5rem/1 var(--f-display);color:var(--green);margin-top:10px">' + score + "/" + n + '</div><p class="who">' + escH(dv.who) + '</p><p style="margin-top:6px">' + msg + '</p><div id="sd-dvSent"></div>' +
      '<div class="corr">' + d.q.map((q, i) => { const ok = dv.picks[i] === q[2]; return '<div class="' + (ok ? "ok" : "ko") + '"><p><b>' + (i + 1) + ". " + q[0] + "</b></p><small>" + (ok ? "✓ " + q[1][q[2]] : "Ta réponse : " + q[1][dv.picks[i]] + " · Bonne réponse : <b>" + q[1][q[2]] + "</b>") + " — " + q[3] + "</small></div>"; }).join("") + "</div>" +
      '<div class="qactions" style="justify-content:center"><a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(share) + '">Partager sur WhatsApp</a><button class="btn btn-line btn-sm" type="button" id="sd-dvList">Retour aux devoirs</button></div></div>';
    $("#sd-dvList").addEventListener("click", () => { devList(); devEl.scrollIntoView({ block: "start" }); });
    devEl.scrollIntoView({ block: "start" });
    const box = $("#sd-dvSent");
    if (already) { box.innerHTML = '<span class="devsent">Entraînement : ton résultat de cette semaine est déjà chez le moniteur.</span>'; return; }
    const send = async () => {
      box.innerHTML = '<span class="devsent">Envoi au moniteur…</span>';
      const ok = await DB.add("devoir_resultats", { eleve_nom: dv.who, devoir: d.l, note: score, sur: n, semaine: w.key });
      if (ok) {
        const s2 = S.get("devSent", {}); s2[sk] = score; S.set("devSent", s2);
        const sw = S.get("devSentWho", {}); sw[sk] = dv.who; S.set("devSentWho", sw);
        box.innerHTML = '<span class="devsent ok">✓ Résultat envoyé au moniteur</span>';
      } else {
        box.innerHTML = '<span class="devsent ko">Pas de connexion : résultat non envoyé.</span> <button class="linkbtn" type="button" id="sd-dvRetry">Réessayer</button>';
        $("#sd-dvRetry").addEventListener("click", send);
      }
    };
    send();
  }
  devList();
  { const pp = $("#sd-progPub"); if (pp) { const w = devWeek(); pp.innerHTML = '<p class="eyebrow">Le programme du code en salle</p><h3 style="margin-top:10px">12 cours en 6 semaines, puis il recommence</h3><p style="margin-top:8px;color:var(--muted)">Tous les groupes suivent le même cours la même semaine. Tu commences n\'importe quelle semaine : en 6 semaines, tu as tout vu. Après chaque cours, un devoir de 10 questions sur le site.</p><div class="prog">' + progRows(w.sem, w.monday) + "</div>"; } }

  // ---------- Reçus de paiement (Espace équipe) ----------
  let rcPublic = () => {};
  (function () {
    const form = $("#sd-rcForm"); if (!form) return;
    const F = { f: $("#sd-rcForm select[name=formation]"), amt: $("#sd-rcAmt"), rest: $("#sd-rcRest"), restBox: $("#sd-rcRestBox"), other: $("#sd-rcOther") };
    const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F") + "\u00A0F";
    const price = () => +(F.f.selectedOptions[0].dataset.p || 0);
    const mk = () => (form.querySelector("input[name=motif]:checked") || {}).value || "autre";
    const MOTIF = { "ins-half": "Droit d'inscription + 1re moitié de la formation", "ins-full": "Droit d'inscription + formation complète", rest: "2e moitié de la formation (solde)", seance: "Séance de conduite supplémentaire", examen: "Dépôt pour l'inscription à l'examen d'État" };
    const motifText = () => mk() === "autre" ? (F.other.value.trim() || "Autre paiement") : MOTIF[mk()];
    function calc(k, p) {
      if (k === "ins-half") return p ? [5000 + p / 2, p / 2] : null;
      if (k === "ins-full") return p ? [5000 + p, 0] : null;
      if (k === "rest") return p ? [p / 2, 0] : null;
      if (k === "seance") return [5000, ""];
      if (k === "examen") return [30000, ""];
      return ["", ""];
    }
    function suggest() {
      const p = price();
      form.querySelectorAll(".rcm").forEach((l) => {
        const k = l.dataset.k, c = calc(k, p), em = l.querySelector("[data-amt]");
        const off = c === null; l.hidden = off;
        if (em) em.textContent = !off && c[0] !== "" ? fmt(c[0]) : "";
      });
      if (form.querySelector(".rcm:not([hidden]) input:checked") === null) { const first = form.querySelector(".rcm:not([hidden]) input"); if (first) first.checked = true; }
      const k = mk(), c = calc(k, p) || ["", ""];
      F.amt.value = c[0] === "" ? "" : Math.round(c[0]);
      F.rest.value = c[1] === "" ? "" : Math.round(c[1]);
      F.restBox.hidden = !(k === "ins-half" || k === "ins-full" || k === "rest");
      F.other.hidden = k !== "autre";
      form.querySelectorAll(".rcm").forEach((l) => l.classList.toggle("on", l.querySelector("input").checked));
    }
    F.f.addEventListener("change", suggest); form.querySelectorAll("input[name=motif]").forEach((r) => r.addEventListener("change", () => { suggest(); if (mk() === "autre") F.other.focus(); })); suggest();
    const U = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize"];
    const T = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "", "quatre-vingt"];
    function u100(n) {
      if (n < 17) return U[n];
      if (n < 20) return "dix-" + U[n - 10];
      const t = Math.floor(n / 10), r = n % 10;
      if (t === 7 || t === 9) return (t === 7 ? "soixante" : "quatre-vingt") + (t === 7 && r === 1 ? " et " : "-") + u100(10 + r);
      if (r === 0) return t === 8 ? "quatre-vingts" : T[t];
      if (r === 1 && t !== 8) return T[t] + " et un";
      return T[t] + "-" + U[r];
    }
    function u1000(n) {
      const h = Math.floor(n / 100), r = n % 100;
      let s = h ? (h === 1 ? "cent" : U[h] + " cent" + (r === 0 ? "s" : "")) : "";
      if (r) s += (s ? " " : "") + u100(r);
      return s;
    }
    function lettres(n) {
      n = Math.round(n); if (!n) return "zéro";
      const m = Math.floor(n / 1e6), k = Math.floor((n % 1e6) / 1000), r = n % 1000, parts = [];
      if (m) parts.push(m === 1 ? "un million" : u1000(m) + " millions");
      if (k) parts.push(k === 1 ? "mille" : u1000(k).replace(/cents$/, "cent").replace(/vingts$/, "vingt") + " mille");
      if (r) parts.push(u1000(r));
      const s = parts.join(" ");
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    window.__sodafLettres = lettres;
    const escR = escHtml;
    const pad = (x) => String(x).padStart(2, "0");
    let current = null, lib = null;
    function loadLib() {
      if (lib) return lib;
      lib = new Promise((res, rej) => { const s = document.createElement("script"); s.src = "/lib/html2pdf.bundle.min.js"; s.onload = () => res(window.html2pdf); s.onerror = rej; document.head.appendChild(s); });
      return lib;
    }
    function rcEncode(d) {
      const a = [d.no, d.when, d.eleve, (d.tel || "").replace(/\s/g, ""), d.formation, d.prix, d.motif, d.montant, d.mode, d.reste === "" ? -1 : d.reste, d.note || ""];
      return btoa(unescape(encodeURIComponent(JSON.stringify(a)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }
    function rcEncodeArr(a) { return btoa(unescape(encodeURIComponent(JSON.stringify(a)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
    function rcDecode(str) {
      const a = JSON.parse(decodeURIComponent(escape(atob(str.replace(/-/g, "+").replace(/_/g, "/")))));
      const [no, when, eleve, tel, formation, prix, motif, montant, mode, reste, note] = a;
      const t = new Date(when + ":00"), MO = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
      return { no, when, eleve, tel: tel ? tel.replace(/(\d{2})(?=\d)/g, "$1 ") : "", formation, prix, motif, montant, mode, reste: reste < 0 ? "" : reste, note, faitpar: "Le secrétariat",
        dateTxt: "Le " + t.getDate() + (t.getDate() === 1 ? "er" : "") + " " + MO[t.getMonth()] + " " + t.getFullYear() + " à " + t.getHours() + " h " + pad(t.getMinutes()) };
    }
    // Utilisés par l'espace équipe : pré-remplir le reçu depuis la fiche élève, revoir un reçu enregistré
    const nameIn = $("#sd-rcName"), eidIn = $("#sd-rcEid");
    function fillFrom(x) {
      eidIn.value = x.id; nameIn.value = x.nom;
      $("#sd-rcTel").value = (x.telephone || "").replace(/\D/g, "").replace(/^228/, "").replace(/(\d{2})(?=\d)/g, "$1 ");
      const o = [...F.f.options].find((op) => x.formation && op.textContent.toLowerCase().startsWith(x.formation.toLowerCase()));
      if (o) F.f.value = o.value || o.textContent;
      suggest();
    }
    window.__sodafRcFill = (x, o) => {
      $("#sd-rcOut").hidden = true; form.reset(); fillFrom(x);
      if (o) {
        const op = [...F.f.options].find((q) => q.textContent === o.formation); if (op) F.f.value = op.value || op.textContent;
        suggest();
        const mr = form.querySelector('input[name=motif][value="' + o.motif + '"]'); if (mr && !mr.closest(".rcm").hidden) { mr.checked = true; suggest(); }
        const md = form.querySelector('input[name=mode][value="' + o.mode + '"]'); if (md) md.checked = true;
        if (o.note) $("#sd-rcNote").value = o.note;
      }
      $("#equipe-recu").scrollIntoView({ block: "start" });
    };
    nameIn.addEventListener("input", () => {
      const list = (window.TEAM_ELEVES && window.TEAM_ELEVES()) || [];
      const x = list.find((y) => y.nom.toLowerCase() === nameIn.value.trim().toLowerCase());
      if (x) { if (+eidIn.value !== x.id) fillFrom(x); } else eidIn.value = "";
    });
    window.__sodafRcLink = (p) => {
      if (p.jeton) return "https://autosodaf.com/#recu-" + p.numero + "-" + p.jeton;
      const t = new Date(p.cree_le);
      const when = t.getFullYear() + "-" + pad(t.getMonth() + 1) + "-" + pad(t.getDate()) + "T" + pad(t.getHours()) + ":" + pad(t.getMinutes());
      return "https://autosodaf.com/#recu-" + rcEncode({ no: p.numero, when, eleve: p.eleve_nom, tel: (p.telephone || "").replace(/\D/g, "").replace(/^228/, ""), formation: p.formation || "", prix: p.prix || 0, motif: p.motif, montant: p.montant, mode: p.mode, reste: p.reste == null ? "" : p.reste, note: p.note || "" });
    };
    async function makePdf(d) {
      const h2p = await loadLib();
      const node = document.createElement("div"); node.className = "rc-render"; node.innerHTML = receiptHTML(d); document.body.appendChild(node);
      await Promise.all([...node.querySelectorAll("img")].map((im) => im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; })));
      const blob = await h2p().set({ margin: 0, image: { type: "jpeg", quality: 0.95 }, html2canvas: { scale: 2.5, backgroundColor: "#ffffff", useCORS: true }, jsPDF: { unit: "mm", format: "a5", orientation: "portrait" } }).from(node.firstChild).outputPdf("blob");
      node.remove();
      return new File([blob], "Recu-SODAF-" + d.no + ".pdf", { type: "application/pdf" });
    }
    rcPublic = async function (str) {
      const box = $("#sd-rcPub"), btn = $("#sd-rcPubDl");
      const sm = /^(\d{6}-\d{4}-\d{2})-([A-Za-z0-9]{6,32})$/.exec(str || "");
      if (sm) {
        box.innerHTML = '<p class="insc-load">Chargement du reçu…</p>'; btn.hidden = true;
        let r = null; try { r = await DB.q("rpc/recu_info", { method: "POST", body: { p_no: sm[1], p_jeton: sm[2] }, anon: true }); } catch (e) {}
        if (!r || !r.a) { box.innerHTML = '<p class="card">Ce reçu est introuvable. Demande au secrétariat SODAF de te le renvoyer : +228 72 54 41 66.</p>'; return; }
        str = rcEncodeArr(r.a); if (r.annule) box.dataset.annule = "1"; else delete box.dataset.annule;
      }
      let d; try { d = rcDecode(str); } catch (e) { box.innerHTML = '<p class="card">Ce lien de reçu est incomplet. Demande au secrétariat SODAF de te le renvoyer : +228 72 54 41 66.</p>'; btn.hidden = true; return; }
      box.innerHTML = (box.dataset.annule ? '<p class="card" style="border-left:5px solid #C8372D;margin-bottom:12px"><b>Reçu annulé.</b> Ce reçu a été annulé par le secrétariat SODAF.</p>' : "") + receiptHTML(d); btn.hidden = !!box.dataset.annule;
      btn.onclick = async () => {
        btn.disabled = true; const t = btn.textContent; btn.textContent = "Préparation du PDF…";
        try { const f = await makePdf(d); const a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
        catch (e) {}
        btn.disabled = false; btn.textContent = t;
      };
    };
    function receiptHTML(d) {
      const ex = /examen/i.test(d.motif || "");
      return '<div class="rc">' +
        '<div class="rc-top"><div class="rc-logo">' + LOGO("#FFFFFF", "word") + '<small>Auto-école · Lomé, Togo</small></div><div class="rc-no"><b>Reçu de paiement</b><span>N° ' + escR(d.no) + "</span><span>" + escR(d.dateTxt) + "</span></div></div>" +
        '<div class="rc-body">' +
        '<div class="rc-row"><span>Reçu de</span><b>' + escR(d.eleve) + "</b>" + (d.tel ? "<em>+228 " + escR(d.tel) + "</em>" : "") + "</div>" +
        '<div class="rc-row"><span>Formation</span><b>' + escR(d.formation) + "</b>" + (d.prix && !ex ? "<em>Prix de la formation : " + fmt(d.prix) + "</em>" : "") + "</div>" +
        '<div class="rc-row"><span>Motif</span><b>' + escR(d.motif) + "</b></div>" +
        '<div class="rc-amt"><span>Montant reçu</span><b>' + fmt(d.montant) + "</b><em>" + escR(lettres(d.montant)) + " francs CFA</em></div>" +
        '<div class="rc-grid"><div><span>Mode de paiement</span><b>' + escR(d.mode) + "</b></div><div><span>Reste à payer</span><b>" + (ex ? "Soldé ✓" : d.reste === "" ? "—" : d.reste > 0 ? fmt(d.reste) : "Formation soldée ✓") + "</b></div></div>" +
        (d.note ? '<p class="rc-note">' + escR(d.note) + "</p>" : "") +
        '<div class="rc-cond"><b>Bon à savoir</b>' + (ex ? "Ce dépôt couvre l\'inscription à l\'examen d\'État. SODAF dépose ton dossier ; l\'État t\'envoie ensuite par message la date de ton examen, à passer à SOTOPLA. Le jour de l\'examen : ta carte d\'identité originale. Garde ce reçu jusqu\'au résultat." : "Le droit d\'inscription n\'est pas remboursable. Une séance de conduite non faite peut être reportée pendant 6 mois. Garde ce reçu jusqu\'à la fin de ta formation.") + "</div>" +
        '<div class="rc-sign"><div><span>Pour SODAF Auto-École</span><b>' + "Le secrétariat" + '</b><small>Reçu électronique enregistré au secrétariat sous le n° ' + escR(d.no) + ".</small></div><img src=\"/entreprise/cachet-sodaf-bleu.png\" alt=\"\"></div>" +
        "</div>" +
        '<div class="rc-foot"><span>412 Avenue Akei, Tokoin Tamé, Lomé · +228 72 54 41 66 · autosodaf.com</span><b>L\'art de conduire, la force de réussir.</b></div>' +
        "</div>";
    }
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const eleve = String(fd.get("eleve") || "").trim().replace(/\s+/g, " "), tel = String(fd.get("tel") || "").replace(/\D/g, "");
      const montant = +F.amt.value, err = $("#sd-rcErr");
      if (eleve.length < 3 || !(montant > 0) || (tel && tel.length !== 8)) { err.hidden = false; return; }
      err.hidden = true;
      const now = new Date();
      const no = String(now.getFullYear()).slice(2) + pad(now.getMonth() + 1) + pad(now.getDate()) + "-" + pad(now.getHours()) + pad(now.getMinutes()) + "-" + pad(Math.floor(Math.random() * 100));
      const MO = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
      const d = {
        no, eleve, tel: tel ? tel.replace(/(\d{2})(?=\d)/g, "$1 ") : "", formation: F.f.value, prix: price(), motif: motifText(), montant,
        mode: String(fd.get("mode")), reste: F.restBox.hidden || F.rest.value === "" ? "" : +F.rest.value, note: String(fd.get("note") || "").trim(),
        faitpar: "Le secrétariat", dateTxt: "Le " + now.getDate() + (now.getDate() === 1 ? "er" : "") + " " + MO[now.getMonth()] + " " + now.getFullYear() + " à " + now.getHours() + " h " + pad(now.getMinutes()),
        iso: now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()),
      };
      
      d.when = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) + "T" + pad(now.getHours()) + ":" + pad(now.getMinutes());
      const out = $("#sd-rcOut"), status = $("#sd-rcStatus");
      $("#sd-rcPreview").innerHTML = receiptHTML(d);
      const jt = (() => { const a = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789", r = new Uint32Array(8); crypto.getRandomValues(r); return [...r].map((n) => a[n % a.length]).join(""); })();
      const longLink = "https://autosodaf.com/#recu-" + rcEncode(d), link = "https://autosodaf.com/#recu-" + no + "-" + jt;
      const isEx = /examen/i.test(d.motif), sp = (v) => fmt(v).replace(/[\u202F\u00A0]/g, " ");
      const mkMsg = (lk) => "Bonjour " + eleve.split(" ")[0] + ",\n\nMerci pour ton paiement. Voici ton *reçu officiel SODAF Auto-École*.\n\n*TON REÇU*\n• N° : " + no + "\n• Montant : " + sp(montant) + "\n• Motif : " + d.motif + "\n• Reste à payer : " + (isEx || d.reste === 0 ? "soldé ✓" : d.reste > 0 ? sp(d.reste) : "—") + "\n\nVoir et télécharger ton reçu :\n" + lk + "\n\nGarde-le précieusement " + (isEx ? "jusqu'au résultat de ton examen." : "jusqu'à la fin de ta formation.") + (!isEx && d.reste > 0 ? "\n\n*TON SOLDE : " + sp(d.reste) + "*\nTu as *2 semaines* pour le régler, soit *avant le " + new Date(Date.now() + 14 * 864e5).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) + "*.\n• D'ici là, tu suis les cours de code en salle avec le moniteur.\n• Passé ce délai sans paiement, tu continues le code en ligne sur autosodaf.com, jusqu'au règlement.\n• Dès que le solde est réglé, tu retrouves ta place en salle et nous réservons tes séances de conduite." : "") + (!isEx && d.reste === 0 && mk() === "rest" ? soldeOk() : "") + "\n\n*L'équipe SODAF · L'art de conduire, la force de réussir.*";
      // 2e paiement (solde) : il continue le code en salle et commence la conduite
      function soldeOk() {
        const i = (window.TEAM_INFO && window.TEAM_INFO(+($("#sd-rcEid").value || 0))) || { code: true };
        const code = !i.code ? "" : i.fini ? "\n• *Code* : ton cycle en salle est terminé ; tu peux toujours venir au rattrapage et examen blanc du *mercredi à 14 h 30*, et réviser sur autosodaf.com." : i.susp ? (i.groupe ? "\n• *Code* : ta place au cours de code en salle est *rétablie*, " + i.groupe + "." : "\n• *Code* : tu retrouves une place au cours de code en salle ; nous t'envoyons tes horaires.") : "\n• *Code* : tu continues les cours de code en salle" + (i.groupe ? " avec ton groupe, " + i.groupe : "") + ".";
        return "\n\n*TA FORMATION EST SOLDÉE*" + code + "\n• *Conduite* : tu peux maintenant *commencer tes séances de conduite*" + (i.quota ? " (" + i.quota + " séances d'une heure prévues dans ta formule)" : "") + ".\n• Pour réserver ta première séance, réponds simplement à ce message ou passe à l'agence : nous choisissons ensemble le créneau qui t'arrange (en semaine de 6 h 30 à 10 h 45 et de 15 h 45 à 17 h 45, le samedi matin).";
      }
      const mkEx = (lk) => "Bonjour " + eleve.split(" ")[0] + ",\n\nNous avons bien reçu ton *dossier d'examen complet* et ton dépôt. Merci !\n\n*TON REÇU*\n• N° : " + no + "\n• Montant : " + sp(montant) + "\n• Motif : " + d.motif + "\n• Soldé ✓\n\nVoir et télécharger ton reçu :\n" + lk + "\n\n*LA SUITE*\n• SODAF dépose ton dossier auprès de l'État.\n• Tu recevras ensuite un *message officiel* avec la date de ton examen, à passer à *SOTOPLA*.\n• Le jour de l'examen : ta carte d'identité originale et 30 minutes d'avance.\n\nUne question ? Écris-nous ici sur WhatsApp, ou appelle le *+228 72 54 41 66*.\n\nToute l'équipe SODAF te souhaite bonne chance !\n*L'équipe SODAF · L'art de conduire, la force de réussir.*";
      const msg = isEx ? mkEx(link) : mkMsg(link);
      const wa = $("#sd-rcWa");
      wa.href = tel ? "https://wa.me/228" + tel + "?text=" + encodeURIComponent(msg) : "https://wa.me/?text=" + encodeURIComponent(msg);
      wa.textContent = tel ? "Envoyer sur WhatsApp à " + eleve.split(" ")[0] : "Envoyer sur WhatsApp (choisir le contact)";
      out.hidden = false; status.textContent = "Préparation du PDF…"; status.className = "devsent";
      $("#sd-rcShare").disabled = true; $("#sd-rcDl").disabled = true;
      out.scrollIntoView({ block: "start" });
      // Enregistrement dans la base SODAF
      const sv = $("#sd-rcSaved"); sv.textContent = "Enregistrement…"; sv.className = "devsent";
      const eid = +($("#sd-rcEid").value || 0) || null, rcMotif = mk();
      DB.q("paiements", { method: "POST", prefer: "return=minimal", body: { numero: no, jeton: jt, jour: d.iso, eleve_id: eid, eleve_nom: eleve, telephone: tel ? "+228" + tel : null, formation: d.formation, prix: d.prix || null, motif: d.motif, montant, mode: d.mode, reste: d.reste === "" ? null : d.reste, note: d.note || null } })
        .then(() => { sv.textContent = "✓ Enregistré dans la base (Paiements)"; sv.className = "devsent ok"; if (window.TEAM_RELOAD_PAY) window.TEAM_RELOAD_PAY(); window.dispatchEvent(new CustomEvent("sodaf-recu-enregistre", { detail: { eid, motif: rcMotif } })); })
        .catch((er) => { const m2 = isEx ? mkEx(longLink) : mkMsg(longLink); wa.href = tel ? "https://wa.me/228" + tel + "?text=" + encodeURIComponent(m2) : "https://wa.me/?text=" + encodeURIComponent(m2); if (current) current.msg = m2; sv.textContent = er.status === 401 ? "Session expirée : reconnecte-toi, puis refais le reçu." : "Pas de connexion : reçu non enregistré. Note-le et refais-le plus tard."; sv.className = "devsent ko"; });
      try {
        const file = await makePdf(d);
        current = { file, d };
        status.textContent = "✓ PDF prêt"; status.className = "devsent ok";
        $("#sd-rcShare").disabled = false; $("#sd-rcDl").disabled = false;
        current.msg = msg;
        current.canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
        $("#sd-rcShare").hidden = !current.canShare;
      } catch (er) {
        status.textContent = "Le PDF n'a pas pu être créé. Vérifie la connexion et réessaie."; status.className = "devsent ko";
      }
    });
    function dlPdf() {
      const a = document.createElement("a"); a.href = URL.createObjectURL(current.file); a.download = current.file.name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }
    $("#sd-rcDl").addEventListener("click", () => { if (current) dlPdf(); });
    $("#sd-rcShare").addEventListener("click", async () => {
      if (!current) return;
      try { await navigator.share({ files: [current.file], text: current.msg, title: "Reçu SODAF" }); } catch (er) {}
    });
    // Reçu envoyé : on vide le formulaire et l'espace équipe passe au dossier suivant
    $("#sd-rcWa").addEventListener("click", () => {
      const eid = +($("#sd-rcEid").value || 0) || null, k = mk();
      setTimeout(() => { form.reset(); $("#sd-rcEid").value = ""; suggest(); $("#sd-rcOut").hidden = true; current = null; window.dispatchEvent(new CustomEvent("sodaf-recu-envoye", { detail: { eid, motif: k } })); }, 400);
    });
    $("#sd-rcNew").addEventListener("click", () => { form.reset(); $("#sd-rcEid").value = ""; suggest(); $("#sd-rcOut").hidden = true; current = null; form.scrollIntoView({ block: "start" }); });
  })();

  const sp = $("#sd-speed"), MAX = 340;
  function calc() {
    const v = +sp.value, d = v / 10, re = d * 3, dry = d * d, frDry = Math.max(dry - re, 0), frWet = frDry * 2, wet = re + frWet;
    $("#sd-spv").textContent = v; $("#sd-dDry").textContent = Math.round(dry) + " m"; $("#sd-dWet").textContent = Math.round(wet) + " m";
    $("#sd-bDryR").style.width = (re / MAX) * 100 + "%"; $("#sd-bDryF").style.width = (frDry / MAX) * 100 + "%";
    $("#sd-bWetR").style.width = (re / MAX) * 100 + "%"; $("#sd-bWetF").style.width = (frWet / MAX) * 100 + "%";
    $("#sd-spText").textContent = "À " + v + " km/h, tu parcours environ " + Math.round(re) + " m par seconde. Garde au moins " + Math.round(re * 2) + " m avec le véhicule devant.";
  }
  sp.addEventListener("input", calc); calc();

  const today = new Date().toISOString().slice(0, 10);
  let ck = S.get("check", { d: today, v: [] }); if (ck.d !== today) ck = { d: today, v: [] };
  const ckEl = $("#sd-check");
  ckEl.innerHTML = CK.map((t, i) => '<label><input type="checkbox" id="sd-ck' + i + '" data-i="' + i + '"><span>' + t + "</span></label>").join("");
  const syncCk = () => { ckEl.querySelectorAll("input").forEach((c) => { c.checked = ck.v.includes(+c.dataset.i); c.parentElement.classList.toggle("ok", c.checked); }); $("#sd-ckCount").textContent = ck.v.length; };
  ckEl.addEventListener("change", (e) => { const i = +e.target.dataset.i; ck.v = e.target.checked ? [...ck.v, i] : ck.v.filter((x) => x !== i); S.set("check", ck); syncCk(); if (ck.v.length === 12) toast("Véhicule prêt. Bonne route !"); });
  $("#sd-ckReset").addEventListener("click", () => { ck.v = []; S.set("check", ck); syncCk(); });
  syncCk();

  $$("[data-cat]").forEach((a) => a.addEventListener("click", () => { $("#sd-fCat").value = a.dataset.cat; if (a.dataset.msg) $("#sd-fMsg").value = a.dataset.msg; }));
  const telIn = $("#sd-fPhone");
  const telDigits = () => { let d = telIn.value.replace(/\D/g, ""); if (d.length > 8 && d.startsWith("228")) d = d.slice(3); return d.slice(0, 8); };
  telIn.addEventListener("input", () => { telIn.value = telDigits().replace(/(\d{2})(?=\d)/g, "$1 "); });
  const form = $("#sd-form"), sendBtn = $("#sd-send");
  const fieldsBox = () => [...form.children].filter((c) => !["sd-ok", "sd-fail"].includes(c.id));
  let lastPayload = null;
  async function submitInscription(payload, waText) {
    $("#sd-fail").hidden = true;
    sendBtn.disabled = true; sendBtn.textContent = "Envoi en cours…";
    const ok = await DB.add("eleves", { nom: payload.nom, nom_famille: payload.nom_famille || null, prenoms: payload.prenoms || null, telephone: "+228" + payload.telephone.replace(/\D/g, "").slice(-8), formation: payload.formation, quartier: payload.quartier || null, message: payload.message || null, source: "site" });
    sendBtn.disabled = false; sendBtn.textContent = "Envoyer ma pré-inscription";
    $("#sd-waFail").href = WA + "?text=" + encodeURIComponent(waText);
    if (!ok) { $("#sd-fail").hidden = false; return; }
    const now = new Date();
    $("#sd-okWhen").textContent = "Reçue le " + now.toLocaleDateString("fr-FR") + " à " + now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    $("#sd-okName").textContent = payload.nom.split(" ")[0];
    $("#sd-okPhone").textContent = payload.telephone;
    const catLabel = $("#sd-fCat").selectedOptions[0].textContent;
    const rows = [["Formation", catLabel], ["Quartier", payload.quartier || "—"]];
    $("#sd-okRecap").innerHTML = rows.map(([k, v]) => "<dt>" + k + "</dt><dd>" + String(v).replace(/[<>&]/g, "") + "</dd>").join("");
    $("#sd-waLink").href = WA + "?text=" + encodeURIComponent("Bonjour SODAF, je viens d'envoyer ma pré-inscription sur le site (" + payload.nom + ", " + payload.formation + "). Quand puis-je passer au secrétariat ?");
    fieldsBox().forEach((c) => (c.hidden = true));
    $("#sd-ok").hidden = false;
    $("#sd-ok").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (sendBtn.disabled) return;
    const nf = $("#sd-fName").value.trim().replace(/\s+/g, " "), pr = $("#sd-fFirst").value.trim().replace(/\s+/g, " "), name = (pr + " " + nf).trim(), digits = telDigits(), phone = "+228 " + digits.replace(/(\d{2})(?=\d)/g, "$1 ");
    const okForm = nf.length >= 2 && pr.length >= 2 && digits.length === 8;
    $("#sd-fErr").hidden = okForm;
    if (!okForm) return;
    lastPayload = { nom: name, nom_famille: nf, prenoms: pr, telephone: phone, formation: $("#sd-fCat").value, quartier: $("#sd-fCity").value.trim(), message: $("#sd-fMsg").value.trim(), source: "Site web" };
    const waText = "Bonjour SODAF, je souhaite m'inscrire.\nNom : " + name + "\nTéléphone : " + phone + "\nFormation : " + lastPayload.formation + "\nQuartier : " + (lastPayload.quartier || "—") + (lastPayload.message ? "\nMessage : " + lastPayload.message : "");
    submitInscription(lastPayload, waText);
  });
  $("#sd-retry").addEventListener("click", () => form.requestSubmit());
  $("#sd-again").addEventListener("click", () => {
    form.reset(); $("#sd-ok").hidden = true; fieldsBox().forEach((c) => (c.hidden = false)); $("#sd-fErr").hidden = true; $("#sd-fail").hidden = true; $("#sd-fName").focus();
  });

  // ---------- Espace équipe (connexion + données Supabase) ----------
  const TEAM = (function () {
    const lock = $("#sd-teamLock"), panel = $("#sd-teamPanel");
    const J = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"], M = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
    const esc = escHtml;
    const pad = (x) => String(x).padStart(2, "0");
    const iso = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    const dOf = (s) => new Date(s + "T12:00:00");
    const longDay = (s) => { const d = dOf(s); return J[d.getDay()] + " " + d.getDate() + " " + M[d.getMonth()]; };
    const F = (n) => milliers(n) + " F";
    const hmin = (h) => { const m = /(\d+) h ?(\d*)/.exec(h) || [0, 0, 0]; return +m[1] * 60 + (+m[2] || 0); };
    const waNum = (t) => (t || "").replace(/\D/g, "").replace(/^228/, "");
    let me = null, eleves = [], cdDay = iso(new Date());
    const toastEl = $("#sd-tmToast");
    let toastT = 0;
    function toast(msg, bad) { toastEl.textContent = msg; toastEl.className = "tm-toast" + (bad ? " bad" : ""); toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (toastEl.hidden = true), bad ? 6000 : 2500); }
    async function run(fn, okMsg) {
      try { const r = await fn(); if (okMsg) toast(okMsg); return r; }
      catch (e) {
        if (e.status === 401 || /JWT|Session|Refresh/i.test(e.message)) { await DB.logout(); show(false); $("#sd-teamErr").textContent = "Session expirée : reconnecte-toi."; $("#sd-teamErr").hidden = false; }
        else toast("Erreur : " + (navigator.onLine === false ? "pas de connexion internet" : e.message), true);
        return null;
      }
    }
    function show(ok) { lock.hidden = ok; panel.hidden = !ok; }

    // Onglets principaux et sous-onglets
    const tabs = $$("#sd-tmTabs button"), panes = $$(".tm-pane");
    // Le planning conduite est partagé : affiché dans le Secrétariat et dans l'espace Moniteur (même section, mêmes règles)
    const cdSec = $('section.tm-sec[data-s="conduite"]'), cdHome = { p: cdSec.parentNode, n: cdSec.nextSibling };
    const placePlanning = (t) => {
      if (t === "mon") { const slot = $("#sd-mnPlanSlot"); if (cdSec.parentNode !== slot) slot.appendChild(cdSec); cdSec.hidden = false; (eleves.length ? Promise.resolve() : loadEleves(true)).then(() => loadDay()); }
      else if (cdSec.parentNode !== cdHome.p) { cdHome.p.insertBefore(cdSec, cdHome.n); const on = $('#sd-secNav button[aria-selected="true"]'); cdSec.hidden = !on || on.dataset.s !== "conduite"; }
    };
    const pick = (t) => { if (t === "sec" && me && me.role === "moniteur") t = "mon"; if (t === "mon" && me && me.role === "secretariat") t = "sec"; tabs.forEach((b) => b.setAttribute("aria-selected", b.dataset.t === t)); panes.forEach((p) => (p.hidden = p.dataset.pane !== t)); try { S.set("tmTab", t); } catch (e) {} placePlanning(t); if (t === "mon" || (t === "sec" && $("#sd-secAuj"))) loadMon(); if (t === "dir") loadDir(); if (t === "ger") grCharger(); msVoirFil(false); if (t === "msg") { MS.repere = {}; MS.forceBas = true; msRender(); msNotifBox(); if (!isWide()) setTimeout(() => $(".ms-wrap").scrollIntoView({ block: "start" }), 60); } };
    tabs.forEach((b) => b.addEventListener("click", () => pick(b.dataset.t)));
    const subs = $$("#sd-secNav button[data-s]"), secs = $$(".tm-sec");
    const LOAD = { eleves: () => loadEleves(), conduite: () => loadDay(), paiements: () => loadPay(), devoirs: () => loadDev() };
    const sub = (k) => { if (k === "paiements" && me && me.role === "moniteur") { toast("Les reçus sont faits par le secrétariat ou la direction."); return; } subs.forEach((b) => b.setAttribute("aria-selected", b.dataset.s === k)); secs.forEach((x) => { if (x === cdSec && cdSec.parentNode !== cdHome.p) return; x.hidden = x.dataset.s !== k; }); LOAD[k](); };
    subs.forEach((b) => b.addEventListener("click", () => sub(b.dataset.s)));
    $$('a[href="#equipe-recu"]').forEach((x) => x.addEventListener("click", () => { pick("sec"); sub("paiements"); }));
    { const w = devWeek(), n = new Date(), c1 = BOUCLE[w.c[0]], c2 = BOUCLE[w.c[1]];
      $("#sd-tmTheme").textContent = "Semaine " + (w.sem + 1) + " sur 6 · cours " + c1.n + " et " + c2.n;
      $("#sd-tmToday").textContent = "Nous sommes le " + J[n.getDay()] + " " + n.getDate() + " " + M[n.getMonth()] + ". Code en salle : semaine " + (w.sem + 1) + " sur 6 du programme.";
      const day = (b, quand) => '<a class="tm-day" href="#' + (b.dv === null ? "classe-quiz" : "classe-lecon") + '"><b>Cours ' + b.n + " · " + esc(b.t) + "</b><span>" + quand + " · " + (b.dv !== null ? "chapitres : " + esc(chNoms(b)) : b.n === 11 ? "révision de tous les thèmes" : "examen blanc de 40 questions") + "</span><em>Début : " + debutCours(b.n - 1) + " · Mode classe → " + (b.dv === null ? "Quiz" : "Leçon") + "</em></a>";
      { const k = coursDuJour(), b = BOUCLE[k], dvc = DEV[devCorr()];
        $("#sd-mcCtaSub").textContent = "Cours " + b.n + " : " + b.t;
        $("#sd-mcQuick").innerHTML = (b.dv !== null ? '<a href="#classe-lecon">Leçon · ' + esc(b.t) + "</a>" : "") + '<a href="#classe-devoir">Corriger le devoir ' + dvc.l + "</a>" + '<a href="#classe-quiz">' + (b.n === 12 ? "Examen blanc · 40 questions" : "Quiz") + "</a>"; }
      $("#sd-tmDays").innerHTML = day(c1, "A et C : lundi · B et D : mardi") + day(c2, "A et C : jeudi · B et D : vendredi") + '<a class="tm-day" href="#classe-quiz"><b>Mercredi · 14 h 30</b><span>Rattrapage et examen blanc, tous groupes (6 places)</span><em>Ceux qui ont manqué un cours</em></a>';
      $("#sd-tmProg").innerHTML = '<p class="tm-note" style="margin:0 0 4px!important">Tous les groupes font le même cours la même semaine. Un élève qui arrive commence au cours du jour : en 6 semaines (son cycle), il a tout vu. Après chaque cours, il fait le devoir du cours sur le site ; on le corrige au début du cours suivant.</p><div class="prog">' + progRows(w.sem, w.monday) + "</div>"; }

    // Connexion
    $("#sd-teamForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = $("#sd-teamErr"), btn = $("#sd-tmGo"), email = $("#sd-tmEmail").value.trim(), pw = $("#sd-tmPw").value;
      if (!email || !pw) { err.textContent = "Indique ton e-mail et ton mot de passe."; err.hidden = false; return; }
      btn.disabled = true; btn.textContent = "Connexion…";
      try { await DB.login(email, pw); err.hidden = true; $("#sd-tmPw").value = ""; try { localStorage.setItem("sodaf.email", email); } catch (x) {} SEC.login = true; await start(); }
      catch (ex) { err.textContent = /Invalid login/i.test(ex.message) ? "E-mail ou mot de passe incorrect." : navigator.onLine === false ? "Pas de connexion internet." : ex.message; err.hidden = false; }
      btn.disabled = false; btn.textContent = "Se connecter";
    });
    try { const em = localStorage.getItem("sodaf.email"); if (em && !$("#sd-tmEmail").value) $("#sd-tmEmail").value = em; } catch (x) {} // adresse retenue sur cet appareil : seul le mot de passe est à taper
    $("#sd-drComptes").addEventListener("click", async (e) => {
      const b = e.target.closest("[data-cpt]"); if (!b) return; const on = b.dataset.on === "1";
      if (!on && !b.dataset.ok) { b.dataset.ok = "1"; b.textContent = "Confirmer la désactivation"; b.classList.add("sc-conf"); setTimeout(() => { if (b.isConnected) { delete b.dataset.ok; b.textContent = "Désactiver"; b.classList.remove("sc-conf"); } }, 5000); return; }
      b.disabled = true; await run(() => DB.q("rpc/compte_activer", { method: "POST", body: { p_id: b.dataset.cpt, p_actif: on } }), on ? "Compte réactivé" : "Compte désactivé : il ne voit plus rien"); loadSec();
    });
    // Direction : modifier l'adresse / le mot de passe d'un compte, ou en créer un (fonctions compte_modifier / compte_creer, réservées à la direction)
    // « awa » tout court devient societesodaf+awa@gmail.com (d'après l'adresse de la direction)
    const cptAdresse = (v) => { v = (v || "").trim().toLowerCase(); if (!v || v.includes("@")) return v; const b = /^([^+@]+)(?:\+[^@]*)?@(.+)$/.exec(SEC.mailDir || ""); const n = v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9._-]/g, ""); return b && n ? b[1] + "+" + n + "@" + b[2] : v; };
    const cptApercu = (inp) => { const a = $('.sc-apercu[data-for="' + inp.id + '"]'); if (a) { const v = inp.value.trim(); a.textContent = v && !v.includes("@") ? "Adresse : " + cptAdresse(v) : ""; } };
    $("#sd-drSec").addEventListener("input", (e) => { if (e.target.matches("input:not([type=password])")) cptApercu(e.target); });
    $("#sd-drComptes").addEventListener("click", (e) => {
      const ed = e.target.closest("[data-edit]"), an = e.target.closest("[data-annul]");
      if (ed) { const f = ed.closest(".sc-row").querySelector(".sc-edit"); f.hidden = !f.hidden; if (!f.hidden) f.querySelector("input").focus(); }
      if (an) { const f = an.closest("form"); f.hidden = true; f.reset(); }
    });
    $("#sd-drComptes").addEventListener("submit", async (e) => {
      e.preventDefault(); const f = e.target, id = f.dataset.id, mi = f.querySelector('[data-k="mail"]'), pi = f.querySelector('[data-k="pw"]');
      const email = cptAdresse(mi.value), pw = pi.value, actuel = mi.defaultValue.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast("Adresse invalide", true); mi.focus(); return; }
      if (pw && pw.length < 6) { toast("Mot de passe trop court : 6 caractères au moins", true); pi.focus(); return; }
      if (email === actuel && !pw) { f.hidden = true; return; }
      const b = f.querySelector("[type=submit]"); b.disabled = true;
      const r = await run(() => DB.q("rpc/compte_modifier", { method: "POST", body: { p_id: id, p_email: email === actuel ? null : email, p_motdepasse: pw || null } }).then(() => true), pw ? (id === me.id ? "Enregistré. Ton nouveau mot de passe marche dès la prochaine connexion" : "Enregistré. Ses autres appareils sont déconnectés") : "Adresse enregistrée");
      b.disabled = false; pi.value = ""; if (r) loadSec();
    });
    $("#sd-cptAddBtn").addEventListener("click", () => { const f = $("#sd-cptAdd"); f.hidden = !f.hidden; if (!f.hidden) $("#sd-cptAddMail").focus(); });
    $("#sd-cptAdd").addEventListener("click", (e) => { if (e.target.closest("[data-annul]")) { $("#sd-cptAdd").reset(); $("#sd-cptAdd").hidden = true; cptApercu($("#sd-cptAddMail")); } });
    $("#sd-cptAdd").addEventListener("submit", async (e) => {
      e.preventDefault(); const email = cptAdresse($("#sd-cptAddMail").value), pw = $("#sd-cptAddPw").value, role = $("#sd-cptAddRole").value;
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast("Indique un prénom ou une adresse", true); $("#sd-cptAddMail").focus(); return; }
      if (pw.length < 6) { toast("Mot de passe trop court : 6 caractères au moins", true); $("#sd-cptAddPw").focus(); return; }
      const b = e.target.querySelector("[type=submit]"); b.disabled = true;
      const r = await run(() => DB.q("rpc/compte_creer", { method: "POST", body: { p_email: email, p_motdepasse: pw, p_role: role } }).then(() => true), "Compte créé : " + email);
      b.disabled = false; $("#sd-cptAddPw").value = ""; if (r) { e.target.reset(); e.target.hidden = true; cptApercu($("#sd-cptAddMail")); loadSec(); }
    });
    $("#sd-teamOut").addEventListener("click", async () => { rtFermer(); AUD.pause(); await DB.logout(); me = null; show(false); });

    // Boutons Appeler / WhatsApp d'un élève (moniteur : séances du jour, liste de présence, fiche courte)
    const contactEl = (x, cls) => { const n = waNum(x && x.telephone); return n ? '<span class="' + (cls || "ct-btns") + '"><a class="ct-tel" href="tel:+228' + n + '" aria-label="Appeler ' + esc(x.nom) + '"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg><span>Appeler</span></a><a class="ct-wa" href="https://wa.me/228' + n + '" target="_blank" rel="noopener" aria-label="WhatsApp ' + esc(x.nom) + '"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg><span>WhatsApp</span></a></span>' : ""; };
    // Fiche courte d'un élève (moniteur, depuis un lien SO12 dans les messages)
    function ficheCourte(x) {
      const g = x.groupe_code && gOf(x.groupe_code), ov = $("#sd-mfOv");
      $("#sd-mfBox").innerHTML = '<button type="button" class="mf-x" data-mf="close" aria-label="Fermer">×</button><p class="eyebrow">' + CODE(x) + "</p><h3>" + esc(x.nom) + "</h3>" + contactEl(x, "ct-btns ct-big") +
        '<dl class="mf-dl"><div><dt>Formation</dt><dd>' + esc(x.formule || x.formation || "—") + "</dd></div>" +
        (sansCode(x) ? "" : "<div><dt>Code en salle</dt><dd>" + (g ? '<i class="gb gb-' + x.groupe_code + '">' + esc(g.nom) + "</i> " + esc(gJours(g) + " · " + gHeure(g)) : "liste d'attente") + "</dd></div>") +
        (x.quota !== null && x.quota !== undefined ? "<div><dt>Conduite</dt><dd>" + (x.faits || 0) + " séance" + ((x.faits || 0) > 1 ? "s" : "") + " faite" + ((x.faits || 0) > 1 ? "s" : "") + " sur " + x.quota + (x.resa ? " · " + x.resa + " réservée" + (x.resa > 1 ? "s" : "") : "") + (x.evaluation ? " · " + (x.evaluation === "pret" ? "jugé prêt pour l'examen" : "séances en plus conseillées") : "") + "</dd></div>" : "") +
        "<div><dt>Étape</dt><dd>" + esc({ accueil: "Pré-inscription", appels: "Appels", dossier: "Paiement en attente", formation: "En formation", examen: "Dépôt d'examen", archives: "Archivé" }[etapeOf(x)] || "") + "</dd></div></dl>";
      ov.hidden = false; $("#sd-mfBox [data-mf=close]").focus();
    }
    $("#sd-mfOv").addEventListener("click", (e) => { if (e.target === e.currentTarget || e.target.closest("[data-mf=close]")) $("#sd-mfOv").hidden = true; });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#sd-mfOv").hidden) $("#sd-mfOv").hidden = true; });

    // ---- Messages de l'équipe (canaux) et notifications sur téléphone
    // La base envoie les notifications (fonction « notifier ») ; ici : lire, écrire, compter les non-lus, activer les notifications.
    const VAPID_PUB = "BOMPgiFqajAv-Mqb1SXD7WOGWJVEK_sDJQGULUCSgV5eAm10bOq7WctPkE51LqGgFHqe4S2y2COGmt0DWbWMv8o";
    const MS = { canaux: [], cur: null, msgs: {}, lu: {}, profs: {}, dernier: null, pret: false, total: 0, forceBas: false, urls: {}, blobs: {}, pjs: [], repere: {}, arrivees: 0, attente: 0, sug: [], sugI: 0, file: [], traite: false, ec: {}, vitesse: 1, lect: null };
    const msRole = { admin: "Direction", gerant: "Gérante", secretariat: "Secrétariat", moniteur: "Moniteur" };
    const msLarge = () => matchMedia("(min-width: 761px)").matches;
    // Dates : la base (API) et le temps réel n'écrivent pas l'heure de la même façon ; on ramène tout au même format pour trier et comparer
    const msLe = (s) => { if (!s) return s; let t = String(s).replace(" ", "T").replace(/(\.\d{3})\d+/, "$1"); if (/[+-]\d\d$/.test(t)) t += ":00"; const d = new Date(t); return isNaN(d) ? String(s) : d.toISOString(); };
    // Téléphone : liste des conversations d'abord, puis la conversation en plein écran (bouton retour ou geste retour du téléphone)
    function msVoirFil(on) {
      const w = document.getElementById("sd-msWrap"); if (!w) return;
      const avant = w.classList.contains("voir-fil"); w.classList.toggle("voir-fil", !!on); document.documentElement.classList.toggle("ms-plein", !!on && !msLarge());
      if (on && !avant && !msLarge()) { try { history.pushState({ sdMsFil: 1 }, ""); } catch (e) {} }
    }
    window.addEventListener("popstate", () => { const v = document.getElementById("sd-msVue"); if (v && !v.hidden) { v.hidden = true; return; } const w = document.getElementById("sd-msWrap"); if (w && w.classList.contains("voir-fil")) msVoirFil(false); });
    // Visionneuse photo : plein écran, fermer avec ×, Échap, un toucher à côté ou le geste retour du téléphone
    // Visionneuse photo : toutes les photos de la conversation, de la plus ancienne à la plus récente.
    // Téléphone : glisser vers la gauche = photo suivante (plus récente), vers la droite = précédente. Ordinateur : flèches ‹ › ou touches ← →.
    // Fermer : ×, Échap, un toucher à côté de la photo, ou le geste retour du téléphone.
    const VUE = { list: [], i: 0, glisse: false };
    async function msVue(btn) {
      const path = btn.dataset.pj, img = btn.querySelector("img"), v = $("#sd-msVue");
      VUE.list = path ? (MS.msgs[MS.cur] || []).filter((x) => x.fichier && x.fichier.path && msEstImg(x.fichier)).map((x) => ({ path: x.fichier.path, nom: x.fichier.nom || "Photo", auteur: x.auteur, le: x.le, w: x.fichier.w, h: x.fichier.h })) : [];
      VUE.i = VUE.list.findIndex((x) => x.path === path);
      if (VUE.i < 0) { VUE.list = [{ path: path || null, nom: (img && img.alt) || "Photo", local: img && img.src, auteur: me.id, le: new Date().toISOString() }]; VUE.i = 0; } // photo encore en cours d'envoi
      $("#sd-msVueImg").src = (img && img.src) || "";
      v.hidden = false; try { history.pushState({ sdMsVue: 1 }, ""); } catch (x) {}
      msVueAff(); $("#sd-msVueX").focus();
    }
    async function msVueAff() {
      const ph = VUE.list[VUE.i]; if (!ph) return; const n = VUE.list.length, p = MS.profs[ph.auteur];
      $("#sd-msVueNom").textContent = ph.auteur === me.id ? "Moi" : msPrenom(p);
      $("#sd-msVueInfo").textContent = msJour(ph.le) + " à " + msHeure(ph.le);
      $("#sd-msVueCpt").textContent = n > 1 ? VUE.i + 1 + " / " + n : "";
      $("#sd-msVuePrev").hidden = VUE.i <= 0; $("#sd-msVueNext").hidden = VUE.i >= n - 1;
      const im = $("#sd-msVueImg"); im.alt = ph.nom; im.style.transform = "";
      if (ph.local) { im.src = ph.local; $("#sd-msVueDl").href = ph.local; return; }
      if (MS.blobs[ph.path]) im.src = MS.blobs[ph.path];
      const [u] = await msSigne([ph.path]); if (VUE.list[VUE.i] !== ph) return;
      if (!u) { toast("Photo indisponible pour l'instant"); return; }
      if (!MS.blobs[ph.path]) im.src = u; $("#sd-msVueDl").href = u + "&download=" + encodeURIComponent(ph.nom);
      // Les photos voisines sont préparées pour passer de l'une à l'autre sans attendre
      const voisins = [VUE.list[VUE.i - 1], VUE.list[VUE.i + 1]].filter((x) => x && x.path && !MS.blobs[x.path]);
      if (voisins.length) msSigne(voisins.map((x) => x.path)).then((us) => us.forEach((x) => { if (x) { const pre = new Image(); pre.src = x; } }));
    }
    function msVueAller(d) { const j = VUE.i + d; if (j < 0 || j >= VUE.list.length) { const im = $("#sd-msVueImg"); im.style.transition = "transform .15s"; im.style.transform = "translateX(" + (d > 0 ? -18 : 18) + "px)"; setTimeout(() => { im.style.transform = ""; }, 150); return; } VUE.i = j; msVueAff(); }
    function msVueFermer() { const v = $("#sd-msVue"); if (v.hidden) return; if (history.state && history.state.sdMsVue) history.back(); else v.hidden = true; }
    $("#sd-msVue").addEventListener("click", (e) => {
      if (VUE.glisse) { VUE.glisse = false; return; }
      if (e.target.closest("#sd-msVuePrev")) { msVueAller(-1); return; }
      if (e.target.closest("#sd-msVueNext")) { msVueAller(1); return; }
      if (e.target.closest("#sd-msVueX") || e.target.classList.contains("ms-vimg")) msVueFermer();
    });
    document.addEventListener("keydown", (e) => {
      if ($("#sd-msVue").hidden) return;
      if (e.key === "Escape") msVueFermer(); else if (e.key === "ArrowLeft") msVueAller(-1); else if (e.key === "ArrowRight") msVueAller(1);
    });
    { // glisser du doigt : la photo suit le doigt, puis passe à la suivante ou revient
      const z = $("#sd-msVueZone"); let x0 = null, y0 = 0, dx = 0;
      z.addEventListener("touchstart", (e) => { if (e.touches.length !== 1) { x0 = null; return; } x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; $("#sd-msVueImg").style.transition = "none"; }, { passive: true });
      z.addEventListener("touchmove", (e) => { if (x0 === null) return; dx = e.touches[0].clientX - x0; if (Math.abs(dx) > Math.abs(e.touches[0].clientY - y0)) $("#sd-msVueImg").style.transform = "translateX(" + dx + "px)"; }, { passive: true });
      z.addEventListener("touchend", () => { if (x0 === null) return; const im = $("#sd-msVueImg"); im.style.transition = "transform .18s"; x0 = null; if (Math.abs(dx) > 50) { VUE.glisse = true; setTimeout(() => (VUE.glisse = false), 400); msVueAller(dx < 0 ? 1 : -1); } else im.style.transform = ""; });
    }
    const msFilVu = () => msLarge() || $("#sd-msWrap").classList.contains("voir-fil");
    const msOpen = () => !$('.tm-pane[data-pane="msg"]').hidden && !document.hidden && msFilVu();
    async function msInit() {
      const [c, l, p, m, e] = await Promise.all([run(() => DB.q("canaux?select=*&order=ordre")), run(() => DB.q("lectures?select=*")), run(() => DB.q("profils?select=id,nom,role,actif")), run(() => DB.q("messages?select=*&order=le.desc&limit=400")), DB.q("ecoutes?select=message_id,profil&limit=5000").catch(() => [])]);
      if (!c || !c.length) return;
      MS.canaux = c; (l || []).forEach((x) => (MS.lu[x.canal] = msLe(x.lu_le))); (p || []).forEach((x) => (MS.profs[x.id] = x));
      MS.msgs = {}; c.forEach((k) => (MS.msgs[k.id] = []));
      (m || []).reverse().forEach(msAjout); (e || []).forEach(msEcAjout);
      const sv = S.get("msCanal", null); MS.cur = MS.msgs[MS.cur] ? MS.cur : MS.msgs[sv] ? sv : c[0].id;
      MS.pret = true; msBadge(); msRender(); msNotifBox(); rtConnecter();
    }
    function msAjout(x) {
      x.le = msLe(x.le);
      const a = MS.msgs[x.canal]; if (!a || a.some((y) => y.id === x.id)) return false;
      if (x.cle) { const i = MS.file.findIndex((f) => f.cle === x.cle); if (i >= 0) { const f = MS.file[i]; if (f.pj && f.pj.local && x.fichier && x.fichier.path) { MS.blobs[x.fichier.path] = f.pj.local; if (MS.lect && MS.lect.cle === "local:" + f.cle) { MS.lect.cle = x.fichier.path; MS.lect.id = x.id; } } MS.file.splice(i, 1); } } // mon message en attente : remplacé par le vrai, sans doublon
      a.push(x); a.sort((u, v) => (u.le < v.le ? -1 : u.le > v.le ? 1 : u.id - v.id)); if (!MS.dernier || x.le > MS.dernier) MS.dernier = x.le; return true;
    }
    function msEcAjout(e) { const s = MS.ec[e.message_id] || (MS.ec[e.message_id] = new Set()); if (s.has(e.profil)) return false; s.add(e.profil); return true; }
    const msEcoute = (id, qui) => !!(MS.ec[id] && MS.ec[id].has(qui));
    const msNonLus = (k) => (MS.msgs[k] || []).filter((x) => x.auteur !== me.id && (!MS.lu[k] || x.le > MS.lu[k])).length;
    function msBadge() { const n = MS.canaux.reduce((t, k) => t + msNonLus(k.id), 0), b = $("#sd-msBadge"); MS.total = n; if (b) { b.textContent = n > 99 ? "99+" : n; b.hidden = !n; } }
    async function msLu(k) { const t = new Date().toISOString(); MS.lu[k] = t; msBadge(); msChans(); try { await DB.q("lectures?on_conflict=profil,canal", { method: "POST", body: { canal: k, lu_le: t }, prefer: "resolution=merge-duplicates,return=minimal" }); } catch (e) {} }
    const msJour = (d) => { const x = new Date(d), n = new Date(), h = new Date(n.getFullYear(), n.getMonth(), n.getDate() - 1); return x.toDateString() === n.toDateString() ? "Aujourd'hui" : x.toDateString() === h.toDateString() ? "Hier" : x.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }).replace(/^./, (c) => c.toUpperCase()); };
    const msHeure = (d) => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const msQuand = (d) => { const j = msJour(d); return j === "Aujourd'hui" ? msHeure(d) : j === "Hier" ? "Hier" : new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }); };
    const msPrenom = (p) => ((p && p.nom) || "Équipe").trim().split(/\s+/)[0];
    const msPlat = (t) => (t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    // Membres d'une conversation : comptes actifs dont le rôle y a accès
    const msMembres = (k) => Object.values(MS.profs).filter((p) => p.actif !== false && (!k.roles || k.roles.includes(p.role)));
    const msTaille = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1).replace(".", ",") + " Mo" : Math.max(1, Math.round(n / 1024)) + " Ko");
    const msEstImg = (f) => f && /^image\//.test(f.type || "");
    const msEstAud = (f) => f && /^audio\//.test(f.type || "");
    const msDuree = (n) => Math.floor(n / 60) + ":" + String(Math.floor(n % 60)).padStart(2, "0");
    function msTexte(t) {
      const noms = Object.values(MS.profs).filter((p) => p.actif !== false).map(msPrenom), moiNom = msPlat(msPrenom(MS.profs[me.id]));
      return esc(t).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
        .replace(/\b[Ss][Oo] ?(\d{1,6})\b/g, (m, id) => (eleves.some((y) => y.id === +id) ? '<button type="button" class="ms-el" data-goel="' + id + '">SO' + id + "</button>" : m))
        .replace(/(^|[\s(])@([A-Za-zÀ-ÿ][\wÀ-ÿ'-]*)/g, (m, av, n) => (noms.some((y) => msPlat(y) === msPlat(n)) ? av + '<span class="ms-at' + (msPlat(n) === moiNom ? " moi" : "") + '">@' + n + "</span>" : m))
        .replace(/\n/g, "<br>");
    }
    const msApercu = (x) => { if (!x) return "Aucun message"; const p = MS.profs[x.auteur], f = x.fichier, t = f ? (msEstAud(f) ? "Message vocal" + (f.duree ? " (" + msDuree(f.duree) + ")" : "") : msEstImg(f) ? "Photo" : "Fichier : " + (f.nom || "Fichier")) + (x.texte && x.texte !== f.nom ? " · " + x.texte : "") : x.texte; return (x.auteur === me.id ? "Toi" : msPrenom(p)) + " : " + t.replace(/\s+/g, " "); };
    const IC_LOCK = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
    const IC_PLAY = '<svg class="i-play" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor"/></svg><svg class="i-pause" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/></svg><i class="i-load" aria-hidden="true"></i>';
    // Qui lit la conversation (affiché en haut) : la règle de confidentialité doit se voir
    function msQui(k) {
      const mb = msMembres(k).map((p) => msPrenom(p) === msRole[p.role] ? msRole[p.role] : msPrenom(p) + " (" + (msRole[p.role] || "") + ")");
      if (!k.roles) return "Toute l'équipe";
      if (k.id === "planning") { if (me.role === "admin" || me.role === "gerant") return "Privé entre le secrétariat et le moniteur · tu peux lire (supervision)"; return "Privé · " + msMembres(k).filter((p) => p.role !== "admin" && p.role !== "gerant").map((p) => msPrenom(p) + " (" + (msRole[p.role] || "") + ")").join(" et ") + " · la direction et la gérante peuvent lire"; }
      return "Privé · lu seulement par : " + (mb.join(" et ") || k.roles.map((r) => msRole[r] || r).join(" et "));
    }
    function msChans() {
      const el = $("#sd-msCanaux"); if (!el) return;
      const ligne = (k) => { const n = msNonLus(k.id), l = MS.msgs[k.id] || [], d = l[l.length - 1], att = MS.file.filter((f) => f.canal === k.id).length; return '<button type="button" class="ms-ch' + (k.id === MS.cur ? " on" : "") + (n ? " nl" : "") + '" data-ch="' + esc(k.id) + '"><i class="ms-ic' + (k.prive ? " pv" : "") + '">' + (k.prive ? IC_LOCK : "#") + "</i><b>" + esc(k.nom) + "</b><time>" + (att ? "Envoi…" : d ? esc(msQuand(d.le)) : "") + "</time><small>" + esc(msApercu(d)) + "</small>" + (n ? "<em>" + n + "</em>" : "") + "</button>"; };
      const ger = MS.canaux.filter((k) => k.id === "gerance"), pub = MS.canaux.filter((k) => !k.prive), pv = MS.canaux.filter((k) => k.prive && k.id !== "gerance");
      // Conversation Direction ↔ Gérante : à part, en haut, jamais mélangée avec les canaux de l'équipe
      el.innerHTML = (ger.length ? '<div class="ms-ger"><p class="ms-sec">' + (me && me.role === "gerant" ? "Avec la direction" : "Avec la gérante") + "</p>" + ger.map(ligne).join("") + "</div>" : "") +
        (pub.length ? '<p class="ms-sec">Canaux</p>' + pub.map(ligne).join("") : "") + (pv.length ? '<p class="ms-sec">' + (ger.length ? "Messages privés de l'équipe" : "Messages privés") + "</p>" + pv.map(ligne).join("") : "");
    }
    // Lecteur de vocal : un seul lecteur pour toute l'application (la lecture continue quand la liste se met à jour)
    function msAudHtml(x, f, moi) {
      const id = x.id || "", k = f.path || "local:" + x.cle, l = MS.lect, enCours = l && l.cle === k, nonEcoute = !moi && x.id && !msEcoute(x.id, me.id);
      const d = f.duree || 0, t = enCours ? l.t : 0, pct = d ? Math.min(100, (t / d) * 100) : 0;
      let ecoute = "";
      if (moi && x.id) { const k2 = MS.canaux.find((c) => c.id === x.canal), qui = k2 ? msMembres(k2).filter((p) => p.id !== me.id && msEcoute(x.id, p.id)).map(msPrenom).filter((n, i, a) => a.indexOf(n) === i) : []; ecoute = '<small class="ms-ecq' + (qui.length ? " ok" : "") + '">' + (qui.length ? "Écouté par " + esc(qui.join(", ")) : "Pas encore écouté") + "</small>"; }
      return '<div class="ms-aud' + (nonEcoute ? " neuf" : "") + (enCours ? " " + l.etat : "") + '" data-aud="' + esc(k) + '" data-id="' + id + '" data-d="' + d + '"><button type="button" class="ms-play" aria-label="' + (enCours && l.etat === "joue" ? "Pause" : "Écouter le vocal") + '">' + IC_PLAY + '</button><div class="ms-aw"><div class="ms-prog" role="slider" aria-label="Avancer dans le vocal" aria-valuemin="0" aria-valuemax="' + d + '" aria-valuenow="' + Math.round(t) + '" tabindex="0"><i style="width:' + pct + '%"></i><b style="left:' + pct + '%"></b></div><div class="ms-ainf"><span class="ms-atm">' + (enCours ? msDuree(t) + " / " : "") + msDuree(d) + "</span>" + (nonEcoute ? '<span class="ms-pt">Nouveau</span>' : "") + '<button type="button" class="ms-vit" aria-label="Vitesse de lecture">' + String(MS.vitesse).replace(".", ",") + "×</button></div>" + ecoute + "</div></div>";
    }
    function msBulle(x, moi) {
      const f = x.fichier; let h = "";
      if (f && (f.path || f.local)) {
        const src = f.local ? ' src="' + f.local + '"' : "", dp = f.path ? ' data-pj="' + esc(f.path) + '"' : "";
        if (msEstAud(f)) h += msAudHtml(x, f, moi);
        else if (msEstImg(f)) h += '<button type="button" class="ms-img"' + dp + ' aria-label="Agrandir la photo"><img alt="' + esc(f.nom || "Photo") + '"' + (f.path && !f.local ? ' data-sp="' + esc(f.path) + '"' : "") + src + (f.w && f.h ? ' style="aspect-ratio:' + (+f.w) + "/" + (+f.h) + '"' : "") + "></button>";
        else h += '<button type="button" class="ms-file"' + dp + "><i>" + esc(((f.nom || "").split(".").pop() || "doc").slice(0, 4).toUpperCase()) + "</i><span><b>" + esc(f.nom || "Fichier") + "</b><small>" + (f.taille ? msTaille(f.taille) + " · " : "") + (f.path ? "ouvrir" : "envoi…") + "</small></span></button>";
      }
      if (x.texte && (!f || x.texte !== f.nom)) h += '<div class="ms-tx">' + msTexte(x.texte) + "</div>";
      return h;
    }
    function msRender() {
      if (!MS.pret) return; msChans();
      const k = MS.canaux.find((c) => c.id === MS.cur) || MS.canaux[0], list = MS.msgs[k.id] || [];
      // Repère « Nouveaux messages » : fixé à l'ouverture de la conversation (dernière lecture), il reste en place pendant la lecture
      if (MS.repere.canal !== k.id) MS.repere = { canal: k.id, le: MS.lu[k.id] || "", aller: true };
      const iNeuf = list.findIndex((x) => x.auteur !== me.id && x.le > MS.repere.le), nNeuf = iNeuf < 0 ? 0 : list.slice(iNeuf).filter((x) => x.auteur !== me.id).length;
      $("#sd-msHead").innerHTML = '<b><i class="ms-ic' + (k.prive ? " pv" : "") + '">' + (k.prive ? IC_LOCK : "#") + "</i>" + esc(k.nom) + "</b><span>" + esc(msQui(k)) + "</span>";
      // Mes messages en cours d'envoi s'affichent tout de suite, à la suite des autres
      const enAttente = MS.file.filter((f) => f.canal === k.id).map((f) => ({ cle: f.cle, canal: f.canal, auteur: me.id, le: f.le, texte: f.texte, fichier: f.pj ? { local: f.pj.local, type: f.pj.type, nom: f.pj.nom, taille: f.pj.taille, w: f.pj.w, h: f.pj.h, duree: f.pj.duree } : null, envoi: f }));
      const tout = list.concat(enAttente);
      let jour = "", html = "";
      tout.forEach((x, i) => {
        const j = msJour(x.le), p = MS.profs[x.auteur] || { nom: "Équipe", role: "" }, moi = x.auteur === me.id, pv = tout[i - 1], pourMoi = !moi && (x.mentions || []).includes(me.id), ev = x.envoi;
        if (j !== jour) { jour = j; html += '<p class="ms-day"><span>' + esc(j) + "</span></p>"; }
        if (i === iNeuf) html += '<p class="ms-neuf" id="sd-msNeuf"><span>' + (nNeuf > 1 ? nNeuf + " nouveaux messages" : "Nouveau message") + "</span></p>";
        const suite = i !== iNeuf && pv && pv.auteur === x.auteur && msJour(pv.le) === j && new Date(x.le) - new Date(pv.le) < 5 * 60000;
        const etat = ev ? (ev.etat === "echec" ? '<small class="ms-st err">Non envoyé' + (ev.err ? " : " + esc(ev.err) : "") + ' · <button type="button" class="linkbtn" data-renvoi="' + esc(ev.cle) + '">Réessayer</button> · <button type="button" class="linkbtn" data-annule="' + esc(ev.cle) + '">Supprimer</button></small>' : '<small class="ms-st"><i class="ms-spin" aria-hidden="true"></i>' + (ev.pct != null && ev.pj ? "Envoi " + ev.pct + " %" : "Envoi…") + "</small>") : suite ? '<small class="ms-t">' + msHeure(x.le) + "</small>" : "";
        html += '<div class="ms-m' + (moi ? " moi" : "") + (suite ? " suite" : "") + (pourMoi ? " pourmoi" : "") + (ev ? " envoi" + (ev.etat === "echec" ? " echec" : "") : "") + '"' + (x.id ? ' data-mid="' + x.id + '"' : "") + (ev ? ' data-cle="' + esc(ev.cle) + '"' : "") + ">" + (suite ? "" : '<p class="ms-who"><i class="ms-av r-' + esc(p.role) + '">' + esc((p.nom || "?").trim()[0]) + "</i><b>" + esc(moi ? "Moi" : msPrenom(p)) + "</b><small>" + esc(msRole[p.role] || "") + " · " + msHeure(x.le) + "</small></p>") + '<div class="ms-b' + (x.fichier && msEstImg(x.fichier) && x.texte === x.fichier.nom ? " seule" : "") + '">' + msBulle(x, moi) + etat + "</div></div>";
      });
      const box = $("#sd-msList"), bas = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
      box.innerHTML = html || '<p class="ms-vide">Aucun message ici pour l\'instant. Écris le premier !</p>';
      const neuf = $("#sd-msNeuf");
      if (MS.repere.aller && msFilVu() && !$('.tm-pane[data-pane="msg"]').hidden) { MS.repere.aller = false; MS.forceBas = false; if (neuf) box.scrollTop = Math.max(0, box.scrollTop + neuf.getBoundingClientRect().top - box.getBoundingClientRect().top - 12); else box.scrollTop = box.scrollHeight; } // à l'ouverture : on arrive sur le premier message non lu
      else if (bas || MS.forceBas) { box.scrollTop = box.scrollHeight; MS.forceBas = false; }
      else if (MS.arrivees) MS.attente += MS.arrivees;
      MS.arrivees = 0; msBasBtn();
      msSigner();
      if (msOpen() && msNonLus(k.id)) msLu(k.id);
    }
    function msBasBtn() {
      const box = $("#sd-msList"), b = $("#sd-msBas"); if (!b) return; const loin = box.scrollHeight - box.scrollTop - box.clientHeight > 160;
      if (!loin) MS.attente = 0; b.hidden = !loin; b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7"/></svg>' + (MS.attente ? "<em>" + MS.attente + "</em>" : "");
      b.setAttribute("aria-label", MS.attente ? MS.attente + " nouveau" + (MS.attente > 1 ? "x" : "") + " message" + (MS.attente > 1 ? "s" : "") + " : descendre" : "Descendre au dernier message");
    }
    // Fichiers : stockage privé, liens temporaires (1 h) demandés à la base pour ceux qui ont le droit de lire la conversation
    async function msSigne(paths) {
      const now = Date.now(), manque = paths.filter((x) => !MS.urls[x] || MS.urls[x].exp < now + 300000);
      if (manque.length) {
        try {
          const t = await DB.token(), r = await fetch(SB_URL + "/storage/v1/object/sign/messages", { method: "POST", headers: { apikey: SB_KEY, Authorization: "Bearer " + t, "Content-Type": "application/json" }, body: JSON.stringify({ expiresIn: 3600, paths: manque }) });
          if (r.ok) (await r.json()).forEach((y) => { if (y.signedURL) MS.urls[y.path] = { u: SB_URL + "/storage/v1" + y.signedURL, exp: now + 3500000 }; });
        } catch (e) {}
      }
      return paths.map((x) => (MS.urls[x] ? MS.urls[x].u : null));
    }
    async function msSigner() {
      const imgs = [...document.querySelectorAll("#sd-msList img[data-sp]:not([src])")]; if (!imgs.length) return;
      imgs.forEach((i) => { if (MS.blobs[i.dataset.sp]) i.src = MS.blobs[i.dataset.sp]; }); // ma photo envoyée : déjà sur le téléphone, rien à retélécharger
      const reste = imgs.filter((i) => !i.getAttribute("src")); if (!reste.length) return;
      const paths = [...new Set(reste.map((i) => i.dataset.sp))], u = await msSigne(paths), m = {}; paths.forEach((x, i) => (m[x] = u[i]));
      const box = $("#sd-msList"), bas = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
      reste.forEach((i) => { if (m[i.dataset.sp]) { i.src = m[i.dataset.sp]; i.addEventListener("load", () => { if (bas) box.scrollTop = box.scrollHeight; }, { once: true }); } });
    }
    // Lecture des vocaux : le fichier est téléchargé en entier puis lu sur le téléphone (lecture fluide, on peut avancer ou reculer)
    const AUD = new Audio(); AUD.preload = "auto";
    function msAudMaj() {
      const l = MS.lect; document.querySelectorAll("#sd-msList .ms-aud").forEach((el) => {
        const on = l && el.dataset.aud === l.cle, d = +el.dataset.d || (on && isFinite(AUD.duration) ? AUD.duration : 0), t = on ? l.t : 0, pct = d ? Math.min(100, (t / d) * 100) : 0;
        el.classList.toggle("charge", !!(on && l.etat === "charge")); el.classList.toggle("joue", !!(on && l.etat === "joue")); el.classList.toggle("pause", !!(on && l.etat === "pause"));
        el.querySelector(".ms-prog i").style.width = pct + "%"; el.querySelector(".ms-prog b").style.left = pct + "%";
        el.querySelector(".ms-atm").textContent = (on ? msDuree(t) + " / " : "") + msDuree(d);
        el.querySelector(".ms-play").setAttribute("aria-label", on && l.etat === "joue" ? "Pause" : "Écouter le vocal");
      });
    }
    async function msAudSource(cle) {
      if (MS.blobs[cle]) return MS.blobs[cle];
      if (cle.startsWith("local:")) return null;
      const [u] = await msSigne([cle]); if (!u) return null;
      for (let essai = 0; essai < 2; essai++) { try { const r = await fetch(u); if (r.ok) { const b = await r.blob(); MS.blobs[cle] = URL.createObjectURL(b); return MS.blobs[cle]; } } catch (e) {} }
      return u; // dernier recours : lecture directe depuis le stockage
    }
    async function msAudJouer(el, depuis) {
      const cle = el.dataset.aud, id = +el.dataset.id || 0, l = MS.lect;
      if (l && l.cle === cle && depuis == null) { if (l.etat === "joue") { AUD.pause(); return; } if (l.etat === "pause") { AUD.play().catch(() => {}); return; } if (l.etat === "charge") return; }
      AUD.pause();
      MS.lect = { cle, id, t: depuis || 0, etat: "charge", d: +el.dataset.d || 0 }; msAudMaj();
      const src = await msAudSource(cle); if (!MS.lect || MS.lect.cle !== cle) return;
      if (!src) { MS.lect = null; msAudMaj(); toast("Vocal indisponible pour l'instant : vérifie la connexion"); return; }
      if (AUD.src !== src) AUD.src = src;
      AUD.playbackRate = MS.vitesse;
      try { if (depuis) AUD.currentTime = depuis; } catch (e) {}
      try { await AUD.play(); } catch (e) { if (MS.lect && MS.lect.cle === cle) { MS.lect = null; msAudMaj(); if (e && e.name !== "AbortError") toast("Lecture impossible sur ce téléphone"); } return; }
      if (id && !msEcoute(id, me.id)) { msEcAjout({ message_id: id, profil: me.id }); el.classList.remove("neuf"); const pt = el.querySelector(".ms-pt"); if (pt) pt.remove(); DB.q("ecoutes", { method: "POST", body: { message_id: id }, prefer: "return=minimal,resolution=ignore-duplicates" }).catch(() => {}); }
    }
    AUD.addEventListener("playing", () => { if (MS.lect) { MS.lect.etat = "joue"; msAudMaj(); } });
    AUD.addEventListener("pause", () => { if (MS.lect && MS.lect.etat === "joue") { MS.lect.etat = "pause"; msAudMaj(); } });
    AUD.addEventListener("waiting", () => { if (MS.lect && MS.lect.etat === "joue") { MS.lect.etat = "charge"; msAudMaj(); } });
    AUD.addEventListener("timeupdate", () => { if (MS.lect) { MS.lect.t = AUD.currentTime; msAudMaj(); } });
    AUD.addEventListener("error", () => { if (MS.lect) { MS.lect = null; msAudMaj(); toast("Ce vocal ne peut pas être lu sur ce téléphone"); } });
    AUD.addEventListener("ended", () => {
      const fini = MS.lect; MS.lect = null; msAudMaj(); if (!fini) return;
      // Vocal suivant pas encore écouté, juste après dans la conversation : il démarre tout seul
      const list = MS.msgs[MS.cur] || [], i = list.findIndex((x) => x.id === fini.id), nx = i >= 0 ? list[i + 1] : null;
      if (nx && nx.auteur !== me.id && msEstAud(nx.fichier) && !msEcoute(nx.id, me.id)) { const el = document.querySelector('#sd-msList .ms-aud[data-id="' + nx.id + '"]'); if (el) msAudJouer(el); }
    });
    function msAudSauter(el, e) {
      const bar = el.querySelector(".ms-prog"), r = bar.getBoundingClientRect(), d = +el.dataset.d || (isFinite(AUD.duration) ? AUD.duration : 0); if (!d) return;
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left, t = Math.max(0, Math.min(d - 0.05, (x / r.width) * d));
      if (MS.lect && MS.lect.cle === el.dataset.aud && MS.lect.etat !== "charge") { try { AUD.currentTime = t; } catch (x2) {} MS.lect.t = t; msAudMaj(); if (AUD.paused) AUD.play().catch(() => {}); }
      else msAudJouer(el, t);
    }
    let msTick = 0, msBasTic = 0;
    // Réception : en direct (temps réel) ; la vérification régulière reste en secours si la connexion directe tombe
    function msRecus(neuf) {
      if (!neuf.length) return;
      MS.arrivees = neuf.filter((x) => x.canal === MS.cur && x.auteur !== me.id).length;
      msBadge(); msRender();
      const autres = neuf.filter((x) => x.auteur !== me.id);
      if (autres.length && !msOpen()) { const x = autres[autres.length - 1], p = MS.profs[x.auteur]; toast(((x.mentions || []).includes(me.id) ? msPrenom(p) + " t'a mentionné : " : msPrenom(p) + " : ") + msApercu(x).replace(/^[^:]+ : /, "").slice(0, 70)); }
    }
    async function msPoll(force) {
      if (!me || !MS.pret || (document.hidden && !force)) return;
      msTick++; if (!force) { if (RT.ok) { if (msTick % 12) return; } else if (!msOpen() && msTick % 4) return; } // en direct : un contrôle par minute suffit
      const depuis = MS.dernier ? new Date(new Date(MS.dernier).getTime() - 15000).toISOString() : null;
      let r = null; try { r = await DB.q("messages?select=*&order=le.asc&limit=200" + (depuis ? "&le=gt." + encodeURIComponent(depuis) : "")); } catch (e) { return; }
      msRecus((r || []).filter(msAjout));
    }
    setInterval(msPoll, 5000);
    // Connexion directe (Supabase Realtime) : chaque nouveau message arrive en moins d'une seconde, selon les mêmes règles de lecture que la base
    const RT = { ws: null, ref: 0, hb: null, ok: false, essais: 0, jref: null, jeton: null, topic: "realtime:sodaf-equipe", relance: null };
    const rtEnvoi = (m) => { try { if (RT.ws && RT.ws.readyState === 1) RT.ws.send(JSON.stringify(m)); } catch (e) {} };
    async function rtJeton() { let t = null; try { t = await DB.token(); } catch (e) {} if (t && t !== RT.jeton && RT.ok) { RT.jeton = t; rtEnvoi({ topic: RT.topic, event: "access_token", payload: { access_token: t }, ref: String(++RT.ref), join_ref: RT.jref }); } }
    async function rtConnecter() {
      if (!me || RT.ws || typeof WebSocket === "undefined") return;
      clearTimeout(RT.relance);
      let ws; try { ws = new WebSocket(SB_URL.replace(/^http/, "ws") + "/realtime/v1/websocket?apikey=" + encodeURIComponent(SB_KEY) + "&vsn=1.0.0"); } catch (e) { return; }
      RT.ws = ws;
      ws.onopen = async () => {
        let t = null; try { t = await DB.token(); } catch (e) {} RT.jeton = t; RT.jref = String(++RT.ref);
        rtEnvoi({ topic: RT.topic, event: "phx_join", payload: { config: { broadcast: { ack: false, self: false }, presence: { key: "" }, postgres_changes: [{ event: "INSERT", schema: "public", table: "messages" }, { event: "INSERT", schema: "public", table: "ecoutes" }], private: false }, access_token: t }, ref: RT.jref, join_ref: RT.jref });
        clearInterval(RT.hb); RT.hb = setInterval(() => { rtEnvoi({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(++RT.ref) }); rtJeton(); }, 25000);
      };
      ws.onmessage = (e) => {
        let m; try { m = JSON.parse(e.data); } catch (x) { return; }
        if (m.topic !== RT.topic) return;
        if (m.event === "phx_reply" && m.ref === RT.jref) { if (m.payload && m.payload.status === "ok") { RT.ok = true; RT.essais = 0; msPoll(true); } else { try { ws.close(1000, "fin"); } catch (x) {} } return; } // rattrapage de ce qui est arrivé pendant la coupure
        if (m.event === "postgres_changes" && m.payload && m.payload.data) {
          const d = m.payload.data, rec = d.record; if (!rec) return;
          if (d.table === "messages") msRecus(msAjout(rec) ? [rec] : []);
          else if (d.table === "ecoutes" && msEcAjout(rec) && document.querySelector('#sd-msList [data-mid="' + rec.message_id + '"]')) msRender(); // « Écouté par … » se met à jour en direct
          return;
        }
        if (m.event === "phx_error" || m.event === "phx_close") { try { ws.close(1000, "fin"); } catch (x) {} }
      };
      ws.onerror = () => {};
      ws.onclose = () => {
        clearInterval(RT.hb); if (RT.ws === ws) { RT.ws = null; RT.ok = false; }
        if (!me || !DB.session) return;
        const attente = Math.min(30000, 1000 * Math.pow(2, RT.essais++)); RT.relance = setTimeout(rtConnecter, attente);
      };
    }
    function rtFermer() { clearTimeout(RT.relance); clearInterval(RT.hb); const ws = RT.ws; RT.ws = null; RT.ok = false; if (ws) { ws.onclose = null; try { ws.close(1000, "fin"); } catch (e) {} } }
    // Retour sur l'application (téléphone sorti de veille) : on se reconnecte et on rattrape tout de suite
    document.addEventListener("visibilitychange", () => { if (document.hidden || !me || !MS.pret) return; if (!RT.ws) { RT.essais = 0; rtConnecter(); } msPoll(true); msTraiter(); });
    window.addEventListener("online", () => { if (!me || !MS.pret) return; RT.essais = 0; if (!RT.ws) rtConnecter(); msPoll(true); MS.file.forEach((f) => { if (f.etat === "echec") f.etat = "attente"; }); msTraiter(); });
    function goEleve(id) { const x = eleves.find((y) => y.id === id); if (!x) { toast("Élève introuvable"); return; } if (me && me.role === "moniteur") { ficheCourte(x); return; } msVoirFil(false); pick("sec"); sub("eleves"); pcStage = etapeOf(x); S.set("pcStage", pcStage); pcSel = id; $("#sd-pcQ").value = ""; renderList(); $("#sd-pc").scrollIntoView({ block: "start" }); }
    function msOuvrir(c, el) { if (el) { goEleve(el); return; } if (c && MS.msgs[c]) { MS.cur = c; S.set("msCanal", c); } pick("msg"); if (c) { msVoirFil(true); MS.forceBas = true; msRender(); } }
    if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", (e) => { const u = e.data && e.data.sodafOuvrir; if (!u || !me) return; try { const q = new URL(u).searchParams; if (q.get("gerance") && DIR()) { pick("ger"); grOnglet(q.get("gerance")); setTimeout(() => $("#sd-gr").scrollIntoView({ block: "start" }), 300); return; } msOuvrir(q.get("canal"), +q.get("eleve") || 0); } catch (x) {} });
    $("#sd-msCanaux").addEventListener("click", (e) => { const b = e.target.closest("[data-ch]"); if (!b) return; if (MS.cur !== b.dataset.ch) { msPjVider(); recArret(false); } MS.cur = b.dataset.ch; S.set("msCanal", MS.cur); MS.forceBas = true; msVoirFil(true); msRender(); if (msLarge()) $("#sd-msTxt").focus(); });
    $("#sd-msList").addEventListener("scroll", () => { if (!msBasTic) msBasTic = requestAnimationFrame(() => { msBasTic = 0; msBasBtn(); }); }, { passive: true });
    $("#sd-msBas").addEventListener("click", () => { const box = $("#sd-msList"); MS.attente = 0; box.scrollTo({ top: box.scrollHeight, behavior: "smooth" }); });
    $("#sd-msBack").addEventListener("click", () => { if (history.state && history.state.sdMsFil) history.back(); else msVoirFil(false); });
    $("#sd-msList").addEventListener("click", async (e) => {
      const b = e.target.closest("[data-goel]"); if (b) { goEleve(+b.dataset.goel); return; }
      const rv = e.target.closest("[data-renvoi]"); if (rv) { const f = MS.file.find((y) => y.cle === rv.dataset.renvoi); if (f) { f.etat = "attente"; f.err = ""; msRender(); msTraiter(); } return; }
      const an = e.target.closest("[data-annule]"); if (an) { const i = MS.file.findIndex((y) => y.cle === an.dataset.annule); if (i >= 0 && MS.file[i].etat === "echec") { MS.file.splice(i, 1); msRender(); } return; }
      const au = e.target.closest(".ms-aud"); if (au) {
        if (e.target.closest(".ms-vit")) { MS.vitesse = MS.vitesse === 1 ? 1.5 : MS.vitesse === 1.5 ? 2 : 1; AUD.playbackRate = MS.vitesse; document.querySelectorAll("#sd-msList .ms-vit").forEach((v) => (v.textContent = String(MS.vitesse).replace(".", ",") + "×")); return; }
        if (e.target.closest(".ms-prog")) { msAudSauter(au, e); return; }
        if (e.target.closest(".ms-play")) msAudJouer(au);
        return;
      }
      const f = e.target.closest(".ms-img, .ms-file"); if (!f) return;
      if (f.classList.contains("ms-img")) { msVue(f); return; } // photo : visionneuse plein écran dans l'application (téléphone compris)
      if (!f.dataset.pj) return;
      const w = window.open("", "_blank"); const [u] = await msSigne([f.dataset.pj]);
      if (!u) { if (w) w.close(); toast("Fichier indisponible"); return; }
      if (w) w.location = u; else location.href = u;
    });
    $("#sd-msList").addEventListener("keydown", (e) => { const p = e.target.closest(".ms-prog"); if (!p || !MS.lect) return; const el = p.closest(".ms-aud"); if (el.dataset.aud !== MS.lect.cle) return; if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); try { AUD.currentTime = Math.max(0, AUD.currentTime + (e.key === "ArrowRight" ? 5 : -5)); } catch (x) {} } });
    const msTa = $("#sd-msTxt"), msGrow = () => { const l = $("#sd-msList"), bas = l.scrollHeight - l.scrollTop - l.clientHeight < 80; msTa.style.height = "auto"; msTa.style.height = Math.min(msTa.scrollHeight, 150) + "px"; if (bas) l.scrollTop = l.scrollHeight; }; // le fil reste collé en bas quand la zone de saisie change de taille
    // @mentions : propositions parmi les membres de la conversation
    const msSugEl = $("#sd-msSug");
    function msSugMaj() {
      const k = MS.canaux.find((c) => c.id === MS.cur), av = msTa.value.slice(0, msTa.selectionStart), m = av.match(/(^|\s)@([A-Za-zÀ-ÿ'-]*)$/);
      if (!k || !m) { msSugEl.hidden = true; MS.sug = []; return; }
      const q = msPlat(m[2]), vus = new Set(); MS.sug = msMembres(k).filter((p) => p.id !== me.id && msPlat(msPrenom(p)).startsWith(q) && !vus.has(msPlat(msPrenom(p))) && vus.add(msPlat(msPrenom(p))));
      if (!MS.sug.length) { msSugEl.hidden = true; return; }
      MS.sugI = Math.min(MS.sugI, MS.sug.length - 1);
      msSugEl.innerHTML = MS.sug.map((p, i) => '<button type="button" role="option" class="ms-so' + (i === MS.sugI ? " on" : "") + '" aria-selected="' + (i === MS.sugI) + '" data-so="' + i + '"><i class="ms-av r-' + esc(p.role) + '">' + esc(msPrenom(p)[0]) + "</i><b>@" + esc(msPrenom(p)) + "</b><small>" + esc(msRole[p.role] || "") + "</small></button>").join("");
      msSugEl.hidden = false;
    }
    function msSugPrendre(i) {
      const p = MS.sug[i]; if (!p) return; const pos = msTa.selectionStart, av = msTa.value.slice(0, pos).replace(/@([A-Za-zÀ-ÿ'-]*)$/, "@" + msPrenom(p) + " ");
      msTa.value = av + msTa.value.slice(pos); msTa.setSelectionRange(av.length, av.length); msSugEl.hidden = true; MS.sug = []; msTa.focus(); msGrow();
    }
    msSugEl.addEventListener("mousedown", (e) => e.preventDefault());
    msSugEl.addEventListener("click", (e) => { const b = e.target.closest("[data-so]"); if (b) msSugPrendre(+b.dataset.so); });
    msTa.addEventListener("input", () => { msGrow(); MS.sugI = 0; msSugMaj(); });
    msTa.addEventListener("click", msSugMaj);
    msTa.addEventListener("blur", () => setTimeout(() => (msSugEl.hidden = true), 150));
    msTa.addEventListener("keydown", (e) => {
      if (!msSugEl.hidden && MS.sug.length) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); MS.sugI = (MS.sugI + (e.key === "ArrowDown" ? 1 : MS.sug.length - 1)) % MS.sug.length; msSugMaj(); return; }
        if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); msSugPrendre(MS.sugI); return; }
        if (e.key === "Escape") { msSugEl.hidden = true; return; }
      }
      if (e.key === "Enter" && !e.shiftKey && !matchMedia("(pointer: coarse)").matches) { e.preventDefault(); $("#sd-msForm").requestSubmit(); }
    });
    // Pièce jointe : photo réduite (1600 px, JPEG) avant l'envoi, autres fichiers tels quels (10 Mo au plus)
    const MS_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
    const MS_EXT = { pdf: "application/pdf", txt: "text/plain", doc: "application/msword", docx: MS_TYPES[6], xls: "application/vnd.ms-excel", xlsx: MS_TYPES[8] };
    function msReduire(file) {
      return new Promise((ok) => {
        const u = URL.createObjectURL(file), im = new Image();
        im.onload = () => { const r = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight)), w = Math.round(im.naturalWidth * r), h = Math.round(im.naturalHeight * r), c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.drawImage(im, 0, 0, w, h); URL.revokeObjectURL(u); c.toBlob((b) => ok(b ? { blob: b, type: "image/jpeg", w, h } : null), "image/jpeg", 0.8); };
        im.onerror = () => { URL.revokeObjectURL(u); ok(null); };
        im.src = u;
      });
    }
    // Plusieurs pièces jointes (10 au plus) : chacune part dans son propre message, le texte accompagne la première
    const MS_MAX = 10;
    function msPjListe() {
      const el = $("#sd-msPj"), l = MS.pjs; el.hidden = !l.length;
      el.innerHTML = l.map((pj, i) => '<div class="ms-pji">' + (pj.local && pj.w ? '<img src="' + pj.local + '" alt="">' : '<i class="ms-fic">' + esc(pj.ext.slice(0, 4).toUpperCase()) + "</i>") + "<span><b>" + esc(pj.nom) + "</b><small>" + msTaille(pj.taille) + '</small></span><button type="button" class="ms-pjx" data-pjx="' + i + '" aria-label="Retirer ' + esc(pj.nom) + '">×</button></div>').join("") +
        (l.length ? '<p class="ms-pjn">' + l.length + " fichier" + (l.length > 1 ? "s" : "") + " prêt" + (l.length > 1 ? "s" : "") + " · ajoute un message si tu veux, puis Envoyer" + (l.length < MS_MAX ? " · le trombone en ajoute d'autres" : "") + "</p>" : "");
    }
    function msPjRetirer(i) { const pj = MS.pjs[i]; if (pj && pj.local) URL.revokeObjectURL(pj.local); MS.pjs.splice(i, 1); msPjListe(); }
    function msPjVider() { MS.pjs.forEach((pj) => pj.local && URL.revokeObjectURL(pj.local)); MS.pjs = []; msPjListe(); $("#sd-msFile").value = ""; }
    async function msPrendreUn(file) {
      const ext = (file.name.split(".").pop() || "").toLowerCase(); let pj = null;
      if (/^image\//.test(file.type) || /^(jpe?g|png|webp|heic|heif)$/.test(ext)) {
        const r = await msReduire(file); if (!r) { toast(file.name + " : photo illisible, essaie en JPEG ou PNG"); return null; }
        pj = { blob: r.blob, type: r.type, nom: (file.name.replace(/\.[^.]+$/, "") || "photo") + ".jpg", ext: "jpg", w: r.w, h: r.h };
      } else {
        const type = MS_TYPES.includes(file.type) ? file.type : MS_EXT[ext];
        if (!type) { toast(file.name + " : format non accepté (photo, PDF, Word, Excel ou texte)"); return null; }
        pj = { blob: file, type, nom: file.name, ext };
      }
      if (pj.blob.size > 10485760) { toast(file.name + " : trop lourd (10 Mo au plus)"); return null; }
      pj.taille = pj.blob.size; pj.local = URL.createObjectURL(pj.blob); return pj;
    }
    async function msPrendre(files) {
      let l = [...(files || [])]; if (!l.length) return;
      const place = MS_MAX - MS.pjs.length; if (place <= 0) { toast(MS_MAX + " fichiers au plus par envoi"); return; }
      if (l.length > place) { toast(MS_MAX + " fichiers au plus par envoi : les " + place + " premiers sont joints"); l = l.slice(0, place); }
      for (const f of l) { const pj = await msPrendreUn(f); if (pj) { MS.pjs.push(pj); msPjListe(); } }
      $("#sd-msFile").value = ""; msTa.focus();
    }
    $("#sd-msFile").addEventListener("change", (e) => msPrendre(e.target.files));
    // Glisser-déposer un fichier sur la conversation (ordinateur) ou coller une capture d'écran (Ctrl + V)
    const msFil = $(".ms-fil"); let msDragN = 0;
    const msAvecFichier = (e) => e.dataTransfer && [...(e.dataTransfer.types || [])].includes("Files");
    msFil.addEventListener("dragenter", (e) => { if (!msAvecFichier(e)) return; e.preventDefault(); msDragN++; msFil.classList.add("drop"); });
    msFil.addEventListener("dragover", (e) => { if (!msAvecFichier(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = "copy"; });
    msFil.addEventListener("dragleave", (e) => { if (!msAvecFichier(e)) return; if (--msDragN <= 0) { msDragN = 0; msFil.classList.remove("drop"); } });
    msFil.addEventListener("drop", (e) => { if (!msAvecFichier(e)) return; e.preventDefault(); msDragN = 0; msFil.classList.remove("drop"); msPrendre(e.dataTransfer.files); });
    window.addEventListener("dragover", (e) => { if (msAvecFichier(e) && !$('.tm-pane[data-pane="msg"]').hidden) e.preventDefault(); }); // déposé à côté : le navigateur n'ouvre pas le fichier à la place de l'espace équipe
    window.addEventListener("drop", (e) => { if (msAvecFichier(e) && !$('.tm-pane[data-pane="msg"]').hidden && !e.target.closest(".ms-fil")) { e.preventDefault(); toast("Dépose le fichier dans la conversation"); } });
    msTa.addEventListener("paste", (e) => { const f = (e.clipboardData && e.clipboardData.files) || []; if (f.length) { e.preventDefault(); msPrendre(f); } });
    $("#sd-msPj").addEventListener("click", (e) => { const x = e.target.closest("[data-pjx]"); if (x) msPjRetirer(+x.dataset.pjx); });
    // Envoi du fichier avec la progression (pourcentage affiché sous le message)
    function msEnvoyerFichier(canal, pj, prog) {
      return new Promise(async (ok, ko) => {
        const path = canal + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + pj.ext; let t = null;
        try { t = await DB.token(); } catch (e) { ko(new Error("session expirée")); return; }
        const x = new XMLHttpRequest(); x.open("POST", SB_URL + "/storage/v1/object/messages/" + path);
        x.setRequestHeader("apikey", SB_KEY); x.setRequestHeader("Authorization", "Bearer " + t); x.setRequestHeader("Content-Type", pj.type); x.setRequestHeader("x-upsert", "false");
        x.timeout = 120000;
        x.upload.onprogress = (e) => { if (e.lengthComputable && prog) prog(Math.round((e.loaded / e.total) * 100)); };
        x.onload = () => { if (x.status >= 200 && x.status < 300) { const f = { path, nom: pj.nom.slice(0, 120), type: pj.type, taille: pj.taille }; if (pj.w) { f.w = pj.w; f.h = pj.h; } if (pj.duree) f.duree = pj.duree; ok(f); } else { let m = ""; try { m = JSON.parse(x.responseText).message; } catch (e) {} ko(new Error(m || "envoi refusé (" + x.status + ")")); } };
        x.onerror = () => ko(new Error("pas de connexion")); x.ontimeout = () => ko(new Error("connexion trop lente"));
        x.send(pj.blob);
      });
    }
    // File d'envoi : chaque message s'affiche tout de suite (« Envoi… »), part dans l'ordre, et peut être renvoyé s'il échoue
    let msCleN = 0;
    function msMettreEnFile(canal, texte, pj, mentions) {
      const f = { cle: me.id.slice(0, 8) + "-" + Date.now().toString(36) + "-" + (++msCleN), canal, texte, pj, mentions: mentions && mentions.length ? mentions : null, etat: "attente", pct: null, le: new Date().toISOString(), fichier: null };
      MS.file.push(f); MS.repere.le = f.le; MS.attente = 0; MS.forceBas = true; msRender(); msTraiter(); return f;
    }
    async function msTraiter() {
      if (MS.traite) return; MS.traite = true;
      try {
        for (;;) {
          const f = MS.file.find((y) => y.etat === "attente"); if (!f) break;
          f.etat = "envoi"; f.err = ""; msRender();
          try {
            if (f.pj && !f.fichier) { f.pct = 0; f.fichier = await msEnvoyerFichier(f.canal, f.pj, (p) => { f.pct = p; const st = document.querySelector('#sd-msList [data-cle="' + f.cle + '"] .ms-st'); if (st && st.lastChild) st.lastChild.textContent = "Envoi " + p + " %"; }); }
            const body = { canal: f.canal, texte: f.texte || (f.fichier ? f.fichier.nom : ""), cle: f.cle }; if (f.mentions) body.mentions = f.mentions; if (f.fichier) body.fichier = f.fichier;
            let r; try { r = await DB.q("messages", { method: "POST", body, prefer: "return=representation" }); }
            catch (e) { if (e.status) throw e; const v = await DB.q("messages?select=*&cle=eq." + encodeURIComponent(f.cle)).catch(() => null); if (v && v[0]) r = v; else throw e; } // réponse perdue : le message est peut-être déjà enregistré
            if (r && r[0]) { if (!msAjout(r[0])) { const i = MS.file.indexOf(f); if (i >= 0) MS.file.splice(i, 1); } msRender(); }
          } catch (e) {
            f.etat = "echec"; f.err = navigator.onLine === false ? "pas de connexion" : String((e && e.message) || "réessaie").slice(0, 60); msRender();
          }
        }
      } finally { MS.traite = false; }
    }
    // Messages vocaux : appuie sur le micro, parle, puis « Envoyer le vocal » (3 min au plus). Le vocal s'affiche tout de suite chez toi et part en arrière-plan.
    const REC = { mr: null, flux: null, morceaux: [], debut: 0, tic: null, envoyer: false, texte: "", mentions: null };
    const msMentions = (canal, t) => { const k = MS.canaux.find((c) => c.id === canal); return k && t ? msMembres(k).filter((p) => p.id !== me.id && new RegExp("(^|[\\s(])@" + msPrenom(p).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\wÀ-ÿ])", "i").test(t)).map((p) => p.id) : []; };
    // Fin du vocal par le bouton d'envoi (ou le micro, ou la limite de 3 min) : le texte écrit et les @mentions partent avec le vocal, dans le même message
    function recEnvoyer() { if (!REC.mr) return; const t = msTa.value.trim(); REC.texte = t; REC.mentions = msMentions(MS.cur, t); msTa.value = ""; msGrow(); msSugEl.hidden = true; recArret(true); }
    function recArret(envoyer) { if (!REC.mr) return; REC.envoyer = envoyer; try { if (REC.mr.state !== "inactive") REC.mr.stop(); else recNettoyer(); } catch (x) { recNettoyer(); } }
    function recNettoyer() { REC.texte = ""; REC.mentions = null; $("#sd-msSend").classList.remove("enreg"); $("#sd-msSend").setAttribute("aria-label", "Envoyer"); clearInterval(REC.tic); if (REC.flux) REC.flux.getTracks().forEach((t) => t.stop()); REC.mr = null; REC.flux = null; REC.morceaux = []; $("#sd-msRec").hidden = true; $("#sd-msMic").classList.remove("on"); }
    $("#sd-msMic").addEventListener("click", async () => {
      if (REC.mr) { recEnvoyer(); return; }
      if (!navigator.mediaDevices || !window.MediaRecorder) { toast("Les vocaux ne marchent pas sur ce navigateur : utilise Chrome (Android) ou Safari (iPhone)"); return; }
      if (!MS.cur) return;
      if (MS.lect && MS.lect.etat === "joue") AUD.pause();
      // Voix claire : réduction du bruit et de l'écho, volume réglé automatiquement
      try { REC.flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } }); } catch (x) { toast("Micro refusé : autorise le micro pour autosodaf.com dans les réglages du navigateur"); return; }
      // Format lisible partout quand le téléphone sait le faire (AAC, comme les vocaux WhatsApp sur iPhone), sinon Opus
      const ok = (t) => { try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; } };
      const type = ["audio/mp4;codecs=mp4a.40.2", "audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus", "audio/webm"].find(ok);
      try { REC.mr = new MediaRecorder(REC.flux, type ? { mimeType: type, audioBitsPerSecond: /mp4/.test(type) ? 64000 : 48000 } : undefined); } catch (x) { recNettoyer(); toast("Enregistrement impossible sur ce téléphone"); return; }
      REC.morceaux = []; REC.envoyer = false; REC.debut = Date.now(); const canal = MS.cur, mr = REC.mr;
      mr.ondataavailable = (e) => { if (e.data && e.data.size) REC.morceaux.push(e.data); };
      mr.onstop = () => {
        const duree = (Date.now() - REC.debut) / 1000, mime = (mr.mimeType || type || "audio/webm").split(";")[0], blob = new Blob(REC.morceaux, { type: mime }), go = REC.envoyer, texte = REC.texte, mentions = REC.mentions, pjs = go ? MS.pjs.splice(0) : [];
        recNettoyer();
        if (!go) return; if (duree < 1 || !blob.size) { toast("Vocal trop court"); if (texte) { msTa.value = texte; msGrow(); } MS.pjs = pjs.concat(MS.pjs); msPjListe(); return; }
        const ext = mime === "audio/mp4" ? "m4a" : mime === "audio/ogg" ? "ogg" : "webm", h = new Date();
        const pj = { blob, type: mime, ext, taille: blob.size, duree: Math.max(1, Math.round(duree)), local: URL.createObjectURL(blob), nom: "vocal-" + String(h.getHours()).padStart(2, "0") + "h" + String(h.getMinutes()).padStart(2, "0") + "." + ext };
        const f = msMettreEnFile(canal, texte, pj, mentions); MS.blobs["local:" + f.cle] = pj.local;
        msPjListe(); $("#sd-msFile").value = ""; pjs.forEach((x) => msMettreEnFile(canal, "", x, null)); // fichiers joints pendant l'enregistrement : juste après le vocal
      };
      mr.start(1000); $("#sd-msMic").classList.add("on"); $("#sd-msSend").classList.add("enreg"); $("#sd-msSend").setAttribute("aria-label", "Envoyer le vocal"); $("#sd-msRec").hidden = false; $("#sd-msRecT").textContent = "0:00";
      REC.tic = setInterval(() => { const n = (Date.now() - REC.debut) / 1000; $("#sd-msRecT").textContent = msDuree(n); if (n >= 180) recEnvoyer(); }, 250);
    });
    $("#sd-msRecX").addEventListener("click", () => recArret(false));
    $("#sd-msForm").addEventListener("submit", (e) => {
      e.preventDefault(); if (REC.mr) { recEnvoyer(); return; } // un vocal en cours : la flèche l'envoie, avec le texte et la mention
      const t = msTa.value.trim(), canal = MS.cur, pjs = MS.pjs.slice(); if ((!t && !pjs.length) || !canal) return;
      const mentions = msMentions(canal, t);
      // Tout part dans la file : la zone de saisie se vide tout de suite, on peut continuer à écrire
      msTa.value = ""; msGrow(); MS.pjs = []; msPjListe(); $("#sd-msFile").value = ""; msSugEl.hidden = true;
      if (!pjs.length) { msMettreEnFile(canal, t, null, mentions); return; }
      pjs.forEach((pj, i) => msMettreEnFile(canal, i === 0 ? t : "", pj, i === 0 ? mentions : null));
    });
    // Ne pas quitter l'application avec un message pas encore parti
    window.addEventListener("beforeunload", (e) => { if (MS.file.some((f) => f.etat !== "echec")) { e.preventDefault(); e.returnValue = ""; } });
    // Notifications : activer, tester, désactiver (par téléphone)
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const b64u = (t) => { const b = atob((t + "=".repeat((4 - (t.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(b, (c) => c.charCodeAt(0)); };
    const msQuoi = () => "messages de l'équipe" + (me && me.role !== "moniteur" ? ", nouvelles pré-inscriptions et paiements Mixx" : "");
    async function msSave(sub) { const j = sub.toJSON(); try { await DB.q("rpc/push_enregistrer", { method: "POST", body: { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_appareil: navigator.userAgent.slice(0, 200) } }); } catch (e) {} } // rattache ce téléphone au compte connecté
    async function msNotifBox() {
      const el = $("#sd-msNotif"); if (!el || !me) return;
      const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        el.className = "ms-notif off"; el.innerHTML = isIOS && !standalone ? "<b>Notifications sur iPhone</b><span>Ajoute d'abord l'espace équipe à l'écran d'accueil : bouton Partager, puis « Sur l'écran d'accueil ». Ouvre-le ensuite depuis la nouvelle icône SODAF et reviens ici.</span>" : "<b>Notifications indisponibles sur ce navigateur</b><span>Sur Android, utilise Chrome. Sur iPhone, ouvre l'espace équipe depuis son icône sur l'écran d'accueil.</span>"; return; }
      if (Notification.permission === "denied") { el.className = "ms-notif off"; el.innerHTML = "<b>Notifications bloquées</b><span>Autorise les notifications pour autosodaf.com dans les réglages du navigateur, puis recharge la page.</span>"; return; }
      let sub = null; try { const reg = await navigator.serviceWorker.ready; sub = await reg.pushManager.getSubscription(); } catch (e) {}
      if (sub && Notification.permission === "granted") { el.className = "ms-notif on"; el.innerHTML = '<b title="' + esc("Tu es prévenu des " + msQuoi() + ", même application fermée.") + '">✓ Notifications activées sur ce téléphone</b><div class="ms-na"><button type="button" class="linkbtn" data-push="test">Tester</button><button type="button" class="linkbtn" data-push="off">Désactiver</button></div>'; msSave(sub); return; }
      el.className = "ms-notif"; el.innerHTML = "<b>Recevoir les notifications sur ce téléphone</b><span>Pour être prévenu des " + msQuoi() + ', même quand l\'application est fermée.</span><div class="ms-na"><button type="button" class="btn btn-green btn-sm" data-push="on">Activer les notifications</button></div>';
    }
    $("#sd-msNotif").addEventListener("click", async (e) => {
      const b = e.target.closest("[data-push]"); if (!b) return; const a = b.dataset.push;
      if (a === "on") {
        b.disabled = true;
        try {
          if ((await Notification.requestPermission()) !== "granted") { toast("Notifications refusées"); msNotifBox(); return; }
          const reg = await navigator.serviceWorker.ready, sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(VAPID_PUB) }));
          await msSave(sub); toast("Notifications activées : une notification d'essai arrive");
          try { await DB.q("rpc/push_test", { method: "POST", body: {} }); } catch (x) {}
        } catch (x) { toast("Activation impossible sur ce navigateur"); }
        msNotifBox();
      } else if (a === "test") { await run(() => DB.q("rpc/push_test", { method: "POST", body: {} }), "Notification d'essai envoyée"); }
      else if (a === "off") {
        try { const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription(); if (sub) { try { await DB.q("push_abonnements?endpoint=eq." + encodeURIComponent(sub.endpoint), { method: "DELETE", prefer: "return=minimal" }); } catch (x) {} await sub.unsubscribe(); } } catch (x) {}
        toast("Notifications désactivées sur ce téléphone"); msNotifBox();
      }
    });

    // Secrétariat : pas d'onglet Moniteur. Les cours de code et les séances de conduite du jour sont en bas de sa page (dépliable), avec l'appel si le moniteur ne l'a pas fait.
    function secAujourdhui() {
      if ($("#sd-secAuj")) return;
      $('#sd-tmTabs [data-t="mon"]').hidden = true;
      const d = document.createElement("details"); d.className = "card tm-auj"; d.id = "sd-secAuj"; d.open = S.get("secAuj", "1") === "1";
      d.innerHTML = '<summary><span><b>Aujourd\'hui</b><small id="sd-secAujSum">Cours de code et séances de conduite du jour</small></span><em>Voir / replier</em></summary><div id="sd-secAujSlot"></div>';
      $('.tm-pane[data-pane="sec"]').appendChild(d);
      const g = $('.tm-pane[data-pane="mon"] .tm-mon'); if (g) $("#sd-secAujSlot").appendChild(g);
      const h = $("#sd-mcDrive .tm-h3"); if (h) h.textContent = "Séances de conduite d'aujourd'hui";
      d.addEventListener("toggle", () => { S.set("secAuj", d.open ? "1" : "0"); if (d.open) loadMon(); });
    }
    // Nouvelle version publiée : l'application ouverte sur un téléphone peut rester des heures en mémoire.
    // Au retour sur l'application (et toutes les 5 min), on compare la version ; si elle a changé, on recharge (ou on propose si un message est en cours d'écriture).
    const APP_V = (() => { const sc = document.querySelector('script[src*="app.js?v="]'); return sc ? sc.getAttribute("src").split("v=")[1] : ""; })();
    let majVue = false;
    async function majVerifier(retour) {
      if (!APP_V || majVue || navigator.onLine === false) return;
      let t = ""; try { t = await (await fetch(location.pathname + "?maj=" + Date.now(), { cache: "no-store" })).text(); } catch (e) { return; }
      const m = t.match(/app\.js\?v=(\d+)/); if (!m || m[1] === APP_V) return;
      const occupe = (msTa && msTa.value.trim()) || MS.pjs.length || MS.file.length || REC.mr || document.querySelector(".tm-pane:not([hidden]) form input:focus, .tm-pane:not([hidden]) form textarea:focus");
      if (retour && !occupe) { location.reload(); return; }
      majVue = true; const d = document.createElement("div"); d.className = "maj-bar"; d.innerHTML = "<span>Nouvelle version de l'espace équipe</span><button type=\"button\" class=\"btn btn-sm btn-green\">Mettre à jour</button>";
      d.querySelector("button").addEventListener("click", () => location.reload()); document.body.appendChild(d);
    }
    document.addEventListener("visibilitychange", () => { if (!document.hidden) majVerifier(true); });
    setInterval(() => { if (!document.hidden) majVerifier(false); }, 300000);
    // ---- Sécurité de l'espace équipe
    // 1. Déconnexion automatique après 3 jours sans activité (choix de la direction, 6 oct.) (même téléphone oublié ouvert). 2. Compte désactivé par la direction : sortie immédiate.
    // 3. Journal des connexions : chaque appareil est reconnu ; une connexion depuis un appareil jamais vu prévient la direction et la personne.
    const SEC = { login: false, limite: 3 * 24 * 3600000, ecrit: 0, compteTic: 0 };
    const secLire = () => { try { return +localStorage.getItem("sodaf.actif") || 0; } catch (e) { return 0; } };
    function secActif(force) { const n = Date.now(); if (!force && n - SEC.ecrit < 30000) return; SEC.ecrit = n; try { localStorage.setItem("sodaf.actif", String(n)); } catch (e) {} }
    ["pointerdown", "keydown", "touchstart", "wheel"].forEach((ev) => document.addEventListener(ev, () => { if (me) secActif(); }, { passive: true, capture: true }));
    async function secSortir(msg) {
      try { rtFermer(); AUD.pause(); recArret(false); } catch (e) {}
      await DB.logout(); me = null; show(false); const er = $("#sd-teamErr"); er.textContent = msg; er.hidden = false;
    }
    async function secVerifier(compte) {
      if (!me) return;
      const d = secLire(); if (d && Date.now() - d > SEC.limite) { await secSortir("Déconnecté après 3 jours sans utiliser l'application. Reconnecte-toi."); return; }
      if (!compte) return;
      try { const r = await DB.q("profils?select=actif&id=eq." + me.id); if (!r.length || r[0].actif === false) await secSortir("Ce compte a été désactivé par la direction."); } catch (e) {}
    }
    setInterval(() => { if (document.hidden) return; SEC.compteTic++; secVerifier(SEC.compteTic % 5 === 0); }, 60000); // inactivité : chaque minute ; compte : toutes les 5 min
    document.addEventListener("visibilitychange", () => { if (!document.hidden) secVerifier(true); });
    function secAppareil() {
      try { let a = localStorage.getItem("sodaf.appareil"); if (!a || a.length < 16) { a = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join(""); localStorage.setItem("sodaf.appareil", a); } return a; }
      catch (e) { return "sans-memoire-" + (navigator.userAgent.length || 0); }
    }
    async function secDescription() {
      const ua = navigator.userAgent; let modele = "";
      // Modèle exact du téléphone quand le navigateur le donne (Android + Chrome) ; l'iPhone ne le donne jamais
      try { if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) { const h = await navigator.userAgentData.getHighEntropyValues(["model"]); modele = String(h.model || "").trim().slice(0, 40); if (/^SM-/i.test(modele)) modele = "Samsung " + modele; } } catch (e) {}
      const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ? "iPad" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "Appareil";
      const nav = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /CriOS|Chrome\//.test(ua) ? "Chrome" : /FxiOS|Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "navigateur";
      return os + (modele ? " " + modele : "") + " · " + nav + (matchMedia("(display-mode: standalone)").matches || navigator.standalone ? " (application)" : "");
    }
    async function secNoter() {
      const k = "sodaf.cx." + me.id; let deja = false; try { deja = localStorage.getItem(k) === "1"; } catch (e) {}
      const login = SEC.login; SEC.login = false; if (!login && deja) return; // appareil déjà connu et simple réouverture : rien à noter
      try { await DB.q("rpc/connexion_noter", { method: "POST", body: { p_appareil: secAppareil(), p_description: await secDescription(), p_login: login } }); try { localStorage.setItem(k, "1"); } catch (e) {} } catch (e) {}
    }
    // Direction : comptes (désactiver / réactiver) et dernières connexions
    async function loadSec() {
      if (!me || me.role !== "admin" || !$("#sd-drComptes")) return;
      const [pr, ml, cx] = await Promise.all([DB.q("profils?select=id,nom,role,actif").catch(() => null), DB.q("rpc/comptes_emails", { method: "POST", body: {} }).catch(() => []), DB.q("connexions?select=*&order=le.desc&limit=40").catch(() => null)]);
      if (!pr) return;
      const R = { admin: "Direction", gerant: "Gérante", secretariat: "Secrétariat", moniteur: "Moniteur" }, quand = (d) => { const x = new Date(d), j = msJour(d); return (j === "Aujourd'hui" ? "aujourd'hui" : j === "Hier" ? "hier" : x.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })) + " à " + x.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); };
      const der = {}, mail = {}; (cx || []).forEach((c) => { if (!der[c.profil]) der[c.profil] = c; }); (ml || []).forEach((x) => (mail[x.id] = x.email));
      const alias = (id) => { const m = (mail[id] || "").match(/\+([^@]+)@/); return m && !/^(secretariat|moniteur|direction|admin|gerante?)$/i.test(m[1]) ? " (" + m[1] + ")" : ""; }; // alias du rôle lui-même : rien à ajouter
      const lieu = (c) => (c.pays ? (c.ville ? c.ville + ", " : "") + c.pays : ""), loin = (c) => c.pays && c.pays !== "Togo";
      pr.sort((a, b) => (b.actif !== false) - (a.actif !== false) || ["admin", "gerant", "secretariat", "moniteur"].indexOf(a.role) - ["admin", "gerant", "secretariat", "moniteur"].indexOf(b.role));
      $("#sd-drComptes").innerHTML = pr.map((p) => { const on = p.actif !== false, c = der[p.id]; return '<div class="sc-row' + (on ? "" : " off") + '"><div class="sc-who"><b>' + esc(p.nom) + "</b><small>" + esc(R[p.role] || p.role) + (p.id === me.id ? " · toi" : "") + (mail[p.id] ? "<br><span class=\"sc-mail\">" + esc(mail[p.id]) + "</span>" : "") + "</small></div><div class=\"sc-last\">" + (c ? "Dernière connexion " + esc(quand(c.le)) + "<small>" + esc(c.description || "") + (lieu(c) ? " · " + esc(lieu(c)) : "") + "</small>" : "<small>Aucune connexion notée depuis l'activation du journal</small>") + '</div><div class="sc-act"><em class="sc-st">' + (on ? "Actif" : "Désactivé") + "</em>" + (on ? '<button type="button" class="btn btn-sm btn-line" data-edit="' + esc(p.id) + '">Modifier</button>' : "") + (p.id === me.id ? "" : '<button type="button" class="btn btn-sm ' + (on ? "btn-line sc-off" : "btn-green") + '" data-cpt="' + esc(p.id) + '" data-on="' + (on ? 0 : 1) + '">' + (on ? "Désactiver" : "Réactiver") + "</button>") + '</div><form class="sc-form sc-edit" data-id="' + esc(p.id) + '" hidden novalidate><div class="row2"><div class="field"><label for="sd-cm-' + esc(p.id) + '">Prénom ou adresse</label><input id="sd-cm-' + esc(p.id) + '" data-k="mail" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + esc(mail[p.id] || "") + '"><small class="sc-apercu" data-for="sd-cm-' + esc(p.id) + '"></small></div><div class="field"><label for="sd-cp-' + esc(p.id) + '">Nouveau mot de passe</label><input id="sd-cp-' + esc(p.id) + '" data-k="pw" type="password" autocomplete="new-password" placeholder="Vide = on garde l\'actuel"></div></div><div class="sc-fbtn"><button type="submit" class="btn btn-sm btn-green">Enregistrer</button><button type="button" class="btn btn-sm btn-line" data-annul="1">Annuler</button></div></form></div>'; }).join("");
      SEC.mailDir = mail[me.id] || "";
      $("#sd-drCx").innerHTML = (cx || []).length ? cx.slice(0, 15).map((c) => { const p = pr.find((x) => x.id === c.profil) || { nom: "Compte", role: "" }; return '<div class="tm-row sc-cx' + (c.nouvel ? " neuf" : "") + '"><div class="tm-time">' + esc(quand(c.le)) + '</div><div class="tm-main"><b>' + esc(msPrenom(p) + alias(p.id)) + " · " + esc(R[p.role] || "") + (c.nouvel ? ' <em class="sc-new">Nouvel appareil</em>' : "") + (loin(c) ? ' <em class="sc-new sc-loin">Hors du Togo</em>' : "") + "</b><span>" + esc(c.description || "Appareil") + (lieu(c) ? " · <strong>" + esc(lieu(c)) + "</strong>" + (c.operateur ? " (" + esc(c.operateur) + ")" : "") : c.ip ? " · lieu en cours de recherche" : "") + "</span></div></div>"; }).join("") : '<p class="tm-empty">Les connexions apparaîtront ici à partir de maintenant.</p>';
    }
    async function start() {
      const s = DB.session; if (!s) { show(false); return; }
      { const d = secLire(); if (!SEC.login && d && Date.now() - d > SEC.limite) { await DB.logout(); show(false); const er = $("#sd-teamErr"); er.textContent = "Déconnecté après 3 jours sans utiliser l'application. Reconnecte-toi."; er.hidden = false; return; } }
      secActif(true);
      const rows = await run(() => DB.q("profils?select=nom,role,actif&id=eq." + s.user.id));
      if (!rows) return;
      if (!rows.length || rows[0].actif === false) { await DB.logout(); show(false); $("#sd-teamErr").textContent = rows.length ? "Ce compte a été désactivé par la direction." : "Ce compte n'est pas autorisé dans l'espace équipe."; $("#sd-teamErr").hidden = false; return; }
      me = Object.assign({ id: s.user.id }, rows[0]);
      secNoter();
      const rg = await run(() => DB.q("reglages?select=*")); if (rg) rg.forEach((r) => (CFG[r.cle] = r.valeur));
      // Visio Google Meet : salle fixe de l'équipe si elle est enregistrée (réglage visio_lien), sinon nouvelle réunion
      if (/^https:\/\/meet\.google\.com\//.test(CFG.visio_lien || "")) { $("#sd-tmVisio").href = CFG.visio_lien; $("#sd-tmVisio").title = "Rejoindre la visio de l'équipe"; const iv = $("#sd-tmVisioWa"); iv.href = "https://wa.me/?text=" + encodeURIComponent("Visio SODAF : on se retrouve ici maintenant\n" + CFG.visio_lien); iv.hidden = false; }
      $("#sd-tmHello").textContent = "Bonjour " + me.nom.split(" ")[0];
      $("#sd-tmRole").textContent = { admin: "Direction", gerant: "Gérante", secretariat: "Secrétariat", moniteur: "Moniteur" }[me.role] + " · Espace équipe SODAF";
      show(true);
      const dirTab = $('#sd-tmTabs [data-t="dir"]'); dirTab.hidden = !DIR(); // direction et gérante
      dirTab.querySelector("b").textContent = me.role === "gerant" ? "Chiffres" : "Direction"; dirTab.querySelector("small").textContent = me.role === "gerant" ? "Vue d'ensemble de l'agence" : "Chiffres du mois, à surveiller";
      $('#sd-tmTabs [data-t="ger"]').hidden = !DIR(); // onglet Gérance : la gérante y travaille, la direction y répond
      $("#sd-grRole").textContent = me.role === "gerant" ? "Ton espace de gérante : demande l'accord de la direction, note tes décisions, envoie ton rapport de la semaine. Tu as aussi les chiffres de l'agence, le secrétariat et le moniteur." : "L'espace de la gérante. Ici tu réponds à ses demandes, tu donnes ton avis sur ses décisions et tu lis ses rapports.";
      { const sec = $("#sd-drSec"); if (sec) sec.hidden = me.role !== "admin"; } // comptes et sécurité : direction seulement
      { const rl = $('.tm-pane[data-pane="dir"] .tm-role'); if (rl) rl.textContent = me.role === "gerant" ? "Vue d'ensemble de l'auto-école, mise à jour à chaque ouverture. Visible par la direction et toi." : "Vue d'ensemble de l'auto-école, mise à jour à chaque ouverture. Visible par la direction et la gérante."; }
      $('#sd-tmTabs [data-t="sec"]').hidden = me.role === "moniteur"; // le moniteur a son espace : cours, conduite, réservations, messages
      { const pb = $('#sd-secNav [data-s="paiements"]'); if (pb) pb.hidden = me.role === "moniteur"; } // reçus : direction et secrétariat seulement (règle aussi dans la base)
      if (me.role === "secretariat") secAujourdhui();
      await loadEleves(true);
      let t0 = S.get("tmTab", me.role === "gerant" ? "ger" : me.role === "admin" ? "dir" : me.role === "moniteur" ? "mon" : "sec"); if ((t0 === "dir" || t0 === "ger") && !DIR()) t0 = "sec";
      if (DIR()) grCharger(); // pastilles de la gérance dès l'ouverture
      pick(t0);
      sub("eleves");
      await msInit();
      { const g = new URLSearchParams(location.search).get("gerance"); if (g && DIR()) { history.replaceState(null, "", location.pathname + location.hash); pick("ger"); grOnglet(g); setTimeout(() => $("#sd-gr").scrollIntoView({ block: "start" }), 300); } }
      { const q = new URLSearchParams(location.search), c = q.get("canal"), el = +q.get("eleve") || 0; if (c || el) { history.replaceState(null, "", location.pathname + location.hash); msOuvrir(c, el); } }
    }

    // ---- Parcours élèves : Accueil → Appels → En formation → Archivés
    const ETAPES = { accueil: ["Nouveau"], appels: ["Contacté"], formation: ["Inscrit", "En formation", "Permis obtenu"], archives: ["Abandon"] };
    const etapeOf = (x) => (x.statut === "Permis obtenu" ? "archives" : ["Inscrit", "En formation"].includes(x.statut) && x.examen_etape ? "examen" : x.statut === "Contacté" && x.dossier_envoye_le ? "dossier" : Object.keys(ETAPES).find((k) => ETAPES[k].includes(x.statut)) || "accueil");
    const CFG = {};
    // ---- Groupes de code (salle de 6 places) : A lun+jeu, B mar+ven à 14 h 30 ; C, D le matin (fermés au départ) ; mercredi = rattrapage commun
    let GROUPES = [], gMan = false, monIdx = 0;
    const sansCode = (x) => /Remise à niveau|entreprise/i.test(x.formation || "");
    const enCode = (x) => etapeOf(x) === "formation" && !sansCode(x);
    const occ = (gid) => eleves.filter((x) => x.groupe_code === gid && enCode(x) && !susp(x) && (!x.groupe_depuis || Date.now() - new Date(x.groupe_depuis) < 42 * 864e5)).length;
    const JN = ["", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
    const gJours = (g) => g.jours.map((d) => JN[d]).join(" et ");
    const gHeure = (g) => g.heure.split(" – ")[0];
    const gOf = (id) => GROUPES.find((g) => g.id === id);
    const gLibre = () => GROUPES.filter((g) => g.actif).sort((a, b) => a.ordre - b.ordre).find((g) => occ(g.id) < g.places);
    const attente = () => eleves.filter((x) => enCode(x) && !x.groupe_code);
    const gPlein = () => { const a = GROUPES.filter((g) => g.actif); return !a.length || a.every((g) => occ(g.id) >= g.places); };
    const hCode = () => { const m = GROUPES.filter((g) => g.actif && parseInt(g.heure, 10) < 12); return "deux fois par semaine, l'après-midi à 14 h 30" + (m.length ? " ou le matin à " + gHeure(m[0]) : ""); };
    // ---- Séances de conduite par formule (calculées depuis les reçus, comme dans la base)
    const quotaF = (f) => !f ? null : /remise/i.test(f) ? 4 : /pack/i.test(f) ? 18 : /courte/i.test(f) ? 6 : /moto|^permis a/i.test(f) ? 6 : /théorique/i.test(f) ? 0 : /complète|accélérée/i.test(f) ? 12 : null;
    const attach = (r, pr, cr) => {
      const SL = {}, INS = {}, INSD = {}, PLUS = {}, FA = {}, RE = {}, td = iso(new Date());
      (pr || []).forEach((p) => { if (p.reste !== null && p.reste !== undefined) SL[p.eleve_id] = p.reste; if (/^Droit d'inscription/.test(p.motif || "")) { INS[p.eleve_id] = p.formation; INSD[p.eleve_id] = p.cree_le; } if (p.motif === "Séance de conduite supplémentaire") PLUS[p.eleve_id] = (PLUS[p.eleve_id] || 0) + Math.max(1, Math.round((p.montant || 5000) / 5000)); });
      (cr || []).forEach((c) => { if (c.statut === "Fait") FA[c.eleve_id] = (FA[c.eleve_id] || 0) + 1; else if (c.statut === "Réservé" && c.jour >= td) RE[c.eleve_id] = (RE[c.eleve_id] || 0) + 1; });
      r.forEach((x) => { x.solde = x.id in SL ? SL[x.id] : null; x.formule = INS[x.id] || null; const q = quotaF(INS[x.id]); x.quota = q === null ? null : q + (PLUS[x.id] || 0); x.plus = PLUS[x.id] || 0; x.faits = FA[x.id] || 0; x.resa = RE[x.id] || 0; x.ins_le = INSD[x.id] || null; });
    };
    const PAY_Q = "paiements?select=eleve_id,reste,cree_le,motif,formation,montant&annule=is.false&eleve_id=not.is.null&order=cree_le.asc&limit=10000";
    const CR_Q = "creneaux_conduite?select=eleve_id,statut,jour&eleve_id=not.is.null&statut=in.(Fait,Réservé)&limit=20000";
    const evalAt = (x) => (x.quota ? Math.max(1, x.quota - 2) : null);
    const seEtat = (x) => x.evaluation === "pret" ? "pret" : x.quota === null ? "cours" : x.evaluation === "plus" || x.faits >= x.quota ? "fin" : x.faits >= evalAt(x) ? "eval" : "cours";
    // Solde : à payer dans les 2 semaines après l'inscription (règle écrite sur le reçu). Un rappel à J+7 ; à J+14, place au code suspendue jusqu'au paiement
    const solEche = (x) => x.ins_le ? new Date(new Date(x.ins_le).getTime() + 14 * 864e5) : null;
    const solEtat = (x) => { if (!doit(x) || x.solde === null || x.solde === undefined) return null; const r = x.solde_rappels || 0, d = x.ins_le ? (Date.now() - new Date(x.ins_le)) / 864e5 : 0; return d >= 14 ? "susp" : r === 0 && d >= 7 ? "rappel" : "attente"; };
    const susp = (x) => solEtat(x) === "susp";
    const rapLe = (x) => new Date(new Date(x.ins_le || Date.now()).getTime() + 7 * 864e5).toISOString();
    const annonce = (x) => !!x.solde_rappel_le && !!solEche(x) && new Date(x.solde_rappel_le) >= solEche(x);
    // Bouton du rappel : actif seulement le jour où l'élève passe dans « Rappel » (J+7) et jusqu'à l'envoi ; à la suspension, un message facultatif
    const relSolBtn = (x, se) => {
      if (se === "rappel" || (se === "susp" && !annonce(x))) return '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" data-a="relSolde" href="https://wa.me/228' + waNum(x.telephone) + "?text=" + encodeURIComponent(msgSolde(x, se === "susp" ? 2 : 1)) + '">' + (se === "susp" ? "Prévenir de la suspension ↗" : "Envoyer le rappel ↗") + "</a>";
      return '<button class="btn btn-line btn-sm" type="button" disabled>' + (se === "susp" ? "Suspension annoncée ✓" : (x.solde_rappels || 0) ? "Rappel envoyé ✓" : "Rappel le " + dFr(rapLe(x)).replace(/\.$/, "")) + "</button>";
    };
    const plein = (x) => x.quota !== null && x.faits + x.resa >= x.quota;
    const cycleOk = (x) => !x.groupe_depuis || Date.now() - new Date(x.groupe_depuis) < 42 * 864e5;
    const msgPlus = (x) => "Bonjour " + prenom(x) + ",\n\nTu as fait les *" + x.faits + " séances de conduite* prévues dans ta formule. Ton moniteur te conseille quelques séances de plus avant l'examen, pour que tu sois vraiment à l'aise le jour J.\n\n*SÉANCE EN PLUS* : 5 000 F l'heure (tu choisis combien)." + (CFG.mixx_numero ? "\n\nTu peux payer à l'agence ou par *Mixx by Yas* au " + CFG.mixx_numero + (CFG.mixx_nom ? " (" + CFG.mixx_nom + ")" : "") + ", motif *" + CODE(x) + " SEANCE*, puis nous envoyer la capture du SMS ici." : "\n\nTu peux payer à l'agence aux heures de bureau.") + "\n\nDès le paiement, nous réservons tes séances." + SIGN;
    // Prochain cours d'un groupe (date + cours du programme)
    const prochainCours = (g) => { const n = new Date(); for (let i = 0; i < 15; i++) { const d = new Date(n.getFullYear(), n.getMonth(), n.getDate() + i), dow = ((d.getDay() + 6) % 7) + 1; if (!g.jours.includes(dow) || (i === 0 && n.getHours() * 60 + n.getMinutes() >= hmin(g.heure))) continue; return { d, b: BOUCLE[devWeek(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12))).c[dow === g.jours[0] ? 0 : 1]] }; } return null; };
    const msgGroupe = (x) => { const g = gOf(x.groupe_code), pc = prochainCours(g); return "Bonjour " + prenom(x) + ",\n\nVoici tes horaires de *cours de code en salle* chez SODAF Auto-École.\n\n*TON GROUPE : " + g.nom.toUpperCase() + "*\n• " + gJours(g).replace(/^./, (c) => c.toUpperCase()) + " : " + g.heure + "\n• Mercredi 14 h 30 : rattrapage et examen blanc (si tu as manqué un cours, ou pour t'entraîner)" +
      (pc ? "\n\n*TON PROCHAIN COURS*\n" + pc.d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }).replace(/^./, (c) => c.toUpperCase()) + " à " + gHeure(g) + " : cours " + pc.b.n + " sur 12, *" + pc.b.t + "*." : "") +
      "\n\n*LE PROGRAMME*\n12 cours en 6 semaines, puis il recommence : tu peux commencer n'importe quelle semaine, en 6 semaines tu vois tout. Après chaque cours, fais le *devoir du cours* sur autosodaf.com/#devoirs (10 questions, ton résultat part au moniteur).\n\nLa salle compte 6 places : merci d'arriver à l'heure. Tu peux aussi réviser à tout moment sur autosodaf.com (cours, quiz et devoir de la semaine).\n\nUn empêchement ? Préviens-nous en répondant à ce message." + SIGN; };
    const PRIXM = { "Permis B": "55 000 F la formation complète (formule courte 35 000 F, accélérée 75 000 F en 2 mois ou 80 000 F en 1 mois)", "Permis A": "30 000 F", "Pack A + B": "80 000 F", "Remise à niveau": "20 000 F", "Formation entreprise": "sur devis, selon le nombre de chauffeurs" };
    const jours = (d) => Math.floor((Date.now() - new Date(d)) / 864e5);
    const dosAge = (x) => { const b = x.web && x.web.le > (x.dossier_envoye_le || "") ? x.web.le : x.dossier_envoye_le; return jours(x.dossier_relance_le && x.dossier_relance_le > b ? x.dossier_relance_le : b); };
    const agence = (x) => x.web && x.web.mode === "agence";
    const msgDossier = (x) => "Bonjour " + prenom(x) + " 😊\n\nComme promis, voici ton dossier d'inscription SODAF Auto-École.\n\n*TON DOSSIER*\n• N° Client : " + CODE(x) + "\n• Formation : " + (x.formation || "à préciser") + "\n• Prix : " + (PRIXM[x.formation] || "voir autosodaf.com") + "\n• Droit d'inscription : 5 000 F\n\n✍️ *Finalise ton inscription en ligne (2 minutes) :*\n" + inscLink(x) + "\nTu choisis ta formule, puis tu paies à l'agence ou par Mixx by Yas. Tu reçois ensuite ton reçu officiel sur WhatsApp.\n\n📍 412 Avenue Akei, Tokoin Tamé (en face de la caisse)\n\nDes questions ? Réponds simplement à ce message.\nL'équipe SODAF · L'art de conduire, la force de réussir.";
    const newJeton = () => { const a = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789", r = new Uint32Array(10); crypto.getRandomValues(r); return [...r].map((n) => a[n % a.length]).join(""); };
    const jetonOf = (x) => x.jeton || (x._jeton = x._jeton || newJeton());
    const inscLink = (x) => "https://autosodaf.com/#inscrire-" + x.id + "-" + jetonOf(x);
    const payWhere = () => "à l'agence" + (CFG.mixx_numero ? " ou par Mixx by Yas" : "");
    const msgRel = (x, k) => { const L = inscLink(x), S = "\n\n*L'équipe SODAF · L'art de conduire, la force de réussir.*";
      if (k === 1) return "Bonjour " + prenom(x) + ",\n\nC'est le secrétariat de *SODAF Auto-École*. As-tu pu regarder ton inscription (N° Client : " + CODE(x) + ") ?\n\nTu peux la finaliser en 2 minutes ici :\n" + L + "\n\nUne question sur le prix, les horaires ou le paiement ? Réponds simplement à ce message." + S;
      if (k === 2) return "Bonjour " + prenom(x) + ",\n\nPetit rappel de *SODAF Auto-École* : ton inscription au " + (x.formation || "permis") + " t'attend toujours.\n\nLes cours de code se font en petits groupes de 6, " + hCode() + " : tu peux commencer dès ton inscription. Paiement " + payWhere() + ", en une ou deux fois.\n\nFinaliser mon inscription :\n" + L + S;
      if (k === 3) return "Bonjour " + prenom(x) + ",\n\nNous n'avons pas eu de nouvelles de ta part concernant ton inscription chez *SODAF Auto-École*.\n\nSi tu as besoin de plus de temps ou si tu as changé d'avis, dis-le-nous simplement : aucun souci.\n\nPour t'inscrire :\n" + L + S;
      return "Bonjour " + prenom(x) + ",\n\nSans nouvelles de ta part, nous mettons ton dossier d'inscription (N° Client : " + CODE(x) + ") en pause.\n\nIl reste disponible : le jour où tu veux commencer, réponds simplement à ce message ou appelle-nous au *+228 72 54 41 66*, et nous le réactivons tout de suite.\n\nMerci et à bientôt !" + S; };
    const CODE = (x) => "SO" + x.id;
    const SRC = { site: "Site web", agence: "Venu à l'agence", bureau: "Venu à l'agence", appel: "Appel téléphonique", whatsapp: "WhatsApp", bouche: "Bouche-à-oreille", reseaux: "Facebook / TikTok", affiche: "Affiche, flyer, QR", entreprise: "Entreprise", autre: "Autre" };
    const srcOf = (x) => (x.source === "site" ? SRC.site : SRC[x.provenance] || SRC.agence);
    const prenom = (x) => (x.nom || "").trim().split(/\s+/)[0];
    const msgAccueil = (x) => "Bonjour " + prenom(x) + ",\n\nIci le secrétariat de SODAF Auto-École. Nous avons bien reçu ta pré-inscription, merci !\n\n*TON DOSSIER*\n• N° Client : " + CODE(x) + "\n• Formation : " + (x.formation || "à préciser") + "\n\nNous allons t'appeler très bientôt pour répondre à tes questions et préparer ton inscription.\nGarde ton téléphone près de toi.\n\nÀ très vite !\n*L'équipe SODAF · L'art de conduire, la force de réussir.*\nautosodaf.com";
    // Relance WhatsApp après chaque appel sans réponse (1 à 4) ; la 4e classe le dossier
    const msgAppelRel = (x, n, k) => { const q = k === "matin" ? "en matinée" : "dans l'après-midi", S = SIGN;
      if (n === 1) return "Bonjour " + prenom(x) + ",\n\nIci le secrétariat de *SODAF Auto-École*. Nous venons d'essayer de t'appeler au sujet de ta pré-inscription (N° Client : " + CODE(x) + ").\n\nNous te rappellerons " + q + ". Si un autre moment t'arrange mieux, réponds simplement à ce message." + S;
      if (n === 2) return "Bonjour " + prenom(x) + ",\n\nNouvel essai de *SODAF Auto-École* pour ta pré-inscription au " + (x.formation || "permis") + " (N° Client : " + CODE(x) + "), toujours sans réponse.\n\nNous réessaierons " + q + ". Tu peux aussi nous écrire ici à tout moment : nous répondons à tes questions sur les prix, les horaires et le paiement." + S;
      if (n === 3) return "Bonjour " + prenom(x) + ",\n\nNous n'arrivons pas à te joindre au sujet de ton inscription chez *SODAF Auto-École* (N° Client : " + CODE(x) + ").\n\nNous ferons un dernier essai " + q + ". Si c'est plus simple pour toi, passe directement nous voir :\n" + AGENCE + S;
      return "Bonjour " + prenom(x) + ",\n\nNous avons essayé de te joindre plusieurs fois, sans succès. Nous arrêtons donc nos appels et ton dossier (N° Client : " + CODE(x) + ") est classé dans notre base.\n\nIl reste disponible : *à tout moment*, réponds simplement à ce message ou appelle-nous au *+228 72 54 41 66*, et nous reprenons ton inscription là où elle s'est arrêtée.\n\nEn attendant, révise le code gratuitement sur autosodaf.com" + S; };
    // ---------- Étape « Examen » ----------
    const PX = [["cni", "Photocopie de la carte d'identité"], ["acte", "Acte de naissance"], ["photo1", "Photo d'identité n° 1"], ["photo2", "Photo d'identité n° 2"]];
    const dOnly = (d) => new Date(String(d).slice(0, 10) + "T12:00:00");
    const dFr = (d) => (d ? dOnly(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "");
    const dLong = (d) => (d ? dOnly(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "");
    const ITI = "https://www.google.com/maps/search/?api=1&query=6.168785%2C1.225462";
    const AGENCE = "*OÙ NOUS TROUVER*\n412 Avenue Akei, Tokoin Tamé (en face de la caisse)\nLun – ven : 8 h – 12 h 30 et 14 h 30 – 18 h · Sam : 8 h – 12 h\nItinéraire : " + ITI;
    const exMixx = (x) => (CFG.mixx_numero ? "\n\nTu peux aussi payer les 30 000 F par *Mixx by Yas* au " + CFG.mixx_numero + (CFG.mixx_nom ? " (" + CFG.mixx_nom + ")" : "") + ", motif *" + CODE(x) + " EXAMEN*, puis nous envoyer la capture du SMS ici." : "");
    const exLine = (x) => x.examen_etape === "pret" ? (x.examen_lien_le ? "message envoyé " + ago(x.examen_lien_le) + " · dossier à apporter" : "message à envoyer") : x.examen_etape === "complet" ? "dossier reçu · à déposer" + (x.examen_passages ? " · " + (x.examen_passages + 1) + "e passage" : "") : "déposé le " + dFr(x.examen_depose_le) + " · résultat à noter";
    const SIGN = "\n\n*L'équipe SODAF · L'art de conduire, la force de réussir.*";
    const jourLong = (j) => longDay(j).replace(/^./, (c) => c.toUpperCase());
    const msgSeance = (el, c) => "Bonjour " + prenom(el) + ",\n\nTa séance de conduite est *confirmée*.\n\n*TA SÉANCE*\n• Date : " + jourLong(c.jour) + "\n• Heure : " + c.heure + " (durée 1 h)\n• Départ : SODAF, 412 Avenue Akei, Tokoin Tamé (en face de la caisse)\n• N° Client : " + CODE(el) + "\n\nMerci d'être là *10 minutes avant l'heure*, en chaussures fermées.\n\nUn empêchement ? Préviens-nous au moins la veille en répondant à ce message : nous déplacerons ta séance." + SIGN;
    const msgRappelSeance = (el, c) => "Bonjour " + prenom(el) + ",\n\nPetit rappel : ta séance de conduite est *demain, " + longDay(c.jour) + " à " + c.heure + "*.\n\nDépart : SODAF, 412 Avenue Akei, Tokoin Tamé (en face de la caisse). Merci d'être là 10 minutes avant l'heure.\n\nUn empêchement ? Réponds vite à ce message." + SIGN;
    const msgExamen = (x) => "Bonjour " + prenom(x) + ",\n\nFélicitations, ta formation chez *SODAF Auto-École* est terminée ! Pour la suite, nous devons faire le *dépôt de ton dossier d'examen* auprès de l'État.\n\n*À APPORTER À L'AGENCE*\n• Photocopie de ta carte d'identité\n• Ton acte de naissance\n• 2 photos d'identité (format passeport)\n• Le dépôt pour l'examen : 30 000 F\n\nLe dossier est accepté *uniquement complet* : apporte tout en une seule fois.\n\nN° Client : " + CODE(x) + exMixx(x) + "\n\n" + AGENCE + "\n\nÀ très vite !" + SIGN;
    const msgBravo = (x) => "Félicitations " + prenom(x) + " !\n\nToute l'équipe de *SODAF Auto-École* est fière de toi : tu as obtenu ton *permis de conduire*.\n\nUn dernier conseil : sur la route, la prudence reste ta meilleure alliée.\n\nSi tu es content(e) de ta formation, parle de SODAF autour de toi : ta famille et tes amis seront bien accueillis." + SIGN + "\nautosodaf.com";
    const say = (t) => '<p class="sc-say">« ' + t + " »</p>";
    const tip = (t) => '<p class="sc-tip">' + t + "</p>";
    // Nom de la formation tel qu'on le dit au téléphone (pas le nom administratif)
    const ORAL = { "Permis B": "le permis voiture", "Permis A": "le permis moto", "Pack A + B": "le permis moto et voiture", "Remise à niveau": "la remise à niveau", "Formation entreprise": "la formation de vos chauffeurs" };
    const script = (x) => {
      const exam = /Permis|Pack/.test(x.formation || ""), f = ORAL[x.formation] || "le permis";
      return '<ol class="sc">' +
        "<li><b>Saluer</b>" + say("Bonjour, ici SODAF Auto-École. Je vous appelle suite à votre pré-inscription pour " + esc(f) + ". Vous avez une petite minute ?") +
          tip("Pas disponible : « Pas de souci, je vous rappelle plutôt le matin ou l'après-midi ? » puis choisis quand rappeler.") + "</li>" +
        "<li><b>L'essentiel</b>" + say(x.formation === "Remise à niveau" ? "On reprend la conduite avec vous, à votre rythme, avec un moniteur, jusqu'à ce que vous soyez à l'aise au volant." : "Chez nous, vous apprenez le code en salle et aussi sur notre site, puis la conduite avec un moniteur. On vous accompagne jusqu'à l'examen.") + "</li>" +
        "<li><b>Conclure</b>" + say("Je vous envoie tout sur WhatsApp : les tarifs, comment s'inscrire et notre adresse. Vous regardez tranquillement, et vous me dites. Vous avez une question ?") +
          tip("Intéressé ou il veut réfléchir : touche « Envoyer le lien d'inscription » (en haut). Pas intéressé : « Plus tard » ou « Rétractation ».") + "</li></ol>" +
        '<details class="pc-more"><summary>S\'il pose une question</summary>' +
        tip("<b>Le prix :</b> on n'en parle pas au téléphone. « Tout est dans le message WhatsApp que je vous envoie juste après, avec les différentes formules. »") +
        tip("<b>Les papiers :</b> « Rien à apporter pour commencer. Les papiers, c'est à la fin, pour l'examen. »") +
        (exam ? tip("<b>L'examen :</b> « C'est nous qui déposons votre dossier à la fin de la formation, et l'État vous envoie la date par message. »") : "") +
        tip("<b>Les cours :</b> « Le code, c'est en petit groupe de 6, " + hCode() + ", et tout est aussi sur notre site. La conduite, c'est par séances d'une heure. »") +
        tip("<b>L'adresse :</b> « On est au 412 avenue Akei, à Tokoin Tamé, en face de la caisse. Le bureau est ouvert en semaine de 8 h à 18 h, avec une pause à midi, et le samedi matin. »") + "</details>";
    };
    const ago = (d) => { const m = Math.round((Date.now() - new Date(d)) / 60000); return m < 60 ? "il y a " + Math.max(m, 1) + " min" : m < 1440 ? "il y a " + Math.round(m / 60) + " h" : "il y a " + Math.round(m / 1440) + " j"; };
    let pcStage = S.get("pcStage", "accueil"), pcSel = null, pcFeed = [];
    const isWide = () => window.matchMedia("(min-width: 900px)").matches;

    // Le dossier change d'étape quand le reçu est ENREGISTRÉ dans la base (pas avant)
    const pendWeb = {};
    window.addEventListener("sodaf-recu-enregistre", async (ev) => {
      const dt = ev.detail || {}, x = dt.eid ? eleves.find((y) => y.id === dt.eid) : null;
      if (!x) return;
      if (/^ins-/.test(dt.motif || "") && ["Nouveau", "Contacté"].includes(x.statut)) {
        const w = pendWeb[x.id] || x.web;
        if (w) await run(() => DB.q("inscriptions_web?id=eq." + w.id, { method: "PATCH", body: { statut: "Vérifié" }, prefer: "return=minimal" }));
        const extra = w ? { nom: (w.prenoms + " " + w.nom).trim(), nom_famille: w.nom, prenoms: w.prenoms, telephone: w.telephone || x.telephone, quartier: w.quartier || x.quartier } : {};
        if (await patchEl(x, Object.assign({ statut: "En formation", rappel: null }, extra), "Reçu enregistré : il passe en formation", ["Étape", "En formation (reçu d'inscription" + (w ? ", " + (w.mode === "mixx" ? "Mixx vérifié" : "payé à l'agence") : "") + ")"])) { delete pendWeb[x.id]; x.web = null; }
      } else if (dt.motif === "rest") {
        const body = { solde_rappels: 0, solde_rappel_le: null }, g = x.groupe_code && gOf(x.groupe_code);
        if (susp(x) && g && occ(g.id) >= g.places) { body.groupe_code = null; body.groupe_depuis = null; body.groupe_msg_le = null; } // son groupe s'est rempli : il reprend la première place libre
        await patchEl(x, body, "Solde payé : formation soldée" + (body.groupe_code === null ? " · son groupe est complet : placé à la première place libre" : ""));
      } else if (dt.motif === "examen" && x.examen_etape === "pret") {
        const le = new Date().toISOString(), docs = {}; PX.forEach((p) => (docs[p[0]] = { main: true, le }));
        await patchEl(x, { examen_paye: true, examen_docs: docs, examen_etape: "complet" }, "Reçu enregistré : dossier d'examen complet", ["Étape", "Examen : Dossier complet reçu (papiers + 30 000 F)"]);
      }
      await loadEleves(true); // en arrière-plan : l'écran du reçu reste ouvert pour l'envoyer
    });
    window.addEventListener("sodaf-recu-envoye", async (ev) => {
      toast("Reçu envoyé");
      sub("eleves"); pcSel = null; await loadEleves(true); $("#sd-pc").scrollIntoView({ block: "start" });
    });
    // États calculés depuis les dates (rappel à J+7, suspension à J+14, fin de cycle) : la liste se remet à jour toute seule quand ils changent
    let lastEtats = "", placing = false;
    const etats = () => eleves.filter((x) => etapeOf(x) === "formation").map((x) => x.id + ":" + solEtat(x) + ":" + cycleOk(x)).join(",");
    // Placement automatique au code : dès qu'une place est libre, la base place la liste d'attente (premier inscrit, premier placé)
    async function autoPlace() {
      if (placing || !GROUPES.length || !eleves.some((x) => enCode(x) && !x.groupe_code && !susp(x)) || !gLibre()) return;
      placing = true;
      try {
        const r = await DB.q("rpc/code_placer", { method: "POST", body: {} });
        if (r && r.length) {
          const now = new Date().toISOString();
          r.forEach((p) => { const x = eleves.find((y) => y.id === p.eleve_id); if (x) Object.assign(x, { groupe_code: p.groupe, groupe_depuis: now, groupe_msg_le: null }); });
          const x0 = eleves.find((y) => y.id === r[0].eleve_id), g0 = gOf(r[0].groupe);
          toast(r.length > 1 ? r.length + " élèves placés au code automatiquement : horaires à envoyer" : (x0 ? x0.nom : "Élève") + " placé au code (" + (g0 ? g0.nom : r[0].groupe) + ") : horaires à envoyer");
          renderList(r.some((p) => p.eleve_id === pcSel) ? null : pcSel);
        }
      } catch (e) { /* réessayé au prochain rafraîchissement */ } finally { placing = false; }
    }
    async function loadEleves(silent) {
      const [r, wb, pr, gr, cr] = await Promise.all([run(() => DB.q("eleves?select=*&order=cree_le.desc&limit=2000")), run(() => DB.q("inscriptions_web?select=*&order=le.desc&limit=2000")), run(() => DB.q(PAY_Q)), run(() => DB.q("groupes_code?select=*&order=ordre")), run(() => DB.q(CR_Q))]);
      if (!r) return; if (gr) GROUPES = gr;
      const W = {}; (wb || []).forEach((w) => { if (!W[w.eleve_id]) W[w.eleve_id] = w; });
      attach(r, pr, cr);
      r.forEach((x) => { x.web = W[x.id] && W[x.id].statut === "Nouveau" ? W[x.id] : null; });
      eleves = r; // remplacé d'un coup, déjà complet (solde compris)
      const nb = eleves.filter((x) => x.statut === "Nouveau").length + eleves.filter((x) => x.web && x.web.mode === "mixx" && etapeOf(x) === "dossier").length;
      $("#sd-cntNew").textContent = nb ? nb : "";
      renderList();
      fillEleveSelect();
      autoPlace();
    }
    // Solde de formation : il doit être à zéro avant toute séance de conduite et avant l'examen
    const doit = (x) => x.solde === null || x.solde === undefined || x.solde > 0;
    const soldeTxt = (x) => x.solde === null || x.solde === undefined ? "aucun paiement enregistré" : x.solde > 0 ? "solde " + F(x.solde) + " à payer" : "formation soldée";
    async function soldeFrais(id) { const r = await DB.q("paiements?select=reste&annule=is.false&reste=not.is.null&eleve_id=eq." + id + "&order=cree_le.desc&limit=1"); return { s: r && r.length ? r[0].reste : null }; }
    const msgSolde = (x, nr) => { const n = nr || (susp(x) ? 2 : 1), ec = solEche(x), pay = CFG.mixx_numero ? "\n\nTu peux payer à l'agence ou par *Mixx by Yas* au " + CFG.mixx_numero + (CFG.mixx_nom ? " (" + CFG.mixx_nom + ")" : "") + ", motif *" + CODE(x) + " SOLDE*, puis nous envoyer la capture du SMS ici." : "\n\nTu peux payer à l'agence aux heures de bureau.";
      if (n === 1) return "Bonjour " + prenom(x) + ",\n\nPetit rappel de *SODAF Auto-École* : il te reste *" + F(x.solde) + "* à régler pour ta formation (N° Client : " + CODE(x) + ")" + (ec ? ", *avant le " + ec.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) + "*" : "") + ".\n\nTant que le solde n'est pas réglé, nous ne pouvons pas réserver tes séances de conduite." + pay + "\n\nTu reçois ensuite ton reçu sur WhatsApp." + SIGN;
      return "Bonjour " + prenom(x) + ",\n\nLe délai pour régler le solde de ta formation chez *SODAF Auto-École* est dépassé (*" + F(x.solde) + "*, N° Client : " + CODE(x) + ").\n\nTa place au cours de code en salle est donc *suspendue* : tu peux continuer à réviser en ligne sur autosodaf.com. Dès ton paiement, tu retrouves ta place en salle et nous réservons tes séances de conduite." + pay + SIGN; };
    const fmtN = milliers;
    const calledToday = (x) => !!x.dernier_appel_le && iso(new Date(x.dernier_appel_le)) === iso(new Date());
    const hm = (t) => { const d = new Date(t); return d.getHours() + " h " + pad(d.getMinutes()); };
    // Recherche globale : N° client (SO12 ou 12), téléphone (avec ou sans +228, espaces), ou nom
    function trouve(x, q) {
      const c = q.replace(/\s+/g, ""), d = q.replace(/\D/g, ""), ph = (x.telephone || "").replace(/\D/g, "").replace(/^228(?=\d{8}$)/, "");
      if (/^so\d+$/.test(c)) return "so" + x.id === c;
      if (/^\d+$/.test(c) && c.length <= 4 && String(x.id) === c) return true;
      if (d.length >= 4 && ph.includes(d.length >= 7 ? d.replace(/^228/, "") : d)) return true;
      return /[a-zà-ÿ]/i.test(q) && (x.nom || "").toLowerCase().includes(q);
    }
    function groupsFor(stage, list) {
      if (stage === "accueil") return [["À accueillir", list.slice().sort((a, b) => (a.cree_le < b.cree_le ? -1 : 1))]];
      if (stage === "appels") { const o = (a) => a.filter((x) => !calledToday(x)).concat(a.filter(calledToday)); return [["À appeler · 1er appel", o(list.filter((x) => !x.rappel)), "first"], ["Rappeler le matin", o(list.filter((x) => x.rappel === "matin")), "matin"], ["Rappeler l'après-midi", o(list.filter((x) => x.rappel === "apres-midi")), "am"]]; }
      if (stage === "dossier") return [["Paiement Mixx à vérifier", list.filter((x) => x.web && x.web.mode === "mixx"), "verif"], ["Viendra payer à l'agence", list.filter((x) => agence(x) && dosAge(x) < 5), "agence"], ["À relancer · 5 jours sans nouvelles", list.filter((x) => (!x.web || agence(x)) && dosAge(x) >= 5), "late"], ["En attente", list.filter((x) => !x.web && dosAge(x) < 5), "wait"]];
      if (stage === "formation") { // Rappel (rouge) → Liste d'attente → Groupe A, B, C… → Conduite seulement → Suspendus
        const sus = list.filter(susp), rest = list.filter((x) => solEtat(x) !== "rappel" && !susp(x)), plein = gPlein();
        const out = [["Rappel de paiement à envoyer", list.filter((x) => solEtat(x) === "rappel"), "fdue", { sub: "aujourd'hui, 1 semaine avant la date limite" }], ["Liste d'attente · code", rest.filter((x) => !sansCode(x) && !x.groupe_code), "fwait", { sub: plein ? "groupes complets : ouvre un groupe" : "placés tout seuls à la première place libre" }]];
        GROUPES.slice().sort((a, b) => a.ordre - b.ordre).forEach((g) => { const m = rest.filter((x) => !sansCode(x) && x.groupe_code === g.id && cycleOk(x)), o = occ(g.id); out.push([g.nom, m, "fgrp", { keep: true, ferme: !g.actif, gid: g.id, sub: gJours(g) + " · " + gHeure(g) + (g.actif ? "" : " · fermé"), cnt: o + "/" + g.places, libre: Math.max(0, g.places - o), fk: "g" + g.id, cls: "gc-" + g.id + (g.actif ? "" : " gc-off"), icls: "ig-" + g.id }]); });
        out.push(["Conduite seulement", rest.filter((x) => sansCode(x) || (x.groupe_code && (!cycleOk(x) || !gOf(x.groupe_code)))), "fcond", { sub: "code terminé ou formation sans code", fk: "fcond" }]);
        out.push(["Place au code suspendue", sus, "fsus", { sub: "solde impayé après 2 semaines · révisent en ligne", fk: "fsus" }]);
        return out;
      }
      if (stage === "examen") return [["Dossier complet à apporter", list.filter((x) => x.examen_etape === "pret"), "xpret"], ["Dossier reçu · à déposer", list.filter((x) => x.examen_etape === "complet"), "xcomplet"], ["Déposé · résultat à noter", list.filter((x) => ["depose", "convoque"].includes(x.examen_etape)), "xdepose"]];
      const ko = (x) => x.statut === "Abandon" && x.examen_resultat === "echoue";
      return [["Permis obtenu", list.filter((x) => x.statut === "Permis obtenu"), "xok"], ["Permis échoué", list.filter(ko), "xko"]].concat([["Formation terminée", "afin"], ["Plus tard", "aplus"], ["Injoignable", "ainj"], ["Rétractation", "aretr"], ["Faux numéro", "afaux"]].map((m) => [m[0], list.filter((x) => x.archive_motif === m[0] && !ko(x)), m[1]])).concat([["Sans motif", list.filter((x) => !x.archive_motif && x.statut !== "Permis obtenu" && !ko(x)), "asans"]]);
    }
    function renderList(keepDetail) {
      { const ab = $("#sd-elAddBtn"); if (ab) { ab.hidden = pcStage !== "accueil"; if (ab.hidden && $("#sd-elAdd")) $("#sd-elAdd").hidden = true; } }
      const q = $("#sd-pcQ").value.trim().toLowerCase();
      $$("#sd-pcStages button").forEach((b) => { const n = eleves.filter((x) => etapeOf(x) === b.dataset.st).length; b.querySelector("em").textContent = n; b.setAttribute("aria-selected", b.dataset.st === pcStage); });
      const sg = () => pcStage;
      const list = eleves.filter((x) => etapeOf(x) === pcStage && (!q || trouve(x, q)));
      const fold = foldState(), TAG = { first: "1er appel", matin: "Matin", am: "Après-midi", late: "À relancer", wait: "En attente", verif: "Mixx à vérifier", agence: "Vient à l'agence", xpret: "À apporter", xcomplet: "À déposer", xdepose: "Déposé", xconvoque: "Convoqué", xok: "Permis ✓", xko: "Échoué", fdue: "Rappel", fsus: "Suspendu", fwait: "En attente" };
      const fmFold = S.get("fmFold", {}) || {}; // En formation : groupes repliables (mémorisé sur ce téléphone)
      const canFold = (g) => ["matin", "am", "xdepose"].includes(g[2]) || pcStage === "archives" || !!(g[3] && g[3].fk);
      const ftag = (x, k) => { if (pcStage !== "formation") return TAG[k] ? [k, TAG[k]] : null; if (k === "fdue" || k === "fsus" || k === "fwait") return [k, TAG[k]]; if (x.groupe_code && cycleOk(x) && !sansCode(x) && !x.groupe_msg_le) return ["fhor", "Horaires à envoyer"]; if (!doit(x)) { const e = seEtat(x); if (e === "pret") return ["fpret", "Prêt pour l'examen"]; if (e === "eval") return ["feval", "À évaluer"]; if (e === "fin") return ["ffin", "Séances finies"]; } return null; };
      const ghT = (g) => '<b class="gh-t">' + esc(g[0]) + (g[3] && g[3].sub ? "<small>" + esc(g[3].sub) + "</small>" : "") + "</b><span>" + (g[3] && g[3].cnt ? g[3].cnt : g[1].length) + "</span>";
      const isOpen = (g) => !canFold(g) || !!q || (g[3] && g[3].fk ? !fmFold[g[3].fk] : fold[g[2]]);
      const ST_LAB = { accueil: "Accueil", appels: "Appels", dossier: "Paiement en attente", formation: "En formation", examen: "Dépôt d'examen", archives: "Archivés" };
      $("#sd-pcQ").placeholder = "Rechercher dans « " + ST_LAB[pcStage] + " » : N° client (SO12), téléphone ou nom";
      const grps = groupsFor(pcStage, list);
      const lot = !q && pcStage === "examen" ? list.filter((x) => x.examen_etape === "complet") : [];
      const nonImp = lot.filter((x) => !x.examen_bordereau_le).length, toutImp = lot.length && !nonImp;
      const html = (lot.length ? '<div class="ex-lot"><div><b>' + lot.length + (lot.length > 1 ? " dossiers prêts" : " dossier prêt") + ' à déposer</b><span>' + fmtN(lot.length * 30000) + ' F de dépôts' + (toutImp ? " · ✓ bordereau imprimé" : "") + '</span></div><div class="ex-lot-acts"><button class="btn btn-line btn-sm" type="button" data-lot="print">' + (toutImp ? "Réimprimer le bordereau" : "1. Imprimer le bordereau") + '</button><button class="btn btn-green btn-sm" type="button" data-lot="done"' + (toutImp ? "" : " disabled") + ">" + (toutImp ? "Lot déposé" : "2. Lot déposé") + "</button></div>" + (toutImp ? "" : '<p class="ex-lot-why">' + (nonImp === lot.length ? "Imprime d\'abord le bordereau : « Lot déposé » se débloque après l\'impression." : nonImp + (nonImp > 1 ? " nouveaux dossiers ne sont pas" : " nouveau dossier n\'est pas") + " sur le bordereau imprimé : réimprime-le.") + "</p>") + "</div>" : "") + (q && list.length ? '<p class="pc-hint">' + list.length + " résultat" + (list.length > 1 ? "s" : "") + " dans « " + ST_LAB[pcStage] + " »</p>" : "") + grps.filter((g) => g[1].length || (!q && g[3] && g[3].keep)).map((g) => (g[2] && canFold(g)
        ? (g[3] && g[3].fk ? '<button type="button" class="pc-gh pc-fold g-' + g[2] + (g[3].cls ? " " + g[3].cls : "") + '" data-ffold="' + g[3].fk + '" aria-expanded="' + isOpen(g) + '"><i aria-hidden="true">▸</i>' + ghT(g) + "</button>" : '<button type="button" class="pc-gh pc-fold g-' + g[2] + '" data-fold="' + g[2] + '" aria-expanded="' + isOpen(g) + '"><i aria-hidden="true">▸</i>' + esc(g[0]) + " <span>" + g[1].length + "</span></button>")
        : '<p class="pc-gh' + (g[2] ? " g-" + g[2] : "") + '">' + ghT(g) + "</p>") + (!g[1].length && g[3] && g[3].keep && isOpen(g) ? '<p class="pc-gempty">' + (g[3].ferme ? 'Groupe fermé : pas de cours pour l\'instant. <button class="btn btn-line btn-sm" type="button" data-gtog="' + g[3].gid + '" data-on="1">Ouvrir ce groupe</button>' : "Aucun élève pour l'instant · " + g[3].libre + (g[3].libre > 1 ? " places libres" : " place libre")) + "</p>" : "") + (isOpen(g) ? g[1].map((x) =>
        '<button type="button" class="pc-item' + (g[2] ? " i-" + g[2] : "") + (g[3] && g[3].icls ? " " + g[3].icls : "") + (sg(x) === "appels" && calledToday(x) ? " i-done" : "") + (x.id === pcSel ? " on" : "") + '" data-id="' + x.id + '"><b>' + esc(x.nom) + ((t) => t ? ' <em class="pc-tag t-' + t[0] + '">' + t[1] + "</em>" : "")(ftag(x, g[2])) + '</b><span>' + esc((x.telephone || "").replace("+228", "+228 ")) + (x.formation ? " · " + esc(x.formation) : "") + "</span><small>" + CODE(x) + " · " +
        (sg(x) === "accueil" ? (x.accueil_le ? "accueil envoyé ✓" : "arrivé " + ago(x.cree_le)) : sg(x) === "appels" ? (x.appels ? x.appels + "X sans réponse" : "pas encore appelé") + (calledToday(x) ? " · appelé à " + hm(x.dernier_appel_le) : "") : sg(x) === "dossier" ? (x.web ? (x.web.mode === "mixx" ? "a payé " + F(x.web.a_payer) + " par Mixx " : "paiera " + F(x.web.a_payer) + " à l'agence · ") + ago(x.web.le) : "message envoyé " + ago(x.dossier_envoye_le)) + (x.dossier_relances ? " · relance " + x.dossier_relances + "/4 " + ago(x.dossier_relance_le) : "") : sg(x) === "examen" ? exLine(x) : sg(x) === "archives" ? (x.examen_resultat === "echoue" && x.statut === "Abandon" ? "examen à repasser · " + (x.examen_passages || 1) + (x.examen_passages > 1 ? " échecs" : " échec") : x.statut === "Permis obtenu" ? "permis obtenu" + (x.examen_date ? " le " + dFr(x.examen_date) : "") : "archivé " + (x.archive_le ? ago(x.archive_le) : "")) : sg(x) === "formation" ? (doit(x) ? soldeTxt(x) + (solEche(x) && !susp(x) ? " avant le " + dFr(solEche(x).toISOString()) : "") : x.quota !== null ? x.faits + "/" + x.quota + " séances" + (x.resa ? " (+" + x.resa + " réservée" + (x.resa > 1 ? "s" : "") + ")" : "") : soldeTxt(x)) + (sansCode(x) ? " · sans code" : x.groupe_code ? (cycleOk(x) ? ' · <i class="gb gb-' + x.groupe_code + '">groupe ' + x.groupe_code + "</i>" : " · code terminé") : " · attente code") : esc(x.statut)) + "</small></button>").join("") : "")).join("");
      const ailleurs = q && !list.length ? Object.keys(ST_LAB).map((k) => [k, eleves.filter((x) => etapeOf(x) === k && trouve(x, q)).length]).filter((t) => t[1]) : [];
      $("#sd-pcList").innerHTML = (q && !list.length) ? '<p class="tm-empty">Aucun client trouvé dans « ' + ST_LAB[pcStage] + " » pour « " + esc(q) + " »." + (ailleurs.length ? '<span class="pc-else">Trouvé ailleurs : ' + ailleurs.map((t) => '<button class="linkbtn" type="button" data-goto="' + t[0] + '">' + ST_LAB[t[0]] + " (" + t[1] + ")</button>").join(" ") + "</span>" : " Vérifie le N° client (SO12) ou le numéro de téléphone.") + "</p>" : html || '<p class="tm-empty">' + ({ accueil: "Aucune nouvelle pré-inscription. Elles arrivent ici toutes seules depuis le site.", appels: "Personne à appeler pour l'instant.", dossier: "Aucun dossier en attente. Après un appel, « Envoyer le lien d'inscription » les range ici.", formation: "Aucun élève en formation pour l'instant.", examen: "Aucun élève à l'étape examen. Quand un élève termine sa formation, touche « Formation terminée : passer à l'examen » sur sa fiche.", archives: "Aucun dossier archivé." }[pcStage]) + "</p>";
      if (!q && pcStage === "formation") { // grand en-tête « Formation en cours »
        const act = GROUPES.filter((g) => g.actif), att = attente().filter((x) => !susp(x)).length, libres = act.reduce((t, g) => t + Math.max(0, g.places - occ(g.id)), 0);
        const head = '<div class="fm-head"><div class="fm-top"><div><h4>Formation en cours</h4><small>' + list.length + (list.length > 1 ? " élèves" : " élève") + (act.length ? " · " + act.length + (act.length > 1 ? " groupes de code ouverts · " : " groupe de code ouvert · ") + libres + (libres > 1 ? " places libres" : " place libre") : "") + "</small></div>" + (GROUPES.length ? '<button class="linkbtn" type="button" data-gman>' + (gMan ? "Fermer" : "Gérer les groupes") + "</button>" : "") + "</div>" +
          (att && gPlein() ? '<p class="gc-tip">' + att + (att > 1 ? " élèves attendent" : " élève attend") + " : tous les groupes ouverts sont complets." + (GROUPES.some((g) => !g.actif) ? " Ouvre un groupe dans « Gérer les groupes »." : "") + "</p>" : "") +
          (gMan ? '<div class="gc-man">' + GROUPES.map((g) => { const o = occ(g.id); return '<div class="gc-row"><div><b><i class="gdot gb-' + g.id + '"></i>' + esc(g.nom) + "</b><small>" + gJours(g) + " · " + g.heure + " · " + o + "/" + g.places + " élèves</small></div>" + (g.actif ? (o ? '<span class="tm-note" style="margin:0!important">Ouvert (' + o + " inscrit" + (o > 1 ? "s" : "") + ")</span>" : '<button class="btn btn-line btn-sm" type="button" data-gtog="' + g.id + '" data-on="0">Fermer</button>') : '<button class="btn btn-green btn-sm" type="button" data-gtog="' + g.id + '" data-on="1">Ouvrir ce groupe</button>') + "</div>"; }).join("") + '<p class="tm-note" style="margin:6px 0 0!important">Ouvrir un groupe crée ses séances de code jusqu\'à la fin du planning. Un groupe qui a des élèves ne peut pas être fermé.</p></div>' : "") + "</div>";
        $("#sd-pcList").insertAdjacentHTML("afterbegin", head);
      }
      lastEtats = etats();
      if (pcSel && !list.some((x) => x.id === pcSel)) pcSel = null;
      if (!pcSel && isWide()) { const first = $("#sd-pcList .pc-item:not(.i-done)") || $("#sd-pcList .pc-item"); if (first) { pcSel = +first.dataset.id; first.classList.add("on"); } }
      if (!keepDetail || keepDetail !== pcSel) renderDetail();
    }
    $("#sd-pcQ").addEventListener("input", renderList);
    // Groupes « Rappeler le matin / l'après-midi » repliables. Par défaut : le matin on voit le matin, l'après-midi on voit l'après-midi.
    function foldState() {
      const h = new Date().getHours(), key = iso(new Date()) + (h < 12 ? "m" : "a"), f = S.get("pcFold", null);
      return f && f.key === key ? f : { key, matin: h < 12, am: h >= 12 };
    }
    // Dépôt en lot : un seul bordereau, une seule signature, un seul clic
    $("#sd-pcList").addEventListener("click", async (e) => {
      if (e.target.closest("[data-gman]")) { gMan = !gMan; renderList(true); return; }
      const gt = e.target.closest("[data-gtog]");
      if (gt) { confirmBtn(gt, async () => { const on = gt.dataset.on === "1"; const r = await run(() => DB.q("rpc/groupe_ouvrir", { method: "POST", body: { p_id: gt.dataset.gtog, p_actif: on } }), on ? "Groupe ouvert : ses séances de code sont créées" : "Groupe fermé"); await loadEleves(true); }); return; }
      const lb = e.target.closest("[data-lot]"); if (!lb) return;
      const lot = eleves.filter((x) => etapeOf(x) === "examen" && x.examen_etape === "complet").sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
      if (!lot.length) return;
      const today = iso(new Date()), dTxt = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      if (lb.dataset.lot === "print") {
        const w = window.open("", "_blank"); if (!w) { toast("Autorise les fenêtres pour imprimer"); return; }
        const rows = lot.map((x, i) => "<tr><td>" + (i + 1) + "</td><td><b>" + esc(x.nom) + "</b></td><td>" + CODE(x) + "</td><td>" + esc(x.formation || "") + '</td><td class="r">30 000 F</td></tr>').join("");
        w.document.write('<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Bordereau de dépôt ' + today + ' · SODAF</title><style>@page{size:A4;margin:16mm}body{font:14px/1.45 "Segoe UI",Arial,sans-serif;color:#14171C;margin:0 auto;max-width:186mm;padding:8mm 6mm}@media print{body{padding:0;max-width:none}}.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #14171C;padding-bottom:12px}.top svg{height:34px;width:auto}.top small{display:block;font-size:11px;letter-spacing:.12em;color:#0B6E4F;font-weight:700;margin-top:4px}h1{font-size:20px;margin:18px 0 4px}.meta{display:flex;gap:28px;margin:10px 0 16px;font-size:14px}.meta b{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#5D6570}table{width:100%;border-collapse:collapse}th{text-align:left;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#5D6570;border-bottom:2px solid #14171C;padding:8px 6px}td{padding:9px 6px;border-bottom:1px solid #DDE1E5}.r{text-align:right;white-space:nowrap}tfoot td{border-top:2px solid #14171C;border-bottom:0;font-weight:800;font-size:15px}.sign{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:40px}.sign div{border:1.5px solid #14171C;border-radius:8px;padding:12px 14px;min-height:120px}.sign b{display:block;font-size:12px;letter-spacing:.06em;text-transform:uppercase}.sign span{display:block;color:#5D6570;font-size:12px;margin-top:2px}.ln{margin:16px 0 0;border-bottom:1px solid #9AA3AB;padding-bottom:4px;font-size:13px;min-height:20px}.foot{margin-top:28px;font-size:11px;color:#5D6570;text-align:center}.np{background:#FFF5D6;padding:10px 14px;margin:0 0 14px;border-radius:8px}@media print{.np{display:none}}</style></head><body>' +
          '<p class="np">Vérifie la liste, puis <button onclick="print()">Imprimer</button>. Fais signer le partenaire en bas et garde la feuille.</p>' +
          '<div class="top"><div>' + LOGO("#14171C", "word") + '<small>AUTO-ÉCOLE · LOMÉ, TOGO</small></div><div style="text-align:right"><b>Bordereau de dépôt</b><br>N° ' + today + "</div></div>" +
          '<h1>Dépôt des dossiers d\'examen</h1><div class="meta"><div><b>Remis à</b>Partenaire SODAF</div><div><b>Date</b>' + dTxt + "</div><div><b>Dossiers</b>" + lot.length + "</div></div>" +
          '<table><thead><tr><th>#</th><th>Élève</th><th>N° client</th><th>Formation</th><th class="r">Dépôt</th></tr></thead><tbody>' + rows + "</tbody><tfoot><tr><td></td><td>" + lot.length + (lot.length > 1 ? " dossiers" : " dossier") + '</td><td></td><td></td><td class="r">' + fmtN(lot.length * 30000) + " F</td></tr></tfoot></table>" +
          '<p style="margin-top:14px;font-size:13px">Chaque dossier contient : photocopie de la carte d\'identité, acte de naissance, 2 photos d\'identité et le dépôt de 30 000 F.</p>' +
          '<div class="sign"><div><b>Remis par · SODAF Auto-École</b><p class="ln">Nom et prénom : ' + esc((me && me.nom) || "") + '</p><p class="ln">Signature :</p></div><div><b>Reçu par · Partenaire SODAF</b><p class="ln">Nom et prénom : ' + esc(CFG.partenaire_nom || "") + '</p><p class="ln">Signature :</p></div></div>' +
          '<p class="foot">SODAF Auto-École · 412 Avenue Akei, Tokoin Tamé, Lomé · +228 72 54 41 66 · autosodaf.com</p></body></html>');
        w.document.close();
        let marked = false;
        w.addEventListener("afterprint", async () => {
          if (marked) return; marked = true;
          const now = new Date().toISOString();
          const ok = await run(() => DB.q("eleves?id=in.(" + lot.map((x) => x.id).join(",") + ")", { method: "PATCH", body: { examen_bordereau_le: now }, prefer: "return=minimal" }), "Bordereau imprimé : tu peux valider le dépôt après signature");
          if (ok) { lot.forEach((x) => (x.examen_bordereau_le = now)); renderList(); }
        });
        return;
      }
      if (lot.some((x) => !x.examen_bordereau_le)) { toast("Imprime d'abord le bordereau"); return; }
      confirmBtn(lb, async () => {
        const ids = lot.map((x) => x.id).join(",");
        const ok = await run(() => DB.q("eleves?id=in.(" + ids + ")", { method: "PATCH", body: { examen_etape: "depose", examen_depose_le: today }, prefer: "return=minimal" }), "Lot déposé : " + lot.length + (lot.length > 1 ? " dossiers" : " dossier"));
        if (!ok) return;
        lot.forEach((x) => Object.assign(x, { examen_etape: "depose", examen_depose_le: today }));
        await run(() => DB.q("suivi", { method: "POST", body: lot.map((x) => ({ eleve_id: x.id, type: "Étape", note: "Examen : Dossier déposé (lot du " + today + ")" })), prefer: "return=minimal" }));
        renderList();
      });
    });
    $("#sd-pcList").addEventListener("click", (e) => { const b = e.target.closest("[data-ffold]"); if (!b) return; const f = S.get("fmFold", {}) || {}; f[b.dataset.ffold] = !f[b.dataset.ffold]; S.set("fmFold", f); renderList(pcSel); });
    $("#sd-pcList").addEventListener("click", (e) => { const b = e.target.closest("[data-fold]"); if (!b) return; const f = foldState(); f[b.dataset.fold] = !f[b.dataset.fold]; S.set("pcFold", f); renderList(); });
    $("#sd-pcList").addEventListener("click", (e) => { const g = e.target.closest("[data-goto]"); if (!g) return; pcStage = g.dataset.goto; pcSel = null; S.set("pcStage", pcStage); renderList(); });
    $("#sd-pcStages").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; pcStage = b.dataset.st; pcSel = null; $("#sd-pcQ").value = ""; S.set("pcStage", pcStage); renderList(); });
    $("#sd-pcList").addEventListener("click", (e) => { const b = e.target.closest(".pc-item"); if (!b) return; pcSel = +b.dataset.id; $$("#sd-pcList .pc-item").forEach((i) => i.classList.toggle("on", i === b)); renderDetail(); if (!isWide()) $("#sd-pc").scrollIntoView({ block: "start" }); });

    async function patchEl(x, body, okMsg, log) {
      const ok = await run(() => DB.q("eleves?id=eq." + x.id, { method: "PATCH", body, prefer: "return=minimal" }), okMsg);
      if (!ok) return false;
      Object.assign(x, body);
      if (log) await addSuivi(x, log[0], log[1]);
      $("#sd-cntNew").textContent = (eleves.filter((y) => y.statut === "Nouveau").length + eleves.filter((y) => y.web && y.web.mode === "mixx" && etapeOf(y) === "dossier").length) || "";
      return true;
    }
    async function addSuivi(x, type, note) { await run(() => DB.q("suivi", { method: "POST", body: { eleve_id: x.id, type, note: note || null }, prefer: "return=minimal" })); }
    function nextAfter(x) { // après une bascule : on passe au dossier suivant de la même étape
      const list = eleves.filter((y) => etapeOf(y) === pcStage && y.id !== x.id); pcSel = isWide() && list.length ? null : null; renderList();
    }
    function confirmBtn(btn, fn) { // deux touches pour les actions de rangement
      if (btn.dataset.armed) { delete btn.dataset.armed; fn(); return; }
      const t = btn.textContent; btn.dataset.armed = 1; btn.textContent = "Confirmer ?"; btn.classList.add("armed");
      setTimeout(() => { if (btn.dataset.armed) { delete btn.dataset.armed; btn.textContent = t; btn.classList.remove("armed"); } }, 4000);
    }
    const archive = (x, motif) => patchEl(x, { statut: "Abandon", archive_motif: motif, archive_le: new Date().toISOString(), rappel: null }, "Dossier archivé : " + motif, ["Étape", "Archivé : " + motif]).then((ok) => ok && nextAfter(x));

    // Fiche : cours du programme suivis (présences cochées par le moniteur) et cours à rattraper
    async function fillCours(x) {
      const el = $("#sd-pcCours"); if (!el) return;
      let pr = null, ss = [];
      try { [pr, ss] = await Promise.all([DB.q("presences?select=seances_code(theme)&eleve_id=eq." + x.id), x.groupe_code && x.groupe_depuis ? DB.q("seances_code?select=theme&groupe=eq." + x.groupe_code + "&statut=eq.Fait&jour=gte." + x.groupe_depuis.slice(0, 10) + "&jour=lte." + iso(new Date())) : Promise.resolve([])]); } catch (e) { return; }
      if (!pr || $("#sd-pcCours") !== el) return;
      const vus = new Set(pr.map((p) => p.seances_code && p.seances_code.theme).filter((t) => bIdx(t) >= 0)), manq = [...new Set((ss || []).map((z) => z.theme).filter((t) => bIdx(t) >= 0 && !vus.has(t)))];
      el.innerHTML = "<b>Cours suivis : " + vus.size + " sur 12</b>" + (manq.length ? " · à rattraper (mercredi 14 h 30 ou sur le site) : " + manq.map(esc).join(", ") : vus.size ? "" : " · le moniteur coche les présents à chaque cours");
    }
    async function renderDetail() {
      const box = $("#sd-pcDetail"), pc = $("#sd-pc");
      const x = eleves.find((y) => y.id === pcSel);
      pc.classList.toggle("has-sel", !!x);
      if (!x) { box.innerHTML = '<div class="pc-none"><b>Choisis un dossier dans la liste</b><span>Sa fiche, les messages prêts et les actions s\'affichent ici.</span></div>'; return; }
      const st = etapeOf(x), n = waNum(x.telephone), wa = (t) => "https://wa.me/228" + n + "?text=" + encodeURIComponent(t);
      const head = '<button type="button" class="linkbtn pc-back" data-a="back">← Retour à la liste</button><div class="pc-head"><div><p class="eyebrow">' + { accueil: "Accueil", appels: "Appels", dossier: "Paiement en attente", formation: "En formation", examen: "Dépôt d'examen", archives: x.statut === "Permis obtenu" ? "Permis obtenu" : "Archivé" }[st] + '</p><h3>' + esc(x.nom) + ' <span>| ' + CODE(x) + "</span></h3></div>" +
        ({ accueil: "", appels: n ? '<a class="btn btn-green btn-sm" target="_blank" rel="noopener" data-a="sendDossier" href="' + wa(msgDossier(x)) + '">Envoyer le lien d\'inscription ↗</a>' : "", dossier: '<button class="btn btn-green btn-sm" type="button" data-a="enroll">' + (x.web && x.web.mode === "mixx" ? "Mixx vérifié ? Faire le reçu" : "Formation payée ? Faire le reçu") + "</button>", formation: "", examen: x.examen_etape === "pret" && n ? (x.examen_lien_le ? '<a class="btn btn-line btn-sm" target="_blank" rel="noopener" data-a="sendExam" href="' + wa(msgExamen(x)) + '">Renvoyer le message ↗</a>' : '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" data-a="sendExam" href="' + wa(msgExamen(x)) + '">Envoyer le message sur WhatsApp ↗</a>') : "", archives: x.statut === "Permis obtenu" ? "" : x.examen_resultat === "echoue" ? '<button class="btn btn-blue btn-sm" type="button" data-a="reExam">Ressortir : nouveau dépôt d\'examen</button>' : '<button class="btn btn-blue btn-sm" type="button" data-a="revive">Ressortir : remettre en appel</button>' }[st]) + "</div>";
      const info = '<div class="pc-info"><div><span>N° client</span><b>' + CODE(x) + '</b></div><div><span>Téléphone</span><b>' + (n ? '<a href="tel:+228' + n + '">+228 ' + n.replace(/(\d{2})(?=\d)/g, "$1 ") + "</a>" : "—") + '</b></div><div><span>Formation</span><b>' + esc(x.formation || "—") + '</b></div><div><span>Quartier</span><b>' + esc(x.quartier || "—") + "</b></div>" +
        (["accueil", "appels", "dossier"].includes(st) ? (x.creneau_prefere ? '<div><span>Préfère</span><b>' + esc(x.creneau_prefere) + "</b></div>" : "") + (x.paiement_prefere ? '<div><span>Paiement souhaité</span><b>' + esc(x.paiement_prefere) + "</b></div>" : "") : "") + '<div><span>Arrivé</span><b>' + new Date(x.cree_le).toLocaleDateString("fr-FR") + " · " + esc(srcOf(x)) + "</b></div>" +
        (st === "archives" ? '<div><span>Statut</span><b>' + esc(x.statut === "Abandon" ? "Archivé" + (x.archive_motif ? " · " + x.archive_motif : x.examen_resultat === "echoue" ? " · Permis échoué" : "") : x.statut) + "</b></div>" : "") +
        (x.message ? '<div class="wide"><span>Son message</span><b>« ' + esc(x.message) + " »</b></div>" : "") + (x.notes ? '<div class="wide"><span>Note interne</span><b>' + esc(x.notes) + "</b></div>" : "") +
        (st === "formation" ? '<div><span>Payé</span><b id="sd-pcPaid">…</b></div><div><span>Reste à payer</span><b id="sd-pcRest">…</b></div><div class="wide pc-paylist" id="sd-pcPay"></div>' : "") + "</div>";
      let body = "";
      if (st === "accueil") {
        const CHAT = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.4A8.5 8.5 0 1 1 21 11.5z"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/></svg>';
        const hrs = Math.max(0, Math.round((Date.now() - new Date(x.cree_le)) / 36e5)) || 0;
        body = '<div class="wl-card"><div class="wl-top"><span class="wl-ico">' + CHAT + '</span><div><p class="wl-k">Étape 1 sur 6 · Accueil</p><h4>Souhaite la bienvenue à ' + esc(prenom(x)) + '</h4><p class="wl-sub">Pré-inscription ' + (hrs < 1 ? "il y a moins d'une heure" : hrs < 24 ? "il y a " + hrs + " h" : "il y a " + Math.round(hrs / 24) + " j") + (hrs >= 24 ? " : réponds vite, il attend notre message." : ". Le message part sur son WhatsApp, puis le dossier passe tout seul en zone d'appel.") + '</p></div></div>' +
          '<div class="wl-chips"><span>N° client <b>' + CODE(x) + '</b></span><span>Formation <b>' + esc(x.formation || "à préciser") + '</b></span><span>Annonce <b>appel très bientôt</b></span></div>' +
          '<div class="wl-act">' + (n ? '<a class="btn btn-wa wl-btn" target="_blank" rel="noopener" data-a="sendWelcome" href="' + wa(msgAccueil(x)) + '">' + CHAT.replace('width="30" height="30"', 'width="20" height="20"') + 'Envoyer l\'accueil sur WhatsApp</a>' : '<span class="tm-err">Pas de numéro WhatsApp : ajoute-le avec « Modifier la fiche », ou appelle-le directement.</span><button class="linkbtn" type="button" data-a="toCall">Passer en zone d\'appel</button>') + '</div>' +
          '<details class="wl-more"><summary>Voir ou modifier le message</summary><textarea id="sd-pcMsg" rows="12">' + esc(msgAccueil(x)) + '</textarea></details></div>';
      } else if (st === "appels") {
        const t = x.appels || 0;
        const IC = (d) => '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
        const PH = '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>';
        const ICS = {
          call: IC(PH),
          ko: IC(PH + '<path d="m16 2 6 6"/><path d="m22 2-6 6"/>'),
          matin: IC('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>'),
          am: IC('<path d="M12 10V2M4.93 10.93l1.41 1.41M2 18h2M20 18h2M19.07 10.93l-1.41 1.41M22 22H2M16 6l-4 4-4-4M16 18a4 4 0 0 0-8 0"/>')
        };
        const kb = (k, ic, label) => n ? '<a target="_blank" rel="noopener" data-ko="' + k + '" aria-pressed="' + (t > 0 && x.rappel === k) + '" href="' + wa(msgAppelRel(x, t + 1, k)) + '">' + ic + "<span>" + label + "<small>relance " + (t + 1) + "/4 sur WhatsApp</small></span></a>" : '<button type="button" data-ko="' + k + '" aria-pressed="' + (t > 0 && x.rappel === k) + '">' + ic + "<span>" + label + "</span></button>";
        const fin = '<a class="btn pc-final" target="_blank" rel="noopener" data-a="relFinal" href="' + (n ? wa(msgAppelRel(x, 4)) : "#") + '">Pas de réponse : dernière relance (4/4) et classer le dossier' + (n ? " ↗" : "") + "</a>";
        const rb = (k, ic, label) => '<button type="button" data-rappel="' + k + '" aria-pressed="' + ((x.rappel || "") === k) + '">' + ic + "<span>" + label + "</span></button>";
        body = '<div class="pc-block"><div class="pc-bh"><b>Script d\'appel</b><span class="tm-note" style="margin:0!important">' + esc(x.formation || "") + '</span></div><div class="pc-script">' + script(x) + "</div></div>" +
                    '<div class="pc-block"><div class="pc-bh"><b>Historique d\'appels</b></div>' +
                    (t < 3 ? '<div class="pc-ko"><p class="pc-lab">Pas de réponse ? Choisis quand rappeler : la relance WhatsApp part avec</p>' +
            '<input class="pc-konote" id="sd-pcCallNote" placeholder="Note sur l\'appel (facultatif)" maxlength="300">' +
            '<div class="pc-steps">' + kb("matin", ICS.matin, "Rappeler le matin") + kb("apres-midi", ICS.am, "Rappeler l'après‑midi") + "</div></div>" : t === 3 ? '<div class="pc-ko"><p class="pc-lab">4e appel sans réponse ?</p>' + fin + "</div>" : "") +
          '<div class="pc-triesrow"><span class="pc-lab">Tentatives sans réponse</span><div class="pc-tries">' + [1, 2, 3, 4].map((i) => '<i class="' + (i <= t ? "on" : "") + '">' + i + "X" + (i === 4 ? " · injoignable" : "") + "</i>").join("") + "</div>" +
          (t < 4 ? "<small>Chaque « pas de réponse » envoie une relance WhatsApp, 4 au maximum. La 4e classe le dossier « Injoignable » : il pourra être ressorti s'il répond.</small>" : "") + "</div>" +
          (t >= 4 ? '<div class="pc-alert"><b>Injoignable : 4 appels sans réponse.</b> Envoie la dernière relance : le dossier est classé tout seul.<div class="tm-formact">' + fin + "</div></div>" : "") + "</div>" +
          '<div class="pc-block pc-range"><div class="pc-bh"><b>Ranger le dossier</b><span class="tm-note" style="margin:0!important">Deux touches pour confirmer</span></div><div class="pc-rgrid"><button class="btn btn-line btn-sm" type="button" data-arch="Plus tard"><b>Plus tard</b><small>Potentiel, à recontacter</small></button><button class="btn btn-sm pc-dark" type="button" data-arch="Rétractation"><b>Rétractation</b><small>Ne veut plus s\'inscrire</small></button><button class="btn btn-sm pc-red" type="button" data-arch="Faux numéro"><b>Faux numéro</b><small>Coordonnées erronées</small></button></div></div>';
      } else if (st === "dossier") {
        const age = jours(x.dossier_envoye_le), late = dosAge(x) >= 5;
        const w = x.web;
        const webBlock = w ? '<div class="pc-block pc-web"><div class="pc-bh"><b>Inscription en ligne</b><span class="pc-ok">reçue ' + ago(w.le) + "</span></div>" +
          (w.mode === "mixx" ? '<div class="pc-alert pc-verif"><b>À vérifier sur le téléphone de l\'agence :</b> un paiement Mixx by Yas de <b>' + F(w.a_payer) + "</b>" + (w.mixx_tel ? " depuis le <b>" + esc(w.mixx_tel.replace("+228", "+228 ")) + "</b>" : "") + (w.mixx_ref ? ", référence <b>" + esc(w.mixx_ref) + "</b>" : "") + ", motif « " + CODE(x) + " ». S'il est bien arrivé : « Mixx vérifié ? Faire le reçu ». Sinon : « Paiement introuvable ».</div>" : '<p class="tm-note" style="margin:0 0 10px!important">Il a choisi de payer <b>' + F(w.a_payer) + "</b> en espèces à l'agence. Quand il vient : « Formation payée ? Faire le reçu ».</p>") +
          '<div class="pc-info"><div><span>Formule</span><b>' + esc(w.formule) + '</b></div><div><span>Prix</span><b>' + F(w.prix) + '</b></div><div><span>Il paie</span><b>' + (w.paiement === "total" ? "Tout" : "La moitié") + " · " + F(w.a_payer) + '</b></div><div><span>Mode</span><b>' + (w.mode === "mixx" ? "Mixx by Yas" : "À l'agence") + '</b></div>' +
          '<div><span>Nom et prénoms</span><b>' + esc(w.prenoms + " " + w.nom) + '</b></div><div><span>Téléphone</span><b>' + esc((w.telephone || "—").replace("+228", "+228 ")) + '</b></div><div><span>Quartier</span><b>' + esc(w.quartier || "—") + "</b></div></div>" +
          (w.mode === "mixx" ? '<div class="tm-formact"><button class="btn btn-sm pc-red" type="button" data-a="webReject">Paiement introuvable</button></div>' : "") + "</div>" : "";
        const kr = Math.min((x.dossier_relances || 0) + 1, 4), relBtn = (cls, label) => n ? '<a class="btn ' + cls + ' btn-sm" target="_blank" rel="noopener" data-a="relDossier" href="' + wa(msgRel(x, kr)) + '">' + label + "</a>" : "";
        const relLabel = kr === 4 ? "Dernière relance (4/4) : envoyer et archiver ↗" : "Envoyer la relance " + kr + "/4 ↗";
        body = w && w.mode === "mixx" ? webBlock : webBlock + '<p class="pc-proto">Protocole : l\'élève a reçu le message de paiement. Sans nouvelles après 5 jours, il passe dans « À relancer ». 4 relances au maximum : la 4e met le dossier en pause (archivé « Plus tard »). Dès qu\'il paie : « Formation payée ? Faire le reçu » (en haut).</p>' +
          '<div class="pc-block"><div class="pc-bh"><b>Paiement en attente</b><span class="pc-ok">message envoyé ' + (age === 0 ? "aujourd'hui" : "il y a " + age + (age > 1 ? " jours" : " jour")) + (x.dossier_relances ? " · relance " + x.dossier_relances + "/4 " + ago(x.dossier_relance_le) : "") + "</span></div>" +
          (late ? '<div class="pc-alert' + (kr === 4 ? "" : " pc-verif") + '" style="margin-top:0"><b>Pas de nouvelles depuis ' + dosAge(x) + " jours.</b> " + (kr === 4 ? "C'est la dernière relance : après l'envoi, le dossier est archivé « Plus tard ». Il pourra être ressorti s'il revient." : "Envoie la relance " + kr + " sur 4 (le message s'adapte).") + '<div class="tm-formact">' + relBtn(kr === 4 ? "pc-red" : "btn-wa", relLabel) + "</div></div>"
            : '<div class="tm-formact">' + relBtn("btn-line", "Relancer maintenant (" + kr + "/4) ↗") + '<span class="tm-note" style="margin:0!important">Relance conseillée après 5 jours sans nouvelles.</span></div>') +
          '<details class="pc-more"><summary>Revoir ou renvoyer le message de paiement</summary><textarea id="sd-pcDosMsg" rows="14">' + esc(msgDossier(x)) + '</textarea><div class="tm-formact">' + (n ? '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" data-a="resendDossier" href="' + wa(msgDossier(x)) + '">Renvoyer le message de paiement ↗</a>' : "") + "</div></details></div>";
      } else if (st === "formation") {
        const due = doit(x);
        const se = solEtat(x), ec = solEche(x);
        body = (due ? '<div class="pc-alert"><b>' + (x.solde ? "Solde à payer : " + F(x.solde) + (ec ? ", avant le " + dFr(ec.toISOString()).replace(/\.$/, "") : "") + "." : "Aucun paiement de formation enregistré.") + "</b> " + (se === "susp" ? "Délai dépassé : sa place au code en salle est suspendue (il révise en ligne). Pas de conduite ni d'examen tant que le solde n'est pas payé." : "Pas de séance de conduite ni de passage à l'examen tant que la formation n'est pas soldée.") + (x.solde ? '<span class="sol-rap">' + (se === "rappel" ? "Rappel à envoyer aujourd'hui (1 semaine avant la date limite)" : se === "attente" ? ((x.solde_rappels || 0) ? "Rappel envoyé" + (x.solde_rappel_le ? " le " + dFr(x.solde_rappel_le) : "") : "Rappel prévu le " + dFr(rapLe(x))) + " · place au code suspendue le " + dFr(ec ? ec.toISOString() : new Date().toISOString()) + " sans paiement" : "Place au code suspendue depuis le " + dFr(ec ? ec.toISOString() : new Date().toISOString())) + "</span>" : "") +
            '<div class="tm-formact"><button class="btn btn-green btn-sm" type="button" data-a="rcSolde">' + (x.solde ? "Solde payé ? Faire le reçu" : "Paiement reçu ? Faire le reçu") + '</button>' + (n && x.solde ? relSolBtn(x, se) : "") + "</div></div>" : "") +
          (sansCode(x) ? "" : '<div class="pc-block"><div class="pc-bh"><b>Cours de code en salle' + (x.groupe_code && gOf(x.groupe_code) ? ' <i class="gb gb-' + x.groupe_code + '">' + esc(gOf(x.groupe_code).nom) + "</i>" : "") + "</b>" + (!x.groupe_code ? '<span class="pc-waittag">Liste d\'attente</span>' : !cycleOk(x) || susp(x) ? "" : x.groupe_msg_le ? '<span class="pc-ok">horaires envoyés ' + ago(x.groupe_msg_le) + "</span>" : '<span class="pc-waittag">Horaires à envoyer</span>') + '</div><div class="gc-pick"><select data-a="groupe" aria-label="Groupe de code">' + (x.groupe_code ? "" : '<option value="" selected disabled>Liste d\'attente</option>') +
            GROUPES.slice().sort((a, b) => a.ordre - b.ordre).map((g) => { const o = occ(g.id), mine = g.id === x.groupe_code, full = !mine && o >= g.places, off = !mine && !g.actif; return '<option value="' + g.id + '"' + (mine ? " selected" : full || off ? " disabled" : "") + ">" + esc(g.nom) + " · " + gJours(g) + " · " + gHeure(g) + " · " + (off ? "fermé" : o + "/" + g.places + (full ? " (complet)" : "")) + "</option>"; }).join("") + "</select>" +
            (x.groupe_code && n && gOf(x.groupe_code) ? '<a class="btn ' + (x.groupe_msg_le ? "btn-line" : "btn-wa") + ' btn-sm" target="_blank" rel="noopener" data-a="sendGroupe" href="' + wa(msgGroupe(x)) + '">' + (x.groupe_msg_le ? "Renvoyer ses horaires ↗" : "Envoyer ses horaires ↗") + "</a>" : "") + "</div>" +
            '<p class="tm-note" style="margin:8px 0 0!important">' + (susp(x) ? "Place suspendue tant que le solde n'est pas payé : il révise en ligne. Il la retrouve dès son paiement (ou la première place libre si son groupe s'est rempli)." : x.groupe_code && !cycleOk(x) ? "Cycle de 6 semaines terminé" + (x.groupe_depuis ? " (commencé le " + dFr(x.groupe_depuis) + ")" : "") + " : sa place est libérée. Il révise en ligne et peut venir au rattrapage du mercredi. Pour un nouveau cycle, choisis à nouveau son groupe." : x.groupe_code ? "Cycle de code : semaine " + Math.min(6, Math.floor((Date.now() - new Date(x.groupe_depuis || Date.now())) / (7 * 864e5)) + 1) + " sur 6. Il vient à ses 2 cours par semaine, et le mercredi en rattrapage s'il en a manqué un." : gLibre() ? "Une place est libre : il est placé automatiquement dans quelques secondes." : "Tous les groupes ouverts sont complets : il révise en ligne et sera placé automatiquement à la première place libre. Pour aller plus vite, ouvre un groupe (« Gérer les groupes », en haut de la liste).") + '</p><p class="pc-cours" id="sd-pcCours"></p></div>') +
          (x.quota !== null ? (() => { const q = x.quota, f = x.faits, et = seEtat(x), ea = evalAt(x), pct = q ? Math.min(100, Math.round((f / q) * 100)) : 100, rest = Math.max(0, q - f - x.resa);
            const al = et === "pret" ? '<div class="se-al se-ok"><b>Le moniteur le juge prêt' + (x.evaluation_le ? " (" + dFr(x.evaluation_le) + ")" : "") + '.</b> Prochaine étape : « Formation terminée : passer à l\'examen » (plus bas).</div>'
              : et === "fin" ? '<div class="se-al se-warn"><b>' + (x.evaluation === "plus" ? "Le moniteur conseille des séances en plus." : "Toutes ses séances prévues sont faites.") + '</b> Prochaine étape : lui proposer des séances en plus (5 000 F l\'heure), ou le passer à l\'examen s\'il est prêt.<div class="tm-formact">' + (n ? '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" data-a="relPlus" href="' + wa(msgPlus(x)) + '">Proposer des séances en plus ↗</a>' : "") + '<button class="btn btn-green btn-sm" type="button" data-a="rcPlus">Séance payée ? Faire le reçu</button>' + (x.evaluation !== "pret" ? '<button class="linkbtn" type="button" data-ev="pret">Il est prêt quand même</button>' : "") + "</div></div>"
              : et === "eval" ? '<div class="se-al se-info"><b>Évaluation à faire : ' + f + " séances sur " + q + ".</b> Après la séance " + ea + ", le moniteur dit s'il est prêt pour l'examen ou s'il lui faut des séances en plus." + '<div class="tm-formact"><button class="btn btn-line btn-sm" type="button" data-ev="pret">Prêt pour l\'examen</button><button class="btn btn-line btn-sm" type="button" data-ev="plus">Séances en plus conseillées</button></div></div>' : "";
            return '<div class="pc-block"><div class="pc-bh"><b>Séances de conduite · ' + esc(x.formule || x.formation || "") + '</b><span class="tm-note" style="margin:0!important">' + q + " prévues" + (x.plus ? " (dont " + x.plus + " en plus)" : "") + '</span></div><div class="se-bar"><i style="width:' + pct + '%"></i></div><p class="se-txt"><b>' + f + " / " + q + "</b> faites · " + x.resa + " réservée" + (x.resa > 1 ? "s" : "") + " · " + rest + " à réserver" + (ea && f < ea && et === "cours" ? " · évaluation à la séance " + ea : "") + "</p>" + al + "</div>"; })() : "") +
          '<div class="pc-block"><div class="pc-bh"><b>Conduite</b></div><div id="sd-pcDrive"><p class="tm-note">Chargement…</p></div></div>' +
          (/Permis|Pack/.test(x.formation || "") ? '<div class="pc-block pc-fin"><div class="pc-bh"><b>Fin de formation</b>' + (x.examen_passages ? '<span class="tm-note" style="margin:0!important">' + (x.examen_passages + 1) + 'e passage</span>' : "") + '</div><p class="tm-note" style="margin:0 0 10px!important">Quand l\'élève a terminé (ou qu\'il lui reste 1 ou 2 séances), passe-le à l\'étape examen, puis envoie-lui le message des papiers et du dépôt de 30 000 F (bouton en haut).</p><div class="tm-formact">' + (due ? '<button class="btn btn-sm" type="button" disabled>Formation terminée : passer à l\'examen →</button><span class="tm-note" style="margin:0!important">D\'abord solder la formation.</span>' : '<button class="btn btn-green btn-sm" type="button" data-a="toExam">Formation terminée : passer à l\'examen →</button>') + '</div></div>' : '<div class="pc-block pc-fin"><div class="pc-bh"><b>Fin de formation</b></div><p class="tm-note" style="margin:0 0 10px!important">Cette formation n\'a pas d\'examen d\'État. Quand elle est terminée, range le dossier dans les archives « Formation terminée ».</p><div class="tm-formact">' + (due ? '<button class="btn btn-sm" type="button" disabled>Formation terminée</button><span class="tm-note" style="margin:0!important">D\'abord solder la formation.</span>' : '<button class="btn btn-green btn-sm" type="button" data-a="finForm">Formation terminée</button>') + '</div></div>');
      } else if (st === "examen") {
        const E = x.examen_etape, today = iso(new Date());
        const STEPS = [["pret", "Dossier à apporter"], ["complet", "Dossier reçu"], ["depose", "Déposé"]], ix = Math.max(0, STEPS.findIndex((t) => t[0] === (E === "convoque" ? "depose" : E)));
        const steps = '<div class="ex-steps">' + STEPS.map((t, i) => '<span class="' + (i < ix ? "done" : i === ix ? "on" : "") + '"><i>' + (i < ix ? "✓" : i + 1) + "</i>" + t[1] + "</span>").join("") + "</div>";
        const recuLe = (x.examen_docs || {}).cni ? (x.examen_docs.cni.le || "") : "";
        let act = "";
        if (E === "pret") act = '<div class="pc-block"><div class="pc-bh"><b>Réception du dossier</b>' + (x.examen_lien_le ? '<span class="pc-ok">✓ Message envoyé ' + ago(x.examen_lien_le) + "</span>" : '<span class="tm-note" style="margin:0!important">Message à envoyer (bouton en haut)</span>') + '</div><p class="tm-note" style="margin:0 0 8px!important">Le dossier n\'est accepté que <b>complet</b>. Vérifie que tout est là :</p>' +
          '<ul class="ex-check"><li>Photocopie de la carte d\'identité</li><li>Acte de naissance</li><li>2 photos d\'identité (format passeport)</li><li>Dépôt pour l\'examen : 30 000 F</li></ul>' +
          '<p class="tm-note" style="margin:0 0 10px!important">S\'il manque quelque chose, l\'élève repart avec son dossier et revient quand tout est prêt.</p>' +
          '<div class="tm-formact"><button class="btn btn-green btn-sm" type="button" data-a="exRecu">Dossier complet reçu : faire le reçu de 30 000 F</button></div></div>';
        if (E === "complet") act = '<div class="pc-block"><div class="pc-bh"><b>Dossier reçu</b>' + (recuLe ? '<span class="pc-ok">✓ le ' + dFr(recuLe) + "</span>" : "") + '</div><p class="tm-note" style="margin:0!important">Le reçu envoyé à l\'élève lui explique la suite (dépôt, message officiel, examen à SOTOPLA). Le dépôt se fait en lot : barre noire en haut de la liste, « Imprimer le bordereau » puis « Lot déposé ».</p></div>';
        if (E === "depose" || E === "convoque") act = '<div class="pc-block ex-big"><div class="pc-bh"><b>Dossier déposé</b></div><p class="ex-when">' + dLong(x.examen_depose_le) + '</p><p class="tm-note" style="margin:0!important">L\'État envoie la date de l\'examen directement à l\'élève (examen à SOTOPLA). Il ne reste qu\'à noter le résultat.</p></div>' +
          '<div class="pc-block"><div class="pc-bh"><b>Résultat de l\'examen</b></div><div class="tm-formact"><button class="btn btn-green btn-sm" type="button" data-a="exPass">Permis obtenu</button><button class="btn btn-line btn-sm" type="button" data-a="exFail">À repasser</button></div><p class="tm-note" style="margin:8px 0 0!important">« À repasser » range le dossier dans les archives « Permis échoué ». Le jour où l\'élève veut repasser, « Ressortir » relance directement un nouveau dépôt d\'examen.</p></div>';
        body = act + '<div class="pc-edit" style="text-align:left"><button class="linkbtn" type="button" data-a="exBack">Revenir en formation</button></div>';
      } else if (x.statut === "Abandon" && x.examen_resultat === "echoue") {
        body = '<div class="pc-block"><div class="pc-bh"><b>Permis échoué</b><span class="tm-note" style="margin:0!important">' + (x.examen_passages || 1) + (x.examen_passages > 1 ? " passages" : " passage") + "</span></div><p class=\"tm-note\" style=\"margin:0!important\">Le jour où il veut repasser : « Ressortir : nouveau dépôt d'examen » (en haut). Il reçoit alors le message pour rapporter un dossier complet.</p>" + (n ? '<div class="tm-formact" style="margin-top:10px"><a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="https://wa.me/228' + n + '">Écrire sur WhatsApp</a></div>' : "") + "</div>";
      } else if (x.statut === "Permis obtenu") {
        body = '<div class="pc-block ex-big"><div class="pc-bh"><b>Permis obtenu</b></div><p class="ex-when">' + (x.examen_date ? dLong(x.examen_date) : "Félicitations !") + "</p>" + (n ? '<div class="tm-formact"><a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="' + wa(msgBravo(x)) + '">Envoyer les félicitations ↗</a></div>' : "") + "</div>";
      } else {
        body = '<div class="pc-block"><p>Archivé ' + (x.archive_le ? "le " + new Date(x.archive_le).toLocaleDateString("fr-FR") : "") + (x.archive_motif ? " · motif : <b>" + esc(x.archive_motif) + "</b>" : "") + '.</p><p class="tm-note">« Ressortir » le remet dans la zone d\'appel, compteur d\'appels remis à zéro.</p>' + (n ? '<div class="tm-formact"><a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="https://wa.me/228' + n + '">Écrire sur WhatsApp</a></div>' : "") + "</div>";
      }
      const pieces = ""; // Pièces du dossier d'examen : gérées plus tard (fin de formation)
      const arch = ""; // le rangement (Plus tard, Rétractation, Faux numéro) n'existe que dans la zone d'appel
      const suivi = '<div class="pc-edit"><button class="linkbtn" type="button" data-a="edit">Modifier la fiche</button></div>'; // l'historique reste enregistré dans la base (table suivi), sans l'afficher
      box.innerHTML = head + info + body + pieces + arch + suivi;
      const id = x.id;
      if (st === "formation" && !sansCode(x)) fillCours(x);
      if (st === "formation") {
        const [py, cd] = await Promise.all([run(() => DB.q("paiements?select=*&eleve_id=eq." + id + "&order=cree_le.desc")), run(() => DB.q("creneaux_conduite?select=jour,heure,statut&eleve_id=eq." + id + "&order=jour.desc&limit=60"))]);
        if (pcSel !== id) return;
        const ok = (py || []).filter((p) => !p.annule), paid = ok.reduce((a, p) => a + p.montant, 0), last = ok[0];
        $("#sd-pcPaid").textContent = ok.length ? F(paid) : "0 F";
        const rs = $("#sd-pcRest"); rs.textContent = !ok.length ? "—" : last && last.reste > 0 ? F(last.reste) : "Soldé ✓"; rs.classList.toggle("pc-due", !!(last && last.reste > 0));
        $("#sd-pcPay").innerHTML = ok.length ? "<span>Reçus</span>" + ok.slice(0, 5).map((p) => '<div class="pc-line"><span>' + dOf(p.jour).toLocaleDateString("fr-FR") + "</span><b>" + F(p.montant) + "</b><em>" + esc(p.motif) + "</em>" + (window.__sodafRcLink ? '<a target="_blank" rel="noopener" href="' + window.__sodafRcLink(p) + '">reçu</a>' : "") + "</div>").join("") : '<span>Reçus</span><b style="font-weight:500;color:var(--muted)">Aucun paiement enregistré. Touche « Faire un reçu ».</b>';
        const c = cd || [], fait = c.filter((s) => s.statut === "Fait").length, abs = c.filter((s) => s.statut === "Absent").length, next = c.filter((s) => s.statut === "Réservé" && s.jour >= iso(new Date())).sort((a, b) => (a.jour < b.jour ? -1 : 1))[0];
        $("#sd-pcDrive").innerHTML = '<div class="pc-mini"><div><span>Séances faites</span><b>' + fait + '</b></div><div><span>Absences</span><b>' + abs + '</b></div><div><span>Prochaine</span><b>' + (next ? longDay(next.jour) + " · " + esc(next.heure) : "—") + "</b></div></div>";
      }
    }
    $("#sd-pcDetail").addEventListener("click", async (e) => {
      const x = eleves.find((y) => y.id === pcSel); if (!x) return;
      const evb = e.target.closest("[data-ev]");
      if (evb) { const v = evb.dataset.ev; if (await patchEl(x, { evaluation: v, evaluation_le: new Date().toISOString() }, v === "pret" ? "Noté : prêt pour l'examen" : "Noté : séances en plus conseillées", ["Note", v === "pret" ? "Évaluation : prêt pour l'examen" : "Évaluation : séances en plus conseillées"])) renderList(true); return; }
      const a = e.target.closest("[data-a]"), ar = e.target.closest("[data-arch]"), rp = e.target.closest("[data-rappel]");
      if (ar) { confirmBtn(ar, () => archive(x, ar.dataset.arch)); return; }
      const ko = e.target.closest("[data-ko]");
      if (ko) { const v = ko.dataset.ko, nb = Math.min((x.appels || 0) + 1, 20), note = ($("#sd-pcCallNote") || {}).value; const order = $$("#sd-pcList .pc-item").map((b) => +b.dataset.id); if (await patchEl(x, { appels: nb, rappel: v, dernier_appel_le: new Date().toISOString() }, "Pas de réponse (" + nb + "X) · " + (v === "matin" ? "à rappeler le matin" : "à rappeler l'après-midi"), ["Appel sans réponse", [v === "matin" ? "Rappel le matin" : "Rappel l'après-midi", (note || "").trim()].filter(Boolean).join(" · ")])) { const rest = order.slice(order.indexOf(x.id) + 1).concat(order.slice(0, order.indexOf(x.id))).map((id) => eleves.find((y) => y.id === id)).filter((y) => y && etapeOf(y) === "appels"); const nx = rest.find((y) => !calledToday(y)) || null; pcSel = nx ? nx.id : null; renderList(); } return; }
      if (rp) { const v = rp.dataset.rappel || null; if (await patchEl(x, { rappel: v }, "Enregistré")) renderList(); return; }
      if (!a) return;
      const k = a.dataset.a;
      if (k === "back") { pcSel = null; renderList(); $("#sd-pc").scrollIntoView({ block: "start" }); }
      else if (k === "sendWelcome") { const txt = $("#sd-pcMsg").value; a.href = "https://wa.me/228" + waNum(x.telephone) + "?text=" + encodeURIComponent(txt); if (await patchEl(x, { accueil_le: new Date().toISOString(), statut: "Contacté", appels: 0 }, "Accueil envoyé : dossier en zone d'appel", ["Étape", "Accueil envoyé, passé en zone d'appel"])) nextAfter(x); }
      else if (k === "toCall") { if (await patchEl(x, { statut: "Contacté", appels: 0 }, "Dossier en zone d'appel", ["Étape", "Passé en zone d'appel"])) nextAfter(x); }
      else if (k === "callOk") { const note = $("#sd-pcCallNote").value.trim(); await addSuivi(x, "Appel réussi", note); toast("Appel noté"); renderDetail(); }
      else if (k === "callKo") { const note = $("#sd-pcCallNote").value.trim(); if (await patchEl(x, { appels: Math.min((x.appels || 0) + 1, 20) }, "Tentative notée (" + ((x.appels || 0) + 1) + "X)", ["Appel sans réponse", note])) renderList(); }
      else if (k === "sendDossier") { a.href = "https://wa.me/228" + waNum(x.telephone) + "?text=" + encodeURIComponent(($("#sd-pcDosMsg") || {}).value || msgDossier(x)); if (await patchEl(x, { dossier_envoye_le: new Date().toISOString(), dossier_relance_le: null, dossier_relances: 0, rappel: null, jeton: jetonOf(x) }, "Lien envoyé : dossier en paiement en attente", ["Étape", "Lien d'inscription envoyé (paiement en attente)"])) nextAfter(x); }
      else if (k === "resendDossier") { a.href = "https://wa.me/228" + waNum(x.telephone) + "?text=" + encodeURIComponent(($("#sd-pcDosMsg") || {}).value || msgDossier(x)); await patchEl(x, { dossier_envoye_le: new Date().toISOString(), dossier_relance_le: null, jeton: jetonOf(x) }, "Message de paiement renvoyé", ["Étape", "Message de paiement renvoyé"]); renderList(); }
      else if (k === "relDossier") { const nb = Math.min((x.dossier_relances || 0) + 1, 4); if (await patchEl(x, { dossier_relance_le: new Date().toISOString(), dossier_relances: nb }, nb >= 4 ? "Dernière relance envoyée" : "Relance " + nb + "/4 notée", ["Relance envoyée", "Relance " + nb + "/4 (paiement en attente)"])) { if (nb >= 4) await archive(x, "Plus tard"); nextAfter(x); } }
      else if (k === "backCall") { if (await patchEl(x, { dossier_envoye_le: null, dossier_relance_le: null }, "Dossier remis en zone d'appel", ["Étape", "Revenu en zone d'appel"])) nextAfter(x); }
      else if (k === "relFinal") { if (!waNum(x.telephone)) e.preventDefault(); if (await patchEl(x, { appels: Math.max(4, x.appels || 0), dernier_appel_le: new Date().toISOString(), rappel: null }, "Dernière relance envoyée", ["Appel sans réponse", "4e tentative : dernière relance envoyée"])) await archive(x, "Injoignable"); }
      else if (k === "relance") { await addSuivi(x, "Relance envoyée"); toast("Relance notée"); }
      else if (k === "enroll") {
        const w = x.web; if (w) pendWeb[x.id] = w;
        toast("Fais le reçu : il passera en formation dès que le reçu sera enregistré");
        if (window.__sodafRcFill) { sub("paiements"); window.__sodafRcFill(x, w ? { formation: w.formule, motif: w.paiement === "total" ? "ins-full" : "ins-half", mode: w.mode === "mixx" ? "Mixx by Yas (T-Money)" : "Espèces", note: w.mode === "mixx" ? "Mixx" + (w.mixx_ref ? " réf. " + w.mixx_ref : "") + (w.mixx_tel ? " depuis " + w.mixx_tel : "") : "" } : null); }
      }
      else if (k === "webReject") { const w = x.web; if (!w) return; confirmBtn(a, async () => { const ok = await run(() => DB.q("inscriptions_web?id=eq." + w.id, { method: "PATCH", body: { statut: "Rejeté" }, prefer: "return=minimal" }), "Paiement marqué introuvable"); if (ok) { await addSuivi(x, "Note", "Paiement Mixx introuvable (" + F(w.a_payer) + (w.mixx_ref ? ", réf. " + w.mixx_ref : "") + "). Contacter l'élève."); x.web = null; renderList(); } }); }
      else if (k === "rcSolde") { if (window.__sodafRcFill) { sub("paiements"); window.__sodafRcFill(x, x.solde ? { formation: x.formation || "", motif: "rest", mode: "Espèces", note: "" } : null); } }
      else if (k === "relPlus") { await addSuivi(x, "Note", "Proposition de séances en plus envoyée"); toast("Proposition envoyée"); }
      else if (k === "rcPlus") { if (window.__sodafRcFill) { sub("paiements"); window.__sodafRcFill(x, { formation: x.formule || x.formation || "", motif: "seance", mode: "Espèces", note: "" }); } }
      else if (k === "sendGroupe") { if (await patchEl(x, { groupe_msg_le: new Date().toISOString() }, "Horaires envoyés", ["Note", "Horaires de code envoyés (" + x.groupe_code + ")"])) renderList(true); }
      else if (k === "relSolde") { const nr = (x.solde_rappels || 0) + 1; if (await patchEl(x, { solde_rappels: Math.min(nr, 10), solde_rappel_le: new Date().toISOString() }, susp(x) ? "Message de suspension envoyé" : "Rappel du solde envoyé", ["Note", (susp(x) ? "Suspension annoncée" : "Rappel du solde envoyé") + " (" + F(x.solde) + ")"])) renderList(true); }
      else if (k === "rc") { if (window.__sodafRcFill) { sub("paiements"); window.__sodafRcFill(x); } }
      else if (k === "reExam") { if (await patchEl(x, { statut: "En formation", archive_motif: null, archive_le: null, examen_resultat: null, examen_etape: "pret", examen_pret_le: new Date().toISOString(), examen_lien_le: null, examen_paye: false, examen_docs: {}, examen_bordereau_le: null, jeton: jetonOf(x) }, "Nouveau dépôt d'examen : envoie le message à l'élève", ["Étape", "Examen : ressorti pour repasser (" + ((x.examen_passages || 1) + 1) + "e passage)"])) { pcStage = "examen"; S.set("pcStage", pcStage); renderList(); } }
      else if (k === "revive") { if (await patchEl(x, { statut: "Contacté", archive_motif: null, archive_le: null, appels: 0, rappel: null, dossier_envoye_le: null, dossier_relance_le: null, dossier_relances: 0 }, "Dossier remis en appel", ["Étape", "Ressorti des archives"])) nextAfter(x); }
      else if (k === "note") { const v = $("#sd-pcNote").value.trim(); if (!v) return; await addSuivi(x, "Note", v); toast("Note ajoutée"); renderDetail(); }
      else if (k === "edit") editForm(x);
      else if (k === "finForm") { confirmBtn(a, async () => { if (await patchEl(x, { statut: "Abandon", archive_motif: "Formation terminée", archive_le: new Date().toISOString(), rappel: null }, "Formation terminée : dossier archivé", ["Étape", "Formation terminée (sans examen)"])) nextAfter(x); }); }
      else if (k === "toExam") { confirmBtn(a, async () => { const sd = await run(() => soldeFrais(x.id)); if (!sd) return; x.solde = sd.s; if (doit(x)) { toast("Formation pas encore soldée : pas de passage à l'examen", true); renderList(true); return; } if (await patchEl(x, { examen_etape: "pret", examen_pret_le: new Date().toISOString(), examen_lien_le: null, examen_relance_le: null, examen_bordereau_le: null, examen_date: null, examen_lieu: null, jeton: jetonOf(x) }, "Étape examen : envoie le message à l'élève", ["Étape", "Formation terminée : examen"])) { pcStage = "examen"; S.set("pcStage", pcStage); renderList(); } }); }
      else if (k === "sendExam") { const m = $("#sd-exMsg"); if (m) a.href = "https://wa.me/228" + waNum(x.telephone) + "?text=" + encodeURIComponent(m.value); await patchEl(x, { examen_lien_le: new Date().toISOString(), jeton: jetonOf(x) }, "Message noté comme envoyé", ["Étape", "Examen : Message de fin de formation envoyé"]); renderList(); }
      else if (k === "exRecu") {
        toast("Fais le reçu de 30 000 F : le dossier passera « à déposer » dès que le reçu sera enregistré");
        if (window.__sodafRcFill) { sub("paiements"); window.__sodafRcFill(x, { formation: x.formation, motif: "examen", mode: "Espèces", note: "Dépôt examen d'État · dossier complet reçu" }); }
      }
      else if (k === "exDepose") { const d = $("#sd-exDep").value || iso(new Date()); if (await patchEl(x, { examen_etape: "depose", examen_depose_le: d }, "Dossier déposé le " + dFr(d), ["Étape", "Examen : Dossier déposé le " + d])) renderList(); }
      else if (k === "exPass") { confirmBtn(a, async () => { if (await patchEl(x, { statut: "Permis obtenu", examen_resultat: "obtenu", examen_date: iso(new Date()) }, "Bravo ! Permis obtenu", ["Étape", "Examen : Permis obtenu"])) { pcStage = "archives"; S.set("pcStage", pcStage); pcSel = x.id; renderList(); } }); }
      else if (k === "exFail") { confirmBtn(a, async () => { if (await patchEl(x, { statut: "Abandon", archive_motif: null, archive_le: new Date().toISOString(), examen_resultat: "echoue", examen_etape: null, examen_passages: Math.min((x.examen_passages || 0) + 1, 10), examen_date: null, examen_lieu: null, examen_depose_le: null, examen_lien_le: null, examen_relance_le: null, examen_bordereau_le: null, examen_paye: false, examen_docs: {} }, "Archivé : permis échoué. Ressors-le quand il veut repasser.", ["Étape", "Examen : échoué (archivé)"])) { pcSel = null; renderList(); } }); }
      else if (k === "exBack") { confirmBtn(a, async () => { if (await patchEl(x, { examen_etape: null }, "Revenu en formation", ["Étape", "Revenu en formation"])) { pcStage = "formation"; S.set("pcStage", pcStage); renderList(); } }); }
    });
    $("#sd-pcDetail").addEventListener("change", async (e) => {
      const x = eleves.find((y) => y.id === pcSel); if (!x) return;
      const pc = e.target.closest("[data-piece]");
      if (pc) { const d = Object.assign({}, x.dossier || {}); d[pc.dataset.piece] = pc.checked; await patchEl(x, { dossier: d }, "Dossier mis à jour"); return; }
      if (e.target.matches('[data-a="groupe"]')) { const v = e.target.value || null, g = v && gOf(v); if (await patchEl(x, { groupe_code: v, groupe_depuis: v ? new Date().toISOString() : null, groupe_msg_le: null }, v ? "Placé dans le " + g.nom : "Mis en liste d'attente", ["Note", v ? "Groupe de code : " + g.nom : "Groupe de code : liste d'attente"])) renderList(true); return; }
      if (e.target.matches('[data-a="statut"]')) { if (await patchEl(x, { statut: e.target.value }, "Statut enregistré", ["Étape", e.target.value])) renderList(); }
    });
    const FORMS = [...$$("#sd-elFo option")].map((o) => o.textContent);
    function editForm(x) {
      const box = $("#sd-pcDetail"), old = box.querySelector(".tm-edit"); if (old) { old.remove(); return; }
      const fo = FORMS.includes(x.formation) || !x.formation ? FORMS : [x.formation, ...FORMS];
      const f = document.createElement("form"); f.className = "tm-edit pc-block"; f.noValidate = true;
      f.innerHTML = '<div class="row3"><div class="field"><label>Nom et prénom</label><input name="nom" value="' + esc(x.nom) + '"></div><div class="field"><label>Téléphone</label><div class="tel"><span>+228</span><input name="tel" inputmode="numeric" maxlength="11" value="' + esc(waNum(x.telephone).replace(/(\d{2})(?=\d)/g, "$1 ")) + '"></div></div><div class="field"><label>Formation</label><select name="formation">' + fo.map((t) => "<option" + (t === x.formation ? " selected" : "") + ">" + esc(t) + "</option>").join("") + '</select></div></div>' +
        '<div class="row2e"><div class="field"><label>Quartier</label><input name="quartier" maxlength="80" value="' + esc(x.quartier || "") + '"></div><div class="field"><label>Note interne (visible par l\'équipe seulement)</label><input name="notes" maxlength="300" value="' + esc(x.notes || "") + '"></div></div>' +
        '<div class="tm-formact"><button class="btn btn-green btn-sm" type="submit">Enregistrer</button><button class="linkbtn" type="button" data-x>Fermer</button><span class="tm-err"></span></div>';
      box.querySelector(".pc-info").after(f); f.querySelector("input").focus();
      f.querySelector("[data-x]").addEventListener("click", () => f.remove());
      f.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const nom = f.nom.value.trim().replace(/\s+/g, " "), tel = f.tel.value.replace(/\D/g, ""), er = f.querySelector(".tm-err");
        if (nom.length < 3 || (tel && tel.length !== 8)) { er.textContent = "Nom (3 lettres min.) et numéro à 8 chiffres."; return; }
        const body = { nom, telephone: tel ? "+228" + tel : null, formation: f.formation.value, quartier: f.quartier.value.trim() || null, notes: f.notes.value.trim() || null };
        if (nom !== x.nom) { body.nom_famille = null; body.prenoms = null; }
        if (await patchEl(x, body, "Fiche élève enregistrée")) { fillEleveSelect(); renderList(); }
      });
    }
    // ---- Nouvelle inscription au bureau : on enregistre le client, puis on lui envoie le lien de finalisation (il choisit et paie lui-même)
    let insX = null;
    const insOpen = () => { insX = null; $("#sd-insForm").reset(); $("#sd-insErr").textContent = ""; $("#sd-insDone").hidden = true; $$("#sd-insForm .ins-step, #sd-insForm .ins-ft").forEach((el) => (el.hidden = false)); $("#sd-insOv").hidden = false; document.body.style.overflow = "hidden"; setTimeout(() => $("#sd-insN").focus(), 50); };
    const insClose = () => { $("#sd-insOv").hidden = true; document.body.style.overflow = ""; if (insX) { sub("eleves"); pcStage = etapeOf(insX); S.set("pcStage", pcStage); pcSel = insX.id; renderList(); } insX = null; };
    $("#sd-insNew").addEventListener("click", insOpen);
    $("#sd-insX").addEventListener("click", insClose);
    $("#sd-insOv").addEventListener("click", (e) => { if (e.target.id === "sd-insOv") insClose(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#sd-insOv").hidden) insClose(); });
    $("#sd-insForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const nf = $("#sd-insN").value.trim().replace(/\s+/g, " ").toUpperCase(), pr = $("#sd-insP").value.trim().replace(/\s+/g, " "), nom = (pr + " " + nf).trim();
      const tel = $("#sd-insT").value.replace(/\D/g, ""), q = $("#sd-insQ").value.trim(), src = $("#sd-insSrc").value, err = $("#sd-insErr");
      if (nf.length < 2 || pr.length < 2) { err.textContent = "Écris le nom et les prénoms."; return; }
      if (tel.length !== 8) { err.textContent = "Numéro de téléphone à 8 chiffres."; return; }
      if (!src) { err.textContent = "Choisis comment il nous a connus."; return; }
      err.textContent = ""; $("#sd-insGo").disabled = true;
      const body = { nom, nom_famille: nf, prenoms: pr, telephone: "+228" + tel, quartier: q || null, formation: $("#sd-insFo").value, source: "bureau", provenance: src, statut: "Contacté", accueil_le: new Date().toISOString(), jeton: newJeton() };
      const r = await run(() => DB.q("eleves", { method: "POST", body, prefer: "return=representation" }), "Client enregistré");
      $("#sd-insGo").disabled = false;
      if (!r || !Array.isArray(r) || !r[0]) return;
      await loadEleves(true);
      insX = eleves.find((y) => y.id === r[0].id) || r[0];
      $$("#sd-insForm .ins-step, #sd-insForm .ins-ft").forEach((el) => (el.hidden = true));
      const n = waNum(insX.telephone);
      $("#sd-insDone").innerHTML = '<div class="ins-ok"><span class="ins-check">✓</span><div><b>' + esc(insX.nom) + " est enregistré</b><small>N° client " + CODE(insX) + " · " + esc(insX.formation || "") + '</small></div></div><p class="ins-sum">Envoie-lui maintenant le lien pour finaliser son inscription. Il choisira sa formule et sa façon de payer, à son rythme.</p><div class="ins-acts"><a class="btn btn-wa wl-btn" target="_blank" rel="noopener" id="sd-insSend" href="https://wa.me/228' + n + "?text=" + encodeURIComponent(msgDossier(insX)) + '">Envoyer le lien d\'inscription sur WhatsApp ↗</a><button class="linkbtn" type="button" id="sd-insLater">Plus tard : le garder dans les appels</button></div>';
      $("#sd-insDone").hidden = false;
      $("#sd-insSend").addEventListener("click", async () => {
        const x = insX; if (!x) return;
        if (await patchEl(x, { dossier_envoye_le: new Date().toISOString(), dossier_relance_le: null, dossier_relances: 0, rappel: null }, "Lien envoyé : paiement en attente", ["Étape", "Inscription au bureau : lien d'inscription envoyé (paiement en attente)"])) { setTimeout(insClose, 300); }
      });
      $("#sd-insLater").addEventListener("click", insClose);
    });
    $("#sd-elAdd").addEventListener("submit", async (e) => {
      e.preventDefault();
      const nf = $("#sd-elN").value.trim().replace(/\s+/g, " ").toUpperCase(), pr = $("#sd-elP").value.trim().replace(/\s+/g, " "), nom = (pr + " " + nf).trim();
      const tel = $("#sd-elT").value.replace(/\D/g, ""), q = $("#sd-elQ").value.trim(), src = $("#sd-elSrc").value, err = $("#sd-elErr"), statut = $("#sd-elSt").value;
      if (nf.length < 2 || pr.length < 2) { err.textContent = "Écris le nom et les prénoms."; return; }
      if (tel.length !== 8) { err.textContent = "Numéro de téléphone à 8 chiffres."; return; }
      if (!src) { err.textContent = "Choisis comment il nous a connus."; return; }
      err.textContent = "";
      const paie = statut === "Inscrit", now = new Date().toISOString();
      const r = await run(() => DB.q("eleves", { method: "POST", body: Object.assign({ nom, nom_famille: nf, prenoms: pr, telephone: "+228" + tel, quartier: q || null, formation: $("#sd-elFo").value, source: "bureau", provenance: src, statut: "Contacté" }, paie ? { dossier_envoye_le: now, accueil_le: now } : {}), prefer: "return=representation" }), paie ? "Client ajouté : fais son reçu" : "Client ajouté");
      if (r) { $("#sd-elAdd").reset(); $("#sd-elAdd").hidden = true; pcStage = paie ? "dossier" : "appels"; S.set("pcStage", pcStage); pcSel = null; await loadEleves();
        const nx = paie && Array.isArray(r) && r[0] ? eleves.find((y) => y.id === r[0].id) : null;
        if (nx && window.__sodafRcFill) { sub("paiements"); window.__sodafRcFill(nx, null); } }
    });
    function fillEleveSelect() {
      const opts = eleves.filter((x) => x.statut !== "Abandon").sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
      const dl = $("#sd-rcEleves"); if (dl) dl.innerHTML = opts.map((x) => '<option value="' + esc(x.nom) + '">').join("");
    }

    // ---- Planning conduite
    const CST = ["Libre", "Réservé", "Fait", "Absent", "Annulé"];
    async function loadDay() {
      $("#sd-cdDay").textContent = longDay(cdDay).replace(/^./, (c) => c.toUpperCase()) + (cdDay === iso(new Date()) ? " (aujourd'hui)" : "");
      const [r, fe] = await Promise.all([run(() => DB.q("creneaux_conduite?select=*&jour=eq." + cdDay)), run(() => DB.q("jours_feries?select=*&jour=eq." + cdDay))]);
      if (!r) return;
      const ferme = fe && fe[0], cl = $("#sd-cdClosed");
      cl.hidden = !ferme; cl.innerHTML = ferme ? "<b>Jour fermé : " + esc(ferme.nom) + '</b><button class="linkbtn" type="button" id="sd-cdReopen">Rouvrir ce jour</button>' : "";
      $("#sd-cdCloseBtn").hidden = !!ferme || !r.length; $("#sd-cdCloseForm").hidden = true;
      if (ferme) $("#sd-cdReopen").addEventListener("click", reopenDay);
      r.sort((a, b) => hmin(a.heure) - hmin(b.heure));
      const actifs = eleves.filter((x) => ["Inscrit", "En formation"].includes(x.statut)).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
      const tomorrow = iso(new Date(Date.now() + 864e5));
      $("#sd-cdList").innerHTML = r.length ? r.map((c) => {
        const el = eleves.find((x) => x.id === c.eleve_id), n = el ? waNum(el.telephone) : "";
        const conf = el && n && c.statut === "Réservé" ? "https://wa.me/228" + n + "?text=" + encodeURIComponent(msgSeance(el, c)) : "";
        const rap = el && n && c.statut === "Réservé" && c.jour === tomorrow ? "https://wa.me/228" + n + "?text=" + encodeURIComponent(msgRappelSeance(el, c)) : "";
        return '<div class="tm-row st-' + c.statut.normalize("NFD").replace(/[^a-z]/gi, "").toLowerCase() + '" data-id="' + c.id + '"><div class="tm-time">' + esc(c.heure) + '</div><div class="tm-main"><select data-el aria-label="Élève"><option value="">— Créneau libre —</option>' + actifs.map((x) => '<option value="' + x.id + '"' + (x.id === c.eleve_id ? " selected" : doit(x) || plein(x) ? " disabled" : "") + ">" + esc(x.nom) + (x.id !== c.eleve_id ? (doit(x) ? " · solde non payé" : plein(x) ? " · séances terminées (" + x.quota + ")" : x.quota !== null ? " · " + (x.faits + x.resa) + "/" + x.quota : "") : "") + "</option>").join("") + (el && !actifs.includes(el) ? '<option value="' + el.id + '" selected>' + esc(el.nom) + "</option>" : "") + '</select>' + (c.note ? "<small>" + esc(c.note) + "</small>" : "") + '</div><div class="tm-acts"><select data-cs aria-label="Statut">' + CST.map((t) => "<option" + (t === c.statut ? " selected" : "") + ">" + t + "</option>").join("") + "</select>" + (conf ? (c.confirme_le ? '<span class="cd-done">✓ Élève prévenu</span><a class="linkbtn" target="_blank" rel="noopener" data-cf="confirme_le" href="' + conf + '">Renvoyer</a>' : '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" data-cf="confirme_le" href="' + conf + '">Prévenir l\'élève ↗</a>') : "") + (rap ? (c.rappel_le ? '<span class="cd-done">✓ Rappel envoyé</span>' : '<a class="btn btn-yellow btn-sm" target="_blank" rel="noopener" data-cf="rappel_le" href="' + rap + '">Rappel de la veille ↗</a>') : "") + "</div></div>";
      }).join("") : '<p class="tm-empty">Pas de créneau ce jour-là (dimanche ou jour férié).</p>';
    }
    $("#sd-cdList").addEventListener("change", async (e) => {
      const row = e.target.closest("[data-id]"); if (!row) return; const id = row.dataset.id;
      let body;
      if (e.target.matches("[data-el]") && e.target.value) {
        const el = eleves.find((x) => x.id === +e.target.value), sd = await run(() => soldeFrais(+e.target.value));
        if (!sd) { loadDay(); return; }
        if (el) el.solde = sd.s;
        if (sd.s === null || sd.s > 0) { toast((el ? el.nom.split(" ")[0] + " : " : "") + (sd.s ? "solde de " + F(sd.s) + " non payé" : "aucun paiement enregistré") + ". Réservation impossible.", true); loadDay(); return; }
      }
      if (e.target.matches("[data-el]")) { const v = e.target.value; body = { eleve_id: v ? +v : null, statut: v ? "Réservé" : "Libre", confirme_le: null, rappel_le: null, modifie_le: new Date().toISOString() }; }
      else if (e.target.matches("[data-cs]")) body = { statut: e.target.value, modifie_le: new Date().toISOString() };
      if (!body) return;
      await run(() => DB.q("creneaux_conduite?id=eq." + id, { method: "PATCH", body, prefer: "return=minimal" }), "Planning enregistré");
      await loadEleves(true); loadDay();
    });
    $("#sd-cdCloseBtn").addEventListener("click", () => { $("#sd-cdCloseForm").hidden = false; $("#sd-cdWhy").value = ""; $("#sd-cdWhy").focus(); });
    $("#sd-cdCloseCancel").addEventListener("click", () => { $("#sd-cdCloseForm").hidden = true; });
    $("#sd-cdCloseForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const why = $("#sd-cdWhy").value.trim() || "Fermeture exceptionnelle", day = cdDay, now = new Date().toISOString();
      const r = await run(() => DB.q("creneaux_conduite?select=*&jour=eq." + day)); if (!r) return;
      const touches = r.filter((c) => c.eleve_id && c.statut === "Réservé");
      const ok = await run(async () => {
        await DB.q("jours_feries", { method: "POST", body: { jour: day, nom: why }, prefer: "return=minimal,resolution=merge-duplicates" });
        await DB.q("creneaux_conduite?jour=eq." + day + "&statut=in.(Libre,R%C3%A9serv%C3%A9)", { method: "PATCH", body: { statut: "Annulé", note: why, modifie_le: now }, prefer: "return=minimal" });
        await DB.q("seances_code?jour=eq." + day + "&statut=eq.Pr%C3%A9vu", { method: "PATCH", body: { statut: "Annulé", note: why }, prefer: "return=minimal" });
        return true;
      }, "Jour fermé");
      if (!ok) return;
      await loadDay();
      $("#sd-cdWarn").innerHTML = touches.length ? '<div class="tm-sub"><div><p class="eyebrow">À prévenir</p><h3>' + touches.length + (touches.length > 1 ? " élèves avaient" : " élève avait") + " une séance ce jour-là</h3></div><p>Préviens-les et propose un autre créneau.</p></div><div class=\"tm-list\">" + touches.map((c) => { const el = eleves.find((x) => x.id === c.eleve_id) || { nom: "Élève" }, n = waNum(el.telephone); return '<div class="tm-row"><div class="tm-time">' + esc(c.heure) + '</div><div class="tm-main"><b>' + esc(el.nom) + '</b></div><div class="tm-acts">' + (n ? '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="https://wa.me/228' + n + "?text=" + encodeURIComponent("Bonjour " + el.nom.split(" ")[0] + ", ta séance de conduite SODAF du " + longDay(day) + " à " + c.heure + " est annulée (" + why + "). Désolé ! Réponds-nous pour choisir un autre créneau.") + '">Prévenir</a>' : "") + "</div></div>"; }).join("") + "</div>" : "";
    });
    async function reopenDay() {
      const day = cdDay, now = new Date().toISOString();
      const ok = await run(async () => {
        await DB.q("creneaux_conduite?jour=eq." + day + "&statut=eq.Annul%C3%A9&eleve_id=is.null", { method: "PATCH", body: { statut: "Libre", note: null, modifie_le: now }, prefer: "return=minimal" });
        await DB.q("creneaux_conduite?jour=eq." + day + "&statut=eq.Annul%C3%A9&eleve_id=not.is.null", { method: "PATCH", body: { statut: "Réservé", note: null, modifie_le: now }, prefer: "return=minimal" });
        await DB.q("seances_code?jour=eq." + day + "&statut=eq.Annul%C3%A9", { method: "PATCH", body: { statut: "Prévu", note: null }, prefer: "return=minimal" });
        await DB.q("jours_feries?jour=eq." + day, { method: "DELETE", prefer: "return=minimal" });
        return true;
      }, "Jour rouvert");
      $("#sd-cdWarn").innerHTML = ""; if (ok) loadDay();
    }
    $("#sd-cdList").addEventListener("click", (e) => {
      const b = e.target.closest("[data-cf]"); if (!b) return; const row = b.closest("[data-id]"); if (!row) return;
      const k = b.dataset.cf, body = {}; body[k] = new Date().toISOString();
      setTimeout(async () => { await run(() => DB.q("creneaux_conduite?id=eq." + row.dataset.id, { method: "PATCH", body, prefer: "return=minimal" }), k === "rappel_le" ? "Rappel noté comme envoyé" : "Élève noté comme prévenu"); loadDay(); }, 300);
    });
    // Pas de conduite le dimanche : la navigation saute ce jour
    const sansDim = (d, n) => { while (d.getDay() === 0) d.setDate(d.getDate() + (n < 0 ? -1 : 1)); return d; };
    const shift = (n) => { $("#sd-cdWarn").innerHTML = ""; const d = dOf(cdDay); d.setDate(d.getDate() + n); cdDay = iso(sansDim(d, n)); loadDay(); };
    $("#sd-cdPrev").addEventListener("click", () => shift(-1)); $("#sd-cdNext").addEventListener("click", () => shift(1));
    $("#sd-cdToday").addEventListener("click", () => { cdDay = iso(sansDim(new Date(), 1)); loadDay(); });
    cdDay = iso(sansDim(dOf(cdDay), 1));

    // ---- Paiements
    async function loadPay() {
      const now = new Date(), m0 = iso(new Date(now.getFullYear(), now.getMonth(), 1)), d90 = iso(new Date(Date.now() - 120 * 864e5));
      const r = await run(() => DB.q("paiements?select=*&jour=gte." + d90 + "&order=cree_le.desc"));
      if (!r) return;
      const mois = r.filter((p) => p.jour >= m0), ok = mois.filter((p) => !p.annule), tot = ok.reduce((a, p) => a + p.montant, 0);
      const esp = ok.filter((p) => p.mode === "Espèces").reduce((a, p) => a + p.montant, 0);
      const last = {}; r.filter((p) => !p.annule).reverse().forEach((p) => (last[(p.eleve_id || p.eleve_nom)] = p));
      const late = Object.values(last).filter((p) => p.reste > 0);
      $("#sd-pyStats").innerHTML = '<div><span>Encaissé en ' + M[now.getMonth()] + '</span><b>' + F(tot) + '</b></div><div><span>Reçus ce mois</span><b>' + ok.length + '</b></div><div><span>Espèces / Mixx by Yas</span><b>' + F(esp) + " / " + F(tot - esp) + '</b></div><div><span>Élèves qui doivent encore payer</span><b>' + late.length + "</b></div>";
      $("#sd-pyList").innerHTML = mois.length ? mois.map((p) => '<div class="tm-row' + (p.annule ? " annule" : "") + '" data-id="' + p.id + '"><div class="tm-time">' + dOf(p.jour).getDate() + " " + M[dOf(p.jour).getMonth()].slice(0, 4) + '.</div><div class="tm-main"><b>' + esc(p.eleve_nom) + " · " + F(p.montant) + "</b><span>" + esc(p.motif) + " · " + esc(p.mode) + (p.reste > 0 ? " · reste " + F(p.reste) : "") + "</span><small>Reçu n° " + esc(p.numero) + (p.annule ? ' · <b class="tm-ko">Annulé' + (p.annule_motif ? " : " + esc(p.annule_motif) : "") + "</b>" : "") + '</small></div><div class="tm-acts">' + (window.__sodafRcLink ? '<a class="btn btn-line btn-sm" target="_blank" rel="noopener" href="' + window.__sodafRcLink(p) + '">Revoir le reçu</a>' : "") + (p.annule ? "" : '<button class="linkbtn" type="button" data-cancel>Annuler ce reçu</button>') + "</div></div>").join("") : '<p class="tm-empty">Aucun reçu ce mois-ci pour l\'instant.</p>';
      $("#sd-pyLate").innerHTML = late.length ? '<div class="tm-sub"><div><p class="eyebrow">À relancer</p><h3>Reste à payer</h3></div></div><div class="tm-list">' + late.map((p) => { const n = waNum(p.telephone); return '<div class="tm-row"><div class="tm-main"><b>' + esc(p.eleve_nom) + " · reste " + F(p.reste) + "</b><span>" + esc(p.formation || "") + " · dernier paiement le " + dOf(p.jour).toLocaleDateString("fr-FR") + '</span></div><div class="tm-acts">' + (n ? '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="https://wa.me/228' + n + "?text=" + encodeURIComponent("Bonjour " + p.eleve_nom.split(" ")[0] + ", petit rappel de SODAF : il reste " + F(p.reste) + " à régler pour ta formation, dans les 2 semaines après ton inscription (avant ta première séance de conduite). Merci !") + '">Relancer</a>' : "") + "</div></div>"; }).join("") + "</div>" : "";
    }

    $("#sd-pyList").addEventListener("click", (e) => {
      const b = e.target.closest("[data-cancel]"); if (!b) return; const row = b.closest("[data-id]");
      if (row.querySelector(".tm-edit")) return;
      const f = document.createElement("form"); f.className = "tm-edit"; f.noValidate = true;
      f.innerHTML = '<div class="field"><label>Pourquoi annuler ce reçu ?</label><input name="why" maxlength="200" placeholder="Ex. erreur de montant, refait sous un autre numéro"></div><p class="tm-note" style="margin:0 0 10px!important">Le reçu reste dans la liste, barré, et ne compte plus dans les totaux. Pense à refaire le bon reçu si besoin.</p><div class="tm-formact"><button class="btn btn-sm" style="background:var(--red);color:#fff" type="submit">Confirmer l\'annulation</button><button class="linkbtn" type="button" data-x>Garder le reçu</button><span class="tm-err"></span></div>';
      row.appendChild(f); f.why.focus();
      f.querySelector("[data-x]").addEventListener("click", () => f.remove());
      f.addEventListener("submit", async (ev) => {
        ev.preventDefault(); const why = f.why.value.trim();
        if (why.length < 3) { f.querySelector(".tm-err").textContent = "Écris la raison (obligatoire)."; return; }
        const ok = await run(() => DB.q("paiements?id=eq." + row.dataset.id, { method: "PATCH", body: { annule: true, annule_motif: why, annule_le: new Date().toISOString() }, prefer: "return=minimal" }), "Reçu annulé");
        if (ok) loadPay();
      });
    });

    // ---- Devoirs
    async function loadDev() {
      const sel = $("#sd-dvWeek");
      if (!sel.options.length) {
        const w = await run(() => DB.q("devoir_semaines?select=*&lundi=lte." + iso(new Date()) + "&order=lundi.desc&limit=15"));
        if (!w) return;
        const opt = (lundi) => { const k = devWeek(new Date(lundi + "T12:00:00Z")), dv = k.sem < 5 ? [DEV[k.c[0]], DEV[k.c[1]]] : []; return '<option value="' + lundi + '" data-l="' + (dv.length ? dv[0].l + " et " + dv[1].l : "") + '" data-t="' + esc(BOUCLE[k.c[0]].t + " · " + BOUCLE[k.c[1]].t) + '">Semaine du ' + dOf(lundi).getDate() + " " + M[dOf(lundi).getMonth()] + " · " + (dv.length ? "Devoirs " + dv[0].l + " et " + dv[1].l : "révision, pas de devoir") + "</option>"; };
        sel.innerHTML = w.map((x) => opt(x.lundi)).join("") || opt(devWeek().key);
      }
      const o = sel.selectedOptions[0]; if (!o) return;
      const r = await run(() => DB.q("devoir_resultats?select=*&semaine=eq." + o.value + "&order=recu_le"));
      if (!r) return;
      const moy = r.length ? r.reduce((a, x) => a + (x.note * 10) / x.sur, 0) / r.length : 0;
      $("#sd-dvStats").innerHTML = "<div><span>Participants</span><b>" + r.length + "</b></div><div><span>Moyenne</span><b>" + (r.length ? String(Math.round(moy * 10) / 10).replace(".", ",") + "/10" : "—") + "</b></div><div><span>Niveau examen (9 ou 10)</span><b>" + r.filter((x) => x.note / x.sur >= 0.9).length + "</b></div>";
      const ic = (x) => (x.note / x.sur >= 0.9 ? "🏆" : x.note / x.sur >= 0.7 ? "✅" : "📘");
      const lines = r.map((x) => ic(x) + " " + x.eleve_nom + " : " + x.note + "/" + x.sur + " (devoir " + x.devoir + ")");
      const msg = "📚 *SODAF Auto-École · " + (o.dataset.l ? "Devoirs " + o.dataset.l : "Semaine de révision") + "*\nSemaine du " + dOf(o.value).getDate() + " " + M[dOf(o.value).getMonth()] + " · " + o.dataset.t + "\n\n" + (r.length ? "👥 " + r.length + (r.length > 1 ? " participants" : " participant") + " · moyenne " + String(Math.round(moy * 10) / 10).replace(".", ",") + "/10\n\n" + lines.join("\n") : "Aucun résultat reçu pour l'instant.") + "\n\n🏆 9 ou 10 · ✅ 7 ou 8 · 📘 à revoir\nCorrection au début du cours suivant.\nPas encore fait ? autosodaf.com/#devoirs";
      $("#sd-dvMsg").value = msg;
      $("#sd-dvWa").href = "https://wa.me/?text=" + encodeURIComponent(msg);
      $("#sd-dvRes").innerHTML = r.map((x) => '<div class="tm-row"><div class="tm-time tm-small">' + (x.note / x.sur >= 0.9 ? "Top" : x.note / x.sur >= 0.7 ? "Bien" : "À revoir") + '</div><div class="tm-main"><b>' + esc(x.eleve_nom) + " · " + x.note + "/" + x.sur + "</b><span>Devoir " + x.devoir + " · reçu le " + new Date(x.recu_le).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) + "</span></div></div>").join("");
    }
    $("#sd-dvWeek").addEventListener("change", loadDev);
    $("#sd-dvCopy").addEventListener("click", async () => { try { await navigator.clipboard.writeText($("#sd-dvMsg").value); toast("Message copié"); } catch (e) { $("#sd-dvMsg").select(); document.execCommand("copy"); toast("Message copié"); } });

    // ---- Gérance : demandes d'accord, journal des décisions, rapport de la semaine (tables demandes, decisions, rapports ; migration 0038)
    // La gérante écrit, la direction répond. Rien ne se supprime.
    function DIR() { return !!me && (me.role === "admin" || me.role === "gerant"); }
    const GR = { dem: [], dec: [], rap: [], ong: "demandes" };
    const grQuand = (d) => { const x = new Date(d), j = msJour(d); return (j === "Aujourd'hui" ? "aujourd'hui" : j === "Hier" ? "hier" : "le " + x.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })) + " à " + x.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); };
    const grLundi = (d) => { const x = new Date(d); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return iso(x); };
    const grSemTxt = (l) => { const a = dOf(l), b = new Date(a); b.setDate(a.getDate() + 6); return "du " + a.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) + " au " + b.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }); };
    function grOnglet(k) {
      if (!["demandes", "decisions", "rapports"].includes(k)) k = "demandes"; GR.ong = k;
      $$("#sd-gr [data-gr]").forEach((b) => b.setAttribute("aria-selected", b.dataset.gr === k)); $$("#sd-gr [data-grp]").forEach((p) => (p.hidden = p.dataset.grp !== k));
      if (k === "rapports" && me && me.role === "admin") GR.rap.filter((r) => !r.lu_le).forEach((r) => DB.q("rpc/rapport_lu", { method: "POST", body: { p_id: r.id } }).then(() => { r.lu_le = new Date().toISOString(); grBadges(); }).catch(() => {}));
    }
    function grBadges() {
      const adm = me && me.role === "admin", b = (id, n) => { const e = $(id); e.textContent = n; e.hidden = !n; };
      b("#sd-grBDem", adm ? GR.dem.filter((d) => d.statut === "attente").length : GR.dem.filter((d) => d.statut !== "attente" && d.repondu_le && !grVu("dem", d.id)).length);
      b("#sd-grBDec", adm ? GR.dec.filter((d) => !d.avis).length : GR.dec.filter((d) => d.avis === "revoir" && !grVu("dec", d.id)).length);
      b("#sd-grBRap", adm ? GR.rap.filter((r) => !r.lu_le).length : grSemaineAFaire() ? 1 : 0);
      b("#sd-grTabBadge", ["#sd-grBDem", "#sd-grBDec", "#sd-grBRap"].reduce((n, id) => n + (+$(id).textContent || 0), 0));
    }
    const grVu = (k, id) => { try { return (JSON.parse(localStorage.getItem("sodaf.gr." + k) || "[]")).includes(id); } catch (e) { return true; } };
    const grMarquer = (k, ids) => { try { const v = new Set(JSON.parse(localStorage.getItem("sodaf.gr." + k) || "[]")); ids.forEach((i) => v.add(i)); localStorage.setItem("sodaf.gr." + k, JSON.stringify([...v].slice(-300))); } catch (e) {} };
    // Semaine du rapport : la semaine en cours ; le lundi, la semaine passée si son rapport n'est pas encore envoyé
    const grSemaineAFaire = () => { const auj = new Date(), l = grLundi(auj); if (auj.getDay() === 1) { const p = new Date(dOf(l)); p.setDate(p.getDate() - 7); const lp = iso(p); if (!GR.rap.some((r) => r.semaine === lp)) return lp; } return GR.rap.some((r) => r.semaine === l) ? null : l; };
    async function grCharger() {
      const box = $("#sd-gr"); if (!box || !DIR()) return; box.hidden = false;
      const g = me.role === "gerant";
      $("#sd-grIntro").textContent = g ? "Demande l'accord de la direction pour ce qui dépasse tes limites, note les décisions que tu prends, et envoie ton rapport chaque fin de semaine (rappel le dimanche à 18 h)." : "La gérante te demande ton accord, note ses décisions et t'envoie son rapport chaque semaine. Tu reçois une notification à chaque fois.";
      $("#sd-grDemForm").hidden = !g; $("#sd-grDecForm").hidden = !g;
      const [dm, dc, rp] = await Promise.all([DB.q("demandes?select=*&order=le.desc&limit=60").catch(() => null), DB.q("decisions?select=*&order=le.desc&limit=60").catch(() => null), DB.q("rapports?select=*&order=semaine.desc&limit=20").catch(() => null)]);
      if (!dm && !dc && !rp) { $("#sd-grDemList").innerHTML = '<p class="tm-empty">La gérance n\'est pas encore activée dans la base.</p>'; return; }
      GR.dem = dm || []; GR.dec = dc || []; GR.rap = rp || [];
      grDemRender(); grDecRender(); await grRapRender(); grBadges(); grOnglet(GR.ong);
    }
    function grDemRender() {
      const adm = me.role === "admin", ST = { attente: ["att", "En attente"], accordee: ["oui", "Accordé"], refusee: ["non", "Refusé"] };
      $("#sd-grDemList").innerHTML = GR.dem.length ? GR.dem.map((d) => { const st = ST[d.statut] || ST.attente, el = d.eleve_id ? eleves.find((x) => x.id === d.eleve_id) : null;
        return '<div class="gr-it ' + st[0] + '"><div class="gr-hd"><b>' + esc(d.type) + (d.montant ? " · " + F(d.montant) : "") + (el ? " · " + esc(el.nom) : "") + '</b><em class="gr-st ' + st[0] + '">' + st[1] + "</em></div><small>Demandé " + esc(grQuand(d.le)) + "</small><p>" + esc(d.texte) + "</p>" +
          (d.statut !== "attente" ? '<div class="gr-rep">' + (d.statut === "accordee" ? "Accordé" : "Refusé") + " " + esc(grQuand(d.repondu_le)) + (d.reponse ? " : " + esc(d.reponse) : "") + "</div>" : adm ? '<div class="gr-act" data-dem="' + d.id + '"><input type="text" maxlength="300" placeholder="Un mot pour la gérante (facultatif)" aria-label="Réponse à la gérante"><button type="button" class="btn btn-sm btn-green" data-ok="1">Accorder</button><button type="button" class="btn btn-sm btn-line" data-ok="0">Refuser</button></div>' : "") + "</div>"; }).join("")
        : '<p class="tm-empty">' + (adm ? "Aucune demande pour l'instant." : "Aucune demande envoyée.") + "</p>";
    }
    function grDecRender() {
      const adm = me.role === "admin";
      $("#sd-grDecList").innerHTML = GR.dec.length ? GR.dec.map((d) => { const st = !d.avis ? ["neu", adm ? "À lire" : "Envoyée"] : d.avis === "ok" ? ["oui", "D'accord"] : ["non", "À revoir"];
        return '<div class="gr-it' + (d.avis === "revoir" ? " non" : d.avis === "ok" ? " oui" : adm ? " att" : "") + '"><div class="gr-hd"><b>' + esc(d.categorie) + '</b><em class="gr-st ' + st[0] + '">' + st[1] + "</em></div><small>" + esc(grQuand(d.le)) + "</small><p>" + esc(d.texte) + "</p>" +
          (d.avis ? (d.avis_note ? '<div class="gr-rep">Direction : ' + esc(d.avis_note) + "</div>" : "") : adm ? '<div class="gr-act" data-dec="' + d.id + '"><input type="text" maxlength="300" placeholder="Un mot pour la gérante (facultatif)" aria-label="Avis pour la gérante"><button type="button" class="btn btn-sm btn-green" data-avis="ok">D\'accord</button><button type="button" class="btn btn-sm btn-line" data-avis="revoir">À revoir</button></div>' : "") + "</div>"; }).join("")
        : '<p class="tm-empty">' + (adm ? "Aucune décision notée pour l'instant." : "Aucune décision notée.") + "</p>";
    }
    // Chiffres de la semaine, calculés depuis la base au moment du rapport
    async function grChiffres(l) {
      const a = dOf(l), b = new Date(a); b.setDate(a.getDate() + 6); const fin = iso(b), finTs = iso(new Date(b.getTime() + 864e5));
      const [pay, cr, el] = await Promise.all([DB.q("paiements?select=montant,annule,motif&jour=gte." + l + "&jour=lte." + fin).catch(() => []), DB.q("creneaux_conduite?select=statut,eleve_id&jour=gte." + l + "&jour=lte." + fin).catch(() => []), DB.q("eleves?select=id,cree_le,statut,archive_le,examen_date&or=(cree_le.gte." + l + ",archive_le.gte." + l + ",examen_date.gte." + l + ")").catch(() => [])]);
      const ok = pay.filter((p) => !p.annule), dans = (d) => d && d >= l && d < finTs;
      return { encaisse: ok.reduce((n, p) => n + (p.montant || 0), 0), recus: ok.length, recus_annules: pay.filter((p) => p.annule).length, inscriptions: ok.filter((p) => /^Droit d'inscription/.test(p.motif || "")).length,
        contacts: el.filter((x) => dans(x.cree_le)).length, conduite_faites: cr.filter((c) => c.statut === "Fait").length, absences: cr.filter((c) => c.statut === "Absent").length,
        abandons: el.filter((x) => x.statut === "Abandon" && dans(x.archive_le)).length, permis: el.filter((x) => x.statut === "Permis obtenu" && dans(x.examen_date)).length };
    }
    const GR_CH = [["encaisse", "Encaissé", (v) => F(v)], ["recus", "Reçus faits"], ["inscriptions", "Inscriptions"], ["contacts", "Nouveaux contacts"], ["conduite_faites", "Séances de conduite faites"], ["absences", "Absences en conduite"], ["permis", "Permis obtenus"], ["abandons", "Dossiers archivés"], ["recus_annules", "Reçus annulés"]];
    const grChHtml = (c, tuiles) => GR_CH.filter((k) => c[k[0]] != null).map((k) => tuiles ? "<div><span>" + k[1] + "</span><b>" + (k[2] ? k[2](c[k[0]]) : c[k[0]]) + "</b></div>" : "<span>" + k[1] + "<b>" + (k[2] ? k[2](c[k[0]]) : c[k[0]]) + "</b></span>").join("");
    async function grRapRender() {
      const g = me.role === "gerant", l = g ? grSemaineAFaire() : null;
      $("#sd-grRapNew").hidden = !l;
      if (l) { GR.semaine = l; $("#sd-grRapSem").textContent = "Semaine " + grSemTxt(l); GR.ch = await grChiffres(l); $("#sd-grRapChiffres").innerHTML = grChHtml(GR.ch, true); try { const t = localStorage.getItem("sodaf.gr.brouillon." + l); if (t && !$("#sd-grRapTx").value) $("#sd-grRapTx").value = t; } catch (e) {} }
      $("#sd-grRapList").innerHTML = GR.rap.length ? GR.rap.map((r) => '<div class="gr-it' + (!g && !r.lu_le ? " att" : "") + '"><div class="gr-hd"><b>Semaine ' + esc(grSemTxt(r.semaine)) + '</b><em class="gr-st ' + (r.lu_le ? "oui" : "neu") + '">' + (r.lu_le ? "Lu par la direction" : g ? "Envoyé" : "Nouveau") + "</em></div><small>Envoyé " + esc(grQuand(r.envoye_le)) + '</small><div class="gr-ch">' + grChHtml(r.chiffres || {}, false) + "</div>" + (r.texte ? "<p>" + esc(r.texte) + "</p>" : "") + "</div>").join("")
        : '<p class="tm-empty">' + (g ? "Aucun rapport envoyé pour l'instant." : "Aucun rapport reçu pour l'instant.") + "</p>";
    }
    $("#sd-gr").addEventListener("click", async (e) => {
      const t = e.target.closest("[data-gr]"); if (t) { grOnglet(t.dataset.gr); if (me.role === "gerant") { if (t.dataset.gr === "demandes") grMarquer("dem", GR.dem.filter((d) => d.statut !== "attente").map((d) => d.id)); if (t.dataset.gr === "decisions") grMarquer("dec", GR.dec.filter((d) => d.avis).map((d) => d.id)); grBadges(); } return; }
      const ok = e.target.closest("[data-ok]"), av = e.target.closest("[data-avis]");
      if (ok) { const bx = ok.closest("[data-dem]"); bx.querySelectorAll("button").forEach((b) => (b.disabled = true)); const r = await run(() => DB.q("rpc/demande_repondre", { method: "POST", body: { p_id: +bx.dataset.dem, p_accord: ok.dataset.ok === "1", p_note: bx.querySelector("input").value.trim() || null } }).then(() => true), ok.dataset.ok === "1" ? "Accordé : la gérante est prévenue" : "Refusé : la gérante est prévenue"); if (r) grCharger(); else bx.querySelectorAll("button").forEach((b) => (b.disabled = false)); }
      if (av) { const bx = av.closest("[data-dec]"); bx.querySelectorAll("button").forEach((b) => (b.disabled = true)); const r = await run(() => DB.q("rpc/decision_avis", { method: "POST", body: { p_id: +bx.dataset.dec, p_avis: av.dataset.avis, p_note: bx.querySelector("input").value.trim() || null } }).then(() => true), av.dataset.avis === "ok" ? "Noté : d'accord" : "Noté : à revoir, la gérante est prévenue"); if (r) grCharger(); else bx.querySelectorAll("button").forEach((b) => (b.disabled = false)); }
    });
    // Élève concerné : on tape le nom (ou SO12) et la liste se filtre
    const grPlat = (t) => (t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    function grElListe() {
      const q = grPlat($("#sd-grDemElQ").value.trim()), n = +(q.replace(/^so\s*/, "")) || 0, L = $("#sd-grDemElL");
      const res = eleves.filter((x) => !q || grPlat(x.nom).includes(q) || (n && x.id === n)).sort((a, b) => (a.statut === "Abandon") - (b.statut === "Abandon") || a.nom.localeCompare(b.nom, "fr")).slice(0, 8);
      L.innerHTML = res.length ? res.map((x) => '<button type="button" role="option" data-el="' + x.id + '"><b>' + esc(x.nom) + "</b><small>SO" + x.id + " · " + esc(x.statut || "") + (x.formation ? " · " + esc(x.formation) : "") + "</small></button>").join("") : '<p class="gr-elvide">Aucun élève trouvé</p>';
      L.hidden = false; $("#sd-grDemElQ").setAttribute("aria-expanded", "true");
    }
    const grElFermer = () => { $("#sd-grDemElL").hidden = true; $("#sd-grDemElQ").setAttribute("aria-expanded", "false"); };
    function grElChoisir(id) {
      const x = eleves.find((y) => y.id === id); $("#sd-grDemEl").value = x ? x.id : ""; grElFermer();
      const ch = $("#sd-grDemElSel"); ch.hidden = !x; $("#sd-grDemElQ").hidden = !!x;
      ch.innerHTML = x ? "<span><b>" + esc(x.nom) + "</b> · SO" + x.id + '</span><button type="button" aria-label="Retirer l\'élève">Changer</button>' : "";
      if (!x) { $("#sd-grDemElQ").value = ""; }
    }
    $("#sd-grDemElQ").addEventListener("input", grElListe);
    $("#sd-grDemElQ").addEventListener("focus", grElListe);
    $("#sd-grDemElQ").addEventListener("keydown", (e) => { if (e.key === "Escape") grElFermer(); if (e.key === "Enter") { e.preventDefault(); const f = $("#sd-grDemElL [data-el]"); if (f) grElChoisir(+f.dataset.el); } });
    $("#sd-grDemElL").addEventListener("click", (e) => { const b = e.target.closest("[data-el]"); if (b) grElChoisir(+b.dataset.el); });
    $("#sd-grDemElSel").addEventListener("click", (e) => { if (e.target.closest("button")) { grElChoisir(0); $("#sd-grDemElQ").focus(); } });
    document.addEventListener("click", (e) => { if (!e.target.closest(".gr-elbox")) grElFermer(); });
    $("#sd-grDemForm").addEventListener("submit", async (e) => {
      e.preventDefault(); const tx = $("#sd-grDemTx").value.trim(), mt = +($("#sd-grDemMt").value.replace(/\D/g, "")) || null, el = +$("#sd-grDemEl").value || null;
      if (tx.length < 3) { toast("Explique ta demande en quelques mots", true); $("#sd-grDemTx").focus(); return; }
      const b = e.target.querySelector("[type=submit]"); b.disabled = true;
      const r = await run(() => DB.q("demandes", { method: "POST", body: { type: $("#sd-grDemType").value, montant: mt, eleve_id: el, texte: tx }, prefer: "return=minimal" }).then(() => true), "Demande envoyée à la direction");
      b.disabled = false; if (r) { e.target.reset(); grElChoisir(0); grCharger(); }
    });
    $("#sd-grDecForm").addEventListener("submit", async (e) => {
      e.preventDefault(); const tx = $("#sd-grDecTx").value.trim();
      if (tx.length < 3) { toast("Écris la décision en quelques mots", true); $("#sd-grDecTx").focus(); return; }
      const b = e.target.querySelector("[type=submit]"); b.disabled = true;
      const r = await run(() => DB.q("decisions", { method: "POST", body: { categorie: $("#sd-grDecCat").value, texte: tx }, prefer: "return=minimal" }).then(() => true), "Décision notée, la direction est prévenue");
      b.disabled = false; if (r) { e.target.reset(); grOnglet("decisions"); grCharger(); }
    });
    $("#sd-grRapTx").addEventListener("input", () => { try { if (GR.semaine) localStorage.setItem("sodaf.gr.brouillon." + GR.semaine, $("#sd-grRapTx").value); } catch (e) {} }); // brouillon gardé sur ce téléphone
    $("#sd-grRapSend").addEventListener("click", async () => {
      const b = $("#sd-grRapSend"); if (!GR.semaine) return; b.disabled = true;
      const ch = await grChiffres(GR.semaine);
      const r = await run(() => DB.q("rapports", { method: "POST", body: { semaine: GR.semaine, chiffres: ch, texte: $("#sd-grRapTx").value.trim() }, prefer: "return=minimal" }).then(() => true), "Rapport envoyé à la direction");
      b.disabled = false; if (r) { try { localStorage.removeItem("sodaf.gr.brouillon." + GR.semaine); } catch (e) {} $("#sd-grRapTx").value = ""; grCharger(); }
    });

    // ---- Direction
    async function loadDir() {
      if (!me || !DIR()) return;
      if (me.role === "admin") loadSec();
      const now = new Date(), m0 = new Date(now.getFullYear(), now.getMonth(), 1), m6 = new Date(now.getFullYear(), now.getMonth() - 5, 1), mPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0), today = iso(now);
      const lun = new Date(now); lun.setDate(now.getDate() - ((now.getDay() + 6) % 7)); const dim = new Date(lun); dim.setDate(lun.getDate() + 6);
      $("#sd-drMonth").textContent = M[now.getMonth()].replace(/^./, (c) => c.toUpperCase()) + " " + now.getFullYear();
      const [pay, cr, wk] = await Promise.all([
        run(() => DB.q("paiements?select=*&jour=gte." + iso(m6) + "&order=cree_le.desc")),
        run(() => DB.q("creneaux_conduite?select=jour,statut,eleve_id&jour=gte." + iso(m0) + "&jour=lte." + iso(mEnd))),
        run(() => DB.q("creneaux_conduite?select=statut&jour=gte." + iso(lun) + "&jour=lte." + iso(dim))),
      ]);
      if (!pay || !cr || !wk) return;
      await loadEleves(true);
      const okPay = pay.filter((p) => !p.annule);
      const sum = (a) => a.reduce((x, p) => x + p.montant, 0);
      const moisP = okPay.filter((p) => p.jour >= iso(m0)), prevP = okPay.filter((p) => p.jour >= iso(mPrev) && p.jour < iso(m0));
      const enc = sum(moisP), encPrev = sum(prevP);
      const last = {}; okPay.slice().reverse().forEach((p) => (last[p.eleve_id || p.eleve_nom] = p));
      const dus = Object.values(last).filter((p) => p.reste > 0), du = dus.reduce((x, p) => x + p.reste, 0);
      const nouveaux = eleves.filter((x) => new Date(x.cree_le) >= m0), site = nouveaux.filter((x) => x.source === "site").length;
      const actifs = eleves.filter((x) => etapeOf(x) === "formation").length;
      const permis = eleves.filter((x) => x.statut === "Permis obtenu").length, aband = eleves.filter((x) => x.statut === "Abandon").length;
      const faits = cr.filter((c) => c.statut === "Fait").length, abs = cr.filter((c) => c.statut === "Absent").length;
      const wkOpen = wk.filter((c) => c.statut !== "Annulé"), wkPris = wkOpen.filter((c) => ["Réservé", "Fait", "Absent"].includes(c.statut)).length;
      const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
      const evo = encPrev ? (enc >= encPrev ? "+" : "") + Math.round(((enc - encPrev) / encPrev) * 100) + " % vs " + M[mPrev.getMonth()] : "premier mois";
      const T = (lab, val, sub, cls) => '<div class="' + (cls || "") + '"><span>' + lab + "</span><b>" + val + "</b>" + (sub ? "<small>" + sub + "</small>" : "") + "</div>";
      $("#sd-drStats").innerHTML =
        T("Encaissé ce mois", F(enc), evo, "hl") + T("Reste à encaisser", F(du), dus.length + (dus.length > 1 ? " élèves" : " élève")) +
        T("Nouveaux élèves ce mois", nouveaux.length, site + " via le site · " + (nouveaux.length - site) + " ajoutés au bureau") + T("Élèves en formation", actifs, "hors dépôt d'examen") +
        T("Séances de conduite faites", faits, abs + (abs > 1 ? " absences" : " absence") + " ce mois") + T("Planning de la semaine", pct(wkPris, wkOpen.length) + " %", wkPris + " créneaux pris sur " + wkOpen.length) +
        T("Permis obtenus", permis, "depuis l'ouverture") + T("Dossiers archivés", aband, aband ? "rétractations, injoignables, échoués" : "aucun");
      // Examen : où en sont les dossiers, et les résultats
      const exS = (s) => eleves.filter((x) => etapeOf(x) === "examen" && (x.examen_etape === s || (s === "depose" && x.examen_etape === "convoque"))).length;
      const exApp = exS("pret"), exCpl = exS("complet"), exDp = exS("depose"), exMsg = eleves.filter((x) => etapeOf(x) === "examen" && x.examen_etape === "pret" && !x.examen_lien_le).length;
      const echecs = eleves.reduce((n, x) => n + (x.examen_passages || 0), 0), enArch = eleves.filter((x) => x.statut === "Abandon" && x.examen_resultat === "echoue").length;
      const okMois = eleves.filter((x) => x.statut === "Permis obtenu" && x.examen_date && x.examen_date >= iso(m0)).length;
      const vieuxDp = eleves.filter((x) => etapeOf(x) === "examen" && ["depose", "convoque"].includes(x.examen_etape) && x.examen_depose_le && Date.now() - dOf(x.examen_depose_le) > 60 * 864e5).length;
      $("#sd-drExam").innerHTML =
        T("Papiers à apporter", exApp, exMsg ? exMsg + " message" + (exMsg > 1 ? "s" : "") + " encore à envoyer" : "en attente du dossier complet") + T("À déposer", exCpl, "dossier complet et 30 000 F reçus", exCpl ? "hl" : "") +
        T("Déposés", exDp, vieuxDp ? vieuxDp + " déposé" + (vieuxDp > 1 ? "s" : "") + " il y a plus de 2 mois" : "en attente du résultat") +
        T("Taux de réussite", (permis + echecs ? pct(permis, permis + echecs) : 0) + " %", permis + " obtenu" + (permis > 1 ? "s" : "") + " · " + echecs + " échec" + (echecs > 1 ? "s" : "") + " au total") +
        T("Permis obtenus ce mois", okMois, "") + T("Échoués à ressortir", enArch, enArch ? "Archives → Permis échoué" : "aucun");
      // Provenance des nouveaux clients du mois
      const cnt = {}; nouveaux.forEach((x) => { const k = srcOf(x); cnt[k] = (cnt[k] || 0) + 1; });
      const rows = Object.entries(cnt).sort((a, b) => b[1] - a[1]), mx = rows.length ? rows[0][1] : 1;
      $("#sd-drSrc").innerHTML = rows.length ? rows.map((r) => '<div class="tm-srow"><span>' + esc(r[0]) + '</span><i><em style="width:' + Math.max(4, Math.round((r[1] / mx) * 100)) + '%"></em></i><b>' + r[1] + " · " + pct(r[1], nouveaux.length) + " %</b></div>").join("") : '<p class="tm-empty">Aucun nouveau client ce mois-ci pour l\'instant.</p>';
      // À surveiller
      const w = [];
      const vieux = eleves.filter((x) => x.statut === "Nouveau" && Date.now() - new Date(x.cree_le) > 2 * 864e5);
      if (vieux.length) w.push(["r", vieux.length + (vieux.length > 1 ? " pré-inscriptions" : " pré-inscription") + " sans accueil depuis plus de 2 jours", vieux.slice(0, 4).map((x) => x.nom).join(", ")]);
      const nouv = eleves.filter((x) => x.statut === "Nouveau").length - vieux.length;
      if (nouv > 0) w.push(["y", nouv + (nouv > 1 ? " nouvelles pré-inscriptions" : " nouvelle pré-inscription") + " à accueillir", "Secrétariat → Parcours élèves → Accueil"]);
      const aVer = eleves.filter((x) => x.web && x.web.mode === "mixx" && etapeOf(x) === "dossier").length; if (aVer) w.push(["r", aVer + (aVer > 1 ? " paiements Mixx à vérifier" : " paiement Mixx à vérifier"), "Secrétariat → Parcours élèves → Paiement en attente"]);
      const aRel = eleves.filter((x) => etapeOf(x) === "dossier" && !x.web && dosAge(x) >= 5).length; if (aRel) w.push(["o", aRel + (aRel > 1 ? " paiements en attente à relancer" : " paiement en attente à relancer") + " (5 jours sans nouvelles)", "Secrétariat → Parcours élèves → Paiement en attente"]);
      const exDep = eleves.filter((x) => etapeOf(x) === "examen" && x.examen_etape === "complet").length; if (exDep) w.push(["o", exDep + (exDep > 1 ? " dossiers d'examen complets à déposer" : " dossier d'examen complet à déposer"), "Secrétariat → Parcours élèves → Dépôt d'examen"]);
      const exM = eleves.filter((x) => etapeOf(x) === "examen" && x.examen_etape === "pret" && !x.examen_lien_le).length; if (exM) w.push(["o", exM + (exM > 1 ? " messages d'examen à envoyer" : " message d'examen à envoyer"), "Secrétariat → Parcours élèves → Dépôt d'examen"]);
      const sDu = eleves.filter((x) => etapeOf(x) === "formation" && doit(x)).length; if (sDu) w.push(["y", sDu + (sDu > 1 ? " élèves en formation n'ont pas soldé" : " élève en formation n'a pas soldé") + " (pas de conduite)", "Secrétariat → Parcours élèves → En formation"]);
      { const fo = eleves.filter((x) => etapeOf(x) === "formation" && !doit(x)), pr = fo.filter((x) => seEtat(x) === "pret").length, fi = fo.filter((x) => seEtat(x) === "fin").length, ev = fo.filter((x) => seEtat(x) === "eval").length;
        if (pr) w.push(["o", pr + (pr > 1 ? " élèves sont prêts" : " élève est prêt") + " pour l'examen : passer au dépôt d'examen", "Secrétariat → Parcours élèves → En formation (étiquette « Prêt pour l'examen »)"]);
        if (fi) w.push(["y", fi + (fi > 1 ? " élèves ont fini leurs séances" : " élève a fini ses séances") + " : proposer des séances en plus ou passer à l'examen", "Secrétariat → Parcours élèves → En formation"]);
        if (ev) w.push(["y", ev + (ev > 1 ? " évaluations" : " évaluation") + " à faire par le moniteur", "Moniteur → Mes séances d'aujourd'hui"]); }
      { const ra = eleves.filter((x) => etapeOf(x) === "formation" && solEtat(x) === "rappel").length, su = eleves.filter((x) => etapeOf(x) === "formation" && susp(x)).length;
        if (ra) w.push(["o", ra + (ra > 1 ? " rappels de paiement" : " rappel de paiement") + " à envoyer (solde de formation)", "Secrétariat → Parcours élèves → En formation → Rappel de paiement (en rouge, tout en haut)"]);
        if (su) w.push(["r", su + (su > 1 ? " élèves ont" : " élève a") + " sa place au code suspendue : solde impayé après 2 semaines", "Secrétariat → Parcours élèves → En formation"]); }
      { const att = attente().filter((x) => !susp(x)).length; if (att && gPlein()) w.push(["r", att + (att > 1 ? " élèves attendent" : " élève attend") + " une place au code : groupes ouverts complets, ouvrir un groupe", "Secrétariat → Parcours élèves → En formation → Gérer les groupes"]); }
      { const ho = eleves.filter((x) => enCode(x) && x.groupe_code && cycleOk(x) && !susp(x) && !x.groupe_msg_le).length; if (ho) w.push(["o", ho + (ho > 1 ? " élèves placés au code attendent leurs horaires" : " élève placé au code attend ses horaires") + " (WhatsApp)", "Secrétariat → Parcours élèves → En formation (étiquette « Horaires à envoyer »)"]); }
      const aApp = eleves.filter((x) => etapeOf(x) === "appels").length; if (aApp) w.push(["y", aApp + (aApp > 1 ? " élèves à appeler" : " élève à appeler"), "Secrétariat → Parcours élèves → Appels"]);
      const vieuxDus = dus.filter((p) => Date.now() - dOf(p.jour) > 30 * 864e5);
      if (vieuxDus.length) w.push(["r", vieuxDus.length + (vieuxDus.length > 1 ? " élèves doivent" : " élève doit") + " encore payer depuis plus d'un mois", vieuxDus.slice(0, 4).map((p) => p.eleve_nom + " (" + F(p.reste) + ")").join(", ")]);
      else if (dus.length) w.push(["y", dus.length + (dus.length > 1 ? " élèves ont" : " élève a") + " un reste à payer", "Secrétariat → Paiements → À relancer"]);
      const annules = moisP.length ? pay.filter((p) => p.annule && p.jour >= iso(m0)) : pay.filter((p) => p.annule && p.jour >= iso(m0));
      if (annules.length) w.push(["o", annules.length + (annules.length > 1 ? " reçus annulés" : " reçu annulé") + " ce mois", annules.slice(0, 3).map((p) => "n° " + p.numero + (p.annule_motif ? " : " + p.annule_motif : "")).join(" · ")]);
      if (abs >= 3) w.push(["o", abs + " absences en conduite ce mois", "Moniteur → séances du jour"]);
      $("#sd-drWatch").innerHTML = w.length ? w.map((x) => '<div class="tm-row"><div class="tm-time"><i class="tm-dot tm-dot-' + x[0] + '"></i></div><div class="tm-main"><b>' + esc(x[1]) + "</b><span>" + esc(x[2]) + "</span></div></div>").join("") : '<p class="tm-empty">Rien à signaler. Tout est à jour.</p>';
      // Derniers mouvements
      const feed = [...eleves.slice(0, 10).map((x) => ({ t: x.cree_le, h: "<b>" + esc(x.nom) + "</b><span>" + (x.source === "site" ? "Pré-inscription sur le site" : "Ajouté au bureau · " + srcOf(x)) + " · " + esc(x.formation || "") + "</span>" })),
        ...pay.slice(0, 10).map((p) => ({ t: p.cree_le, h: "<b>" + esc(p.eleve_nom) + " · " + F(p.montant) + (p.annule ? " (annulé)" : "") + "</b><span>" + esc(p.motif) + " · " + esc(p.mode) + "</span>" }))]
        .sort((a, b) => (a.t < b.t ? 1 : -1)).slice(0, 8);
      $("#sd-drFeed").innerHTML = feed.length ? feed.map((x) => '<div class="tm-row"><div class="tm-time tm-small">' + new Date(x.t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + '</div><div class="tm-main">' + x.h + "</div></div>").join("") : '<p class="tm-empty">Aucune activité pour l\'instant.</p>';
      // 6 mois
      const months = []; for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1), d2 = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        months.push({ l: M[d.getMonth()].slice(0, 4) + ".", ins: eleves.filter((x) => new Date(x.cree_le) >= d && new Date(x.cree_le) < d2).length, enc: sum(okPay.filter((p) => p.jour >= iso(d) && p.jour < iso(d2))) }); }
      const maxE = Math.max(1, ...months.map((x) => x.enc));
      $("#sd-drMonths").innerHTML = months.map((x) => '<div class="tm-mo"><div class="tm-bar-v"><i style="height:' + Math.max(2, Math.round((x.enc / maxE) * 100)) + '%"></i></div><b>' + (x.enc ? Math.round(x.enc / 1000) + " k" : "0") + '</b><span>' + x.l + "</span><small>" + x.ins + " inscr.</small></div>").join("");
    }
    $("#sd-drReload").addEventListener("click", loadDir);

    // ---- Installer l'application (page /equipe/)
    if (window.SODAF_APP) {
      const box = $("#sd-tmInstall"), btn = $("#sd-tmInstallBtn"), txt = $("#sd-tmInstallTxt");
      const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const later = S.get("installLater", 0) > Date.now();
      const showBox = () => { if (!standalone && !later) box.hidden = false; };
      if (ios) { txt.innerHTML = "Dans Safari : touche <b>Partager</b> (le carré avec une flèche) puis <b>Sur l'écran d'accueil</b>."; btn.hidden = true; showBox(); }
      else if (window.__bip) showBox();
      document.addEventListener("sodaf-bip", showBox);
      btn.addEventListener("click", async () => { const e = window.__bip; if (!e) { txt.textContent = "Ouvre le menu ⋮ de Chrome puis « Installer l'application » ou « Ajouter à l'écran d'accueil »."; return; } e.prompt(); try { await e.userChoice; } catch (er) {} window.__bip = null; box.hidden = true; });
      $("#sd-tmInstallX").addEventListener("click", () => { box.hidden = true; S.set("installLater", Date.now() + 14 * 864e5); });
      window.addEventListener("appinstalled", () => (box.hidden = true));
    }

    // ---- Moniteur
    const THEMES = [...$$("article.ch").map((c) => c.dataset.title)];
    let appelEdit = null; // séance dont on modifie l'appel déjà validé
    async function loadMon() {
      if (!me) return;
      const today = iso(new Date());
      const s0 = await run(() => DB.q("seances_code?select=*&jour=gte." + today + "&statut=neq.Annulé&order=jour&limit=12"));
      if (s0) {
        const s1 = eleves.length ? s0.filter((x) => !x.groupe || eleves.some((y) => y.groupe_code === x.groupe && enCode(y) && !susp(y) && cycleOk(y))) : s0; // un groupe sans élève : pas de cours à faire
        const ses = s1.filter((x) => x.jour === (s1[0] && s1[0].jour)).sort((a, b) => hmin(a.heure) - hmin(b.heure));
        if (monIdx >= ses.length) monIdx = 0;
        const se = ses[monIdx], picker = ses.length > 1 ? '<div class="gc-ses">' + ses.map((x, i) => '<button type="button" class="btn btn-sm ' + (i === monIdx ? "btn-green" : "btn-line") + '" data-mses="' + i + '">' + esc(x.groupe ? (gOf(x.groupe) || { nom: "Groupe " + x.groupe }).nom : "Rattrapage") + " · " + esc(x.heure.split(" – ")[0]) + "</button>").join("") + "</div>" : "";
        if (!se) { $("#sd-mcTitle").textContent = "Aucune séance prévue"; $("#sd-mcBody").innerHTML = ""; }
        else {
          const pr = await run(() => DB.q("presences?select=eleve_id&seance_id=eq." + se.id)) || [];
          const ids = new Set(pr.map((x) => x.eleve_id));
          const act = eleves.filter((x) => enCode(x) && !susp(x) && (!se.groupe || (x.groupe_code === se.groupe && cycleOk(x)))).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
          $("#sd-mcTitle").textContent = (se.jour === today ? "Aujourd'hui" : longDay(se.jour).replace(/^./, (c) => c.toUpperCase())) + " · " + (se.groupe ? (gOf(se.groupe) || { nom: "Groupe " + se.groupe }).nom + " · " : "") + (se.groupe && bIdx(se.theme) >= 0 ? "Cours " + (bIdx(se.theme) + 1) + "/12 : " + se.theme : se.type) + " · " + se.heure + (se.statut === "Fait" ? " ✓" : "");
          const bi = se.groupe ? bIdx(se.theme) : -1, bo = bi >= 0 ? BOUCLE[bi] : null, lock = se.statut === "Fait" && appelEdit !== se.id;
          $("#sd-mcBody").innerHTML = picker + (se.groupe ? "" : '<p class="tm-note" style="margin:0 0 8px!important">Séance commune : élèves de tous les groupes qui ont manqué un cours ou veulent s\'entraîner. 6 places au maximum. Choisis le cours que tu rattrapes : il compte pour les présents.</p>') +
            (bo ? '<div class="mc-plan"><b>Au programme</b><ol><li><b>Début</b> : ' + debutCours(bi) + (BOUCLE[(bi + 11) % 12].dv !== null ? " (Mode classe → Devoir)" : "") + ".</li><li><b>Cours</b> : " + (bo.dv !== null ? "chapitres " + esc(chNoms(bo)) + " (Mode classe → Leçon)" : bo.n === 11 ? "révision de tous les thèmes : quiz, panneaux, situations" : "examen blanc de 40 questions (Mode classe → Quiz)") + ".</li>" + (bo.dv !== null ? "<li><b>Fin</b> : rappelle le devoir " + DEV[bo.dv].l + " à faire sur autosodaf.com.</li>" : "") + "</ol></div>" : "") +
            (se.groupe ? "" : '<div class="field"><label for="sd-mcTheme">Cours rattrapé</label><select id="sd-mcTheme"><option value="">— Choisir —</option><optgroup label="Programme (12 cours)">' + BOUCLE.map((b) => "<option" + (b.t === se.theme ? " selected" : "") + ' value="' + esc(b.t) + '">' + b.n + ". " + esc(b.t) + "</option>").join("") + '</optgroup><optgroup label="Autre chapitre">' + THEMES.filter((t) => bIdx(t) < 0).map((t) => "<option" + (t === se.theme ? " selected" : "") + ">" + esc(t) + "</option>").join("") + "</optgroup>" + (se.theme && bIdx(se.theme) < 0 && !THEMES.includes(se.theme) ? "<option selected>" + esc(se.theme) + "</option>" : "") + "</select></div>") +
            // L'appel : au début du cours, le moniteur coche les présents puis valide ; le cours compte alors comme fait
            '<div class="mc-appel' + (lock ? " ok" : "") + '"><div class="mc-ah"><b>Présences</b><span id="sd-mcCnt">' + ids.size + " présent" + (ids.size > 1 ? "s" : "") + " sur " + act.length + "</span></div>" +
            (lock ? '<p class="mc-done">✓ Présences validées : cours fait' + (bo ? " (cours " + bo.n + "/12)" : "") + ".</p>" : '<p class="tm-note" style="margin:0 0 8px!important">Au début du cours, fais l\'appel : coche les élèves présents, puis valide les présences.</p>') +
            (act.length ? '<div class="tm-checks">' + act.map((x) => '<label><input type="checkbox" data-pe="' + x.id + '"' + (ids.has(x.id) ? " checked" : "") + (lock ? " disabled" : "") + "> " + esc(x.nom) + (waNum(x.telephone) ? '<a class="pe-tel" href="tel:+228' + waNum(x.telephone) + '" aria-label="Appeler ' + esc(x.nom) + '" title="Appeler"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg></a>' : "") + "</label>").join("") + "</div>" : '<p class="tm-empty">Aucun élève inscrit pour l\'instant.</p>') +
            (lock ? '<div class="tm-formact"><button class="btn btn-line btn-sm" type="button" id="sd-mcEdit">Modifier les présences</button></div>' : '<details class="mc-nt"' + (se.note ? " open" : "") + '><summary>Ajouter une note (facultatif)</summary><input id="sd-mcNote" aria-label="Note" value="' + esc(se.note || "") + '"></details><div class="tm-formact"><button class="btn btn-green btn-sm" type="button" id="sd-mcDone" data-id="' + se.id + '">Valider les présences (' + ids.size + " présent" + (ids.size > 1 ? "s" : "") + ")</button></div>") + "</div>";
          $$("#sd-mcBody [data-pe]").forEach((c) => c.addEventListener("change", async () => {
            const eid = +c.dataset.pe;
            if (c.checked) await run(() => DB.q("presences", { method: "POST", body: { seance_id: se.id, eleve_id: eid }, prefer: "return=minimal,resolution=ignore-duplicates" }));
            else await run(() => DB.q("presences?seance_id=eq." + se.id + "&eleve_id=eq." + eid, { method: "DELETE", prefer: "return=minimal" }));
            const k = $$("#sd-mcBody [data-pe]:checked").length, pl = k + " présent" + (k > 1 ? "s" : "");
            $("#sd-mcCnt").textContent = pl + " sur " + act.length; if ($("#sd-mcDone")) $("#sd-mcDone").textContent = "Valider les présences (" + pl + ")";
          }));
          if ($("#sd-mcEdit")) $("#sd-mcEdit").addEventListener("click", () => { appelEdit = se.id; loadMon(); });
          if ($("#sd-mcDone")) $("#sd-mcDone").addEventListener("click", async () => {
            const th = se.groupe ? se.theme : ($("#sd-mcTheme") && $("#sd-mcTheme").value) || null;
            if (!se.groupe && !th) { toast("Choisis d'abord le cours rattrapé"); return; }
            const ok = await run(() => DB.q("seances_code?id=eq." + se.id, { method: "PATCH", body: { theme: th, note: ($("#sd-mcNote") && $("#sd-mcNote").value.trim()) || null, statut: "Fait" }, prefer: "return=minimal" }), "Présences validées : cours fait");
            if (ok) { appelEdit = null; loadMon(); }
          });
        }
      }
      const c = await run(() => DB.q("creneaux_conduite?select=*&jour=eq." + today + "&eleve_id=not.is.null"));
      if ($("#sd-secAujSum") && s0 && c) { const nc = s0.filter((x) => x.jour === today && (!x.groupe || eleves.some((y) => y.groupe_code === x.groupe && enCode(y) && !susp(y) && cycleOk(y)))), af = nc.filter((x) => x.statut !== "Fait").length, rs = c.filter((x) => x.statut === "Réservé").length; $("#sd-secAujSum").textContent = (nc.length ? nc.length + " cours de code" + (af ? " (" + af + " appel" + (af > 1 ? "s" : "") + " à faire)" : " · appel fait") : "Pas de cours de code") + " · " + (c.length ? c.length + " séance" + (c.length > 1 ? "s" : "") + " de conduite" + (rs ? " (" + rs + " à venir)" : "") : "pas de conduite"); }
      if (c) {
        c.sort((a, b) => hmin(a.heure) - hmin(b.heure));
        $("#sd-mcList").innerHTML = c.length ? c.map((x) => { const el = eleves.find((y) => y.id === x.eleve_id) || { nom: "Élève", quota: null }; const num = el.quota ? (el.faits || 0) + (x.statut === "Fait" ? 0 : 1) : 0, ea = el.quota ? Math.max(1, el.quota - 2) : 0, aEval = el.quota && !el.evaluation && (el.faits || 0) >= ea && x.statut === "Fait"; return '<div class="tm-row" data-id="' + x.id + '"><div class="tm-time">' + esc(x.heure) + '</div><div class="tm-main"><b>' + (el.id ? '<button type="button" class="ms-el" data-goel="' + el.id + '">' + esc(el.nom) + "</button>" : esc(el.nom)) + (el.quota ? ' <em class="se-num' + (num >= ea ? " hot" : "") + '">Séance ' + Math.min(num, el.quota) + "/" + el.quota + (num === ea && !el.evaluation ? " · évaluation" : num >= el.quota ? " · dernière" : "") + "</em>" : "") + "</b><span>" + esc(x.statut) + (el.evaluation ? " · " + (el.evaluation === "pret" ? "jugé prêt pour l'examen" : "séances en plus conseillées") : "") + '</span>' + contactEl(el) + (aEval ? '<div class="se-mev"><span>Évaluation : est-il prêt pour l\'examen ?</span><button class="btn btn-green btn-sm" type="button" data-mev="pret" data-el="' + el.id + '">Prêt pour l\'examen</button><button class="btn btn-line btn-sm" type="button" data-mev="plus" data-el="' + el.id + '">Il lui faut des séances en plus</button></div>' : "") + '<input data-note placeholder="Note sur les progrès" value="' + esc(x.note || "") + '"></div><div class="tm-acts"><button class="btn btn-green btn-sm" type="button" data-set="Fait">Fait</button><button class="btn btn-line btn-sm" type="button" data-set="Absent">Absent</button></div></div>'; }).join("") : '<p class="tm-empty">Aucune séance réservée aujourd\'hui.</p>';
      }
    }
    $("#sd-mcCode").addEventListener("click", (e) => { const b = e.target.closest("[data-mses]"); if (b) { monIdx = +b.dataset.mses; loadMon(); } });
    $("#sd-mcList").addEventListener("click", async (e) => {
      const ge = e.target.closest("[data-goel]"); if (ge) { goEleve(+ge.dataset.goel); return; }
      const ev = e.target.closest("[data-mev]");
      if (ev) { const el = eleves.find((y) => y.id === +ev.dataset.el); if (el) { const v = ev.dataset.mev; await run(() => DB.q("eleves?id=eq." + el.id, { method: "PATCH", body: { evaluation: v, evaluation_le: new Date().toISOString() }, prefer: "return=minimal" }), v === "pret" ? "Noté : prêt pour l'examen" : "Noté : séances en plus conseillées"); await addSuivi(el, "Note", v === "pret" ? "Évaluation (moniteur) : prêt pour l'examen" : "Évaluation (moniteur) : séances en plus conseillées"); await loadEleves(true); loadMon(); } return; }
      const b = e.target.closest("[data-set]"); if (!b) return; const row = b.closest("[data-id]");
      await run(() => DB.q("creneaux_conduite?id=eq." + row.dataset.id, { method: "PATCH", body: { statut: b.dataset.set, note: row.querySelector("[data-note]").value.trim() || null, modifie_le: new Date().toISOString() }, prefer: "return=minimal" }), "Séance : " + b.dataset.set);
      await loadEleves(true); loadMon();
    });

    window.TEAM_ELEVES = () => eleves;
    // Pour le message du reçu de solde : son groupe de code (ou sa place rétablie) et ses séances de conduite
    window.TEAM_INFO = (id) => { const x = eleves.find((y) => y.id === id); if (!x) return null; const g = !sansCode(x) && x.groupe_code && gOf(x.groupe_code), sp = susp(x);
      return { code: !sansCode(x), susp: sp, fini: !!g && !cycleOk(x), groupe: g && cycleOk(x) && (!sp || occ(g.id) < g.places) ? g.nom + " (" + gJours(g) + ", " + g.heure + ")" : null, quota: x.quota }; }; window.TEAM_RELOAD_PAY = () => { if (!$('.tm-sec[data-s="paiements"]').hidden) loadPay(); };
    // ---- Mise à jour automatique : nouvelles pré-inscriptions, inscriptions en ligne… sans recharger la page
    const sig = (x) => x ? JSON.stringify([x.statut, x.nom, x.telephone, x.formation, x.quartier, x.accueil_le, x.appels, x.rappel, x.dossier_envoye_le, x.dossier_relance_le, x.dossier_relances, x.archive_motif, x.archive_le, x.notes, x.dossier, x.web && x.web.id, x.solde, x.examen_etape, x.examen_lien_le, x.examen_paye, x.examen_bordereau_le, x.examen_depose_le, x.examen_resultat, x.examen_passages, x.quota, x.faits, x.resa, x.evaluation, x.groupe_code, x.groupe_depuis, x.groupe_msg_le, x.solde_rappels, x.ins_le]) : "";
    let polling = false;
    async function poll() {
      if (!me || polling || document.hidden || !DB.session) return;
      polling = true;
      try {
        const [r, wb, pr, cr, gr] = await Promise.all([DB.q("eleves?select=*&order=cree_le.desc&limit=2000"), DB.q("inscriptions_web?select=*&order=le.desc&limit=2000"), DB.q(PAY_Q), DB.q(CR_Q), DB.q("groupes_code?select=*&order=ordre")]);
        const gChanged = !!gr && JSON.stringify(gr) !== JSON.stringify(GROUPES); if (gr) GROUPES = gr;
        const W = {}; (wb || []).forEach((w) => { if (!W[w.eleve_id]) W[w.eleve_id] = w; });
        attach(r, pr, cr);
        r.forEach((x) => { x.web = W[x.id] && W[x.id].statut === "Nouveau" ? W[x.id] : null; });
        const old = {}; eleves.forEach((x) => (old[x.id] = x));
        const nouveaux = r.filter((x) => !old[x.id] && x.source === "site");
        const payes = r.filter((x) => x.web && (!old[x.id] || !old[x.id].web || old[x.id].web.id !== x.web.id));
        const changed = gChanged || r.length !== eleves.length || r.some((x) => sig(x) !== sig(old[x.id]));
        if (changed) {
          const selBefore = sig(old[pcSel]), selAfter = sig(r.find((x) => x.id === pcSel));
          const editing = document.activeElement && $("#sd-pcDetail").contains(document.activeElement) && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
          eleves = r;
          $("#sd-cntNew").textContent = (eleves.filter((y) => y.statut === "Nouveau").length + eleves.filter((y) => y.web && y.web.mode === "mixx" && etapeOf(y) === "dossier").length) || "";
          renderList(editing || selBefore === selAfter ? pcSel : null);
          fillEleveSelect();
        } else if (etats() !== lastEtats) { // un délai vient d'être atteint (rappel, suspension, fin de cycle) : la liste et la fiche se remettent à jour
          const editing = document.activeElement && $("#sd-pcDetail").contains(document.activeElement) && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
          renderList(editing ? pcSel : null);
        }
        autoPlace();
        if (nouveaux.length) toast(nouveaux.length > 1 ? nouveaux.length + " nouvelles pré-inscriptions" : "Nouvelle pré-inscription : " + nouveaux[0].nom);
        else if (payes.length) toast(payes[0].web.mode === "mixx" ? "Paiement Mixx à vérifier : " + payes[0].nom : payes[0].nom + " a finalisé son inscription (paiera à l'agence)");
        const nb = +($("#sd-cntNew").textContent || 0) + (MS.total || 0);
        document.title = (nb ? "(" + nb + ") " : "") + (window.SODAF_APP ? "SODAF Équipe" : document.title.replace(/^\(\d+\) /, ""));
      } catch (e) {}
      polling = false;
    }
    setInterval(poll, 20000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) poll(); });
    window.addEventListener("focus", poll);

    if (DB.session) start(); else show(false);
    return { toast, run, get me() { return me; }, reloadPay: () => loadPay(), get eleves() { return eleves; } };
  })();

  { const qc = $("#sd-qcount"); if (qc) qc.textContent = Q.length; }
  // mode classe
  const cls = (function () {
    const stage = $("#sd-clsStage"), wrap = $("#sd-clsStageWrap"), sel = $("#sd-clsSel"), cnt = $("#sd-clsCount");
    const prevB = $("#sd-clsPrev"), nextB = $("#sd-clsNext"), revB = $("#sd-clsReveal");
    const chs = $$("article.ch");
    let mode = "lecon", items = [], i = 0, shown = false;
    const esc = escHtml;
    function lessonSlides(id) {
      const art = root.querySelector("#" + id), idx = chs.indexOf(art);
      const out = ['<div class="cls-title"><p class="cls-kicker">' + esc(art.dataset.part) + " · Chapitre " + (idx + 1) + " / " + chs.length + '</p><h1 class="cls-h1">' + esc(art.dataset.title) + '</h1><div class="cls-bar"></div></div>'];
      let cur = [], w = 0;
      const flush = () => { if (cur.length) out.push(cur.join("")); cur = []; w = 0; };
      const onlyHead = () => cur.length === 1 && /^<h4/i.test(cur[0]);
      [...art.children].forEach((el) => {
        if (el.tagName === "HEADER") return;
        const c = el.cloneNode(true); c.querySelectorAll(".read-btn, .read-foot").forEach((b) => b.remove());
        const html = c.outerHTML, len = c.textContent.length;
        if (el.tagName === "H4") { flush(); cur.push(html); return; }
        if (el.matches("dl.dl")) {
          const head = onlyHead() ? cur[0] : ""; if (!head) flush(); cur = []; w = 0;
          const rows = [...c.children];
          for (let k = 0; k < rows.length; k += 3) out.push((k === 0 ? head : "") + '<dl class="dl">' + rows.slice(k, k + 3).map((r) => r.outerHTML).join("") + "</dl>");
          return;
        }
        if (el.matches(".sits")) { flush(); [...c.children].forEach((card) => out.push('<div class="cls-sitwrap">' + card.querySelector("svg").outerHTML + "<div>" + [...card.children].filter((x) => x.tagName !== "svg").map((x) => x.outerHTML).join("") + "</div></div>")); return; }
        if (el.matches(".tbl,.signs,.grid,.mnemo,.fig")) {
          if (!onlyHead() && w > 160) flush();
          cur.push(html); flush(); return;
        }
        if (w + len > 380 && cur.length && !onlyHead()) flush();
        cur.push(html); w += len;
      });
      flush();
      return out;
    }
    function fillSelect() {
      if (mode === "lecon") { const cj = BOUCLE[coursDuJour()].ch; sel.innerHTML = chs.map((c, k) => '<option value="' + c.id + '"' + (c.id === cj[0] ? " selected" : "") + ">" + (k + 1) + ". " + esc(c.dataset.title) + (cj.includes(c.id) ? " (cours du jour)" : "") + "</option>").join(""); }
      else if (mode === "quiz") {
        const ids = [...new Set(Q.map((q) => q[4]))];
        sel.innerHTML = '<option value="all:10">10 questions au hasard</option><option value="all:20">20 questions au hasard</option><option value="all:40"' + (BOUCLE[coursDuJour()].n === 12 ? " selected" : "") + '>Examen blanc · 40 questions</option><option value="all:99">Toutes les questions (' + Q.length + ")</option>" +
          ids.map((id) => '<option value="' + id + '">Chapitre : ' + esc(chTitle(id)) + "</option>").join("");
      } else if (mode === "devoir") { const cw = devCorr(); sel.innerHTML = DEV.map((d, k) => '<option value="' + k + '"' + (k === cw ? " selected" : "") + ">Devoir " + d.l + " · " + esc(d.t) + (k === cw ? " (à corriger aujourd'hui)" : "") + "</option>").join(""); }
      else if (mode === "situations") sel.innerHTML = '<option value="all">Toutes les situations (' + SITS.length + ")</option>" + SITS.map((x) => '<option value="' + x.id + '">' + esc(x.t) + "</option>").join("");
      else sel.innerHTML = SIGN_FAMILIES.map(([k, l]) => '<option value="' + k + '">' + esc(l) + "</option>").join("");
    }
    function load() {
      const v = sel.value; i = 0; shown = false;
      if (mode === "lecon") items = lessonSlides(v);
      else if (mode === "quiz") {
        if (v.startsWith("all:")) items = shuffle(Q).slice(0, +v.split(":")[1]);
        else items = shuffle(Q.filter((q) => q[4] === v));
        items = items.map((q) => ({ q, shown: false })).concat([{ end: true }]);
      } else if (mode === "devoir") items = DEV[+v].q.map((q) => ({ q, shown: false })).concat([{ end: true }]);
      else if (mode === "situations") items = (v === "all" ? SITS : SITS.filter((x) => x.id === v)).map((x) => ({ x, shown: false }));
      else items = shuffle(SIGNS.filter((g) => v === "tous" || g.f === v)).map((g) => ({ g, shown: false }));
      render();
    }
    function fit() {
      stage.style.zoom = 1;
      const W = wrap.clientWidth - 40, H = wrap.clientHeight - 48, h = stage.scrollHeight;
      const z = Math.max(0.38, Math.min(W / 900, H / Math.max(h, 1), 2.3));
      stage.style.zoom = z;
    }
    function render() {
      const it = items[i], n = items.length;
      revB.hidden = true;
      if (mode === "lecon") stage.innerHTML = '<div class="cls-slide">' + it + "</div>";
      else if (mode === "quiz" || mode === "devoir") {
        if (it.end && mode === "devoir") stage.innerHTML = '<div class="cls-title"><p class="cls-kicker">Fin de la correction</p><h1 class="cls-h1">Devoir ' + DEV[+sel.value].l + ' corrigé !</h1><p style="margin-top:16px;font-size:1.2rem;color:var(--muted)">Ceux qui ne l\'ont pas encore fait : autosodaf.com → Devoirs.</p><div class="cls-bar"></div></div>';
        else if (it.end) stage.innerHTML = '<div class="cls-title"><p class="cls-kicker">Fin de la série</p><h1 class="cls-h1">Bravo à tous !</h1><p style="margin-top:16px;font-size:1.2rem;color:var(--muted)">Reprenez ensemble les questions qui ont posé problème, puis révisez sur autosodaf.com.</p><div class="cls-bar"></div></div>';
        else {
          const q = it.q;
          const body = '<p class="cls-kicker">' + (mode === "devoir" ? "Devoir " + DEV[+sel.value].l + " · " : "") + "Question " + (i + 1) + " / " + (n - 1) + " · " + esc(chTitle(q[4])) + '</p><h2 class="cls-qt">' + esc(q[0]) + '</h2><div class="cls-opts">' +
            q[1].map((o, k) => '<div class="cls-opt' + (it.shown ? (k === q[2] ? " good" : " dim") : "") + '"><b>' + "ABCD"[k] + "</b><span>" + esc(o) + "</span></div>").join("") + "</div>" +
            (it.shown ? '<div class="cls-exp"><b>Réponse ' + "ABCD"[q[2]] + ".</b> " + esc(q[3]) + "</div>" : "");
          stage.innerHTML = q[5] ? '<div class="cls-sitwrap">' + (q[5].startsWith("p:") ? '<div class="cls-signq">' + signSVG(q[5].slice(2)) + "</div>" : SCENE(q[5])) + "<div>" + body + "</div></div>" : body;
          revB.hidden = it.shown;
        }
      } else if (mode === "situations") {
        const x = it.x;
        stage.innerHTML = '<div class="cls-sitwrap">' + SCENE(x.id) + '<div><p class="cls-kicker">Situation ' + (i + 1) + " / " + n + " · " + esc(x.t) + '</p><h2 class="cls-qt">' + esc(x.q) + "</h2>" +
          (it.shown ? '<div class="cls-exp"><b>' + esc(x.a) + "</b> " + esc(x.e) + "</div>" : '<p class="cls-ask">Réfléchissez, puis montrez la réponse.</p>') + "</div></div>";
        revB.hidden = it.shown;
      } else {
        const g = it.g;
        stage.innerHTML = '<div class="cls-sign">' + g.s + (it.shown ? '<div class="cls-ans">' + esc(g.n) + '</div><div class="cls-desc">' + esc(g.d) + "</div>" : '<div class="cls-ask">Quel est ce panneau ?</div>') + "</div>";
        revB.hidden = it.shown;
      }
      cnt.textContent = n ? (i + 1) + " / " + n : "";
      prevB.disabled = i === 0;
      endAction = null; nextB.disabled = false; nextB.classList.remove("btn-yellow"); nextB.classList.add("btn-green"); nextB.textContent = "Suivant →";
      if (i >= n - 1) {
        nextB.classList.remove("btn-green"); nextB.classList.add("btn-yellow");
        if (mode === "lecon") {
          const k = sel.selectedIndex, nx = sel.options[k + 1];
          if (nx) { nextB.textContent = "Fin du chapitre · Chapitre suivant →"; endAction = () => { sel.selectedIndex = k + 1; load(); }; }
          else { nextB.textContent = "Fin du dernier chapitre · Revenir au 1er ↺"; endAction = () => { sel.selectedIndex = 0; load(); }; }
        } else if (mode === "quiz") { nextB.textContent = "Fin de la série · Nouvelle série ↺"; endAction = load; }
        else if (mode === "devoir") { const k = sel.selectedIndex, nx = (k + 1) % DEV.length; nextB.textContent = "Fin du devoir · Devoir " + DEV[nx].l + " →"; endAction = () => { sel.selectedIndex = nx; load(); }; }
        else if (mode === "panneaux") { nextB.textContent = "Fin des panneaux · Mélanger et recommencer ↺"; endAction = load; }
        else { nextB.textContent = "Fin des situations · Recommencer ↺"; endAction = load; }
        cnt.textContent = "Fin · " + cnt.textContent;
      }
      wrap.scrollTop = 0;
      requestAnimationFrame(fit);
    }
    const reveal = () => { const it = items[i]; if (mode !== "lecon" && it && !it.end && !it.shown) { it.shown = true; render(); return true; } return false; };
    const next = () => { if (i < items.length - 1) { i++; render(); } };
    const prev = () => { if (i > 0) { i--; render(); } };
    $("#sd-clsTabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; mode = b.dataset.m; $$("#sd-clsTabs button").forEach((x) => x.setAttribute("aria-selected", x === b)); fillSelect(); load(); });
    sel.addEventListener("change", load);
    let endAction = null;
    nextB.addEventListener("click", () => { if (i < items.length - 1) next(); else if (endAction) endAction(); }); prevB.addEventListener("click", prev); revB.addEventListener("click", reveal);
    const fsB = $("#sd-clsFs");
    const toggleFs = () => { const el = $("#sd-cls"); try { if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen(); } catch (e) {} };
    fsB.addEventListener("click", toggleFs);
    document.addEventListener("fullscreenchange", () => { fsB.textContent = document.fullscreenElement ? "Quitter le plein écran" : "Plein écran"; setTimeout(fit, 120); });
    window.addEventListener("resize", () => { if (!$('section[data-page="classe"]').hidden) fit(); });
    document.addEventListener("keydown", (e) => {
      if ($('section[data-page="classe"]').hidden || e.target === sel) return;
      const k = e.key;
      if (k === "ArrowRight" || k === "PageDown") { e.preventDefault(); next(); }
      else if (k === "ArrowLeft" || k === "PageUp") { e.preventDefault(); prev(); }
      else if (k === " " || k === "Enter") { e.preventDefault(); if (!reveal()) next(); }
      else if (k === "r" || k === "R") reveal();
      else if (k === "f" || k === "F") toggleFs();
    });
    fillSelect();
    return { open(m) { const b = m && $('#sd-clsTabs [data-m="' + m + '"]'); if (b && b.getAttribute("aria-selected") !== "true") { b.click(); return; } if (!items.length) load(); else render(); } };
  })();

  // panneaux
  const pgrid = $("#sd-pgrid"), pf = $("#sd-pf"), pq = $("#sd-pq"), prev = $("#sd-prev");
  let pfam = "tous";
  pf.innerHTML = SIGN_FAMILIES.map(([k, l]) => '<button role="tab" type="button" data-f="' + k + '" aria-selected="' + (k === "tous") + '">' + l + "</button>").join("");
  const norm = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  function renderSigns() {
    const q = norm(pq.value.trim());
    const list = SIGNS.filter((g) => (pfam === "tous" || g.f === pfam) && (!q || norm(g.n + " " + g.d).includes(q)));
    pgrid.innerHTML = list.map((g, i) => '<button type="button" class="pcard" data-i="' + i + '">' + g.s + '<div class="ptxt"><b>' + g.n + "</b><span>" + g.d + "</span></div><em class=\"preveal\">Touche pour voir</em></button>").join("");
    $("#sd-pempty").hidden = list.length > 0;
    $("#sd-phint").textContent = pfam === "tous" ? list.length + " panneaux. Choisis une famille pour réviser par forme et couleur." : FAMILY_HINT[pfam] + " " + list.length + " panneaux.";
  }
  pf.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; pfam = b.dataset.f; pf.querySelectorAll("button").forEach((x) => x.setAttribute("aria-selected", x === b)); renderSigns(); });
  pq.addEventListener("input", renderSigns);
  prev.addEventListener("change", () => { pgrid.classList.toggle("rev", prev.checked); pgrid.querySelectorAll(".pcard").forEach((c) => c.classList.remove("shown")); });
  pgrid.addEventListener("click", (e) => { const c = e.target.closest(".pcard"); if (c && prev.checked) c.classList.toggle("shown"); });
  renderSigns();


  // ---------- Page publique : finaliser son inscription (lien personnel envoyé par le secrétariat) ----------
  const INSC_FORMULES = {
    "Permis B": [["Formation complète (permis B)", 55000, "Sur 3 mois · 12 séances de conduite d'1 h"], ["Formation accélérée 2 mois (permis B)", 75000, "12 séances, planning plus serré"], ["Formation accélérée 1 mois (permis B)", 80000, "12 séances en 1 mois"], ["Formule courte (permis B)", 35000, "Tu sais déjà tenir un volant · 6 séances"]],
    "Permis A": [["Permis A (moto)", 30000, "Code complet et environ 6 séances de moto"]],
    "Pack A + B": [["Pack A + B (moto et voiture)", 80000, "Formation complète voiture + permis moto"]],
    "Remise à niveau": [["Remise à niveau", 20000, "4 séances d'1 h, évaluation comprise"]],
  };
  const MAPS = "https://www.google.com/maps/search/?api=1&query=6.168785%2C1.225462";
  const fmtF = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " F";
  const escI = escHtml;
  function inscDecode(str) { return JSON.parse(decodeURIComponent(escape(atob(str.replace(/-/g, "+").replace(/_/g, "/"))))); }
  function inscFindUs(aPayer, id) {
    return '<div class="insc-find"><div class="insc-map"><iframe title="Plan : SODAF Auto-École" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=6.168785,1.225462&z=17&output=embed"></iframe></div>' +
      '<div class="insc-addr"><p class="eyebrow">Nous trouver</p><h3>SODAF Auto-École</h3><p class="insc-big">412 Avenue Akei, Tokoin Tamé, Lomé</p><p><b>Repère :</b> en face de la caisse.</p>' +
      '<a class="btn btn-green" href="' + MAPS + '" target="_blank" rel="noopener">Ouvrir l\'itinéraire dans Google Maps</a>' +
      '<ul class="insc-list"><li><b>Bureau</b> : lundi – vendredi 8 h – 12 h 30 et 14 h 30 – 18 h · samedi 8 h – 12 h</li><li><b>Téléphone et WhatsApp</b> : <a href="tel:+22872544166">+228 72 54 41 66</a></li>' +
      (aPayer ? "<li><b>À apporter</b> : " + fmtF(aPayer) + " en espèces</li>" : "") +
      (id ? "<li><b>Ton N° client</b> : SO" + id + " (donne-le au secrétariat)</li>" : "") + '</ul><a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="' + WA + "?text=" + encodeURIComponent("Bonjour SODAF, je suis en route pour l'agence (N° client SO" + (id || "") + ").") + '">Prévenir l\'agence sur WhatsApp</a></div></div>';
  }
  async function inscPage(str) {
    const box = $("#sd-insc");
    let d = null;
    const mm = /^(\d+)-([A-Za-z0-9]{10,32})$/.exec(str || "");
    if (mm) {
      box.innerHTML = '<p class="insc-load">Chargement de ton dossier…</p>';
      try { const r = await DB.q("rpc/inscription_info", { method: "POST", body: { p_id: +mm[1], p_jeton: mm[2] }, anon: true }); if (r && r.p !== undefined) d = Object.assign({ i: +mm[1], j: mm[2] }, r); } catch (e) {}
      if (!d) { box.innerHTML = '<div class="card insc-msg"><h3>Ce lien n\'est plus valable</h3><p>Ton inscription est peut-être déjà faite, ou le lien a changé. Demande au secrétariat SODAF de te le renvoyer : +228 72 54 41 66.</p><a class="btn btn-wa" href="' + WA + '" target="_blank" rel="noopener">Écrire au secrétariat</a></div>' + inscFindUs(0, 0); return; }
    }
    try { if (!d) { d = inscDecode(str); if (!d.i || !d.j) throw 0; } } catch (e) { box.innerHTML = '<div class="card insc-msg"><h3>Ce lien est incomplet</h3><p>Demande au secrétariat SODAF de te le renvoyer sur WhatsApp : +228 72 54 41 66.</p><a class="btn btn-wa" href="' + WA + '" target="_blank" rel="noopener">Écrire au secrétariat</a></div>' + inscFindUs(0, 0); return; }
    const forms = INSC_FORMULES[d.f], done = S.get("insc" + d.i, null);
    if (!forms) { box.innerHTML = '<div class="card insc-msg"><h3>Bonjour ' + escI(d.p) + '</h3><p>Pour ta formation (' + escI(d.f || "à préciser") + '), le secrétariat prépare un devis avec toi. Écris-nous sur WhatsApp ou passe à l\'agence.</p><a class="btn btn-wa" href="' + WA + '" target="_blank" rel="noopener">Écrire au secrétariat</a></div>' + inscFindUs(0, d.i); return; }
    const exam = /Permis|Pack/.test(d.f), mixxOk = !!d.m;
    const show = (res) => {
      box.innerHTML = res.mode === "agence"
        ? '<div class="card insc-ok"><p class="eyebrow">Inscription enregistrée · N° client SO' + d.i + '</p><h3>Merci ' + escI(d.p) + ', nous t\'attendons à l\'agence !</h3><p>Viens avec <b>' + fmtF(res.a) + '</b> en espèces. Tu repars avec ton reçu officiel.</p><button class="linkbtn" type="button" id="sd-inRedo">Modifier mon inscription</button></div>' + inscFindUs(res.a, d.i)
        : '<div class="card insc-ok"><p class="eyebrow">Paiement envoyé · N° client SO' + d.i + '</p><h3>Merci ' + escI(d.p) + ' !</h3><p>Le secrétariat vérifie ton paiement Mixx by Yas de <b>' + fmtF(res.a) + '</b> et t\'envoie ton <b>reçu officiel sur WhatsApp</b> (aux heures de bureau).</p><button class="linkbtn" type="button" id="sd-inRedo">Modifier mon inscription</button></div>' + inscFindUs(0, d.i);
      $("#sd-inRedo").addEventListener("click", () => { S.set("insc" + d.i, null); inscPage(str); });
      window.scrollTo({ top: Math.max(0, box.getBoundingClientRect().top + window.scrollY - 90) });
    };
    if (done) { show(done); return; }
    box.innerHTML = '<form class="insc-form" id="sd-inForm" novalidate>' +
      '<div class="insc-hello"><p class="eyebrow">N° client SO' + d.i + ' · ' + escI(d.f) + '</p><h2>Bonjour ' + escI(d.p) + ' 👋</h2><p>Trois petites étapes et ton inscription est faite.</p></div>' +
      '<fieldset class="insc-step"><legend><i>1</i>Ta formule</legend><div class="insc-cards">' + forms.map((f, k) => '<label class="rcm' + (k ? "" : " on") + '"><input type="radio" name="inF" value="' + k + '"' + (k ? "" : " checked") + '><span><b>' + escI(f[0].replace(/ \(permis B\)$/, "")) + "</b><small>" + escI(f[2]) + "</small></span><em>" + fmtF(f[1]) + "</em></label>").join("") + "</div>" +
      '<div class="insc-cards insc-two"><label class="rcm on"><input type="radio" name="inP" value="moitie" checked><span><b>Je paie la moitié maintenant</b><small>Le reste dans les 2 semaines</small></span><em data-p="moitie"></em></label><label class="rcm"><input type="radio" name="inP" value="total"><span><b>Je paie tout maintenant</b><small>Formation soldée, plus rien à payer</small></span><em data-p="total"></em></label></div>' +
      '<p class="insc-sum" id="sd-inSum"></p></fieldset>' +
      '<fieldset class="insc-step"><legend><i>2</i>Tes informations</legend><p class="insc-hint">Vérifie et corrige si besoin.</p><div class="insc-grid">' +
      '<div class="field"><label for="sd-inNom">Nom</label><input id="sd-inNom" autocomplete="family-name" maxlength="60" value="' + escI(d.nf || "") + '"></div><div class="field"><label for="sd-inPre">Prénoms</label><input id="sd-inPre" autocomplete="given-name" maxlength="80" value="' + escI(d.pr || d.nc || d.p || "") + '"></div>' +
      '<div class="field"><label for="sd-inTel">Téléphone / WhatsApp</label><div class="tel"><span>+228</span><input id="sd-inTel" inputmode="numeric" maxlength="11" value="' + escI(String(d.t || "").replace(/\D/g, "").replace(/^228/, "").replace(/(\d{2})(?=\d)/g, "$1 ")) + '"></div></div><div class="field"><label for="sd-inQ">Quartier</label><input id="sd-inQ" maxlength="80" placeholder="Ex. Bè, Adidogomé" value="' + escI(d.q || "") + '"></div>' +
      "</div></fieldset>" +
      '<fieldset class="insc-step"><legend><i>3</i>Comment veux-tu payer ?</legend><div class="insc-cards insc-two">' +
      '<label class="rcm on"><input type="radio" name="inM" value="agence" checked><span><b>À l\'agence</b><small>En espèces, au 412 Avenue Akei, Tokoin Tamé</small></span></label>' +
      '<label class="rcm' + (mixxOk ? "" : " off") + '"><input type="radio" name="inM" value="mixx"' + (mixxOk ? "" : " disabled") + '><span><b>Par Mixx by Yas (T-Money)</b><small>' + (mixxOk ? "Depuis ton téléphone, sans te déplacer" : "Bientôt disponible : pour l'instant, paie à l'agence") + "</small></span></label></div>" +
      '<div class="insc-mixx" id="sd-inMixx" hidden><ol><li>Sur ton téléphone, envoie <b id="sd-inAmt"></b> par Mixx by Yas au <b>' + escI(d.m) + "</b>" + (d.n ? " (" + escI(d.n) + ")" : "") + ".</li><li>Motif : <b>SO" + d.i + "</b></li><li>Écris ci-dessous le numéro qui a payé et la référence du SMS de confirmation.</li></ol>" +
      '<div class="insc-grid"><div class="field"><label for="sd-inMt">Numéro qui a payé</label><div class="tel"><span>+228</span><input id="sd-inMt" inputmode="numeric" maxlength="11" placeholder="90 00 00 00"></div></div><div class="field"><label for="sd-inMr">Référence de la transaction (SMS)</label><input id="sd-inMr" maxlength="60" placeholder="Ex. MP2410…"></div></div></div>' +
      "</fieldset>" +
      (exam ? '<p class="insc-note">À la fin de ta formation : <b>30&nbsp;000&nbsp;F</b> pour l\'inscription à l\'examen d\'État et tes papiers (carte d\'identité, acte de naissance, 2 photos). SODAF dépose ton dossier ; l\'État t\'envoie ensuite la date et le lieu par message.</p>' : "") +
      '<p class="insc-err" id="sd-inErr" hidden></p><button class="btn btn-green insc-go" type="submit" id="sd-inGo">Valider mon inscription</button></form>';
    const form = $("#sd-inForm");
    const val = () => { const f = forms[+form.querySelector("[name=inF]:checked").value], p = form.querySelector("[name=inP]:checked").value; return { f, p, a: 5000 + (p === "total" ? f[1] : f[1] / 2) }; };
    const upd = () => {
      const v = val();
      form.querySelector('[data-p="moitie"]').textContent = fmtF(5000 + v.f[1] / 2); form.querySelector('[data-p="total"]').textContent = fmtF(5000 + v.f[1]);
      $("#sd-inSum").innerHTML = "À payer maintenant : <b>" + fmtF(v.a) + "</b> <span>(droit d'inscription 5&nbsp;000&nbsp;F + " + (v.p === "total" ? "toute la formation" : "la moitié de la formation") + ")</span>" + (v.p === "moitie" ? "<span>Reste à payer avant la 1re séance de conduite : " + fmtF(v.f[1] / 2) + "</span>" : "");
      $("#sd-inAmt").textContent = fmtF(v.a);
      form.querySelectorAll(".rcm").forEach((l) => l.classList.toggle("on", l.querySelector("input").checked));
      $("#sd-inMixx").hidden = form.querySelector("[name=inM]:checked").value !== "mixx";
    };
    form.addEventListener("change", upd); upd();
    const tel8 = (el) => { let t = el.value.replace(/\D/g, ""); if (t.length > 8 && t.startsWith("228")) t = t.slice(3); return t; };
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = val(), mode = form.querySelector("[name=inM]:checked").value, err = $("#sd-inErr"), btn = $("#sd-inGo");
      const nom = $("#sd-inNom").value.trim(), pre = $("#sd-inPre").value.trim(), tl = tel8($("#sd-inTel")), mt = tel8($("#sd-inMt")), mr = $("#sd-inMr").value.trim();
      const bad = nom.length < 2 ? "Écris ton nom." : pre.length < 2 ? "Écris tes prénoms." : tl.length !== 8 ? "Ton numéro de téléphone doit avoir 8 chiffres (après le +228)." : mode === "mixx" && !(mt.length === 8 || mr.length >= 4) ? "Pour Mixx by Yas, écris le numéro qui a payé (8 chiffres) ou la référence du SMS." : "";
      if (bad) { err.textContent = bad; err.hidden = false; err.scrollIntoView({ block: "center" }); return; }
      err.hidden = true; btn.disabled = true; btn.textContent = "Envoi…";
      const row = { eleve_id: d.i, jeton: d.j, formule: v.f[0], prix: v.f[1], paiement: v.p, a_payer: Math.round(v.a), mode, mixx_tel: mode === "mixx" && mt ? "+228" + mt : null, mixx_ref: mode === "mixx" && mr ? mr : null,
        nom, prenoms: pre, telephone: "+228" + tl, quartier: $("#sd-inQ").value.trim() || null };
      const ok = await DB.add("inscriptions_web", row);
      btn.disabled = false; btn.textContent = "Valider mon inscription";
      if (!ok) { err.innerHTML = 'L\'envoi n\'a pas marché. Vérifie ta connexion et réessaie. Si ça continue, le lien a peut-être expiré : <a href="' + WA + '" target="_blank" rel="noopener">écris au secrétariat</a>.'; err.hidden = false; return; }
      const res = { mode, a: Math.round(v.a) }; S.set("insc" + d.i, res); show(res);
    });
  }

  function route() {
    const APP = !!window.SODAF_APP;
    if (!APP && (location.hash === "#documents" || location.hash.startsWith("#equipe"))) { location.replace("/equipe/" + (location.hash.startsWith("#equipe-") ? location.hash : "")); return; }
    const h = (location.hash || (APP ? "#equipe" : "#accueil")).slice(1);
    let p = h.split("-")[0]; if (!pages.includes(p)) p = APP ? "equipe" : "accueil";
    if (APP && !["equipe", "classe", "recu"].includes(p)) { if (location.hash && location.hash !== "#accueil") window.open("/" + location.hash, "_blank"); history.replaceState(null, "", "#equipe"); p = "equipe"; }
    if (p === "recu") rcPublic(h.slice(5));
    if (p === "inscrire") inscPage(h.slice(9));
    $$("section.page").forEach((s) => (s.hidden = s.dataset.page !== p));
    $$("#sd-nav [data-nav]").forEach((a) => a.classList.toggle("on", a.dataset.nav === p));
    nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false");
    if (p === "quiz") showBest();
    if (p === "classe") requestAnimationFrame(() => cls.open(h.split("-")[1]));
    if (p === "cours") requestAnimationFrame(() => requestAnimationFrame(spy));
    let target = null; try { target = h.includes("-") && p !== "recu" && p !== "inscrire" ? root.querySelector("#" + h) : null; } catch (e) {}
    requestAnimationFrame(() => { if (target) target.scrollIntoView({ block: "start" }); else window.scrollTo(0, 0); });
  }
  window.addEventListener("hashchange", route);
  route();
  return () => { window.removeEventListener("hashchange", route); timers.forEach((f) => f()); };
}


(function () {
  const CSS_REFONTE = String.raw`/* ===== Refonte visuelle (oct. 2026) : univers « la route » — asphalte, marquage jaune, vert SODAF, bleu panneau ===== */
#sodaf-root{--asph:#15191E;--asph2:#1E242B;--concrete:#F1F3F2;--sign:#1A4A85;--sign-d:#0E2A4E;
--f-display:"Barlow Condensed","Outfit","DejaVu Sans Condensed",system-ui,sans-serif;--f-ui:"Outfit","Figtree",system-ui,sans-serif;--f-mono:"Outfit","Figtree",system-ui,sans-serif}
/* Titres : lettrage de panneau, étroit et fort */
#sodaf-root h1,#sodaf-root h2{font-family:var(--f-display);font-weight:700;letter-spacing:-.005em;line-height:.96}
#sodaf-root h2{font-size:clamp(2.2rem,4.6vw,3.3rem)}
#sodaf-root h3{font-family:var(--f-ui);font-weight:700;letter-spacing:-.01em}
/* Petites étiquettes : plus calmes, en minuscules */
.eyebrow{font-family:var(--f-ui);font-size:.95rem;letter-spacing:0;text-transform:none;color:var(--green);font-weight:600;margin-bottom:6px!important}
.tag{font-family:var(--f-ui);letter-spacing:.01em;text-transform:none;font-size:.78rem;font-weight:600;border-radius:999px;padding:.22em .7em}
.logo-sub,.logo small,.rule small{font-family:var(--f-ui);letter-spacing:.06em}
/* Boutons */
.btn{font-weight:700}
#sodaf-root .btn-line{border-color:#CBD1D6}
/* En-tête du site */
header.top{background:rgba(255,255,255,.96)}
#sodaf-root nav.main a{font-family:var(--f-ui);font-weight:600}
#sodaf-root nav.main a.on{box-shadow:inset 0 -4px 0 var(--yellow)}
#sodaf-root header.top .bar>.btn-green{background:var(--asph);color:#fff}

/* ---- Accueil : bandeau asphalte, comme les autres pages ---- */
.hero{background:var(--asph);color:#fff;min-height:min(88vh,760px)}
.veil{background:linear-gradient(90deg,var(--asph) 0%,rgba(21,25,30,.95) 36%,rgba(21,25,30,.62) 60%,rgba(21,25,30,.18) 100%)}
.hero::after{display:none}
.greet{color:var(--yellow);font-family:var(--f-ui)}
#sodaf-root .hero h1{color:#fff;font-size:clamp(3.6rem,8.4vw,6.8rem);font-weight:800;line-height:.9;letter-spacing:-.01em}
.hero h1 em{color:#fff}
#sodaf-root .hero h1::after{content:"";display:block;width:min(340px,70%);height:8px;margin-top:20px;background:repeating-linear-gradient(90deg,var(--yellow) 0 44px,transparent 44px 70px)}
.hslogan{color:#fff;border-bottom:0;padding-bottom:0;margin-top:22px!important;font-family:var(--f-ui)}
.hero p.lead{color:#C3CAD1}
#sodaf-root .hero .btn-line{background:transparent;color:#fff;border-color:rgba(255,255,255,.4)}
#sodaf-root .hero .btn-line:hover{border-color:#fff}
#sodaf-root .hero .btn-green{background:var(--yellow);color:var(--asph)}
#sodaf-root .hero .btn-green:hover{box-shadow:0 12px 26px -12px rgba(242,177,0,.8)}
.facts{gap:20px 0;margin-top:40px}
.facts>div{padding:0 26px;border-left:1px solid rgba(255,255,255,.18)}.facts>div:first-child{padding-left:0;border-left:0}
.facts b{color:#fff;font-family:var(--f-display);font-size:2.6rem;font-weight:700}
.facts span{color:#9EA7B0}
.dots button{background:rgba(255,255,255,.22)}.dots button.on{background:var(--yellow)}
.lane{background:repeating-linear-gradient(90deg,var(--yellow) 0 46px,transparent 46px 80px);opacity:1;height:6px}
.rule{border:0;box-shadow:0 18px 40px -18px rgba(0,0,0,.6)}
@media (max-width:820px){.veil{background:linear-gradient(180deg,rgba(21,25,30,.25) 0%,rgba(21,25,30,.82) 34%,var(--asph) 56%)}.hero-in{padding-block:200px 110px}#sodaf-root .hero h1{font-size:clamp(3.2rem,15vw,4.6rem)}.facts>div{padding:0 16px}}
/* Barre des prix sous le bandeau */
.pricebar{border:0;border-radius:18px;box-shadow:0 24px 50px -28px rgba(0,0,0,.45);padding:20px 24px}
.pb-item{border-left-width:4px}.pb-item:first-child{border-left-color:var(--yellow)}
.pb-item b{font-family:var(--f-display);font-size:1.9rem;font-weight:700;letter-spacing:0}

/* ---- Rythme des sections ---- */
.sec{padding-top:88px}
.sec-head{margin-bottom:32px}
.sec-head p{font-size:1.02rem}
.band-soft{background:var(--concrete);padding-block:80px}
.band-dark{margin-top:88px;padding-block:84px;background:var(--asph)}
.band-dark .eyebrow{color:var(--yellow)}
.page-head{padding-block:64px 54px}
.page-head .eyebrow{color:var(--yellow)}
#sodaf-root .page-head h1{font-size:clamp(3rem,6.6vw,5.2rem);font-weight:800;line-height:.92}
#sodaf-root .page-head p.lead{margin-top:16px;font-size:1.1rem}

/* ---- Cartes : moins de traits, plus de hiérarchie ---- */
.card{border-color:#E3E7E5;border-radius:16px;padding:24px}
.band-soft .card,.band-soft .signals{border-color:transparent}
.card.soft{background:var(--concrete)}
.fico{width:46px;height:46px;border-radius:12px;background:var(--asph);color:var(--yellow)}
#sodaf-root .feat a.more{color:var(--ink);border-bottom:2px solid var(--yellow);align-self:flex-start;padding-bottom:1px}
.signals{border:0;border-radius:18px;box-shadow:0 1px 0 #E3E7E5}
#sodaf-root .signals a{padding:24px 22px}
.signals b{font-family:var(--f-display);font-size:1.35rem;font-weight:700;letter-spacing:0}
/* Formules */
.offer .cat{font-family:var(--f-display);font-size:2.8rem;font-weight:700;letter-spacing:0}
#sodaf-root .offer.star{background:var(--asph);border:0;color:#fff;box-shadow:0 26px 50px -28px rgba(0,0,0,.55)}
#sodaf-root .offer.star h3,#sodaf-root .offer.star .cat{color:#fff}
#sodaf-root .offer.star p,#sodaf-root .offer.star li{color:#C3CAD1}
#sodaf-root .offer.star .price{border-top-color:rgba(255,255,255,.18)}
#sodaf-root .offer.star .price b{color:#C3CAD1}
#sodaf-root .offer.star .btn-green{background:var(--yellow);color:var(--asph)}
#sodaf-root .offer.star .btn-line{background:transparent;color:#fff;border-color:rgba(255,255,255,.4)}
/* Parcours */
.stop i{font-family:var(--f-display);font-size:1.3rem;border-width:2.5px}
.stop:last-child i{background:var(--yellow);border-color:var(--yellow);color:var(--asph)}
.route::before{opacity:.28}
/* Bandeau final */
.band{border:0;background:var(--asph);color:#fff;border-radius:22px;padding:44px}
#sodaf-root .band h2{color:#fff}
.band p{color:#C3CAD1}
.band .zebra{background:repeating-linear-gradient(90deg,rgba(255,255,255,.07) 0 16px,transparent 16px 32px)}
#sodaf-root .band .btn-green{background:var(--yellow);color:var(--asph)}
/* Bandeau « code en salle » */
.classband{background:#fff;border:1.5px solid #E3E7E5;border-left:6px solid var(--yellow);border-radius:14px}
.classband .cb-t{font-family:var(--f-display);font-size:1.35rem}
/* Pied de page */
footer.site{background:var(--asph)}
/* Bouton WhatsApp flottant : plus discret */
#sodaf-root .wa-float{box-shadow:0 10px 24px -10px rgba(0,0,0,.45)}
/* Espace équipe : mêmes titres et chiffres */
/* ===== Espace équipe : application pro (barre latérale asphalte + zone de travail claire) ===== */
html:has(#sodaf-root.app-mode),body:has(#sodaf-root.app-mode){background:#ECEFEE}
#sodaf-root.app-mode{background:#ECEFEE}
#sodaf-root.app-mode section[data-page="equipe"]>.wrap{max-width:1440px}
#sodaf-root.app-mode header.top>.wrap{max-width:1440px}
@media (max-width:640px){#sodaf-root.app-mode .tm-top{padding:14px 16px}#sodaf-root.app-mode .tm-top .tm-today{font-size:.88rem}}
#sodaf-root.app-mode header.top{background:var(--asph);border-bottom:0}
#sodaf-root.app-mode header.top .logo{color:#fff}
#sodaf-root.app-mode header.top .logo svg path,#sodaf-root.app-mode header.top .logo svg rect{fill:#fff}
#sodaf-root.app-mode .logo-sub{color:var(--yellow);border-left-color:rgba(255,255,255,.2)}
/* Bandeau d'accueil compact, clair */
#sodaf-root.app-mode .tm-top{background:#fff;color:var(--ink);border:1px solid #DFE4E2;border-radius:16px;padding:18px 22px;margin-bottom:16px;box-shadow:none;align-items:center}
#sodaf-root.app-mode .tm-top::after{left:0;right:auto;top:0;bottom:0;width:5px;height:auto;background:repeating-linear-gradient(180deg,var(--yellow) 0 14px,transparent 14px 22px)}
#sodaf-root.app-mode .tm-top h2{color:var(--ink);font-size:clamp(1.7rem,3vw,2.2rem)}
#sodaf-root.app-mode .tm-top .eyebrow{color:var(--green);margin:0!important}
#sodaf-root.app-mode .tm-top .tm-today{color:var(--muted);font-size:.95rem}
#sodaf-root.app-mode .tm-top .linkbtn{color:var(--ink);font-weight:600}
/* Cartes et blocs : une seule famille, bordure fine, sans ombre lourde */
#sodaf-root.app-mode .card,#sodaf-root.app-mode .pc-list,#sodaf-root.app-mode .pc-block,#sodaf-root.app-mode .pc-none,#sodaf-root.app-mode .pc-info,#sodaf-root.app-mode .tm-stats div{border-color:#DFE4E2;box-shadow:none;border-radius:14px}
#sodaf-root.app-mode .tm-stats div.hl{background:var(--asph);border-color:var(--asph)}
#sodaf-root.app-mode .tm-role{background:transparent;border-left:0;padding:0!important;color:var(--muted);font-weight:500;font-size:.95rem;margin-bottom:14px!important}
#sodaf-root.app-mode .tm-sub h3{font-family:var(--f-display);font-size:1.6rem}
/* Sous-onglets : commande segmentée */
#sodaf-root.app-mode .tm-subnav{background:#fff;border:1px solid #DFE4E2;border-radius:14px;padding:6px;gap:4px;margin-bottom:16px;align-items:center}
#sodaf-root.app-mode .tm-subnav button[data-s]{border:0;margin:0;border-radius:10px;padding:.6em 1em;color:#4A525C}
#sodaf-root.app-mode .tm-subnav button[data-s]:hover{background:#F1F3F2;color:var(--ink)}
#sodaf-root.app-mode .tm-subnav button[data-s][aria-selected="true"]{background:var(--asph);color:#fff}
#sodaf-root.app-mode .tm-subnav .tm-newins{margin:0 0 0 auto}
/* Étapes du parcours */
#sodaf-root.app-mode .pc-stages{background:#F6F8F7;border-bottom-color:#DFE4E2}
#sodaf-root.app-mode .pc-stages button{border-color:#DFE4E2}
#sodaf-root.app-mode .pc-stages button[aria-selected="true"]{background:var(--asph);border-color:var(--asph)}
#sodaf-root.app-mode .pc-head h3{font-family:var(--f-display);font-size:2rem;font-weight:700}
/* Barre latérale (ordinateur) */
.tm-ic{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;flex-shrink:0;font-style:normal}
#sodaf-root .tm-ic svg{display:block}
@media (min-width:1100px){
#sodaf-root.app-mode #sd-teamPanel:not([hidden]){display:grid;grid-template-columns:248px minmax(0,1fr);column-gap:22px;align-items:start}
#sodaf-root.app-mode #sd-teamPanel>*{grid-column:2;min-width:0}
#sodaf-root.app-mode #sd-teamPanel>.tm-tabs{grid-column:1;grid-row:1/span 40;position:sticky;top:86px;display:flex;flex-direction:column;gap:4px;background:var(--asph);border-radius:18px;padding:12px;margin:0;overflow:hidden}
#sodaf-root.app-mode #sd-teamPanel>.tm-tabs::after{content:"";display:block;height:6px;margin:10px -12px -12px;background:repeating-linear-gradient(90deg,var(--yellow) 0 22px,transparent 22px 36px)}
#sodaf-root.app-mode .tm-tabs button{display:grid;grid-template-columns:34px 1fr;column-gap:12px;align-items:center;background:transparent;border:0;border-radius:12px;padding:10px;color:#C3CAD1;box-shadow:none}
#sodaf-root.app-mode .tm-tabs button .tm-ic{grid-row:1/span 2;background:rgba(255,255,255,.06);color:#9EA7B0}
#sodaf-root.app-mode .tm-tabs button b{font:700 1rem var(--f-ui);color:#fff}
#sodaf-root.app-mode .tm-tabs button small{color:#8D96A0;font-size:.78rem;line-height:1.3}
#sodaf-root.app-mode .tm-tabs button:hover{background:rgba(255,255,255,.05)}
#sodaf-root.app-mode .tm-tabs button[aria-selected="true"]{background:rgba(255,255,255,.1)}
#sodaf-root.app-mode .tm-tabs button[aria-selected="true"] .tm-ic{background:var(--yellow);color:var(--asph)}
}
/* Téléphone et tablette : barre d'onglets sombre, défilante */
@media (max-width:1099px){
#sodaf-root.app-mode .tm-tabs{display:flex;gap:6px;overflow-x:auto;background:var(--asph);border-radius:16px;padding:8px;scrollbar-width:none}
#sodaf-root.app-mode .tm-tabs button{flex:1 0 auto;display:flex;flex-direction:row;align-items:center;gap:8px;background:transparent;border:0;border-radius:11px;padding:8px 12px;color:#fff;box-shadow:none}
#sodaf-root.app-mode .tm-tabs button small{display:none}
#sodaf-root.app-mode .tm-tabs button b{font:700 .95rem var(--f-ui);color:#fff}
#sodaf-root.app-mode .tm-tabs button .tm-ic{width:28px;height:28px;background:rgba(255,255,255,.08);color:#C3CAD1}
#sodaf-root.app-mode .tm-tabs button[aria-selected="true"]{background:rgba(255,255,255,.12)}
#sodaf-root.app-mode .tm-tabs button[aria-selected="true"] .tm-ic{background:var(--yellow);color:var(--asph)}
}


.tm-stats b{font-family:var(--f-display);font-size:1.7rem;font-weight:700;letter-spacing:0}

/* En formation : grand en-tête + sections Rappel / Liste d'attente / Groupes / Suspendus */
.fm-head{background:var(--asph);color:#fff;padding:16px 16px 14px;position:relative}
.fm-head::after{content:"";position:absolute;left:0;right:0;bottom:0;height:4px;background:repeating-linear-gradient(90deg,var(--yellow) 0 22px,transparent 22px 36px)}
.fm-top{display:flex;justify-content:space-between;align-items:flex-end;gap:10px}
#sodaf-root .fm-head h4{margin:0;font-family:var(--f-display);font-size:1.75rem;font-weight:800;line-height:1;letter-spacing:0;color:#fff;text-transform:none}
.fm-head small{display:block;margin-top:5px;color:#AEB6BF;font-size:.86rem}
#sodaf-root .fm-head .linkbtn{color:#fff;font-weight:600;white-space:nowrap}
.fm-head .gc-tip{color:var(--yellow);margin-top:10px!important}
.fm-head .gc-man{margin-top:12px}.fm-head .gc-row{color:var(--ink)}
.pc-gh>span{align-self:center;line-height:1.5}
.pc-gh .gh-t{font-weight:inherit;display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px}
.pc-gh .gh-t small{font-weight:500;letter-spacing:0;text-transform:none;font-size:.78rem;opacity:.85}
.pc-gh.g-fdue{background:#D7263D;color:#fff;border-left:5px solid #8E0F20;font-size:.84rem}.pc-gh.g-fdue span{color:#8E0F20;font-weight:800}
.pc-gh.g-fwait{background:#FFF6D6;color:#6B4E00;border-left:5px dashed #E0A400;font-size:.8rem}.pc-gh.g-fwait span{font-weight:800}
.pc-gh.g-fgrp{background:#E3ECF7;color:#123A6B;border-left:5px solid var(--blue);font-size:.8rem}.pc-gh.g-fgrp span{font-weight:800;color:var(--ink)}
.pc-gh.g-fcond{background:var(--soft);color:#3D444D;border-left:5px solid #9AA3AB;font-size:.8rem}
.pc-gh.g-fsus{background:#3D444D;color:#fff;border-left:5px solid #15191E;font-size:.8rem}.pc-gh.g-fsus span{color:var(--ink);font-weight:800}
.pc-item.i-fdue{border-left-color:#D7263D;background:#FFF6F7}.pc-item.on.i-fdue{background:#FDE7EA}
.pc-item.i-fsus b{color:#5B636C}
.t-fdue{background:#D7263D;color:#fff}.t-fsus{background:#3D444D;color:#fff}.t-fwait{background:#FFF6D6;color:#6B4E00}.t-fhor{background:#FFF1C2;color:#6B4E00}.t-fpret{background:var(--green-soft);color:#064D36}.t-feval{background:#E3ECF7;color:#123A6B}.t-ffin{background:#FDE3D6;color:#7A2E0E}
.pc-gempty{margin:0!important;padding:10px 14px;font-size:.86rem;color:var(--muted);border-bottom:1px solid var(--line);background:#fff}
#sodaf-root .tm-formact .btn[disabled]{opacity:.55;cursor:not-allowed;box-shadow:none}

/* Couleurs des groupes de code (en-têtes pleins, bien distincts) : A bleu, B orange, C vert sarcelle (matin), D violet */
.pc-gh.gc-A,.pc-gh.gc-B,.pc-gh.gc-C,.pc-gh.gc-D{color:#fff}
.pc-gh.gc-A{background:#1F5FAE;border-left:5px solid #0F3A70}
.pc-gh.gc-B{background:#B45309;border-left:5px solid #7A3604}
.pc-gh.gc-C{background:#0B7570;border-left:5px solid #054642}
.pc-gh.gc-D{background:#7B3FB5;border-left:5px solid #4B2275}
.pc-gh.gc-A small,.pc-gh.gc-B small,.pc-gh.gc-C small,.pc-gh.gc-D small{opacity:.92}
.pc-fold.gc-A:hover,.pc-fold.gc-B:hover,.pc-fold.gc-C:hover,.pc-fold.gc-D:hover{filter:brightness(1.08)}
.pc-item.ig-A{border-left-color:#1F5FAE}.pc-item.on.ig-A{background:#EAF1FB}
.pc-item.ig-B{border-left-color:#B45309}.pc-item.on.ig-B{background:#FDF1E6}
.pc-item.ig-C{border-left-color:#0B7570}.pc-item.on.ig-C{background:#E6F4F3}
.pc-item.ig-D{border-left-color:#7B3FB5}.pc-item.on.ig-D{background:#F3ECFA}
.gb{font-style:normal;font-weight:700;font-size:.74rem;letter-spacing:.02em;padding:.05em .5em;border-radius:6px;color:#fff!important;background:#5B6B7D;white-space:nowrap;text-transform:none}
.gb-A{background:#1F5FAE}.gb-B{background:#B45309}.gb-C{background:#0B7570}.gb-D{background:#7B3FB5}
.pc-bh .gb{font-size:.78rem;margin-left:6px;vertical-align:1px}
.gdot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:7px;padding:0}
.pc-fold.g-fgrp,.pc-fold.g-fcond,.pc-fold.g-fsus{padding:9px 14px}
.pc-fold.g-fgrp[aria-expanded="false"]::after,.pc-fold.g-fcond[aria-expanded="false"]::after,.pc-fold.g-fsus[aria-expanded="false"]::after{content:"ouvrir";margin-left:0}

.pc-gh.gc-off{opacity:.62}
.pc-gempty .btn{margin-left:6px;vertical-align:middle}

/* Programme du code en boucle */
.prog{display:grid;gap:6px;margin-top:12px}
.prog-w{display:grid;grid-template-columns:150px 1fr 1fr;gap:6px 14px;align-items:center;padding:10px 14px;border-radius:12px;background:var(--soft);border:1px solid var(--line);font-size:.92rem}
.prog-w b{font-family:var(--f-ui);font-weight:700}.prog-w b small{display:block;font-weight:500;color:var(--muted);font-size:.78rem}
.prog-w span i{font-style:normal;font-weight:800;display:inline-grid;place-items:center;min-width:24px;height:24px;border-radius:7px;background:#fff;border:1px solid var(--line);margin-right:8px;font-size:.8rem}
.prog-w span em{font-style:normal;font-size:.74rem;color:var(--muted);margin-left:6px;white-space:nowrap}
.prog-w.now{background:var(--asph);color:#fff;border-color:var(--asph)}.prog-w.now b small,.prog-w.now span em{color:var(--yellow)}.prog-w.now span i{background:var(--yellow);border-color:var(--yellow);color:var(--asph)}
@media (max-width:700px){.prog-w{grid-template-columns:1fr}}
.tm-prog{margin-top:16px;padding:0!important}
.tm-prog>summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:16px 20px}
.tm-prog>summary::-webkit-details-marker{display:none}
.tm-prog>summary b{display:block;font-family:var(--f-display);font-size:1.35rem}.tm-prog>summary small{color:var(--muted);font-size:.86rem}
.tm-prog>summary em{font-style:normal;font-weight:600;color:var(--ink);border-bottom:2px solid var(--yellow);white-space:nowrap}
.tm-prog[open]>summary em{font-size:0}.tm-prog[open]>summary em::after{content:"Fermer";font-size:.95rem}
.tm-prog>div{padding:0 20px 18px}
.mc-plan{background:#FFF6D6;border-left:4px solid #E0A400;border-radius:10px;padding:10px 12px;margin:0 0 12px}
.mc-plan>b{display:block;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;color:#6B4E00}.mc-plan ol{margin:4px 0 0;padding-left:1.2em;font-size:.92rem}.mc-plan li{margin:2px 0}
.pc-cours{margin:8px 0 0!important;font-size:.9rem;color:#3D444D}
.devwk{margin:0 0 14px!important;color:var(--muted)}.devnow+.devnow{margin-top:-8px}

.mc-appel{border:1.5px solid var(--line);border-radius:14px;padding:12px 14px;margin-top:4px}
.mc-appel.ok{border-color:var(--green);background:var(--green-soft)}
.mc-ah{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:6px}
.mc-ah b{font-family:var(--f-display);font-size:1.25rem}.mc-ah span{font-weight:700;color:var(--muted);font-size:.9rem}
#sodaf-root .mc-done{margin:0 0 8px!important;font-weight:700;color:#064D36}
.mc-nt{margin:10px 0 0}.mc-nt summary{cursor:pointer;font-size:.88rem;color:var(--muted)}.mc-nt input{width:100%;margin-top:6px}
.tm-checks input[disabled]+*{opacity:1}

.tm-visio{position:relative;display:inline-flex;align-items:center;gap:10px;padding:6px 18px 6px 6px;border-radius:999px;color:#fff!important;text-decoration:none!important;
background:linear-gradient(180deg,#25B377 0%,#14915D 48%,#0E7A4F 100%);
box-shadow:inset 0 1px 0 rgba(255,255,255,.45),inset 0 -2px 0 rgba(0,0,0,.18),0 5px 0 #075236,0 9px 16px -4px rgba(7,82,54,.55);
transform:translateY(0);transition:transform .12s ease,box-shadow .12s ease,filter .12s ease;margin-bottom:5px}
.tm-visio::after{content:"";position:absolute;left:14px;right:14px;top:3px;height:42%;border-radius:999px;background:linear-gradient(180deg,rgba(255,255,255,.32),rgba(255,255,255,0));pointer-events:none}
.tm-visio .tv-ic{position:relative;display:grid;place-items:center;width:38px;height:38px;border-radius:50%;color:#0E7A4F;
background:radial-gradient(circle at 35% 30%,#fff 0%,#F1F7F4 55%,#D5E7DE 100%);box-shadow:inset 0 -2px 3px rgba(0,0,0,.12),0 2px 4px rgba(0,0,0,.22)}
.tm-visio .tv-live{position:absolute;top:1px;right:1px;width:11px;height:11px;border-radius:50%;background:#F2B100;box-shadow:0 0 0 2px #fff;animation:tvpulse 2s ease-in-out infinite}
@keyframes tvpulse{0%,100%{box-shadow:0 0 0 2px #fff,0 0 0 2px rgba(242,177,0,.6)}50%{box-shadow:0 0 0 2px #fff,0 0 0 7px rgba(242,177,0,0)}}
.tm-visio .tv-tx{display:flex;flex-direction:column;line-height:1.05;text-shadow:0 1px 0 rgba(0,0,0,.25)}
.tm-visio .tv-tx b{font:800 1.02rem var(--f-ui);letter-spacing:.01em}.tm-visio .tv-tx small{font-size:.7rem;font-weight:600;opacity:.85;letter-spacing:.03em}
.tm-visio:hover{transform:translateY(-1px);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),inset 0 -2px 0 rgba(0,0,0,.18),0 6px 0 #075236,0 12px 20px -4px rgba(7,82,54,.55);filter:brightness(1.05)}
.tm-visio:active{transform:translateY(4px);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),inset 0 -1px 0 rgba(0,0,0,.18),0 1px 0 #075236,0 3px 6px -2px rgba(7,82,54,.5)}
@media (prefers-reduced-motion:reduce){.tm-visio,.tm-visio .tv-live{transition:none;animation:none}}
.tm-visio:focus-visible{outline:3px solid var(--yellow);outline-offset:3px}
.tm-visio-inv{font-size:.88rem;font-weight:600;color:var(--ink)!important;border-bottom:2px solid var(--yellow);text-decoration:none!important}

/* Lanceur du Mode classe */
.mc-launch{display:flex;flex-direction:column;align-items:stretch;gap:8px;min-width:min(100%,300px)}
.mc-cta{display:flex;align-items:center;gap:14px;background:var(--asph);color:#fff!important;text-decoration:none!important;border-radius:16px;padding:12px 18px 12px 12px;box-shadow:0 6px 18px rgba(21,25,30,.18);position:relative;overflow:hidden;transition:transform .12s}
.mc-cta::after{content:"";position:absolute;left:0;right:0;bottom:0;height:4px;background:repeating-linear-gradient(90deg,var(--yellow) 0 18px,transparent 18px 30px)}
.mc-cta:hover{transform:translateY(-1px)}.mc-cta:focus-visible{outline:3px solid var(--yellow);outline-offset:2px}
.mc-cta i{display:grid;place-items:center;width:48px;height:48px;border-radius:12px;background:var(--yellow);color:var(--asph);flex-shrink:0}
.mc-cta b{display:block;font-family:var(--f-display);font-size:1.45rem;line-height:1;letter-spacing:0}
.mc-cta small{display:block;margin-top:4px;color:#C9CED4;font-size:.86rem}
.mc-quick{display:flex;flex-wrap:wrap;gap:6px}
.mc-quick a{font-size:.84rem;font-weight:600;color:var(--ink)!important;text-decoration:none!important;background:var(--soft);border:1px solid var(--line);border-radius:999px;padding:.3em .8em}
.mc-quick a:hover{border-color:var(--ink)}
@media (prefers-reduced-motion:reduce){.mc-cta{transition:none}}

/* Messages de l'équipe */
#sd-tmTabs button{position:relative}
.tm-badge{position:absolute;top:8px;right:10px;font-style:normal;background:#D7263D;color:#fff;font:800 .72rem/1 var(--f-ui);border-radius:999px;padding:.32em .5em;min-width:1.6em;text-align:center}
.ms-notif{display:grid;gap:4px;border-radius:14px;padding:12px 16px;margin-bottom:14px;background:#FFF6D6;border-left:5px solid #E0A400}
.ms-notif.on{background:var(--green-soft);border-left-color:var(--green)}.ms-notif.off{background:var(--soft);border-left-color:#9AA3AB}
.ms-notif:empty{display:none}.ms-notif b{font-weight:700}.ms-notif span{font-size:.9rem;color:#3D444D}.ms-na{display:flex;gap:16px;align-items:center;margin-top:6px;flex-wrap:wrap}
.ms-wrap{display:grid;grid-template-columns:300px 1fr;grid-template-rows:minmax(0,1fr);height:clamp(460px,calc(100dvh - 190px),860px);padding:0!important;overflow:hidden;border:1px solid var(--line)}
.ms-canaux{background:var(--asph);padding:10px 8px 14px;display:flex;flex-direction:column;gap:2px;overflow:auto;min-height:0}
.ms-ger{margin:2px 0 14px;padding:2px 0 8px;border-radius:12px;background:rgba(107,79,160,.16);box-shadow:inset 3px 0 0 #8E72C7}
.ms-ger .ms-sec{color:#C9B6EF!important}
.ms-ger .ms-ic.pv{background:rgba(142,114,199,.25)!important;color:#D9CCF5!important}
.ms-sec{margin:12px 10px 4px!important;font:700 .7rem/1 var(--f-ui);letter-spacing:.09em;text-transform:uppercase;color:#7F8994}
.ms-sec:first-child{margin-top:4px!important}
.ms-ch{all:unset;box-sizing:border-box;cursor:pointer;display:grid;grid-template-columns:30px 1fr auto;grid-template-rows:auto auto;column-gap:10px;row-gap:1px;align-items:center;padding:9px 10px;border-radius:10px}
.ms-ch .ms-ic{grid-row:1/3}
.ms-ch b{color:#E8ECEF;font-weight:600;font-size:.93rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ms-ch time{font-size:.72rem;color:#7F8994;justify-self:end}
.ms-ch small{grid-column:2/3;font-size:.8rem;color:#98A2AC;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.35}
.ms-ch em{grid-column:3;grid-row:2;justify-self:end;font-style:normal;background:var(--yellow);color:var(--asph);font-weight:800;font-size:.72rem;border-radius:999px;padding:.15em .55em;min-width:1.5em;text-align:center}
.ms-ch.nl b{color:#fff;font-weight:800}.ms-ch.nl small{color:#D5DBE0}.ms-ch.nl time{color:var(--yellow)}
.ms-ch:hover{background:rgba(255,255,255,.06)}.ms-ch.on{background:rgba(255,255,255,.13)}.ms-ch.on b{color:var(--yellow)}.ms-ch:focus-visible{outline:2px solid var(--yellow)}
.ms-ic{font-style:normal;display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:rgba(255,255,255,.1);color:#C9D1D8;font-weight:800;font-size:1rem}
.ms-ic.pv{background:rgba(255,204,0,.16);color:var(--yellow)}
.ms-fil{display:flex;flex-direction:column;min-width:0;min-height:0;position:relative;background:#fff}
.ms-head{display:flex;align-items:center;gap:6px;padding:10px 16px;border-bottom:1px solid var(--line);background:#fff}
.ms-back{all:unset;cursor:pointer;display:none;place-items:center;width:38px;height:38px;border-radius:10px;margin-left:-8px;color:var(--asph)}.ms-back:focus-visible{outline:2px solid var(--green)}
.ms-hd{min-width:0}
.ms-hd b{display:flex;align-items:center;gap:8px;font-family:var(--f-display);font-size:1.25rem;line-height:1.15}
.ms-hd b .ms-ic{width:26px;height:26px;font-size:.9rem;background:var(--soft);color:var(--asph)}.ms-hd b .ms-ic.pv{background:#FFF1BF;color:#8A6500}
.ms-hd span{display:block;font-size:.82rem;color:var(--muted);margin-top:2px}
.ms-list{flex:1 1 auto;overflow-y:auto;overscroll-behavior:contain;padding:8px 16px 14px;height:0;min-height:0;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-1 9 27 39'%3E%3Cdefs%3E%3ClinearGradient id='f' x1='0' y1='0' x2='0.4' y2='1'%3E%3Cstop offset='0' stop-color='%23F2B100' stop-opacity='.11'/%3E%3Cstop offset='1' stop-color='%23F2B100' stop-opacity='.025'/%3E%3C/linearGradient%3E%3ClinearGradient id='s' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23FFD24D' stop-opacity='.42'/%3E%3Cstop offset='1' stop-color='%23F2B100' stop-opacity='.12'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23f)' stroke='url(%23s)' stroke-width='.16' stroke-linejoin='round' d='M13.027344 40.390625 c-6.054687 0 -10.78125 -2.910156 -11.640625 -8.203125 l6.054688 -1.386719 c0.390625 3.164063 2.714844 4.804688 5.820313 4.804688 c2.382813 0 4.277344 -1.054687 4.257813 -3.4375 c-0.019531 -2.65625 -3.144531 -3.496094 -6.582031 -4.550781 c-4.140625 -1.289062 -8.574219 -2.8125 -8.574219 -8.007812 c0 -5.253906 4.296875 -8.222656 9.960938 -8.222656 c4.960938 0 9.960938 2.011719 11.09375 7.421875 l-5.664062 1.40625 c-0.527344 -2.8125 -2.421875 -4.042969 -5.078125 -4.042969 c-2.363281 0 -4.375 0.976563 -4.375 3.300781 c0 2.167969 2.773438 2.890625 5.976563 3.847656 c4.257813 1.289063 9.296875 2.929688 9.296875 8.554688 c0 5.996094 -5.019531 8.515625 -10.546875 8.515625 z'/%3E%3Cg fill='%23F2B100' fill-opacity='.2'%3E%3Crect x='1.5' y='44.2' width='5.2' height='1.1' rx='.55'/%3E%3Crect x='9.9' y='44.2' width='5.2' height='1.1' rx='.55'/%3E%3Crect x='18.3' y='44.2' width='5.2' height='1.1' rx='.55'/%3E%3C/g%3E%3C/svg%3E") 50% 46%/min(42%,220px) auto no-repeat,radial-gradient(ellipse 70% 60% at 50% 46%,rgba(242,177,0,.05),rgba(242,177,0,.012) 50%,transparent 78%),radial-gradient(ellipse 120% 90% at 50% 40%,transparent 55%,rgba(0,0,0,.28) 100%),radial-gradient(circle,rgba(255,255,255,.045) 1px,transparent 1.3px) 0 0/22px 22px,linear-gradient(180deg,#20262D 0%,#1A1F25 55%,#161A1F 100%)}
.ms-day{text-align:center;margin:14px 0 4px!important}.ms-day span{font-size:.74rem;font-weight:700;color:var(--muted);background:#fff;border:1px solid var(--line);border-radius:999px;padding:.2em .8em}
.ms-m{margin-top:12px;max-width:76%}.ms-m.suite{margin-top:3px}.ms-m.moi{margin-left:auto}
.ms-who{display:flex;align-items:center;gap:8px;margin:0 0 4px!important}.ms-m.moi .ms-who{flex-direction:row-reverse}
.ms-av{font-style:normal;display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#5B6B7D;color:#fff;font-weight:700;font-size:.8rem;flex-shrink:0}
.ms-av.r-admin{background:var(--asph)}.ms-av.r-secretariat{background:var(--green)}.ms-av.r-moniteur{background:var(--blue)}
.ms-who b{font-size:.88rem}.ms-who small{font-size:.76rem;color:var(--muted)}
.ms-b{background:#fff;border:1px solid var(--line);border-radius:4px 14px 14px 14px;padding:8px 12px;font-size:.95rem;line-height:1.45;overflow-wrap:anywhere;box-shadow:0 1px 1px rgba(0,0,0,.03)}
.ms-m.moi .ms-b{background:#DFF3E8;border-color:#BFE3D2;border-radius:14px 4px 14px 14px}
.ms-m.pourmoi .ms-b{border-left:4px solid #E0A400;background:#FFFBEA}
.ms-b.seule{padding:4px}
.ms-b{width:fit-content;max-width:100%;box-sizing:border-box}.ms-m.moi .ms-b{margin-left:auto}
.ms-t{display:block;text-align:right;font-size:.7rem;color:var(--muted);margin-top:2px}
.ms-at{font-weight:700;color:#1F5FA8;background:#E6EFFA;border-radius:5px;padding:0 .2em}.ms-at.moi{color:#6B4E00;background:#FFE58A}
.ms-el{all:unset;cursor:pointer;font-weight:700;color:var(--blue);border-bottom:1.5px solid currentColor}.ms-el:focus-visible{outline:2px solid var(--yellow)}
.ms-img{all:unset;cursor:zoom-in;display:block;border-radius:10px;overflow:hidden;background:#E3E6E8;max-width:100%}
.ms-img img{display:block;width:280px;max-width:100%;max-height:320px;object-fit:cover;min-height:80px}
.ms-b .ms-img+.ms-tx,.ms-b .ms-file+.ms-tx{margin-top:6px}
.ms-file{all:unset;cursor:pointer;box-sizing:border-box;display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;background:var(--soft);border:1px solid var(--line);max-width:100%}
.ms-file i,.ms-fic{font-style:normal;display:grid;place-items:center;width:38px;height:44px;border-radius:7px;background:#D7263D;color:#fff;font:800 .68rem/1 var(--f-ui);flex-shrink:0}
.ms-file span{min-width:0}.ms-file b{display:block;font-size:.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ms-file small{font-size:.76rem;color:var(--muted)}
.ms-file:hover{border-color:var(--green)}.ms-file:focus-visible,.ms-img:focus-visible{outline:2px solid var(--green)}
.ms-vide{color:var(--muted);text-align:center;margin-top:60px!important}
.ms-sug{position:absolute;left:58px;right:70px;bottom:70px;background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.14);padding:4px;z-index:5;max-height:220px;overflow:auto}
.ms-so{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:10px;width:100%;padding:8px 10px;border-radius:8px}
.ms-so small{color:var(--muted);font-size:.8rem;margin-left:auto}.ms-so.on,.ms-so:hover{background:var(--green-soft)}
.ms-pj{display:flex;flex-direction:column;gap:6px;padding:8px 12px;border-top:1px solid var(--line);background:#FAFBFB;max-height:220px;overflow:auto}.ms-pji{display:flex;align-items:center;gap:10px}.ms-pjn{margin:0!important;font-size:.78rem;color:var(--muted)}
.ms-form .btn[data-n]::after{content:attr(data-n);position:absolute;font-size:.62rem;font-weight:800;bottom:2px}.ms-form .btn{position:relative}
.ms-pj img{width:44px;height:44px;object-fit:cover;border-radius:8px}.ms-pj span{flex:1;min-width:0}
.ms-pj b{display:block;font-size:.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ms-pj small{font-size:.76rem;color:var(--muted)}
.ms-pjx{all:unset;cursor:pointer;width:34px;height:34px;display:grid;place-items:center;border-radius:50%;font-size:1.4rem;color:var(--muted)}.ms-pjx:hover{background:var(--soft);color:#D7263D}
.ms-form{display:flex;gap:8px;align-items:flex-end;padding:10px 12px;border-top:1px solid var(--line);background:#fff}
.ms-clip{cursor:pointer;display:grid;place-items:center;width:44px;height:46px;border-radius:12px;color:#5B6670;flex-shrink:0;position:relative}
.ms-clip:hover{background:var(--soft);color:var(--asph)}.ms-clip:focus-within{outline:2px solid var(--green)}
.ms-clip input{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer}
.ms-form textarea{flex:1;resize:none;min-height:46px;max-height:150px;border:1.5px solid var(--line);border-radius:12px;padding:11px 12px;font:inherit;line-height:1.35;margin:0}
.ms-form textarea:focus{border-color:var(--green);outline:none}
.ms-form .btn{height:46px;width:50px;padding:0;display:grid;place-items:center;border-radius:12px;flex-shrink:0}
.ms-form .btn.wait{opacity:.55;cursor:progress}
.ms-notif.on{display:flex;justify-content:space-between;align-items:center;gap:8px 16px;flex-wrap:wrap;padding:9px 14px}.ms-notif.on .ms-na{margin:0}
@media (max-width:760px){
.ms-wrap{grid-template-columns:1fr;height:auto}
.ms-wrap.voir-fil{height:100dvh}
.ms-canaux{max-height:none;padding:8px 6px 12px}.ms-ch{padding:12px 10px}.ms-ch b{font-size:1rem}
.ms-fil{display:none}
.ms-wrap.voir-fil{position:fixed;inset:0;z-index:70;border:0;border-radius:0;margin:0}
.ms-wrap.voir-fil .ms-canaux{display:none}
.ms-wrap.voir-fil .ms-fil{display:flex;height:100dvh}
.ms-back{display:grid}
.ms-head{padding:8px 12px;padding-top:max(8px,env(safe-area-inset-top))}
.ms-list{height:0;min-height:0;padding:8px 10px 12px}
.ms-form{padding-bottom:max(10px,env(safe-area-inset-bottom))}
.ms-m{max-width:88%}.ms-img img{width:240px}
.ms-sug{left:10px;right:10px}
.tm-pane[data-pane="msg"]>.tm-role{display:none}
}
.tm-auj{margin-top:18px;padding:0!important;overflow:hidden}
.tm-auj>summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;background:#FFF7DC;border-left:5px solid var(--yellow)}
.tm-auj>summary::-webkit-details-marker{display:none}
.tm-auj>summary b{display:block;font-family:var(--f-display);font-size:1.3rem}.tm-auj>summary small{font-size:.86rem;color:#3D444D}
.tm-auj>summary em{font-style:normal;font-weight:700;font-size:.85rem;color:#8A6500;white-space:nowrap}
.tm-auj>div{padding:14px}.tm-auj .tm-mon{margin:0}.tm-auj .tm-mon>.card{box-shadow:none;border:1px solid var(--line)}
html.ms-plein,html.ms-plein body{overflow:hidden}
html{scrollbar-gutter:stable} /* place de la barre de défilement toujours réservée : rien ne bouge en changeant d'onglet */
.sc-mail{font-size:.76rem;color:#1F5FA8;word-break:break-all}
.ms-vimg img{user-select:none;-webkit-user-drag:none;max-width:100%!important;max-height:calc(100dvh - 96px)!important;width:auto;height:auto}
#sodaf-root .ms-vdl,.ms-vdl{color:#fff!important}
.ms-vnav{all:unset;cursor:pointer;position:absolute;top:50%;margin-top:-26px;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:rgba(0,0,0,.45);color:#fff;z-index:2}
.ms-vnav.prev{left:12px}.ms-vnav.next{right:12px}.ms-vnav[hidden]{display:none}
.ms-vnav:hover{background:rgba(0,0,0,.7)}.ms-vnav:focus-visible{outline:2px solid var(--yellow)}
@media (pointer:coarse){.ms-vnav{width:42px;height:42px;margin-top:-21px;background:rgba(0,0,0,.3)}}
.sc-list{display:grid;gap:8px}
.sc-row{display:grid;grid-template-columns:220px 1fr auto;gap:6px 16px;align-items:center;padding:10px 12px;border:1px solid var(--line);border-radius:12px}
.sc-row.off{background:var(--soft);opacity:.75}
.sc-who b{display:block}.sc-who small,.sc-last small{display:block;color:var(--muted);font-size:.8rem}
.sc-last{font-size:.88rem}
.sc-act{display:flex;align-items:center;gap:10px;justify-content:flex-end}
.sc-st{font-style:normal;font-weight:700;font-size:.78rem;border-radius:999px;padding:.25em .7em;background:var(--green-soft);color:var(--green)}
.sc-row.off .sc-st{background:#E5E8EB;color:#5B6670}
.btn.sc-conf{background:#D7263D!important;border-color:#D7263D!important;color:#fff!important}
.sc-h{margin:18px 0 6px;font-size:1rem}
.gr-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}
.gr-tabs button{all:unset;cursor:pointer;font-weight:700;font-size:.88rem;padding:.45em .9em;border-radius:999px;border:1px solid var(--line);background:#fff;color:var(--ink);display:inline-flex;align-items:center;gap:6px}
.gr-tabs button[aria-selected="true"]{background:var(--ink);border-color:var(--ink);color:#fff}
.gr-tabs button:focus-visible{outline:2px solid var(--yellow);outline-offset:2px}
.gr-badge{font-style:normal;font-size:.72rem;font-weight:800;min-width:1.5em;text-align:center;border-radius:999px;padding:.1em .45em;background:#D7263D;color:#fff}
.gr-badge[hidden],.gr-pane[hidden],.gr-form[hidden]{display:none}
.gr-form{border:1px solid var(--line);border-radius:12px;padding:12px;margin:0 0 12px}
.gr-form .field{margin-bottom:8px}
.gr-list{display:grid;gap:8px}
.gr-it{border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:#fff}
.gr-it.att{border-color:#E8A317;box-shadow:inset 3px 0 0 #E8A317}
.gr-it.non{box-shadow:inset 3px 0 0 #D7263D}.gr-it.oui{box-shadow:inset 3px 0 0 var(--green)}
.gr-hd{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline}
.gr-hd b{font-size:.95rem}.gr-hd small{color:var(--muted);font-size:.8rem}
.gr-it p{margin:4px 0 0;font-size:.92rem;white-space:pre-wrap}
.gr-rep{margin-top:6px;font-size:.86rem;color:#3D444D;background:var(--soft);border-radius:8px;padding:6px 9px}
.gr-st{font-style:normal;font-weight:700;font-size:.74rem;border-radius:999px;padding:.2em .65em;white-space:nowrap}
.gr-st.att{background:#FFF4D6;color:#8A5A00}.gr-st.oui{background:var(--green-soft);color:var(--green)}.gr-st.non{background:#FDE7EA;color:#B3132B}.gr-st.neu{background:#E9EDF1;color:#3D444D}
.gr-act{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px}
.gr-act input{flex:1 1 180px;min-width:0;font:inherit;font-size:.9rem;padding:.45em .7em;border:1px solid var(--line);border-radius:10px}
.gr-sem{font-weight:700;margin:0 0 8px}
.gr-ch{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px;margin-top:8px}
.gr-ch span{background:var(--soft);border-radius:8px;padding:6px 9px;font-size:.84rem}.gr-ch b{display:block;font-size:1rem}
.gr-grow{flex:1}
.gr-elbox{position:relative}
.gr-ell{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:20;background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:0 10px 30px rgba(20,23,28,.14);max-height:300px;overflow:auto;padding:4px}
.gr-ell[hidden],.gr-elsel[hidden],#sd-grDemElQ[hidden]{display:none}
.gr-ell button{all:unset;box-sizing:border-box;cursor:pointer;display:block;width:100%;padding:8px 10px;border-radius:8px}
.gr-ell button:hover,.gr-ell button:focus-visible{background:var(--soft)}
.gr-ell b{display:block;font-size:.93rem}.gr-ell small{color:var(--muted);font-size:.78rem}
.gr-elvide{margin:0;padding:10px;color:var(--muted);font-size:.88rem}
.gr-elsel{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--line);border-radius:10px;padding:8px 10px;background:var(--soft)}
.gr-elsel button{all:unset;cursor:pointer;font-weight:700;font-size:.85rem;color:#1F5FA8}
#sd-grRapChiffres{grid-template-columns:repeat(auto-fit,minmax(140px,1fr))!important;gap:8px!important}
@media (max-width:600px){#sd-grRapChiffres{grid-template-columns:repeat(2,minmax(0,1fr))!important}#sd-grRapChiffres div{padding:8px 10px!important}#sd-grRapChiffres b{font-size:1.1rem!important}}
.sc-form{grid-column:1/-1;border-top:1px dashed var(--line);padding-top:10px;margin-top:4px}
.sc-form[hidden]{display:none}
.sc-form .field{margin-bottom:8px}
.sc-apercu{display:block;color:#1F5FA8;font-size:.78rem;margin-top:3px;word-break:break-all}
.sc-fbtn{display:flex;gap:8px;flex-wrap:wrap}
.sc-add{margin-top:10px}
.sc-add .sc-form{border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:8px}
.sc-aide{margin:10px 0 0!important;font-size:.84rem!important}
.sc-act{flex-wrap:wrap}
.sc-loin{background:#B45309!important}
.sc-new{font-style:normal;font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#fff;background:#D7263D;border-radius:999px;padding:.2em .6em;margin-left:4px;vertical-align:middle}
@media (max-width:700px){.sc-row{grid-template-columns:1fr}.sc-act{justify-content:flex-start}}
.ms-list .ms-who b{color:#EEF1F3}.ms-list .ms-who small{color:#9AA4AD}
.ms-list .ms-day span{background:#2C333B;color:#D3D9DE;border-color:#3A424B}
.ms-list .ms-vide{color:#AEB7BF}
.ms-list .ms-m:not(.moi) .ms-b{border-color:transparent;box-shadow:0 1px 2px rgba(0,0,0,.3)}
.ms-list .ms-m.moi .ms-b{border-color:transparent;box-shadow:0 1px 2px rgba(0,0,0,.3)}
.ms-list .ms-m.echec .ms-b{border-color:#E4434D}
.ms-list .ms-neuf span{background:#3A1F24;color:#FFB3BA;border-color:#E4434D}
.ms-list .ms-el{color:#1F5FA8}
.ms-form .btn.enreg{box-shadow:0 0 0 4px rgba(14,122,79,.28)}
.ms-list .ms-av{box-shadow:0 0 0 2px rgba(255,255,255,.22)}
.ms-aud{display:flex;align-items:center;gap:10px;min-width:250px;max-width:100%;padding:2px 2px 2px 0}
.ms-play{all:unset;cursor:pointer;flex-shrink:0;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:#8C96A0;color:#fff;position:relative;transition:background .15s}
.ms-play:focus-visible{outline:3px solid var(--yellow);outline-offset:2px}
.ms-aud .ms-play>.i-pause,.ms-aud .ms-play>.i-load{display:none!important}
.ms-aud.joue .ms-play>.i-play,.ms-aud.charge .ms-play>.i-play{display:none!important}.ms-aud.joue .ms-play>.i-pause{display:block!important}
.ms-aud.charge .ms-play>.i-load{display:block!important;width:20px;height:20px;border-radius:50%;border:2.5px solid rgba(255,255,255,.35);border-top-color:#fff;animation:msrot .8s linear infinite}
@keyframes msrot{to{transform:rotate(360deg)}}
.ms-aud.neuf .ms-play{background:var(--green);box-shadow:0 0 0 4px rgba(14,122,79,.16)}
.ms-aud.joue .ms-play,.ms-aud.pause .ms-play,.ms-aud.charge .ms-play{background:var(--asph)}
.ms-m.moi .ms-play{background:#3E7A61}.ms-m.moi .ms-aud.joue .ms-play,.ms-m.moi .ms-aud.pause .ms-play{background:var(--asph)}
.ms-aw{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.ms-prog{position:relative;height:6px;border-radius:999px;background:#D5DBE0;cursor:pointer;touch-action:none;margin:8px 0 0}
.ms-prog::before{content:"";position:absolute;inset:-12px 0}
.ms-prog i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:#8C96A0}
.ms-aud.neuf .ms-prog i,.ms-aud.neuf .ms-prog b{background:var(--green)}.ms-aud.joue .ms-prog i,.ms-aud.pause .ms-prog i{background:var(--asph)}
.ms-prog b{position:absolute;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#8C96A0;box-shadow:0 1px 3px rgba(0,0,0,.25)}
.ms-aud.joue .ms-prog b,.ms-aud.pause .ms-prog b{background:var(--asph)}
.ms-prog:focus-visible{outline:2px solid var(--green);outline-offset:6px}
.ms-ainf{display:flex;align-items:center;gap:8px;font-size:.78rem;color:var(--muted)}
.ms-atm{font-variant-numeric:tabular-nums}
.ms-pt{font-weight:800;color:var(--green);font-size:.72rem;text-transform:uppercase;letter-spacing:.04em}
.ms-vit{all:unset;cursor:pointer;margin-left:auto;font-weight:800;font-size:.74rem;color:var(--asph);background:rgba(0,0,0,.07);border-radius:999px;padding:.25em .7em}.ms-vit:focus-visible{outline:2px solid var(--green)}
.ms-ecq{font-size:.74rem;color:var(--muted)}.ms-ecq.ok{color:#1F5FA8;font-weight:600}
.ms-st{display:flex;align-items:center;gap:6px;justify-content:flex-end;font-size:.74rem;color:var(--muted);margin-top:4px}
.ms-st.err{color:#C0262F;font-weight:600;flex-wrap:wrap}.ms-st .linkbtn{font-size:.76rem}
.ms-spin{width:11px;height:11px;border-radius:50%;border:2px solid #C5CCD2;border-top-color:var(--green);animation:msrot .8s linear infinite}
.ms-m.envoi .ms-b{opacity:.85}.ms-m.echec .ms-b{border-color:#E4434D;background:#FFF5F5;opacity:1}
.ms-neuf{display:flex;align-items:center;gap:10px;margin:16px 0 6px!important;color:#C0262F}
.ms-neuf::before,.ms-neuf::after{content:"";flex:1;height:2px;background:#E4434D;border-radius:2px}
.ms-neuf span{font:800 .74rem/1 var(--f-ui);letter-spacing:.06em;text-transform:uppercase;background:#FDE8EA;border:1.5px solid #E4434D;border-radius:999px;padding:.4em .9em;white-space:nowrap}
.ms-bas{all:unset;cursor:pointer;position:absolute;right:18px;bottom:84px;z-index:4;width:42px;height:42px;border-radius:50%;background:#fff;border:1px solid var(--line);box-shadow:0 6px 18px rgba(0,0,0,.16);display:grid;place-items:center;color:var(--asph)}
.ms-bas[hidden]{display:none}.ms-bas:focus-visible{outline:2px solid var(--green)}
.ms-bas em{position:absolute;top:-6px;right:-6px;font-style:normal;background:#D7263D;color:#fff;font:800 .7rem/1 var(--f-ui);border-radius:999px;padding:.3em .5em;min-width:1.4em;text-align:center}
.ms-mic{all:unset;cursor:pointer;display:grid;place-items:center;width:44px;height:46px;border-radius:12px;color:#5B6670;flex-shrink:0}
.ms-mic:hover{background:var(--soft);color:var(--asph)}.ms-mic:focus-visible{outline:2px solid var(--green)}
.ms-mic.on{background:#D7263D;color:#fff}
.ms-rec{display:flex;align-items:center;gap:12px;padding:10px 14px;border-top:1px solid var(--line);background:#FFF1F2;flex-wrap:wrap}
.ms-rec[hidden]{display:none}.ms-rec b{font-variant-numeric:tabular-nums;font-size:1.05rem}.ms-rec span{flex:1;font-size:.86rem;color:#5B6670;min-width:120px}
.ms-recdot{width:12px;height:12px;border-radius:50%;background:#D7263D;animation:recb 1s infinite}
@keyframes recb{50%{opacity:.25}}
@media (max-width:760px){.ms-mic,.ms-clip{width:40px}.ms-aud{min-width:215px}}
.ms-vue{position:fixed;inset:0;z-index:95;background:#0B0D10;display:flex;flex-direction:column}
.ms-vue[hidden]{display:none}
.ms-vbar{display:flex;align-items:center;gap:12px;padding:10px 14px;padding-top:max(10px,env(safe-area-inset-top));color:#fff}
.ms-vtit{flex:1;min-width:0;display:flex;flex-direction:column}.ms-vtit b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:700}.ms-vtit small{color:#B7C0C8;font-size:.8rem}
.ms-vcpt{font-variant-numeric:tabular-nums;font-weight:700;font-size:.9rem;color:#E8ECEF}
.ms-vdl{color:#fff;font-weight:700;font-size:.9rem;border:1.5px solid rgba(255,255,255,.5);border-radius:999px;padding:.45em 1em;text-decoration:none}
.ms-vx{all:unset;cursor:pointer;width:42px;height:42px;display:grid;place-items:center;font-size:2rem;color:#fff;border-radius:50%}.ms-vx:focus-visible{outline:2px solid var(--yellow)}
.ms-vimg{flex:1;min-height:0;display:grid;place-items:center;position:relative;overflow:hidden;touch-action:pan-y;padding:8px 8px max(16px,env(safe-area-inset-bottom))}
.ms-vimg img{max-width:100%;max-height:100%;object-fit:contain;border-radius:6px}
.maj-bar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:98;display:flex;gap:14px;align-items:center;background:var(--asph);color:#fff;padding:10px 12px 10px 18px;border-radius:999px;box-shadow:0 12px 30px -10px rgba(0,0,0,.5);font-weight:600;font-size:.92rem;max-width:calc(100% - 32px)}
.ms-fil.drop::after{content:"Dépose le fichier ici pour l'envoyer";position:absolute;inset:8px;z-index:6;display:grid;place-items:center;border:3px dashed var(--green);border-radius:14px;background:rgba(223,243,232,.92);color:var(--green);font:700 1.15rem/1.3 var(--f-ui);pointer-events:none}

/* Contacts élève (moniteur) et fiche courte */
.ct-btns{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 2px}
.ct-btns a{display:inline-flex;align-items:center;gap:5px;font-size:.82rem;font-weight:700;text-decoration:none!important;border-radius:999px;padding:.3em .8em;border:1.5px solid var(--line);color:var(--ink)!important;background:#fff}
.ct-btns a.ct-wa{border-color:#BFE3D2;background:#E9F7EF;color:#064D36!important}
.ct-btns a:hover{border-color:var(--ink)}
.ct-big a{font-size:.95rem;padding:.5em 1.1em}
.pe-tel{display:inline-grid;place-items:center;width:28px;height:28px;margin-left:auto;border-radius:50%;color:var(--green)!important;background:#E9F7EF;flex-shrink:0}
.tm-checks label{display:flex;align-items:center;gap:8px}
.mf-ov{position:fixed;inset:0;z-index:80;background:rgba(21,25,30,.55);display:grid;place-items:center;padding:16px}
.mf-ov[hidden]{display:none}
.mf-box{position:relative;background:#fff;border-radius:18px;padding:22px 22px 18px;width:min(440px,100%);box-shadow:0 20px 60px rgba(0,0,0,.3);border-top:5px solid var(--yellow)}
.mf-box h3{font-family:var(--f-display);font-size:1.7rem;margin:2px 0 8px}
.mf-x{all:unset;cursor:pointer;position:absolute;top:10px;right:14px;font-size:1.8rem;line-height:1;color:var(--muted)}
.mf-x:focus-visible{outline:2px solid var(--yellow)}
.mf-dl{display:grid;gap:10px;margin:14px 0 0}.mf-dl div{display:grid;grid-template-columns:110px 1fr;gap:8px;align-items:baseline}
.mf-dl dt{font-size:.82rem;color:var(--muted)}.mf-dl dd{margin:0;font-weight:600}

/* Téléphone : onglets de l'équipe en liste verticale (tout visible, sans défiler de côté) */
@media (max-width:1099px){
#sodaf-root.app-mode .tm-tabs{flex-direction:column;overflow:visible;gap:2px;padding:8px}
#sodaf-root.app-mode .tm-tabs button{flex:0 0 auto;width:100%;justify-content:flex-start;padding:9px 12px}
#sodaf-root.app-mode .tm-tabs button[hidden]{display:none}
#sodaf-root.app-mode .tm-tabs .tm-badge{top:50%;transform:translateY(-50%);right:12px}
#sodaf-root.app-mode #sd-teamPanel>.tm-tabs{margin-bottom:0}
#sodaf-root.app-mode .tm-pane{margin-top:20px;padding-top:20px;border-top:2px dashed #C3CAD1}
}
.tm-pane[data-pane="msg"] .ms-notif{margin:30px 0 0;position:relative}
.tm-pane[data-pane="msg"] .ms-notif::before{content:"";position:absolute;left:0;right:0;top:-16px;border-top:2px dashed #C3CAD1}
`;
  const st = document.createElement("style"); st.textContent = CSS + CSS_REFONTE + 'html,body{margin:0;background:#15191E}#sodaf-root{min-height:100vh;display:flex;flex-direction:column}#sodaf-root>#app{flex:1;display:flex;flex-direction:column;background:#fff}#sodaf-root main{flex:1}'; document.head.appendChild(st);
  if (!document.querySelector("link[rel=icon]")) { const fi = document.createElement("link"); fi.rel = "icon"; fi.type = "image/svg+xml"; fi.href = FAVICON; document.head.appendChild(fi); }
  const app = document.getElementById("app"); app.innerHTML = HTML;
  if (window.SODAF_APP) {
    document.getElementById("sodaf-root").classList.add("app-mode");
    const lg = app.querySelector("header.top .logo"); if (lg) { lg.href = "#equipe"; lg.setAttribute("aria-label", "SODAF Équipe"); const sb = lg.querySelector(".logo-sub"); if (sb) sb.textContent = "Espace équipe"; }
  }
  init(app);
})();
