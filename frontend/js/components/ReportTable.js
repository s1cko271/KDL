// Component ReportTable hiển thị dữ liệu báo cáo dưới dạng bảng

const ReportTable = ({ data, columns, reportId }) => {
    // Kiểm tra nếu không có dữ liệu
    if (!data || data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <p className="text-gray-500 text-center">Không có dữ liệu để hiển thị. Vui lòng điều chỉnh bộ lọc hoặc chọn báo cáo khác.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-md overflow-hidden">
            <h3 className="text-lg font-semibold mb-4">Kết quả báo cáo #{reportId}</h3>
            
            <div className="overflow-x-auto">
                <table className="olap-table">
                    <thead>
                        <tr>
                            {columns.map((column, index) => (
                                <th key={index} className="text-left">
                                    {column.label || column.field}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {columns.map((column, colIndex) => (
                                    <td key={colIndex}>
                                        {/* Định dạng giá trị dựa trên loại dữ liệu */}
                                        {column.type === 'number' 
                                            ? new Intl.NumberFormat('vi-VN').format(row[column.field] || 0)
                                            : column.type === 'currency'
                                                ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row[column.field] || 0)
                                                : column.type === 'percent'
                                                    ? `${(row[column.field] || 0).toFixed(2)}%`
                                                    : column.type === 'date'
                                                        ? new Date(row[column.field]).toLocaleDateString('vi-VN')
                                                        : row[column.field] || ''}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Hiển thị tổng số bản ghi */}
            <div className="mt-4 text-sm text-gray-600">
                Tổng số: {data.length} bản ghi
            </div>

            {/* Nút xuất báo cáo */}
            <div className="mt-4 flex justify-end">
                <button 
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center"
                    onClick={() => exportToExcel(data, columns)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Xuất Excel
                </button>
            </div>
        </div>
    );
};

// Hàm xuất dữ liệu ra file Excel
const exportToExcel = (data, columns) => {
    // Thêm BOM (Byte Order Mark) để Excel nhận diện đúng mã UTF-8
    const BOM = '\uFEFF';
    
    // Tạo dữ liệu CSV với BOM ở đầu
    let csvContent = "data:text/csv;charset=utf-8," + BOM;
    
    // Thêm tiêu đề cột
    csvContent += columns.map(col => {
        // Đảm bảo tên cột được bao quanh bởi dấu ngoặc kép và escape các ký tự đặc biệt
        const label = (col.label || col.field).replace(/"/g, '""');
        return `"${label}"`;
    }).join(",") + "\r\n";
    
    // Thêm dữ liệu
    data.forEach(row => {
        csvContent += columns.map(col => {
            // Lấy giá trị và xử lý định dạng phù hợp
            let value = row[col.field] || '';
            
            // Định dạng giá trị theo loại dữ liệu
            if (col.type === 'currency') {
                value = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
            } else if (col.type === 'percent') {
                value = `${(value).toFixed(2)}%`;
            } else if (col.type === 'number') {
                value = new Intl.NumberFormat('vi-VN').format(value);
            } else if (col.type === 'date' && value) {
                value = new Date(value).toLocaleDateString('vi-VN');
            }
            
            // Escape các ký tự đặc biệt và bao quanh bởi dấu ngoặc kép
            value = String(value).replace(/"/g, '""');
            return `"${value}"`;
        }).join(",") + "\r\n";
    });
    
    // Tạo link tải xuống
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bao-cao-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    
    // Kích hoạt tải xuống
    link.click();
    
    // Xóa link và giải phóng URL
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};