import { NextResponse } from "next/server";

import openSearchClient from "@/app/api/setup-database/_lib/route";

import { getAuthenticatedAdmin } from "../../auth/utils/manage-cookie";

const INDEX_NAME =
    "contact_us_inquiries";

export async function GET(
    request,
    { params }
) {

    try {

        // ============================================================
        // ADMIN AUTHENTICATION
        // ============================================================

        const admin =
            await getAuthenticatedAdmin();


        if (!admin) {

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Authentication required.",
                },
                {
                    status: 401,
                }
            );

        }


        // ============================================================
        // ID
        // ============================================================

        const { id } =
            await params;


        if (!id) {

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Inquiry ID is required.",
                },
                {
                    status: 400,
                }
            );

        }


        // ============================================================
        // FETCH INQUIRY
        // ============================================================

        const response =
            await openSearchClient.get({

                index:
                    INDEX_NAME,

                id,

            });


        const responseBody =
            response.body ??
            response;


        // ============================================================
        // NOT FOUND
        // ============================================================

        if (!responseBody.found) {

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Inquiry not found.",
                },
                {
                    status: 404,
                }
            );

        }


        // ============================================================
        // KEEP ORIGINAL RESPONSE
        // ============================================================

        const inquiry = {
            id,
            ...responseBody._source,
        };


        // ============================================================
        // MARK AS VIEWED
        //
        // Do NOT modify `inquiry`.
        //
        // The response still returns:
        //
        // status: "new"
        //
        // while OpenSearch is changed to:
        //
        // status: "viewed"
        // ============================================================

        if (
            responseBody._source.status === "new"
        ) {

            await openSearchClient.update({

                index:
                    INDEX_NAME,

                id,

                body: {

                    doc: {

                        status:
                            "viewed",

                        updated_at:
                            new Date().toISOString(),

                    },

                },

                refresh: true,

            });

        }


        // ============================================================
        // RESPONSE
        // ============================================================

        return NextResponse.json({

            success: true,

            inquiry,

        });


    } catch (error) {

        console.error(
            "Admin contact inquiry error:",
            error
        );


        return NextResponse.json(
            {
                success: false,
                message:
                    "Unable to retrieve contact inquiry.",
            },
            {
                status: 500,
            }
        );

    }

}