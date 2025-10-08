// CaldaSpace - 3D NEO Visualization Module (Fixed)
// Advanced Three.js implementation for Near Earth Objects and comet visualization

export class NEO3DVisualizer {
    constructor(canvasId) {
        console.log('NEO3DVisualizer: Initializing...');
        
        this.canvasId = canvasId;
        this.canvas = document.getElementById(canvasId);
        
        if (!this.canvas) {
            console.error(`NEO3DVisualizer: Canvas with ID '${canvasId}' not found`);
            return;
        }
        
        if (typeof THREE === 'undefined') {
            console.error('NEO3DVisualizer: Three.js not loaded');
            return;
        }
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.earth = null;
        this.neoObjects = [];
        this.cometTrajectory = null;
        this.animationSpeed = 1;
        this.showOrbits = true;
        this.showComet = false;
        this.selectedNEO = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isInitialized = false;
        
        // Wait for DOM and Three.js to be ready
        setTimeout(() => this.init(), 100);
    }
    
    init() {
        try {
            console.log('NEO3DVisualizer: Starting initialization...');
            
            // Verify canvas dimensions
            if (this.canvas.clientWidth === 0 || this.canvas.clientHeight === 0) {
                console.warn('Canvas has zero dimensions, setting default size');
                this.canvas.style.width = '100%';
                this.canvas.style.height = '600px';
            }
            
            // Scene setup
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x000011);
            
            // Camera setup
            const aspect = this.canvas.clientWidth / this.canvas.clientHeight || 1.33;
            this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 10000);
            this.camera.position.set(0, 0, 500);
            this.camera.lookAt(0, 0, 0);
            
            // Renderer setup with error handling
            this.renderer = new THREE.WebGLRenderer({ 
                canvas: this.canvas, 
                antialias: true,
                alpha: true,
                preserveDrawingBuffer: true
            });
            
            this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            // Setup scene components
            this.setupLighting();
            this.createEarth();
            this.createStarfield();
            this.setupControls();
            this.setupEventListeners();
            
            // Start animation loop
            this.animate();
            
            this.isInitialized = true;
            console.log('NEO3DVisualizer: Initialization complete');
            
