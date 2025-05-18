// Server backend cho ứng dụng OLAP
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sql = require('mssql');
const { execSync } = require('child_process');

// -------------------------------------------------------------------------------
// QUAN TRỌNG: Trước khi chạy ứng dụng, hãy làm theo các bước sau:
//
// 1. Bật SQL Server Authentication mode:
//    - Mở SQL Server Management Studio (SSMS) 
//    - Kết nối với Windows Authentication
//    - Chuột phải vào server -> Properties -> Security
//    - Chọn "SQL Server and Windows Authentication mode"
//    - Nhấn OK và khởi động lại SQL Server
//
// 2. Tạo user mới trong SQL Server:
//    - Mở SQL Server Management Studio (SSMS)
//    - Kết nối đến SQL Server instance
//    - Mở Security > Logins > New Login
//    - Tạo login mới: "nodejs_user" với mật khẩu "nodejs123"
//    - Chọn SQL Server authentication (KHÔNG phải Windows authentication)
//    - Bỏ chọn "Enforce password policy" và "User must change password..."
//    - Chọn tab "User Mapping", tích chọn database "DWH"
//    - Trong Database role membership, tích chọn db_datareader và db_datawriter
//    - Nhấn OK để tạo user
// -------------------------------------------------------------------------------

// Khởi tạo ứng dụng Express
const app = express();
const port = process.env.PORT || 5001; // Đã đổi sang 5001

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Cấu hình kết nối SQL Server (DWH)
const sqlServerConfig = {
    host: 'localhost',
    instanceName: null, // Default instance, so no instance name
    port: 1433, // User confirmed default instance uses port 1433
    database: 'DWH'
};

const sqlConfig = {
    server: sqlServerConfig.host, // Always use the host name here
    database: sqlServerConfig.database,
    user: 'nodejs_user',  // Tài khoản SQL Server riêng cho ứng dụng
    password: 'nodejs123',  // Thay bằng mật khẩu thực tế đã tạo
    options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true
    },
    ...(sqlServerConfig.port && { port: parseInt(String(sqlServerConfig.port), 10) }) // Conditionally add port
};

// Biến lưu trữ kết nối
let sqlPool;
let olapConnectionInstance;

// Chuỗi kết nối OLAP
const olapConfigString = 'Provider=MSOLAP;Data Source=localhost;Initial Catalog=KDL1;Integrated Security=SSPI;';

async function initSqlConnection() {
    try {
        console.log("Đang cố gắng kết nối tới SQL Server với cấu hình:", JSON.stringify(sqlConfig, null, 2));
        sqlPool = await sql.connect(sqlConfig);
        console.log("Đã kết nối thành công tới SQL Server - DWH");
    } catch (err) {
        console.error("Lỗi kết nối tới SQL Server:", err);
        sqlPool = null; 
    }
}

// Hàm queryOlapViaPowerShell thay thế cho node-adodb
async function queryOlapViaPowerShell(mdxQuery) {
    try {
        console.log("Thực hiện truy vấn MDX qua PowerShell:", mdxQuery);
        
        // Chuẩn bị câu lệnh MDX để chạy qua PowerShell
        const escapedQuery = mdxQuery.replace(/"/g, '`"').replace(/'/g, "`'");
        const psCommand = `
            $conn = New-Object System.Data.OleDb.OleDbConnection
            $conn.ConnectionString = "Provider=MSOLAP;Data Source=localhost;Initial Catalog=KDL1;Integrated Security=SSPI;"
            $conn.Open()
            $cmd = $conn.CreateCommand()
            $cmd.CommandText = "${escapedQuery}"
            $adapter = New-Object System.Data.OleDb.OleDbDataAdapter($cmd)
            $dataset = New-Object System.Data.DataSet
            $adapter.Fill($dataset)
            if ($dataset.Tables.Count -gt 0) {
                $dataset.Tables[0] | ConvertTo-Json -Depth 10
            } else {
                "[]"
            }
            $conn.Close()
        `;
        
        // Thực thi lệnh PowerShell và lấy kết quả
        const result = execSync(`powershell -command "${psCommand}"`, { encoding: 'utf8' });
        
        // Xử lý kết quả khi truy vấn thành công
        try {
            // Kết quả có thể là JSON hoặc trống
            if (result && result.trim()) {
                const jsonResult = JSON.parse(result);
                console.log(`Truy vấn PowerShell thành công, nhận được ${Array.isArray(jsonResult) ? jsonResult.length : 1} kết quả`);
                return jsonResult;
            } else {
                console.log("Truy vấn PowerShell thành công nhưng không có dữ liệu");
                return [];
            }
        } catch (jsonErr) {
            console.error("Lỗi khi xử lý kết quả JSON từ PowerShell:", jsonErr);
            console.log("Kết quả thô:", result);
            return [];
        }
    } catch (err) {
        console.error("Lỗi khi thực hiện truy vấn OLAP thông qua PowerShell:", err);
        
        // Ghi lại thông tin lỗi chi tiết
        if (err.stderr) {
            console.error("PowerShell stderr:", err.stderr);
        }
        if (err.stdout) {
            console.error("PowerShell stdout:", err.stdout);
        }
        
        throw err;
    }
}

