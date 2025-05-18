SELECT DISTINCT
    c.city_name,
    c.states,
    c.addresses AS rep_office_address
FROM
    dbo.Fact_Inventory AS fi
JOIN
    dbo.Dim_Item AS i ON fi.item_key = i.item_key
JOIN
    dbo.Dim_Store AS s ON fi.store_key = s.store_key
JOIN
    dbo.Dim_City AS c ON s.city_key = c.city_key
WHERE
	fi.item_key = 1
AND fi.quantity_stock > 100
ORDER BY
    c.states, c.city_name;