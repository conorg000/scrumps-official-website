// effects.js — game-feel layer: screen shake, particles, floating text,
// scene-transition flashes, and synthesized sound effects (Web Audio, no assets).
if (typeof window !== 'undefined' && !window.Effects) {
    const Effects = {
        particles: [],
        floaters: [],
        shakeTime: 0,
        shakeMag: 0,
        flashAlpha: 0,
        flashColor: '0,0,0',
        audioCtx: null,
        muted: false,

        // ---- Screen shake -------------------------------------------------
        shake(mag = 6, dur = 250) {
            this.shakeMag = Math.max(this.shakeMag, mag);
            this.shakeTime = Math.max(this.shakeTime, dur);
        },
        shakeOffset() {
            if (this.shakeTime <= 0) return { x: 0, y: 0 };
            const m = this.shakeMag * (this.shakeTime / 250);
            return { x: (Math.random() - 0.5) * 2 * m, y: (Math.random() - 0.5) * 2 * m };
        },

        // ---- Scene transition flash --------------------------------------
        flashIn(color = '0,0,0') {
            this.flashColor = color;
            this.flashAlpha = 1;
        },

        // ---- Particles (world space, pre-camera-offset) ------------------
        spawn(isoX, isoY, opts = {}) {
            const pos = isometricToScreen(isoX, isoY);
            const count = opts.count || 8;
            const colors = opts.colors || ['#ffffff'];
            const spread = opts.spread || 1.6;
            const life = opts.life || 600;
            const gravity = opts.gravity != null ? opts.gravity : 0.12;
            const size = opts.size || 3;
            const rise = opts.rise || 1.4;
            for (let i = 0; i < count; i++) {
                const a = Math.random() * Math.PI * 2;
                const sp = Math.random() * spread;
                this.particles.push({
                    x: pos.x + (Math.random() - 0.5) * 8,
                    y: pos.y - (opts.yOffset || 18) + (Math.random() - 0.5) * 8,
                    vx: Math.cos(a) * sp,
                    vy: Math.sin(a) * sp - rise,
                    life, maxLife: life, gravity,
                    size: size + Math.random() * size,
                    color: colors[(Math.random() * colors.length) | 0],
                });
            }
        },
        burstPickup(isoX, isoY, colors) {
            this.spawn(isoX, isoY, { count: 14, colors: colors || ['#fff7b0', '#ffd700', '#ffffff'], spread: 2, life: 700, rise: 2, size: 3 });
        },
        burstDust(isoX, isoY) {
            this.spawn(isoX, isoY, { count: 5, colors: ['#cdbf9a', '#b7a884'], spread: 0.9, life: 380, rise: 0.4, gravity: 0.05, size: 2, yOffset: 2 });
        },
        confetti(isoX, isoY) {
            this.spawn(isoX, isoY, { count: 26, colors: ['#ff5252', '#ffd740', '#69f0ae', '#40c4ff', '#e040fb', '#ffffff'], spread: 3, life: 1200, rise: 3, gravity: 0.08, size: 4 });
        },

        // ---- Floating text -----------------------------------------------
        floatText(isoX, isoY, text, color = '#ffffff') {
            const pos = isometricToScreen(isoX, isoY);
            this.floaters.push({ x: pos.x, y: pos.y - 40, text, color, life: 1100, maxLife: 1100 });
        },

        update(dt) {
            const d = Math.min(dt, 50);
            if (this.shakeTime > 0) this.shakeTime -= d;
            if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - d / 350);

            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.life -= d;
                if (p.life <= 0) { this.particles.splice(i, 1); continue; }
                p.x += p.vx; p.y += p.vy; p.vy += p.gravity;
            }
            for (let i = this.floaters.length - 1; i >= 0; i--) {
                const f = this.floaters[i];
                f.life -= d;
                if (f.life <= 0) { this.floaters.splice(i, 1); continue; }
                f.y -= 0.4;
            }
        },

        drawWorld(ctx, offsetX, offsetY) {
            for (const p of this.particles) {
                ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife));
                ctx.fillStyle = p.color;
                ctx.fillRect(Math.floor(p.x + offsetX), Math.floor(p.y + offsetY), p.size, p.size);
            }
            ctx.globalAlpha = 1;
            ctx.textAlign = 'center';
            for (const f of this.floaters) {
                const a = Math.max(0, Math.min(1, f.life / f.maxLife));
                ctx.globalAlpha = a;
                ctx.font = 'bold 11px monospace';
                ctx.fillStyle = '#000000';
                ctx.fillText(f.text, f.x + offsetX + 1, f.y + offsetY + 1);
                ctx.fillStyle = f.color;
                ctx.fillText(f.text, f.x + offsetX, f.y + offsetY);
            }
            ctx.globalAlpha = 1;
            ctx.textAlign = 'left';
        },

        drawFlash(ctx, w, h) {
            if (this.flashAlpha <= 0) return;
            ctx.fillStyle = `rgba(${this.flashColor},${this.flashAlpha})`;
            ctx.fillRect(0, 0, w, h);
        },

        // ---- Synthesized SFX (Web Audio) ---------------------------------
        ctx_() {
            if (this.audioCtx) return this.audioCtx;
            try {
                const AC = window.AudioContext || window.webkitAudioContext;
                this.audioCtx = new AC();
            } catch (e) { this.audioCtx = null; }
            return this.audioCtx;
        },
        tone(freq, dur, type = 'square', vol = 0.12, slideTo = null) {
            if (this.muted) return;
            const ac = this.ctx_();
            if (!ac) return;
            if (ac.state === 'suspended') ac.resume();
            const t = ac.currentTime;
            const osc = ac.createOscillator();
            const g = ac.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t);
            if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
            g.gain.setValueAtTime(vol, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            osc.connect(g); g.connect(ac.destination);
            osc.start(t); osc.stop(t + dur);
        },
        noise(dur = 0.18, vol = 0.18) {
            if (this.muted) return;
            const ac = this.ctx_();
            if (!ac) return;
            if (ac.state === 'suspended') ac.resume();
            const t = ac.currentTime;
            const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
            const src = ac.createBufferSource(); src.buffer = buf;
            const g = ac.createGain();
            g.gain.setValueAtTime(vol, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            src.connect(g); g.connect(ac.destination);
            src.start(t);
        },
        sfx(name) {
            switch (name) {
                case 'pickup': this.tone(660, 0.08, 'square', 0.1); setTimeout(() => this.tone(990, 0.12, 'square', 0.1), 70); break;
                case 'blip': this.tone(420, 0.05, 'sine', 0.06); break;
                case 'select': this.tone(523, 0.06, 'square', 0.09); setTimeout(() => this.tone(784, 0.09, 'square', 0.09), 60); break;
                case 'punch': this.noise(0.14, 0.22); this.tone(120, 0.16, 'sawtooth', 0.14, 60); break;
                case 'hurt': this.tone(220, 0.2, 'sawtooth', 0.12, 90); break;
                case 'whoosh': this.noise(0.25, 0.1); break;
                case 'splash': this.noise(0.4, 0.16); this.tone(300, 0.3, 'sine', 0.08, 120); break;
                case 'success': [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.16, 'square', 0.1), i * 90)); break;
                case 'fanfare': [392, 523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.2, 'square', 0.11), i * 110)); break;
                default: break;
            }
        },
    };
    window.Effects = Effects;
    window.playSfx = (n) => Effects.sfx(n);
}
