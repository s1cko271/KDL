# Ứng dụng Dashboard OLAP - Bài tập lớn môn Kho Dữ liệu

Ứng dụng web cho phép hiển thị và thực hiện các thao tác OLAP trên dữ liệu kho dữ liệu.

## Tính năng

- Hiển thị 9 loại báo cáo khác nhau (doanh thu, số lượng, lợi nhuận theo sản phẩm/khu vực/thời gian)
- Thực hiện các thao tác OLAP:
  - Drill-down: Đi sâu vào chi tiết của dữ liệu
  - Roll-up: Quay lại mức tổng hợp cao hơn
  - Slice: Lọc dữ liệu theo một giá trị cụ thể của một chiều
  - Dice: Lọc dữ liệu theo nhiều chiều
  - Pivot: Xoay trục dữ liệu để phân tích từ góc nhìn khác
- Bộ lọc linh hoạt cho từng loại báo cáo
- Xuất dữ liệu báo cáo ra file CSV

## Cấu trúc dự án

```
├── backend/             # Mã nguồn backend
│   ├── server.js        # Server Express
│   └── package.json     # Cấu hình Node.js
└── frontend/           # Mã nguồn frontend
    ├── index.html      # File HTML chính
    ├── css/            # Thư mục CSS
    │   └── styles.css  # CSS tùy chỉnh
    └── js/             # Thư mục JavaScript
        ├── app.js      # File JS chính
        ├── components/ # Các component React
        └── services/   # Các service
```

## Cài đặt và chạy ứng dụng

### Yêu cầu

- Node.js (phiên bản 14.x trở lên)
- npm (phiên bản 6.x trở lên)

### Cài đặt backend

1. Di chuyển vào thư mục backend:
   ```
   cd backend
   ```

2. Cài đặt các phụ thuộc:
   ```
   npm install
   ```

3. Khởi động server:
   ```
   npm run dev
   ```
   Server sẽ chạy tại địa chỉ http://localhost:5000

### Chạy frontend

1. Mở file `frontend/index.html` trong trình duyệt web

   Hoặc sử dụng một server tĩnh đơn giản như Live Server trong Visual Studio Code để chạy frontend.

## Kết nối với kho dữ liệu thực tế

Để kết nối với kho dữ liệu thực tế (MS SQL Server), bạn cần thực hiện các bước sau:

### 1. Cài đặt driver SQL Server

```bash
cd backend
npm install mssql
```

### 2. Cấu hình kết nối trong file `backend/server.js`

```javascript
// Khai báo thư viện SQL Server
const sql = require('mssql');

// Cấu hình kết nối SQL Server
const sqlConfig = {
  user: 'username',           // Thay bằng tên đăng nhập SQL Server của bạn
  password: 'password',       // Thay bằng mật khẩu SQL Server của bạn
  server: 'localhost',        // Thay bằng tên server hoặc địa chỉ IP
  database: 'TenKhoDuLieu',   // Thay bằng tên database kho dữ liệu của bạn
  options: {
    encrypt: false,           // Đặt true nếu sử dụng Azure SQL
    trustServerCertificate: true, // Chỉ đặt true trong môi trường phát triển
    enableArithAbort: true,
    connectionTimeout: 30000  // Thời gian timeout kết nối (ms)
  },
  pool: {
    max: 10,                 // Số lượng kết nối tối đa trong pool
    min: 0,                  // Số lượng kết nối tối thiểu trong pool
    idleTimeoutMillis: 30000  // Thời gian một kết nối không hoạt động trước khi bị đóng
  }
};

// Kết nối đến SQL Server
async function connectToDatabase() {
  try {
    await sql.connect(sqlConfig);
    console.log('Kết nối thành công đến SQL Server');
  } catch (err) {
    console.error('Lỗi kết nối đến SQL Server:', err);
  }
}

// Gọi hàm kết nối khi khởi động server
connectToDatabase();
```

### 3. Thay thế hàm `getMockData` bằng truy vấn thực tế

