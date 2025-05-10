// API Service để kết nối với backend và xử lý các yêu cầu dữ liệu

// Đối tượng API chính
const api = {
    // URL cơ sở của API
    baseUrl: 'http://localhost:5000/api',

    // Hàm lấy dữ liệu báo cáo
    getReportData: async (reportId, filters = {}, level = 0) => {
        try {
            // Kiểm tra xem backend có đang chạy không
            try {
                const response = await fetch(`${api.baseUrl}/reports/${reportId}`, { 
                    method: 'HEAD'
                });
                
                if (response.ok) {
                    // Backend đang chạy, gọi API thực tế
                    const queryParams = new URLSearchParams({
                        ...filters,
                        level: level
                    }).toString();
                    
                    const dataResponse = await fetch(`${api.baseUrl}/reports/${reportId}?${queryParams}`);
                    
                    if (!dataResponse.ok) {
                        throw new Error(`HTTP error! status: ${dataResponse.status}`);
                    }
                    
                    return await dataResponse.json();
                } else {
                    // Backend không phản hồi, sử dụng dữ liệu mẫu
                    console.warn('Backend không phản hồi, sử dụng dữ liệu mẫu');
                    return api.getMockData(reportId, filters, level);
                }
            } catch (error) {
                // Lỗi kết nối, sử dụng dữ liệu mẫu
                console.warn('Không thể kết nối đến backend, sử dụng dữ liệu mẫu', error);
                return api.getMockData(reportId, filters, level);
            }
        } catch (error) {
            console.error('Error fetching report data:', error);
            throw error;
        }
    },

    // Hàm lấy dữ liệu mẫu cho môi trường phát triển
    getMockData: (reportId, filters = {}, level = 0) => {
        // Tạo cột dựa trên loại báo cáo và cấp độ chi tiết
        let columns = [];
        let rows = [];

        // Xác định các cột dựa trên loại báo cáo
        switch (reportId) {
            // Báo cáo doanh thu theo sản phẩm
            case 1:
                if (level === 0) {
                    columns = [
                        { field: 'product_category', label: 'Danh mục sản phẩm', type: 'string' },
                        { field: 'revenue', label: 'Doanh thu', type: 'currency' },
                        { field: 'percentage', label: 'Tỷ lệ', type: 'percent' }
                    ];
                    rows = [
                        { product_category: 'Điện tử', revenue: 1500000000, percentage: 45 },
                        { product_category: 'Thời trang', revenue: 800000000, percentage: 24 },
                        { product_category: 'Đồ gia dụng', revenue: 600000000, percentage: 18 },
                        { product_category: 'Thực phẩm', revenue: 450000000, percentage: 13 }
                    ];
                } else if (level === 1) {
                    // Drill-down vào danh mục sản phẩm
                    columns = [
                        { field: 'product_brand', label: 'Thương hiệu', type: 'string' },
                        { field: 'revenue', label: 'Doanh thu', type: 'currency' },
                        { field: 'percentage', label: 'Tỷ lệ', type: 'percent' }
                    ];
                    
                    if (filters.drillDimension === 'product_category' && filters.product_category === 'Điện tử') {
                        rows = [
                            { product_brand: 'Samsung', revenue: 500000000, percentage: 33.3 },
                            { product_brand: 'Apple', revenue: 450000000, percentage: 30 },
                            { product_brand: 'Sony', revenue: 300000000, percentage: 20 },
                            { product_brand: 'LG', revenue: 150000000, percentage: 10 },
                            { product_brand: 'Khác', revenue: 100000000, percentage: 6.7 }
                        ];
                    } else {
                        rows = [
                            { product_brand: 'Thương hiệu A', revenue: 300000000, percentage: 40 },
                            { product_brand: 'Thương hiệu B', revenue: 250000000, percentage: 30 },
                            { product_brand: 'Thương hiệu C', revenue: 150000000, percentage: 20 },
                            { product_brand: 'Khác', revenue: 100000000, percentage: 10 }
                        ];
                    }
                } else if (level === 2) {
                    // Drill-down vào thương hiệu
                    columns = [
                        { field: 'product_name', label: 'Tên sản phẩm', type: 'string' },
                        { field: 'revenue', label: 'Doanh thu', type: 'currency' },
                        { field: 'quantity', label: 'Số lượng', type: 'number' },
                        { field: 'percentage', label: 'Tỷ lệ', type: 'percent' }
                    ];
                    
                    rows = [
                        { product_name: 'Sản phẩm 1', revenue: 150000000, quantity: 120, percentage: 30 },
                        { product_name: 'Sản phẩm 2', revenue: 120000000, quantity: 95, percentage: 24 },
                        { product_name: 'Sản phẩm 3', revenue: 100000000, quantity: 80, percentage: 20 },
                        { product_name: 'Sản phẩm 4', revenue: 80000000, quantity: 65, percentage: 16 },
                        { product_name: 'Sản phẩm 5', revenue: 50000000, quantity: 40, percentage: 10 }
                    ];
                }
                break;

            // Báo cáo doanh thu theo khu vực
            case 2:
                if (level === 0) {
                    columns = [
                        { field: 'region', label: 'Vùng miền', type: 'string' },
                        { field: 'revenue', label: 'Doanh thu', type: 'currency' },
                        { field: 'percentage', label: 'Tỷ lệ', type: 'percent' }
                    ];
                    rows = [
                        { region: 'Miền Bắc', revenue: 1200000000, percentage: 40 },
                        { region: 'Miền Trung', revenue: 600000000, percentage: 20 },
                        { region: 'Miền Nam', revenue: 1200000000, percentage: 40 }
                    ];
                } else if (level === 1) {
                    // Drill-down vào vùng miền
                    columns = [
                        { field: 'province', label: 'Tỉnh/Thành phố', type: 'string' },
                        { field: 'revenue', label: 'Doanh thu', type: 'currency' },
                        { field: 'percentage', label: 'Tỷ lệ', type: 'percent' }
                    ];
                    
                    if (filters.drillDimension === 'region' && filters.region === 'Miền Bắc') {
                        rows = [
                            { province: 'Hà Nội', revenue: 800000000, percentage: 66.7 },
                            { province: 'Hải Phòng', revenue: 200000000, percentage: 16.7 },
                            { province: 'Quảng Ninh', revenue: 100000000, percentage: 8.3 },
                            { province: 'Khác', revenue: 100000000, percentage: 8.3 }
                        ];
                    } else if (filters.drillDimension === 'region' && filters.region === 'Miền Nam') {
                        rows = [
                            { province: 'TP.HCM', revenue: 900000000, percentage: 75 },
                            { province: 'Cần Thơ', revenue: 150000000, percentage: 12.5 },
                            { province: 'Khác', revenue: 150000000, percentage: 12.5 }
                        ];
                    } else {
                        rows = [
                            { province: 'Đà Nẵng', revenue: 350000000, percentage: 58.3 },
                            { province: 'Huế', revenue: 150000000, percentage: 25 },
                            { province: 'Khác', revenue: 100000000, percentage: 16.7 }
                        ];
                    }
                }
                break;

            // Báo cáo doanh thu theo thời gian
            case 3:
                if (level === 0) {
                    columns = [
                        { field: 'year', label: 'Năm', type: 'number' },
                        { field: 'revenue', label: 'Doanh thu', type: 'currency' },
                        { field: 'growth', label: 'Tăng trưởng', type: 'percent' }
                    ];
                    rows = [
                        { year: 2020, revenue: 2500000000, growth: 0 },
                        { year: 2021, revenue: 2800000000, growth: 12 },
                        { year: 2022, revenue: 3200000000, growth: 14.3 },
                        { year: 2023, revenue: 3500000000, growth: 9.4 }
                    ];
                } else if (level === 1) {
                    // Drill-down vào năm
                    columns = [
                        { field: 'quarter', label: 'Quý', type: 'string' },
                        { field: 'revenue', label: 'Doanh thu', type: 'currency' },
                        { field: 'percentage', label: 'Tỷ lệ', type: 'percent' }
                    ];
                    
                    rows = [
                        { quarter: 'Quý 1', revenue: 800000000, percentage: 22.9 },
                        { quarter: 'Quý 2', revenue: 850000000, percentage: 24.3 },
                        { quarter: 'Quý 3', revenue: 950000000, percentage: 27.1 },
                        { quarter: 'Quý 4', revenue: 900000000, percentage: 25.7 }
                    ];
                } else if (level === 2) {
                    // Drill-down vào quý
                    columns = [
                        { field: 'month', label: 'Tháng', type: 'string' },
                        { field: 'revenue', label: 'Doanh thu', type: 'currency' },
                        { field: 'percentage', label: 'Tỷ lệ', type: 'percent' }
                    ];
                    
                    rows = [
                        { month: 'Tháng 1', revenue: 250000000, percentage: 31.3 },
                        { month: 'Tháng 2', revenue: 270000000, percentage: 33.8 },
                        { month: 'Tháng 3', revenue: 280000000, percentage: 35 }
                    ];
                }
                break;

            // Báo cáo số lượng bán theo sản phẩm
            case 4:
                if (level === 0) {
                    columns = [
                        { field: 'product_category', label: 'Danh mục sản phẩm', type: 'string' },
                        { field: 'quantity', label: 'Số lượng', type: 'number' },
                        { field: 'percentage', label: 'Tỷ lệ', type: 'percent' }
                    ];
                    rows = [
                        { product_category: 'Điện tử', quantity: 12500, percentage: 35.7 },
                        { product_category: 'Thời trang', quantity: 10000, percentage: 28.6 },
                        { product_category: 'Đồ gia dụng', quantity: 7500, percentage: 21.4 },
                        { product_category: 'Thực phẩm', quantity: 5000, percentage: 14.3 }
                    ];
                }
                break;

            // Báo cáo số lượng bán theo khu vực
            case 5:
                if (level === 0) {
                    columns = [
                        { field: 'region', label: 'Vùng miền', type: 'string' },
                        { field: 'quantity', label: 'Số lượng', type: 'number' },
                        { field: 'percentage', label: 'Tỷ lệ', type: 'percent' }
                    ];
                    rows = [
                        { region: 'Miền Bắc', quantity: 15000, percentage: 42.9 },
                        { region: 'Miền Trung', quantity: 7000, percentage: 20 },
                        { region: 'Miền Nam', quantity: 13000, percentage: 37.1 }
                    ];
                }
                break;

            // Báo cáo số lượng bán theo thời gian
            case 6:
                if (level === 0) {
                    columns = [
                        { field: 'year', label: 'Năm', type: 'number' },
                        { field: 'quantity', label: 'Số lượng', type: 'number' },
                        { field: 'growth', label: 'Tăng trưởng', type: 'percent' }
                    ];
                    rows = [
                        { year: 2020, quantity: 25000, growth: 0 },
                        { year: 2021, quantity: 28000, growth: 12 },
                        { year: 2022, quantity: 32000, growth: 14.3 },
                        { year: 2023, quantity: 35000, growth: 9.4 }
                    ];
                }
                break;

            // Báo cáo lợi nhuận theo sản phẩm
            case 7:
                if (level === 0) {
                    columns = [
                        { field: 'product_category', label: 'Danh mục sản phẩm', type: 'string' },
                        { field: 'profit', label: 'Lợi nhuận', type: 'currency' },
                        { field: 'percentage', label: 'Tỷ lệ', type: 'percent' }
                    ];
                    rows = [
                        { product_category: 'Điện tử', profit: 450000000, percentage: 45 },
                        { product_category: 'Thời trang', profit: 240000000, percentage: 24 },
                        { product_category: 'Đồ gia dụng', profit: 180000000, percentage: 18 },
                        { product_category: 'Thực phẩm', profit: 130000000, percentage: 13 }
                    ];
                }
                break;

            // Báo cáo lợi nhuận theo khu vực
            case 8:
                if (level === 0) {
                    columns = [
                        { field: 'region', label: 'Vùng miền', type: 'string' },
                        { field: 'profit', label: 'Lợi nhuận', type: 'currency' },
                        { field: 'percentage', label: 'Tỷ lệ', type: 'percent' }
                    ];
                    rows = [
                        { region: 'Miền Bắc', profit: 360000000, percentage: 40 },
                        { region: 'Miền Trung', profit: 180000000, percentage: 20 },
                        { region: 'Miền Nam', profit: 360000000, percentage: 40 }
                    ];
                }
                break;

            // Báo cáo lợi nhuận theo thời gian
            case 9:
                if (level === 0) {
                    columns = [
                        { field: 'year', label: 'Năm', type: 'number' },
                        { field: 'profit', label: 'Lợi nhuận', type: 'currency' },
                        { field: 'growth', label: 'Tăng trưởng', type: 'percent' }
                    ];
                    rows = [
                        { year: 2020, profit: 750000000, growth: 0 },
                        { year: 2021, profit: 840000000, growth: 12 },
                        { year: 2022, profit: 960000000, growth: 14.3 },
                        { year: 2023, profit: 1050000000, growth: 9.4 }
                    ];
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

        // Áp dụng bộ lọc nếu có
        if (Object.keys(filters).length > 0) {
            // Xử lý slice
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

            // Xử lý pivot nếu có
            if (filters.pivotRow && filters.pivotCol) {
                // Trong môi trường thực tế, sẽ gọi API để lấy dữ liệu pivot
                // Ở đây chỉ mô phỏng dữ liệu pivot đơn giản
                if (filters.pivotRow === 'product_category' && filters.pivotCol === 'year') {
                    columns = [
                        { field: 'product_category', label: 'Danh mục sản phẩm', type: 'string' },
                        { field: '2020', label: '2020', type: 'currency' },
                        { field: '2021', label: '2021', type: 'currency' },
                        { field: '2022', label: '2022', type: 'currency' },
                        { field: '2023', label: '2023', type: 'currency' },
                        { field: 'total', label: 'Tổng', type: 'currency' }
                    ];
                    rows = [
                        { product_category: 'Điện tử', '2020': 350000000, '2021': 400000000, '2022': 450000000, '2023': 500000000, total: 1700000000 },
                        { product_category: 'Thời trang', '2020': 200000000, '2021': 220000000, '2022': 240000000, '2023': 260000000, total: 920000000 },
                        { product_category: 'Đồ gia dụng', '2020': 150000000, '2021': 160000000, '2022': 170000000, '2023': 180000000, total: 660000000 },
                        { product_category: 'Thực phẩm', '2020': 100000000, '2021': 110000000, '2022': 120000000, '2023': 130000000, total: 460000000 },
                        { product_category: 'Tổng', '2020': 800000000, '2021': 890000000, '2022': 980000000, '2023': 1070000000, total: 3740000000 }
                    ];
                } else if (filters.pivotRow === 'region' && filters.pivotCol === 'product_category') {
                    columns = [
                        { field: 'region', label: 'Vùng miền', type: 'string' },
                        { field: 'Điện tử', label: 'Điện tử', type: 'currency' },
                        { field: 'Thời trang', label: 'Thời trang', type: 'currency' },
                        { field: 'Đồ gia dụng', label: 'Đồ gia dụng', type: 'currency' },
                        { field: 'Thực phẩm', label: 'Thực phẩm', type: 'currency' },
                        { field: 'total', label: 'Tổng', type: 'currency' }
                    ];
                    rows = [
                        { region: 'Miền Bắc', 'Điện tử': 600000000, 'Thời trang': 320000000, 'Đồ gia dụng': 240000000, 'Thực phẩm': 180000000, total: 1340000000 },
                        { region: 'Miền Trung', 'Điện tử': 300000000, 'Thời trang': 160000000, 'Đồ gia dụng': 120000000, 'Thực phẩm': 90000000, total: 670000000 },
                        { region: 'Miền Nam', 'Điện tử': 600000000, 'Thời trang': 320000000, 'Đồ gia dụng': 240000000, 'Thực phẩm': 180000000, total: 1340000000 },
                        { region: 'Tổng', 'Điện tử': 1500000000, 'Thời trang': 800000000, 'Đồ gia dụng': 600000000, 'Thực phẩm': 450000000, total: 3350000000 }
                    ];
                }
            }
        }

        return {
            columns: columns,
            rows: rows
        };
    }
};