async function initOlapConnection() {
    console.log("Đang kết nối OLAP qua PowerShell...");
    
    try {
        // Thử truy vấn cơ bản bằng PowerShell để kiểm tra kết nối
        const testMdx = `SELECT FROM [1D_Inventory_Store]`;
        const result = await queryOlapViaPowerShell(testMdx);
        
        console.log("Kết nối OLAP qua PowerShell thành công!");
        
        // Tạo một đối tượng giả lập interface
        olapConnectionInstance = {
            query: queryOlapViaPowerShell,
            execute: async (mdx) => {
                await queryOlapViaPowerShell(mdx);
                return { affected: 0 };
            }
        };
        
        console.log("Đã kết nối thành công tới OLAP qua PowerShell và khởi tạo chức năng truy vấn.");
        return;
    } catch (err) {
        console.error("Lỗi kết nối OLAP qua PowerShell:", err);
        olapConnectionInstance = null;
        
        console.log("===== HƯỚNG DẪN KHẮC PHỤC LỖI OLAP =====");
        console.log("1. Kiểm tra SQL Server Analysis Services đã được cài đặt và đang chạy");
        console.log("2. Kiểm tra database 'KDL1' và cube '[1D_Inventory_Store]' tồn tại trong SSAS");
        console.log("3. Thử các cách khắc phục trong file HUONG_DAN_KET_NOI_DB.md");
        console.log("4. Ứng dụng sẽ tiếp tục chạy với dữ liệu từ SQL Server hoặc dữ liệu mẫu");
        console.log("=============================================");
    }
}

// API endpoint để truy vấn DWH (SQL Server)
app.get('/api/dwh/:queryName', async (req, res) => {
    const queryName = req.params.queryName;
    if (!sqlPool) {
        return res.status(503).json({ error: 'SQL Server DWH service not available.' });
    }
    try {
        let result;
        switch(queryName) {
            case 'stores':
                result = await sqlPool.request().query('SELECT * FROM dbo.Dim_Store');
                break;
            case 'items':
                result = await sqlPool.request().query('SELECT * FROM dbo.Dim_Item');
                break;
            case 'customers':
                result = await sqlPool.request().query('SELECT * FROM dbo.Dim_Customer');
                break;
            case 'sales':
                result = await sqlPool.request().query('SELECT TOP 100 * FROM dbo.Fact_Sales');
                break;
            case 'inventory':
                result = await sqlPool.request().query('SELECT TOP 100 * FROM dbo.Fact_Inventory');
                break;
            default:
                return res.status(400).json({ error: 'Invalid query name' });
        }
        res.json(result.recordset);
    } catch (err) {
        console.error(`Lỗi thực hiện truy vấn DWH ${queryName}:`, err);
        res.status(500).json({ error: 'Database query error', details: err.message });
    }
});

// API endpoint để truy vấn OLAP (Analysis Services)
app.post('/api/olap', async (req, res) => {
    const { mdxQuery } = req.body;
    if (!mdxQuery) {
        return res.status(400).json({ error: 'Missing MDX query' });
    }
    if (!olapConnectionInstance) {
        return res.status(503).json({ error: 'OLAP service not available. Connection may have failed at startup.' });
    }
    try {
        console.log(`Executing custom MDX: ${mdxQuery}`);
        const result = await olapConnectionInstance.query(mdxQuery);
        res.json(result);
    } catch (err) {
        console.error('Lỗi thực hiện truy vấn MDX tùy chỉnh:', err);
        res.status(500).json({ error: 'OLAP query error', details: err.message, mdx: mdxQuery });
    }
});

// API endpoint để lấy dữ liệu báo cáo - hỗ trợ cả hai nguồn
app.get('/api/reports/:reportId', async (req, res) => {
    const reportId = parseInt(req.params.reportId);
    const filters = req.query;
    const level = parseInt(req.query.level) || 0;
    
    const queryFilters = { ...filters };
    delete queryFilters.level;

    try {
        let data;

        if (olapConnectionInstance) {
            try {
                const mdxQuery = generateMdxQuery(reportId, queryFilters, level);
                console.log(`Executing MDX for report ${reportId}: ${mdxQuery}`);
                const olapResult = await olapConnectionInstance.query(mdxQuery);
                data = transformOlapResult(olapResult, reportId, queryFilters);

                if (data === null || (data && data.rows && data.rows.length === 0)) {
                     console.warn(`OLAP data for report ${reportId} was fetched but transformation resulted in null or empty rows. Considering fallback.`);
                     if(data === null) data = undefined; 
                }
            } catch (olapQueryError) {
                console.error(`Lỗi thực hiện truy vấn OLAP cho báo cáo ${reportId}:`, olapQueryError);
            }
        } else {
            console.warn("Kết nối OLAP không khả dụng. Sẽ thử fallback.");
        }

        if (data === undefined || (data && data.rows && data.rows.length === 0)) {
            console.log(`Attempting fallback to SQL Server for report ${reportId}.`);
            if (sqlPool) {
                data = await getDataFromSqlServer(reportId, queryFilters, level);
                 if (data === null || (data && data.rows && data.rows.length === 0)) {
                    console.warn(`SQL Server fallback for report ${reportId} also resulted in null or empty data.`);
                }
            } else {
                console.warn("Kết nối SQL Server DWH không khả dụng cho fallback.");
            }
        }

        if (data === undefined || data === null || (data && data.rows && data.rows.length === 0) ) {
            console.log(`No data from OLAP or SQL Server for report ${reportId}. Falling back to mock data.`);
            data = getMockData(reportId, queryFilters, level); 
        }
        
        if (data === undefined || data === null) {
            console.error(`CRITICAL: Data is still undefined/null for report ${reportId} after all fallbacks. Sending empty valid structure.`);
            data = { columns: [{ field: 'error', label: 'Lỗi', type: 'string'}], rows: [{ error: 'Không thể tải dữ liệu cho báo cáo.'}]};
        } else if (!data.hasOwnProperty('columns') || !data.hasOwnProperty('rows')) {
            console.error(`CRITICAL: Data for report ${reportId} has invalid structure. Sending empty valid structure. Data:`, data);
            data = { columns: [{ field: 'error', label: 'Lỗi', type: 'string'}], rows: [{ error: 'Dữ liệu báo cáo có cấu trúc không hợp lệ.'}]};
        }
    
    res.json(data);
    } catch (err) {
        console.error(`Lỗi tổng thể khi lấy dữ liệu báo cáo ${reportId}:`, err);
        const mockData = getMockData(reportId, filters, level); 
        res.json(mockData);
    }
});

