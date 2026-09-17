/**
 * ModalManager: Quản lý Modal phóng to ảnh kỷ niệm tối giản (Clean Lightbox)
 * và Modal bức thư chúc mừng sinh nhật bạn bè
 */
export class ModalManager {
  constructor(config) {
    this.config = config;
    this.memories = config.memories;
    this.currentPhotoIndex = 0;

    // DOM Elements - Photo Modal
    this.photoModal = document.getElementById('photo-modal');
    this.photoModalImg = document.getElementById('photo-modal-img');
    this.photoCounter = document.getElementById('photo-counter');
    this.photoBtnClose = document.getElementById('photo-modal-close');
    this.photoBtnPrev = document.getElementById('photo-btn-prev');
    this.photoBtnNext = document.getElementById('photo-btn-next');

    // DOM Elements - Letter Modal
    this.letterModal = document.getElementById('letter-modal');
    this.letterTitle = document.getElementById('letter-title');
    this.letterBody = document.getElementById('letter-body');
    this.letterSign = document.getElementById('letter-sign');
    this.letterDate = document.getElementById('letter-date');
    this.letterBtnClose = document.getElementById('letter-modal-close');
    this.letterWaxStamp = document.getElementById('letter-wax-stamp') || document.querySelector('.letter-wax-stamp');

    // DOM Elements - Celebration Banner
    this.celebrationBanner = document.getElementById('celebration-banner');

    this.onModalOpen = null;
    this.onModalClose = null;

    this.initEvents();
    this.setupLetterContent();
  }

