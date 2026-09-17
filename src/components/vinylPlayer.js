import * as THREE from 'three';
import gsap from 'gsap';

/**
 * VinylPlayer: Hộp nhạc & Máy đĩa than cổ điển cao cấp (Luxury Vintage Music Box & Turntable)
 * - Thiết kế tinh xảo: Thùng gỗ sồi bóng viền đồng thau, đĩa than đen bóng phản quang, cần kim vàng
 * - Đèn rọi vàng ấm áp riêng cho hộp nhạc
 * - Hoạt ảnh hạ cần kim, đĩa than xoay và phát nhạc piano lofi ngọt ngào
 */
export class VinylPlayer {
  constructor(scene, onStateChange) {
    this.scene = scene;
    this.onStateChange = onStateChange;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.diskMesh = null;
    this.armGroup = null;
    this.isPlaying = false;
    this.spinSpeed = 0;
    this.targetSpinSpeed = 0;

    // Âm thanh
    this.audioSfxTonearm = new Audio('/audio/tonearm.mp3');
    this.audioSfxStylus = new Audio('/audio/stylus.mp3');
    this.audioSfxMotor = new Audio('/audio/motor.mp3');
    this.musicTrack = new Audio('/audio/romantic_music.mp3');
    this.musicTrack.loop = true;
    this.musicTrack.volume = 0.7;

    // Hạt nốt nhạc phát sáng
    this.notesParticles = null;
    this.particleTime = 0;

    this.createVictorianMusicBox();
    this.createMusicNotesEmitter();
  }

