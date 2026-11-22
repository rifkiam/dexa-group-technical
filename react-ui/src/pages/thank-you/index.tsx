import { Link } from 'react-router';

export default function ThankYouPage() {
  return (
    <main className="mx-auto mt-8 w-full max-w-lg rounded-xl bg-[#1f2028] p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700" aria-hidden="true">✓</div>
      <h1 className="text-2xl font-bold">Thank you!</h1>
      <p className="mt-2 text-gray-600">Your WFH attendance has been recorded for today.</p>
      <Link to="/attendance" className="mt-6 inline-flex rounded-md bg-gray-800 px-4 py-2 font-medium text-white hover:bg-gray-900">View today’s attendance</Link>
    </main>
  );
}
