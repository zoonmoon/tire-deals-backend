
import { clearAdminAuthCookie } from "../utils/manage-cookie";

export async function POST() {

    try {

        await clearAdminAuthCookie();


        return Response.json({

            success: true,

            message:
                'Logged out successfully.'

        });


    } catch (error) {

        console.error(
            'Admin logout error:',
            error
        );


        return Response.json(
            {
                success: false,
                message:
                    'Unable to log out.'
            },
            {
                status: 500
            }
        );

    }

}