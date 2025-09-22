// Site Reporter App - Main JavaScript File
class SiteReporter {
    constructor() {
        this.currentReport = null;
        this.currentPhotoIndex = null;
        this.canvas = null;
        this.reports = this.loadReports();
        this.currentTool = 'select';
        this.currentColor = '#e0222a';
        this.currentBrushSize = 3;

        this.init();
    }

    init() {
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('report-date');
        if (dateInput) {
            dateInput.value = today;
        }

        // Initialize form handlers
        this.initFormHandlers();

        // Load existing reports
        this.loadViewReports();

        // Update brush size display
        const brushSizeInput = document.getElementById('brush-size-input');
        if (brushSizeInput) {
            brushSizeInput.addEventListener('input', () => {
                document.getElementById('brush-size-display').textContent = `${brushSizeInput.value}px`;
            });
        }
    }

    initFormHandlers() {
        const newReportForm = document.getElementById('new-report-form');
        if (newReportForm) {
            newReportForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createNewReport();
            });
        }
    }

    // Navigation Functions
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }

    showHomeScreen() {
        this.showScreen('home-screen');
    }

    showNewReportScreen() {
        this.showScreen('new-report-screen');
    }

    showViewReportsScreen() {
        this.loadViewReports();
        this.showScreen('view-reports-screen');
    }

    showHelpScreen() {
        this.showScreen('help-screen');
    }

    // Report Management
    createNewReport() {
        const name = document.getElementById('report-name').value;
        const projectName = document.getElementById('project-name').value;
        const date = document.getElementById('report-date').value;
        const location = document.getElementById('report-location').value;
        const description = document.getElementById('report-description').value;

        if (!name.trim()) {
            alert('Please enter a report name');
            return;
        }

        if (!projectName.trim()) {
            alert('Please enter a project name');
            return;
        }

        const report = {
            id: Date.now().toString(),
            name: name.trim(),
            projectName: projectName.trim(),
            date: date || new Date().toISOString().split('T')[0],
            location: location.trim(),
            description: description.trim(),
            photos: [],
            createdAt: new Date().toISOString()
        };

        this.currentReport = report;
        this.saveReport(report);
        this.showReportEditor();
    }

    showReportEditor() {
        if (!this.currentReport) return;

        // Update report title
        document.getElementById('current-report-title').textContent = this.currentReport.name;

        // Update report details
        const reportDetails = document.getElementById('report-details');
        reportDetails.innerHTML = `
            <div class="report-details">
                <div class="report-detail">
                    <strong>Report Name:</strong>
                    <span>${this.currentReport.name}</span>
                </div>
                <div class="report-detail">
                    <strong>Project Name:</strong>
                    <span>${this.currentReport.projectName || 'Not specified'}</span>
                </div>
                <div class="report-detail">
                    <strong>Date:</strong>
                    <span>${this.formatDate(this.currentReport.date)}</span>
                </div>
                <div class="report-detail">
                    <strong>Location:</strong>
                    <span>${this.currentReport.location || 'Not specified'}</span>
                </div>
                <div class="report-detail">
                    <strong>Description:</strong>
                    <span>${this.currentReport.description || 'No description'}</span>
                </div>
                <div class="report-detail">
                    <strong>Photos:</strong>
                    <span>${this.currentReport.photos.length} photo(s)</span>
                </div>
            </div>
        `;

        // Update photos grid
        this.updatePhotosGrid();

        // Show report editor screen
        this.showScreen('report-editor-screen');
    }

    updatePhotosGrid() {
        const photosContainer = document.getElementById('photos-container');

        if (this.currentReport.photos.length === 0) {
            photosContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #7f8c8d;">
                    <i class="fas fa-camera" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No photos added yet. Click "Add Photo" to get started.</p>
                </div>
            `;
            return;
        }

        photosContainer.innerHTML = this.currentReport.photos.map((photo, index) => `
            <div class="photo-item">
                <img src="${photo.dataUrl}" alt="Photo ${index + 1}" onclick="app.editPhoto(${index})">
                <div class="photo-info">
                    <h4>Photo ${index + 1}</h4>
                    <p>${photo.description || 'No description'}</p>
                </div>
                <button class="delete-photo-btn" onclick="app.deletePhoto(${index})"><i class="fas fa-times"></i></button>
            </div>
        `).join('');
    }

    // Photo Management
    addPhoto() {
        document.getElementById('photo-input').click();
    }

    handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const photo = {
                id: Date.now().toString(),
                dataUrl: e.target.result,
                description: '',
                annotations: [],
                timestamp: new Date().toISOString()
            };

            this.currentReport.photos.push(photo);
            this.saveReport(this.currentReport);
            this.updatePhotosGrid();
        };

        reader.readAsDataURL(file);

        // Clear the input
        event.target.value = '';
    }

    // New function to delete a photo
    deletePhoto(photoIndex) {
        if (!this.currentReport) return;

        if (confirm('Are you sure you want to delete this photo?')) {
            this.currentReport.photos.splice(photoIndex, 1);
            this.saveReport(this.currentReport);
            this.updatePhotosGrid();
            this.showMessage('Photo deleted successfully!', 'success');
        }
    }

    editPhoto(photoIndex) {
        this.currentPhotoIndex = photoIndex;
        const photo = this.currentReport.photos[photoIndex];

        // Load photo into canvas
        this.initPhotoEditor(photo);

        // Load photo description
        document.getElementById('photo-comment').value = photo.description || '';

        // Show photo editor
        this.showScreen('photo-editor-screen');
    }

    initPhotoEditor(photo) {
        const canvas = document.getElementById('photo-canvas');
        this.canvas = new fabric.Canvas(canvas);

        // Load the image
        fabric.Image.fromURL(photo.dataUrl, (img) => {
            // Calculate canvas size to fit the image while maintaining aspect ratio
            const maxWidth = Math.min(800, window.innerWidth - 40);
            const maxHeight = 600;

            const scale = Math.min(maxWidth / img.width, maxHeight / img.height);

            this.canvas.setWidth(img.width * scale);
            this.canvas.setHeight(img.height * scale);

            img.scale(scale);
            img.set({
                left: 0,
                top: 0,
                selectable: false,
                evented: false
            });

            this.canvas.add(img);
            this.canvas.sendToBack(img);

            // Load existing annotations
            if (photo.annotations && photo.annotations.length > 0) {
                // Fabric.js loadFromJSON for entire canvas state, or add individual objects
                // For simplicity here, we assume annotations were saved as individual objects (or a full canvas JSON if desired)
                photo.annotations.forEach(annotation => {
                    if (annotation.objects) { // If it's a full canvas JSON
                        this.canvas.loadFromJSON(annotation, () => {
                            this.canvas.renderAll();
                        });
                    } else { // If individual objects were saved
                        fabric.util.enlivenObjects([annotation], (objects) => {
                            objects.forEach(obj => this.canvas.add(obj));
                            this.canvas.renderAll();
                        });
                    }
                });
            }

            this.canvas.renderAll();
        });

        // Set up canvas event handlers
        this.setupCanvasEvents();
    }

    setupCanvasEvents() {
        let isDrawing = false;
        let currentPath = null;

        this.canvas.on('mouse:down', (e) => {
            if (this.currentTool === 'draw') {
                isDrawing = true;
                const pointer = this.canvas.getPointer(e.e);
                currentPath = new fabric.Path(`M ${pointer.x} ${pointer.y}`, {
                    stroke: this.currentColor,
                    strokeWidth: this.currentBrushSize,
                    fill: '',
                    selectable: false
                });
                this.canvas.add(currentPath);
            }
        });

        this.canvas.on('mouse:move', (e) => {
            if (isDrawing && this.currentTool === 'draw') {
                const pointer = this.canvas.getPointer(e.e);
                currentPath.path.push(['L', pointer.x, pointer.y]);
                currentPath._setPath(currentPath.path.join(' '));
                this.canvas.renderAll();
            }
        });

        this.canvas.on('mouse:up', () => {
            isDrawing = false;
            currentPath = null;
        });

        // Handle clicks for adding text, shapes, etc.
        this.canvas.on('mouse:down', (e) => {
            const pointer = this.canvas.getPointer(e.e);

            switch (this.currentTool) {
                case 'text':
                    this.addText(pointer.x, pointer.y);
                    break;
                case 'rectangle':
                    this.addRectangle(pointer.x, pointer.y);
                    break;
                case 'circle':
                    this.addCircle(pointer.x, pointer.y);
                    break;
                case 'arrow':
                    this.addArrow(pointer.x, pointer.y);
                    break;
            }
        });
    }

    addText(x, y) {
        const text = prompt('Enter text:');
        if (text) {
            const textObj = new fabric.Text(text, {
                left: x,
                top: y,
                fill: this.currentColor,
                fontSize: 16,
                fontFamily: 'Arial'
            });
            this.canvas.add(textObj);
        }
    }

    addRectangle(x, y) {
        const rect = new fabric.Rect({
            left: x,
            top: y,
            width: 100,
            height: 60,
            fill: 'transparent',
            stroke: this.currentColor,
            strokeWidth: this.currentBrushSize
        });
        this.canvas.add(rect);
    }

    addCircle(x, y) {
        const circle = new fabric.Circle({
            left: x,
            top: y,
            radius: 30,
            fill: 'transparent',
            stroke: this.currentColor,
            strokeWidth: this.currentBrushSize
        });
        this.canvas.add(circle);
    }

    addArrow(x, y) {
        const arrow = new fabric.Path('M 0 0 L 50 0 M 40 -10 L 50 0 L 40 10', {
            left: x,
            top: y,
            stroke: this.currentColor,
            strokeWidth: this.currentBrushSize,
            fill: ''
        });
        this.canvas.add(arrow);
    }

    // Tool Management
    selectTool(tool) {
        this.currentTool = tool;

        // Update tool button states
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');

        // Update canvas selection mode
        if (tool === 'select') {
            this.canvas.selection = true;
            this.canvas.forEachObject(obj => {
                if (obj.type !== 'image') {
                    obj.selectable = true;
                }
            });
        } else {
            this.canvas.selection = false;
            this.canvas.discardActiveObject();
            this.canvas.forEachObject(obj => {
                if (obj.type !== 'image') {
                    obj.selectable = false;
                }
            });
        }

        this.canvas.renderAll();
    }

    changeColor(color) {
        this.currentColor = color;
    }

    changeBrushSize(size) {
        this.currentBrushSize = parseInt(size);
        document.getElementById('brush-size-display').textContent = `${size}px`;
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear all annotations?')) {
            const objects = this.canvas.getObjects();
            objects.forEach(obj => {
                if (obj.type !== 'image') {
                    this.canvas.remove(obj);
                }
            });
            this.canvas.renderAll();
        }
    }

    // Saves the photo with its annotations and description
    savePhotoEdits() {
        if (!this.canvas || this.currentPhotoIndex === null) return;

        const photo = this.currentReport.photos[this.currentPhotoIndex];

        // Save description from the textarea
        photo.description = document.getElementById('photo-comment').value;

        // Save canvas as image
        const canvasDataUrl = this.canvas.toDataURL({
            format: 'png',
            quality: 0.9
        });
        photo.editedDataUrl = canvasDataUrl;

        // Save annotations data (save the entire canvas state as JSON)
        photo.annotations = [this.canvas.toJSON()];

        // Save report
        this.saveReport(this.currentReport);

        // Go back to report editor
        this.closePhotoEditor();

        // Show success message
        this.showMessage('Photo saved successfully!', 'success');
    }

    closePhotoEditor() {
        this.currentPhotoIndex = null;
        if (this.canvas) {
            this.canvas.dispose();
            this.canvas = null;
        }
        this.showReportEditor();
    }

    // PDF Generation
    async generatePDF() {
        if (!this.currentReport) {
            alert('Please create or open a report first.');
            return;
        }
        if (this.currentReport.photos.length === 0) {
            alert('Please add at least one photo to generate a PDF report');
            return;
        }

        this.showLoading(true);

        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();

            // --- Fetch the Spectrum logo image and convert it to a data URL ---
            const spectrumLogoUrl = './output-onlinepngtools.png';
            const logoDataUrl = await this.getBase64Image(spectrumLogoUrl);
            const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
            const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim();

            // --- FIRST PAGE (Cover Page) ---
            pdf.setFillColor(primaryColor);
            pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');

            if (logoDataUrl) {
                const logoWidth = 80;
                const logoHeight = logoWidth * (232 / 920);
                pdf.addImage(logoDataUrl, 'PNG', (pdf.internal.pageSize.getWidth() - logoWidth) / 2, 40, logoWidth, logoHeight);
            }

            pdf.setFontSize(28);
            pdf.setTextColor(255, 255, 255);
            pdf.text('Spectrum Quality Control App', pdf.internal.pageSize.getWidth() / 2, 120, { align: 'center' });
            pdf.setFontSize(22);
            pdf.text('Site Inspection Report', pdf.internal.pageSize.getWidth() / 2, 140, { align: 'center' });

            pdf.setFontSize(14);
            pdf.setTextColor(189, 195, 199);
            pdf.text(`Project: ${this.currentReport.projectName}`, pdf.internal.pageSize.getWidth() / 2, 160, { align: 'center' });
            pdf.text(`Report: ${this.currentReport.name}`, pdf.internal.pageSize.getWidth() / 2, 170, { align: 'center' });
            pdf.text(`Date: ${this.formatDate(this.currentReport.date)}`, pdf.internal.pageSize.getWidth() / 2, 180, { align: 'center' });

            // Add a footer to the first page
            pdf.setFontSize(10);
            pdf.setTextColor(149, 165, 166);
            pdf.text('Generated by Spectrum Quality Control App', pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() - 20, { align: 'center' });

            // --- SUBSEQUENT PAGES (Photos) ---
            for (let i = 0; i < this.currentReport.photos.length; i++) {
                const photo = this.currentReport.photos[i];

                pdf.addPage();

                // --- Add Logo to Header of every page ---
                if (logoDataUrl) {
                    const headerLogoWidth = 30;
                    const headerLogoHeight = headerLogoWidth * (232 / 920);
                    pdf.addImage(logoDataUrl, 'PNG', 10, 10, headerLogoWidth, headerLogoHeight);
                }

                // --- Add Page Number to Footer of every page ---
                const pageNumber = pdf.internal.getCurrentPageInfo().pageNumber;
                pdf.setFontSize(10);
                pdf.setTextColor(100, 100, 100);
                pdf.text(`Page ${pageNumber}`, pdf.internal.pageSize.getWidth() - 20, pdf.internal.pageSize.getHeight() - 10, { align: 'right' });


                // Add photo title
                pdf.setFontSize(16);
                pdf.setTextColor(primaryColor);
                pdf.text(`Photo ${i + 1}`, 20, 30);

                // Add photo image
                // Use editedDataUrl if available, otherwise dataUrl
                const imgData = photo.editedDataUrl || photo.dataUrl;
                try {
                    const img = new Image();
                    img.src = imgData;
                    await new Promise(resolve => {
                        img.onload = resolve;
                        img.onerror = () => {
                            console.warn(`Could not load image at index ${i}. Skipping.`);
                            resolve();
                        };
                    });

                    if (img.complete && img.naturalWidth > 0) {
                        const imgWidth = img.naturalWidth;
                        const imgHeight = img.naturalHeight;

                        const pageWidth = pdf.internal.pageSize.getWidth() - 40;
                        const pageHeight = pdf.internal.pageSize.getHeight() - 100;
                        const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);

                        const finalWidth = imgWidth * ratio;
                        const finalHeight = imgHeight * ratio;
                        const xPos = 20;
                        const yPos = 40;

                        pdf.addImage(imgData, 'PNG', xPos, yPos, finalWidth, finalHeight);
                    } else {
                        pdf.setFontSize(12);
                        pdf.setTextColor(200, 0, 0);
                        pdf.text('Error: Image failed to load for this photo.', 20, 80);
                    }
                } catch (error) {
                    console.error('Error adding image to PDF:', error);
                    pdf.setFontSize(12);
                    pdf.setTextColor(200, 0, 0);
                    pdf.text('Error loading image', 20, 80);
                }

                // Add photo description
                if (photo.description) {
                    pdf.setFontSize(12);
                    pdf.setTextColor(0, 0, 0);
                    const descriptionStartY = 40 + (photo.editedDataUrl || photo.dataUrl ? pdf.getImageProperties(imgData).height * ratio : 0) + 10;
                    const lines = pdf.splitTextToSize(photo.description, pdf.internal.pageSize.getWidth() - 40);
                    pdf.text(lines, 20, descriptionStartY);
                }
            }

            // Save PDF
            const fileName = `${this.currentReport.name.replace(/[^a-z0-9]/gi, '_')}_${this.currentReport.date}.pdf`;
            pdf.save(fileName);

            this.showMessage('PDF generated successfully!', 'success');

        } catch (error) {
            console.error('Error generating PDF:', error);
            this.showMessage('Error generating PDF. Please try again. Check console for details.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Helper function to get base64 data URL for an image
    async getBase64Image(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                resolve(dataUrl);
            };
            img.onerror = (e) => {
                console.error("Failed to load image for base64 conversion:", url, e);
                reject(new Error("Failed to load image for base64 conversion."));
            };
            img.src = url;
        });
    }

    // Storage Functions
    saveReport(report) {
        let reports = this.loadReports();
        const existingIndex = reports.findIndex(r => r.id === report.id);

        if (existingIndex >= 0) {
            reports[existingIndex] = report;
        } else {
            reports.push(report);
        }

        localStorage.setItem('siteReports', JSON.stringify(reports));
        this.reports = reports;
    }

    loadReports() {
        try {
            const reports = localStorage.getItem('siteReports');
            return reports ? JSON.parse(reports) : [];
        } catch (error) {
            console.error('Error loading reports:', error);
            return [];
        }
    }

    loadViewReports() {
        const reportsList = document.getElementById('reports-list');

        if (this.reports.length === 0) {
            reportsList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #7f8c8d;">
                    <i class="fas fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No reports found. Create your first report to get started.</p>
                </div>
            `;
            return;
        }

        reportsList.innerHTML = this.reports.map(report => `
            <div class="report-item" onclick="app.openReport('${report.id}')">
                <h3>${report.name}</h3>
                <div class="report-meta">
                    <i class="fas fa-calendar"></i> ${this.formatDate(report.date)} |
                    <i class="fas fa-map-marker-alt"></i> ${report.location || 'No location'} |
                    <i class="fas fa-camera"></i> ${report.photos.length} photo(s)
                </div>
                <div class="report-summary">
                    ${report.description || 'No description available'}
                </div>
            </div>
        `).join('');
    }

    openReport(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        if (report) {
            this.currentReport = report;
            this.showReportEditor();
        }
    }

    // Utility Functions
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }

    showMessage(message, type = 'info') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Global Functions (for onclick handlers)
