/* script.js */

// Function to fetch the list of image filenames from the server
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

// Function to preload an image and get its dimensions
function preloadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();

        img.onload = () => {
            console.log(`Successfully preloaded image: ${src}`);
            resolve({
                src: src,
                width: img.naturalWidth,
                height: img.naturalHeight,
                aspectRatio: img.naturalWidth / img.naturalHeight
            });
        };

        img.onerror = (e) => {
            console.error(`Failed to preload image: ${src}`, e);
            resolve(null); // Continue with other images
        };

        img.src = src;
    });
}

// Function to create a placeholder element
function createPlaceholder(aspectRatio, img) {
    const placeholder = document.createElement('div');
    placeholder.classList.add('image-placeholder');
    placeholder.style.position = 'relative';
    placeholder.style.width = '100%';
    placeholder.style.overflow = 'hidden';
    placeholder.style.paddingTop = `${(1 / aspectRatio) * 100}%`; // Maintain aspect ratio

    // Style the img to fit inside the placeholder
    img.style.position = 'absolute';
    img.style.top = '0';
    img.style.left = '0';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';

    // Initially hide the image
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.5s ease-in-out';

    // Append img to the placeholder
    placeholder.appendChild(img);

    return placeholder;
}

// Initialize Intersection Observer for lazy loading images
const observerOptions = {
    root: null,
    rootMargin: '0px 0px 300px 0px', // Load images 300px before they enter the viewport
    threshold: 0.01
};

const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src; // Start loading the image
            observer.unobserve(img); // Stop observing once the image has started loading
        }
    });
}, observerOptions);

// Function to display gallery images
async function displayGalleryImages() {
    console.log("Starting to display gallery images...");

    const images = await fetchImageList();
    const leftColumn = document.getElementById('left-column');
    const rightColumn = document.getElementById('right-column');

    let leftHeight = 0;
    let rightHeight = 0;

    console.log("Preloading images...");
    const preloadedImages = await Promise.all(images.map(src => preloadImage(src)));

    console.log("Appending images to the gallery...");
    preloadedImages.forEach((imageData, index) => {
        if (imageData) {
            const { src, width, height, aspectRatio } = imageData;
            const img = document.createElement('img');
            img.dataset.src = src; // Use data-src for lazy loading
            img.alt = `Image ${index + 1}`;
            img.width = width;
            img.height = height;
            img.classList.add('gallery-image');

            // Create a placeholder and append img to it
            const placeholder = createPlaceholder(aspectRatio, img);

            // Choose which column to append to
            const column = leftHeight <= rightHeight ? leftColumn : rightColumn;

            // Append placeholder (which contains img) to the column
            column.appendChild(placeholder);

            // Observe the image for lazy loading
            imageObserver.observe(img);

            // When image loads, show it
            img.onload = () => {
                img.style.opacity = '1'; // Fade in the image
                console.log(`Image loaded and displayed: ${src}`);
            };

            // Update the column height
            const adjustedHeight = column.clientWidth / aspectRatio;
            if (column === leftColumn) {
                leftHeight += adjustedHeight;
            } else {
                rightHeight += adjustedHeight;
            }
        } else {
            console.error(`Image ${index + 1} failed to load and was not appended.`);
        }
    });

    console.log("Finished appending all images.");
}

displayGalleryImages();
