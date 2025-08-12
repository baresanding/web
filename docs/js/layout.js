var Layout = function () {
    'use strict';
    
    // handle on page scroll
    var handleHeaderOnScroll = function() {
        if ($(window).scrollTop() > 60) {
            $('body').addClass('page-on-scroll');
        } else {
            $('body').removeClass('page-on-scroll');
        }
    }   

    // handle carousel
    var handleCarousel = function() {
        var $item = $('.carousel .item'); 
        var $wHeight = $(window).height();
        $item.eq(0).addClass('active');
        $item.height($wHeight); 
        $item.addClass('full-screen');

        // configurate carousel interval
        // pause: false - prevents carousel from pausing on hover
        // wrap: true - enables infinite loop
        // keyboard: false - disables keyboard navigation to prevent interference
        
        // First, destroy any existing carousel instance
        var $carousel = $('#carousel-example-generic');
        if ($carousel.data('bs.carousel')) {
            $carousel.carousel('destroy');
        }
        
        // Then initialize with our custom settings
        $carousel.carousel({
            interval: 4500,
            pause: false,
            wrap: true,
            keyboard: false
        });
        
        // Force start the carousel
        $carousel.carousel('cycle');
        
        // Carrousel transition
        $.fn.carousel.Constructor.TRANSITION_DURATION = 500;

        // Handle video carousel
        if ($('.video-carousel').length > 0) {
            // Pause all videos initially
            $('.video-background').each(function() {
                this.pause();
            });
            
            // Play video in active slide
            var activeVideo = $('.carousel .item.active .video-background')[0];
            if (activeVideo) {
                activeVideo.play();
            }
            
            // Handle slide change events
            $('#carousel-example-generic').on('slide.bs.carousel', function (e) {
                // Pause current video
                $('.carousel .item.active .video-background')[0].pause();
            });
            
            $('#carousel-example-generic').on('slid.bs.carousel', function (e) {
                // Play new active video
                var newActiveVideo = $('.carousel .item.active .video-background')[0];
                if (newActiveVideo) {
                    newActiveVideo.play();
                }
            });
            
            // Ensure carousel continues running and doesn't stop
            // Force restart if carousel stops
            setInterval(function() {
                var $carousel = $('#carousel-example-generic');
                if (!$carousel.data('bs.carousel').interval) {
                    $carousel.carousel('cycle');
                }
            }, 1000);
            
            // Prevent mouse events from interfering with carousel
            // Disable hover pause behavior completely
            $('#carousel-example-generic').off('mouseenter mouseleave');
            
            // Force carousel to continue cycling
            $('#carousel-example-generic').on('mouseenter mouseleave', function(e) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            });
            
            // Additional safety: prevent any pause events
            $('#carousel-example-generic').on('pause.bs.carousel', function(e) {
                console.log('Carousel pause prevented');
                e.preventDefault();
                e.stopPropagation();
                // Force continue cycling
                $(this).carousel('cycle');
                return false;
            });
            
            // Log carousel status for debugging
            console.log('Video carousel initialized with pause: false');
            console.log('Carousel interval:', $carousel.data('bs.carousel').options.interval);
            console.log('Carousel pause setting:', $carousel.data('bs.carousel').options.pause);
        } else {
            // Original image carousel logic
            $('.carousel img').each(function() {
                var $src = $(this).attr('src');
                var $color = $(this).attr('data-color');
                $(this).parent().css({
                    'background-image' : 'url(' + $src + ')',
                    'background-color' : $color
                });
                $(this).remove();
            });
        }

        $(window).on('resize', function (){
            $wHeight = $(window).height();
            $item.height($wHeight);
        });
    }

    // handle group element heights
    var handleHeight = function() {
       $('[data-auto-height]').each(function() {
            var parent = $(this);
            var items = $('[data-height]', parent);
            var height = 0;
            var mode = parent.attr('data-mode');
            var offset = parseInt(parent.attr('data-offset') ? parent.attr('data-offset') : 0);

            items.each(function() {
                if ($(this).attr('data-height') == "height") {
                    $(this).css('height', '');
                } else {
                    $(this).css('min-height', '');
                }

                var height_ = (mode == 'base-height' ? $(this).outerHeight() : $(this).outerHeight(true));
                if (height_ > height) {
                    height = height_;
                }
            });

            height = height + offset;

            items.each(function() {
                if ($(this).attr('data-height') == "height") {
                    $(this).css('height', height);
                } else {
                    $(this).css('min-height', height);
                }
            });

            if(parent.attr('data-related')) {
                $(parent.attr('data-related')).css('height', parent.height());
            }
       });
    }

    return {
        init: function () {
            handleHeaderOnScroll(); // initial setup for fixed header
            handleCarousel(); // initial setup for carousel
            handleHeight(); // initial setup for group element height

            // handle minimized header on page scroll
            $(window).scroll(function() {
                handleHeaderOnScroll();
            });
            
            // Additional carousel safety check after page load
            setTimeout(function() {
                var $carousel = $('#carousel-example-generic');
                if ($carousel.length > 0 && $carousel.hasClass('video-carousel')) {
                    console.log('Post-load carousel check');
                    
                    // Force carousel to continue if it stopped
                    if (!$carousel.data('bs.carousel').interval) {
                        console.log('Carousel stopped, restarting...');
                        $carousel.carousel('cycle');
                    }
                    
                    // Ensure pause is disabled
                    if ($carousel.data('bs.carousel').options.pause !== false) {
                        console.log('Forcing pause: false');
                        $carousel.carousel('destroy');
                        $carousel.carousel({
                            interval: 4500,
                            pause: false,
                            wrap: true,
                            keyboard: false
                        });
                        $carousel.carousel('cycle');
                    }
                }
            }, 2000); // Check after 2 seconds
        }
    };
}();

$(document).ready(function() {
    Layout.init();
});