```javascript
// API endpoint để lấy dữ liệu báo cáo
app.get('/api/reports/:reportId', async (req, res) => {
  const reportId = parseInt(req.params.reportId);
  const filters = req.query;
  const level = parseInt(req.query.level) || 0;
  
  try {
    // Xây dựng câu truy vấn SQL dựa trên reportId và filters
    let query = '';
    let params = [];
    
    switch (reportId) {
      case 1: // Báo cáo doanh thu theo sản phẩm
        if (level === 0) {
          query = `
            SELECT 
              DimProduct.ProductCategory AS product_category,
              SUM(FactSales.Revenue) AS revenue,
              (SUM(FactSales.Revenue) * 100.0 / (SELECT SUM(Revenue) FROM FactSales)) AS percentage
            FROM FactSales
            JOIN DimProduct ON FactSales.ProductID = DimProduct.ProductID
            GROUP BY DimProduct.ProductCategory
            ORDER BY revenue DESC
          `;
        } else if (level === 1) {
          // Truy vấn chi tiết hơn (drill-down)
          query = `
            SELECT 
              DimProduct.ProductBrand AS product_brand,
              SUM(FactSales.Revenue) AS revenue,
              (SUM(FactSales.Revenue) * 100.0 / (SELECT SUM(Revenue) FROM FactSales WHERE ProductID IN (
                SELECT ProductID FROM DimProduct WHERE ProductCategory = @category
              ))) AS percentage
            FROM FactSales
            JOIN DimProduct ON FactSales.ProductID = DimProduct.ProductID
            WHERE DimProduct.ProductCategory = @category
            GROUP BY DimProduct.ProductBrand
            ORDER BY revenue DESC
          `;
          params.push({ name: 'category', value: filters.product_category });
        }
        break;
      
      // Thêm các trường hợp khác cho các loại báo cáo khác
      // ...
      
      default:
        return res.json({
          columns: [{ field: 'message', label: 'Thông báo', type: 'string' }],
          rows: [{ message: 'Không có dữ liệu cho báo cáo này' }]
        });
    }
    
    // Thực hiện truy vấn
    const request = new sql.Request();
    
    // Thêm các tham số vào request
    params.forEach(param => {
      request.input(param.name, param.value);
    });
    
    const result = await request.query(query);
    
    // Xử lý kết quả và trả về định dạng phù hợp
    const rows = result.recordset;
    
    // Xác định cấu trúc cột dựa trên loại báo cáo
    let columns = [];
    if (reportId === 1) {
      if (level === 0) {
        columns = [
          { field: 'product_category', label: 'Danh mục sản phẩm', type: 'string' },
          { field: 'revenue', label: 'Doanh thu', type: 'currency' },
          { field: 'percentage', label: 'Tỷ lệ', type: 'percent' }
        ];
      } else if (level === 1) {
        columns = [
          { field: 'product_brand', label: 'Thương hiệu', type: 'string' },
          { field: 'revenue', label: 'Doanh thu', type: 'currency' },
          { field: 'percentage', label: 'Tỷ lệ', type: 'percent' }
        ];
      }
    }
    
    res.json({ columns, rows });
  } catch (err) {
    console.error('Lỗi khi truy vấn dữ liệu:', err);
    res.status(500).json({ error: 'Lỗi khi truy vấn dữ liệu' });
  }
});
```

### 4. Cấu hình kết nối với SQL Server Management Studio (SSMS)

1. Mở SQL Server Management Studio
2. Kết nối đến server SQL của bạn
3. Đảm bảo rằng:
   - SQL Server đã được cấu hình để chấp nhận kết nối TCP/IP
   - Cổng SQL Server (mặc định là 1433) đã được mở trong tường lửa
   - Tài khoản SQL Server có quyền truy cập vào database kho dữ liệu

### 5. Xử lý lỗi kết nối phổ biến

- **Lỗi kết nối bị từ chối**: Kiểm tra tường lửa và cấu hình SQL Server Network Configuration
- **Lỗi xác thực**: Kiểm tra tên người dùng và mật khẩu
- **Lỗi không tìm thấy server**: Kiểm tra tên server và đảm bảo SQL Server đang chạy
- **Lỗi timeout**: Tăng giá trị connectionTimeout trong cấu hình kết nối

## Hướng dẫn sử dụng

1. Chọn báo cáo từ danh sách 9 báo cáo có sẵn
2. Sử dụng bộ lọc để lọc dữ liệu theo các tiêu chí khác nhau
3. Thực hiện các thao tác OLAP:
   - Drill-down: Chọn một chiều và nhấn nút Drill-down để xem chi tiết hơn
   - Roll-up: Nhấn nút Roll-up để quay lại mức tổng hợp cao hơn
   - Slice: Chọn một chiều và một giá trị, sau đó nhấn nút Slice
   - Pivot: Chọn chiều cho hàng và cột, sau đó nhấn nút Pivot
4. Xuất dữ liệu: Nhấn nút "Xuất Excel" để tải dữ liệu dưới dạng file CSV với hỗ trợ đầy đủ tiếng Việt (UTF-8)