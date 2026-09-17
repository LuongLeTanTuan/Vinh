import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { normalizeModel } from '../utils/modelHelper.js';

/**
 * TableItems:
 * 1. Bàn tiệc kích thước vừa vặn, ấm cúng phủ khăn trải bàn rủ sóng vải mềm mại
 * 2. Khăn runner nhung đỏ mận thêu chỉ vàng sang trọng
 * 3. Bức thư tình đích thực đặt trang trọng trên bàn (không bị đĩa đè lên)
 * 4. Chai rượu vang Pháp Château D'Amour với nhãn cổ điển & cặp ly rượu vang đỏ
 * 5. Hộp quà sinh nhật thắt nơ ruy băng vàng quý phái
 * 6. Đĩa bánh Macaron Pháp ngọt ngào nhiều màu sắc
 * 7. Nến cốc thủy tinh lung linh tỏa ánh sáng vàng ấm áp
 * 8. Bộ đĩa sứ viền vàng, khăn ăn gấp hoa hồng, cánh hoa rải rác
 */
export class TableItems {
  constructor(scene, onLetterClick, loadingManager = null, quality = {}) {
    this.scene = scene;
    this.onLetterClick = onLetterClick;
    this.loadingManager = loadingManager;
    this.quality = quality;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.tableHeight = 0.78;
    this.tableRadius = 0.62; // Thu nhỏ bàn vừa vặn, ấm cúng (đường kính 1.24m)
    this.tableCenterZ = -0.65;

    this.letterMesh = null;
    this.letterGlow = null;
    this.arrowSprite = null;
    this.isIdle = false;
    this.teaLights = [];
    this.balloons = null;
    this.time = 0;

    this.createBanquetTableWithCloth();
    this.createRealisticHandwrittenLetter();
    this.createTableSettingDetails();
    this.createWineBottle();
    this.createWineGlasses();
    this.createGiftBox();
    this.createMacaronPlate();
    this.createTeaLightCandles();
    this.createLuxuryBalloonBouquets();
    this.loadTableDecorations();
    this.applyQualityHints();
  }

