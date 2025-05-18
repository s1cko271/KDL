SELECT DISTINCT
    s.store_key,
    c.city_name,
    s.phone_number
FROM
    dbo.Fact_Sales AS fs
JOIN
    dbo.Dim_Customer AS dc ON fs.customer_key = dc.customer_key
JOIN
    dbo.Dim_Store AS s ON fs.store_key = s.store_key
JOIN
    dbo.Dim_City AS c ON s.city_key = c.city_key
WHERE
    dc.customer_name = 'Gary Morales'
ORDER BY
    c.city_name, s.store_key;