function generateMdxQuery(reportId, filters, level) {
    let mdxQuery = '';
    
    // Xác định cube dựa trên reportId
    let cubeName = '';
    switch (reportId) {
        case 1: case 4: case 7: 
            cubeName = (level === 0) ? '[1D_Inventory_Item]' :
                       (level === 1) ? '[2D_Inventory_Store_Item]' :
                       '[3D_Inventory]';
            break;
        case 2: case 5: case 8:
            cubeName = (level === 0) ? '[1D_Inventory_Store]' :
                       (level === 1) ? '[2D_Inventory_Store_Item]' :
                       '[3D_Inventory]';
            break;
        case 3: case 6: case 9:
            cubeName = (level === 0) ? '[1D_Inventory_Time]' : 
                       (level === 1) ? '[2D_Sales_Customer_City]' :
                       '[3D_Sales_Time_Customer]';
            break;
        default:
            cubeName = '[1D_Inventory_Item]';
    }
    
    // Xác định measure dựa trên reportId
    let measures = '';
    switch (reportId) {
        case 1: case 2: case 3: // Báo cáo doanh thu
            measures = '{[Measures].[Amount]}';
            break;
        case 4: case 5: case 6: // Báo cáo số lượng
            measures = '{[Measures].[Quantity]}';
            break;
        case 7: case 8: case 9: // Báo cáo lợi nhuận
            measures = '{[Measures].[Quantity Stock]}';
            break;
        default:
            measures = '{[Measures].[Quantity Stock]}';
    }
    
    // Xử lý chiều rows dựa trên báo cáo và các thao tác OLAP
    let rows = '';
    
    // Nếu đang thực hiện thao tác drill-down
    if (filters.currentDimension && filters.nextDimension) {
        const currentDim = mapDimensionToMdx(filters.currentDimension);
        const nextDim = mapDimensionToMdx(filters.nextDimension);
        
        rows = `NON EMPTY {${nextDim}.MEMBERS} ON ROWS`;
    }
    // Nếu đang thực hiện thao tác slice
    else if (filters.sliceOperation && filters.sliceDimension) {
        const sliceDim = mapDimensionToMdx(filters.sliceDimension);
        rows = `NON EMPTY {${sliceDim}.MEMBERS} ON ROWS`;
    }
    // Nếu đang thực hiện thao tác pivot
    else if (filters.pivotOperation && filters.pivotRow && filters.pivotCol) {
        const rowDim = mapDimensionToMdx(filters.pivotRow);
        rows = `NON EMPTY {${rowDim}.MEMBERS} ON ROWS`;
    }
    // Mặc định theo loại báo cáo
    else {
        switch (reportId) {
            case 1: case 4: case 7: // Báo cáo theo sản phẩm
                rows = 'NON EMPTY {[Dim Item].[Item].[Item].MEMBERS} ON ROWS';
                break;
            case 2: case 5: case 8: // Báo cáo theo khu vực
                rows = 'NON EMPTY {[Dim Store].[Store].[Store].MEMBERS} ON ROWS';
                break;
            case 3: case 6: case 9: // Báo cáo theo thời gian
                rows = 'NON EMPTY {[Dim Time].[Year].[Year].MEMBERS} ON ROWS';
                break;
            default:
                rows = 'NON EMPTY {[Dim Item].[Item].[Item].MEMBERS} ON ROWS';
        }
    }
    
    // Xây dựng câu truy vấn MDX
    mdxQuery = `
        SELECT 
        NON EMPTY ${measures} ON COLUMNS,
        ${rows}
        FROM ${cubeName}
    `;
    
    // Xử lý các điều kiện WHERE cho slice/dice
    const whereConditions = [];
    
    // Slice: Lọc theo một chiều cụ thể
    if (filters.sliceOperation && filters.sliceDimension && filters[filters.sliceDimension]) {
        const sliceDim = mapDimensionToMdx(filters.sliceDimension);
        const sliceValue = filters[filters.sliceDimension];
        whereConditions.push(`${sliceDim}.&[${sliceValue}]`);
    }
    
    // Dice: Lọc theo nhiều chiều
    if (filters.diceOperation) {
        Object.keys(filters).forEach(key => {
            // Bỏ qua các khóa đặc biệt
            if (!['diceOperation', 'sliceOperation', 'pivotOperation', 'currentDimension', 'nextDimension', 'drillLevel', 'pivotRow', 'pivotCol'].includes(key)) {
                const dim = mapDimensionToMdx(key);
                if (dim && filters[key]) {
                    whereConditions.push(`${dim}.&[${filters[key]}]`);
                }
            }
        });
    }
    
    // Thêm mệnh đề WHERE nếu có điều kiện
    if (whereConditions.length > 0) {
        mdxQuery += ` WHERE (${whereConditions.join(', ')})`;
    }
    
    return mdxQuery;
}

