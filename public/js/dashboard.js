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
let selectedSlideIndex = slides.length > 0 ? 0 : null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Load saved carousel data from localStorage if it exists
    const savedSlides = localStorage.getItem('carouselSlides');
    if (savedSlides) {
        slides = JSON.parse(savedSlides);
    }

    document.getElementById('addSlideButton').addEventListener('click', addSlide);

    // Initialize Quill editor for description
    window.quill = new Quill('#descriptionEditor', {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                [{ list: 'ordered' }, { list: 'bullet' }],
            ],
        },
    });

    // Set up event listeners for real-time editing and section toggles
    setupRealTimeListeners();
    setupSectionToggles();

    // Set up image upload listener
    document.querySelector('#imageSection input[type="file"]').addEventListener('change', handleImageUpload);

    // Automatically select the first slide on load
    selectSlide(0);

    // Initial render with the loaded or default slides
    renderSlides();
});

// Function to save carousel state to localStorage
function saveCarouselToLocalStorage() {
    localStorage.setItem('carouselSlides', JSON.stringify(slides));
}

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
    saveCarouselToLocalStorage(); // Save to localStorage
}

// Function to render slides in the UI
function renderSlides() {
    const slidesContainer = document.querySelector('.carousel-slides');
    slidesContainer.innerHTML = ''; // Clear existing slides

    slides.forEach((slide, index) => {
        const slideElement = createSlideElement(slide, index);

        if (index === selectedSlideIndex) {
            slideElement.classList.add('selected-slide');
        }

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
    slideDiv.addEventListener('click', () => {
        selectSlide(index); // Update selected slide
        renderSlides(); // Re-render to update UI
    });

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
    // Check if there is more than one slide
    if (slides.length > 1) {
        // Remove the slide from the array
        slides.splice(index, 1);

        // Update the selected slide index
        if (selectedSlideIndex === index) {
            // If the deleted slide was the last one, select the previous slide
            if (slides.length > 0) {
                selectedSlideIndex = Math.max(0, selectedSlideIndex - 1);
            }
        } else if (index < selectedSlideIndex) {
            // If the deleted slide is before the selected one, decrease the index
            selectedSlideIndex--;
        }

        // Re-render slides and update UI
        renderSlides();

        // Save the updated carousel state to local storage
        saveCarouselToLocalStorage();
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
        saveCarouselToLocalStorage(); // Save to localStorage
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
        saveCarouselToLocalStorage(); // Save to localStorage
    }
}

// Setup toggle visibility listeners for each section
function setupSectionToggles() {
    document.getElementById('enableTitle').addEventListener('change', function () {
        if (selectedSlideIndex !== null) {
            slides[selectedSlideIndex].showTitle = this.checked;
            updateSectionVisibility(slides[selectedSlideIndex]);
            renderSlides();
            saveCarouselToLocalStorage(); // Save to localStorage
        }
    });
    document.getElementById('enableSubtitle').addEventListener('change', function () {
        if (selectedSlideIndex !== null) {
            slides[selectedSlideIndex].showSubtitle = this.checked;
            updateSectionVisibility(slides[selectedSlideIndex]);
            renderSlides();
            saveCarouselToLocalStorage(); // Save to localStorage
        }
    });
    document.getElementById('enableDescription').addEventListener('change', function () {
        if (selectedSlideIndex !== null) {
            slides[selectedSlideIndex].showDescription = this.checked;
            updateSectionVisibility(slides[selectedSlideIndex]);
            renderSlides();
            saveCarouselToLocalStorage(); // Save to localStorage
        }
    });
    document.getElementById('enableImage').addEventListener('change', function () {
        if (selectedSlideIndex !== null) {
            slides[selectedSlideIndex].showImage = this.checked;
            updateSectionVisibility(slides[selectedSlideIndex]);
            renderSlides();
            saveCarouselToLocalStorage(); // Save to localStorage
        }
    });
}

// Update visibility of sections based on toggle settings
function updateSectionVisibility(slide) {
    document.getElementById('titleSection').style.display = slide.showTitle ? 'block' : 'none';
    document.getElementById('subtitleSection').style.display = slide.showSubtitle ? 'block' : 'none';
    document.getElementById('descriptionSection').style.display = slide.showDescription ? 'block' : 'none';
    document.getElementById('imageSection').style.display = slide.showImage ? 'block' : 'none';
}

// Handle image upload
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            if (selectedSlideIndex !== null) {
                slides[selectedSlideIndex].image = e.target.result; // Set the image URL for the selected slide
                renderSlides();
                saveCarouselToLocalStorage(); // Save to localStorage
            }
        };
        reader.readAsDataURL(file);
    }
}
