import * as THREE from 'three';

/**
 * Chuẩn hóa kích thước và trọng tâm của bất kỳ model 3D nào
 * để luôn hiển thị vừa vặn, tinh tế đúng theo kích thước thực tế trong phòng.
 *
 * @param {THREE.Object3D} object - Model 3D cần chuẩn hóa
 * @param {number} targetSize - Kích thước lớn nhất mong muốn (mét)
 * @param {boolean} alignBottom - Căn đáy model về y = 0
 */
export function normalizeModel(object, targetSize, alignBottom = true) {
  // Đặt lại scale và position trước khi đo
  object.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);

  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) {
    const scaleFactor = targetSize / maxDim;
    object.scale.set(scaleFactor, scaleFactor, scaleFactor);
  }

  // Cập nhật lại sau khi scale
  object.updateMatrixWorld(true);
  const updatedBox = new THREE.Box3().setFromObject(object);
  const updatedCenter = new THREE.Vector3();
  updatedBox.getCenter(updatedCenter);

  // Căn giữa theo trục X và Z
  const offsetX = -updatedCenter.x;
  const offsetZ = -updatedCenter.z;
  const offsetY = alignBottom ? -updatedBox.min.y : -updatedCenter.y;

  // Tạo group bao bọc để di chuyển trọng tâm an toàn
  const wrapper = new THREE.Group();
  wrapper.add(object);
  object.position.set(offsetX, offsetY, offsetZ);

  return wrapper;
}
