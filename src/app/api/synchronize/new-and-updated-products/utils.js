const CUSTOM_FIELDS_TO_INCLUDE = process.env.CUSTOM_FIELDS_AS_FILTERS
const STORE_HASH = process.env.BIGC_STORE_HASH;
const ACCESS_TOKEN = process.env.BIGC_ACCESS_TOKEN;

import { getAncestors } from "../new-and-updated-categories/utils";

export function convertBigcResponseToElasticSearchForm(
    productsFromBigcResponse,
    brandsMap,
    categoriesMap
){
    
 
    const customFieldsToIncludeInArr = CUSTOM_FIELDS_TO_INCLUDE
        ? CUSTOM_FIELDS_TO_INCLUDE.split(',').map(c => c.trim().toLowerCase())
        : [];

    return productsFromBigcResponse.map(({
        id,
        name,
        sku,
        description,
        custom_url,
        price,
        sale_price,
        calculated_price,
        categories,
        brand_id,
        upc,
        mpn,
        inventory_level,
        inventory_tracking,
        is_visible,
        is_featured,
        availability,
        condition,
        images,
        custom_fields,
        sort_order
    }) => {

        let featured_image_url = images?.find(i => i.is_thumbnail)?.url_standard || '';


        custom_fields = (custom_fields || [])
            .filter(cf => customFieldsToIncludeInArr.includes(cf.name.toLowerCase()))
            .map(({ name, value }) => ({ label: name, value }));


        let allCategoriesThisProductLiesIn = categories.map(c => c.toString())

        categories.forEach(category => {
            allCategoriesThisProductLiesIn.push(
                ...getAncestors(category.toString(), categoriesMap)
            )
        })

        allCategoriesThisProductLiesIn = [...new Set(allCategoriesThisProductLiesIn)]

        allCategoriesThisProductLiesIn.forEach(catId => {
            custom_fields.push({
                label: "Categories",
                value: catId
            });
        });
        
        if(brandsMap[brand_id?.toString()]){
            custom_fields.push(
                {
                    label: "Brand",
                    value:  brandsMap[brand_id?.toString() || '']
                },
            )
        }


        return {
            bigcommerce_id: id, // will same as _id
            sku, // will same as _id
            is_visible,
            is_featured,
            categories:allCategoriesThisProductLiesIn,
            brand: brand_id || '',
            title: name,    
            url: custom_url?.url || '',
            inventory_tracking,
            inventory_level,
            price,
            upc, 
            mpn, 
            sale_price,
            description,     
            featured_image_url,
            custom_fields,
            sort_order,
            calculated_price,
            availability,
            condition

        }

    })

}


export async function getAllBrands() {

  const BASE_URL = `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/catalog/brands`;

  let page = 1;
  const limit = 250; // max allowed
  let allBrands = [];
  let totalPages = 1;

  try {

    do {

      const url = `${BASE_URL}?page=${page}&limit=${limit}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Auth-Token': ACCESS_TOKEN,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`BigCommerce API error: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();

      const { data, meta } = json;

      allBrands.push(...data);

      totalPages = meta?.pagination?.total_pages || 1;
      page++;

    } while (page <= totalPages);

    return allBrands;

  } catch (err) {
    console.error('Error fetching brands:', err.message);
    throw err;
  }
}