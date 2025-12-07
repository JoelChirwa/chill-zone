import { generateStreamToken } from '../lib/Stream.js'

export async function getStreamToken(req, res) {
    try {
        const token = generateStreamToken(req.user._id.toString());

        res.status(200).json({ token })

    } catch (error) {
        console.error('Error generating Stream token:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}