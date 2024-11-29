import pkg from 'jsonwebtoken';
const { verify } = pkg;

async function authUser(token) {
    if (!token) throw new Error("Token missing");

    const decoded = verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) throw new Error("Invalid token");

    return { id: decoded.id, role: decoded.role };
}
export default authUser