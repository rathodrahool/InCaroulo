// Global Variables
let slides = [
    {
        title: '',
        subtitle: '',
        description: '',
        image: null,
        showTitle: true,
        showSubtitle: true,
        showDescription: true,
        showImage: true,
    },
]; // Array with initial slide
let selectedSlideIndex = 0; // Default to the first slide

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addSlideButton').addEventListener('click', addSlide);

    // Initialize Quill editor for description
    window.quill = new Quill('#descriptionEditor', {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                [{ align: [] }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                [{ script: 'sub' }, { script: 'super' }],
                [{ color: [] }, { background: [] }],
                [{ font: [] }],
                [{ size: ['small', false, 'large', 'huge'] }],
                [{ header: [1, 2, 3, 4, 5, 6, false] }],
                ['blockquote', 'code-block'],
                ['clean'],
            ],
        },
    });

    // Set up event listeners for real-time editing and section toggles
    setupRealTimeListeners();
    setupSectionToggles();

    // Automatically select the first slide on load
    selectSlide(0);

    // Initial render with one default slide
    renderSlides();
});

// Function to add a new slide
function addSlide() {
    const newSlide = {
        title: '',
        subtitle: '',
        description: '',
        image: null,
        showTitle: true,
        showSubtitle: true,
        showDescription: true,
        showImage: true,
    };
    slides.push(newSlide);
    renderSlides();
}

// Function to render slides in the UI
function renderSlides() {
    const slidesContainer = document.querySelector('.carousel-slides');
    slidesContainer.innerHTML = ''; // Clear existing slides

    slides.forEach((slide, index) => {
        const slideElement = createSlideElement(slide, index);
        slidesContainer.appendChild(slideElement);
    });

    const addSlideButton = createAddSlideButton();
    slidesContainer.appendChild(addSlideButton);
}

// Function to create a slide element with all content
function createSlideElement(slide, index) {
    const slideDiv = document.createElement('div');
    slideDiv.className =
        'slide bg-gray-200 w-64 h-80 rounded-lg shadow-md flex-shrink-0 relative flex flex-col items-center justify-center hover:shadow-lg transition duration-300 p-4';

    // Title
    if (slide.showTitle) {
        const title = document.createElement('h3');
        title.className = 'text-gray-800 font-semibold';
        title.textContent = slide.title || `Slide ${index + 1}`;
        slideDiv.appendChild(title);
    }

    // Subtitle
    if (slide.showSubtitle) {
        const subtitle = document.createElement('h4');
        subtitle.className = 'text-gray-600';
        subtitle.textContent = slide.subtitle || '';
        slideDiv.appendChild(subtitle);
    }

    // Description
    if (slide.showDescription) {
        const description = document.createElement('div');
        description.className = 'text-gray-500 mt-2';
        description.innerHTML = slide.description || 'No description available';
        slideDiv.appendChild(description);
    }

    // Image
    if (slide.showImage && slide.image) {
        const img = document.createElement('img');
        img.src = slide.image;
        img.alt = 'Slide Image';
        img.className = 'w-full h-32 object-cover mt-2';
        slideDiv.appendChild(img);
    }

    // Create delete button
    const deleteButton = createDeleteButton(index);
    slideDiv.appendChild(deleteButton);

    // Add click event to select the slide
    slideDiv.addEventListener('click', () => selectSlide(index));

    return slideDiv;
}

// Function to create the add slide button
function createAddSlideButton() {
    const addSlideButton = document.createElement('div');
    addSlideButton.id = 'addSlideButton';
    addSlideButton.className =
        'w-64 h-80 flex-shrink-0 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500 transition duration-300';
    addSlideButton.innerHTML = `<button class='text-gray-500 hover:text-gray-700'>+ Add Slide</button>`;
    addSlideButton.addEventListener('click', addSlide);
    return addSlideButton;
}

// Function to create a delete button
function createDeleteButton(index) {
    const deleteButton = document.createElement('button');
    deleteButton.className = 'absolute top-2 right-2 text-red-500 hover:text-red-700 focus:outline-none';
    deleteButton.innerHTML = '✕';
    deleteButton.title = 'Delete Slide';

    if (slides.length === 1) deleteButton.disabled = true;

    deleteButton.addEventListener('click', (event) => {
        event.stopPropagation();
        deleteSlide(index);
    });

    return deleteButton;
}

