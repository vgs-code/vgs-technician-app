insert into public.service_catalog (tenant_id, slug, name, category, short_description, base_price, duration_minutes, active, display_order)
select t.id, v.slug, v.name, v.category, v.description, v.price, v.duration, true, v.position
from public.business_tenants t
cross join (values
 ('carpenter','Carpenter Services','Handyman','Door, hinge, furniture and minor woodwork repairs.',299::numeric,60,13),
 ('mason','Mason Services','Handyman','Minor masonry, plaster, tile and household repair work.',399::numeric,60,14),
 ('painter','Painter Services','Handyman','Wall touch-ups and small home painting jobs.',499::numeric,60,15)
) as v(slug,name,category,description,price,duration,position)
where t.slug = 'vashishth-home-service'
on conflict (tenant_id, slug) do update set
 name = excluded.name,
 category = excluded.category,
 short_description = excluded.short_description,
 base_price = excluded.base_price,
 duration_minutes = excluded.duration_minutes,
 active = true,
 display_order = excluded.display_order;