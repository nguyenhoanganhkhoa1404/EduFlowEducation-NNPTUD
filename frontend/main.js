import COMPONENTS from './components.js';

const API_BASE = 'http://localhost:3000/api/v1';

const app = {
    state: {
        user: null,
        enrollments: JSON.parse(localStorage.getItem('enrollments')) || [],
        token: localStorage.getItem('token'),
        currentPath: window.location.hash || '#/'
    },

    init: async function() {
        console.log('🚀 EduFlow Initializing...');
        this.bindEvents();
        await this.checkAuth();
        this.updateEnrollmentUI();
        this.handleRoute();
    },

    bindEvents: function() {
        window.addEventListener('hashchange', () => {
            this.state.currentPath = window.location.hash || '#/';
            this.handleRoute();
        });

        document.getElementById('global-search')?.addEventListener('input', (e) => {
            this.debounce(() => this.searchCourses(e.target.value), 500)();
        });
    },

    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    checkAuth: async function() {
        if (!this.state.token) return;
        try {
            const res = await fetch(`${API_BASE}/auth/me`, {
                headers: { 'Authorization': `Bearer ${this.state.token}` }
            });
            if (!res.ok) throw new Error('Auth failed');
            const data = await res.json();
            if (data.success) {
                this.state.user = data.data;
                this.updateAuthUI();
            } else {
                this.logout();
            }
        } catch (err) {
            console.error('Auth Check Error:', err);
            this.logout();
        }
    },

    updateAuthUI: function() {
        if (this.state.user) {
            document.getElementById('login-nav-btn')?.classList.add('hidden');
            document.getElementById('user-profile-menu')?.classList.remove('hidden');
        } else {
            document.getElementById('login-nav-btn')?.classList.remove('hidden');
            document.getElementById('user-profile-menu')?.classList.add('hidden');
        }
    },

    logout: function() {
        localStorage.removeItem('token');
        this.state.token = null;
        this.state.user = null;
        this.updateAuthUI();
        this.navigateTo('/');
        COMPONENTS.notification('Logged out successfully', 'success');
    },

    navigateTo: function(path) {
        window.location.hash = path;
    },

    handleRoute: async function() {
        const main = document.getElementById('main-content');
        const path = this.state.currentPath.slice(1) || '/';

        if (path === '/' || path === '/home' || path === '/courses') {
            await this.renderHome();
        } else if (path === '/login') {
            this.renderLogin();
        } else if (path.startsWith('/course/')) {
            const id = path.split('/')[2];
            await this.renderCourseDetails(id);
        } else if (path === '/enrollments') {
            await this.renderEnrollments();
        } else if (path === '/profile') {
            this.renderProfile();
        } else {
            main.innerHTML = '<div style="padding: 8rem; text-align: center;"><h1>404 Not Found</h1><button class="btn btn-primary" onclick="app.navigateTo(\'/\')">Back to Home</button></div>';
        }
    },

    renderHome: async function() {
        const main = document.getElementById('main-content');
        main.innerHTML = `
            <section class="hero">
                <div class="container hero-content">
                    <h1>Learn Without Limits.</h1>
                    <p>Unlock new skills with curated courses from world-class instructors.</p>
                    <button class="btn btn-primary" onclick="app.navigateTo('/courses')">Explore Courses</button>
                </div>
            </section>
            <div id="course-grid" class="grid"></div>
        `;

        try {
            const res = await fetch(`${API_BASE}/courses`);
            const data = await res.json();
            if (data.success) {
                const grid = document.getElementById('course-grid');
                grid.innerHTML = data.data.map(p => COMPONENTS.courseCard(p)).join('');
            }
        } catch (err) {
            COMPONENTS.notification('Failed to load courses', 'error');
        }
    },

    renderLogin: function() {
        const main = document.getElementById('main-content');
        main.innerHTML = `
            <div class="auth-container">
                <div class="auth-header">
                    <h2>Welcome Back</h2>
                    <p>Sign in to continue your learning journey</p>
                </div>
                <form id="login-form">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" id="login-username" name="username" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="login-password" name="password" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%">Sign In</button>
                </form>
            </div>
        `;

        document.getElementById('login-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = e.target.username.value;
            const password = e.target.password.value;

            try {
                const res = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (data.success) {
                    localStorage.setItem('token', data.token);
                    this.state.token = data.token;
                    await this.checkAuth();
                    this.navigateTo('/');
                    COMPONENTS.notification('Login successful!', 'success');
                } else {
                    COMPONENTS.notification(data.message || 'Login failed', 'error');
                }
            } catch (err) {
                COMPONENTS.notification('Network error during login', 'error');
            }
        });
    },

    renderCourseDetails: async function(id) {
        const main = document.getElementById('main-content');
        main.innerHTML = COMPONENTS.loader();

        try {
            const res = await fetch(`${API_BASE}/courses/${id}`);
            const data = await res.json();
            if (data.success) {
                const p = data.data;
                main.innerHTML = `
                    <div class="course-details" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 4rem; padding: 4rem 0;">
                        <div class="course-gallery">
                            <img src="${p.images[0].startsWith('http') ? p.images[0] : 'http://localhost:3000' + p.images[0]}" 
                                 style="width: 100%; border-radius: 20px; box-shadow: var(--shadow-lg);">
                        </div>
                        <div class="course-info-detailed">
                            <span class="course-subject">${p.subject?.name || 'Education'}</span>
                            <h1 style="font-size: clamp(2rem, 5vw, 3.5rem); margin: 1rem 0; line-height: 1.1;">${p.courseName}</h1>
                            <p style="font-size: 1.25rem; color: var(--gray-600); margin-bottom: 2.5rem; line-height: 1.8;">${p.description}</p>
                            <div class="course-price" style="font-size: 2.5rem; margin-bottom: 2.5rem; font-weight: 800; color: var(--primary);">${p.price.toLocaleString()} VND</div>
                            
                            <div style="display: flex; gap: 1rem;">
                                <button class="btn btn-primary" style="padding: 1.25rem 3rem; font-size: 1.1rem; flex: 1;" onclick="app.enrollInCourse('${p._id}')">
                                    <i class="fas fa-graduation-cap"></i> Enroll Now
                                </button>
                                <button class="btn btn-outline" style="padding: 1rem 1.5rem;">
                                    <i class="far fa-heart"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (err) {
            COMPONENTS.notification('Failed to load course details', 'error');
        }
    },

    renderEnrollments: async function() {
        const main = document.getElementById('main-content');
        main.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 350px; gap: 4rem; padding: 4rem 0;">
                <div>
                    <section id="cart-section" style="margin-bottom: 4rem;">
                        <h2 style="margin-bottom: 2rem;"><i class="fas fa-shopping-cart"></i> New Enrollment</h2>
                        <div id="enrollment-items-list">${COMPONENTS.loader()}</div>
                    </section>
                    
                    <section id="active-enrollments-section">
                        <h2 style="margin-bottom: 2rem;"><i class="fas fa-history"></i> My Learning Path</h2>
                        <div id="active-enrollments-list">${COMPONENTS.loader()}</div>
                    </section>
                </div>
                
                <div class="enrollment-summary" style="background: white; padding: 2.5rem; border-radius: 24px; box-shadow: var(--shadow-lg); position: sticky; top: 100px; height: fit-content;">
                    <h3 style="margin-bottom: 2rem;">Checkout Summary</h3>
                    <div id="enrollment-summary-details" style="margin: 2rem 0;">
                        <!-- Summary here -->
                    </div>
                    <button class="btn btn-primary" id="checkout-btn" style="width: 100%; padding: 1.25rem; font-size: 1.1rem;" onclick="app.checkout()">
                        Complete Enrollment
                    </button>
                </div>
            </div>
        `;

        await this.loadEnrollmentDetails();
        await this.loadActiveEnrollments();
    },

    loadEnrollmentDetails: async function() {
        const list = document.getElementById('enrollment-items-list');
        const summary = document.getElementById('enrollment-summary-details');

        if (this.state.enrollments.length === 0) {
            if (list) list.innerHTML = '<p style="color: var(--gray-500); padding: 2rem; background: white; border-radius: 16px; border: 2px dashed var(--gray-200);">Your cart is empty. Add courses to start learning!</p>';
            if (summary) summary.innerHTML = '<p>Nothing to process</p>';
            const checkoutBtn = document.getElementById('checkout-btn');
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }

        try {
            const coursePromises = this.state.enrollments.map(item => fetch(`${API_BASE}/courses/${item.courseId}`).then(r => r.json()));
            const results = await Promise.all(coursePromises);
            
            let total = 0;
            const itemsHtml = results.map((res, index) => {
                if (!res.success) return '';
                const p = res.data;
                total += p.price;
                return `
                    <div class="cart-item" style="display: flex; gap: 2rem; background: white; padding: 1.5rem; border-radius: 16px; margin-bottom: 1.5rem; border: 1px solid var(--gray-100);">
                        <img src="${p.images[0].startsWith('http') ? p.images[0] : 'http://localhost:3000' + p.images[0]}" 
                             style="width: 80px; height: 80px; border-radius: 12px; object-fit: cover;">
                        <div style="flex: 1;">
                            <h4 style="font-size: 1rem; margin-bottom: 0.25rem;">${p.courseName}</h4>
                            <p style="color: var(--primary); font-weight: 700;">${p.price.toLocaleString()} VND</p>
                        </div>
                        <button onclick="app.removeItem('${p._id}')" class="btn-icon" style="color: var(--error);"><i class="fas fa-trash"></i></button>
                    </div>
                `;
            }).join('');

            if (list) list.innerHTML = itemsHtml;
            if (summary) summary.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 1.25rem; color: var(--gray-600);">
                    <span>Enrollment Fees</span>
                    <span>${total.toLocaleString()} VND</span>
                </div>
                <hr style="border: none; border-top: 1px solid var(--border); margin: 1.5rem 0;">
                <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1.5rem;">
                    <span>Total</span>
                    <span style="color: var(--primary);">${total.toLocaleString()} VND</span>
                </div>
            `;
        } catch (err) {
            if (list) list.innerHTML = '<p>Error loading items.</p>';
        }
    },

    loadActiveEnrollments: async function() {
        const list = document.getElementById('active-enrollments-list');
        if (!this.state.user) {
            list.innerHTML = '<p style="color: var(--gray-500);">Please sign in to see your active enrollments.</p>';
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/enrollments/my`, {
                headers: { 'Authorization': `Bearer ${this.state.token}` }
            });
            const data = await res.json();
            if (data.success && data.data.length > 0) {
                list.innerHTML = data.data.map(enrollment => `
                    <div class="enrollment-card" style="background: white; padding: 2rem; border-radius: 20px; margin-bottom: 1.5rem; box-shadow: var(--shadow-sm); border: 1px solid var(--gray-100);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                            <div>
                                <span style="font-size: 0.8rem; color: var(--gray-500);">Order #${enrollment._id.slice(-6)}</span>
                                <h4 style="margin-top: 0.25rem;">${enrollment.items.length} Course(s)</h4>
                            </div>
                            <span class="badge ${enrollment.paymentStatus === 'Paid' ? 'badge-paid' : 'badge-unpaid'}">
                                ${enrollment.paymentStatus}
                            </span>
                        </div>
                        
                        <div style="margin-bottom: 1.5rem;">
                            ${enrollment.items.map(item => `
                                <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.5rem;">
                                    <span>${item.course?.courseName || 'Course'}</span>
                                    <button onclick="app.removeSpecificItem('${enrollment._id}', '${item.course?.courseCode}')" style="background:none; color:var(--error); font-size:0.7rem;">Remove</button>
                                </div>
                            `).join('')}
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1.5rem; border-top: 1px solid var(--gray-100);">
                            <span style="font-weight: 700; color: var(--primary);">${enrollment.finalAmount.toLocaleString()} VND</span>
                            <div style="display: flex; gap: 0.5rem;">
                                ${enrollment.paymentStatus === 'Unpaid' ? `
                                    <button class="btn btn-primary btn-sm" onclick="app.payNow('${enrollment._id}')">Pay Now</button>
                                    <button class="btn btn-outline btn-sm" style="color:var(--error); border-color:var(--error);" onclick="app.cancelEnrollment('${enrollment._id}')">Cancel</button>
                                ` : `
                                    <button class="btn btn-outline btn-sm" disabled>View Course</button>
                                `}
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                list.innerHTML = '<p style="color: var(--gray-500);">No active enrollments found.</p>';
            }
        } catch (err) {
            list.innerHTML = '<p>Error loading enrollments.</p>';
        }
    },

    removeItem: function(courseId) {
        this.state.enrollments = this.state.enrollments.filter(i => i.courseId !== courseId);
        localStorage.setItem('enrollments', JSON.stringify(this.state.enrollments));
        this.updateEnrollmentUI();
        this.renderEnrollments();
        COMPONENTS.notification('Removed from cart', 'info');
    },

    removeSpecificItem: async function(enrollmentId, courseCode) {
        if (!confirm(`Remove ${courseCode} from this enrollment?`)) return;
        try {
            const res = await fetch(`${API_BASE}/enrollments/${enrollmentId}/items/${courseCode}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.state.token}` }
            });
            const data = await res.json();
            if (data.success) {
                COMPONENTS.notification(data.message, 'success');
                this.renderEnrollments();
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            COMPONENTS.notification(err.message, 'error');
        }
    },

    renderProfile: function() {
        if (!this.state.user) {
            this.navigateTo('/login');
            return;
        }
        const main = document.getElementById('main-content');
        main.innerHTML = `
            <div style="max-width: 800px; margin: 6rem auto;">
                <h1 style="margin-bottom: 4rem; text-align: center;">Student Dashboard</h1>
                <div style="background: white; padding: 4rem; border-radius: 32px; box-shadow: var(--shadow-lg);">
                    <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 4rem; text-align: center;">
                        <div style="width: 100px; height: 100px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: white; margin-bottom: 1.5rem;">
                            ${this.state.user.username[0].toUpperCase()}
                        </div>
                        <h2 style="font-size: 1.75rem;">${this.state.user.username}</h2>
                        <p style="color: var(--gray-500);">${this.state.user.email || 'Verified Learner'}</p>
                    </div>
                    <div style="display: grid; gap: 1.5rem;">
                        <button class="btn btn-outline" style="width: 100%; justify-content: space-between; padding: 1.25rem 2rem;" onclick="app.navigateTo('/enrollments')">
                            <span>My Courses</span>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="btn btn-outline" style="width: 100%; justify-content: space-between; padding: 1.25rem 2rem; color: var(--error); border-color: var(--error);" onclick="app.logout()">
                            <span>Logout</span>
                            <i class="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    enrollInCourse: function(courseId) {
        const item = this.state.enrollments.find(i => i.courseId === courseId);
        if (!item) {
            this.state.enrollments.push({ courseId, quantity: 1 });
        }
        localStorage.setItem('enrollments', JSON.stringify(this.state.enrollments));
        this.updateEnrollmentUI();
        COMPONENTS.notification('Added to learning path', 'success');
    },

    updateEnrollmentUI: function() {
        const count = this.state.enrollments.length;
        const countBadges = document.querySelectorAll('.cart-count');
        countBadges.forEach(b => b.textContent = count);
    },

    searchCourses: async function(query) {
        if (!query) return this.renderHome();
        try {
            const res = await fetch(`${API_BASE}/courses?search=${query}`);
            const data = await res.json();
            const grid = document.getElementById('course-grid');
            if (grid && data.success) {
                grid.innerHTML = data.data.map(p => COMPONENTS.courseCard(p)).join('');
            }
        } catch (err) {
            console.error('Search error:', err);
        }
    },

    checkout: async function() {
        if (!this.state.user) {
            COMPONENTS.notification('Please sign in to complete enrollment', 'error');
            this.navigateTo('/login');
            return;
        }
        
        if (this.state.enrollments.length === 0) return;

        try {
            const res = await fetch(`${API_BASE}/enrollments`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.state.token}`
                },
                body: JSON.stringify({
                    items: this.state.enrollments.map(i => ({ course: i.courseId, quantity: 1 })),
                    paymentMethod: 'BankTransfer'
                })
            });
            const data = await res.json();
            if (data.success) {
                this.state.enrollments = [];
                localStorage.setItem('enrollments', '[]');
                this.updateEnrollmentUI();
                await this.renderEnrollments();
                COMPONENTS.notification('Enrollment created successfully!', 'success');
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            COMPONENTS.notification(err.message, 'error');
        }
    },

    payNow: async function(id) {
        try {
            const res = await fetch(`${API_BASE}/enrollments/${id}/pay`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${this.state.token}` }
            });
            const data = await res.json();
            if (data.success) {
                COMPONENTS.notification('Payment successful!', 'success');
                this.renderEnrollments();
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            COMPONENTS.notification(err.message, 'error');
        }
    },

    cancelEnrollment: async function(id) {
        if (!confirm('Are you sure you want to cancel this enrollment?')) return;
        try {
            const res = await fetch(`${API_BASE}/enrollments/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.state.token}` }
            });
            const data = await res.json();
            if (data.success) {
                COMPONENTS.notification('Enrollment cancelled', 'info');
                this.renderEnrollments();
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            COMPONENTS.notification(err.message, 'error');
        }
    }
};

window.app = app;
app.init();
