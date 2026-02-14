import MixBuilder from '../../../components/MixBuilder';

interface MixPageProps {
  params: { id: string };
}

export default function MixPage({ params }: MixPageProps) {
  return <MixBuilder mixId={params.id} />;
}
