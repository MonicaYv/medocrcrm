$(document).on('click', '.preview-btn', function(e) {
    e.preventDefault();
    e.stopPropagation();

    var postId = $(this).data('post-id');
    $.ajax({
        url: '/posts/' + postId + '/detail/',
        type: 'GET',
        success: function(data) {
            $('#preview-header').text(data.header);
            $('#preview-description').text(data.description);
            $('#preview-tags').text(data.tags);
            $('#preview-post-type').text(data.post_type);
            $('#preview-donation-frequency').text(data.donation_frequency);
            $('#preview-target-donation').text(data.target_donation);
            $('#preview-country').text(data.country);
            $('#preview-state').text(data.state);
            $('#preview-city').text(data.city);
            $('#preview-pincode').text(data.pincode);
            $('#preview-age-group').text(data.age_group);
            $('#preview-gender').text(data.gender);
            $('#preview-date-time').text(data.date_time || '-');
            $('#preview-views').text(data.views || '-');
            $('#preview-donation-received').text(data.donation_received || '-');
            $('#preview-status').text(data.status || '-');
            $('#preview-spending-power').text(data.spending_power);
            $('#preview-start-date').text(data.start_date);
            $('#preview-end-date').text(data.end_date);
            $('#preview-post-reference-id').text(data.post_reference_id || '-');
            $('#preview-uploaded-by').text(data.uploaded_by || '-');

            if (data.creative1) {
                $('#preview-creative1').attr('src', data.creative1).show();
            } else {
                $('#preview-creative1').hide();
            }
            if (data.creative2) {
                $('#preview-creative2').attr('src', data.creative2).show();
            } else {
                $('#preview-creative2').hide();
            }

            var $tbody = $('#preview-donation-table tbody');
            $tbody.empty();
            if (data.donations && data.donations.length > 0) {
                data.donations.forEach(function(donation) {
                    $tbody.append(
                        '<tr>' +
                            '<td class="px-4 py-2.5 text-center">' + donation.payment_date + '</td>' +
                            '<td class="px-4 py-2.5 text-center">' + donation.name + '</td>' +
                            '<td class="px-4 py-2.5 text-center">' + donation.city + '</td>' +
                            '<td class="px-4 py-2.5 text-center">₹' + donation.amount + '</td>' +
                        '</tr>'
                    );
                });
            } else {
                $tbody.append('<tr><td colspan="4" class="text-center py-4">No donations yet.</td></tr>');
            }

            $('.preview-popup').removeClass('hidden').addClass('flex');
        },
        error: function() {
            toastr.error('Could not load post details.');
        }
    });
});

$(document).on('click', '.close-popup', function() {
    $(this).closest('.popup').addClass('hidden').removeClass('flex');
});

$(document).on('click', function(e) {
    if (!$(e.target).closest('.preview-popup, .download-popup, [data-popup]').length) {
        $('.preview-popup, .download-popup').addClass('hidden').removeClass('flex');
    }
});
