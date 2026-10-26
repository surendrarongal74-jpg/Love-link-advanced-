import * as THREE from 'three';

/**
 * Procedural texture helpers that require 0 external image requests.
 * Generates textures using HTML5 2D Canvas in sRGB color space.
 */

export function createHeartTexture(colorHex = '#FF6B8B', size = 128): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.scale(size / 32, size / 32);

    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(0, -2, -14, -6, -14, 4);
    ctx.bezierCurveTo(-14, 11, -5, 17, 0, 22);
    ctx.bezierCurveTo(5, 17, 14, 11, 14, 4);
    ctx.bezierCurveTo(14, -6, 0, -2, 0, 4);
    ctx.closePath();

    const grad = ctx.createRadialGradient(-2, 2, 2, 0, 10, 18);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.3, colorHex);
    grad.addColorStop(1, '#8E1840');

    ctx.fillStyle = grad;
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createWoodTexture(size = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#6D4C41';
    ctx.fillRect(0, 0, size, size);

    // Subtle grain lines
    for (let i = 0; i < size; i += 2) {
      const shade = Math.sin(i * 0.08) * 15 + Math.random() * 12;
      ctx.fillStyle = `rgba(38, 24, 20, ${0.12 + Math.sin(i * 0.02) * 0.08})`;
      ctx.fillRect(0, i, size, 1 + Math.sin(i * 0.1) * 2);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createPlaqueTexture(
  title: string,
  names: string,
  width = 512,
  height = 256
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Polished gold-brass gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#E5C07B');
    grad.addColorStop(0.3, '#FFE082');
    grad.addColorStop(0.5, '#FFD54F');
    grad.addColorStop(0.7, '#FFA000');
    grad.addColorStop(1, '#B27B10');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Beveled border
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#6D4C10';
    ctx.strokeRect(6, 6, width - 12, height - 12);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFF8E1';
    ctx.strokeRect(16, 16, width - 32, height - 32);

    // Engraved Typography
    ctx.fillStyle = '#3E2723';
    ctx.shadowColor = 'rgba(255,255,255,0.4)';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    ctx.font = 'bold 26px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(title.toUpperCase(), width / 2, 70);

    ctx.font = 'italic 20px "Cinzel", Georgia, serif';
    ctx.fillText(names, width / 2, 125);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#5D4037';
    ctx.fillText('LOVE LINK LOVEVERSE GALLERY', width / 2, 185);
    ctx.fillText('✦ PERMANENT COLLECTION ✦', width / 2, 215);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createLetterParchmentTexture(
  creator: string,
  recipient: string,
  snippet: string,
  width = 512,
  height = 512
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Warm vintage paper
    ctx.fillStyle = '#FFF8ED';
    ctx.fillRect(0, 0, width, height);

    // Aged edges
    const rad = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.7);
    rad.addColorStop(0, 'rgba(255,248,237,0)');
    rad.addColorStop(1, 'rgba(215,185,142,0.6)');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, width, height);

    // Decorative border
    ctx.strokeStyle = '#C49A6C';
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, width - 48, height - 48);

    // Text
    ctx.fillStyle = '#5A3D28';
    ctx.font = 'italic bold 24px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Dearest ${recipient},`, 48, 80);

    ctx.font = '17px Georgia, serif';
    // Wrap snippet text
    const words = (snippet || 'Every beat of my heart speaks your name.').split(' ');
    let line = '';
    let y = 130;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > width - 96 && n > 0) {
        ctx.fillText(line, 48, y);
        line = words[n] + ' ';
        y += 28;
        if (y > height - 120) break;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 48, y);

    ctx.font = 'italic 20px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText(`With endless love,`, width - 56, height - 70);
    ctx.font = 'bold italic 22px "Brush Script MT", cursive, Georgia';
    ctx.fillText(creator, width - 56, height - 40);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createFallbackArtworkTexture(caption: string, index: number, width = 512, height = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const hue = (index * 47) % 360;
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, `hsl(${hue}, 65%, 75%)`);
    grad.addColorStop(0.5, `hsl(${(hue + 35) % 360}, 50%, 85%)`);
    grad.addColorStop(1, `hsl(${(hue + 70) % 360}, 60%, 70%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Artistic romantic motif (stylized couple silhouette & heart)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 20, 80, 0, Math.PI * 2);
    ctx.fill();

    // Heart in center
    ctx.save();
    ctx.translate(width / 2, height / 2 - 30);
    ctx.scale(2.5, 2.5);
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(0, -2, -10, -6, -10, 4);
    ctx.bezierCurveTo(-10, 11, -3, 15, 0, 20);
    ctx.bezierCurveTo(3, 15, 10, 11, 10, 4);
    ctx.bezierCurveTo(10, -6, 0, -2, 0, 4);
    ctx.fillStyle = 'rgba(232, 84, 122, 0.7)';
    ctx.fill();
    ctx.restore();

    // Caption
    ctx.fillStyle = '#2B1A2E';
    ctx.font = 'italic 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(caption || 'A Treasured Memory', width / 2, height - 50);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createSakuraPetalTexture(size = 64): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(size / 2, size / 2);

    ctx.beginPath();
    ctx.moveTo(0, -size * 0.45);
    ctx.bezierCurveTo(size * 0.35, -size * 0.3, size * 0.35, size * 0.3, 0, size * 0.45);
    ctx.bezierCurveTo(-size * 0.35, size * 0.3, -size * 0.35, -size * 0.3, 0, -size * 0.45);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, -size * 0.4, 0, size * 0.4);
    grad.addColorStop(0, '#FFE4E9');
    grad.addColorStop(0.6, '#F8A5C2');
    grad.addColorStop(1, '#F78FB3');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
