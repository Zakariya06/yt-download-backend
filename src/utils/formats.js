function estimateFormatSize(format, allFormats, duration) {
  let size = format.filesize || format.filesize_approx || 0;
  if (!size && format.tbr && duration) {
    size = Math.round(((format.tbr * 1000) / 8) * duration);
  }
  if (size && (format.acodec === 'none' || !format.acodec)) {
    const audio = allFormats.filter((f) => f.acodec && f.acodec !== 'none' && f.vcodec === 'none');
    if (audio.length) {
      const best = audio.reduce((a, b) => ((b.abr || 0) > (a.abr || 0) ? b : a));
      let s = best.filesize || best.filesize_approx || 0;
      if (!s && best.abr && duration) s = Math.round(((best.abr * 1000) / 8) * duration);
      size += s || 0;
    }
  }
  return size || null;
}

function buildFormatList(rawFormats, duration) {
  const seen = new Set();
  return rawFormats
    .filter((f) => f.vcodec && f.vcodec !== 'none')
    .map((f) => {
      const hasAudio = f.acodec && f.acodec !== 'none';
      return {
        format_id: hasAudio ? f.format_id : `${f.format_id}+bestaudio`,
        resolution: f.resolution || f.format_note || `${f.height || '?'}p`,
        filesize: estimateFormatSize(f, rawFormats, duration),
        hasAudio,
      };
    })
    .filter((f) => (seen.has(f.resolution) ? false : seen.add(f.resolution)));
}

module.exports = { estimateFormatSize, buildFormatList };