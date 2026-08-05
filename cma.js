export default async function handler(req, res) {
  const params = req.query.params || '';
  const url = `https://openaccess-api.clevelandart.org/api/artworks/?has_image=1&limit=20&type=Painting${params}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