// Hàm ánh xạ tên chiều frontend sang tên chiều trong MDX
function mapDimensionToMdx(dimension) {
    const dimensionMap = {
        'category': '[Dim Item].[Category]',
        'brand': '[Dim Item].[Brand]',
        'product': '[Dim Item].[Item]',
        'size': '[Dim Item].[Size]',
        'price': '[Dim Item].[Price]',
        'region': '[Dim Store].[Region]',
        'city': '[Dim Store].[City]',
        'district': '[Dim Store].[District]',
        'store': '[Dim Store].[Store]',
        'year': '[Dim Time].[Year]',
        'quarter': '[Dim Time].[Quarter]',
        'month': '[Dim Time].[Month]',
        'day': '[Dim Time].[Day]'
    };
    
    return dimensionMap[dimension] || null;
}

function transformOlapResult(olapResult, reportId, filters = {}) {
    try {
        if (!olapResult || olapResult.length === 0) {
            return { columns: [], rows: [] }; 
        }

        const columns = [];
        const rows = [];
        
        // Xác định các cột dựa trên thao tác OLAP hiện tại
        if (filters.currentDimension && filters.nextDimension) {
            // Trường hợp Drill-down
            const dimensionLabel = getDimensionLabel(filters.nextDimension);
            columns.push({ field: filters.nextDimension, label: dimensionLabel, type: 'string' });
            
            // Xác định thước đo dựa trên loại báo cáo
            if ([1, 2, 3].includes(reportId)) {
                columns.push({ field: 'amount', label: 'Doanh thu', type: 'number' });
            } else if ([4, 5, 6].includes(reportId)) {
                columns.push({ field: 'quantity', label: 'Số lượng', type: 'number' });
            } else {
                columns.push({ field: 'stock', label: 'Số lượng tồn', type: 'number' });
            }
        } 
        else if (filters.sliceOperation && filters.sliceDimension) {
            // Trường hợp Slice
            const dimensionLabel = getDimensionLabel(filters.sliceDimension);
            columns.push({ field: filters.sliceDimension, label: dimensionLabel, type: 'string' });
            
            if ([1, 2, 3].includes(reportId)) {
                columns.push({ field: 'amount', label: 'Doanh thu', type: 'number' });
            } else if ([4, 5, 6].includes(reportId)) {
                columns.push({ field: 'quantity', label: 'Số lượng', type: 'number' });
            } else {
                columns.push({ field: 'stock', label: 'Số lượng tồn', type: 'number' });
            }
        }
        else if (filters.pivotOperation && filters.pivotRow && filters.pivotCol) {
            // Trường hợp Pivot
            const rowLabel = getDimensionLabel(filters.pivotRow);
            columns.push({ field: filters.pivotRow, label: rowLabel, type: 'string' });
            
            if ([1, 2, 3].includes(reportId)) {
                columns.push({ field: 'amount', label: 'Doanh thu', type: 'number' });
            } else if ([4, 5, 6].includes(reportId)) {
                columns.push({ field: 'quantity', label: 'Số lượng', type: 'number' });
            } else {
                columns.push({ field: 'stock', label: 'Số lượng tồn', type: 'number' });
            }
        }
        else {
            // Trường hợp mặc định dựa trên reportId
            switch (reportId) {
                case 1: 
                    columns.push({ field: 'product', label: 'Sản phẩm', type: 'string' });
                    columns.push({ field: 'amount', label: 'Doanh thu', type: 'number' });
                    break;
                case 2: 
                    columns.push({ field: 'store', label: 'Cửa hàng', type: 'string' }); 
                    columns.push({ field: 'amount', label: 'Doanh thu', type: 'number' });
                    break;
                case 3: 
                    columns.push({ field: 'year', label: 'Năm', type: 'string' }); 
                    columns.push({ field: 'amount', label: 'Doanh thu', type: 'number' });
                    break;
                case 4:
                    columns.push({ field: 'product', label: 'Sản phẩm', type: 'string' });
                    columns.push({ field: 'quantity', label: 'Số lượng', type: 'number' });
                    break;
                case 5:
                    columns.push({ field: 'store', label: 'Cửa hàng', type: 'string' });
                    columns.push({ field: 'quantity', label: 'Số lượng', type: 'number' });
                    break;
                case 6:
                    columns.push({ field: 'year', label: 'Năm', type: 'string' });
                    columns.push({ field: 'quantity', label: 'Số lượng', type: 'number' });
                    break;
                case 7:
                    columns.push({ field: 'product', label: 'Sản phẩm', type: 'string' });
                    columns.push({ field: 'stock', label: 'Số lượng tồn', type: 'number' });
                    break;
                case 8:
                    columns.push({ field: 'store', label: 'Cửa hàng', type: 'string' });
                    columns.push({ field: 'stock', label: 'Số lượng tồn', type: 'number' });
                    break;
                case 9:
                    columns.push({ field: 'year', label: 'Năm', type: 'string' });
                    columns.push({ field: 'stock', label: 'Số lượng tồn', type: 'number' });
                    break;
                default:
                    console.warn(`transformOlapResult: Unhandled reportId ${reportId} for column definition.`);
                    columns.push({ field: 'dimension', label: 'Dimension', type: 'string' });
                    columns.push({ field: 'measure', label: 'Measure', type: 'number' });
            }
        }
        
        // Chuyển đổi dữ liệu OLAP thành định dạng hàng
        for (const item of olapResult) {
            if (item === null || item === undefined) continue; 
            
            const row = {};
            
            // Xử lý giá trị dựa trên thao tác OLAP
            if (filters.currentDimension && filters.nextDimension) {
                // Drill-down: Lấy giá trị của chiều chi tiết
                const dimensionValue = cleanMdxValue(item[0]);
                row[filters.nextDimension] = dimensionValue;
                
                // Lấy giá trị thước đo
                const measureValue = item[1] !== undefined ? parseFloat(item[1]) : 0;
                if ([1, 2, 3].includes(reportId)) {
                    row.amount = measureValue;
                } else if ([4, 5, 6].includes(reportId)) {
                    row.quantity = measureValue;
                } else {
                    row.stock = measureValue;
                }
            }
            else if (filters.sliceOperation && filters.sliceDimension) {
                // Slice: Lấy giá trị của chiều được lọc
                const dimensionValue = cleanMdxValue(item[0]);
                row[filters.sliceDimension] = dimensionValue;
                
                // Lấy giá trị thước đo
                const measureValue = item[1] !== undefined ? parseFloat(item[1]) : 0;
                if ([1, 2, 3].includes(reportId)) {
                    row.amount = measureValue;
                } else if ([4, 5, 6].includes(reportId)) {
                    row.quantity = measureValue;
                } else {
                    row.stock = measureValue;
                }
            }
            else if (filters.pivotOperation && filters.pivotRow && filters.pivotCol) {
                // Pivot: Lấy giá trị của chiều hàng
                const dimensionValue = cleanMdxValue(item[0]);
                row[filters.pivotRow] = dimensionValue;
                
                // Lấy giá trị thước đo
                const measureValue = item[1] !== undefined ? parseFloat(item[1]) : 0;
                if ([1, 2, 3].includes(reportId)) {
                    row.amount = measureValue;
                } else if ([4, 5, 6].includes(reportId)) {
                    row.quantity = measureValue;
                } else {
                    row.stock = measureValue;
                }
            }
            else {
                // Mặc định dựa trên reportId
                const dimensionValue = cleanMdxValue(item[0]);
                const measureValue = item[1] !== undefined ? parseFloat(item[1]) : 0;
                
                switch (reportId) {
                    case 1: case 4: case 7:
                        row[columns[0].field] = dimensionValue;
                        row[columns[1].field] = measureValue;
                        break;
                    case 2: case 5: case 8:
                        row[columns[0].field] = dimensionValue;
                        row[columns[1].field] = measureValue;
                        break;
                    case 3: case 6: case 9:
                        row[columns[0].field] = dimensionValue;
                        row[columns[1].field] = measureValue;
                        break;
                    default:
                        row[columns[0].field] = dimensionValue;
                        row[columns[1].field] = measureValue;
                }
            }
            
            if (Object.keys(row).length > 0) {
                rows.push(row);
            }
        }
        
        return { columns, rows };
    } catch (error) {
        console.error("Lỗi chuyển đổi kết quả OLAP:", error);
        return null; 
    }
}

