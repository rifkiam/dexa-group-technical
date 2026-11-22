import Button from './Button';
import { useCookies } from 'react-cookie';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { decodeAccessToken } from '../lib/jwt';
import { useState } from 'react';

interface NavbarProps {
    title: string;
}

export default function Navbar({ title }: NavbarProps) {
    const [cookies, , removeCookie] = useCookies(['token']);
    const user = decodeAccessToken(cookies.token);
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    function handleLogout() {
        removeCookie('token', { path: '/' });
        setMenuOpen(false);
        toast.success('Logged out successfully');
        navigate('/login', { replace: true });
    }

    return (
        <header className="w-full">
            <div className="flex min-h-12 items-center justify-between gap-3">
                <Link to="/" className="min-w-0 truncate font-semibold" onClick={() => setMenuOpen(false)}>
                    WFH Attendance Portal<span className="hidden sm:inline">, {title}</span>
                </Link>
                <nav aria-label="Main navigation" className="hidden items-center gap-2 sm:flex">
                    {user ? (
                        <>
                            {user.role === 'admin' && <Link to="/monitoring" className="rounded-md px-4 py-2 font-medium hover:bg-[#282931]">Dashboard</Link>}
                            <Button variant="secondary" className="hover:cursor-pointer" onClick={handleLogout}>Logout</Button>
                        </>
                    ) : <Link to="/login" className="rounded-md px-4 py-2 font-semibold hover:bg-gray-100">Login</Link>}
                </nav>
                <Button
                    variant="secondary"
                    className="sm:hidden"
                    aria-expanded={menuOpen}
                    aria-controls="mobile-navigation"
                    aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                    onClick={() => setMenuOpen((open) => !open)}
                >
                    <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
                </Button>
            </div>
            {menuOpen && (
                <nav id="mobile-navigation" aria-label="Mobile navigation" className="flex flex-col gap-2 border-t border-gray-200 py-3 sm:hidden">
                    {user ? (
                        <>
                            {user.role === 'admin' && <Link to="/monitoring" onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2 hover:bg-gray-100">Dashboard</Link>}
                            <Button variant="secondary" className="w-full" onClick={handleLogout}>Logout</Button>
                        </>
                    ) : <Link to="/login" onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2 hover:bg-gray-100">Login</Link>}
                </nav>
            )}
        </header>
    )
}
