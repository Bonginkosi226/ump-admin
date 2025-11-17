import React, { useState } from "react";
import { campusUploadFormData } from "../services/campusApi";

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setImageUrl(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return setError('Please select a file first');

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const data = await campusUploadFormData('/upload-image', formData);
      setImageUrl(data.url);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Upload an Image</h1>

      <input type="file" onChange={handleFileChange} accept="image/*" />
      <button onClick={handleUpload} disabled={uploading} style={{ marginLeft: "1rem" }}>
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {imageUrl && (
        <div style={{ marginTop: "1rem" }}>
          <p>Uploaded Image URL:</p>
          <a href={imageUrl} target="_blank" rel="noreferrer">{imageUrl}</a>
          <img src={imageUrl} alt="Uploaded" style={{ display: "block", marginTop: "10px", maxWidth: "300px" }} />
        </div>
      )}
    </div>
  );
};

export default UploadPage;
