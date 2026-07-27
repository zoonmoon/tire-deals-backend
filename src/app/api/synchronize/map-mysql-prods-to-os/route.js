import { mapPendingTireInventory } from ".";

export async function GET() {

    try {

        const result =
            await mapPendingTireInventory();


        return Response.json(
            result
        );


    } catch (error) {


        console.error(
            error
        );


        return Response.json(

            {
                success: false,

                error:
                    error.message

            },

            {
                status: 500
            }

        );

    }

}