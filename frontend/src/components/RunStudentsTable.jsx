import { StarDisplay } from './StarRating';

function Reached({ reached }) {
  if (reached.finished) {
    return <span className="border-2 border-brutal-line bg-brutal-green px-1.5 text-xs font-bold text-brutal-dark">Finished</span>;
  }
  if (!reached.number) return <span className="text-xs opacity-70">No steps</span>;
  return (
    <span className="border-2 border-brutal-line bg-brutal-field px-1.5 text-xs font-bold">
      Step {reached.number} · {reached.title}
    </span>
  );
}

export default function RunStudentsTable({ students }) {
  if (students.length === 0) return <p className="text-sm opacity-70">Nobody joined this session.</p>;
  return (
    <div className="overflow-x-auto border-2 border-brutal-line bg-brutal-surface shadow-brutal">
      <table className="w-full text-left text-sm">
        <thead className="border-b-2 border-brutal-line bg-brutal-field text-xs uppercase tracking-wide">
          <tr>
            <th scope="col" className="px-3 py-2">Student</th>
            <th scope="col" className="px-3 py-2">Reached</th>
            <th scope="col" className="px-3 py-2">Rating</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="border-b border-brutal-line/20 last:border-b-0">
              <td className="px-3 py-2">{student.name}</td>
              <td className="px-3 py-2"><Reached reached={student.reached} /></td>
              <td className="px-3 py-2">
                {student.rating ? <StarDisplay value={student.rating} /> : <span className="text-xs opacity-70">none</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