// Hàm làm sạch giá trị trả về từ MDX
function cleanMdxValue(value) {
    if (value === undefined || value === null) return 'Unknown';
    
    const strValue = String(value);
    // Xử lý trường hợp [Name] hoặc &[Name]
    const match = strValue.match(/\[([^\]]+)\]$/); 
    return match ? match[1] : strValue;
}

// Hàm lấy nhãn hiển thị cho chiều
function getDimensionLabel(dimension) {
    const dimensionLabels = {
        'category': 'Danh mục sản phẩm',
        'brand': 'Thương hiệu',
        'product': 'Sản phẩm',
        'size': 'Kích thước',
        'price': 'Giá',
        'region': 'Vùng miền',
        'city': 'Tỉnh/Thành phố',
        'district': 'Quận/Huyện',
        'store': 'Cửa hàng',
        'year': 'Năm',
        'quarter': 'Quý',
        'month': 'Tháng',
        'day': 'Ngày'
    };
    
    return dimensionLabels[dimension] || dimension;
}

async function getDataFromSqlServer(reportId, filters, level) {
    try {
        if (!sqlPool) {
            console.warn("getDataFromSqlServer: sqlPool is not initialized.");
            return null;
        }
        
        let query = '';
        switch (reportId) {
            case 1: 
                query = `
                    SELECT TOP 20 
                        i.descriptions AS item,
                        SUM(fi.quantity_stock) AS quantity
                    FROM 
                        dbo.Dim_Item i
                        LEFT JOIN dbo.Fact_Inventory fi ON i.item_key = fi.item_key
                    GROUP BY 
                        i.descriptions
                    ORDER BY 
                        quantity DESC, item ASC
                `;
                break;
            case 2: 
                query = `
                    SELECT 
                        s.store_key AS store, 
                        SUM(fi.quantity_stock) AS quantity
                    FROM 
                        dbo.Dim_Store s
                        LEFT JOIN dbo.Fact_Inventory fi ON s.store_key = fi.store_key
                    GROUP BY 
                        s.store_key 
                    ORDER BY 
                        quantity DESC, store ASC
                `;
                break;
            case 3: 
                 query = `
                    SELECT 
                        t.years AS year,
                        SUM(fi.quantity_stock) AS quantity 
                    FROM 
                        dbo.Dim_Time t
                        LEFT JOIN dbo.Fact_Inventory fi ON t.time_key = fi.time_key 
                    WHERE t.years IS NOT NULL
                    GROUP BY 
                        t.years
                    ORDER BY 
                        t.years ASC
                `;
                break;
            case 4: 
                query = `
                    SELECT TOP 20
                        i.descriptions AS product_category,
                        COUNT(DISTINCT fi.item_key) AS product_count,
                        SUM(fi.quantity_stock) AS quantity
                    FROM 
                        dbo.Dim_Item i
                        LEFT JOIN dbo.Fact_Inventory fi ON i.item_key = fi.item_key
                    GROUP BY 
                        i.descriptions
                    ORDER BY 
                        quantity DESC
                `;
                break;
            case 5: 
                query = `
                    SELECT TOP 20
                        s.store_key AS region,
                        SUM(fi.quantity_stock) AS quantity
                    FROM 
                        dbo.Dim_Store s
                        LEFT JOIN dbo.Fact_Inventory fi ON s.store_key = fi.store_key
                    GROUP BY 
                        s.store_key
                    ORDER BY 
                        quantity DESC
                `;
                break;
            case 6: 
                query = `
                    SELECT 
                        t.years AS year,
                        SUM(fi.quantity_stock) AS quantity,
                        AVG(fi.quantity_stock) AS avg_quantity
                    FROM 
                        dbo.Dim_Time t
                        LEFT JOIN dbo.Fact_Inventory fi ON t.time_key = fi.time_key
                    WHERE 
                        t.years IS NOT NULL
                    GROUP BY 
                        t.years
                    ORDER BY 
                        t.years ASC
                `;
                break;
            case 7: 
                query = `
                    SELECT TOP 20
                        i.descriptions AS product_category,
                        SUM(fi.quantity_stock) AS stock_value,
                        COUNT(DISTINCT fi.item_key) AS unique_items
                    FROM 
                        dbo.Dim_Item i
                        LEFT JOIN dbo.Fact_Inventory fi ON i.item_key = fi.item_key
                    GROUP BY 
                        i.descriptions
                    ORDER BY 
                        stock_value DESC
                `;
                break;
            case 8: 
                query = `
                    SELECT 
                        s.store_key AS region,
                        SUM(fi.quantity_stock) AS stock_value,
                        COUNT(DISTINCT fi.item_key) AS unique_items
                    FROM 
                        dbo.Dim_Store s
                        LEFT JOIN dbo.Fact_Inventory fi ON s.store_key = fi.store_key
                    GROUP BY 
                        s.store_key
                    ORDER BY 
                        stock_value DESC
                `;
                break;
            case 9: 
                query = `
                    SELECT 
                        t.years AS year,
                        SUM(fi.quantity_stock) AS stock_value,
                        COUNT(DISTINCT fi.item_key) AS unique_items
                    FROM 
                        dbo.Dim_Time t
                        LEFT JOIN dbo.Fact_Inventory fi ON t.time_key = fi.time_key
                    WHERE 
                        t.years IS NOT NULL
                    GROUP BY 
                        t.years
                    ORDER BY 
                        t.years ASC
                `;
                break;
            default:
                console.warn(`getDataFromSqlServer: No SQL query defined for reportId ${reportId}.`);
                return null;
        }
        
        console.log(`Executing SQL for report ${reportId}: ${query}`);
        const result = await sqlPool.request().query(query);
        
        if (result.recordset && result.recordset.length > 0) {
            const columns = Object.keys(result.recordset[0]).map(key => ({
                field: key,
                label: key.charAt(0).toUpperCase() + key.slice(1),
                type: typeof result.recordset[0][key] === 'number' ? (Number.isInteger(result.recordset[0][key]) ? 'integer' : 'float') : 'string'
            }));
            return { columns: columns, rows: result.recordset };
        } else {
            console.log(`SQL query for report ${reportId} returned no data.`);
            return { columns: [], rows: [] }; 
        }
    } catch (error) {
        console.error(`Lỗi lấy dữ liệu từ SQL Server cho reportId ${reportId}:`, error);
        return null;
    }
}

