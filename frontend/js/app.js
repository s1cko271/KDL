// Ứng dụng React chính cho hệ thống báo cáo OLAP

// Định nghĩa ứng dụng chính
const App = () => {
    // State cho báo cáo hiện tại được chọn
    const [currentReport, setCurrentReport] = React.useState(1);
    // State cho dữ liệu báo cáo
    const [reportData, setReportData] = React.useState([]);
    // State cho các bộ lọc
    const [filters, setFilters] = React.useState({});
    // State cho trạng thái tải
    const [loading, setLoading] = React.useState(false);
    // State cho thông báo lỗi
    const [error, setError] = React.useState(null);
    // State cho cấp độ chi tiết hiện tại (dùng cho drill-down/roll-up)
    const [currentLevel, setCurrentLevel] = React.useState(0);
    // State cho các cột hiển thị
    const [visibleColumns, setVisibleColumns] = React.useState([]);

    // Danh sách các báo cáo có sẵn
    const availableReports = [
        { id: 1, name: "Báo cáo doanh thu theo sản phẩm" },
        { id: 2, name: "Báo cáo doanh thu theo khu vực" },
        { id: 3, name: "Báo cáo doanh thu theo thời gian" },
        { id: 4, name: "Báo cáo số lượng bán theo sản phẩm" },
        { id: 5, name: "Báo cáo số lượng bán theo khu vực" },
        { id: 6, name: "Báo cáo số lượng bán theo thời gian" },
        { id: 7, name: "Báo cáo lợi nhuận theo sản phẩm" },
        { id: 8, name: "Báo cáo lợi nhuận theo khu vực" },
        { id: 9, name: "Báo cáo lợi nhuận theo thời gian" },
    ];

    // Tải dữ liệu báo cáo khi thay đổi báo cáo hoặc bộ lọc
    React.useEffect(() => {
        loadReportData();
    }, [currentReport, filters, currentLevel]);

    // Hàm tải dữ liệu báo cáo
    const loadReportData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Gọi API để lấy dữ liệu báo cáo
            const data = await api.getReportData(currentReport, filters, currentLevel);
            
            setReportData(data.rows || []);
            setVisibleColumns(data.columns || []);
            setLoading(false);
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu báo cáo:", err);
            setError("Không thể tải dữ liệu báo cáo. Vui lòng thử lại sau.");
            setLoading(false);
        }
    };

    // Xử lý thay đổi báo cáo
    const handleReportChange = (reportId) => {
        setCurrentReport(reportId);
        setFilters({});
        setCurrentLevel(0);
    };

    // Xử lý thay đổi bộ lọc
    const handleFilterChange = (newFilters) => {
        setFilters({...filters, ...newFilters});
    };

    // Xử lý thao tác drill-down
    const handleDrillDown = (dimension) => {
        setCurrentLevel(currentLevel + 1);
        // Thêm thông tin về chiều đang drill-down
        setFilters({...filters, drillDimension: dimension});
    };

    // Xử lý thao tác roll-up
    const handleRollUp = () => {
        if (currentLevel > 0) {
            setCurrentLevel(currentLevel - 1);
            // Xóa thông tin về chiều đang drill-down
            const newFilters = {...filters};
            delete newFilters.drillDimension;
            setFilters(newFilters);
        }
    };

    // Xử lý thao tác slice
    const handleSlice = (dimension, value) => {
        setFilters({...filters, [dimension]: value});
    };

    // Xử lý thao tác dice
    const handleDice = (filterSet) => {
        setFilters({...filters, ...filterSet});
    };

    // Xử lý thao tác pivot
    const handlePivot = (rowDimension, colDimension) => {
        setFilters({...filters, pivotRow: rowDimension, pivotCol: colDimension});
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-blue-600 text-white shadow-lg">
                <div className="container mx-auto px-4 py-4">
                    <h1 className="text-2xl font-bold">Hệ thống Báo cáo Kho Dữ liệu</h1>
                    <p className="text-blue-100">Phân tích dữ liệu với các thao tác OLAP</p>
                </div>
            </header>

            {/* Main content */}
            <main className="container mx-auto px-4 py-6">
                {/* Dashboard component */}
                <Dashboard 
                    reports={availableReports} 
                    currentReport={currentReport} 
                    onReportChange={handleReportChange} 
                />
                
                {/* Filter panel */}
                <FilterPanel 
                    filters={filters} 
                    onFilterChange={handleFilterChange} 
                    reportId={currentReport}
                />
                
                {/* OLAP Controls */}
                <OlapControls 
                    onDrillDown={handleDrillDown}
                    onRollUp={handleRollUp}
                    onSlice={handleSlice}
                    onDice={handleDice}
                    onPivot={handlePivot}
                    currentLevel={currentLevel}
                    reportId={currentReport}
                />
                
                {/* Loading indicator */}
                {loading && (
                    <div className="flex justify-center my-8">
                        <div className="spinner"></div>
                    </div>
                )}
                
                {/* Error message */}
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4" role="alert">
                        <p>{error}</p>
                    </div>
                )}
                
                {/* Report table */}
                {!loading && !error && (
                    <ReportTable 
                        data={reportData} 
                        columns={visibleColumns} 
                        reportId={currentReport}
                    />
                )}
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-4">
                <div className="container mx-auto px-4 text-center">
                    <p>© 2025 Hệ thống báo cáo kho dữ liệu - Bài tập lớn môn Kho Dữ liệu</p>
                </div>
            </footer>
        </div>
    );
};

// Render ứng dụng vào DOM
ReactDOM.render(<App />, document.getElementById('root'));