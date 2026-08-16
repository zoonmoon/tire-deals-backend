import { NextResponse } from "next/server";


import openSearchClient from "../../setup-database/_lib/route";

import { getAuthenticatedAdmin } from "../auth/utils/manage-cookie";

const INDEX_NAME =
    "contact_us_inquiries";

export async function GET(request) {

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
        // URL PARAMETERS
        // ============================================================

        const { searchParams } =
            new URL(request.url);


        // ============================================================
        // PAGINATION
        // ============================================================

        let page =
            parseInt(
                searchParams.get("page") || "1",
                10
            );


        let limit =
            parseInt(
                searchParams.get("limit") || "25",
                10
            );


        if (
            !Number.isInteger(page) ||
            page < 1
        ) {

            page = 1;

        }


        if (
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 100
        ) {

            limit = 25;

        }


        const from =
            (page - 1) * limit;


        // ============================================================
        // FILTERS
        // ============================================================

        const search =
            String(
                searchParams.get("search") || ""
            ).trim();


        const status =
            String(
                searchParams.get("status") || ""
            ).trim();


        // ============================================================
        // BUILD QUERY
        // ============================================================

        const must = [];

        const filter = [];


        // ------------------------------------------------------------
        // SEARCH
        // ------------------------------------------------------------

        if (search) {

            must.push({

                multi_match: {

                    query: search,

                    fields: [
                        "name",
                        "email",
                        "phone",
                        "subject",
                        "message",
                    ],

                },

            });

        }


        // ------------------------------------------------------------
        // STATUS
        // ------------------------------------------------------------

        if (status) {

            filter.push({

                term: {
                    status,
                },

            });

        }


        // ============================================================
        // FETCH ONE EXTRA
        // ============================================================

        const fetchSize =
            limit + 1;


        // ============================================================
        // OPENSEARCH
        // ============================================================

        const response =
            await openSearchClient.search({

                index:
                    INDEX_NAME,

                body: {

                    from,

                    size:
                        fetchSize,

                    track_total_hits:
                        true,

                    query: {

                        bool: {

                            must,

                            filter,

                        },

                    },

                    sort: [

                        {
                            created_at: {
                                order: "desc",
                            },
                        },

                    ],

                },

            });


        const responseBody =
            response.body ??
            response;


        const hits =
            responseBody.hits?.hits ||
            [];


        // ============================================================
        // PAGINATION
        // ============================================================

        const hasNext =
            hits.length > limit;


        const hasPrevious =
            page > 1;


        // ============================================================
        // REMOVE EXTRA RESULT
        // ============================================================

        const inquiries =
            hits
                .slice(0, limit)
                .map((hit) => ({

                    id:
                        hit._id,

                    ...hit._source,

                }));


        const total =
            responseBody.hits?.total?.value ??
            inquiries.length;


        // ============================================================
        // RESPONSE
        // ============================================================

        return NextResponse.json({

            success: true,

            inquiries,

            pagination: {

                page,

                limit,

                total,

                has_previous:
                    hasPrevious,

                has_next:
                    hasNext,

            },

        });


    } catch (error) {

        console.error(
            "Admin contact inquiries error:",
            error
        );


        return NextResponse.json(
            {
                success: false,
                message:
                    "Unable to retrieve contact inquiries.",
            },
            {
                status: 500,
            }
        );

    }

}