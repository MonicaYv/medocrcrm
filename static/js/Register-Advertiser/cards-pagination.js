$(document).ready(function () {
    const itemsPerPage = 6;

    $('.pagination-section').each(function () {
        const $section = $(this);
        const $cards = $section.find('.places-container .places-card , .medicines-container .medicines-card');
        const $pagination = $section.find('.pagination-controls');
        const totalPages = Math.ceil($cards.length / itemsPerPage);
        let currentPage = 1;

        function renderPagination() {
            $pagination.empty();

            // Previous Button
            $pagination.append(`
                <button class="prev-btn bg-white px-3 py-1 rounded text-light-gray1 text-sm" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
            `);

            // Page Numbers
            for (let i = 1; i <= totalPages; i++) {
                $pagination.append(`
                    <button class="page-btn px-3 py-1.5 rounded-lg text-sm ${i === currentPage ? 'bg-living-coral text-white' : 'bg-pagination'}" data-page="${i}">
                        ${i}
                    </button>
                `);
            }

            // Next Button
            $pagination.append(`
                <button class="next-btn bg-white px-3 py-1 rounded text-light-gray1 text-sm" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
            `);
        }

        function showPage(page) {
            currentPage = page;
            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            $cards.hide().slice(start, end).show();

            renderPagination();
        }

        // Pagination click handler
        $pagination.on('click', 'button', function () {
            const $btn = $(this);

            if ($btn.hasClass('prev-btn') && currentPage > 1) {
                showPage(currentPage - 1);
            } else if ($btn.hasClass('next-btn') && currentPage < totalPages) {
                showPage(currentPage + 1);
            } else if ($btn.hasClass('page-btn')) {
                const page = parseInt($btn.data('page'));
                showPage(page);
            }
        });

        // Initialize
        showPage(1);
    });
});
