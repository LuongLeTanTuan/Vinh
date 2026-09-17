import * as THREE from 'three';

/**
 * RoomScene: Căn phòng tiệc sang trọng & ấm cúng (Intimate Luxury)
 * - Kích thước nhỏ gọn ấm áp hơn (6m x 6m) thay vì 9m x 9m trước đây
 * - Trần nhà giếng trời kính vòm ngắm sao với khung nan mạ vàng
 * - Tường phủ giấy dán tường damask tối màu sang trọng + phào tường wainscoting
 * - Dây đèn đom đóm fairy lights buông lơ lửng lãng mạn
 * - Sàn gỗ sồi bóng nâu trầm ấm có thảm tròn
 * - Ánh sáng nến vàng lung linh + ánh trăng dịu mát từ giếng trời
 */
export class RoomScene {
  constructor(scene, loadingManager = null, quality = {}) {
    this.scene = scene;
    this.loadingManager = loadingManager;
    this.quality = quality;
    this.roomWidth = 6.0;
    this.roomLength = 6.0;
    this.roomHeight = 3.6;

    this.candleLight = null;
    this.candleLight2 = null;
    this.fairyLights = null;
    this.time = 0;

    this.createFloor();
    this.createWalls();
    this.createStarlightWindows();
    this.createGlassCeilingSkylight();
    this.createLighting();
    this.createDecorativeElements();
  }

  createFloor() {
    const floorGeo = new THREE.PlaneGeometry(this.roomWidth, this.roomLength);
    
    // Canvas tạo vân sàn gỗ sồi bóng phong cách herringbone
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1c100a';
    ctx.fillRect(0, 0, 1024, 1024);

    // Vân gỗ sồi herringbone tinh xảo
    const plankH = 48;
    const plankW = 128;
    for (let y = 0; y < 1024; y += plankH) {
      for (let x = 0; x < 1024; x += plankW) {
        const row = Math.floor(y / plankH);
        const col = Math.floor(x / plankW);
        const brightness = 14 + Math.floor(Math.random() * 8);
        ctx.fillStyle = `rgb(${brightness + 12}, ${brightness + 4}, ${brightness - 2})`;
        ctx.fillRect(x, y, plankW - 1, plankH - 1);
        
        // Vân gỗ tự nhiên mỏng
        ctx.strokeStyle = `rgba(255,200,130,${0.03 + Math.random() * 0.04})`;
        ctx.lineWidth = 0.5;
        for (let line = 0; line < 4; line++) {
          const ly = y + 6 + line * 10 + Math.random() * 5;
          ctx.beginPath();
          ctx.moveTo(x, ly);
          ctx.bezierCurveTo(x + plankW * 0.3, ly + Math.random() * 3, x + plankW * 0.7, ly - Math.random() * 3, x + plankW, ly);
          ctx.stroke();
        }
      }
      // Đường chỉ ghép sàn
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, y, 1024, 1.5);
    }

