/** "Juan Pérez - Plomero 24 h" → "juan-perez-plomero-24-h" */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function jobPath(job: { id: string; professionalName: string; title: string; alias?: string | null }): string {
  if (job.alias) return `/${job.alias}`;
  return `/p/${job.id}/${slugify(`${job.professionalName} ${job.title}`)}`;
}
