"use client"
import { redirect, useRouter } from "next/navigation";
import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import Swal from "sweetalert2";
import { io, Socket } from "socket.io-client";
import { IRentalChat, MessageChat } from "@/interfaces/Ichat";

const ChatWeb: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const [room_id, setRoom_id] = useState<string>("");
  const [userStatus, setUserStatus] = useState<string>("");
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [rentalsChats, setRentalsChat] = useState<IRentalChat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiUrl) {
    throw new Error('Environment variable NEXT_PUBLIC_API_GET_USERS_TOKEN is not set');
  }
 
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const userSession = localStorage.getItem("userSession");
      if (userSession) {
        const parsedSession = JSON.parse(userSession);
        setUserToken(parsedSession.token);  
      } else {
        setLoading(true)
        Swal.fire({
          title: "Error de acceso",
          text: "Necesitas estar logueado para ingresar",
          icon: "error"
        });
        redirect("/login")
      }
    }
  }, [router]);

  const recibeMensaje = (data: MessageChat) =>
    setMessages((state) => [...state, data]);
// Conexion continua con el back para mensajes instantaneos
  useEffect(() => {
    if (userToken) {
      const newSocket = io("http://localhost:80/chat", {
        transports: ["websocket"],
        auth: { token: userToken },
      });

      newSocket.on("connect", () => {
        setUserStatus("Conectado");
        console.log("Conectado");
      });

      newSocket.on("disconnect", () => {
        setUserStatus("Desconectado");
        console.log("Desconectado");
      });

      newSocket.on(room_id, recibeMensaje);

      setSocket(newSocket);

      return () => {
        newSocket.off(room_id, recibeMensaje);
        newSocket.close();
      };
    }
  }, [userToken, room_id]);
