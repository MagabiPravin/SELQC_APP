// Site Reporter App - Main JavaScript File
class SiteReporter {
    constructor() {
        this.currentReport = null;
        this.currentPhotoIndex = null;
        this.currentPageIndex = 0;
        this.canvas = null;
        this.reports = this.loadReports();
        this.currentTool = 'select';
        this.currentColor = '#e0222a';
        this.currentBrushSize = 3;
        this.isEditingPagePhoto = false;

        this.init();
    }

    init() {
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('report-date');
        if (dateInput) {
            dateInput.value = today;
        }

        this.initFormHandlers();
        this.loadViewReports();
        this.initMobileSupport();

        const brushSizeInput = document.getElementById('brush-size-input');
        if (brushSizeInput) {
            brushSizeInput.addEventListener('input', () => {
                document.getElementById('brush-size-display').textContent = `${brushSizeInput.value}px`;
            });
        }

        // Initialize page photo upload handler
        const pagePhotoInput = document.getElementById('page-photo-input');
        if (pagePhotoInput) {
            pagePhotoInput.addEventListener('change', (event) => {
                this.handlePagePhotoUpload(event);
            });
        }
    }

    initMobileSupport() {
        // Improve touch interactions
        this.improveTouchScrolling();
        
        // Prevent zoom on double-tap for inputs
        document.addEventListener('dblclick', (e) => {
            if (e.target.matches('input, textarea')) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    improveTouchScrolling() {
        // Enable smooth scrolling for mobile
        document.querySelectorAll('.pages-grid, .canvas-container').forEach(container => {
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
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }

        // Refresh UI for the new screen
        setTimeout(() => {
            this.refreshCurrentScreen();
        }, 100);
    }

    refreshCurrentScreen() {
        const activeScreen = document.querySelector('.screen.active');
        if (!activeScreen) return;

        switch (activeScreen.id) {
            case 'report-editor-screen':
                this.updatePagesOverview();
                break;
            case 'page-manager-screen':
                this.updatePageManager();
                break;
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

    showReportEditor() {
        if (!this.currentReport) return;

        this.initializeReportPages();
        
        document.getElementById('current-report-title').textContent = this.currentReport.name;

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
                    <strong>Total Pages:</strong>
                    <span>${this.currentReport.pages.length}</span>
                </div>
            </div>
        `;

        this.updatePagesOverview();
        this.showScreen('report-editor-screen');
    }

    showPageManager() {
        if (!this.currentReport) return;
        
        this.initializeReportPages();
        this.currentPageIndex = 0;
        this.updatePageManager();
        this.showScreen('page-manager-screen');
    }

    // NEW: Page Management System
    initializeReportPages() {
        if (!this.currentReport.pages) {
            this.currentReport.pages = [this.createNewPage(0)];
        }
        
        // Ensure all pages have proper numbers
        this.currentReport.pages.forEach((page, index) => {
            page.pageNumber = index;
        });
    }

    createNewPage(pageNumber) {
        return {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            pageNumber: pageNumber,
            photo: null,
            comment: '',
            timestamp: new Date().toISOString()
        };
    }

    updatePageManager() {
        if (!this.currentReport.pages || this.currentReport.pages.length === 0) {
            this.currentReport.pages = [this.createNewPage(0)];
        }

        const page = this.currentReport.pages[this.currentPageIndex];
        
        // Update navigation
        document.getElementById('page-current').textContent = this.currentPageIndex + 1;
        document.getElementById('page-total').textContent = this.currentReport.pages.length;
        
        // Update navigation buttons
        document.getElementById('prev-btn').disabled = this.currentPageIndex === 0;
        document.getElementById('next-btn').disabled = this.currentPageIndex === this.currentReport.pages.length - 1;
        
        // Update photo display
        const photoPreview = document.getElementById('page-photo-preview');
        const placeholder = document.getElementById('page-photo-placeholder');
        const editButton = document.getElementById('edit-photo-btn');
        
        if (page.photo) {
            photoPreview.src = page.photo.dataUrl;
            photoPreview.style.display = 'block';
            placeholder.style.display = 'none';
            editButton.style.display = 'block';
        } else {
            photoPreview.style.display = 'none';
            placeholder.style.display = 'flex';
            editButton.style.display = 'none';
        }
        
        // Update comment
        document.getElementById('page-comment').value = page.comment || '';
    }

    updatePagesOverview() {
        const pagesContainer = document.getElementById('pages-container');
        const pages = this.currentReport.pages;

        if (!pages || pages.length === 0) {
            pagesContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #7f8c8d;">
                    <i class="fas fa-file-alt" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No Pages Yet</h3>
                    <p>Click "Manage Pages" to add content to your report</p>
                    <button onclick="showPageManager()" class="cta-btn" style="margin-top: 1rem;">
                        <i class="fas fa-plus"></i> Add First Page
                    </button>
                </div>
            `;
            return;
        }

        pagesContainer.innerHTML = pages.map((page, index) => `
            <div class="page-item" onclick="editPage(${index})">
                ${page.photo ? 
                    `<img src="${page.photo.dataUrl}" alt="Page ${index + 1}">` :
                    `<div class="no-photo">
                        <i class="fas fa-image" style="font-size: 3rem; opacity: 0.3;"></i>
                        <p>No Photo</p>
                    </div>`
                }
                <div class="page-info">
                    <h4>Page ${index + 1}</h4>
                    <p>${page.comment ? this.truncateText(page.comment, 80) : 'No comments yet'}</p>
                </div>
                <button class="delete-page-btn" onclick="deletePage(${index}, event)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    truncateText(text, length) {
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    // Page Navigation
    nextPage() {
        if (this.currentPageIndex < this.currentReport.pages.length - 1) {
            this.saveCurrentPage();
            this.currentPageIndex++;
            this.updatePageManager();
        }
    }

    previousPage() {
        if (this.currentPageIndex > 0) {
            this.saveCurrentPage();
            this.currentPageIndex--;
            this.updatePageManager();
        }
    }

    // Page Actions
    addNewPage() {
        this.saveCurrentPage();
        
        const newPage = this.createNewPage(this.currentReport.pages.length);
        this.currentReport.pages.push(newPage);
        this.currentPageIndex = this.currentReport.pages.length - 1;
        
        this.updatePageManager();
        this.showMessage('New page added!', 'success');
    }

    saveCurrentPage() {
        if (!this.currentReport.pages[this.currentPageIndex]) return;
        
        const page = this.currentReport.pages[this.currentPageIndex];
        page.comment = document.getElementById('page-comment').value.trim();
        
        this.saveReport(this.currentReport);
    }

    deleteCurrentPage() {
        if (this.currentReport.pages.length <= 1) {
            this.showMessage('Cannot delete the only page. Reports must have at least one page.', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
            this.currentReport.pages.splice(this.currentPageIndex, 1);
            
            // Update page numbers
            this.currentReport.pages.forEach((page, index) => {
                page.pageNumber = index;
            });
            
            // Adjust current page index if needed
            if (this.currentPageIndex >= this.currentReport.pages.length) {
                this.currentPageIndex = this.currentReport.pages.length - 1;
            }
            
            this.saveReport(this.currentReport);
            this.updatePageManager();
            this.showMessage('Page deleted successfully!', 'success');
        }
    }

    editPage(pageIndex) {
        this.currentPageIndex = pageIndex;
        this.showPageManager();
    }

    deletePage(pageIndex, event) {
        event.stopPropagation();
        
        if (this.currentReport.pages.length <= 1) {
            this.showMessage('Cannot delete the only page.', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this page?')) {
            this.currentReport.pages.splice(pageIndex, 1);
            
            // Update page numbers
            this.currentReport.pages.forEach((page, index) => {
                page.pageNumber = index;
            });
            
            this.saveReport(this.currentReport);
            this.updatePagesOverview();
            this.showMessage('Page deleted successfully!', 'success');
        }
    }

    // Photo Management with FIXED Orientation
    async handlePagePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showMessage('Please select an image file', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            this.showMessage('Please select an image smaller than 5MB', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const processedImage = await this.fixImageOrientation(file);
            const dataUrl = await this.fileToDataURL(processedImage);
            
            const page = this.currentReport.pages[this.currentPageIndex];
            page.photo = {
                id: Date.now().toString(),
                dataUrl: dataUrl,
                originalFile: file,
                timestamp: new Date().toISOString()
            };
            
            this.saveReport(this.currentReport);
            this.updatePageManager();
            this.showMessage('Photo added successfully!', 'success');
            
        } catch (error) {
            console.error('Image processing error:', error);
            this.showMessage('Error processing image. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }

        event.target.value = '';
    }

    // FIXED: Proper image orientation correction
    fixImageOrientation(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                // Set canvas to image dimensions
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Draw image (this corrects orientation)
                ctx.drawImage(img, 0, 0, img.width, img.height);
                
                // Convert to blob with high quality
                canvas.toBlob(blob => {
                    if (blob) {
                        resolve(new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: new Date().getTime()
                        }));
                    } else {
                        reject(new Error('Canvas to blob conversion failed'));
                    }
                }, 'image/jpeg', 0.95);
            };

            img.onerror = () => reject(new Error('Image loading failed'));
            img.src = URL.createObjectURL(file);
        });
    }

    fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('File reading failed'));
            reader.readAsDataURL(file);
        });
    }

    editPagePhoto() {
        const page = this.currentReport.pages[this.currentPageIndex];
        if (!page.photo) return;

        this.isEditingPagePhoto = true;
        this.currentEditingPageIndex = this.currentPageIndex;
        
        const tempPhoto = {
            id: page.photo.id,
            dataUrl: page.photo.dataUrl,
            description: page.comment,
            annotations: page.photo.annotations || []
        };
        
        this.initPhotoEditor(tempPhoto);
        this.showScreen('photo-editor-screen');
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
            this.showMessage('Please enter a report name', 'error');
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
            pages: [this.createNewPage(0)],
            createdAt: new Date().toISOString()
        };

        this.currentReport = report;
        this.saveReport(report);
        this.showReportEditor();
        this.showMessage('Report created successfully!', 'success');
    }

    // Photo Editor Functions (existing functionality)
    initPhotoEditor(photo) {
        const canvas = document.getElementById('photo-canvas');
        
        if (this.canvas) {
            this.canvas.dispose();
        }
        
        this.canvas = new fabric.Canvas(canvas, {
            isDrawingMode: false,
            selection: true
        });

        fabric.Image.fromURL(photo.dataUrl, (img) => {
            const maxWidth = Math.min(800, window.innerWidth - 40);
            const maxHeight = 500;
            const scale = Math.min(maxWidth / img.width, maxHeight / img.height);

            this.canvas.setWidth(img.width * scale);
            this.canvas.setHeight(img.height * scale);
            img.scale(scale);
            img.set({ left: 0, top: 0, selectable: false, evented: false });

            this.canvas.add(img);
            this.canvas.sendToBack(img);

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

        document.getElementById('photo-comment').value = photo.description || '';
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

        this.canvas.on('mouse:down', (e) => {
            if (this.currentTool === 'select') return;
            
            const pointer = this.canvas.getPointer(e.e);
            switch (this.currentTool) {
                case 'text': this.addText(pointer.x, pointer.y); break;
                case 'rectangle': this.addRectangle(pointer.x, pointer.y); break;
                case 'circle': this.addCircle(pointer.x, pointer.y); break;
                case 'arrow': this.addArrow(pointer.x, pointer.y); break;
            }
        });
    }

    addText(x, y) {
        const text = prompt('Enter text:');
        if (text) {
            const textObj = new fabric.Text(text, {
                left: x, top: y, fill: this.currentColor,
                fontSize: 16, fontFamily: 'Arial', selectable: true
            });
            this.canvas.add(textObj);
            this.canvas.setActiveObject(textObj);
        }
    }

    addRectangle(x, y) {
        const rect = new fabric.Rect({
            left: x, top: y, width: 100, height: 60,
            fill: 'transparent', stroke: this.currentColor,
            strokeWidth: this.currentBrushSize, selectable: true
        });
        this.canvas.add(rect);
        this.canvas.setActiveObject(rect);
    }

    addCircle(x, y) {
        const circle = new fabric.Circle({
            left: x, top: y, radius: 30,
            fill: 'transparent', stroke: this.currentColor,
            strokeWidth: this.currentBrushSize, selectable: true
        });
        this.canvas.add(circle);
        this.canvas.setActiveObject(circle);
    }

    addArrow(x, y) {
        const arrow = new fabric.Path('M 0 0 L 50 0 M 40 -10 L 50 0 L 40 10', {
            left: x, top: y, stroke: this.currentColor,
            strokeWidth: this.currentBrushSize, fill: '', selectable: true
        });
        this.canvas.add(arrow);
        this.canvas.setActiveObject(arrow);
    }

    selectTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-tool="${tool}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        if (tool === 'select') {
            this.canvas.selection = true;
            this.canvas.forEachObject(obj => obj.selectable = true);
        } else {
            this.canvas.selection = false;
            this.canvas.discardActiveObject();
            this.canvas.forEachObject(obj => obj.selectable = false);
        }
        this.canvas.requestRenderAll();
    }

    changeColor(color) {
        this.currentColor = color;
        if (this.currentTool === 'select' && this.canvas.getActiveObject()) {
            const activeObj = this.canvas.getActiveObject();
            if (activeObj.set) {
                activeObj.set('stroke', color);
                if (activeObj.type === 'text') activeObj.set('fill', color);
                this.canvas.requestRenderAll();
            }
        }
    }

    changeBrushSize(size) {
        this.currentBrushSize = parseInt(size);
        document.getElementById('brush-size-display').textContent = `${size}px`;
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
                if (obj.type !== 'image') this.canvas.remove(obj);
            });
            this.canvas.requestRenderAll();
        }
    }

    savePhotoEdits() {
        if (!this.canvas) return;

        const description = document.getElementById('photo-comment').value;

        if (this.isEditingPagePhoto) {
            // Save page photo edits
            const page = this.currentReport.pages[this.currentEditingPageIndex];
            page.comment = description;
            page.photo.annotations = [this.canvas.toJSON()];
            this.saveReport(this.currentReport);
            this.showMessage('Page photo saved successfully!', 'success');
        }

        this.closePhotoEditor();
    }

    closePhotoEditor() {
        this.isEditingPagePhoto = false;
        this.currentEditingPageIndex = null;
        if (this.canvas) {
            this.canvas.dispose();
            this.canvas = null;
        }
        this.showPageManager();
    }

    // PDF Generation
    async generatePDF() {
        if (!this.currentReport) {
            this.showMessage('Please create or open a report first.', 'error');
            return;
        }

        this.initializeReportPages();
        
        if (!this.currentReport.pages || this.currentReport.pages.length === 0) {
            this.showMessage('Please add at least one page to generate a PDF report', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();

            // Cover page
            this.generateCoverPage(pdf);

            // Add each page
            for (let i = 0; i < this.currentReport.pages.length; i++) {
                const page = this.currentReport.pages[i];
                await this.addPageToPDF(pdf, page, i);
            }

            const fileName = `QC_Report_${this.currentReport.name.replace(/[^a-z0-9]/gi, '_')}_${this.currentReport.date}.pdf`;
            pdf.save(fileName);

            this.showPdfNotification();
            this.showMessage('PDF generated successfully!', 'success');

        } catch (error) {
            console.error('PDF Generation Error:', error);
            this.showMessage('Error generating PDF. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    generateCoverPage(pdf) {
        pdf.setDrawColor(224, 34, 42);
        pdf.setLineWidth(8);
        pdf.rect(4, 4, pdf.internal.pageSize.getWidth() - 8, pdf.internal.pageSize.getHeight() - 8);
        
        pdf.setFillColor(0, 0, 0);
        pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');

        pdf.setFontSize(28);
        pdf.setTextColor(255, 255, 255);
        pdf.text('Quality Control Report', pdf.internal.pageSize.getWidth() / 2, 80, { align: 'center' });
        pdf.setFontSize(22);
        pdf.text('Site Inspection Report', pdf.internal.pageSize.getWidth() / 2, 100, { align: 'center' });

        pdf.setFontSize(14);
        pdf.setTextColor(189, 195, 199);
        
        const details = [
            `Engineer's Name: ${this.currentReport.engineerName}`,
            `Company: Spectrum Engineering Ltd.`,
            `Site Location: ${this.currentReport.location}`,
            `Project: ${this.currentReport.projectName}`,
            `Report: ${this.currentReport.name}`,
            `Date: ${this.formatDate(this.currentReport.date)}`,
            `Total Pages: ${this.currentReport.pages.length}`
        ];

        details.forEach((detail, index) => {
            pdf.text(detail, pdf.internal.pageSize.getWidth() / 2, 140 + (index * 15), { align: 'center' });
        });

        pdf.setFontSize(10);
        pdf.setTextColor(149, 165, 166);
        pdf.text('Generated by Quality Control App', pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() - 30, { align: 'center' });
    }

    async addPageToPDF(pdf, page, pageIndex) {
        if (pageIndex > 0) pdf.addPage();

        const pageNumber = pdf.internal.getNumberOfPages();
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Page ${pageNumber}`, pdf.internal.pageSize.getWidth() - 20, pdf.internal.pageSize.getHeight() - 10, { align: 'right' });

        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Page ${pageIndex + 1}`, 20, 30);

        if (page.photo) {
            try {
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error('Image loading failed'));
                    img.src = page.photo.dataUrl;
                });

                if (img.complete && img.naturalWidth > 0) {
                    const maxWidth = pdf.internal.pageSize.getWidth() - 40;
                    const maxHeight = pdf.internal.pageSize.getHeight() - 80;
                    const scale = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight);
                    const imgWidth = img.naturalWidth * scale;
                    const imgHeight = img.naturalHeight * scale;
                    const xPos = (pdf.internal.pageSize.getWidth() - imgWidth) / 2;
                    const yPos = 40;
                    
                    pdf.addImage(page.photo.dataUrl, 'JPEG', xPos, yPos, imgWidth, imgHeight);
                    
                    if (page.comment) {
                        pdf.setFontSize(12);
                        const commentY = yPos + imgHeight + 15;
                        const splitText = pdf.splitTextToSize(`Comments: ${page.comment}`, pdf.internal.pageSize.getWidth() - 40);
                        pdf.text(splitText, 20, commentY);
                    }
                }
            } catch (error) {
                pdf.setFontSize(12);
                pdf.setTextColor(255, 0, 0);
                pdf.text('Error: Could not load photo', 20, 60);
            }
        } else {
            pdf.setFontSize(12);
            pdf.text('No photo for this page', 20, 60);
            if (page.comment) {
                const splitText = pdf.splitTextToSize(`Comments: ${page.comment}`, pdf.internal.pageSize.getWidth() - 40);
                pdf.text(splitText, 20, 80);
            }
        }
    }

