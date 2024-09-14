/* script.js */

async function fetchImageList() {
    try {
        console.log("Fetching image list from /api/images...");
        const response = await fetch('/api/images');
        const images = await response.json();
        console.log(`Received ${images.length} images from the API:`, images);
        return images.map(filename => '/images/' + encodeURIComponent(filename));
    } catch (error) {
        console.error('Error fetching image list:', error);
        return [];
    }
}

// Preload an image and return a promise that resolves when the image is loaded
function preloadImage(src) {
    console.log(`Preloading image: ${src}`);
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            console.log(`Successfully loaded image: ${src}`);
            resolve(img);
        };
        img.onerror = (e) => {
            console.error(`Failed to load image: ${src}`, e);
            resolve(null); // Resolve with null to continue with other images
        };

        // Log when events are set
        console.log(`Event listeners set for image: ${src}`);

        // Set the source after event handlers are attached
        img.src = src;
    });
}

// Display the gallery images after preloading them
async function displayGalleryImages() {
    console.log("Starting to display gallery images...");

    const images = await fetchImageList();
    const leftColumn = document.getElementById('left-column');
    const rightColumn = document.getElementById('right-column');

    let leftHeight = 0;
    let rightHeight = 0;

    console.log("Preloading images...");
    const loadedImages = await Promise.all(images.map(src => preloadImage(src)));

    console.log("Appending images to the gallery...");
    loadedImages.forEach((img, index) => {
        if (img) {
            const imgHeight = img.naturalHeight;
            const column = leftHeight <= rightHeight ? 'left' : 'right';
            console.log(`Appending image ${index + 1} to ${column} column`);
            console.log(`Image URL: ${img.src}`);

            if (leftHeight <= rightHeight) {
                leftColumn.appendChild(img);
                leftHeight += imgHeight;
            } else {
                rightColumn.appendChild(img);
                rightHeight += imgHeight;
            }
        } else {
            console.error(`Image ${index + 1} failed to load and was not appended.`);
        }
    });

    console.log("Finished appending all images.");
}

displayGalleryImages();
