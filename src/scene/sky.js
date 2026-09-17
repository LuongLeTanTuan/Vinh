import * as THREE from 'three';

/**
 * SkyScene: Bầu trời sao huyền ảo lung linh NGAY TRÊN ĐẦU (Overhead Starlight Canopy)
 * - Sử dụng texture bầu trời sao thật từ ảnh chụp thiên văn
 * - Lớp sao diamond sparkle 4 cánh tỏa sáng kim cương
 * - Vầng trăng thơ mộng và sao băng shooting star
 * - Hiệu ứng nebula tinh vân mờ ảo
 */
export class SkyScene {
  constructor(scene) {
    this.scene = scene;
    this.stars = null;
    this.sparkleStars = null;
    this.moon = null;
    this.shootingStar = null;
    this.time = 0;
    this.shootingStarActive = false;
    this.nextShootingStarTime = 5;

    this.createStarfieldSphere();
    this.createDiamondSparkleStars();
    this.createOverheadMoon();
    this.createNebulaClouds();
    this.createShootingStar();
  }

  /**
   * Bầu trời sao sử dụng texture dải ngân hà Milky Way thực tế ở cự ly xa (120m)
   * Tạo hiệu ứng thị giác chiều sâu 3D vô tận qua cả giếng trời nóc phòng và cửa sổ
   */
  createStarfieldSphere() {
    const domeGeo = new THREE.SphereGeometry(120, 64, 48);
    domeGeo.scale(-1, 1, 1);

    // Tải texture bầu trời sao Milky Way độ nét cao
    const textureLoader = new THREE.TextureLoader();
    const starfieldTex = textureLoader.load('/textures/milky_way_window.jpg');
    starfieldTex.colorSpace = THREE.SRGBColorSpace;
    starfieldTex.wrapS = THREE.RepeatWrapping;
    starfieldTex.wrapT = THREE.ClampToEdgeWrapping;
    starfieldTex.repeat.set(2, 1); // Lặp 2 lần ôm trọn 360 độ

    const domeMat = new THREE.MeshBasicMaterial({
      map: starfieldTex,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    });

    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.rotation.x = 0.25;
    dome.rotation.y = 0.8;
    this.scene.add(dome);
    this.skyDome = dome;

    // Lớp phủ gradient tối chỉ ở dưới đáy sàn âm (y < -5m)
    const fadeCanvas = document.createElement('canvas');
    fadeCanvas.width = 2;
    fadeCanvas.height = 512;
    const fCtx = fadeCanvas.getContext('2d');
    const fadeGrad = fCtx.createLinearGradient(0, 0, 0, 512);
    fadeGrad.addColorStop(0, 'rgba(8, 10, 18, 0)');
    fadeGrad.addColorStop(0.78, 'rgba(8, 10, 18, 0)');
    fadeGrad.addColorStop(0.92, 'rgba(8, 10, 18, 0.45)');
    fadeGrad.addColorStop(1, 'rgba(8, 10, 18, 0.95)');
    fCtx.fillStyle = fadeGrad;
    fCtx.fillRect(0, 0, 2, 512);

    const fadeTex = new THREE.CanvasTexture(fadeCanvas);
    const fadeSphereGeo = new THREE.SphereGeometry(110, 32, 24);
    fadeSphereGeo.scale(-1, 1, 1);
    const fadeMat = new THREE.MeshBasicMaterial({
      map: fadeTex,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    });
    const fadeSphere = new THREE.Mesh(fadeSphereGeo, fadeMat);
    this.scene.add(fadeSphere);
  }