    // Storage Functions
    saveReport(report) {
        let reports = this.loadReports();
        const existingIndex = reports.findIndex(r => r.id === report.id);
        if (existingIndex >= 0) reports[existingIndex] = report;
        else reports.push(report);
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
                <div style="text-align: center; padding: 3rem; color: #7f8c8d;">
                    <i class="fas fa-folder-open" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No Reports Found</h3>
                    <p>Create your first report to get started</p>
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
                    <i class="fas fa-file-alt"></i> ${report.pages ? report.pages.length : 0} page(s)
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
            year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) overlay.classList.add('active');
        else overlay.classList.remove('active');
    }

    showPdfNotification() {
        const notification = document.getElementById('pdf-notification');
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 5000);
    }

    showMessage(message, type = 'info') {
        document.querySelectorAll('.toast-message').forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `toast-message ${type === 'error' ? 'error' : type === 'warning' ? 'warning' : ''}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Global Functions
let app;

function showHomeScreen() { app.showHomeScreen(); }
function showNewReportScreen() { app.showNewReportScreen(); }
function showViewReportsScreen() { app.showViewReportsScreen(); }
function showHelpScreen() { app.showHelpScreen(); }
function showReportEditor() { app.showReportEditor(); }
function showPageManager() { app.showPageManager(); }
function addNewPage() { app.addNewPage(); }
function nextPage() { app.nextPage(); }
function previousPage() { app.previousPage(); }
function saveCurrentPage() { app.saveCurrentPage(); }
function deleteCurrentPage() { app.deleteCurrentPage(); }
function editPage(index) { app.editPage(index); }
function deletePage(index, event) { app.deletePage(index, event); }
function triggerPagePhotoUpload() { document.getElementById('page-photo-input').click(); }
function selectTool(tool) { app.selectTool(tool); }
function changeColor(color) { app.changeColor(color); }
function changeBrushSize(size) { app.changeBrushSize(size); }
function clearCanvas() { app.clearCanvas(); }
function savePhotoEdits() { app.savePhotoEdits(); }
function closePhotoEditor() { app.closePhotoEditor(); }
function generatePDF() { app.generatePDF(); }
function closePdfNotification() { document.getElementById('pdf-notification').classList.remove('show'); }

document.addEventListener('DOMContentLoaded', () => {
    app = new SiteReporter();
});

// Add CSS animations
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