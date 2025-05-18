# Hướng dẫn kết nối cơ sở dữ liệu cho ứng dụng

## Kết nối SQL Server

### Bước 1: Bật SQL Server Authentication

1. Mở SQL Server Management Studio (SSMS)
2. Kết nối đến SQL Server instance với Windows Authentication
3. Chuột phải vào server -> Properties
4. Chọn "Security" trong menu bên trái
5. Chọn "SQL Server and Windows Authentication mode"
6. Nhấn OK
7. **Quan trọng**: Khởi động lại SQL Server service (SQL Server Configuration Manager -> SQL Server Services -> Chuột phải vào SQL Server -> Restart)

### Bước 2: Tạo user SQL Server mới

1. Mở SQL Server Management Studio (SSMS)
2. Kết nối đến SQL Server instance (localhost hoặc tên máy)
3. Mở `Security` > `Logins` > Chuột phải > `New Login...`
4. Điền vào form tạo login:
   - Login name: `nodejs_user`
   - **Chọn SQL Server authentication** (không phải Windows authentication)
   - Password: `nodejs123` (hoặc mật khẩu khác bạn muốn dùng)
   - Bỏ chọn "Enforce password policy" và "User must change password..."
5. Chọn tab "User Mapping":
   - Tích chọn database "DWH"
   - Trong phần database role membership, tích chọn:
     - `db_datareader`
     - `db_datawriter`
6. Nhấn OK để tạo user

### Bước 3: Cấu hình kết nối trong server.js

1. Mở file `server.js`
2. Tìm phần cấu hình SQL Server:
```javascript
const sqlConfig = {
    server: 'localhost', // Tên máy chủ SQL Server (dùng localhost thay vì tên máy)
    database: 'DWH',
    user: 'nodejs_user',      // Tên user vừa tạo
    password: 'nodejs123',    // Mật khẩu của user vừa tạo
    options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true
    },
    port: 1433  // Cổng mặc định của SQL Server
};
```
3. Cập nhật lại user và password nếu cần

### Sửa lỗi SQL Server thường gặp

1. **Lỗi "Login failed for user 'nodejs_user'"**: 
   - **Nguyên nhân chính**: SQL Server có thể đang ở chế độ Windows Authentication only
   - Thực hiện Bước 1 để bật SQL Server and Windows Authentication mode
   - Đảm bảo đã tạo user với SQL Server authentication (không phải Windows authentication)
   - Kiểm tra lại tên user và mật khẩu trong cấu hình
   - Thử đổi `server` thành `localhost`, `127.0.0.1` hoặc `.` thay vì tên máy

2. **Lỗi "Cannot connect to localhost"**:
   - Xác nhận SQL Server đang chạy: Mở SQL Server Configuration Manager, kiểm tra dịch vụ
   - Kiểm tra firewall Windows đã mở cổng 1433
   - Nếu dùng SQL Server Express, thử đổi `server` thành `localhost\\SQLEXPRESS`

## Kết nối OLAP/Analysis Services

### Bước 1: Chuẩn bị OLAP server

1. Đảm bảo SQL Server Analysis Services (SSAS) đã được cài đặt và đang chạy
   - Mở SQL Server Configuration Manager
   - Kiểm tra SQL Server Analysis Services đang hoạt động
   - Nếu không hoạt động, chuột phải và chọn Start

2. Đảm bảo database "KDL1" và cube "[1D_Inventory_Store]" đã được phục hồi
   - Sử dụng SSMS kết nối đến Analysis Services
   - Kiểm tra database "KDL1" và cube "[1D_Inventory_Store]" đã tồn tại

### Bước 2: Kiểm tra kết nối OLAP từ ứng dụng khác

1. Mở SQL Server Management Studio (SSMS)
2. Kết nối đến server Analysis Services (không phải SQL Server)
3. Thực hiện truy vấn MDX test:
   ```mdx
   SELECT {} ON COLUMNS FROM [1D_Inventory_Store]
   ```
4. Nếu truy vấn thành công, OLAP server đang hoạt động bình thường

### Bước 3: Kết nối OLAP thông qua PowerShell

Ứng dụng hiện đang sử dụng PowerShell để kết nối với OLAP. Đảm bảo:

1. PowerShell được cài đặt trên máy (mặc định có trên Windows)
2. Bạn có đủ quyền để chạy script PowerShell từ Node.js

Chuỗi kết nối OLAP mặc định:
```javascript
const olapConfigString = 'Provider=MSOLAP;Data Source=localhost;Initial Catalog=KDL1;Integrated Security=SSPI;';
```

#### Giải pháp khắc phục lỗi kết nối PowerShell với OLAP

1. **Kiểm tra và cài đặt lại MSOLAP Provider:**
   - Mở **Programs and Features** (Control Panel)
   - Tìm SQL Server và chọn **Change** (Thay đổi)
   - Chọn **Add Features** và đảm bảo đã chọn **Analysis Services - OLE DB Provider**
   - Hoàn tất cài đặt

2. **Thử thay đổi chuỗi kết nối trong PowerShell script:**
   - Mở file `server.js`
   - Tìm hàm `queryOlapViaPowerShell`
   - Thử thay đổi chuỗi kết nối trong đoạn PowerShell:
     ```javascript
     $conn.ConnectionString = "Provider=MSOLAP.8;Data Source=localhost;Initial Catalog=KDL1;Integrated Security=SSPI;"
     ```
     hoặc
     ```javascript
     $conn.ConnectionString = "Provider=MSOLAP;Data Source=127.0.0.1;Initial Catalog=KDL1;Integrated Security=SSPI;"
     ```

3. **Vấn đề cấp quyền Access Registry:**
   - Chạy lệnh sau với quyền Administrator trong Command Prompt:
   ```
   reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\OLE" /v EnableDCOM /t REG_SZ /d Y /f
   reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\OLE" /v LegacyAuthenticationLevel /t REG_DWORD /d 2 /f
   reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\OLE" /v LegacyImpersonationLevel /t REG_DWORD /d 3 /f
   ```

4. **Kiểm tra cài đặt ADOMD.NET:**
   - Đảm bảo Microsoft Analysis Services ADOMD.NET đã được cài đặt
   - Có thể tải về và cài đặt từ Microsoft Download Center nếu cần

5. **Giải pháp thay thế - Sử dụng dữ liệu từ SQL Server:**
   - Hiện tại ứng dụng đã được cấu hình để sử dụng dữ liệu từ SQL Server khi OLAP không khả dụng
   - Chạy ứng dụng và kiểm tra xem bạn có thể truy cập tất cả các báo cáo không
   - Nếu các báo cáo hiển thị chính xác từ DWH, việc khắc phục OLAP có thể được hoãn lại

## Hỗ trợ và Khắc phục sự cố

Nếu vẫn gặp vấn đề kết nối, hãy kiểm tra log lỗi trong terminal để biết chi tiết lỗi cụ thể. Ứng dụng vẫn sẽ hoạt động với dữ liệu từ SQL Server hoặc dữ liệu mẫu ngay cả khi không kết nối được OLAP. 