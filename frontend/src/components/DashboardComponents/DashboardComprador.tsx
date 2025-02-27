"use client";
import React, { useEffect, useState } from "react";
import StatCard from "./StatCard";
import ReservationCard from "./ReservationCard";
import PublicationCard from "./PublicationCard";
import { redirect, useRouter } from "next/navigation";
import { IUserData, Rental } from "@/interfaces/IUser";
import SkeletonDashboard from "../sketelons/SkeletonDashboard";
import Swal from "sweetalert2";

const apiUrl = process.env.NEXT_PUBLIC_API_DASHBOARD_USER;

const DashboardComprador: React.FC = () => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<IUserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPrice, SetTotalPrice] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const userSession = localStorage.getItem("userSession");
      if (userSession) {
        const parsedSession = JSON.parse(userSession);
        setUserToken(parsedSession.token);
      } else {
        setLoading(false);
        Swal.fire({
          title: "Error de acceso",
          text: "Necesitas estar logueado para ingresar",
          icon: "error",
        });
        redirect("/login");
      }
    }
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiUrl}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Error fetching user data");
        }

        const data = await response.json();
        setUserData(data);
      } catch (error: any) {
        console.log(error);

        throw new Error(error);
      } finally {
        setLoading(false);
      }
    };

    if (userToken) {
      fetchData();
    }
  }, [userToken]);

  useEffect(() => {
    if (userData?.rentals) {
      const total = userData.rentals.reduce(
        (acc, element) => acc + Number(element.totalCost),
        0
      );
      SetTotalPrice(total);
    }
  }, [userData]);
  if (loading) {
    return <SkeletonDashboard />;
  }
  return (
    <>
      <div className="p-4 bg-[#313139]"></div>
      <div className="max-w-6xl mx-auto rounded-xl bg-[#313139]">
        {/* Sección de bienvenida */}
        <div className="bg-[#2d2d2d] rounded-lg shadow-md p-6 mb-2">
          <h1 className="text-3xl font-bold text-gray-200">
            Bienvenido,{" "}
            <span className="text-[#C4FF0D]">{userData?.name}!</span>
          </h1>
          <p className="text-gray-300 mt-2">
            Estamos encantados de tenerte de vuelta. Aquí tienes un resumen de
            tus actividades recientes.
          </p>
        </div>

        {/* Sección de reservas activas */}
        <div className="bg-[rgb(45,45,45)] rounded-lg shadow-md p-6 mb-2">
          <h2 className="text-2xl font-semibold text-[#C4FF0D]">
            Tus alquileres activos
          </h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userData?.rentals?.length !== 0 ? (
              userData?.rentals?.map((rent) => (
                <ReservationCard
                  key={rent?.id}
                  carModel={rent?.posts?.car?.model}
                  reservationDate={rent?.rentalStartDate}
                  reservationEndDate={rent?.rentalEndDate}
                  price={`$ ${rent?.totalCost}`}
                  imageUrl={rent?.posts?.car?.image_url[0]}
                  idPost={rent.posts.id}
                />
              ))
            ) : (
              <p className="text-gray-300 text-m">No hay reservas activas</p>
            )}
          </div>
        </div>

        {/* Sección de publicaciones recientes */}
        <div className="bg-[#2d2d2d] rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-[#C4FF0D]">
            Historial de alquileres
          </h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userData?.rentals?.length !== 0 ? (
              userData?.rentals?.map((rent) => (
                <PublicationCard
                  key={rent?.id}
                  carModel={rent?.posts?.car?.model}
                  postDate={rent?.rentalStartDate}
                  author={rent?.posts?.title}
                  imageUrl={rent?.posts?.car?.image_url[0]}
                />
              ))
            ) : (
              <p className="text-gray-300 text-m">
                No hay reservas disponibles
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="p-4 bg-[#313139]">
        {/* Sección de estadísticas */}
        <div className="max-w-6xl mx-auto bg-[#2d2d2d] rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-[#C4FF0D]">
            Estadísticas
          </h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Total de Reservas"
              value={String(userData?.rentals.length)}
              description="Número total de reservas realizadas."
            />
            <StatCard
              title="Gastos Totales"
              value={`$ ${totalPrice}`}
              description="Cantidad total gastada en reservas."
            />
            <StatCard
              title="Reseñas Recibidas"
              value={String(userData?.reviews.length)}
              description="Número total de reseñas recibidas."
            />
            {/* Agrega más StatCards según sea necesario */}
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardComprador;
