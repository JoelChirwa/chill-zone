import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";


export async function getRecommendedUsers(req, res) {
    try {
        const currentUserId = req.user._id;
        const currentUser = req.user;

        const recommendedUsers = await User.find({
            $and: [
                { _id: { $ne: currentUserId } }, // Exclude current user
                { $id: { $nin: currentUser.friends } }, // Exclude friends
                { isOnboarded: true } // Only include onboarded users
            ]
        })
        res.status(200).json({
            users: recommendedUsers
        });
    } catch (error) {
        console.error('Error fetching recommended users:', error);
        res.status(500).json({ message: 'internal server error' });
    }
}

export async function getMyFriends(req, res) {
    try {
        const user = await User.findById(req.user._id).select('friends')
            .populate('friends', '_fullName profilePicture bio learningLanguage nativeLanguage');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({
            friends: user.friends
        });
    } catch (error) {
        console.error('Error in getMyFriends:', error);
        res.status(500).json({ message: 'internal server error' });
    }
}

export async function sendFriendRequest(req, res) {
    try {
        const myId = req.user._id;
        const { id: recipientId } = req.params;

        // prevent sending request to self
        if (myId === recipientId) {
            return res.status(400).json({ message: "You cant send a friend request to yourself" })
        }

        const recipient = await User.findById(recipientId);

        if (!recipient) {
            return res.status(404).json({ message: "Recipient not found" })
        }

        // check if already friends
        if (recipient.friends.includes(myId)) {
            return res.status(400).json({ message: "You are already friends with this user" })
        }

        // check if req already exists
        const existingReq = await FriendRequest.findOne({
            $or: [
                { sender: myId, recipient: recipientId },
                { sender: recipientId, recipient: myId }
            ]
        });

        if (existingReq) {
            return res
                .status(400)
                .json({ message: 'Friend request already exists between you and this user' });
        }

        const friendRequest = await FriendRequest.create({
            sender: myId,
            recipient: recipientId
        });

        res.status(201).json(friendRequest);

    } catch (error) {
        console.error('Error in sendFriendRequest:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function acceptFriendRequest(req, res) {
    try {
        const { id: requestId } = req.params;

        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest) {
            return res.status(404).json({ message: 'Friend request not found' });
        }

        // Verify that the current user is the recipient of the friend request
        if (friendRequest.recipient.toString() !== req.user._id) {
            return res
            .status(403)
            .json({ message: 'You are not authorized to accept this friend request' });
        }

        friendRequest.status = 'accepted';
        await friendRequest.save();

        // Update both users' friends lists
        // $addToSet ensures no duplicates
        await User.findByIdAndUpdate(friendRequest.sender, {
            $addToSet: { friends: friendRequest.recipient }
        });

        await User.findByIdAndUpdate(friendRequest.recipient, {
            $addToSet: { friends: friendRequest.sender }
        });

        res.status(200).json({ message: 'Friend request accepted' });

    } catch (error) {
        console.error('Error in acceptFriendRequest:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function getFriendRequests(req, res) {
    try {
        const incomingRequests = await FriendRequest.find({
            recipient: req.user._id,
            status: 'pending'
        })
        .populate('sender', 'fullName profilePicture learningLanguage nativeLanguage');

        const acceptedRequests = await FriendRequest.find({
            recipient: req.user._id,
            status: 'accepted'
        })
        .populate('sender', 'fullName profilePicture');

        res.status(200).json({
            incomingRequests,
            acceptedRequests
        });

    } catch (error) {
        console.error('Error in getFriendRequests:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function getOutgoingFriendRequests(req, res) {
    try {
        const outgoingRequests = await FriendRequest.find({
            sender: req.user._id,
            status: 'pending'
        }) 
        .populate('recipient', 'fullName profilePicture learningLanguage nativeLanguage');

        res.status(200).json({
            outgoingRequests
        });

    } catch (error) {
        console.error('Error in getOutgoingFriendRequests:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}