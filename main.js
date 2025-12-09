// Main JavaScript file for PVS Website
console.log('PVS Website Loaded');

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Map Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Morden/Winkler approximate center
    const mapCenter = [49.1916, -97.9409]; // Morden coordinates

    // Initialize map
    const map = L.map('service-map').setView(mapCenter, 13);

    // Use Esri World Street Map (Looks cleaner, like Google Maps)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
    }).addTo(map);

    let currentMarker = null;

    // Add Search Control (Using ArcGIS Geocoder for better accuracy)
    L.Control.geocoder({
        defaultMarkGeocode: false,
        geocoder: L.Control.Geocoder.arcgis(),
        placeholder: "Search address (e.g. 246 7th St...)"
    })
        .on('markgeocode', function (e) {
            handleLocationSelect(e.geocode.center);
        })
        .addTo(map);

    // Helper to handle both search results and manual clicks
    function handleLocationSelect(latlng) {
        const { lat, lng } = latlng;

        // Remove existing marker if any
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }

        // Add user's marker
        currentMarker = L.marker([lat, lng]).addTo(map);

        // Open popup
        currentMarker.bindPopup(createPopupContent(lat, lng)).openPopup();
    }

    // Helper to create popup content
    function createPopupContent(lat, lng) {
        return `
            <div id="popup-form-container">
                <h4>Check Coverage</h4>
                <p style="font-size:0.9rem; margin-bottom:0.5rem;">Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
                <input type="email" id="map-email" class="map-form-input" placeholder="Enter your email" required>
                <!-- Button has ID for listener attachment -->
                <button id="btn-check-coverage" data-lat="${lat}" data-lng="${lng}" class="btn btn-primary btn-small">Check Availability</button>
            </div>
        `;
    }

    // Map Click Handler (for manual pin drops)
    map.on('click', function (e) {
        handleLocationSelect(e.latlng);
    });

    // Dynamic Event Listener for Popup Button
    // This is safer than inline onclick="" which can be blocked by CSP
    map.on('popupopen', function () {
        const btn = document.getElementById('btn-check-coverage');
        if (btn) {
            btn.addEventListener('click', function () {
                const lat = this.getAttribute('data-lat');
                const lng = this.getAttribute('data-lng');
                submitLocation(lat, lng);
            });
        }
    });
});

// Logic to send data to Formspree
function submitLocation(lat, lng) {
    const emailInput = document.getElementById('map-email');
    const email = emailInput.value;
    const btn = document.getElementById('btn-check-coverage');

    if (!email || !email.includes('@')) {
        alert('Please enter a valid email address.');
        return;
    }

    // Visual feedback
    const originalText = btn.innerText;
    btn.innerText = 'Sending...';
    btn.disabled = true;

    console.log('Attempting delivery to Formspree...');

    // Send to Formspree
    fetch("https://formspree.io/f/xeoyzyad", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            email: email,
            coordinates: `${lat}, ${lng}`,
            message: `New coverage inquiry for PVS at ${lat}, ${lng}`
        })
    })
        .then(response => {
            if (response.ok) {
                // Show Custom Success Modal
                showModal();
                emailInput.value = ''; // Clear input
                btn.innerText = 'Sent!';
            } else {
                console.error('Formspree returned error:', response);
                alert("Oops! There was a problem submitting your form. Please try again or email us directly at info@pvsnow.ca");
                btn.innerText = originalText;
                btn.disabled = false;
            }
        })
        .catch(error => {
            console.error('Network Error:', error);
            alert("Oops! There was a problem submitting your form. Please try again or email us directly at info@pvsnow.ca");
            btn.innerText = originalText;
            btn.disabled = false;
        });
}

// Modal Helpers
function showModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        // Ensure display:flex is applied before opacity transition
        modal.style.display = 'flex';
        // Small timeout to allow transition to trigger
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }
}

window.closeModal = function () {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300); // Wait for transition
    }
};
