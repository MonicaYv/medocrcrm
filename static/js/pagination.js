$(document).ready(function () {
  const rowsPerPage = 5;

  function initPagination(tabContent) {
    const table = tabContent.find('.docTable');
    const rows = table.find('tbody tr');

    if (rows.length === 0) {
      tabContent.find('.pagination-wrapper').hide();
      return;
    }

    // Avoid initializing multiple times
    if (tabContent.data('pagination-initialized')) return;
    tabContent.data('pagination-initialized', true);

    // Create pagination buttons container if not present
    let paginationContainer = tabContent.find('.pagination-wrapper');
    if (!paginationContainer.length) {
      paginationContainer = $(`
        <div class="pagination-wrapper flex gap-2 mt-2 justify-center">
          <button class="prevPage bg-white px-3 py-1 rounded text-dark-gray text-sm">Previous</button>
          <div class="paginationBtns flex gap-4"></div>
          <button class="nextPage bg-white px-3 py-1 rounded text-dark-gray text-sm">Next</button>
        </div>
      `);
      tabContent.append(paginationContainer);
    }

    const paginationBtns = paginationContainer.find('.paginationBtns');
    const prevBtn = paginationContainer.find('.prevPage');
    const nextBtn = paginationContainer.find('.nextPage');
    const totalPages = Math.ceil(rows.length / rowsPerPage);
    let currentPage = 1;

    function renderPaginationButtons() {
      paginationBtns.empty();
      for (let i = 1; i <= totalPages; i++) {
        const btn = $(`<button class="page-btn px-3 py-1.5 rounded-lg text-sm ${i === currentPage ? 'bg-light-sea-green text-white' : 'bg-pagination'}">${i}</button>`);
        btn.data('page', i);
        paginationBtns.append(btn);
      }
    }

    function showPage(page) {
      currentPage = page;
      rows.hide();
      const start = (page - 1) * rowsPerPage;
      rows.slice(start, start + rowsPerPage).show();
      renderPaginationButtons();
    }

    paginationBtns.on('click', '.page-btn', function () {
      const selectedPage = $(this).data('page');
      showPage(selectedPage);
    });

    prevBtn.on('click', function () {
      if (currentPage > 1) {
        showPage(currentPage - 1);
      }
    });

    nextBtn.on('click', function () {
      if (currentPage < totalPages) {
        showPage(currentPage + 1);
      }
    });

    showPage(1);
  }

  // Initialize pagination for all tabs at load
  $('.tab-content').each(function () {
    initPagination($(this));
  });

  // Handle tab switching
  $('.tab-button').on('click', function () {
    const tabId = $(this).data('tab');
    $('.tab-content').addClass('hidden');
    $('#' + tabId).removeClass('hidden');
  });
});
