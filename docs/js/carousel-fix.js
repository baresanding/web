/**
 * Carousel Fix - Prevents carousel from pausing on hover
 * This script runs after all other scripts to ensure it takes precedence
 */

(function() {
    'use strict';
    
    // Wait for DOM and Bootstrap to be ready
    function fixCarousel() {
        var $carousel = $('#carousel-example-generic');
        
        if ($carousel.length === 0) {
            console.log('Carousel not found, retrying...');
            setTimeout(fixCarousel, 100);
            return;
        }
        
        console.log('Fixing carousel behavior...');
        
        // Destroy existing instance if any
        if ($carousel.data('bs.carousel')) {
            console.log('Destroying existing carousel instance...');
            $carousel.carousel('destroy');
        }
        
        // Initialize with our settings
        $carousel.carousel({
            interval: 4500,
            pause: false,
            wrap: true,
            keyboard: false
        });
        
        // Force start
        $carousel.carousel('cycle');
        
        // Prevent pause events
        $carousel.off('pause.bs.carousel').on('pause.bs.carousel', function(e) {
            console.log('Pause event prevented');
            e.preventDefault();
            e.stopPropagation();
            $(this).carousel('cycle');
            return false;
        });
        
        // Prevent mouse events
        $carousel.off('mouseenter mouseleave').on('mouseenter mouseleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
        
        // Override Bootstrap's internal pause method
        if ($carousel.data('bs.carousel')) {
            var carouselInstance = $carousel.data('bs.carousel');
            var originalPause = carouselInstance.pause;
            
            carouselInstance.pause = function(e) {
                console.log('Pause method overridden');
                if (e && e.type === 'mouseenter') {
                    return this; // Don't pause on mouseenter
                }
                return originalPause.call(this, e);
            };
        }
        
        console.log('Carousel fix applied successfully');
        console.log('Pause setting:', $carousel.data('bs.carousel').options.pause);
        
        // Monitor carousel status
        setInterval(function() {
            if (!$carousel.data('bs.carousel').interval) {
                console.log('Carousel stopped, restarting...');
                $carousel.carousel('cycle');
            }
        }, 1000);
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixCarousel);
    } else {
        fixCarousel();
    }
    
    // Also run after a delay to ensure Bootstrap is loaded
    setTimeout(fixCarousel, 1000);
    
    // Run after window load
    window.addEventListener('load', fixCarousel);
    
})();