// Function to delete a slide
function deleteSlide(index) {
    if (slides.length > 1) {
        slides.splice(index, 1);
        renderSlides();
    } else {
        alert('At least one slide must remain.');
    }
}

// Function to select a slide for editing
function selectSlide(index) {
    if (selectedSlideIndex !== null) {
        saveSlideChanges(); // Save changes of the previously selected slide
    }
    selectedSlideIndex = index;
    const slide = slides[selectedSlideIndex];

    // Populate input fields with selected slide data
    document.querySelector('#titleSection input').value = slide.title;
    document.querySelector('#subtitleSection input').value = slide.subtitle;
    window.quill.root.innerHTML = slide.description;

    // Populate toggle settings
    document.getElementById('enableTitle').checked = slide.showTitle;
    document.getElementById('enableSubtitle').checked = slide.showSubtitle;
    document.getElementById('enableDescription').checked = slide.showDescription;
    document.getElementById('enableImage').checked = slide.showImage;

    // Toggle visibility of sections
    updateSectionVisibility(slide);
}

// Save changes from the editor to the selected slide
function saveSlideChanges() {
    if (selectedSlideIndex !== null) {
        const slide = slides[selectedSlideIndex];
        slide.title = document.querySelector('#titleSection input').value;
        slide.subtitle = document.querySelector('#subtitleSection input').value;
        slide.description = window.quill.root.innerHTML;

        renderSlides(); // Refresh slides in the UI
    }
}

// Setup real-time editing listeners
function setupRealTimeListeners() {
    document.querySelector('#titleSection input').addEventListener('input', () => updateSlideField('title'));
    document.querySelector('#subtitleSection input').addEventListener('input', () => updateSlideField('subtitle'));
    window.quill.on('text-change', () => updateSlideField('description'));
}

// Function to update slide field in real-time
function updateSlideField(field) {
    if (selectedSlideIndex !== null) {
        const slide = slides[selectedSlideIndex];
        if (field === 'title') {
            slide.title = document.querySelector('#titleSection input').value;
        } else if (field === 'subtitle') {
            slide.subtitle = document.querySelector('#subtitleSection input').value;
        } else if (field === 'description') {
            slide.description = window.quill.root.innerHTML;
        }
        renderSlides();
    }
}

// Setup toggle visibility listeners for each section
function setupSectionToggles() {
    document.getElementById('enableTitle').addEventListener('change', function () {
        if (selectedSlideIndex !== null) {
            slides[selectedSlideIndex].showTitle = this.checked;
            updateSectionVisibility(slides[selectedSlideIndex]);
            renderSlides();
        }
    });
    document.getElementById('enableSubtitle').addEventListener('change', function () {
        if (selectedSlideIndex !== null) {
            slides[selectedSlideIndex].showSubtitle = this.checked;
            updateSectionVisibility(slides[selectedSlideIndex]);
            renderSlides();
        }
    });
    document.getElementById('enableDescription').addEventListener('change', function () {
        if (selectedSlideIndex !== null) {
            slides[selectedSlideIndex].showDescription = this.checked;
            updateSectionVisibility(slides[selectedSlideIndex]);
            renderSlides();
        }
    });
    document.getElementById('enableImage').addEventListener('change', function () {
        if (selectedSlideIndex !== null) {
            slides[selectedSlideIndex].showImage = this.checked;
            updateSectionVisibility(slides[selectedSlideIndex]);
            renderSlides();
        }
    });
}

// Update section visibility based on the slide's settings
function updateSectionVisibility(slide) {
    document.getElementById('titleSection').style.display = slide.showTitle ? 'block' : 'none';
    document.getElementById('subtitleSection').style.display = slide.showSubtitle ? 'block' : 'none';
    document.getElementById('descriptionSection').style.display = slide.showDescription ? 'block' : 'none';
    document.getElementById('imageSection').style.display = slide.showImage ? 'block' : 'none';
}

// Function to handle image uploads
function handleImageUpload(event) {
    if (selectedSlideIndex !== null) {
        const slide = slides[selectedSlideIndex];
        const file = event.target.files[0];

        if (file) {
            const imageUrl = URL.createObjectURL(file);
            slide.image = imageUrl; // Store image URL in the slide object
            renderSlides(); // Refresh slides to show new image
        }
    }
}

// In the Initialization block, set up the image input listener
document.getElementById('imageUploadInput').addEventListener('change', handleImageUpload);
