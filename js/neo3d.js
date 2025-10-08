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
    try {
      if (this.isInitialized) return;
      if (typeof THREE === 'undefined') {
        console.error('NEO3DVisualizer: Three.js not available at init');
        return;
      }

      // Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x000010);

      // Camera
      const width = this.canvas.clientWidth || this.canvas.width || 800;
      const height = this.canvas.clientHeight || this.canvas.height || 600;
      this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1e7);
      this.camera.position.set(0, 200, 450);

      // Renderer
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
      this.renderer.setSize(width, height, false);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      // Lights
      const ambient = new THREE.AmbientLight(0xffffff, 0.5);
      this.scene.add(ambient);
      const sun = new THREE.PointLight(0xffffff, 2, 0);
      sun.position.set(0, 0, 0);
      this.scene.add(sun);

      // Earth sphere
      const earthGeo = new THREE.SphereGeometry(50, 32, 32);
      const earthMat = new THREE.MeshPhongMaterial({ color: 0x1e90ff, emissive: 0x001133, shininess: 10 });
      this.earth = new THREE.Mesh(earthGeo, earthMat);
      this.scene.add(this.earth);

      // Stars background
      this.#addStars();

      // Resize handling
      window.addEventListener('resize', () => this.#onResize());
      this.#onResize();

      // Basic orbit controls if available
      if (THREE.OrbitControls) {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
      }

      this.isInitialized = true;
      this.animate();
    } catch (err) {
      console.error('NEO3DVisualizer init error:', err);
    }
  }

  #onResize() {
    if (!this.camera || !this.renderer) return;
    const width = this.canvas.clientWidth || this.canvas.parentElement?.clientWidth || 800;
    const height = this.canvas.clientHeight || this.canvas.parentElement?.clientHeight || 600;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  #addStars() {
    try {
      const starGeo = new THREE.BufferGeometry();
      const count = 2000;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 0] = (Math.random() - 0.5) * 8000;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 8000;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 8000;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1, sizeAttenuation: true });
      const stars = new THREE.Points(starGeo, starMat);
      this.scene.add(stars);
    } catch (e) {
      console.warn('Failed to add stars background', e);
    }
  }

  clearNEOs() {
    for (const obj of this.neoObjects) this.scene.remove(obj);
    for (const line of this.orbitLines) this.scene.remove(line);
    this.neoObjects = [];
    this.orbitLines = [];
  }

  // Public API to load NEO list from data
  setNEOData(neoArray) {
    if (!Array.isArray(neoArray)) {
      console.warn('setNEOData: invalid data, expected array');
      return;
    }
    this.clearNEOs();
    neoArray.forEach((neo, idx) => {
      try {
        const mesh = this.#createNEOSphere(neo, idx);
        this.neoObjects.push(mesh);
        this.scene.add(mesh);
        const orbit = this.#createOrbitLine(neo);
        if (orbit) {
          this.orbitLines.push(orbit);
          this.scene.add(orbit);
        }
      } catch (e) {
        console.warn('Failed adding NEO', neo?.name || idx, e);
      }
    });
  }

  #createNEOSphere(neo, idx) {
    const sizeKm = Number(neo?.estimated_diameter_kilometers?.estimated_diameter_max) || 0.2;
    const radius = Math.max(1.5, Math.min(6, sizeKm * 2));
    const color = neo?.is_potentially_hazardous_asteroid ? 0xff5555 : 0xffcc00;
    const geo = new THREE.SphereGeometry(radius, 16, 16);
    const mat = new THREE.MeshStandardMaterial({ color, emissive: 0x110000 });
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
