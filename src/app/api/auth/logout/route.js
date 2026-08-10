
import { clearAuthCookie } from "../utils/manage-cookie";


export async function POST() {

    try {

        await clearAuthCookie();

        return Response.json({

            success: true,

            message: 'Logged out successfully.'

        });

    } catch (error) {

        console.error(
            'Logout error:',
            error
        );

        return Response.json(
            {
                success: false,
                message: 'Unable to log out.'
            },
            {
                status: 500
            }
        );

    }

}