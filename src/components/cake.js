import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import confetti from 'canvas-confetti';
import { normalizeModel } from '../utils/modelHelper.js';

/**
 * BirthdayCake: Bánh kem sinh nhật lung linh đặt ngay ngắn trên khăn trải bàn tiệc
 */
export class BirthdayCake {
  constructor(scene, onCandleBlown, loadingManager = null) {
    this.scene = scene;
    this.onCandleBlown = onCandleBlown;
    this.loadingManager = loadingManager;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.flameLights = [];
    this.flameSprites = [];
    this.isBlownOut = false;
    this.time = 0;

    // Chiều cao mặt khăn trải bàn
    this.tableHeight = 0.78;

    // Vùng va chạm tương tác bao trọn bánh kem, nến và đĩa đỡ
    const hitBoxGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.45, 16);
    const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
    hitBox.position.set(0, this.tableHeight + 0.22, -0.65);
    hitBox.userData = {
      interactive: true,
      type: 'cake',
      hint: 'Bánh kem sinh nhật (Nhấp để thổi nến ước nguyện 🎂)'
    };
    this.group.add(hitBox);
    this.hitBox = hitBox;

    this.loadModels();
  }

  loadModels() {
    const loader = new GLTFLoader(this.loadingManager);

    loader.load(
      '/models/cake.glb',
      (gltf) => {
        const rawCake = gltf.scene;

        rawCake.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.userData = {
              interactive: true,
              type: 'cake',
              hint: 'Bánh kem sinh nhật (Nhấp để thổi nến ước nguyện 🎂)'
            };
          }
        });

        // Đĩa bạc đỡ bánh kem
        const plateGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.015, 32);
        const plateMat = new THREE.MeshStandardMaterial({
          color: 0xe8e8ea,
          roughness: 0.2,
          metalness: 0.85
        });
        const plate = new THREE.Mesh(plateGeo, plateMat);
        plate.position.set(0, this.tableHeight + 0.008, -0.65);
        plate.receiveShadow = true;
        plate.userData = {
          interactive: true,
          type: 'cake',
          hint: 'Bánh kem sinh nhật (Nhấp để thổi nến ước nguyện 🎂)'
        };
        this.group.add(plate);

        // Bánh kem chuẩn hóa kích thước rộng 0.38m đặt ngay ngắn giữa bàn
        const cakeWrapper = normalizeModel(rawCake, 0.38, true);
        cakeWrapper.position.set(0, this.tableHeight + 0.015, -0.65);
        this.cakeWrapper = cakeWrapper;
        this.group.add(cakeWrapper);

        // Đo chính xác độ cao đỉnh bánh kem sau khi chuẩn hóa để cắm nến
        cakeWrapper.updateMatrixWorld(true);
        const cakeBox = new THREE.Box3().setFromObject(cakeWrapper);
        const cakeTopY = cakeBox.max.y;

        this.addCandlesAndFlames(cakeTopY);
      },
      undefined,
      (err) => console.warn('Lỗi tải model cake:', err)
    );
  }

  /**
   * Tạo các cây nến sinh nhật nhỏ xinh xắn có hoa văn sọc xoắn cắm trên bánh kem
   */
  addCandlesAndFlames(cakeTopY = 1.05) {


    // --- HYPER-REALISTIC CANDLE & FLAME GENERATION ---
    // Tạo texture ngọn lửa nến chân thực chuẩn vật lý:
    // Chân lửa xanh lam (blue base) -> Tim sáng trắng chói lọi (white-hot core) -> Thân vàng ấm (luminous yellow) -> Đỉnh cam nhọn (amber tip)
    const createHyperRealisticFlameTex = () => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 512;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, 256, 512);

      const cx = 128;
      const baseTipY = 60;   // Đỉnh nhọn ngọn lửa
      const flameBaseY = 440; // Đáy ngọn lửa quanh bấc

      // 1. Quầng nhiệt viền mỏng ngoài cùng (faint thermal glow envelope)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, baseTipY - 10);
      ctx.bezierCurveTo(cx + 60, 160, cx + 75, 330, cx + 38, 435);
      ctx.bezierCurveTo(cx + 20, 455, cx - 20, 455, cx - 38, 435);
      ctx.bezierCurveTo(cx - 75, 330, cx - 60, 160, cx, baseTipY - 10);
      ctx.closePath();
      const envelopeGrad = ctx.createLinearGradient(cx, baseTipY, cx, flameBaseY);
      envelopeGrad.addColorStop(0, 'rgba(255, 100, 20, 0.4)');
      envelopeGrad.addColorStop(0.3, 'rgba(255, 140, 20, 0.25)');
      envelopeGrad.addColorStop(0.7, 'rgba(255, 160, 40, 0.12)');
      envelopeGrad.addColorStop(1, 'rgba(30, 80, 255, 0)');
      ctx.fillStyle = envelopeGrad;
      ctx.fill();
      ctx.restore();

      // 2. Thân ngọn lửa chính hình giọt nước thanh tú (Luminous Flame Body)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, baseTipY);
      ctx.bezierCurveTo(cx + 46, 170, cx + 58, 330, cx + 28, 430);
      ctx.bezierCurveTo(cx + 14, 448, cx - 14, 448, cx - 28, 430);
      ctx.bezierCurveTo(cx - 58, 330, cx - 46, 170, cx, baseTipY);
      ctx.closePath();

      const mainFlameGrad = ctx.createLinearGradient(cx, baseTipY, cx, flameBaseY);
      mainFlameGrad.addColorStop(0, '#ff4d00');       // Đỉnh cam đỏ nhọn
      mainFlameGrad.addColorStop(0.18, '#ff9000');    // Cam vàng
      mainFlameGrad.addColorStop(0.48, '#ffcc00');    // Vàng rực rỡ
      mainFlameGrad.addColorStop(0.75, '#ffeaa7');    // Vàng kem sáng
      mainFlameGrad.addColorStop(0.88, '#ffffff');    // Gần đáy sáng trắng
      mainFlameGrad.addColorStop(0.96, 'rgba(60, 130, 255, 0.9)'); // Chân lam đậm
      mainFlameGrad.addColorStop(1, 'rgba(20, 60, 220, 0.4)');
      ctx.fillStyle = mainFlameGrad;
      ctx.fill();

      // 3. Tim lửa trắng nóng (Incandescent White-Hot Inner Core)
      ctx.beginPath();
      ctx.moveTo(cx, 160);
      ctx.bezierCurveTo(cx + 26, 230, cx + 32, 330, cx + 16, 415);
      ctx.bezierCurveTo(cx + 8, 430, cx - 8, 430, cx - 16, 415);
      ctx.bezierCurveTo(cx - 32, 330, cx - 26, 230, cx, 160);
      ctx.closePath();

      const coreGrad = ctx.createLinearGradient(cx, 160, cx, 425);
      coreGrad.addColorStop(0, 'rgba(255, 255, 240, 0.95)');
      coreGrad.addColorStop(0.6, '#ffffff');
      coreGrad.addColorStop(0.9, '#ffffff');
      coreGrad.addColorStop(1, 'rgba(210, 235, 255, 0.7)');
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // 4. Vùng xanh lam đáy nến tự nhiên (Blue Base Zone - khí đốt oxy)
      ctx.beginPath();
      ctx.ellipse(cx, 432, 28, 16, 0, 0, Math.PI * 2);
      const blueBaseGrad = ctx.createRadialGradient(cx, 432, 2, cx, 432, 28);
      blueBaseGrad.addColorStop(0, 'rgba(0, 140, 255, 0.9)');
      blueBaseGrad.addColorStop(0.6, 'rgba(30, 80, 240, 0.6)');
      blueBaseGrad.addColorStop(1, 'rgba(0, 20, 180, 0)');
      ctx.fillStyle = blueBaseGrad;
      ctx.fill();

      ctx.restore();

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    // Quầng sáng tỏa vi mô tinh tế (rất nhẹ, không làm lóa mắt)
    const createSubtleGlowTex = () => {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 128;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
      grad.addColorStop(0, 'rgba(255, 200, 100, 0.45)');
      grad.addColorStop(0.35, 'rgba(255, 140, 30, 0.15)');
      grad.addColorStop(0.7, 'rgba(255, 80, 10, 0.04)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const flameTexture = createHyperRealisticFlameTex();
    const glowSubtleTexture = createSubtleGlowTex();

    const flameMat = new THREE.SpriteMaterial({
      map: flameTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const subtleGlowMat = new THREE.SpriteMaterial({
      map: glowSubtleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    // Chất liệu sáp nến sang trọng tự nhiên (Translucent Paraffin Wax)
    const candleWaxMat1 = new THREE.MeshStandardMaterial({
      color: 0xfffaf0,
      roughness: 0.28,
      metalness: 0.02
    });
    const candleWaxMat2 = new THREE.MeshStandardMaterial({
      color: 0xfff4e6,
      roughness: 0.28,
      metalness: 0.02
    });
    const candleWaxMat3 = new THREE.MeshStandardMaterial({
      color: 0xffeef5,
      roughness: 0.28,
      metalness: 0.02
    });

    // Chất liệu sáp lỏng tan chảy bóng loáng ở miệng nến
    const meltedWaxMat = new THREE.MeshStandardMaterial({
      color: 0xfff6dd,
      roughness: 0.05,
      metalness: 0.1
    });

    // Bấc nến bện từ sợi cotton cháy xém
    const wickMat = new THREE.MeshStandardMaterial({
      color: 0x14100e,
      roughness: 0.95
    });

    // 3 Cây nến sinh nhật thanh lịch cắm tự nhiên trên bánh
    const candlePositions = [
      { x: 0, z: -0.65, mat: candleWaxMat1, scale: 1.0 },
      { x: -0.038, z: -0.638, mat: candleWaxMat2, scale: 0.94 },
      { x: 0.038, z: -0.638, mat: candleWaxMat3, scale: 0.94 }
    ];

    const candleBaseY = cakeTopY - 0.005;
    const candleHeight = 0.072; // Nến sinh nhật thanh lịch cao ~7.2cm
    const candleRadius = 0.0045; // Đường kính nến ~9mm

    candlePositions.forEach((pos, idx) => {
      const h = candleHeight * pos.scale;
      const r = candleRadius * pos.scale;

      // 1. Thân cây nến sáp tự nhiên (thon nhẹ lên trên)
      const candleGeo = new THREE.CylinderGeometry(r * 0.92, r, h, 16);
      const candleMesh = new THREE.Mesh(candleGeo, pos.mat);
      candleMesh.position.set(pos.x, candleBaseY + h / 2, pos.z);
      candleMesh.castShadow = true;
      candleMesh.receiveShadow = true;
      candleMesh.userData = {
        interactive: true,
        type: 'cake',
        hint: 'Bánh kem & Ánh nến (Nhấp để thổi nến ước nguyện 🎂)'
      };
      this.group.add(candleMesh);

      // 2. Vành sáp chảy và vũng sáp lỏng lõm trên đỉnh nến
      const poolGeo = new THREE.CylinderGeometry(r * 0.85, r * 0.85, 0.001, 16);
      const pool = new THREE.Mesh(poolGeo, meltedWaxMat);
      pool.position.set(pos.x, candleBaseY + h - 0.0005, pos.z);
      this.group.add(pool);

      const rimGeo = new THREE.TorusGeometry(r * 0.88, r * 0.18, 8, 16);
      const rim = new THREE.Mesh(rimGeo, pos.mat);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(pos.x, candleBaseY + h, pos.z);
      this.group.add(rim);

      // 3. Tim bấc nến cotton cháy uốn cong tự nhiên (Curved cotton wick)
      const wickCurve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(pos.x, candleBaseY + h, pos.z),
        new THREE.Vector3(pos.x, candleBaseY + h + 0.004, pos.z),
        new THREE.Vector3(pos.x + (idx === 1 ? -0.0015 : 0.0015), candleBaseY + h + 0.007, pos.z),
        new THREE.Vector3(pos.x + (idx === 1 ? -0.002 : 0.002), candleBaseY + h + 0.009, pos.z)
      );
      const wickGeo = new THREE.TubeGeometry(wickCurve, 8, 0.00065, 6, false);
      const wick = new THREE.Mesh(wickGeo, wickMat);
      this.group.add(wick);

      // Hạt than hồng đỏ ở đầu bấc
      const emberGeo = new THREE.SphereGeometry(0.0009, 6, 6);
      const emberMat = new THREE.MeshBasicMaterial({ color: 0xff3800 });
      const ember = new THREE.Mesh(emberGeo, emberMat);
      ember.position.set(
        pos.x + (idx === 1 ? -0.002 : 0.002),
        candleBaseY + h + 0.009,
        pos.z
      );
      this.group.add(ember);

      // 4. Ngọn lửa nến thật: tỉ lệ chuẩn thanh nhã với dải màu lam - trắng - vàng - cam
      const flameW = 0.022 * pos.scale;
      const flameH = 0.046 * pos.scale;
      const flameY = candleBaseY + h + flameH * 0.44;

      const flame = new THREE.Sprite(flameMat);
      flame.scale.set(flameW, flameH, 1);
      flame.position.set(pos.x, flameY, pos.z);
      flame.userData = {
        baseX: pos.x,
        baseY: flameY,
        baseScaleX: flameW,
        baseScaleY: flameH,
        phase: idx * 2.1
      };
      this.group.add(flame);
      this.flameSprites.push(flame);

      // 5. Quầng sáng ấm nhẹ tinh tế quanh ngọn lửa
      const glowW = 0.038 * pos.scale;
      const glow = new THREE.Sprite(subtleGlowMat);
      glow.scale.set(glowW, glowW, 1);
      glow.position.set(pos.x, flameY - 0.002, pos.z);
      glow.userData = {
        baseX: pos.x,
        baseY: flameY - 0.002,
        baseScale: glowW,
        phase: idx * 2.1
      };
      this.group.add(glow);
      this.flameSprites.push(glow);
    });

    // 6. Ánh nến vàng ấm chân thực lung linh chiếu sáng mặt bánh
    const flameLight = new THREE.PointLight(0xffaa40, 1.8, 2.5, 1.4);
    flameLight.position.set(0, candleBaseY + candleHeight + 0.02, -0.65);
    flameLight.castShadow = true;
    flameLight.shadow.bias = -0.001;
    this.group.add(flameLight);
    this.flameLights.push(flameLight);
  }

  blowOut() {
    if (this.isBlownOut) {
      this.relight();
      return;
    }

    this.isBlownOut = true;
    this.flameSprites.forEach(s => s.visible = false);
    this.flameLights.forEach(l => l.intensity = 0);

    this.triggerConfetti();

    try {
      const bdayAudio = new Audio('/audio/birthday_song.mp3');
      bdayAudio.volume = 0.8;
      bdayAudio.play().catch(() => {});
    } catch (e) {}

    if (this.onCandleBlown) {
      this.onCandleBlown();
    }
  }

  relight() {
    this.isBlownOut = false;
    this.flameSprites.forEach(s => s.visible = true);
    this.flameLights.forEach(l => l.intensity = 2.4);
  }

  triggerConfetti() {
    const count = 220;
    const defaults = { origin: { y: 0.65 } };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 30,
      startVelocity: 55,
      colors: ['#ff758c', '#d4af37', '#ffffff']
    });
    fire(0.2, {
      spread: 60,
      colors: ['#ff7eb3', '#f6d365', '#fda085']
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      colors: ['#ffeaa7', '#fab1a0', '#ff7675'],
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45
    });
  }

  update(delta) {
    this.time += delta;

    if (!this.isBlownOut && this.flameSprites.length > 0) {
      this.flameSprites.forEach((sprite) => {
        const uData = sprite.userData;
        if (!uData) return;
        const phase = uData.phase || 0;
        const microSwayX = (Math.sin(this.time * 13 + phase) * 0.0006) + (Math.sin(this.time * 26 + phase) * 0.0003);
        const pulseScale = (Math.sin(this.time * 18 + phase) * 0.05) + (Math.sin(this.time * 33 + phase) * 0.025);

        sprite.position.x = uData.baseX + microSwayX;

        if (uData.baseScaleX && uData.baseScaleY) {
          sprite.scale.set(
            uData.baseScaleX * (1 + pulseScale * 0.4),
            uData.baseScaleY * (1 + pulseScale),
            1
          );
        } else if (uData.baseScale) {
          sprite.scale.set(
            uData.baseScale * (1 + pulseScale * 0.3),
            uData.baseScale * (1 + pulseScale * 0.3),
            1
          );
        }
      });

      if (this.flameLights.length > 0) {
        this.flameLights[0].intensity = 1.8 + Math.sin(this.time * 15) * 0.2 + Math.sin(this.time * 27) * 0.1;
      }
    }
  }
}
