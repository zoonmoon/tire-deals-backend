import synchronizeInventory from "."

export async function GET(){

    try{

        await synchronizeInventory()

        return new Response("success")

    }catch(error){
    
        return new Response("failure")
    
    }

}