  createVictorianMusicBox() {
    const playerGroup = new THREE.Group();
    // Đặt máy đĩa than ở phía bên trái bàn tiệc trong tầm với tự nhiên
    playerGroup.position.set(-1.25, 0, -0.2);

    // ============================================================
    // 1. BÀN PHỤ GỖ SỒI CỔ ĐIỂN ĐỠ HỘP NHẠC
    // ============================================================
    const tableHeight = 0.76;
    
    // Mặt bàn tròn gỗ sồi nâu trầm
    const standTopGeo = new THREE.CylinderGeometry(0.38, 0.4, 0.04, 32);
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x22130e,
      roughness: 0.35,
      metalness: 0.15
    });
    const standTop = new THREE.Mesh(standTopGeo, standMat);
    standTop.position.y = tableHeight - 0.02;
    standTop.castShadow = true;
    standTop.receiveShadow = true;
    playerGroup.add(standTop);

    // Chân bàn tiện tròn phong cách châu Âu
    const legGeo = new THREE.CylinderGeometry(0.04, 0.08, tableHeight - 0.04, 16);
    const leg = new THREE.Mesh(legGeo, standMat);
    leg.position.y = (tableHeight - 0.04) / 2;
    playerGroup.add(leg);

    // Chân đế 3 chạc mạ đồng
    const baseGeo = new THREE.CylinderGeometry(0.32, 0.35, 0.03, 24);
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.28,
      metalness: 0.85
    });
    const base = new THREE.Mesh(baseGeo, brassMat);
    base.position.y = 0.015;
    playerGroup.add(base);

    // ============================================================
    // 2. THÙNG HỘP NHẠC GỖ QUÝ & ĐỒNG THAU (Music Box Chassis)
    // ============================================================
    const boxWidth = 0.44;
    const boxDepth = 0.38;
    const boxHeight = 0.09;

    // Thân thùng gỗ mun bóng bẩy
    const boxGeo = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x2a140d, // Gỗ cẩm lai nâu đỏ quý phái
      roughness: 0.25,
      metalness: 0.1
    });
    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    boxMesh.position.y = tableHeight + boxHeight / 2;
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;

    // Đánh dấu tương tác
    boxMesh.userData = {
      interactive: true,
      type: 'turntable',
      hint: 'Hộp nhạc đĩa than cổ điển (Chạm để bật/dừng nhạc 🎶)'
    };
    playerGroup.add(boxMesh);

    // Mặt kim loại mạ vàng chải xước (Brushed Gold Deck Plate)
    const deckGeo = new THREE.BoxGeometry(boxWidth - 0.02, 0.01, boxDepth - 0.02);
    const deck = new THREE.Mesh(deckGeo, brassMat);
    deck.position.y = tableHeight + boxHeight + 0.005;
    deck.userData = boxMesh.userData;
    playerGroup.add(deck);

    // 4 Góc bịt đồng bảo vệ hoa văn cổ điển (Brass Filigree Corners)
    const cornerGeo = new THREE.BoxGeometry(0.04, 0.07, 0.04);
    [
      [-boxWidth / 2 + 0.02, -boxDepth / 2 + 0.02],
      [boxWidth / 2 - 0.02, -boxDepth / 2 + 0.02],
      [-boxWidth / 2 + 0.02, boxDepth / 2 - 0.02],
      [boxWidth / 2 - 0.02, boxDepth / 2 - 0.02]
    ].forEach(([cx, cz]) => {
      const corner = new THREE.Mesh(cornerGeo, brassMat);
      corner.position.set(cx, tableHeight + boxHeight / 2, cz);
      playerGroup.add(corner);
    });

    // Các núm xoay âm lượng & công tắc cổ điển
    const knobGeo = new THREE.CylinderGeometry(0.014, 0.016, 0.02, 16);
    [-0.14, -0.09, -0.04].forEach((kx, idx) => {
      const knob = new THREE.Mesh(knobGeo, brassMat);
      knob.position.set(kx, tableHeight + boxHeight + 0.015, boxDepth / 2 - 0.05);
      knob.userData = boxMesh.userData;
      playerGroup.add(knob);
    });

    // ============================================================
    // 3. MÂM QUAY & ĐĨA THAN CHÂN THỰC (Vinyl Record)
    // ============================================================
    const platterRadius = 0.14;
    const platterCenter = new THREE.Vector3(-0.04, tableHeight + boxHeight + 0.015, -0.01);

    // Mâm xoay đồng mạ vàng bên dưới đĩa
    const platterGeo = new THREE.CylinderGeometry(platterRadius, platterRadius + 0.01, 0.015, 48);
    const platter = new THREE.Mesh(platterGeo, brassMat);
    platter.position.copy(platterCenter);
    playerGroup.add(platter);

    // Đĩa than Vinyl (Chất liệu đen bóng có vân rãnh & tem nhãn tâm đĩa)
    const diskGroup = new THREE.Group();
    diskGroup.position.set(platterCenter.x, platterCenter.y + 0.01, platterCenter.z);

    // Tạo texture đĩa than với rãnh âm thanh & nhãn dán trung tâm
    const vCanvas = document.createElement('canvas');
    vCanvas.width = 512;
    vCanvas.height = 512;
    const vCtx = vCanvas.getContext('2d');

    // Mặt đĩa đen tuyền
    vCtx.fillStyle = '#0c0d10';
    vCtx.fillRect(0, 0, 512, 512);

    // Các đường tròn rãnh đĩa (Sound Grooves)
    vCtx.strokeStyle = 'rgba(65, 75, 85, 0.35)';
    vCtx.lineWidth = 1.5;
    for (let r = 85; r < 250; r += 4) {
      vCtx.beginPath();
      vCtx.arc(256, 256, r, 0, Math.PI * 2);
      vCtx.stroke();
    }

    // Nhãn giấy tròn trung tâm (Record Center Label)
    const lGrad = vCtx.createRadialGradient(256, 256, 10, 256, 256, 80);
    lGrad.addColorStop(0, '#ff758c');
    lGrad.addColorStop(0.7, '#8a1c32');
    lGrad.addColorStop(1, '#d4af37');
    vCtx.fillStyle = lGrad;
    vCtx.beginPath();
    vCtx.arc(256, 256, 80, 0, Math.PI * 2);
    vCtx.fill();

    // Chữ in trên nhãn đĩa
    vCtx.fillStyle = '#ffffff';
    vCtx.font = 'bold 16px "Segoe UI", Arial';
    vCtx.textAlign = 'center';
    vCtx.fillText('HAPPY BIRTHDAY', 256, 240);
    vCtx.font = '13px Arial';
    vCtx.fillStyle = '#ffd7a8';
    vCtx.fillText('33 ⅓ RPM • STEREO', 256, 262);
    vCtx.fillText('✨ Best Friend Edition ✨', 256, 280);

    // Lỗ trục giữa đĩa
    vCtx.fillStyle = '#000000';
    vCtx.beginPath();
    vCtx.arc(256, 256, 12, 0, Math.PI * 2);
    vCtx.fill();

    const vinylTexture = new THREE.CanvasTexture(vCanvas);

    const diskGeo = new THREE.CylinderGeometry(platterRadius - 0.005, platterRadius - 0.005, 0.004, 64);
    const diskMat = new THREE.MeshStandardMaterial({
      map: vinylTexture,
      roughness: 0.18,
      metalness: 0.65
    });
    const diskMesh = new THREE.Mesh(diskGeo, diskMat);
    diskMesh.userData = boxMesh.userData;
    diskGroup.add(diskMesh);

    // Trục xoay trung tâm bằng đồng bóng
    const spindleGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.02, 16);
    const spindle = new THREE.Mesh(spindleGeo, brassMat);
    spindle.position.y = 0.01;
    diskGroup.add(spindle);

    playerGroup.add(diskGroup);
    this.diskMesh = diskGroup;

    // ============================================================
    // 4. CẦN KIM VÀNG BÓNG (Golden Articulated Tonearm)
    // ============================================================
    const armGroup = new THREE.Group();
    // Trục xoay cần kim ở góc sau bên phải của mặt máy
    armGroup.position.set(0.12, tableHeight + boxHeight + 0.02, -0.1);

    // Đế đỡ cần kim (Gimbal Base)
    const baseArmGeo = new THREE.CylinderGeometry(0.02, 0.022, 0.025, 16);
    const baseArm = new THREE.Mesh(baseArmGeo, brassMat);
    armGroup.add(baseArm);

    // Quả đối trọng tròn phía sau (Counterweight)
    const weightGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.024, 16);
    const weight = new THREE.Mesh(weightGeo, brassMat);
    weight.rotation.x = Math.PI / 2;
    weight.position.set(0, 0.02, -0.035);
    armGroup.add(weight);

    // Thanh cần kim chữ S mạ vàng
    const armPoleGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.17, 16);
    const armPole = new THREE.Mesh(armPoleGeo, brassMat);
    armPole.rotation.x = Math.PI / 2 - 0.05; // Hơi chúi nhẹ xuống đĩa
    armPole.position.set(0, 0.015, 0.06);
    armGroup.add(armPole);

    // Đầu kim gắn đầu đọc (Headshell & Needle Cartridge)
    const headGeo = new THREE.BoxGeometry(0.015, 0.012, 0.025);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.3,
      metalness: 0.7
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 0.006, 0.145);
    armGroup.add(head);

    // Mũi kim cương siêu nhỏ tiếp xúc mặt đĩa
    const needleTipGeo = new THREE.ConeGeometry(0.002, 0.008, 8);
    const needleTip = new THREE.Mesh(needleTipGeo, brassMat);
    needleTip.rotation.x = Math.PI;
    needleTip.position.set(0, -0.003, 0.155);
    armGroup.add(needleTip);

    // Góc nghỉ ban đầu của cần kim (nằm bên ngoài đĩa than)
    armGroup.rotation.y = 0.55;
    this.armRestAngle = 0.55;
    this.armPlayAngle = -0.15; // Xoay vào rãnh ngoài của đĩa than

    playerGroup.add(armGroup);
    this.armGroup = armGroup;

    // ============================================================
    // 5. ĐÈN RỌI VÀNG ẤM RIÊNG CHO HỘP NHẠC
    // ============================================================
    const lampLight = new THREE.PointLight(0xffdf99, 1.8, 2.2);
    lampLight.position.set(0.05, tableHeight + boxHeight + 0.3, 0.05);
    playerGroup.add(lampLight);

    this.group.add(playerGroup);
  }

  createMusicNotesEmitter() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ff758c';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♫', 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const particleCount = 20;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    const opacities = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = -1.25 + (Math.random() - 0.5) * 0.3;
      pos[i * 3 + 1] = 0.95 + Math.random() * 0.8;
      pos[i * 3 + 2] = -0.2 + (Math.random() - 0.5) * 0.3;
      opacities[i] = 0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.18,
      map: texture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.notesParticles = new THREE.Points(geo, mat);
    this.group.add(this.notesParticles);
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.targetSpinSpeed = 0.045;

    // 1. Tiếng động cơ khởi động
    try {
      this.audioSfxMotor.currentTime = 0;
      this.audioSfxMotor.play().catch(() => {});
    } catch (e) {}

    // 2. Cần kim từ từ xoay và hạ xuống rãnh đĩa
    if (this.armGroup) {
      gsap.to(this.armGroup.rotation, {
        y: this.armPlayAngle,
        duration: 1.6,
        ease: 'power2.inOut',
        onComplete: () => {
          try {
            this.audioSfxStylus.currentTime = 0;
            this.audioSfxStylus.play().catch(() => {});
          } catch (e) {}

          setTimeout(() => {
            if (this.isPlaying) {
              this.musicTrack.play().catch(() => {});
            }
          }, 300);
        }
      });
    } else {
      this.musicTrack.play().catch(() => {});
    }

    if (this.onStateChange) {
      this.onStateChange(true);
    }
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.targetSpinSpeed = 0;

    this.musicTrack.pause();

    // Nhấc cần kim về vị trí nghỉ
    if (this.armGroup) {
      gsap.to(this.armGroup.rotation, {
        y: this.armRestAngle,
        duration: 1.4,
        ease: 'power2.out'
      });
    }

    if (this.onStateChange) {
      this.onStateChange(false);
    }
  }

  update(delta) {
    this.spinSpeed += (this.targetSpinSpeed - this.spinSpeed) * 0.05;

    // Đĩa than xoay tròn đều đặn
    if (this.diskMesh && Math.abs(this.spinSpeed) > 0.0001) {
      this.diskMesh.rotation.y += this.spinSpeed;
    }

    // Các nốt nhạc bay lơ lửng khi phát nhạc
    if (this.notesParticles) {
      this.particleTime += delta;
      const targetOpacity = this.isPlaying ? 0.9 : 0;
      this.notesParticles.material.opacity += (targetOpacity - this.notesParticles.material.opacity) * 0.08;

      if (this.isPlaying) {
        const positions = this.notesParticles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] += delta * 0.25;
          positions[i] += Math.sin(this.particleTime * 2 + i) * 0.003;
          if (positions[i + 1] > 1.9) {
            positions[i + 1] = 0.95;
            positions[i] = -1.45 + (Math.random() - 0.5) * 0.3;
          }
        }
        this.notesParticles.geometry.attributes.position.needsUpdate = true;
      }
    }
  }
}
