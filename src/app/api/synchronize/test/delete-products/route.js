import { deleteAllTestProducts } from ".";

export async function GET(){
    try{
        await deleteAllTestProducts()
        return new Response(`Success`,{status: 200});
    }catch(error){
        console.log(error)
        return new Response("Internal Server Error", {status: 500});
    }
}