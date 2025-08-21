import Cropper from "react-easy-crop";
import { useState, useCallback } from "react";

export default function CropperModal({ image, originalFileName, onClose, onSave }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [closing, setClosing] = useState(false);

    // 👇 state cho kích thước khung crop
    const [cropSize, setCropSize] = useState({ width: 180, height: 320 });

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

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
                        aspect={9 / 16}
                        cropSize={cropSize}   // 👈 cho resize
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>

                {/* Zoom ảnh */}
                <label>Zoom</label>
                <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                />

                {/* Resize khung crop */}
                <br></br>
                <label>Khung cắt</label>
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
                            height: Math.round(newWidth * 16 / 9), // 👈 giữ đúng tỉ lệ 9:16
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