function getMockData(reportId, filters = {}, level = 0) {
    console.log(`getMockData called for reportId: ${reportId}, level: ${level}, filters:`, filters);
    let columns = [];
    let rows = [];

    // Xử lý các thao tác OLAP đặc biệt
    if (filters.currentDimension && filters.nextDimension) {
        // Trường hợp drill-down
        const dimensionField = filters.nextDimension;
        const dimensionLabel = getDimensionLabel(filters.nextDimension);
        
        let measureField, measureLabel;
        if ([1, 2, 3].includes(reportId)) {
            measureField = 'amount';
            measureLabel = 'Mock Doanh thu';
        } else if ([4, 5, 6].includes(reportId)) {
            measureField = 'quantity';
            measureLabel = 'Mock Số lượng';
        } else {
            measureField = 'stock';
            measureLabel = 'Mock Số lượng tồn';
        }
        
        columns = [
            { field: dimensionField, label: dimensionLabel, type: 'string' },
            { field: measureField, label: measureLabel, type: 'number' }
        ];
        
        // Tạo dữ liệu giả lập phù hợp với chiều đã drill-down
        rows = generateMockDataForDimension(dimensionField, 5, measureField);
        
        return { columns, rows };
    }
    else if (filters.sliceOperation && filters.sliceDimension) {
        // Trường hợp slice
        const dimensionField = filters.sliceDimension;
        const dimensionLabel = getDimensionLabel(filters.sliceDimension);
        
        let measureField, measureLabel;
        if ([1, 2, 3].includes(reportId)) {
            measureField = 'amount';
            measureLabel = 'Mock Doanh thu';
        } else if ([4, 5, 6].includes(reportId)) {
            measureField = 'quantity';
            measureLabel = 'Mock Số lượng';
        } else {
            measureField = 'stock';
            measureLabel = 'Mock Số lượng tồn';
        }
        
        columns = [
            { field: dimensionField, label: dimensionLabel, type: 'string' },
            { field: measureField, label: measureLabel, type: 'number' }
        ];
        
        // Tạo dữ liệu giả lập cho slice
        rows = generateMockDataForDimension(dimensionField, 3, measureField);
        
        return { columns, rows };
    }
    else if (filters.pivotOperation && filters.pivotRow && filters.pivotCol) {
        // Trường hợp pivot
        const dimensionField = filters.pivotRow;
        const dimensionLabel = getDimensionLabel(filters.pivotRow);
        
        let measureField, measureLabel;
        if ([1, 2, 3].includes(reportId)) {
            measureField = 'amount';
            measureLabel = 'Mock Doanh thu';
        } else if ([4, 5, 6].includes(reportId)) {
            measureField = 'quantity';
            measureLabel = 'Mock Số lượng';
        } else {
            measureField = 'stock';
            measureLabel = 'Mock Số lượng tồn';
        }
        
        columns = [
            { field: dimensionField, label: dimensionLabel, type: 'string' },
            { field: measureField, label: measureLabel, type: 'number' }
        ];
        
        // Tạo dữ liệu giả lập cho pivot
        rows = generateMockDataForDimension(dimensionField, 4, measureField);
        
        return { columns, rows };
    }
    
    // Xử lý các báo cáo mặc định
    switch (reportId) {
        case 1: // Báo cáo doanh thu theo sản phẩm
            columns = [
                { field: 'product', label: 'Mock Sản phẩm', type: 'string' },
                { field: 'amount', label: 'Mock Doanh thu', type: 'number' }
            ];
            rows = [
                { product: 'Mock Sản phẩm A', amount: 5000000 },
                { product: 'Mock Sản phẩm B', amount: 3500000 },
                { product: 'Mock Sản phẩm C', amount: 2800000 }
            ];
            break;
        case 2: // Báo cáo doanh thu theo khu vực
            columns = [
                { field: 'store', label: 'Mock Cửa hàng', type: 'string' },
                { field: 'amount', label: 'Mock Doanh thu', type: 'number' }
            ];
            rows = [
                { store: 'Mock Cửa hàng X', amount: 4500000 },
                { store: 'Mock Cửa hàng Y', amount: 3200000 },
                { store: 'Mock Cửa hàng Z', amount: 2700000 }
            ];
            break;
        case 3: // Báo cáo doanh thu theo thời gian
            columns = [
                { field: 'year', label: 'Mock Năm', type: 'string' },
                { field: 'amount', label: 'Mock Doanh thu', type: 'number' }
            ];
            rows = [
                { year: '2022', amount: 12000000 },
                { year: '2023', amount: 15500000 },
                { year: '2024', amount: 18000000 }
            ];
            break;
        case 4: // Báo cáo số lượng bán theo sản phẩm
            columns = [
                { field: 'product', label: 'Mock Sản phẩm', type: 'string' },
                { field: 'quantity', label: 'Mock Số lượng', type: 'number' }
            ];
            rows = [
                { product: 'Mock Sản phẩm A', quantity: 250 },
                { product: 'Mock Sản phẩm B', quantity: 175 },
                { product: 'Mock Sản phẩm C', quantity: 140 }
            ];
            break;
        case 5: // Báo cáo số lượng bán theo khu vực
            columns = [
                { field: 'store', label: 'Mock Cửa hàng', type: 'string' },
                { field: 'quantity', label: 'Mock Số lượng', type: 'number' }
            ];
            rows = [
                { store: 'Mock Cửa hàng X', quantity: 225 },
                { store: 'Mock Cửa hàng Y', quantity: 160 },
                { store: 'Mock Cửa hàng Z', quantity: 135 }
            ];
            break;
        case 6: // Báo cáo số lượng bán theo thời gian
            columns = [
                { field: 'year', label: 'Mock Năm', type: 'string' },
                { field: 'quantity', label: 'Mock Số lượng', type: 'number' }
            ];
            rows = [
                { year: '2022', quantity: 600 },
                { year: '2023', quantity: 775 },
                { year: '2024', quantity: 900 }
            ];
            break;
        case 7: // Báo cáo lợi nhuận theo sản phẩm
            columns = [
                { field: 'product', label: 'Mock Sản phẩm', type: 'string' },
                { field: 'stock', label: 'Mock Số lượng tồn', type: 'number' }
            ];
            rows = [
                { product: 'Mock Sản phẩm A', stock: 120 },
                { product: 'Mock Sản phẩm B', stock: 85 },
                { product: 'Mock Sản phẩm C', stock: 65 }
            ];
            break;
        case 8: // Báo cáo lợi nhuận theo khu vực
            columns = [
                { field: 'store', label: 'Mock Cửa hàng', type: 'string' },
                { field: 'stock', label: 'Mock Số lượng tồn', type: 'number' }
            ];
            rows = [
                { store: 'Mock Cửa hàng X', stock: 110 },
                { store: 'Mock Cửa hàng Y', stock: 75 },
                { store: 'Mock Cửa hàng Z', stock: 60 }
            ];
            break;
        case 9: // Báo cáo lợi nhuận theo thời gian
            columns = [
                { field: 'year', label: 'Mock Năm', type: 'string' },
                { field: 'stock', label: 'Mock Số lượng tồn', type: 'number' }
            ];
            rows = [
                { year: '2022', stock: 280 },
                { year: '2023', stock: 340 },
                { year: '2024', stock: 410 }
            ];
            break;
        default:
            columns = [{ field: 'message', label: 'Thông báo', type: 'string' }];
            rows = [{ message: `Mock data: Không có dữ liệu cho báo cáo ID ${reportId}` }];
    }
    return { columns, rows };
}

