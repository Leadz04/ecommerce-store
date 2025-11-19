'use client';

import BackButton from '@/components/BackButton';

export default function BlogBackButton() {
  return (
    <div className="mb-4 sm:mb-6">
      <BackButton href="/blog" variant="with-label" />
    </div>
  );
}

