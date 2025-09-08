import Cropper from "react-easy-crop";
import { useState, useCallback } from "react";
import './CropperModal.css';

const aspectRatios = [
    { value: 9 / 16, label: "9:16" },
    { value: 16 / 9, label: "16:9" },
    { value: 3 / 4, label: "3:4" },
    { value: 4 / 3, label: "4:3" },
    { value: 1 / 1, label: "1:1" },
];

export default function CropperModal({ image, originalFileName, onClose, onSave }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [closing, setClosing] = useState(false);
    const [cropSize, setCropSize] = useState({ width: 180, height: 320 });
    const [aspect, setAspect] = useState(9 / 16);
    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleAspectChange = (newAspect) => {
        setAspect(newAspect);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCropSize(prevSize => ({
            width: prevSize.width,
            height: Math.round(prevSize.width / newAspect),
        }));
    };

    async function getCroppedImg(imageSrc, pixelCrop) {
        const image = await createImage(imageSrc);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                const fileName = originalFileName || "avatar.jpg";
                const file = new File([blob], fileName, { type: "image/jpeg" });
                resolve({ file, url: URL.createObjectURL(file) });
            }, "image/jpeg");
        });
    }

    function createImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.addEventListener("load", () => resolve(img));
            img.addEventListener("error", (error) => reject(error));
            img.setAttribute("crossOrigin", "anonymous");
            img.src = url;
        });
    }

    async function handleSave() {
        const cropped = await getCroppedImg(image, croppedAreaPixels);
        onSave(cropped);
    }

    function handleClose() {
        setClosing(true);
        setTimeout(() => {
            onClose();
            setClosing(false);
        }, 500);
    }

    return (
        <div
            className={`modal-overlay animate__animated ${closing ? "animate__fadeOut" : "animate__fadeIn"}`}
            onClick={handleClose}
        >
            <div
                className={`modal animate__animated ${closing ? "animate__zoomOut" : "animate__zoomIn"}`}
                onClick={(e) => e.stopPropagation()}
            >
                <h3>Cắt ảnh</h3>
                <div className="crop-container" style={{ position: "relative", width: "100%", height: 400 }}>
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        cropSize={cropSize}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>

                <div className="aspect-ratio-selector">
                    <div className="aspect-buttons">
                        {aspectRatios.map((ratio) => (
                            <button
                                key={ratio.label}
                                className={`aspect-btn ${aspect === ratio.value ? 'active' : ''}`}
                                onClick={() => handleAspectChange(ratio.value)}
                            >
                                {ratio.label}
                            </button>
                        ))}
                    </div>
                </div>

                <label>Zoom </label>
                <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                />

                <br></br>
                <label>Khung cắt </label>
                <input
                    type="range"
                    min={100}
                    max={300}
                    step={10}
                    value={cropSize.width}
                    onChange={(e) => {
                        const newWidth = Number(e.target.value);
                        setCropSize({
                            width: newWidth,
                            height: Math.round(newWidth / aspect),
                        });
                    }}
                />

                <div className="modal-actions">
                    <button onClick={handleClose}>Hủy</button>
                    <button onClick={handleSave}>Lưu</button>
                </div>
            </div>
        </div>
    );
}