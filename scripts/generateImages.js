import fs from 'fs';
import path from 'path';

fs.mkdirSync('public/images', { recursive: true });

const themes = [
  { title: 'Ngày Đầu Tiên Gặp Nhau', date: '14/02/2023', color1: '#ff758c', color2: '#ff7eb3', icon: '✨', quote: 'Ánh mắt đầu tiên chạm nhau làm tim anh lỗi nhịp...' },
  { title: 'Lần Đầu Đi Dạo Phố', date: '08/03/2023', color1: '#a18cd1', color2: '#fbc2eb', icon: '🌙', quote: 'Con đường quen bỗng đẹp hơn khi có em bước cùng...' },
  { title: 'Quán Cafe Góc Phố', date: '25/03/2023', color1: '#f6d365', color2: '#fda085', icon: '☕', quote: 'Cốc trà sữa ngọt ngào cũng không ngọt bằng nụ cười của em.' },
  { title: 'Chuyến Đi Xa Đầu Tiên', date: '30/04/2023', color1: '#84fab0', color2: '#8fd3f4', icon: '🌊', quote: 'Biển xanh, cát trắng và em - bức tranh đẹp nhất đời anh.' },
  { title: 'Buổi Chiều Ngắm Hoàng Hôn', date: '20/05/2023', color1: '#fa709a', color2: '#fee140', icon: '🌅', quote: 'Mặt trời lặn sau lưng, nhưng trong mắt anh chỉ có em tỏa sáng.' },
  { title: 'Cơn Mưa Rào Mùa Hạ', date: '15/06/2023', color1: '#4facfe', color2: '#00f2fe', icon: '🌧️', quote: 'Chung một chiếc ô, khoảng cách hai đứa bỗng thật gần.' },
  { title: 'Xem Phim Cùng Nhau', date: '07/07/2023', color1: '#667eea', color2: '#764ba2', icon: '🎬', quote: 'Bộ phim kết thúc, nhưng câu chuyện của chúng mình mới bắt đầu.' },
  { title: 'Nấu Ăn Cùng Nhau', date: '18/08/2023', color1: '#ff9a9e', color2: '#fecfef', icon: '🍳', quote: 'Món ăn có thể vụng về, nhưng chan chứa tình cảm anh dành cho em.' },
  { title: 'Đêm Ngắm Sao Trời', date: '02/09/2023', color1: '#30cfd0', color2: '#330867', icon: '⭐', quote: 'Trên trời có hàng triệu vì sao, nhưng ngôi sao sáng nhất là em.' },
  { title: 'Mùa Thu Lá Vàng', date: '10/10/2023', color1: '#f093fb', color2: '#f5576c', icon: '🍁', quote: 'Gió thu se lạnh để hai bàn tay tìm thấy hơi ấm của nhau.' },
  { title: 'Kỷ Niệm Tròn 1 Năm', date: '14/11/2023', color1: '#43e97b', color2: '#38f9d7', icon: '💍', quote: 'Cảm ơn em đã bước vào cuộc đời anh và biến mọi ngày thành kỳ diệu.' },
  { title: 'Chuyến Tàu Đêm', date: '05/12/2023', color1: '#5ee7df', color2: '#b490ca', icon: '🚂', quote: 'Điểm đến không quan trọng, quan trọng là người đồng hành là em.' },
  { title: 'Giáng Sinh Ấm Áp', date: '24/12/2023', color1: '#d299c2', color2: '#fef9d7', icon: '🎄', quote: 'Món quà Giáng Sinh quý giá nhất của anh chính là có em bên cạnh.' },
  { title: 'Đón Giao Thừa Cùng Em', date: '01/01/2024', color1: '#ebc0fd', color2: '#d9ded8', icon: '🎆', quote: 'Khoảnh khắc năm mới đến, điều ước duy nhất của anh là mãi bên em.' },
  { title: 'Valentine Ngọt Ngào', date: '14/02/2024', color1: '#f857a6', color2: '#ff5858', icon: '💖', quote: 'Hoa hồng sẽ tàn, nhưng tình yêu anh dành cho em là mãi mãi.' },
  { title: 'Chuyến Picnic Mùa Xuân', date: '20/03/2024', color1: '#96fbc4', color2: '#f9f586', icon: '🌸', quote: 'Hoa nở đón xuân, nụ cười em thắp sáng cả bầu trời.' },
  { title: 'Chiều Dạo Phố Cũ', date: '15/04/2024', color1: '#2af598', color2: '#009efd', icon: '🚲', quote: 'Cứ bình yên thế này, nắm tay nhau đi qua bao tháng năm.' },
  { title: 'Bữa Tối Dưới Ánh Nến', date: '28/05/2024', color1: '#b3ffab', color2: '#12fff7', icon: '🕯️', quote: 'Dưới ánh nến lung linh, em là người phụ nữ đẹp nhất trần đời.' },
  { title: 'Những Ngày Bình Yên', date: '19/07/2024', color1: '#ff0844', color2: '#ffb199', icon: '🏡', quote: 'Hạnh phúc đôi khi chỉ là ngồi bên nhau nghe một bản nhạc quen.' },
  { title: 'Chúc Mừng Sinh Nhật Em!', date: 'Hôm nay', color1: '#f12711', color2: '#f5af19', icon: '🎂', quote: 'Chúc công chúa của anh tuổi mới luôn rạng rỡ, hạnh phúc và bình an!' }
];

