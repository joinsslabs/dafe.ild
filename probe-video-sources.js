const https = require("https");

function getJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0", ...headers }, timeout: 10000 }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, text: data.slice(0, 300) });
        }
      });
    }).on("error", reject);
  });
}

(async () => {
  // 1. Search HuggingFace Spaces for active text-to-video / wan / ltx / cogvideo spaces
  const hfSpaces = await getJson("https://huggingface.co/api/spaces?search=text-to-video&sort=likes&direction=-1&limit=15");
  console.log("HF T2V Spaces:", hfSpaces.status, Array.isArray(hfSpaces.json) ? hfSpaces.json.map(s => s.id) : hfSpaces.text);

  const wanSpaces = await getJson("https://huggingface.co/api/spaces?search=Wan2.1&sort=likes&direction=-1&limit=15");
  console.log("HF Wan Spaces:", wanSpaces.status, Array.isArray(wanSpaces.json) ? wanSpaces.json.map(s => s.id) : wanSpaces.text);

  // 2. Check Wikimedia Commons real video search for prompt keywords (100% free, real moving video files!)
  const wikiUrl = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=filetype:video+cat+girl&gsrnamespace=6&prop=imageinfo&iiprop=url|mime|size&format=json&origin=*";
  const wiki = await getJson(wikiUrl);
  const pages = wiki.json?.query?.pages ? Object.values(wiki.json.query.pages) : [];
  console.log("Wikimedia real videos found:", pages.length, pages.slice(0, 3).map(p => ({ title: p.title, url: p.imageinfo?.[0]?.url, mime: p.imageinfo?.[0]?.mime })));

  // 3. Check Internet Archive real moving video search
  const iaUrl = "https://archive.org/advancedsearch.php?q=mediatype:(movies)+AND+(cat+OR+kitten)+AND+format:(MPEG4)&fl[]=identifier,title&rows=5&page=1&output=json";
  const ia = await getJson(iaUrl);
  console.log("Internet Archive videos:", ia.status, ia.json?.response?.docs);
})();
