$(document).ready(function () {
    $('.tab-btn-adv').click(function () {
        var target = $(this).data('tab');

        $('.tab-btn-adv').removeClass('active-tab-adv');
        $(this).addClass('active-tab-adv');

        $('.tab-content').addClass('hidden');
        $('.' + target).removeClass('hidden');
    });
})