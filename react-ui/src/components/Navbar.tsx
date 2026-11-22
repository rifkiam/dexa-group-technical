import Button from './Button';
import { useCookies } from 'react-cookie';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { decodeAccessToken } from '../lib/jwt';
import { logout } from '../api/api';

interface NavbarProps {
    title: string;
}

export default function Navbar({ title }: NavbarProps) {
    const [cookies, , removeCookies] = useCookies(['token', 'refreshToken']);
    const token = cookies.token;
    const refreshToken = cookies.refreshToken;
    const user = decodeAccessToken(token);
    const navigate = useNavigate();

    async function handleLogout() {
        const res = await logout(refreshToken);
        if (res.statusCode !== 200 || !res.data) {
            toast.error(res.message);
        } else {
            toast.success('Logged out successfully');
            removeCookies('token');
            removeCookies('refreshToken');
            navigate('/login');
        }
    }

    return (
        <div className="flex justify-between items-center w-full">
            <Link to="/" className='cursor-pointer'>
                <p>WFH Attendance Portal, {title}</p>
            </Link>
            <div className="flex gap-2">
                {
                    user ? (
                        <>
                            <Button variant="secondary" onClick={handleLogout}>
                                Logout
                            </Button>
                            {user.role === 'admin' && (
                                <Link to="/monitoring" className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-900 hover:bg-gray-50">
                                    Dashboard
                                </Link>
                            )}
                        </>
                    ) : (
                        <Link to="/login" className='bg-white text-black px-4 py-2 rounded-md font-semibold'>
                            Login
                        </Link>
                    )
                }
            </div>
        </div>
    )
}
