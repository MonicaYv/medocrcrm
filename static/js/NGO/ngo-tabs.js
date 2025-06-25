$(document).ready(function () {
    $('.tab-btn-ngo').click(function () {
        var target = $(this).data('tab');

        $('.tab-btn-ngo').removeClass('active-tab-ngo');
        $(this).addClass('active-tab-ngo');

        $('.tab-content').addClass('hidden');
        $('.' + target).removeClass('hidden');
    });
})