import { getAuthenticatedAdmin } from "../utils/manage-cookie";

export async function GET() {

    try {

        const admin =
            await getAuthenticatedAdmin();


        if (!admin) {

            return Response.json(
                {
                    success: false,

                    is_logged_in: false,

                    admin: null
                },
                {
                    status: 401
                }
            );

        }


        return Response.json({

            success: true,

            is_logged_in: true,

            admin

        });


    } catch (error) {

        console.error(
            'Admin auth check error:',
            error
        );


        return Response.json(
            {
                success: false,

                message:
                    'Unable to check authentication.'
            },
            {
                status: 500
            }
        );

    }

}