SELECT
    fs.time_key, -- Hiển thị time_key thay cho ngày/đơn hàng
    dc.customer_name,
    i.descriptions AS item_description,
    s.store_key AS selling_store_key,
    c.city_name AS selling_city_name
FROM
    dbo.Fact_Sales AS fs
JOIN
    dbo.Dim_Customer AS dc ON fs.customer_key = dc.customer_key
JOIN
    dbo.Dim_Item AS i ON fs.item_key = i.item_key
JOIN
    dbo.Dim_Store AS s ON fs.store_key = s.store_key
JOIN
    dbo.Dim_City AS c ON s.city_key = c.city_key
ORDER BY
    fs.time_key, dc.customer_name, i.descriptions;
