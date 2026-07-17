// import { synchronizeProducts } from ".";

// export async function GET(req){
//     try{
//         const { searchParams } = new URL(req.url);
    
//         await synchronizeProducts(searchParams.get("full_reindex") === "true");

//         return new Response(`Success`,{status: 200});

//     }catch(error){
        
//         console.log(error)

//         return new Response("Internal Server Error", {status: 500});

//     }

// }