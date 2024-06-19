'use client';
import validate from "@/helpers/validate";
import { useEffect, useState } from "react";
import IVehicleData from "../../../interfaces/IVehicleData";
import IErrorsVehicleForm from "../../../interfaces/IErrorsVehicleForm";
import axios from 'axios';
import { useRouter, useParams } from "next/navigation";
import SkeletonDashboard from "@/components/sketelons/SkeletonDashboard";
import Swal from "sweetalert2";


const UploadPost = ({ params }: { params: { id: string } }) => {
    const id = params.id; 
    const router = useRouter();
    const apiUrl = `${process.env.NEXT_PUBLIC_API_POSTS}/${id}`; 
    if (!apiUrl) {
      throw new Error('Environment variable NEXT_PUBLIC_API_POSTS is not set');
    }

    const [isOwner, setIsOwner] = useState<boolean>(false);
    const [token, setToken] = useState<string | null>(null);
    const [userSession, setUserSession] = useState<string | null>(null);
    const [errors, setErrors] = useState<IErrorsVehicleForm>({});
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [vehicleData, setVehicleData] = useState<IVehicleData>({
        title: '',
        description: '',
        price: 0,
        color: '',
        model: '',
        file: null,
        brand: '',
        year: 0,
        mileage: '',
    });

    useEffect(() => {
        if (typeof window !== "undefined" && window.localStorage) {
            const userToken = localStorage.getItem('userSession');
            setToken(userToken);
            !userToken && router.push("/login");
        }
    }, []);

    // Cargar los datos del vehículo
    useEffect(() => {
        const fetchVehicleData = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(apiUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const vehicleProps = {
                    title: response.data.title,
                    description: response.data.description,
                    price: response.data.price,
                    color: response.data.car.color,
                    model: response.data.car.model,
                    file: response.data.image_url,
                    brand: response.data.car.brand,
                    year: response.data.car.year,
                    mileage: response.data.car.mileage
                }
                setVehicleData(vehicleProps);
                setIsLoading(false);

                if (response.data.ownerId === userSession) {
                    setIsOwner(true);
                }

            } catch (error) {
                console.error('Error al cargar los datos del vehículo:', error);
            }
        };

      fetchVehicleData();
        

    }, [router]);



    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, files } = e.target as HTMLInputElement;

        if (name === "file") {
            setVehicleData(prevData => ({
                ...prevData,
                [name]: files
            }));
        } else {
            setVehicleData(prevData => ({
                ...prevData,
                [name]: value
            }));
        }

        setErrors(prevErrors => ({
            ...prevErrors,
            [name]: value.trim() === '' ? 'Este campo es requerido' : ''
        }));
    };

    const hasErrors = (): boolean => {
        return  Object.values(vehicleData).some(value => value === '' || value == 0 || value === null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    
        // Validar los datos del vehículo
        const validationErrors = validate(vehicleData);
        setErrors(validationErrors);
    
        // Si no hay errores de validación, proceder con el envío
        if (Object.keys(validationErrors).length === 0) {
            const formData = new FormData();
            formData.append("title", vehicleData.title);
            formData.append("description", vehicleData.description);
            formData.append("price", vehicleData.price.toString());
            formData.append("color", vehicleData.color);
            formData.append("model", vehicleData.model);
            formData.append("brand", vehicleData.brand);
            formData.append("year", vehicleData.year.toString());
            formData.append("mileage", vehicleData.mileage);
    
            // Si hay archivos, adjuntarlos al formData
            if (vehicleData.file && vehicleData.file.length > 0) {
                for (let i = 0; i < vehicleData.file.length; i++) {
                    formData.append("file", vehicleData.file[i]);
                }
            }
            setIsLoading(true)
            try {

                // Enviar los datos al servidor
                const response = await axios.put(apiUrl, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
    
                console.log('Respuesta del servidor:', response);
                if (response.data) {
                    Swal.fire("Vehiculo actualizado correctamente!");
                    setIsLoading(false)
                    router.push("/");
                } else {
                    const errorMessage = response.data?.message || 'Respuesta del servidor no válida.';
                    Swal.fire({
                        title: "Error",
                        text: `${errorMessage}`
                      });
                    setIsLoading(false)
                }
            } catch (error) {
                console.error('Error al actualizar el vehículo:', error);
                setIsLoading(false)
                Swal.fire({
                    title: "Error",
                    text: "Hubo un error al intentar actualizar la publicación"
                  });
            }
        }
    };

        // if (!isOwner) {
        //     return <div>No tienes permiso para editar esta publicación.</div>;
        // }

        if (isLoading) {
            return <SkeletonDashboard />;
          }
        

    return (
        <div className="bg-gradient-to-bl from-[#222222] to-[#313139] font-sans text-white">
            <div className="flex flex-col gap-2 p-4 items-center">
                <h1 className="text-4xl font-semibold mt-6">¡Edita tu vehículo!</h1>
                <span className="text-xl">Ajusta los detalles necesarios.</span>
            </div>

            <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-8 flex-wrap bg-[#222222] rounded">
                <div className="block mb-4">
                    <label className=" text-slate-50">Título</label>
                    <input
                        name="title"
                        type="text"
                        value={vehicleData.title}
                        onChange={handleChange}
                        required
                        className="w-full px-3 mt-3 py-2 border rounded text-[#222222]"
                    />
                    {errors.title && <span className="text-red-500">{errors.title}</span>}
                </div>
                <div className="block mb-4">
                    <label className=" text-slate-50">Descripción</label>
                    <textarea
                        name='description'
                        value={vehicleData.description}
                        onChange={handleChange}
                        required
                        className="w-full px-3 mt-3 py-2 border rounded text-[#222222]"
                    />
                    {errors.description && <span className="text-red-500">{errors.description}</span>}
                </div>
                <div className="flex gap-8">
                    <div className="mb-4">
                        <label className="text-slate-50">Valor</label>
                        <input
                            name='price'
                            type="number"
                            value={vehicleData.price}
                            onChange={handleChange}
                            required
                            className="w-full px-3 mt-3 py-2 border rounded text-[#222222]"
                        />
                        {errors.price && <span className="text-red-500">{errors.price}</span>}
                    </div>
                    <div className="mb-4 w-1/2">
                        <label className="text-slate-50">Selecciona la marca</label>
                        <select
                            name='brand'
                            value={vehicleData.brand}
                            onChange={handleChange}
                            required
                            className="w-full px-3 mt-3 py-2 border rounded text-[#222222]"
                        >
                            <option value="" disabled>Selecciona la marca...</option>
                            <option value="Kia">Kia</option>
                            <option value="Chevrolet">Chevrolet</option>
                            <option value="Mazda">Mazda</option>
                            <option value="Ford">Ford</option>
                            <option value="Ferrari">Ferrari</option>
                        </select>
                        {errors.brand && <span className="text-red-500">{errors.brand}</span>}
                    </div>
                </div>
                <div className="flex gap-8">
                    <div className="mb-4 w-1/2">
                        <label className="text-slate-50">Selecciona el color</label>
                        <select
                            name='color'
                            value={vehicleData.color}
                            onChange={handleChange}
                            required
                            className="w-full px-3 mt-3 py-2 border rounded text-[#222222]"
                        >
                            <option value="" disabled>Selecciona el color...</option>
                            <option value="Azul">Azul</option>
                            <option value="Verde">Verde</option>
                            <option value="Negro">Negro</option>
                            <option value="Blanco">Blanco</option>
                            <option value="Rojo">Rojo</option>
                        </select>
                        {errors.color && <span className="text-red-500">{errors.color}</span>}
                    </div>

                    <div className="mb-4">
                        <label className="text-slate-50">Modelo</label>
                        <input
                            name='model'
                            type="text"
                            value={vehicleData.model}
                            onChange={handleChange}
                            required
                            className="w-full px-3 mt-3 py-2 border rounded text-[#222222]"
                        />
                        {errors.model && <span className="text-red-500">{errors.model}</span>}
                    </div>
                </div>
                <div className="flex gap-8">
                    <div className="mb-4 w-1/2">
                        <label className="text-slate-50">Año</label>
                        <input
                            name='year'
                            type="number"
                            value={vehicleData.year}
                            onChange={handleChange}
                            required
                            className="w-full px-3 mt-3 py-2 border rounded text-[#222222]"
                        />
                        {errors.year && <span className="text-red-500">{errors.year}</span>}
                    </div>
                    <div className="mb-4 w-1/2">
                        <label className="text-slate-50">Selecciona el kilometraje</label>
                        <select
                            name='mileage'
                            value={vehicleData.mileage}
                            onChange={handleChange}
                            required
                            className="w-full px-3 mt-3 py-2 border rounded text-[#222222]"
                        >
                            <option value="" disabled>Selecciona el kilometraje...</option>
                            <option value="Menos de 50.000km">Menos de 50.000km</option>
                            <option value="50.000km - 100-000km">50.000km - 100-000km</option>
                            <option value="100.000km - 150.000km">100.000km - 150.000km</option>
                            <option value="Más de 150.000km">Más de 150.000km</option>
                        </select>
                        {errors.mileage && <span className="text-red-500">{errors.mileage}</span>}
                    </div>
                </div>
                <div className="mb-4">
                    <label className="text-slate-50">Fotos</label>
                    <input
                        name='file'
                        type="file"
                        accept="image/*"
                        multiple
                        className="w-full px-3 mt-3 py-4 border rounded text-slate-50"
                        onChange={handleChange}
                        required
                    />
                    {errors.image && <span className="text-red-500">{errors.image}</span>}
                </div>
                <div className="flex justify-center">
                    <button type="submit" disabled={hasErrors()} className="mb-6 w-32 items-center bg-[#C4FF0D] text-[#222222] py-2 rounded disabled:bg-slate-300">
                        Actualizar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UploadPost;
