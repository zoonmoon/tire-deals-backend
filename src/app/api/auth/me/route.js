
import { getAuthenticatedCustomer } from "../utils/manage-cookie";

export async function GET() {

    try {

        const customer = await getAuthenticatedCustomer();


        // ============================================================
        // NOT AUTHENTICATED
        // ============================================================

        if (!customer) {

            return Response.json(
                {
                    success: false,
                    is_logged_in: false, 
                    authenticated: false,
                    customer: null
                },
                {
                    status: 401
                }
            );

        }


        // ============================================================
        // AUTHENTICATED
        // ============================================================

        return Response.json({

            success: true,

            authenticated: true,

            is_logged_in: true, 

            customer: {

                id: customer.id,

                email: customer.email

            }

        });


    } catch (error) {

        console.error(
            'Get authenticated customer error:',
            error
        );


        return Response.json(
            {
                success: false,
                authenticated: false,
                customer: null
            },
            {
                status: 500
            }
        );

    }

}