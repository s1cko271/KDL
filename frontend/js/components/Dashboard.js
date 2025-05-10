// Component Dashboard hiển thị danh sách báo cáo dạng tab và cho phép người dùng chọn báo cáo

const Dashboard = ({ reports, currentReport, onReportChange }) => {
    // Nhóm báo cáo theo loại
    const reportGroups = {
        'revenue': reports.filter(r => [1, 2, 3].includes(r.id)),  // Báo cáo doanh thu
        'quantity': reports.filter(r => [4, 5, 6].includes(r.id)), // Báo cáo số lượng
        'profit': reports.filter(r => [7, 8, 9].includes(r.id))    // Báo cáo lợi nhuận
    };
    
    // Lấy tên nhóm báo cáo hiện tại
    const getCurrentGroupName = () => {
        if ([1, 2, 3].includes(currentReport)) return 'revenue';
        if ([4, 5, 6].includes(currentReport)) return 'quantity';
        if ([7, 8, 9].includes(currentReport)) return 'profit';
        return 'revenue';
    };
    
    // State cho tab nhóm báo cáo đang được chọn
    const [activeGroup, setActiveGroup] = React.useState(getCurrentGroupName());
    
    // Danh sách các tab nhóm báo cáo
    const reportGroupTabs = [
        { id: 'revenue', label: 'Doanh thu', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'quantity', label: 'Số lượng', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
        { id: 'profit', label: 'Lợi nhuận', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    ];
    
    // Mô tả chi tiết cho từng loại báo cáo
    const getReportDescription = (reportId) => {
        const descriptions = {
            // Báo cáo doanh thu
            1: 'Phân tích doanh thu theo sản phẩm, cho phép drill-down từ danh mục sản phẩm đến sản phẩm cụ thể.',
            2: 'Phân tích doanh thu theo khu vực địa lý, cho phép drill-down từ vùng miền đến tỉnh/thành phố.',
            3: 'Phân tích doanh thu theo thời gian, cho phép drill-down từ năm đến quý, tháng và ngày.',
            // Báo cáo số lượng
            4: 'Phân tích số lượng bán ra theo sản phẩm, cho phép so sánh giữa các danh mục sản phẩm.',
            5: 'Phân tích số lượng bán ra theo khu vực, cho phép so sánh giữa các vùng miền và tỉnh thành.',
            6: 'Phân tích số lượng bán ra theo thời gian, cho phép so sánh giữa các kỳ.',
            // Báo cáo lợi nhuận
            7: 'Phân tích lợi nhuận theo sản phẩm, cho phép đánh giá hiệu quả kinh doanh của từng sản phẩm.',
            8: 'Phân tích lợi nhuận theo khu vực, cho phép đánh giá hiệu quả kinh doanh theo địa lý.',
            9: 'Phân tích lợi nhuận theo thời gian, cho phép đánh giá xu hướng lợi nhuận theo thời gian.'
        };
        return descriptions[reportId] || 'Sử dụng các điều khiển OLAP để phân tích dữ liệu.';
    };
    
    // Lấy thông tin về chiều dữ liệu chính của báo cáo
    const getReportDimensions = (reportId) => {
        const dimensions = {
            // Báo cáo theo sản phẩm
            1: ['Danh mục sản phẩm', 'Sản phẩm', 'Thương hiệu'],
            4: ['Danh mục sản phẩm', 'Sản phẩm', 'Thương hiệu'],
            7: ['Danh mục sản phẩm', 'Sản phẩm', 'Thương hiệu'],
            // Báo cáo theo khu vực
            2: ['Vùng miền', 'Tỉnh/Thành phố', 'Cửa hàng'],
            5: ['Vùng miền', 'Tỉnh/Thành phố', 'Cửa hàng'],
            8: ['Vùng miền', 'Tỉnh/Thành phố', 'Cửa hàng'],
            // Báo cáo theo thời gian
            3: ['Năm', 'Quý', 'Tháng', 'Ngày'],
            6: ['Năm', 'Quý', 'Tháng', 'Ngày'],
            9: ['Năm', 'Quý', 'Tháng', 'Ngày']
        };
        return dimensions[reportId] || [];
    };
    
    // Xử lý khi chuyển tab nhóm báo cáo
    const handleGroupChange = (groupId) => {
        setActiveGroup(groupId);
        // Chọn báo cáo đầu tiên trong nhóm nếu báo cáo hiện tại không thuộc nhóm mới
        const currentGroupReports = reportGroups[groupId];
        if (!currentGroupReports.some(r => r.id === currentReport)) {
            onReportChange(currentGroupReports[0].id);
        }
    };
    
    // Lấy thông tin báo cáo hiện tại
    const currentReportInfo = reports.find(r => r.id === currentReport) || {};
    const reportDimensions = getReportDimensions(currentReport);
    
    return (
        <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Chọn báo cáo</h2>
            
            {/* Tab nhóm báo cáo */}
            <div className="mb-4 border-b border-gray-200">
                <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                    {reportGroupTabs.map(group => (
                        <li key={group.id} className="mr-2">
                            <button
                                className={`inline-flex items-center p-4 border-b-2 rounded-t-lg ${activeGroup === group.id ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}`}
                                onClick={() => handleGroupChange(group.id)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d={group.icon} clipRule="evenodd" />
                                </svg>
                                {group.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            
            {/* Danh sách báo cáo trong nhóm đang chọn */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reportGroups[activeGroup].map(report => (
                    <div 
                        key={report.id}
                        className={`dashboard-card p-4 rounded-lg shadow cursor-pointer transition-all ${currentReport === report.id ? 'bg-blue-500 text-white' : 'bg-white hover:bg-blue-50'}`}
                        onClick={() => onReportChange(report.id)}
                    >
                        <h3 className="font-medium">{report.name}</h3>
                        <p className={`mt-2 text-xs ${currentReport === report.id ? 'text-blue-100' : 'text-gray-500'}`}>
                            {getReportDescription(report.id).substring(0, 60)}...
                        </p>
                        <div className="mt-2 text-sm">
                            {currentReport === report.id && (
                                <span className="inline-block px-2 py-1 rounded-full bg-blue-600 text-xs">
                                    Đang xem
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Hiển thị thông tin chi tiết về báo cáo hiện tại */}
            <div className="mt-6 p-4 bg-white rounded-lg shadow">
                <h3 className="font-semibold text-lg mb-2">
                    {currentReportInfo.name || 'Báo cáo'}
                </h3>
                <p className="text-gray-600 mb-3">
                    {getReportDescription(currentReport)}
                </p>
                
                {reportDimensions.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-md">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Chiều dữ liệu chính:</h4>
                        <div className="flex flex-wrap gap-2">
                            {reportDimensions.map((dim, index) => (
                                <span key={index} className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md">
                                    {dim}
                                    {index < reportDimensions.length - 1 && (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="mt-4 text-sm text-gray-600">
                    <p>Sử dụng các điều khiển OLAP bên dưới để thực hiện các thao tác phân tích dữ liệu:</p>
                    <ul className="list-disc pl-5 mt-2">
                        <li><span className="font-medium">Drill-down:</span> Đi sâu vào chi tiết dữ liệu</li>
                        <li><span className="font-medium">Roll-up:</span> Quay lại mức tổng hợp cao hơn</li>
                        <li><span className="font-medium">Slice:</span> Lọc dữ liệu theo một giá trị cụ thể</li>
                        <li><span className="font-medium">Dice:</span> Lọc dữ liệu theo nhiều chiều</li>
                        <li><span className="font-medium">Pivot:</span> Xoay trục dữ liệu để phân tích từ góc nhìn khác</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};