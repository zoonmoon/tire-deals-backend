
import { syncAllVehiclesFromAutoSync } from ".";

export async function GET(){
    try{
        await syncAllVehiclesFromAutoSync()
        return new Response(`Success`,{status: 200});
    }catch(error){
        console.log(error)
        return new Response("Internal Server Error", {status: 500});
    }
}