for (let i = 0; i < themes.length; i++) {
  const t = themes[i];
  const num = i + 1;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
    <defs>
      <linearGradient id="grad${num}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${t.color1}" />
        <stop offset="100%" stop-color="${t.color2}" />
      </linearGradient>
      <filter id="shadow${num}" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="rgba(0,0,0,0.25)"/>
      </filter>
    </defs>
    <!-- Background Frame / Polaroid -->
    <rect width="800" height="1000" fill="#ffffff" rx="28"/>
    <!-- Inner Border Line -->
    <rect x="18" y="18" width="764" height="964" fill="none" stroke="#f0ede6" stroke-width="2" rx="20"/>
    
    <!-- Inner Image Area -->
    <rect x="36" y="36" width="728" height="740" rx="20" fill="url(#grad${num})"/>
    
    <!-- Decorative Rings -->
    <circle cx="400" cy="370" r="220" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2" stroke-dasharray="8 8"/>
    <circle cx="400" cy="370" r="160" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
    
    <!-- Big Romantic Icon -->
    <text x="400" y="350" font-size="130" text-anchor="middle" filter="url(#shadow${num})">${t.icon}</text>
    
    <!-- Memory Number Tag -->
    <rect x="310" y="80" width="180" height="46" rx="23" fill="rgba(255,255,255,0.92)" filter="url(#shadow${num})"/>
    <text x="400" y="110" font-family="'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="18" fill="#ff4b72" text-anchor="middle" letter-spacing="2">KỶ NIỆM #${num}</text>
    
    <!-- Title inside image -->
    <text x="400" y="520" font-family="'Georgia', serif" font-size="36" font-weight="bold" fill="#ffffff" text-anchor="middle" filter="url(#shadow${num})">${t.title}</text>
    <text x="400" y="575" font-family="'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="500" fill="rgba(255,255,255,0.92)" text-anchor="middle">📅 ${t.date}</text>
    
    <!-- Bottom Note Section (Polaroid style) -->
    <text x="400" y="845" font-family="'Georgia', serif" font-style="italic" font-size="22" fill="#333333" text-anchor="middle">"${t.quote}"</text>
    <text x="400" y="915" font-family="'Segoe UI', Roboto, sans-serif" font-size="16" fill="#888888" text-anchor="middle">♥ Chạm vào để phóng to kỷ niệm ♥</text>
  </svg>`;

  fs.writeFileSync(`public/images/photo_${num}.svg`, svg);
}
console.log('Successfully created 20 aesthetic SVG memory templates in public/images/!');
