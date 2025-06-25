
  // Initialize toaster container if it doesn't exist in the body
  if ($('#toaster-container').length === 0) {
    $('body').append('<div id="toaster-container" class="fixed top-0 right-0 z-50 p-4 space-y-4"></div>');
  }

  // Function to display toaster (success or error type)
  function showToaster(type, message) {
    // Generate a unique id for each toaster
    const toasterId = 'toaster-' + Date.now();

    // Define success and error toaster styles
    const toasterClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    };

    // Define icons based on toaster type
    const toasterIcons = {
    success: 'task_alt',
    error: 'error',              
    };

    // Create toaster element
    const toaster = `
        <div id="${toasterId}" class="toast ${toasterClasses[type]} text-white p-4 rounded-lg shadow-lg flex items-center space-x-4 max-w-xs">
            <span class="material-symbols-outlined">${toasterIcons[type]}</span>
            <span class="flex-1">${message}</span>
            <button class="close-toast text-white" data-id="${toasterId}">&times;</button>
        </div>
    `;

    // Append the toaster to the container
    $('#toaster-container').append(toaster);

    // Auto-hide the toaster after 50 miliseconds
    setTimeout(function() {
      $('#' + toasterId).fadeOut(50, function() {
        $(this).remove();
      });
    }, 5000);

    // Close the toaster when the close button is clicked
    $('.close-toast').on('click', function() {
      const id = $(this).data('id');
      $('#' + id).fadeOut(500, function() {
        $(this).remove();
      });
    });
  }

  // Expose the showToaster function globally for use in other scripts
  window.showToaster = showToaster;