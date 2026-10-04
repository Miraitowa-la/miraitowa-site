import { readFile } from 'node:fs/promises';
import { getNotes } from '../../lib/notes.mjs';
export async function getStaticPaths() {
  const { assets } = await getNotes();
  return assets.map((asset) => ({ params: { asset: asset.id }, props: { absolute: asset.absolute } }));
}
export async function GET({ props }: { props: { absolute: string } }) {
  const types: Record<string, string> = { svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif' };
  const extension = props.absolute.split('.').pop()!.toLowerCase();
  return new Response(new Uint8Array(await readFile(props.absolute)), { headers: { 'Content-Type': types[extension] || 'application/octet-stream' } });
}
