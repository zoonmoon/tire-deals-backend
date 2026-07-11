// lib/opensearchClient.js
import { Client } from '@opensearch-project/opensearch'

const openSearchClient = new Client({
  node: `https://${process.env.OPENSEARCH_USERNAME}:${process.env.OPENSEARCH_PASSWORD}@${process.env.OPENSEARCH_HOST}:${process.env.OPENSEARCH_PORT}`,
  ssl: {
    rejectUnauthorized: false, // If using self-signed certificates or improperly configured certificates
  },
})

export default openSearchClient