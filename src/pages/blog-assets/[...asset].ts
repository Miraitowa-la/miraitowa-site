import { readFile } from 'node:fs/promises';
import { getNotes } from '../../lib/notes.mjs';
export async function getStaticPaths() {
  const { assets } = await getNotes();
  return assets.map((asset) => ({ params: { asset: asset.file }, props: { absolute: asset.absolute } }));
}
export async function GET({ props }: { props: { absolute: string } }) {
  return new Response(new Uint8Array(await readFile(props.absolute)));
}
