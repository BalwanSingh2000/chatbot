// import OpenAI from "openai";
// // import {OpenAIStream, StreamingTextResponse} from "ai"
// import { OpenAIStream, StreamingTextResponse } from "ai";
// import {DataAPIClient} from "@datastax/astra-db-ts"


// const {
//     ASTRA_DB_NAMESPACE,
//     ASTRA_DBCOLLECTION,
//     ASTRA_DB_ENDPOINT,
//     ASTRA_DB_APPLICATION_TOKEN,
//     OPENAI_API_KEY,
//   } = process.env;

//   const openai = new OpenAI({
//     apiKey: OPENAI_API_KEY
//   })

//   const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
//   const db = client.db(ASTRA_DB_ENDPOINT, {keyspace: ASTRA_DB_NAMESPACE})

//   export async function POST(req: Request){
//     try{
//         const {messages} = await req.json()
//         const latestMessage = messages[messages?.length -1 ]?.content
//         let docContext = ""
//       const embedding = await openai.embeddings.create({
//             model: "text-embedding-3-small",
//             input: latestMessage,
//             encoding_format: "float"
//         })
//         try{
//           const collection = await db.collection(ASTRA_DBCOLLECTION)
//        const cursor =  collection.find(null,{
//             sort:{
//                 $vector: embedding.data[0].embedding,
//             },
//             limit:10
//           })
        

//           const documents = await cursor.toArray()
         
//           const docsMap = documents?.map(doc => doc.text)
         
//           docContext = JSON.stringify(docsMap)

//         }
//         catch (err){
//             console.log("Error querying db ....")
//             docContext = ""
//         }
//         const template = {
//             role: "system",
//             content: `You are an Support Agent from the company counsel india , and you will answer the users about everything ths counsel india do and help the coustomers 
//             resolve the problems.
//             The context will provide you with the most pages from the counsel india website.
//             If the context doesn't includes the information you need to browse through the counsel india website only for the knowledge base , also you might use your own existing knowledge and dont mention the sourse of your information or 
//             what the context does and doesn't include. Also note that you will not provide any emial ID or mobile number to cantact.
//             Format responses using markdown where applicable , and dont return images or give any deadline or promises that it will be done , try your best to answer from the context.
//             ---------------
//             START CONTEXT 
//             ${docContext}
//             END CONTEXT 
//             ---------------
//             Question: ${latestMessage}  
//             ---------------
//             `
//         }
//        const response =  await openai.chat.completions.create({
//             model:"gpt-4",
//             stream: true,
//             messages: [template, ...messages ]


//         })
//        const stream = OpenAIStream(response)
//        return new StreamingTextResponse(stream)

//     }
//     catch(err){
//         throw err

//     }
   
  
//   }


import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { DataAPIClient } from "@datastax/astra-db-ts";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DBCOLLECTION,
  ASTRA_DB_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
} = process.env;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages?.[messages.length - 1]?.content;
    let docContext = "";

    console.log("Latest message:", latestMessage);

    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: latestMessage,
      encoding_format: "float",
    });

    console.log("Embedding generated. Length:", embedding.data[0].embedding.length);

    try {
      const collection = await db.collection(ASTRA_DBCOLLECTION);

      // DEBUG: Check if the DB has any data at all
      const testDoc = await collection.findOne();
      console.log("Sample document from DB (findOne):", testDoc);

      // Now perform the actual vector query
      const cursor = collection.find(null, {
        sort: {
          $vector: embedding.data[0].embedding,
        },
        limit: 10,
      });

      console.log("Vector query executed, awaiting documents...");

      const documents = await cursor.toArray();
      console.log("Documents returned from vector search:", documents);

      const docsMap = documents?.map((doc) => doc.text || JSON.stringify(doc));
      docContext = JSON.stringify(docsMap);
    } catch (err) {
      console.error("Error querying Astra DB:", err);
      docContext = "";
    }

    const template = {
      role: "system",
      content: `You are a Support Agent from the company Counsel India, and you will answer the users about everything Counsel India does and help the customers 
resolve their problems.you will assess the Context given to you are probide the answers to the user and you will never say i don't know the naswer to this question.
If you do not know answer to any question just tell them to visit this link  https://www.counselindia.com/support and raise there enquiries.

The context will provide you with pages from the Counsel India website.
If the context doesn't include the information, browse through the Counsel India website only for the knowledge base. You may use your existing knowledge, but do not mention the source of your information or what the context includes or doesn't include. 

Do not provide any email ID or mobile number for contact. And if the user ask a question again and again provide that use this link https://counselindia.com/support and ask the use to please write there problem there. Format responses using markdown where applicable. Do not return images, deadlines, or promises—just provide the best possible answer based on the context.

---------------
START CONTEXT 
${docContext}
END CONTEXT 
---------------
Question: ${latestMessage}  
---------------
`,
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      stream: true,
      messages: [template, ...messages],
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (err) {
    console.error("Error in POST handler:", err);
    throw err;
  }
}
