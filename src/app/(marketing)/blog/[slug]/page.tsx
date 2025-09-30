import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Post = {
  slug: string;
  title: string;
  description: string;
  content: string;
};

// Placeholder in-memory post. Replace with MDX integration later.
const posts: Post[] = [
  {
    slug: 'hello-world',
    title: 'Hello World',
    description: 'Getting started with our new blog.',
    content: 'Welcome to the ShopEase blog! More content coming soon.',
  },
];

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = posts.find(p => p.slug === params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = posts.find(p => p.slug === params.slug);
  if (!post) return notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      <p className="text-gray-600 mb-8">{post.description}</p>
      <div className="prose">
        {post.content}
      </div>
    </div>
  );
}


