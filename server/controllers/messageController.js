import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";

// Get all users except the logged in user
export const getUserForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;

        const filterUsers = await User.find({ _id: { $ne: userId } }).select("-password");

        const unseenMessages = {};
        const promises = filterUsers.map(async (user) => {
            const messages = await Message.find({
                senderId: user._id,
                receiverId: userId,
                seen: false,
            });

            if (messages.length > 0) {
                unseenMessages[user._id] = messages.length;
            }
        });

        await Promise.all(promises);
        res.status(200).json({
            success: true,
            users: filterUsers,
            unseenMessages,
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all messages for selected user
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId }
            ]
        });

        await Message.updateMany(
            { senderId: selectedUserId, receiverId: myId },
            { seen: true }
        );

        res.json({ success: true, messages });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Mark messages as seen
export const markMessagesAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { seen: true });
        res.json({ success: true, message: "Messages marked as seen" });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;   // ✅ FIXED
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        await newMessage.save();  // ✅ ensure DB persistence

        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json({ success: true, message: "Message sent", newMessage });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};


// import Message from "../models/Message.js";
// import User from "../models/User.js";
// import cloudinary from "../lib/cloudinary.js";
// import { io, userSocketMap } from "../server.js";

// // Get all users except the logged in user
// export const getUserForSidebar = async (req, res) => {
//     try {
//         const userId = req.user._id;

//         // Get all users except the logged-in user
//         const filterUsers = await User.find({ _id: { $ne: userId } }).select("-password");

//         // count number of messages not seen
//         const unseenMessages = {};
//         // For each user, count unseen messages
//         const promises = filterUsers.map(async (user) => {
//             const messages = await Message.find({
//                 senderId: user._id,
//                 receiverId: userId,
//                 seen: false,
//             });

//             if (messages.length > 0) {
//                 unseenMessages[user._id] = messages.length;
//             }
//         });

//         await Promise.all(promises);
//         res.status(200).json({
//             success: true,
//             users: filterUsers,
//             unseenMessages,
//         });
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

// // Get all messages for selected user
// export const getMessages = async (req, res) => {
//     try {
//         const { id: selectedUserId } = req.params;
//         const myId = req.user._id;

//         const messages = await Message.find({
//             $or: [
//                 { senderId: myId, receiverId: selectedUserId },
//                 { senderId: selectedUserId, receiverId: myId }
//             ]
//         });

//         await Message.updateMany(
//             { senderId: selectedUserId, receiverId: myId },
//             { seen: true }
//         );

//         res.json({ success: true, messages });
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

// // api to mark messages as seen using message id
// export const markMessagesAsSeen = async (req, res) => {
//     try {
//         const { id } = req.params; 
//         await Message.findByIdAndUpdate(id, {seen: true});
//         res.json({ success: true, message: "Messages marked as seen" });
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).json({ success: false, message: error.message });
//     }   
// };

// // send message to selected user
// export const sendMessage = async (req, res) => {
//     try {
//         const { text, image } = req.body;
//         const receiverId = req.params;
//         const senderId = req.user._id;

//         let imageUrl;
//         if (image) {
//             const uploadResponse = await cloudinary.uploader.upload(image);
//             imageUrl = uploadResponse.secure_url;
//         }     
//         const newMessage = new Message({
//             senderId,
//             receiverId,
//             text,
//             image: imageUrl,
//         });

//         // Emit the new message to the receiver if they are online through socket
//         const receiverSocketId = userSocketMap[receiverId];
//         if (receiverSocketId) {
//             io.to(receiverSocketId).emit("newMessage", newMessage);
//         }
        
//         res.json({success: true, message: "Message sent", newMessage});
//         // await newMessage.save();
//         // res.status(201).json({ success: true, message: "Message sent", newMessage });
//     }       
//     catch (error) { 
//         console.log(error.message);
//         res.status(500).json({ success: false, message: error.message });
//     }
// };