// fetch de los mensajes
  useEffect(() => {
    const fetchMessages = async () => {
      if (room_id) {
        try {
          const response = await fetch(`${apiUrl}/chat/${room_id}/messages`);
          if (!response.ok) {
            throw new Error("Error fetching messages");
          }
          console.log(response)
          const data: MessageChat[] = await response.json();
          console.log(data)
          // Ordenar mensajes por fecha de creación
          const sortedMessages = data.sort((a, b) => new Date(a.date_created || "").getTime() - new Date(b.date_created || "").getTime());
          setMessages(sortedMessages);
          console.log(sortedMessages)

        } catch (error) {
          console.error("Error al obtener los mensajes:", error);
          setError("Error al obtener los mensajes.");
        }
      }
    };

    if (room_id) {
      fetchMessages();
    }
  }, [room_id, apiUrl]);

  // Fetch para setear los Rooms id
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}/rentals/token`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Error fetching user data");
        }

        const data: IRentalChat[] = await response.json();
        setRentalsChat(data);
        if (data.length > 0) {
          setRoom_id(data[0].room_id);
        }
      } catch (error: any) {
        console.error(error);
        setError("Error al obtener los datos de alquileres.");
      } finally {
        setLoading(false);
      }
    };

    if (userToken) {
      fetchData();
    }
  }, [userToken, apiUrl]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const meMessage: MessageChat = {
      sender: "Me",
      receiver: "userReceiverState(?)",
      message,
      room_id,
      date_created: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, meMessage]);

    if (socket) {
      socket.emit("posts", meMessage);
    }

    setMessage("");
  };
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/4 bg-white border-r border-gray-300">
        {/* Sidebar Header */}
        <header className="p-4 border-b border-gray-300 flex justify-between items-center bg-indigo-600 text-white">
          <h1 className="text-2xl font-semibold">Chat Web</h1>
          <div className="relative">
            <button id="menuButton" className="focus:outline-none" onClick={toggleMenu}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-100" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path d="M2 10a2 2 0 012-2h12a2 2 0 012 2 2 2 0 01-2 2H4a2 2 0 01-2-2z" />
              </svg>
            </button>
            {/* Menu Dropdown */}
            {menuOpen && (
              <div id="menuDropdown" className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg">
                <ul className="py-2 px-3">
                  <li><a href="#" className="block px-4 py-2 text-gray-800 hover:text-gray-400">Opción 1</a></li>
                  <li><a href="#" className="block px-4 py-2 text-gray-800 hover:text-gray-400">Opción 2</a></li>
                  {/* Add more menu options here */}
                </ul>
              </div>
            )}
          </div>
        </header>

        {/* Contact List */}
        <div className="overflow-y-auto h-screen p-3 mb-9 pb-20">
          <Contact name="Alicia" message="¡Hurra!" avatarUrl="https://placehold.co/200x/ffa8e4/ffffff.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato" />
          <Contact name="Martín" message="¡Esa pizzería fue increíble! Deberíamos ir de nuevo alguna vez. 🍕" avatarUrl="https://placehold.co/200x/ad922e/ffffff.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato" />
          <Contact name="Carlos" message="Hola, ¿tienes alguna recomendación para una buena película?" avatarUrl="https://placehold.co/200x/2e83ad/ffffff.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato" />
          <Contact name="David" message="¡Acabo de terminar de leer un gran libro! Fue tan cautivador." avatarUrl="https://placehold.co/200x/c2ebff/0f0b14.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato" />
          <Contact name="Elena" message="¿Cuál es el plan para este fin de semana? ¿Algo divertido?" avatarUrl="https://placehold.co/200x/e7c2ff/7315d1.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato" />
          <Contact name="Fiona" message="Escuché que hay una nueva exposición en el museo de arte. ¿Te interesa?" avatarUrl="https://placehold.co/200x/ffc2e2/ffdbdb.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato" />
          <Contact name="Jorge" message="Probé ese nuevo café en el centro. ¡El café fue fantástico!" avatarUrl="https://placehold.co/200x/f83f3f/4f4f4f.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato" />
          <Contact name="Hannah" message="Estoy planeando un viaje de senderismo el próximo mes. ¿Quieres unirte?" avatarUrl="https://placehold.co/200x/dddddd/999999.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato" />
          <Contact name="Ian" message="Pongámonos al día pronto. ¡Ha pasado demasiado tiempo!" avatarUrl="https://placehold.co/200x/70ff33/501616.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato" />
          <Contact name="Juan" message="¿Recuerdas ese chiste tan gracioso que me contaste? ¡No puedo dejar de reír!" avatarUrl="https://placehold.co/200x/30916c/ffffff.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato" />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 h-screen">
        {/* Chat Header */}
        <header className="bg-white p-4 text-gray-700">
          <h1 className="text-2xl font-semibold">Alicia</h1>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 pb-36">
          <Message incoming={true} avatarUrl="https://placehold.co/200x/ffa8e4/ffffff.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato" text="Hola Bob, ¿cómo te va?" />
          <Message incoming={false} avatarUrl="https://placehold.co/200x/b7a8ff/ffffff.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato" text="¡Hola Alicia! Estoy bien, acabo de terminar un gran libro. ¿Y tú?" />
          <Message incoming={true} avatarUrl="https://placehold.co/200x/ffa8e4/ffffff.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato" text="¡Ese libro suena interesante! ¿De qué trata?" />
          <Message incoming={false} avatarUrl="https://placehold.co/200x/b7a8ff/ffffff.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato" text="Se trata de un astronauta varado en Marte, tratando de sobrevivir. ¡Muy emocionante!" />
          <Message incoming={true} avatarUrl="https://placehold.co/200x/ffa8e4/ffffff.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato" text="¡Estoy intrigada! ¿Puedo pedirte prestado el libro cuando termines?" />
          <Message incoming={false} avatarUrl="https://placehold.co/200x/b7a8ff/ffffff.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato" text="¡Por supuesto! Lo dejaré en tu casa mañana." />
          <Message incoming={true} avatarUrl="https://placehold.co/200x/ffa8e4/ffffff.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato" text="¡Gracias, eres el mejor!" />
          <Message incoming={false} avatarUrl="https://placehold.co/200x/b7a8ff/ffffff.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato" text="¡En cualquier momento! Déjame saber cómo te gusta. 😊" />
          <Message incoming={true} avatarUrl="https://placehold.co/200x/ffa8e4/ffffff.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato" text="Entonces, ¿pizza la próxima semana, verdad?" />
          <Message incoming={false} avatarUrl="https://placehold.co/200x/b7a8ff/ffffff.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato" text="¡Absolutamente! No puedo esperar para nuestra cita de pizza. 🍕" />
          <Message incoming={true} avatarUrl="https://placehold.co/200x/ffa8e4/ffffff.svg?text=ʕ•́ᴥ•̀ʔ&font=Lato" text="¡Hurra!" />
        </div>

        {/* Chat Input */}
        <footer className="bg-white border-t border-gray-300 p-4">
          <div className="flex items-center">
            <input type="text" placeholder="Escribe un mensaje..." className="w-full p-2 rounded-md border border-gray-400 focus:outline-none focus:border-blue-500" />
            <button className="bg-indigo-500 text-white px-4 py-2 rounded-md ml-2">Enviar</button>
          </div>
        </footer>
      </div>
    </div>
  );
};

const Contact: React.FC<{ name: string; message: string; avatarUrl: string }> = ({ name, message, avatarUrl }) => (
  <div className="flex items-center mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded-md">
    <div className="w-12 h-12 bg-gray-300 rounded-full mr-3">
      <img src={avatarUrl} alt={`${name} Avatar`} className="w-12 h-12 rounded-full" />
    </div>
    <div className="flex-1">
      <h2 className="text-lg font-semibold">{name}</h2>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

const Message: React.FC<{ incoming: boolean; avatarUrl: string; text: string }> = ({ incoming, avatarUrl, text }) => (
  <div className={`flex mb-4 cursor-pointer ${incoming ? '' : 'justify-end'}`}>
    {incoming && (
      <div className="w-9 h-9 rounded-full flex items-center justify-center mr-2">
        <img src={avatarUrl} alt="User Avatar" className="w-8 h-8 rounded-full" />
      </div>
    )}
    <div className={`flex max-w-96 ${incoming ? 'bg-white text-gray-700' : 'bg-indigo-500 text-white'} rounded-lg p-3 gap-3`}>
      <p>{text}</p>
    </div>
    {!incoming && (
      <div className="w-9 h-9 rounded-full flex items-center justify-center ml-2">
        <img src={avatarUrl} alt="My Avatar" className="w-8 h-8 rounded-full" />
      </div>
    )}
  </div>
);

export default ChatWeb;