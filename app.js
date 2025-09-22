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

        // Initialize mobile touch events
        this.initMobileSupport();
    }

    initMobileSupport() {
        // Prevent zoom on double-tap
        document.addEventListener('dblclick', (e) => {
            e.preventDefault();
        }, { passive: false });

        // Improve touch interactions
        this.improveTouchScrolling();
    }

    improveTouchScrolling() {
        // Enable smooth scrolling for mobile
        document.querySelectorAll('.photos-grid, .canvas-container').forEach(container => {
            container.style.webkitOverflowScrolling = 'touch';
        });
    }

    initFormHandlers() {
        const newReportForm = document.getElementById('new-report-form');
        if (newReportForm) {
            newReportForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createNewReport();
            });
        }

        // Mobile-friendly form inputs
        document.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            });
        });
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

        // Refresh scroll positions on mobile
        setTimeout(() => {
            this.refreshScrollPositions();
        }, 100);
    }

    refreshScrollPositions() {
        // Reset scroll positions for better mobile experience
        document.querySelectorAll('.photos-grid, .canvas-container').forEach(container => {
            container.scrollTop = 0;
        });
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
        const engineerName = document.getElementById('engineer-name').value;
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

        if (!engineerName.trim()) {
            alert('Please enter engineer\'s name');
            return;
        }

        if (!location.trim()) {
            alert('Please enter site location');
            return;
        }

        const report = {
            id: Date.now().toString(),
            name: name.trim(),
            projectName: projectName.trim(),
            engineerName: engineerName.trim(),
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
                    <strong>Engineer's Name:</strong>
                    <span>${this.currentReport.engineerName || 'Not specified'}</span>
                </div>
                <div class="report-detail">
                    <strong>Date:</strong>
                    <span>${this.formatDate(this.currentReport.date)}</span>
                </div>
                <div class="report-detail">
                    <strong>Site Location:</strong>
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

        // Ensure photos grid is scrollable on mobile
        photosContainer.style.overflowY = 'auto';
        photosContainer.style.maxHeight = '60vh';
    }

    // Photo Management with Orientation Fix
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

        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Please select an image smaller than 5MB');
            return;
        }

        this.showLoading(true);

        // Use EXIF.js to handle orientation (you'll need to include EXIF.js library)
        this.processImageWithOrientation(file).then(processedImage => {
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
                this.showMessage('Photo added successfully!', 'success');
                this.showLoading(false);
            };

            reader.onerror = () => {
                this.showMessage('Error reading photo file', 'error');
                this.showLoading(false);
            };

            reader.readAsDataURL(processedImage);
        }).catch(error => {
            console.error('Image processing error:', error);
            // Fallback to original file if processing fails
            this.processImageFallback(file);
        });

        // Clear the input
        event.target.value = '';
    }

    // Process image with orientation correction
    async processImageWithOrientation(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                // Set canvas dimensions to image dimensions
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw image onto canvas (this automatically corrects orientation)
                ctx.drawImage(img, 0, 0);

                // Convert back to blob
                canvas.toBlob(blob => {
                    if (blob) {
                        resolve(new File([blob], file.name, { type: file.type }));
                    } else {
                        reject(new Error('Canvas to blob conversion failed'));
                    }
                }, file.type);
            };

            img.onerror = () => reject(new Error('Image loading failed'));
            img.src = URL.createObjectURL(file);
        });
    }

    // Fallback method if image processing fails
    processImageFallback(file) {
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
            this.showMessage('Photo added successfully!', 'success');
            this.showLoading(false);
        };
        reader.readAsDataURL(file);
    }

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

        // Focus on description field for easy editing
        setTimeout(() => {
            document.getElementById('photo-comment').focus();
        }, 300);
    }

    initPhotoEditor(photo) {
        const canvas = document.getElementById('photo-canvas');
        
        // Dispose of previous canvas if exists
        if (this.canvas) {
            this.canvas.dispose();
        }
        
        this.canvas = new fabric.Canvas(canvas, {
            isDrawingMode: false,
            selection: true
        });

        // Load the image
        fabric.Image.fromURL(photo.dataUrl, (img) => {
            // Calculate canvas size to fit the image while maintaining aspect ratio
            const maxWidth = Math.min(800, window.innerWidth - 40);
            const maxHeight = 500;

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
                try {
                    this.canvas.loadFromJSON(photo.annotations[0], () => {
                        this.canvas.renderAll();
                    });
                } catch (error) {
                    console.error('Error loading annotations:', error);
                }
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
                currentPath.set({ path: currentPath.path });
                this.canvas.requestRenderAll();
            }
        });

        this.canvas.on('mouse:up', () => {
            isDrawing = false;
            currentPath = null;
        });

        // Mobile touch events
        this.canvas.on('touch:start', (e) => {
            if (this.currentTool === 'select') return;
            e.e.preventDefault();
        });

        // Handle clicks for adding text, shapes, etc.
        this.canvas.on('mouse:down', (e) => {
            if (this.currentTool === 'select') return;
            
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
                fontFamily: 'Arial',
                selectable: true
            });
            this.canvas.add(textObj);
            this.canvas.setActiveObject(textObj);
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
            strokeWidth: this.currentBrushSize,
            selectable: true
        });
        this.canvas.add(rect);
        this.canvas.setActiveObject(rect);
    }

    addCircle(x, y) {
        const circle = new fabric.Circle({
            left: x,
            top: y,
            radius: 30,
            fill: 'transparent',
            stroke: this.currentColor,
            strokeWidth: this.currentBrushSize,
            selectable: true
        });
        this.canvas.add(circle);
        this.canvas.setActiveObject(circle);
    }

    addArrow(x, y) {
        const arrow = new fabric.Path('M 0 0 L 50 0 M 40 -10 L 50 0 L 40 10', {
            left: x,
            top: y,
            stroke: this.currentColor,
            strokeWidth: this.currentBrushSize,
            fill: '',
            selectable: true
        });
        this.canvas.add(arrow);
        this.canvas.setActiveObject(arrow);
    }

    // Tool Management
    selectTool(tool) {
        this.currentTool = tool;

        // Update tool button states
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-tool="${tool}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Update canvas selection mode
        if (tool === 'select') {
            this.canvas.selection = true;
            this.canvas.forEachObject(obj => {
                obj.selectable = true;
            });
        } else {
            this.canvas.selection = false;
            this.canvas.discardActiveObject();
            this.canvas.forEachObject(obj => {
                obj.selectable = false;
            });
        }

        this.canvas.requestRenderAll();
    }

    changeColor(color) {
        this.currentColor = color;
        
        // Update active object color if in select mode
        if (this.currentTool === 'select' && this.canvas.getActiveObject()) {
            const activeObj = this.canvas.getActiveObject();
            if (activeObj.set) {
                activeObj.set('stroke', color);
                if (activeObj.type === 'text') {
                    activeObj.set('fill', color);
                }
                this.canvas.requestRenderAll();
            }
        }
    }

    changeBrushSize(size) {
        this.currentBrushSize = parseInt(size);
        document.getElementById('brush-size-display').textContent = `${size}px`;
        
        // Update active object stroke width if in select mode
        if (this.currentTool === 'select' && this.canvas.getActiveObject()) {
            const activeObj = this.canvas.getActiveObject();
            if (activeObj.set && activeObj.type !== 'image' && activeObj.type !== 'text') {
                activeObj.set('strokeWidth', this.currentBrushSize);
                this.canvas.requestRenderAll();
            }
        }
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear all annotations?')) {
            const objects = this.canvas.getObjects();
            objects.forEach(obj => {
                if (obj.type !== 'image') {
                    this.canvas.remove(obj);
                }
            });
            this.canvas.requestRenderAll();
        }
    }

    // Saves the photo with its annotations and description
    savePhotoEdits() {
        if (!this.canvas || this.currentPhotoIndex === null) return;

        const photo = this.currentReport.photos[this.currentPhotoIndex];

        // Save description from the textarea
        photo.description = document.getElementById('photo-comment').value;

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

    // PDF Generation with Notification
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

            const primaryColor = '#000000';
            const secondaryColor = '#e0222a';

            // --- FIRST PAGE (Cover Page) ---
            // Add red border
            pdf.setDrawColor(224, 34, 42);
            pdf.setLineWidth(8);
            pdf.rect(4, 4, pdf.internal.pageSize.getWidth() - 8, pdf.internal.pageSize.getHeight() - 8);
            
            // Background fill
            pdf.setFillColor(0, 0, 0);
            pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');

            pdf.setFontSize(28);
            pdf.setTextColor(255, 255, 255);
            pdf.text('Quality Control Report', pdf.internal.pageSize.getWidth() / 2, 80, { align: 'center' });
            pdf.setFontSize(22);
            pdf.text('Site Inspection Report', pdf.internal.pageSize.getWidth() / 2, 100, { align: 'center' });

            // Project details
            pdf.setFontSize(14);
            pdf.setTextColor(189, 195, 199);
            
            pdf.text(`Engineer's Name: ${this.currentReport.engineerName}`, pdf.internal.pageSize.getWidth() / 2, 140, { align: 'center' });
            pdf.text(`Company: Spectrum Engineering Ltd.`, pdf.internal.pageSize.getWidth() / 2, 155, { align: 'center' });
            pdf.text(`Site Location: ${this.currentReport.location}`, pdf.internal.pageSize.getWidth() / 2, 170, { align: 'center' });
            pdf.text(`Project: ${this.currentReport.projectName}`, pdf.internal.pageSize.getWidth() / 2, 185, { align: 'center' });
            pdf.text(`Report: ${this.currentReport.name}`, pdf.internal.pageSize.getWidth() / 2, 200, { align: 'center' });
            pdf.text(`Date: ${this.formatDate(this.currentReport.date)}`, pdf.internal.pageSize.getWidth() / 2, 215, { align: 'center' });

            // Footer
            pdf.setFontSize(10);
            pdf.setTextColor(149, 165, 166);
            pdf.text('Generated by Quality Control App', pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() - 30, { align: 'center' });

            // --- PHOTO PAGES ---
            for (let i = 0; i < this.currentReport.photos.length; i++) {
                const photo = this.currentReport.photos[i];
                const imgData = photo.editedDataUrl || photo.dataUrl;

                // Add new page for each photo
                pdf.addPage();

                // Page number
                const pageNumber = pdf.internal.getNumberOfPages();
                pdf.setFontSize(10);
                pdf.setTextColor(100, 100, 100);
                pdf.text(`Page ${pageNumber}`, pdf.internal.pageSize.getWidth() - 20, pdf.internal.pageSize.getHeight() - 10, { align: 'right' });

                // Photo title
                pdf.setFontSize(16);
                pdf.setTextColor(0, 0, 0);
                pdf.text(`Photo ${i + 1}`, 20, 30);

                // Add photo
                try {
                    const img = new Image();
                    await new Promise((resolve, reject) => {
                        img.onload = () => resolve(img);
                        img.onerror = () => reject(new Error('Image loading failed'));
                        img.src = imgData;
                    });

                    if (img.complete && img.naturalWidth > 0) {
                        const maxWidth = pdf.internal.pageSize.getWidth() - 40;
                        const maxHeight = pdf.internal.pageSize.getHeight() - 80;
                        
                        const scale = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight);
                        const imgWidth = img.naturalWidth * scale;
                        const imgHeight = img.naturalHeight * scale;
                        
                        const xPos = (pdf.internal.pageSize.getWidth() - imgWidth) / 2;
                        const yPos = 40;
                        
                        pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight);
                        
                        // Add description
                        if (photo.description && photo.description.trim() !== '') {
                            pdf.setFontSize(12);
                            pdf.setTextColor(0, 0, 0);
                            const descriptionY = yPos + imgHeight + 15;
                            const splitText = pdf.splitTextToSize(photo.description, pdf.internal.pageSize.getWidth() - 40);
                            pdf.text(splitText, 20, descriptionY);
                        }
                    }
                } catch (error) {
                    console.error('Error processing image:', error);
                    pdf.setFontSize(12);
                    pdf.setTextColor(255, 0, 0);
                    pdf.text('Error: Could not load photo', 20, 60);
                }
            }

            // Save PDF
            const fileName = `QC_Report_${this.currentReport.name.replace(/[^a-z0-9]/gi, '_')}_${this.currentReport.date}.pdf`;
            pdf.save(fileName);

            // Show PDF notification
            this.showPdfNotification();

            this.showMessage('PDF generated successfully!', 'success');

        } catch (error) {
            console.error('PDF Generation Error:', error);
            this.showMessage('Error generating PDF. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Show PDF download notification
    showPdfNotification() {
        const notification = document.getElementById('pdf-notification');
        notification.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
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
                    <i class="fas fa-user"></i> ${report.engineerName || 'No engineer'} |
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
        // Remove existing messages
        document.querySelectorAll('.toast-message').forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = 'toast-message';
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
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
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

function closePdfNotification() {
    document.getElementById('pdf-notification').classList.remove('show');
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
`;
document.head.appendChild(style);