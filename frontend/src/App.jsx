import { useRef, useState } from 'react';
import { summarize } from './api.js';
import Spinner from './components/Spinner.jsx';
import SummaryView from './components/SummaryView.jsx';

const MIN_LENGTH = 50;
const MAX_LENGTH = 100_000;

export default function App() {
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  const length = transcript.trim().length;
  const tooShort = length < MIN_LENGTH;
  const tooLong = length > MAX_LENGTH;

  async function handleSubmit(e) {
    e.preventDefault();
    if (tooShort || tooLong || loading) return;

    abortRef.current = new AbortController();
    setLoading(true);
    setError('');
    setSummary(null);
    try {
      setSummary(await summarize(transcript, abortRef.current.signal));
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">M</div>
          <div>
            <h1 className="text-lg font-semibold">Meeting Notes Summarizer</h1>
            <p className="text-sm text-slate-500">Paste a transcript. Get a summary, action items, risks, and next steps.</p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-4xl gap-6 px-4 py-8">
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <label htmlFor="transcript" className="mb-2 block text-sm font-medium text-slate-700">
            Meeting transcript
          </label>
          <textarea
            id="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            disabled={loading}
            rows={12}
            placeholder="Paste your meeting transcript here..."
            className="w-full resize-y rounded-lg border border-slate-300 p-3 text-sm leading-relaxed shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50"
          />
          <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className={`text-xs ${tooLong ? 'text-rose-600' : 'text-slate-400'}`}>
              {length.toLocaleString('en-US')} / {MAX_LENGTH.toLocaleString('en-US')} characters
              {length > 0 && tooShort && ` (minimum ${MIN_LENGTH})`}
            </span>
            <div className="flex gap-2">
              {loading && (
                <button
                  type="button"
                  onClick={() => abortRef.current?.abort()}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={tooShort || tooLong || loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading && <Spinner className="h-4 w-4" />}
                {loading ? 'Summarizing...' : 'Summarize'}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-10 text-slate-500">
            <Spinner className="h-8 w-8 text-indigo-600" />
            <p className="text-sm">Analyzing your meeting. This can take up to a minute.</p>
          </div>
        )}

        {summary && <SummaryView summary={summary} />}
      </main>
    </div>
  );
}
