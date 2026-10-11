import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, buttonVariants } from '../components/ui/button';

export default function NotFound({ homeLabel }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p aria-hidden="true" className="font-heading text-[clamp(4.5rem,14vw,8.75rem)] leading-none">
        {'{'}
        <span className="mx-[0.06em] inline-block border-3 border-brutal-line bg-brutal-accent px-[0.12em] text-brutal-dark shadow-brutal-lg">
          404
        </span>
        {'}'}
      </p>
      <h2 className="text-2xl font-heading">Page not found</h2>
      <p className="max-w-[34ch] opacity-75">
        Nothing lives at{' '}
        <code className="break-all border-2 border-brutal-line bg-brutal-field px-1.5 text-sm">{pathname}</code>. It may have
        been deleted, or the link is wrong.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/" className={buttonVariants()}>{homeLabel}</Link>
        <Button variant="neutral" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    </div>
  );
}
