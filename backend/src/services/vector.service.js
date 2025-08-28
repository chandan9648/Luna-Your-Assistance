// Import the Pinecone library
const { Pinecone } = require('@pinecone-database/pinecone');

// Initialize a Pinecone client with your API key
const apiKey = process.env.PINECONE_API_KEY;
let pc = null;
let index = null;

try {
    if (apiKey) {
        pc = new Pinecone({ apiKey });
        const indexName = process.env.PINECONE_INDEX || 'cohort-chat-gpt';
        index = pc.index(indexName);
    } else {
        console.warn('[vector.service] PINECONE_API_KEY not set; vector memory is disabled.');
    }
} catch (e) {
    console.error('[vector.service] Failed to initialize Pinecone client:', e?.message || e);
}

function normalizeMetadata(meta) {
    if (!meta) return undefined;
    const out = { ...meta };
    // Ensure common id fields are strings for filters
    if (out.user) out.user = String(out.user);
    if (out.chat) out.chat = String(out.chat);
    return out;
}

async function createMemory({ vectors, metadata, messageId }) {
    if (!index) return; // no-op if pinecone not configured
    if (!Array.isArray(vectors) || vectors.length === 0) return;
    try {
        await index.upsert([
            {
                id: String(messageId),
                values: vectors,
                metadata: normalizeMetadata(metadata),
            },
        ]);
    } catch (e) {
        console.error('[vector.service] upsert error:', e?.response?.data || e?.message || e);
    }
}

async function queryMemory({ queryVector, limit = 5, metadata }) {
    if (!index) return [];
    try {
        const data = await index.query({
            vector: queryVector,
            topK: limit,
            filter: normalizeMetadata(metadata),
            includeMetadata: true,
        });
        return data?.matches || [];
    } catch (e) {
        console.error('[vector.service] query error:', e?.response?.data || e?.message || e);
        return [];
    }
}

module.exports = { createMemory, queryMemory };