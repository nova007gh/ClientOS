import dynamicImport from 'next/dynamic';

export const dynamic = 'force-dynamic';

const LeadMapClient = dynamicImport(() => import('./lead-browser-client'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p>Loading map...</p>
    </div>
  ),
});

export default function LeadMapPage() {
  return <LeadMapClient />;
}