            // Trigger initial render
            this.renderer.render(this.scene, this.camera);
            
        } catch (error) {
            console.error('NEO3DVisualizer: Initialization failed:', error);
            this.showError('3D visualization initialization failed. Please ensure WebGL is supported.');
        }
    }
    
    showError(message) {
        const canvas = this.canvas;
        if (canvas && canvas.parentNode) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'neo-3d-error';
            errorDiv.innerHTML = `
                <div class="error-content">
                    <h4>⚠️ 3D Visualization Error</h4>
                    <p>${message}</p>
                    <button onclick="location.reload()">Reload Page</button>
                </div>
            `;
            canvas.parentNode.insertBefore(errorDiv, canvas.nextSibling);
        }
    }
    
    setupLighting() {
        // Ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Main directional light (Sun)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        sunLight.position.set(500, 200, 300);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 1024;
        sunLight.shadow.mapSize.height = 1024;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 2000;
        this.scene.add(sunLight);
        
        // Point light at Earth center
        const earthLight = new THREE.PointLight(0x4488ff, 0.3, 1000);
        earthLight.position.set(0, 0, 0);
        this.scene.add(earthLight);
    }
    
    createEarth() {
        console.log('Creating Earth model...');
        
        const earthGeometry = new THREE.SphereGeometry(50, 32, 32);
        
        // Enhanced Earth material
        const earthMaterial = new THREE.MeshPhongMaterial({
            color: 0x2563eb,
            shininess: 30,
            transparent: false
        });
        
        this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
        this.earth.receiveShadow = true;
        this.earth.castShadow = true;
        this.scene.add(this.earth);
        
        // Earth atmosphere glow effect
        const glowGeometry = new THREE.SphereGeometry(55, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        const earthGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.scene.add(earthGlow);
        
        console.log('Earth model created successfully');
    }
    
    createStarfield() {
        console.log('Creating starfield...');
        
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 1000; // Reduced for performance
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2000;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1.5,
            transparent: true,
            opacity: 0.8
        });
        
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
        
        console.log('Starfield created successfully');
    }
    
    setupControls() {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
            this.canvas.style.cursor = 'grabbing';
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaMove = {
                    x: e.clientX - previousMousePosition.x,
                    y: e.clientY - previousMousePosition.y
                };
                
                // Rotate camera around Earth
                const spherical = new THREE.Spherical();
                spherical.setFromVector3(this.camera.position);
                spherical.theta -= deltaMove.x * 0.01;
                spherical.phi += deltaMove.y * 0.01;
                spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
                
                this.camera.position.setFromSpherical(spherical);
                this.camera.lookAt(0, 0, 0);
                
                previousMousePosition = { x: e.clientX, y: e.clientY };
            } else {
                // Update mouse position for raycasting
                const rect = this.canvas.getBoundingClientRect();
                this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            isDragging = false;
            this.canvas.style.cursor = 'grab';
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            isDragging = false;
            this.canvas.style.cursor = 'grab';
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 20;
            const distance = this.camera.position.length();
            const newDistance = distance + (e.deltaY * zoomSpeed);
            
            if (newDistance > 150 && newDistance < 1500) {
                this.camera.position.multiplyScalar(newDistance / distance);
            }
        });
        
        // Click to select NEO
        this.canvas.addEventListener('click', (e) => {
            if (!isDragging) {
                this.onNEOClick(e);
            }
        });
        
        // Set initial cursor
        this.canvas.style.cursor = 'grab';
        
        console.log('Controls setup complete');
    }
    
    setupEventListeners() {
        // Resize handler with debouncing
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.onResize(), 100);
        });
    }
    
    onResize() {
        if (!this.renderer || !this.camera) return;
        
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        
        console.log(`Resized to ${width}x${height}`);
    }
    
    onNEOClick(event) {
        if (!this.isInitialized) return;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersectObjects = this.neoObjects.map(neo => neo.mesh).filter(mesh => mesh);
        const intersects = this.raycaster.intersectObjects(intersectObjects);
        
        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            const neoData = this.neoObjects.find(neo => neo.mesh === clickedObject);
            if (neoData) {
                this.selectNEO(neoData);
            }
        }
    }
    
    selectNEO(neoObj) {
        // Deselect previous
        if (this.selectedNEO && this.selectedNEO.mesh) {
            this.selectedNEO.mesh.material.emissive.setHex(0x000000);
        }
        
        this.selectedNEO = neoObj;
        
        // Highlight selected NEO
        if (neoObj.mesh && neoObj.mesh.material) {
            neoObj.mesh.material.emissive.setHex(0x333333);
        }
        
        // Update info panel
        this.updateInfoPanel(neoObj.data);
        
        console.log('Selected NEO:', neoObj.data.name);
    }
    
    updateInfoPanel(neoData) {
        const infoPanel = document.getElementById('neoDetails');
        if (!infoPanel) return;
        
        const diameter = neoData.estimated_diameter?.meters;
        const approach = neoData.close_approach_data?.[0];
        
        infoPanel.innerHTML = `
            <div class="neo-selected-info">
                <h5>${neoData.name}</h5>
                <div class="neo-detail-grid">
                    <div><strong>Diameter:</strong> ${diameter ? `${diameter.estimated_diameter_min.toFixed(0)}-${diameter.estimated_diameter_max.toFixed(0)}m` : 'Unknown'}</div>
                    <div><strong>Velocity:</strong> ${approach ? `${parseFloat(approach.relative_velocity.kilometers_per_hour).toLocaleString()} km/h` : 'Unknown'}</div>
                    <div><strong>Distance:</strong> ${approach ? `${parseFloat(approach.miss_distance.kilometers).toLocaleString()} km` : 'Unknown'}</div>
                    <div><strong>Hazardous:</strong> ${neoData.is_potentially_hazardous_asteroid ? '⚠️ Yes' : '✅ No'}</div>
                </div>
                ${neoData.sourceLinks ? `
                    <div class="neo-source-links">
                        <a href="${neoData.sourceLinks.jpl_ssd}" target="_blank" rel="noopener">View on JPL Database</a>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    addNEOData(neoData) {
        if (!this.isInitialized) {
            console.warn('3D Visualizer not initialized, cannot add NEO data');
            return;
        }
        
        console.log('Adding NEO data to 3D visualization...');
        
        // Clear existing NEOs
        this.clearNEOs();
        
        let neoCount = 0;
        const maxNEOs = 50; // Reduced for better performance
        
        for (const date in neoData.near_earth_objects) {
            const objects = neoData.near_earth_objects[date];
            
            objects.forEach(neo => {
                if (neoCount >= maxNEOs) return;
                
                // Create 3D position data if not present
                if (!neo.position3D && neo.close_approach_data?.[0]) {
                    const approach = neo.close_approach_data[0];
                    const distance = parseFloat(approach.miss_distance.astronomical) || 0.1;
                    const angle = Math.random() * Math.PI * 2;
                    
                    neo.position3D = {
                        x: Math.cos(angle) * distance * 150,
                        y: Math.sin(angle) * distance * 150,
                        z: (Math.random() - 0.5) * distance * 100,
                        distance: distance,
                        velocity: parseFloat(approach.relative_velocity.kilometers_per_second) || 1
                    };
                }
                
                if (neo.position3D) {
                    this.createNEOObject(neo);
                    neoCount++;
                }
            });
        }
        
        console.log(`Added ${neoCount} NEO objects to 3D visualization`);
        
        // Update stats
        this.updateNEOStats(neoCount);
    }
    
    createNEOObject(neoData) {
        try {
            const diameter = neoData.estimated_diameter?.meters?.estimated_diameter_max || 100;
            const radius = Math.max(2, Math.min(15, Math.log(diameter + 1) * 2)); // Better scaling
            
            const geometry = new THREE.SphereGeometry(radius, 16, 16);
            const color = neoData.is_potentially_hazardous_asteroid ? 0xff4444 : 0x44aa44;
            const material = new THREE.MeshPhongMaterial({
                color: color,
                shininess: 50,
                transparent: true,
                opacity: 0.85
            });
            
            const neoMesh = new THREE.Mesh(geometry, material);
            neoMesh.position.set(
                neoData.position3D.x,
                neoData.position3D.y,
                neoData.position3D.z
            );
            
            // Add to scene and tracking array
            this.scene.add(neoMesh);
            this.neoObjects.push({ mesh: neoMesh, data: neoData });
            
            // Add orbit path if enabled
            if (this.showOrbits) {
                this.createOrbitPath(neoData, neoMesh.position);
            }
            
            // Add warning glow for hazardous asteroids
            if (neoData.is_potentially_hazardous_asteroid) {
                this.addHazardousGlow(neoMesh, radius);
            }
            
        } catch (error) {
            console.error('Error creating NEO object:', error);
        }
    }
    
    addHazardousGlow(neoMesh, radius) {
        const glowGeometry = new THREE.SphereGeometry(radius * 1.5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4444,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(neoMesh.position);
        this.scene.add(glow);
    }
    
    createOrbitPath(neoData, position) {
        const points = [];
        const distance = position.length();
        const segments = 32; // Reduced for performance
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance * 0.8; // Slightly elliptical
            const z = Math.sin(angle * 1.5) * distance * 0.1; // Z variation
            points.push(new THREE.Vector3(x, y, z));
        }
        
        const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const orbitMaterial = new THREE.LineBasicMaterial({
            color: neoData.is_potentially_hazardous_asteroid ? 0xff6666 : 0x666666,
            transparent: true,
            opacity: 0.4
        });
        
        const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
        this.scene.add(orbitLine);
    }
    
    addCometTrajectory(cometData) {
        if (!this.isInitialized || !cometData.trajectory) {
            console.warn('Cannot add comet trajectory - not initialized or no data');
            return;
        }
        
        console.log('Adding comet 3I/Atlas trajectory...');
        
        // Clear existing comet
        if (this.cometTrajectory) {
            this.scene.remove(this.cometTrajectory.line);
            this.scene.remove(this.cometTrajectory.comet);
            if (this.cometTrajectory.tail) {
                this.scene.remove(this.cometTrajectory.tail);
            }
        }
        
        const points = cometData.trajectory.map(point => 
            new THREE.Vector3(point.position.x, point.position.y, point.position.z)
        );
        
        // Create trajectory line
        const trajectoryGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const trajectoryMaterial = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8
        });
        
        const trajectoryLine = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
        this.scene.add(trajectoryLine);
        
        // Create comet object
        const cometGeometry = new THREE.SphereGeometry(6, 16, 16);
        const cometMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        
        const comet = new THREE.Mesh(cometGeometry, cometMaterial);
        
        // Position comet
        if (points.length > 0) {
            const currentIndex = Math.floor(points.length * 0.3);
            comet.position.copy(points[currentIndex]);
        }
        
        this.scene.add(comet);
        
        this.cometTrajectory = {
            line: trajectoryLine,
            comet: comet,
            data: cometData
        };
        
        console.log('Comet trajectory added successfully');
    }
    
    updateNEOStats(count) {
        const statsDiv = document.getElementById('neoStats');
        if (statsDiv) {
            statsDiv.innerHTML = `
                <div class="neo-3d-stats">
                    <span>🌍 Showing ${count} NEOs in 3D visualization</span>
                </div>
            `;
        }
    }
    
    clearNEOs() {
        this.neoObjects.forEach(neoObj => {
            if (neoObj.mesh) {
                this.scene.remove(neoObj.mesh);
            }
        });
        this.neoObjects = [];
        this.selectedNEO = null;
    }
    
    setAnimationSpeed(speed) {
        this.animationSpeed = Math.max(0.1, Math.min(5, parseFloat(speed) || 1));
        console.log(`Animation speed set to: ${this.animationSpeed}`);
    }
    
    toggleOrbits(show) {
        this.showOrbits = show;
        console.log(`Orbits ${show ? 'enabled' : 'disabled'}`);
    }
    
    toggleComet(show) {
        this.showComet = show;
        if (this.cometTrajectory) {
            this.cometTrajectory.line.visible = show;
            this.cometTrajectory.comet.visible = show;
            if (this.cometTrajectory.tail) {
                this.cometTrajectory.tail.visible = show;
            }
        }
        console.log(`Comet visibility: ${show}`);
    }
    
    resetView() {
        if (!this.camera) return;
        
        this.camera.position.set(0, 0, 500);
        this.camera.lookAt(0, 0, 0);
        
        if (this.selectedNEO && this.selectedNEO.mesh) {
            this.selectedNEO.mesh.material.emissive.setHex(0x000000);
            this.selectedNEO = null;
        }
        
        const infoPanel = document.getElementById('neoDetails');
        if (infoPanel) {
            infoPanel.innerHTML = 'Select a NEO to view details';
        }
        
        console.log('View reset to default position');
    }
    
    animate() {
        if (!this.isInitialized || !this.renderer || !this.scene || !this.camera) {
            return;
        }
        
        requestAnimationFrame(() => this.animate());
        
        try {
            // Rotate Earth
            if (this.earth) {
                this.earth.rotation.y += 0.003 * this.animationSpeed;
            }
            
            // Animate NEO objects
            this.neoObjects.forEach(neoObj => {
                if (neoObj.mesh && neoObj.data.position3D) {
                    const speed = neoObj.data.position3D.velocity || 1;
                    neoObj.mesh.rotation.y += 0.005 * speed * this.animationSpeed;
                }
            });
            
            // Animate comet if present
            if (this.cometTrajectory && this.showComet && this.cometTrajectory.comet) {
                this.cometTrajectory.comet.rotation.y += 0.02 * this.animationSpeed;
            }
            
            // Render the scene
            this.renderer.render(this.scene, this.camera);
            
        } catch (error) {
            console.error('Animation error:', error);
        }
    }
    
    destroy() {
        console.log('Destroying NEO 3D Visualizer...');
        
        this.isInitialized = false;
        
        // Clear NEO objects
        this.clearNEOs();
        
        // Clean up Three.js resources
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        
        if (this.scene) {
            // Remove all objects from scene
            while(this.scene.children.length > 0) {
                this.scene.remove(this.scene.children[0]);
            }
            this.scene = null;
        }
        
        this.camera = null;
        this.earth = null;
        this.cometTrajectory = null;
        
        console.log('NEO 3D Visualizer destroyed');
    }
}

export default NEO3DVisualizer;
