const API = '/api';

export async function fetchCatalog() {
  const res = await fetch(`${API}/catalog`);
  return res.json();
}

export async function updateEpisodeTitle(episodeId: string, title: string) {
  const res = await fetch(`${API}/catalog/episode/${episodeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  return res.json();
}

export async function regenerateCatalog() {
  const res = await fetch(`${API}/catalog/regenerate`, { method: 'POST' });
  return res.json();
}

export async function uploadCover(entityId: string, file: File) {
  const form = new FormData();
  form.append('cover', file);
  const res = await fetch(`${API}/covers/${entityId}`, { method: 'POST', body: form });
  return res.json();
}

export async function uploadMp3(seriesFolder: string, file: File, onProgress?: (pct: number) => void): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API}/mp3/upload`);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
      else reject(new Error(xhr.responseText));
    };
    xhr.onerror = () => reject(new Error('Upload failed'));

    const form = new FormData();
    form.append('seriesFolder', seriesFolder);
    form.append('file', file);
    xhr.send(form);
  });
}

export async function fetchProgress() {
  const res = await fetch(`${API}/progress`);
  return res.json();
}

export async function fetchDevices() {
  const res = await fetch(`${API}/devices`);
  return res.json();
}
