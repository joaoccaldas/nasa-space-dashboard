// CaldaSpace - 3D NEO Visualization Module (Fixed)
// Advanced Three.js implementation for Near Earth Objects and comet visualization
export class NEO3DVisualizer {
  constructor(canvasId) {
    this.canvasId = canvasId;
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error(`NEO3DVisualizer: Canvas with ID '${canvasId}' not found`);
      return;
    }
    // Defer init until THREE and canvas are ready
    this.isInitialized = false;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.earth = null;
    this.neoObjects = [];
    this.orbitLines = [];
    this.animationSpeed = 1;
    // Defensive: wait repeatedly for THREE to exist
    let attempts = 0;
    const waitForThree = () => {
      if (typeof THREE !== 'undefined' && this.canvas) {
        this.init();
      } else if (attempts < 20) {
        attempts++;
        setTimeout(waitForThree, 100);
      } else {
        console.error('NEO3DVisualizer: Three.js not loaded after waiting.');
      }
    };
    waitForThree();
  }

  init() {
    if (this.isInitialized) return;
    try {
      // Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x000510);

      // Camera
      const w = this.canvas.clientWidth || 800;
      const h = this.canvas.clientHeight || 600;
      this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100000);
      this.camera.position.set(0, 300, 800);

      // Renderer
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Lighting
      const ambient = new THREE.AmbientLight(0xffffff, 0.4);
      this.scene.add(ambient);
      const directional = new THREE.DirectionalLight(0xffffff, 0.6);
      directional.position.set(5, 3, 5);
      this.scene.add(directional);

      // Earth
      this.earth = this.#createEarth();
      this.scene.add(this.earth);

      // Controls
      if (typeof THREE.OrbitControls !== 'undefined') {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxDistance = 5000;
      } else {
        console.warn('OrbitControls not loaded - basic camera only.');
      }

      this.isInitialized = true;
      this.animate();
      console.log('NEO3DVisualizer initialized successfully.');
    } catch (err) {
      console.error('NEO3DVisualizer init error:', err);
    }
  }

  #createEarth() {
    const radius = 50;
    const geo = new THREE.SphereGeometry(radius, 64, 64);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1e90ff,
      emissive: 0x112244,
      metalness: 0.2,
      roughness: 0.7,
    });
    return new THREE.Mesh(geo, mat);
  }

  updateNEOData(neos) {
    if (!this.isInitialized || !Array.isArray(neos)) return;
    // Clear old
    this.neoObjects.forEach((m) => this.scene.remove(m));
    this.orbitLines.forEach((l) => this.scene.remove(l));
    this.neoObjects = [];
    this.orbitLines = [];

    // Add new
    neos.forEach((neo, idx) => {
      const mesh = this.#createNeoMesh(neo, idx);
      this.scene.add(mesh);
      this.neoObjects.push(mesh);

      const orbit = this.#createOrbitLine(neo);
      if (orbit) {
        this.scene.add(orbit);
        this.orbitLines.push(orbit);
      }
    });
    console.log(`Updated NEO visualization with ${neos.length} objects.`);
  }

  #createNeoMesh(neo, idx) {
    // Estimate size from diameter or use fallback
    const diaMeter = Number(neo?.estimated_diameter_meters?.estimated_diameter_max) || 50;
    const size = Math.min(Math.max(1, Math.log(diaMeter) * 0.5), 10);

    const geo = new THREE.SphereGeometry(size, 16, 16);
    const color = neo.is_potentially_hazardous_asteroid ? 0xff3333 : 0xffaa00;
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3 });
    const mesh = new THREE.Mesh(geo, mat);

    // Position from provided close_approach_data (basic approximation)
    const cad = Array.isArray(neo?.close_approach_data) ? neo.close_approach_data[0] : null;
    const missKm = Number(cad?.miss_distance?.kilometers) || 3e6; // if missing, far away
    const theta = (idx * 137.5) * (Math.PI / 180);
    const r = Math.log10(Math.max(1, missKm)) * 2; // compress scale
    mesh.position.set(Math.cos(theta) * r * 50, (Math.random() - 0.5) * 20, Math.sin(theta) * r * 50);
    mesh.userData = { neo };
    return mesh;
  }

  #createOrbitLine(neo) {
    try {
      // Try to build a simple elliptical orbit from orbital_data if present
      const od = neo?.orbital_data;
      if (!od) return null;
      const a = Number(od.semi_major_axis) || Number(od.semi_major_axis_au) || 1; // AU
      const e = Math.min(Math.max(Number(od.eccentricity) || 0, 0), 0.99);
      const scale = 150; // pixels per AU
      const points = [];
      const steps = 256;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        const r = (a * (1 - e * e)) / (1 + e * Math.cos(t));
        points.push(new THREE.Vector3(Math.cos(t) * r * scale, 0, Math.sin(t) * r * scale));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: 0x44ffff, transparent: true, opacity: 0.5 });
      return new THREE.LineLoop(geo, mat);
    } catch (e) {
      console.warn('Failed to create orbit line', e);
      return null;
    }
  }

  animate() {
    if (!this.isInitialized) return;
    requestAnimationFrame(() => this.animate());
    // slow earth rotation
    if (this.earth) this.earth.rotation.y += 0.0015 * this.animationSpeed;
    // small motion for NEOs
    for (let i = 0; i < this.neoObjects.length; i++) {
      const m = this.neoObjects[i];
      m.rotation.y += 0.01;
    }
    if (this.controls && this.controls.update) this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

// Export as default for compatibility with 'import NEO3DVisualizer from' syntax
export default NEO3DVisualizer;
