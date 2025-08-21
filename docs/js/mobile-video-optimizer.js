/**
 * Mobile Video Optimizer
 * Optimizes video behavior for mobile devices
 */

(function() {
    'use strict';
    
    // Device detection
    const isMobile = {
        Android: function() {
            return navigator.userAgent.match(/Android/i);
        },
        BlackBerry: function() {
            return navigator.userAgent.match(/BlackBerry/i);
        },
        iOS: function() {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i);
        },
        Opera: function() {
            return navigator.userAgent.match(/Opera Mini/i);
        },
        Windows: function() {
            return navigator.userAgent.match(/IEMobile/i);
        },
        any: function() {
            return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
        }
    };
    
    // Check if device supports video autoplay
    function supportsVideoAutoplay() {
        const video = document.createElement('video');
        video.setAttribute('autoplay', '');
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        
        // Check if autoplay is supported
        const canAutoplay = video.autoplay !== undefined;
        
        // Clean up
        video.remove();
        
        return canAutoplay;
    }
    
    // Check if device is on a slow connection
    function isSlowConnection() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            return connection.effectiveType === 'slow-2g' || 
                   connection.effectiveType === '2g' || 
                   connection.effectiveType === '3g';
        }
        return false;
    }
    
    // Optimize videos for mobile
    function optimizeVideosForMobile() {
        const videos = document.querySelectorAll('.video-background');
        
        videos.forEach(function(video, index) {
            // Add mobile-specific attributes
            video.setAttribute('playsinline', '');
            video.setAttribute('webkit-playsinline', '');
            video.setAttribute('x5-playsinline', '');
            
            // For iOS devices, add specific attributes
            if (isMobile.iOS()) {
                video.setAttribute('webkit-playsinline', 'true');
                video.setAttribute('playsinline', 'true');
                video.setAttribute('x5-video-player-type', 'h5');
                video.setAttribute('x5-video-player-fullscreen', 'false');
            }
            
            // For Android devices
            if (isMobile.Android()) {
                video.setAttribute('x5-video-player-type', 'h5');
                video.setAttribute('x5-video-player-fullscreen', 'false');
            }
            
            // Keep autoplay enabled for all devices
            // No need to add play button overlay
            
            // Optimize video loading
            video.preload = 'metadata';
            
            // Add error handling
            video.addEventListener('error', function(e) {
                console.warn('Video error:', e);
                showVideoFallback(video, index);
            });
            
            // Add load event
            video.addEventListener('loadeddata', function() {
                console.log('Video loaded successfully');
            });
        });
    }
    
    // Play button overlay function removed - videos will autoplay normally
    // function addPlayButtonOverlay(video, index) { ... }
    
    // Play video function removed - not needed anymore
    // function playVideo(video, playButton) { ... }
    
    // Show video fallback
    function showVideoFallback(video, index) {
        const videoContainer = video.closest('.item');
        if (!videoContainer) return;
        
        // Hide video
        video.style.display = 'none';
        
        // Show fallback image
        const fallbackImg = videoContainer.querySelector('img[alt="Video fallback"]');
        if (fallbackImg) {
            fallbackImg.style.display = 'block';
            fallbackImg.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                object-position: center;
                z-index: 1;
            `;
        }
        
        // Remove play button if exists
        const playButton = videoContainer.querySelector('.mobile-play-button');
        if (playButton) {
            playButton.remove();
        }
    }
    
    // Optimize carousel for mobile
    function optimizeCarouselForMobile() {
        const carousel = document.querySelector('.video-carousel');
        if (!carousel) return;
        
        if (isMobile.any()) {
            // Disable carousel auto-cycling on mobile to save battery
            const carouselInstance = $(carousel).data('bs.carousel');
            if (carouselInstance) {
                carouselInstance.pause();
            }
            
            // Add touch swipe support
            addTouchSwipeSupport(carousel);
        }
    }
    
    // Add touch swipe support for mobile
    function addTouchSwipeSupport(carousel) {
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;
        
        carousel.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, false);
        
        carousel.addEventListener('touchend', function(e) {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            
            handleSwipe();
        }, false);
        
        function handleSwipe() {
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            // Check if it's a horizontal swipe
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // Swipe left - next slide
                    $(carousel).carousel('next');
                } else {
                    // Swipe right - previous slide
                    $(carousel).carousel('prev');
                }
            }
        }
    }
    
    // Performance monitoring
    function monitorPerformance() {
        if ('performance' in window) {
            window.addEventListener('load', function() {
                setTimeout(function() {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData) {
                        console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
                    }
                }, 0);
            });
        }
    }
    
    // Initialize when DOM is ready
    function init() {
        // Wait for jQuery and Bootstrap to be available
        if (typeof $ !== 'undefined' && typeof $.fn.carousel !== 'undefined') {
            optimizeVideosForMobile();
            optimizeCarouselForMobile();
            monitorPerformance();
        } else {
            // Retry after a short delay
            setTimeout(init, 100);
        }
    }
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export functions for global access
    window.MobileVideoOptimizer = {
        optimizeVideos: optimizeVideosForMobile,
        optimizeCarousel: optimizeCarouselForMobile,
        isMobile: isMobile.any()
    };
    
})();