    const floorTexture = new THREE.CanvasTexture(canvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(2, 2);

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.28,
      metalness: 0.15
    });

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Thảm tròn Ba Tư sang trọng dưới bàn tiệc
    const rugGeo = new THREE.CircleGeometry(1.6, 64);
    
    // Texture thảm Ba Tư tinh xảo
    const rugCanvas = document.createElement('canvas');
    rugCanvas.width = 512;
    rugCanvas.height = 512;
    const rCtx = rugCanvas.getContext('2d');
    
    // Nền thảm đỏ thẫm
    const rugGrad = rCtx.createRadialGradient(256, 256, 30, 256, 256, 256);
    rugGrad.addColorStop(0, '#2a0f18');
    rugGrad.addColorStop(0.3, '#1f0c14');
    rugGrad.addColorStop(0.7, '#1a0a12');
    rugGrad.addColorStop(1, '#120810');
    rCtx.fillStyle = rugGrad;
    rCtx.fillRect(0, 0, 512, 512);
    
    // Họa tiết hoa văn đồng tâm
    for (let r = 40; r < 256; r += 30) {
      rCtx.strokeStyle = `rgba(212, 175, 55, ${0.08 + (r / 256) * 0.06})`;
      rCtx.lineWidth = 1;
      rCtx.beginPath();
      rCtx.arc(256, 256, r, 0, Math.PI * 2);
      rCtx.stroke();
    }
    // Hoa văn chéo nhỏ
    rCtx.strokeStyle = 'rgba(180, 100, 60, 0.08)';
    rCtx.lineWidth = 0.5;
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      rCtx.beginPath();
      rCtx.moveTo(256, 256);
      rCtx.lineTo(256 + Math.cos(angle) * 240, 256 + Math.sin(angle) * 240);
      rCtx.stroke();
    }
    
    const rugTexture = new THREE.CanvasTexture(rugCanvas);
    const rugMat = new THREE.MeshStandardMaterial({
      map: rugTexture,
      roughness: 0.92,
      metalness: 0.04
    });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.005, -0.7);
    rug.receiveShadow = true;
    this.scene.add(rug);
  }

  createWalls() {
    // Texture giấy dán tường Damask sang trọng
    const wallCanvas = document.createElement('canvas');
    wallCanvas.width = 512;
    wallCanvas.height = 512;
    const wCtx = wallCanvas.getContext('2d');
    
    // Nền tường xanh xám đêm trầm ấm
    wCtx.fillStyle = '#151926';
    wCtx.fillRect(0, 0, 512, 512);
    
    // Họa tiết damask chìm nhẹ
    wCtx.fillStyle = 'rgba(25, 30, 50, 0.6)';
    for (let x = 0; x < 512; x += 64) {
      for (let y = 0; y < 512; y += 64) {
        wCtx.beginPath();
        wCtx.arc(x + 32, y + 32, 18, 0, Math.PI * 2);
        wCtx.fill();
        wCtx.fillStyle = 'rgba(212, 175, 55, 0.04)';
        wCtx.beginPath();
        wCtx.arc(x + 32, y + 32, 4, 0, Math.PI * 2);
        wCtx.fill();
        wCtx.fillStyle = 'rgba(25, 30, 50, 0.6)';
      }
    }
    
    const wallTexture = new THREE.CanvasTexture(wallCanvas);
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(2, 2);

    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.82,
      metalness: 0.1
    });

    const halfW = this.roomWidth / 2;
    const halfL = this.roomLength / 2;

    // Phào chân tường mạ vàng sang trọng
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.3,
      metalness: 0.85
    });

    // Wainscoting panels (ván ốp tường dưới)
    const wainscotHeight = 1.0;
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x10121e,
      roughness: 0.6,
      metalness: 0.15
    });

    const dividerMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.35,
      metalness: 0.8
    });

    // 1. TƯỜNG TRƯỚC (z = -halfL): BỨC TƯỜNG SANG TRỌNG PHẲNG, GÓC TƯỜNG BÌNH THƯỜNG
    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(this.roomWidth, this.roomHeight), wallMat);
    frontWall.position.set(0, this.roomHeight / 2, -halfL);
    frontWall.receiveShadow = true;
    this.scene.add(frontWall);

    const frontPanel = new THREE.Mesh(new THREE.PlaneGeometry(this.roomWidth, wainscotHeight), panelMat);
    frontPanel.position.set(0, wainscotHeight / 2, -halfL + 0.005);
    this.scene.add(frontPanel);

    const frontDiv = new THREE.Mesh(new THREE.BoxGeometry(this.roomWidth, 0.025, 0.03), dividerMat);
    frontDiv.position.set(0, wainscotHeight, -halfL + 0.015);
    this.scene.add(frontDiv);

    const frontTrim = new THREE.Mesh(new THREE.BoxGeometry(this.roomWidth, 0.08, 0.04), trimMat);
    frontTrim.position.set(0, 0.04, -halfL + 0.02);
    this.scene.add(frontTrim);

    // 2. TƯỜNG TRÁI (x = -halfW): CÓ CỬA SỔ VÒM LỚN NGẮM SAO Ở GIỮA
    const winOpeningW = 2.2;
    const winOpeningH = 1.85;
    const sideSegmentW = (this.roomLength - winOpeningW) / 2; // 1.9m

    // Mảng tường bên trái cửa sổ: z: -3.0 đến -1.1 (rộng 1.9m)
    const leftWall1 = new THREE.Mesh(new THREE.PlaneGeometry(sideSegmentW, this.roomHeight), wallMat);
    leftWall1.position.set(-halfW, this.roomHeight / 2, -2.05);
    leftWall1.rotation.y = Math.PI / 2;
    leftWall1.receiveShadow = true;
    this.scene.add(leftWall1);

    // Mảng tường bên phải cửa sổ: z: 1.1 đến 3.0 (rộng 1.9m)
    const leftWall2 = new THREE.Mesh(new THREE.PlaneGeometry(sideSegmentW, this.roomHeight), wallMat);
    leftWall2.position.set(-halfW, this.roomHeight / 2, 2.05);
    leftWall2.rotation.y = Math.PI / 2;
    leftWall2.receiveShadow = true;
    this.scene.add(leftWall2);

    // Mảng tường dưới bậu cửa sổ: y: 0 đến 1.0 (cao 1.0m, rộng 2.2m)
    const leftWallBottom = new THREE.Mesh(new THREE.PlaneGeometry(winOpeningW, 1.0), wallMat);
    leftWallBottom.position.set(-halfW, 0.5, 0);
    leftWallBottom.rotation.y = Math.PI / 2;
    leftWallBottom.receiveShadow = true;
    this.scene.add(leftWallBottom);

    // Mảng tường trên đỉnh cửa sổ: y: 2.85 đến 3.6 (cao 0.75m, rộng 2.2m)
    const leftWallTop = new THREE.Mesh(new THREE.PlaneGeometry(winOpeningW, 0.75), wallMat);
    leftWallTop.position.set(-halfW, 3.225, 0);
    leftWallTop.rotation.y = Math.PI / 2;
    leftWallTop.receiveShadow = true;
    this.scene.add(leftWallTop);

    // Wainscoting & Phào tường trái
    const leftPanel = new THREE.Mesh(new THREE.PlaneGeometry(this.roomLength, wainscotHeight), panelMat);
    leftPanel.position.set(-halfW + 0.005, wainscotHeight / 2, 0);
    leftPanel.rotation.y = Math.PI / 2;
    this.scene.add(leftPanel);

    const leftDiv = new THREE.Mesh(new THREE.BoxGeometry(this.roomLength, 0.025, 0.03), dividerMat);
    leftDiv.position.set(-halfW + 0.015, wainscotHeight, 0);
    leftDiv.rotation.y = Math.PI / 2;
    this.scene.add(leftDiv);

    const leftTrim = new THREE.Mesh(new THREE.BoxGeometry(this.roomLength, 0.08, 0.04), trimMat);
    leftTrim.position.set(-halfW + 0.02, 0.04, 0);
    leftTrim.rotation.y = Math.PI / 2;
    this.scene.add(leftTrim);

    // 3. TƯỜNG PHẢI (x = +halfW): CÓ CỬA SỔ VÒM LỚN NGẮM SAO Ở GIỮA
    const rightWall1 = new THREE.Mesh(new THREE.PlaneGeometry(sideSegmentW, this.roomHeight), wallMat);
    rightWall1.position.set(halfW, this.roomHeight / 2, -2.05);
    rightWall1.rotation.y = -Math.PI / 2;
    rightWall1.receiveShadow = true;
    this.scene.add(rightWall1);

    const rightWall2 = new THREE.Mesh(new THREE.PlaneGeometry(sideSegmentW, this.roomHeight), wallMat);
    rightWall2.position.set(halfW, this.roomHeight / 2, 2.05);
    rightWall2.rotation.y = -Math.PI / 2;
    rightWall2.receiveShadow = true;
    this.scene.add(rightWall2);

    const rightWallBottom = new THREE.Mesh(new THREE.PlaneGeometry(winOpeningW, 1.0), wallMat);
    rightWallBottom.position.set(halfW, 0.5, 0);
    rightWallBottom.rotation.y = -Math.PI / 2;
    rightWallBottom.receiveShadow = true;
    this.scene.add(rightWallBottom);

    const rightWallTop = new THREE.Mesh(new THREE.PlaneGeometry(winOpeningW, 0.75), wallMat);
    rightWallTop.position.set(halfW, 3.225, 0);
    rightWallTop.rotation.y = -Math.PI / 2;
    rightWallTop.receiveShadow = true;
    this.scene.add(rightWallTop);

    // Wainscoting & Phào tường phải
    const rightPanel = new THREE.Mesh(new THREE.PlaneGeometry(this.roomLength, wainscotHeight), panelMat);
    rightPanel.position.set(halfW - 0.005, wainscotHeight / 2, 0);
    rightPanel.rotation.y = -Math.PI / 2;
    this.scene.add(rightPanel);

    const rightDiv = new THREE.Mesh(new THREE.BoxGeometry(this.roomLength, 0.025, 0.03), dividerMat);
    rightDiv.position.set(halfW - 0.015, wainscotHeight, 0);
    rightDiv.rotation.y = -Math.PI / 2;
    this.scene.add(rightDiv);

    const rightTrim = new THREE.Mesh(new THREE.BoxGeometry(this.roomLength, 0.08, 0.04), trimMat);
    rightTrim.position.set(halfW - 0.02, 0.04, 0);
    rightTrim.rotation.y = -Math.PI / 2;
    this.scene.add(rightTrim);

    // 4. TƯỜNG SAU (z = +halfL): BỨC TƯỜNG GALLERY DANH DỰ TRANG TRỌNG
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(this.roomWidth, this.roomHeight), wallMat);
    backWall.position.set(0, this.roomHeight / 2, halfL);
    backWall.rotation.y = Math.PI;
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    const backPanel = new THREE.Mesh(new THREE.PlaneGeometry(this.roomWidth, wainscotHeight), panelMat);
    backPanel.position.set(0, wainscotHeight / 2, halfL - 0.005);
    backPanel.rotation.y = Math.PI;
    this.scene.add(backPanel);

    const backDiv = new THREE.Mesh(new THREE.BoxGeometry(this.roomWidth, 0.025, 0.03), dividerMat);
    backDiv.position.set(0, wainscotHeight, halfL - 0.015);
    backDiv.rotation.y = Math.PI;
    this.scene.add(backDiv);

    const backTrim = new THREE.Mesh(new THREE.BoxGeometry(this.roomWidth, 0.08, 0.04), trimMat);
    backTrim.position.set(0, 0.04, halfL - 0.02);
    this.scene.add(backTrim);

    // Phào trần (Crown Molding) mạ vàng 4 cạnh
    const crownTrims = [
      { pos: [0, this.roomHeight - 0.03, halfL - 0.02], rot: 0, len: this.roomWidth },
      { pos: [0, this.roomHeight - 0.03, -halfL + 0.02], rot: 0, len: this.roomWidth },
      { pos: [-halfW + 0.02, this.roomHeight - 0.03, 0], rot: Math.PI / 2, len: this.roomLength },
      { pos: [halfW - 0.02, this.roomHeight - 0.03, 0], rot: Math.PI / 2, len: this.roomLength }
    ];

    crownTrims.forEach(t => {
      const crownGeo = new THREE.BoxGeometry(t.len, 0.06, 0.05);
      const crown = new THREE.Mesh(crownGeo, trimMat);
      crown.position.set(...t.pos);
      crown.rotation.y = t.rot;
      this.scene.add(crown);
    });
  }

  /**
   * Tạo 2 Cửa Sổ Vòm Lớn Ngắm Bầu Trời Sao Thực Tế (Tường Trái & Tường Phải)
   */
  createStarlightWindows() {
    const halfW = this.roomWidth / 2;

    const frameWoodMat = new THREE.MeshStandardMaterial({
      color: 0xf6f4ef,
      roughness: 0.32,
      metalness: 0.04
    });

    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.22,
      metalness: 0.9
    });

    // Kính trong suốt pha lê phản chiếu nhẹ, nhìn thấu ra bầu trời đêm
    const windowGlassMat = new THREE.MeshStandardMaterial({
      color: 0xd8eeff,
      transparent: true,
      opacity: 0.14,
      roughness: 0.06,
      metalness: 0.12,
      depthWrite: false
    });

    const marbleSillMat = new THREE.MeshStandardMaterial({
      color: 0xf2efe9,
      roughness: 0.2,
      metalness: 0.08
    });

    // Nạp ảnh dải ngân hà ESO Milky Way tuyệt đẹp bên ngoài cửa sổ
    const textureLoader = new THREE.TextureLoader(this.loadingManager);
    const milkyWayTex = textureLoader.load('/textures/milky_way_window.jpg');
    milkyWayTex.colorSpace = THREE.SRGBColorSpace;
    milkyWayTex.wrapS = THREE.ClampToEdgeWrapping;
    milkyWayTex.wrapT = THREE.ClampToEdgeWrapping;

    const winW = 2.2;
    const winH = 1.85;
    const centerY = 1.925;
    const frameT = 0.08; // Độ dày thanh khung cửa sổ
    const frameD = 0.09; // Chiều sâu khung

    // Cửa sổ trên 2 bức tường (-halfW và +halfW)
    [-halfW, halfW].forEach(wallX => {
      const isLeft = wallX < 0;
      const winGroup = new THREE.Group();
      winGroup.position.set(wallX, 0, 0);
      winGroup.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;

      // 1. Bậu cửa sổ đá hoa cương cẩm thạch trắng (Marble Sill)
      const sill = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.26, 0.06, 0.34), marbleSillMat);
      sill.position.set(0, 1.0, 0.09);
      winGroup.add(sill);

      const sillGold = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.28, 0.02, 0.04), goldTrimMat);
      sillGold.position.set(0, 0.97, 0.24);
      winGroup.add(sillGold);

      // 3. Khung cửa sổ viền rỗng (Hollow Window Frame Structure)
      // Cột khung trái
      const postL = new THREE.Mesh(new THREE.BoxGeometry(frameT, winH, frameD), frameWoodMat);
      postL.position.set(-winW / 2 + frameT / 2, centerY, 0);
      winGroup.add(postL);

      // Cột khung phải
      const postR = new THREE.Mesh(new THREE.BoxGeometry(frameT, winH, frameD), frameWoodMat);
      postR.position.set(winW / 2 - frameT / 2, centerY, 0);
      winGroup.add(postR);

      // Đố khung trên
      const barTop = new THREE.Mesh(new THREE.BoxGeometry(winW, frameT, frameD), frameWoodMat);
      barTop.position.set(0, centerY + winH / 2 - frameT / 2, 0);
      winGroup.add(barTop);

      // Đố khung dưới
      const barBot = new THREE.Mesh(new THREE.BoxGeometry(winW, frameT, frameD), frameWoodMat);
      barBot.position.set(0, centerY - winH / 2 + frameT / 2, 0);
      winGroup.add(barBot);

      // Chỉ viền vàng bao trong khung (Inner Gold Trim)
      const innerGoldL = new THREE.Mesh(new THREE.BoxGeometry(0.015, winH - frameT * 2, frameD + 0.005), goldTrimMat);
      innerGoldL.position.set(-winW / 2 + frameT + 0.0075, centerY, 0);
      winGroup.add(innerGoldL);

      const innerGoldR = new THREE.Mesh(new THREE.BoxGeometry(0.015, winH - frameT * 2, frameD + 0.005), goldTrimMat);
      innerGoldR.position.set(winW / 2 - frameT - 0.0075, centerY, 0);
      winGroup.add(innerGoldR);

      // Nan chia ô kính phong cách kiến trúc châu Âu (French Window Mullions)
      const innerW = winW - frameT * 2;
      const innerH = winH - frameT * 2;

      // Thanh ngang giữa
      const mullionH = new THREE.Mesh(new THREE.BoxGeometry(innerW, 0.032, 0.045), frameWoodMat);
      mullionH.position.set(0, centerY, 0.01);
      winGroup.add(mullionH);

      const mullionHGold = new THREE.Mesh(new THREE.BoxGeometry(innerW, 0.01, 0.048), goldTrimMat);
      mullionHGold.position.set(0, centerY, 0.01);
      winGroup.add(mullionHGold);

      // 2 Thanh dọc chia làm 6 ô kính sang trọng
      [-0.52, 0.52].forEach(mX => {
        const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.032, innerH, 0.045), frameWoodMat);
        mullionV.position.set(mX, centerY, 0.01);
        winGroup.add(mullionV);

        const mullionVGold = new THREE.Mesh(new THREE.BoxGeometry(0.01, innerH, 0.048), goldTrimMat);
        mullionVGold.position.set(mX, centerY, 0.01);
        winGroup.add(mullionVGold);
      });

      // 4. Kính trong suốt đón ánh sao
      const glassMesh = new THREE.Mesh(new THREE.PlaneGeometry(innerW, innerH), windowGlassMat);
      glassMesh.position.set(0, centerY, 0.015);
      winGroup.add(glassMesh);

      // Vành vòm mạ vàng trang trí đỉnh cửa sổ
      const archRing = new THREE.Mesh(new THREE.TorusGeometry(winW / 2 - 0.06, 0.018, 12, 28, Math.PI), goldTrimMat);
      archRing.position.set(0, centerY + winH / 2 - 0.06, 0.02);
      winGroup.add(archRing);

      // Ánh trăng dịu mát chiếu qua cửa sổ vào phòng
      const moonlightSill = new THREE.PointLight(0xa5d5ff, 0.9, 5.0, 1.4);
      moonlightSill.position.set(0, centerY, 0.35);
      winGroup.add(moonlightSill);

      this.scene.add(winGroup);
    });
  }

  /**
   * Tạo Mái Vòm Kính Giếng Trời (Glass Skylight Dome) NGAY TRÊN ĐẦU
   */
  createGlassCeilingSkylight() {
    const ceilingGroup = new THREE.Group();

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1f1a14,
      roughness: 0.4,
      metalness: 0.6
    });

    const goldRibMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.85
    });

    // Phần trần bê tông bao ngoài có lỗ tròn giếng trời lớn ở giữa
    const skylightRadius = 2.5;
    
    const ceilShape = new THREE.Shape();
    ceilShape.moveTo(-this.roomWidth / 2, -this.roomLength / 2);
    ceilShape.lineTo(this.roomWidth / 2, -this.roomLength / 2);
    ceilShape.lineTo(this.roomWidth / 2, this.roomLength / 2);
    ceilShape.lineTo(-this.roomWidth / 2, this.roomLength / 2);
    ceilShape.closePath();

    const skylightHole = new THREE.Path();
    skylightHole.absarc(0, 0, skylightRadius, 0, Math.PI * 2, true);
    ceilShape.holes.push(skylightHole);

    const ceilGeo = new THREE.ShapeGeometry(ceilShape);
    const ceilMesh = new THREE.Mesh(ceilGeo, frameMat);
    ceilMesh.rotation.x = Math.PI / 2;
    ceilMesh.position.y = this.roomHeight;
    ceilingGroup.add(ceilMesh);

    // Vành tròn đúc đồng mạ vàng
    const rimGeo = new THREE.TorusGeometry(skylightRadius, 0.05, 16, 48);
    const rim = new THREE.Mesh(rimGeo, goldRibMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = this.roomHeight - 0.02;
    ceilingGroup.add(rim);

    // Các nan xương kim loại mạ vàng hình nan hoa
    const ribCount = 8;
    const spokeGeo = new THREE.CylinderGeometry(0.015, 0.015, skylightRadius * 2, 12);
    for (let i = 0; i < ribCount / 2; i++) {
      const angle = (i * Math.PI) / (ribCount / 2);
      const spoke = new THREE.Mesh(spokeGeo, goldRibMat);
      spoke.rotation.z = Math.PI / 2;
      spoke.rotation.y = angle;
      spoke.position.y = this.roomHeight;
      ceilingGroup.add(spoke);
    }

    // Kính cường lực trong suốt pha lê nhìn thấu bầu trời sao và vầng trăng ở cự ly xa
    const glassGeo = new THREE.CircleGeometry(skylightRadius, 48);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xd8eeff,
      transparent: true,
      opacity: 0.12,
      roughness: 0.04,
      metalness: 0.15,
      depthWrite: false
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.rotation.x = Math.PI / 2;
    glass.position.y = this.roomHeight + 0.01;
    ceilingGroup.add(glass);

    this.scene.add(ceilingGroup);
  }

  createLighting() {
    // 1. Ánh sáng môi trường dịu nhẹ (Ambient)
    const ambientLight = new THREE.AmbientLight(0x2d2644, 1.6);
    this.scene.add(ambientLight);

    // 2. Ánh nến vàng ấm lung linh giữa bàn tiệc
    const candleLight = new THREE.PointLight(0xffa743, 3.0, 5.0, 1.3);
    candleLight.position.set(0, 1.15, -0.7);
    candleLight.castShadow = this.quality.shadows !== false;
    candleLight.shadow.mapSize.width = this.quality.shadowMapSize || 512;
    candleLight.shadow.mapSize.height = this.quality.shadowMapSize || 512;
    this.scene.add(candleLight);
    this.candleLight = candleLight;

    // 3. Ánh nến phụ từ giá nến bên trái
    const candleLight2 = new THREE.PointLight(0xffc97e, 1.5, 3.5, 1.4);
    candleLight2.position.set(-0.52, 1.2, -0.85);
    this.scene.add(candleLight2);
    this.candleLight2 = candleLight2;

    // 4. Ánh trăng dịu mát chiếu thẳng từ giếng trời trên đầu xuống
    const moonDownLight = new THREE.DirectionalLight(0xb0d0ff, 1.2);
    moonDownLight.position.set(0, 10, 0);
    moonDownLight.target.position.set(0, 0, 0);
    this.scene.add(moonDownLight);
    this.scene.add(moonDownLight.target);

    // 5. Ánh sáng rim nhẹ tạo chiều sâu
    const rimLight = new THREE.PointLight(0x6644aa, 0.8, 8, 1.5);
    rimLight.position.set(2.5, 2.5, -2.5);
    this.scene.add(rimLight);

    const rimLight2 = new THREE.PointLight(0x4422aa, 0.6, 8, 1.5);
    rimLight2.position.set(-2.5, 2.5, 2.5);
    this.scene.add(rimLight2);
  }

  /**
   * Chi tiết trang trí phụ: Giữ góc tường sạch sẽ, vuông vắn tự nhiên (Normal Clean Corners)
   */
  createDecorativeElements() {
    // Góc tường tự nhiên liền mạch, không có dải rèm hay thanh chắn vướng mắt
  }

  update(delta) {
    this.time += delta;

    // Ánh nến bập bùng nhẹ nhàng
    if (this.candleLight) {
      this.candleLight.intensity = 3.0 + Math.sin(this.time * 14) * 0.2 + Math.sin(this.time * 23) * 0.1;
    }
    if (this.candleLight2) {
      this.candleLight2.intensity = 1.5 + Math.sin(this.time * 11 + 1.5) * 0.15;
    }
  }
}
