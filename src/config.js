// Cấu hình thông tin sinh nhật bạn bè & 16 ảnh kỷ niệm từ Google Drive

export const BIRTHDAY_CONFIG = {
  friendName: "Kiều",
  birthdayDate: "28/09",
  birthdayWishTitle: "Chúc Mừng Sinh Nhật Kiều! 🎂",
  birthdayWishSub: "Mong tuổi mới thật dịu dàng, chặng đường phía trước rộng mở và luôn hạnh phúc nhé!",

  // Bức thư tay chân thành gửi Kiều từ Vinh
  letter: {
    title: "Kiều à,",
    paragraphs: [
      "Hôm nay là sinh nhật bà, tui muốn viết cho bà vài điều mà bình thường có lẽ tui không biết phải nói như thế nào. Có thể những lời này hơi dài, nhưng tui muốn bà biết rằng tui thật sự trân trọng bà và tình bạn của tụi mình.",
      "Trước hết, tui chúc bà tuổi mới thật nhiều bình an, vui vẻ và gặp thật nhiều điều tốt đẹp. Bà cũng sắp bước vào một chặng đường rất khác rồi, thực tập, ra trường, bắt đầu công việc và tự mình bước vào một cuộc sống trưởng thành hơn. Tui mong bà sẽ tìm được một công việc phù hợp với khả năng và những điều bà mong muốn, gặp được những người tốt và có một môi trường khiến bà cảm thấy mình được công nhận. Còn trong chuyện tình cảm, tui mong bà sẽ gặp được một người thật sự phù hợp, biết trân trọng, tôn trọng và đối xử với bà bằng sự chân thành mà bà xứng đáng nhận được. Mong rằng dù trong công việc hay tình yêu, bà cũng luôn được là chính mình và được trân trọng vì con người thật của mình.",
      "Có một điều tui thật sự muốn cảm ơn bà. Cảm ơn vì sau những chuyện đã xảy ra, sau những lần tui từng làm sai và có những điều khiến bà buồn, bà vẫn lựa chọn tiếp tục trân trọng tình bạn này. Tui biết đó không phải là điều hiển nhiên. Tui rất biết ơn sự bao dung của bà, và cũng nhờ những chuyện đó mà tui càng hiểu hơn giá trị của một người bạn như bà.",
      "Tui tôn trọng bà không chỉ vì những điều bà từng dành cho tui, mà còn vì chính con người bà, cách bà sống và cách bà đối xử với mọi người. Có thể tui không phải lúc nào cũng nói ra, nhưng tui thật sự coi trọng bà và luôn mong những điều tốt đẹp sẽ đến với bà.",
      "Tui không dám nói rằng sau này tui sẽ luôn làm đúng, nhưng tui sẽ luôn cố gắng để trở thành một người bạn tốt hơn. Nếu một ngày nào đó bà gặp chuyện khó khăn, cần một người lắng nghe, cần giúp đỡ hay đơn giản chỉ cần một người đứng về phía mình, thì bà cứ nói với tui. Tui không chắc mình có thể giải quyết được mọi chuyện, nhưng nếu có thể giúp bà được điều gì, tui sẽ luôn sẵn lòng.",
      "Sau này cuộc sống chắc chắn sẽ thay đổi rất nhiều, mỗi người rồi sẽ có những hướng đi riêng. Tui chỉ mong dù đi đến đâu, bà cũng gặp được những người tử tế, có những lựa chọn khiến bà không phải hối tiếc và có đủ bình yên để tận hưởng những gì mình đã cố gắng.",
      "Chúc mừng sinh nhật bà, Kiều. Mong tuổi mới thật dịu dàng với bà, chặng đường phía trước thật rộng mở, công việc thuận lợi, tình yêu đủ chân thành, và quan trọng nhất là bà luôn sống một cuộc đời mà chính bà cảm thấy vui và tự hào."
    ],
    sign: "Vinh",
    date: ""
  },

  // 16 Ảnh kỷ niệm từ Google Drive
  memories: Array.from({ length: 16 }, (_, i) => ({
    id: i + 1,
    image: `/images/friends/photo_${i + 1}.jpg`
  }))
};
