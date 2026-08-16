import { NextResponse } from 'next/server';

const STRAPI_API_BASE_URL = process.env.STRAPI_API_BASE_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function GET(request, { params }) {
    try {
        const { slug } = await params;

        const strapiUrl = new URL(
            `${STRAPI_API_BASE_URL}/api/blog-posts`
        );

        strapiUrl.searchParams.set('filters[slug][$eq]', slug);
        strapiUrl.searchParams.set('populate', '*');

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
                    error: 'Failed to fetch blog from Strapi',
                },
                {
                    status: response.status,
                }
            );
        }

        const result = await response.json();

        // Blog not found
        if (!result.data || result.data.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Blog not found',
                },
                {
                    status: 404,
                }
            );
        }

        const blog = result.data[0];

        const formattedBlog = {
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
        };

        return NextResponse.json({
            success: true,
            data: formattedBlog,
        });

    } catch (error) {
        console.error('Blog API error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch blog',
            },
            {
                status: 500,
            }
        );
    }
}