  /**
   * Tạo ngàn vì sao lấp lánh bao quát cả trên đầu lẫn ngang tầm mắt ngoài cửa sổ/ban công
   */
  createDiamondSparkleStars() {
    const starCount = 1800;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#fff0be'),
      new THREE.Color('#aee4ff'),
      new THREE.Color('#ffd1dc'),
      new THREE.Color('#e0b0ff'),
      new THREE.Color('#ffeaa7')
    ];

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const theta = u * 2.0 * Math.PI;
      // Phân bố đều cả trên đỉnh đầu lẫn quanh tầm mắt ngang cửa sổ/ban công
      const phi = Math.random() < 0.5 ? Math.acos(1.0 - Math.random() * 0.8) : (Math.PI * 0.25 + (Math.random() - 0.5) * 0.8);
      const r = 35 + Math.random() * 45;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) + 2.0;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      sizes[i] = Math.random() * 2.6 + 0.8;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Texture ngôi sao 4 cánh tỏa sáng kim cương
    const starCanvas = document.createElement('canvas');
    starCanvas.width = 128;
    starCanvas.height = 128;
    const sCtx = starCanvas.getContext('2d');

    // Quầng sáng tròn mềm
    const grad = sCtx.createRadialGradient(64, 64, 0, 64, 64, 60);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.15, 'rgba(255, 240, 210, 0.85)');
    grad.addColorStop(0.4, 'rgba(180, 215, 255, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 128, 128);

    // Tia sáng chéo 4 cánh
    sCtx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    sCtx.lineWidth = 2;
    sCtx.beginPath();
    sCtx.moveTo(64, 12);
    sCtx.lineTo(64, 116);
    sCtx.moveTo(12, 64);
    sCtx.lineTo(116, 64);
    sCtx.stroke();

    // Tia chéo phụ mờ hơn
    sCtx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    sCtx.lineWidth = 1;
    sCtx.beginPath();
    sCtx.moveTo(28, 28);
    sCtx.lineTo(100, 100);
    sCtx.moveTo(100, 28);
    sCtx.lineTo(28, 100);
    sCtx.stroke();

    const starTexture = new THREE.CanvasTexture(starCanvas);

    const mat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      map: starTexture,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false // Sáng rực rỡ không bị sương mù che khuất
    });

    this.stars = new THREE.Points(geo, mat);
    this.scene.add(this.stars);
  }

  createOverheadMoon() {
    const moonGroup = new THREE.Group();
    moonGroup.position.set(-6, 36, -10); // Đặt vầng trăng ở góc nhìn đẹp xuyên qua giếng trời kính

    const moonGeo = new THREE.SphereGeometry(3.6, 32, 32);
    
    // Texture mặt trăng chân thực hơn
    const moonCanvas = document.createElement('canvas');
    moonCanvas.width = 256;
    moonCanvas.height = 256;
    const mCtx = moonCanvas.getContext('2d');
    
    const moonGrad = mCtx.createRadialGradient(128, 128, 10, 128, 128, 128);
    moonGrad.addColorStop(0, '#fff8e8');
    moonGrad.addColorStop(0.3, '#fef5dc');
    moonGrad.addColorStop(0.7, '#f0e4c0');
    moonGrad.addColorStop(1, '#d8ccb0');
    mCtx.fillStyle = moonGrad;
    mCtx.fillRect(0, 0, 256, 256);
    
    // Các vết tối trên mặt trăng (maria)
    mCtx.fillStyle = 'rgba(150, 140, 120, 0.25)';
    mCtx.beginPath(); mCtx.arc(100, 90, 25, 0, Math.PI * 2); mCtx.fill();
    mCtx.beginPath(); mCtx.arc(160, 130, 18, 0, Math.PI * 2); mCtx.fill();
    mCtx.beginPath(); mCtx.arc(120, 170, 30, 0, Math.PI * 2); mCtx.fill();
    mCtx.fillStyle = 'rgba(130, 120, 100, 0.15)';
    mCtx.beginPath(); mCtx.arc(80, 140, 20, 0, Math.PI * 2); mCtx.fill();
    
    const moonTex = new THREE.CanvasTexture(moonCanvas);
    const moonMat = new THREE.MeshBasicMaterial({ map: moonTex, fog: false });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonGroup.add(moonMesh);

    // Hào quang vầng trăng tỏa sáng dịu mát
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 128;
    glowCanvas.height = 128;
    const gCtx = glowCanvas.getContext('2d');
    const gGrad = gCtx.createRadialGradient(64, 64, 12, 64, 64, 64);
    gGrad.addColorStop(0, 'rgba(255, 248, 230, 0.9)');
    gGrad.addColorStop(0.3, 'rgba(230, 220, 255, 0.4)');
    gGrad.addColorStop(0.6, 'rgba(200, 180, 255, 0.15)');
    gGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    gCtx.fillStyle = gGrad;
    gCtx.fillRect(0, 0, 128, 128);

    const glowTex = new THREE.CanvasTexture(glowCanvas);
    const glowMat = new THREE.SpriteMaterial({
      map: glowTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.85,
      fog: false
    });
    const glowSprite = new THREE.Sprite(glowMat);
    glowSprite.scale.set(24, 24, 1);
    moonGroup.add(glowSprite);

    this.scene.add(moonGroup);
    this.moon = moonGroup;
  }

  /**
   * Tinh vân Nebula mềm mại trên bầu trời
   */
  createNebulaClouds() {
    const nebulaCount = 6;
    const colors = [
      [255, 100, 140, 0.08],
      [100, 140, 255, 0.06],
      [200, 120, 255, 0.05],
      [255, 180, 100, 0.04],
      [120, 200, 255, 0.05],
      [255, 150, 200, 0.06]
    ];

    colors.forEach((col, i) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      
      const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
      grad.addColorStop(0, `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${col[3] * 2})`);
      grad.addColorStop(0.4, `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${col[3]})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0.7,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      
      const theta = (i / nebulaCount) * Math.PI * 2 + Math.random() * 0.5;
      const phi = Math.random() * 0.8;
      const r = 50 + Math.random() * 20;
      sprite.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi) + 10,
        r * Math.sin(phi) * Math.sin(theta)
      );
      sprite.scale.set(25 + Math.random() * 15, 25 + Math.random() * 15, 1);
      this.scene.add(sprite);
    });
  }

  createShootingStar() {
    const lineGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(6);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      linewidth: 2
    });

    this.shootingStar = new THREE.Line(lineGeo, lineMat);
    this.scene.add(this.shootingStar);
    this.starStart = new THREE.Vector3();
    this.starEnd = new THREE.Vector3();
    this.starProgress = 0;
  }

  triggerShootingStar() {
    this.shootingStarActive = true;
    this.starProgress = 0;
    
    const startX = (Math.random() - 0.5) * 30;
    const startY = 25 + Math.random() * 15;
    const startZ = (Math.random() - 0.5) * 30;
    this.starStart.set(startX, startY, startZ);

    this.starEnd.set(
      startX + (Math.random() - 0.5) * 20,
      startY - 6 - Math.random() * 6,
      startZ + (Math.random() - 0.5) * 20
    );
  }

  update(delta) {
    this.time += delta;

    // Xoay nhẹ bầu trời sao
    if (this.skyDome) {
      this.skyDome.rotation.y += delta * 0.003;
    }

    if (this.stars) {
      this.stars.rotation.y += delta * 0.004;
      this.stars.material.opacity = 0.82 + Math.sin(this.time * 2.8) * 0.14;
    }

    // Sao băng định kỳ
    if (this.shootingStar) {
      if (!this.shootingStarActive && this.time > this.nextShootingStarTime) {
        this.triggerShootingStar();
        this.nextShootingStarTime = this.time + 8 + Math.random() * 10;
      }

      if (this.shootingStarActive) {
        this.starProgress += delta * 1.5;
        if (this.starProgress >= 1.0) {
          this.shootingStarActive = false;
          this.shootingStar.material.opacity = 0;
        } else {
          const currentHead = new THREE.Vector3().lerpVectors(this.starStart, this.starEnd, this.starProgress);
          const currentTail = new THREE.Vector3().lerpVectors(this.starStart, this.starEnd, Math.max(0, this.starProgress - 0.25));
          
          const pos = this.shootingStar.geometry.attributes.position.array;
          pos[0] = currentHead.x;
          pos[1] = currentHead.y;
          pos[2] = currentHead.z;
          pos[3] = currentTail.x;
          pos[4] = currentTail.y;
          pos[5] = currentTail.z;
          this.shootingStar.geometry.attributes.position.needsUpdate = true;
          
          this.shootingStar.material.opacity = Math.sin(this.starProgress * Math.PI) * 0.9;
        }
      }
    }
  }
}
