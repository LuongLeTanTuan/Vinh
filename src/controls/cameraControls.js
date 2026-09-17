import * as THREE from 'three';

/**
 * CameraControls: Điều khiển góc nhìn 360° chuẩn game FPS
 * - Khóa chuột vô tận (Pointer Lock) xoay 360° không giới hạn biên màn hình
 * - Hỗ trợ kéo rê chuột (drag) và di chuột tự do
 * - Hỗ trợ phím bàn phím A/D hoặc Mũi tên Trái/Phải để xoay 360° mượt mà
 * - Phím W/S hoặc Mũi tên Lên/Xuống nhìn lên giếng trời sao hoặc nhìn xuống bàn tiệc
 * - Cảm ứng vuốt chạm liên tục trên điện thoại & Cảm biến con quay (Gyroscope)
 */
export class CameraControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Vị trí ngồi tự nhiên trước bàn tiệc sinh nhật (ấm cúng, vừa vặn tầm mắt)
    this.sittingPosition = new THREE.Vector3(0, 1.22, 0.46);
    this.camera.position.copy(this.sittingPosition);

    // Góc nhìn ban đầu: nhìn tự nhiên vào bàn tiệc lung linh và bánh kem
    this.lon = 0;
    this.lat = -12; // Nhìn tự nhiên bao quát bàn tiệc và bức thư tình
    this.targetLon = 0;
    this.targetLat = -12;
    this.lerpSpeed = 0.2; // Phản hồi nhanh và cực kỳ mượt mà
    this.sensitivity = 0.22; // Độ nhạy chuẩn game FPS

    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    this.isPointerLocked = false;
    this.isMouseDown = false;
    this.lastMouseX = undefined;
    this.lastMouseY = undefined;

    // Phím bàn phím A/D/W/S và Mũi tên
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false
    };

    // Cảm ứng di động
    this.touchLastX = 0;
    this.touchLastY = 0;
    this.isTouching = false;

    // Cảm biến con quay (Gyroscope)
    this.gyroEnabled = false;
    this.gyroOffsetLon = 0;
    this.gyroOffsetLat = 0;

    this.isFrozen = false;
    this.freezeTimeout = null;

    // Callback khi trạng thái pointer lock thay đổi
    this.onPointerLockChange = null;

    this.initEvents();
  }

  freeze() {
    this.isFrozen = true;
    this.lastMouseX = undefined;
    this.lastMouseY = undefined;
    if (this.freezeTimeout) clearTimeout(this.freezeTimeout);
  }

  unfreeze(delayMs = 250) {
    this.lastMouseX = undefined;
    this.lastMouseY = undefined;
    if (this.freezeTimeout) clearTimeout(this.freezeTimeout);
    this.freezeTimeout = setTimeout(() => {
      this.isFrozen = false;
      this.lastMouseX = undefined;
      this.lastMouseY = undefined;
    }, delayMs);
  }

  initEvents() {
    // 1. Máy tính: Điều khiển camera bằng chuột
    window.addEventListener('mousemove', this.onMouseMove.bind(this), { passive: true });
    window.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));

    // Pointer Lock theo dõi trạng thái khóa trỏ chuột
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === this.domElement || document.pointerLockElement === document.body);
      this.lastMouseX = undefined;
      this.lastMouseY = undefined;
      // Tránh giật chuột khi trình duyệt gom chuột về tâm
      this.isFrozen = true;
      setTimeout(() => {
        this.isFrozen = false;
        this.lastMouseX = undefined;
        this.lastMouseY = undefined;
      }, 120);

      if (this.onPointerLockChange) {
        this.onPointerLockChange(this.isPointerLocked);
      }
    });

    // 2. Bàn phím: WASD hoặc Phím mũi tên xoay 360 độ
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));

    // 3. Di động: Cảm ứng chạm vuốt
    this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    window.addEventListener('touchend', this.onTouchEnd.bind(this));
    window.addEventListener('touchcancel', this.onTouchEnd.bind(this));

    // 4. Cảm biến con quay
    this.onDeviceOrientation = this.handleOrientation.bind(this);
  }

  requestLock() {
    if (this.isTouchDevice) return;
    const target = this.domElement || document.body;
    try {
      if (target.requestPointerLock) {
        target.requestPointerLock();
      } else if (document.body.requestPointerLock) {
        document.body.requestPointerLock();
      }
    } catch (e) {
      console.warn('Lỗi xin quyền Pointer Lock:', e);
    }
  }

  exitLock() {
    if (document.exitPointerLock && document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  onMouseDown(event) {
    if (event.button === 0) { // Chuột trái
      this.isMouseDown = true;
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    }
  }

  onMouseUp() {
    this.isMouseDown = false;
    this.lastMouseX = undefined;
    this.lastMouseY = undefined;
  }

  onMouseMove(event) {
    // Nếu đang mở bất kỳ modal nào (ảnh, thư, banner...), đóng băng camera ngay lập tức
    if (this.isFrozen ||
        document.querySelector('.modal.active') ||
        document.querySelector('.photo-modal.active') ||
        document.querySelector('.letter-modal.active') ||
        document.querySelector('#photo-modal.active') ||
        document.querySelector('#letter-modal.active')) {
      this.lastMouseX = undefined;
      this.lastMouseY = undefined;
      return;
    }

    if (this.isTouchDevice && event.sourceCapabilities?.firesTouchEvents) return;

    let movementX = event.movementX;
    let movementY = event.movementY;

    // Trường hợp 1: Đang khóa chuột chuẩn game FPS
    if (this.isPointerLocked) {
      if (movementX !== undefined && movementY !== undefined && (movementX !== 0 || movementY !== 0)) {
        // Bỏ qua delta bất thường do trình duyệt đổi trạng thái
        if (Math.abs(movementX) < 250 && Math.abs(movementY) < 250) {
          this.targetLon += movementX * this.sensitivity;
          this.targetLat -= movementY * this.sensitivity;
        }
      }
    } else {
      // Trường hợp 2: Khi KHÔNG khóa chuột -> CHỈ XOAY KHI NGƯỜI DÙNG NHẤN GIỮ KÉO (DRAG)!
      // Tuyệt đối KHÔNG xoay camera khi di chuột rê tự do (để người dùng thoải mái bấm nút UI mà không bị lệch cam)
      if (this.isMouseDown) {
        const currentX = event.clientX;
        const currentY = event.clientY;

        if (this.lastMouseX !== undefined && this.lastMouseY !== undefined) {
          const deltaX = currentX - this.lastMouseX;
          const deltaY = currentY - this.lastMouseY;

          if (Math.abs(deltaX) < 180 && Math.abs(deltaY) < 180) {
            this.targetLon += deltaX * (this.sensitivity * 1.2);
            this.targetLat -= deltaY * (this.sensitivity * 1.2);
          }
        }

        this.lastMouseX = currentX;
        this.lastMouseY = currentY;
      } else {
        this.lastMouseX = undefined;
        this.lastMouseY = undefined;
      }
    }

    // Giới hạn góc nhìn lên xuống (-55° nhìn xuống mặt bàn, +65° nhìn thẳng lên giếng trời)
    this.targetLat = Math.max(-55, Math.min(65, this.targetLat));
  }

  onKeyDown(event) {
    // Không nhận phím khi đang nhập liệu
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

    const code = event.code;
    if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = true;
    if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = true;
    if (code === 'KeyW' || code === 'ArrowUp') this.keys.up = true;
    if (code === 'KeyS' || code === 'ArrowDown') this.keys.down = true;
  }

  onKeyUp(event) {
    const code = event.code;
    if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = false;
    if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = false;
    if (code === 'KeyW' || code === 'ArrowUp') this.keys.up = false;
    if (code === 'KeyS' || code === 'ArrowDown') this.keys.down = false;
  }

  onTouchStart(event) {
    if (event.touches.length === 1) {
      this.isTouching = true;
      this.touchLastX = event.touches[0].clientX;
      this.touchLastY = event.touches[0].clientY;
    }
  }

  onTouchMove(event) {
    if (!this.isTouching || event.touches.length !== 1) return;

    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;
    const deltaX = currentX - this.touchLastX;
    const deltaY = currentY - this.touchLastY;
    this.touchLastX = currentX;
    this.touchLastY = currentY;

    // Vuốt liên tục xoay 360 độ mượt mà trên điện thoại
    if (Number.isFinite(deltaX) && Math.abs(deltaX) < 150) {
      this.targetLon += deltaX * 0.28;
    }
    if (Number.isFinite(deltaY) && Math.abs(deltaY) < 150) {
      this.targetLat -= deltaY * 0.22;
      this.targetLat = Math.max(-55, Math.min(65, this.targetLat));
    }
  }

  onTouchEnd() {
    this.isTouching = false;
  }

  async toggleGyro() {
    if (this.gyroEnabled) {
      this.disableGyro();
      return false;
    } else {
      return await this.enableGyro();
    }
  }

  async enableGyro() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === 'granted') {
          window.addEventListener('deviceorientation', this.onDeviceOrientation, false);
          this.gyroEnabled = true;
          return true;
        }
        return false;
      } catch (err) {
        console.warn('Gyro permission error:', err);
        return false;
      }
    } else if ('ondeviceorientation' in window) {
      window.addEventListener('deviceorientation', this.onDeviceOrientation, false);
      this.gyroEnabled = true;
      return true;
    }
    return false;
  }

  disableGyro() {
    window.removeEventListener('deviceorientation', this.onDeviceOrientation, false);
    this.gyroEnabled = false;
    this.gyroOffsetLat = 0;
    this.gyroOffsetLon = 0;
  }

  handleOrientation(event) {
    if (!this.gyroEnabled) return;
    const beta = event.beta;
    const gamma = event.gamma;
    
    // Kiểm tra chặt chẽ kiểu dữ liệu để tuyệt đối không bị NaN làm hỏng camera
    if (typeof beta !== 'number' || typeof gamma !== 'number' || !Number.isFinite(beta) || !Number.isFinite(gamma)) {
      return;
    }

    const pitchDelta = (beta - 55) * 0.6;
    const rollDelta = gamma * 0.8;

    if (Number.isFinite(pitchDelta) && Number.isFinite(rollDelta)) {
      this.gyroOffsetLat = Math.max(-45, Math.min(50, pitchDelta));
      this.gyroOffsetLon = rollDelta;
    }
  }

  update(delta = 0.016) {
    // 1. Phím bàn phím A/D hoặc Mũi tên xoay 360° liên tục
    const keyRotateSpeed = 95; // 95 độ mỗi giây
    const keyPitchSpeed = 70;

    if (this.keys.left) this.targetLon -= keyRotateSpeed * delta;
    if (this.keys.right) this.targetLon += keyRotateSpeed * delta;
    if (this.keys.up) this.targetLat += keyPitchSpeed * delta;
    if (this.keys.down) this.targetLat -= keyPitchSpeed * delta;

    // Giới hạn góc nhìn lên xuống (-55° đến +65°)
    this.targetLat = Math.max(-55, Math.min(65, this.targetLat));

    // Bảo vệ triệt để chống NaN trên di động
    if (!Number.isFinite(this.targetLon)) this.targetLon = 0;
    if (!Number.isFinite(this.targetLat)) this.targetLat = -12;
    if (!Number.isFinite(this.lon)) this.lon = 0;
    if (!Number.isFinite(this.lat)) this.lat = -12;

    // 2. Làm mượt chuyển động xoay camera (lerp)
    this.lon += (this.targetLon - this.lon) * this.lerpSpeed;
    this.lat += (this.targetLat - this.lat) * this.lerpSpeed;

    const gOffsetLon = (this.gyroEnabled && Number.isFinite(this.gyroOffsetLon)) ? this.gyroOffsetLon : 0;
    const gOffsetLat = (this.gyroEnabled && Number.isFinite(this.gyroOffsetLat)) ? this.gyroOffsetLat : 0;

    const finalLon = this.lon + gOffsetLon;
    const finalLat = Math.max(-55, Math.min(65, this.lat + gOffsetLat));

    const phi = THREE.MathUtils.degToRad(90 - finalLat);
    const theta = THREE.MathUtils.degToRad(finalLon);

    const targetPosition = new THREE.Vector3();
    targetPosition.x = this.sittingPosition.x + 500 * Math.sin(phi) * Math.sin(theta);
    targetPosition.y = this.sittingPosition.y + 500 * Math.cos(phi);
    targetPosition.z = this.sittingPosition.z - 500 * Math.sin(phi) * Math.cos(theta);

    if (Number.isFinite(targetPosition.x) && Number.isFinite(targetPosition.y) && Number.isFinite(targetPosition.z)) {
      this.camera.lookAt(targetPosition);
    }
  }
}
