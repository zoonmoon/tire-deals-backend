
import openSearchClient from '../../setup-database/_lib/route';



const INDEX_NAME = 'products';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function bulkUploadToOpensearchDatabase(products, attempt = 1) {
  const MAX_RETRIES = 5;
  
  
  try {
    if (!products || products.length === 0) {
      console.log('No products to upload');
      return;
    }

    const body = [];

    for (const product of products) {
      body.push({
        update: {
          _index: INDEX_NAME,
          _id: product.bigcommerce_id.toString(),
        },
      });

      body.push({
        doc: product,
        doc_as_upsert: true,
      });
    }

    await openSearchClient.bulk({
      refresh: true,
      body,
    });


  } catch (err) {
    console.error(`❌ Error in bulk upsert (attempt ${attempt}):`, err.message);

    if (attempt < MAX_RETRIES) {
      console.log(`🔁 Retrying entire batch...`);

      await sleep(500 * attempt); // backoff

      return bulkUploadToOpensearchDatabase(products, attempt + 1);
    }

    console.error('❌ Failed after max retries');
    throw err;
  }
}

export async function fetchAllActiveProductIdsFromOpenSearch() {

  const allIds = [];

  const SCROLL_TIME = '2m';
  
  const SIZE = 10000;

  let response = await openSearchClient.search({
    index: INDEX_NAME,
    scroll: SCROLL_TIME,
    size: SIZE,
    _source: false,
    body: {
      query: {
        bool: {
          filter: [
            { term: { is_visible: true } } // 👈 filter added
          ]
        }
      },
      sort: ['_doc'], // 👈 recommended for scroll
    },
  });

  let scrollId = response.body._scroll_id;

  try {
    while (true) {
      const hits = response.body.hits.hits;

      if (!hits.length) break;

      for (const hit of hits) {
        allIds.push(hit._id);
      }

      response = await openSearchClient.scroll({
        scroll_id: scrollId,
        scroll: SCROLL_TIME,
      });

      scrollId = response.body._scroll_id;
    }

    return allIds;

  } finally {
    if (scrollId) {
      await openSearchClient.clearScroll({
        scroll_id: scrollId,
      });
    }
  }
}

