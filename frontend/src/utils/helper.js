const handleDownload = (fileUrl, fileName = "download") => {
    fetch(fileUrl)
        .then((response) => response.blob())
        .then((blob) => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName || fileUrl.split("/").pop(); // Use provided name or extract from URL
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        })
        .catch((error) => console.error("Download failed:", error));
};

export { handleDownload };