let app;

function showHomeScreen() {
    app.showHomeScreen();
}

function showNewReportScreen() {
    app.showNewReportScreen();
}

function showViewReportsScreen() {
    app.showViewReportsScreen();
}

function showHelpScreen() {
    app.showHelpScreen();
}

function addPhoto() {
    app.addPhoto();
}

function handlePhotoUpload(event) {
    app.handlePhotoUpload(event);
}

function editPhoto(index) {
    app.editPhoto(index);
}

function deletePhoto(index) {
    app.deletePhoto(index);
}

function selectTool(tool) {
    app.selectTool(tool);
}

function changeColor(color) {
    app.changeColor(color);
}

function changeBrushSize(size) {
    app.changeBrushSize(size);
}

function clearCanvas() {
    app.clearCanvas();
}

function savePhotoEdits() {
    app.savePhotoEdits();
}

function closePhotoEditor() {
    app.closePhotoEditor();
}

function generatePDF() {
    app.generatePDF();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new SiteReporter();
});

// Add CSS animations for toast messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .photo-item {
        position: relative;
        overflow: hidden;
    }
    .delete-photo-btn {
        position: absolute;
        top: 5px;
        right: 5px;
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        font-size: 14px;
        cursor: pointer;
        opacity: 0.8;
        transition: opacity 0.2s;
    }
    .delete-photo-btn:hover {
        opacity: 1;
    }
`;
document.head.appendChild(style);