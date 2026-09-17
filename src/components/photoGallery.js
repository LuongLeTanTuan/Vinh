import * as THREE from 'three';

/**
 * PhotoGallery: Hệ thống 20 khung tranh mạ vàng sang trọng phân bố 360° quanh căn phòng
 * - Phòng 6m x 6m (bán kính tường 3m)
 * - Ảnh treo sát tường với đèn rọi riêng cho từng bức
 */
export class PhotoGallery {
  constructor(scene, memories, onPhotoClick, loadingManager = null) {
    this.scene = scene;
    this.memories = memories;
    this.onPhotoClick = onPhotoClick;
    this.loadingManager = loadingManager;

    this.frames = [];
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);

    this.createAllFrames();
  }

  createAllFrames() {
    // Kích thước khung tranh chuẩn mỹ thuật (tỉ lệ 4:5 đứng)
    const frameWidth = 0.58;
    const frameHeight = 0.72;

    const halfW = 2.97; // Sát tường trái/phải
    const halfL = 2.97; // Sát tường trước/sau

    // Tọa độ bài trí 16 khung tranh tương ứng 16 ảnh duy nhất từ Google Drive (không lặp lại):
    const positions = [
      // 1. TƯỜNG TRÁI (x = -halfW): 4 tranh hai bên cửa sổ ngắm sao
      { x: -halfW, y: 2.05, z: -1.95, rotY: Math.PI / 2 }, // Photo 1 (trên trái)
      { x: -halfW, y: 1.30, z: -1.95, rotY: Math.PI / 2 }, // Photo 2 (dưới trái)
      { x: -halfW, y: 2.05, z: 1.95, rotY: Math.PI / 2 },  // Photo 3 (trên phải)
      { x: -halfW, y: 1.30, z: 1.95, rotY: Math.PI / 2 },  // Photo 4 (dưới phải)

      // 2. TƯỜNG PHẢI (x = +halfW): 4 tranh hai bên cửa sổ ngắm sao
      { x: halfW, y: 2.05, z: -1.95, rotY: -Math.PI / 2 }, // Photo 5 (trên trái)
      { x: halfW, y: 1.30, z: -1.95, rotY: -Math.PI / 2 }, // Photo 6 (dưới trái)
      { x: halfW, y: 2.05, z: 1.95, rotY: -Math.PI / 2 },  // Photo 7 (trên phải)
      { x: halfW, y: 1.30, z: 1.95, rotY: -Math.PI / 2 },  // Photo 8 (dưới phải)

      // 3. TƯỜNG TRƯỚC (z = -halfL): 4 tranh danh dự bố trí hàng ngang trang trọng ở độ cao mắt ngắm
      { x: -1.8, y: 1.70, z: -halfL, rotY: 0 },           // Photo 9
      { x: -0.6, y: 1.70, z: -halfL, rotY: 0 },           // Photo 10
      { x: 0.6, y: 1.70, z: -halfL, rotY: 0 },            // Photo 11
      { x: 1.8, y: 1.70, z: -halfL, rotY: 0 },            // Photo 12

      // 4. TƯỜNG SAU (z = +halfL): 4 tranh tường danh dự (Grand Gallery Wall)
      { x: -1.8, y: 1.70, z: halfL, rotY: Math.PI },       // Photo 13
      { x: -0.6, y: 1.70, z: halfL, rotY: Math.PI },       // Photo 14
      { x: 0.6, y: 1.70, z: halfL, rotY: Math.PI },        // Photo 15
      { x: 1.8, y: 1.70, z: halfL, rotY: Math.PI }         // Photo 16
    ];

    // Vật liệu khung mạ vàng cổ điển
    const frameBorderMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.88,
      roughness: 0.22
    });

    // Vật liệu đệm passepartout (viền trắng bên trong khung)
    const passepartoutMat = new THREE.MeshStandardMaterial({
      color: 0xf5f0e8,
      roughness: 0.9,
      metalness: 0.0
    });

    positions.forEach((pos, index) => {
      const memory = this.memories[index] || {
        id: index + 1,
        image: `/images/friends/photo_${index + 1}.jpg`
      };

      const imageUrl = memory.image;

      const frameGroup = new THREE.Group();
      frameGroup.position.set(pos.x, pos.y, pos.z);
      frameGroup.rotation.y = pos.rotY;

      // 1. Viền ngoài khung tranh (outer frame)
      const borderThickness = 0.04;
      const outerBorderGeo = new THREE.BoxGeometry(frameWidth, frameHeight, 0.035);
      const outerBorder = new THREE.Mesh(outerBorderGeo, frameBorderMat);
      outerBorder.castShadow = true;
      frameGroup.add(outerBorder);

      // 2. Viền passepartout trắng bên trong
      const passGeo = new THREE.PlaneGeometry(frameWidth - borderThickness * 2, frameHeight - borderThickness * 2);
      const pass = new THREE.Mesh(passGeo, passepartoutMat);
      pass.position.z = 0.018;
      frameGroup.add(pass);

      // 3. Mặt tranh (Canvas Image)
      const canvasWidth = frameWidth - borderThickness * 2 - 0.04;
      const canvasHeight = frameHeight - borderThickness * 2 - 0.04;
      const canvasGeo = new THREE.PlaneGeometry(canvasWidth, canvasHeight);

      // Nạp texture ảnh kỷ niệm từ Google Drive
      const texture = this.textureLoader.load(imageUrl);
      texture.colorSpace = THREE.SRGBColorSpace;

      const canvasMat = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.FrontSide
      });

      const canvasMesh = new THREE.Mesh(canvasGeo, canvasMat);
      canvasMesh.position.z = 0.019;
      frameGroup.add(canvasMesh);

      // Gán dữ liệu tương tác cho raycaster
      canvasMesh.userData = {
        interactive: true,
        type: 'photo',
        photoIndex: index,
        hint: `Ảnh kỷ niệm #${index + 1} (Nhấp để phóng to ✨)`
      };
      outerBorder.userData = canvasMesh.userData;
      outerBorder.userData = canvasMesh.userData;

      // 4. Đèn rọi tranh mini gắn phía trên kiểu gallery
      const lampBodyGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.22, 16);
      const lampBody = new THREE.Mesh(lampBodyGeo, frameBorderMat);
      lampBody.rotation.z = Math.PI / 2;
      lampBody.position.set(0, frameHeight / 2 + 0.08, 0.08);
      frameGroup.add(lampBody);

      // Bóng đèn rọi nhỏ
      const bulbGeo = new THREE.SphereGeometry(0.02, 12, 12);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffecd2 });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(0, frameHeight / 2 + 0.06, 0.14);
      frameGroup.add(bulb);

      // Ánh sáng rọi tranh vàng dịu
      const spotLight = new THREE.PointLight(0xffecd2, 0.5, 1.5, 1.8);
      spotLight.position.set(0, frameHeight / 2 + 0.06, 0.14);
      frameGroup.add(spotLight);

      this.scene.add(frameGroup);
      this.frames.push({
        group: frameGroup,
        canvasMesh: canvasMesh,
        index: index
      });
    });
  }
}
