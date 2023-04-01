export function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (_e) => resolve(reader.result);
        reader.onerror = (_e) => reject(reader.error);
        reader.onabort = (_e) => reject(new Error("Read aborted"));
        reader.readAsDataURL(blob);
    });
}

export function dataURLtoFile(dataurl, filename) {
    let arr = dataurl.split(","),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}