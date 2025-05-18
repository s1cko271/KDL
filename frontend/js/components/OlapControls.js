// Component OlapControls cho phép người dùng thực hiện các thao tác OLAP

const OlapControls = ({ onDrillDown, onRollUp, onSlice, onDice, onPivot, currentLevel, reportId }) => {
    // State cho việc hiển thị/ẩn panel điều khiển
    const [isExpanded, setIsExpanded] = React.useState(true);
    // State cho chiều được chọn để drill-down
    const [selectedDimension, setSelectedDimension] = React.useState('');
    // State cho chiều được chọn để slice
    const [sliceDimension, setSliceDimension] = React.useState('');
    const [sliceValue, setSliceValue] = React.useState('');
    // State cho các chiều được chọn để pivot
    const [rowDimension, setRowDimension] = React.useState('');
    const [colDimension, setColDimension] = React.useState('');
    // State cho các chiều và giá trị được chọn để dice (lọc nhiều chiều)
    const [diceFilters, setDiceFilters] = React.useState({});
    const [diceDimension, setDiceDimension] = React.useState('');
    const [diceValue, setDiceValue] = React.useState('');

    // Lấy danh sách các chiều dựa trên loại báo cáo và cấu trúc kho dữ liệu
    const getDimensions = () => {
        // Các chiều thời gian từ Dim_Time cho tất cả các báo cáo
        const timeDimensions = [
            { id: 'year', label: 'Năm', level: 1 },
            { id: 'quarter', label: 'Quý', level: 2 },
            { id: 'month', label: 'Tháng', level: 3 },
            { id: 'day', label: 'Ngày', level: 4 },
        ];

        // Các chiều địa lý từ Dim_City/Dim_Store
        const geoDimensions = [
            { id: 'region', label: 'Vùng miền', level: 1 },
            { id: 'city', label: 'Tỉnh/Thành phố', level: 2 },
            { id: 'district', label: 'Quận/Huyện', level: 3 },
            { id: 'store', label: 'Cửa hàng', level: 4 },
        ];
        
        // Các chiều sản phẩm từ Dim_Item
        const productDimensions = [
            { id: 'category', label: 'Danh mục sản phẩm', level: 1 },
            { id: 'brand', label: 'Thương hiệu', level: 2 },
            { id: 'product', label: 'Sản phẩm', level: 3 },
            { id: 'size', label: 'Kích thước', level: 4 },
            { id: 'price', label: 'Giá', level: 5 },
        ];

        // Các chiều riêng cho từng loại báo cáo
        switch(reportId) {
            // Báo cáo liên quan đến sản phẩm (doanh thu, số lượng, lợi nhuận theo sản phẩm)
            case 1: case 4: case 7:
                return [
                    ...productDimensions,
                    ...timeDimensions.slice(0, 2), // Chỉ lấy năm và quý cho báo cáo sản phẩm
                ];
            // Báo cáo liên quan đến khu vực (doanh thu, số lượng, lợi nhuận theo khu vực)
            case 2: case 5: case 8:
                return [
                    ...geoDimensions,
                    ...timeDimensions.slice(0, 2), // Chỉ lấy năm và quý cho báo cáo khu vực
                ];
            // Báo cáo liên quan đến thời gian (doanh thu, số lượng, lợi nhuận theo thời gian)
            case 3: case 6: case 9:
                return [
                    ...timeDimensions,
                    { id: 'customer_type', label: 'Loại khách hàng', level: 1 },
                    { id: 'customer_name', label: 'Tên khách hàng', level: 2 },
                ];
            default:
                return [...timeDimensions, ...geoDimensions, ...productDimensions];
        }
    };

    // Lấy danh sách các giá trị cho chiều được chọn để slice
    const getSliceValues = (dimension) => {
        // Giá trị dựa trên cấu trúc kho dữ liệu thực tế
        switch(dimension) {
            // Chiều thời gian (Dim_Time)
            case 'year':
                return [2020, 2021, 2022, 2023, 2024];
            case 'quarter':
                return [1, 2, 3, 4];
            case 'month':
                return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
            case 'day':
                return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30]; // Ngày trong tháng
                
            // Chiều địa lý
            case 'region':
                return ['Miền Bắc', 'Miền Trung', 'Miền Nam'];
            case 'city':
                return ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Huế', 'Nha Trang', 'Vũng Tàu', 'Đà Lạt', 'Quảng Ninh'];
            case 'district':
                return ['Quận 1', 'Quận 2', 'Quận 3', 'Quận Hoàn Kiếm', 'Quận Ba Đình', 'Quận Hải Châu', 'Quận Ninh Kiều', 'Quận Ngô Quyền', 'Quận Thanh Khê', 'Quận Cẩm Lệ'];
            case 'store':
                return ['CH001', 'CH002', 'CH003', 'CH004', 'CH005', 'CH006', 'CH007', 'CH008', 'CH009', 'CH010'];
                
            // Chiều sản phẩm (Dim_Item)
            case 'category':
                return ['Điện tử', 'Thời trang', 'Đồ gia dụng', 'Thực phẩm', 'Mỹ phẩm'];
            case 'brand':
                return ['Samsung', 'Apple', 'Sony', 'LG', 'Panasonic', 'Toshiba', 'Adidas', 'Nike', 'Uniqlo', 'H&M'];
            case 'product':
                return ['Điện thoại thông minh', 'Máy tính xách tay', 'Tivi', 'Tủ lạnh', 'Máy giặt', 'Áo thun', 'Quần jeans', 'Giày thể thao', 'Nồi cơm điện', 'Máy lọc không khí'];
            case 'size':
                return ['S', 'M', 'L', 'XL', 'XXL', '32 inch', '42 inch', '55 inch', '250L', '350L'];
            case 'price':
                return [1000000, 2000000, 5000000, 10000000, 15000000, 20000000, 30000000, 50000000];
                
            // Chiều khách hàng (Dim_Customer)
            case 'customer_type':
                return ['Khách lẻ', 'Khách doanh nghiệp', 'Khách VIP', 'Khách thường xuyên'];
            case 'customer_name':
                return ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D', 'Hoàng Văn E', 'Công ty TNHH ABC', 'Công ty CP XYZ', 'Doanh nghiệp 123', 'Cửa hàng MNP', 'Siêu thị RST'];
                
            default:
                return [];
        }
    };

    // Xử lý thao tác drill-down
    const handleDrillDown = () => {
        if (selectedDimension) {
            onDrillDown(selectedDimension);
            setSelectedDimension('');
        }
    };

    // Xử lý thao tác slice
    const handleSlice = () => {
        if (sliceDimension && sliceValue) {
            onSlice(sliceDimension, sliceValue);
            setSliceDimension('');
            setSliceValue('');
        }
    };

    // Xử lý thao tác pivot
    const handlePivot = () => {
        if (rowDimension && colDimension) {
            onPivot(rowDimension, colDimension);
            setRowDimension('');
            setColDimension('');
        }
    };

    // Xử lý thao tác dice (lọc theo nhiều chiều)
    const handleAddDiceFilter = () => {
        if (diceDimension && diceValue) {
            setDiceFilters(prev => ({
                ...prev,
                [diceDimension]: diceValue
            }));
            setDiceDimension('');
            setDiceValue('');
        }
    };

    const handleRemoveDiceFilter = (dimension) => {
        const newFilters = {...diceFilters};
        delete newFilters[dimension];
        setDiceFilters(newFilters);
    };

    const handleApplyDice = () => {
        if (Object.keys(diceFilters).length > 0) {
            onDice(diceFilters);
        }
    };

    // Lấy danh sách các chiều
    const dimensions = getDimensions();

    // State cho tab OLAP đang được chọn
    const [activeTab, setActiveTab] = React.useState('drill-down');

    // Danh sách các tab OLAP
    const olapTabs = [
        { id: 'drill-down', label: 'Drill-down / Roll-up', icon: 'M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z' },
        { id: 'slice', label: 'Slice', icon: 'M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
        { id: 'dice', label: 'Dice', icon: 'M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z' },
        { id: 'pivot', label: 'Pivot', icon: 'M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z' },
    ];
    
    // Tab Pivot sẽ luôn được hiển thị
    // const shouldShowPivotTab = activeTab === 'pivot' || activeTab === '';

    return (
        <div className="bg-white rounded-lg shadow-md mb-6">
            {/* Header của panel điều khiển */}
            <div 
                className="p-4 flex justify-between items-center cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 className="font-semibold flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Điều khiển OLAP
                </h3>
                <span className="text-blue-500">
                    {isExpanded ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    )}
                </span>
            </div>

            {/* Panel điều khiển mở rộng */}
            {isExpanded && (
                <div className="p-4 border-t border-gray-200">
                    {/* Thông tin cấp độ chi tiết hiện tại */}
                    <div className="mb-4 p-2 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-800">
                            Cấp độ chi tiết hiện tại: <span className="font-semibold">{currentLevel}</span>
                            {currentLevel > 0 && (
                                <span className="ml-2 text-xs">(Đã drill-down {currentLevel} lần)</span>
                            )}
                        </p>
                    </div>

                    {/* Tab điều khiển OLAP */}
                    <div className="mb-4 border-b border-gray-200">
                        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                            {olapTabs.map(tab => (
                                <li key={tab.id} className="mr-2">
                                    <button
                                        className={`inline-flex items-center p-3 border-b-2 rounded-t-lg ${activeTab === tab.id ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d={tab.icon} clipRule="evenodd" />
                                        </svg>
                                        {tab.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    {/* Nội dung của tab OLAP đang được chọn */}
                    <div className="mt-4">
                        {/* Phần Drill-down và Roll-up */}
                        {activeTab === 'drill-down' && (
                            <div className="border border-gray-200 rounded-md p-4">
                                <h4 className="font-medium mb-3">Drill-down / Roll-up</h4>
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Chọn chiều để Drill-down
                                    </label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        value={selectedDimension}
                                        onChange={(e) => setSelectedDimension(e.target.value)}
                                    >
                                        <option value="">-- Chọn chiều --</option>
                                        {dimensions.map(dim => (
                                            <option key={dim.id} value={dim.id}>
                                                {dim.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        className="olap-button flex-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={handleDrillDown}
                                        disabled={!selectedDimension}
                                    >
                                        <div className="flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            Drill-down
                                        </div>
                                    </button>
                                    <button
                                        className="olap-button flex-1 px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={onRollUp}
                                        disabled={currentLevel === 0}
                                    >
                                        <div className="flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                            Roll-up
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Phần Slice */}
                        {activeTab === 'slice' && (
                            <div className="border border-gray-200 rounded-md p-4">
                                <h4 className="font-medium mb-3">Slice</h4>
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Chọn chiều để Slice
                                    </label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mb-2"
                                        value={sliceDimension}
                                        onChange={(e) => {
                                            setSliceDimension(e.target.value);
                                            setSliceValue('');
                                        }}
                                    >
                                        <option value="">-- Chọn chiều --</option>
                                        {dimensions.map(dim => (
                                            <option key={dim.id} value={dim.id}>
                                                {dim.label}
                                            </option>
                                        ))}
                                    </select>

                                    {sliceDimension && (
                                        <select
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            value={sliceValue}
                                            onChange={(e) => setSliceValue(e.target.value)}
                                        >
                                            <option value="">-- Chọn giá trị --</option>
                                            {getSliceValues(sliceDimension).map(value => (
                                                <option key={value} value={value}>
                                                    {value}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <button
                                    className="olap-button w-full px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleSlice}
                                    disabled={!sliceDimension || !sliceValue}
                                >
                                    <div className="flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                        Áp dụng Slice
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* Phần Dice */}
                        {activeTab === 'dice' && (
                            <div className="border border-gray-200 rounded-md p-4">
                            <h4 className="font-medium mb-3">Dice </h4>
                            
                            {/* Hiển thị các bộ lọc đã thêm */}
                            {Object.keys(diceFilters).length > 0 && (
                                <div className="mb-3 p-2 bg-gray-50 rounded-md">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Các bộ lọc đã chọn:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(diceFilters).map(([dim, val]) => {
                                            const dimObj = dimensions.find(d => d.id === dim);
                                            return (
                                                <div key={dim} className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md">
                                                    <span>{dimObj?.label || dim}: {val}</span>
                                                    <button 
                                                        className="ml-1 text-blue-600 hover:text-blue-800"
                                                        onClick={() => handleRemoveDiceFilter(dim)}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            
                            {/* Thêm bộ lọc mới */}
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Chọn chiều
                                </label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mb-2"
                                    value={diceDimension}
                                    onChange={(e) => {
                                        setDiceDimension(e.target.value);
                                        setDiceValue('');
                                    }}
                                >
                                    <option value="">-- Chọn chiều --</option>
                                    {dimensions.map(dim => (
                                        <option key={dim.id} value={dim.id}>
                                            {dim.label}
                                        </option>
                                    ))}
                                </select>

                                {diceDimension && (
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        value={diceValue}
                                        onChange={(e) => setDiceValue(e.target.value)}
                                    >
                                        <option value="">-- Chọn giá trị --</option>
                                        {getSliceValues(diceDimension).map(value => (
                                            <option key={value} value={value}>
                                                {value}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div className="flex space-x-2 mb-3">
                                <button
                                    className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleAddDiceFilter}
                                    disabled={!diceDimension || !diceValue}
                                >
                                    <div className="flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                        Thêm bộ lọc
                                    </div>
                                </button>
                            </div>
                            <button
                                className="olap-button w-full px-3 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleApplyDice}
                                disabled={Object.keys(diceFilters).length === 0}
                            >
                                <div className="flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM15 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
                                    </svg>
                                    Áp dụng Dice
                                </div>
                            </button>
                        </div>
                    )}
                        {/* Pivot Section */}
                        {activeTab === 'pivot' && (
                            <div className="border border-gray-200 rounded-md p-4 md:col-span-2">
                                <h4 className="font-medium mb-3">Pivot</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Chọn chiều cho hàng
                                        </label>
                                        <select
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            value={rowDimension}
                                            onChange={(e) => setRowDimension(e.target.value)}
                                        >
                                            <option value="">-- Chọn chiều --</option>
                                            {dimensions.map(dim => (
                                                <option key={dim.id} value={dim.id}>
                                                    {dim.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Chọn chiều cho cột
                                        </label>
                                        <select
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            value={colDimension}
                                            onChange={(e) => setColDimension(e.target.value)}
                                        >
                                            <option value="">-- Chọn chiều --</option>
                                            {dimensions.map(dim => (
                                                <option key={dim.id} value={dim.id}>
                                                    {dim.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button
                                    className="olap-button w-full px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handlePivot}
                                    disabled={!rowDimension || !colDimension || rowDimension === colDimension}
                                >
                                    <div className="flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5z" />
                                        </svg>
                                        Áp dụng Pivot
                                    </div>
                                </button>
                            </div>
                        )
                    }  
                    </div>

                    {/* Giải thích về các thao tác OLAP dựa trên cấu trúc kho dữ liệu */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm text-gray-600">
                        <h4 className="font-medium text-gray-700 mb-2">Giải thích các thao tác OLAP:</h4>
                        <ul className="list-disc pl-5 space-y-1">
                                                <li><strong>Drill-down:</strong> Đi sâu vào chi tiết hơn theo phân cấp của chiều dữ liệu. Ví dụ: từ <code>year</code> → <code>quarter</code> → <code>month</code> → <code>day</code> hoặc từ <code>city</code> → <code>district</code> → <code>store</code>.</li>                            <li><strong>Roll-up:</strong> Quay trở lại mức tổng hợp cao hơn trong phân cấp. Ví dụ: từ <code>day</code> → <code>month</code> → <code>quarter</code> → <code>year</code>.</li>                            <li><strong>Slice:</strong> Lọc dữ liệu theo một giá trị cụ thể của một chiều. Ví dụ: chỉ xem dữ liệu của <code>year = 2023</code> hoặc <code>city = 'Vanghaven'</code>.</li>                            <li><strong>Dice:</strong> Lọc dữ liệu theo nhiều chiều (thông qua bộ lọc). Ví dụ: chỉ xem dữ liệu của <code>year = 2023</code> và <code>city = 'Vanghaven'</code> và <code>customer_name = 'Gary Morales'</code>.</li>                            <li><strong>Pivot:</strong> Xoay trục dữ liệu để phân tích từ góc nhìn khác. Ví dụ: chuyển từ phân tích theo <code>city</code> và <code>year</code> sang phân tích theo <code>year</code> và <code>city</code>.</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};