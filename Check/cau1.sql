SELECT 
    ds.store_key,
    dc.city_name,
    dc.states,
    ds.phone_number,
    di.descriptions AS item_description,
    di.[size] AS item_size,
    di.weights AS item_weight,
    di.price AS item_price
FROM 
    dbo.Dim_Store ds
    INNER JOIN dbo.Dim_City dc ON ds.city_key = dc.city_key
    INNER JOIN dbo.Fact_Inventory fi ON ds.store_key = fi.store_key
    INNER JOIN dbo.Dim_Item di ON fi.item_key = di.item_key
WHERE 
    fi.quantity_stock > 0
ORDER BY 
    ds.store_key, di.item_key;