$(document).ready(function () {
    // Edit icon
    $(".editIcon").on("click", function () {
      $(".edit-details").removeClass("hidden");
      $(".account-detail").hide();
      $(".tabs").hide();
      $(".editIcon").hide();
    });
  
    // Cancel button
    $(".cancel-btn").on("click", function (e) {
      e.preventDefault();
      $(".edit-details").addClass("hidden");
      $(".account-detail").show();
      $(".tabs").show();
      $('.editIcon').show();
    });
    // Tab handling
    function handleTabSwitch(tabTarget) {
      $(".tab-content").addClass("hidden");
      $(".tab-btn").removeClass("border-b-2 text-primary-color");
      $("#" + tabTarget).removeClass("hidden");
      $('.tab-btn[data-tab="' + tabTarget + '"]').addClass("border-b-2 text-primary-color");
  
      if (tabTarget === "my-account") {
        $(".edit-toggle").removeClass("hidden");
      } else {
        $(".edit-toggle").addClass("hidden");
      }
    }
  
    $(".tab-btn").on("click", function () {
      const tabTarget = $(this).data("tab");
      handleTabSwitch(tabTarget);
    });
  
    handleTabSwitch("my-account");


    $('#addIssuebtn').on('click', function () {
        const issueText = $('#issueInput').val().trim();
        if (issueText === '') return;
  
        const issueHTML = `
          <div class="relative">
            <input type="text" value="${issueText}" class="p-4 w-full rounded-md font-semibold text-base border-slate-gray border-2">
            <div class="absolute top-3 right-6 flex gap-4 items-center">
              <span class="material-symbols-outlined cursor-pointer">edit</span>
              <span class="material-symbols-outlined text-vibrant-red cursor-pointer delete-btn">delete</span>
            </div>
          </div>
        `;
  
        $('#issuesContainer').append(issueHTML);
        $('#issueInput').val(''); // clear input
      });
     
      $('#issuesContainer').on('click', '.delete-btn', function () {
        $(this).closest('div.relative').remove();
      });

      $('#togglePassword').on('click', function () {
        const passwordField = $('#Password');
        const type = passwordField.attr('type') === 'password' ? 'text' : 'password';
        passwordField.attr('type', type);
  
        // Toggle icon
        $(this).text(type === 'password' ? 'visibility' : 'visibility_off');
      });
      
  });
  