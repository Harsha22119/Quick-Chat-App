import React, { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { toast } from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const { socket, axios } = useContext(AuthContext);

    // Function to get all users for sidebar
    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    // Function to get messages for selected user
    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages);
                // ✅ reset unseen count for this user
                setUnseenMessages((prev) => ({ ...prev, [userId]: 0 }))
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Function to send message to selected user
    const sendMessage = async (messageData) => {
        if (!selectedUser) {
            toast.error("No user selected");
            return;
        }

        try {
            const { data } = await axios.post(
                `/api/messages/send/${selectedUser._id}`,  // ✅ matches backend
                messageData
            );

            if (data.success) {
                setMessages((prevMessages) => [...prevMessages, data.newMessage]);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Function to subscribe to messages for selected user
    const subscribeToMessages = async () => {
        if (!socket) return;

        socket.on("newMessage", async (newMessage) => {
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                newMessage.seen = true;
                setMessages((prevMessages) => [...prevMessages, newMessage]);

                try {
                    await axios.put(`/api/messages/mark/${newMessage._id}`);
                } catch (error) {
                    console.error("Error marking message as seen:", error.message);
                }
            } else {
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages,
                    [newMessage.senderId]: prevUnseenMessages[newMessage.senderId]
                        ? prevUnseenMessages[newMessage.senderId] + 1
                        : 1,
                }));
            }
        });
    };

    // Function to unsubscribe from messages
    const unsubscribeFromMessage = () => {
        if (socket) socket.off("newMessage");
    };

    useEffect(() => {
        subscribeToMessages();
        return () => unsubscribeFromMessage();
    }, [socket, selectedUser]);

    const value = {
        messages,
        users,
        selectedUser,
        getUsers,
        getMessages,
        setMessages,
        sendMessage,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};

// import { createContext, useState, useEffect, useContext } from "react";
// import { AuthContext } from "./AuthContext";

// export const ChatContext = createContext();

// export const ChatProvider = ({ children }) => {

//     const [messages, setMessages] = useState([]);
//     const [users, setUsers] = useState([]);
//     const [selectedUser, setSelectedUser] = useState([]);
//     const [unseenMessages, setUnseenMessages] = useState([]);

//     const { socket, axios } = useContext(AuthContext);

//     // Function to get all users for sidebar
//     const getUser = async () => {
//         try {
//             const { data } = await axios.get("/api/messages/users");
//             if (data.success) {
//                 setUsers(data.users);
//                 setUnseenMessages(data.unseenMessages);
//             }
//         }
//         catch (error) {
//             console.log(error);
//             toast.error(error.message)
//         }
//     }

//     // Function to get messages for selected user
//     const getMessages = async (useId) => {
//         try {
//             const { data } = await axios.get(`/api/messages/${userId}`);
//             if (data.success) {
//                 setMessages(data.messages)
//             }
//         }
//         catch (error) {
//             toast.error(error.message);
//         }
//     }

//     // Function to send message to selected user
//     // function to send message to selected user
//     const sendMessage = async (messageData) => {
//         try {
//             const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);

//             if (data.success) {
//                 setMessages((prevMessages) => [...prevMessages, data.newMessage]);
//             } else {
//                 toast.error(data.message);
//             }
//         } catch (error) {
//             toast.error(error.message);
//         }
//     };

//     // Function to subscribe to messages for selected user
//     const subscribeToMessages = async () => {
//         if (!socket) return;

//         socket.on("newMessage", async (newMessage) => {
//             if (selectedUser && newMessage.senderId === selectedUser._id) {
//                 newMessage.seen = true;
//                 setMessages((prevMessages) => [...prevMessages, newMessage]);

//                 try {
//                     await axios.put(`/api/messages/mark/${newMessage._id}`);
//                 } catch (error) {
//                     console.error("Error marking message as seen:", error.message);
//                 }
//             } else {
//                 setUnseenMessages(() => ({
//                     ...prevUnseenMessages, [newMessage.senderId]:
//                         prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages
//                         [newMessage.senderId] + 1 : 1
//                 }))
//             }
//         });
//     };

//     // Function to unsubscribe from messages
//     const unsubscribeFromMessage = () => {
//         if (socket) socket.off("newMessage");
//     }

//     useEffect(() => {
//         subscribeToMessages();
//         return () => unsubscribeFromMessage();
//     }, [socket, selectedUser])

//     const value = { messages, users, selectedUser, getUsers, setMessages, sendMessage, setSelectedUser, unseenMessages, setUnseenMessages}

//     return (
//         <ChatContext.provider value={value}>
//             {children}
//         </ChatContext.provider>
//     )
// }