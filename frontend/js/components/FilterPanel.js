// Component FilterPanel cho phép người dùng lọc dữ liệu báo cáo

const FilterPanel = ({ filters, onFilterChange, reportId }) => {
    // State cho việc hiển thị/ẩn panel lọc
    const [isExpanded, setIsExpanded] = React.useState(false);
    // State cho giá trị lọc tạm thời (trước khi áp dụng)
    const [tempFilters, setTempFilters] = React.useState({});

    // Cập nhật tempFilters khi filters thay đổi
    React.useEffect(() => {
        setTempFilters({...filters});
    }, [filters]);

    // Danh sách các bộ lọc có sẵn dựa trên loại báo cáo
    const getAvailableFilters = () => {
        // Các bộ lọc chung cho tất cả các báo cáo
        const commonFilters = [
            { id: 'year', label: 'Năm', type: 'select', options: [2020, 2021, 2022, 2023] },
            { id: 'quarter', label: 'Quý', type: 'select', options: [1, 2, 3, 4] },
            { id: 'month', label: 'Tháng', type: 'select', options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
        ];

        // Các bộ lọc riêng cho từng loại báo cáo
        switch(reportId) {
            // Báo cáo liên quan đến sản phẩm
            case 1: case 4: case 7:
                return [
                    ...commonFilters,
                    { id: 'product_category', label: 'Danh mục sản phẩm', type: 'select', options: ['Điện tử', 'Thời trang', 'Đồ gia dụng', 'Thực phẩm'] },
                    { id: 'product_brand', label: 'Thương hiệu', type: 'select', options: ['Samsung', 'Apple', 'Sony', 'LG', 'Khác'] },
                ];
            // Báo cáo liên quan đến khu vực
            case 2: case 5: case 8:
                return [
                    ...commonFilters,
                    { id: 'region', label: 'Vùng miền', type: 'select', options: ['Miền Bắc', 'Miền Trung', 'Miền Nam'] },
                    { id: 'province', label: 'Tỉnh/Thành phố', type: 'select', options: ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Cần Thơ', 'Khác'] },
                ];
            // Báo cáo liên quan đến thời gian
            case 3: case 6: case 9:
                return [
                    ...commonFilters,
                    { id: 'compare_period', label: 'So sánh với kỳ', type: 'select', options: ['Kỳ trước', 'Cùng kỳ năm trước'] },
                ];
            default:
                return commonFilters;
        }
    };

    // Xử lý thay đổi giá trị lọc tạm thời
    const handleTempFilterChange = (filterId, value) => {
        setTempFilters(prev => ({
            ...prev,
            [filterId]: value
        }));
    };

    // Xử lý áp dụng bộ lọc
    const handleApplyFilters = () => {
        onFilterChange(tempFilters);
    };

    // Xử lý xóa tất cả bộ lọc
    const handleClearFilters = () => {
        setTempFilters({});
        onFilterChange({});
    };

    // Xử lý xóa một bộ lọc cụ thể
    const handleRemoveFilter = (filterId) => {
        const newFilters = {...tempFilters};
        delete newFilters[filterId];
        setTempFilters(newFilters);
        onFilterChange(newFilters);
    };

    // Lấy danh sách các bộ lọc có sẵn
    const availableFilters = getAvailableFilters();

    return (
        <div className="bg-white rounded-lg shadow-md mb-6">
            {/* Header của panel lọc */}
            <div 
                className="p-4 flex justify-between items-center cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 className="font-semibold flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                    </svg>
                    Bộ lọc báo cáo
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

            {/* Hiển thị các bộ lọc đã áp dụng */}
            {Object.keys(filters).length > 0 && (
                <div className="px-4 pb-2">
                    <div className="flex flex-wrap">
                        {Object.entries(filters).map(([key, value]) => {
                            // Bỏ qua các bộ lọc đặc biệt dùng cho OLAP
                            if (['drillDimension', 'pivotRow', 'pivotCol'].includes(key)) return null;
                            
                            const filterDef = availableFilters.find(f => f.id === key);
                            return (
                                <div key={key} className="filter-badge">
                                    <span>{filterDef?.label || key}: {value}</span>
                                    <button onClick={() => handleRemoveFilter(key)}>
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

            {/* Panel lọc mở rộng */}
            {isExpanded && (
                <div className="p-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {availableFilters.map(filter => (
                            <div key={filter.id} className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {filter.label}
                                </label>
                                {filter.type === 'select' && (
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        value={tempFilters[filter.id] || ''}
                                        onChange={(e) => handleTempFilterChange(filter.id, e.target.value)}
                                    >
                                        <option value="">-- Chọn {filter.label} --</option>
                                        {filter.options.map(option => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {filter.type === 'range' && (
                                    <div className="flex space-x-2">
                                        <input
                                            type="number"
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            placeholder={`Từ ${filter.label}`}
                                            value={tempFilters[`${filter.id}_from`] || ''}
                                            onChange={(e) => handleTempFilterChange(`${filter.id}_from`, e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            placeholder={`Đến ${filter.label}`}
                                            value={tempFilters[`${filter.id}_to`] || ''}
                                            onChange={(e) => handleTempFilterChange(`${filter.id}_to`, e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end space-x-2 mt-4">
                        <button
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            onClick={handleClearFilters}
                        >
                            Xóa tất cả
                        </button>
                        <button
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={handleApplyFilters}
                        >
                            Áp dụng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};