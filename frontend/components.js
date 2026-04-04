// Premium Design System for E-commerce App
const COMPONENTS = {
    starRating: (rating) => {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5 ? 1 : 0;
        const emptyStars = 5 - fullStars - halfStar;
        return `
            <div class="star-rating">
                ${'<i class="fas fa-star"></i>'.repeat(fullStars)}
                ${halfStar ? '<i class="fas fa-star-half-alt"></i>' : ''}
                ${'<i class="far fa-star"></i>'.repeat(emptyStars)}
            </div>
        `;
    },
    
    loader: () => `
        <div class="loader-container">
            <div class="loader"></div>
        </div>
    `,
    
    notification: (message, type = 'success') => {
        const id = 'notif-' + Date.now();
        const html = `
            <div id="${id}" class="notification ${type} slide-in">
                <p>${message}</p>
            </div>
        `;
        document.getElementById('notification-container').insertAdjacentHTML('beforeend', html);
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('fade-out');
                setTimeout(() => el.remove(), 500);
            }
        }, 3000);
    },

    courseCard: (course) => `
        <div class="course-card" data-id="${course._id}">
            <div class="course-image">
                <img src="${course.images[0].startsWith('http') ? course.images[0] : 'http://localhost:3000' + course.images[0]}" alt="${course.courseName}">
                <button class="enroll-btn" onclick="app.enrollInCourse('${course._id}')">
                    <i class="fas fa-graduation-cap"></i>
                </button>
            </div>
            <div class="course-info">
                <span class="course-subject">${course.subject?.name || 'General'}</span>
                <h3 class="course-title" onclick="app.navigateTo('/course/${course._id}')">${course.courseName}</h3>
                <div class="course-meta">
                    <span class="course-price">${course.price.toLocaleString()} VND</span>
                    ${course.instructor ? `<span class="course-instructor"><i class="fas fa-chalkboard-teacher"></i> ${course.instructor}</span>` : ''}
                </div>
            </div>
        </div>
    `
};

export default COMPONENTS;