  initEvents() {
    // Đóng Photo Modal
    if (this.photoBtnClose) {
      this.photoBtnClose.addEventListener('click', () => this.closePhotoModal());
    }
    if (this.photoModal) {
      this.photoModal.addEventListener('click', (e) => {
        if (e.target === this.photoModal) this.closePhotoModal();
      });
    }

    // Chuyển ảnh Trước / Sau
    if (this.photoBtnPrev) {
      this.photoBtnPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        this.prevPhoto();
      });
    }
    if (this.photoBtnNext) {
      this.photoBtnNext.addEventListener('click', (e) => {
        e.stopPropagation();
        this.nextPhoto();
      });
    }

    // Đóng Letter Modal: Bấm vào dấu niêm phong màu đỏ
    if (this.letterWaxStamp) {
      this.letterWaxStamp.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeLetterModal();
      });
      this.letterWaxStamp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.closeLetterModal();
        }
      });
    }

    if (this.letterBtnClose) {
      this.letterBtnClose.addEventListener('click', () => this.closeLetterModal());
    }
    if (this.letterModal) {
      this.letterModal.addEventListener('click', (e) => {
        if (e.target === this.letterModal) this.closeLetterModal();
      });
    }

    // Phím tắt bàn phím: ESC để đóng, Mũi tên trái/phải để chuyển ảnh
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closePhotoModal();
        this.closeLetterModal();
      } else if (this.photoModal && this.photoModal.classList.contains('active')) {
        if (e.key === 'ArrowLeft') this.prevPhoto();
        if (e.key === 'ArrowRight') this.nextPhoto();
      }
    });

    // Khởi tạo cử chỉ vuốt qua lại (Touch swipe & Pointer drag)
    this.initSwipeGestures();
  }

  /**
   * Cử chỉ vuốt qua lại để lướt xem ảnh (hỗ trợ màn hình cảm ứng & kéo chuột)
   */
  initSwipeGestures() {
    if (!this.photoModal) return;

    const swipeCard = this.photoModal.querySelector('.photo-modal-card') || this.photoModal;
    const imgEl = this.photoModalImg;

    let startX = 0;
    let startY = 0;
    let currentDeltaX = 0;
    let isTracking = false;
    let isSwiping = false;

    const onStart = (clientX, clientY, target) => {
      if (!this.photoModal.classList.contains('active')) return false;
      // Không can thiệp nếu click trực tiếp vào nút đóng hoặc 2 nút điều hướng mũi tên
      if (target.closest('.modal-close-btn') || target.closest('.nav-arrow-btn')) {
        return false;
      }
      startX = clientX;
      startY = clientY;
      currentDeltaX = 0;
      isTracking = true;
      isSwiping = false;
      return true;
    };

    const onMove = (clientX, clientY) => {
      if (!isTracking) return;
      const deltaX = clientX - startX;
      const deltaY = clientY - startY;

      // Nhận diện cử chỉ vuốt ngang khi deltaX lớn hơn deltaY
      if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY) * 0.8) {
        isSwiping = true;
        currentDeltaX = deltaX;

        if (imgEl) {
          imgEl.style.transition = 'none';
          const resistanceFactor = 0.55;
          const scaleDamp = 1 - Math.min(0.06, Math.abs(deltaX) / 800);
          imgEl.style.transform = `translateX(${deltaX * resistanceFactor}px) scale(${scaleDamp})`;
          imgEl.style.opacity = `${Math.max(0.65, 1 - Math.abs(deltaX) / 650)}`;
        }
      }
    };

    const onEnd = () => {
      if (!isTracking) return;
      isTracking = false;

      // Ngưỡng vuốt tối thiểu 38px để kích hoạt chuyển ảnh
      if (isSwiping && Math.abs(currentDeltaX) >= 38) {
        if (currentDeltaX < 0) {
          this.nextPhoto();
        } else {
          this.prevPhoto();
        }
      } else if (imgEl) {
        // Trở về vị trí ban đầu nếu lực vuốt không đủ
        imgEl.style.transition = 'transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.28s ease';
        imgEl.style.transform = 'translateX(0) scale(1)';
        imgEl.style.opacity = '1';
      }

      isSwiping = false;
      currentDeltaX = 0;
    };

    // 1. Lắng nghe cử chỉ cảm ứng trên điện thoại & máy tính bảng
    swipeCard.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        onStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
      }
    }, { passive: true });

    swipeCard.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && isTracking) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    swipeCard.addEventListener('touchend', () => {
      onEnd();
    }, { passive: true });

    swipeCard.addEventListener('touchcancel', () => {
      onEnd();
    }, { passive: true });

    // 2. Lắng nghe kéo thả chuột trên máy tính (Pointer Events)
    let pointerDown = false;
    swipeCard.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (onStart(e.clientX, e.clientY, e.target)) {
        pointerDown = true;
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (pointerDown) {
        onMove(e.clientX, e.clientY);
      }
    });

    const endPointer = () => {
      if (pointerDown) {
        pointerDown = false;
        onEnd();
      }
    };

    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);
  }

  setupLetterContent() {
    const { letter } = this.config;
    if (!letter) return;

    if (this.letterTitle) this.letterTitle.textContent = letter.title;
    if (this.letterSign) this.letterSign.textContent = letter.sign;
    if (this.letterDate) this.letterDate.textContent = letter.date;

    if (this.letterBody) {
      this.letterBody.innerHTML = '';
      letter.paragraphs.forEach(pText => {
        const p = document.createElement('p');
        p.textContent = pText;
        this.letterBody.appendChild(p);
      });
    }
  }

  /**
   * Mở Modal ảnh kỷ niệm dạng Lightbox tối giản, không chữ chú thích
   * Hỗ trợ hướng chuyển ảnh (direction: 1 = next, -1 = prev, 0 = open)
   */
  openPhotoModal(index, direction = 0) {
    this.currentPhotoIndex = index;
    const memory = this.memories[index];
    if (!memory) return;

    if (this.photoModalImg) {
      this.photoModalImg.style.transition = 'none';

      // Tạo hiệu ứng trượt nhẹ từ hướng tương ứng
      if (direction === 1) {
        this.photoModalImg.style.transform = 'translateX(28px) scale(0.96)';
        this.photoModalImg.style.opacity = '0.4';
      } else if (direction === -1) {
        this.photoModalImg.style.transform = 'translateX(-28px) scale(0.96)';
        this.photoModalImg.style.opacity = '0.4';
      } else {
        this.photoModalImg.style.transform = 'scale(0.95)';
        this.photoModalImg.style.opacity = '0.7';
      }

      this.photoModalImg.src = memory.image;

      requestAnimationFrame(() => {
        this.photoModalImg.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease';
        this.photoModalImg.style.transform = 'translateX(0) scale(1)';
        this.photoModalImg.style.opacity = '1';
      });
    }

    if (this.photoCounter) {
      this.photoCounter.textContent = `${index + 1} / ${this.memories.length}`;
    }

    // Hiển thị modal
    if (this.photoModal) {
      this.photoModal.classList.add('active');
    }
    if (this.onModalOpen) this.onModalOpen();
  }

  closePhotoModal() {
    if (this.photoModal) {
      this.photoModal.classList.remove('active');
    }
    if (this.photoModalImg) {
      this.photoModalImg.style.transform = '';
      this.photoModalImg.style.opacity = '';
    }
    if (this.onModalClose) this.onModalClose();
  }

  prevPhoto() {
    let newIndex = this.currentPhotoIndex - 1;
    if (newIndex < 0) newIndex = this.memories.length - 1;
    this.openPhotoModal(newIndex, -1);
  }

  nextPhoto() {
    let newIndex = (this.currentPhotoIndex + 1) % this.memories.length;
    this.openPhotoModal(newIndex, 1);
  }

  openLetterModal() {
    if (this.letterModal) {
      this.letterModal.classList.add('active');
    }
    if (this.onModalOpen) this.onModalOpen();
  }

  closeLetterModal() {
    if (this.letterModal) {
      this.letterModal.classList.remove('active');
    }
    if (this.onModalClose) this.onModalClose();
  }

  showCelebrationBanner() {
    if (this.celebrationBanner) {
      this.celebrationBanner.classList.add('active');
      setTimeout(() => {
        this.celebrationBanner.classList.remove('active');
      }, 7000);
    }
  }

  isAnyModalOpen() {
    return (
      (this.photoModal && this.photoModal.classList.contains('active')) ||
      (this.letterModal && this.letterModal.classList.contains('active'))
    );
  }
}
