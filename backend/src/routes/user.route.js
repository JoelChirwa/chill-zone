import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { acceptFriendRequest, getFriendRequests, getMyFriends, getOutgoingFriendRequests, getRecommendedUsers, sendFriendRequest } from '../controllers/user.controller.js';

const router = express.Router();

// Apply the protectRoute middleware to all routes in this router
router.use(protectRoute);

router.get('/', getRecommendedUsers);
router.get('/friends', getMyFriends);
router.get('/friend-requests', getFriendRequests);
router.get('/outgoing-friend-requests', getOutgoingFriendRequests);

router.post('/friend-request/:id', sendFriendRequest);
router.put('/friend-request/:id/accept', acceptFriendRequest);

export default router;