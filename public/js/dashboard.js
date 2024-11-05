/* eslint-disable @typescript-eslint/no-unused-vars */

document.getElementById('enableTitle').addEventListener('change', function () {
    document.getElementById('titleSection').style.display = this.checked ? 'block' : 'none';
});

document.getElementById('enableSubtitle').addEventListener('change', function () {
    document.getElementById('subtitleSection').style.display = this.checked ? 'block' : 'none';
});

document.getElementById('enableDescription').addEventListener('change', function () {
    document.getElementById('descriptionSection').style.display = this.checked ? 'block' : 'none';
});

document.getElementById('enableImage').addEventListener('change', function () {
    document.getElementById('imageSection').style.display = this.checked ? 'block' : 'none';
});

// Initialize Quill editor
var quill = new Quill('#descriptionEditor', {
    theme: 'snow',
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ align: [] }], // Text alignment (left, center, right)
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ script: 'sub' }, { script: 'super' }], // Subscript and superscript
            [{ color: [] }, { background: [] }], // Text color and background color
            [{ font: [] }], // Font options
            [{ size: ['small', false, 'large', 'huge'] }], // Font sizes
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ['blockquote', 'code-block'], // Blockquote and code blocks
            ['clean'], // Clear formatting
        ],
    },
});
