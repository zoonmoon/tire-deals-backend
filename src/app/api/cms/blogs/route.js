import { NextResponse } from 'next/server';

const STRAPI_API_BASE_URL = process.env.STRAPI_API_BASE_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        const page = Number(searchParams.get('page') || 1);
        const pageSize = Number(searchParams.get('pageSize') || 24);

        const strapiUrl = new URL(
            `${STRAPI_API_BASE_URL}/api/blog-posts`
        );

        strapiUrl.searchParams.set('populate', '*');
        strapiUrl.searchParams.set('pagination[page]', page);
        strapiUrl.searchParams.set('pagination[pageSize]', pageSize);

        const response = await fetch(strapiUrl.toString(), {
            headers: {
                Authorization: `Bearer ${STRAPI_API_TOKEN}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();

            console.error('Strapi error:', errorText);

            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to fetch blogs from Strapi',
                },
                {
                    status: response.status,
                }
            );
        }

        const result = await response.json();

        const blogs = result.data.map((blog) => ({
            id: blog.documentId,
            title: blog.Title,
            slug: blog.slug,
            excerpt: blog.Excerpt,
            content: blog.Content,

            featuredImage: blog.FeaturedImage
                ? {
                      url: blog.FeaturedImage.url,
                      alt: blog.FeaturedImage.alternativeText,
                      width: blog.FeaturedImage.width,
                      height: blog.FeaturedImage.height,
                  }
                : null,

            category: blog.Category
                ? {
                      id: blog.Category.documentId,
                      name: blog.Category.Name,
                  }
                : null,

            tags:
                blog.Tags?.map((tag) => ({
                    id: tag.documentId,
                    name: tag.Name,
                })) ?? [],

            author: blog.Author
                ? {
                      id: blog.Author.documentId,
                      name: blog.Author.Name,
                  }
                : null,

            seo: {
                title: blog.MetaTitle,
                description: blog.MetaDescription,
            },

            publishedAt: blog.publishedAt,
        }));

        return NextResponse.json({
            success: true,
            data: blogs,
            pagination: result.meta.pagination,
        });

    } catch (error) {
        console.error('Blogs API error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch blogs',
            },
            {
                status: 500,
            }
        );
    }
}