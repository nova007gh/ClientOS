import { prisma } from '../packages/database/src/index';

async function geocodeProspects() {
  const prospects = await prisma.prospect.findMany({
    select: { id: true, companyName: true, city: true, country: true, latitude: true, longitude: true },
    take: 200,
  });

  console.log('Total prospects:', prospects.length);
  console.log('With coords:', prospects.filter(p => p.latitude).length);
  const needGeocoding = prospects.filter(p => p.city && !p.latitude);
  console.log('Need geocoding:', needGeocoding.length);

  let updated = 0;
  for (const p of needGeocoding) {
    const query = [p.city, p.country].filter(Boolean).join(', ');
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'ClientOS-Seed/1.0' } });
      const data = await res.json();
      if (data && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        await prisma.prospect.update({ where: { id: p.id }, data: { latitude: lat, longitude: lng } });
        console.log(`Geocoded: ${p.companyName} -> ${lat}, ${lng}`);
        updated++;
        await new Promise(r => setTimeout(r, 2000));
      } else {
        console.log(`No result for: ${p.companyName} (${query})`);
      }
    } catch (e) {
      console.log(`Error for: ${p.companyName}`, e);
    }
  }

  console.log(`Done. Updated ${updated} prospects.`);
}

geocodeProspects().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
