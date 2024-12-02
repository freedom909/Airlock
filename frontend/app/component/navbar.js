// components/Navbar.js
import Link from 'next/link';

const Navbar = () => {
    return (
        <nav className="p-4 bg-gray-800 text-white">
            <ul className="flex gap-4">
                <li>
                    <Link href="/">Home</Link>
                </li>
                <li>
                    <Link href="/listing">Listing</Link>
                </li>
                <li>
                    <Link href="/oauth">OAuth</Link>
                </li>
                <li>
                    <Link href="/login">Login</Link>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;
