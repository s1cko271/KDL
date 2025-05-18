# Hướng dẫn chạy ứng dụng Dashboard OLAP

Tài liệu này hướng dẫn cách cài đặt và chạy ứng dụng Dashboard OLAP cho bài tập lớn môn Kho Dữ liệu.

## Cài đặt và chạy Backend

1. **Cài đặt Node.js và npm**
   - Tải và cài đặt Node.js từ [trang chủ Node.js](https://nodejs.org/) (phiên bản LTS được khuyến nghị)
   - Việc cài đặt Node.js sẽ tự động cài đặt npm (Node Package Manager)

2. **Cài đặt các phụ thuộc cho Backend**
   - Mở Command Prompt hoặc PowerShell
   - Di chuyển đến thư mục backend của dự án:
     ```
     cd "đường_dẫn_đến_dự_án\KDL\backend"
     ```
   - Cài đặt các phụ thuộc:
     ```
     npm install
     ```

3. **Chạy Backend Server**
   - Trong cùng thư mục backend, chạy lệnh:
     ```
     npm run dev
     ```
   - Server sẽ khởi động tại địa chỉ http://localhost:5001
   - Để kiểm tra server đã hoạt động, mở trình duyệt và truy cập http://localhost:5001

## Chạy Frontend

Có hai cách để chạy frontend:

### Cách 1: Mở trực tiếp file HTML

- Mở file `frontend/index.html` bằng trình duyệt web (Chrome, Firefox, Edge,...)

### Cách 2: Sử dụng Live Server (khuyến nghị)

1. **Cài đặt Visual Studio Code**
   - Tải và cài đặt [Visual Studio Code](https://code.visualstudio.com/)

2. **Cài đặt extension Live Server**
   - Mở Visual Studio Code
   - Chuyển đến tab Extensions (Ctrl+Shift+X)
   - Tìm kiếm "Live Server" và cài đặt extension của Ritwick Dey

3. **Chạy ứng dụng với Live Server**
   - Mở thư mục dự án trong Visual Studio Code
   - Tìm file `frontend/index.html` trong Explorer
   - Nhấp chuột phải vào file và chọn "Open with Live Server"
   - Hoặc nhấn vào nút "Go Live" ở góc dưới bên phải của VS Code
   - Trình duyệt sẽ tự động mở với ứng dụng chạy tại địa chỉ như http://127.0.0.1:5500/frontend/index.html

## Lưu ý quan trọng

- **Cả Backend và Frontend đều phải được chạy đồng thời** để ứng dụng hoạt động đúng
- Đảm bảo không có ứng dụng nào khác đang sử dụng cổng 5001 khi chạy backend
- Nếu gặp lỗi CORS khi kết nối frontend với backend, hãy đảm bảo rằng backend đã được cấu hình đúng để chấp nhận các yêu cầu từ nguồn gốc khác

## Kết nối với Kho Dữ liệu thực tế

Hiện tại, ứng dụng đang sử dụng dữ liệu mẫu. Để kết nối với kho dữ liệu thực tế:

1. Cài đặt driver phù hợp:
   ```
   npm install mssql     # Cho MS SQL Server
   npm install oracledb  # Cho Oracle
   ```

2. Chỉnh sửa file `backend/server.js` để cấu hình kết nối và thay thế hàm `getMockData` bằng các truy vấn thực tế đến kho dữ liệu.

## Hướng dẫn sử dụng các tính năng OLAP

Ứng dụng Dashboard OLAP cung cấp các tính năng phân tích dữ liệu đa chiều. Dưới đây là hướng dẫn sử dụng các tính năng chính:

### 1. Drill-down (Khoan sâu)

- **Mô tả**: Cho phép đi từ dữ liệu tổng hợp xuống dữ liệu chi tiết hơn theo một chiều phân cấp.
- **Cách sử dụng**:
  - Nhấp vào biểu đồ hoặc bảng dữ liệu tổng hợp
  - Chọn tùy chọn "Drill Down" từ menu ngữ cảnh
  - Chọn chiều và mức độ chi tiết muốn khoan sâu (ví dụ: từ Quý → Tháng → Ngày)
  - Dữ liệu sẽ được cập nhật để hiển thị mức độ chi tiết đã chọn

### 2. Roll-up (Cuộn lên)

- **Mô tả**: Ngược lại với Drill-down, cho phép tổng hợp dữ liệu từ mức chi tiết lên mức cao hơn.
- **Cách sử dụng**:
  - Khi đang xem dữ liệu ở mức chi tiết
  - Nhấp vào nút "Roll Up" hoặc chọn từ menu ngữ cảnh
  - Chọn mức độ tổng hợp mong muốn
  - Dữ liệu sẽ được tổng hợp theo mức đã chọn

### 3. Slice and Dice (Cắt lát và Xoay)

- **Mô tả**: Cho phép lọc (slice) và phân tích dữ liệu theo nhiều chiều khác nhau (dice).
- **Cách sử dụng Slice**:
  - Chọn bộ lọc từ thanh công cụ
  - Chọn một giá trị cụ thể cho một chiều (ví dụ: Khu vực = "Miền Bắc")
  - Dữ liệu sẽ được lọc để chỉ hiển thị thông tin liên quan đến giá trị đã chọn

- **Cách sử dụng Dice**:
  - Chọn nhiều bộ lọc cho nhiều chiều khác nhau
  - Kết hợp các điều kiện lọc (ví dụ: Khu vực = "Miền Bắc" VÀ Thời gian = "Quý 1, 2023")
  - Dữ liệu sẽ được hiển thị theo tổ hợp các điều kiện đã chọn

### 4. Pivot (Xoay trục)

- **Mô tả**: Cho phép xoay trục dữ liệu để phân tích từ các góc nhìn khác nhau.
- **Cách sử dụng**:
  - Nhấp vào nút "Pivot" hoặc kéo và thả các trường vào khu vực "Rows" và "Columns"
  - Kéo các trường đo lường vào khu vực "Values"
  - Điều chỉnh các trường hiển thị bằng cách kéo thả giữa các khu vực
  - Dữ liệu sẽ được tổ chức lại theo cấu trúc mới

## Tùy chỉnh báo cáo theo yêu cầu nghiệp vụ

### 1. Tạo báo cáo mới

1. Nhấp vào nút "Tạo báo cáo mới" trên thanh công cụ
2. Chọn loại báo cáo (Bảng, Biểu đồ cột, Biểu đồ đường, Biểu đồ tròn, v.v.)
3. Kéo và thả các trường dữ liệu vào các vùng tương ứng:
   - Trục X/Hàng: Kéo các chiều phân tích
   - Trục Y/Cột: Kéo các chỉ số đo lường
   - Bộ lọc: Thêm các điều kiện lọc
4. Đặt tên cho báo cáo và nhấp "Lưu"

### 2. Tùy chỉnh giao diện báo cáo

- **Thay đổi loại biểu đồ**: Nhấp vào biểu tượng biểu đồ và chọn loại biểu đồ phù hợp
- **Định dạng dữ liệu**: Nhấp chuột phải vào trường dữ liệu và chọn "Định dạng" để thay đổi cách hiển thị (phần trăm, số thập phân, v.v.)
- **Thay đổi màu sắc**: Sử dụng bảng màu để tùy chỉnh màu sắc của biểu đồ
- **Thêm tiêu đề và chú thích**: Nhập tiêu đề, phụ đề và chú thích cho báo cáo

### 3. Lưu và chia sẻ báo cáo

- **Lưu báo cáo**: Nhấp vào nút "Lưu" để lưu báo cáo hiện tại
- **Xuất báo cáo**: Xuất báo cáo dưới dạng PDF, Excel hoặc hình ảnh bằng cách nhấp vào nút "Xuất"
- **Lên lịch báo cáo**: Thiết lập lịch tự động gửi báo cáo qua email
- **Chia sẻ báo cáo**: Sao chép đường dẫn hoặc gửi trực tiếp cho người dùng khác