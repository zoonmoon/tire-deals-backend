'use client';

import { useEffect, useState } from 'react';
import { BlocksRenderer } from '@strapi/blocks-react-renderer';

export default function BlogPage({ params }) {
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function getBlog() {
            try {
                const { slug } = await params;

                const response = await fetch(
                    `/api/cms/blogs/${encodeURIComponent(slug)}`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch blog');
                }

                const result = await response.json();

                setBlog(result.data);
            } catch (error) {
                console.error('Blog error:', error);
            } finally {
                setLoading(false);
            }
        }

        getBlog();
    }, [params]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!blog) {
        return <div>Blog not found</div>;
    }

    return (
        <main className="mx-auto max-w-4xl px-6 py-12">
            <article>
                <h1 className="mb-4 text-4xl font-bold">
                    {blog.title}
                </h1>

                {blog.excerpt && (
                    <p className="mb-8 text-lg text-gray-600">
                        {blog.excerpt}
                    </p>
                )}

                {blog.featuredImage?.url && (
                    <img
                        src={blog.featuredImage.url}
                        alt={blog.featuredImage.alt || blog.title}
                        width={blog.featuredImage.width}
                        height={blog.featuredImage.height}
                        className="mb-10 w-full rounded-lg"
                    />
                )}

                <div className="prose max-w-none">
                    <BlocksRenderer content={blog.content} />
                </div>
            </article>
        </main>
    );
}