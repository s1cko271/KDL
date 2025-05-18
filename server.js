// Server backend cho ứng dụng OLAP
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sql = require('mssql');

// Cấu hình kết nối SQL Server - Đơn giản nhất
const sqlConfig = {
    server: '.\\SQLEXPRESS', // Sử dụng dấu . để chỉ local machine
    database: 'DWH',
    options: {
        trustedConnection: true,
        trustServerCertificate: true,
        encrypt: false
    }
}; 