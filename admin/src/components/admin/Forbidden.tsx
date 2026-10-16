import { Link } from "react-router";

export default function Forbidden() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/3">
      <h1 className="font-display text-title-sm font-semibold text-ink-900 dark:text-white">No access</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Your role doesn&apos;t include this section. Ask an administrator if you need it.</p>
      <Link to="/" className="mt-6 inline-block text-sm font-medium text-brand-500 hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
