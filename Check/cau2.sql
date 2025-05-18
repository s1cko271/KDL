SELECT DISTINCT
    dc.customer_name,
    t.months,
    t.quarters,
    t.years,
    fs.time_key
FROM
    dbo.Fact_Sales AS fs
JOIN
    dbo.Dim_Customer AS dc ON fs.customer_key = dc.customer_key
JOIN
    dbo.Dim_Time AS t ON fs.time_key = t.time_key
ORDER BY
    dc.customer_name, t.years, t.months;