  applyQualityHints() {
    if (this.quality.decorShadows !== false) return;
    this.group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
      }
    });
  }

  createBanquetTableWithCloth() {
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, 0, this.tableCenterZ);

    // 1. Chân trụ bàn gỗ sồi sẫm & đế đồng thau
    const legGeo = new THREE.CylinderGeometry(0.1, 0.18, this.tableHeight - 0.05, 32);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x1f140e,
      roughness: 0.4,
      metalness: 0.3
    });
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.y = (this.tableHeight - 0.05) / 2;
    tableGroup.add(leg);

    // Đế chân bàn mạ đồng vàng
    const baseGeo = new THREE.CylinderGeometry(0.42, 0.46, 0.04, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.3,
      metalness: 0.8
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.02;
    tableGroup.add(base);

    // 2. Mặt bàn tròn phủ Khăn trải bàn gấm
    const topClothGeo = new THREE.CylinderGeometry(this.tableRadius, this.tableRadius + 0.015, 0.035, 64);

    // Texture vải dệt damask cao cấp
    const clothCanvas = document.createElement('canvas');
    clothCanvas.width = 512;
    clothCanvas.height = 512;
    const cCtx = clothCanvas.getContext('2d');
    cCtx.fillStyle = '#faf8f2';
    cCtx.fillRect(0, 0, 512, 512);

    cCtx.fillStyle = 'rgba(212, 175, 55, 0.06)';
    for (let x = 0; x < 512; x += 32) {
      for (let y = 0; y < 512; y += 32) {
        cCtx.beginPath();
        cCtx.arc(x + 16, y + 16, 7, 0, Math.PI * 2);
        cCtx.fill();
      }
    }
    const clothTex = new THREE.CanvasTexture(clothCanvas);
    clothTex.wrapS = THREE.RepeatWrapping;
    clothTex.wrapT = THREE.RepeatWrapping;
    clothTex.repeat.set(3, 3);

    const clothMat = new THREE.MeshStandardMaterial({
      map: clothTex,
      color: 0xfcfaf5,
      roughness: 0.85,
      metalness: 0.04
    });

    const topCloth = new THREE.Mesh(topClothGeo, clothMat);
    topCloth.position.y = this.tableHeight - 0.018;
    topCloth.receiveShadow = true;
    tableGroup.add(topCloth);

    // Phần vải rủ xuống uốn lượn hình sóng vải mềm mại
    const skirtHeight = 0.42;
    const skirtGeo = new THREE.CylinderGeometry(
      this.tableRadius + 0.015,
      this.tableRadius + 0.08,
      skirtHeight,
      64, 12, true
    );

    const posAttr = skirtGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      const angle = Math.atan2(z, x);
      const radius = Math.sqrt(x * x + z * z);
      const foldFactor = (1 - (y + skirtHeight / 2) / skirtHeight);

      // Tấm thảm runner nhung nặng đè phẳng nếp gấp khăn bàn ở khu vực thả thảm (|x| < 0.22 và |z| > 0.3)
      let runnerSuppress = 1.0;
      if (Math.abs(z) > 0.28 && Math.abs(x) < 0.22) {
        runnerSuppress = Math.min(1.0, Math.max(0.0, (Math.abs(x) - 0.10) / 0.12));
      }

      const wave = Math.sin(angle * 14) * 0.02 * foldFactor * runnerSuppress;
      posAttr.setX(i, (radius + wave) * Math.cos(angle));
      posAttr.setZ(i, (radius + wave) * Math.sin(angle));
    }
    skirtGeo.computeVertexNormals();

    const skirt = new THREE.Mesh(skirtGeo, clothMat);
    skirt.position.y = this.tableHeight - skirtHeight / 2 - 0.018;
    skirt.castShadow = true;
    skirt.receiveShadow = true;
    tableGroup.add(skirt);

    // Viền thêu chỉ vàng ở chân mép khăn trải bàn
    const hemGeo = new THREE.TorusGeometry(this.tableRadius + 0.08, 0.008, 16, 64);
    const hemMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.35,
      metalness: 0.8
    });
    const hem = new THREE.Mesh(hemGeo, hemMat);
    hem.rotation.x = Math.PI / 2;
    hem.position.y = this.tableHeight - skirtHeight - 0.018;
    tableGroup.add(hem);

    // 3. Khăn Runner nhung đỏ mận ôm rủ mềm mại xuống mép bàn (chuẩn trọng lực thực tế)
    this.createDrapedVelvetRunner(tableGroup);

    this.group.add(tableGroup);
  }

  /**
   * Tạo Khăn Runner nhung đỏ mận ôm rủ mềm mại theo trọng lực xuống 2 bên bàn tròn
   */
  createDrapedVelvetRunner(tableGroup) {
    const W = 0.36; // Chiều rộng khăn runner
    const R = this.tableRadius; // Bán kính bàn 0.62m
    const L_drape = 0.45; // Kéo dài rủ xuống 45cm mềm mại chạm gần sát chân váy viền vàng
    const r_b = 0.018; // Bán kính uốn cong mềm mại qua mép bàn
    const Nx = 28;
    const Nz = 140;

    const vertices = [];
    const uvs = [];
    const indices = [];

    const Y_top = this.tableHeight + 0.002;
    const skirtHeight = 0.42;

    for (let j = 0; j <= Nz; j++) {
      const v = j / Nz;
      for (let i = 0; i <= Nx; i++) {
        const u = i / Nx;
        const X = (u - 0.5) * W;
        const Z_edge = Math.sqrt(Math.max(0.01, R * R - X * X));
        const S_half = Z_edge + (Math.PI / 2) * r_b + L_drape;
        const s = (v - 0.5) * 2 * S_half;

        let y = Y_top;
        let z = s;

        // Nếp uốn vải nhung nhẹ theo chiều ngang
        const fabricFold = Math.sin(u * Math.PI * 4) * 0.0025;

        if (Math.abs(s) <= Z_edge) {
          // Nằm phẳng trên mặt bàn
          y = Y_top;
          z = s;
        } else if (s > Z_edge) {
          // Phía trước người ngồi: uốn cong qua mép bàn và rủ thẳng xuống theo trọng lực
          const d = s - Z_edge;
          if (d <= (Math.PI / 2) * r_b) {
            const theta = d / r_b;
            y = Y_top - r_b * (1 - Math.cos(theta));
            z = Z_edge + r_b * Math.sin(theta);
          } else {
            const d_down = d - (Math.PI / 2) * r_b;
            y = Y_top - r_b - d_down;
            // Khăn trải bàn xòe nhẹ ra ngoài (0.065m), runner bám theo độ xòe với khoảng cách êm ái
            const flare = 0.068 * Math.min(1.0, d_down / skirtHeight);
            z = Z_edge + r_b + 0.012 + flare + fabricFold;
          }
        } else {
          // Phía đối diện: uốn cong qua mép bàn và rủ thẳng xuống
          const d = -s - Z_edge;
          if (d <= (Math.PI / 2) * r_b) {
            const theta = d / r_b;
            y = Y_top - r_b * (1 - Math.cos(theta));
            z = -(Z_edge + r_b * Math.sin(theta));
          } else {
            const d_down = d - (Math.PI / 2) * r_b;
            y = Y_top - r_b - d_down;
            const flare = 0.068 * Math.min(1.0, d_down / skirtHeight);
            z = -(Z_edge + r_b + 0.012 + flare + fabricFold);
          }
        }

        vertices.push(X, y, z);
        uvs.push(u, v);
      }
    }

    for (let j = 0; j < Nz; j++) {
      for (let i = 0; i < Nx; i++) {
        const a = j * (Nx + 1) + i;
        const b = j * (Nx + 1) + (i + 1);
        const c = (j + 1) * (Nx + 1) + i;
        const d = (j + 1) * (Nx + 1) + (i + 1);
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }

    const runnerGeo = new THREE.BufferGeometry();
    runnerGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    runnerGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    runnerGeo.setIndex(indices);
    runnerGeo.computeVertexNormals();

    // Vẽ texture nhung đỏ mận thêu chỉ vàng 2 mép và viền tua rua vàng ở 2 đầu rủ
    const rCanvas = document.createElement('canvas');
    rCanvas.width = 512;
    rCanvas.height = 1024;
    const rCtx = rCanvas.getContext('2d');

    // Nền vải nhung đỏ mận quý phái
    const grad = rCtx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#380812');
    grad.addColorStop(0.15, '#6a1224');
    grad.addColorStop(0.5, '#7e162c');
    grad.addColorStop(0.85, '#6a1224');
    grad.addColorStop(1, '#380812');
    rCtx.fillStyle = grad;
    rCtx.fillRect(0, 0, 512, 1024);

    // Hoa văn gấm chìm sang trọng
    rCtx.fillStyle = 'rgba(212, 175, 55, 0.06)';
    for (let y = 50; y < 974; y += 36) {
      for (let x = 36; x < 476; x += 36) {
        rCtx.beginPath();
        rCtx.arc(x + 18, y + 18, 7, 0, Math.PI * 2);
        rCtx.fill();
      }
    }

    // Viền thêu chỉ vàng dọc 2 bên mép runner
    rCtx.fillStyle = '#d4af37';
    rCtx.fillRect(10, 0, 14, 1024);
    rCtx.fillRect(488, 0, 14, 1024);
    rCtx.fillStyle = '#f8e086';
    rCtx.fillRect(15, 0, 4, 1024);
    rCtx.fillRect(493, 0, 4, 1024);

    // 2 Đầu rủ xuống thêu dải viền vàng & tua rua hoàng gia
    [0, 966].forEach(endY => {
      // Dải vàng thêu ngang
      rCtx.fillStyle = '#d4af37';
      rCtx.fillRect(10, endY + (endY === 0 ? 34 : 0), 492, 18);
      rCtx.fillStyle = '#f8e086';
      rCtx.fillRect(10, endY + (endY === 0 ? 40 : 6), 492, 5);

      // Tua rua rủ xuống ở mép cùng
      rCtx.fillStyle = '#c59d2f';
      const fringeY = endY === 0 ? 0 : 988;
      for (let fx = 12; fx < 500; fx += 8) {
        rCtx.fillRect(fx, fringeY, 4, 36);
      }
    });

    const runnerTex = new THREE.CanvasTexture(rCanvas);
    runnerTex.wrapS = THREE.ClampToEdgeWrapping;
    runnerTex.wrapT = THREE.ClampToEdgeWrapping;

    const runnerMat = new THREE.MeshStandardMaterial({
      map: runnerTex,
      roughness: 0.72,
      metalness: 0.15,
      side: THREE.DoubleSide
    });

    const runnerMesh = new THREE.Mesh(runnerGeo, runnerMat);
    runnerMesh.receiveShadow = true;
    runnerMesh.castShadow = true;
    tableGroup.add(runnerMesh);
  }

  /**
   * Bức Thư Tình Viết Tay Lãng Mạn (Thiệp nhung đỏ rượu vang viền vàng, đặt trang trọng trên bàn tiệc)
   */
  createRealisticHandwrittenLetter() {
    const letterGroup = new THREE.Group();
    // Đặt trang trọng trên bàn tiệc nghiêng về phía người nhìn
    letterGroup.position.set(-0.18, this.tableHeight + 0.003, -0.36);
    letterGroup.rotation.y = 0.14;

    // 1. Chân đế mini mạ đồng vàng thanh lịch đỡ thiệp bên dưới
    const easelMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.88,
      roughness: 0.22
    });
    const standBase = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.006, 0.03), easelMat);
    standBase.position.set(0, 0.003, 0);
    letterGroup.add(standBase);

    // 2. Cụm thiệp sinh nhật đặt nghiêng 28 độ về phía người nhìn (Card Group)
    const cardGroup = new THREE.Group();
    cardGroup.position.set(0, 0.005, 0);
    cardGroup.rotation.x = -0.48; // Nghiêng ngửa ~28 độ thanh thoát, hướng thẳng vào mắt người xem

    // Kích thước chuẩn thiệp chúc mừng sinh nhật
    const cardWidth = 0.23;
    const cardHeight = 0.155;
    const cardThick = 0.004;

    // Bìa thiệp nhung đỏ mận quý phái (Burgundy Velvet Backing)
    const envelopeMat = new THREE.MeshStandardMaterial({
      color: 0x781226, // Đỏ nhung rượu vang sang trọng
      roughness: 0.55,
      metalness: 0.15
    });
    // BoxGeometry trong mặt phẳng XY: width (X), height (Y), depth (Z)
    const envelope = new THREE.Mesh(new THREE.BoxGeometry(cardWidth, cardHeight, cardThick), envelopeMat);
    envelope.position.set(0, cardHeight / 2, 0);
    envelope.castShadow = true;
    cardGroup.add(envelope);

    // Viền vàng kim tinh tế bao quanh mép bìa thiệp
    const goldTrim = new THREE.Mesh(new THREE.BoxGeometry(cardWidth + 0.004, cardHeight + 0.004, cardThick * 0.7), easelMat);
    goldTrim.position.set(0, cardHeight / 2, -0.0006);
    cardGroup.add(goldTrim);

    // 3. Tờ giấy thư sinh nhật viết tay (Parchment Birthday Letter)
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');

    // Nền giấy da cổ sáng kem viền hoa văn hoàng gia
    const bgGrad = ctx.createRadialGradient(512, 384, 150, 512, 384, 550);
    bgGrad.addColorStop(0, '#fffdf7');
    bgGrad.addColorStop(0.75, '#fbf3e2');
    bgGrad.addColorStop(1, '#f2e4c8');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 768);

    // Khung hoa văn viền vàng đôi
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 6;
    ctx.strokeRect(28, 28, 968, 712);
    ctx.strokeStyle = '#8a1c32';
    ctx.lineWidth = 2;
    ctx.strokeRect(38, 38, 948, 692);

    // Tiêu đề nổi bật
    ctx.fillStyle = '#8a1c32';
    ctx.font = 'bold 36px "Cinzel", "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('✉️  THƯ CHÚC MỪNG SINH NHẬT  ✉️', 512, 95);
    ctx.font = 'italic 24px "Montserrat", sans-serif';
    ctx.fillStyle = '#aa7722';
    ctx.fillText('❖  28 / 09  ❖', 512, 135);

    // Nội dung mở đầu
    ctx.textAlign = 'left';
    ctx.fillStyle = '#8a1c32';
    ctx.font = 'italic bold 44px "Dancing Script", "Playfair Display", Georgia, serif';
    ctx.fillText('Kiều à,', 75, 205);

    ctx.font = 'italic 28px "Playfair Display", Georgia, serif';
    ctx.fillStyle = '#3a2014';
    const lines = [
      'Hôm nay là sinh nhật bà, tui muốn viết cho bà vài điều mà bình thường',
      'có lẽ tui không biết phải nói như thế nào.',
      '',
      'Chúc bà tuổi mới thật nhiều bình an, vui vẻ và gặp thật nhiều điều tốt đẹp.',
      'Mong chặng đường phía trước thật rộng mở, và quan trọng nhất là bà luôn',
      'sống một cuộc đời mà chính bà cảm thấy vui và tự hào.'
    ];

    let startY = 265;
    lines.forEach(line => {
      ctx.fillText(line, 75, startY);
      startY += 46;
    });

    // Chữ ký tay cuối thư
    ctx.font = 'italic bold 44px "Dancing Script", Georgia, serif';
    ctx.fillStyle = '#8a1c32';
    ctx.fillText('Vinh ✨', 780, 650);

    const letterTex = new THREE.CanvasTexture(canvas);
    letterTex.colorSpace = THREE.SRGBColorSpace;
    const letterGeo = new THREE.PlaneGeometry(cardWidth - 0.014, cardHeight - 0.014);
    const letterMat = new THREE.MeshStandardMaterial({
      map: letterTex,
      roughness: 0.45,
      metalness: 0.05
    });
    const letterMesh = new THREE.Mesh(letterGeo, letterMat);
    // Đặt phẳng ngay trên mặt trước của bìa thiệp (cùng hướng XY)
    letterMesh.position.set(0, cardHeight / 2, cardThick / 2 + 0.001);
    cardGroup.add(letterMesh);

    // 4. Con dấu sáp đỏ niêm phong sang trọng ở góc dưới bên phải
    const sealGeo = new THREE.CylinderGeometry(0.015, 0.016, 0.004, 24);
    const sealMat = new THREE.MeshStandardMaterial({
      color: 0x9e1a2a,
      roughness: 0.25,
      metalness: 0.25
    });
    const waxSeal = new THREE.Mesh(sealGeo, sealMat);
    waxSeal.rotation.x = Math.PI / 2; // Mặt tròn con dấu quay ra phía trước (+Z)
    waxSeal.position.set(cardWidth / 2 - 0.03, 0.03, cardThick / 2 + 0.0035);
    cardGroup.add(waxSeal);

    letterGroup.add(cardGroup);

    // 5. Mũi tên chỉ chỉ nhắc nhở tương tác nhỏ gọn, tinh tế (Minimal Pointing Arrow)
    this.arrowSprite = this.createPointingArrow();
    letterGroup.add(this.arrowSprite);

    // 6. Hộp va chạm tương tác vô hình rộng rãi (Generous Hit-box)
    const hitBoxGeo = new THREE.BoxGeometry(0.34, 0.26, 0.18);
    const hitBoxMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
    hitBox.position.set(0, 0.09, 0);
    hitBox.userData = {
      interactive: true,
      type: 'letter'
    };
    letterGroup.add(hitBox);

    // Đánh dấu tương tác cho toàn bộ các phần tử lá thư
    letterMesh.userData = hitBox.userData;
    envelope.userData = hitBox.userData;
    waxSeal.userData = hitBox.userData;
    this.arrowSprite.userData = hitBox.userData;

    // 7. Vầng hào quang ấm áp bao quanh thư
    const auraCanvas = document.createElement('canvas');
    auraCanvas.width = 256;
    auraCanvas.height = 256;
    const aCtx = auraCanvas.getContext('2d');
    const aGrad = aCtx.createRadialGradient(128, 128, 20, 128, 128, 120);
    aGrad.addColorStop(0, 'rgba(255, 190, 80, 0.45)');
    aGrad.addColorStop(0.5, 'rgba(212, 175, 55, 0.18)');
    aGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    aCtx.fillStyle = aGrad;
    aCtx.fillRect(0, 0, 256, 256);

    const auraTex = new THREE.CanvasTexture(auraCanvas);
    const auraMat = new THREE.MeshBasicMaterial({
      map: auraTex,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const aura = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.28), auraMat);
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.002;
    letterGroup.add(aura);
    this.letterGlow = aura;

    this.group.add(letterGroup);
    this.letterMesh = letterMesh;
  }

  /**
   * Bộ đồ ăn dao nĩa, khăn ăn hoa hồng (đặt gọn gàng bên phải, không che thư)
   */
  createTableSettingDetails() {
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.85
    });

    const silverMat = new THREE.MeshStandardMaterial({
      color: 0xe8e8ea,
      roughness: 0.15,
      metalness: 0.95
    });

    const porcelainMat = new THREE.MeshStandardMaterial({
      color: 0xfcfaf5,
      roughness: 0.55,
      metalness: 0.05
    });

    // ===== Bộ đĩa người ngồi (bên phải thư) =====
    const pX = 0.14;
    const pZ = -0.34;

    const plateGeo = new THREE.CylinderGeometry(0.12, 0.11, 0.01, 32);
    const plate = new THREE.Mesh(plateGeo, porcelainMat);
    plate.position.set(pX, this.tableHeight + 0.005, pZ);
    plate.receiveShadow = true;
    this.group.add(plate);

    const plateRimGeo = new THREE.TorusGeometry(0.115, 0.0035, 8, 32);
    const plateRim = new THREE.Mesh(plateRimGeo, goldMat);
    plateRim.rotation.x = Math.PI / 2;
    plateRim.position.set(pX, this.tableHeight + 0.012, pZ);
    this.group.add(plateRim);

    // Đĩa tráng miệng nhỏ
    const smallPlateGeo = new THREE.CylinderGeometry(0.08, 0.075, 0.008, 32);
    const smallPlate = new THREE.Mesh(smallPlateGeo, porcelainMat);
    smallPlate.position.set(pX, this.tableHeight + 0.015, pZ);
    this.group.add(smallPlate);

    // Khăn ăn cuộn tròn nhung đỏ mận thắt vòng vàng sang trọng
    this.createLuxuryNapkin(pX, this.tableHeight + 0.02, pZ);

    // Nĩa vàng bên trái đĩa
    const forkGroup = new THREE.Group();
    forkGroup.position.set(pX - 0.135, this.tableHeight + 0.003, pZ);
    const forkHandle = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.0025, 0.11), goldMat);
    forkHandle.position.z = 0.015;
    forkGroup.add(forkHandle);
    const forkTines = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.0018, 0.035), goldMat);
    forkTines.position.z = -0.052;
    forkGroup.add(forkTines);
    this.group.add(forkGroup);

    // Dao bạc bên phải đĩa
    const knifeGroup = new THREE.Group();
    knifeGroup.position.set(pX + 0.135, this.tableHeight + 0.003, pZ);
    const knifeHandle = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.003, 0.08), silverMat);
    knifeHandle.position.z = 0.03;
    knifeGroup.add(knifeHandle);
    const knifeBlade = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.006, 0.07), silverMat);
    knifeBlade.position.z = -0.04;
    knifeGroup.add(knifeBlade);
    this.group.add(knifeGroup);

    // ===== Bộ đĩa người đối diện (phía bên kia bàn) =====
    const opX = -0.14;
    const opZ = -0.96;

    const plateOpp = new THREE.Mesh(plateGeo, porcelainMat);
    plateOpp.position.set(opX, this.tableHeight + 0.005, opZ);
    this.group.add(plateOpp);

    const plateRimOpp = new THREE.Mesh(plateRimGeo, goldMat);
    plateRimOpp.rotation.x = Math.PI / 2;
    plateRimOpp.position.set(opX, this.tableHeight + 0.012, opZ);
    this.group.add(plateRimOpp);

    this.createLuxuryNapkin(opX, this.tableHeight + 0.02, opZ);
    this.createPlaceCard(opX, this.tableHeight + 0.03, opZ + 0.06, 'Kiều ✨');

    // Cánh hoa hồng rải trên bàn
    this.createScatteredPetals();
  }

  createLuxuryNapkin(x, y, z) {
    const napkinGroup = new THREE.Group();
    napkinGroup.position.set(x, y, z);

    const napkinMat = new THREE.MeshStandardMaterial({
      color: 0x7a1224, // Vải lanh đỏ nhung mềm mại
      roughness: 0.65,
      metalness: 0.1
    });

    // Cuộn khăn ăn tròn mềm mại phong cách fine dining
    const rollGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.09, 24);
    const roll = new THREE.Mesh(rollGeo, napkinMat);
    roll.rotation.z = Math.PI / 2;
    roll.rotation.y = 0.22;
    roll.position.y = 0.014;
    roll.castShadow = true;
    napkinGroup.add(roll);

    // Vòng khuyên kẹp khăn ăn mạ vàng sáng bóng (Gold Napkin Ring)
    const ringGeo = new THREE.TorusGeometry(0.016, 0.003, 16, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.2,
      metalness: 0.9
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.y = Math.PI / 2 + 0.22;
    ring.position.y = 0.014;
    napkinGroup.add(ring);

    this.group.add(napkinGroup);
  }

  createPlaceCard(x, y, z, text) {
    const cardCanvas = document.createElement('canvas');
    cardCanvas.width = 256;
    cardCanvas.height = 128;
    const ctx = cardCanvas.getContext('2d');
    ctx.fillStyle = '#fdf6e7';
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, 244, 116);
    ctx.fillStyle = '#4a2c1d';
    ctx.font = 'italic bold 28px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 128, 72);

    const cardTex = new THREE.CanvasTexture(cardCanvas);
    const cardGeo = new THREE.PlaneGeometry(0.07, 0.035);
    const cardMat = new THREE.MeshStandardMaterial({ map: cardTex, roughness: 0.7, side: THREE.DoubleSide });
    const card = new THREE.Mesh(cardGeo, cardMat);
    card.position.set(x, y, z);
    card.rotation.x = -Math.PI / 4;
    this.group.add(card);
  }

  createScatteredPetals() {
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xcc2954,
      roughness: 0.75,
      metalness: 0.05,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92
    });

    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.12 + Math.random() * (this.tableRadius - 0.16);
      const petalGeo = new THREE.PlaneGeometry(0.018 + Math.random() * 0.01, 0.022 + Math.random() * 0.01);
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(
        r * Math.cos(angle),
        this.tableHeight + 0.003 + Math.random() * 0.002,
        this.tableCenterZ + r * Math.sin(angle)
      );
      petal.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.2;
      petal.rotation.z = Math.random() * Math.PI * 2;
      this.group.add(petal);
    }
  }

  /**
   * Chai Rượu Vang Pháp Cao Cấp (Château D'Amour)
   */
  createWineBottle() {
    const bottleGroup = new THREE.Group();
    bottleGroup.position.set(0.3, this.tableHeight, -0.62);

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0a1c12, // Thủy tinh xanh rêu sẫm truyền thống
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.92
    });

    const goldFoilMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.85
    });

    // Thân chai
    const bodyGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.18, 32);
    const body = new THREE.Mesh(bodyGeo, glassMat);
    body.position.y = 0.09;
    body.castShadow = true;
    bottleGroup.add(body);

    // Vai chai uốn cong
    const shoulderGeo = new THREE.CylinderGeometry(0.014, 0.038, 0.05, 32);
    const shoulder = new THREE.Mesh(shoulderGeo, glassMat);
    shoulder.position.y = 0.205;
    bottleGroup.add(shoulder);

    // Cổ chai
    const neckGeo = new THREE.CylinderGeometry(0.013, 0.014, 0.07, 32);
    const neck = new THREE.Mesh(neckGeo, glassMat);
    neck.position.y = 0.265;
    bottleGroup.add(neck);

    // Nắp bọc giấy vàng hoàng gia (Foil capsule)
    const capGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.04, 32);
    const cap = new THREE.Mesh(capGeo, goldFoilMat);
    cap.position.y = 0.285;
    bottleGroup.add(cap);

    // Nhãn chai rượu vang Château d'Amour
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 256;
    labelCanvas.height = 256;
    const lCtx = labelCanvas.getContext('2d');
    lCtx.fillStyle = '#f8f4ea';
    lCtx.fillRect(0, 0, 256, 256);
    lCtx.strokeStyle = '#d4af37';
    lCtx.lineWidth = 4;
    lCtx.strokeRect(8, 8, 240, 240);
    lCtx.fillStyle = '#8a1c32';
    lCtx.font = 'bold 22px Georgia, serif';
    lCtx.textAlign = 'center';
    lCtx.fillText("CHÂTEAU D'AMOUR", 128, 60);
    lCtx.font = 'italic 16px Georgia, serif';
    lCtx.fillStyle = '#333333';
    lCtx.fillText("Grand Vin de Bordeaux", 128, 95);
    lCtx.fillText("Vintage 2020", 128, 125);
    lCtx.font = '28px Arial';
    lCtx.fillStyle = '#d4af37';
    lCtx.fillText("🍷", 128, 175);
    lCtx.font = '13px Georgia';
    lCtx.fillStyle = '#8a1c32';
    lCtx.fillText("✨ Special Birthday Edition ✨", 128, 215);

    const labelTex = new THREE.CanvasTexture(labelCanvas);
    const labelGeo = new THREE.CylinderGeometry(0.0385, 0.0385, 0.1, 32, 1, true, 0, Math.PI);
    const labelMat = new THREE.MeshStandardMaterial({
      map: labelTex,
      roughness: 0.6,
      side: THREE.DoubleSide
    });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.rotation.y = Math.PI * 0.75;
    label.position.y = 0.09;
    bottleGroup.add(label);

    this.group.add(bottleGroup);
  }

  /**
   * Cặp Ly Rượu Vang Pha Lê Chứa Vang Đỏ Ruby (Tinh xảo, không bị lỗi xuyên thấu hay vệt trắng)
   */
  createWineGlasses() {
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xf2f6fc,
      transmission: 0.92,
      opacity: 0.35,
      transparent: true,
      roughness: 0.05,
      ior: 1.48,
      reflectivity: 0.7,
      depthWrite: false
    });

    const wineMat = new THREE.MeshStandardMaterial({
      color: 0x8a0d22, // Đỏ ruby Bordeaux sâu lắng
      roughness: 0.15,
      metalness: 0.08,
      transparent: true,
      opacity: 0.94
    });

    const rimGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.85
    });

    const makeGlass = (x, z) => {
      const gGroup = new THREE.Group();
      gGroup.position.set(x, this.tableHeight, z);

      // Chân đế ly pha lê mỏng nhẹ
      const baseGeo = new THREE.CylinderGeometry(0.024, 0.026, 0.0018, 24);
      const base = new THREE.Mesh(baseGeo, glassMat);
      base.position.y = 0.0009;
      base.renderOrder = 2;
      gGroup.add(base);

      // Cuống ly thanh mảnh
      const stemGeo = new THREE.CylinderGeometry(0.0016, 0.0018, 0.07, 16);
      const stem = new THREE.Mesh(stemGeo, glassMat);
      stem.position.y = 0.036;
      stem.renderOrder = 2;
      gGroup.add(stem);

      // Rượu vang đỏ bên trong ly (vẽ trước để không bị lỗi depth-sort)
      const wineGeo = new THREE.CylinderGeometry(0.02, 0.012, 0.028, 24);
      const wine = new THREE.Mesh(wineGeo, wineMat);
      wine.position.y = 0.086;
      wine.renderOrder = 1;
      gGroup.add(wine);

      // Bầu ly tulip pha lê
      const bowlGeo = new THREE.CylinderGeometry(0.023, 0.012, 0.058, 24, 1, true);
      const bowl = new THREE.Mesh(bowlGeo, glassMat);
      bowl.position.y = 0.098;
      bowl.renderOrder = 2;
      gGroup.add(bowl);

      // Đáy bầu ly cong nhẹ
      const bowlBottomGeo = new THREE.SphereGeometry(0.013, 16, 12, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5);
      const bowlBottom = new THREE.Mesh(bowlBottomGeo, glassMat);
      bowlBottom.position.y = 0.071;
      bowlBottom.renderOrder = 2;
      gGroup.add(bowlBottom);

      // Viền vàng mảnh trên miệng ly
      const lipGeo = new THREE.TorusGeometry(0.023, 0.0008, 8, 24);
      const lip = new THREE.Mesh(lipGeo, rimGoldMat);
      lip.rotation.x = Math.PI / 2;
      lip.position.y = 0.127;
      gGroup.add(lip);

      this.group.add(gGroup);
    };

    // Ly của người ngồi (bên phải người ngồi)
    makeGlass(0.3, -0.36);

    // Ly của người đối diện
    makeGlass(-0.3, -0.92);
  }

  /**
   * Hộp Quà Sinh Nhật Sang Trọng Thắt Nơ Vàng
   */
  createGiftBox() {
    const boxGroup = new THREE.Group();
    boxGroup.position.set(-0.36, this.tableHeight, -0.5);
    boxGroup.rotation.y = 0.35;

    const boxSize = 0.13;
    const boxGeo = new THREE.BoxGeometry(boxSize, boxSize * 0.9, boxSize);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x9b1b30, // Đỏ nhung quý phái
      roughness: 0.35,
      metalness: 0.15
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.y = (boxSize * 0.9) / 2;
    box.castShadow = true;
    box.receiveShadow = true;
    boxGroup.add(box);

    // Nắp hộp quà
    const lidGeo = new THREE.BoxGeometry(boxSize + 0.008, 0.025, boxSize + 0.008);
    const lid = new THREE.Mesh(lidGeo, boxMat);
    lid.position.y = boxSize * 0.9 + 0.0125;
    boxGroup.add(lid);

    // Dải ruy băng mạ vàng quấn chữ thập
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.85
    });

    const rib1Geo = new THREE.BoxGeometry(0.02, boxSize * 0.9 + 0.03, boxSize + 0.01);
    const rib1 = new THREE.Mesh(rib1Geo, ribbonMat);
    rib1.position.y = (boxSize * 0.9) / 2 + 0.01;
    boxGroup.add(rib1);

    const rib2Geo = new THREE.BoxGeometry(boxSize + 0.01, boxSize * 0.9 + 0.03, 0.02);
    const rib2 = new THREE.Mesh(rib2Geo, ribbonMat);
    rib2.position.y = (boxSize * 0.9) / 2 + 0.01;
    boxGroup.add(rib2);

    // Nơ ruy băng uốn lượn trên đỉnh hộp
    const bowGeo1 = new THREE.TorusGeometry(0.02, 0.006, 12, 24);
    const bow1 = new THREE.Mesh(bowGeo1, ribbonMat);
    bow1.rotation.y = Math.PI / 4;
    bow1.position.set(-0.012, boxSize * 0.9 + 0.035, 0);
    boxGroup.add(bow1);

    const bow2 = new THREE.Mesh(bowGeo1, ribbonMat);
    bow2.rotation.y = -Math.PI / 4;
    bow2.position.set(0.012, boxSize * 0.9 + 0.035, 0);
    boxGroup.add(bow2);

    this.group.add(boxGroup);
  }

  /**
   * Đĩa Bánh Macaron Pháp Ngọt Ngào
   */
  createMacaronPlate() {
    const macaronGroup = new THREE.Group();
    macaronGroup.position.set(0.24, this.tableHeight, -0.8);

    // Đĩa sứ chân cao mạ vàng
    const standGeo = new THREE.CylinderGeometry(0.07, 0.05, 0.012, 32);
    const standMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.85
    });
    const stand = new THREE.Mesh(standGeo, standMat);
    stand.position.y = 0.006;
    macaronGroup.add(stand);

    // Các chiếc bánh Macaron nhiều màu
    const macaronColors = [0xff758c, 0xf6d365, 0xa8e6cf, 0xdcedc1, 0xb388ff];
    const positions = [
      { x: 0, z: 0 },
      { x: 0.032, z: 0.02 },
      { x: -0.032, z: 0.02 },
      { x: 0.02, z: -0.03 },
      { x: -0.02, z: -0.03 }
    ];

    positions.forEach((pos, idx) => {
      const col = macaronColors[idx % macaronColors.length];
      const mMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.45 });

      // Nắp trên
      const topGeo = new THREE.CylinderGeometry(0.014, 0.015, 0.007, 16);
      const topM = new THREE.Mesh(topGeo, mMat);
      topM.position.set(pos.x, 0.022, pos.z);
      macaronGroup.add(topM);

      // Kem ở giữa
      const creamGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.004, 16);
      const creamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
      const cream = new THREE.Mesh(creamGeo, creamMat);
      cream.position.set(pos.x, 0.018, pos.z);
      macaronGroup.add(cream);

      // Nắp dưới
      const bottomM = topM.clone();
      bottomM.position.set(pos.x, 0.014, pos.z);
      macaronGroup.add(bottomM);
    });

    this.group.add(macaronGroup);
  }

  /**
   * Nến Cốc Thủy Tinh Ấm Áp (Thay thế hoàn toàn chiếc đèn có chữ glTF xấu)
   */
  createTeaLightCandles() {
    const makeVotive = (x, z) => {
      const votiveGroup = new THREE.Group();
      votiveGroup.position.set(x, this.tableHeight, z);

      // Cốc thủy tinh mờ
      const cupGeo = new THREE.CylinderGeometry(0.025, 0.022, 0.05, 24);
      const cupMat = new THREE.MeshPhysicalMaterial({
        color: 0xfff2d4,
        transparent: true,
        opacity: 0.55,
        roughness: 0.25,
        transmission: 0.7
      });
      const cup = new THREE.Mesh(cupGeo, cupMat);
      cup.position.y = 0.025;
      votiveGroup.add(cup);

      // Sáp nến trắng bên trong
      const waxGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.025, 16);
      const waxMat = new THREE.MeshStandardMaterial({ color: 0xfffaed, roughness: 0.3 });
      const wax = new THREE.Mesh(waxGeo, waxMat);
      wax.position.y = 0.015;
      votiveGroup.add(wax);

      // Ngọn lửa nến nhỏ
      const flameCanvas = document.createElement('canvas');
      flameCanvas.width = 32;
      flameCanvas.height = 32;
      const ctx = flameCanvas.getContext('2d');
      const grad = ctx.createRadialGradient(16, 20, 2, 16, 20, 14);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#ffcc44');
      grad.addColorStop(0.7, '#ff5500');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);

      const flameTex = new THREE.CanvasTexture(flameCanvas);
      const flameMat = new THREE.SpriteMaterial({
        map: flameTex,
        transparent: true,
        blending: THREE.AdditiveBlending
      });
      const flame = new THREE.Sprite(flameMat);
      flame.scale.set(0.04, 0.065, 1);
      flame.position.set(0, 0.045, 0);
      votiveGroup.add(flame);

      // Đèn vàng ấm tỏa sáng nhẹ nhàng
      const light = new THREE.PointLight(0xffb044, 1.2, 1.8);
      light.position.set(0, 0.05, 0);
      votiveGroup.add(light);

      this.teaLights.push({ flame, light, baseScale: 0.04 });
      this.group.add(votiveGroup);
    };

    // 2 Nến cốc thủy tinh đặt cân đối 2 bên
    makeVotive(-0.35, -0.72);
    makeVotive(0.34, -0.46);
  }

  loadTableDecorations() {
    const loader = new GLTFLoader(this.loadingManager);

    // 1. Ghế nhung sang trọng đối diện bàn tiệc
    loader.load('/models/chair.glb', (gltf) => {
      const rawChair = gltf.scene;
      rawChair.traverse((c) => {
        if (c.isMesh) {
          c.castShadow = this.quality.modelShadows !== false;
          c.receiveShadow = true;
        }
      });
      const chairWrapper = normalizeModel(rawChair, 0.82, true);
      chairWrapper.position.set(0, 0, -1.35); // Điều chỉnh vừa vặn với bàn nhỏ
      this.group.add(chairWrapper);
    }, undefined, (err) => console.warn('Lỗi tải chair:', err));

    // 2. Bình hoa hồng pha lê lãng mạn trên bàn tiệc (thay thế flowers.glb bị lỗi kính tàng hình & cành hoa lơ lửng)
    this.createRomanticFlowerVase(-0.18, -0.86);
  }

  /**
   * Bình Hoa Hồng Pha Lê Sang Trọng (Khắc phục triệt để lỗi model hoa 3D)
   */
  createRomanticFlowerVase(x, z) {
    const vaseGroup = new THREE.Group();
    vaseGroup.position.set(x, this.tableHeight, z);

    // 1. Đế bình hoa pha lê nặng viền vàng
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.85
    });
    const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.008, 24), baseMat);
    baseMesh.position.y = 0.004;
    vaseGroup.add(baseMesh);

    // 2. Thân bình hoa pha lê trong suốt
    const vaseGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xf5f8fc,
      transmission: 0.9,
      opacity: 0.45,
      transparent: true,
      roughness: 0.06,
      ior: 1.5,
      depthWrite: false
    });
    const vaseBodyGeo = new THREE.CylinderGeometry(0.03, 0.036, 0.11, 24, 1, true);
    const vaseBody = new THREE.Mesh(vaseBodyGeo, vaseGlassMat);
    vaseBody.position.y = 0.062;
    vaseBody.renderOrder = 3;
    vaseGroup.add(vaseBody);

    // Miệng bình loe nhẹ viền vàng
    const neckRim = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.002, 12, 24), baseMat);
    neckRim.rotation.x = Math.PI / 2;
    neckRim.position.y = 0.118;
    vaseGroup.add(neckRim);

    // Nước trong bình
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x90caf9,
      transparent: true,
      opacity: 0.5,
      roughness: 0.1
    });
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.033, 0.065, 24), waterMat);
    water.position.y = 0.042;
    water.renderOrder = 2;
    vaseGroup.add(water);

    // 3. Cành hoa và lá xanh
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x2e5a27, roughness: 0.6 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x1f4a1f, roughness: 0.5, side: THREE.DoubleSide });

    // 4. Các đóa hoa hồng nhung đỏ và hồng pastel nở rộ
    const roseColors = [0x991b2e, 0xd43f58, 0xf48fb1, 0x801020, 0xe85d75];
    const roseLayouts = [
      { rx: 0, rz: 0, ry: 0.165, s: 1.05, col: roseColors[0] },       // Hoa hồng đỏ trung tâm
      { rx: -0.022, rz: 0.014, ry: 0.15, s: 0.9, col: roseColors[1] },  // Đóa hoa hồng đào trái
      { rx: 0.023, rz: -0.012, ry: 0.152, s: 0.92, col: roseColors[2] },// Đóa hồng phấn phải
      { rx: 0.012, rz: 0.022, ry: 0.14, s: 0.85, col: roseColors[3] },  // Đóa hồng nhung trước
      { rx: -0.015, rz: -0.02, ry: 0.145, s: 0.88, col: roseColors[4] } // Đóa hồng thắm sau
    ];

    roseLayouts.forEach((r, idx) => {
      // Cành hoa cắm vào bình
      const stemCurve = new THREE.LineCurve3(
        new THREE.Vector3(r.rx * 0.3, 0.02, r.rz * 0.3),
        new THREE.Vector3(r.rx, r.ry - 0.015, r.rz)
      );
      const stemGeo = new THREE.TubeGeometry(stemCurve, 8, 0.002, 6, false);
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.renderOrder = 1;
      vaseGroup.add(stem);

      // Bông hoa hồng: lớp đài hoa và nhiều tầng cánh hoa xếp vòng
      const rMat = new THREE.MeshStandardMaterial({
        color: r.col,
        roughness: 0.45,
        metalness: 0.08
      });

      const budGroup = new THREE.Group();
      budGroup.position.set(r.rx, r.ry, r.rz);
      budGroup.scale.set(r.s, r.s, r.s);

      // Tâm búp hoa
      const centerBud = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 12), rMat);
      centerBud.scale.set(1, 1.2, 1);
      budGroup.add(centerBud);

      // Các cánh hoa nở tròn
      for (let p = 0; p < 8; p++) {
        const pAngle = (p / 8) * Math.PI * 2 + idx;
        const petalGeo = new THREE.SphereGeometry(0.01, 8, 8, 0, Math.PI, 0, Math.PI * 0.7);
        const petal = new THREE.Mesh(petalGeo, rMat);
        petal.position.set(Math.cos(pAngle) * 0.008, -0.002, Math.sin(pAngle) * 0.008);
        petal.rotation.x = Math.PI * 0.6;
        petal.rotation.y = pAngle;
        budGroup.add(petal);
      }

      // Đài hoa xanh nâng đỡ
      const sepalMat = new THREE.MeshStandardMaterial({ color: 0x245520, roughness: 0.5 });
      const sepal = new THREE.Mesh(new THREE.ConeGeometry(0.009, 0.014, 6), sepalMat);
      sepal.rotation.x = Math.PI;
      sepal.position.y = -0.01;
      budGroup.add(sepal);

      vaseGroup.add(budGroup);
    });

    // 5. Các lá hoa hồng xòe nhẹ điểm xuyết
    const leafAngles = [0.4, 1.8, 3.2, 4.7];
    leafAngles.forEach((ang) => {
      const leafGeo = new THREE.PlaneGeometry(0.028, 0.016);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(Math.cos(ang) * 0.035, 0.115, Math.sin(ang) * 0.035);
      leaf.rotation.x = -Math.PI / 4;
      leaf.rotation.y = ang;
      leaf.rotation.z = Math.PI / 6;
      vaseGroup.add(leaf);
    });

    this.group.add(vaseGroup);
  }

  /**
   * Chùm bóng bay dạ tiệc sang trọng đa sắc thái & bóng bay trần lơ lửng
   */
  createLuxuryBalloonBouquets() {
    this.balloonMeshes = [];

    // Bảng màu bóng bay tiệc sinh nhật cao cấp: Rose Gold, Champagne Gold, Pearl White, Ruby Velvet, Blush Pink
    const balloonMaterials = [
      new THREE.MeshStandardMaterial({ color: 0xdf988d, roughness: 0.16, metalness: 0.68 }), // Rose gold
      new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.78 }),  // Champagne gold
      new THREE.MeshStandardMaterial({ color: 0xf6f4f0, roughness: 0.12, metalness: 0.35 }), // Pearl white
      new THREE.MeshStandardMaterial({ color: 0x8e182e, roughness: 0.22, metalness: 0.58 }), // Ruby velvet
      new THREE.MeshStandardMaterial({ color: 0xf8bbd0, roughness: 0.18, metalness: 0.45 })  // Pastel blush pink
    ];

    const stringMat = new THREE.LineBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.65 });

    const createBalloon = (bx, by, bz, scale = 1.0, matIdx = 0) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(bx, by, bz);

      // Thân bóng bay hình quả lê / giọt nước căng mọng
      const bGeo = new THREE.SphereGeometry(0.18 * scale, 24, 24);
      bGeo.scale(1.0, 1.25, 1.0);
      const bMat = balloonMaterials[matIdx % balloonMaterials.length];
      const bMesh = new THREE.Mesh(bGeo, bMat);
      bMesh.castShadow = this.quality.decorShadows !== false;
      bGroup.add(bMesh);

      // Nút thắt bóng bay hình nón
      const knotGeo = new THREE.ConeGeometry(0.024 * scale, 0.035 * scale, 12);
      const knot = new THREE.Mesh(knotGeo, bMat);
      knot.rotation.x = Math.PI;
      knot.position.y = -0.22 * scale;
      bGroup.add(knot);

      // Dây ruy băng thả dài uốn lượn mềm mại
      const ribbonLen = 1.2 * scale;
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(0, -0.23 * scale, 0),
        new THREE.Vector3(0.04, -0.45 * scale, 0.02),
        new THREE.Vector3(-0.03, -0.8 * scale, -0.02),
        new THREE.Vector3(0.02, -ribbonLen, 0)
      );
      const lineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(this.quality.balloonCurvePoints || 24));
      const line = new THREE.Line(lineGeo, stringMat);
      bGroup.add(line);

      bGroup.userData = {
        baseY: by,
        baseX: bx,
        baseZ: bz,
        phase: Math.random() * Math.PI * 2,
        speed: 0.9 + Math.random() * 0.6
      };

      this.group.add(bGroup);
      this.balloonMeshes.push(bGroup);
    };

    // 1. Chùm bóng bay dạ tiệc góc trái (Bouquet 1 - 7 quả bóng)
    const bq1 = [
      { x: -2.1, y: 2.35, z: -1.7, s: 1.1, m: 0 },
      { x: -2.25, y: 2.1, z: -1.55, s: 0.95, m: 1 },
      { x: -1.95, y: 2.15, z: -1.82, s: 1.0, m: 2 },
      { x: -2.15, y: 2.62, z: -1.78, s: 1.05, m: 3 },
      { x: -2.35, y: 2.45, z: -1.88, s: 0.9, m: 4 },
      { x: -1.9, y: 2.48, z: -1.62, s: 0.95, m: 1 },
      { x: -2.1, y: 2.85, z: -1.72, s: 1.15, m: 0 }
    ];
    bq1.forEach(b => createBalloon(b.x, b.y, b.z, b.s, b.m));

    // 2. Chùm bóng bay dạ tiệc góc phải (Bouquet 2 - 7 quả bóng)
    const bq2 = [
      { x: 2.1, y: 2.35, z: -1.7, s: 1.1, m: 1 },
      { x: 2.25, y: 2.1, z: -1.55, s: 0.95, m: 0 },
      { x: 1.95, y: 2.15, z: -1.82, s: 1.0, m: 3 },
      { x: 2.15, y: 2.62, z: -1.78, s: 1.05, m: 2 },
      { x: 2.35, y: 2.45, z: -1.88, s: 0.9, m: 4 },
      { x: 1.9, y: 2.48, z: -1.62, s: 0.95, m: 0 },
      { x: 2.1, y: 2.85, z: -1.72, s: 1.15, m: 1 }
    ];
    bq2.forEach(b => createBalloon(b.x, b.y, b.z, b.s, b.m));

    // 3. Các quả bóng bay trần lơ lửng sát trần nhà (Ceiling Floating Balloons)
    const ceilingBalloons = [
      { x: -0.9, y: 3.32, z: -0.9, s: 1.0, m: 0 },
      { x: 0.9, y: 3.35, z: -0.7, s: 1.05, m: 1 },
      { x: -1.3, y: 3.3, z: 0.8, s: 0.95, m: 2 },
      { x: 1.2, y: 3.33, z: 0.7, s: 1.0, m: 3 },
      { x: 0.3, y: 3.36, z: 1.2, s: 1.05, m: 4 }
    ];
    ceilingBalloons.forEach(b => createBalloon(b.x, b.y, b.z, b.s, b.m));
  }

  /**
   * Tạo Sprite mũi tên vàng chỉ xuống nhấp nhô "chỉ chỉ"
   */
  createPointingArrow() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Hiệu ứng bóng phát sáng vàng kim
    ctx.shadowColor = 'rgba(245, 158, 11, 0.95)';
    ctx.shadowBlur = 16;

    // Gradient vàng kim sang trọng
    const grad = ctx.createLinearGradient(64, 8, 64, 116);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#fef08a');
    grad.addColorStop(0.7, '#f59e0b');
    grad.addColorStop(1, '#b45309');
    ctx.fillStyle = grad;

    // Vẽ hình mũi tên chỉ thẳng xuống đẹp mắt
    ctx.beginPath();
    ctx.moveTo(64, 116);      // Đỉnh nhọn dưới
    ctx.lineTo(26, 64);       // Cánh trái
    ctx.lineTo(48, 64);       // Gập thân trái
    ctx.lineTo(48, 12);       // Đỉnh thân trái
    ctx.lineTo(80, 12);       // Đỉnh thân phải
    ctx.lineTo(80, 64);       // Gập thân phải
    ctx.lineTo(102, 64);      // Cánh phải
    ctx.closePath();
    ctx.fill();

    // Viền trắng sắc nét
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    // Thu nhỏ mũi tên nhỏ nhất có thể (chỉ 3.5cm) rất tinh tế, không thô
    sprite.scale.set(0.035, 0.035, 1);
    sprite.position.set(0, 0.175, -0.02);
    sprite.visible = false;
    return sprite;
  }

  setIdle(isIdle) {
    this.isIdle = isIdle;
  }

  update(delta) {
    this.time += delta;

    // Ánh sáng nhịp thở nhẹ nhàng quanh lá thư
    if (this.letterGlow) {
      this.letterGlow.material.opacity = 0.45 + Math.sin(this.time * 2.5) * 0.15;
    }

    // Cập nhật mũi tên chỉ chỉ khi người dùng không tương tác trong 10s (nhỏ gọn, nhấp nhô nhẹ)
    if (this.arrowSprite) {
      if (this.isIdle) {
        this.arrowSprite.visible = true;
        // Tăng dần độ mờ hiển thị mượt mà (tối đa 0.85 vừa vặn)
        this.arrowSprite.material.opacity += (0.85 - this.arrowSprite.material.opacity) * 0.12;
        // Hiệu ứng chuyển động "chỉ chỉ" nhấp nhô cực nhẹ (6mm)
        const bounce = Math.sin(this.time * 6.0) * 0.006;
        this.arrowSprite.position.y = 0.175 + bounce;
      } else {
        // Mờ dần rồi ẩn đi khi có tương tác
        this.arrowSprite.material.opacity += (0 - this.arrowSprite.material.opacity) * 0.25;
        if (this.arrowSprite.material.opacity < 0.02) {
          this.arrowSprite.material.opacity = 0;
          this.arrowSprite.visible = false;
        }
      }
    }

    // Ngọn nến cốc nhấp nháy tự nhiên
    if (this.teaLights.length > 0) {
      this.teaLights.forEach((t, idx) => {
        const flicker = Math.sin(this.time * 18 + idx * 2) * 0.004;
        t.flame.scale.x = t.baseScale + flicker;
        t.flame.scale.y = t.baseScale * 1.6 + flicker * 1.5;
        t.light.intensity = 1.2 + Math.sin(this.time * 14 + idx * 3) * 0.2;
      });
    }

    // Cập nhật chuyển động bóng bay dập dềnh tự nhiên
    if (this.balloonMeshes && this.balloonMeshes.length > 0) {
      this.balloonMeshes.forEach(b => {
        const u = b.userData;
        b.position.y = u.baseY + Math.sin(this.time * u.speed + u.phase) * 0.04;
        b.position.x = u.baseX + Math.sin(this.time * 0.7 + u.phase) * 0.02;
        b.rotation.y = Math.sin(this.time * 0.5 + u.phase) * 0.12;
      });
    }
  }
}
