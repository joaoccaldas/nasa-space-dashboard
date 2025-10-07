// CaldaSpace - 3D NEO Visualization Module
// Advanced Three.js implementation for Near Earth Objects and comet visualization

export class NEO3DVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.earth = null;
        this.neoObjects = [];
        this.cometTrajectory = null;
        this.animationSpeed = 1;
        this.showOrbits = true;
        this.showComet = false;
        this.selectedNEO = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.init();
    }
    
    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);
        
        // Camera setup
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 10000);
        this.camera.position.set(0, 0, 500);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Lighting
        this.setupLighting();
        
        // Create Earth
        this.createEarth();
        
        // Create starfield
        this.createStarfield();
        
        // Setup controls (orbit controls simulation)
        this.setupControls();
        
        // Add event listeners
        this.setupEventListeners();
        
        // Start animation loop
        this.animate();
        
        console.log('NEO 3D Visualizer initialized');
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        // Sun light (directional)
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
        sunLight.position.set(500, 200, 300);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 2000;
        this.scene.add(sunLight);
        
        // Point light for Earth
        const earthLight = new THREE.PointLight(0x4488ff, 0.5, 1000);
        earthLight.position.set(0, 0, 0);
        this.scene.add(earthLight);
    }
    
    createEarth() {
        const earthGeometry = new THREE.SphereGeometry(50, 64, 64);
        
        // Create Earth material with texture simulation
        const earthMaterial = new THREE.MeshPhongMaterial({
            color: 0x4488ff,
            shininess: 50,
            transparent: true,
            opacity: 0.9
        });
        
        this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
        this.earth.receiveShadow = true;
        this.earth.castShadow = true;
        this.scene.add(this.earth);
        
        // Earth atmosphere glow
        const glowGeometry = new THREE.SphereGeometry(52, 64, 64);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        const earthGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.scene.add(earthGlow);
        
        // Add Earth's orbit reference (optional)
        const orbitGeometry = new THREE.RingGeometry(240, 245, 64);
        const orbitMaterial = new THREE.MeshBasicMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        const earthOrbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        earthOrbit.rotation.x = Math.PI / 2;
        this.scene.add(earthOrbit);
    }
    
    createStarfield() {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 2000;
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 4000;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 4000;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 4000;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2,
            transparent: true,
            opacity: 0.8
        });
        
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
    }
    
    setupControls() {
        // Simple mouse controls
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
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
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            const zoomSpeed = 0.1;
            const distance = this.camera.position.length();
            const newDistance = distance + (e.deltaY * zoomSpeed);
            
            if (newDistance > 100 && newDistance < 2000) {
                this.camera.position.multiplyScalar(newDistance / distance);
            }
        });
        
        // Click to select NEO
        this.canvas.addEventListener('click', (e) => this.onNEOClick(e));
    }
    
    setupEventListeners() {
        // Resize handler
        window.addEventListener('resize', () => this.onResize());
    }
    
    onResize() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    onNEOClick(event) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.neoObjects.map(neo => neo.mesh));
        
        if (intersects.length > 0) {
            const clickedNEO = intersects[0].object.userData;
            this.selectNEO(clickedNEO);
        }
    }
    
    selectNEO(neoData) {
        // Deselect previous
        if (this.selectedNEO) {
            this.selectedNEO.mesh.material.emissive.setHex(0x000000);
        }
        
        this.selectedNEO = neoData;
        
        // Highlight selected NEO
        neoData.mesh.material.emissive.setHex(0x444444);
        
        // Update info panel
        this.updateInfoPanel(neoData.data);
        
        console.log('Selected NEO:', neoData.data.name);
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
        // Clear existing NEOs
        this.clearNEOs();
        
        let neoCount = 0;
        const maxNEOs = 100; // Limit for performance
        
        for (const date in neoData.near_earth_objects) {
            const objects = neoData.near_earth_objects[date];
            
            objects.forEach(neo => {
                if (neoCount >= maxNEOs) return;
                
                if (neo.position3D) {
                    this.createNEOObject(neo);
                    neoCount++;
                }
            });
        }
        
        console.log(`Added ${neoCount} NEO objects to 3D visualization`);
    }
    
    createNEOObject(neoData) {
        const diameter = neoData.estimated_diameter?.meters?.estimated_diameter_max || 100;
        const radius = Math.log(diameter + 1) * 2 + 1; // Logarithmic scaling for visibility
        
        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshPhongMaterial({
            color: neoData.is_potentially_hazardous_asteroid ? 0xff4444 : 0x44ff44,
            shininess: 50,
            transparent: true,
            opacity: 0.8
        });
        
        const neoMesh = new THREE.Mesh(geometry, material);
        neoMesh.position.set(
            neoData.position3D.x,
            neoData.position3D.y,
            neoData.position3D.z
        );
        
        neoMesh.userData = {
            data: neoData,
            mesh: neoMesh
        };
        
        this.scene.add(neoMesh);
        this.neoObjects.push({ mesh: neoMesh, data: neoData });
        
        // Add orbit path if enabled
        if (this.showOrbits) {
            this.createOrbitPath(neoData);
        }
        
        // Add glow effect for hazardous asteroids
        if (neoData.is_potentially_hazardous_asteroid) {
            const glowGeometry = new THREE.SphereGeometry(radius * 1.3, 16, 16);
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
    }
    
    createOrbitPath(neoData) {
        if (!neoData.position3D) return;
        
        const points = [];
        const center = new THREE.Vector3(0, 0, 0);
        const neoPos = new THREE.Vector3(
            neoData.position3D.x,
            neoData.position3D.y,
            neoData.position3D.z
        );
        
        // Create elliptical orbit approximation
        const distance = neoPos.length();
        const segments = 64;
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance * 0.7; // Elliptical
            const z = Math.sin(angle * 2) * distance * 0.1; // Some Z variation
            points.push(new THREE.Vector3(x, y, z));
        }
        
        const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const orbitMaterial = new THREE.LineBasicMaterial({
            color: neoData.is_potentially_hazardous_asteroid ? 0xff8888 : 0x888888,
            transparent: true,
            opacity: 0.3
        });
        
        const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
        this.scene.add(orbitLine);
    }
    
    addCometTrajectory(cometData) {
        if (!this.showComet || !cometData.trajectory) return;
        
        // Clear existing comet trajectory
        if (this.cometTrajectory) {
            this.scene.remove(this.cometTrajectory.line);
            this.scene.remove(this.cometTrajectory.comet);
        }
        
        const points = cometData.trajectory.map(point => 
            new THREE.Vector3(point.position.x, point.position.y, point.position.z)
        );
        
        // Create trajectory line
        const trajectoryGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const trajectoryMaterial = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            linewidth: 2,
            transparent: true,
            opacity: 0.8
        });
        
        const trajectoryLine = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
        this.scene.add(trajectoryLine);
        
        // Create comet object
        const cometGeometry = new THREE.SphereGeometry(8, 16, 16);
        const cometMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        
        const comet = new THREE.Mesh(cometGeometry, cometMaterial);
        
        // Position comet at current point in trajectory
        if (points.length > 0) {
            const currentIndex = Math.floor(points.length * 0.3); // 30% through trajectory
            comet.position.copy(points[currentIndex]);
        }
        
        this.scene.add(comet);
        
        // Add comet tail effect
        const tailGeometry = new THREE.ConeGeometry(3, 30, 8, 1, true);
        const tailMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ffff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.copy(comet.position);
        tail.lookAt(0, 0, 0); // Point tail away from sun (center)
        this.scene.add(tail);
        
        this.cometTrajectory = {
            line: trajectoryLine,
            comet: comet,
            tail: tail,
            data: cometData
        };
        
        console.log('Added comet 3I/Atlas trajectory');
    }
    
    clearNEOs() {
        this.neoObjects.forEach(neoObj => {
            this.scene.remove(neoObj.mesh);
        });
        this.neoObjects = [];
        this.selectedNEO = null;
    }
    
    setAnimationSpeed(speed) {
        this.animationSpeed = Math.max(0.1, Math.min(5, speed));
    }
    
    toggleOrbits(show) {
        this.showOrbits = show;
        // Implement orbit visibility toggle
    }
    
    toggleComet(show) {
        this.showComet = show;
        if (this.cometTrajectory) {
            this.cometTrajectory.line.visible = show;
            this.cometTrajectory.comet.visible = show;
            this.cometTrajectory.tail.visible = show;
        }
    }
    
    resetView() {
        this.camera.position.set(0, 0, 500);
        this.camera.lookAt(0, 0, 0);
        
        if (this.selectedNEO) {
            this.selectedNEO.mesh.material.emissive.setHex(0x000000);
            this.selectedNEO = null;
        }
        
        const infoPanel = document.getElementById('neoDetails');
        if (infoPanel) {
            infoPanel.innerHTML = 'Select a NEO to view details';
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Rotate Earth
        if (this.earth) {
            this.earth.rotation.y += 0.005 * this.animationSpeed;
        }
        
        // Animate NEO objects
        this.neoObjects.forEach(neoObj => {
            if (neoObj.data.position3D) {
                const time = Date.now() * 0.001;
                const speed = neoObj.data.position3D.velocity || 1;
                neoObj.mesh.rotation.y += 0.01 * speed * this.animationSpeed;
            }
        });
        
        // Animate comet if present
        if (this.cometTrajectory && this.showComet) {
            const time = Date.now() * 0.001;
            this.cometTrajectory.comet.rotation.y += 0.02 * this.animationSpeed;
            
            // Animate comet tail
            if (this.cometTrajectory.tail) {
                this.cometTrajectory.tail.rotation.z += 0.01 * this.animationSpeed;
            }
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    destroy() {
        // Clean up resources
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.onResize);
        
        console.log('NEO 3D Visualizer destroyed');
    }
}

export default NEO3DVisualizer;
