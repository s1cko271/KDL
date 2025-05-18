SELECT
	dc.customer_name,
    c.city_name,
    c.states
FROM
    dbo.Dim_Customer AS dc
JOIN
    dbo.Dim_City AS c ON dc.city_key = c.city_key
WHERE
    dc.customer_name = 'Adam Young';