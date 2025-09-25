Thư mục này chứa các userscript bạn có thể cài đặt để phân tích cũng như mở rộng chức năng của Zalo.

Hiện chưa có cách cài đặt các userscript ở thư mục này vào ứng dụng Zalo PC. Bạn vẫn có thể dán nội dung của các userscript vào cửa sổ Console trong DevTools để sử dụng tạm thời, tuy nhiên không phải lúc nào các userscript cũng hoạt động như mong đợi.

Đối với trình duyệt, bạn có thể sử dụng các tiện ích mở rộng quản lý userscript như [Tampermonkey](https://www.tampermonkey.net/) hoặc [Violentmonkey](https://violentmonkey.github.io/) để cài đặt các userscript.

## Danh sách userscript
- [ZaloDecryptor](./ZaloDecryptor.user.js) | [Raw](https://raw.githubusercontent.com/ElectroHeavenVN/Zalo-F12/main/Userscripts/ZaloDecryptor.user.js): Giải mã dữ liệu gửi đi và nhận về của Zalo, bao gồm dữ liệu WebSocket và yêu cầu API.
- [ZaloF12](./ZaloF12.user.js) | [Raw](https://raw.githubusercontent.com/ElectroHeavenVN/Zalo-F12/main/Userscripts/ZaloF12.user.js): Kích hoạt các chức năng sau trên Zalo:
  - Kích hoạt chế độ nhà phát triển
  - Hiện tùy chọn mã hoá đầu cuối
  - Kích hoạt sticker Guggy
  - Kích hoạt embed YouTube, SoundCloud và Zing MP3
  - Kích hoạt chức năng tạo và gửi tệp văn bản
- [ZaloUtils](./ZaloUtils.user.js) | [Raw](https://raw.githubusercontent.com/ElectroHeavenVN/Zalo-F12/main/Userscripts/ZaloUtils.user.js): Chứa các lệnh mở rộng và 1 số chức năng:
  - Chặn gửi thông báo "Đã nhận" khi có tin nhắn mới
  - Lưu lịch sử tin nhắn bị thu hồi và xoá (chỉ khả dụng khi kết nối bằng WebSocket)
  - Xoá được tin nhắn "bug" (tin nhắn không xoá được) - *Zalo đã fix tin nhắn không xoá được nên chức năng này không còn có ích nữa*
  - "Fake key bạc": Giả lập việc bạn có quyền quản trị nhóm để sử dụng các chức năng quản trị nhóm
  - Danh sách các lệnh mở rộng (có thể xem bằng cách chat `/help`):
    - `/ttl <mili giây> [nội dung]`: Gửi tin nhắn tự huỷ
    - `/antidelete on/off` / `/antidelete [nội dung]`: Bật/tắt chức năng gửi tin nhắn không thể xoá - *Zalo đã fix tin nhắn không xoá được nên chức năng này không còn có ích nữa*
    - `/id <@mention>`: Lấy ID của người dùng được đề cập
    - `/thread`: Lấy ID của cuộc trò chuyện hiện tại
    - `/editquote <nội dung trích dẫn> | <nội dung>`: Chỉnh sửa nội dung trích dẫn của tin nhắn hiện tại
    - `/quote`: Hiển thị tin nhắn trích dẫn ngay cả khi nó đã bị xoá
    - `/stk`: Gửi hình ảnh đính kèm dưới dạng sticker