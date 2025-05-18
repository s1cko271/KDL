SELECT
    dcc.categogy_name,
    dc.customer_name
FROM
    dbo.Dim_Customer AS dc
JOIN
    dbo.Dim_CategoryCustom AS dcc ON dc.category_key = dcc.category_key
WHERE
    dcc.category_key = 1
ORDER BY
    dcc.categogy_name,
    dc.customer_name;