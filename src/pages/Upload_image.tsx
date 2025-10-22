import React, { useState } from "react";

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

/** 
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setImageUrl(null);
    setError(null);
  };
  */

  const handleUpload = async () => {
    if (!file) return setError('Please select a file first');

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("icon", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);

      const data = await res.json();
      setImageUrl(data.url);
    } catch (err) {
      console.error(err);
      //setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Upload an Image</h1>

      {/* <input type="file" onChange={handleFileChange} accept="image/*" /> */}
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
