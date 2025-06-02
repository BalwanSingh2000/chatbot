// import {DataAPIClient} from "@datastax/astra-db-ts"
// import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
// // import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer_web_base";
// // import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer_web_base";
// import OpenAI from "openai"
// import {RecursiveCharacterTextSplitter} from "langchain/text_splitter"

// import "dotenv/config"
// import { sign } from "node:crypto";

// type SimilarityMetric = "dot_product" | "cosine" | "euclidean"


// const {ASTRA_DB_NAMESPACE, ASTRA_DBCOLLECTION, ASTRA_DB_ENDPOINT, ASTRA_DB_APPLICATION_TOKEN, OPENAI_API_KEY} = process.env


// const openai = new OpenAI({ apiKey : OPENAI_API_KEY})

// const f1Data =[
//     'https://www.counselindia.com/refund-policy',
//     'https://www.counselindia.com/terms-condition',
//     'https://www.counselindia.com/privacy-policy',
//     'https://www.counselindia.com/faq'
// ]

// const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
// const db = client.db(ASTRA_DB_ENDPOINT, { keyspace : ASTRA_DB_NAMESPACE})

// const spilitter = new RecursiveCharacterTextSplitter({

//     chunkSize: 512,
//     chunkOverlap: 100
// })

// const createCollection = async (similarityMetric : SimilarityMetric= "dot_product") =>{
//     const res = await db.createCollection(ASTRA_DBCOLLECTION,{
//         vector : {
//             dimension : 1536,
//             metric: similarityMetric

//         }
//     })
//     console.log(res)
// }

// const loadSampleData = async () =>{
//     const collection = await db.collection(ASTRA_DBCOLLECTION)
//     for await (const url of f1Data){
//         const content =  await scrapePage(url)
//         const chunks = await spilitter.splitText(content)
//         for await (const chunk of chunks){
//             const embedding = await openai.embeddings.create({
//                 model : "text-embedding-3-small",
//                 input : chunk,
//                 encoding_format: "float"
//             }) 
         
//             const vector = embedding.data[0].embedding
       
//             console.log("Inserting chunk:", chunk.slice(0, 100));

//             const res = await collection.insertOne({
//                 $vector: vector,
//                 text: chunk
//             })
//             console.log("Insert result:", res);
//             console.log(res)
//         }
//     }
// }

// const scrapePage= async (url: string) =>{
//    const loader= new PuppeteerWebBaseLoader(url ,{
//         launchOptions:{
//             headless: true
//         },
//         gotoOptions:{
//             waitUntil: "domcontentloaded"
//         },
//         evaluate : async (page, browser) =>{
//            const result =  await page.evaluate(()=>document.body.innerHTML)
//            await browser.close()
//            return result
//         } 
//     })
//     return (await loader.scrape())?.replace(/<[^>]*>?/gm, '')

// }


// createCollection().then(()=> loadSampleData())


import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import OpenAI from "openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import "dotenv/config";

type SimilarityMetric = "dot_product" | "cosine" | "euclidean";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DBCOLLECTION,
  ASTRA_DB_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
  ASTRA_DB_ID,
  ASTRA_DB_REGION,
} = process.env;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const f1Data = [
  "https://www.counselindia.com/refund-policy",
  "https://www.counselindia.com/terms-condition",
  "https://www.counselindia.com/privacy-policy",
  "https://www.counselindia.com/faq",
  "https://counselindia.com/chatbotfaq"
];

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
// const db = client.db(ASTRA_DB_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE });
// const db = client.db(ASTRA_DB_ENDPOINT, ASTRA_DB_NAMESPACE);
const db = client.db(ASTRA_DB_ID!, ASTRA_DB_REGION!, { namespace: ASTRA_DB_NAMESPACE! });
// const db = client.db(ASTRA_DB_ID!, ASTRA_DB_REGION!, ASTRA_DB_NAMESPACE!);




const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

const createCollection = async (
  similarityMetric: SimilarityMetric = "dot_product"
) => {
  const res = await db.createCollection(ASTRA_DBCOLLECTION, {
    vector: {
      dimension: 1536,
      metric: similarityMetric,
    },
  });
  console.log("Collection created:", res);
};

const loadSampleData = async () => {
  const collection = await db.collection(ASTRA_DBCOLLECTION);

  for await (const url of f1Data) {
    try {
      console.log(`\nScraping: ${url}`);
      const content = await scrapePage(url);

      if (!content || content.trim().length < 100) {
        console.warn(`⚠️ Skipped: Empty or invalid content from ${url}`);
        continue;
      }

      console.log(`Scraped content length: ${content.length}`);

      const chunks = await splitter.splitText(content);

      for await (const chunk of chunks) {
        try {
          const embedding = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: chunk,
            encoding_format: "float",
          });

          const vector = embedding.data[0].embedding;

          console.log("Inserting chunk:", chunk.slice(0, 100).replace(/\s+/g, " "));

          const res = await collection.insertOne({
            $vector: vector,
            text: chunk,
          });

          console.log("✅ Inserted");
        } catch (embeddingError: any) {
          console.error("❌ OpenAI or Insert Error:", embeddingError.message);
        }
      }
    } catch (pageError) {
      console.error(`❌ Failed scraping ${url}:`, pageError);
    }
  }
};

const scrapePage = async (url: string) => {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: {
      headless: true,
    },
    gotoOptions: {
      waitUntil: "domcontentloaded",
    },
    evaluate: async (page, browser) => {
      const result = await page.evaluate(() => document.body?.innerText || "");
      await browser.close();
      return result;
    },
  });

  const html = await loader.scrape();
  return html?.replace(/<[^>]*>?/gm, "");
};

createCollection()
  .then(() => loadSampleData())
  .catch((err) => {
    console.error("Fatal error:", err);
  });
