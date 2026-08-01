import syncMysqlInventoryToOpenSearch from "."

export async function GET(){

    try{

        await syncMysqlInventoryToOpenSearch()

        return new Response("success")

    }catch(error){
    
        return new Response("failure")
    
    }

}