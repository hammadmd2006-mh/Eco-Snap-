/* EcoSnap auth & session. Front-end only (localStorage). Replace the get/put/del storage helpers
   and the hash/submit logic with calls to your API when you add a backend. Load last. */
// ===== AUTH & SESSION (front-end only: swap storage calls for your API) =====
const Auth = (() => {
    const $ = id => document.getElementById(id);
    const KU = 'ecosnap.users', KS = 'ecosnap.session', KP = 'ecosnap.progress.';
    const mem = {};
    const probe = n => { try { const x = window[n]; x.setItem('_t', '1'); x.removeItem('_t'); return x; } catch (e) { return null; } };
    const LS = probe('localStorage'), SS = probe('sessionStorage');
    const get = (k, st) => { try { const t = st || LS; const v = t ? t.getItem(k) : mem[k]; return v ? JSON.parse(v) : null; } catch (e) { return null; } };
    const put = (k, v, st) => { const j = JSON.stringify(v); try { const t = st || LS; t ? t.setItem(k, j) : (mem[k] = j); } catch (e) { mem[k] = j; } };
    const del = k => { [LS, SS].forEach(t => { try { t && t.removeItem(k); } catch (e) {} }); delete mem[k]; };
    let mode = 'login', cur = null, fails = 0, lock = 0;
    const clean = n => String(n).replace(/[<>&"'`]/g, '').replace(/\s+/g, ' ').trim();
    const strongEnough = p => p.length >= 8 && /[a-z]/i.test(p) && /\d/.test(p);

    async function hash(pw, salt) {
        try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + pw)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
        catch (e) { let h = 5381; for (const c of salt + pw) h = (h * 33) ^ c.charCodeAt(0); return 'f' + (h >>> 0); }
    }
    function err(m) { const b = $('auth-error'); b.textContent = m; b.classList.toggle('hidden', !m); }
    function busy(on) { $('auth-submit').disabled = on; $('auth-spin').classList.toggle('hidden', !on); $('auth-spin').classList.toggle('fa-spin', on); }
    function go(v, m) {
        ['landing', 'auth'].forEach(x => $('view-' + x).classList.toggle('hidden', x !== v));
        $('app-shell').classList.add('hidden');
        if (v === 'auth') setMode(m || 'login');
        window.scrollTo(0, 0);
    }
    function setMode(m) {
        mode = m; const su = m === 'signup'; err('');
        $('auth-name-wrap').classList.toggle('hidden', !su);
        $('auth-remember-wrap').classList.toggle('hidden', su);
        $('auth-title').textContent = su ? 'Create your account' : 'Sign in to EcoSnap';
        $('auth-sub').textContent = su ? 'Start earning SnapPoints in under a minute.' : 'Welcome back. Your points and streak are waiting.';
        $('auth-submit-label').textContent = su ? 'Create account' : 'Sign in';
        $('auth-pw').autocomplete = su ? 'new-password' : 'current-password';
        ['login', 'signup'].forEach(t => {
            const on = t === m, b = $('tab-' + t);
            b.setAttribute('aria-selected', on);
            b.className = 'flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ' + (on ? 'bg-white text-eco-800 shadow-sm' : 'text-slate-600 hover:text-eco-800');
        });
        hint();
        setTimeout(() => $(su ? 'auth-name' : 'auth-email').focus(), 50);
    }
    function hint() {
        const p = $('auth-pw').value, ok = strongEnough(p), strong = ok && (p.length >= 12 || /[^a-z\d]/i.test(p)), h = $('pw-hint');
        h.classList.toggle('hidden', mode !== 'signup');
        h.textContent = !p ? 'Use 8 or more characters with a letter and a number.' : strong ? 'Strong password.' : ok ? 'Good. Add a symbol or more length to make it stronger.' : 'Keep going: 8 or more characters with a letter and a number.';
        h.className = 'text-xs mt-1.5 ' + (ok ? 'text-eco-700 font-semibold' : 'text-slate-500') + (mode === 'signup' ? '' : ' hidden');
    }
    function pwToggle() {
        const i = $('auth-pw'), show = i.type === 'password';
        i.type = show ? 'text' : 'password';
        $('pw-eye').className = 'fa-solid ' + (show ? 'fa-eye-slash' : 'fa-eye');
        $('pw-toggle').setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    }
    async function submit(ev) {
        ev.preventDefault(); err('');
        const email = $('auth-email').value.trim().toLowerCase(), pw = $('auth-pw').value, name = clean($('auth-name').value);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err('Enter a valid email address, like name@college.edu.');
        if (mode === 'signup' && name.length < 2) return err('Enter your name so it can appear on the leaderboard.');
        if (!pw) return err('Enter your password.');
        if (mode === 'signup' && !strongEnough(pw)) return err('Use at least 8 characters, including a letter and a number.');
        if (Date.now() < lock) return err(`Too many attempts. Try again in ${Math.ceil((lock - Date.now()) / 1000)} seconds.`);
        busy(true);
        try {
            await new Promise(r => setTimeout(r, 450));
            const users = get(KU) || {};
            if (mode === 'signup') {
                if (users[email]) return err('An account with this email already exists. Sign in instead.');
                const salt = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
                users[email] = { name, salt, hash: await hash(pw, salt), created: Date.now() };
                put(KU, users);
                start({ email, name }, true, true);
            } else {
                const u = users[email];
                if (!u || u.hash !== await hash(pw, u.salt)) {
                    if (++fails >= 5) { lock = Date.now() + 30000; fails = 0; }
                    return err('Email or password is incorrect.');
                }
                fails = 0;
                start({ email, name: u.name }, $('auth-remember').checked, false);
            }
        } finally { busy(false); }
    }
    function start(u, remember, isNew) {
        put(KS, { email: u.email, name: u.name, guest: !!u.guest, exp: Date.now() + (remember ? 7 : 1) * 864e5 }, remember ? LS : SS);
        enter(u, isNew);
    }
    function demo() { start({ email: 'demo@ecosnap.app', name: 'Demo Player', guest: true }, false, false); }
    function enter(u, isNew) {
        cur = u; u.name = clean(u.name) || 'Player';
        ['landing', 'auth'].forEach(x => $('view-' + x).classList.add('hidden'));
        $('app-shell').classList.remove('hidden');
        $('auth-form').reset();
        const saved = !u.guest && get(KP + u.email);
        if (saved) Object.assign(playerState, saved);
        const me = leaderboardData.find(x => x.isUser); if (me) me.name = u.name;
        const ini = u.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
        const fill = (c, v) => document.querySelectorAll(c).forEach(e => e.textContent = v);
        fill('.u-ini', ini); fill('.u-name', u.name); fill('.u-first', u.name.split(' ')[0]); fill('.u-email', u.guest ? 'Demo session (progress not saved)' : u.email);
        updatePlayerHUD(); loadScanPreset('bottle'); switchTab('home');
        showToast(isNew ? `Welcome to EcoSnap, ${u.name.split(' ')[0]}!` : `Welcome back, ${u.name.split(' ')[0]}`, 'success');
    }
    function save() {
        if (!cur || cur.guest) return;
        const p = playerState;
        put(KP + cur.email, { snapPoints: p.snapPoints, itemsSorted: p.itemsSorted, co2Saved: p.co2Saved, streak: p.streak, scanLog: p.scanLog });
    }
    function logout() { save(); del(KS); location.reload(); }
    function menu(force) {
        const m = $('user-menu'), open = force === undefined ? m.classList.contains('hidden') : force;
        m.classList.toggle('hidden', !open); $('user-btn').setAttribute('aria-expanded', open);
    }
    function boot() {
        const ses = get(KS, SS) || get(KS, LS), u = ses && (get(KU) || {})[ses.email];
        if (ses && ses.exp > Date.now() && (ses.guest || u)) return enter({ email: ses.email, name: ses.guest ? ses.name : u.name, guest: ses.guest }, false);
        del(KS); go('landing');
    }
    document.addEventListener('click', e => { if (!e.target.closest('#user-btn, #user-menu')) menu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') menu(false); });
    window.addEventListener('pagehide', save);
    return { boot, go, setMode, hint, pwToggle, submit, demo, menu, logout, save };
})();

// Persist progress whenever the HUD refreshes
const _baseHud = updatePlayerHUD;
updatePlayerHUD = function () { _baseHud(); Auth.save(); };


window.addEventListener('load', () => Auth.boot());
