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
   */
  openPhotoModal(index) {
    this.currentPhotoIndex = index;
    const memory = this.memories[index];
    if (!memory) return;

    if (this.photoModalImg) {
      this.photoModalImg.src = memory.image;
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
    if (this.onModalClose) this.onModalClose();
  }

  prevPhoto() {
    let newIndex = this.currentPhotoIndex - 1;
    if (newIndex < 0) newIndex = this.memories.length - 1;
    this.openPhotoModal(newIndex);
  }

  nextPhoto() {
    let newIndex = (this.currentPhotoIndex + 1) % this.memories.length;
    this.openPhotoModal(newIndex);
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