// Hàm tạo dữ liệu giả lập cho một chiều cụ thể
function generateMockDataForDimension(dimension, count = 3, measureField = 'quantity') {
    const rows = [];
    
    switch (dimension) {
        case 'category':
            const categories = ['Điện tử', 'Thời trang', 'Đồ gia dụng', 'Thực phẩm', 'Mỹ phẩm'];
            for (let i = 0; i < Math.min(count, categories.length); i++) {
                const row = {};
                row[dimension] = categories[i];
                row[measureField] = Math.floor(Math.random() * 1000) + 500;
                rows.push(row);
            }
            break;
        case 'brand':
            const brands = ['Samsung', 'Apple', 'Sony', 'LG', 'Panasonic', 'Toshiba', 'Adidas', 'Nike', 'Uniqlo', 'H&M'];
            for (let i = 0; i < Math.min(count, brands.length); i++) {
                const row = {};
                row[dimension] = brands[i];
                row[measureField] = Math.floor(Math.random() * 1000) + 500;
                rows.push(row);
            }
            break;
        case 'product':
            const products = ['Điện thoại thông minh', 'Máy tính xách tay', 'Tivi', 'Tủ lạnh', 'Máy giặt', 'Áo thun', 'Quần jeans', 'Giày thể thao', 'Nồi cơm điện', 'Máy lọc không khí'];
            for (let i = 0; i < Math.min(count, products.length); i++) {
                const row = {};
                row[dimension] = products[i];
                row[measureField] = Math.floor(Math.random() * 1000) + 500;
                rows.push(row);
            }
            break;
        case 'size':
            const sizes = ['S', 'M', 'L', 'XL', 'XXL', '32 inch', '42 inch', '55 inch', '250L', '350L'];
            for (let i = 0; i < Math.min(count, sizes.length); i++) {
                const row = {};
                row[dimension] = sizes[i];
                row[measureField] = Math.floor(Math.random() * 1000) + 500;
                rows.push(row);
            }
            break;
        case 'price':
            const prices = [1000000, 2000000, 5000000, 10000000, 15000000, 20000000, 30000000, 50000000];
            for (let i = 0; i < Math.min(count, prices.length); i++) {
                const row = {};
                row[dimension] = prices[i].toLocaleString('vi-VN') + ' VNĐ';
                row[measureField] = Math.floor(Math.random() * 1000) + 500;
                rows.push(row);
            }
            break;
        case 'region':
            const regions = ['Miền Bắc', 'Miền Trung', 'Miền Nam'];
            for (let i = 0; i < Math.min(count, regions.length); i++) {
                const row = {};
                row[dimension] = regions[i];
                row[measureField] = Math.floor(Math.random() * 1000) + 500;
                rows.push(row);
            }
            break;
        case 'city':
            const cities = ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Huế', 'Nha Trang', 'Vũng Tàu', 'Đà Lạt', 'Quảng Ninh'];
            for (let i = 0; i < Math.min(count, cities.length); i++) {
                const row = {};
                row[dimension] = cities[i];
                row[measureField] = Math.floor(Math.random() * 1000) + 500;
                rows.push(row);
            }
            break;
        case 'district':
            const districts = ['Quận 1', 'Quận 2', 'Quận 3', 'Quận Hoàn Kiếm', 'Quận Ba Đình', 'Quận Hải Châu', 'Quận Ninh Kiều', 'Quận Ngô Quyền', 'Quận Thanh Khê', 'Quận Cẩm Lệ'];
            for (let i = 0; i < Math.min(count, districts.length); i++) {
                const row = {};
                row[dimension] = districts[i];
                row[measureField] = Math.floor(Math.random() * 1000) + 500;
                rows.push(row);
            }
            break;
        case 'store':
            const stores = ['CH001', 'CH002', 'CH003', 'CH004', 'CH005', 'CH006', 'CH007', 'CH008', 'CH009', 'CH010'];
            for (let i = 0; i < Math.min(count, stores.length); i++) {
                const row = {};
                row[dimension] = stores[i];
                row[measureField] = Math.floor(Math.random() * 1000) + 500;
                rows.push(row);
            }
            break;
        case 'year':
            const years = ['2020', '2021', '2022', '2023', '2024'];
            for (let i = 0; i < Math.min(count, years.length); i++) {
                const row = {};
                row[dimension] = years[i];
                row[measureField] = Math.floor(Math.random() * 1000) + 500;
                rows.push(row);
            }
            break;
        case 'quarter':
            const quarters = ['Q1/2023', 'Q2/2023', 'Q3/2023', 'Q4/2023', 'Q1/2024', 'Q2/2024'];
            for (let i = 0; i < Math.min(count, quarters.length); i++) {
                const row = {};
                row[dimension] = quarters[i];
                row[measureField] = Math.floor(Math.random() * 1000) + 500;
                rows.push(row);
            }
            break;
        case 'month':
            const months = ['T1/2023', 'T2/2023', 'T3/2023', 'T4/2023', 'T5/2023', 'T6/2023'];
            for (let i = 0; i < Math.min(count, months.length); i++) {
                const row = {};
                row[dimension] = months[i];
                row[measureField] = Math.floor(Math.random() * 1000) + 500;
                rows.push(row);
            }
            break;
        case 'day':
            const days = ['01/01/2023', '15/01/2023', '01/02/2023', '15/02/2023', '01/03/2023', '15/03/2023'];
            for (let i = 0; i < Math.min(count, days.length); i++) {
                const row = {};
                row[dimension] = days[i];
                row[measureField] = Math.floor(Math.random() * 1000) + 500;
                rows.push(row);
            }
            break;
        default:
            for (let i = 0; i < count; i++) {
                const row = {};
                row[dimension] = `Giá trị ${i+1}`;
                row[measureField] = Math.floor(Math.random() * 1000) + 500;
                rows.push(row);
            }
    }
    
    return rows;
}

async function startServer() {
    await initSqlConnection();
    await initOlapConnection(); 

app.listen(port, () => {
    console.log(`Server đang chạy tại http://localhost:${port}`);
});
}

app.get('/', (req, res) => {
    res.send('API Server cho ứng dụng OLAP - Bài tập lớn Kho Dữ liệu');
});

startServer();