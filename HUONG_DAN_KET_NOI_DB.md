# HƯỚNG DẪN KẾT NỐI CƠ SỞ DỮ LIỆU VÀ OLAP

## Cấu trúc dự án
Dự án bao gồm:
- **Backend**: Máy chủ Node.js kết nối với SQL Server (DWH) và OLAP (Analysis Services)
- **Frontend**: Giao diện người dùng web để hiển thị các báo cáo OLAP

## Bước 1: Chuẩn bị cơ sở dữ liệu và OLAP
Đảm bảo các bước sau đã được hoàn thành:
1. **DWH (SQL Server)**: Đã tạo database `DWH` từ script `KWH.sql`
2. **OLAP (Analysis Services)**: Đã tạo và xử lý (process) cube từ file `KDL1.abf`

## Bước 2: Cấu hình kết nối
### Cấu hình kết nối SQL Server
Trong file `backend/server.js`, kiểm tra và điều chỉnh thông tin kết nối:

```javascript
const sqlConfig = {
    server: 'LAPTOP-5LFHKJMF', // Thay đổi thành tên server của bạn nếu khác
    database: 'DWH',
    options: {
        trustServerCertificate: true,
        trustedConnection: true, // Windows Authentication
        encrypt: false
    }
};
```

### Cấu hình kết nối OLAP
Trong file `backend/server.js`, kiểm tra và điều chỉnh thông tin kết nối:

```javascript
const olapConnection = ADODB.open(
    'Provider=MSOLAP;Data Source=LAPTOP-5LFHKJMF;Initial Catalog=KDL1;Integrated Security=SSPI;'
);
```

## Bước 3: Cài đặt các gói phụ thuộc
Mở terminal/command prompt và chạy lệnh sau:

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt các gói phụ thuộc
npm install
```

## Bước 4: Khởi động server backend
```bash
# Trong thư mục backend
npm start
```

Nếu mọi thứ hoạt động đúng, bạn sẽ thấy thông báo:
```
Server đang chạy tại http://localhost:5000
Đã kết nối thành công tới SQL Server - DWH
Đã kết nối thành công tới OLAP - KDL1
```

## Bước 5: Mở ứng dụng web
Mở file `frontend/index.html` trong trình duyệt web để xem giao diện ứng dụng. Hoặc sử dụng Live Server trong VS Code để mở file này.

## Kiểm tra kết nối
Sau khi mở ứng dụng web:
1. Chọn một báo cáo từ danh sách
2. Nếu dữ liệu hiển thị, chứng tỏ ứng dụng đã kết nối thành công
3. Kiểm tra console trong Dev Tools của trình duyệt để xem nhật ký kết nối và dữ liệu API

## Xử lý sự cố
### Lỗi kết nối SQL Server
- Kiểm tra tên server trong `sqlConfig`
- Đảm bảo SQL Server đang chạy và có thể truy cập được
- Kiểm tra quyền Windows Authentication

### Lỗi kết nối OLAP
- Kiểm tra tên server và tên database (Initial Catalog)
- Đảm bảo SQL Server Analysis Services đang chạy
- Đảm bảo cube đã được process thành công

### Lỗi không hiển thị dữ liệu
- Kiểm tra console trong Developer Tools của trình duyệt để xem lỗi
- Đảm bảo API endpoint `http://localhost:5000/api/reports/1` có thể truy cập được
- Kiểm tra CORS nếu bạn gặp lỗi liên quan đến cross-origin

## Sửa đổi truy vấn OLAP
Nếu cần tùy chỉnh truy vấn MDX, bạn có thể chỉnh sửa hàm `generateMdxQuery` trong file `backend/server.js`. Ví dụ:

```javascript
function generateMdxQuery(reportId, filters, level) {
    let mdxQuery = '';
    // ... customize MDX queries here
    return mdxQuery;
}
```

## Mở rộng ứng dụng
Bạn có thể thêm các truy vấn mới bằng cách:
1. Thêm API endpoint mới trong `backend/server.js`
2. Thêm hàm gọi API mới trong `frontend/js/services/api.js`
3. Cập nhật giao diện người dùng trong các component React 