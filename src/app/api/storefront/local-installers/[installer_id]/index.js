import openSearchClient from "@/app/api/setup-database/_lib/route";

const INDEX_NAME = "all_installers";


// ============================================================
// GET INSTALLER
//
// Fetch complete installer document.
//
// Returns:
// {
//     id,
//     ...installer data
// }
//
// Returns null -- if installer does not exist.
// ============================================================

export async function getInstaller(
    installerId
) {

    if (
        installerId === null ||
        installerId === undefined ||
        installerId === ""
    ) {

        return null;

    }


    const id =
        String(
            installerId
        );


    try {

        const response =
            await openSearchClient.search({

                index:
                    INDEX_NAME,

                body: {

                    size: 1,

                    query: {

                        ids: {

                            values: [
                                id
                            ],

                        },

                    },

                },

            });


        const responseBody =
            response.body ??
            response;


        const hit =
            responseBody.hits?.hits?.[0];


        if (!hit) {

            return null;

        }


        return {

            id:
                hit._id,

            ...hit._source,

        };

    } catch (error) {

        console.error(
            "Failed to fetch installer:",
            error
        );
        
        throw error;

    }

}