(() => {
  'use strict';

  // ============================================================
  // UTILITÁRIOS
  // ============================================================
  const $ = (id) => document.getElementById(id);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const nowSec = () => performance.now() / 1000;

  function safeCtx(canvas) {
    if (!canvas) throw new Error('Canvas #game não encontrado.');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não foi possível obter o contexto 2D do canvas.');
    ctx.imageSmoothingEnabled = false;
    return ctx;
  }

  function roundedRectPath(ctx, x, y, w, h, r = 6) {
    const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawOutlinedShape(ctx, drawPath, fillColor, outlineColor = '#000', outlineWidth = 6) {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    drawPath();
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    ctx.lineWidth = outlineWidth;
    ctx.strokeStyle = outlineColor;
    ctx.stroke();
    ctx.restore();
  }

  // ============================================================
  // DADOS
  // ============================================================
  const PALETTES = {
    guerreiro: { base: '#2563eb', dark: '#1e3a8a', metal: '#cbd5e1', accent: '#fbbf24', eye: '#ffffff' },
    ladrao:    { base: '#111827', dark: '#000000', metal: '#64748b', accent: '#ef4444', eye: '#ff0000' },
    arqueira:  { base: '#16a34a', dark: '#14532d', metal: '#d97706', accent: '#bef264', eye: '#ffffff' },
    mago:      { base: '#7e22ce', dark: '#4c1d95', metal: '#a855f7', accent: '#38bdf8', eye: '#38bdf8' },
    cavaleiro: { base: '#94a3b8', dark: '#475569', metal: '#f1f5f9', accent: '#fbbf24', eye: '#000000' },
    ogro:      { base: '#22c55e', dark: '#14532d', metal: '#451a03', accent: '#ef4444', eye: '#ffffff' }
  };

  // Se você já tiver CHARACTERS definidos em outro arquivo, este bloco não sobrescreve.
  const DEFAULT_CHARACTERS = [
    { id: 'guerreiro', name: 'Guerreiro', role: 'Equilibrado', ability: 'Golpe forte', color: '#2563eb', stats: { speed: 300, jumpPower: 850, attackPower: 18, attackSpeed: 22 } },
    { id: 'ladrao', name: 'Ladrão', role: 'Rápido', ability: 'Investida', color: '#111827', stats: { speed: 380, jumpPower: 900, attackPower: 14, attackSpeed: 14 } },
    { id: 'arqueira', name: 'Arqueira', role: 'Longo alcance', ability: 'Tiro preciso', color: '#16a34a', stats: { speed: 290, jumpPower: 880, attackPower: 16, attackSpeed: 18 } },
    { id: 'mago', name: 'Mago', role: 'Área', ability: 'Explosão mágica', color: '#7e22ce', stats: { speed: 270, jumpPower: 820, attackPower: 20, attackSpeed: 24 } },
    { id: 'cavaleiro', name: 'Cavaleiro', role: 'Defensivo', ability: 'Impacto', color: '#94a3b8', stats: { speed: 260, jumpPower: 800, attackPower: 17, attackSpeed: 20 } },
    { id: 'ogro', name: 'Ogro', role: 'Pesado', ability: 'Soco brutal', color: '#22c55e', stats: { speed: 230, jumpPower: 760, attackPower: 24, attackSpeed: 28 } }
  ];

  const CHARACTERS = Array.isArray(window.CHARACTERS) && window.CHARACTERS.length
    ? window.CHARACTERS
    : DEFAULT_CHARACTERS;

  const STAGES = [
    { id: 'brasil', name: 'Arena Brasil', theme: 'brasil', icon: '🇧🇷', description: 'Sol forte e muita energia!' },
    { id: 'japao', name: 'Noite de Tóquio', theme: 'japao', icon: '🇯🇵', description: 'Luzes neon e cerejeiras.' },
    { id: 'eua', name: 'Metrópole EUA', theme: 'eua', icon: '🇺🇸', description: 'Batalha entre arranha-céus.' },
    { id: 'espaco', name: 'Estação Espacial', theme: 'espaco', icon: '🌌', description: 'Luta entre as estrelas.' },
    { id: 'floresta', name: 'Bosque Selvagem', theme: 'floresta', icon: '🌲', description: 'A natureza esconde perigos.' },
    { id: 'praia', name: 'Costa Serena', theme: 'praia', icon: '🏖️', description: 'Areia, mar e porrada.' }
  ];

  const PLATFORMS = [
    { x: 720, y: 920, w: 1160, h: 76 },
    { x: 820, y: 688, w: 290, h: 28 },
    { x: 1490, y: 688, w: 290, h: 28 },
    { x: 600, y: 520, w: 200, h: 28 },
    { x: 1800, y: 520, w: 200, h: 28 },
    { x: 1150, y: 400, w: 300, h: 28 },
    { x: 400, y: 750, w: 150, h: 28 },
    { x: 2050, y: 780, w: 150, h: 28 },
    { x: 1300, y: 250, w: 200, h: 28 },
    { x: 700, y: 350, w: 180, h: 28 },
    { x: 1800, y: 330, w: 180, h: 28 },
    { x: 500, y: 600, w: 120, h: 28 },
    { x: 1950, y: 650, w: 120, h: 28 },
    { x: 250, y: 850, w: 150, h: 28 },
    { x: 2200, y: 900, w: 150, h: 28 },
    { x: 1100, y: 150, w: 150, h: 28 },
    { x: 100, y: 450, w: 120, h: 28 },
    { x: 2400, y: 480, w: 120, h: 28 }
  ];

  const WORLD_W = 2600;
  const WORLD_H = 1200;
  const GRAVITY = 2800;
  const MAX_FALL = 1000;
  const MAIN_PLAT = PLATFORMS[0];
  const SPAWN_Y = MAIN_PLAT.y - 150;

  // ============================================================
  // ESTADO
  // ============================================================
  const keys = { left: false, right: false, up: false, attack: false, special: false };
  const particles = [];
  let selectedStage = STAGES[0];
  let playerChar = CHARACTERS[0];
  let enemyChar = CHARACTERS[1] || CHARACTERS[0];
  let player = null;
  let enemy = null;
  let camX = 0;
  let camY = 0;
  let gameRunning = false;
  let lastFrameTime = performance.now();
  let bgNoiseSeed = 0;

  // ============================================================
  // RENDERIZAÇÃO DE PERSONAGEM
  // ============================================================
  function drawCharacter(ctx, id, anim, x, y, scale, dir, isAttacking) {
    const p = PALETTES[id] || PALETTES.guerreiro;
    const time = nowSec();
    const bob = anim === 'idle' ? Math.sin(time * 6) * 3 : 0;
    const walk = anim === 'walk' ? Math.sin(time * 12) * 10 : 0;
    const jumpLean = anim === 'jump' ? -8 : 0;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale * dir * 0.62, scale * 0.62);
    ctx.rotate(jumpLean * Math.PI / 180);

    // Sombra simples
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, 118, 42, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Corpo
    drawOutlinedShape(ctx, () => roundedRectPath(ctx, -14, -28 + bob, 28, 30, 10), p.base);
    drawOutlinedShape(ctx, () => roundedRectPath(ctx, -15, -8 + bob, 30, 8, 4), p.dark);

    // Cabeça
    drawOutlinedShape(ctx, () => {
      ctx.arc(0, -50 + bob, id === 'ogro' ? 26 : 22, 0, Math.PI * 2);
    }, p.base);

    // Olhos
    ctx.save();
    ctx.fillStyle = p.eye;
    ctx.beginPath();
    if (id === 'ladrao' || id === 'cavaleiro') {
      ctx.moveTo(-2, -52 + bob);
      ctx.lineTo(15, -48 + bob);
      ctx.lineTo(-2, -45 + bob);
    } else {
      ctx.arc(-5, -52 + bob, 4, 0, Math.PI * 2);
      ctx.arc(7, -50 + bob, 4, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();

    // Capa / detalhe
    if (id !== 'ogro') {
      drawOutlinedShape(ctx, () => {
        ctx.moveTo(-10, -25 + bob);
        ctx.quadraticCurveTo(-35, -10, -25 + Math.sin(time * 5) * 6, 15 + bob);
        ctx.lineTo(-5, 0 + bob);
        ctx.lineTo(4, -15 + bob);
      }, p.accent);
    }

    // Perna de trás
    ctx.save();
    ctx.strokeStyle = '#000';
    ctx.lineCap = 'round';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-3, 0 + bob);
    ctx.lineTo(-14 + walk, 30);
    ctx.stroke();
    ctx.restore();

    // Perna da frente
    ctx.save();
    ctx.strokeStyle = '#000';
    ctx.lineCap = 'round';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(4, 0 + bob);
    ctx.lineTo(15 - walk, 28);
    ctx.stroke();
    ctx.restore();

    // Botas
    drawOutlinedShape(ctx, () => roundedRectPath(ctx, -20 + walk, 24, 16, 10, 4), p.dark);
    drawOutlinedShape(ctx, () => roundedRectPath(ctx, 6 - walk, 22, 18, 11, 4), p.dark);

    // Braço / arma
    const armAngle = isAttacking ? Math.PI / 2.2 : Math.PI / 6;
    ctx.save();
    ctx.translate(10, -14 + bob);
    ctx.rotate(armAngle);

    ctx.strokeStyle = '#000';
    ctx.lineCap = 'round';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(12, 18);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(16, 20, 8, 0, Math.PI * 2);
    ctx.fillStyle = p.base;
    ctx.fill();
    ctx.stroke();

    drawWeapon(ctx, id, p);
    ctx.restore();

    ctx.restore();
  }

  function drawWeapon(ctx, id, p) {
    const drawKnife = () => {
      drawOutlinedShape(ctx, () => {
        ctx.moveTo(-4, 0);
        ctx.quadraticCurveTo(-14, 10, -2, 28);
        ctx.quadraticCurveTo(2, 12, 4, 0);
      }, p.metal);
      drawOutlinedShape(ctx, () => roundedRectPath(ctx, -3, -6, 6, 8, 2), '#111');
    };

    if (id === 'guerreiro' || id === 'cavaleiro') {
      drawOutlinedShape(ctx, () => {
        ctx.moveTo(-4, 0);
        ctx.lineTo(-3, 35);
        ctx.lineTo(0, 43);
        ctx.lineTo(3, 35);
        ctx.lineTo(4, 0);
      }, p.metal);
      drawOutlinedShape(ctx, () => roundedRectPath(ctx, -9, -2, 18, 4, 2), p.accent);
      drawOutlinedShape(ctx, () => roundedRectPath(ctx, -2, -10, 4, 8, 2), '#271206');
      return;
    }

    if (id === 'mago') {
      drawOutlinedShape(ctx, () => roundedRectPath(ctx, -2, -16, 4, 52, 2), '#4b2a00');
      drawOutlinedShape(ctx, () => {
        ctx.moveTo(0, -28);
        ctx.lineTo(7, -20);
        ctx.lineTo(0, -12);
        ctx.lineTo(-7, -20);
      }, p.accent);
      return;
    }

    if (id === 'ladrao') {
      drawKnife();
      return;
    }

    if (id === 'arqueira') {
      drawOutlinedShape(ctx, () => {
        ctx.moveTo(-10, -18);
        ctx.quadraticCurveTo(15, 0, -10, 28);
      }, '#5d4037');
      ctx.save();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-10, -18);
      ctx.lineTo(-5, 5);
      ctx.lineTo(-10, 28);
      ctx.stroke();
      ctx.restore();
      drawOutlinedShape(ctx, () => {
        ctx.moveTo(12, 2);
        ctx.lineTo(18, 5);
        ctx.lineTo(12, 8);
      }, p.metal);
      ctx.save();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-15, 5);
      ctx.lineTo(12, 5);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (id === 'ogro') {
      drawOutlinedShape(ctx, () => {
        ctx.moveTo(-3, -10);
        ctx.lineTo(-8, 25);
        ctx.arc(0, 25, 8, Math.PI, 0, true);
        ctx.lineTo(3, -10);
      }, '#451a03');
      [
        [-8, 15],
        [8, 20],
        [-6, 28]
      ].forEach(([x, y]) => {
        drawOutlinedShape(ctx, () => ctx.arc(x, y, 3, 0, Math.PI * 2), p.metal);
      });
    }
  }

  // ============================================================
  // HUD / TELAS
  // ============================================================
  function buildStageCards() {
    const stageContainer = $('stage-cards');
    if (!stageContainer) return;

    stageContainer.innerHTML = '';
    STAGES.forEach((stage) => {
      const card = document.createElement('div');
      card.className = `stage-card${stage.id === selectedStage.id ? ' selected' : ''}`;
      card.innerHTML = `
        <div class="stage-icon">${stage.icon}</div>
        <strong>${stage.name}</strong>
        <span class="stage-desc">${stage.description}</span>
      `;
      card.addEventListener('click', () => {
        selectedStage = stage;
        buildStageCards();
      });
      stageContainer.appendChild(card);
    });
  }

  function buildCharacterCards(containerId, isEnemy) {
    const cont = $(containerId);
    if (!cont) return;

    cont.innerHTML = '';
    CHARACTERS.forEach((c, index) => {
      const el = document.createElement('div');
      const selectedIndex = isEnemy ? CHARACTERS.indexOf(enemyChar) : CHARACTERS.indexOf(playerChar);
      el.className = `char-card${index === selectedIndex ? ' selected' : ''}`;
      el.innerHTML = `
        <canvas class="avatar" width="88" height="88"></canvas>
        <strong>${c.name}</strong>
        <small>${c.role}</small>
        <small class="ability-text">✨ ${c.ability}</small>
      `;

      const av = el.querySelector('canvas');
      const avCtx = safeCtx(av);
      let rafId = 0;

      const renderAvatar = () => {
        avCtx.clearRect(0, 0, 88, 88);
        const bg = avCtx.createRadialGradient(44, 44, 5, 44, 88, 55);
        bg.addColorStop(0, 'rgba(30,40,70,0.9)');
        bg.addColorStop(1, 'rgba(10,14,40,0.95)');
        avCtx.fillStyle = bg;
        avCtx.fillRect(0, 0, 88, 88);
        avCtx.fillStyle = 'rgba(100,120,240,0.2)';
        avCtx.fillRect(0, 75, 88, 13);
        drawCharacter(avCtx, c.id, 'idle', 44, 75, 1.5, 1, false);
        rafId = requestAnimationFrame(renderAvatar);
      };

      renderAvatar();

      el.addEventListener('click', () => {
        cont.querySelectorAll('.char-card').forEach((x) => x.classList.remove('selected'));
        el.classList.add('selected');
        if (isEnemy) {
          enemyChar = c;
          buildCharacterCards(containerId, true);
        } else {
          playerChar = c;
          buildCharacterCards(containerId, false);
        }
      });

      el.addEventListener('remove', () => cancelAnimationFrame(rafId));
      cont.appendChild(el);
    });
  }

  // ============================================================
  // FÍSICA / JOGO
  // ============================================================
  function makeFighter(x, y, charStyle, isPlayer) {
    return {
      x,
      y,
      w: 80,
      h: 120,
      vx: 0,
      vy: 0,
      damage: 0,
      facing: isPlayer ? 1 : -1,
      isPlayer,
      style: charStyle,
      stocks: 3,
      hitstun: 0,
      eliminated: false,
      onGround: false,
      jumps: 2,
      lastState: 'idle',
      attackCooldown: 0,
      attacking: false,
      specialCooldown: 0,
      specialActive: 0
    };
  }

  function resetFighters() {
    const mx = MAIN_PLAT.x + MAIN_PLAT.w * 0.5;
    player = makeFighter(mx - 160, SPAWN_Y, playerChar, true);
    enemy = makeFighter(mx + 90, SPAWN_Y, enemyChar, false);
  }

  function addParticle(x, y, vx, vy, color, life) {
    particles.push({ x, y, vx, vy, color, life, maxLife: life });
  }

  function drawParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt * 60;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += GRAVITY * dt;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      const sz = 3 + Math.floor((p.life / p.maxLife) * 3);
      ctx.fillRect(p.x - camX, p.y - camY, sz, sz);
      ctx.globalAlpha = 1;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function checkAttackCollision(attacker, defender) {
    const dist = Math.hypot(
      defender.x + defender.w / 2 - (attacker.x + attacker.w / 2),
      defender.y + defender.h / 2 - (attacker.y + attacker.h / 2)
    );
    return dist < 130;
  }

  function isOnPlatform(f, plat) {
    return f.x + f.w > plat.x && f.x < plat.x + plat.w && f.y + f.h >= plat.y && f.y + f.h <= plat.y + 24;
  }

  function applyHit(attackerChar, attacker, defender, baseMultiplier = 1) {
    const dmg = attackerChar.stats.attackPower * baseMultiplier + Math.random() * attackerChar.stats.attackPower * 0.5;
    defender.damage += dmg;
    const kb = (dmg / 120) * 500 + 200;
    defender.vx += (defender.x > attacker.x ? 1 : -1) * kb;
    defender.vy -= 150 * baseMultiplier;
    defender.hitstun = Math.ceil(18 * baseMultiplier);

    for (let i = 0; i < 14; i++) {
      addParticle(
        defender.x + defender.w / 2 + (Math.random() - 0.5) * 50,
        defender.y + Math.random() * defender.h,
        (Math.random() - 0.5) * 500,
        (Math.random() - 0.5) * 500,
        attackerChar.color,
        22
      );
    }
  }

  function drawStageBackground(stage, currentCtx, w, h) {
    const grad = currentCtx.createLinearGradient(0, 0, 0, h);
    currentCtx.save();
    switch (stage.theme) {
      case 'brasil':
        grad.addColorStop(0, '#fcd78f');
        grad.addColorStop(0.45, '#f59e0b');
        grad.addColorStop(1, '#f97316');
        currentCtx.fillStyle = grad;
        currentCtx.fillRect(0, 0, w, h);
        currentCtx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        for (let i = 0; i < 16; i++) currentCtx.fillRect(i * 90 + 10, h * 0.3, 12, h * 0.5);
        currentCtx.fillStyle = '#f4c777';
        currentCtx.fillRect(0, h * 0.82, w, h * 0.18);
        break;
      case 'japao':
        grad.addColorStop(0, '#ffecf4');
        grad.addColorStop(0.4, '#f7c7dc');
        grad.addColorStop(1, '#9d4edd');
        currentCtx.fillStyle = grad;
        currentCtx.fillRect(0, 0, w, h);
        currentCtx.fillStyle = 'rgba(255,255,255,0.7)';
        for (let i = 0; i < 8; i++) {
          currentCtx.beginPath();
          currentCtx.arc(100 + i * 220, 130 + (i % 2) * 20, 28, 0, Math.PI * 2);
          currentCtx.fill();
        }
        currentCtx.fillStyle = '#6419e6';
        currentCtx.fillRect(90, h * 0.72, 180, 18);
        currentCtx.fillRect(160, h * 0.64, 40, h * 0.16);
        break;
      case 'eua':
        grad.addColorStop(0, '#020617');
        grad.addColorStop(0.45, '#172554');
        grad.addColorStop(1, '#0f172a');
        currentCtx.fillStyle = grad;
        currentCtx.fillRect(0, 0, w, h);
        currentCtx.strokeStyle = 'rgba(56,189,248,0.15)';
        currentCtx.lineWidth = 4;
        for (let i = 0; i < 14; i++) {
          currentCtx.beginPath();
          currentCtx.moveTo(i * 170 + 20, 0);
          currentCtx.lineTo(i * 170 + 20, h);
          currentCtx.stroke();
        }
        currentCtx.fillStyle = '#38bdf8';
        currentCtx.fillRect(120, h * 0.74, 72, h * 0.24);
        currentCtx.fillRect(260, h * 0.68, 52, h * 0.3);
        currentCtx.fillRect(380, h * 0.72, 90, h * 0.22);
        currentCtx.fillStyle = '#e0f2fe';
        for (let x = 110; x < 520; x += 40) currentCtx.fillRect(x, h * 0.82, 14, 6);
        break;
      case 'espaco':
        grad.addColorStop(0, '#070916');
        grad.addColorStop(0.55, '#2c096d');
        grad.addColorStop(1, '#090b1f');
        currentCtx.fillStyle = grad;
        currentCtx.fillRect(0, 0, w, h);
        currentCtx.fillStyle = '#c1d4ff';
        for (let i = 0; i < 65; i++) currentCtx.fillRect((Math.sin(i * 999 + bgNoiseSeed) * 0.5 + 0.5) * w, (Math.cos(i * 333 + bgNoiseSeed) * 0.5 + 0.5) * h, 2, 2);
        currentCtx.strokeStyle = 'rgba(96,165,250,0.35)';
        currentCtx.lineWidth = 4;
        currentCtx.beginPath();
        currentCtx.arc(w * 0.72, h * 0.22, 72, 0, Math.PI * 2);
        currentCtx.stroke();
        currentCtx.fillStyle = 'rgba(59,130,246,0.18)';
        currentCtx.beginPath();
        currentCtx.arc(w * 0.72, h * 0.22, 120, 0, Math.PI * 2);
        currentCtx.fill();
        break;
      case 'floresta':
        grad.addColorStop(0, '#071b12');
        grad.addColorStop(0.35, '#064e3b');
        grad.addColorStop(1, '#14532d');
        currentCtx.fillStyle = grad;
        currentCtx.fillRect(0, 0, w, h);
        currentCtx.fillStyle = 'rgba(110,231,183,0.08)';
        for (let i = 0; i < 14; i++) currentCtx.fillRect(i * 150 + 20, h * 0.24, 18, h * 0.54);
        currentCtx.fillStyle = '#4d7c0f';
        currentCtx.beginPath();
        currentCtx.arc(380, h * 0.82, 160, Math.PI, Math.PI * 2);
        currentCtx.fill();
        currentCtx.fillStyle = '#8fcd82';
        currentCtx.fillRect(0, h * 0.84, w, h * 0.16);
        break;
      case 'praia':
        grad.addColorStop(0, '#7dd3fc');
        grad.addColorStop(0.45, '#38bdf8');
        grad.addColorStop(1, '#0ea5e9');
        currentCtx.fillStyle = grad;
        currentCtx.fillRect(0, 0, w, h);
        currentCtx.fillStyle = '#fef3c7';
        currentCtx.fillRect(0, h * 0.8, w, h * 0.2);
        currentCtx.fillStyle = 'rgba(255,255,255,0.2)';
        for (let i = 0; i < 6; i++) {
          currentCtx.beginPath();
          currentCtx.arc(110 + i * 180, h * 0.72, 38, 0, Math.PI, true);
          currentCtx.fill();
        }
        currentCtx.fillStyle = 'rgba(14,165,233,0.18)';
        for (let j = 0; j < 6; j++) currentCtx.fillRect(70 + j * 180, h * 0.7, 110, 8);
        break;
    }
    currentCtx.restore();
  }

  function drawPlatforms(currentCtx, stageTheme) {
    let platTop = '#7c8ef0', platMid = '#4a5ecc', platBot = '#2a3a6a';
    switch (stageTheme) {
      case 'brasil': platTop = '#fbbf24'; platMid = '#f97316'; platBot = '#c2410c'; break;
      case 'japao': platTop = '#fda4af'; platMid = '#fb7185'; platBot = '#b91c1c'; break;
      case 'eua': platTop = '#38bdf8'; platMid = '#0ea5e9'; platBot = '#0369a1'; break;
      case 'espaco': platTop = '#818cf8'; platMid = '#6366f1'; platBot = '#4338ca'; break;
      case 'floresta': platTop = '#4ade80'; platMid = '#22c55e'; platBot = '#15803d'; break;
      case 'praia': platTop = '#7dd3fc'; platMid = '#38bdf8'; platBot = '#0ea5e9'; break;
    }

    for (const plat of PLATFORMS) {
      const gp = currentCtx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.h);
      gp.addColorStop(0, platTop);
      gp.addColorStop(0.3, platMid);
      gp.addColorStop(1, platBot);
      currentCtx.fillStyle = gp;
      currentCtx.fillRect(plat.x, plat.y, plat.w, plat.h);
      currentCtx.fillStyle = '#a0aef8';
      currentCtx.fillRect(plat.x, plat.y, plat.w, 3);
      currentCtx.fillStyle = '#1a2450';
      currentCtx.fillRect(plat.x, plat.y + 3, 3, plat.h - 3);
      currentCtx.fillRect(plat.x + plat.w - 3, plat.y + 3, 3, plat.h - 3);
    }
  }

  function getDeltaSeconds() {
    const t = performance.now();
    const dt = clamp((t - lastFrameTime) / 1000, 0, 0.033);
    lastFrameTime = t;
    return dt;
  }

  function respawnIfNeeded(fighter) {
    if (fighter.y <= WORLD_H + 200) return false;
    fighter.stocks -= 1;
    if (fighter.stocks <= 0) {
      fighter.eliminated = true;
      return true;
    }
    resetFighters();
    return false;
  }

  function gameStep() {
    requestAnimationFrame(gameStep);
    if (!gameRunning || !player || !enemy) return;

    const dt = getDeltaSeconds();

    // Player
    if (!player.eliminated) {
      if (keys.left) {
        player.vx = -playerChar.stats.speed;
        player.facing = -1;
      } else if (keys.right) {
        player.vx = playerChar.stats.speed;
        player.facing = 1;
      } else {
        player.vx *= 0.86;
      }

      if (keys.up && player.jumps > 0) {
        player.vy = -playerChar.stats.jumpPower;
        player.jumps -= 1;
        player.onGround = false;
        keys.up = false;
      }

      if (keys.attack && player.attackCooldown <= 0) {
        player.attacking = true;
        player.attackCooldown = playerChar.stats.attackSpeed;
        if (checkAttackCollision(player, enemy)) applyHit(playerChar, player, enemy, 1);
      }

      if (keys.special && player.specialCooldown <= 0) {
        player.attacking = true;
        player.specialActive = 18;
        player.specialCooldown = 220;

        if (playerChar.id === 'guerreiro' && checkAttackCollision(player, enemy)) applyHit(playerChar, player, enemy, 1.7);
        if (playerChar.id === 'ladrao') player.vx *= 1.6;
        if (playerChar.id === 'arqueira' && Math.abs(enemy.x - player.x) < 420) applyHit(playerChar, player, enemy, 1.8);
        if (playerChar.id === 'mago' && Math.abs(enemy.x - player.x) < 320) applyHit(playerChar, player, enemy, 2.1);
        if (playerChar.id === 'cavaleiro' && checkAttackCollision(player, enemy)) applyHit(playerChar, player, enemy, 1.2);
        if (playerChar.id === 'ogro' && Math.abs(enemy.x - player.x) < 280) applyHit(playerChar, player, enemy, 2.4);
      }

      player.attackCooldown = Math.max(0, player.attackCooldown - 1);
      player.specialCooldown = Math.max(0, player.specialCooldown - 1);
      player.specialActive = Math.max(0, player.specialActive - 1);
    }

    // CPU
    if (!enemy.eliminated) {
      const dx = player.x - enemy.x;
      const dist = Math.abs(dx);
      if (dist > 130) {
        enemy.vx = Math.sign(dx) * enemyChar.stats.speed * 0.8;
      } else {
        enemy.vx *= 0.8;
      }
      enemy.facing = dx >= 0 ? 1 : -1;

      if (Math.random() < 0.02 && enemy.jumps > 0) {
        enemy.vy = -enemyChar.stats.jumpPower;
        enemy.jumps -= 1;
        enemy.onGround = false;
      }

      if (Math.random() < 0.05 && enemy.attackCooldown <= 0 && dist < 130) {
        enemy.attacking = true;
        enemy.attackCooldown = enemyChar.stats.attackSpeed;
        if (checkAttackCollision(enemy, player)) applyHit(enemyChar, enemy, player, 1);
      }
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - 1);
    }

    // Física
    for (const f of [player, enemy]) {
      if (f.eliminated) continue;

      if (f.hitstun > 0) {
        f.hitstun -= 1;
      } else {
        f.attacking = false;
      }

      f.vy += GRAVITY * dt;
      f.vy = clamp(f.vy, -1200, MAX_FALL);
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.onGround = false;

      for (const plat of PLATFORMS) {
        if (isOnPlatform(f, plat)) {
          f.y = plat.y - f.h;
          f.vy = 0;
          f.jumps = 2;
          f.onGround = true;
        }
      }

      if (respawnIfNeeded(f)) {
        break;
      }
    }

    camX = clamp((player.x + enemy.x) * 0.5 - canvas.width * 0.5, 0, WORLD_W - canvas.width);
    camY = clamp(Math.min(player.y, enemy.y) - canvas.height * 0.4, 0, WORLD_H - canvas.height);

    // Render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStageBackground(selectedStage, ctx, canvas.width, canvas.height);

    ctx.fillStyle = '#1e2440';
    for (let gx = (-camX % 40); gx < canvas.width; gx += 40) {
      for (let gy = (-camY % 40); gy < canvas.height; gy += 40) {
        ctx.fillRect(gx, gy, 1, 1);
      }
    }

    ctx.save();
    ctx.translate(-camX, -camY);
    drawPlatforms(ctx, selectedStage.theme);
    drawParticles(dt);

    for (const f of [player, enemy]) {
      if (f.eliminated) continue;
      const animState = f.specialActive ? 'attack' : f.attacking ? 'attack' : !f.onGround ? 'jump' : Math.abs(f.vx) > 50 ? 'walk' : 'idle';
      f.lastState = animState;
      if (f.hitstun > 0 && Math.floor(f.hitstun / 3) % 2 === 0) ctx.globalAlpha = 0.35;
      drawCharacter(ctx, f.style.id, animState, f.x + f.w / 2, f.y + f.h, 5, f.facing, f.specialActive > 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = f.isPlayer ? '#60a5fa' : '#fb7185';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(f.style.name, f.x + f.w / 2, f.y - 10);
    }
    ctx.restore();

    // HUD
    $('hud-p1').textContent = `${Math.round(player.damage)}%`;
    $('hud-p2').textContent = `${Math.round(enemy.damage)}%`;
    $('stocks-p1').textContent = '●'.repeat(Math.max(0, player.stocks));
    $('stocks-p2').textContent = '●'.repeat(Math.max(0, enemy.stocks));

    if (player.eliminated || enemy.eliminated) {
      gameRunning = false;
      setTimeout(() => {
        alert(player.eliminated ? 'VOCÊ PERDEU!' : 'VOCÊ VENCEU!');
        $('screen-game').classList.add('hidden');
        $('screen-select').classList.remove('hidden');
      }, 1000);
    }
  }

  // ============================================================
  // INPUT
  // ============================================================
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'Space' || e.code === 'KeyW') {
      keys.up = true;
      e.preventDefault();
    }
    if (e.code === 'KeyQ' || e.code === 'KeyZ') keys.attack = true;
    if (e.code === 'KeyF') keys.special = true;
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'Space' || e.code === 'KeyW') keys.up = false;
    if (e.code === 'KeyQ' || e.code === 'KeyZ') keys.attack = false;
    if (e.code === 'KeyF') keys.special = false;
  });

  // ============================================================
  // BOTÕES / INICIALIZAÇÃO
  // ============================================================
  function init() {
    const canvas = $('game');
    const gameCtx = safeCtx(canvas);
    window.__GAME_CTX__ = gameCtx; // útil para debug
    // usa o contexto único do jogo
    Object.defineProperty(window, 'ctx', { value: gameCtx, writable: false, configurable: true });

    buildStageCards();
    buildCharacterCards('cards-p1', false);
    buildCharacterCards('cards-p2', true);

    const btnStage = $('btn-to-stage');
    const btnStartGame = $('btn-start-game');
    const btnBackChar = $('btn-back-char');
    const screenSelect = $('screen-select');
    const screenStage = $('screen-stage');
    const screenGame = $('screen-game');
    const hudStage = $('hud-stage-name');

    if (btnStage) {
      btnStage.addEventListener('click', () => {
        screenSelect.classList.add('hidden');
        screenStage.classList.remove('hidden');
      });
    }

    if (btnBackChar) {
      btnBackChar.addEventListener('click', () => {
        screenStage.classList.add('hidden');
        screenSelect.classList.remove('hidden');
      });
    }

    if (btnStartGame) {
      btnStartGame.addEventListener('click', () => {
        if (gameRunning) return;
        screenStage.classList.add('hidden');
        screenGame.classList.remove('hidden');

        $('hud-name-p1').textContent = `P1: ${playerChar.name}`;
        $('hud-name-p2').textContent = `CPU: ${enemyChar.name}`;
        hudStage.textContent = selectedStage.name;

        resetFighters();
        gameRunning = true;
        lastFrameTime = performance.now();
      });
    }

    bgNoiseSeed = Math.random() * 9999;
    requestAnimationFrame(gameStep);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
(() => {
  'use strict';

  // ============================================================
  // UTILITÁRIOS
  // ============================================================
  const $ = (id) => document.getElementById(id);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const nowSec = () => performance.now() / 1000;

  function safeCtx(canvas) {
    if (!canvas) throw new Error('Canvas #game não encontrado.');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não foi possível obter o contexto 2D do canvas.');
    ctx.imageSmoothingEnabled = false;
    return ctx;
  }

  function roundedRectPath(ctx, x, y, w, h, r = 6) {
    const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawOutlinedShape(ctx, drawPath, fillColor, outlineColor = '#000', outlineWidth = 6) {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    drawPath();
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    ctx.lineWidth = outlineWidth;
    ctx.strokeStyle = outlineColor;
    ctx.stroke();
    ctx.restore();
  }

  // ============================================================
  // DADOS
  // ============================================================
  const PALETTES = {
    guerreiro: { base: '#2563eb', dark: '#1e3a8a', metal: '#cbd5e1', accent: '#fbbf24', eye: '#ffffff' },
    ladrao:    { base: '#111827', dark: '#000000', metal: '#64748b', accent: '#ef4444', eye: '#ff0000' },
    arqueira:  { base: '#16a34a', dark: '#14532d', metal: '#d97706', accent: '#bef264', eye: '#ffffff' },
    mago:      { base: '#7e22ce', dark: '#4c1d95', metal: '#a855f7', accent: '#38bdf8', eye: '#38bdf8' },
    cavaleiro: { base: '#94a3b8', dark: '#475569', metal: '#f1f5f9', accent: '#fbbf24', eye: '#000000' },
    ogro:      { base: '#22c55e', dark: '#14532d', metal: '#451a03', accent: '#ef4444', eye: '#ffffff' }
  };

  // Se você já tiver CHARACTERS definidos em outro arquivo, este bloco não sobrescreve.
  const DEFAULT_CHARACTERS = [
    { id: 'guerreiro', name: 'Guerreiro', role: 'Equilibrado', ability: 'Golpe forte', color: '#2563eb', stats: { speed: 300, jumpPower: 850, attackPower: 18, attackSpeed: 22 } },
    { id: 'ladrao', name: 'Ladrão', role: 'Rápido', ability: 'Investida', color: '#111827', stats: { speed: 380, jumpPower: 900, attackPower: 14, attackSpeed: 14 } },
    { id: 'arqueira', name: 'Arqueira', role: 'Longo alcance', ability: 'Tiro preciso', color: '#16a34a', stats: { speed: 290, jumpPower: 880, attackPower: 16, attackSpeed: 18 } },
    { id: 'mago', name: 'Mago', role: 'Área', ability: 'Explosão mágica', color: '#7e22ce', stats: { speed: 270, jumpPower: 820, attackPower: 20, attackSpeed: 24 } },
    { id: 'cavaleiro', name: 'Cavaleiro', role: 'Defensivo', ability: 'Impacto', color: '#94a3b8', stats: { speed: 260, jumpPower: 800, attackPower: 17, attackSpeed: 20 } },
    { id: 'ogro', name: 'Ogro', role: 'Pesado', ability: 'Soco brutal', color: '#22c55e', stats: { speed: 230, jumpPower: 760, attackPower: 24, attackSpeed: 28 } }
  ];

  const CHARACTERS = Array.isArray(window.CHARACTERS) && window.CHARACTERS.length
    ? window.CHARACTERS
    : DEFAULT_CHARACTERS;

  const STAGES = [
    { id: 'brasil', name: 'Arena Brasil', theme: 'brasil', icon: '🇧🇷', description: 'Sol forte e muita energia!' },
    { id: 'japao', name: 'Noite de Tóquio', theme: 'japao', icon: '🇯🇵', description: 'Luzes neon e cerejeiras.' },
    { id: 'eua', name: 'Metrópole EUA', theme: 'eua', icon: '🇺🇸', description: 'Batalha entre arranha-céus.' },
    { id: 'espaco', name: 'Estação Espacial', theme: 'espaco', icon: '🌌', description: 'Luta entre as estrelas.' },
    { id: 'floresta', name: 'Bosque Selvagem', theme: 'floresta', icon: '🌲', description: 'A natureza esconde perigos.' },
    { id: 'praia', name: 'Costa Serena', theme: 'praia', icon: '🏖️', description: 'Areia, mar e porrada.' }
  ];

  const PLATFORMS = [
    { x: 720, y: 920, w: 1160, h: 76 },
    { x: 820, y: 688, w: 290, h: 28 },
    { x: 1490, y: 688, w: 290, h: 28 },
    { x: 600, y: 520, w: 200, h: 28 },
    { x: 1800, y: 520, w: 200, h: 28 },
    { x: 1150, y: 400, w: 300, h: 28 },
    { x: 400, y: 750, w: 150, h: 28 },
    { x: 2050, y: 780, w: 150, h: 28 },
    { x: 1300, y: 250, w: 200, h: 28 },
    { x: 700, y: 350, w: 180, h: 28 },
    { x: 1800, y: 330, w: 180, h: 28 },
    { x: 500, y: 600, w: 120, h: 28 },
    { x: 1950, y: 650, w: 120, h: 28 },
    { x: 250, y: 850, w: 150, h: 28 },
    { x: 2200, y: 900, w: 150, h: 28 },
    { x: 1100, y: 150, w: 150, h: 28 },
    { x: 100, y: 450, w: 120, h: 28 },
    { x: 2400, y: 480, w: 120, h: 28 }
  ];

  const WORLD_W = 2600;
  const WORLD_H = 1200;
  const GRAVITY = 2800;
  const MAX_FALL = 1000;
  const MAIN_PLAT = PLATFORMS[0];
  const SPAWN_Y = MAIN_PLAT.y - 150;

  // ============================================================
  // ESTADO
  // ============================================================
  const keys = { left: false, right: false, up: false, attack: false, special: false };
  const particles = [];
  let selectedStage = STAGES[0];
  let playerChar = CHARACTERS[0];
  let enemyChar = CHARACTERS[1] || CHARACTERS[0];
  let player = null;
  let enemy = null;
  let camX = 0;
  let camY = 0;
  let gameRunning = false;
  let lastFrameTime = performance.now();
  let bgNoiseSeed = 0;

  // ============================================================
  // RENDERIZAÇÃO DE PERSONAGEM
  // ============================================================
  function drawCharacter(ctx, id, anim, x, y, scale, dir, isAttacking) {
    const p = PALETTES[id] || PALETTES.guerreiro;
    const time = nowSec();
    const bob = anim === 'idle' ? Math.sin(time * 6) * 3 : 0;
    const walk = anim === 'walk' ? Math.sin(time * 12) * 10 : 0;
    const jumpLean = anim === 'jump' ? -8 : 0;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale * dir * 0.62, scale * 0.62);
    ctx.rotate(jumpLean * Math.PI / 180);

    // Sombra simples
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, 118, 42, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Corpo
    drawOutlinedShape(ctx, () => roundedRectPath(ctx, -14, -28 + bob, 28, 30, 10), p.base);
    drawOutlinedShape(ctx, () => roundedRectPath(ctx, -15, -8 + bob, 30, 8, 4), p.dark);

    // Cabeça
    drawOutlinedShape(ctx, () => {
      ctx.arc(0, -50 + bob, id === 'ogro' ? 26 : 22, 0, Math.PI * 2);
    }, p.base);

    // Olhos
    ctx.save();
    ctx.fillStyle = p.eye;
    ctx.beginPath();
    if (id === 'ladrao' || id === 'cavaleiro') {
      ctx.moveTo(-2, -52 + bob);
      ctx.lineTo(15, -48 + bob);
      ctx.lineTo(-2, -45 + bob);
    } else {
      ctx.arc(-5, -52 + bob, 4, 0, Math.PI * 2);
      ctx.arc(7, -50 + bob, 4, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();

    // Capa / detalhe
    if (id !== 'ogro') {
      drawOutlinedShape(ctx, () => {
        ctx.moveTo(-10, -25 + bob);
        ctx.quadraticCurveTo(-35, -10, -25 + Math.sin(time * 5) * 6, 15 + bob);
        ctx.lineTo(-5, 0 + bob);
        ctx.lineTo(4, -15 + bob);
      }, p.accent);
    }

    // Perna de trás
    ctx.save();
    ctx.strokeStyle = '#000';
    ctx.lineCap = 'round';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-3, 0 + bob);
    ctx.lineTo(-14 + walk, 30);
    ctx.stroke();
    ctx.restore();

    // Perna da frente
    ctx.save();
    ctx.strokeStyle = '#000';
    ctx.lineCap = 'round';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(4, 0 + bob);
    ctx.lineTo(15 - walk, 28);
    ctx.stroke();
    ctx.restore();

    // Botas
    drawOutlinedShape(ctx, () => roundedRectPath(ctx, -20 + walk, 24, 16, 10, 4), p.dark);
    drawOutlinedShape(ctx, () => roundedRectPath(ctx, 6 - walk, 22, 18, 11, 4), p.dark);

    // Braço / arma
    const armAngle = isAttacking ? Math.PI / 2.2 : Math.PI / 6;
    ctx.save();
    ctx.translate(10, -14 + bob);
    ctx.rotate(armAngle);

    ctx.strokeStyle = '#000';
    ctx.lineCap = 'round';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(12, 18);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(16, 20, 8, 0, Math.PI * 2);
    ctx.fillStyle = p.base;
    ctx.fill();
    ctx.stroke();

    drawWeapon(ctx, id, p);
    ctx.restore();

    ctx.restore();
  }

  function drawWeapon(ctx, id, p) {
    const drawKnife = () => {
      drawOutlinedShape(ctx, () => {
        ctx.moveTo(-4, 0);
        ctx.quadraticCurveTo(-14, 10, -2, 28);
        ctx.quadraticCurveTo(2, 12, 4, 0);
      }, p.metal);
      drawOutlinedShape(ctx, () => roundedRectPath(ctx, -3, -6, 6, 8, 2), '#111');
    };

    if (id === 'guerreiro' || id === 'cavaleiro') {
      drawOutlinedShape(ctx, () => {
        ctx.moveTo(-4, 0);
        ctx.lineTo(-3, 35);
        ctx.lineTo(0, 43);
        ctx.lineTo(3, 35);
        ctx.lineTo(4, 0);
      }, p.metal);
      drawOutlinedShape(ctx, () => roundedRectPath(ctx, -9, -2, 18, 4, 2), p.accent);
      drawOutlinedShape(ctx, () => roundedRectPath(ctx, -2, -10, 4, 8, 2), '#271206');
      return;
    }

    if (id === 'mago') {
      drawOutlinedShape(ctx, () => roundedRectPath(ctx, -2, -16, 4, 52, 2), '#4b2a00');
      drawOutlinedShape(ctx, () => {
        ctx.moveTo(0, -28);
        ctx.lineTo(7, -20);
        ctx.lineTo(0, -12);
        ctx.lineTo(-7, -20);
      }, p.accent);
      return;
    }

    if (id === 'ladrao') {
      drawKnife();
      return;
    }

    if (id === 'arqueira') {
      drawOutlinedShape(ctx, () => {
        ctx.moveTo(-10, -18);
        ctx.quadraticCurveTo(15, 0, -10, 28);
      }, '#5d4037');
      ctx.save();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-10, -18);
      ctx.lineTo(-5, 5);
      ctx.lineTo(-10, 28);
      ctx.stroke();
      ctx.restore();
      drawOutlinedShape(ctx, () => {
        ctx.moveTo(12, 2);
        ctx.lineTo(18, 5);
        ctx.lineTo(12, 8);
      }, p.metal);
      ctx.save();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-15, 5);
      ctx.lineTo(12, 5);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (id === 'ogro') {
      drawOutlinedShape(ctx, () => {
        ctx.moveTo(-3, -10);
        ctx.lineTo(-8, 25);
        ctx.arc(0, 25, 8, Math.PI, 0, true);
        ctx.lineTo(3, -10);
      }, '#451a03');
      [
        [-8, 15],
        [8, 20],
        [-6, 28]
      ].forEach(([x, y]) => {
        drawOutlinedShape(ctx, () => ctx.arc(x, y, 3, 0, Math.PI * 2), p.metal);
      });
    }
  }

  // ============================================================
  // HUD / TELAS
  // ============================================================
  function buildStageCards() {
    const stageContainer = $('stage-cards');
    if (!stageContainer) return;

    stageContainer.innerHTML = '';
    STAGES.forEach((stage) => {
      const card = document.createElement('div');
      card.className = `stage-card${stage.id === selectedStage.id ? ' selected' : ''}`;
      card.innerHTML = `
        <div class="stage-icon">${stage.icon}</div>
        <strong>${stage.name}</strong>
        <span class="stage-desc">${stage.description}</span>
      `;
      card.addEventListener('click', () => {
        selectedStage = stage;
        buildStageCards();
      });
      stageContainer.appendChild(card);
    });
  }

  function buildCharacterCards(containerId, isEnemy) {
    const cont = $(containerId);
    if (!cont) return;

    cont.innerHTML = '';
    CHARACTERS.forEach((c, index) => {
      const el = document.createElement('div');
      const selectedIndex = isEnemy ? CHARACTERS.indexOf(enemyChar) : CHARACTERS.indexOf(playerChar);
      el.className = `char-card${index === selectedIndex ? ' selected' : ''}`;
      el.innerHTML = `
        <canvas class="avatar" width="88" height="88"></canvas>
        <strong>${c.name}</strong>
        <small>${c.role}</small>
        <small class="ability-text">✨ ${c.ability}</small>
      `;

      const av = el.querySelector('canvas');
      const avCtx = safeCtx(av);
      let rafId = 0;

      const renderAvatar = () => {
        avCtx.clearRect(0, 0, 88, 88);
        const bg = avCtx.createRadialGradient(44, 44, 5, 44, 88, 55);
        bg.addColorStop(0, 'rgba(30,40,70,0.9)');
        bg.addColorStop(1, 'rgba(10,14,40,0.95)');
        avCtx.fillStyle = bg;
        avCtx.fillRect(0, 0, 88, 88);
        avCtx.fillStyle = 'rgba(100,120,240,0.2)';
        avCtx.fillRect(0, 75, 88, 13);
        drawCharacter(avCtx, c.id, 'idle', 44, 75, 1.5, 1, false);
        rafId = requestAnimationFrame(renderAvatar);
      };

      renderAvatar();

      el.addEventListener('click', () => {
        cont.querySelectorAll('.char-card').forEach((x) => x.classList.remove('selected'));
        el.classList.add('selected');
        if (isEnemy) {
          enemyChar = c;
          buildCharacterCards(containerId, true);
        } else {
          playerChar = c;
          buildCharacterCards(containerId, false);
        }
      });

      el.addEventListener('remove', () => cancelAnimationFrame(rafId));
      cont.appendChild(el);
    });
  }

  // ============================================================
  // FÍSICA / JOGO
  // ============================================================
  function makeFighter(x, y, charStyle, isPlayer) {
    return {
      x,
      y,
      w: 80,
      h: 120,
      vx: 0,
      vy: 0,
      damage: 0,
      facing: isPlayer ? 1 : -1,
      isPlayer,
      style: charStyle,
      stocks: 3,
      hitstun: 0,
      eliminated: false,
      onGround: false,
      jumps: 2,
      lastState: 'idle',
      attackCooldown: 0,
      attacking: false,
      specialCooldown: 0,
      specialActive: 0
    };
  }

  function resetFighters() {
    const mx = MAIN_PLAT.x + MAIN_PLAT.w * 0.5;
    player = makeFighter(mx - 160, SPAWN_Y, playerChar, true);
    enemy = makeFighter(mx + 90, SPAWN_Y, enemyChar, false);
  }

  function addParticle(x, y, vx, vy, color, life) {
    particles.push({ x, y, vx, vy, color, life, maxLife: life });
  }

  function drawParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt * 60;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += GRAVITY * dt;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      const sz = 3 + Math.floor((p.life / p.maxLife) * 3);
      ctx.fillRect(p.x - camX, p.y - camY, sz, sz);
      ctx.globalAlpha = 1;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function checkAttackCollision(attacker, defender) {
    const dist = Math.hypot(
      defender.x + defender.w / 2 - (attacker.x + attacker.w / 2),
      defender.y + defender.h / 2 - (attacker.y + attacker.h / 2)
    );
    return dist < 130;
  }

  function isOnPlatform(f, plat) {
    return f.x + f.w > plat.x && f.x < plat.x + plat.w && f.y + f.h >= plat.y && f.y + f.h <= plat.y + 24;
  }

  function applyHit(attackerChar, attacker, defender, baseMultiplier = 1) {
    const dmg = attackerChar.stats.attackPower * baseMultiplier + Math.random() * attackerChar.stats.attackPower * 0.5;
    defender.damage += dmg;
    const kb = (dmg / 120) * 500 + 200;
    defender.vx += (defender.x > attacker.x ? 1 : -1) * kb;
    defender.vy -= 150 * baseMultiplier;
    defender.hitstun = Math.ceil(18 * baseMultiplier);

    for (let i = 0; i < 14; i++) {
      addParticle(
        defender.x + defender.w / 2 + (Math.random() - 0.5) * 50,
        defender.y + Math.random() * defender.h,
        (Math.random() - 0.5) * 500,
        (Math.random() - 0.5) * 500,
        attackerChar.color,
        22
      );
    }
  }

  function drawStageBackground(stage, currentCtx, w, h) {
    const grad = currentCtx.createLinearGradient(0, 0, 0, h);
    currentCtx.save();
    switch (stage.theme) {
      case 'brasil':
        grad.addColorStop(0, '#fcd78f');
        grad.addColorStop(0.45, '#f59e0b');
        grad.addColorStop(1, '#f97316');
        currentCtx.fillStyle = grad;
        currentCtx.fillRect(0, 0, w, h);
        currentCtx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        for (let i = 0; i < 16; i++) currentCtx.fillRect(i * 90 + 10, h * 0.3, 12, h * 0.5);
        currentCtx.fillStyle = '#f4c777';
        currentCtx.fillRect(0, h * 0.82, w, h * 0.18);
        break;
      case 'japao':
        grad.addColorStop(0, '#ffecf4');
        grad.addColorStop(0.4, '#f7c7dc');
        grad.addColorStop(1, '#9d4edd');
        currentCtx.fillStyle = grad;
        currentCtx.fillRect(0, 0, w, h);
        currentCtx.fillStyle = 'rgba(255,255,255,0.7)';
        for (let i = 0; i < 8; i++) {
          currentCtx.beginPath();
          currentCtx.arc(100 + i * 220, 130 + (i % 2) * 20, 28, 0, Math.PI * 2);
          currentCtx.fill();
        }
        currentCtx.fillStyle = '#6419e6';
        currentCtx.fillRect(90, h * 0.72, 180, 18);
        currentCtx.fillRect(160, h * 0.64, 40, h * 0.16);
        break;
      case 'eua':
        grad.addColorStop(0, '#020617');
        grad.addColorStop(0.45, '#172554');
        grad.addColorStop(1, '#0f172a');
        currentCtx.fillStyle = grad;
        currentCtx.fillRect(0, 0, w, h);
        currentCtx.strokeStyle = 'rgba(56,189,248,0.15)';
        currentCtx.lineWidth = 4;
        for (let i = 0; i < 14; i++) {
          currentCtx.beginPath();
          currentCtx.moveTo(i * 170 + 20, 0);
          currentCtx.lineTo(i * 170 + 20, h);
          currentCtx.stroke();
        }
        currentCtx.fillStyle = '#38bdf8';
        currentCtx.fillRect(120, h * 0.74, 72, h * 0.24);
        currentCtx.fillRect(260, h * 0.68, 52, h * 0.3);
        currentCtx.fillRect(380, h * 0.72, 90, h * 0.22);
        currentCtx.fillStyle = '#e0f2fe';
        for (let x = 110; x < 520; x += 40) currentCtx.fillRect(x, h * 0.82, 14, 6);
        break;
      case 'espaco':
        grad.addColorStop(0, '#070916');
        grad.addColorStop(0.55, '#2c096d');
        grad.addColorStop(1, '#090b1f');
        currentCtx.fillStyle = grad;
        currentCtx.fillRect(0, 0, w, h);
        currentCtx.fillStyle = '#c1d4ff';
        for (let i = 0; i < 65; i++) currentCtx.fillRect((Math.sin(i * 999 + bgNoiseSeed) * 0.5 + 0.5) * w, (Math.cos(i * 333 + bgNoiseSeed) * 0.5 + 0.5) * h, 2, 2);
        currentCtx.strokeStyle = 'rgba(96,165,250,0.35)';
        currentCtx.lineWidth = 4;
        currentCtx.beginPath();
        currentCtx.arc(w * 0.72, h * 0.22, 72, 0, Math.PI * 2);
        currentCtx.stroke();
        currentCtx.fillStyle = 'rgba(59,130,246,0.18)';
        currentCtx.beginPath();
        currentCtx.arc(w * 0.72, h * 0.22, 120, 0, Math.PI * 2);
        currentCtx.fill();
        break;
      case 'floresta':
        grad.addColorStop(0, '#071b12');
        grad.addColorStop(0.35, '#064e3b');
        grad.addColorStop(1, '#14532d');
        currentCtx.fillStyle = grad;
        currentCtx.fillRect(0, 0, w, h);
        currentCtx.fillStyle = 'rgba(110,231,183,0.08)';
        for (let i = 0; i < 14; i++) currentCtx.fillRect(i * 150 + 20, h * 0.24, 18, h * 0.54);
        currentCtx.fillStyle = '#4d7c0f';
        currentCtx.beginPath();
        currentCtx.arc(380, h * 0.82, 160, Math.PI, Math.PI * 2);
        currentCtx.fill();
        currentCtx.fillStyle = '#8fcd82';
        currentCtx.fillRect(0, h * 0.84, w, h * 0.16);
        break;
      case 'praia':
        grad.addColorStop(0, '#7dd3fc');
        grad.addColorStop(0.45, '#38bdf8');
        grad.addColorStop(1, '#0ea5e9');
        currentCtx.fillStyle = grad;
        currentCtx.fillRect(0, 0, w, h);
        currentCtx.fillStyle = '#fef3c7';
        currentCtx.fillRect(0, h * 0.8, w, h * 0.2);
        currentCtx.fillStyle = 'rgba(255,255,255,0.2)';
        for (let i = 0; i < 6; i++) {
          currentCtx.beginPath();
          currentCtx.arc(110 + i * 180, h * 0.72, 38, 0, Math.PI, true);
          currentCtx.fill();
        }
        currentCtx.fillStyle = 'rgba(14,165,233,0.18)';
        for (let j = 0; j < 6; j++) currentCtx.fillRect(70 + j * 180, h * 0.7, 110, 8);
        break;
    }
    currentCtx.restore();
  }

  function drawPlatforms(currentCtx, stageTheme) {
    let platTop = '#7c8ef0', platMid = '#4a5ecc', platBot = '#2a3a6a';
    switch (stageTheme) {
      case 'brasil': platTop = '#fbbf24'; platMid = '#f97316'; platBot = '#c2410c'; break;
      case 'japao': platTop = '#fda4af'; platMid = '#fb7185'; platBot = '#b91c1c'; break;
      case 'eua': platTop = '#38bdf8'; platMid = '#0ea5e9'; platBot = '#0369a1'; break;
      case 'espaco': platTop = '#818cf8'; platMid = '#6366f1'; platBot = '#4338ca'; break;
      case 'floresta': platTop = '#4ade80'; platMid = '#22c55e'; platBot = '#15803d'; break;
      case 'praia': platTop = '#7dd3fc'; platMid = '#38bdf8'; platBot = '#0ea5e9'; break;
    }

    for (const plat of PLATFORMS) {
      const gp = currentCtx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.h);
      gp.addColorStop(0, platTop);
      gp.addColorStop(0.3, platMid);
      gp.addColorStop(1, platBot);
      currentCtx.fillStyle = gp;
      currentCtx.fillRect(plat.x, plat.y, plat.w, plat.h);
      currentCtx.fillStyle = '#a0aef8';
      currentCtx.fillRect(plat.x, plat.y, plat.w, 3);
      currentCtx.fillStyle = '#1a2450';
      currentCtx.fillRect(plat.x, plat.y + 3, 3, plat.h - 3);
      currentCtx.fillRect(plat.x + plat.w - 3, plat.y + 3, 3, plat.h - 3);
    }
  }

  function getDeltaSeconds() {
    const t = performance.now();
    const dt = clamp((t - lastFrameTime) / 1000, 0, 0.033);
    lastFrameTime = t;
    return dt;
  }

  function respawnIfNeeded(fighter) {
    if (fighter.y <= WORLD_H + 200) return false;
    fighter.stocks -= 1;
    if (fighter.stocks <= 0) {
      fighter.eliminated = true;
      return true;
    }
    resetFighters();
    return false;
  }

  function gameStep() {
    requestAnimationFrame(gameStep);
    if (!gameRunning || !player || !enemy) return;

    const dt = getDeltaSeconds();

    // Player
    if (!player.eliminated) {
      if (keys.left) {
        player.vx = -playerChar.stats.speed;
        player.facing = -1;
      } else if (keys.right) {
        player.vx = playerChar.stats.speed;
        player.facing = 1;
      } else {
        player.vx *= 0.86;
      }

      if (keys.up && player.jumps > 0) {
        player.vy = -playerChar.stats.jumpPower;
        player.jumps -= 1;
        player.onGround = false;
        keys.up = false;
      }

      if (keys.attack && player.attackCooldown <= 0) {
        player.attacking = true;
        player.attackCooldown = playerChar.stats.attackSpeed;
        if (checkAttackCollision(player, enemy)) applyHit(playerChar, player, enemy, 1);
      }

      if (keys.special && player.specialCooldown <= 0) {
        player.attacking = true;
        player.specialActive = 18;
        player.specialCooldown = 220;

        if (playerChar.id === 'guerreiro' && checkAttackCollision(player, enemy)) applyHit(playerChar, player, enemy, 1.7);
        if (playerChar.id === 'ladrao') player.vx *= 1.6;
        if (playerChar.id === 'arqueira' && Math.abs(enemy.x - player.x) < 420) applyHit(playerChar, player, enemy, 1.8);
        if (playerChar.id === 'mago' && Math.abs(enemy.x - player.x) < 320) applyHit(playerChar, player, enemy, 2.1);
        if (playerChar.id === 'cavaleiro' && checkAttackCollision(player, enemy)) applyHit(playerChar, player, enemy, 1.2);
        if (playerChar.id === 'ogro' && Math.abs(enemy.x - player.x) < 280) applyHit(playerChar, player, enemy, 2.4);
      }

      player.attackCooldown = Math.max(0, player.attackCooldown - 1);
      player.specialCooldown = Math.max(0, player.specialCooldown - 1);
      player.specialActive = Math.max(0, player.specialActive - 1);
    }

    // CPU
    if (!enemy.eliminated) {
      const dx = player.x - enemy.x;
      const dist = Math.abs(dx);
      if (dist > 130) {
        enemy.vx = Math.sign(dx) * enemyChar.stats.speed * 0.8;
      } else {
        enemy.vx *= 0.8;
      }
      enemy.facing = dx >= 0 ? 1 : -1;

      if (Math.random() < 0.02 && enemy.jumps > 0) {
        enemy.vy = -enemyChar.stats.jumpPower;
        enemy.jumps -= 1;
        enemy.onGround = false;
      }

      if (Math.random() < 0.05 && enemy.attackCooldown <= 0 && dist < 130) {
        enemy.attacking = true;
        enemy.attackCooldown = enemyChar.stats.attackSpeed;
        if (checkAttackCollision(enemy, player)) applyHit(enemyChar, enemy, player, 1);
      }
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - 1);
    }

    // Física
    for (const f of [player, enemy]) {
      if (f.eliminated) continue;

      if (f.hitstun > 0) {
        f.hitstun -= 1;
      } else {
        f.attacking = false;
      }

      f.vy += GRAVITY * dt;
      f.vy = clamp(f.vy, -1200, MAX_FALL);
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.onGround = false;

      for (const plat of PLATFORMS) {
        if (isOnPlatform(f, plat)) {
          f.y = plat.y - f.h;
          f.vy = 0;
          f.jumps = 2;
          f.onGround = true;
        }
      }

      if (respawnIfNeeded(f)) {
        break;
      }
    }

    camX = clamp((player.x + enemy.x) * 0.5 - canvas.width * 0.5, 0, WORLD_W - canvas.width);
    camY = clamp(Math.min(player.y, enemy.y) - canvas.height * 0.4, 0, WORLD_H - canvas.height);

    // Render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStageBackground(selectedStage, ctx, canvas.width, canvas.height);

    ctx.fillStyle = '#1e2440';
    for (let gx = (-camX % 40); gx < canvas.width; gx += 40) {
      for (let gy = (-camY % 40); gy < canvas.height; gy += 40) {
        ctx.fillRect(gx, gy, 1, 1);
      }
    }

    ctx.save();
    ctx.translate(-camX, -camY);
    drawPlatforms(ctx, selectedStage.theme);
    drawParticles(dt);

    for (const f of [player, enemy]) {
      if (f.eliminated) continue;
      const animState = f.specialActive ? 'attack' : f.attacking ? 'attack' : !f.onGround ? 'jump' : Math.abs(f.vx) > 50 ? 'walk' : 'idle';
      f.lastState = animState;
      if (f.hitstun > 0 && Math.floor(f.hitstun / 3) % 2 === 0) ctx.globalAlpha = 0.35;
      drawCharacter(ctx, f.style.id, animState, f.x + f.w / 2, f.y + f.h, 5, f.facing, f.specialActive > 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = f.isPlayer ? '#60a5fa' : '#fb7185';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(f.style.name, f.x + f.w / 2, f.y - 10);
    }
    ctx.restore();

    // HUD
    $('hud-p1').textContent = `${Math.round(player.damage)}%`;
    $('hud-p2').textContent = `${Math.round(enemy.damage)}%`;
    $('stocks-p1').textContent = '●'.repeat(Math.max(0, player.stocks));
    $('stocks-p2').textContent = '●'.repeat(Math.max(0, enemy.stocks));

    if (player.eliminated || enemy.eliminated) {
      gameRunning = false;
      setTimeout(() => {
        alert(player.eliminated ? 'VOCÊ PERDEU!' : 'VOCÊ VENCEU!');
        $('screen-game').classList.add('hidden');
        $('screen-select').classList.remove('hidden');
      }, 1000);
    }
  }

  // ============================================================
  // INPUT
  // ============================================================
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'Space' || e.code === 'KeyW') {
      keys.up = true;
      e.preventDefault();
    }
    if (e.code === 'KeyQ' || e.code === 'KeyZ') keys.attack = true;
    if (e.code === 'KeyF') keys.special = true;
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'Space' || e.code === 'KeyW') keys.up = false;
    if (e.code === 'KeyQ' || e.code === 'KeyZ') keys.attack = false;
    if (e.code === 'KeyF') keys.special = false;
  });

  // ============================================================
  // BOTÕES / INICIALIZAÇÃO
  // ============================================================
  function init() {
    const canvas = $('game');
    const gameCtx = safeCtx(canvas);
    window.__GAME_CTX__ = gameCtx; // útil para debug
    // usa o contexto único do jogo
    Object.defineProperty(window, 'ctx', { value: gameCtx, writable: false, configurable: true });

    buildStageCards();
    buildCharacterCards('cards-p1', false);
    buildCharacterCards('cards-p2', true);

    const btnStage = $('btn-to-stage');
    const btnStartGame = $('btn-start-game');
    const btnBackChar = $('btn-back-char');
    const screenSelect = $('screen-select');
    const screenStage = $('screen-stage');
    const screenGame = $('screen-game');
    const hudStage = $('hud-stage-name');

    if (btnStage) {
      btnStage.addEventListener('click', () => {
        screenSelect.classList.add('hidden');
        screenStage.classList.remove('hidden');
      });
    }

    if (btnBackChar) {
      btnBackChar.addEventListener('click', () => {
        screenStage.classList.add('hidden');
        screenSelect.classList.remove('hidden');
      });
    }

    if (btnStartGame) {
      btnStartGame.addEventListener('click', () => {
        if (gameRunning) return;
        screenStage.classList.add('hidden');
        screenGame.classList.remove('hidden');

        $('hud-name-p1').textContent = `P1: ${playerChar.name}`;
        $('hud-name-p2').textContent = `CPU: ${enemyChar.name}`;
        hudStage.textContent = selectedStage.name;

        resetFighters();
        gameRunning = true;
        lastFrameTime = performance.now();
      });
    }

    bgNoiseSeed = Math.random() * 9999;
    requestAnimationFrame(gameStep);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
