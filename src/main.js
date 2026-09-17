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

    // Renderer tương thích tối đa cho cả PC & Điện thoại
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 1.75));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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
    this.sky = new SkyScene(this.scene);

    // 2. Phòng tiệc có mái vòm kính giếng trời ngắm sao & đèn đom đóm
    this.room = new RoomScene(this.scene);

    // 3. Bàn tiệc có khăn trải bàn, đĩa, dao nĩa, cánh hoa hồng, lá thư tay
    this.tableItems = new TableItems(this.scene, () => {
      this.controls.exitLock();
      this.showCursor();
      this.modals.openLetterModal();
    });

    // 4. Bánh kem sinh nhật (thổi nến + pháo hoa)
    this.cake = new BirthdayCake(this.scene, () => {
      this.modals.showCelebrationBanner();
    });

    // 5. Hộp nhạc / Máy đĩa than cổ điển (Chỉ bật tắt trực tiếp tại hộp nhạc)
    this.vinylPlayer = new VinylPlayer(this.scene);

    // 6. Hệ thống 20 khung tranh kỷ niệm quanh phòng
    this.gallery = new PhotoGallery(this.scene, BIRTHDAY_CONFIG.memories, (photoIndex) => {
      this.controls.exitLock();
      this.showCursor();
      this.modals.openPhotoModal(photoIndex);
    });
  }

  /**
   * Gom danh sách vật thể tương tác để Raycaster chạy nhanh
   */
  collectInteractiveTargets() {
    this.interactiveTargets = [];

    if (this.gallery && this.gallery.frames) {
      this.gallery.frames.forEach(f => {
        if (f.canvasMesh) this.interactiveTargets.push(f.canvasMesh);
      });
    }

    setTimeout(() => {
      this.scene.traverse((obj) => {
        if (obj.userData && obj.userData.interactive && !this.interactiveTargets.includes(obj)) {
          this.interactiveTargets.push(obj);
        }
      });
    }, 1500);
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

    // Hàm kiểm tra va chạm tương tác với toàn bộ mô hình trong phòng
    const getHitInteractive = (ptr) => {
      this.raycaster.setFromCamera(ptr, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);

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

    let currentPercent = 0;
    const stages = [
      { target: 25, status: "Đang mở thiệp mời & khởi tạo không gian..." },
      { target: 55, status: "Đang bày biện bàn tiệc & thắp nến lung linh..." },
      { target: 80, status: "Đang mở dải ngân hà & ngàn vì sao đêm..." },
      { target: 95, status: "Đang tối ưu hóa đồ họa 3D ổn định..." },
      { target: 100, status: "Sẵn sàng đón Kiều vào phòng tiệc... ✨" }
    ];

    let stageIndex = 0;
    const updateInterval = setInterval(() => {
      if (stageIndex >= stages.length) {
        clearInterval(updateInterval);
        return;
      }

      const currentStage = stages[stageIndex];
      if (currentPercent < currentStage.target) {
        currentPercent += Math.floor(Math.random() * 4) + 2;
        if (currentPercent > currentStage.target) currentPercent = currentStage.target;

        if (progressBar) progressBar.style.width = `${currentPercent}%`;
        if (percentText) percentText.textContent = `${currentPercent}%`;
        if (statusText) statusText.textContent = currentStage.status;
      } else {
        stageIndex++;
      }

      // Khi đạt 95% - biên dịch trước toàn bộ shader và render thử 2 frame để chống giật
      if (currentPercent >= 95 && !this.sceneStabilized) {
        this.sceneStabilized = true;
        try {
          if (this.renderer && this.scene && this.camera) {
            this.renderer.compile(this.scene, this.camera);
            this.renderer.render(this.scene, this.camera);
          }
        } catch (e) {}
      }

      // Khi đạt 100% - giữ 650ms cho người dùng thưởng thức trọn vẹn thiệp mời rồi tự động vào phòng
      if (currentPercent >= 100 && !this.enterTriggered) {
        this.enterTriggered = true;
        clearInterval(updateInterval);
        setTimeout(() => {
          this.enterExperience();
        }, 650);
      }
    }, 45);
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

    const delta = this.clock.getDelta();
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

    // 3. Kiểm tra hover (tối ưu tiết kiệm CPU)
    this.checkHoverInteractions(elapsedTime);

    // 4. Render khung hình
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new BirthdayApp();
});
