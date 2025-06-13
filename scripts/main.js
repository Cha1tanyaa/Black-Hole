class BlackHole {
    constructor() {
        this.shaders = { vert: null, frag: null };
        this.init().catch(e => this.showError(e));
    }

    async init() {
        await this.loadShaders();
        this.setupThreeJS();
        this.setupEvents();
        this.animate();
    }

    async loadShaders() {
        [this.shaders.vert, this.shaders.frag] = await Promise.all([
            fetch('shaders/shader.vert').then(r => r.text()),
            fetch('shaders/shader.frag').then(r => r.text())
        ]);
    }

    setupThreeJS() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        
        this.renderer.setSize(innerWidth, innerHeight);
        this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        document.body.appendChild(this.renderer.domElement);

        this.plane = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            new THREE.ShaderMaterial({
                vertexShader: this.shaders.vert,
                fragmentShader: this.shaders.frag,
                uniforms: {
                    u_time: { value: 0 },
                    u_mouse: { value: new THREE.Vector2() },
                    u_resolution: { value: new THREE.Vector2(innerWidth, innerHeight) }
                }
            })
        );
        
        this.scene.add(this.plane);
        this.camera.position.z = 1;
    }

    setupEvents() {
        addEventListener('resize', () => {
            this.camera.aspect = innerWidth/innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(innerWidth, innerHeight);
            this.plane.material.uniforms.u_resolution.value.set(innerWidth, innerHeight);
        });

        const updateMouse = e => {
            const { clientX: x, clientY: y } = e.touches?.[0] || e;
            this.plane.material.uniforms.u_mouse.value.set(x, innerHeight - y);
        };
        
        addEventListener('mousemove', updateMouse);
        addEventListener('touchmove', e => { e.preventDefault(); updateMouse(e) }, { passive: false });
    }

    animate() {
        let lastFrame = performance.now();
        const update = now => {
            this.plane.material.uniforms.u_time.value = now/1000;
            document.getElementById('fpsCounter').textContent = 
                `${Math.round(1000/(now - lastFrame))} FPS`;
            lastFrame = now;
            this.renderer.render(this.scene, this.camera);
            requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    }

    showError(e) {
        document.getElementById('info').innerHTML = `
            <p style="color: #ff4444">Error: ${e.message}</p>
            <p>Check console for details</p>`;
    }
}

new BlackHole();