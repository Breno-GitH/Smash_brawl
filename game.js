(function () {
  'use strict';

  // ============================================================
  // PIXEL ART CHARACTER RENDERER
  // Inspired by reference: rounded heads, volumetric hair,
  // separate shirt/pants/boots layers, natural limb angles
  // Grid: 1 unit = 1px at scale 1. Character fits ~18w x 32h
  // ============================================================

  // Each character has a color palette
  const PALETTES = {
    guerreiro: {
      skin: '#f4a46a', skinD: '#c87840', skinDD: '#a05828', skinH: '#ffc090',
      hair: '#3d2010', hairH: '#5c3018',
      shirt: '#1a3a8a', shirtH: '#2e5bcc', shirtD: '#0d2060',
      pants: '#2a2a3a', pantsH: '#3a3a50', pantsD: '#1a1a28',
      boot: '#5c3010', bootH: '#7a4418', bootD: '#3a1c08',
      metal: '#b8b8c8', metalH: '#e0e0f0', metalD: '#808090',
      eye: '#1a1a2a', mouth: '#c07050',
      weapon: '#8b7028', weaponH: '#c8a840', weaponD: '#5a4818',
      blood: '#cc2020', accent: '#ffaa00'
    },
    ladrao: {
      skin: '#f0c090', skinD: '#c89060', skinDD: '#a06840', skinH: '#ffd8a8',
      hair: '#101010', hairH: '#282828',
      shirt: '#181828', shirtH: '#282840', shirtD: '#0c0c18',
      pants: '#1e2a1e', pantsH: '#2a3c2a', pantsD: '#121a12',
      boot: '#3a2810', bootH: '#503818', bootD: '#221808',
      metal: '#507050', metalH: '#70a870', metalD: '#304830',
      eye: '#00cc44', mouth: '#b07848',
      weapon: '#303030', weaponH: '#585858', weaponD: '#181818',
      blood: '#00ff66', accent: '#00ff88'
    },
    arqueira: {
      skin: '#ffd09a', skinD: '#cc9060', skinDD: '#aa6840', skinH: '#ffe8b8',
      hair: '#801840', hairH: '#c02860', hairD: '#500c28',
      shirt: '#1a5a1a', shirtH: '#2a8a2a', shirtD: '#0e3a0e',
      pants: '#4a3010', pantsH: '#6a4818', pantsD: '#2e1e08',
      boot: '#5a3808', bootH: '#7a5018', bootD: '#381e04',
      metal: '#c8a030', metalH: '#f0c840', metalD: '#805820',
      eye: '#2a1010', mouth: '#cc8060',
      weapon: '#6a4010', weaponH: '#8a5818', weaponD: '#422808',
      blood: '#ffcc00', accent: '#ff6699'
    },
    mago: {
      skin: '#f0d8b8', skinD: '#c8a880', skinDD: '#a07850', skinH: '#f8e8d0',
      hair: '#200040', hairH: '#380070', hairD: '#100020',
      shirt: '#380870', shirtH: '#5810a8', shirtD: '#200450',
      pants: '#280860', pantsH: '#400898', pantsD: '#180438',
      boot: '#180430', bootH: '#280660', bootD: '#0c0220',
      metal: '#9000e0', metalH: '#cc00ff', metalD: '#5800a0',
      eye: '#e8e000', mouth: '#c09060',
      weapon: '#5808b0', weaponH: '#8010e0', weaponD: '#380880',
      blood: '#00e8ff', accent: '#00ffff'
    },
    cavaleiro: {
      skin: '#f8d8a0', skinD: '#d0a060', skinDD: '#a87840', skinH: '#fff0b8',
      hair: '#503010', hairH: '#7a4818', hairD: '#301808',
      shirt: '#808010', shirtH: '#b8b820', shirtD: '#505008',
      pants: '#686010', pantsH: '#908818', pantsD: '#404008',
      boot: '#484000', bootH: '#686000', bootD: '#282800',
      metal: '#d8c040', metalH: '#f8e868', metalD: '#908018',
      eye: '#101828', mouth: '#c89060',
      weapon: '#c0b030', weaponH: '#e8d848', weaponD: '#807818',
      blood: '#ffffff', accent: '#ff0000'
    },
    ogro: {
      skin: '#5a9030', skinD: '#3a6020', skinDD: '#204010', skinH: '#7ab850',
      hair: '#101010', hairH: '#202020', hairD: '#080808',
      shirt: '#402808', shirtH: '#603810', shirtD: '#281808',
      pants: '#383020', pantsH: '#504438', pantsD: '#201808',
      boot: '#302010', bootH: '#483020', bootD: '#1a1008',
      metal: '#604820', metalH: '#906030', metalD: '#382808',
      eye: '#e01010', mouth: '#c04040',
      weapon: '#402808', weaponH: '#603010', weaponD: '#281404',
      blood: '#ff3030', accent: '#ff6644'
    }
  };

  // ============================================================
  // CORE PIXEL DRAWING HELPERS
  // ============================================================
  function px(ctx, c, x, y, w, h) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w || 1, h || 1);
  }

  function rect(ctx, c, x, y, w, h) { px(ctx, c, x, y, w, h); }

  function drawLine(ctx, c, x1, y1, x2, y2, thick) {
    thick = thick || 2;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(len);
    ctx.fillStyle = c;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(x1 + dx * t);
      const y = Math.round(y1 + dy * t);
      ctx.fillRect(x, y, thick, thick);
    }
  }

  // ============================================================
  // MAIN CHARACTER DRAW FUNCTION - SIMPLIFIED PIXEL ART
  // drawX/drawY = feet center. scale = pixel multiplier. facing = ±1
  // ============================================================
  function drawCharacter(ctx, charId, state, drawX, drawY, scale, facing, isSpecial = false) {
    const p = PALETTES[charId] || PALETTES.guerreiro;
    const t = Date.now() / 130;
    const S = scale;

    ctx.save();
    ctx.translate(Math.round(drawX), Math.round(drawY));
    ctx.scale(facing, 1);
    ctx.imageSmoothingEnabled = false;

    // ── Animation parameters ──────────────────────────────────
    const phase = t * 2.8;
    const walkSin = Math.sin(phase);
    const isWalk = state === 'walk';
    const isJump = state === 'jump';
    const isAttack = state === 'attack';
    const isSpecialAttack = isSpecial && state !== 'jump';
    const isIdle = state === 'idle';

    const idleBob = isIdle ? Math.sin(t * 1.5) * 0.2 : 0;

    const legFwdL = isWalk ? walkSin * 3 : isJump ? -1.5 : 0;
    const legFwdR = isWalk ? -walkSin * 3 : isJump ? 1.5 : 0;

    const armFwdL = isWalk ? -walkSin * 2.5 : isAttack ? 4 : isJump ? -2 : 0;
    const armFwdR = isWalk ? walkSin * 2.5 : isAttack ? -1.5 : isJump ? 2 : 0;
    const armBendL = isWalk ? Math.abs(walkSin) * 0.8 : isAttack ? 1 : 0;
    const armBendR = isWalk ? Math.abs(Math.cos(phase)) * 0.8 : isAttack ? 2 : 0;

    const isOgro = charId === 'ogro';
    const isCavaleiro = charId === 'cavaleiro';
    const scale2 = isOgro ? 1.15 : isCavaleiro ? 1.08 : 1.0;

    function s(v) { return v * scale2; }

    const U = S;

    // ═════════════════════════════════════════════════════════
    // SIMPLIFIED PIXEL ART - BLOCKY STYLE
    // ═════════════════════════════════════════════════════════
    // Simple proportions: ~20-24 units total height
    const bootH = 2;           // Feet
    const calfH = bootH + 3.5; // Calf
    const thighH = calfH + 5;  // Thigh
    const hipH = thighH + 0.5; // Hip
    const waistH = hipH + 0.8; // Waist
    const chestH = waistH + 5; // Chest/torso
    const neckH = chestH + 0.6; // Neck
    const headH = neckH + 4;   // Head (simple, blocky)

    // Widths - simple blocks
    const hipW = isOgro ? 2.2 : isCavaleiro ? 2.0 : 1.8;
    const chestW = isOgro ? 2.8 : isCavaleiro ? 2.5 : 2.2;
    const headW = isOgro ? 1.3 : isCavaleiro ? 1.2 : 1.1;

    const oy = idleBob;

    if (isSpecialAttack) {
      for (let i = 0; i < 3; i++) {
        const alpha = 0.06 - i * 0.015;
        ctx.fillStyle = `rgba(255,238,88,${alpha})`;
        rect(ctx, ctx.fillStyle, -U * 3 - i, -U * 8 - i, U * 6 + i * 2, U * 8 + i * 2);
      }
    }

    // ── SHADOW ────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(0, -U * 0.2, U * hipW * 0.8, U * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── BACK ARM ──────────────────────────────────────────────
    {
      const shoulderX = -chestW * U * 0.5;
      const shoulderY = -(chestH + oy) * U;
      const armX = shoulderX + armFwdL * U;
      const armY = shoulderY + 4 * U;
      const elbowX = armX;
      const elbowY = armY;
      const wristX = elbowX + armFwdL * U * 0.3;
      const wristY = elbowY + 3.5 * U;

      // Upper arm (blocky)
      rect(ctx, p.shirtD, shoulderX - U * 0.7, shoulderY, U * 1.4, U * 4);
      // Forearm (blocky)
      rect(ctx, p.skin, wristX - U * 0.5, elbowY, U, U * 3.5);
      // Hand (blocky)
      rect(ctx, p.skin, wristX - U * 0.4, wristY, U * 0.8, U * 1.2);
      
      // Gloves/armor simple
      if (charId === 'guerreiro' || charId === 'cavaleiro') {
        rect(ctx, p.metal, wristX - U * 0.5, wristY - U * 0.3, U, U * 1.5);
      }
    }

    // ── BACK LEG ──────────────────────────────────────────────
    {
      const hipX = hipW * U * 0.3;
      const hipY = -(hipH + oy) * U;
      const thighX = hipX + legFwdR * U * 0.5;
      const thighY = hipY + (thighH - hipH) * U;
      const calfX = thighX;
      const calfY = thighY + (calfH - thighH) * U;
      const footX = calfX;
      const footY = -(bootH + oy) * U;

      // Thigh (blocky)
      rect(ctx, p.pantsD, thighX - U * 0.6, hipY, U * 1.2, (thighH - hipH) * U);
      // Calf (blocky)
      rect(ctx, p.pantsH, calfX - U * 0.5, thighY, U, (calfH - thighH) * U);
      // Boot (blocky)
      rect(ctx, p.boot, footX - U * 0.5, footY - U * bootH, U * 1.2, U * bootH);
    }

    // ── BODY / TORSO ──────────────────────────────────────────
    {
      const py2 = -(hipH + oy) * U;
      const py1 = -(waistH + oy) * U;
      
      // PANTS - Simple block
      rect(ctx, p.pants, -hipW * U, py2, hipW * 2 * U, (waistH - hipH) * U);
      rect(ctx, p.pantsH, -hipW * U * 0.5, py2, hipW * U, (waistH - hipH) * U);

      // TORSO/SHIRT - Simple block
      const ty1 = -(chestH + oy) * U;
      const tw = chestW * U;
      const chestH_px = (chestH - waistH) * U;
      
      rect(ctx, p.shirt, -tw, ty1, tw * 2, chestH_px);
      rect(ctx, p.shirtH, -tw * 0.3, ty1, tw * 0.6, chestH_px * 0.4);
      
      // Chest accent (simple)
      if (charId === 'guerreiro') {
        rect(ctx, '#1565c0', -tw * 0.4, ty1 + U * 1, tw * 0.8, chestH_px * 0.5);
        rect(ctx, '#ffd700', -U * 0.5, py1 - U * 0.3, U, U * 0.6);
      } else if (charId === 'ladrao') {
        rect(ctx, '#00b894', -U * 0.4, ty1 + U * 1.2, U * 0.8, chestH_px * 0.4);
      } else if (charId === 'arqueira') {
        rect(ctx, '#8b6914', -tw * 0.3, ty1 + U * 1.5, tw * 0.6, chestH_px * 0.3);
      } else if (charId === 'mago') {
        rect(ctx, '#3f51b5', -U * 0.5, ty1 + U * 1.8, U, U * 0.8);
        rect(ctx, '#ec407a', -U * 0.2, ty1 + U * 1.2, U * 0.4, U * 0.4);
      } else if (charId === 'cavaleiro') {
        rect(ctx, '#f4d03f', -tw * 0.4, ty1, tw * 0.8, chestH_px * 0.6);
        rect(ctx, '#c41e3a', -U * 0.2, ty1 + U * 2, U * 0.4, U * 0.4);
      } else if (charId === 'ogro') {
        rect(ctx, '#558b2f', -tw * 0.3, ty1 + U * 0.8, tw * 0.6, chestH_px * 0.6);
      }
    }

    // ── FRONT LEG ─────────────────────────────────────────────
    {
      const hipX = -hipW * U * 0.3;
      const hipY = -(hipH + oy) * U;
      const thighX = hipX + legFwdL * U * 0.5;
      const thighY = hipY + (thighH - hipH) * U;
      const calfX = thighX;
      const calfY = thighY + (calfH - thighH) * U;
      const footX = calfX;
      const footY = -(bootH + oy) * U;

      // Thigh (blocky)
      rect(ctx, p.pants, thighX - U * 0.6, hipY, U * 1.2, (thighH - hipH) * U);
      // Calf (blocky)
      rect(ctx, p.pantsH, calfX - U * 0.5, thighY, U, (calfH - thighH) * U);
      // Boot (blocky)
      rect(ctx, p.boot, footX - U * 0.5, footY - U * bootH, U * 1.2, U * bootH);
    }

    // ── NECK ──────────────────────────────────────────────────
    {
      const neckY = -(neckH + oy) * U;
      const neckH_px = (chestH - neckH) * U * 0.4;
      rect(ctx, p.skin, -U * 0.5, neckY, U, neckH_px);
    }

    // ── HEAD ──────────────────────────────────────────────────
    {
      const hx = -headW * U;
      const hy = -(headH + oy) * U;
      const hw = headW * 2 * U;
      const hh = 4 * U;  // Blocky head

      // Base head - SIMPLE BLOCK
      rect(ctx, p.skin, hx, hy, hw, hh);
      rect(ctx, p.skinD, hx + hw * 0.15, hy + U, hw * 0.7, hh * 0.5);

      // Eyes - SIMPLE
      const eyeY = hy + hh * 0.45;
      const eyeLX = hx + U * 0.5;
      const eyeRX = hx + hw - U * 1.3;
      rect(ctx, '#ffffff', eyeLX, eyeY, U * 0.8, U * 0.8);
      rect(ctx, '#ffffff', eyeRX, eyeY, U * 0.8, U * 0.8);
      rect(ctx, p.eye, eyeLX + U * 0.15, eyeY + U * 0.15, U * 0.5, U * 0.5);
      rect(ctx, p.eye, eyeRX + U * 0.15, eyeY + U * 0.15, U * 0.5, U * 0.5);
      rect(ctx, '#000000', eyeLX + U * 0.25, eyeY + U * 0.25, U * 0.3, U * 0.3);
      rect(ctx, '#000000', eyeRX + U * 0.25, eyeY + U * 0.25, U * 0.3, U * 0.3);
      
      // Eyebrows - SIMPLE
      rect(ctx, p.hair, eyeLX - U * 0.1, eyeY - U * 0.6, U * 0.9, U * 0.3);
      rect(ctx, p.hair, eyeRX - U * 0.1, eyeY - U * 0.6, U * 0.9, U * 0.3);

      // Nose
      rect(ctx, p.skinD, hx + hw * 0.45, hy + hh * 0.55, U * 0.4, U * 0.5);

      // Mouth
      const mouthY = hy + hh * 0.75;
      if (isAttack || isOgro) {
        rect(ctx, '#3a1810', hx + hw * 0.3, mouthY, hw * 0.4, U * 0.4);
      } else {
        rect(ctx, p.skinDD, hx + hw * 0.35, mouthY, hw * 0.3, U * 0.3);
      }

      // Simple blush
      if (charId === 'arqueira') {
        ctx.fillStyle = 'rgba(255, 100, 130, 0.25)';
        ctx.beginPath();
        ctx.arc(hx + U * 1.5, eyeY + hh * 0.1, U * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hx + hw - U * 1.5, eyeY + hh * 0.1, U * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hair
      drawHair(ctx, charId, p, hx, hy, hw, hh, U, isAttack, isJump, t);
    }

    // ── FRONT ARM ─────────────────────────────────────────────
    {
      const shoulderX = chestW * U * 0.5;
      const shoulderY = -(chestH + oy) * U;
      const armX = shoulderX + armFwdR * U;
      const armY = shoulderY + 4 * U;
      const elbowX = armX;
      const elbowY = armY;
      const wristX = elbowX + armFwdR * U * 0.3;
      const wristY = elbowY + 3.5 * U;

      // Upper arm (blocky)
      rect(ctx, p.shirt, shoulderX - U * 0.7, shoulderY, U * 1.4, U * 4);
      // Forearm (blocky)
      rect(ctx, p.skin, wristX - U * 0.5, elbowY, U, U * 3.5);
      // Hand (blocky)
      rect(ctx, p.skin, wristX - U * 0.4, wristY, U * 0.8, U * 1.2);
      
      // Gloves/armor simple
      if (charId === 'guerreiro' || charId === 'cavaleiro') {
        rect(ctx, p.metal, wristX - U * 0.5, wristY - U * 0.3, U, U * 1.5);
      }

      drawWeapon(ctx, charId, p, state, wristX, wristY, U, t, isAttack);
    }

    ctx.restore();
  }

  // ============================================================
  // HAIR DRAWING - SIMPLIFIED
  // ============================================================
  function drawHair(ctx, charId, p, hx, hy, hw, hh, U, isAttack, isJump, t) {
    const bounceY = (isJump || isAttack) ? U * 0.2 : Math.sin(t * 1.5) * U * 0.1;

    if (charId === 'guerreiro') {
      // Simple helmet
      rect(ctx, p.metal, hx - U * 0.3, hy - U * 0.7, hw + U * 0.6, U * 1);
      rect(ctx, p.metalH, hx - U * 0.2, hy - U * 0.6, hw + U * 0.4, U * 0.4);

    } else if (charId === 'ladrao') {
      // Simple hood
      rect(ctx, p.shirt, hx - U * 0.7, hy - U * 0.4, hw + U * 1.4, U * 0.9);
      rect(ctx, p.shirtD, hx - U * 0.6, hy - U * 0.3, hw + U * 1.2, U * 0.3);

    } else if (charId === 'arqueira') {
      // Long hair
      rect(ctx, p.hair, hx - U * 0.2, hy - U * 0.2, hw + U * 0.4, U * 1);
      rect(ctx, p.hairH, hx + U * 0.2, hy - U * 0.1, hw * 0.3, U * 0.7);
      // Braids
      rect(ctx, p.hair, hx - U * 1, hy + U * 0.4, U * 0.8, hh + U * 1.2 + bounceY);
      rect(ctx, p.hair, hx + hw + U * 0.2, hy + U * 0.4, U * 0.8, hh + U * 1.5 + bounceY);

    } else if (charId === 'mago') {
      // Simple wizard hat
      rect(ctx, p.shirt, hx - U * 1, hy - U * 0.8, hw + U * 2, U * 0.7);
      rect(ctx, p.shirt, hx + U * 0.1, hy - U * 1.4, hw - U * 0.2, U * 0.7);
      rect(ctx, p.metal, hx + U * 0.5, hy - U * 1.9, U * 0.9, U * 0.7);

    } else if (charId === 'cavaleiro') {
      // Simple metal helmet
      rect(ctx, p.metal, hx - U * 0.4, hy - U * 0.8, hw + U * 0.8, U * 1.2);
      rect(ctx, p.metalH, hx - U * 0.3, hy - U * 0.7, hw + U * 0.6, U * 0.4);
      // Red plume
      rect(ctx, '#cc0000', hx + hw * 0.2, hy - U * 2 + bounceY, U * 1.2, U * 1.8);

    } else if (charId === 'ogro') {
      // Spiky hair
      rect(ctx, p.hair, hx - U * 0.6, hy - U * 0.7, hw + U * 1.2, U * 1.5);
      // Spikes
      for (let i = 0; i < 3; i++) {
        rect(ctx, p.hair, hx - U * 0.5 + i * U * 0.9, hy - U * 1.2 - (i % 2) * U * 0.4, U * 0.7, U * 0.7);
      }
    }
  }

  // ============================================================
  // WEAPON DRAWING
  // ============================================================
  function drawWeapon(ctx, charId, p, state, wx, wy, U, t, isAttack) {
    if (charId === 'guerreiro') {
      const bladeLen = isAttack ? U * 14 : U * 11;
      const sx = wx + U * 1.5;
      const sy = wy - bladeLen;
      rect(ctx, p.metalD, sx - U * 0.6, sy, U * 2.4, bladeLen * 0.85);
      rect(ctx, p.metalH, sx, sy, U * 1.1, bladeLen * 0.85);
      rect(ctx, p.weapon, sx - U * 3.2, wy - U * 3, U * 6.4, U * 1.6);
      rect(ctx, p.weaponH, sx - U * 3.2, wy - U * 3, U * 1.1, U * 1.6);
      rect(ctx, p.bootD, sx, wy - U * 0.4, U * 1.4, U * 3.2);
      if (isAttack) {
        ctx.strokeStyle = 'rgba(255,220,100,0.8)';
        ctx.lineWidth = U * 2.2;
        ctx.beginPath();
        ctx.arc(wx, wy - U * 7, U * 8.5, -Math.PI * 0.6, -Math.PI * 0.1);
        ctx.stroke();
      }

    } else if (charId === 'ladrao') {
      rect(ctx, p.metalH, wx + U * 1.5, wy - U * 8.2, U, U * 6.5);
      rect(ctx, p.metal, wx + U * 0.8, wy - U * 7.8, U, U * 6.5);
      rect(ctx, p.weapon, wx, wy - U * 1.5, U * 3.5, U * 1.5);
      rect(ctx, p.weapon, wx + U * 0.8, wy, U * 1.5, U * 2);
      rect(ctx, p.metalH, wx + U * 1.5, wy - U * 9.2, U * 0.8, U * 1.5);
      if (isAttack) {
        ctx.fillStyle = 'rgba(0,200,100,0.45)';
        ctx.beginPath();
        ctx.arc(wx + U * 2.2, wy - U * 5.2, U * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (charId === 'arqueira') {
      ctx.strokeStyle = p.weapon;
      ctx.lineWidth = U * 1.8;
      ctx.beginPath();
      ctx.arc(wx + U * 2.2, wy - U * 5, U * 5.8, -Math.PI * 0.8, Math.PI * 0.8);
      ctx.stroke();
      ctx.strokeStyle = p.weaponH;
      ctx.lineWidth = U * 0.7;
      ctx.beginPath();
      ctx.moveTo(wx + U * 2.2, wy - U * 10);
      ctx.lineTo(wx + U * 2.2, wy);
      ctx.stroke();
      if (isAttack) {
        ctx.strokeStyle = 'rgba(255,200,0,0.7)';
        ctx.lineWidth = U * 1.8;
        ctx.beginPath();
        ctx.moveTo(wx + U * 4.5, wy - U * 4.8);
        ctx.lineTo(wx + U * 16, wy - U * 4.8);
        ctx.stroke();
      } else {
        rect(ctx, p.weaponH, wx + U * 1.4, wy - U * 9.5, U * 0.9, U * 9);
        rect(ctx, p.metal, wx - U * 1.1, wy - U * 10, U * 2.2, U * 2.2);
      }

    } else if (charId === 'mago') {
      rect(ctx, p.weapon, wx + U, wy - U * 13, U * 1.4, U * 13);
      rect(ctx, p.weaponH, wx + U, wy - U * 13, U * 0.7, U * 11);
      rect(ctx, p.metal, wx, wy - U * 4, U * 3.3, U * 1.5);
      if (isAttack) {
        ctx.fillStyle = 'rgba(184, 79, 255, 0.35)';
        ctx.beginPath();
        ctx.arc(wx + U * 1.8, wy - U * 15, U * 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(34, 211, 238, 0.4)';
        ctx.beginPath();
        ctx.arc(wx + U * 1.8, wy - U * 15, U * 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = p.blood;
      ctx.beginPath();
      ctx.arc(wx + U * 1.75, wy - U * 15, U * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(wx + U * 0.8, wy - U * 15.5, U * 1.2, 0, Math.PI * 2);
      ctx.fill();

    } else if (charId === 'cavaleiro') {
      rect(ctx, p.weapon, wx + U * 1.2, wy - U * 9.2, U * 2.4, U * 9.4);
      rect(ctx, p.metalH, wx + U * 1.2, wy - U * 9.2, U * 1.2, U * 8.4);
      rect(ctx, p.weaponH, wx + U * 1.4, wy - U * 10.2, U * 0.8, U * 1.1);
      rect(ctx, p.metal, wx - U * 2.2, wy - U * 2.2, U * 6.4, U * 1.6);
      rect(ctx, p.weaponH, wx - U * 2.2, wy - U * 2.2, U * 1.1, U * 1.6);
      if (isAttack) {
        ctx.strokeStyle = 'rgba(255,220,50,0.8)';
        ctx.lineWidth = U * 2.2;
        ctx.beginPath();
        ctx.arc(wx, wy - U * 5, U * 9.5, -Math.PI * 0.7, -Math.PI * 0.05);
        ctx.stroke();
      }

    } else if (charId === 'ogro') {
      rect(ctx, p.weapon, wx + U, wy - U * 10, U * 2.2, U * 10.5);
      rect(ctx, p.weaponH, wx + U, wy - U * 9.2, U * 1.2, U * 8.5);
      rect(ctx, p.weapon, wx - U * 2.2, wy - U * 17.2, U * 8.4, U * 7.2);
      rect(ctx, p.weaponD, wx + U * 4.2, wy - U * 17.2, U * 2.2, U * 7.2);
      if (isAttack) {
        ctx.fillStyle = 'rgba(200,80,0,0.45)';
        ctx.beginPath();
        ctx.arc(wx + U * 2, wy - U * 13, U * 8.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,160,0,0.6)';
        ctx.lineWidth = U * 2.2;
        ctx.beginPath();
        ctx.arc(wx + U * 2, wy - U * 13, U * 10.4, -Math.PI * 0.5, Math.PI * 0.3);
        ctx.stroke();
      }
    }
  }

  // ============================================================
  // CHARACTER DATA
  // ============================================================
  const CHARACTERS = [
    { id: 'guerreiro', name: 'Guerreiro', role: '⚔️ Guerreiro', color: '#3b82f6',
      stats: { health: 95, speed: 480, jumpPower: 920, weight: 85, attackPower: 12, attackSpeed: 30 },
      ability: 'GOLPE DUPLO', abilityDesc: 'Ataca 2x em sequência', abilityDmg: 1.8 },
    { id: 'ladrao', name: 'Ladrão', role: '⚡ Velocista', color: '#b91c1c',
      stats: { health: 60, speed: 680, jumpPower: 900, weight: 55, attackPower: 9, attackSpeed: 20 },
      ability: 'DISPARO RÁPIDO', abilityDesc: '3 ataques rápidos', abilityDmg: 1.5 },
    { id: 'arqueira', name: 'Arqueira', role: '🏹 Arqueira', color: '#16a34a',
      stats: { health: 80, speed: 520, jumpPower: 880, weight: 70, attackPower: 10, attackSpeed: 35 },
      ability: 'CHUVA DE FLECHAS', abilityDesc: '3 flechas em arco', abilityDmg: 2.0 },
    { id: 'mago', name: 'Mago', role: '🔥 Mago', color: '#9333ea',
      stats: { health: 70, speed: 440, jumpPower: 980, weight: 60, attackPower: 11, attackSpeed: 40 },
      ability: 'BOLA DE FOGO', abilityDesc: 'Explosão mágica', abilityDmg: 2.2 },
    { id: 'cavaleiro', name: 'Cavaleiro', role: '🛡️ Defensor', color: '#eab308',
      stats: { health: 130, speed: 400, jumpPower: 780, weight: 110, attackPower: 14, attackSpeed: 35 },
      ability: 'ESCUDO DOURADO', abilityDesc: 'Reduz dano em 50%', abilityDmg: 1.0 },
    { id: 'ogro', name: 'Ogro', role: '💪 Brutamonte', color: '#22c55e',
      stats: { health: 145, speed: 350, jumpPower: 700, weight: 130, attackPower: 16, attackSpeed: 45 },
      ability: 'PILAR DE TERRA', abilityDesc: 'Golpe definitivo', abilityDmg: 2.5 }
  ];

  const STAGES = [
    { id: 'brasil', name: 'Praça Tropical', theme: 'brasil', icon: '🌴', description: 'Coqueiros, areia e luz do sol.' },
    { id: 'japao', name: 'Templo Zen', theme: 'japao', icon: '⛩️', description: 'Lanternas e pétalas de sakura.' },
    { id: 'eua', name: 'Deserto Neon', theme: 'eua', icon: '🌆', description: 'Neon, outdoors e noite vibrante.' },
    { id: 'espaco', name: 'Plataforma Estelar', theme: 'espaco', icon: '🚀', description: 'Estrelas, planetas e gravidade leve.' },
    { id: 'floresta', name: 'Clareira Sombria', theme: 'floresta', icon: '🌲', description: 'Folhagens, raízes e brilho místico.' },
    { id: 'praia', name: 'Costa do Surf', theme: 'praia', icon: '🌊', description: 'Mar, ondas e areia dourada.' }
  ];
  let selectedStage = STAGES[0];

  function buildStageCards() {
    const stageContainer = document.getElementById('stage-cards');
    stageContainer.innerHTML = '';
    STAGES.forEach((stage) => {
      const card = document.createElement('div');
      card.className = 'stage-card' + (stage.id === selectedStage.id ? ' selected' : '');
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
  buildStageCards();

  function drawStageBackground(stage) {
    const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    switch (stage.theme) {
      case 'brasil':
        grad.addColorStop(0, '#fcd78f'); grad.addColorStop(0.45, '#f59e0b'); grad.addColorStop(1, '#f97316');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        for (let i = 0; i < 16; i++) ctx.fillRect(i * 90 + 10, VIEW_H * 0.3, 12, VIEW_H * 0.5);
        ctx.fillStyle = '#f4c777'; ctx.fillRect(0, VIEW_H * 0.82, VIEW_W, VIEW_H * 0.18);
        break;
      case 'japao':
        grad.addColorStop(0, '#ffecf4'); grad.addColorStop(0.4, '#f7c7dc'); grad.addColorStop(1, '#9d4edd');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        for (let i = 0; i < 8; i++) ctx.beginPath(), ctx.arc(100 + i * 220, 130 + (i % 2) * 20, 28, 0, Math.PI * 2), ctx.fill();
        ctx.fillStyle = '#6419e6'; ctx.fillRect(90, VIEW_H * 0.72, 180, 18);
        ctx.fillRect(160, VIEW_H * 0.64, 40, VIEW_H * 0.16);
        break;
      case 'eua':
        grad.addColorStop(0, '#020617'); grad.addColorStop(0.45, '#172554'); grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        ctx.strokeStyle = 'rgba(56,189,248,0.15)'; ctx.lineWidth = 4;
        for (let i = 0; i < 14; i++) ctx.beginPath(), ctx.moveTo(i * 170 + 20, 0), ctx.lineTo(i * 170 + 20, VIEW_H), ctx.stroke();
        ctx.fillStyle = '#38bdf8'; ctx.fillRect(120, VIEW_H * 0.74, 72, VIEW_H * 0.24);
        ctx.fillRect(260, VIEW_H * 0.68, 52, VIEW_H * 0.3);
        ctx.fillRect(380, VIEW_H * 0.72, 90, VIEW_H * 0.22);
        ctx.fillStyle = '#e0f2fe';
        for (let x = 110; x < 520; x += 40) ctx.fillRect(x, VIEW_H * 0.82, 14, 6);
        break;
      case 'espaco':
        grad.addColorStop(0, '#070916'); grad.addColorStop(0.55, '#2c096d'); grad.addColorStop(1, '#090b1f');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        ctx.fillStyle = '#c1d4ff';
        for (let i = 0; i < 65; i++) ctx.fillRect(Math.random() * VIEW_W, Math.random() * VIEW_H, 2, 2);
        ctx.strokeStyle = 'rgba(96,165,250,0.35)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(VIEW_W * 0.72, VIEW_H * 0.22, 72, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(59,130,246,0.18)'; ctx.beginPath(); ctx.arc(VIEW_W * 0.72, VIEW_H * 0.22, 120, 0, Math.PI * 2); ctx.fill();
        break;
      case 'floresta':
        grad.addColorStop(0, '#071b12'); grad.addColorStop(0.35, '#064e3b'); grad.addColorStop(1, '#14532d');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        ctx.fillStyle = 'rgba(110,231,183,0.08)';
        for (let i = 0; i < 14; i++) ctx.fillRect(i * 150 + 20, VIEW_H * 0.24, 18, VIEW_H * 0.54);
        ctx.fillStyle = '#4d7c0f'; ctx.beginPath(); ctx.arc(380, VIEW_H * 0.82, 160, Math.PI, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8fcd82'; ctx.fillRect(0, VIEW_H * 0.84, VIEW_W, VIEW_H * 0.16);
        break;
      case 'praia':
        grad.addColorStop(0, '#7dd3fc'); grad.addColorStop(0.45, '#38bdf8'); grad.addColorStop(1, '#0ea5e9');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        ctx.fillStyle = '#fef3c7'; ctx.fillRect(0, VIEW_H * 0.8, VIEW_W, VIEW_H * 0.2);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        for (let i = 0; i < 6; i++) ctx.beginPath(), ctx.arc(110 + i * 180, VIEW_H * 0.72, 38, 0, Math.PI, true), ctx.fill();
        ctx.fillStyle = 'rgba(14,165,233,0.18)';
        for (let j = 0; j < 6; j++) ctx.fillRect(70 + j * 180, VIEW_H * 0.7, 110, 8);
        break;
    }
  }

  // ============================================================
  // WORLD
  // ============================================================
  const PLATFORMS = [
    { x: 720, y: 920, w: 1160, h: 76 },
    { x: 820, y: 688, w: 290, h: 28 }, { x: 1490, y: 688, w: 290, h: 28 },
    { x: 600, y: 520, w: 200, h: 28 }, { x: 1800, y: 520, w: 200, h: 28 },
    { x: 1150, y: 400, w: 300, h: 28 },
    { x: 400, y: 750, w: 150, h: 28 }, { x: 2050, y: 780, w: 150, h: 28 },
    { x: 1300, y: 250, w: 200, h: 28 },
    { x: 700, y: 350, w: 180, h: 28 }, { x: 1800, y: 330, w: 180, h: 28 },
    { x: 500, y: 600, w: 120, h: 28 }, { x: 1950, y: 650, w: 120, h: 28 },
    { x: 250, y: 850, w: 150, h: 28 }, { x: 2200, y: 900, w: 150, h: 28 },
    { x: 1100, y: 150, w: 150, h: 28 },
    { x: 100, y: 450, w: 120, h: 28 }, { x: 2400, y: 480, w: 120, h: 28 }
  ];

  const MAIN_PLAT = PLATFORMS[0];
  const SPAWN_Y = MAIN_PLAT.y - 150;
  const WORLD_W = 2600;
  const WORLD_H = 1200;
  const GRAVITY = 2800;
  const MAX_FALL = 1000;
  const MOVE_SPEED = 480;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const VIEW_W = canvas.width;
  const VIEW_H = canvas.height;

  const particles = [];

  function addParticle(x, y, vx, vy, color, life) {
    particles.push({ x, y, vx, vy, color, life, maxLife: life });
  }

  function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life--;
      p.x += p.vx * 0.016;
      p.y += p.vy * 0.016;
      p.vy += GRAVITY * 0.016;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      const sz = 3 + Math.floor((p.life / p.maxLife) * 3);
      ctx.fillRect(p.x - camX, p.y - camY, sz, sz);
      ctx.globalAlpha = 1;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  const keys = {};
  let playerChar = CHARACTERS[0], enemyChar = CHARACTERS[1];
  let player, enemy, camX = 0, camY = 0, gameRunning = false;

  function makeFighter(x, y, charStyle, isPlayer) {
    return {
      x, y, w: 80, h: 120, vx: 0, vy: 0, damage: 0,
      facing: isPlayer ? 1 : -1, isPlayer, style: charStyle,
      stocks: 3, hitstun: 0, eliminated: false, onGround: false,
      jumps: 2, lastState: 'idle', attackCooldown: 0, attacking: false,
      specialCooldown: 0, specialActive: 0
    };
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function resetFighters() {
    const mx = MAIN_PLAT.x + MAIN_PLAT.w * 0.5;
    player = makeFighter(mx - 160, SPAWN_Y, playerChar, true);
    enemy = makeFighter(mx + 90, SPAWN_Y, enemyChar, false);
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'Space' || e.code === 'KeyW') { keys.up = true; e.preventDefault(); }
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

  function checkAttackCollision(attacker, defender) {
    return Math.hypot(
      defender.x + defender.w / 2 - (attacker.x + attacker.w / 2),
      defender.y + defender.h / 2 - (attacker.y + attacker.h / 2)
    ) < 130;
  }

  function gameStep() {
    if (!gameRunning) return requestAnimationFrame(gameStep);

    if (!player.eliminated) {
      if (keys.left) { player.vx = -playerChar.stats.speed; player.facing = -1; }
      else if (keys.right) { player.vx = playerChar.stats.speed; player.facing = 1; }
      else player.vx *= 0.85;
      if (keys.up && player.jumps > 0) {
        player.vy = -playerChar.stats.jumpPower; player.jumps--; player.onGround = false;
      }
      if (keys.attack && player.attackCooldown <= 0) {
        player.attacking = true;
        player.attackCooldown = playerChar.stats.attackSpeed;
        if (checkAttackCollision(player, enemy)) {
          const dmg = playerChar.stats.attackPower + Math.random() * playerChar.stats.attackPower * 0.5;
          enemy.damage += dmg;
          const kb = (dmg / 120) * 500 + 200;
          enemy.vx += (enemy.x > player.x ? 1 : -1) * kb;
          enemy.vy -= 150; enemy.hitstun = 20;
          for (let i = 0; i < 14; i++) addParticle(enemy.x + enemy.w / 2 + (Math.random() - 0.5) * 50, enemy.y + Math.random() * enemy.h, (Math.random() - 0.5) * 500, (Math.random() - 0.5) * 500, playerChar.color, 22);
        }
      }

      if (keys.special && player.specialCooldown <= 0) {
        player.attacking = true;
        player.specialActive = 18;
        player.specialCooldown = 220;
        if (playerChar.id === 'guerreiro' && checkAttackCollision(player, enemy)) {
          enemy.damage += playerChar.stats.attackPower * 1.7;
          enemy.vx += (enemy.x > player.x ? 1 : -1) * 700;
          enemy.vy -= 220; enemy.hitstun = 26;
        }
        if (playerChar.id === 'ladrao') {
          player.vx *= 1.6;
          for (let i = 0; i < 12; i++) addParticle(player.x + player.w / 2 + (Math.random() - 0.5) * 40, player.y + player.h * 0.5, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, '#f97316', 16);
        }
        if (playerChar.id === 'arqueira') {
          if (Math.abs(enemy.x - player.x) < 420) {
            enemy.damage += playerChar.stats.attackPower * 1.8;
            enemy.vx += (enemy.x > player.x ? 1 : -1) * 650;
            enemy.vy -= 180; enemy.hitstun = 24;
          }
        }
        if (playerChar.id === 'mago') {
          if (Math.abs(enemy.x - player.x) < 320) {
            enemy.damage += playerChar.stats.attackPower * 2.1;
            enemy.vy -= 240; enemy.hitstun = 28;
          }
        }
        if (playerChar.id === 'cavaleiro' && checkAttackCollision(player, enemy)) {
          enemy.damage += playerChar.stats.attackPower * 1.2;
          enemy.vx += (enemy.x > player.x ? 1 : -1) * 500;
          enemy.vy -= 180; enemy.hitstun = 20;
        }
        if (playerChar.id === 'ogro' && Math.abs(enemy.x - player.x) < 280) {
          enemy.damage += playerChar.stats.attackPower * 2.4;
          enemy.vx += (enemy.x > player.x ? 1 : -1) * 950;
          enemy.vy -= 260; enemy.hitstun = 32;
        }
      }

      player.attackCooldown--;
      player.specialCooldown = Math.max(0, player.specialCooldown - 1);
    }

    if (!enemy.eliminated) {
      const dx = player.x - enemy.x, dist = Math.abs(dx);
      if (dist > 130) enemy.vx = (dx > 0 ? 1 : -1) * enemyChar.stats.speed * 0.8;
      else enemy.vx *= 0.8;
      enemy.facing = dx > 0 ? 1 : -1;
      if (Math.random() < 0.02 && enemy.jumps > 0) { enemy.vy = -enemyChar.stats.jumpPower; enemy.jumps--; enemy.onGround = false; }
      if (Math.random() < 0.05 && enemy.attackCooldown <= 0 && dist < 130) {
        enemy.attacking = true; enemy.attackCooldown = enemyChar.stats.attackSpeed;
        if (checkAttackCollision(enemy, player)) {
          const dmg = enemyChar.stats.attackPower + Math.random() * enemyChar.stats.attackPower * 0.5;
          player.damage += dmg;
          const kb = (dmg / 120) * 500 + 200;
          player.vx += (player.x > enemy.x ? 1 : -1) * kb;
          player.vy -= 150; player.hitstun = 20;
          for (let i = 0; i < 14; i++) addParticle(player.x + player.w / 2 + (Math.random() - 0.5) * 50, player.y + Math.random() * player.h, (Math.random() - 0.5) * 500, (Math.random() - 0.5) * 500, enemyChar.color, 22);
        }
      }
      enemy.attackCooldown--;
    }

    for (const f of [player, enemy]) {
      if (f.eliminated) continue;
      if (f.hitstun > 0) f.hitstun--; else f.attacking = false;
      f.vy += GRAVITY * 0.016; f.vy = clamp(f.vy, -1200, MAX_FALL);
      f.y += f.vy * 0.016; f.x += f.vx * 0.016; f.onGround = false;
      for (const plat of PLATFORMS) {
        if (f.x + f.w > plat.x && f.x < plat.x + plat.w && f.y + f.h >= plat.y && f.y + f.h <= plat.y + 20) {
          f.y = plat.y - f.h; f.vy = 0; f.jumps = 2; f.onGround = true;
        }
      }
      if (f.y > WORLD_H + 200) { f.stocks--; if (f.stocks <= 0) f.eliminated = true; else resetFighters(); }
    }

    camX = (player.x + enemy.x) * 0.5 - VIEW_W * 0.5;
    camY = Math.min(player.y, enemy.y) - VIEW_H * 0.4;
    camX = clamp(camX, 0, WORLD_W - VIEW_W);
    camY = clamp(camY, 0, WORLD_H - VIEW_H);

    // Draw background
    drawStageBackground(selectedStage);

    // Dot grid
    ctx.fillStyle = '#1e2440';
    for (let gx = (-camX % 40); gx < VIEW_W; gx += 40)
      for (let gy = (-camY % 40); gy < VIEW_H; gy += 40)
        ctx.fillRect(gx, gy, 1, 1);

    ctx.save();
    ctx.translate(-camX, -camY);

    // Platforms
    let platTop = '#7c8ef0', platMid = '#4a5ecc', platBot = '#2a3a6a';
    switch (selectedStage.theme) {
      case 'brasil': platTop = '#fbbf24'; platMid = '#f97316'; platBot = '#c2410c'; break;
      case 'japao': platTop = '#fda4af'; platMid = '#fb7185'; platBot = '#b91c1c'; break;
      case 'eua': platTop = '#38bdf8'; platMid = '#0ea5e9'; platBot = '#0369a1'; break;
      case 'espaco': platTop = '#818cf8'; platMid = '#6366f1'; platBot = '#4338ca'; break;
      case 'floresta': platTop = '#4ade80'; platMid = '#22c55e'; platBot = '#15803d'; break;
      case 'praia': platTop = '#7dd3fc'; platMid = '#38bdf8'; platBot = '#0ea5e9'; break;
    }
    for (const plat of PLATFORMS) {
      const gp = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.h);
      gp.addColorStop(0, platTop); gp.addColorStop(0.3, platMid); gp.addColorStop(1, platBot);
      ctx.fillStyle = gp; ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      ctx.fillStyle = '#a0aef8'; ctx.fillRect(plat.x, plat.y, plat.w, 3);
      ctx.fillStyle = '#1a2450';
      ctx.fillRect(plat.x, plat.y + 3, 3, plat.h - 3);
      ctx.fillRect(plat.x + plat.w - 3, plat.y + 3, 3, plat.h - 3);
    }

    drawParticles();

    for (const f of [player, enemy]) {
      if (f.eliminated) continue;
      if (f.specialActive > 0) f.specialActive--;
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

    document.getElementById('hud-p1').textContent = Math.round(player.damage) + '%';
    document.getElementById('hud-p2').textContent = Math.round(enemy.damage) + '%';
    document.getElementById('stocks-p1').textContent = '●'.repeat(Math.max(0, player.stocks));
    document.getElementById('stocks-p2').textContent = '●'.repeat(Math.max(0, enemy.stocks));

    if (player.eliminated || enemy.eliminated) {
      gameRunning = false;
      setTimeout(() => {
        alert(player.eliminated ? 'VOCÊ PERDEU!' : 'VOCÊ VENCEU!');
        document.getElementById('screen-game').classList.add('hidden');
        document.getElementById('screen-select').classList.remove('hidden');
      }, 1000);
    }

    requestAnimationFrame(gameStep);
  }

  const btnStage = document.getElementById('btn-to-stage');
  const btnStartGame = document.getElementById('btn-start-game');
  const btnBackChar = document.getElementById('btn-back-char');
  const screenSelect = document.getElementById('screen-select');
  const screenStage = document.getElementById('screen-stage');
  const screenGame = document.getElementById('screen-game');
  const hudStage = document.getElementById('hud-stage-name');

  btnStage.addEventListener('click', () => {
    screenSelect.classList.add('hidden');
    screenStage.classList.remove('hidden');
  });

  btnBackChar.addEventListener('click', () => {
    screenStage.classList.add('hidden');
    screenSelect.classList.remove('hidden');
  });

  btnStartGame.addEventListener('click', () => {
    if (gameRunning) return;
    screenStage.classList.add('hidden');
    screenGame.classList.remove('hidden');
    document.getElementById('hud-name-p1').textContent = 'P1: ' + playerChar.name;
    document.getElementById('hud-name-p2').textContent = 'CPU: ' + enemyChar.name;
    hudStage.textContent = selectedStage.name;
    resetFighters(); gameRunning = true; requestAnimationFrame(gameStep);
  });

  // ── Character selection cards ──────────────────────────────
  const charContainer = document.getElementById('cards-p1');
  const charContainer2 = document.getElementById('cards-p2');

  [charContainer, charContainer2].forEach((cont, isEnemy) => {
    cont.innerHTML = '';
    CHARACTERS.forEach((c, i) => {
      const el = document.createElement('div');
      el.className = 'char-card' + (i === (isEnemy ? 1 : 0) ? ' selected' : '');
      el.innerHTML = `
        <canvas class="avatar" width="88" height="88"></canvas>
        <strong>${c.name}</strong>
        <small>${c.role}</small>
        <small class="ability-text">✨ ${c.ability}</small>
      `;

      const av = el.querySelector('canvas');
      const avCtx = av.getContext('2d');
      avCtx.imageSmoothingEnabled = false;

      function renderAvatar() {
        avCtx.clearRect(0, 0, 88, 88);
        const bg = avCtx.createRadialGradient(44, 44, 5, 44, 88, 55);
        bg.addColorStop(0, 'rgba(30,40,70,0.9)');
        bg.addColorStop(1, 'rgba(10,14,40,0.95)');
        avCtx.fillStyle = bg;
        avCtx.fillRect(0, 0, 88, 88);
        avCtx.fillStyle = 'rgba(100,120,240,0.2)';
        avCtx.fillRect(0, 82, 88, 6);
        drawCharacter(avCtx, c.id, 'idle', 44, 82, 2.8, 1, false);
        requestAnimationFrame(renderAvatar);
      }
      renderAvatar();

      el.addEventListener('click', () => {
        cont.querySelectorAll('.char-card').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
        if (isEnemy) enemyChar = c; else playerChar = c;
      });

      cont.appendChild(el);
    });
  });

})();