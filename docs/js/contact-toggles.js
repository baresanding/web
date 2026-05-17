// Temporary contact toggles. Set either value to true to re-enable that WhatsApp contact everywhere.
const SHOW_LUCAS_WHATSAPP = false;
const SHOW_LAUTARO_QUARIN_WHATSAPP = false;

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.js-lucas-whatsapp-toggle').forEach(function(element) {
        setContactVisibility(element, SHOW_LUCAS_WHATSAPP);
    });

    document.querySelectorAll('.js-lautaro-quarin-whatsapp-toggle').forEach(function(element) {
        setContactVisibility(element, SHOW_LAUTARO_QUARIN_WHATSAPP);
    });
});

function setContactVisibility(element, isVisible) {
    element.hidden = !isVisible;
    element.style.display = isVisible
        ? element.getAttribute('data-enabled-display')
        : 'none';
}
