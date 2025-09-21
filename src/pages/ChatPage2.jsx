import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import SockJS from "sockjs-client";
import { over } from "stompjs";
import SearchBar from "../components/other/SearchBar";
import axios from "axios";
import { BASE_API_URL } from "../constants";

let stompClient = null;

const ChatPage2 = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const connected = useRef(false);
  const chatContainerRef = useRef(null);

  // Initialize state
  const [username] = useState(localStorage.getItem("chat-username"));
  const [selectedUser, setSelectedUser] = useState(
    JSON.parse(localStorage.getItem("selectedUser")) || location.state?.selectedUser || null
  );
  const [receiver, setReceiver] = useState(
    localStorage.getItem("selectedUserEmail") || location.state?.selectedUser?.email || ""
  );
  const [tab, setTab] = useState(
    localStorage.getItem("selectedUserEmail") || location.state?.selectedUser?.email || ""
  );
  const [message, setMessage] = useState("");
  const [privateChats, setPrivateChats] = useState(new Map());
  const [chatUsers, setChatUsers] = useState(new Map());

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [privateChats, tab]);

  // Restore state and connect
  useEffect(() => {
    console.log("Initial state:", { selectedUser, receiver, tab });
    const savedUser = JSON.parse(localStorage.getItem("selectedUser"));
    const savedEmail = localStorage.getItem("selectedUserEmail");
    if (savedUser && savedEmail && !location.state?.selectedUser) {
      console.log("Restoring from localStorage:", { savedUser, savedEmail });
      setSelectedUser(savedUser);
      setReceiver(savedEmail);
      setTab(savedEmail);
      if (username) {
        fetchChatHistory(username, savedEmail);
      }
    }

    if (!connected.current) {
      connect();
    }

    return () => {
      if (stompClient) {
        stompClient.disconnect();
        connected.current = false;
      }
    };
  }, []);

  useEffect(() => {
    if (location.state?.selectedUser) {
      const user = location.state.selectedUser;
      if (!user.email) {
        console.error("Selected user has no email:", user);
        return;
      }

      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No authentication token found");
        navigate("/login");
        return;
      }

      console.log("New selectedUser from location:", user);
      localStorage.setItem("selectedUser", JSON.stringify(user));
      localStorage.setItem("selectedUserEmail", user.email);
      handlePrivateMessage(user);
    }
  }, [location.state?.selectedUser]);

  const handlePrivateMessage = (user) => {
    if (!user || !user.email) {
      console.error("Invalid user data:", user);
      return;
    }

    console.log("Handling private message for user:", user);
    setSelectedUser(user);
    setReceiver(user.email);
    setTab(user.email);

    localStorage.setItem("selectedUser", JSON.stringify(user));
    localStorage.setItem("selectedUserEmail", user.email);

    setChatUsers((prev) => {
      const newMap = new Map(prev);
      newMap.set(user.email, user);
      return newMap;
    });

    if (!privateChats.has(user.email)) {
      privateChats.set(user.email, []);
      setPrivateChats(new Map(privateChats));
      if (username) {
        fetchChatHistory(username, user.email);
      }
    }
  };

  const onPrivateMessage = (payload) => {
    const payloadData = JSON.parse(payload.body);
    console.log("Private message received:", payloadData);

    if (payloadData.status === "MESSAGE") {
      const chatKey =
        payloadData.senderName === username ? payloadData.receiverName : payloadData.senderName;
      if (!privateChats.has(chatKey)) {
        privateChats.set(chatKey, []);
      }
      const messages = privateChats.get(chatKey);
      messages.push(payloadData);
      privateChats.set(chatKey, messages);
      setPrivateChats(new Map(privateChats));
    }
  };

  const onConnect = () => {
    connected.current = true;
    console.log("WebSocket connected for user:", username);
    stompClient.subscribe(`/user/${username}/private`, onPrivateMessage);
  };

  const onError = (err) => {
    console.error("WebSocket connection error:", err);
  };

  const connect = () => {
    let sock = new SockJS(`${BASE_API_URL}/ws`);
    stompClient = over(sock);
    stompClient.connect({}, onConnect, onError);
  };

  const generateConversationId = (user1Id, user2Id) => {
    const sortedIds = [user1Id, user2Id].sort();
    return `conv_${sortedIds.join("_")}`;
  };

  const sendPrivate = async () => {
    if (message.trim().length > 0 && receiver && selectedUser) {
      const senderId = localStorage.getItem("userId");
      const chatMessage = {
        senderName: username,
        senderId: senderId,
        receiverName: selectedUser.email,
        message: message,
        status: "MESSAGE",
        type: "PRIVATE",
        receiverId: selectedUser.id,
        conversationId: generateConversationId(senderId, selectedUser.id),
      };
      console.log("Sending private message:", chatMessage);
      if (!privateChats.has(receiver)) {
        privateChats.set(receiver, []);
      }
      privateChats.get(receiver).push(chatMessage);
      setPrivateChats(new Map(privateChats));
      stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
      setMessage("");
    }
  };

  const fetchChatHistory = async (user1, user2) => {
    if (!user1 || !user2) {
      console.error("Invalid users for chat history:", user1, user2);
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No authentication token found");
        navigate("/login");
        return;
      }

      console.log("Fetching chat history for:", user1, user2);
      const response = await axios.get(
        `${BASE_API_URL}/messages/api/messages/history/${user1}/${user2}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Chat history response:", response.data);
      if (response.status === 200) {
        setPrivateChats((prevChats) => {
          prevChats.set(
            user2,
            response.data.filter((msg) => msg.status === "MESSAGE")
          );
          console.log("Updated privateChats:", prevChats);
          return new Map(prevChats);
        });
      }
    } catch (error) {
      console.error("Error fetching chat history:", error.response || error);
      if (error.response?.status === 401) {
        localStorage.removeItem("authToken");
        navigate("/login");
      }
    }
  };

  return (
    <div className="w-full h-full pt-[20px] pb-[100px] gap-4">
      <div className=" grid grid-cols-12 w-full h-full pt-[15px] pb-[100px]">
        {/* Member List */}
        <div className=" col-span-3 bg-base-100 border border-base-300 pl-4 mt-3 mr-5  ">
          <div className="mb-4 border-r border-base-300 ">
            <h3 className="text-lg font-semibold mb-2">Danh sách chat</h3>
            <span className="font-medium hidden lg:block">
              {" "}
              <i className="fa-regular fa-user"></i> Liên Hệ
            </span>
          </div>

          <ul className="list-none space-y-2">
            {[...privateChats.keys()].map((email) => {
              const user = chatUsers.get(email);
              const lastMessage = privateChats.get(email)?.slice(-1)[0];

              return (
                <li
                  key={email}
                  onClick={() => {
                    const currentUser = chatUsers.get(email) || { email };
                    handlePrivateMessage(currentUser);
                  }}
                  className={`p-3 cursor-pointer rounded-lg transition-colors ${
                    tab === email ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                      <img
                        src={user?.avatarUrl || "https://randomuser.me/api/portraits/lego/1.jpg"}
                        alt={user?.fullName || email}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{user?.fullName || email}</div>
                      <div className="text-xs opacity-75 truncate">
                        {lastMessage?.message || "Chưa có tin nhắn"}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div
          className="col-span-6 border border-base-300 flex flex-col mt-3"
          // style={{ border: '1px solid black', paddingLeft: '15px' }}
        >
          {/* Chat header */}
          {tab && selectedUser && (
            <div className="px-4 py-3 border-b border-base-300 bg-base-100">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUser.avatarUrl || "https://randomuser.me/api/portraits/lego/1.jpg"}
                  alt={selectedUser.fullName}
                  className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium"
                />
              </div>
              <div>
                {/* <div className="font-medium">{selectedUser.fullName}</div> */}
                <h3 className="font-medium text-sm">{selectedUser.fullName}</h3>
                <div className="text-sm text-gray-600">
                  {selectedUser.job || "Chưa cập nhật nghề nghiệp"}
                </div>
              </div>
            </div>
          )}

          {/* Chat Box */}
          <div
            ref={chatContainerRef}
            className="col-span-6 p-4 space-y-4 min-h-[490px] max-h-[600px] overflow-y-auto bg-base-100"
          >
            {tab && privateChats.get(tab)?.length > 0 ? (
              privateChats.get(tab).map((msg, index) => (
                <div
                  className={`flex ${
                    msg.senderName !== username ? "justify-start" : "justify-end"
                  }`}
                  key={index}
                >
                  <div
                    className={`p-2 flex flex-col max-w-lg ${
                      msg.senderName !== username
                        ? "bg-white rounded-t-lg rounded-r-lg"
                        : "bg-blue-500 rounded-t-lg rounded-l-lg"
                    }`}
                  >
                    <div className={msg.senderName === username ? "text-white" : ""}>
                      {msg.message}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">Chưa có tin nhắn nào</p>
              </div>
            )}
          </div>

          {/* Message Box */}
          {tab && (
            <div
              style={{ width: "100%" }}
              className="p-4 border-t border-base-300 bg-base-100 flex justify-center"
            >
              <input
                className="input input-bordered flex-1 text-sm h-10 gap-2"
                style={{ width: "65%" }}
                type="text"
                placeholder="Message"
                value={message}
                onKeyUp={(e) => {
                  if (e.key === "Enter") {
                    sendPrivate();
                  }
                }}
                onChange={(e) => setMessage(e.target.value)}
              />
              <input
                type="button"
                className="btn btn-primary h-10 min-h-0"
                style={{ marginLeft: "2%" }}
                value="Send"
                onClick={sendPrivate}
              />
            </div>
          )}
        </div>
        <div className="col-span-3 pl-4 pt-3">
          <SearchBar onUserSelect={handlePrivateMessage} />
        </div>
      </div>
    </div>
  );
};

export default ChatPage2;
