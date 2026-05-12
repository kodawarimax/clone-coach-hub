import CloneDetail from '@/components/clones/CloneDetail';
export default function CloneDetailPage({ params }: { params: { slug: string } }) {
  return <CloneDetail slug={params.slug} />;
}
