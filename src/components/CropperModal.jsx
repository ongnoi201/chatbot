import Cropper from "react-easy-crop";
import { useState, useCallback } from "react";

export default function CropperModal({ image, originalFileName, onClose, onSave }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

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

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>Cắt ảnh</h3>
                <div className="crop-container" style={{ position: "relative", width: "100%", height: 400 }}>
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={9 / 16}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>

                <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(e.target.value)}
                />

                <div className="modal-actions">
                    <button onClick={onClose}>Hủy</button>
                    <button onClick={handleSave}>Lưu</button>
                </div>
            </div>
        </div>
    );
}
