import { getNotes, searchRecords } from '../../lib/notes.mjs';
export async function GET() {
  const { notes } = await getNotes();
  return Response.json(searchRecords(notes));
}
