import * as THREE from 'three';
import { CameraControls } from './controls/cameraControls.js';
import { SkyScene } from './scene/sky.js';
import { RoomScene } from './scene/room.js';
import { TableItems } from './components/tableItems.js';
import { BirthdayCake } from './components/cake.js';
import { VinylPlayer } from './components/vinylPlayer.js';
import { PhotoGallery } from './components/photoGallery.js';
import { ModalManager } from './ui/modal.js';
import { BIRTHDAY_CONFIG } from './config.js';

class BirthdayApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();

    // Raycaster chuẩn tâm ngắm FPS (Crosshair Center Aim)
    this.raycaster = new THREE.Raycaster();
    this.centerPointer = new THREE.Vector2(0, 0); // Luôn ngắm đúng tâm màn hình (0, 0)
    this.interactiveTargets = [];
    this.lastHoverCheckTime = 0;

    // DOM UI Elements
    this.reticle = document.getElementById('interaction-reticle');
    this.loadingScreen = document.getElementById('loading-screen');

    // Ẩn con trỏ chuột mặc định trong trải nghiệm 3D
    this.cursorHidden = false;

    // Quản lý thời gian chờ 10s không thao tác
    this.idleSeconds = 0;
    this.isIdle = false;

    this.initThree();
    this.setupLoadingManager();
    this.initSceneComponents();
    this.collectInteractiveTargets();
    this.initInteractions();
    this.setupIdleDetection();
    this.setupLoadingProgress();
    this.setupKeyboardShortcuts();

    // Lắng nghe trạng thái khóa chuột FPS
    this.controls.onPointerLockChange = (isLocked) => {
      // Tự do khám phá không gian 3D
    };

    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.animate();
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0c16, 0.015);

    this.camera = new THREE.PerspectiveCamera(
      68,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );

    // Renderer cao cấp: Bật khử răng cưa (Antialiasing) & Độ phân giải sắc nét chuẩn Retina
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    this.isMobile = isMobile;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true, // Bật khử răng cưa phần cứng (MSAA) để viền sắc nét, mịn màng
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // Độ phân giải sắc nét chuẩn Retina trên iPhone/Android (1.65), khử sạch hiện tượng răng cưa
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.65 : 1.75));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Trên điện thoại: chỉ tính toán bóng đổ 1 lần duy nhất (bake), tắt auto-update để giữ cứng 60-90 FPS
    if (isMobile) {
      this.renderer.shadowMap.autoUpdate = true; // Bật để render tính toán bóng đổ trong màn hình loading
      this.renderer.shadowMap.needsUpdate = true;
    }

    // Ngăn chặn lỗi mất ngữ cảnh WebGL trên thiết bị di động
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('WebGL context lost, waiting for restoration...');
    }, false);
    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored');
    }, false);

    this.container.appendChild(this.renderer.domElement);

    this.controls = new CameraControls(this.camera, this.renderer.domElement);
  }

  setupLoadingManager() {
    this.loadingManager = new THREE.LoadingManager();
    this.isAssetsLoaded = false;
    this.targetProgress = 12;

    this.loadingManager.onProgress = (url, loaded, total) => {
      const pct = Math.min(97, Math.max(15, Math.round((loaded / total) * 100)));
      if (pct > this.targetProgress) {
        this.targetProgress = pct;
      }
    };

    this.loadingManager.onLoad = () => {
      this.isAssetsLoaded = true;
      this.targetProgress = 100;
      this.collectInteractiveTargets();

      // PRE-WARM WebGL: Biên dịch trước toàn bộ shaders & tải trước texture vào VRAM GPU
      try {
        if (this.renderer && this.scene && this.camera) {
          this.renderer.compile(this.scene, this.camera);
          if (this.isMobile) {
            this.renderer.shadowMap.needsUpdate = true;
          }
          this.renderer.render(this.scene, this.camera);
          this.renderer.render(this.scene, this.camera);
          if (this.isMobile) {
            this.renderer.shadowMap.autoUpdate = false;
          }
        }
      } catch (e) {
        console.warn('Pre-warm error:', e);
      }
    };

    this.loadingManager.onError = (url) => {
      console.warn('Lỗi nạp tài nguyên:', url);
    };

    // Timeout dự phòng bảo đảm không bao giờ bị kẹt trên mobile
    setTimeout(() => {
      if (!this.isAssetsLoaded) {
        this.isAssetsLoaded = true;
        this.targetProgress = 100;
        this.collectInteractiveTargets();
        try {
          if (this.renderer && this.scene && this.camera) {
            this.renderer.compile(this.scene, this.camera);
            this.renderer.render(this.scene, this.camera);
            if (this.isMobile) this.renderer.shadowMap.autoUpdate = false;
          }
        } catch (e) {}
      }
    }, 7000);
  }

  initSceneComponents() {
    this.modals = new ModalManager(BIRTHDAY_CONFIG);
    this.modals.onModalOpen = () => {
      this.controls.freeze();
      this.showCursor();
    };
    this.modals.onModalClose = () => {
      this.controls.unfreeze(300);
    };

    // 1. Bầu trời sao trên đầu & sao băng (dùng texture thật)
    this.sky = new SkyScene(this.scene, this.loadingManager);

    // 2. Phòng tiệc có mái vòm kính giếng trời ngắm sao & đèn đom đóm
    this.room = new RoomScene(this.scene, this.loadingManager);

    // 3. Bàn tiệc có khăn trải bàn, đĩa, dao nĩa, cánh hoa hồng, lá thư tay
    this.tableItems = new TableItems(this.scene, () => {
      this.controls.exitLock();
      this.showCursor();
      this.modals.openLetterModal();
    }, this.loadingManager);

    // 4. Bánh kem sinh nhật (thổi nến + pháo hoa)
    this.cake = new BirthdayCake(this.scene, () => {
      this.modals.showCelebrationBanner();
    }, this.loadingManager);

    // 5. Hộp nhạc / Máy đĩa than cổ điển (Chỉ bật tắt trực tiếp tại hộp nhạc)
    this.vinylPlayer = new VinylPlayer(this.scene, null, this.loadingManager);

    // 6. Hệ thống 16 khung tranh kỷ niệm quanh phòng
    this.gallery = new PhotoGallery(this.scene, BIRTHDAY_CONFIG.memories, (photoIndex) => {
      this.controls.exitLock();
      this.showCursor();
      this.modals.openPhotoModal(photoIndex);
    }, this.loadingManager);
  }

  /**
   * Gom danh sách vật thể tương tác để Raycaster chạy nhanh
   */
  collectInteractiveTargets() {
    this.interactiveTargets = [];

    if (this.gallery && this.gallery.frames) {
      this.gallery.frames.forEach(f => {
        if (f.canvasMesh && !this.interactiveTargets.includes(f.canvasMesh)) {
          this.interactiveTargets.push(f.canvasMesh);
        }
      });
    }

    this.scene.traverse((obj) => {
      if (obj.userData && obj.userData.interactive && !this.interactiveTargets.includes(obj)) {
        this.interactiveTargets.push(obj);
      }
    });
  }

  initInteractions() {
    // Click vào thanh gợi ý để kích hoạt khóa chuột 360°
    if (this.fpsLockHint) {
      this.fpsLockHint.addEventListener('click', (e) => {
        e.stopPropagation();
        this.controls.requestLock();
      });
    }

    // Nhấp chuột bất kỳ đâu trên màn hình để khóa góc nhìn FPS xoay 360°
    window.addEventListener('click', (e) => {
      if (this.modals.isAnyModalOpen()) return;
      if (this.loadingScreen && !this.loadingScreen.classList.contains('hidden')) return;
      if (e.target.closest('.modal-close-btn') || e.target.closest('.nav-btn')) return;

      this.controls.requestLock();
    });

    // Hàm kiểm tra va chạm tương tác siêu tốc (chỉ quét các vật thể có tương tác)
    const getHitInteractive = (ptr) => {
      this.raycaster.setFromCamera(ptr, this.camera);
      const searchTargets = (this.interactiveTargets && this.interactiveTargets.length > 0)
        ? this.interactiveTargets
        : this.scene.children;
      const intersects = this.raycaster.intersectObjects(searchTargets, true);

      for (const hit of intersects) {
        let obj = hit.object;
        while (obj && !obj.userData?.interactive && obj.parent) {
          obj = obj.parent;
        }
        if (obj && obj.userData && obj.userData.interactive) {
          return obj.userData;
        }
      }
      return null;
    };

    // Xử lý nhấp chuột & chạm cảm ứng trên điện thoại
    const handleActionAt = (clientX, clientY) => {
      if (this.modals.isAnyModalOpen()) return;

      const mousePointer = new THREE.Vector2(
        (clientX / window.innerWidth) * 2 - 1,
        -(clientY / window.innerHeight) * 2 + 1
      );

      // Thử bắn tia từ tọa độ chạm trước
      let uData = getHitInteractive(mousePointer);
      // Nếu không trúng (hoặc đang dùng tâm ngắm), thử bắn tia từ tâm màn hình (0, 0)
      if (!uData) {
        uData = getHitInteractive(this.centerPointer);
      }

      if (uData) {
        const type = uData.type;

        if (type === 'photo') {
          this.controls.exitLock();
          this.showCursor();
          this.modals.openPhotoModal(uData.photoIndex);
        } else if (type === 'cake') {
          this.cake.blowOut();
        } else if (type === 'turntable') {
          this.vinylPlayer.toggle();
        } else if (type === 'letter') {
          this.controls.exitLock();
          this.showCursor();
          this.modals.openLetterModal();
        }
      }
    };

    this.renderer.domElement.addEventListener('click', (e) => {
      handleActionAt(e.clientX, e.clientY);
    });

    // Hỗ trợ chạm nhanh (tap) trên điện thoại không bị delay
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    this.renderer.domElement.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    }, { passive: true });

    this.renderer.domElement.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const dist = Math.hypot(e.changedTouches[0].clientX - touchStartX, e.changedTouches[0].clientY - touchStartY);
        const duration = Date.now() - touchStartTime;
        // Nếu nhấp nhẹ dưới 250ms và không vuốt di chuyển xa -> xem như cú chạm tương tác (tap)
        if (dist < 15 && duration < 300) {
          handleActionAt(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        }
      }
    }, { passive: true });
  }

  /**
   * Phím tắt bàn phím: F11 toàn màn hình
   */
  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        this.toggleFullscreen();
      }
    });
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  /**
   * Ẩn con trỏ chuột khi vào trải nghiệm 3D
   */
  hideCursor() {
    this.cursorHidden = true;
    document.body.classList.add('cursor-hidden');
  }

  showCursor() {
    this.cursorHidden = false;
    document.body.classList.remove('cursor-hidden');
  }

  /**
   * Theo dõi tương tác người dùng: nếu 10s không thao tác thì kích hoạt mũi tên chỉ dẫn
   */
  setupIdleDetection() {
    const onActivity = () => this.resetIdle();
    window.addEventListener('mousemove', onActivity, { passive: true });
    window.addEventListener('mousedown', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity, { passive: true });
    window.addEventListener('touchstart', onActivity, { passive: true });
    window.addEventListener('touchmove', onActivity, { passive: true });
    window.addEventListener('wheel', onActivity, { passive: true });
  }

  resetIdle() {
    this.idleSeconds = 0;
    if (this.isIdle) {
      this.isIdle = false;
      if (this.tableItems) {
        this.tableItems.setIdle(false);
      }
    }
  }

  setupLoadingProgress() {
    const progressBar = document.getElementById('loading-progress-bar');
    const percentText = document.getElementById('loading-percent');
    const statusText = document.getElementById('loading-status-text');

    let currentDisplay = 0;
    this.enterTriggered = false;

    const tickProgress = () => {
      if (this.enterTriggered) return;

      // Bước tiến mượt mà hướng về targetProgress thực tế từ LoadingManager
      if (currentDisplay < this.targetProgress) {
        const delta = this.targetProgress - currentDisplay;
        // Tốc độ thích ứng: lướt nhanh khi còn cách xa, lướt êm dịu khi tiệm cận
        const step = Math.max(0.5, delta * 0.14);
        currentDisplay = Math.min(this.targetProgress, currentDisplay + step);
      }

      const displayInt = Math.min(100, Math.floor(currentDisplay));
      if (progressBar) progressBar.style.width = `${displayInt}%`;
      if (percentText) percentText.textContent = `${displayInt}%`;

      if (statusText) {
        if (displayInt < 25) {
          statusText.textContent = "Đang mở thiệp mời & khởi tạo không gian...";
        } else if (displayInt < 60) {
          statusText.textContent = "Đang tải 16 bức ảnh kỷ niệm & dải ngân hà...";
        } else if (displayInt < 85) {
          statusText.textContent = "Đang bày biện bàn tiệc & thắp nến lung linh...";
        } else if (displayInt < 100) {
          statusText.textContent = "Đang tối ưu hóa đồ họa 3D siêu mượt mà...";
        } else {
          statusText.textContent = "Sẵn sàng đón Kiều vào phòng tiệc... ✨";
        }
      }

      // Chỉ khi ĐÃ LOAD ĐỦ 100% TÀI NGUYÊN THỰC TẾ & ĐÃ BIÊN DỊCH SHADER
      if (displayInt >= 100 && this.isAssetsLoaded && !this.enterTriggered) {
        this.enterTriggered = true;
        if (progressBar) progressBar.style.width = '100%';
        if (percentText) percentText.textContent = '100%';
        if (statusText) statusText.textContent = "Sẵn sàng đón Kiều vào phòng tiệc... ✨";

        // Tạm dừng 450ms cho người dùng thưởng thức trọn vẹn thông báo trước khi vào phòng
        setTimeout(() => {
          this.enterExperience();
        }, 450);
        return;
      }

      requestAnimationFrame(tickProgress);
    };

    requestAnimationFrame(tickProgress);
  }

  enterExperience() {
    if (!this.loadingScreen || this.loadingScreen.classList.contains('hidden')) return;
    this.loadingScreen.classList.add('hidden');

    // Ẩn con trỏ chuột khi bước vào trải nghiệm (nếu là PC)
    this.hideCursor();

    // Thử yêu cầu khóa chuột nếu trình duyệt hỗ trợ
    try {
      this.controls.requestLock();
    } catch (e) {}

    // Ẩn hoàn toàn loading screen khỏi DOM sau khi mờ dần để không che cảm ứng
    setTimeout(() => {
      if (this.loadingScreen) {
        this.loadingScreen.style.display = 'none';
      }
    }, 1100);
  }

  /**
   * Kiểm tra hover vật thể ngay tại tâm ngắm màn hình (12 lần/giây để tối ưu CPU)
   */
  checkHoverInteractions(now) {
    if (now - this.lastHoverCheckTime < 0.08) return;
    this.lastHoverCheckTime = now;

    if (this.modals.isAnyModalOpen()) {
      if (this.reticle) this.reticle.classList.remove('hovered');
      if (this.hintBadge) this.hintBadge.classList.remove('visible');
      // Hiện trỏ chuột khi modal mở và mở khóa chuột
      if (this.cursorHidden) this.showCursor();
      this.controls.exitLock();
      return;
    }

    // Ẩn trỏ chuột khi ở trong phòng 3D
    if (!this.cursorHidden && this.loadingScreen.classList.contains('hidden')) {
      this.hideCursor();
    }

    // Luôn bắn tia từ đúng tâm ngắm FPS (0, 0)
    this.raycaster.setFromCamera(this.centerPointer, this.camera);
    const targets = this.interactiveTargets.length > 0 ? this.interactiveTargets : this.scene.children;
    const intersects = this.raycaster.intersectObjects(targets, true);

    let targetInteractive = null;
    for (const hit of intersects) {
      let obj = hit.object;
      while (obj && !obj.userData?.interactive && obj.parent) {
        obj = obj.parent;
      }
      if (obj && obj.userData && obj.userData.interactive) {
        targetInteractive = obj;
        break;
      }
    }

    if (this.reticle) {
      this.reticle.classList.toggle('hovered', !!targetInteractive);
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const delta = Math.min(this.clock.getDelta(), 0.05);
    const elapsedTime = this.clock.getElapsedTime();

    // Cập nhật thời gian chờ 10s: nếu không có thao tác gì thì kích hoạt mũi tên chỉ chỉ
    if (!this.modals.isAnyModalOpen() && this.loadingScreen && this.loadingScreen.classList.contains('hidden')) {
      this.idleSeconds += delta;
      if (this.idleSeconds >= 10 && !this.isIdle) {
        this.isIdle = true;
        if (this.tableItems) {
          this.tableItems.setIdle(true);
        }
      }
    } else {
      this.resetIdle();
    }

    // 1. Cập nhật góc nhìn camera 360° (truyền delta để hỗ trợ cả xoay bằng phím A/D/WASD)
    if (!this.modals.isAnyModalOpen()) {
      this.controls.update(delta);
    }

    // 2. Cập nhật các thành phần 3D
    if (this.sky) this.sky.update(delta);
    if (this.room) this.room.update(delta);
    if (this.cake) this.cake.update(delta);
    if (this.tableItems) this.tableItems.update(delta);
    if (this.vinylPlayer) this.vinylPlayer.update(delta);

    // 3. Kiểm tra hover (chỉ chạy trên PC có chuột, bỏ qua trên di động để tối ưu 60-90 FPS)
    if (!this.controls.isTouchDevice) {
      this.checkHoverInteractions(elapsedTime);
    }

    // 4. Render khung hình
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new BirthdayApp();
});
