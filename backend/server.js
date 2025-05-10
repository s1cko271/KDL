// Server backend cho ứng dụng OLAP
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Khởi tạo ứng dụng Express
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API endpoint để lấy dữ liệu báo cáo
app.get('/api/reports/:reportId', (req, res) => {
    const reportId = parseInt(req.params.reportId);
    const filters = req.query;
    const level = parseInt(req.query.level) || 0;
    
    // Xóa level khỏi filters để không ảnh hưởng đến logic lọc
    delete filters.level;
    
    // Trong môi trường thực tế, sẽ truy vấn cơ sở dữ liệu kho dữ liệu
    // Ở đây chỉ trả về dữ liệu mẫu
    const data = getMockData(reportId, filters, level);
    
    res.json(data);
});

// Hàm lấy dữ liệu mẫu dựa trên cấu trúc kho dữ liệu thực tế
function getMockData(reportId, filters = {}, level = 0) {
    // Tạo cột dựa trên loại báo cáo và cấp độ chi tiết
    let columns = [];
    let rows = [];

    // Xác định các cột dựa trên loại báo cáo và cấu trúc kho dữ liệu
    switch (reportId) {
        // Báo cáo doanh thu theo sản phẩm (Dim_Item)
        case 1:
            if (level === 0) {
                columns = [
                    { field: 'descriptions', label: 'Mô tả sản phẩm', type: 'string' },
                    { field: 'revenue', label: 'Doanh thu', type: 'currency' },
                    { field: 'percentage', label: 'Tỷ lệ', type: 'percent' }
                ];
                rows = [
                    { descriptions: 'Sản phẩm A', revenue: 1500000000, percentage: 45 },
                    { descriptions: 'Sản phẩm B', revenue: 800000000, percentage: 24 },
                    { descriptions: 'Sản phẩm C', revenue: 600000000, percentage: 18 },
                    { descriptions: 'Sản phẩm D', revenue: 450000000, percentage: 13 }
                ];
            } else if (level === 1) {
                // Drill-down theo phân cấp thời gian
                if (filters.drillDimension === 'years') {
                    columns = [
                        { field: 'quarters', label: 'Quý', type: 'number' },
                        { field: 'descriptions', label: 'Mô tả sản phẩm', type: 'string' },
                        { field: 'revenue', label: 'Doanh thu', type: 'currency' },
                        { field: 'percentage', label: 'Tỷ lệ', type: 'percent' }
                    ];
                    rows = [
                        { quarters: 1, descriptions: 'Sản phẩm A', revenue: 400000000, percentage: 40 },
                        { quarters: 2, descriptions: 'Sản phẩm A', revenue: 350000000, percentage: 35 },
                        { quarters: 3, descriptions: 'Sản phẩm A', revenue: 450000000, percentage: 45 },
                        { quarters: 4, descriptions: 'Sản phẩm A', revenue: 300000000, percentage: 30 }
                    ];
                } 
                // Drill-down theo kích thước sản phẩm
                else if (filters.drillDimension === 'descriptions') {
                    columns = [
                        { field: 'size', label: 'Kích thước', type: 'string' },
                        { field: 'revenue', label: 'Doanh thu', type: 'currency' },
                        { field: 'percentage', label: 'Tỷ lệ', type: 'percent' }
                    ];
                    rows = [
                        { size: 'S', revenue: 300000000, percentage: 20 },
                        { size: 'M', revenue: 450000000, percentage: 30 },
                        { size: 'L', revenue: 500000000, percentage: 33 },
                        { size: 'XL', revenue: 250000000, percentage: 17 }
                    ];
                }
            }
            break;

        // Báo cáo doanh thu theo khu vực (Dim_City, Dim_Store)
        case 2:
            if (level === 0) {
                columns = [
                    { field: 'states', label: 'Bang', type: 'string' },
                    { field: 'revenue', label: 'Doanh thu', type: 'currency' },
                    { field: 'percentage', label: 'Tỷ lệ', type: 'percent' }
                ];
                rows = [
                    { states: 'Oregon', revenue: 1200000000, percentage: 30 },
                    { states: 'Nebraska', revenue: 950000000, percentage: 24 },
                    { states: 'Massachusetts', revenue: 850000000, percentage: 21 },
                    { states: 'Utah', revenue: 650000000, percentage: 16 },
                    { states: 'West Virginia', revenue: 350000000, percentage: 9 }
                ];
            } else if (level === 1) {
                // Drill-down từ bang xuống thành phố
                if (filters.drillDimension === 'states') {
                    columns = [
                        { field: 'city_name', label: 'Thành phố', type: 'string' },
                        { field: 'revenue', label: 'Doanh thu', type: 'currency' },
                        { field: 'percentage', label: 'Tỷ lệ', type: 'percent' }
                    ];
                    rows = [
                        { city_name: 'Vanghaven', revenue: 700000000, percentage: 58 },
                        { city_name: 'West Justin', revenue: 500000000, percentage: 42 }
                    ];
                }
            } else if (level === 2) {
                // Drill-down từ thành phố xuống cửa hàng
                if (filters.drillDimension === 'city_name') {
                    columns = [
                        { field: 'store_key', label: 'Mã cửa hàng', type: 'number' },
                        { field: 'revenue', label: 'Doanh thu', type: 'currency' },
                        { field: 'percentage', label: 'Tỷ lệ', type: 'percent' }
                    ];
                    rows = [
                        { store_key: 1, revenue: 400000000, percentage: 57 },
                        { store_key: 2, revenue: 300000000, percentage: 43 }
                    ];
                }
            }
            break;

        // Báo cáo doanh thu theo thời gian (Dim_Time, Dim_Customer)
        case 3:
            if (level === 0) {
                columns = [
                    { field: 'years', label: 'Năm', type: 'number' },
                    { field: 'revenue', label: 'Doanh thu', type: 'currency' },
                    { field: 'percentage', label: 'Tỷ lệ', type: 'percent' }
                ];
                rows = [
                    { years: 2020, revenue: 800000000, percentage: 20 },
                    { years: 2021, revenue: 950000000, percentage: 24 },
                    { years: 2022, revenue: 1100000000, percentage: 27 },
                    { years: 2023, revenue: 1200000000, percentage: 29 }
                ];
            } else if (level === 1) {
                // Drill-down từ năm xuống quý
                if (filters.drillDimension === 'years') {
                    columns = [
                        { field: 'quarters', label: 'Quý', type: 'number' },
                        { field: 'revenue', label: 'Doanh thu', type: 'currency' },
                        { field: 'percentage', label: 'Tỷ lệ', type: 'percent' }
                    ];
                    rows = [
                        { quarters: 1, revenue: 250000000, percentage: 21 },
                        { quarters: 2, revenue: 300000000, percentage: 25 },
                        { quarters: 3, revenue: 350000000, percentage: 29 },
                        { quarters: 4, revenue: 300000000, percentage: 25 }
                    ];
                }
            } else if (level === 2) {
                // Drill-down từ quý xuống tháng
                if (filters.drillDimension === 'quarters') {
                    columns = [
                        { field: 'months', label: 'Tháng', type: 'number' },
                        { field: 'revenue', label: 'Doanh thu', type: 'currency' },
                        { field: 'percentage', label: 'Tỷ lệ', type: 'percent' }
                    ];
                    rows = [
                        { months: 1, revenue: 80000000, percentage: 32 },
                        { months: 2, revenue: 85000000, percentage: 34 },
                        { months: 3, revenue: 85000000, percentage: 34 }
                    ];
                }
            }
            break;

        default:
            columns = [
                { field: 'message', label: 'Thông báo', type: 'string' }
            ];
            rows = [
                { message: 'Không có dữ liệu cho báo cáo này' }
            ];
    }

    // Áp dụng bộ lọc nếu có (Slice và Dice)
    if (Object.keys(filters).length > 0) {
        // Xử lý slice (lọc theo một chiều) và dice (lọc theo nhiều chiều)
        Object.entries(filters).forEach(([key, value]) => {
            // Bỏ qua các bộ lọc đặc biệt dùng cho OLAP
            if (!['drillDimension', 'pivotRow', 'pivotCol'].includes(key)) {
                rows = rows.filter(row => {
                    // Nếu row có thuộc tính key và giá trị bằng value
                    if (row[key] !== undefined) {
                        return row[key].toString() === value.toString();
                    }
                    return true;
                });
            }
        });
        
        // Xử lý pivot (xoay trục dữ liệu)
        if (filters.pivotRow && filters.pivotCol && rows.length > 0) {
            const pivotRow = filters.pivotRow;
            const pivotCol = filters.pivotCol;
            
            // Kiểm tra xem các chiều pivot có tồn tại trong dữ liệu không
            if (rows[0][pivotRow] !== undefined && rows[0][pivotCol] !== undefined) {
                // Tạo cấu trúc dữ liệu pivot
                const pivotData = {};
                const colValues = new Set();
                
                // Gom nhóm dữ liệu theo chiều hàng và chiều cột
                rows.forEach(row => {
                    const rowKey = row[pivotRow];
                    const colKey = row[pivotCol];
                    colValues.add(colKey);
                    
                    if (!pivotData[rowKey]) {
                        pivotData[rowKey] = {};
                    }
                    
                    // Giả sử chúng ta đang pivot theo doanh thu
                    pivotData[rowKey][colKey] = row.revenue || 0;
                });
                
                // Tạo lại cột và hàng dựa trên dữ liệu pivot
                const colValuesArray = Array.from(colValues);
                columns = [
                    { field: pivotRow, label: pivotRow, type: 'string' },
                    ...colValuesArray.map(colValue => ({
                        field: `${colValue}`, 
                        label: `${colValue}`, 
                        type: 'currency'
                    }))
                ];
                
                // Tạo lại dữ liệu hàng
                rows = Object.entries(pivotData).map(([rowKey, colData]) => {
                    const newRow = { [pivotRow]: rowKey };
                    colValuesArray.forEach(colKey => {
                        newRow[`${colKey}`] = colData[colKey] || 0;
                    });
                    return newRow;
                });
            }
        }
    }

    return {
        columns: columns,
        rows: rows
    };
}

// Khởi động server
app.listen(port, () => {
    console.log(`Server đang chạy tại http://localhost:${port}`);
});

// Thêm route mặc định
app.get('/', (req, res) => {
    res.send('API Server cho ứng dụng OLAP - Bài tập lớn môn Kho Dữ liệu');
});