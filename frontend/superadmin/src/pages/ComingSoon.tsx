import { Link, useLocation } from "react-router-dom";

// Placeholder for master-website pages that are not built yet.
const ComingSoon = () => {
  const { pathname } = useLocation();
  return (
    <main className="min-h-screen grid place-items-center px-6 text-center text-white bg-[#040a2c]">
      <div>
        <p className="text-sm text-white/60 mb-2">{pathname}</p>
        <h1 className="font-heading text-3xl font-light mb-3">This page is coming soon</h1>
        <Link to="/" className="text-cyan-300 hover:underline text-sm">
          ← Back to home
        </Link>
      </div>
    </main>
  );
};

export default ComingSoon;
