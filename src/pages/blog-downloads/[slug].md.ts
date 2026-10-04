import { getNotes, downloadNote } from '../../lib/notes.mjs';
export async function getStaticPaths() {
  const { notes } = await getNotes();
  return notes.map((note) => ({ params: { slug: note.slug }, props: { note } }));
}
export function GET({ props }) {
  return new Response(downloadNote(props.note), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
