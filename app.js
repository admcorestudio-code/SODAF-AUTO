
// ---------- Base de données SODAF (Supabase) ----------
// Clé publique : elle ne donne accès qu'à ce que les règles de sécurité de la base autorisent
// (visiteurs : s'inscrire et envoyer un devoir ; équipe connectée : le reste).
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
  async changePassword(password) {
    const t = await this.token();
    const r = await fetch(SB_URL + "/auth/v1/user", { method: "PUT", headers: { apikey: SB_KEY, Authorization: "Bearer " + t, "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.msg || j.message || "Mot de passe refusé"); }
  },
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
.tm-wk-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px}
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
.tm-pane[data-pane="dir"] .tm-role{border-left-color:var(--blue)}
.tm-drmonth{font:700 1.15rem var(--f-display);flex:1}
.tm-dr div{position:relative}
.tm-dr div.hl{background:var(--ink);color:#fff}
.tm-dr div.hl span,.tm-dr div.hl small{color:#C9CED4}
.tm-dr div.hl b{color:#fff}
.tm-dr small{font-size:.8rem;color:var(--muted)}
.tm-small{font-size:.82rem!important;min-width:6ch}
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
.pc{display:grid;grid-template-columns:minmax(280px,360px) minmax(0,1fr);gap:18px;align-items:start}
.pc-list{border:1.5px solid var(--line);border-radius:14px;background:#fff;overflow:hidden;position:sticky;top:76px}
.pc-stages{display:flex;flex-wrap:wrap;gap:6px;padding:10px;background:var(--soft);border-bottom:1.5px solid var(--line)}
.pc-stages button{flex:1 1 40%;font:600 .9rem var(--f-body);padding:.55em .6em;border-radius:10px;border:1.5px solid var(--line);background:#fff;color:#3D444D;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:6px}
.pc-stages button em{font-style:normal;font-size:.78rem;background:var(--soft);border-radius:999px;padding:.1em .55em;color:var(--ink)}
.pc-stages button[aria-selected="true"]{border-color:var(--ink);background:var(--ink);color:#fff}
.pc-stages button[aria-selected="true"] em{background:var(--yellow);color:var(--ink)}
.pc-stages button[data-st="accueil"] em:not(:empty){}
.pc-tools{display:flex;gap:8px;padding:10px;border-bottom:1.5px solid var(--line)}
.pc-tools input{flex:1;min-width:0;font:.95rem var(--f-body);padding:.55em .7em;border:1.5px solid var(--line);border-radius:10px}
.pc-list .tm-form{margin:10px;padding:14px}
.pc-items{max-height:68vh;overflow:auto}
.pc-gh{display:flex;justify-content:space-between;font:600 .74rem var(--f-body);letter-spacing:.08em;text-transform:uppercase;color:#3D444D;background:var(--soft);padding:8px 14px;margin:0!important;border-bottom:1px solid var(--line)}
.pc-gh span{background:#fff;border-radius:999px;padding:0 .5em}
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
.pc-proto{font:.85rem/1.5 ui-monospace,Menlo,Consolas,monospace;background:var(--soft);border-radius:8px;padding:8px 12px;margin:14px 0 0!important;color:#3D444D}
.pc-block{border:1.5px solid var(--line);border-radius:12px;padding:14px 16px;margin-top:14px;background:#fff}
.pc-bh{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}
.pc-bh b{font:700 1.08rem var(--f-display)}
.pc-ok{font-size:.85rem;font-weight:700;color:var(--green)}
.pc-block textarea{width:100%;font:.95rem/1.5 var(--f-body);padding:.7em .8em;border:1.5px solid var(--line);border-radius:10px;resize:vertical}
.pc-block .tm-formact input{flex:1;min-width:180px;font:.95rem var(--f-body);padding:.55em .7em;border:1.5px solid var(--line);border-radius:10px}
.pc-calls{display:grid;grid-template-columns:1.2fr 1fr;gap:16px;margin-bottom:12px}
.pc-lab{font-size:.8rem;font-weight:700;color:#3D444D;margin-bottom:6px!important}
.pc-steps{display:flex;flex-wrap:wrap;gap:6px}
.pc-steps button{font:600 .86rem var(--f-body);padding:.45em .8em;border-radius:999px;border:1.5px solid var(--line);background:#fff;color:#3D444D;cursor:pointer}
.pc-steps button[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:#fff}
.pc-steps button[data-rappel="matin"][aria-pressed="true"]{background:#E0A400;border-color:#E0A400;color:#14171C}
.pc-steps button[data-rappel="apres-midi"][aria-pressed="true"]{background:var(--blue);border-color:var(--blue)}
.pc-steps button[data-rappel=""][aria-pressed="true"]{background:var(--green);border-color:var(--green)}
.pc-tries{display:flex;flex-wrap:wrap;gap:6px}
.pc-tries i{font-style:normal;font:600 .82rem var(--f-body);padding:.35em .7em;border-radius:999px;border:1.5px solid var(--line);color:var(--muted)}
.pc-tries i.on{background:var(--red-soft);border-color:var(--red);color:var(--red)}
.pc-alert{margin-top:12px;background:var(--red-soft);border:1.5px solid var(--red);border-radius:10px;padding:12px 14px;font-size:.94rem}
.pc-script{font-size:1rem;line-height:1.6}
.pc-script p{margin:0 0 10px!important}
.pc-checks{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:6px}
.pc-checks label{display:flex;gap:8px;align-items:center;background:var(--soft);padding:.5em .7em;border-radius:10px;cursor:pointer;font-size:.94rem}
.pc-checks input{width:18px;height:18px;accent-color:var(--green)}
.pc-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:14px;padding-top:14px;border-top:1.5px solid var(--line)}
.pc-foot>span{font-weight:700}
.pc-red{background:var(--red);color:#fff}
.pc-dark{background:var(--ink);color:#fff}
.btn.armed{outline:3px solid var(--yellow);outline-offset:2px}
.pc-mini{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:8px}
.pc-mini div{background:var(--soft);border-radius:10px;padding:8px 12px;display:flex;flex-direction:column}
.pc-mini span{font-size:.78rem;color:#3D444D}
.pc-mini b{font:700 1.05rem var(--f-display)}
.pc-line{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;font-size:.92rem;padding:6px 0;border-top:1px solid var(--line)}
.pc-line em{font-style:normal;color:var(--muted);flex:1;min-width:0}
.pc-feed{display:flex;flex-direction:column;gap:0}
.pc-feed div{display:grid;grid-template-columns:auto 1fr;gap:0 12px;padding:7px 0;border-top:1px solid var(--line);font-size:.92rem}
.pc-feed time{color:var(--muted);font-size:.82rem;grid-row:1/3;font-variant-numeric:tabular-nums}
.pc-feed span{color:#3D444D}
@media (max-width:899px){.pc{grid-template-columns:1fr}.pc-list{position:static}.pc-items{max-height:none}.pc.has-sel .pc-list{display:none}.pc:not(.has-sel) .pc-detail{display:none}.pc-back{display:inline-block}.pc-calls{grid-template-columns:1fr}.pc-head h3{font-size:1.4rem}}
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
</div></div>

<div class="wrap sec">
<div class="sec-head"><div><p class="eyebrow">Pourquoi SODAF</p><h2>Une auto-école qui te suit partout</h2></div></div>
<div class="grid g3">
<div class="card feat"><span class="fico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/></svg></span><h3>Le manuel en ligne</h3><p>Les 7 parties du manuel SODAF en chapitres courts, à lire où tu veux.</p><a class="more" href="#cours">Ouvrir les cours →</a></div>
<div class="card feat"><span class="fico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg></span><h3>Quiz corrigés</h3><p>Chaque réponse est expliquée et renvoie au chapitre à relire.</p><a class="more" href="#quiz">S'entraîner →</a></div>
<div class="card feat"><span class="fico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/></svg></span><h3>Paiement en tranches</h3><p>Règle ta formation en plusieurs fois, en espèces ou par Mixx by Yas (T-Money).</p><a class="more" href="#formations">Voir les formules →</a></div>
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
<div style="position:relative"><p class="eyebrow">Question du jour</p><h2 style="margin-top:10px">Teste-toi en 10 secondes</h2><p style="color:var(--muted);margin-top:10px">Une question tirée du manuel SODAF. Tu veux aller plus loin ? Le quiz complet t'attend.</p><a class="btn btn-line btn-sm" style="margin-top:16px" href="#quiz">Faire le quiz complet</a></div>
<div id="sd-qday" style="position:relative"></div>
</div></div></div>

<div class="wrap sec"><div class="sec-head"><div><p class="eyebrow">Bon à savoir</p><h2>Les papiers du conducteur</h2></div><p>Ce qu'il faut préparer pour t'inscrire, ce qu'il faut avoir à bord, et quoi faire après un accrochage.</p></div>
<div class="grid g3">
<div class="card doc"><div class="file">ID</div><div><span class="tag">Inscription</span><h3 style="margin-top:8px">Pièces à préparer</h3><ul style="color:var(--muted);padding-left:1.1em;margin:8px 0"><li>Acte de naissance</li><li>Carte d'identité</li><li>Photos d'identité, format passeport</li><li>Quittance d'examen : 35&nbsp;000&nbsp;F (permis B)</li></ul><p style="font-size:.88rem">Plus le droit d'inscription de 5&nbsp;000&nbsp;F.</p></div></div>
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
<div class="card alacarte" style="margin-top:18px"><p class="eyebrow">Pack</p><div class="acrow"><div><b>Pack A + B · moto et voiture</b><span> · formation complète voiture + permis moto, au lieu de 85 000 F séparément</span></div><strong>80 000 F</strong></div><p style="margin:10px 0 0;font-size:.92rem;color:var(--muted)">Pour le permis A, le secrétariat t'indique le montant de la quittance d'examen. <a href="#inscription" data-cat="Permis B" data-msg="Je suis intéressé par le Pack A + B (moto et voiture).">Demander le pack</a></p></div>
</div>
<div class="wrap sec">
<div class="sec-head"><div><p class="eyebrow">Ta semaine à SODAF</p><h2>Comment se passe la formation</h2></div><p>Tu révises sur le site quand tu veux. En salle, le moniteur explique, corrige et t'entraîne pour l'examen.</p></div>
<div class="grid g3">
<div class="card"><p class="eyebrow">Code en salle</p><h3 style="margin-top:10px">14 h 30 – 15 h 30</h3>
<div class="wk"><b>Lundi</b><span>Cours complet du thème de la semaine</span></div>
<div class="wk"><b>Mercredi</b><span>Récap et correction du devoir</span></div>
<div class="wk"><b>Vendredi</b><span>Entraînement type examen</span></div>
<div class="wk"><b>Samedi 10 h</b><span>Examen blanc</span></div></div>
<div class="card"><p class="eyebrow">Conduite · 1 h, sur rendez-vous</p><h3 style="margin-top:10px">Choisis ton créneau</h3>
<div class="wk"><b>Lun – ven matin</b><span>6 h 30 · 7 h 30 · 8 h 45 · 9 h 45</span></div>
<div class="wk"><b>Lun – ven soir</b><span>15 h 45 · 16 h 45</span></div>
<div class="wk"><b>Samedi</b><span>6 h 30 à 11 h 45</span></div>
<p style="margin-top:12px;font-size:.92rem;color:var(--muted)">Tu travailles ? Les créneaux de 6 h 30, de 16 h 45 et du samedi sont faits pour toi.</p></div>
<div class="card"><p class="eyebrow">Ton parcours</p><h3 style="margin-top:10px">Étape par étape</h3>
<ol class="steps-ol"><li><b>Semaines 1 et 2 :</b> le code d'abord, signalisation et priorités.</li><li><b>Dès la semaine 3 :</b> une séance de conduite par semaine, le code continue.</li><li><b>Tous les chapitres</b> reviennent en salle environ toutes les 10 semaines. Tu rattrapes sur le site.</li><li><b>Avant l'examen :</b> examens blancs du samedi.</li></ol></div>
</div>
</div>
<div class="wrap sec"><div class="grid g3">
<div class="card soft"><p class="eyebrow">Paiement</p><h3 style="margin-top:10px">En 2 tranches</h3><p style="margin-top:8px">La moitié à l'inscription, le reste avant la première séance de conduite. Un reçu pour chaque paiement.</p><div class="pills"><span>Espèces</span><span>Mixx by Yas (T-Money)</span></div></div>
<div class="card soft"><p class="eyebrow">Dossier à fournir</p><h3 style="margin-top:10px">Pour t'inscrire</h3><ul style="margin:8px 0 0;padding-left:1.1em;color:var(--muted)"><li>Acte de naissance</li><li>Carte d'identité</li><li>Photos d'identité, format passeport</li><li>Quittance d'examen : 35 000 F pour le permis B, en plus de la formation (permis A : montant au secrétariat)</li></ul></div>
<div class="card soft"><p class="eyebrow">Bon à savoir</p><h3 style="margin-top:10px">Des règles claires</h3><ul style="margin:8px 0 0;padding-left:1.1em;color:var(--muted)"><li>Le droit d'inscription n'est pas remboursable.</li><li>Une séance non faite peut être reportée pendant 6 mois.</li><li>Conduite, sur rendez-vous : du lundi au vendredi de 6 h 30 à 11 h et de 14 h 30 à 18 h, le samedi de 6 h 30 à 12 h.</li><li>Secrétariat : du lundi au vendredi de 8 h à 12 h 30 et de 14 h 30 à 18 h, le samedi de 8 h à 12 h.</li></ul></div>
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
<div class="wrap"><div class="classband"><p class="cb-t">Code en salle · 14 h 30 – 15 h 30</p><p class="cb-d">Lundi : cours complet · Mercredi : récap · Vendredi : entraînement · Samedi 10 h : examen blanc</p><a class="btn btn-line btn-sm" href="#formations" style="margin-left:auto">Voir le planning</a></div></div>
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
<p><a href="#outils-urgence">Numéros d'urgence du Togo →</a></p>
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
<p><a href="#outils">Essaie le calculateur →</a></p>
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
<p>Chaque matin, vérifie 12 points. <a href="#outils-check">Ouvrir la check-list →</a></p>
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
${HEAD("Devoirs", "Le devoir de la semaine", "Un devoir par semaine sur le thème vu en salle le lundi. Ton résultat part directement au moniteur, et la correction se fait le mercredi à 14 h 30.")}
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
<div class="tm-top"><div><p class="eyebrow" id="sd-tmRole">Espace équipe SODAF</p><h2 id="sd-tmHello">Bonjour</h2><p class="tm-today" id="sd-tmToday"></p></div><div class="tm-acc"><button class="linkbtn" type="button" id="sd-tmPwBtn">Changer mon mot de passe</button><button class="linkbtn" type="button" id="sd-teamOut">Se déconnecter</button></div></div>
<form id="sd-tmPwForm" class="card tmpw" hidden novalidate><label for="sd-tmPw1">Nouveau mot de passe (8 caractères minimum)</label><div><input id="sd-tmPw1" type="password" autocomplete="new-password"><button class="btn btn-green btn-sm" type="submit">Enregistrer</button></div><p id="sd-tmPwMsg" class="tm-note"></p></form>
<div id="sd-tmToast" class="tm-toast" hidden></div>
<div class="tm-tabs" role="tablist" id="sd-tmTabs">
<button role="tab" data-t="dir" aria-selected="false" hidden><b>Direction</b><small>Chiffres du mois, à surveiller</small></button>
<button role="tab" data-t="sec" aria-selected="true"><b>Secrétariat</b><small>Inscriptions, paiements, réservations</small></button>
<button role="tab" data-t="mon" aria-selected="false"><b>Moniteur</b><small>Code en salle, conduite</small></button>
<button role="tab" data-t="docs" aria-selected="false"><b>Documents</b><small>Carte, cachet, QR, affiches</small></button>
</div>
<div class="tm-pane" data-pane="sec" role="tabpanel">
<p class="tm-role">Accueil des élèves, inscriptions, paiements, réservations de conduite et messages WhatsApp.</p>
<div class="tm-subnav" id="sd-secNav" role="tablist">
<button data-s="eleves" aria-selected="true">Parcours élèves <span class="tm-count" id="sd-cntNew"></span></button>
<button data-s="conduite" aria-selected="false">Planning conduite</button>
<button data-s="paiements" aria-selected="false">Paiements et reçus</button>
<button data-s="devoirs" aria-selected="false">Devoirs</button>
</div>
<section class="tm-sec" data-s="eleves">
<div class="pc" id="sd-pc">
<div class="pc-list">
<div class="pc-stages" id="sd-pcStages" role="tablist"><button type="button" data-st="accueil">Accueil <em></em></button><button type="button" data-st="appels">Appels <em></em></button><button type="button" data-st="dossier">Dossier envoyé <em></em></button><button type="button" data-st="formation">En formation <em></em></button><button type="button" data-st="archives">Archivés <em></em></button></div>
<div class="pc-tools"><input id="sd-pcQ" type="search" placeholder="Chercher un nom, un numéro, un n° de dossier"><button class="btn btn-green btn-sm" type="button" id="sd-elAddBtn">+ Élève</button></div>
<form id="sd-elAdd" class="card tm-form" hidden novalidate>
<div class="field"><label for="sd-elN">Nom et prénom</label><input id="sd-elN"></div>
<div class="field"><label for="sd-elT">Téléphone</label><div class="tel"><span>+228</span><input id="sd-elT" inputmode="numeric" maxlength="11" placeholder="90 00 00 00"></div></div>
<div class="row2"><div class="field"><label for="sd-elFo">Formation</label><select id="sd-elFo"><option>Permis B</option><option>Permis A</option><option>Pack A + B</option><option>Remise à niveau</option><option>Formation entreprise</option></select></div><div class="field"><label for="sd-elSt">Étape</label><select id="sd-elSt"><option value="Inscrit">Il s'inscrit maintenant</option><option value="Contacté">Juste renseigné, à rappeler</option></select></div></div>
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
<div class="tm-sub"><div><p class="eyebrow">Mercredi</p><h3>Message pour le groupe WhatsApp</h3></div></div>
<textarea id="sd-dvMsg" class="tm-msg" readonly rows="10"></textarea>
<div class="tm-formact"><button class="btn btn-green btn-sm" type="button" id="sd-dvCopy">Copier le message</button><a class="btn btn-wa btn-sm" id="sd-dvWa" target="_blank" rel="noopener" href="#">Ouvrir WhatsApp avec le message</a></div>
<div id="sd-dvRes" class="tm-list" style="margin-top:18px"></div>
</section>
<div class="tm-sub"><div><p class="eyebrow">Mode d'emploi</p><h3>Les gestes du secrétariat</h3></div></div>
<div class="grid g2 tm-guides">
<div class="card soft"><p class="eyebrow">Une pré-inscription arrive</p><ol class="teamsteps"><li><b>Accueil</b> : touche <b>Envoyer l'accueil</b> (WhatsApp), puis <b>Basculer en zone d'appel</b>.</li><li><b>Appels</b> : appelle avec le script. Pas de réponse ? <b>✗ Pas de réponse</b> et choisis quand rappeler. À 4 tentatives : relance WhatsApp puis <b>Injoignable</b>.</li><li>Il est intéressé : <b>Intéressé : envoyer le dossier</b> (fiche, planning, prix, paiement Mixx ou bureau, localisation).</li><li><b>Dossier envoyé</b> : relance après 3 jours. Il a payé (bureau ou capture Mixx vérifiée) : <b>Paiement reçu : faire le reçu</b>, coche ses pièces, ajoute-le au groupe.</li></ol></div>
<div class="card soft"><p class="eyebrow">Réserver une séance de conduite</p><ol class="teamsteps"><li>Vérifie que la 2e moitié est payée (<b>Paiements</b> → À relancer).</li><li><b>Planning conduite</b> : choisis le jour, puis l'élève sur un créneau libre.</li><li>Touche <b>Confirmer</b> : le message WhatsApp est prêt. La veille, touche <b>Rappel</b>.</li></ol></div>
<div class="card soft"><p class="eyebrow">Mercredi : résultats du devoir</p><ol class="teamsteps"><li>Onglet <b>Devoirs</b> : le message de la semaine est déjà écrit.</li><li>Touche <b>Ouvrir WhatsApp avec le message</b> et choisis le groupe.</li></ol></div>
<div class="card soft"><p class="eyebrow">Règles</p><ol class="teamsteps"><li>On ne supprime rien : une séance annulée passe en <b>Annulé</b>, un dossier qui s'arrête va dans <b>Archivés</b> avec son motif, un reçu faux se fait <b>Annuler</b> (avec la raison) puis on refait le bon.</li><li>Erreur de nom ou de numéro : <b>Modifier</b> sur la fiche de l'élève.</li><li>Jour férié ou fermeture : <b>Planning conduite</b> → le jour → « Fermer ce jour », puis <b>Prévenir</b> chaque élève.</li><li>Les créneaux du mois suivant se créent tout seuls le 24.</li></ol></div>
</div></div>
<div class="tm-pane" data-pane="dir" role="tabpanel" hidden>
<p class="tm-role">Vue d'ensemble de l'auto-école, mise à jour à chaque ouverture. Visible seulement par la direction.</p>
<div class="tm-bar"><b id="sd-drMonth" class="tm-drmonth"></b><button class="linkbtn" type="button" id="sd-drReload">Actualiser</button></div>
<div class="tm-stats tm-dr" id="sd-drStats"></div>
<div class="grid g2 tm-mon" style="margin-top:18px">
<div class="card"><p class="eyebrow">À surveiller</p><h3 class="tm-h3">Ce qui attend une action</h3><div id="sd-drWatch" class="tm-list"></div></div>
<div class="card"><p class="eyebrow">Activité</p><h3 class="tm-h3">Derniers mouvements</h3><div id="sd-drFeed" class="tm-list"></div></div>
</div>
<div class="card" style="margin-top:16px"><p class="eyebrow">6 derniers mois</p><h3 class="tm-h3">Inscriptions et encaissements</h3><div id="sd-drMonths" class="tm-months"></div></div>
</div>
<div class="tm-pane" data-pane="mon" role="tabpanel" hidden>
<p class="tm-role">Cours de code en salle, séances de conduite et progression des élèves.</p>
<div class="tm-week card"><div class="tm-wk-head"><div><p class="eyebrow">Cette semaine</p><h3 id="sd-tmTheme">Thème</h3></div><a class="btn btn-yellow btn-sm" href="#classe">Ouvrir le Mode classe</a></div>
<div class="tm-days">
<a class="tm-day" href="#classe-lecon"><b>Lundi · 14 h 30</b><span>Cours complet du thème</span><em>Mode classe → Leçon</em></a>
<a class="tm-day" href="#classe-devoir"><b>Mercredi · 14 h 30</b><span>Correction du devoir de la semaine</span><em>Mode classe → Devoir</em></a>
<a class="tm-day" href="#classe-quiz"><b>Vendredi · 14 h 30</b><span>Entraînement type examen</span><em>Mode classe → Quiz</em></a>
<a class="tm-day" href="#classe-situations"><b>Samedi · 10 h</b><span>Examen blanc</span><em>Quiz, situations, panneaux</em></a>
</div></div>
<div class="grid g2 tm-mon">
<div class="card" id="sd-mcCode"><p class="eyebrow">Cours de code</p><h3 class="tm-h3" id="sd-mcTitle">Chargement…</h3><div id="sd-mcBody"></div></div>
<div class="card" id="sd-mcDrive"><p class="eyebrow">Conduite</p><h3 class="tm-h3">Mes séances d'aujourd'hui</h3><div id="sd-mcList" class="tm-list"></div></div>
</div>
<div class="teamgrid" style="margin-top:16px">
<a class="card teamtile hl" href="#classe"><b>Mode classe</b><span>Projette les leçons, le devoir, le quiz, les panneaux et les carrefours en salle.</span><em>Lancer la projection →</em></a>
<a class="card teamtile" href="#devoirs"><b>Devoir de la semaine</b><span>Ce que font les élèves sur le site cette semaine.</span><em>Voir le devoir →</em></a>
</div>
<div class="tm-sub"><div><p class="eyebrow">Mode d'emploi</p><h3>Les gestes du moniteur</h3></div></div>
<div class="grid g2 tm-guides">
<div class="card soft"><p class="eyebrow">Après chaque cours de code</p><ol class="teamsteps"><li>Dans <b>Cours de code</b>, choisis le thème traité.</li><li>Coche les élèves présents (c'est enregistré tout de suite).</li><li>Touche <b>Cours fait</b>.</li></ol></div>
<div class="card soft"><p class="eyebrow">Séances de conduite</p><ol class="teamsteps"><li>Le matin, regarde <b>Mes séances d'aujourd'hui</b>.</li><li>Avant de partir : vérification de la voiture (Outils → check-list du matin).</li><li>Après la séance : <b>Fait</b> ou <b>Absent</b>, et une courte note sur les progrès.</li></ol></div>
</div></div>
<div class="tm-pane" data-pane="docs" role="tabpanel" hidden>
<p class="tm-role">Supports de communication et documents officiels SODAF, à télécharger ou à envoyer à l'imprimeur.</p>
<div class="entdocs"><div class="tm-sub"><div><p class="eyebrow">Réservé à l'équipe</p><h3>Documents de l'entreprise</h3></div><p>Supports de communication SODAF à télécharger ou à envoyer à l'imprimeur. Slogan officiel : « L'art de conduire, la force de réussir. »</p></div>
<div class="entgrid">
<div class="card entdoc"><img src="/entreprise/apercu-carte.jpg" alt="Carte de visite SODAF, recto" loading="lazy"><div><b>Carte de visite</b><span>85 × 55 mm, recto verso. PDF avec 3 mm de fond perdu, à envoyer tel quel à l'imprimeur (papier 350 g mat).</span><div class="acts"><a class="btn btn-green btn-sm" href="/entreprise/carte-visite-sodaf-91x61mm-fond-perdu.pdf" download>PDF imprimeur</a><a class="btn btn-line btn-sm" href="/entreprise/carte-sodaf-recto-300dpi.png" download>Recto PNG</a><a class="btn btn-line btn-sm" href="/entreprise/carte-sodaf-verso-300dpi.png" download>Verso PNG</a></div></div></div>
<div class="card entdoc"><img src="/entreprise/apercu-affiche-qr.jpg" alt="Affiche du code QR SODAF" loading="lazy" class="tall"><div><b>Affiche du code QR</b><span>A4, « Scanne et découvre SODAF », avec le mode d'emploi iPhone et Android. Pour la vitrine et la salle de code.</span><div class="acts"><a class="btn btn-green btn-sm" href="/entreprise/affiche-qr-sodaf.pdf" download>Affiche A4 (PDF)</a></div></div></div>
<div class="card entdoc"><img src="/entreprise/apercu-qr.jpg" alt="Code QR vers autosodaf.com" loading="lazy" class="sq"><div><b>Code QR seul</b><span>Mène à autosodaf.com. Pour autocollants, voiture école, publications. Minimum 3 cm sur une carte, 15 cm sur une voiture.</span><div class="acts"><a class="btn btn-green btn-sm" href="/entreprise/qr-sodaf.png" download>Code QR (PNG)</a></div></div></div>
<div class="card entdoc"><img src="/entreprise/cachet-sodaf-bleu.png" alt="Cachet SODAF" loading="lazy" class="sq"><div><b>Cachet SODAF</b><span>Rond, 40 mm. Le PDF noir est pour le graveur qui fabrique le tampon ; la version bleue sert aux reçus et documents numériques.</span><div class="acts"><a class="btn btn-green btn-sm" href="/entreprise/cachet-sodaf-40mm-graveur.pdf" download>PDF graveur</a><a class="btn btn-line btn-sm" href="/entreprise/cachet-sodaf-noir-1200px.png" download>Noir PNG</a><a class="btn btn-line btn-sm" href="/entreprise/cachet-sodaf-bleu.png" download>Bleu PNG</a></div></div></div>
<div class="card entdoc"><img src="/entreprise/apercu-couverture.jpg" alt="Couverture WhatsApp Business SODAF" loading="lazy"><div><b>Couverture WhatsApp Business</b><span>Image décorative 16:9 sans texte, à mettre derrière la photo de profil.</span><div class="acts"><a class="btn btn-green btn-sm" href="/entreprise/couverture-whatsapp-sodaf.png" download>Image (PNG)</a></div></div></div>
<div class="card entdoc"><img src="/apercu-fiche.jpg" alt="Fiche de renseignement" loading="lazy" class="tall"><div><b>Fiche de renseignement</b><span>Formations, tarifs, dossier à fournir. Aussi visible par le public dans Documents.</span><div class="acts"><a class="btn btn-green btn-sm" href="/fiche-renseignement-sodaf.pdf" download>PDF</a></div></div></div>
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
<div class="row2"><div class="field"><label for="sd-fName">Nom complet</label><input id="sd-fName" placeholder="Ex. Kossi Agbeko"></div><div class="field"><label for="sd-fPhone">Téléphone / WhatsApp</label><div class="tel"><span>+228</span><input id="sd-fPhone" inputmode="numeric" maxlength="11" autocomplete="tel-national" placeholder="90 00 00 00"></div></div></div>
<div class="row2"><div class="field"><label for="sd-fCat">Formation</label><select id="sd-fCat"><option value="Permis B">Permis B (voiture)</option><option value="Permis A">Permis A (moto)</option><option value="Remise à niveau">Remise à niveau (déjà titulaire du permis)</option><option value="Formation entreprise">Formation entreprise (chauffeurs)</option></select></div><div class="field"><label for="sd-fCity">Ville / quartier</label><input id="sd-fCity" placeholder="Ex. Lomé, Bè"></div></div>
<div class="row2"><div class="field"><label for="sd-fSlot">Créneau préféré</label><select id="sd-fSlot"><option>Tôt le matin</option><option>Après-midi</option><option>Samedi</option><option>Peu importe</option></select></div><div class="field"><label for="sd-fPay">Paiement</label><select id="sd-fPay"><option>En plusieurs tranches</option><option>En une fois</option></select></div></div>
<div class="field"><label for="sd-fMsg">Message (facultatif)</label><textarea id="sd-fMsg" placeholder="Une question, une contrainte d'horaire…"></textarea></div>
<p id="sd-fErr" style="color:var(--red);font-weight:600;margin-bottom:10px" hidden>Indique ton nom et ton numéro à 8 chiffres (après le +228).</p>
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
<div class="card"><p class="eyebrow">Nous trouver</p><p style="margin-top:8px;font-weight:600">412 Avenue Akei, Tokoin Tamé, Lomé</p><p style="color:var(--muted)">En face de la caisse</p><p style="margin-top:10px;font-size:.94rem"><b>Secrétariat</b> : du lundi au vendredi de 8 h à 12 h 30 et de 14 h 30 à 18 h, le samedi de 8 h à 12 h. Fermé le dimanche.</p><p style="margin-top:6px;font-size:.94rem"><b>Conduite</b>, sur rendez-vous : dès 6 h 30 en semaine et le samedi.</p><p style="margin-top:6px;font-size:.94rem;color:var(--muted)">Pendant la pause, écris-nous sur WhatsApp : on te répond au retour.</p><a class="btn btn-line btn-sm" style="margin-top:12px" href="https://www.google.com/maps/search/?api=1&query=412+Avenue+Akei+Tokoin+Tam%C3%A9+Lom%C3%A9" target="_blank" rel="noopener">Ouvrir l'itinéraire</a></div>
<div class="card soft"><p class="eyebrow">Ensuite</p><ol style="padding-left:1.2em;margin:10px 0 0;color:var(--muted)"><li>Le secrétariat te répond.</li><li>Tu déposes ton dossier.</li><li>On fixe ton premier cours.</li></ol></div>
</div></div></div>
</section>
</main>

<div class="pat-lane" aria-hidden="true"></div>
<footer class="site"><div class="wrap"><div class="cols">
<div><a class="logo flogo" href="#accueil" aria-label="SODAF, accueil">${LOGO("#FFFFFF", "ws")}</a><p class="fslogan">L'art de conduire, la force de réussir.</p><p style="margin-top:8px;max-width:40ch">Code, secourisme, mécanique et conduite, en salle et en ligne.</p></div>
<div><h4>Apprendre</h4><a href="#formations">Formations et tarifs</a><a href="#cours">Les cours</a><a href="#quiz">Le quiz</a><a href="#devoirs">Les devoirs</a><a href="#outils">Les outils</a><a href="#classe" class="fcls">Mode classe <span>Projection</span></a></div>
<div><h4>Secrétariat</h4><span class="phone">72 54 41 66</span><p class="faddr">412 Avenue Akei, Tokoin Tamé, Lomé<br>(en face de la caisse)</p><p class="faddr">Secrétariat : lun – ven 8 h – 12 h 30 et 14 h 30 – 18 h<br>Samedi 8 h – 12 h · Dimanche fermé</p><a href="https://www.google.com/maps/search/?api=1&query=412+Avenue+Akei+Tokoin+Tam%C3%A9+Lom%C3%A9" target="_blank" rel="noopener">Itinéraire Google Maps</a><a href="#inscription">Pré-inscription</a></div>
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
// Semaine en cours (heure de Lomé = UTC) : lundi au format AAAA-MM-JJ et devoir correspondant.
function devWeek(d) {
  d = d || new Date();
  const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  const n = Math.floor((day - new Date(DEV_START + "T00:00:00Z")) / 6048e5);
  return { key: day.toISOString().slice(0, 10), idx: Math.max(0, n) % DEV.length, monday: day };
}

const CK = ["Aucune fuite sous le véhicule","Carrosserie, feux et vitres propres","Pression des 4 pneus","Liquide de refroidissement","Huile moteur (entre MIN et MAX)","Liquide de frein et d'embrayage","Eau de la batterie (si non scellée)","Liquide de direction assistée","Lot de bord complet","Documents de bord valides","Carburant suffisant","Feux, frein et klaxon fonctionnent"];

function hideOtherBlocks(root) {
  const hidden = [];
  let el = root;
  while (el && el.parentElement && el.parentElement !== document.body) {
    const parent = el.parentElement;
    for (const sib of Array.from(parent.children)) {
      if (sib === el) continue;
      if (["SCRIPT", "STYLE", "LINK", "NOSCRIPT"].includes(sib.tagName)) continue;
      if (sib.style.display !== "none") { hidden.push([sib, sib.style.display]); sib.style.display = "none"; }
    }
    el = parent;
  }
  return () => hidden.forEach(([n, d]) => (n.style.display = d));
}

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
    ch.querySelector("header").appendChild(rb);
  });
  function syncRead() {
    $$(".toc button").forEach((b) => b.classList.toggle("read", read.includes(b.dataset.id)));
    $$(".read-btn").forEach((b) => { const r = read.includes(b.dataset.id); b.classList.toggle("done", r); b.textContent = r ? "✓ Lu" : "Marquer comme lu"; });
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
  const escH = (t) => String(t).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));
  const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const frDay = (d) => d.getUTCDate() + (d.getUTCDate() === 1 ? "er" : "") + " " + MOIS[d.getUTCMonth()];
  const cap = (t) => t.trim().replace(/\s+/g, " ").toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  let dv = null;
  function devList() {
    const w = devWeek(), cur = DEV[w.idx], sent = S.get("devSent", {}), best = S.get("devBest", {});
    const mine = sent[w.key + cur.l];
    devEl.innerHTML =
      '<div class="devnow"><div class="dl">' + cur.l + '</div><div><p class="eyebrow">Semaine du ' + frDay(w.monday) + '</p><h3>Devoir ' + cur.l + " · " + escH(cur.t) + "</h3><p>" +
      (mine != null ? '<span class="done">✓ Envoyé au moniteur : ' + mine + "/" + cur.q.length + "</span>" : "10 questions · à faire avant mercredi 14 h 30") + '</p></div><div class="devacts">' +
      '<button class="btn btn-yellow" data-dev="' + w.idx + '">' + (mine != null ? "Refaire pour m'entraîner" : "Commencer le devoir") + '</button><a class="btn btn-line btn-sm" href="#' + cur.q[0][4] + '">Réviser le cours</a></div></div>' +
      '<p class="devlist-h">Tous les devoirs · un cycle de 10 semaines</p><div class="devgrid">' +
      DEV.map((d, k) => '<button class="devtile' + (k === w.idx ? " now" : "") + '" data-dev="' + k + '"><b>' + d.l + "</b><span>" + escH(d.t) + "</span>" +
        (best[d.l] != null ? '<em class="ok">Ta meilleure note : ' + best[d.l] + "/" + d.q.length + "</em>" : "<em>" + (k === w.idx ? "Devoir de la semaine" : "Pas encore fait") + "</em>") + "</button>").join("") + "</div>";
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

  // ---------- Reçus de paiement (Espace équipe) ----------
  let rcPublic = () => {};
  (function () {
    const form = $("#sd-rcForm"); if (!form) return;
    const F = { f: $("#sd-rcForm select[name=formation]"), amt: $("#sd-rcAmt"), rest: $("#sd-rcRest"), restBox: $("#sd-rcRestBox"), other: $("#sd-rcOther") };
    const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F") + "\u00A0F";
    const price = () => +(F.f.selectedOptions[0].dataset.p || 0);
    const mk = () => (form.querySelector("input[name=motif]:checked") || {}).value || "autre";
    const MOTIF = { "ins-half": "Droit d'inscription + 1re moitié de la formation", "ins-full": "Droit d'inscription + formation complète", rest: "2e moitié de la formation (solde)", seance: "Séance de conduite supplémentaire" };
    const motifText = () => mk() === "autre" ? (F.other.value.trim() || "Autre paiement") : MOTIF[mk()];
    function calc(k, p) {
      if (k === "ins-half") return p ? [5000 + p / 2, p / 2] : null;
      if (k === "ins-full") return p ? [5000 + p, 0] : null;
      if (k === "rest") return p ? [p / 2, 0] : null;
      if (k === "seance") return [5000, ""];
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
    const escR = (t) => String(t).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));
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
    window.__sodafRcFill = (x) => { $("#sd-rcOut").hidden = true; form.reset(); fillFrom(x); $("#equipe-recu").scrollIntoView({ block: "start" }); };
    nameIn.addEventListener("input", () => {
      const list = (window.TEAM_ELEVES && window.TEAM_ELEVES()) || [];
      const x = list.find((y) => y.nom.toLowerCase() === nameIn.value.trim().toLowerCase());
      if (x) { if (+eidIn.value !== x.id) fillFrom(x); } else eidIn.value = "";
    });
    window.__sodafRcLink = (p) => {
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
    rcPublic = function (str) {
      const box = $("#sd-rcPub"), btn = $("#sd-rcPubDl");
      let d; try { d = rcDecode(str); } catch (e) { box.innerHTML = '<p class="card">Ce lien de reçu est incomplet. Demande au secrétariat SODAF de te le renvoyer : +228 72 54 41 66.</p>'; btn.hidden = true; return; }
      box.innerHTML = receiptHTML(d); btn.hidden = false;
      btn.onclick = async () => {
        btn.disabled = true; const t = btn.textContent; btn.textContent = "Préparation du PDF…";
        try { const f = await makePdf(d); const a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
        catch (e) {}
        btn.disabled = false; btn.textContent = t;
      };
    };
    function receiptHTML(d) {
      return '<div class="rc">' +
        '<div class="rc-top"><div class="rc-logo">' + LOGO("#FFFFFF", "word") + '<small>Auto-école · Lomé, Togo</small></div><div class="rc-no"><b>Reçu de paiement</b><span>N° ' + escR(d.no) + "</span><span>" + escR(d.dateTxt) + "</span></div></div>" +
        '<div class="rc-body">' +
        '<div class="rc-row"><span>Reçu de</span><b>' + escR(d.eleve) + "</b>" + (d.tel ? "<em>+228 " + escR(d.tel) + "</em>" : "") + "</div>" +
        '<div class="rc-row"><span>Formation</span><b>' + escR(d.formation) + "</b>" + (d.prix ? "<em>Prix de la formation : " + fmt(d.prix) + "</em>" : "") + "</div>" +
        '<div class="rc-row"><span>Motif</span><b>' + escR(d.motif) + "</b></div>" +
        '<div class="rc-amt"><span>Montant reçu</span><b>' + fmt(d.montant) + "</b><em>" + escR(lettres(d.montant)) + " francs CFA</em></div>" +
        '<div class="rc-grid"><div><span>Mode de paiement</span><b>' + escR(d.mode) + "</b></div><div><span>Reste à payer</span><b>" + (d.reste === "" ? "—" : d.reste > 0 ? fmt(d.reste) : "Formation soldée ✓") + "</b></div></div>" +
        (d.note ? '<p class="rc-note">' + escR(d.note) + "</p>" : "") +
        '<div class="rc-cond"><b>Bon à savoir</b>Le droit d\'inscription n\'est pas remboursable. Une séance de conduite non faite peut être reportée pendant 6 mois. Garde ce reçu jusqu\'à la fin de ta formation.</div>' +
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
      const link = "https://autosodaf.com/#recu-" + rcEncode(d);
      const msg = "Bonjour " + eleve.split(" ")[0] + ", merci pour ton paiement de " + fmt(montant).replace(/[\u202F\u00A0]/g, " ") + " (" + d.motif + "). Voici ton reçu SODAF n° " + no + " : " + link;
      const wa = $("#sd-rcWa");
      wa.href = tel ? "https://wa.me/228" + tel + "?text=" + encodeURIComponent(msg) : "https://wa.me/?text=" + encodeURIComponent(msg);
      wa.textContent = tel ? "Envoyer sur WhatsApp à " + eleve.split(" ")[0] : "Envoyer sur WhatsApp (choisir le contact)";
      out.hidden = false; status.textContent = "Préparation du PDF…"; status.className = "devsent";
      $("#sd-rcShare").disabled = true; $("#sd-rcDl").disabled = true;
      out.scrollIntoView({ block: "start" });
      // Enregistrement dans la base SODAF
      const sv = $("#sd-rcSaved"); sv.textContent = "Enregistrement…"; sv.className = "devsent";
      const eid = +($("#sd-rcEid").value || 0) || null;
      DB.q("paiements", { method: "POST", prefer: "return=minimal", body: { numero: no, jour: d.iso, eleve_id: eid, eleve_nom: eleve, telephone: tel ? "+228" + tel : null, formation: d.formation, prix: d.prix || null, motif: d.motif, montant, mode: d.mode, reste: d.reste === "" ? null : d.reste, note: d.note || null } })
        .then(() => { sv.textContent = "✓ Enregistré dans la base (Paiements)"; sv.className = "devsent ok"; if (window.TEAM_RELOAD_PAY) window.TEAM_RELOAD_PAY(); })
        .catch((er) => { sv.textContent = er.status === 401 ? "Session expirée : reconnecte-toi, puis refais le reçu." : "Pas de connexion : reçu non enregistré. Note-le et refais-le plus tard."; sv.className = "devsent ko"; });
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
    const ok = await DB.add("eleves", { nom: payload.nom, telephone: "+228" + payload.telephone.replace(/\D/g, "").slice(-8), formation: payload.formation, quartier: payload.quartier || null, creneau_prefere: payload.creneau, paiement_prefere: payload.paiement, message: payload.message || null, source: "site" });
    sendBtn.disabled = false; sendBtn.textContent = "Envoyer ma pré-inscription";
    $("#sd-waFail").href = WA + "?text=" + encodeURIComponent(waText);
    if (!ok) { $("#sd-fail").hidden = false; return; }
    const now = new Date();
    $("#sd-okWhen").textContent = "Reçue le " + now.toLocaleDateString("fr-FR") + " à " + now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    $("#sd-okName").textContent = payload.nom.split(" ")[0];
    $("#sd-okPhone").textContent = payload.telephone;
    const catLabel = $("#sd-fCat").selectedOptions[0].textContent;
    const rows = [["Formation", catLabel], ["Quartier", payload.quartier || "—"], ["Créneau", payload.creneau], ["Paiement", payload.paiement]];
    $("#sd-okRecap").innerHTML = rows.map(([k, v]) => "<dt>" + k + "</dt><dd>" + String(v).replace(/[<>&]/g, "") + "</dd>").join("");
    $("#sd-waLink").href = WA + "?text=" + encodeURIComponent("Bonjour SODAF, je viens d'envoyer ma pré-inscription sur le site (" + payload.nom + ", " + payload.formation + "). Quand puis-je passer au secrétariat ?");
    fieldsBox().forEach((c) => (c.hidden = true));
    $("#sd-ok").hidden = false;
    $("#sd-ok").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (sendBtn.disabled) return;
    const name = $("#sd-fName").value.trim(), digits = telDigits(), phone = "+228 " + digits.replace(/(\d{2})(?=\d)/g, "$1 ");
    const okForm = !!name && digits.length === 8;
    $("#sd-fErr").hidden = okForm;
    if (!okForm) return;
    lastPayload = { nom: name, telephone: phone, formation: $("#sd-fCat").value, quartier: $("#sd-fCity").value.trim(), creneau: $("#sd-fSlot").value, paiement: $("#sd-fPay").value, message: $("#sd-fMsg").value.trim(), source: "Site web" };
    const waText = "Bonjour SODAF, je souhaite m'inscrire.\nNom : " + name + "\nTéléphone : " + phone + "\nFormation : " + lastPayload.formation + "\nVille / quartier : " + (lastPayload.quartier || "—") + "\nCréneau : " + lastPayload.creneau + "\nPaiement : " + lastPayload.paiement + (lastPayload.message ? "\nMessage : " + lastPayload.message : "");
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
    const esc = (t) => String(t == null ? "" : t).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));
    const pad = (x) => String(x).padStart(2, "0");
    const iso = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    const dOf = (s) => new Date(s + "T12:00:00");
    const longDay = (s) => { const d = dOf(s); return J[d.getDay()] + " " + d.getDate() + " " + M[d.getMonth()]; };
    const F = (n) => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " F";
    const hmin = (h) => { const m = /(\d+) h (\d+)/.exec(h) || [0, 0, 0]; return +m[1] * 60 + +m[2]; };
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
    const pick = (t) => { tabs.forEach((b) => b.setAttribute("aria-selected", b.dataset.t === t)); panes.forEach((p) => (p.hidden = p.dataset.pane !== t)); try { S.set("tmTab", t); } catch (e) {} if (t === "mon") loadMon(); if (t === "dir") loadDir(); };
    tabs.forEach((b) => b.addEventListener("click", () => pick(b.dataset.t)));
    const subs = $$("#sd-secNav button"), secs = $$(".tm-sec");
    const LOAD = { eleves: () => loadEleves(), conduite: () => loadDay(), paiements: () => loadPay(), devoirs: () => loadDev() };
    const sub = (k) => { subs.forEach((b) => b.setAttribute("aria-selected", b.dataset.s === k)); secs.forEach((x) => (x.hidden = x.dataset.s !== k)); LOAD[k](); };
    subs.forEach((b) => b.addEventListener("click", () => sub(b.dataset.s)));
    $$('a[href="#equipe-recu"]').forEach((x) => x.addEventListener("click", () => { pick("sec"); sub("paiements"); }));
    { const w = devWeek(), dv = DEV[w.idx], n = new Date();
      $("#sd-tmTheme").textContent = "Devoir " + dv.l + " · " + dv.t;
      $("#sd-tmToday").textContent = "Nous sommes le " + J[n.getDay()] + " " + n.getDate() + " " + M[n.getMonth()] + ". Thème de la semaine : " + dv.t + " (devoir " + dv.l + ")."; }

    // Connexion
    $("#sd-teamForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = $("#sd-teamErr"), btn = $("#sd-tmGo"), email = $("#sd-tmEmail").value.trim(), pw = $("#sd-tmPw").value;
      if (!email || !pw) { err.textContent = "Indique ton e-mail et ton mot de passe."; err.hidden = false; return; }
      btn.disabled = true; btn.textContent = "Connexion…";
      try { await DB.login(email, pw); err.hidden = true; $("#sd-tmPw").value = ""; await start(); }
      catch (ex) { err.textContent = /Invalid login/i.test(ex.message) ? "E-mail ou mot de passe incorrect." : navigator.onLine === false ? "Pas de connexion internet." : ex.message; err.hidden = false; }
      btn.disabled = false; btn.textContent = "Se connecter";
    });
    $("#sd-teamOut").addEventListener("click", async () => { await DB.logout(); me = null; show(false); });
    $("#sd-tmPwBtn").addEventListener("click", () => { $("#sd-tmPwForm").hidden = !$("#sd-tmPwForm").hidden; });
    $("#sd-tmPwForm").addEventListener("submit", async (e) => {
      e.preventDefault(); const v = $("#sd-tmPw1").value, m = $("#sd-tmPwMsg");
      if (v.length < 8) { m.textContent = "8 caractères minimum."; return; }
      try { await DB.changePassword(v); m.textContent = "✓ Mot de passe changé."; $("#sd-tmPw1").value = ""; } catch (ex) { m.textContent = "Erreur : " + ex.message; }
    });

    async function start() {
      const s = DB.session; if (!s) { show(false); return; }
      const rows = await run(() => DB.q("profils?select=nom,role&id=eq." + s.user.id));
      if (!rows) return;
      if (!rows.length) { await DB.logout(); show(false); $("#sd-teamErr").textContent = "Ce compte n'est pas autorisé dans l'espace équipe."; $("#sd-teamErr").hidden = false; return; }
      me = rows[0];
      const rg = await run(() => DB.q("reglages?select=*")); if (rg) rg.forEach((r) => (CFG[r.cle] = r.valeur));
      $("#sd-tmHello").textContent = "Bonjour " + me.nom.split(" ")[0];
      $("#sd-tmRole").textContent = { admin: "Direction", secretariat: "Secrétariat", moniteur: "Moniteur" }[me.role] + " · Espace équipe SODAF";
      show(true);
      const dirTab = $('#sd-tmTabs [data-t="dir"]'); dirTab.hidden = me.role !== "admin";
      await loadEleves(true);
      let t0 = S.get("tmTab", me.role === "admin" ? "dir" : me.role === "moniteur" ? "mon" : "sec"); if (t0 === "dir" && me.role !== "admin") t0 = "sec";
      pick(t0);
      sub("eleves");
    }

    // ---- Parcours élèves : Accueil → Appels → En formation → Archivés
    const ST = ["Nouveau", "Contacté", "Inscrit", "En formation", "Permis obtenu", "Abandon"];
    const ETAPES = { accueil: ["Nouveau"], appels: ["Contacté"], formation: ["Inscrit", "En formation", "Permis obtenu"], archives: ["Abandon"] };
    const etapeOf = (x) => (x.statut === "Contacté" && x.dossier_envoye_le ? "dossier" : Object.keys(ETAPES).find((k) => ETAPES[k].includes(x.statut)) || "accueil");
    const CFG = {};
    const PRIXM = { "Permis B": "55 000 F la formation complète (formule courte 35 000 F, accélérée 75 000 F en 2 mois ou 80 000 F en 1 mois)", "Permis A": "30 000 F", "Pack A + B": "80 000 F", "Remise à niveau": "20 000 F", "Formation entreprise": "sur devis, selon le nombre de chauffeurs" };
    const jours = (d) => Math.floor((Date.now() - new Date(d)) / 864e5);
    const dosAge = (x) => jours(x.dossier_relance_le && x.dossier_relance_le > x.dossier_envoye_le ? x.dossier_relance_le : x.dossier_envoye_le);
    const msgDossier = (x) => "Bonjour " + prenom(x) + " 😊\nComme promis, voici ton dossier d'inscription SODAF Auto-École.\n\n*TON DOSSIER N° " + x.id + "*\n• Formation : " + (x.formation || "à préciser") + "\n• Prix : " + (PRIXM[x.formation] || "voir autosodaf.com") + "\n• Droit d'inscription : 5 000 F\n• Paiement en 2 fois : la moitié à l'inscription, le reste avant ta 1re séance de conduite.\n\n📄 Fiche de renseignement (à remplir et à apporter au bureau) :\nhttps://autosodaf.com/fiche-renseignement-sodaf.pdf\n📅 Planning de la semaine :\nhttps://autosodaf.com/planning-semaine-sodaf.pdf\n\n🗂️ Pièces à préparer : acte de naissance, carte d'identité, photos d'identité" + (/B/.test(x.formation || "") ? ", quittance d'examen de 35 000 F" : "") + ".\n\n💳 *Pour t'inscrire, 2 possibilités :*\n1. Au bureau, en espèces.\n2. À distance par Mixx by Yas (T-Money) : " + (CFG.mixx_numero ? "envoie au " + CFG.mixx_numero + (CFG.mixx_nom ? " (" + CFG.mixx_nom + ")" : "") + " avec le motif « SODAF " + x.id + " », puis envoie-nous la capture ici." : "réponds « Mixx » et nous t'envoyons le numéro de paiement.") + "\nDès réception, tu reçois ton reçu officiel sur WhatsApp.\n\n📍 Nous trouver : " + (CFG.maps_lien || "412 Avenue Akei, Tokoin Tamé") + "\n412 Avenue Akei, Tokoin Tamé (en face de la caisse)\n🕗 Lun – ven 8 h – 12 h 30 et 14 h 30 – 18 h · Sam 8 h – 12 h\n\nDes questions ? Réponds simplement à ce message.\nL'équipe SODAF · L'art de conduire, la force de réussir.";
    const msgRelDos = (x) => "Bonjour " + prenom(x) + ", c'est le secrétariat de SODAF Auto-École. As-tu pu regarder ton dossier d'inscription (n° " + x.id + ") ? Si tu as une question sur le prix, les horaires ou le paiement, on est là. Tu peux payer au bureau ou par Mixx by Yas, et commencer le code dès la semaine prochaine 🚗";
    const PRIX = { "Permis B": "55 000 F la formation complète (formule courte dès 35 000 F, accélérée 75 000 ou 80 000 F)", "Permis A": "30 000 F", "Pack A + B": "80 000 F", "Remise à niveau": "20 000 F", "Formation entreprise": "sur devis" };
    const PIECES = [["acte", "Acte de naissance"], ["cni", "Carte d'identité"], ["photos", "Photos d'identité"], ["quittance", "Quittance d'examen (permis B)"], ["deja", "A déjà conduit"]];
    const prenom = (x) => (x.nom || "").trim().split(/\s+/)[0];
    const msgAccueil = (x) => "Bonjour " + prenom(x) + " 👋\nIci le secrétariat de SODAF Auto-École. Nous avons bien reçu ta pré-inscription, merci !\n\n*TON DOSSIER*\n• N° " + x.id + "\n• Formation : " + (x.formation || "à préciser") + "\n\nNous allons t'appeler très bientôt pour répondre à tes questions et préparer ton inscription. Garde ton téléphone près de toi 😉\n\n📍 412 Avenue Akei, Tokoin Tamé (en face de la caisse)\n🕗 Lun – ven 8 h – 12 h 30 et 14 h 30 – 18 h · Sam 8 h – 12 h\n\nÀ très vite !\nL'équipe SODAF · L'art de conduire, la force de réussir.\nautosodaf.com";
    const msgRelance = (x) => "Bonjour " + prenom(x) + ", ici SODAF Auto-École. Nous avons essayé de te joindre plusieurs fois au sujet de ta pré-inscription (" + (x.formation || "permis") + "), sans succès. Si tu es toujours intéressé(e), réponds simplement à ce message ou appelle-nous au 72 54 41 66. Ton dossier n° " + x.id + " reste ouvert. Bonne journée !";
    const script = (x) => "<p><b>Bonjour, je suis [ton prénom] du secrétariat de SODAF Auto-École. Tu as fait une pré-inscription sur notre site pour le " + esc(x.formation || "permis") + ". As-tu deux minutes ?</b></p>" +
      "<p>→ <b>La formation</b> : code en salle lundi, mercredi et vendredi à 14 h 30, plus les cours et quiz sur autosodaf.com. Conduite par séances d'une heure avec le moniteur. Examen blanc chaque samedi à 10 h.</p>" +
      "<p>→ <b>Le prix</b> : " + esc(PRIX[x.formation] || "voir les tarifs") + ", plus 5 000 F d'inscription. On paie en 2 fois : la moitié à l'inscription, le reste avant la première séance de conduite. Espèces ou Mixx by Yas (T-Money).</p>" +
      "<p>→ <b>Les pièces</b> : acte de naissance, carte d'identité, photos d'identité" + (/B/.test(x.formation || "") ? ", et la quittance d'examen de 35 000 F" : "") + ".</p>" +
      "<p>→ <b>Quand peux-tu passer au bureau pour t'inscrire ?</b> Lun – ven 8 h – 12 h 30 et 14 h 30 – 18 h, samedi 8 h – 12 h.</p>";
    const ago = (d) => { const m = Math.round((Date.now() - new Date(d)) / 60000); return m < 60 ? "il y a " + Math.max(m, 1) + " min" : m < 1440 ? "il y a " + Math.round(m / 60) + " h" : "il y a " + Math.round(m / 1440) + " j"; };
    let pcStage = S.get("pcStage", "accueil"), pcSel = null, pcFeed = [];
    const isWide = () => window.matchMedia("(min-width: 900px)").matches;

    async function loadEleves(silent) {
      const r = await run(() => DB.q("eleves?select=*&order=cree_le.desc&limit=2000"));
      if (!r) return; eleves = r;
      const nb = eleves.filter((x) => x.statut === "Nouveau").length;
      $("#sd-cntNew").textContent = nb ? nb : "";
      renderList();
      fillEleveSelect();
    }
    function groupsFor(stage, list) {
      if (stage === "accueil") return [["À accueillir", list.slice().sort((a, b) => (a.cree_le < b.cree_le ? -1 : 1))]];
      if (stage === "appels") return [["À appeler · 1er appel", list.filter((x) => !x.rappel), "first"], ["Rappeler le matin", list.filter((x) => x.rappel === "matin"), "matin"], ["Rappeler l'après-midi", list.filter((x) => x.rappel === "apres-midi"), "am"]];
      if (stage === "dossier") return [["À relancer · 3 jours et plus", list.filter((x) => dosAge(x) >= 3), "late"], ["En réflexion", list.filter((x) => dosAge(x) < 3), "wait"]];
      if (stage === "formation") return ["Inscrit", "En formation", "Permis obtenu"].map((s) => [s, list.filter((x) => x.statut === s)]);
      return ["Plus tard", "Injoignable", "Rétractation", "Faux numéro"].map((m) => [m, list.filter((x) => x.archive_motif === m)]).concat([["Sans motif", list.filter((x) => !x.archive_motif)]]);
    }
    function renderList() {
      const q = $("#sd-pcQ").value.trim().toLowerCase();
      $$("#sd-pcStages button").forEach((b) => { const n = eleves.filter((x) => etapeOf(x) === b.dataset.st).length; b.querySelector("em").textContent = n; b.setAttribute("aria-selected", b.dataset.st === pcStage); });
      const list = eleves.filter((x) => etapeOf(x) === pcStage && (!q || (x.nom + " " + (x.telephone || "") + " " + x.id).toLowerCase().includes(q)));
      const fold = foldState(), TAG = { first: "1er appel", matin: "Matin", am: "Après-midi", late: "À relancer", wait: "En réflexion" };
      const isOpen = (g) => !["matin", "am"].includes(g[2]) || !!q || fold[g[2]];
      const html = groupsFor(pcStage, list).filter((g) => g[1].length).map((g) => (g[2] && ["matin", "am"].includes(g[2])
        ? '<button type="button" class="pc-gh pc-fold g-' + g[2] + '" data-fold="' + g[2] + '" aria-expanded="' + isOpen(g) + '"><i aria-hidden="true">▸</i>' + esc(g[0]) + " <span>" + g[1].length + "</span></button>"
        : '<p class="pc-gh' + (g[2] ? " g-" + g[2] : "") + '">' + esc(g[0]) + " <span>" + g[1].length + "</span></p>") + (isOpen(g) ? g[1].map((x) =>
        '<button type="button" class="pc-item' + (g[2] ? " i-" + g[2] : "") + (x.id === pcSel ? " on" : "") + '" data-id="' + x.id + '"><b>' + esc(x.nom) + (g[2] ? ' <em class="pc-tag t-' + g[2] + '">' + TAG[g[2]] + "</em>" : "") + '</b><span>' + esc((x.telephone || "").replace("+228", "+228 ")) + (x.formation ? " · " + esc(x.formation) : "") + "</span><small>N° " + x.id + " · " +
        (pcStage === "accueil" ? (x.accueil_le ? "accueil envoyé ✓" : "arrivé " + ago(x.cree_le)) : pcStage === "appels" ? (x.appels ? x.appels + "X sans réponse" : "pas encore appelé") : pcStage === "dossier" ? "dossier envoyé " + ago(x.dossier_envoye_le) + (x.dossier_relance_le ? " · relancé " + ago(x.dossier_relance_le) : "") : pcStage === "archives" ? "archivé " + (x.archive_le ? ago(x.archive_le) : "") : esc(x.statut)) + "</small></button>").join("") : "")).join("");
      $("#sd-pcList").innerHTML = html || '<p class="tm-empty">' + ({ accueil: "Aucune nouvelle pré-inscription. Elles arrivent ici toutes seules depuis le site.", appels: "Personne à appeler pour l'instant.", dossier: "Aucun dossier en attente. Après un appel, « Intéressé : envoyer le dossier » les range ici.", formation: "Aucun élève en formation pour l'instant.", archives: "Aucun dossier archivé." }[pcStage]) + "</p>";
      if (pcSel && !list.some((x) => x.id === pcSel)) pcSel = null;
      if (!pcSel && isWide()) { const first = $("#sd-pcList .pc-item"); if (first) { pcSel = +first.dataset.id; first.classList.add("on"); } }
      renderDetail();
    }
    $("#sd-pcQ").addEventListener("input", renderList);
    // Groupes « Rappeler le matin / l'après-midi » repliables. Par défaut : le matin on voit le matin, l'après-midi on voit l'après-midi.
    function foldState() {
      const h = new Date().getHours(), key = iso(new Date()) + (h < 12 ? "m" : "a"), f = S.get("pcFold", null);
      return f && f.key === key ? f : { key, matin: h < 12, am: h >= 12 };
    }
    $("#sd-pcList").addEventListener("click", (e) => { const b = e.target.closest("[data-fold]"); if (!b) return; const f = foldState(); f[b.dataset.fold] = !f[b.dataset.fold]; S.set("pcFold", f); renderList(); });
    $("#sd-pcStages").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; pcStage = b.dataset.st; pcSel = null; S.set("pcStage", pcStage); renderList(); });
    $("#sd-pcList").addEventListener("click", (e) => { const b = e.target.closest(".pc-item"); if (!b) return; pcSel = +b.dataset.id; $$("#sd-pcList .pc-item").forEach((i) => i.classList.toggle("on", i === b)); renderDetail(); if (!isWide()) $("#sd-pc").scrollIntoView({ block: "start" }); });

    async function patchEl(x, body, okMsg, log) {
      const ok = await run(() => DB.q("eleves?id=eq." + x.id, { method: "PATCH", body, prefer: "return=minimal" }), okMsg);
      if (!ok) return false;
      Object.assign(x, body);
      if (log) await addSuivi(x, log[0], log[1]);
      $("#sd-cntNew").textContent = eleves.filter((y) => y.statut === "Nouveau").length || "";
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

    async function renderDetail() {
      const box = $("#sd-pcDetail"), pc = $("#sd-pc");
      const x = eleves.find((y) => y.id === pcSel);
      pc.classList.toggle("has-sel", !!x);
      if (!x) { box.innerHTML = '<div class="pc-none"><b>Choisis un dossier dans la liste</b><span>Sa fiche, les messages prêts et les actions s\'affichent ici.</span></div>'; return; }
      const st = etapeOf(x), n = waNum(x.telephone), wa = (t) => "https://wa.me/228" + n + "?text=" + encodeURIComponent(t);
      const head = '<button type="button" class="linkbtn pc-back" data-a="back">← Retour à la liste</button><div class="pc-head"><div><p class="eyebrow">' + { accueil: "Accueil", appels: "Zone d'appel", dossier: "Dossier envoyé · en réflexion", formation: "En formation", archives: "Archivé" }[st] + '</p><h3>' + esc(x.nom) + ' <span>| ' + x.id + "</span></h3></div>" +
        ({ accueil: '<button class="btn btn-blue btn-sm" type="button" data-a="toCall">Basculer en zone d\'appel →</button>', appels: '<button class="btn btn-green btn-sm" type="button" data-a="prepDossier">Intéressé : envoyer le dossier →</button>', dossier: '<button class="btn btn-green btn-sm" type="button" data-a="enroll">Paiement reçu : faire le reçu</button>', formation: '<button class="btn btn-green btn-sm" type="button" data-a="rc">Faire un reçu</button>', archives: '<button class="btn btn-blue btn-sm" type="button" data-a="revive">Ressortir : remettre en appel</button>' }[st]) + "</div>";
      const info = '<div class="pc-info"><div><span>N° dossier</span><b>' + x.id + '</b></div><div><span>Téléphone</span><b>' + (n ? '<a href="tel:+228' + n + '">+228 ' + n.replace(/(\d{2})(?=\d)/g, "$1 ") + "</a>" : "—") + '</b></div><div><span>Formation</span><b>' + esc(x.formation || "—") + '</b></div><div><span>Quartier</span><b>' + esc(x.quartier || "—") + "</b></div>" +
        '<div><span>Préfère</span><b>' + esc(x.creneau_prefere || "—") + '</b></div><div><span>Paiement</span><b>' + esc(x.paiement_prefere || "—") + '</b></div><div><span>Arrivé</span><b>' + new Date(x.cree_le).toLocaleDateString("fr-FR") + " · " + (x.source === "site" ? "site" : "bureau") + "</b></div>" +
        '<div><span>Statut</span><b>' + (st === "formation" ? '<select data-a="statut">' + ETAPES.formation.map((t) => "<option" + (t === x.statut ? " selected" : "") + ">" + t + "</option>").join("") + "</select>" : esc(x.statut === "Abandon" ? "Archivé" + (x.archive_motif ? " · " + x.archive_motif : "") : x.statut)) + "</b></div>" +
        (x.message ? '<div class="wide"><span>Son message</span><b>« ' + esc(x.message) + " »</b></div>" : "") + (x.notes ? '<div class="wide"><span>Note interne</span><b>' + esc(x.notes) + "</b></div>" : "") + "</div>";
      let body = "";
      if (st === "accueil") {
        body = '<p class="pc-proto">Protocole : envoie le message d\'accueil sur WhatsApp, puis bascule le dossier en zone d\'appel.</p>' +
          '<div class="pc-block"><div class="pc-bh"><b>Message d\'accueil</b>' + (x.accueil_le ? '<span class="pc-ok">✓ Envoyé ' + ago(x.accueil_le) + "</span>" : "") + '</div><textarea id="sd-pcMsg" rows="14">' + esc(msgAccueil(x)) + '</textarea>' +
          '<div class="tm-formact">' + (n ? '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" data-a="sendWelcome" href="' + wa(msgAccueil(x)) + '">Envoyer l\'accueil sur WhatsApp ↗</a>' : '<span class="tm-err">Pas de numéro : ajoute-le avec Modifier.</span>') + "</div></div>" +
          '<div class="pc-foot"><span>Numéro qui ne marche pas ?</span><button class="btn btn-sm pc-red" type="button" data-arch="Faux numéro">Coordonnées erronées / Faux numéro</button></div>';
      } else if (st === "appels") {
        const t = x.appels || 0;
        body = '<div class="pc-block"><div class="pc-bh"><b>Historique d\'appels</b></div><div class="pc-calls"><div><p class="pc-lab">Quand rappeler</p><div class="pc-steps">' +
          [["", "À appeler"], ["matin", "Rappeler le matin"], ["apres-midi", "Rappeler l'après-midi"]].map((r) => '<button type="button" data-rappel="' + r[0] + '" aria-pressed="' + ((x.rappel || "") === r[0]) + '">' + r[1] + "</button>").join("") + "</div></div>" +
          '<div><p class="pc-lab">Tentatives sans réponse</p><div class="pc-tries">' + [1, 2, 3, 4].map((i) => '<i class="' + (i <= t ? "on" : "") + '">' + i + "X" + (i === 4 ? " · injoignable" : "") + "</i>").join("") + "</div></div></div>" +
          '<div class="tm-formact"><button class="btn btn-green btn-sm" type="button" data-a="callOk">✓ Appel réussi</button><button class="btn btn-line btn-sm" type="button" data-a="callKo">✗ Pas de réponse</button><input id="sd-pcCallNote" placeholder="Ce qu\'il a dit (facultatif)" maxlength="300"></div>' +
          (t >= 4 ? '<div class="pc-alert"><b>4 appels sans réponse.</b> Envoie la relance WhatsApp, puis range le dossier en « Injoignable ». Tu pourras le ressortir s\'il répond.<div class="tm-formact">' + (n ? '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" data-a="relance" href="' + wa(msgRelance(x)) + '">Envoyer la relance ↗</a>' : "") + '<button class="btn btn-sm pc-red" type="button" data-arch="Injoignable">Archiver : Injoignable</button></div></div>' : "") + "</div>" +
          '<div class="pc-block pc-dos" id="sd-pcDos" hidden><div class="pc-bh"><b>Dossier à envoyer sur WhatsApp</b><span class="tm-note" style="margin:0!important">Fiche, planning, prix, paiement, localisation</span></div><textarea id="sd-pcDosMsg" rows="16">' + esc(msgDossier(x)) + '</textarea><div class="tm-formact">' + (n ? '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" data-a="sendDossier" href="' + wa(msgDossier(x)) + '">Envoyer le dossier sur WhatsApp ↗</a>' : '<span class="tm-err">Pas de numéro : ajoute-le avec Modifier.</span>') + '<span class="tm-note" style="margin:0!important">Après l\'envoi, le dossier passe dans « Dossier envoyé ».</span></div></div>' +
          '<div class="pc-block"><div class="pc-bh"><b>Script d\'appel</b><span class="tm-note" style="margin:0!important">' + esc(x.formation || "") + '</span></div><div class="pc-script">' + script(x) + "</div></div>";
      } else if (st === "dossier") {
        const age = jours(x.dossier_envoye_le), late = dosAge(x) >= 3;
        body = '<p class="pc-proto">Protocole : l\'élève réfléchit. Relance-le après 3 jours sans nouvelles. Dès qu\'il paie (au bureau ou capture Mixx vérifiée sur le téléphone de l\'agence) : « Paiement reçu : faire le reçu ».</p>' +
          '<div class="pc-block"><div class="pc-bh"><b>Dossier envoyé</b><span class="pc-ok">' + (age === 0 ? "aujourd'hui" : "il y a " + age + (age > 1 ? " jours" : " jour")) + (x.dossier_relance_le ? " · relancé " + ago(x.dossier_relance_le) : "") + "</span></div>" +
          (late ? '<div class="pc-alert" style="margin-top:0"><b>Pas de nouvelles depuis ' + dosAge(x) + ' jours.</b> Envoie la relance, ou appelle-le.<div class="tm-formact">' + (n ? '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" data-a="relDossier" href="' + wa(msgRelDos(x)) + '">Envoyer la relance ↗</a>' : "") + "</div></div>" : (n ? '<div class="tm-formact"><a class="btn btn-line btn-sm" target="_blank" rel="noopener" data-a="relDossier" href="' + wa(msgRelDos(x)) + '">Relancer quand même ↗</a></div>' : "")) +
          '<details class="pc-more"><summary>Revoir ou renvoyer le dossier</summary><textarea id="sd-pcDosMsg" rows="14">' + esc(msgDossier(x)) + '</textarea><div class="tm-formact">' + (n ? '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" data-a="resendDossier" href="' + wa(msgDossier(x)) + '">Renvoyer le dossier ↗</a>' : "") + "</div></details></div>";
      } else if (st === "formation") {
        body = '<div class="pc-block"><div class="pc-bh"><b>Paiements</b></div><div id="sd-pcPay"><p class="tm-note">Chargement…</p></div></div><div class="pc-block"><div class="pc-bh"><b>Conduite</b></div><div id="sd-pcDrive"><p class="tm-note">Chargement…</p></div></div>';
      } else {
        body = '<div class="pc-block"><p>Archivé ' + (x.archive_le ? "le " + new Date(x.archive_le).toLocaleDateString("fr-FR") : "") + (x.archive_motif ? " · motif : <b>" + esc(x.archive_motif) + "</b>" : "") + '.</p><p class="tm-note">« Ressortir » le remet dans la zone d\'appel, compteur d\'appels remis à zéro.</p>' + (n ? '<div class="tm-formact"><a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="https://wa.me/228' + n + '">Écrire sur WhatsApp</a></div>' : "") + "</div>";
      }
      const pieces = st === "accueil" || st === "archives" ? "" : '<div class="pc-block"><div class="pc-bh"><b>Dossier d\'inscription</b></div><div class="pc-checks">' + PIECES.map((p) => '<label><input type="checkbox" data-piece="' + p[0] + '"' + (x.dossier && x.dossier[p[0]] ? " checked" : "") + "> " + p[1] + "</label>").join("") + "</div></div>";
      const arch = st === "dossier" ? '<div class="pc-foot"><span>Ranger le dossier</span><div class="tm-acts"><button class="linkbtn" type="button" data-a="backCall">Revenir en zone d\'appel</button><button class="btn btn-line btn-sm" type="button" data-arch="Plus tard">Plus tard (potentiel)</button><button class="btn btn-sm pc-dark" type="button" data-arch="Rétractation">Archiver – Rétractation</button></div></div>' : st === "appels" ? '<div class="pc-foot"><span>Ranger le dossier</span><div class="tm-acts"><button class="btn btn-line btn-sm" type="button" data-arch="Plus tard">Plus tard (potentiel)</button><button class="btn btn-sm pc-dark" type="button" data-arch="Rétractation">Archiver – Rétractation</button><button class="btn btn-sm pc-red" type="button" data-arch="Faux numéro">Faux numéro</button></div></div>' : "";
      const suivi = '<div class="pc-block"><div class="pc-bh"><b>Suivi</b><button class="linkbtn" type="button" data-a="edit">Modifier la fiche</button></div><div class="tm-formact" style="margin:0 0 10px"><input id="sd-pcNote" placeholder="Ajouter une note au dossier" maxlength="300"><button class="btn btn-line btn-sm" type="button" data-a="note">Ajouter</button></div><div id="sd-pcFeed" class="pc-feed"><p class="tm-note">Chargement…</p></div></div>';
      box.innerHTML = head + info + body + pieces + arch + suivi;
      const id = x.id;
      const fd = await run(() => DB.q("suivi?select=*&eleve_id=eq." + id + "&order=le.desc&limit=50"));
      if (pcSel !== id) return;
      pcFeed = fd || [];
      $("#sd-pcFeed").innerHTML = pcFeed.length ? pcFeed.map((s) => '<div><time>' + new Date(s.le).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) + "</time><b>" + esc(s.type) + "</b>" + (s.note ? "<span>" + esc(s.note) + "</span>" : "") + "</div>").join("") : '<p class="tm-note">Rien pour l\'instant.</p>';
      if (st === "formation") {
        const [py, cd] = await Promise.all([run(() => DB.q("paiements?select=*&eleve_id=eq." + id + "&order=cree_le.desc")), run(() => DB.q("creneaux_conduite?select=jour,heure,statut&eleve_id=eq." + id + "&order=jour.desc&limit=60"))]);
        if (pcSel !== id) return;
        const ok = (py || []).filter((p) => !p.annule), paid = ok.reduce((a, p) => a + p.montant, 0), last = ok[0];
        $("#sd-pcPay").innerHTML = ok.length ? '<div class="pc-mini"><div><span>Payé</span><b>' + F(paid) + '</b></div><div><span>Reste</span><b>' + (last && last.reste > 0 ? F(last.reste) : "Soldé ✓") + "</b></div></div>" + ok.slice(0, 5).map((p) => '<div class="pc-line"><span>' + dOf(p.jour).toLocaleDateString("fr-FR") + "</span><b>" + F(p.montant) + "</b><em>" + esc(p.motif) + "</em>" + (window.__sodafRcLink ? '<a target="_blank" rel="noopener" href="' + window.__sodafRcLink(p) + '">reçu</a>' : "") + "</div>").join("") : '<p class="tm-note">Aucun paiement enregistré. Touche « Faire un reçu ».</p>';
        const c = cd || [], fait = c.filter((s) => s.statut === "Fait").length, abs = c.filter((s) => s.statut === "Absent").length, next = c.filter((s) => s.statut === "Réservé" && s.jour >= iso(new Date())).sort((a, b) => (a.jour < b.jour ? -1 : 1))[0];
        $("#sd-pcDrive").innerHTML = '<div class="pc-mini"><div><span>Séances faites</span><b>' + fait + '</b></div><div><span>Absences</span><b>' + abs + '</b></div><div><span>Prochaine</span><b>' + (next ? longDay(next.jour) + " · " + esc(next.heure) : "—") + "</b></div></div>";
      }
    }
    $("#sd-pcDetail").addEventListener("click", async (e) => {
      const x = eleves.find((y) => y.id === pcSel); if (!x) return;
      const a = e.target.closest("[data-a]"), ar = e.target.closest("[data-arch]"), rp = e.target.closest("[data-rappel]");
      if (ar) { confirmBtn(ar, () => archive(x, ar.dataset.arch)); return; }
      if (rp) { const v = rp.dataset.rappel || null; if (await patchEl(x, { rappel: v }, "Enregistré")) renderList(); return; }
      if (!a) return;
      const k = a.dataset.a;
      if (k === "back") { pcSel = null; renderList(); $("#sd-pc").scrollIntoView({ block: "start" }); }
      else if (k === "sendWelcome") { const txt = $("#sd-pcMsg").value; a.href = "https://wa.me/228" + waNum(x.telephone) + "?text=" + encodeURIComponent(txt); await patchEl(x, { accueil_le: new Date().toISOString() }, "Accueil noté comme envoyé", ["Accueil envoyé"]); renderList(); }
      else if (k === "toCall") { if (await patchEl(x, { statut: "Contacté", appels: 0 }, "Dossier en zone d'appel", ["Étape", "Passé en zone d'appel"])) nextAfter(x); }
      else if (k === "callOk") { const note = $("#sd-pcCallNote").value.trim(); await addSuivi(x, "Appel réussi", note); toast("Appel noté"); renderDetail(); }
      else if (k === "callKo") { const note = $("#sd-pcCallNote").value.trim(); if (await patchEl(x, { appels: Math.min((x.appels || 0) + 1, 20) }, "Tentative notée (" + ((x.appels || 0) + 1) + "X)", ["Appel sans réponse", note])) renderList(); }
      else if (k === "prepDossier") { const b = $("#sd-pcDos"); b.hidden = false; b.scrollIntoView({ block: "center" }); $("#sd-pcDosMsg").focus(); }
      else if (k === "sendDossier") { a.href = "https://wa.me/228" + waNum(x.telephone) + "?text=" + encodeURIComponent($("#sd-pcDosMsg").value); if (await patchEl(x, { dossier_envoye_le: new Date().toISOString(), dossier_relance_le: null, rappel: null }, "Dossier envoyé : il passe en réflexion", ["Étape", "Dossier envoyé (fiche, planning, prix, paiement)"])) nextAfter(x); }
      else if (k === "resendDossier") { a.href = "https://wa.me/228" + waNum(x.telephone) + "?text=" + encodeURIComponent($("#sd-pcDosMsg").value); await patchEl(x, { dossier_envoye_le: new Date().toISOString(), dossier_relance_le: null }, "Dossier renvoyé", ["Étape", "Dossier renvoyé"]); renderList(); }
      else if (k === "relDossier") { if (await patchEl(x, { dossier_relance_le: new Date().toISOString() }, "Relance notée", ["Relance envoyée", "Relance du dossier"])) renderList(); }
      else if (k === "backCall") { if (await patchEl(x, { dossier_envoye_le: null, dossier_relance_le: null }, "Dossier remis en zone d'appel", ["Étape", "Revenu en zone d'appel"])) nextAfter(x); }
      else if (k === "relance") { await addSuivi(x, "Relance envoyée"); toast("Relance notée"); }
      else if (k === "enroll") { if (await patchEl(x, { statut: "Inscrit", rappel: null }, "Inscrit : fais le reçu", ["Étape", "Inscrit"])) { renderList(); if (window.__sodafRcFill) { sub("paiements"); window.__sodafRcFill(x); } } }
      else if (k === "rc") { if (window.__sodafRcFill) { sub("paiements"); window.__sodafRcFill(x); } }
      else if (k === "revive") { if (await patchEl(x, { statut: "Contacté", archive_motif: null, archive_le: null, appels: 0, rappel: null, dossier_envoye_le: null, dossier_relance_le: null }, "Dossier remis en appel", ["Étape", "Ressorti des archives"])) nextAfter(x); }
      else if (k === "note") { const v = $("#sd-pcNote").value.trim(); if (!v) return; await addSuivi(x, "Note", v); toast("Note ajoutée"); renderDetail(); }
      else if (k === "edit") editForm(x);
    });
    $("#sd-pcDetail").addEventListener("change", async (e) => {
      const x = eleves.find((y) => y.id === pcSel); if (!x) return;
      const pc = e.target.closest("[data-piece]");
      if (pc) { const d = Object.assign({}, x.dossier || {}); d[pc.dataset.piece] = pc.checked; await patchEl(x, { dossier: d }, "Dossier mis à jour"); return; }
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
        if (await patchEl(x, body, "Fiche élève enregistrée")) { fillEleveSelect(); renderList(); }
      });
    }
    $("#sd-elAddBtn").addEventListener("click", () => { $("#sd-elAdd").hidden = false; $("#sd-elN").focus(); });
    $("#sd-elCancel").addEventListener("click", () => { $("#sd-elAdd").hidden = true; });
    $("#sd-elAdd").addEventListener("submit", async (e) => {
      e.preventDefault();
      const nom = $("#sd-elN").value.trim().replace(/\s+/g, " "), tel = $("#sd-elT").value.replace(/\D/g, ""), err = $("#sd-elErr"), statut = $("#sd-elSt").value;
      if (nom.length < 3 || (tel && tel.length !== 8)) { err.textContent = "Nom (3 lettres min.) et numéro à 8 chiffres."; return; }
      err.textContent = "";
      const r = await run(() => DB.q("eleves", { method: "POST", body: { nom, telephone: tel ? "+228" + tel : null, formation: $("#sd-elFo").value, source: "bureau", statut }, prefer: "return=minimal" }), "Élève ajouté");
      if (r) { $("#sd-elAdd").reset(); $("#sd-elAdd").hidden = true; pcStage = statut === "Contacté" ? "appels" : "formation"; S.set("pcStage", pcStage); pcSel = null; loadEleves(); }
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
        const conf = el && n && c.statut === "Réservé" ? "https://wa.me/228" + n + "?text=" + encodeURIComponent("Bonjour " + el.nom.split(" ")[0] + ", ta séance de conduite SODAF est confirmée le " + longDay(c.jour) + " à " + c.heure + ". Rendez-vous au 412 Avenue Akei, Tokoin Tamé. À bientôt !") : "";
        const rap = el && n && c.statut === "Réservé" && c.jour === tomorrow ? "https://wa.me/228" + n + "?text=" + encodeURIComponent("Bonjour " + el.nom.split(" ")[0] + ", petit rappel : ta séance de conduite SODAF est demain à " + c.heure + ". Merci d'être à l'heure !") : "";
        return '<div class="tm-row st-' + c.statut.normalize("NFD").replace(/[^a-z]/gi, "").toLowerCase() + '" data-id="' + c.id + '"><div class="tm-time">' + esc(c.heure) + '</div><div class="tm-main"><select data-el aria-label="Élève"><option value="">— Créneau libre —</option>' + actifs.map((x) => '<option value="' + x.id + '"' + (x.id === c.eleve_id ? " selected" : "") + ">" + esc(x.nom) + "</option>").join("") + (el && !actifs.includes(el) ? '<option value="' + el.id + '" selected>' + esc(el.nom) + "</option>" : "") + '</select>' + (c.note ? "<small>" + esc(c.note) + "</small>" : "") + '</div><div class="tm-acts"><select data-cs aria-label="Statut">' + CST.map((t) => "<option" + (t === c.statut ? " selected" : "") + ">" + t + "</option>").join("") + "</select>" + (conf ? '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="' + conf + '">Confirmer</a>' : "") + (rap ? '<a class="btn btn-yellow btn-sm" target="_blank" rel="noopener" href="' + rap + '">Rappel</a>' : "") + "</div></div>";
      }).join("") : '<p class="tm-empty">Pas de créneau ce jour-là (dimanche ou jour férié).</p>';
    }
    $("#sd-cdList").addEventListener("change", async (e) => {
      const row = e.target.closest("[data-id]"); if (!row) return; const id = row.dataset.id;
      let body;
      if (e.target.matches("[data-el]")) { const v = e.target.value; body = { eleve_id: v ? +v : null, statut: v ? "Réservé" : "Libre", modifie_le: new Date().toISOString() }; }
      else if (e.target.matches("[data-cs]")) body = { statut: e.target.value, modifie_le: new Date().toISOString() };
      if (!body) return;
      await run(() => DB.q("creneaux_conduite?id=eq." + id, { method: "PATCH", body, prefer: "return=minimal" }), "Planning enregistré");
      loadDay();
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
    const shift = (n) => { $("#sd-cdWarn").innerHTML = ""; const d = dOf(cdDay); d.setDate(d.getDate() + n); cdDay = iso(d); loadDay(); };
    $("#sd-cdPrev").addEventListener("click", () => shift(-1)); $("#sd-cdNext").addEventListener("click", () => shift(1));
    $("#sd-cdToday").addEventListener("click", () => { cdDay = iso(new Date()); loadDay(); });

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
      $("#sd-pyLate").innerHTML = late.length ? '<div class="tm-sub"><div><p class="eyebrow">À relancer</p><h3>Reste à payer</h3></div></div><div class="tm-list">' + late.map((p) => { const n = waNum(p.telephone); return '<div class="tm-row"><div class="tm-main"><b>' + esc(p.eleve_nom) + " · reste " + F(p.reste) + "</b><span>" + esc(p.formation || "") + " · dernier paiement le " + dOf(p.jour).toLocaleDateString("fr-FR") + '</span></div><div class="tm-acts">' + (n ? '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="https://wa.me/228' + n + "?text=" + encodeURIComponent("Bonjour " + p.eleve_nom.split(" ")[0] + ", petit rappel de SODAF : il reste " + F(p.reste) + " à régler pour ta formation, avant ta première séance de conduite. Merci !") + '">Relancer</a>' : "") + "</div></div>"; }).join("") + "</div>" : "";
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
        sel.innerHTML = w.map((x) => '<option value="' + x.lundi + '" data-l="' + x.lettre + '" data-t="' + esc(x.theme) + '">Semaine du ' + dOf(x.lundi).getDate() + " " + M[dOf(x.lundi).getMonth()] + " · Devoir " + x.lettre + " · " + esc(x.theme) + "</option>").join("") || '<option value="' + devWeek().key + '" data-l="' + DEV[devWeek().idx].l + '" data-t="' + esc(DEV[devWeek().idx].t) + '">Semaine en cours</option>';
      }
      const o = sel.selectedOptions[0]; if (!o) return;
      const r = await run(() => DB.q("devoir_resultats?select=*&semaine=eq." + o.value + "&order=recu_le"));
      if (!r) return;
      const moy = r.length ? r.reduce((a, x) => a + (x.note * 10) / x.sur, 0) / r.length : 0;
      $("#sd-dvStats").innerHTML = "<div><span>Participants</span><b>" + r.length + "</b></div><div><span>Moyenne</span><b>" + (r.length ? String(Math.round(moy * 10) / 10).replace(".", ",") + "/10" : "—") + "</b></div><div><span>Niveau examen (9 ou 10)</span><b>" + r.filter((x) => x.note / x.sur >= 0.9).length + "</b></div>";
      const ic = (x) => (x.note / x.sur >= 0.9 ? "🏆" : x.note / x.sur >= 0.7 ? "✅" : "📘");
      const lines = r.map((x) => ic(x) + " " + x.eleve_nom + " : " + x.note + "/" + x.sur + (x.devoir !== o.dataset.l ? " (devoir " + x.devoir + ")" : ""));
      const msg = "📚 *SODAF Auto-École · Devoir " + o.dataset.l + "*\nSemaine du " + dOf(o.value).getDate() + " " + M[dOf(o.value).getMonth()] + " · " + o.dataset.t + "\n\n" + (r.length ? "👥 " + r.length + (r.length > 1 ? " participants" : " participant") + " · moyenne " + String(Math.round(moy * 10) / 10).replace(".", ",") + "/10\n\n" + lines.join("\n") : "Aucun résultat reçu pour l'instant.") + "\n\n🏆 9 ou 10 · ✅ 7 ou 8 · 📘 à revoir\nCorrection mercredi en salle à 14 h 30.\nPas encore fait ? autosodaf.com/#devoirs";
      $("#sd-dvMsg").value = msg;
      $("#sd-dvWa").href = "https://wa.me/?text=" + encodeURIComponent(msg);
      $("#sd-dvRes").innerHTML = r.map((x) => '<div class="tm-row"><div class="tm-time">' + ic(x) + '</div><div class="tm-main"><b>' + esc(x.eleve_nom) + " · " + x.note + "/" + x.sur + "</b><span>Devoir " + x.devoir + " · reçu le " + new Date(x.recu_le).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) + "</span></div></div>").join("");
    }
    $("#sd-dvWeek").addEventListener("change", loadDev);
    $("#sd-dvCopy").addEventListener("click", async () => { try { await navigator.clipboard.writeText($("#sd-dvMsg").value); toast("Message copié"); } catch (e) { $("#sd-dvMsg").select(); document.execCommand("copy"); toast("Message copié"); } });

    // ---- Direction
    async function loadDir() {
      if (!me || me.role !== "admin") return;
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
      const actifs = eleves.filter((x) => ["Inscrit", "En formation"].includes(x.statut)).length;
      const permis = eleves.filter((x) => x.statut === "Permis obtenu").length, aband = eleves.filter((x) => x.statut === "Abandon").length;
      const faits = cr.filter((c) => c.statut === "Fait").length, abs = cr.filter((c) => c.statut === "Absent").length;
      const wkOpen = wk.filter((c) => c.statut !== "Annulé"), wkPris = wkOpen.filter((c) => ["Réservé", "Fait", "Absent"].includes(c.statut)).length;
      const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
      const evo = encPrev ? (enc >= encPrev ? "+" : "") + Math.round(((enc - encPrev) / encPrev) * 100) + " % vs " + M[mPrev.getMonth()] : "premier mois";
      const T = (lab, val, sub, cls) => '<div class="' + (cls || "") + '"><span>' + lab + "</span><b>" + val + "</b>" + (sub ? "<small>" + sub + "</small>" : "") + "</div>";
      $("#sd-drStats").innerHTML =
        T("Encaissé ce mois", F(enc), evo, "hl") + T("Reste à encaisser", F(du), dus.length + (dus.length > 1 ? " élèves" : " élève")) +
        T("Nouveaux élèves ce mois", nouveaux.length, site + " via le site · " + (nouveaux.length - site) + " au bureau") + T("Élèves en formation", actifs, "Inscrits et en formation") +
        T("Séances de conduite faites", faits, abs + (abs > 1 ? " absences" : " absence") + " ce mois") + T("Planning de la semaine", pct(wkPris, wkOpen.length) + " %", wkPris + " créneaux pris sur " + wkOpen.length) +
        T("Permis obtenus", permis, "depuis l'ouverture") + T("Dossiers archivés", aband, aband ? "rétractations, injoignables…" : "aucun");
      // À surveiller
      const w = [];
      const vieux = eleves.filter((x) => x.statut === "Nouveau" && Date.now() - new Date(x.cree_le) > 2 * 864e5);
      if (vieux.length) w.push(["🔴", vieux.length + (vieux.length > 1 ? " pré-inscriptions" : " pré-inscription") + " sans accueil depuis plus de 2 jours", vieux.slice(0, 4).map((x) => x.nom).join(", ")]);
      const nouv = eleves.filter((x) => x.statut === "Nouveau").length - vieux.length;
      if (nouv > 0) w.push(["🟡", nouv + (nouv > 1 ? " nouvelles pré-inscriptions" : " nouvelle pré-inscription") + " à accueillir", "Secrétariat → Parcours élèves → Accueil"]);
      const aRel = eleves.filter((x) => etapeOf(x) === "dossier" && dosAge(x) >= 3).length; if (aRel) w.push(["🟠", aRel + (aRel > 1 ? " dossiers envoyés à relancer" : " dossier envoyé à relancer") + " (3 jours sans nouvelles)", "Secrétariat → Parcours élèves → Dossier envoyé"]);
      const aApp = eleves.filter((x) => etapeOf(x) === "appels").length; if (aApp) w.push(["🟡", aApp + (aApp > 1 ? " élèves à appeler" : " élève à appeler"), "Secrétariat → Parcours élèves → Appels"]);
      const vieuxDus = dus.filter((p) => Date.now() - dOf(p.jour) > 30 * 864e5);
      if (vieuxDus.length) w.push(["🔴", vieuxDus.length + (vieuxDus.length > 1 ? " élèves doivent" : " élève doit") + " encore payer depuis plus d'un mois", vieuxDus.slice(0, 4).map((p) => p.eleve_nom + " (" + F(p.reste) + ")").join(", ")]);
      else if (dus.length) w.push(["🟡", dus.length + (dus.length > 1 ? " élèves ont" : " élève a") + " un reste à payer", "Secrétariat → Paiements → À relancer"]);
      const annules = moisP.length ? pay.filter((p) => p.annule && p.jour >= iso(m0)) : pay.filter((p) => p.annule && p.jour >= iso(m0));
      if (annules.length) w.push(["🟠", annules.length + (annules.length > 1 ? " reçus annulés" : " reçu annulé") + " ce mois", annules.slice(0, 3).map((p) => "n° " + p.numero + (p.annule_motif ? " : " + p.annule_motif : "")).join(" · ")]);
      if (abs >= 3) w.push(["🟠", abs + " absences en conduite ce mois", "Moniteur → séances du jour"]);
      $("#sd-drWatch").innerHTML = w.length ? w.map((x) => '<div class="tm-row"><div class="tm-time">' + x[0] + '</div><div class="tm-main"><b>' + esc(x[1]) + "</b><span>" + esc(x[2]) + "</span></div></div>").join("") : '<p class="tm-empty">Rien à signaler. Tout est à jour ✓</p>';
      // Derniers mouvements
      const feed = [...eleves.slice(0, 10).map((x) => ({ t: x.cree_le, h: "<b>" + esc(x.nom) + "</b><span>" + (x.source === "site" ? "Pré-inscription sur le site" : "Inscrit au bureau") + " · " + esc(x.formation || "") + "</span>" })),
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
    const THEMES = [...$$("article.ch").map((c) => c.dataset.title), "Révision générale", "Examen blanc"];
    async function loadMon() {
      if (!me) return;
      const today = iso(new Date());
      const s = await run(() => DB.q("seances_code?select=*&jour=gte." + today + "&statut=neq.Annulé&order=jour&limit=1"));
      if (s) {
        const se = s[0];
        if (!se) { $("#sd-mcTitle").textContent = "Aucune séance prévue"; $("#sd-mcBody").innerHTML = ""; }
        else {
          const pr = await run(() => DB.q("presences?select=eleve_id&seance_id=eq." + se.id)) || [];
          const ids = new Set(pr.map((x) => x.eleve_id));
          const act = eleves.filter((x) => ["Inscrit", "En formation"].includes(x.statut)).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
          $("#sd-mcTitle").textContent = (se.jour === today ? "Aujourd'hui" : longDay(se.jour).replace(/^./, (c) => c.toUpperCase())) + " · " + se.type + " · " + se.heure + (se.statut === "Fait" ? " ✓" : "");
          $("#sd-mcBody").innerHTML = '<div class="field"><label for="sd-mcTheme">Thème traité</label><select id="sd-mcTheme"><option value="">— Choisir —</option>' + THEMES.map((t) => "<option" + (t === se.theme ? " selected" : "") + ">" + esc(t) + "</option>").join("") + '</select></div><p class="tm-lab">Présents (' + ids.size + ")</p>" + (act.length ? '<div class="tm-checks">' + act.map((x) => '<label><input type="checkbox" data-pe="' + x.id + '"' + (ids.has(x.id) ? " checked" : "") + "> " + esc(x.nom) + "</label>").join("") + "</div>" : '<p class="tm-empty">Aucun élève inscrit pour l\'instant.</p>') + '<div class="field"><label for="sd-mcNote">Note (facultatif)</label><input id="sd-mcNote" value="' + esc(se.note || "") + '"></div><button class="btn btn-green btn-sm" type="button" id="sd-mcDone" data-id="' + se.id + '">' + (se.statut === "Fait" ? "Mettre à jour" : "Cours fait") + "</button>";
          $$("#sd-mcBody [data-pe]").forEach((c) => c.addEventListener("change", async () => {
            const eid = +c.dataset.pe;
            if (c.checked) await run(() => DB.q("presences", { method: "POST", body: { seance_id: se.id, eleve_id: eid }, prefer: "return=minimal,resolution=ignore-duplicates" }), "Présence enregistrée");
            else await run(() => DB.q("presences?seance_id=eq." + se.id + "&eleve_id=eq." + eid, { method: "DELETE", prefer: "return=minimal" }), "Présence retirée");
          }));
          $("#sd-mcDone").addEventListener("click", async () => {
            await run(() => DB.q("seances_code?id=eq." + se.id, { method: "PATCH", body: { theme: $("#sd-mcTheme").value || null, note: $("#sd-mcNote").value.trim() || null, statut: "Fait" }, prefer: "return=minimal" }), "Cours enregistré");
            loadMon();
          });
        }
      }
      const c = await run(() => DB.q("creneaux_conduite?select=*&jour=eq." + today + "&eleve_id=not.is.null"));
      if (c) {
        c.sort((a, b) => hmin(a.heure) - hmin(b.heure));
        $("#sd-mcList").innerHTML = c.length ? c.map((x) => { const el = eleves.find((y) => y.id === x.eleve_id) || { nom: "Élève" }; return '<div class="tm-row" data-id="' + x.id + '"><div class="tm-time">' + esc(x.heure) + '</div><div class="tm-main"><b>' + esc(el.nom) + "</b><span>" + esc(x.statut) + '</span><input data-note placeholder="Note sur les progrès" value="' + esc(x.note || "") + '"></div><div class="tm-acts"><button class="btn btn-green btn-sm" type="button" data-set="Fait">Fait</button><button class="btn btn-line btn-sm" type="button" data-set="Absent">Absent</button></div></div>'; }).join("") : '<p class="tm-empty">Aucune séance réservée aujourd\'hui.</p>';
      }
    }
    $("#sd-mcList").addEventListener("click", async (e) => {
      const b = e.target.closest("[data-set]"); if (!b) return; const row = b.closest("[data-id]");
      await run(() => DB.q("creneaux_conduite?id=eq." + row.dataset.id, { method: "PATCH", body: { statut: b.dataset.set, note: row.querySelector("[data-note]").value.trim() || null, modifie_le: new Date().toISOString() }, prefer: "return=minimal" }), "Séance : " + b.dataset.set);
      loadMon();
    });

    window.TEAM_ELEVES = () => eleves; window.TEAM_RELOAD_PAY = () => { if (!$('.tm-sec[data-s="paiements"]').hidden) loadPay(); };
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
    const esc = (t) => String(t).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
    function lessonSlides(id) {
      const art = root.querySelector("#" + id), idx = chs.indexOf(art);
      const out = ['<div class="cls-title"><p class="cls-kicker">' + esc(art.dataset.part) + " · Chapitre " + (idx + 1) + " / " + chs.length + '</p><h1 class="cls-h1">' + esc(art.dataset.title) + '</h1><div class="cls-bar"></div></div>'];
      let cur = [], w = 0;
      const flush = () => { if (cur.length) out.push(cur.join("")); cur = []; w = 0; };
      const onlyHead = () => cur.length === 1 && /^<h4/i.test(cur[0]);
      [...art.children].forEach((el) => {
        if (el.tagName === "HEADER") return;
        const c = el.cloneNode(true); c.querySelectorAll(".read-btn").forEach((b) => b.remove());
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
      if (mode === "lecon") sel.innerHTML = chs.map((c, k) => '<option value="' + c.id + '">' + (k + 1) + ". " + esc(c.dataset.title) + "</option>").join("");
      else if (mode === "quiz") {
        const ids = [...new Set(Q.map((q) => q[4]))];
        sel.innerHTML = '<option value="all:10">10 questions au hasard</option><option value="all:20">20 questions au hasard</option><option value="all:99">Toutes les questions (' + Q.length + ")</option>" +
          ids.map((id) => '<option value="' + id + '">Chapitre : ' + esc(chTitle(id)) + "</option>").join("");
      } else if (mode === "devoir") { const cw = devWeek().idx; sel.innerHTML = DEV.map((d, k) => '<option value="' + k + '"' + (k === cw ? " selected" : "") + ">Devoir " + d.l + " · " + esc(d.t) + (k === cw ? " (cette semaine)" : "") + "</option>").join(""); }
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

  function route() {
    const APP = !!window.SODAF_APP;
    if (!APP && (location.hash === "#documents" || location.hash.startsWith("#equipe"))) { location.replace("/equipe/" + (location.hash.startsWith("#equipe-") ? location.hash : "")); return; }
    const h = (location.hash || (APP ? "#equipe" : "#accueil")).slice(1);
    let p = h.split("-")[0]; if (!pages.includes(p)) p = APP ? "equipe" : "accueil";
    if (APP && !["equipe", "classe", "recu"].includes(p)) { if (location.hash && location.hash !== "#accueil") window.open("/" + location.hash, "_blank"); history.replaceState(null, "", "#equipe"); p = "equipe"; }
    if (p === "recu") rcPublic(h.slice(5));
    $$("section.page").forEach((s) => (s.hidden = s.dataset.page !== p));
    $$("#sd-nav [data-nav]").forEach((a) => a.classList.toggle("on", a.dataset.nav === p));
    nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false");
    if (p === "quiz") showBest();
    if (p === "classe") requestAnimationFrame(() => cls.open(h.split("-")[1]));
    if (p === "cours") requestAnimationFrame(() => requestAnimationFrame(spy));
    let target = null; try { target = h.includes("-") && p !== "recu" ? root.querySelector("#" + h) : null; } catch (e) {}
    requestAnimationFrame(() => { if (target) target.scrollIntoView({ block: "start" }); else window.scrollTo(0, 0); });
  }
  window.addEventListener("hashchange", route);
  route();
  return () => { window.removeEventListener("hashchange", route); timers.forEach((f) => f()); };
}


(function () {
  const st = document.createElement("style"); st.textContent = CSS + 'html,body{margin:0;background:#15191E}#sodaf-root{min-height:100vh;display:flex;flex-direction:column}#sodaf-root>#app{flex:1;display:flex;flex-direction:column;background:#fff}#sodaf-root main{flex:1}'; document.head.appendChild(st);
  const fi = document.createElement("link"); fi.rel = "icon"; fi.type = "image/svg+xml"; fi.href = FAVICON; document.head.appendChild(fi);
  const app = document.getElementById("app"); app.innerHTML = HTML;
  if (window.SODAF_APP) {
    document.getElementById("sodaf-root").classList.add("app-mode");
    const lg = app.querySelector("header.top .logo"); if (lg) { lg.href = "#equipe"; lg.setAttribute("aria-label", "SODAF Équipe"); const sb = lg.querySelector(".logo-sub"); if (sb) sb.textContent = "Espace équipe"; }
  }
  init(app);
})();
